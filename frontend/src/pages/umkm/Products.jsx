import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ImagePlus, Package, Plus, Pencil, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const rp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

const empty = { name: "", description: "", category: "Umum", price: 0, stock: 0, image: null };
const MAX_PRODUCT_IMAGE_LENGTH = 55_000;

async function compressProductImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("Pilih file gambar yang valid");
  if (file.size > 8 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 8 MB");

  const objectUrl = URL.createObjectURL(file);
  try {
    const sourceImage = new Image();
    sourceImage.src = objectUrl;
    await sourceImage.decode();

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Gambar tidak dapat diproses");

    let maxDimension = 640;
    for (let resizeAttempt = 0; resizeAttempt < 6; resizeAttempt += 1) {
      const scale = Math.min(1, maxDimension / Math.max(sourceImage.naturalWidth, sourceImage.naturalHeight));
      canvas.width = Math.max(1, Math.round(sourceImage.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(sourceImage.naturalHeight * scale));
      context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42]) {
        const compressedImage = canvas.toDataURL("image/webp", quality);
        if (compressedImage.length <= MAX_PRODUCT_IMAGE_LENGTH) return compressedImage;
      }
      maxDimension = Math.floor(maxDimension * 0.75);
    }

    throw new Error("Gambar terlalu besar setelah dikompres");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const load = async () => {
    const { data } = await api.get("/umkm/products");
    setProducts(data);
  };
  useEffect(() => { load(); }, []);

  const filteredProducts = products.filter(product => {
    const value = query.trim().toLowerCase();
    return !value || product.name.toLowerCase().includes(value) || (product.category || "").toLowerCase().includes(value);
  });

  const openNew = () => { setForm(empty); setEditing(null); setOpen(true); };
  const openEdit = (p) => { setForm({ name: p.name, description: p.description || "", category: p.category, price: p.price, stock: p.stock, image: p.image }); setEditing(p.id); setOpen(true); };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const image = await compressProductImage(file);
      setForm(current => ({ ...current, image }));
    } catch (error) {
      toast.error(error.message || "Gambar gagal diproses");
    } finally {
      event.target.value = "";
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const body = { ...form, price: Number(form.price), stock: Number(form.stock) };
    try {
      if (editing) await api.put(`/umkm/products/${editing}`, body);
      else await api.post("/umkm/products", body);
      toast.success(editing ? "Produk diperbarui" : "Pengajuan produk dikirim ke admin untuk persetujuan");
      setOpen(false);
      load();
    } catch (err) { toast.error(err.response?.data?.detail || "Gagal"); }
  };

  const del = async (id) => {
    if (!window.confirm("Hapus produk ini?")) return;
    await api.delete(`/umkm/products/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl font-extrabold text-[#0C2340]">Produk</h1>
        <>
          <Button data-testid="add-product-btn" onClick={openNew} className="bg-[#0A3663] rounded-full">
            <Plus className="w-4 h-4 mr-1.5" /> Tambah Produk
          </Button>
          {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
                <h2 className="text-lg font-semibold text-slate-900">{editing ? "Edit Produk" : "Tambah Produk"}</h2>
            <form onSubmit={save} className="space-y-3">
              <div><Label>Nama</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Kategori</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Harga (Rp)</Label><Input type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                <div><Label>Stok</Label><Input type="number" required value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
              </div>
              <div><Label>Deskripsi</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-2">
                <Label htmlFor="product-image">Gambar Produk (opsional)</Label>
                <div className="flex items-center gap-3">
                  {form.image && (
                    <img
                      src={form.image}
                      alt={`Pratinjau ${form.name || "produk"}`}
                      className="h-20 w-20 rounded-md border border-slate-200 object-cover"
                    />
                  )}
                  <label
                    htmlFor="product-image"
                    className="flex min-h-20 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <ImagePlus className="h-4 w-4" />
                    {form.image ? "Ganti gambar" : "Pilih gambar"}
                    <input
                      id="product-image"
                      type="file"
                      accept="image/*"
                      aria-label="Pilih gambar produk"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </label>
                  {form.image && (
                    <Button type="button" variant="outline" onClick={() => setForm(current => ({ ...current, image: null }))}>
                      Hapus
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-500">Maksimal file 8 MB. Gambar dikompres otomatis.</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Kembali
                </Button>
                <Button type="submit" className="flex-1 bg-[#0A3663]">Simpan</Button>
              </div>
            </form>
              </div>
            </div>
          )}
        </>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          data-testid="products-search"
          aria-label="Cari produk atau kategori"
          placeholder="Cari nama produk atau kategori..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9 pr-10"
        />
        {query && (
          <button
            type="button"
            aria-label="Hapus pencarian produk"
            title="Hapus pencarian"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-[#0A3663]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Card className="border-[#E5DEC9] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Harga</TableHead>
              <TableHead className="text-right">Stok</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3 font-semibold">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                      {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-slate-400" />}
                    </div>
                    {p.name}
                  </div>
                </TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell className="text-right font-mono">{rp(p.price)}</TableCell>
                <TableCell className="text-right">{p.stock}</TableCell>
                <TableCell>
                  <Badge className={p.approval_status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : p.approval_status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}>
                    {p.approval_status === "APPROVED" ? "Disetujui" : p.approval_status === "REJECTED" ? "Ditolak" : "Menunggu"}
                  </Badge>
                  {p.approval_note && <div className="mt-1 text-xs text-slate-500">{p.approval_note}</div>}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del(p.id)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan="6" className="py-10 text-center text-slate-500">
                  Tidak ada produk yang cocok dengan pencarian.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
