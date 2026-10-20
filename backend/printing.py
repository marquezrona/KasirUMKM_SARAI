import ctypes
import os
import re
import textwrap
from ctypes import wintypes
from datetime import datetime
from typing import Any


RECEIPT_WIDTH = 48
DEFAULT_PRINTER_NAME = "test"


def _plain_text(value: Any) -> str:
    text = str(value or "")
    text = "".join(char if char.isprintable() else " " for char in text)
    return re.sub(r"\s+", " ", text).strip().encode("cp437", errors="replace").decode("cp437")


def _amount(value: Any) -> str:
    return f"Rp {int(round(float(value or 0))):,}".replace(",", ".")


def _row(label: str, value: str) -> str:
    label = _plain_text(label)
    value = _plain_text(value)
    available = RECEIPT_WIDTH - len(value) - 1
    if len(label) > available:
        return f"{label[:RECEIPT_WIDTH]}\n{value.rjust(RECEIPT_WIDTH)}"
    return f"{label}{' ' * (RECEIPT_WIDTH - len(label) - len(value))}{value}"


def format_thermal_receipt(
    transaction: dict,
    store_name: str,
    address: str = "",
    phone: str = "",
) -> bytes:
    chunks = [b"\x1b@\x1ba\x00"]

    def add_line(text: str) -> None:
        chunks.append(_plain_text(text).encode("cp437", errors="replace") + b"\n")

    chunks.append(b"\x1ba\x01\x1d!\x00\x1bE\x01")
    for line in textwrap.wrap(_plain_text(store_name), width=RECEIPT_WIDTH) or [""]:
        add_line(line)
    chunks.append(b"\x1d!\x00\x1bE\x00")
    chunks.append(b"\x1ba\x01\x1d!\x00\x1bE\x01")
    add_line("HAWUPAY")
    chunks.append(b"\x1d!\x00\x1bE\x00")
    for label, value in (("Alamat", address), ("Telp", phone)):
        if value:
            header = f"{label}: {_plain_text(value)}"
            for line in textwrap.wrap(header, width=RECEIPT_WIDTH) or [""]:
                add_line(line)
    chunks.append(b"\x1ba\x00")
    add_line("-" * RECEIPT_WIDTH)
    add_line(_row("No. Transaksi :", transaction["id"]))
    add_line(_row(
        "Tanggal:",
        datetime.fromisoformat(transaction["created_at"]).astimezone().strftime("%d-%m-%Y %H:%M"),
    ))
    add_line(_row("Pembayaran :", transaction["payment_method"]))
    add_line("-" * RECEIPT_WIDTH)
    chunks.append(b"\x1ba\x00")

    for item in transaction["items"]:
        label = f'{item["qty"]}x {_plain_text(item["name"])}'
        price = _amount(float(item["price"]) * int(item["qty"]))
        add_line(_row(label, price))

    add_line("-" * RECEIPT_WIDTH)
    add_line(_row("Subtotal", _amount(transaction["subtotal"])))
    if transaction.get("discount"):
        add_line(_row("Diskon", _amount(transaction["discount"])))
    chunks.append(b"\x1bE\x01")
    add_line(_row("TOTAL", _amount(transaction["total"])))
    chunks.append(b"\x1bE\x00")
    if transaction.get("payment_method") == "NFC" and transaction.get("customer_balance") is not None:
        add_line(_row("Sisa saldo", _amount(transaction["customer_balance"])))
    add_line("-" * RECEIPT_WIDTH)
    chunks.append(b"\x1ba\x01")
    add_line("Terima kasih")
    add_line("Sampai jumpa lagi!")
    chunks.append(b"\x1bd\x01\x1dV\x01")
    return b"".join(chunks)


def _send_raw_windows(printer_name: str, data: bytes) -> None:
    if os.name != "nt":
        raise OSError("Cetak langsung hanya tersedia pada backend Windows.")

    spooler = ctypes.WinDLL("winspool.drv", use_last_error=True)
    handle = wintypes.HANDLE()
    open_printer = spooler.OpenPrinterW
    open_printer.argtypes = [wintypes.LPWSTR, ctypes.POINTER(wintypes.HANDLE), ctypes.c_void_p]
    open_printer.restype = wintypes.BOOL
    if not open_printer(printer_name, ctypes.byref(handle), None):
        raise ctypes.WinError(ctypes.get_last_error())

    class DocInfo1(ctypes.Structure):
        _fields_ = [
            ("pDocName", wintypes.LPWSTR),
            ("pOutputFile", wintypes.LPWSTR),
            ("pDatatype", wintypes.LPWSTR),
        ]

    started_doc = False
    started_page = False
    try:
        start_doc = spooler.StartDocPrinterW
        start_doc.argtypes = [wintypes.HANDLE, wintypes.DWORD, ctypes.POINTER(DocInfo1)]
        start_doc.restype = wintypes.DWORD
        info = DocInfo1("HawuPay Receipt", None, "RAW")
        if not start_doc(handle, 1, ctypes.byref(info)):
            raise ctypes.WinError(ctypes.get_last_error())
        started_doc = True

        start_page = spooler.StartPagePrinter
        start_page.argtypes = [wintypes.HANDLE]
        start_page.restype = wintypes.BOOL
        if not start_page(handle):
            raise ctypes.WinError(ctypes.get_last_error())
        started_page = True

        write_printer = spooler.WritePrinter
        write_printer.argtypes = [
            wintypes.HANDLE,
            ctypes.c_void_p,
            wintypes.DWORD,
            ctypes.POINTER(wintypes.DWORD),
        ]
        write_printer.restype = wintypes.BOOL
        buffer = ctypes.create_string_buffer(data)
        written = wintypes.DWORD()
        if not write_printer(handle, buffer, len(data), ctypes.byref(written)):
            raise ctypes.WinError(ctypes.get_last_error())
        if written.value != len(data):
            raise OSError(f"Data struk tidak terkirim seluruhnya ({written.value}/{len(data)} byte).")
    finally:
        if started_page:
            spooler.EndPagePrinter(handle)
        if started_doc:
            spooler.EndDocPrinter(handle)
        spooler.ClosePrinter(handle)


def print_thermal_receipt(
    transaction: dict,
    store_name: str,
    address: str = "",
    phone: str = "",
) -> None:
    printer_name = os.getenv("RECEIPT_PRINTER_NAME", DEFAULT_PRINTER_NAME)
    _send_raw_windows(
        printer_name,
        format_thermal_receipt(transaction, store_name, address, phone),
    )
