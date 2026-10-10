# Panduan media

Thumbnail video diambil langsung dari host thumbnail YouTube dan setiap video dimuat dengan embed `youtube-nocookie.com` setelah pengunjung memilihnya. Hero memakai IFrame API dalam keadaan mute; jika `public/media/hero/hero.mp4` tersedia, file lokal itu dipakai sebagai gantinya. Hak atas video dan thumbnail tetap pada pemiliknya; tidak ada trailer yang disimpan di repositori.

Press kit tertaut dari situs resmi thatgamecompany, tetapi halaman yang tersedia tidak menjelaskan izin pemakaian ulang untuk situs penggemar. Karena itu, aset press kit tidak diunduh. Slot Spirit yang belum memiliki visual terverifikasi tetap menampilkan ilustrasi senja buatan CSS/SVG.

## Daftar slot

| Slot | Status | Nama file lokal yang dipakai otomatis |
|---|---|---|
| `hero-video` | Terverifikasi · Steam Launch Trailer | `public/media/hero/hero.mp4` |
| `realm-isle-of-dawn` | Terverifikasi · Season of Prophecy | `public/media/realms/isle-of-dawn.webp` |
| `realm-daylight-prairie` | Terverifikasi · Season of Sanctuary | `public/media/realms/daylight-prairie.webp` |
| `realm-hidden-forest` | Terverifikasi · Season of Assembly | `public/media/realms/hidden-forest.webp` |
| `realm-valley-of-triumph` | Terverifikasi · Season of Dreams | `public/media/realms/valley-of-triumph.webp` |
| `realm-golden-wasteland` | Terverifikasi · Season of Abyss | `public/media/realms/golden-wasteland.webp` |
| `realm-vault-of-knowledge` | Placeholder · belum ada video khusus yang terverifikasi | `public/media/realms/vault-of-knowledge.webp` |
| `spirit-regular` | Placeholder | `public/media/spirits/regular-spirit.webp` |
| `spirit-seasonal` | Placeholder | `public/media/spirits/seasonal-spirit.webp` |
| `spirit-elder` | Placeholder | `public/media/spirits/elder.webp` |
| `spirit-guide` | Placeholder | `public/media/spirits/season-guide.webp` |
| `season-prophecy` | Terverifikasi · Official trailer | `public/media/seasons/prophecy.webp` |
| `season-sanctuary` | Terverifikasi · Official trailer | `public/media/seasons/sanctuary.webp` |
| `season-assembly` | Terverifikasi · Official trailer | `public/media/seasons/assembly.webp` |
| `season-dreams` | Terverifikasi · Official trailer | `public/media/seasons/dreams.webp` |
| `season-abyss` | Terverifikasi · Official trailer | `public/media/seasons/abyss.webp` |
| `season-remembrance` | Terverifikasi · Official trailer | `public/media/seasons/remembrance.webp` |
| `fact-stars` | Terverifikasi · Official trailer | `public/media/facts/stars.webp` |
| `fact-sanctuary` | Terverifikasi · Official trailer | `public/media/facts/social-world.webp` |
| `fact-prophecy` | Terverifikasi · Official trailer | `public/media/facts/isle.webp` |
| `fact-islands` | Terverifikasi · Official trailer | `public/media/facts/islands.webp` |
| `fact-treehouse` | Terverifikasi · Official trailer | `public/media/facts/treehouse.webp` |
| `fact-skater` | Terverifikasi · Official trailer | `public/media/facts/skater.webp` |
| `fact-depths` | Terverifikasi · Official trailer | `public/media/facts/abyss.webp` |
| `fact-stories` | Terverifikasi · Official trailer | `public/media/facts/remembrance.webp` |
| `fact-anniversary` | Terverifikasi · Steam Launch Trailer | `public/media/facts/sky-world.webp` |
| `fact-platforms` | Terverifikasi · Steam Launch Trailer | `public/media/facts/platforms.webp` |
| `gallery-isle` | Terverifikasi · Official trailer | `public/media/gallery/isle-of-dawn.webp` |
| `gallery-prairie` | Terverifikasi · Official trailer | `public/media/gallery/daylight-prairie.webp` |
| `gallery-forest` | Terverifikasi · Official trailer | `public/media/gallery/hidden-forest.webp` |
| `gallery-valley` | Terverifikasi · Official trailer | `public/media/gallery/valley-of-triumph.webp` |
| `gallery-wasteland` | Terverifikasi · Official trailer | `public/media/gallery/golden-wasteland.webp` |
| `gallery-vault` | Placeholder · belum ada visual khusus yang terverifikasi | `public/media/gallery/vault-of-knowledge.webp` |
| `gallery-seasons` | Terverifikasi · Season of Flight | `public/media/gallery/seasons.webp` |
| `gallery-video` | Terverifikasi · Steam Launch Trailer | `public/media/gallery/official-trailer.webp` |

## Menambahkan gambar sendiri

Gunakan nama file tepat seperti tabel dan letakkan di folder yang disebutkan. Tidak perlu mengubah kode. Format WebP atau AVIF disarankan, lebar maksimum 2000 px, ukuran sebaiknya di bawah 400 KB. Slot lokal dicoba lebih dulu; jika file tidak ditemukan, situs kembali ke thumbnail resmi atau placeholder senja.

Untuk mengganti video hero, letakkan rekaman milikmu di `public/media/hero/hero.mp4`. Gunakan MP4/H.264, maksimum 1080p, kompres hingga di bawah sekitar 8 MB. HandBrake: preset Fast 1080p30, format MP4, Video Encoder H.264 (x264), dan aktifkan Web Optimized. File akan muted, loop, inline, memakai poster YouTube sebagai cadangan, dan berhenti saat hero tidak terlihat.

Rekam gameplay sendiri dari perangkatmu dengan perekam layar bawaan, atur 1080p, lalu hindari musik berlisensi bila rekaman akan dipublikasikan. Pastikan orang lain yang terlihat atau terdengar telah menyetujui rekamannya.

## Kredit

Semua gambar dan video milik thatgamecompany. Video resmi ditautkan dari [kanal YouTube thatgamecompany](https://www.youtube.com/@thatskygame). Trailer tidak diunduh atau di-host ulang. Placeholder dibuat khusus untuk situs ini dan bukan aset dari game.
