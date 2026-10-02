import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from sqlalchemy import create_engine, func, insert, select

from database import TABLES, metadata, _build_database_url


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

COLLECTIONS = (
    "users",
    "umkms",
    "products",
    "customers",
    "transactions",
    "audit_logs",
    "settlement_config",
)
DEFAULTS = {
    "umkms": {"balance": 0, "active": True},
    "products": {"price": 0, "stock": 0},
    "customers": {"balance": 0},
    "transactions": {"items": [], "discount": 0, "offline": False},
    "audit_logs": {"meta": {}},
}


def migrate() -> None:
    mongo_url = os.getenv("MONGO_URL")
    mongo_database = os.getenv("MONGO_DB_NAME") or os.getenv("DB_NAME")
    if not mongo_url or not mongo_database:
        raise RuntimeError("Set MONGO_URL and MONGO_DB_NAME for the source MongoDB")

    mysql_url = _build_database_url().set(drivername="mysql+pymysql")
    engine = create_engine(mysql_url, pool_pre_ping=True, connect_args={"connect_timeout": 10})
    mongo = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)

    try:
        source = mongo[mongo_database]
        mongo.admin.command("ping")
        with engine.begin() as connection:
            metadata.create_all(connection)
            occupied = {
                name: connection.execute(select(func.count()).select_from(TABLES[name])).scalar_one()
                for name in COLLECTIONS
            }
            occupied = {name: count for name, count in occupied.items() if count}
            if occupied:
                raise RuntimeError(
                    "Target tables are not empty; refusing to mix or overwrite data: "
                    + ", ".join(f"{name}={count}" for name, count in occupied.items())
                )

            totals = {}
            for name in COLLECTIONS:
                table = TABLES[name]
                records = []
                migrated_count = 0
                for document in source[name].find({}, {"_id": 0}):
                    record = dict(document)
                    unsupported = set(record) - set(table.c.keys())
                    if unsupported:
                        raise RuntimeError(
                            f"Unsupported fields in {name}: {', '.join(sorted(unsupported))}"
                        )
                    for field, value in DEFAULTS.get(name, {}).items():
                        record.setdefault(field, value)
                    records.append({column.name: record.get(column.name) for column in table.columns})
                    if len(records) == 500:
                        connection.execute(insert(table), records)
                        migrated_count += len(records)
                        records.clear()
                if records:
                    connection.execute(insert(table), records)
                    migrated_count += len(records)
                totals[name] = migrated_count

        for name, count in totals.items():
            print(f"{name}: {count} migrated")
        print("MongoDB data copied. Source database was not modified.")
    finally:
        mongo.close()
        engine.dispose()


if __name__ == "__main__":
    try:
        migrate()
    except Exception as exc:
        print(f"Migration failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc