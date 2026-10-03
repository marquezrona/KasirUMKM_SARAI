import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const sendCode = async (event) => {
    event?.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/password-reset/request", { email });
      setStep("verify");
      toast.success("Jika email terdaftar, kode verifikasi sudah dikirim.");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Kode verifikasi gagal dikirim");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/auth/password-reset/verify-email", { email, code });
      setStep("pending");
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Kode verifikasi tidak valid");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-4">
      <Card className="w-full max-w-md border-[#E5DEC9] p-7">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[#0A3663]/10 text-[#0A3663]">
          {step === "pending" ? <ShieldCheck className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
        </div>
        <h1 className="font-display text-2xl font-bold text-[#0C2340]">
          {step === "pending" ? "Menunggu Persetujuan Admin" : "Lupa Password"}
        </h1>

        {step === "email" && (
          <form onSubmit={sendCode} className="mt-5 space-y-4">
            <p className="text-sm text-slate-600">Masukkan email yang terdaftar pada akun kasir. Kami akan mengirimkan kode verifikasi.</p>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email terdaftar</Label>
              <Input id="reset-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="email@umkm.id" />
            </div>
            <Button type="submit" disabled={busy} className="w-full bg-[#0A3663] hover:bg-[#0C2340]">
              {busy ? "Mengirim..." : "Kirim Kode Verifikasi"}
            </Button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={verifyCode} className="mt-5 space-y-4">
            <p className="text-sm text-slate-600">Masukkan kode 6 digit yang dikirim ke <strong>{email}</strong>.</p>
            <div className="space-y-2">
              <Label htmlFor="reset-code">Kode verifikasi</Label>
              <Input id="reset-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} placeholder="000000" />
            </div>
            <Button type="submit" disabled={busy || code.length !== 6} className="w-full bg-[#0A3663] hover:bg-[#0C2340]">
              {busy ? "Memverifikasi..." : "Verifikasi Email"}
            </Button>
            <button type="button" onClick={sendCode} disabled={busy} className="w-full text-sm font-medium text-[#0A3663] hover:underline">
              Kirim ulang kode
            </button>
          </form>
        )}

        {step === "pending" && (
          <div className="mt-4 space-y-4">
            <p className="text-sm leading-6 text-slate-600">Email Anda sudah terverifikasi. Permintaan sedang menunggu persetujuan admin. Jika disetujui, tautan untuk membuat password baru akan dikirim ke email terdaftar.</p>
            <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{email}</div>
          </div>
        )}

        <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#0A3663] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali ke login
        </Link>
      </Card>
    </div>
  );
}