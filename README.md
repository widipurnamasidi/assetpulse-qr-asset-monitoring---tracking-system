# ⚡ AssetPulse — Enterprise Asset Monitoring & Tracking System

Selamat datang di repositori **AssetPulse**! Panduan ini disusun dengan bahasa yang santun dan terstruktur untuk membantu rekan-rekan pengembang, teknisi, maupun administrator dalam memasang, mengonfigurasi, dan menjalankan aplikasi ini di komputer lokal dengan lancar.

---

## 📋 Daftar Isi

1. [Tentang AssetPulse](#tentang-assetpulse)
2. [Prasyarat Sistem](#prasyarat-sistem)
3. [Panduan Memulai (Clone atau Download ZIP)](#panduan-memulai)
   - [Opsi A: Mengkloning melalui Git](#opsi-a-mengkloning-melalui-git)
   - [Opsi B: Mengunduh melalui Arsip ZIP](#opsi-b-mengunduh-melalui-arsip-zip)
4. [Instalasi Dependensi](#instalasi-dependensi)
5. [Konfigurasi Environment Variable (.env)](#konfigurasi-environment-variable-env)
6. [Menjalankan Aplikasi](#menjalankan-aplikasi)
7. [Arsitektur Sistem & Struktur Folder](#arsitektur-sistem--struktur-folder)
8. [Penjelasan Rute (Routes) dan Pengendali (Controllers)](#penjelasan-rute-routes-dan-pengendali-controllers)
   - [Alur Routing Gateway (`server/routes/index.ts`)](#1-alur-routing-gateway-serverroutesindexts)
   - [Modul Aset (`server/routes/assetRoutes.ts` & `server/controllers/assetController.ts`)](#2-modul-aset-inventaris--pemindaian-qr)
   - [Modul Autentikasi (`server/routes/authRoutes.ts` & `server/controllers/authController.ts`)](#3-modul-autentikasi--2fa-google-smtp)
   - [Modul Jejak Audit (`server/routes/auditRoutes.ts` & `server/controllers/auditController.ts`)](#4-modul-jejak-audit-kriptografi-audit-trail)
   - [Modul Ekspor Spreadsheet (`server/routes/exportRoutes.ts` & `server/controllers/exportController.ts`)](#5-modul-ekspor-laporan-exceljs)
9. [Route Model Binding & Transaksi Atomik](#route-model-binding--transaksi-atomik)
10. [Akun Uji Coba Default](#akun-uji-coba-default)

---

## Tentang AssetPulse

**AssetPulse** adalah platform pemantauan dan pelacakan aset kelas perusahaan (_enterprise_) yang dirancang khusus untuk memenuhi standar ketat tata kelola logistik dan audit industri:

- 📷 **Pemindaian QR Code Real-Time**: Alur peminjaman (_checkout_), pengembalian (_check-in_), dan inspeksi audit lapangan melalui kamera laptop/smartphone.
- 🔗 **Buku Besar Audit Append-Only**: Pencatatan transaksi berbasis rantai hash SHA-256 ala blockchain yang kebal terhadap manipulasi riwayat (_tamper-proof_).
- 📊 **Ekspor Laporan Multiformat**: Pembuatan dokumen spreadsheet Microsoft Excel bergaya rapi via ExcelJS dan dokumen berita acara PDF via jsPDF.
- 🔐 **Autentikasi & 2FA Terverifikasi**: Keamanan berlapis menggunakan enkripsi kata sandi Bcrypt, token sesi JWT, serta kode OTP 6-digit yang dikirim langsung melalui **Nodemailer Google SMTP** (dengan fallback antrean simulasi aman).

---

## Prasyarat Sistem

Sebelum memulai instalasi, pastikan lingkungan komputer Anda telah terpasang:

- **Node.js**: Versi LTS v20.19.x atau yang lebih baru ([Unduh Node.js](https://nodejs.org/)). Vite 8 tidak mendukung Node.js 18.
- **npm** (biasanya otomatis terpasang bersama Node.js) atau **Bun** / **Yarn** / **pnpm**.
- **Web Browser Modern**: Google Chrome, Mozilla Firefox, Microsoft Edge, atau Safari dengan izin akses kamera aktif.

Untuk memeriksa versi Node.js di terminal atau command prompt:

```bash
node -v
npm -v
```

---

## Panduan Memulai

Anda dipersilakan memilih salah satu dari dua cara berikut untuk mendapatkan kode sumber aplikasi ke dalam komputer Anda.

### Opsi A: Mengkloning melalui Git

Jika Anda telah menginstal Git di komputer Anda, silakan buka Terminal (Linux/macOS) atau Git Bash/Command Prompt (Windows), lalu jalankan perintah berikut:

1. **Kloning repositori:**

   ```bash
   git clone <URL_REPOSITORI_ANDA>
   ```

2. **Masuk ke direktori proyek:** `cd assetpulse-tracking`

---

### Opsi B: Mengunduh melalui Arsip ZIP

Apabila Anda mengunduh file proyek dalam format `.zip`:

1. **Ekstrak Arsip:** Klik kanan pada file `.zip` yang telah diunduh, lalu pilih **Extract All...** (di Windows) atau klik dua kali (di macOS), atau jalankan `unzip nama-file-proyek.zip` pada terminal Linux.
2. **Buka Folder Proyek:**  
   Buka folder hasil ekstraksi tersebut menggunakan teks editor favorit Anda (seperti **Visual Studio Code**).
3. **Buka Terminal:**  
   Di VS Code, Anda dapat menekan kombinasi tombol `Ctrl` + `` ` `` (atau menu **Terminal** > **New Terminal**).

---

## Instalasi Dependensi

Jalankan perintah berikut di dalam direktori utama proyek untuk memasang seluruh pustaka
pustaka pendukung (seperti Express, React, Vite, Tailwind CSS, ExcelJS, jsPDF, Nodemailer, Bcrypt, dsb.):

```bash
npm install
```

_Tunggu beberapa saat hingga seluruh dependensi selesai dipasang._

Pastikan terminal sedang berada di folder yang berisi `package.json`. Pada Git Bash Windows, gunakan path berikut:

```bash
cd "/c/Users/sitikomariyah/Downloads/assetpulse-qr-asset-monitoring-&-tracking-system"
```

---

## Konfigurasi Environment Variable (.env)

Aplikasi menyediakan template konfigurasi `.env.example`. Salin template tersebut menjadi `.env` dan jangan commit `.env` karena dapat berisi secret:

**Pada sistem Windows (Command Prompt):**

```cmd
copy .env.example .env
```

**Pada sistem Linux / macOS / Git Bash:**

```bash
cp .env.example .env
```

Berikut adalah penjelasan parameter konfigurasi di dalam file `.env`:

| Variabel                   | Keterangan                                              | Nilai Standar / Contoh               |
| :------------------------- | :------------------------------------------------------ | :----------------------------------- |
| `PORT`                     | Port server aplikasi Express & Vite                     | `3000`                               |
| `NODE_ENV`                 | Mode aplikasi                                           | `development`                        |
| `JWT_SECRET`               | Kunci rahasia untuk menandatangani token sesi login JWT | Secret acak panjang                  |
| `GOOGLE_SMTP_USER`         | Alamat email Gmail untuk pengiriman kode OTP 2FA        | `teknisi-ops@gmail.com` _(opsional)_ |
| `GOOGLE_SMTP_APP_PASSWORD` | Sandi Aplikasi Google 16-digit (App Password)           | `abcd efgh ijkl mnop` _(opsional)_   |
| `APP_URL`                  | URL basis host aplikasi saat di-deploy                  | `http://localhost:3000`              |
| `DISABLE_HMR`              | Menonaktifkan HMR dan file watching Vite                | `false`                              |
| `GEMINI_API_KEY`           | Kunci integrasi Gemini (opsional)                       | Kosong                               |

> 💡 **Catatan Ramah Mengenai Google SMTP:**  
> Jika Anda belum mengisi `GOOGLE_SMTP_USER` atau `GOOGLE_SMTP_APP_PASSWORD`, Anda tidak perlu khawatir! Sistem AssetPulse secara cerdas akan mengaktifkan **Mode Simulasi Email Aman**. Kode OTP 6-digit akan dicatat secara transparan di panel **Security Center** pada antarmuka web, sehingga Anda tetap dapat menguji login 2FA dengan nyaman.

---

## Menjalankan Aplikasi

### 1. Mode Pengembangan (Development)

Untuk menjalankan server backend Express beserta frontend Vite secara bersamaan dalam mode interaktif:

```bash
npm run dev
```

Setelah server menyala, Anda akan melihat pesan:

```text
⚡ AssetPulse Core System running on http://0.0.0.0:3000
```

Buka browser Anda dan kunjungi: **`http://localhost:3000`**.

Biarkan terminal ini tetap terbuka. Hentikan server dengan `Ctrl+C`. Jangan menjalankan `npm run dev` kedua kali pada port yang sama; jika muncul `EADDRINUSE`, berarti server sebelumnya masih aktif.

### 2. Validasi Tipe & Kode (Linting)

Untuk memastikan tidak ada kesalahan tipe TypeScript pada proyek:

```bash
npm run lint
```

### 3. Kompilasi & Menjalankan Mode Produksi (Production)

```bash
# 1. Kompilasi aset frontend React menjadi file statis teroptimasi
npm run build

# 2. Jalankan server produksi dengan NODE_ENV=production
npm start
```

Server production menyajikan hasil build dari folder `dist` dan tetap melayani API Express pada port yang sama. Buka **`http://localhost:3000`** atau nilai `APP_URL` yang Anda gunakan.

Untuk menguji hasil build tanpa menjalankan API, gunakan `npm run preview`. Untuk deployment nyata, gunakan `npm run build` lalu `npm start`; jangan memakai `npm run dev`.

### 4. Validasi Cepat dan Troubleshooting

Jalankan pemeriksaan berikut setelah instalasi atau sebelum deployment:

```bash
npm run lint
npm run build
```

Jika port 3000 sedang digunakan pada Windows, cari prosesnya dari Git Bash:

```bash
netstat -ano | grep -E ':3000|:24678'
taskkill //PID <PID> //F
```

Setelah itu jalankan kembali `npm run dev` atau `npm start`. Jika browser tidak dapat mengakses kamera QR, izinkan akses kamera untuk `localhost`.

---

## Arsitektur Sistem & Struktur Folder

Proyek ini menerapkan arsitektur **Model-View-Controller (MVC)** berlapis dengan pemisahan tanggung jawab yang rapi:

```text
├── .env.example                     # Berkas contoh konfigurasi lingkungan
├── index.html                       # Titik masuk HTML utama frontend
├── package.json                     # Daftar paket dependensi dan script npm
├── server.ts                        # Titik masuk utama aplikasi (Express + Vite Server)
│
├── server/                          # LAPISAN BACKEND MVC
│   ├── controllers/                 # Logika bisnis & pemformat respons HTTP
│   │   ├── assetController.ts       # Penangan inventaris, checkout, checkin, & audit
│   │   ├── auditController.ts       # Penangan log audit & verifikasi kriptografi
│   │   ├── authController.ts        # Penangan login, 2FA, OTP SMTP, & ganti sandi
│   │   └── exportController.ts      # Penangan pembuatan dokumen Excel via ExcelJS
│   │
│   ├── middleware/                  # Perantara request & keamanan
│   │   ├── authMiddleware.ts        # Verifikasi token JWT & proteksi peran (RBAC)
│   │   └── routeModelBinding.ts     # Prapemuatan model ke req.asset / req.auditLog
│   │
│   ├── models/                      # Skema data, entitas, & transaksi atomik
│   │   ├── Asset.ts                 # Model data entitas aset & katalog inventaris
│   │   ├── AuditLog.ts              # Model buku besar transaksi append-only
│   │   ├── TransactionSession.ts    # Pola transaksi atomik commit/rollback (ACID)
│   │   └── User.ts                  # Model pengguna, sandi Bcrypt, & OTP
│   │
│   ├── routes/                      # Definisi rute URL Express
│   │   ├── index.ts                 # Router pusat pengarah endpoint (/api)
│   │   ├── assetRoutes.ts           # Rute /api/assets
│   │   ├── auditRoutes.ts           # Rute /api/audit
│   │   ├── authRoutes.ts            # Rute /api/auth
│   │   └── exportRoutes.ts          # Rute /api/export
│   │
│   ├── services/                    # Layanan pendukung backend
│   │   ├── cryptoService.ts         # Perhitungan SHA-256 & verifikasi rantai audit
│   │   ├── mailerService.ts         # Integrasi Nodemailer dengan Google SMTP
│   │   └── qrService.ts             # Generator QR Code resolusi tinggi (Base64)
│   │
│   └── types/                       # Definisi tipe antarmuka TypeScript
│       └── index.ts
│
└── src/                             # LAPISAN FRONTEND (REACT + VITE + TAILWIND)
    ├── App.tsx                      # Komponen induk tampilan & pengatur tab
    ├── main.tsx                     # Mounting React DOM ke elemen #root
    ├── index.css                    # Definisi gaya Tailwind CSS v4
    ├── components/                  # Komponen antarmuka pengguna
    │   ├── AssetDetailModal.tsx     # Modal detail lengkap aset
    │   ├── AssetTable.tsx           # Tabel inventaris master & filter
    │   ├── AuditTrailView.tsx       # Tampilan buku besar audit & visualisasi rantai hash
    │   ├── AuthModal.tsx            # Form dialog login, 2FA OTP, & forgot password
    │   ├── CheckinModal.tsx         # Form pengembalian aset & inspeksi kondisi
    │   ├── CheckoutModal.tsx        # Form peminjaman aset keluar ke teknisi
    │   ├── DashboardMetrics.tsx     # Kartu statistik ringkasan inventaris
    │   ├── FieldAuditModal.tsx      # Form audit fisik & penangkapan GPS
    │   ├── FieldAuditStation.tsx    # Stasiun audit cepat bagi teknisi lapangan
    │   ├── Navbar.tsx               # Navigasi atas & status profil
    │   ├── NewAssetModal.tsx        # Form pendaftaran aset baru
    │   ├── PrintQRModal.tsx         # Label stiker QR siap cetak ukuran standar
    │   ├── QRScannerModal.tsx       # Pemindai QR kamera interaktif (html5-qrcode)
    │   └── SecurityCenter.tsx       # Monitor audit integritas & log pengiriman OTP
    │
    └── services/                    # Klien API frontend
        ├── api.ts                   # Pemanggil endpoint backend Express via fetch
        └── pdfReportService.ts      # Generator sertifikat audit & laporan PDF
```

---

## Penjelasan Rute (Routes) dan Pengendali (Controllers)

Untuk memahami bagaimana sebuah permintaan (_request_) dari peramban diproses oleh sistem, berikut rincian pemetaan antara file rute dan file controller:

```text
[Klien / Frontend]
       │
       ▼
[server.ts] (Mengarahkan seluruh awalan '/api' ke router pusat)
       │
       ▼
[server/routes/index.ts] (Gateway Router)
   ├── /api/auth   ──► [server/routes/authRoutes.ts]   ──► [server/controllers/authController.ts]
   ├── /api/assets ──► [server/routes/assetRoutes.ts]  ──► [server/controllers/assetController.ts]
   ├── /api/audit  ──► [server/routes/auditRoutes.ts]  ──► [server/controllers/auditController.ts]
   └── /api/export ──► [server/routes/exportRoutes.ts] ──► [server/controllers/exportController.ts]
```

---

### 1. Alur Routing Gateway (`server/routes/index.ts`)

- **Lokasi Berkas**: `server/routes/index.ts`
- **Fungsi**: Bertindak sebagai pintu gerbang (_gateway_) utama. Mengelompokkan seluruh sub-rute berdasarkan domain modul bisnisnya.
- **Rute yang tersedia**:
  - `GET /api/health` ➔ Memeriksa status kesehatan server backend (_diagnostic healthcheck_).

---

### 2. Modul Aset (Inventaris & Pemindaian QR)

- **File Rute**: `server/routes/assetRoutes.ts`
- **File Controller**: `server/controllers/assetController.ts`
- **Perantara (Middleware)**: `server/middleware/routeModelBinding.ts`

| Metode HTTP | Endpoint                           | Fungsi Controller | Deskripsi Alur Kerja                                                                                                                                    |
| :---------: | :--------------------------------- | :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
|    `GET`    | `/api/assets`                      | `listAssets`      | Mengambil seluruh daftar inventaris aset beserta metrik ringkasan dan kategori. Mendukung filter pencarian, status, dan lokasi.                         |
|    `GET`    | `/api/assets/:assetId`             | `getAsset`        | Mengambil rincian aset tunggal. Model telah diambil lebih dulu oleh `bindAssetById` ke dalam `req.asset`.                                               |
|    `GET`    | `/api/assets/tag/:assetTag`        | `scanAssetTag`    | Pencarian instan berdasarkan kode QR atau nomor tag hasil pemindaian kamera. Model diikat oleh `bindAssetByTag`.                                        |
|   `POST`    | `/api/assets`                      | `createAsset`     | Mendaftarkan aset baru, membuat kode QR digital beresolusi tinggi, dan menyisipkan catatan audit dalam satu sesi transaksi atomik.                      |
|   `POST`    | `/api/assets/:assetId/checkout`    | `checkoutAsset`   | Memproses peminjaman aset kepada teknisi (mengubah status menjadi `checked_out`, mencatat penanggung jawab/custody, dan menambahkan riwayat transaksi). |
|   `POST`    | `/api/assets/:assetId/checkin`     | `checkinAsset`    | Memproses pengembalian aset ke gudang, melakukan inspeksi fisik, dan memperbarui status aset menjadi tersedia atau pemeliharaan.                        |
|   `POST`    | `/api/assets/:assetId/field-audit` | `fieldAuditAsset` | Melakukan audit lapangan secara langsung dengan menyertakan koordinat GPS Geolocation (latitude, longitude, akurasi) dan catatan kondisi fisik.         |

---

### 3. Modul Autentikasi & 2FA (Google SMTP)

- **File Rute**: `server/routes/authRoutes.ts`
- **File Controller**: `server/controllers/authController.ts`
- **Perantara (Middleware)**: `server/middleware/authMiddleware.ts`

| Metode HTTP | Endpoint                    | Fungsi Controller | Deskripsi Alur Kerja                                                                                                          |
| :---------: | :-------------------------- | :---------------- | :---------------------------------------------------------------------------------------------------------------------------- |
|   `POST`    | `/api/auth/login`           | `login`           | Memvalidasi kecocokan email dan hash sandi Bcrypt. Jika 2FA aktif, memicu pembuatan OTP 6-digit yang dikirim via Google SMTP. |
|   `POST`    | `/api/auth/verify-2fa`      | `verify2FA`       | Memvalidasi kode OTP 6-digit. Jika sesuai dan belum kedaluwarsa, menerbitkan token sesi JWT dengan masa aktif 7 hari.         |
|   `POST`    | `/api/auth/resend-otp`      | `resendOtp`       | Mengirimkan ulang kode OTP baru jika teknisi belum menerima email sebelumnya.                                                 |
|   `POST`    | `/api/auth/forgot-password` | `forgotPassword`  | Mengirimkan kode pemulihan sandi 6-digit ke email teknisi tanpa membocorkan eksistensi pengguna ke pihak luar.                |
|   `POST`    | `/api/auth/reset-password`  | `resetPassword`   | Memperbarui kata sandi lama menjadi sandi baru menggunakan verifikasi kode pemulihan yang valid.                              |
|    `GET`    | `/api/auth/me`              | `getMe`           | Mengambil informasi profil teknisi/petugas yang sedang login (dilindungi middleware `requireAuth`).                           |
|    `GET`    | `/api/auth/smtp-logs`       | `getSmtpLogs`     | Mengambil riwayat pengiriman email SMTP untuk inspeksi keamanan dan kemudahan pengujian mandiri.                              |
|    `GET`    | `/api/auth/technicians`     | `listTechnicians` | Mengambil daftar seluruh teknisi resmi yang terdaftar untuk keperluan penugasan peminjaman aset.                              |

---

### 4. Modul Jejak Audit Kriptografi (Audit Trail)

- **File Rute**: `server/routes/auditRoutes.ts`
- **File Controller**: `server/controllers/auditController.ts`
- **Layanan Pendukung**: `server/services/cryptoService.ts`

| Metode HTTP | Endpoint            | Fungsi Controller      | Deskripsi Alur Kerja                                                                                                                       |
| :---------: | :------------------ | :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
|    `GET`    | `/api/audit`        | `listAuditLogs`        | Mengambil seluruh log transaksi append-only yang tersimpan di buku besar beserta status integritas kriptografisnya.                        |
|    `GET`    | `/api/audit/verify` | `verifyAuditIntegrity` | Menjalankan algoritma verifikasi berantai (_blockchain verification_) terhadap seluruh blok hash SHA-256 dari Genesis hingga blok terkini. |
|    `GET`    | `/api/audit/:logId` | `getAuditLogById`      | Mengambil rincian 1 transaksi audit tertentu (data diikat otomatis via `bindAuditLogById`).                                                |

---

### 5. Modul Ekspor Laporan (ExcelJS)

- **File Rute**: `server/routes/exportRoutes.ts`
- **File Controller**: `server/controllers/exportController.ts`

| Metode HTTP | Endpoint                   | Fungsi Controller   | Deskripsi Alur Kerja                                                                                                                         |
| :---------: | :------------------------- | :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------- |
|    `GET`    | `/api/export/audit/excel`  | `exportAuditExcel`  | Menghasilkan berkas spreadsheet Microsoft Excel (`.xlsx`) resmi berisi buku besar audit lengkap dengan header, border, dan pewarnaan status. |
|    `GET`    | `/api/export/assets/excel` | `exportAssetsExcel` | Mengunduh daftar registri master inventaris seluruh aset ke dalam format spreadsheet Excel (`.xlsx`).                                        |

---

## Route Model Binding & Transaksi Atomik

Aplikasi ini dibangun dengan mengedepankan efisiensi dan keamanan data tingkat tinggi:

### 1. Route Model Binding (`server/middleware/routeModelBinding.ts`)

Pada controller tradisional, kode sering kali harus melakukan pencarian basis data berulang di setiap fungsi (`await Asset.findById(req.params.id)`), kemudian memeriksa apakah data ada atau tidak.  
Dengan Route Model Binding:

- Express mencegat parameter seperti `:assetId` atau `:assetTag`.
- Middleware mengambil entitas model dan menyematkannya langsung ke `req.asset`.
- Jika data tidak ditemukan, middleware langsung menghentikan request dan merespons dengan status `404 Not Found`. Controller hanya menerima data yang sudah pasti ada dan valid.

### 2. Pola Transaksi Sesi Atomik (`server/models/TransactionSession.ts`)

Meniru mekanisme transaksi Mongoose / MongoDB Session Transactions:

- Operasi multi-langkah (misalnya: memperbarui status aset, menetapkan penanggung jawab, dan menulis log audit) dibungkus di dalam fungsi `withTransaction(async (session) => { ... })`.
- Apabila terjadi kendala teknis di salah satu tahapan, mekanisme pembatalan (_rollback_) otomatis dieksekusi secara berurutan terbalik sehingga basis data tidak akan pernah berada dalam kondisi setengah terbarui.

---

## Akun Uji Coba Default

Untuk memudahkan Anda mencoba seluruh fitur (termasuk fitur role-based access control), sistem telah menyediakan akun pengguna awal:

| Peran (Role)   | Nama          | Alamat Email                       | Kata Sandi Standar | Status 2FA  |
| :------------- | :------------ | :--------------------------------- | :----------------: | :---------: |
| **Admin**      | Marcus Vance  | `marcus.vance@assetpulse.internal` | `AssetPulse2026!`  |    Aktif    |
| **Technician** | Alex Rivera   | `alex.rivera@fieldops.com`         | `AssetPulse2026!`  |    Aktif    |
| **Manager**    | Elena Rostova | `elena.rostova@operations.com`     | `AssetPulse2026!`  |    Aktif    |
| **Auditor**    | David Chen    | `david.chen@compliance.org`        | `AssetPulse2026!`  | Tidak Aktif |

> 📌 **Catatan saat Login 2FA:**  
> Ketika Anda login dengan akun yang memiliki fitur 2FA aktif (seperti akun Marcus atau Alex), modal verifikasi 6-digit akan muncul. Anda dapat melihat kode OTP yang dikirimkan pada tab **Security Center** atau menggunakan tombol bantuan pengisian otomatis yang disediakan di antarmuka web.

---

## 🤝 Penutup & Dukungan

Terima kasih telah menggunakan **AssetPulse Enterprise Asset Monitoring & Tracking System**. Semoga aplikasi ini dapat membantu mempermudah manajemen logistik, pengawasan kondisi fisik, dan kepatuhan audit organisasi Anda dengan sebaik-baiknya.

Apabila Anda memiliki pertanyaan atau masukan, jangan ragu untuk berdiskusi dengan tim pengembang. Selamat berkarya! ✨
