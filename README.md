# Sherlynda — Next.js portfolio

Portofolio pink glass dengan sidebar koleksi, kartu album, animasi, jurnal visual, dan dashboard editor. Dibangun dengan Next.js App Router, React, dan CSS. Source profil berada di data/portfolio.json.

## Menjalankan lokal

Gunakan Node.js 22 atau lebih baru:

    npm ci
    npm run dev

Buka http://localhost:3000 untuk portofolio, http://localhost:3000/dashboard/ untuk editor. Proyek Next.js dijalankan melalui server; jangan membuka source JSX atau HTML lama lewat file://.

## Build & verifikasi

    npm test
    npm run build

Build menghasilkan folder out/ untuk hosting statis. next.config.mjs memakai output: export dan trailingSlash. NEXT_PUBLIC_BASE_PATH mengatur prefix untuk GitHub project Pages; domain custom memakai prefix kosong.

## Dashboard dan publikasi isi

Dashboard mengedit profil, pendidikan, pengalaman magang, organisasi opsional, kontak, foto profil, dokumentasi, dan tiga foto galeri. Draf tersimpan otomatis di browser; preview memakai route React /preview/. Foto JPG/PNG/WebP maksimal 10 MB diperkecil hingga sisi terpanjang 1200 piksel.

- Backup data mengunduh JSON untuk berpindah perangkat atau memulihkan draf.
- Ekspor perubahan mengunduh portfolio.json. Ganti file data/portfolio.json di GitHub dengan hasil tersebut lalu commit.
- Workflow GitHub Actions otomatis test, build, dan deploy setelah Pages diaktifkan.

Editor ini lokal tanpa akun/backend. Menggunakan Next.js static export tidak menambahkan penyimpanan server. Draf tidak otomatis mengubah repositori atau konten untuk pengunjung lain. Jika penyimpanan penuh, gunakan backup sebelum menutup browser. Backup versi HTML sebelumnya dapat diimpor ke dashboard baru. Draf file:// atau domain lama tidak otomatis pindah origin; ekspor backup dan impor pada domain baru.

## GitHub Pages & domain

Workflow ada di .github/workflows/deploy-pages.yml. Pilih Settings → Pages → Source: GitHub Actions sebelum menjalankan workflow. Repo private membutuhkan paket GitHub yang mendukung Pages; GitHub Free memerlukan repo public.

Panduan khusus sherlyndaps.my.id dan DNS Sumopod ada di [DOMAIN.md](DOMAIN.md). Domain belum aktif hanya dengan menambahkan source ini; pemilik perlu mengaktifkan Pages dan mengatur DNS.