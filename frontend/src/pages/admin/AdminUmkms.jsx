import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, Plus, Power, Search, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";

const rp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
const emptyForm = {
  store_name: "",
  email: "",
  password: "",
  address: "",
  phone: "",
  bank_name: "",
  bank_account_number: "",
  bank_account_name: "",
};

function UmkmLogo({ logo, storeName }) {
  const [failedLogo, setFailedLogo] = useState("");
  const showLogo = Boolean(logo && failedLogo !== logo);

  return (
    <div className="w-12 h-12 shrink-0 overflow-hidden rounded-xl bg-[#0A3663] flex items-center justify-center">
      {showLogo ? (
        <img src={logo} alt={`Logo ${storeName}`} className="h-full w-full object-cover" onError={() => setFailedLogo(logo)} />
      ) : (
        <Store className="w-6 h-6 text-[#E6A100]" />
      )}
    </div>
  );
}

export default function AdminUmkms() {
  const [umkms, setUmkms] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const { data } = await api.get("/admin/umkms");
    setUmkms(data);
  }, []);
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  const create = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/admin/umkms", form);
      toast.success(data.bank_verification_status
        ? "UMKM ditambahkan. Rekening payout menunggu verifikasi."
        : "UMKM berhasil ditambahkan");
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) { toast.error(err.response?.data?.detail || "Gagal"); }
  };

  const toggle = async (id) => {
    try {
      await api.patch(`/admin/umkms/${id}/toggle`);
      load();
    } catch (err) { toast.error(err.response?.data?.detail || "Gagal mengubah status UMKM"); }
  };

  const remove = async (umkm) => {
    if (!window.confirm(`Hapus UMKM ${umkm.store_name}? Data akun, produk, pelanggan, dan transaksi toko ini akan dihapus permanen.`)) return;
    try {
      await api.delete(`/admin/umkms/${umkm.id}`);
      toast.success("UMKM berhasil dihapus");
      load();
    } catch (err) { toast.error(err.response?.data?.detail || "Gagal menghapus UMKM"); }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredUmkms = umkms.filter((umkm) => {
    if (!normalizedQuery) return true;
    return [umkm.store_name, umkm.email, umkm.address, umkm.phone]
      .some(value => String(value || "").toLowerCase().includes(normalizedQuery));
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl font-extrabold text-[#0C2340]">Daftar UMKM</h1>
        <Button data-testid="add-umkm-btn" onClick={() => setOpen(true)} className="bg-[#0A3663] hover:bg-[#0C2340] rounded-full">
          <Plus className="w-4 h-4 mr-1.5" /> Tambah UMKM
        </Button>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
              <h2 className="text-lg font-semibold text-slate-900">Tambah UMKM Baru</h2>
            <form onSubmit={create} className="space-y-3">
              <div><Label>Nama Toko</Label><Input required value={form.store_name} onChange={e => setForm({ ...form, store_name: e.target.value })} /></div>
              <div><Label>Email Login</Label><Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Password</Label><Input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
              <div><Label>Alamat</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>Telepon</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="border-t border-slate-200 pt-3">
                <h3 className="text-sm font-semibold text-[#0C2340]">Rekening Tujuan Pencairan</h3>
                <p className="mt-1 text-xs text-slate-500">Rekening disimpan menunggu verifikasi. Transfer belum aktif.</p>
                <div className="mt-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="umkm-bank-name">Bank / E-wallet</Label>
                    <select
                      id="umkm-bank-name"
                      required
                      value={form.bank_name}
                      onChange={e => setForm({ ...form, bank_name: e.target.value })}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-[#0A3663] focus:outline-none"
                    >
                      <option value="">Pilih bank tujuan</option>
                      <option value="BRI">Bank BRI</option>
                      <option value="Bank NTT">Bank NTT</option>
                      <option value="DANA">DANA</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="umkm-bank-account-number">
                      {form.bank_name === "DANA" ? "Nomor HP DANA" : "Nomor Rekening"}
                    </Label>
                    <Input
                      id="umkm-bank-account-number"
                      type="text"
                      inputMode={form.bank_name === "DANA" ? "tel" : "numeric"}
                      autoComplete="off"
                      minLength={6}
                      maxLength={64}
                      required
                      value={form.bank_account_number}
                      onChange={e => setForm({ ...form, bank_account_number: e.target.value })}
                      placeholder={form.bank_name === "DANA" ? "08xxxxxxxxxx" : ""}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="umkm-bank-account-name">
                      {form.bank_name === "DANA" ? "Nama Pemilik Akun DANA" : "Nama Pemilik Rekening"}
                    </Label>
                    <Input
                      id="umkm-bank-account-name"
                      autoComplete="off"
                      maxLength={255}
                      required
                      value={form.bank_account_name}
                      onChange={e => setForm({ ...form, bank_account_name: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Batal</Button>
                <Button type="submit" className="flex-1 bg-[#0A3663]">Simpan</Button>
              </div>
            </form>
            </div>
          </div>
        )}
      </div>

      <div className="relative max-w-xl">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cari nama toko, email, alamat, atau telepon..."
          aria-label="Cari UMKM"
          className="pl-9"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUmkms.map(u => (
          <Card key={u.id} className="p-5 border-[#E5DEC9]">
            <div className="flex items-start gap-3">
              <UmkmLogo logo={u.logo} storeName={u.store_name} />
              <div className="flex-1">
                <div className="font-display font-bold text-[#0C2340]">{u.store_name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{u.address}</div>
                <div className="text-xs text-slate-500">{u.phone}</div>
                {u.payout_account ? (
                  <div className="mt-2 text-xs text-slate-600">
                    {u.payout_account.bank_name} · {u.payout_account.masked_account_number}
                    <span className="ml-2 text-amber-700">
                      {u.payout_account.verification_status === "VERIFIED" ? "Terverifikasi" : "Menunggu verifikasi"}
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-500">Rekening pencairan belum didaftarkan</div>
                )}
              </div>
              <Badge className={u.active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>
                {u.active ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-500">Saldo</div>
                <div className="font-display font-bold text-[#0A3663]">{rp(u.balance)}</div>
              </div>
              <div className="flex gap-2">
                <Link to={`/admin/umkms/${u.id}/products`} className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium transition-colors hover:bg-slate-50">
                  <Eye className="w-3.5 h-3.5 mr-1" /> Produk
                </Link>
                <Button variant="outline" size="sm" onClick={() => toggle(u.id)}>
                  <Power className="w-3.5 h-3.5 mr-1" />
                  {u.active ? "Nonaktifkan" : "Aktifkan"}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => remove(u)} aria-label={`Hapus ${u.store_name}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {filteredUmkms.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
          Tidak ada UMKM yang cocok dengan pencarian.
        </div>
      )}
    </div>
  );
}