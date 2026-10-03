import { useEffect, useMemo, useState } from "react";
import { api, signTransaction, getDeviceId } from "@/lib/api";
import { cacheProducts, getCachedProducts, queueOfflineTxn } from "@/lib/db";
import { useOffline } from "@/context/OfflineContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Minus, Trash2, ShoppingBag, Nfc, QrCode, Package, X } from "lucide-react";
import NfcModal from "@/components/NfcModal";
import QrisModal from "@/components/QrisModal";
import Receipt from "@/components/Receipt";
import { toast } from "sonner";

const rp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

export default function Pos() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [nfcOpen, setNfcOpen] = useState(false);
  const [qrisOpen, setQrisOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const { online } = useOffline();

  const load = async () => {
    try {
      const { data } = await api.get("/umkm/products?approved_only=true");
      setProducts(data);
      await cacheProducts(data);
    } catch {
      const cached = await getCachedProducts();
      setProducts(cached);
    }
  };
  useEffect(() => { load(); }, []);

  const categories = useMemo(() => ["all", ...new Set(products.map(p => p.category || "Umum"))], [products]);
  const filtered = useMemo(() =>
    products.filter(p =>
      (cat === "all" || p.category === cat) &&
      (q.trim() === "" || p.name.toLowerCase().includes(q.trim().toLowerCase()) || (p.category || "").toLowerCase().includes(q.trim().toLowerCase()))
    ), [products, cat, q]);

  const addToCart = (p) => {
    if (p.stock <= 0) { toast.error("Stok habis"); return; }
    setCart(prev => {
      const ex = prev.find(x => x.product_id === p.id);
      if (ex) return prev.map(x => x.product_id === p.id ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { product_id: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  };
  const dec = (id) => setCart(prev => prev.flatMap(x => x.product_id === id ? (x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : []) : [x]));
  const inc = (id) => setCart(prev => prev.map(x => x.product_id === id ? { ...x, qty: x.qty + 1 } : x));
  const removeItem = (id) => setCart(prev => prev.filter(x => x.product_id !== id));

  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const total = subtotal;

  const submitTransaction = async ({ paymentMethod, nfcCardId, customerId }) => {
    if (cart.length === 0) return;
    const clientTxnId = crypto.randomUUID();
    const deviceId = getDeviceId();
    const nonce = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const signature = await signTransaction({ clientTxnId, total, deviceId, nonce });

    const payload = {
      client_txn_id: clientTxnId,
      items: cart,
      subtotal, discount: 0, total,
      payment_method: paymentMethod,
      customer_id: customerId || null,
      nfc_card_id: nfcCardId || null,
      device_id: deviceId,
      signature, nonce,
      created_at_client: createdAt,
      offline: false,
    };

    if (!online) {
      payload.offline = true;
      await queueOfflineTxn(payload);
      const localTxn = { ...payload, id: `OFFLINE-${clientTxnId.slice(0, 8)}`, status: "PAID", sync_status: "PENDING" };
      setReceipt(localTxn);
      setCart([]);
      toast.info("Transaksi disimpan offline. Akan disinkronkan saat online.");
      return;
    }

    try {
      const { data } = await api.post("/umkm/transactions", payload);
      setReceipt(data.transaction);
      setCart([]);
      load();
      toast.success("Pembayaran berhasil");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Transaksi gagal");
      throw err;
    }
  };

  if (receipt) {
    return <Receipt txn={receipt} onNew={() => setReceipt(null)} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ minHeight: "calc(100vh - 8rem)" }}>
      <div className="lg:col-span-8 flex flex-col">
        <div className="flex gap-3 items-center mb-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              data-testid="product-search"
              aria-label="Cari produk atau kategori"
              placeholder="Cari nama produk atau kategori..." value={q}
              onChange={e => setQ(e.target.value)}
              className="pl-9 pr-10"
            />
            {q && (
              <button
                type="button"
                aria-label="Hapus pencarian produk"
                title="Hapus pencarian"
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-[#0A3663]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                cat === c ? "bg-[#0A3663] text-white" : "bg-white text-[#0C2340] border border-[#E5DEC9] hover:bg-[#F7F4EF]"
              }`}
            >
              {c === "all" ? "Semua" : c}
            </button>
          ))}
        </div>
        <ScrollArea className="flex-1 pr-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(p => (
              <button
                key={p.id}
                data-testid={`product-${p.id}`}
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                className="pos-card text-left bg-white border border-[#E5DEC9] rounded-xl p-4 disabled:opacity-40"
              >
                <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-[#F7F4EF] to-[#FFF8E7] flex items-center justify-center mb-3">
                  {p.image ? (
                    <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <Package className="w-10 h-10 text-[#A63A2B]/40" />
                  )}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{p.category}</div>
                <div className="font-semibold text-sm text-[#0C2340] line-clamp-2 mt-0.5">{p.name}</div>
                <div className="flex justify-between items-end mt-2">
                  <div className="font-display font-extrabold text-[#0A3663]">{rp(p.price)}</div>
                  <div className="text-[10px] text-slate-500">Stok: {p.stock}</div>
                </div>
              </button>
            ))}
          </div>
          {filtered.length === 0 && <div className="text-center py-12 text-slate-500">Tidak ada produk.</div>}
        </ScrollArea>
      </div>

      {/* cart */}
      <Card className="lg:col-span-4 border-[#E5DEC9] p-5 flex flex-col" data-testid="cart-panel">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-5 h-5 text-[#0A3663]" />
          <h3 className="font-display font-bold text-[#0C2340]">Keranjang ({cart.length})</h3>
        </div>
        <ScrollArea className="flex-1 -mx-2 px-2" style={{ maxHeight: "40vh" }}>
          {cart.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-500">Belum ada produk di keranjang.</div>
          ) : (
            <div className="space-y-2">
              {cart.map(it => (
                <div key={it.product_id} className="flex items-center gap-2 py-2 border-b border-[#E5DEC9] last:border-0">
                  <div className="flex-1">
                    <div className="text-sm font-semibold line-clamp-1">{it.name}</div>
                    <div className="text-xs text-slate-500">{rp(it.price)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => dec(it.product_id)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-semibold">{it.qty}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => inc(it.product_id)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => removeItem(it.product_id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="mt-4 pt-4 border-t border-[#E5DEC9] space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-semibold">{rp(subtotal)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-semibold">Total</span>
            <span data-testid="cart-total" className="font-display text-2xl font-extrabold text-[#0A3663]">{rp(total)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              data-testid="pay-nfc-btn"
              disabled={cart.length === 0}
              onClick={() => setNfcOpen(true)}
              className="bg-[#7E22CE] hover:bg-[#6B21A8] h-12 rounded-xl"
            >
              <Nfc className="w-4 h-4 mr-1.5" /> Tap NFC
            </Button>
            <Button
              data-testid="pay-qris-btn"
              disabled={cart.length === 0}
              onClick={() => setQrisOpen(true)}
              className="bg-[#1E40AF] hover:bg-[#1E3A8A] h-12 rounded-xl"
            >
              <QrCode className="w-4 h-4 mr-1.5" /> QRIS
            </Button>
          </div>
        </div>
      </Card>

      <NfcModal open={nfcOpen} onOpenChange={setNfcOpen} total={total} onPay={submitTransaction} />
      <QrisModal open={qrisOpen} onOpenChange={setQrisOpen} total={total} onPay={submitTransaction} />
    </div>
  );
}
