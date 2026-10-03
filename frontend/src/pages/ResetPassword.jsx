import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (password !== confirmation) {
      toast.error("Konfirmasi password tidak sama");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/auth/password-reset/complete", { token, password });
      toast.success(data.message);
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Password gagal diubah");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-4">
      <Card className="w-full max-w-md border-[#E5DEC9] p-7">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[#0A3663]/10 text-[#0A3663]">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="font-display text-2xl font-bold text-[#0C2340]">Buat Password Baru</h1>
        {!token ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-slate-600">Tautan reset tidak ditemukan atau tidak valid.</p>
            <Link to="/forgot-password" className="inline-flex items-center gap-2 text-sm font-medium text-[#0A3663] hover:underline">
              Minta reset password <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <p className="text-sm text-slate-600">Buat password minimal 8 karakter. Tautan ini hanya dapat digunakan sekali.</p>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password baru</Label>
              <Input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Ulangi password baru</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={event => setConfirmation(event.target.value)} />
            </div>
            <Button type="submit" disabled={busy} className="w-full bg-[#0A3663] hover:bg-[#0C2340]">
              {busy ? "Menyimpan..." : "Simpan Password Baru"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}