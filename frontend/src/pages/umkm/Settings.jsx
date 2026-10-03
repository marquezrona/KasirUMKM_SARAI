import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const MAX_LOGO_DATA_URL_LENGTH = 55000;

async function compressLogo(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Logo tidak dapat diproses");

    let maxDimension = 640;
    for (let resizeAttempt = 0; resizeAttempt < 7; resizeAttempt += 1) {
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42]) {
        const compressedLogo = canvas.toDataURL("image/webp", quality);
        if (compressedLogo.length <= MAX_LOGO_DATA_URL_LENGTH) return compressedLogo;
      }
      maxDimension = Math.floor(maxDimension * 0.75);
    }

    throw new Error("Logo terlalu besar setelah dikompres");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function Settings() {
  const [form, setForm] = useState({ store_name: "", address: "", phone: "", logo: null });
  const [compressingLogo, setCompressingLogo] = useState(false);

  useEffect(() => { api.get("/umkm/settings").then(r => setForm({
    store_name: r.data.store_name, address: r.data.address || "", phone: r.data.phone || "", logo: r.data.logo
  })); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put("/umkm/settings", form);
      window.dispatchEvent(new CustomEvent("store-logo-updated", { detail: form.logo }));
      toast.success("Pengaturan disimpan");
    } catch (err) { toast.error(err.response?.data?.detail || "Gagal"); }
  };

  const selectLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Pilih file gambar yang valid");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran logo maksimal 2 MB");
      return;
    }
    setCompressingLogo(true);
    try {
      const logo = await compressLogo(file);
      setForm(previous => ({ ...previous, logo }));
    } catch (error) {
      toast.error(error.message || "Logo gagal diproses");
    } finally {
      setCompressingLogo(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-extrabold text-[#0C2340]">Pengaturan Toko</h1>
      <Card className="p-6 border-[#E5DEC9]">
        <form onSubmit={save} className="space-y-4">
          <div><Label>Nama Toko</Label><Input required value={form.store_name} onChange={e => setForm({ ...form, store_name: e.target.value })} /></div>
          <div><Label>Alamat</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div><Label>Telepon</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div>
            <Label>Logo atau Foto Toko</Label>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-[#E5DEC9] bg-[#0A3663]">
                {form.logo ? <img src={form.logo} alt="Preview logo toko" className="h-full w-full object-cover" /> : <ImagePlus className="h-7 w-7 text-[#E6A100]" />}
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex h-10 cursor-pointer items-center rounded-md bg-[#0A3663] px-4 text-sm font-medium text-white hover:bg-[#0C2340]">
                  {compressingLogo ? "Mengompres..." : "Pilih Gambar"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectLogo} className="sr-only" />
                </label>
                {form.logo && <Button type="button" variant="outline" onClick={() => setForm({ ...form, logo: null })}><Trash2 className="mr-1.5 h-4 w-4" />Hapus</Button>}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">Format PNG, JPG, atau WebP. Maksimal 2 MB.</p>
          </div>
          <Button type="submit" disabled={compressingLogo} className="bg-[#0A3663]">Simpan</Button>
        </form>
      </Card>
    </div>
  );
}