# Menghubungkan sherlyndaps.my.id ke GitHub Pages

Repositori: https://github.com/dikadwi1005-ai/SepiPorto

## 1. Aktifkan GitHub Pages

Repositori SepiPorto sudah public saat diperiksa. GitHub Pages bisa dipakai dengan GitHub Free tanpa trial Enterprise.

1. Buka **Settings → Pages** di repositori.
2. Pada **Build and deployment → Source**, pilih **GitHub Actions**.
3. Pada **Custom domain**, masukkan `sherlyndaps.my.id`, lalu Save. Lakukan ini sebelum mengarahkan DNS.
4. Buka tab **Actions**, pilih workflow **Deploy Next.js portfolio to GitHub Pages**, lalu **Run workflow** pada branch `main`.

Workflow menyesuaikan base path berdasarkan konfigurasi Pages. Setelah domain diubah, jalankan ulang workflow. Dengan domain custom, root menjadi `/`. Tanpa domain custom, alamat project Pages menjadi `https://dikadwi1005-ai.github.io/SepiPorto/`.

## 2. Atur DNS di Sumopod

Buka **Domains → Manage** untuk `sherlyndaps.my.id`, lalu **DNS Management → Add Record**. Ini berlaku bila nameserver masih menggunakan Sumopod. Jika nameserver eksternal, kelola DNS di penyedia nameserver tersebut.

Tambahkan record berikut (TTL Auto/default):

| Type | Name/Host | Value/Target |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | dikadwi1005-ai.github.io |

Jika kolom host meminta domain lengkap, `@` berarti `sherlyndaps.my.id`, sedangkan `www` berarti `www.sherlyndaps.my.id`. Target CNAME tidak memakai `https://` dan tidak memakai nama repositori. Sesuaikan record A/AAAA/CNAME lama yang bertabrakan untuk host tersebut; pertahankan MX/TXT milik email atau verifikasi layanan yang masih dipakai.

## 3. Aktifkan HTTPS

Kembali ke **Settings → Pages**. Tunggu DNS check berhasil dan sertifikat tersedia, lalu aktifkan **Enforce HTTPS**. Propagasi DNS bisa memerlukan sampai 24–48 jam. Setelah workflow berhasil dan domain terverifikasi, kunjungi:

- https://sherlyndaps.my.id
- https://sherlyndaps.my.id/dashboard/

Saat menggunakan workflow GitHub Actions, pengaturan **Custom domain** di Pages yang menentukan domain; file CNAME di repo tidak diperlukan.

## Referensi resmi

- https://docs.sumopod.com/guides/domain/use-domain
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://nextjs.org/docs/app/guides/static-exports


## Verifikasi domain dari akun sebelumnya

Domain ini sebelumnya diverifikasi untuk sherlyndika-bit. Verifikasi tidak otomatis berpindah ke pemilik repo baru, dikadwi1005-ai. Jika GitHub menolak pemakaian domain karena masih diverifikasi akun lama, selesaikan pelepasan atau pemindahannya melalui GitHub Support. Setelah mendapatkan kode verifikasi baru, gunakan hostname dan nilai TXT persis dari akun baru.
