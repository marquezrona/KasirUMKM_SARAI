# Menjalankan Kasir UMKM dengan Laragon

Project ini menggunakan Laragon untuk MySQL. Backend-nya adalah Python/FastAPI dan frontend-nya React/Vite, jadi PHP dan Apache Laragon tidak digunakan untuk menjalankan aplikasi ini. Yang perlu aktif di Laragon adalah MySQL.

## 1. Siapkan MySQL Laragon

1. Buka Laragon dan klik **Start All** (pastikan MySQL aktif pada port `3306`).
2. Pastikan database `u731511898_hawupay` sudah dibuat.
3. Kredensial MySQL dikonfigurasi di `backend/.env`:

   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=u731511898_hawupay
   DB_USERNAME=u731511898_hawupay
   DB_PASSWORD=H4wUPay@Sabu
   ```

4. Tabel dan data awal aplikasi sudah tersimpan di database serta dicadangkan di `backend/database_dump.sql`. Dump tersebut adalah cadangan awal, bukan salinan otomatis dari perubahan terbaru.

Backend selalu menggunakan database yang ditentukan oleh `DB_*` di `backend/.env`. Jika MySQL yang dikonfigurasi tidak tersedia, backend sekarang berhenti dengan pesan error dan tidak diam-diam membuka database SQLite lain. SQLite lokal (`backend/local.db`) hanya digunakan bila konfigurasi koneksi MySQL tidak diisi. Pastikan MySQL Laragon aktif sebelum menjalankan aplikasi agar data yang sama selalu digunakan.

Saat backend berjalan, database MySQL dicadangkan otomatis sekali sehari ke folder `backend/backups` dalam format `.sql.gz`; backup terbaru hari itu menggantikan backup sebelumnya dan 30 backup harian terakhir disimpan. Cadangan pertama dibuat saat backend mulai berjalan. Perintah `mysqldump` perlu tersedia di PATH atau instalasi Laragon (atau atur `MYSQLDUMP_PATH` di `backend/.env`). Status backup terlihat pada log backend. File backup berisi seluruh data database; simpan folder ini di lokasi yang aman.

## 2. Menjalankan Backend

Buka PowerShell di folder project:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn server:app --host 127.0.0.1 --port 8001 --reload
```

Backend tersedia di `http://127.0.0.1:8001`.

## 3. Menjalankan Frontend

Buka terminal kedua:

```powershell
cd frontend
npm run dev
```

Frontend tersedia di `http://localhost:5173`.

## 4. Akun Default Super Admin

- **URL Login:** `http://localhost:5173/login`
- **Email:** `admin@umkm.id`
- **Password:** `admin123`
- **Dashboard Admin:** `http://localhost:5173/admin`
