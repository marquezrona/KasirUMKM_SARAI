import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Waves } from "lucide-react";

export default function Login() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const googleButtonRef = useRef(null);
  const googleLoginRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";
  const { loginWithGoogle } = useAuth();
  googleLoginRef.current = loginWithGoogle;

  useEffect(() => {
    if (!googleClientId) return undefined;
    let active = true;
    let script = document.getElementById("google-identity-services");

    const renderGoogleButton = () => {
      const identity = window.google?.accounts?.id;
      if (!active || !identity || !googleButtonRef.current) return;

      identity.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          try {
            const signedInUser = await googleLoginRef.current(credential);
            toast.success(`Selamat datang, ${signedInUser.name}`);
          } catch (error) {
            toast.error(error.response?.data?.detail || "Login Google gagal");
          }
        },
      });
      googleButtonRef.current.replaceChildren();
      identity.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 320,
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else if (script) {
      script.addEventListener("load", renderGoogleButton);
    } else {
      script = document.createElement("script");
      script.id = "google-identity-services";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderGoogleButton);
      document.head.appendChild(script);
    }

    return () => {
      active = false;
      script?.removeEventListener("load", renderGoogleButton);
    };
  }, [googleClientId]);

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
          <img src="/hawupay-logo.svg" alt="Logo HawuPay" className="w-16 h-16 rounded-2xl mb-8" />
          <h1 className="font-display text-4xl md:text-5xl font-extrabold leading-[1.05] mb-4">
            Hawu<span className="text-[#E6A100]">Pay</span>
          </h1>
          <p className="text-white/80 mb-8">
            Waktunya UMKM Sabu Raijua beralih ke digital. Nikmati kemudahan bertransaksi secara modern lewat QRIS dan NFC.
          </p>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Waves className="w-4 h-4" />
            by : TRPL 25 POLIJE SABU RAIJUA
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
            <div className="-mt-2 flex justify-end">
              <Link to="/forgot-password" className="text-sm font-medium text-[#0A3663] hover:underline">
                Lupa Password?
              </Link>
            </div>
            <Button
              data-testid="login-submit"
              type="submit" disabled={loading}
              className="w-full bg-[#0A3663] hover:bg-[#0C2340] text-white h-11 rounded-full font-semibold"
            >
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="mt-5 border-t border-[#E5DEC9] pt-5">
            {googleClientId ? (
              <div ref={googleButtonRef} className="flex min-h-10 justify-center" aria-label="Login dengan Google" />
            ) : (
              <p className="text-center text-xs text-slate-500">Login Google belum aktif. Client ID Google perlu dikonfigurasi.</p>
            )}
          </div>

          <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs space-y-2">
            <div className="font-semibold text-amber-900">⚡ Akses Cepat (Klik untuk isi akun):</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => quickFill("admin@umkm.id", "admin123")}
                className="flex-1 py-1.5 px-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-amber-900 font-medium text-left transition-colors"
              >
                👑 <b>Admin:</b> admin@umkm.id
              </button>
              <button
                type="button"
                onClick={() => quickFill("sinar.raijua@umkm.id", "umkm123")}
                className="flex-1 py-1.5 px-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-amber-900 font-medium text-left transition-colors"
              >
                🏪 <b>UMKM:</b> sinar.raijua
              </button>
            </div>
          </div>

        </Card>
      </div>
    </div>
  );
}
