import unittest

from sqlalchemy.dialects import mysql
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.schema import CreateTable

from backend.database import Database, metadata


class DatabaseTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        self.database = Database(self.engine)
        await self.database.create_schema()

    async def asyncTearDown(self):
        await self.database.dispose()

    async def test_crud_and_decimal_values(self):
        await self.database.umkms.insert({
            "id": "umkm-1",
            "store_name": "Toko Uji",
            "balance": 10,
            "active": True,
            "created_at": "2026-10-02T00:00:00+00:00",
        })
        self.assertTrue(await self.database.umkms.update(
            {"id": "umkm-1"}, increments={"balance": 2.5}
        ))
        row = await self.database.umkms.get_one({"id": "umkm-1"})
        self.assertEqual(row["balance"], 12.5)
        self.assertTrue(await self.database.umkms.update(
            {"id": "umkm-1"}, {"store_name": "Toko Uji"}
        ))
        self.assertEqual(await self.database.umkms.count({"active": True}), 1)

    async def test_transaction_rolls_back(self):
        with self.assertRaisesRegex(RuntimeError, "rollback probe"):
            async with self.database.transaction() as transaction:
                await transaction.audit_logs.insert({
                    "id": "audit-1",
                    "action": "test",
                    "meta": {},
                    "created_at": "2026-10-02T00:00:00+00:00",
                })
                raise RuntimeError("rollback probe")
        self.assertEqual(await self.database.audit_logs.count(), 0)



class MySQLDdlTests(unittest.TestCase):
    def test_mysql_ddl_compiles_for_all_tables(self):
        compiled = [
            str(CreateTable(table).compile(dialect=mysql.dialect()))
            for table in metadata.sorted_tables
        ]
        self.assertEqual(len(compiled), 7)
        self.assertTrue(all("CREATE TABLE" in statement for statement in compiled))


if __name__ == "__main__":
    unittest.main()