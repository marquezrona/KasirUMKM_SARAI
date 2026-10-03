import os
import asyncio
from contextlib import asynccontextmanager
from contextlib import contextmanager
from decimal import Decimal
from pathlib import Path
from urllib.parse import quote
from typing import Any

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(ROOT_DIR / ".env")

from sqlalchemy import (
    Boolean,
    Column,
    Connection,
    Float,
    Index,
    Integer,
    JSON,
    MetaData,
    Numeric,
    String,
    Table,
    Text,
    UniqueConstraint,
    delete,
    func,
    insert,
    select,
    update,
)
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.engine import Engine
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine
from sqlalchemy.sql import ColumnElement


metadata = MetaData()

users = Table(
    "users",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("email", String(255), nullable=False, unique=True),
    Column("password_hash", String(255), nullable=False),
    Column("name", String(255), nullable=False),
    Column("role", String(32), nullable=False),
    Column("umkm_id", String(36)),
    Column("created_at", String(40), nullable=False),
)

umkms = Table(
    "umkms",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("store_name", String(255), nullable=False),
    Column("address", Text),
    Column("phone", String(64)),
    Column("logo", Text),
    Column("owner_user_id", String(36)),
    Column("balance", Numeric(14, 2), nullable=False, default=0),
    Column("active", Boolean, nullable=False, default=True),
    Column("created_at", String(40), nullable=False),
)

umkm_payout_accounts = Table(
    "umkm_payout_accounts",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("umkm_id", String(36), nullable=False),
    Column("bank_name", String(64), nullable=False),
    Column("account_number", String(64), nullable=False),
    Column("account_name", String(255), nullable=False),
    Column("verification_status", String(32), nullable=False),
    Column("created_at", String(40), nullable=False),
    Column("verified_at", String(40)),
    Column("verified_by", String(36)),
    Index("ix_umkm_payout_accounts_umkm", "umkm_id", "created_at"),
    Index("ix_umkm_payout_accounts_verification", "verification_status", "created_at"),
)

products = Table(
    "products",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("umkm_id", String(36), nullable=False),
    Column("name", String(255), nullable=False),
    Column("description", Text),
    Column("category", String(128)),
    Column("price", Numeric(14, 2), nullable=False, default=0),
    Column("stock", Integer, nullable=False, default=0),
    Column("image", Text),
    Column("approval_status", String(32)),
    Column("approval_note", Text),
    Column("approved_at", String(40)),
    Column("approved_by", String(36)),
    Column("created_at", String(40), nullable=False),
    Index("ix_products_umkm_id", "umkm_id"),
)

customers = Table(
    "customers",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("umkm_id", String(36), nullable=False),
    Column("name", String(255), nullable=False),
    Column("phone", String(64)),
    Column("nfc_card_id", String(255)),
    Column("balance", Numeric(14, 2), nullable=False, default=0),
    Column("created_at", String(40), nullable=False),
    Index("ix_customers_nfc_card_id", "nfc_card_id"),
    Index("ix_customers_umkm_card", "umkm_id", "nfc_card_id"),
)

transactions = Table(
    "transactions",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("client_txn_id", String(255), nullable=False),
    Column("umkm_id", String(36), nullable=False),
    Column("cashier_id", String(36)),
    Column("items", JSON, nullable=False),
    Column("subtotal", Numeric(14, 2), nullable=False),
    Column("discount", Numeric(14, 2), nullable=False, default=0),
    Column("total", Numeric(14, 2), nullable=False),
    Column("payment_method", String(32), nullable=False),
    Column("customer_id", String(36)),
    Column("nfc_card_id", String(255)),
    Column("device_id", String(255)),
    Column("signature", String(255)),
    Column("nonce", String(255)),
    Column("status", String(32), nullable=False),
    Column("offline", Boolean, nullable=False, default=False),
    Column("sync_status", String(32)),
    Column("created_at", String(40), nullable=False),
    Column("synced_at", String(40)),
    UniqueConstraint("umkm_id", "client_txn_id", name="uq_transactions_umkm_client_txn"),
    Index("ix_transactions_umkm_created", "umkm_id", "created_at"),
    Index("ix_transactions_created", "created_at"),
    Index("ix_transactions_nfc_total", "umkm_id", "nfc_card_id", "total"),
)

audit_logs = Table(
    "audit_logs",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("user_id", String(36)),
    Column("umkm_id", String(36)),
    Column("action", String(128), nullable=False),
    Column("meta", JSON, nullable=False),
    Column("created_at", String(40), nullable=False),
    Index("ix_audit_logs_created", "created_at"),
)

settlement_config = Table(
    "settlement_config",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("umkm_pct", Float, nullable=False),
    Column("pemkab_pct", Float, nullable=False),
    Column("admin_pct", Float, nullable=False),
)

settlement_allocations = Table(
    "settlement_allocations",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("transaction_id", String(64), nullable=False),
    Column("umkm_id", String(36), nullable=False),
    Column("recipient_type", String(16), nullable=False),
    Column("recipient_id", String(36)),
    Column("percentage", Numeric(5, 2), nullable=False),
    Column("amount", Numeric(14, 2), nullable=False),
    Column("status", String(40), nullable=False),
    Column("created_at", String(40), nullable=False),
    Column("transfer_reference", String(255)),
    UniqueConstraint("transaction_id", "recipient_type", name="uq_settlement_transaction_recipient"),
    Index("ix_settlement_allocations_recipient", "recipient_type", "recipient_id"),
    Index("ix_settlement_allocations_status", "status", "created_at"),
)

password_reset_requests = Table(
    "password_reset_requests",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("user_id", String(36), nullable=False),
    Column("email", String(255), nullable=False),
    Column("email_code_hash", String(64), nullable=False),
    Column("email_code_expires_at", String(40), nullable=False),
    Column("attempts", Integer, nullable=False, default=0),
    Column("status", String(32), nullable=False),
    Column("reset_token_hash", String(64)),
    Column("reset_token_expires_at", String(40)),
    Column("requested_at", String(40), nullable=False),
    Column("email_verified_at", String(40)),
    Column("reviewed_at", String(40)),
    Column("reviewed_by", String(36)),
    Column("rejection_reason", Text),
    Index("ix_password_reset_user_status", "user_id", "status"),
    Index("ix_password_reset_status_requested", "status", "requested_at"),
)

TABLES = {
    table.name: table
    for table in (users, umkms, umkm_payout_accounts, products, customers, transactions, audit_logs, settlement_config, settlement_allocations, password_reset_requests)
}


def _build_database_url() -> str:
    required = ("DB_HOST", "DB_DATABASE", "DB_USERNAME")
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        db_path = Path(__file__).resolve().parent / "local.db"
        return f"sqlite+aiosqlite:///{db_path.as_posix()}"

    try:
        port = int(os.getenv("DB_PORT", "3306"))
    except ValueError as exc:
        raise RuntimeError("DB_PORT must be an integer") from exc
    if not 1 <= port <= 65535:
        raise RuntimeError("DB_PORT must be between 1 and 65535")

    username = quote(os.environ["DB_USERNAME"], safe="")
    password = quote(os.getenv("DB_PASSWORD", ""), safe="")
    database = quote(os.environ["DB_DATABASE"], safe="")
    host = os.environ["DB_HOST"]

    return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}?charset=utf8mb4"


class TableStore:
    def __init__(self, engine: Engine | AsyncEngine, table: Table, connection: Connection | AsyncConnection | None = None):
        self.engine = engine
        self.table = table
        self.connection = connection

    def _is_async_engine(self) -> bool:
        return isinstance(self.engine, AsyncEngine)

    @contextmanager
    def _sync_connection(self, write: bool = False):
        if self.connection is not None:
            yield self.connection
        elif write:
            with self.engine.begin() as connection:
                yield connection
        else:
            with self.engine.connect() as connection:
                yield connection

    def _conditions(self, filters: dict[str, Any] | None) -> list[ColumnElement[bool]]:
        conditions = []
        for expression, value in (filters or {}).items():
            field, separator, operation = expression.partition("__")
            column = self.table.c[field]
            if not separator or operation == "eq":
                conditions.append(column == value)
            elif operation == "gte":
                conditions.append(column >= value)
            elif operation == "gt":
                conditions.append(column > value)
            elif operation == "lte":
                conditions.append(column <= value)
            elif operation == "lt":
                conditions.append(column < value)
            elif operation == "in":
                conditions.append(column.in_(value))
            elif operation == "ne":
                conditions.append(column != value)
            else:
                raise ValueError(f"Unsupported filter operation: {operation}")
        return conditions

    def _statement(self, columns: list[str] | None = None, omit: set[str] | None = None):
        omitted = omit or set()
        selected = [self.table.c[name] for name in columns] if columns else [
            column for column in self.table.c if column.name not in omitted
        ]
        return select(*selected)

    @staticmethod
    def _row_dict(row) -> dict[str, Any] | None:
        if row is None:
            return None
        result = dict(row._mapping)
        return {key: float(value) if isinstance(value, Decimal) else value for key, value in result.items()}

    @asynccontextmanager
    async def _connection(self, write: bool = False):
        if self.connection is not None:
            yield self.connection
        elif write:
            async with self.engine.begin() as connection:
                yield connection
        else:
            async with self.engine.connect() as connection:
                yield connection

    async def get_one(
        self,
        filters: dict[str, Any] | None = None,
        columns: list[str] | None = None,
        omit: set[str] | None = None,
    ) -> dict[str, Any] | None:
        if self._is_async_engine():
            statement = self._statement(columns, omit).where(*self._conditions(filters)).limit(1)
            async with self._connection() as connection:
                result = await connection.execute(statement)
                return self._row_dict(result.first())

        def read_sync():
            statement = self._statement(columns, omit).where(*self._conditions(filters)).limit(1)
            with self._sync_connection() as connection:
                result = connection.execute(statement)
                return self._row_dict(result.first())

        return read_sync() if self.connection is not None else await asyncio.to_thread(read_sync)

    async def get_many(
        self,
        filters: dict[str, Any] | None = None,
        order_by: tuple[str, str] | None = None,
        limit: int | None = None,
        columns: list[str] | None = None,
        omit: set[str] | None = None,
    ) -> list[dict[str, Any]]:
        if self._is_async_engine():
            statement = self._statement(columns, omit).where(*self._conditions(filters))
            if order_by:
                column = self.table.c[order_by[0]]
                statement = statement.order_by(column.desc() if order_by[1].lower() == "desc" else column.asc())
            if limit is not None:
                statement = statement.limit(limit)
            async with self._connection() as connection:
                result = await connection.execute(statement)
                return [self._row_dict(row) for row in result.fetchall()]

        def read_sync():
            statement = self._statement(columns, omit).where(*self._conditions(filters))
            if order_by:
                column = self.table.c[order_by[0]]
                statement = statement.order_by(column.desc() if order_by[1].lower() == "desc" else column.asc())
            if limit is not None:
                statement = statement.limit(limit)
            with self._sync_connection() as connection:
                result = connection.execute(statement)
                return [self._row_dict(row) for row in result.fetchall()]

        return read_sync() if self.connection is not None else await asyncio.to_thread(read_sync)

    async def insert(self, values: dict[str, Any]) -> None:
        if self._is_async_engine():
            async with self._connection(write=True) as connection:
                await connection.execute(insert(self.table).values(**values))
            return

        def write_sync():
            with self._sync_connection(write=True) as connection:
                connection.execute(insert(self.table).values(**values))

        if self.connection is not None:
            write_sync()
        else:
            await asyncio.to_thread(write_sync)

    async def update(
        self,
        filters: dict[str, Any],
        values: dict[str, Any] | None = None,
        increments: dict[str, Any] | None = None,
        upsert: bool = False,
    ) -> bool:
        if self._is_async_engine():
            changes = dict(values or {})
            for field, amount in (increments or {}).items():
                changes[field] = self.table.c[field] + amount
            conditions = self._conditions(filters)
            async with self._connection(write=True) as connection:
                primary_key = next(iter(self.table.primary_key.columns))
                existing = await connection.execute(
                    select(primary_key).where(*conditions).limit(1)
                )
                if existing.first() is None:
                    if not upsert:
                        return False
                    equality_filters = {key: value for key, value in filters.items() if "__" not in key}
                    await connection.execute(insert(self.table).values(**equality_filters, **(values or {})))
                    return True
                if upsert:
                    await connection.execute(update(self.table).where(*conditions).values(**changes))
                    return True
                await connection.execute(update(self.table).where(*conditions).values(**changes))
                return True

        def write_sync():
            changes = dict(values or {})
            for field, amount in (increments or {}).items():
                changes[field] = self.table.c[field] + amount
            conditions = self._conditions(filters)
            with self._sync_connection(write=True) as connection:
                primary_key = next(iter(self.table.primary_key.columns))
                existing = connection.execute(select(primary_key).where(*conditions).limit(1))
                if existing.first() is None:
                    if not upsert:
                        return False
                    equality_filters = {key: value for key, value in filters.items() if "__" not in key}
                    connection.execute(insert(self.table).values(**equality_filters, **(values or {})))
                    return True
                if upsert:
                    connection.execute(update(self.table).where(*conditions).values(**changes))
                    return True
                connection.execute(update(self.table).where(*conditions).values(**changes))
                return True

        return write_sync() if self.connection is not None else await asyncio.to_thread(write_sync)

    async def delete_one(self, filters: dict[str, Any]) -> bool:
        if self._is_async_engine():
            async with self._connection(write=True) as connection:
                result = await connection.execute(delete(self.table).where(*self._conditions(filters)))
                return bool(result.rowcount)

        def write_sync():
            with self._sync_connection(write=True) as connection:
                result = connection.execute(delete(self.table).where(*self._conditions(filters)))
                return bool(result.rowcount)

        return write_sync() if self.connection is not None else await asyncio.to_thread(write_sync)

    async def delete_many(self, filters: dict[str, Any]) -> int:
        if self._is_async_engine():
            async with self._connection(write=True) as connection:
                result = await connection.execute(delete(self.table).where(*self._conditions(filters)))
                return result.rowcount or 0

        def write_sync():
            with self._sync_connection(write=True) as connection:
                result = connection.execute(delete(self.table).where(*self._conditions(filters)))
                return result.rowcount or 0

        return write_sync() if self.connection is not None else await asyncio.to_thread(write_sync)

    async def count(self, filters: dict[str, Any] | None = None) -> int:
        if self._is_async_engine():
            statement = select(func.count()).select_from(self.table).where(*self._conditions(filters))
            async with self._connection() as connection:
                result = await connection.execute(statement)
                return int(result.scalar_one())

        def read_sync():
            statement = select(func.count()).select_from(self.table).where(*self._conditions(filters))
            with self._sync_connection() as connection:
                result = connection.execute(statement)
                return int(result.scalar_one())

        return read_sync() if self.connection is not None else await asyncio.to_thread(read_sync)


class Database:
    def __init__(self, engine: Engine | AsyncEngine):
        self.engine = engine

    @classmethod
    def from_environment(cls) -> "Database":
        url = _build_database_url()
        if str(url).startswith("sqlite"):
            normalized = url.replace("sqlite+aiosqlite", "sqlite+pysqlite")
            return cls(create_engine(normalized))
        return cls(create_engine(url, pool_pre_ping=True, pool_recycle=1800, connect_args={"connect_timeout": 10}))

    async def check_connection(self) -> None:
        if isinstance(self.engine, AsyncEngine):
            async with self.engine.connect() as connection:
                await connection.execute(select(1))
            return

        def sync_check():
            with self.engine.connect() as connection:
                connection.execute(select(1)).scalar()

        await asyncio.to_thread(sync_check)

    async def create_schema(self) -> None:
        if isinstance(self.engine, AsyncEngine):
            async with self.engine.begin() as connection:
                await connection.run_sync(metadata.create_all)
            return

        await asyncio.to_thread(metadata.create_all, self.engine)

    async def dispose(self) -> None:
        if isinstance(self.engine, AsyncEngine):
            await self.engine.dispose()
            return

        await asyncio.to_thread(self.engine.dispose)

    @asynccontextmanager
    async def transaction(self):
        if isinstance(self.engine, AsyncEngine):
            async with self.engine.begin() as connection:
                yield BoundDatabase(self.engine, connection)
            return

        with self.engine.begin() as connection:
            yield BoundDatabase(self.engine, connection)

    def __getattr__(self, name: str) -> TableStore:
        if name in TABLES:
            return TableStore(self.engine, TABLES[name])
        raise AttributeError(name)


class BoundDatabase:
    def __init__(self, engine: Engine | AsyncEngine, connection: Connection | AsyncConnection):
        self.engine = engine
        self.connection = connection

    def __getattr__(self, name: str) -> TableStore:
        if name in TABLES:
            return TableStore(self.engine, TABLES[name], self.connection)
        raise AttributeError(name)