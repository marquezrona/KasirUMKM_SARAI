import { Fragment, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const rp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
const empty = { name: "", phone: "", nfc_card_id: "", balance: 0 };
const periodKey = (value, period) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  if (period === "year") return String(year);
  if (period === "month") return `${year}-${month}`;
  return `${year}-${month}-${day}`;
};

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groupBy, setGroupBy] = useState("day");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const load = async () => { const { data } = await api.get("/umkm/customers"); setRows(data); };
  useEffect(() => { load(); }, []);

  const filteredRows = rows.filter(customer => {
    const value = query.trim().toLowerCase();
    const matchesQuery = !value || [customer.name, customer.phone, customer.nfc_card_id, customer.nfc_card_masked]
      .some(field => String(field || "").toLowerCase().includes(value));
    const selectedPeriod = groupBy === "day" ? selectedDay : groupBy === "month" ? selectedMonth : selectedYear;
    return matchesQuery && (!selectedPeriod || periodKey(customer.created_at, groupBy) === selectedPeriod);
  });

  const availableYears = useMemo(() => [...new Set(rows
    .map(customer => periodKey(customer.created_at, "year"))
    .filter(year => year !== "unknown"))].sort((a, b) => b.localeCompare(a)), [rows]);

  const groupedRows = useMemo(() => {
    const groups = new Map();
    filteredRows.forEach(customer => {
      const key = periodKey(customer.created_at, groupBy);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(customer);
    });
    return [...groups.entries()].sort(([first], [second]) => second.localeCompare(first)).map(([key, customers]) => ({
      key,
      label: key === "unknown" ? "Tanggal tidak tersedia" : groupBy === "year" ? key : new Intl.DateTimeFormat("id-ID", groupBy === "day"
        ? { day: "numeric", month: "long", year: "numeric" }
        : { month: "long", year: "numeric" }).format(new Date(`${key}${groupBy === "day" ? "T12:00:00" : "-01T12:00:00"}`)),
      customers,
    }));
  }, [filteredRows, groupBy]);

  const clearPeriod = () => {
    setSelectedDay("");
    setSelectedMonth("");
    setSelectedYear("");
  };

  const openNew = () => { setForm(empty); setEditing(null); setOpen(true); };
  const openEdit = (c) => { setForm({ name: c.name, phone: c.phone || "", nfc_card_id: c.nfc_card_id || "", balance: c.balance || 0 }); setEditing(c.id); setOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    const body = { ...form, balance: Number(form.balance) };
    try {
      if (editing) await api.put(`/umkm/customers/${editing}`, body);
      else await api.post("/umkm/customers", body);
      toast.success("Pelanggan disimpan");
      setOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.detail || "Gagal"); }
  };

  const del = async (id) => {
    if (!window.confirm("Hapus pelanggan ini?")) return;
    await api.delete(`/umkm/customers/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl font-extrabold text-[#0C2340]">Pelanggan</h1>
        <>
          <Button data-testid="add-customer-btn" onClick={openNew} className="bg-[#0A3663] rounded-full">
            <Plus className="w-4 h-4 mr-1.5" /> Tambah Pelanggan
          </Button>
          {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
                <h2 className="text-lg font-semibold text-slate-900">{editing ? "Edit" : "Tambah"} Pelanggan</h2>
            <form onSubmit={save} className="space-y-3">
              <div><Label>Nama</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Telepon</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>ID Kartu NFC</Label><Input placeholder="CARD-XXX" value={form.nfc_card_id} onChange={e => setForm({ ...form, nfc_card_id: e.target.value })} /></div>
              <div><Label>Saldo (Rp)</Label><Input type="number" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} /></div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Kembali</Button>
                <Button type="submit" className="flex-1 bg-[#0A3663]">Simpan</Button>
              </div>
            </form>
              </div>
            </div>
          )}
        </>
      </div>
      <p className="text-sm text-slate-600">
        Pelanggan terdaftar dapat memakai kartu NFC dan saldo yang sama di semua UMKM mitra. Jika kartu sudah terdaftar di UMKM lain, pelanggan tidak perlu didaftarkan ulang.
      </p>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          data-testid="customer-search"
          aria-label="Cari pelanggan"
          placeholder="Cari nama, telepon, atau kartu NFC..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9 pr-10"
        />
        {query && (
          <button type="button" aria-label="Hapus pencarian pelanggan" title="Hapus pencarian" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-[#0A3663]">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-600">Kelompokkan:</span>
        <div className="flex rounded-lg border border-[#E5DEC9] bg-white p-1">
          <button type="button" onClick={() => setGroupBy("day")} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${groupBy === "day" ? "bg-[#0A3663] text-white" : "text-[#0C2340]"}`}>Per Hari</button>
          <button type="button" onClick={() => setGroupBy("month")} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${groupBy === "month" ? "bg-[#0A3663] text-white" : "text-[#0C2340]"}`}>Per Bulan</button>
          <button type="button" onClick={() => setGroupBy("year")} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${groupBy === "year" ? "bg-[#0A3663] text-white" : "text-[#0C2340]"}`}>Per Tahun</button>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="customer-period">
            {groupBy === "day" ? "Pilih tanggal" : groupBy === "month" ? "Pilih bulan" : "Pilih tahun"}
          </Label>
          {groupBy === "day" && (
            <Input id="customer-period" type="date" value={selectedDay} onChange={event => setSelectedDay(event.target.value)} className="w-auto" />
          )}
          {groupBy === "month" && (
            <Input id="customer-period" type="month" value={selectedMonth} onChange={event => setSelectedMonth(event.target.value)} className="w-auto" />
          )}
          {groupBy === "year" && (
            <select
              id="customer-period"
              value={selectedYear}
              onChange={event => setSelectedYear(event.target.value)}
              className="flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Semua tahun</option>
              {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          )}
        </div>
        {(selectedDay || selectedMonth || selectedYear) && (
          <Button type="button" variant="outline" onClick={clearPeriod}>Tampilkan semua</Button>
        )}
      </div>

      <Card className="border-[#E5DEC9] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Kartu</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedRows.map(group => (
              <Fragment key={group.key}>
                <TableRow className="bg-[#F7F4EF]"><TableCell colSpan="5" className="font-display font-bold text-[#0C2340]">{group.label} <span className="font-normal text-slate-500">({group.customers.length} pelanggan)</span></TableCell></TableRow>
                {group.customers.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold">{c.name}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell className="font-mono text-xs">{c.nfc_card_masked || c.nfc_card_id || "-"}</TableCell>
                    <TableCell className="text-right font-mono">{rp(c.balance)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => del(c.id)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
            {filteredRows.length === 0 && (
              <TableRow><TableCell colSpan="5" className="py-10 text-center text-slate-500">Tidak ada pelanggan yang cocok dengan pencarian.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
