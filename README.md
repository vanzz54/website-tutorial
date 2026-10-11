# KB Hub — Knowledge Base & Learning Hub Pribadi

Platform website tutorial pribadi dengan tema **Dark Mode khas programmer/hacker**. Dibangun dengan **HTML + Tailwind CSS (CDN) + JavaScript murni** — tanpa build step, tanpa framework.

## Struktur Proyek

```
website tutorial it/
├── index.html              # Landing page (hero, search, kategori, artikel terbaru, sidebar)
├── article.html            # Template halaman baca artikel (dinamis via ?id=)
└── assets/
    ├── css/style.css       # Custom style: code block terminal, grid bg, token highlight, animasi
    └── js/
        ├── data.js         # Data 5 kategori + 29 tutorial (untuk landing page & pencarian)
        ├── articles.js     # Database artikel lengkap (konten dinamis article.html)
        ├── main.js         # Search, filter, nav mobile, typed effect, animasi reveal
        └── article.js      # Render artikel via ?id=, highlighter, copy, TOC scrollspy, progress bar
```

## Cara Menjalankan

**Opsi 1 — Buka langsung:** klik dua kali `index.html` (butuh internet untuk CDN Tailwind + font).

**Opsi 2 — Local server (disarankan):**

```bash
cd "website tutorial it"

# Python
python -m http.server 8000

# atau Node.js
npx serve .
```

Buka `http://localhost:8000` di browser.

> Butuh koneksi internet untuk memuat Tailwind CDN dan Google Fonts.

## Fitur Utama

### Landing Page (`index.html`)
- Hero section dengan search bar interaktif (shortcut `/` atau `Ctrl+K`)
- Terminal mockup dengan efek typing animation
- Grid 5 kategori: Cyber Security, Networking, Linux & Sysadmin, IT Support & Hardware, Web Development
- Kartu artikel terbaru dengan badge kesulitan (Beginner/Intermediate/Advanced) & filter per kategori/tag
- Sidebar sticky: navigasi cepat, tag populer, learning path
- Scroll progress bar, back-to-top, mobile responsive

### Halaman Artikel (`article.html`) — Dinamis via `?id=`
- Membaca query parameter `id` dari URL, lalu merender konten dari objek `articlesData` (`assets/js/articles.js`)
- Breadcrumb, badge kategori & level, meta penulis — ikut menyesuaikan artikel yang dibuka
- Blok kode bergaya terminal (title bar + dot merah/kuning/hijau + label bahasa)
- **Syntax highlighting** ringan (bash/command, flag, string, keyword, number, comment)
- Tombol **copy-to-clipboard** dengan feedback "tersalin!"
- Table of contents sticky dengan **scrollspy** (daftar isi mengikuti `<h2>` artikel aktif)
- Reading progress bar, callout (peringatan/tips), artikel terkait (dari kategori sama)
- **Fallback aman**: artikel yang belum punya konten lengkap tetap menampilkan ringkasan; ID tak dikenal menampilkan halaman 404 dinamis

### Sistem Routing Artikel

Setiap kartu di `index.html` tertaut ke `article.html?id=<slug>`. Saat ini ada **29 artikel** dengan konten lengkap:

```
# Cyber Security (5)
article.html?id=ctf-web-exploitation            → CTF Write-up: SQL Injection pada Lab DVWA
article.html?id=osint-google-dorking            → OSINT Dasar: Teknik Google Dorking
article.html?id=web-exploitation-file-upload-rce→ Web Exploitation: File Upload hingga RCE
article.html?id=kriptografi-caesar-xor          → Kriptografi Dasar: Caesar Cipher & XOR
article.html?id=steganografi-binwalk-steghide   → Steganografi: Binwalk & Steghide

# Computer Networking (6)
article.html?id=mikrotik-basic                  → MikroTik VLAN & Inter-VLAN Routing
article.html?id=networking-mikrotik-basic       → Konfigurasi Dasar MikroTik: IP, DHCP, NAT
article.html?id=networking-subnetting-guide     → Panduan Subnetting IPv4 Lengkap
article.html?id=networking-cisco-vlan-routing   → VLAN & Inter-VLAN Routing (Packet Tracer)
article.html?id=subnetting-cheatsheet           → Cheat Sheet Subnetting CIDR (referensi cepat)
article.html?id=cisco-packet-tracer-topologi    → Topologi Jaringan Dasar (Packet Tracer)

# Linux & Sysadmin (6)
article.html?id=linux-suid-privesc              → Linux Privilege Escalation via SUID
article.html?id=linux-essential-commands        → Cheat Sheet Perintah Dasar Terminal
article.html?id=linux-webserver-nginx-php       → Setup Nginx + PHP-FPM + MySQL (LEMP)
article.html?id=linux-bash-scripting            → Automasi dengan Bash Shell Scripting
article.html?id=linux-permissions-umask         → Permissions, umask & Special Bits
article.html?id=shell-scripting-backup-otomatis → Otomatisasi Backup dengan Cron

# IT Support & Hardware (6)
article.html?id=itsupport-windows-reinstall-dualboot → Dual Boot Windows 11 & Linux
article.html?id=itsupport-pc-troubleshooting    → Troubleshooting Hardware PC
article.html?id=itsupport-bios-uefi-guide       → BIOS vs UEFI & Boot Priority
article.html?id=ubuntu-server-2404-setup        → Instalasi & Hardening Ubuntu Server
article.html?id=troubleshooting-pc-tidak-booting→ Troubleshooting PC Tidak Booting ke Windows
article.html?id=installing-os-linux-windows     → Dual Boot: Partisi & Bootloader

# Web Development (6)
article.html?id=webdev-tailwind-responsive      → Landing Page Responsive (konsep Tailwind)
article.html?id=webdev-php-crud-mysql           → CRUD Sederhana PHP Native + MySQL
article.html?id=webdev-fetch-api-javascript     → REST API & Fetch dengan JavaScript Modern
article.html?id=tailwind-landing-page           → Build Landing Page + Dark Mode
article.html?id=php-form-validation             → Form Validation Aman dengan PHP
article.html?id=python-automation-network-scan  → Automasi Network Scan Python & Scapy
```

> **Catatan topik berpasangan**: beberapa pasang artikel sengaja dibedakan fokusnya agar saling melengkapi, bukan mengulang — mis. `subnetting-cheatsheet` (tabel referensi cepat) vs `networking-subnetting-guide` (teori penuh); `tailwind-landing-page` (build project + dark mode) vs `webdev-tailwind-responsive` (konsep breakpoint).

ID tak dikenal tetap menampilkan **halaman 404 dinamis** — tidak error.

`article.js` membaca `window.location.search`, mencocokkan `id` dengan key `articlesData`, lalu memperbarui: `<title>`, breadcrumb, badge, `<h1>`, deskripsi, meta, isi artikel, tag, info sidebar, TOC, dan artikel terkait.

## Cara Menambah Artikel Baru

Menambah artikel melibatkan **2 file** — `data.js` (agar tampil di landing page & search) dan `articles.js` (isi lengkap halaman artikel):

**1. `assets/js/data.js`** — tambah entri di array `TUTORIALS` (slug = ID artikel):

```js
{
  slug: "judul-url-friendly",    // ← ID ini dipakai di article.html?id=
  title: "Judul Tutorial",
  category: "linux",             // cybersecurity | networking | linux | itsupport | webdev
  difficulty: "Beginner",        // Beginner | Intermediate | Advanced
  excerpt: "Deskripsi singkat...",
  date: "2026-10-10",
  readTime: 10,                  // dalam menit
  tags: ["tag1", "tag2"],
}
```

**2. `assets/js/articles.js`** — tambah key baru di objek `articlesData` dengan **slug yang sama**:

```js
"judul-url-friendly": {
  id: "judul-url-friendly",
  crumb: "Judul Pendek Breadcrumb",
  title: "Judul Tutorial",
  category: "linux",
  difficulty: "Beginner",
  excerpt: "Deskripsi singkat...",
  date: "2026-10-10",
  readTime: 10,
  lab: "Ubuntu 24.04",            // lingkungan/lab tempat tutorial diuji
  author: "Admin KBHub",
  tags: ["tag1", "tag2"],
  content: /* HTML string: h2 + p + codeBlock() + callout() */,
},
```

Helper tersedia di `articles.js` untuk membangun konten dengan cepat:
- `codeBlock("bash", "perintah di sini")` → blok kode terminal + tombol copy (escaping otomatis)
- `callout("note" | "warning" | "tip", "isi html", "JUDUL OPSIONAL")` → kotak perhatian

> **Catatan**: jika slug di `data.js` belum punya entri di `articlesData`, halaman artikel tetap terbuka dan menampilkan **halaman fallback** (ringkasan + daftar topik) — tidak error.

3. Kartu otomatis muncul di grid "Artikel Terbaru" dan terindeks search, dengan link `article.html?id=<slug>`.

## Kustomisasi Tema

Warna aksen didefinisikan di `tailwind.config` (inline di `<head>` tiap HTML) dan CSS variable di `assets/css/style.css`:

- `kb-green: #22c55e` (aksen utama terminal)
- `kb-cyan: #22d3ee` (aksen sekunder)
- Background: `#0a0e14` dengan pola grid halus

## Teknologi

| Komponen | Teknologi |
|---|---|
| Markup | HTML5 |
| Styling | Tailwind CSS via CDN |
| Font | Inter + JetBrains Mono (Google Fonts) |
| Logic | Vanilla JavaScript (ES6) |
| Ikon | SVG inline |
