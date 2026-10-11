const CATEGORIES = [
  {
    id: "cybersecurity",
    name: "Cyber Security",
    slug: "cyber-security",
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3l7.5 3v5.25c0 4.28-2.9 8.28-7.5 9.75-4.6-1.47-7.5-5.47-7.5-9.75V6L12 3z"/><path stroke-linecap="round" stroke-linejoin="round" d="M9.5 12l1.75 1.75L15 9.75"/>',
    color: "rose",
    description: "CTF write-ups, web exploitation, privilege escalation, dan OSINT.",
    count: 3,
  },
  {
    id: "networking",
    name: "Computer Networking",
    slug: "networking",
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 4.5h9a2 2 0 012 2v2a2 2 0 01-2 2h-9a2 2 0 01-2-2v-2a2 2 0 012-2zM7.5 13.5h9a2 2 0 012 2v2a2 2 0 01-2 2h-9a2 2 0 01-2-2v-2a2 2 0 012-2zM12 8.5v5"/>',
    color: "cyan",
    description: "MikroTik, Cisco, subnetting, dan desain topologi jaringan.",
    count: 3,
  },
  {
    id: "linux",
    name: "Linux & Sysadmin",
    slug: "linux-sysadmin",
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 17l6-5-6-5M12 19h8"/>',
    color: "emerald",
    description: "Command line, server configuration, dan shell scripting.",
    count: 3,
  },
  {
    id: "itsupport",
    name: "IT Support & Hardware",
    slug: "it-support-hardware",
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/>',
    color: "amber",
    description: "Troubleshooting, instalasi OS, dan perawatan hardware.",
    count: 3,
  },
  {
    id: "webdev",
    name: "Web Development",
    slug: "web-development",
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 15"/>',
    color: "violet",
    description: "HTML, CSS, Tailwind, PHP, dan Python untuk web.",
    count: 3,
  },
];

const TUTORIALS = [
  {
    slug: "linux-suid-privesc",
    title: "Linux Privilege Escalation via SUID Binary",
    category: "linux",
    difficulty: "Advanced",
    excerpt:
      "Pelajari cara menemukan dan mengeksploitasi binary berflag SUID untuk eskalasi privilegi dari user biasa ke root di Linux.",
    date: "2026-10-08",
    readTime: 12,
    tags: ["linux", "privesc", "suid", "security"],
    featured: true,
  },
  {
    slug: "mikrotik-basic",
    title: "Konfigurasi VLAN & Inter-VLAN Routing di MikroTik",
    category: "networking",
    difficulty: "Intermediate",
    excerpt:
      "Panduan lengkap membagi jaringan ke dalam beberapa VLAN menggunakan MikroTik RouterOS beserta konfigurasi inter-VLAN routing.",
    date: "2026-10-05",
    readTime: 15,
    tags: ["mikrotik", "vlan", "routing", "networking"],
    featured: true,
  },
  {
    slug: "ctf-web-exploitation",
    title: "CTF Write-up: SQL Injection pada Lab DVWA",
    category: "cybersecurity",
    difficulty: "Intermediate",
    excerpt:
      "Step-by-step write-up eksploitasi SQL Injection di Damn Vulnerable Web Application, dari reconnaissance hingga dump seluruh database.",
    date: "2026-10-02",
    readTime: 10,
    tags: ["ctf", "sqli", "web-exploitation", "writeup"],
    featured: true,
  },
  {
    slug: "ubuntu-server-2404-setup",
    title: "Instalasi & Hardening Ubuntu Server 24.04 LTS",
    category: "itsupport",
    difficulty: "Beginner",
    excerpt:
      "Dari instalasi awal, konfigurasi SSH key-based auth, firewall UFW, sampai patching otomatis — panduan admin server untuk pemula.",
    date: "2026-09-28",
    readTime: 18,
    tags: ["ubuntu", "server", "hardening", "installation"],
  },
  {
    slug: "subnetting-cheatsheet",
    title: "Subnetting Cepat: Cheat Sheet CIDR untuk Teknisi Jaringan",
    category: "networking",
    difficulty: "Beginner",
    excerpt:
      "Rumus praktis dan tabel referensi cepat subnetting CIDR, VLSM, serta cara menghitung broadcast address tanpa kalkulator.",
    date: "2026-09-25",
    readTime: 8,
    tags: ["subnetting", "cidr", "vlsm", "networking"],
  },
  {
    slug: "shell-scripting-backup-otomatis",
    title: "Shell Scripting: Otomatisasi Backup Harian dengan Cron",
    category: "linux",
    difficulty: "Intermediate",
    excerpt:
      "Bangun script bash backup terenkripsi dengan logging, rotasi, dan notifikasi email — dijadwalkan otomatis via cron job.",
    date: "2026-09-22",
    readTime: 14,
    tags: ["bash", "scripting", "cron", "backup"],
  },
  {
    slug: "osint-google-dorking",
    title: "OSINT Dasar: Teknik Google Dorking untuk Reconnaissance",
    category: "cybersecurity",
    difficulty: "Beginner",
    excerpt:
      "Kuasai operator pencarian khusus (site:, filetype:, inurl:) untuk mengumpulkan informasi target secara legal dan etis.",
    date: "2026-09-19",
    readTime: 9,
    tags: ["osint", "google-dorking", "recon", "security"],
  },
  {
    slug: "cisco-packet-tracer-topologi",
    title: "Membangun Topologi Jaringan Dasar dengan Cisco Packet Tracer",
    category: "networking",
    difficulty: "Beginner",
    excerpt:
      "Latihan hands-on: merancang topologi star topology, konfigurasi switch, static routing, dan verifikasi konektivitas end-to-end.",
    date: "2026-09-16",
    readTime: 11,
    tags: ["cisco", "packet-tracer", "topology", "networking"],
  },
  {
    slug: "troubleshooting-pc-tidak-booting",
    title: "Troubleshooting: PC Tidak Booting ke Windows",
    category: "itsupport",
    difficulty: "Beginner",
    excerpt:
      "Alur diagnostik sistematis dari LED indikator, POST beep code, hingga perbaikan MBR dan repair startup menggunakan Windows Recovery.",
    date: "2026-09-13",
    readTime: 13,
    tags: ["troubleshooting", "windows", "hardware", "boot"],
  },
  {
    slug: "tailwind-landing-page",
    title: "Membangun Landing Page Responsif dengan Tailwind CSS",
    category: "webdev",
    difficulty: "Beginner",
    excerpt:
      "Praktik front-end modern: komponen hero, pricing card, dan dark mode — semuanya tanpa framework berat, hanya HTML + Tailwind CDN.",
    date: "2026-09-10",
    readTime: 10,
    tags: ["tailwind", "css", "html", "responsive"],
  },
  {
    slug: "web-exploitation-file-upload-rce",
    title: "Web Exploitation: File Upload Vulnerability hingga RCE",
    category: "cybersecurity",
    difficulty: "Advanced",
    excerpt:
      "Analisis celah unrestricted file upload pada aplikasi PHP, teknik bypass extension check, dan pencegahannya di sisi server.",
    date: "2026-09-07",
    readTime: 16,
    tags: ["web-exploitation", "file-upload", "rce", "php"],
  },
  {
    slug: "kriptografi-caesar-xor",
    title: "Kriptografi Dasar CTF: Caesar Cipher & XOR Operation",
    category: "cybersecurity",
    difficulty: "Beginner",
    excerpt:
      "Memahami cipher klasik Caesar dan operasi bitwise XOR — dua materi wajib pemula CTF, lengkap dengan cara memecahkannya.",
    date: "2026-10-06",
    readTime: 11,
    tags: ["cryptography", "ctf", "caesar", "xor"],
  },
  {
    slug: "steganografi-binwalk-steghide",
    title: "Steganografi CTF: Ekstraksi Pesan Tersembunyi dengan Binwalk & Steghide",
    category: "cybersecurity",
    difficulty: "Intermediate",
    excerpt:
      "Pelajari cara mendeteksi dan mengekstrak data tersembunyi di dalam file gambar/audio menggunakan binwalk, steghide, strings, dan exiftool.",
    date: "2026-10-04",
    readTime: 13,
    tags: ["steganography", "ctf", "forensics", "binwalk"],
  },
  {
    slug: "python-automation-network-scan",
    title: "Automasi Network Scan dengan Python & Scapy",
    category: "webdev",
    difficulty: "Advanced",
    excerpt:
      "Tulis tool pemindai jaringan ringan berbasis Python untuk ping sweep dan port discovery, lengkap dengan output terformat.",
    date: "2026-09-04",
    readTime: 17,
    tags: ["python", "scapy", "automation", "security"],
  },
  {
    slug: "linux-permissions-umask",
    title: "Memahami Linux Permissions, umask & Special Bits (Sticky, SGID)",
    category: "linux",
    difficulty: "Intermediate",
    excerpt:
      "Penjelasan mendalam model permission Unix, perhitungan umask default, serta penerapan sticky bit pada direktori bersama.",
    date: "2026-09-01",
    readTime: 11,
    tags: ["linux", "permissions", "umask", "sysadmin"],
  },
  {
    slug: "installing-os-linux-windows",
    title: "Dual Boot Linux & Windows: Persiapan Partisi & Bootloader",
    category: "itsupport",
    difficulty: "Intermediate",
    excerpt:
      "Checklist aman sebelum instalasi dual boot: skema partisi GPT/UEFI, urutan instalasi, dan perbaikan GRUB yang hilang.",
    date: "2026-08-29",
    readTime: 12,
    tags: ["dual-boot", "grub", "partition", "installation"],
  },
  {
    slug: "php-form-validation",
    title: "Form Validation Aman dengan PHP Native (Tanpa Framework)",
    category: "webdev",
    difficulty: "Intermediate",
    excerpt:
      "Validasi sisi server yang benar: sanitasi input, prepared statements anti-SQLi, CSRF token, dan pesan error yang informatif.",
    date: "2026-08-26",
    readTime: 13,
    tags: ["php", "validation", "security", "forms"],
  },
  {
    slug: "networking-mikrotik-basic",
    title: "Konfigurasi Dasar MikroTik: IP Address, DHCP Server, dan NAT Gateway",
    category: "networking",
    difficulty: "Beginner",
    excerpt:
      "Panduan langkah demi langkah menyiapkan router MikroTik dari nol: alamat IP antarmuka, DHCP Server untuk klien, hingga NAT masquerade agar semua host bisa internet.",
    date: "2026-10-09",
    readTime: 12,
    tags: ["mikrotik", "routeros", "dhcp", "nat"],
  },
  {
    slug: "networking-subnetting-guide",
    title: "Panduan Subnetting IPv4 Lengkap: Menghitung CIDR, Subnet Mask, & Host",
    category: "networking",
    difficulty: "Beginner",
    excerpt:
      "Penjelasan subnetting dari konsep biner hingga perhitungan CIDR, jumlah host, dan broadcast address — lengkap dengan rumus cepat dan tabel referensi.",
    date: "2026-10-03",
    readTime: 14,
    tags: ["subnetting", "ipv4", "cidr", "networking"],
  },
  {
    slug: "networking-cisco-vlan-routing",
    title: "Konfigurasi VLAN & Inter-VLAN Routing di Cisco Packet Tracer",
    category: "networking",
    difficulty: "Intermediate",
    excerpt:
      "Praktik lengkap membagi jaringan ke dalam VLAN di switch Cisco, mengonfigurasi trunk 802.1Q, dan inter-VLAN routing dengan metode router-on-a-stick.",
    date: "2026-09-28",
    readTime: 15,
    tags: ["cisco", "vlan", "trunk", "packet-tracer"],
  },
  {
    slug: "linux-essential-commands",
    title: "Cheat Sheet Perintah Dasar Terminal Linux untuk Pemula",
    category: "linux",
    difficulty: "Beginner",
    excerpt:
      "Kumpulan perintah wajib untuk pemula Linux: navigasi filesystem, manajemen file, izin akses, monitoring proses, hingga jaringan — disusun sebagai cheat sheet cepat.",
    date: "2026-10-07",
    readTime: 11,
    tags: ["linux", "terminal", "cheatsheet", "bash"],
  },
  {
    slug: "linux-webserver-nginx-php",
    title: "Cara Setup Web Server Nginx + PHP-FPM + MySQL di Ubuntu Server",
    category: "linux",
    difficulty: "Intermediate",
    excerpt:
      "Panduan lengkap membangun stack LEMP (Linux, Nginx, MySQL, PHP) dari nol di Ubuntu Server, termasuk konfigurasi virtual host, PHP-FPM pool, dan hardening dasar.",
    date: "2026-09-30",
    readTime: 16,
    tags: ["nginx", "php", "mysql", "lemp"],
  },
  {
    slug: "linux-bash-scripting",
    title: "Automasi Perintah Linux Menggunakan Bash Shell Scripting",
    category: "linux",
    difficulty: "Intermediate",
    excerpt:
      "Belajar menulis script Bash dari dasar: variabel, kondisi, perulangan, hingga membuat script backup dan monitoring yang benar-benar berguna.",
    date: "2026-10-01",
    readTime: 13,
    tags: ["bash", "scripting", "automasi", "linux"],
  },
  {
    slug: "itsupport-windows-reinstall-dualboot",
    title: "Panduan Dual Boot Windows 11 & Linux Tanpa Kehilangan Data",
    category: "itsupport",
    difficulty: "Intermediate",
    excerpt:
      "Langkah aman memasang dual boot Windows 11 bersama Linux: persiapan partisi, urutan instalasi yang benar, konfigurasi GRUB, dan pemulihan bila boot error.",
    date: "2026-09-25",
    readTime: 14,
    tags: ["dual-boot", "windows", "linux", "grub"],
  },
  {
    slug: "itsupport-pc-troubleshooting",
    title: "Panduan Troubleshooting Hardware PC: RAM Unreadable, No Display, & Overheating",
    category: "itsupport",
    difficulty: "Beginner",
    excerpt:
      "Metode sistematis mendiagnosa masalah hardware PC: RAM tidak terbaca, layar hitam tanpa display, dan suhu berlebih — lengkap dengan alur diagnostik bertahap.",
    date: "2026-09-22",
    readTime: 12,
    tags: ["hardware", "troubleshooting", "ram", "diagnostic"],
  },
  {
    slug: "itsupport-bios-uefi-guide",
    title: "Memahami Perbedaan BIOS vs UEFI dan Cara Menyesuaikan Boot Priority",
    category: "itsupport",
    difficulty: "Beginner",
    excerpt:
      "Penjelasan lengkap perbedaan BIOS legacy dan UEFI modern, cara masuk ke pengaturan, mengubah boot priority, serta konsep Secure Boot dan GPT vs MBR.",
    date: "2026-09-15",
    readTime: 10,
    tags: ["bios", "uefi", "boot", "firmware"],
  },
  {
    slug: "webdev-tailwind-responsive",
    title: "Membuat Tampilan Landing Page Responsive Menggunakan Tailwind CSS",
    category: "webdev",
    difficulty: "Beginner",
    excerpt:
      "Praktik membangun landing page yang rapi di segala ukuran layar dengan Tailwind CSS: utility classes, breakpoint responsive, flex/grid, hingga komponen navbar & hero.",
    date: "2026-10-08",
    readTime: 12,
    tags: ["tailwind", "css", "responsive", "landing-page"],
  },
  {
    slug: "webdev-php-crud-mysql",
    title: "Membuat Sistem CRUD Sederhana dengan PHP Native dan MySQL",
    category: "webdev",
    difficulty: "Intermediate",
    excerpt:
      "Tutorial lengkap membuat aplikasi CRUD (Create, Read, Update, Delete) dengan PHP native dan MySQL, memakai PDO prepared statements anti-SQL injection.",
    date: "2026-09-26",
    readTime: 16,
    tags: ["php", "mysql", "crud", "pdo"],
  },
  {
    slug: "webdev-fetch-api-javascript",
    title: "Integrasi REST API dan Fetch Data Menggunakan JavaScript Modern",
    category: "webdev",
    difficulty: "Intermediate",
    excerpt:
      "Panduan memanggil REST API dengan Fetch API dan async/await: menangani response JSON, error handling, request POST/PUT, hingga rendering data dinamis ke DOM.",
    date: "2026-09-21",
    readTime: 13,
    tags: ["javascript", "fetch", "api", "async-await"],
  },
];

TUTORIALS.forEach(function (t) {
  t.href = "article.html?id=" + encodeURIComponent(t.slug);
});

const DIFFICULTY_STYLES = {
  Beginner: {
    badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    dot: "bg-emerald-400",
    bar: "w-1/3 bg-emerald-400",
  },
  Intermediate: {
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    dot: "bg-amber-400",
    bar: "w-2/3 bg-amber-400",
  },
  Advanced: {
    badge: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
    dot: "bg-rose-400",
    bar: "w-full bg-rose-400",
  },
};

const CATEGORY_ACCENT = {
  cybersecurity: {
    text: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    hover: "hover:border-rose-500/60 hover:shadow-rose-500/10",
    glow: "group-hover:shadow-[0_0_30px_-8px_rgba(244,63,94,0.5)]",
  },
  networking: {
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    hover: "hover:border-cyan-500/60 hover:shadow-cyan-500/10",
    glow: "group-hover:shadow-[0_0_30px_-8px_rgba(34,211,238,0.5)]",
  },
  linux: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    hover: "hover:border-emerald-500/60 hover:shadow-emerald-500/10",
    glow: "group-hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.5)]",
  },
  itsupport: {
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    hover: "hover:border-amber-500/60 hover:shadow-amber-500/10",
    glow: "group-hover:shadow-[0_0_30px_-8px_rgba(251,191,36,0.5)]",
  },
  webdev: {
    text: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    hover: "hover:border-violet-500/60 hover:shadow-violet-500/10",
    glow: "group-hover:shadow-[0_0_30px_-8px_rgba(139,92,246,0.5)]",
  },
};

const POPULAR_TAGS = [
  "linux",
  "ctf",
  "mikrotik",
  "subnetting",
  "python",
  "web-exploitation",
  "bash",
  "osint",
  "troubleshooting",
  "php",
];

function getTutorialsByCategory(categoryId) {
  return TUTORIALS.filter((t) => t.category === categoryId);
}

function getLatestTutorials(limit) {
  const sorted = [...TUTORIALS].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

function searchTutorials(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return TUTORIALS.map((t) => {
    const haystack = [
      t.title,
      t.excerpt,
      t.difficulty,
      t.tags.join(" "),
      (CATEGORIES.find((c) => c.id === t.category) || {}).name || "",
    ]
      .join(" ")
      .toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (!haystack.includes(term)) return null;
      score += t.title.toLowerCase().includes(term) ? 3 : 1;
    }
    return { tutorial: t, score };
  })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.tutorial);
}

function formatDate(dateString) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  const d = new Date(dateString);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
