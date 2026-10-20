import { Fragment, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { listOfflineTxns } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOffline } from "@/context/OfflineContext";
import { Search, X } from "lucide-react";

const rp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
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

export default function Transactions() {
  const [txns, setTxns] = useState([]);
  const [offline, setOffline] = useState([]);
  const [query, setQuery] = useState("");
  const [groupBy, setGroupBy] = useState("day");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const { pending } = useOffline();

  const load = async () => {
    try { const { data } = await api.get("/umkm/transactions?limit=10000"); setTxns(data); } catch {}
    setOffline(await listOfflineTxns());
  };
  useEffect(() => { load(); }, [pending]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8001";
    const url = backendUrl.replace(/^http/, "ws") + `/api/ws?token=${token}`;
    let ws;
    try {
      ws = new WebSocket(url);
      ws.onmessage = () => load();
    } catch {}
    return () => ws?.close();
  }, []);

  const filteredTxns = useMemo(() => {
    const value = query.trim().toLowerCase();
    const selectedPeriod = groupBy === "day" ? selectedDay : groupBy === "month" ? selectedMonth : selectedYear;
    return txns.filter(txn => {
      const matchesQuery = !value || [txn.id, txn.payment_method, txn.status, txn.sync_status, txn.total]
        .some(field => String(field || "").toLowerCase().includes(value));
      return matchesQuery && (!selectedPeriod || periodKey(txn.created_at, groupBy) === selectedPeriod);
    });
  }, [txns, query, groupBy, selectedDay, selectedMonth, selectedYear]);

  const filteredOffline = useMemo(() => {
    const value = query.trim().toLowerCase();
    const selectedPeriod = groupBy === "day" ? selectedDay : groupBy === "month" ? selectedMonth : selectedYear;
    return offline.filter(txn => {
      const matchesQuery = !value || [txn.client_txn_id, txn.payment_method, txn.total]
        .some(field => String(field || "").toLowerCase().includes(value));
      return matchesQuery && (!selectedPeriod || periodKey(txn.created_at_client, groupBy) === selectedPeriod);
    });
  }, [offline, query, groupBy, selectedDay, selectedMonth, selectedYear]);

  const availableYears = useMemo(() => [...new Set([...txns.map(txn => txn.created_at), ...offline.map(txn => txn.created_at_client)]
    .map(value => periodKey(value, "year"))
    .filter(year => year !== "unknown"))].sort((a, b) => b.localeCompare(a)), [txns, offline]);

  const groupedTxns = useMemo(() => {
    const groups = new Map();
    filteredTxns.forEach(transaction => {
      const key = periodKey(transaction.created_at, groupBy);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(transaction);
    });
    return [...groups.entries()].sort(([first], [second]) => second.localeCompare(first)).map(([key, transactions]) => ({
      key,
      label: key === "unknown" ? "Tanggal tidak tersedia" : groupBy === "year" ? key : new Intl.DateTimeFormat("id-ID", groupBy === "day"
        ? { day: "numeric", month: "long", year: "numeric" }
        : { month: "long", year: "numeric" }).format(new Date(`${key}${groupBy === "day" ? "T12:00:00" : "-01T12:00:00"}`)),
      transactions,
    }));
  }, [filteredTxns, groupBy]);

  const clearPeriod = () => {
    setSelectedDay("");
    setSelectedMonth("");
    setSelectedYear("");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold text-[#0C2340]">Riwayat Transaksi</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          data-testid="transaction-search"
          aria-label="Cari transaksi"
          placeholder="Cari ID, metode, status, atau nominal..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9 pr-10"
        />
        {query && (
          <button type="button" aria-label="Hapus pencarian transaksi" title="Hapus pencarian" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-[#0A3663]">
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
          <label htmlFor="transaction-period" className="text-sm font-medium text-slate-700">
            {groupBy === "day" ? "Pilih tanggal" : groupBy === "month" ? "Pilih bulan" : "Pilih tahun"}
          </label>
          {groupBy === "day" && (
            <Input id="transaction-period" type="date" value={selectedDay} onChange={event => setSelectedDay(event.target.value)} className="w-auto" />
          )}
          {groupBy === "month" && (
            <Input id="transaction-period" type="month" value={selectedMonth} onChange={event => setSelectedMonth(event.target.value)} className="w-auto" />
          )}
          {groupBy === "year" && (
            <select
              id="transaction-period"
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

      {filteredOffline.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 p-4">
          <h3 className="font-display font-bold text-amber-900 mb-2">Menunggu Sinkronisasi ({filteredOffline.length})</h3>
          <div className="space-y-1">
            {filteredOffline.map(t => (
              <div key={t.client_txn_id} className="flex justify-between text-sm">
                <span className="font-mono text-xs">{t.client_txn_id.slice(0, 12)}</span>
                <span>{t.payment_method}</span>
                <span className="font-semibold">{rp(t.total)}</span>
                <Badge className="bg-amber-200 text-amber-900">PENDING SYNC</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="border-[#E5DEC9] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead className="text-right">Nominal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sync</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedTxns.map(group => (
              <Fragment key={group.key}>
                <TableRow className="bg-[#F7F4EF]"><TableCell colSpan="6" className="font-display font-bold text-[#0C2340]">{group.label} <span className="font-normal text-slate-500">({group.transactions.length} transaksi)</span></TableCell></TableRow>
                {group.transactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.id}</TableCell>
                    <TableCell className="text-xs">{new Date(t.created_at).toLocaleString("id-ID")}</TableCell>
                    <TableCell><Badge variant="outline">{t.payment_method}</Badge></TableCell>
                    <TableCell className="text-right font-semibold">{rp(t.total)}</TableCell>
                    <TableCell><Badge className="bg-emerald-100 text-emerald-800">{t.status}</Badge></TableCell>
                    <TableCell>
                      <Badge className={t.offline ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}>
                        {t.offline ? "OFFLINE→SYNCED" : "ONLINE"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
            {filteredTxns.length === 0 && (
              <TableRow><TableCell colSpan="6" className="py-10 text-center text-slate-500">Tidak ada transaksi yang cocok dengan pencarian.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}