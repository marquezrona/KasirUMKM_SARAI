import os
import unittest
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

from backend import server


class GoogleAdminLoginTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.original_database = server.db
        engine = create_engine(
            "sqlite+pysqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        server.db = server.Database(engine)
        await server.db.create_schema()
        await server.db.users.insert({
            "id": "google-admin-test",
            "email": "admin@example.com",
            "password_hash": server.hash_password("password-admin-123"),
            "name": "Google Admin",
            "role": "admin",
            "umkm_id": None,
            "created_at": server.now_iso(),
        })
        await server.db.users.insert({
            "id": "google-umkm-test",
            "email": "umkm@example.com",
            "password_hash": server.hash_password("password-umkm-123"),
            "name": "Google UMKM",
            "role": "umkm",
            "umkm_id": "umkm-test",
            "created_at": server.now_iso(),
        })

    async def asyncTearDown(self):
        await server.db.dispose()
        server.db = self.original_database

    async def test_verified_registered_google_admin_can_login(self):
        with patch.dict(os.environ, {"GOOGLE_CLIENT_ID": "google-client-id"}), patch.object(
            server,
            "verify_google_id_token",
            return_value={"email": "admin@example.com", "email_verified": True},
        ):
            result = await server.google_login(server.GoogleLoginIn(credential="verified-token"))

        self.assertEqual(result["user"]["role"], "admin")
        self.assertEqual(result["user"]["email"], "admin@example.com")
        self.assertTrue(result["token"])

    async def test_google_login_rejects_umkm_account(self):
        with patch.dict(os.environ, {"GOOGLE_CLIENT_ID": "google-client-id"}), patch.object(
            server,
            "verify_google_id_token",
            return_value={"email": "umkm@example.com", "email_verified": True},
        ):
            with self.assertRaises(server.HTTPException) as error:
                await server.google_login(server.GoogleLoginIn(credential="verified-token"))

        self.assertEqual(error.exception.status_code, 403)

    async def test_google_login_rejects_unverified_email(self):
        with patch.dict(os.environ, {"GOOGLE_CLIENT_ID": "google-client-id"}), patch.object(
            server,
            "verify_google_id_token",
            return_value={"email": "admin@example.com", "email_verified": False},
        ):
            with self.assertRaises(server.HTTPException) as error:
                await server.google_login(server.GoogleLoginIn(credential="unverified-token"))

        self.assertEqual(error.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()