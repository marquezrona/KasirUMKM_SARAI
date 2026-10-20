import re
import unittest
import uuid
from unittest.mock import patch

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
            "address": "Jl. Uji No. 1",
            "phone": "0812345678",
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
        await server.db.customers.insert({
            "id": "split-test-customer",
            "umkm_id": "split-test-umkm",
            "name": "Pelanggan Uji",
            "nfc_card_id": "TEST-CARD-001",
            "balance": 1000,
            "created_at": server.now_iso(),
        })
        await server.db.umkms.insert({
            "id": "other-test-umkm",
            "store_name": "UMKM Lain",
            "balance": 0,
            "active": True,
            "created_at": server.now_iso(),
        })
        await server.db.customers.insert({
            "id": "other-test-customer",
            "umkm_id": "other-test-umkm",
            "name": "Pelanggan UMKM Lain",
            "nfc_card_id": "OTHER-CARD-001",
            "balance": 5000,
            "created_at": server.now_iso(),
        })
        await server.db.products.insert({
            "id": "other-test-product",
            "umkm_id": "other-test-umkm",
            "name": "Produk UMKM Lain",
            "price": 50,
            "stock": 3,
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

    async def test_nfc_transaction_deducts_the_matching_umkm_customer_once(self):
        client_txn_id = str(uuid.uuid4())
        device_id = "test-device"
        nonce = str(uuid.uuid4())
        total = 100.01
        signature = await server.sign_transaction_request(
            server.TransactionSignatureIn(
                client_txn_id=client_txn_id,
                total=total,
                device_id=device_id,
                nonce=nonce,
            ),
            self.user,
        )
        body = server.TransactionIn(
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
            payment_method="NFC",
            customer_id="split-test-customer",
            nfc_card_id="TEST-CARD-001",
            device_id=device_id,
            signature=signature["signature"],
            nonce=nonce,
            created_at_client=server.now_iso(),
        )

        result = await server.create_transaction(body, self.user)
        customer = await server.db.customers.get_one({"id": "split-test-customer"})
        other_customer = await server.db.customers.get_one({"id": "other-test-customer"})
        product = await server.db.products.get_one({"id": "split-test-product"})
        transaction = result["transaction"]

        self.assertEqual(transaction["payment_method"], "NFC")
        self.assertEqual(transaction["customer_id"], "split-test-customer")
        self.assertEqual(customer["balance"], 899.99)
        self.assertEqual(other_customer["balance"], 5000)
        self.assertEqual(product["stock"], 4)

        duplicate = await server.create_transaction(body, self.user)
        self.assertTrue(duplicate["duplicate"])
        customer = await server.db.customers.get_one({"id": "split-test-customer"})
        self.assertEqual(customer["balance"], 899.99)

        await server.db.transactions.update(
            {"id": transaction["id"]}, {"offline": True}
        )
        with patch.object(server, "print_thermal_receipt") as print_receipt:
            print_result = await server.print_transaction_receipt(transaction["id"], self.user)
            duplicate_print_result = await server.print_transaction_receipt(transaction["id"], self.user)
        self.assertEqual(print_result, {
            "ok": True,
            "already_printed": False,
            "customer_balance": 899.99,
        })
        self.assertEqual(duplicate_print_result, {"ok": True, "already_printed": True})
        print_receipt.assert_called_once()
        printed_transaction, printed_store_name, printed_address, printed_phone = print_receipt.call_args.args
        self.assertEqual(printed_transaction["id"], transaction["id"])
        self.assertEqual(printed_store_name, "Toko Split Test")
        self.assertEqual(printed_address, "Jl. Uji No. 1")
        self.assertEqual(printed_phone, "0812345678")

    async def test_registered_customer_can_pay_at_another_umkm_using_shared_balance(self):
        other_umkm_user = {
            "id": "other-test-cashier",
            "role": "umkm",
            "umkm_id": "other-test-umkm",
        }
        card = await server.customer_by_card(
            "TEST-CARD-001",
            other_umkm_user,
        )
        self.assertEqual(card["id"], "split-test-customer")
        self.assertEqual(card["balance"], 1000)

        with self.assertRaises(server.HTTPException) as duplicate_registration:
            await server.create_customer(
                server.CustomerIn(
                    name="Pelanggan Duplikat",
                    nfc_card_id="TEST-CARD-001",
                    balance=1000,
                ),
                other_umkm_user,
            )
        self.assertEqual(duplicate_registration.exception.status_code, 409)

        client_txn_id = str(uuid.uuid4())
        device_id = "other-test-device"
        nonce = str(uuid.uuid4())
        total = 50
        signature = await server.sign_transaction_request(
            server.TransactionSignatureIn(
                client_txn_id=client_txn_id,
                total=total,
                device_id=device_id,
                nonce=nonce,
            ),
            other_umkm_user,
        )
        body = server.TransactionIn(
            client_txn_id=client_txn_id,
            items=[server.CartItemIn(
                product_id="other-test-product",
                name="Produk UMKM Lain",
                price=total,
                qty=1,
            )],
            subtotal=total,
            discount=0,
            total=total,
            payment_method="NFC",
            customer_id=card["id"],
            nfc_card_id="TEST-CARD-001",
            device_id=device_id,
            signature=signature["signature"],
            nonce=nonce,
            created_at_client=server.now_iso(),
        )

        result = await server.create_transaction(
            body,
            other_umkm_user,
        )

        self.assertEqual(result["transaction"]["umkm_id"], "other-test-umkm")
        updated_customer = await server.db.customers.get_one({"id": "split-test-customer"})
        self.assertEqual(updated_customer["balance"], 950)


class ThermalReceiptFormattingTests(unittest.TestCase):
    def test_formats_receipt_for_80mm_escpos_printer(self):
        from printing import RECEIPT_WIDTH, format_thermal_receipt

        receipt = format_thermal_receipt({
            "id": "TRX-TEST-001",
            "created_at": "2026-10-19T02:00:00+00:00",
            "payment_method": "NFC",
            "items": [{"name": "Nasi Bungkus", "price": 20000, "qty": 1}],
            "subtotal": 20000,
            "discount": 0,
            "total": 20000,
            "customer_balance": 45000,
        }, "Toko Uji", "Jalan Uji", "0812345678")

        self.assertIn(b"Toko Uji", receipt)
        self.assertIn(b"HAWUPAY", receipt)
        self.assertIn(b"Alamat: Jalan Uji", receipt)
        self.assertIn(b"Telp: 0812345678", receipt)
        self.assertNotIn(b"\x1dv0\x00", receipt)
        self.assertIn(b"TRX-TEST-001", receipt)
        self.assertIn(b"Rp 20.000", receipt)
        self.assertIn(b"Sisa saldo", receipt)
        self.assertIn(b"Rp 45.000", receipt)
        self.assertIn(b"Sampai jumpa lagi!", receipt)
        self.assertIn(b"\x1dV\x01", receipt)
        self.assertNotIn(b"\n\n", receipt)
        printable_lines = [
            re.sub(rb"\x1b[@aE].|\x1d!.", b"", line)
            for line in receipt.splitlines()
        ]
        self.assertLessEqual(max(map(len, printable_lines)), RECEIPT_WIDTH)


if __name__ == "__main__":
    unittest.main()