import os
import re
import unittest
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

from backend import server


class PasswordResetFlowTests(unittest.IsolatedAsyncioTestCase):
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
            "id": "umkm-reset-test",
            "store_name": "Toko Uji",
            "balance": 0,
            "active": True,
            "created_at": server.now_iso(),
        })
        await server.db.users.insert({
            "id": "cashier-reset-test",
            "email": "kasir@example.com",
            "password_hash": server.hash_password("password-lama"),
            "name": "Kasir Uji",
            "role": "umkm",
            "umkm_id": "umkm-reset-test",
            "created_at": server.now_iso(),
        })

    async def asyncTearDown(self):
        await server.db.dispose()
        server.db = self.original_database

    async def test_email_verification_admin_approval_and_single_use_reset(self):
        admin = {"id": "admin-reset-test", "role": "admin"}
        smtp_settings = {
            "SMTP_HOST": "smtp.example.test",
            "SMTP_PORT": "587",
            "SMTP_USERNAME": "mailer@example.test",
            "SMTP_PASSWORD": "test-password",
            "SMTP_FROM": "mailer@example.test",
            "SMTP_USE_TLS": "true",
            "SMTP_USE_SSL": "false",
            "FRONTEND_URL": "http://localhost:5173",
        }
        with patch.dict(os.environ, smtp_settings), patch.object(server, "send_email") as send_email:
            await server.request_password_reset(
                server.PasswordResetRequestIn(email="kasir@example.com")
            )
            code_body = send_email.call_args.args[2]
            code = re.search(r"\b(\d{6})\b", code_body).group(1)

            await server.verify_password_reset_email(
                server.PasswordResetVerifyIn(email="kasir@example.com", code=code)
            )
            pending = await server.list_password_reset_requests(admin)
            self.assertEqual(len(pending), 1)
            self.assertEqual(pending[0]["store_name"], "Toko Uji")

            await server.approve_password_reset(pending[0]["id"], admin)
            reset_email = send_email.call_args.args[2]
            token = re.search(r"/reset-password\?token=([^\s]+)", reset_email).group(1)
            await server.complete_password_reset(
                server.PasswordResetCompleteIn(token=token, password="password-baru-123")
            )

        account = await server.db.users.get_one({"id": "cashier-reset-test"})
        self.assertTrue(server.verify_password("password-baru-123", account["password_hash"]))
        reset_request = await server.db.password_reset_requests.get_one({"id": pending[0]["id"]})
        self.assertEqual(reset_request["status"], "COMPLETED")

        with self.assertRaisesRegex(server.HTTPException, "sudah digunakan"):
            await server.complete_password_reset(
                server.PasswordResetCompleteIn(token=token, password="password-lain-456")
            )

    async def test_admin_created_in_database_can_login_and_access_admin(self):
        await server.db.users.insert({
            "id": "direct-admin-test",
            "email": "direct-admin@example.com",
            "password_hash": server.hash_password("database-admin-123"),
            "name": "Admin Dari Database",
            "role": "admin",
            "umkm_id": None,
            "created_at": server.now_iso(),
        })

        result = await server.login(server.LoginIn(
            email="direct-admin@example.com",
            password="database-admin-123",
        ))
        dashboard = await server.admin_dashboard(result["user"])

        self.assertEqual(result["user"]["role"], "admin")
        self.assertEqual(dashboard["total_umkms"], 1)

    async def test_admin_can_create_another_admin(self):
        created = await server.create_admin_account(
            server.AdminCreateIn(
                name="Admin Tambahan",
                email="admin-baru@example.com",
                password="admin-baru-123",
            ),
            {"id": "existing-admin"},
        )
        stored = await server.db.users.get_one({"email": "admin-baru@example.com"})

        self.assertEqual(created["role"], "admin")
        self.assertEqual(stored["role"], "admin")
        self.assertTrue(server.verify_password("admin-baru-123", stored["password_hash"]))

    async def test_admin_creates_umkm_with_pending_payout_account(self):
        created = await server.create_umkm(
            server.UmkmCreateIn(
                store_name="Toko Rekening Uji",
                email="toko-rekening@example.com",
                password="kasir-uji-123",
                bank_name="DANA",
                bank_account_number="081234567890",
                bank_account_name="Pemilik DANA Uji",
            ),
            {"id": "admin-reset-test"},
        )
        accounts = await server.db.umkm_payout_accounts.get_many({"umkm_id": created["umkm_id"]})
        listed_umkms = await server.list_umkms({"id": "admin-reset-test"})
        listed_umkm = next(item for item in listed_umkms if item["id"] == created["umkm_id"])

        self.assertEqual(created["bank_verification_status"], "PENDING_VERIFICATION")
        self.assertEqual(len(accounts), 1)
        self.assertEqual(accounts[0]["bank_name"], "DANA")
        self.assertEqual(accounts[0]["account_number"], "081234567890")
        self.assertEqual(accounts[0]["verification_status"], "PENDING_VERIFICATION")
        self.assertEqual(listed_umkm["payout_account"]["masked_account_number"], "••••7890")
        self.assertNotIn("account_number", listed_umkm["payout_account"])

    async def test_admin_umkm_list_returns_latest_store_logo(self):
        logo = "data:image/webp;base64,dGVzdC1sb2dv"
        await server.db.umkms.update({"id": "umkm-reset-test"}, {"logo": logo})

        listed_umkms = await server.list_umkms({"id": "admin-reset-test"})
        listed_umkm = next(item for item in listed_umkms if item["id"] == "umkm-reset-test")

        self.assertEqual(listed_umkm["logo"], logo)


if __name__ == "__main__":
    unittest.main()