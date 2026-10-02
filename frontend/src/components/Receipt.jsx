import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Printer, ShoppingCart, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const rp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

export default function Receipt({ txn, onNew }) {
  const { user } = useAuth();

  const print = () => window.print();
  const downloadPdf = () => {
    // Print-to-PDF via browser print dialog is the simplest zero-dep path.
    window.print();
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6 border-[#E5DEC9]" id="receipt">
        <div className="text-center border-b border-dashed border-[#E5DEC9] pb-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
          <div className="font-display text-lg font-extrabold text-[#0C2340]">Pembayaran Berhasil</div>
          <div className="text-xs text-slate-500 mt-1">HAWUPAY</div>
        </div>

        <div className="py-4 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-slate-500">Toko</span><span className="font-semibold">{user?.name}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Tanggal</span><span>{new Date(txn.created_at).toLocaleString("id-ID")}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">ID</span><span className="font-mono text-xs">{txn.id}</span></div>
        </div>

        <div className="border-t border-dashed border-[#E5DEC9] py-3">
          {txn.items.map((it, i) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span>{it.qty}× {it.name}</span>
              <span className="font-mono">{rp(it.price * it.qty)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-[#E5DEC9] pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{rp(txn.subtotal)}</span></div>
          <div className="flex justify-between font-display font-extrabold text-lg text-[#0A3663]">
            <span>TOTAL</span><span>{rp(txn.total)}</span>
          </div>
          <div className="flex justify-between mt-2"><span className="text-slate-500">Pembayaran</span><span className="font-semibold">{txn.payment_method}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Status</span>
            <span className={`font-semibold ${txn.sync_status === "SYNCED" ? "text-emerald-600" : "text-amber-600"}`}>
              {txn.sync_status === "SYNCED" ? "SYNCED" : "OFFLINE (menunggu sync)"}
            </span>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-500 mt-4 pt-3 border-t border-dashed border-[#E5DEC9]">
          Terima kasih. Sampai jumpa lagi!<br />
          Kabupaten Sabu Raijua · NTT
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2 mt-4 print:hidden">
        <Button data-testid="new-txn-btn" onClick={onNew} className="bg-[#0A3663] hover:bg-[#0C2340]">
          <ShoppingCart className="w-4 h-4 mr-1" /> Baru
        </Button>
        <Button variant="outline" onClick={print}>
          <Printer className="w-4 h-4 mr-1" /> Cetak
        </Button>
        <Button variant="outline" onClick={downloadPdf}>
          <Download className="w-4 h-4 mr-1" /> PDF
        </Button>
      </div>
    </div>
  );
}
