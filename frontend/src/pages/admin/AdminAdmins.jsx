import { useEffect, useState } from "react";
import { Plus, Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const emptyForm = { name: "", email: "", password: "" };

export default function AdminAdmins() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/admin/admins");
      setAdmins(data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gagal memuat akun admin");
    }
  };
  useEffect(() => { load(); }, []);

  const createAdmin = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/admins", form);
      toast.success("Akun admin berhasil ditambahkan");
      setForm(emptyForm);
      setOpen(false);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gagal menambahkan admin");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-[#0C2340]">Akun Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola akun yang memiliki akses ke halaman admin.</p>
        </div>
        <Button data-testid="add-admin-btn" onClick={() => { setForm(emptyForm); setOpen(true); }} className="bg-[#0A3663] hover:bg-[#0C2340]">
          <UserPlus className="mr-1.5 h-4 w-4" /> Tambah Admin
        </Button>
      </div>

      <Card className="overflow-hidden border-[#E5DEC9]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email Login</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Dibuat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map(admin => (
              <TableRow key={admin.id}>
                <TableCell className="font-semibold">{admin.name}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0A3663]">
                    <Shield className="h-4 w-4" /> Admin
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm text-slate-500">
                  {new Date(admin.created_at).toLocaleDateString("id-ID")}
                </TableCell>
              </TableRow>
            ))}
            {admins.length === 0 && (
              <TableRow><TableCell colSpan="4" className="py-10 text-center text-slate-500">Belum ada akun admin.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md border-slate-200 p-5 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0A3663]/10 text-[#0A3663]">
                <UserPlus className="h-4 w-4" />
              </div>
              <h2 className="font-display text-lg font-bold text-[#0C2340]">Tambah Admin Baru</h2>
            </div>
            <form onSubmit={createAdmin} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="admin-name">Nama</Label>
                <Input id="admin-name" autoComplete="name" minLength={2} maxLength={255} required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Email Login</Label>
                <Input id="admin-email" type="email" autoComplete="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Password awal</Label>
                <Input id="admin-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
                <p className="text-xs text-slate-500">Minimal 8 karakter.</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Batal</Button>
                <Button type="submit" disabled={saving} className="flex-1 bg-[#0A3663] hover:bg-[#0C2340]">
                  <Plus className="mr-1.5 h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Admin"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}