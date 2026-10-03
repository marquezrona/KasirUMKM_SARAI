import { useEffect, useState } from "react";
import { Check, KeyRound, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const formatDate = value => new Date(value).toLocaleString("id-ID");

export default function AdminPasswordResets() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get("/admin/password-reset-requests");
      setRequests(data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gagal memuat permintaan reset password");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const decide = async (request, decision) => {
    if (decision === "reject" && !window.confirm(`Tolak permintaan reset password untuk ${request.email}?`)) return;
    try {
      await api.post(`/admin/password-reset-requests/${request.id}/${decision}`, decision === "reject" ? { reason: "Permintaan ditolak oleh admin" } : {});
      toast.success(decision === "approve" ? "Disetujui. Tautan reset dikirim ke email kasir." : "Permintaan ditolak");
      load();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Keputusan gagal disimpan");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-[#0C2340]">Permintaan Reset Password</h1>
        <p className="mt-1 text-sm text-slate-500">Pastikan identitas kasir sesuai sebelum menyetujui permintaan.</p>
      </div>
      <div className="space-y-3">
        {requests.map(request => (
          <Card key={request.id} className="border-[#E5DEC9] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-[#0A3663]" />
                  <h2 className="font-semibold text-[#0C2340]">{request.name}</h2>
                  <Badge className="bg-amber-100 text-amber-800">Email terverifikasi</Badge>
                </div>
                <p className="text-sm text-slate-600">{request.email} · {request.store_name}</p>
                <p className="text-xs text-slate-500">Diminta: {formatDate(request.requested_at)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => decide(request, "reject")} className="border-red-200 text-red-700 hover:bg-red-50">
                  <X className="mr-1.5 h-4 w-4" /> Tolak
                </Button>
                <Button onClick={() => decide(request, "approve")} className="bg-emerald-600 hover:bg-emerald-700">
                  <Check className="mr-1.5 h-4 w-4" /> Setujui & Kirim Tautan
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {!loading && requests.length === 0 && (
          <Card className="border-dashed border-[#E5DEC9] p-10 text-center text-slate-500">Tidak ada permintaan reset password yang menunggu.</Card>
        )}
      </div>
    </div>
  );
}