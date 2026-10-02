import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Store, Waves } from "lucide-react";

export default function Login() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/umkm"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    try {
      const u = await login(email, password);
      toast.success(`Selamat datang, ${u.name}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login gagal");
    }
  };

  const quickFill = (em, pw) => { setEmail(em); setPassword(pw); };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* left visual */}
      <div className="md:w-1/2 bg-[#0A3663] relative overflow-hidden hidden md:flex items-center justify-center p-12">
        <div className="tenun-border absolute top-0 left-0 right-0" />
        <div className="tenun-border absolute bottom-0 left-0 right-0" />
        <div className="relative z-10 max-w-md text-white">
          <div className="w-16 h-16 rounded-2xl bg-[#E6A100] flex items-center justify-center mb-8">
            <Store className="w-8 h-8 text-[#0C2340]" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold leading-[1.05] mb-4">
            Hawu<span className="text-[#E6A100]">Pay</span>
          </h1>
          <p className="text-white/80 mb-8">
            Sistem kasir digital untuk UMKM Kabupaten Sabu Raijua. Pembayaran NFC & QRIS, offline-first, siap dipakai di lapangan.
          </p>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Waves className="w-4 h-4" />
            Terinspirasi Tenun Ikat & Laut Sawu
          </div>
        </div>
      </div>

      {/* login form */}
      <div className="md:w-1/2 flex items-center justify-center p-6 bg-[#FAF8F5]">
        <Card className="w-full max-w-md p-8 border-[#E5DEC9]">
          <h2 className="font-display text-2xl font-bold text-[#0C2340] mb-1">Masuk ke akun</h2>
          <p className="text-sm text-slate-600 mb-6">Gunakan akun admin atau akun UMKM.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                data-testid="login-email"
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@umkm.id" required
              />
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  data-testid="login-password"
                  type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required className="pr-11"
                />
                <button
                  type="button"
                  data-testid="toggle-password-visibility"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  onClick={() => setShowPassword(value => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-[#0A3663]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              data-testid="login-submit"
              type="submit" disabled={loading}
              className="w-full bg-[#0A3663] hover:bg-[#0C2340] text-white h-11 rounded-full font-semibold"
            >
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E5DEC9]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Akun demo</div>
            <div className="space-y-1.5">
              <button
                type="button"
                data-testid="demo-admin"
                onClick={() => quickFill("admin@umkm.id", "admin123")}
                className="w-full text-left text-xs bg-[#0A3663]/5 hover:bg-[#0A3663]/10 px-3 py-2 rounded-md flex justify-between"
              >
                <span className="font-semibold">Super Admin</span>
                <span className="text-slate-500">admin@umkm.id</span>
              </button>
              <button
                type="button"
                data-testid="demo-umkm-1"
                onClick={() => quickFill("sinar.raijua@umkm.id", "umkm123")}
                className="w-full text-left text-xs bg-[#A63A2B]/5 hover:bg-[#A63A2B]/10 px-3 py-2 rounded-md flex justify-between"
              >
                <span className="font-semibold">Toko Sinar Raijua</span>
                <span className="text-slate-500">sinar.raijua@umkm.id</span>
              </button>
              <button
                type="button"
                onClick={() => quickFill("tenun.seba@umkm.id", "umkm123")}
                className="w-full text-left text-xs bg-[#A63A2B]/5 hover:bg-[#A63A2B]/10 px-3 py-2 rounded-md flex justify-between"
              >
                <span className="font-semibold">Tenun Ikat Seba</span>
                <span className="text-slate-500">tenun.seba@umkm.id</span>
              </button>
            </div>
            <div className="mt-3 text-[11px] text-slate-500">
              Password admin: <code className="font-mono">admin123</code> · Password UMKM: <code className="font-mono">umkm123</code>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
