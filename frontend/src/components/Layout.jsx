import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useOffline } from "@/context/OfflineContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, ShoppingCart, Package, Users, Receipt, BarChart3,
  Settings, LogOut, Wifi, WifiOff, Building2, Landmark, ScrollText,
  RefreshCw, Radio, Store, ClipboardCheck, MoreHorizontal
} from "lucide-react";

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/umkms", label: "UMKM", icon: Building2 },
  { to: "/admin/product-approvals", label: "Persetujuan Produk", icon: ClipboardCheck },
  { to: "/admin/transactions", label: "Transaksi", icon: Receipt },
  { to: "/admin/settlement", label: "Settlement", icon: Landmark },
  { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
  { to: "/admin/settings", label: "Pengaturan", icon: Settings },
];

const umkmNav = [
  { to: "/umkm", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/umkm/pos", label: "Kasir", icon: ShoppingCart },
  { to: "/umkm/products", label: "Produk", icon: Package },
  { to: "/umkm/customers", label: "Pelanggan", icon: Users },
  { to: "/umkm/transactions", label: "Transaksi", icon: Receipt },
  { to: "/umkm/reports", label: "Laporan", icon: BarChart3 },
  { to: "/umkm/settings", label: "Pengaturan", icon: Settings },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { online, forceOffline, toggleForceOffline, pending, syncing, syncNow } = useOffline();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [pendingProducts, setPendingProducts] = useState(0);
  const [storeLogo, setStoreLogo] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const nav = useNavigate();
  const isAdmin = user?.role === "admin";
  const items = isAdmin ? adminNav : umkmNav;
  const mobileItems = isAdmin ? adminNav.slice(0, 4) : umkmNav.slice(0, 4);
  const extraMobileItems = isAdmin ? adminNav.slice(4) : umkmNav.slice(4);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const loadPendingProducts = async () => {
      try {
        const { data } = await api.get("/admin/products?status=PENDING");
        setPendingProducts(data.length);
      } catch {
        setPendingProducts(0);
      }
    };
    loadPendingProducts();
    const timer = window.setInterval(loadPendingProducts, 30000);
    return () => window.clearInterval(timer);
  }, [isAdmin]);

  useEffect(() => {
    if (!user || isAdmin) return undefined;
    const updateLogo = event => setStoreLogo(event.detail || null);
    api.get("/umkm/settings").then(({ data }) => setStoreLogo(data.logo || null)).catch(() => setStoreLogo(null));
    window.addEventListener("store-logo-updated", updateLogo);
    return () => window.removeEventListener("store-logo-updated", updateLogo);
  }, [isAdmin, user]);

  const confirmLogout = async () => {
    setLogoutOpen(false);
    await logout();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <div className="tenun-border" />
      {/* top bar */}
      <header className="h-16 bg-white border-b border-[#E5DEC9] flex items-center px-4 sm:px-6 gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 overflow-hidden rounded-xl bg-[#0A3663] flex items-center justify-center">
            {storeLogo ? <img src={storeLogo} alt="Logo toko" className="h-full w-full object-cover" /> : <Store className="w-5 h-5 text-[#E6A100]" />}
          </div>
          <div>
            <div className="font-display font-bold text-[#0C2340] leading-tight">HawuPay</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#A63A2B]">Sabu Raijua</div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* offline indicator */}
          <div
            data-testid="conn-status"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              online ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {online ? "ONLINE" : "OFFLINE"}
          </div>

          <Button
            data-testid="toggle-offline-btn"
            variant="outline" size="sm"
            onClick={toggleForceOffline}
            className="hidden md:flex text-xs h-8"
          >
            <Radio className="w-3.5 h-3.5 mr-1.5" />
            {forceOffline ? "Hubungkan Kembali" : "Putuskan Sinyal"}
          </Button>

          {pending > 0 && (
            <Button
              data-testid="sync-now-btn"
              variant="outline" size="sm"
              onClick={syncNow}
              disabled={syncing || !online}
              className="text-xs h-8 border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
              {pending} menunggu sync
            </Button>
          )}

          <div className="hidden sm:flex flex-col items-end mr-1">
            <div className="text-xs font-semibold text-[#0C2340]">{user?.name}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              {isAdmin ? "Super Admin" : "UMKM"}
            </div>
          </div>
          <Button data-testid="logout-btn" variant="ghost" size="sm" onClick={() => setLogoutOpen(true)}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* sidebar */}
        <aside className="w-64 hidden md:block bg-white border-r border-[#E5DEC9] p-4">
          <nav className="space-y-1">
            {items.map(it => {
              const Ic = it.icon;
              return (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.end}
                  data-testid={`nav-${it.label.toLowerCase()}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#0A3663] text-white shadow-sm"
                        : "text-[#0C2340] hover:bg-[#F7F4EF]"
                    }`
                  }
                >
                  <Ic className="w-4 h-4" />
                  <span className="flex-1">{it.label}</span>
                  {it.to === "/admin/product-approvals" && pendingProducts > 0 && (
                    <Badge className="min-w-6 justify-center border-red-200 bg-red-100 px-1.5 text-red-700">
                      {pendingProducts > 99 ? "99+" : pendingProducts}
                    </Badge>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* content */}
        <main className="flex-1 p-3 pb-24 sm:p-6 sm:pb-6 lg:p-8 overflow-x-hidden">
          {forceOffline && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
              <strong>Mode Offline Aktif.</strong> Transaksi akan disimpan lokal dan disinkronkan saat koneksi kembali.
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {moreOpen && (
        <>
          <button type="button" aria-label="Tutup menu lainnya" className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={() => setMoreOpen(false)} />
          <div className="fixed inset-x-3 bottom-[4.75rem] z-50 rounded-2xl border border-[#E5DEC9] bg-white p-2 shadow-xl md:hidden">
            {extraMobileItems.map(item => {
              const Ic = item.icon;
              return (
                <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMoreOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${isActive ? "bg-[#0A3663] text-white" : "text-[#0C2340] hover:bg-[#F7F4EF]"}`}>
                  <Ic className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.to === "/admin/product-approvals" && pendingProducts > 0 && <Badge className="border-red-200 bg-red-100 text-red-700">{pendingProducts > 99 ? "99+" : pendingProducts}</Badge>}
                </NavLink>
              );
            })}
          </div>
        </>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5DEC9] bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(12,35,64,0.08)] backdrop-blur md:hidden" aria-label="Navigasi mobile">
        <div className="mx-auto grid h-16 max-w-md grid-cols-5">
          {mobileItems.map(item => {
            const Ic = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold ${isActive ? "text-[#0A3663]" : "text-slate-500"}`}
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex h-7 w-10 items-center justify-center rounded-xl ${isActive ? "bg-[#0A3663]/10" : ""}`}>
                      <Ic className="h-5 w-5" />
                    </span>
                    <span className="max-w-full truncate">{item.label}</span>
                    {item.to === "/admin/product-approvals" && pendingProducts > 0 && (
                      <span className="absolute right-2 top-1 h-4 min-w-4 rounded-full bg-red-600 px-1 text-center text-[9px] leading-4 text-white">
                        {pendingProducts > 99 ? "99+" : pendingProducts}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
          <button type="button" onClick={() => setMoreOpen(open => !open)} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold ${moreOpen ? "text-[#0A3663]" : "text-slate-500"}`}>
            <span className={`flex h-7 w-10 items-center justify-center rounded-xl ${moreOpen ? "bg-[#0A3663]/10" : ""}`}><MoreHorizontal className="h-5 w-5" /></span>
            <span>Lainnya</span>
          </button>
        </div>
      </nav>

      {logoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-[#0C2340]">Konfirmasi Keluar</h2>
            <p className="mt-2 text-sm text-slate-600">Apakah Anda yakin ingin keluar?</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setLogoutOpen(false)}>
                Batal
              </Button>
              <Button type="button" variant="destructive" onClick={confirmLogout}>
                Keluar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
