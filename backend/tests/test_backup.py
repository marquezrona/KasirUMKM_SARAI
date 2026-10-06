import gzip
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from backend import backup


class DatabaseBackupTests(unittest.IsolatedAsyncioTestCase):
    async def test_backup_is_compressed_and_replaces_the_daily_archive(self):
        with tempfile.TemporaryDirectory() as directory:
            backup_dir = Path(directory)
            settings = {
                "DB_HOST": "127.0.0.1",
                "DB_PORT": "3306",
                "DB_DATABASE": "kasir_test",
                "DB_USERNAME": "backup_test",
                "DB_PASSWORD": "test-only-secret",
            }

            async def write_dump(*arguments, **options):
                options["stdout"].write(b"-- test database dump\n")
                process = type("CompletedProcess", (), {"returncode": 0})()
                process.communicate = AsyncMock(return_value=(None, b""))
                self.arguments = arguments
                self.environment = options["env"]
                return process

            with (
                patch.dict(os.environ, settings),
                patch.object(backup, "BACKUP_DIR", backup_dir),
                patch.object(backup, "_find_mysqldump", return_value="mysqldump-test"),
                patch.object(
                    backup.asyncio, "create_subprocess_exec", side_effect=write_dump
                ),
            ):
                destination = await backup.create_database_backup()
                second_destination = await backup.create_database_backup()

            self.assertEqual(destination, second_destination)
            self.assertEqual(len(list(backup_dir.glob("kasir_umkm_*.sql.gz"))), 1)
            with gzip.open(destination, "rb") as archive:
                self.assertEqual(archive.read(), b"-- test database dump\n")

            self.assertIn("--single-transaction", self.arguments)
            self.assertIn("kasir_test", self.arguments)
            self.assertNotIn("test-only-secret", self.arguments)
            self.assertEqual(self.environment["MYSQL_PWD"], "test-only-secret")

    async def test_failed_dump_does_not_leave_a_partial_backup(self):
        with tempfile.TemporaryDirectory() as directory:
            backup_dir = Path(directory)
            settings = {
                "DB_HOST": "127.0.0.1",
                "DB_DATABASE": "kasir_test",
                "DB_USERNAME": "backup_test",
            }

            async def fail_dump(*command, **options):
                self.assertTrue(command)
                options["stdout"].write(b"partial dump")
                process = type("FailedProcess", (), {"returncode": 1})()
                process.communicate = AsyncMock(return_value=(None, b"database unavailable"))
                return process

            with (
                patch.dict(os.environ, settings),
                patch.object(backup, "BACKUP_DIR", backup_dir),
                patch.object(backup, "_find_mysqldump", return_value="mysqldump-test"),
                patch.object(
                    backup.asyncio, "create_subprocess_exec", side_effect=fail_dump
                ),
            ):
                with self.assertRaisesRegex(RuntimeError, "mysqldump failed"):
                    await backup.create_database_backup()

            self.assertEqual(list(backup_dir.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
