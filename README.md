# HawuPay

**HawuPay** adalah aplikasi kasir digital untuk membantu pelaku UMKM di Sabu Raijua mengelola penjualan dan operasional toko dalam satu aplikasi.

## Tentang proyek

Aplikasi menyediakan antarmuka kasir untuk UMKM dan area administrasi untuk pengelola. Pengguna dapat mengelola produk, pelanggan, transaksi, serta melihat ringkasan dan laporan penjualan. Antarmuka kasir juga mendukung alur pembayaran QRIS dan NFC, serta penyimpanan transaksi sementara saat perangkat offline yang dapat disinkronkan kembali ketika online.

## Fitur

- **Kasir UMKM:** pencarian produk, keranjang belanja, dan pencatatan transaksi.
- **Pengelolaan toko:** produk, pelanggan, transaksi, pengaturan, dan laporan.
- **Administrasi:** dashboard, pengelolaan akun dan UMKM, persetujuan produk, pemantauan transaksi, dan audit aktivitas.
- **Pembayaran:** alur pembayaran QRIS dan NFC.
- **Dukungan offline:** antrean transaksi saat offline dan sinkronisasi saat koneksi kembali.
- **Akun:** autentikasi serta alur pemulihan kata sandi.

## Teknologi

- **Frontend:** React, Vite, Tailwind CSS, dan React Router.
- **Backend:** Python, FastAPI, dan Uvicorn.
- **Integrasi:** REST API dan WebSocket.

## Struktur proyek

```text
backend/   Layanan API
frontend/  Aplikasi web
```

## Menjalankan secara lokal

Persiapkan Python, Node.js, dan npm. Sebelum menjalankan aplikasi, atur konfigurasi backend dan alamat API frontend secara lokal sesuai kebutuhan lingkungan Anda. Jangan menaruh kredensial atau konfigurasi privat di README atau commit Git.

Siapkan dan jalankan backend di terminal pertama:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn server:app --host 127.0.0.1 --port 8001 --reload
```

Jalankan frontend di terminal kedua:

```powershell
cd frontend
npm install
npm run dev
```

Setelah keduanya berjalan, buka alamat frontend yang ditampilkan oleh Vite di terminal.

## Pemeriksaan layanan

Backend menyediakan endpoint pemeriksaan kesehatan yang dapat dibuka ketika layanan berjalan:

```text
http://127.0.0.1:8001/api/health
```

## Keamanan

README ini hanya menjelaskan aplikasi dan cara menjalankannya. Jangan mengunggah file `.env`, kredensial, data pengguna, dump atau salinan database, maupun cadangan yang berisi data privat ke repositori publik.
