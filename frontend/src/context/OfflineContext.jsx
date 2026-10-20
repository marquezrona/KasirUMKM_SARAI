import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, signTransaction } from "@/lib/api";
import { listOfflineTxns, removeOfflineTxn } from "@/lib/db";
import { toast } from "sonner";

const OfflineContext = createContext(null);

export function OfflineProvider({ children }) {
  const [online, setOnline] = useState(navigator.onLine);
  const [forceOffline, setForceOffline] = useState(false);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const effectiveOnline = online && !forceOffline;

  const refreshPending = useCallback(async () => {
    const q = await listOfflineTxns();
    setPending(q.length);
  }, []);

  const syncNow = useCallback(async () => {
    if (!effectiveOnline) return;
    const queue = await listOfflineTxns();
    if (queue.length === 0) return;
    setSyncing(true);
    for (const t of queue) {
      try {
        const signature = await signTransaction({
          clientTxnId: t.client_txn_id,
          total: t.total,
          deviceId: t.device_id,
          nonce: t.nonce,
        });
        const { data } = await api.post("/umkm/transactions", { ...t, signature });
        await removeOfflineTxn(t.client_txn_id);
        if (data.transaction?.id) {
          try {
            await api.post(`/umkm/transactions/${encodeURIComponent(data.transaction.id)}/print`);
          } catch (printError) {
            const detail = printError.response?.data?.detail || "printer termal tidak tersedia.";
            toast.error(`Transaksi berhasil disinkronkan, tetapi struk gagal dicetak: ${detail}`);
          }
        }
      } catch (e) {
        // if duplicate, remove locally
        if (e.response?.status === 409) {
          await removeOfflineTxn(t.client_txn_id);
        }
      }
    }
    setSyncing(false);
    await refreshPending();
  }, [effectiveOnline, refreshPending]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    refreshPending();
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, [refreshPending]);

  useEffect(() => {
    if (effectiveOnline) syncNow();
  }, [effectiveOnline, syncNow]);

  const toggleForceOffline = () => setForceOffline(v => !v);

  return (
    <OfflineContext.Provider value={{
      online: effectiveOnline, rawOnline: online, forceOffline,
      toggleForceOffline, pending, syncing, syncNow, refreshPending
    }}>
      {children}
    </OfflineContext.Provider>
  );
}

export const useOffline = () => useContext(OfflineContext);
