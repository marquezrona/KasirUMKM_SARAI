import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Nfc, Loader2 } from "lucide-react";
import { toast } from "sonner";

const rp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
export default function NfcModal({ open, onOpenChange, total, onPay }) {
  const [stage, setStage] = useState("scanning"); // scanning | detected | processing
  const [card, setCard] = useState(null);
  const [cardInput, setCardInput] = useState("");
  const [customer, setCustomer] = useState(null);
  const [readerError, setReaderError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const readerRef = useRef(null);
  const scanAbortRef = useRef(null);

  useEffect(() => {
    if (!open) {
      scanAbortRef.current?.abort();
      setStage("scanning");
      setCard(null);
      setCardInput("");
      setCustomer(null);
      setReaderError("");
      setPaymentError("");
    }
  }, [open]);

  const readCard = async (cardId) => {
    const normalizedCardId = String(cardId).trim();
    if (!normalizedCardId || lookupLoading) return;
    setLookupLoading(true);
    try {
      const { data } = await api.get(`/umkm/customers/by-card/${encodeURIComponent(normalizedCardId)}`);
      setCard(normalizedCardId);
      setCustomer(data);
      setPaymentError("");
      setStage("detected");
      scanAbortRef.current?.abort();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Kartu tidak dikenal");
      setStage("scanning");
    } finally {
      setLookupLoading(false);
    }
  };

  const submitCardInput = (event) => {
    event.preventDefault();
    readCard(cardInput);
  };

  const startScan = async () => {
    setStage("scanning");
    setReaderError("");
    if (!("NDEFReader" in window)) {
      setReaderError("NFC browser tidak tersedia. Gunakan kolom ID kartu untuk pembaca USB atau coba Chrome di Android.");
      return;
    }
    try {
      const reader = new window.NDEFReader();
      const controller = new AbortController();
      readerRef.current = reader;
      scanAbortRef.current = controller;
      reader.addEventListener("reading", event => {
        const cardId = event.serialNumber || event.message?.records?.[0]?.data;
        if (cardId) readCard(typeof cardId === "string" ? cardId : new TextDecoder().decode(cardId));
      }, { once: true });
      await reader.scan({ signal: controller.signal });
    } catch (err) {
      if (err.name !== "AbortError") setReaderError(err.message || "NFC tidak dapat diaktifkan.");
    }
  };

  useEffect(() => {
    if (open) startScan();
    return () => scanAbortRef.current?.abort();
  }, [open]);

  const confirm = async () => {
    setStage("processing");
    setPaymentError("");
    try {
      await onPay({ paymentMethod: "NFC", nfcCardId: card, customerId: customer.id });
      onOpenChange(false);
    } catch (err) {
      setPaymentError(err.response?.data?.detail || err.message || "Pembayaran gagal. Silakan coba lagi.");
      setStage("detected");
    }
  };

  const cancel = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Nfc className="w-5 h-5 text-[#7E22CE]" /> Tap Kartu NFC
          </DialogTitle>
        </DialogHeader>

        <div className="text-center py-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total</div>
          <div className="font-display text-4xl font-extrabold text-[#0A3663] mb-4">{rp(total)}</div>

          {stage === "scanning" && (
            <>
              <div className="py-8 flex flex-col items-center">
                <div className="relative w-24 h-24 rounded-full bg-[#7E22CE]/10 flex items-center justify-center nfc-ripple">
                  <Nfc className="w-10 h-10 text-[#7E22CE]" />
                </div>
                <div className="mt-6 font-semibold text-[#7E22CE]">Tempelkan kartu ke alat NFC</div>
                <div className="mt-2 text-sm text-slate-500">Tempelkan ke reader USB, atau gunakan NFC browser.</div>
                {readerError && <div className="mt-4 max-w-sm rounded bg-red-50 p-3 text-xs text-red-700">{readerError}</div>}
                <form onSubmit={submitCardInput} className="mt-5 w-full space-y-2 text-left">
                  <label htmlFor="nfc-card-id" className="text-xs font-semibold text-slate-600">ID kartu (reader USB)</label>
                  <Input
                    id="nfc-card-id"
                    value={cardInput}
                    onChange={event => setCardInput(event.target.value)}
                    placeholder="Tempel kartu; ID akan terbaca di sini"
                    autoComplete="off"
                    autoFocus
                  />
                  <div className="text-xs text-slate-500">Jika ID tidak langsung dicari, tekan Enter atau tombol Cari Kartu.</div>
                  <Button type="submit" disabled={!cardInput.trim() || lookupLoading} className="w-full bg-[#7E22CE] hover:bg-[#6B21A8]">
                    {lookupLoading ? "Mencari..." : "Cari Kartu"}
                  </Button>
                </form>
              </div>
              <Button type="button" variant="outline" onClick={cancel} className="w-full mt-4">
                Kembali
              </Button>
            </>
          )}

          {stage === "detected" && customer && (
            <Card className="p-4 bg-[#7E22CE]/5 border-[#7E22CE]/30 text-left">
              <div className="text-xs font-bold uppercase text-[#7E22CE]">Kartu Terdeteksi</div>
              <div className="font-display font-bold text-lg mt-1">{customer.name}</div>
              <div className="font-mono text-sm text-slate-600">{customer.nfc_card_masked}</div>
              <div className="mt-3 flex justify-between">
                <div>
                  <div className="text-xs text-slate-500">Saldo sebelum</div>
                  <div className="font-semibold">{rp(customer.balance)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Saldo setelah</div>
                  <div className="font-semibold text-[#0A3663]">{rp(customer.balance - total)}</div>
                </div>
              </div>
              {customer.balance < total && (
                <div className="mt-3 text-xs text-red-700 bg-red-50 p-2 rounded">Saldo tidak cukup!</div>
              )}
              {paymentError && (
                <div role="alert" className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">
                  Pembayaran gagal: {paymentError}
                </div>
              )}
              <Button
                data-testid="confirm-nfc-btn"
                onClick={confirm}
                disabled={customer.balance < total}
                className="w-full mt-4 bg-[#7E22CE] hover:bg-[#6B21A8]"
              >
                Konfirmasi Pembayaran
              </Button>
              <Button type="button" variant="outline" onClick={cancel} className="w-full mt-2">
                Kembali
              </Button>
            </Card>
          )}

          {stage === "processing" && (
            <div className="py-8 flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-[#7E22CE] animate-spin" />
              <div className="mt-4 text-sm text-slate-600">Memproses...</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
