# IoT at Home — Discover. Design. Build.

Platform belajar IoT yang mengubah ide menjadi proyek nyata: daftar komponen, estimasi budget,
wiring, source code, build guide, testing, troubleshooting, My Build, shopping list, dan AI Builder —
lengkap dengan **Admin Dashboard** terintegrasi.

> Prototype frontend-only. Semua data disimpan di **LocalStorage** browser yang sama untuk website
> dan dashboard. Tidak ada backend, API AI, atau analytics real-time.

## Menjalankan

Tidak butuh build step. Jalankan static server dari root project:

```bash
python3 -m http.server 3000 --bind 0.0.0.0
```

Buka:

- Website: `http://localhost:3000/index.html`
- Admin: `http://localhost:3000/admin.html`

## Admin login (prototype)

| Field | Value |
| --- | --- |
| Username | `admin` |
| Password | `admin` |

Kredensial dapat diganti di **Settings → Admin account**. Password disimpan sebagai teks biasa di
LocalStorage — ini **bukan keamanan produksi** dan hanya untuk demo lokal.

## Struktur

```text
index.html              Website utama (hash router)
admin.html              Admin dashboard (login + SPA)
assets/css/style.css    Design system bersama
assets/css/admin.css    Layout dashboard admin
assets/js/common.js     Helper UI: toast, modal, confirm, chart SVG, ikon
assets/js/store.js      SATU data store: seed, CRUD, auth, tracking, import/export
assets/js/site.js       Website: home, explore, detail, components, my build, shopping, budget, AI builder, Nara
assets/js/admin.js      Dashboard: login, overview, projects+editor, components, categories, AI review, content, analytics, settings
```

## Satu sumber data

`assets/js/store.js` adalah satu-satunya sumber data untuk proyek, komponen, kategori, konten
homepage, proyek AI, settings, activity log, dan event analytics. Website dan dashboard membaca
store yang sama, sehingga:

- Proyek/komponen/kategori yang dibuat admin langsung muncul di website.
- Harga komponen yang diubah langsung memengaruhi detail proyek, Budget Builder, dan Shopping List.
- Proyek dari AI Builder tersimpan sebagai proyek `type: "ai"` dan muncul di Explore serta
  **AI Generated Projects** pada admin.
- Kategori baru otomatis masuk homepage (jika dipilih), filter Explore, form proyek, dan AI Builder.

## Batasan prototype (jujur)

- **Auth**: client-side, tanpa server, tanpa hashing kuat. Dapat dilewati lewat DevTools — bukan keamanan produksi.
- **Database**: LocalStorage per browser, tanpa sinkronisasi antar perangkat/pengguna.
- **AI Builder**: generator lokal berbasis aturan + template komponen, bukan panggilan model AI/cloud.
  Instruksi, wiring, dan kode hasil generator belum tentu terverifikasi.
- **Analytics**: event lokal (`page_view`, `project_view`, `ai_builder_open`, `project_generate`,
  `component_view`, `project_save`). Bukan traffic real-world, tanpa IP atau data pribadi.
- **Stock status komponen**: belum ada pada model data, ditandai “Tidak dilacak”.
- Sebagian data awal adalah **dataset demo** (seed) dan dapat dikembalikan lewat
  **Settings → Reset demo data**.

## Export / Import

- **Settings → Export semua data (JSON)** mengunduh proyek, komponen, kategori, konten homepage,
  activity log, analytics, My Build, dan shopping list.
- **Import data JSON** memvalidasi struktur & field wajib, menampilkan preview + jumlah data,
  lalu meminta konfirmasi sebelum menimpa data saat ini.
