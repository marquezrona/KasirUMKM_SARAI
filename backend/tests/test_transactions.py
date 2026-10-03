import unittest
import uuid

from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

from backend import server


class TransactionSettlementTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.original_database = server.db
        engine = create_engine(
            "sqlite+pysqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        server.db = server.Database(engine)
        await server.db.create_schema()
        await server.db.umkms.insert({
            "id": "split-test-umkm",
            "store_name": "Toko Split Test",
            "balance": 0,
            "active": True,
            "created_at": server.now_iso(),
        })
        await server.db.products.insert({
            "id": "split-test-product",
            "umkm_id": "split-test-umkm",
            "name": "Produk Tes",
            "price": 100.01,
            "stock": 5,
            "created_at": server.now_iso(),
        })
        await server.db.settlement_config.insert({
            "id": "default",
            "umkm_pct": 90,
            "pemkab_pct": 8,
            "admin_pct": 2,
        })
        self.user = {"id": "split-test-cashier", "role": "umkm", "umkm_id": "split-test-umkm"}
        client_txn_id = str(uuid.uuid4())
        device_id = "test-device"
        nonce = str(uuid.uuid4())
        total = 100.01
        self.body = server.TransactionIn(
            client_txn_id=client_txn_id,
            items=[server.CartItemIn(
                product_id="split-test-product",
                name="Produk Tes",
                price=total,
                qty=1,
            )],
            subtotal=total,
            discount=0,
            total=total,
            payment_method="QRIS",
            device_id=device_id,
            signature=server.sign_transaction(f"{client_txn_id}|{total}|{device_id}|{nonce}"),
            nonce=nonce,
            created_at_client=server.now_iso(),
        )

    async def asyncTearDown(self):
        await server.db.dispose()
        server.db = self.original_database

    async def test_paid_transaction_allocates_all_shares_atomically_and_once(self):
        result = await server.create_transaction(self.body, self.user)
        allocations = await server.db.settlement_allocations.get_many(
            {"transaction_id": result["transaction"]["id"]}
        )
        shares = {allocation["recipient_type"]: allocation["amount"] for allocation in allocations}

        self.assertEqual(shares, {"UMKM": 90.01, "PEMDA": 8.0, "ADMIN": 2.0})
        self.assertAlmostEqual(sum(shares.values()), self.body.total)
        self.assertTrue(all(
            allocation["status"] == "PENDING_ACCOUNT_VERIFICATION"
            for allocation in allocations
        ))
        umkm = await server.db.umkms.get_one({"id": "split-test-umkm"})
        self.assertEqual(umkm["balance"], 90.01)

        duplicate = await server.create_transaction(self.body, self.user)
        self.assertTrue(duplicate["duplicate"])
        self.assertEqual(await server.db.settlement_allocations.count(), 3)
        updated_umkm = await server.db.umkms.get_one({"id": "split-test-umkm"})
        self.assertEqual(updated_umkm["balance"], 90.01)

        settlement = await server.get_settlement({"id": "split-test-admin"})
        self.assertEqual(settlement["umkm_share"], 90.01)
        self.assertEqual(settlement["pemkab_share"], 8.0)
        self.assertEqual(settlement["admin_share"], 2.0)
        self.assertEqual(settlement["pending_allocation_total"], 100.01)
        self.assertEqual(settlement["unallocated_transactions"], 0)


if __name__ == "__main__":
    unittest.main()