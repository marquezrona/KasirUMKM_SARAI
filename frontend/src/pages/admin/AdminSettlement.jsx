import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const rp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

export default function AdminSettlement() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ umkm_pct: 90, pemkab_pct: 8, admin_pct: 2 });

  const load = async () => {
    const { data } = await api.get("/admin/settlement");
    setData(data);
    setForm(data.config);
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put("/admin/settlement", {
        umkm_pct: parseFloat(form.umkm_pct),
        pemkab_pct: parseFloat(form.pemkab_pct),
        admin_pct: parseFloat(form.admin_pct),
      });
      toast.success("Konfigurasi settlement diperbarui");
      load();
    } catch (err) { toast.error(err.response?.data?.detail || "Gagal"); }
  };

  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold text-[#0C2340]">Settlement</h1>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-5 border-[#E5DEC9]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Dana Masuk</div>
          <div className="font-display text-2xl font-extrabold mt-1">{rp(data.total_in)}</div>
        </Card>
        <Card className="p-5 border-[#E5DEC9]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Hak UMKM ({data.config.umkm_pct}%)</div>
          <div className="font-display text-2xl font-extrabold text-[#0A3663] mt-1">{rp(data.umkm_share)}</div>
        </Card>
        <Card className="p-5 border-[#E5DEC9]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pemkab ({data.config.pemkab_pct}%)</div>
          <div className="font-display text-2xl font-extrabold text-[#A63A2B] mt-1">{rp(data.pemkab_share)}</div>
        </Card>
        <Card className="p-5 border-[#E5DEC9]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Admin ({data.config.admin_pct}%)</div>
          <div className="font-display text-2xl font-extrabold text-[#E6A100] mt-1">{rp(data.admin_share)}</div>
        </Card>
      </div>

      <Card className="p-6 border-[#E5DEC9] max-w-2xl">
        <h3 className="font-display font-bold text-lg mb-4">Konfigurasi Persentase</h3>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div><Label>UMKM (%)</Label><Input type="number" step="0.1" value={form.umkm_pct} onChange={e => setForm({ ...form, umkm_pct: e.target.value })} /></div>
            <div><Label>Pemkab (%)</Label><Input type="number" step="0.1" value={form.pemkab_pct} onChange={e => setForm({ ...form, pemkab_pct: e.target.value })} /></div>
            <div><Label>Admin (%)</Label><Input type="number" step="0.1" value={form.admin_pct} onChange={e => setForm({ ...form, admin_pct: e.target.value })} /></div>
          </div>
          <div className="text-xs text-slate-500">Total: {Number(form.umkm_pct) + Number(form.pemkab_pct) + Number(form.admin_pct)}% (harus 100)</div>
          <Button type="submit" className="bg-[#0A3663]">Simpan Konfigurasi</Button>
        </form>
        <div className="mt-4 text-xs text-slate-500 italic">
          Catatan: Ini adalah ledger simulasi. Transfer dana nyata memerlukan integrasi banking API resmi.
        </div>
      </Card>

      <Card className="max-w-2xl border-[#E5DEC9] p-5">
        <h3 className="font-display font-bold text-lg text-[#0C2340]">Status Alokasi</h3>
        <p className="mt-2 text-sm text-slate-600">
          Tercatat menunggu rekening dan verifikasi: <strong>{rp(data.pending_allocation_total)}</strong>.
          Alokasi ini belum merupakan transfer bank.
        </p>
        {data.unallocated_transactions > 0 && (
          <p className="mt-2 text-sm text-amber-800">
            {data.unallocated_transactions} transaksi lama belum memiliki catatan alokasi.
          </p>
        )}
      </Card>
    </div>
  );
}
