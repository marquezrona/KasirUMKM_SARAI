import os
import unittest
from unittest.mock import AsyncMock, patch

from sqlalchemy.dialects import mysql
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.schema import CreateTable

from backend import server
from backend.database import Database, metadata


class DatabaseTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_engine(
            "sqlite+pysqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
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
        self.assertEqual(len(compiled), 10)
        self.assertTrue(all("CREATE TABLE" in statement for statement in compiled))

    def test_database_from_environment_falls_back_to_sqlite(self):
        original = {name: os.environ.get(name) for name in ("DB_HOST", "DB_DATABASE", "DB_USERNAME", "DB_PORT")}
        try:
            for name in ("DB_HOST", "DB_DATABASE", "DB_USERNAME", "DB_PORT"):
                os.environ.pop(name, None)
            db = Database.from_environment()
            self.assertTrue(str(db.engine.url).startswith("sqlite+pysqlite"))
            self.addCleanup(db.engine.dispose)
        finally:
            for name, value in original.items():
                if value is None:
                    os.environ.pop(name, None)
                else:
                    os.environ[name] = value

    def test_database_url_escapes_password_special_chars(self):
        original = {name: os.environ.get(name) for name in ("DB_HOST", "DB_DATABASE", "DB_USERNAME", "DB_PASSWORD", "DB_PORT")}
        try:
            os.environ["DB_HOST"] = "127.0.0.1"
            os.environ["DB_DATABASE"] = "app_db"
            os.environ["DB_USERNAME"] = "user_name"
            os.environ["DB_PASSWORD"] = "H4wUPay@Sabu"
            os.environ["DB_PORT"] = "3306"
            url = __import__("backend.database", fromlist=["_build_database_url"])._build_database_url()
            self.assertIn("H4wUPay%40Sabu", url)
            self.assertNotIn("H4wUPay@Sabu@127.0.0.1", url)
        finally:
            for name, value in original.items():
                if value is None:
                    os.environ.pop(name, None)
                else:
                    os.environ[name] = value


class DatabaseStartupTests(unittest.IsolatedAsyncioTestCase):
    async def test_startup_does_not_switch_database_when_configured_database_fails(self):
        original_database = server.db
        original_backup_task = server.database_backup_task
        unavailable_database = type("UnavailableDatabase", (), {})()
        unavailable_database.check_connection = AsyncMock(
            side_effect=ConnectionError("database unavailable")
        )
        unavailable_database.dispose = AsyncMock()

        try:
            with patch.object(
                server.Database, "from_environment", return_value=unavailable_database
            ):
                with self.assertRaisesRegex(
                    RuntimeError, "Database connection or schema initialization failed"
                ):
                    await server.startup()

            unavailable_database.dispose.assert_awaited_once()
            self.assertIsNone(server.db)
        finally:
            server.db = original_database
            server.database_backup_task = original_backup_task


if __name__ == "__main__":
    unittest.main()