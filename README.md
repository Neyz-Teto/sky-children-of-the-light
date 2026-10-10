# Sky — sebuah perjalanan cahaya

Situs penggemar berbahasa Indonesia untuk **Sky: Children of the Light**. Isinya menelusuri enam Realm, Spirit, Season, fakta pilihan, dan galeri pratinjau dari trailer resmi. Situs ini bukan produk resmi dan tidak berafiliasi dengan thatgamecompany.

## Menjalankan di komputer

Perlu Node.js 22 atau lebih baru dan pnpm.

```bash
pnpm install
pnpm dev
```

Untuk membuat versi statis:

```bash
pnpm build
pnpm preview
```

Hasil build berada di `dist/`.

## Mengubah isi

- Edit Realm di `src/data/realms.json`.
- Edit tipe Spirit dan Season di `src/data/spirits.json`.
- Edit fakta dan sumbernya di `src/data/facts.json`.
- Edit susunan galeri di `src/data/gallery.json`.
- Catatan per slot media, sumber, dan status ada di `src/data/media.json`.

## Menambahkan media milik sendiri

Situs mencoba berkas lokal lebih dulu, lalu kembali ke thumbnail resmi YouTube atau placeholder jika berkas belum tersedia. Letakkan gambar WebP/AVIF sesuai nama di kolom Local pada [MEDIA_README.md](MEDIA_README.md). Video hero opsional dapat diletakkan di `public/media/hero/hero.mp4`. Gunakan hanya rekaman yang kamu buat atau aset yang penggunaannya memang diizinkan. Jangan mengekstrak aset dari file game.

## Deploy

Workflow GitHub Actions di `.github/workflows/pages.yml` membuat situs statis dan menerbitkan folder `dist/` ke GitHub Pages setiap ada push ke `main`. Nama pemilik dan repositori diambil otomatis dari konteks GitHub Actions; path dasar juga diatur agar situs bekerja di subpath repositori.

## Kredit dan hak cipta

Semua gambar dan video milik thatgamecompany. Video ditampilkan melalui player YouTube resmi dan thumbnail berasal dari host thumbnail YouTube; situs ini tidak mengunduh trailer. Font DM Sans dan Instrument Serif di-self-host melalui paket Fontsource.

Sky: Children of the Light dan seluruh materi visualnya adalah milik pemiliknya. Situs penggemar tidak resmi. Tidak berafiliasi dengan thatgamecompany. Pemegang hak dapat mengajukan permintaan penghapusan melalui [Issues](../../issues) repositori ini.
