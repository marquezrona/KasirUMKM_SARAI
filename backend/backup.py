import asyncio
import gzip
import logging
import os
import shutil
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent
BACKUP_DIR = ROOT_DIR / "backups"
BACKUP_INTERVAL_SECONDS = 24 * 60 * 60
BACKUP_RETENTION_COUNT = 30

load_dotenv(ROOT_DIR / ".env")

log = logging.getLogger("kasir.backup")


def _find_mysqldump() -> str:
    configured_path = os.getenv("MYSQLDUMP_PATH")
    if configured_path:
        if Path(configured_path).is_file():
            return configured_path
        raise FileNotFoundError("MYSQLDUMP_PATH does not point to an existing file")

    executable = shutil.which("mysqldump") or shutil.which("mysqldump.exe")
    if executable:
        return executable

    laragon_executables = sorted(
        Path("C:/laragon/bin/mysql").glob("*/bin/mysqldump.exe"),
        reverse=True,
    )
    if laragon_executables:
        return str(laragon_executables[0])

    raise FileNotFoundError(
        "mysqldump was not found; install MySQL tools, add it to PATH, "
        "or set MYSQLDUMP_PATH in backend/.env"
    )


def _database_dump_arguments(executable: str) -> list[str]:
    required = ("DB_HOST", "DB_DATABASE", "DB_USERNAME")
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        raise RuntimeError(
            "Database backup requires these settings in backend/.env: "
            + ", ".join(missing)
        )

    try:
        port = int(os.getenv("DB_PORT", "3306"))
    except ValueError as exc:
        raise RuntimeError("DB_PORT must be an integer for database backups") from exc
    if not 1 <= port <= 65535:
        raise RuntimeError("DB_PORT must be between 1 and 65535 for database backups")

    return [
        executable,
        f"--host={os.environ['DB_HOST']}",
        f"--port={port}",
        f"--user={os.environ['DB_USERNAME']}",
        "--default-character-set=utf8mb4",
        "--single-transaction",
        "--skip-lock-tables",
        "--quick",
        "--no-tablespaces",
        os.environ["DB_DATABASE"],
    ]


async def create_database_backup() -> Path:
    backup_dir = BACKUP_DIR
    backup_dir.mkdir(parents=True, exist_ok=True)

    dump_arguments = _database_dump_arguments(_find_mysqldump())
    destination = backup_dir / f"kasir_umkm_{datetime.now():%Y-%m-%d}.sql.gz"
    temporary_dump = backup_dir / f".{uuid4().hex}.sql.tmp"
    temporary_archive = backup_dir / f".{uuid4().hex}.sql.gz.tmp"
    child_environment = os.environ.copy()
    child_environment["MYSQL_PWD"] = os.getenv("DB_PASSWORD", "")

    try:
        with temporary_dump.open("wb") as dump_file:
            process = await asyncio.create_subprocess_exec(
                *dump_arguments,
                stdout=dump_file,
                stderr=asyncio.subprocess.PIPE,
                env=child_environment,
            )
            _, stderr = await process.communicate()

        if process.returncode != 0:
            error = (stderr or b"").decode("utf-8", errors="replace").strip()
            raise RuntimeError(
                f"mysqldump failed with exit code {process.returncode}"
                + (f": {error}" if error else "")
            )
        if temporary_dump.stat().st_size == 0:
            raise RuntimeError("mysqldump returned an empty database backup")

        with temporary_dump.open("rb") as source, gzip.open(
            temporary_archive, "wb", compresslevel=6
        ) as archive:
            shutil.copyfileobj(source, archive)
        if temporary_archive.stat().st_size == 0:
            raise RuntimeError("The compressed database backup is empty")

        os.replace(temporary_archive, destination)
        backups = sorted(
            backup_dir.glob("kasir_umkm_????-??-??.sql.gz"),
            key=lambda path: path.name,
            reverse=True,
        )
        for expired_backup in backups[BACKUP_RETENTION_COUNT:]:
            expired_backup.unlink()
        return destination
    finally:
        temporary_dump.unlink(missing_ok=True)
        temporary_archive.unlink(missing_ok=True)


async def run_daily_database_backups() -> None:
    while True:
        try:
            destination = await create_database_backup()
        except Exception:
            log.exception("Automatic database backup failed")
        else:
            log.info("Database backup saved to %s", destination)
        await asyncio.sleep(BACKUP_INTERVAL_SECONDS)
