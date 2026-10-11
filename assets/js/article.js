(function () {
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getArticleId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || "linux-suid-privesc";
  }

  function categoryMeta(id) {
    return (typeof CATEGORIES !== "undefined" && CATEGORIES.find((c) => c.id === id)) || {
      id: id,
      name: id,
      slug: id,
    };
  }

  function categoryAccent(id) {
    if (typeof CATEGORY_ACCENT === "undefined") {
      return { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
    }
    return CATEGORY_ACCENT[id] || CATEGORY_ACCENT.linux || { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
  }

  function difficultyStyle(level) {
    if (typeof DIFFICULTY_STYLES === "undefined") {
      return { badge: "bg-slate-500/10 text-slate-300 border border-slate-500/30" };
    }
    return DIFFICULTY_STYLES[level] || DIFFICULTY_STYLES.Beginner;
  }

  function fallbackArticle(id) {
    const t = (typeof TUTORIALS !== "undefined" && TUTORIALS.find((x) => x.slug === id)) || null;
    if (!t) return null;
    return {
      id: id,
      crumb: t.title,
      title: t.title,
      category: t.category,
      difficulty: t.difficulty,
      excerpt: t.excerpt,
      date: t.date,
      readTime: t.readTime,
      lab: "—",
      author: "Admin KBHub",
      tags: t.tags,
      content:
        '<div class="kb-callout note">' +
        '<div class="flex items-center gap-2 font-mono text-sm font-semibold text-kb-cyan">' +
        '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
        "KONTEN SEDANG DISIAPKAN</div>" +
        '<p class="mt-2 text-sm text-slate-300">Tulisan lengkap untuk artikel ini belum dipublikasikan. Cek kembali nanti, atau baca artikel lain yang sudah lengkap.</p></div>' +
        '<h2 id="ringkasan" class="mt-10 mb-4 text-2xl font-bold text-white">Ringkasan</h2>' +
        "<p>" + escapeHtml(t.excerpt) + "</p>" +
        '<h2 id="topik" class="mt-10 mb-4 text-2xl font-bold text-white">Topik yang Dibahas</h2>' +
        '<div class="flex flex-wrap gap-2">' +
        t.tags.map((tag) => '<span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-slate-400">#' + escapeHtml(tag) + "</span>").join("") +
        "</div>",
    };
  }

  function renderArticle(article) {
    const cat = categoryMeta(article.category);
    const accent = categoryAccent(article.category);
    const diff = difficultyStyle(article.difficulty);

    document.title = article.title + " — KB Hub";
    const metaDesc = $("#meta-description");
    if (metaDesc) metaDesc.setAttribute("content", article.excerpt);

    const crumb = article.crumb || article.title;
    const breadcrumb = $("#breadcrumb");
    if (breadcrumb) {
      breadcrumb.innerHTML =
        '<a href="index.html" class="hover:text-kb-green transition-colors">Beranda</a>' +
        '<span class="text-slate-700">/</span>' +
        '<a href="index.html#kategori" class="hover:text-kb-green transition-colors">' + escapeHtml(cat.name) + "</a>" +
        '<span class="text-slate-700">/</span>' +
        '<span class="text-slate-400">' + escapeHtml(crumb) + "</span>";
    }

    const badges = $("#article-badges");
    if (badges) {
      badges.innerHTML =
        '<span class="inline-flex items-center gap-1.5 rounded-md ' + accent.bg + " border " + accent.border + ' px-2.5 py-1 font-mono text-[11px] ' + accent.text + '">' +
        '<span class="h-1.5 w-1.5 rounded-full ' + accent.text.replace("text-", "bg-") + '"></span>' + escapeHtml(cat.name) + "</span>" +
        '<span class="rounded-md ' + diff.badge + ' px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide">' + escapeHtml(article.difficulty) + "</span>" +
        '<span class="rounded-md bg-white/5 border border-white/10 px-2.5 py-1 font-mono text-[11px] text-slate-400">' + article.readTime + " menit baca</span>";
    }

    const title = $("#article-title");
    if (title) title.textContent = article.title;

    const excerpt = $("#article-excerpt");
    if (excerpt) excerpt.textContent = article.excerpt;

    const author = $("#article-author");
    if (author) author.textContent = article.author;
    const authorBox = $("#article-author-box");
    if (authorBox) authorBox.textContent = article.author;
    const avatar = $("#article-author-avatar");
    if (avatar) avatar.textContent = article.author.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

    const meta = $("#article-meta");
    if (meta) {
      meta.textContent =
        "Dipublikasikan " + (typeof formatDate === "function" ? formatDate(article.date) : article.date) +
        (article.lab && article.lab !== "—" ? " · Lab: " + article.lab : "");
    }

    const body = $("#article-body");
    if (body) body.innerHTML = article.content;

    const tagsWrap = $("#article-tags");
    if (tagsWrap) {
      tagsWrap.innerHTML =
        '<span class="font-mono text-xs text-slate-500">Tag:</span>' +
        article.tags.map((tag) =>
          '<a href="index.html#terbaru" class="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-slate-400 hover:border-kb-green/40 hover:text-kb-green transition-colors">#' + escapeHtml(tag) + "</a>"
        ).join("");
    }

    const infoCat = $("#info-category");
    if (infoCat) { infoCat.textContent = cat.name; infoCat.className = accent.text; }
    const infoLevel = $("#info-level");
    if (infoLevel) {
      const levelTextColors = { Beginner: "text-emerald-400", Intermediate: "text-amber-400", Advanced: "text-rose-400" };
      infoLevel.textContent = article.difficulty;
      infoLevel.className = levelTextColors[article.difficulty] || "text-slate-300";
    }
    const infoRead = $("#info-readtime");
    if (infoRead) infoRead.textContent = article.readTime + " menit";
    const infoLab = $("#info-lab");
    if (infoLab) infoLab.textContent = article.lab || "—";
  }

  function renderNotFound() {
    document.title = "Artikel Tidak Ditemukan — KB Hub";
    const breadcrumb = $("#breadcrumb");
    if (breadcrumb) {
      breadcrumb.innerHTML =
        '<a href="index.html" class="hover:text-kb-green transition-colors">Beranda</a>' +
        '<span class="text-slate-700">/</span><span class="text-slate-400">404</span>';
    }
    const title = $("#article-title");
    if (title) title.textContent = "Artikel tidak ditemukan";
    const excerpt = $("#article-excerpt");
    if (excerpt) excerpt.textContent = "ID artikel yang kamu buka tidak ada di database. Silakan kembali ke halaman utama.";
    const body = $("#article-body");
    if (body) {
      body.innerHTML =
        '<div class="kb-callout warning"><div class="flex items-center gap-2 font-mono text-sm font-semibold text-amber-400">' +
        '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M4.93 4.93l14.14 14.14"/></svg>404 NOT FOUND</div>' +
        '<p class="mt-2 text-sm text-slate-300">Cek kembali URL-nya, atau telusuri artikel dari <a href="index.html#terbaru">halaman artikel terbaru</a>.</p></div>';
    }
    const tocPanel = $("#toc-panel");
    if (tocPanel) tocPanel.classList.add("hidden");
    const relatedWrap = $("#related-articles");
    if (relatedWrap) relatedWrap.parentElement.classList.add("hidden");
  }

  function highlightBash(code) {
    const lines = code.split("\n");
    return lines
      .map((line) => {
        let out = "";
        let i = 0;
        const promptMatch = line.match(/^(\s*)(\$)\s/);
        if (promptMatch) {
          out += escapeHtml(promptMatch[1]) + '<span class="tok-prompt">' + promptMatch[2] + "</span> ";
          i = promptMatch[0].length;
        } else if (/^\s*#/.test(line)) {
          return '<span class="tok-comment">' + escapeHtml(line) + "</span>";
        } else if (/^\s*\[.*\]/.test(line)) {
          return '<span class="tok-plain">' + escapeHtml(line) + "</span>";
        }
        out += tokenizeShellSegment(line.slice(i));
        return out;
      })
      .join("\n");
  }

  function tokenizeShellSegment(seg) {
    const pattern = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\s--?[A-Za-z0-9][\w=:.\/-]*)|(\$\{?\w+\}?)|(\b(?:sudo|apt|apt-get|yum|dnf|pacman|find|locate|xargs|ls|cat|grep|egrep|rg|awk|sed|chmod|chown|chgrp|cp|mv|rm|mkdir|touch|echo|printf|systemctl|service|journalctl|useradd|usermod|passwd|groupadd|id|whoami|uname|hostname|ps|top|htop|kill|killall|tar|gzip|gunzip|zip|unzip|curl|wget|ssh|scp|rsync|nmap|netstat|ss|ip|ifconfig|ping|traceroute|docker|kubectl|git|npm|node|python|python3|pip|php|mysql|psql|sh|bash|dash|su|man|head|tail|less|more|wc|sort|uniq|cut|tr|env|export|source|alias|history|ufw|iptables|fail2ban|aide|rkhunter|lynis|sha256sum|md5sum|strings|file|which|whereis|basename|dirname|realpath|readlink)\b)|(\b\d+(?:\.\d+)*\b)|([|&;><]+)/g;
    let result = "";
    let last = 0;
    let m;
    while ((m = pattern.exec(seg)) !== null) {
      result += escapeHtml(seg.slice(last, m.index));
      if (m[1] !== undefined) {
        result += '<span class="tok-string">' + escapeHtml(m[1]) + "</span>";
      } else if (m[2] !== undefined) {
        result += '<span class="tok-flag">' + escapeHtml(m[2]) + "</span>";
      } else if (m[3] !== undefined) {
        result += '<span class="tok-var">' + escapeHtml(m[3]) + "</span>";
      } else if (m[4] !== undefined) {
        result += '<span class="tok-keyword">' + escapeHtml(m[4]) + "</span>";
      } else if (m[5] !== undefined) {
        result += '<span class="tok-number">' + escapeHtml(m[5]) + "</span>";
      } else if (m[6] !== undefined) {
        result += '<span class="tok-op">' + escapeHtml(m[6]) + "</span>";
      }
      last = pattern.lastIndex;
    }
    result += escapeHtml(seg.slice(last));
    return result;
  }

  function highlightGeneric(code) {
    const pattern = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(const|let|var|function|return|if|else|for|while|import|from|export|class|def|self|None|True|False|new|try|catch|async|await|null|undefined|true|false)\b|\b(\d+(?:\.\d+)?)\b/g;
    let result = "";
    let last = 0;
    let m;
    while ((m = pattern.exec(code)) !== null) {
      // escape teks di antara match agar tag HTML/PHP tidak bocor jadi elemen
      result += escapeHtml(code.slice(last, m.index));
      if (m[1] !== undefined) {
        result += '<span class="tok-comment">' + escapeHtml(m[1]) + "</span>";
      } else if (m[2] !== undefined) {
        result += '<span class="tok-string">' + escapeHtml(m[2]) + "</span>";
      } else if (m[3] !== undefined) {
        result += '<span class="tok-keyword">' + escapeHtml(m[3]) + "</span>";
      } else if (m[4] !== undefined) {
        result += '<span class="tok-number">' + escapeHtml(m[4]) + "</span>";
      }
      last = pattern.lastIndex;
    }
    result += escapeHtml(code.slice(last));
    return result;
  }

  function highlightCode(code, lang) {
    const normalized = (lang || "text").toLowerCase();
    if (["bash", "sh", "shell", "terminal", "console", "zsh", "routeros", "mikrotik"].includes(normalized)) {
      return highlightBash(code);
    }
    return highlightGeneric(code);
  }

  function setupCodeBlocks() {
    $$(".code-block").forEach((block) => {
      const codeEl = $("code", block);
      if (!codeEl) return;
      if (block.dataset.enhanced === "1") return;
      const raw = codeEl.textContent;
      block.dataset.raw = raw;
      const lang = block.dataset.lang || "text";
      codeEl.innerHTML = highlightCode(raw, lang);
      block.dataset.enhanced = "1";
    });
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (_) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
  }

  function setupCopyButtons() {
    $$(".copy-btn").forEach((btn) => {
      if (btn.dataset.bound === "1") return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", async () => {
        const block = btn.closest(".code-block");
        const raw = block ? block.dataset.raw : "";
        if (raw === undefined) return;
        const ok = await copyText(raw);
        const original = btn.innerHTML;
        if (ok) {
          btn.classList.add("copied");
          btn.innerHTML =
            '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> tersalin!';
        } else {
          btn.innerHTML = '<span class="text-rose-400">gagal</span>';
        }
        setTimeout(() => {
          btn.classList.remove("copied");
          btn.innerHTML = original;
        }, 1800);
      });
    });
  }

  function buildToc() {
    const toc = $("#toc");
    const content = $("#article-body");
    if (!toc || !content) return;
    const headings = $$("h2[id]", content);
    if (!headings.length) {
      const panel = $("#toc-panel");
      if (panel) panel.classList.add("hidden");
      return;
    }
    const panel = $("#toc-panel");
    if (panel) panel.classList.remove("hidden");
    toc.innerHTML = headings
      .map(
        (h) =>
          '<a href="#' + h.id + '" class="toc-link block border-l-2 border-transparent py-1.5 pl-3.5 text-sm text-slate-500 transition-colors hover:border-kb-green/40 hover:text-slate-300">' + escapeHtml(h.textContent) + "</a>"
      )
      .join("");
  }

  function setupScrollspy() {
    const links = $$(".toc-link");
    const headings = links
      .map((l) => document.getElementById(l.getAttribute("href").slice(1)))
      .filter(Boolean);
    if (!headings.length) return;

    function update() {
      let activeIndex = 0;
      headings.forEach((h, i) => {
        if (h.getBoundingClientRect().top <= 140) activeIndex = i;
      });
      links.forEach((l, i) => l.classList.toggle("active", i === activeIndex));
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function setupProgress() {
    const bar = $("#scroll-progress");
    if (!bar) return;
    window.addEventListener(
      "scroll",
      () => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
        bar.style.width = pct + "%";
      },
      { passive: true }
    );
  }

  function renderRelated(current) {
    const wrap = $("#related-articles");
    if (!wrap || typeof TUTORIALS === "undefined") return;
    const pool = (typeof articlesData !== "undefined") ? Object.keys(articlesData) : [];
    const sameCat = TUTORIALS.filter(
      (t) => t.category === current.category && t.slug !== current.id && pool.includes(t.slug)
    );
    const others = TUTORIALS.filter(
      (t) => t.slug !== current.id && t.category !== current.category && pool.includes(t.slug)
    );
    const related = sameCat.concat(others).slice(0, 3);
    if (!related.length) {
      wrap.parentElement.classList.add("hidden");
      return;
    }
    wrap.innerHTML = related
      .map((t) => {
        const cat = categoryMeta(t.category);
        return "<li>" +
          '<a href="article.html?id=' + encodeURIComponent(t.slug) + '" class="group block rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:border-kb-green/30 transition-colors">' +
          '<span class="font-mono text-[10px] uppercase tracking-wide text-slate-600">' + escapeHtml(cat.name) + "</span>" +
          '<span class="mt-1 block text-sm font-medium leading-snug text-slate-300 group-hover:text-kb-green transition-colors">' + escapeHtml(t.title) + "</span>" +
          "</a></li>";
      })
      .join("");
  }

  function setupYear() {
    const el = $("#year");
    if (el) el.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const id = getArticleId();
    const articles = (typeof articlesData !== "undefined") ? articlesData : {};
    const article = articles[id] || fallbackArticle(id);

    if (article) {
      renderArticle(article);
    } else {
      renderNotFound();
    }

    setupCodeBlocks();
    setupCopyButtons();
    buildToc();
    setupScrollspy();
    setupProgress();
    renderRelated(article || { id: id, category: "" });
    setupYear();
  });
})();
