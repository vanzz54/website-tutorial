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

  function highlightText(text, query) {
    if (!query) return escapeHtml(text);
    const terms = query.trim().split(/\s+/).filter(Boolean).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (!terms.length) return escapeHtml(text);
    const re = new RegExp("(" + terms.join("|") + ")", "gi");
    return escapeHtml(text).replace(re, '<mark class="kb-highlight">$1</mark>');
  }

  function categoryMeta(id) {
    return CATEGORIES.find((c) => c.id === id) || { name: id, color: "slate" };
  }

  function categoryCardHtml(cat) {
    const accent = CATEGORY_ACCENT[cat.id] || CATEGORY_ACCENT.linux;
    const count = getTutorialsByCategory(cat.id).length;
    return `
      <a href="#terbaru" data-filter-category="${cat.id}"
         class="kb-cat-card kb-fade-up group flex flex-col rounded-xl p-6 ${accent.border} ${accent.hover} ${accent.glow}">
        <div class="flex items-start justify-between">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg ${accent.bg} ${accent.text} border ${accent.border}">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">${cat.icon}</svg>
          </div>
          <span class="rounded-full ${accent.bg} ${accent.text} px-2.5 py-0.5 font-mono text-xs">${count}</span>
        </div>
        <h3 class="mt-5 text-base font-semibold text-white group-hover:${accent.text} transition-colors">${cat.name}</h3>
        <p class="mt-2 flex-1 text-sm leading-relaxed text-slate-500">${cat.description}</p>
        <span class="mt-5 inline-flex items-center gap-1.5 font-mono text-xs ${accent.text}">
          lihat artikel <span class="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </a>`;
  }

  function tutorialCardHtml(t, query) {
    const cat = categoryMeta(t.category);
    const accent = CATEGORY_ACCENT[t.category] || CATEGORY_ACCENT.linux;
    const diff = DIFFICULTY_STYLES[t.difficulty];
    return `
      <a href="${t.href}" class="kb-card kb-fade-up group flex flex-col rounded-xl overflow-hidden">
        <div class="flex items-center justify-between gap-2 border-b border-white/5 px-5 py-3">
          <span class="inline-flex items-center gap-1.5 font-mono text-[11px] ${accent.text}">
            <span class="h-1.5 w-1.5 rounded-full ${accent.text.replace('text-', 'bg-')}"></span>${cat.name}
          </span>
          <span class="rounded-md ${diff.badge} px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide">${t.difficulty}</span>
        </div>
        <div class="flex flex-1 flex-col p-5">
          <h3 class="text-[15px] font-semibold leading-snug text-slate-100 group-hover:text-kb-green transition-colors">${highlightText(t.title, query)}</h3>
          <p class="mt-2.5 flex-1 text-sm leading-relaxed text-slate-500 line-clamp-3">${highlightText(t.excerpt, query)}</p>
          <div class="mt-4 flex flex-wrap gap-1.5">
            ${t.tags.slice(0, 3).map(tag => `<span class="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-500">#${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="mt-4 flex items-center justify-between border-t border-white/5 pt-3.5 font-mono text-[11px] text-slate-600">
            <span>${formatDate(t.date)}</span>
            <span>${t.readTime} menit baca</span>
          </div>
        </div>
      </a>`;
  }

  function renderCategories() {
    const grid = $("#category-grid");
    if (!grid) return;
    grid.innerHTML = CATEGORIES.map(categoryCardHtml).join("");
  }

  function renderPopularTags() {
    const wrap = $("#popular-tags");
    if (!wrap) return;
    wrap.innerHTML = POPULAR_TAGS.map(tag =>
      `<button data-filter-tag="${escapeHtml(tag)}" class="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-slate-400 hover:border-kb-green/40 hover:text-kb-green transition-colors">#${escapeHtml(tag)}</button>`
    ).join("");
  }

  function renderStats() {
    const total = TUTORIALS.length;
    const cats = CATEGORIES.length;
    const totalMinutes = TUTORIALS.reduce((sum, t) => sum + t.readTime, 0);
    const hours = Math.round(totalMinutes / 60);
    animateValue($("#stat-tutorials"), total);
    animateValue($("#stat-categories"), cats);
    animateValue($("#stat-hours"), hours);
    const countEl = $("#article-count");
    if (countEl) countEl.textContent = total;
  }

  function animateValue(el, target) {
    if (!el) return;
    let current = 0;
    const step = Math.max(1, Math.round(target / 24));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current;
    }, 30);
  }

  let activeCategory = "all";
  let activeTag = null;

  function renderFilterBar() {
    const bar = $("#filter-bar");
    if (!bar) return;
    const items = [{ id: "all", name: "Semua" }].concat(CATEGORIES);
    bar.innerHTML = items.map(item => {
      const isActive = activeCategory === item.id && !activeTag;
      return `<button data-filter="${item.id}" class="rounded-lg border px-3.5 py-1.5 font-mono text-xs transition-colors ${isActive
        ? "border-kb-green/50 bg-kb-green/10 text-kb-green"
        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-slate-200"}">${item.name}</button>`;
    }).join("") + (activeTag ? `<button id="clear-tag" class="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 font-mono text-xs text-amber-400 hover:bg-amber-500/20 transition-colors">#${escapeHtml(activeTag)} ✕</button>` : "");
  }

  function renderTutorials(query) {
    const grid = $("#tutorial-grid");
    const empty = $("#empty-state");
    if (!grid) return;
    let list = getLatestTutorials();
    if (activeCategory !== "all") list = list.filter(t => t.category === activeCategory);
    if (activeTag) list = list.filter(t => t.tags.includes(activeTag));
    grid.innerHTML = list.map(t => tutorialCardHtml(t, query || "")).join("");
    if (empty) empty.classList.toggle("hidden", list.length !== 0);
    observeFadeUps(grid);
  }

  function setCategoryFilter(id) {
    activeCategory = id;
    activeTag = null;
    renderFilterBar();
    renderTutorials();
  }

  function setTagFilter(tag) {
    activeTag = tag;
    activeCategory = "all";
    renderFilterBar();
    renderTutorials();
    const section = $("#terbaru");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  }

  function searchResultItemHtml(t, query) {
    const cat = categoryMeta(t.category);
    const accent = CATEGORY_ACCENT[t.category] || CATEGORY_ACCENT.linux;
    const diff = DIFFICULTY_STYLES[t.difficulty];
    return `
      <a href="${t.href}" class="flex items-start gap-3 rounded-lg p-3 hover:bg-white/5 transition-colors">
        <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full ${accent.text.replace('text-', 'bg-')}"></span>
        <span class="flex-1 min-w-0">
          <span class="block text-sm font-medium text-slate-200">${highlightText(t.title, query)}</span>
          <span class="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-500">
            <span class="${accent.text}">${cat.name}</span>
            <span>·</span>
            <span class="rounded ${diff.badge} px-1.5 py-0.5 text-[10px] uppercase">${t.difficulty}</span>
            <span>·</span>
            <span>${t.readTime} menit</span>
          </span>
        </span>
      </a>`;
  }

  function renderSearchResults(container, query) {
    if (!container) return;
    const q = query.trim();
    if (!q) { container.classList.add("hidden"); container.innerHTML = ""; return; }
    const results = searchTutorials(q);
    container.classList.remove("hidden");
    if (!results.length) {
      container.innerHTML = `<div class="p-6 text-center font-mono text-sm text-slate-500">tidak ada hasil untuk "<span class="text-slate-300">${escapeHtml(q)}</span>"</div>`;
      return;
    }
    const limited = results.slice(0, 6);
    container.innerHTML =
      `<div class="border-b border-white/5 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-slate-600">${results.length} hasil ditemukan</div>` +
      `<div class="p-2">${limited.map(t => searchResultItemHtml(t, q)).join("")}</div>` +
      (results.length > limited.length
        ? `<div class="border-t border-white/5 px-4 py-2.5 text-center font-mono text-[11px] text-slate-600">tekan Enter untuk melihat semua hasil</div>`
        : "");
  }

  function setupSearch() {
    const modal = $("#search-modal");
    const modalInput = $("#search-input");
    const modalResults = $("#search-results");
    const heroInput = $("#hero-search-input");
    const heroResults = $("#hero-search-results");

    function openModal() {
      if (!modal) return;
      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      if (modalInput) { modalInput.focus(); modalInput.select(); }
    }
    function closeModal() {
      if (!modal) return;
      modal.classList.add("hidden");
      document.body.style.overflow = "";
    }

    const trigger = $("#search-trigger");
    if (trigger) trigger.addEventListener("click", openModal);

    $$("[data-close-search]").forEach(el => el.addEventListener("click", closeModal));

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openModal(); }
      else if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        e.preventDefault();
        if (heroInput) { heroInput.focus(); heroInput.scrollIntoView({ behavior: "smooth", block: "center" }); }
        else openModal();
      } else if (e.key === "Escape") { closeModal(); if (heroResults) heroResults.classList.add("hidden"); }
    });

    if (modalInput) {
      let timer;
      modalInput.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => renderSearchResults(modalResults, modalInput.value), 120);
      });
      modalInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const first = modalResults ? modalResults.querySelector("a") : null;
          if (first) { window.location.href = first.getAttribute("href"); }
        }
      });
    }

    if (heroInput) {
      let timer;
      heroInput.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => renderSearchResults(heroResults, heroInput.value), 120);
      });
      heroInput.addEventListener("focus", () => { if (heroInput.value.trim()) heroResults && heroResults.classList.remove("hidden"); });
    }

    document.addEventListener("click", (e) => {
      if (heroResults && heroInput && !$("#hero-search-wrap").contains(e.target)) {
        heroResults.classList.add("hidden");
      }
    });
  }

  function setupFilterEvents() {
    document.addEventListener("click", (e) => {
      const filterBtn = e.target.closest("[data-filter]");
      if (filterBtn) { setCategoryFilter(filterBtn.getAttribute("data-filter")); return; }

      const catCard = e.target.closest("[data-filter-category]");
      if (catCard) { setCategoryFilter(catCard.getAttribute("data-filter-category")); return; }

      const tagBtn = e.target.closest("[data-filter-tag]");
      if (tagBtn) { setTagFilter(tagBtn.getAttribute("data-filter-tag")); return; }

      if (e.target.id === "clear-tag") { activeTag = null; renderFilterBar(); renderTutorials(); }
    });
  }

  function setupMobileMenu() {
    const toggle = $("#mobile-toggle");
    const menu = $("#mobile-menu");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", () => menu.classList.toggle("hidden"));
    $$("a", menu).forEach(a => a.addEventListener("click", () => menu.classList.add("hidden")));
  }

  function setupBackToTop() {
    const btn = $("#back-to-top");
    if (!btn) return;
    window.addEventListener("scroll", () => {
      btn.classList.toggle("hidden", window.scrollY < 500);
      btn.classList.toggle("flex", window.scrollY >= 500);
    }, { passive: true });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  function setupScrollProgress() {
    const bar = $("#scroll-progress");
    if (!bar) return;
    window.addEventListener("scroll", () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = pct + "%";
    }, { passive: true });
  }

  function setupHeaderActive() {
    const links = $$("nav .kb-nav-link");
    if (!links.length) return;
    const sections = links.map(l => $(l.getAttribute("href"))).filter(Boolean);
    window.addEventListener("scroll", () => {
      let currentId = "";
      sections.forEach(sec => { if (sec.getBoundingClientRect().top <= 120) currentId = "#" + sec.id; });
      links.forEach(l => l.classList.toggle("active", l.getAttribute("href") === currentId));
    }, { passive: true });
  }

  let fadeObserver;
  function observeFadeUps(root) {
    if (typeof IntersectionObserver === "undefined") {
      $$(".kb-fade-up", root || document).forEach((el) => el.classList.add("kb-visible"));
      return;
    }
    if (!fadeObserver) {
      fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add("kb-visible"); fadeObserver.unobserve(entry.target); }
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    }
    $$(".kb-fade-up:not(.kb-visible)", root || document).forEach(el => fadeObserver.observe(el));
  }

  function setupTypedEffect() {
    const cmdEl = $("#typed-command");
    const outEl = $("#typed-output");
    if (!cmdEl || !outEl) return;
    const lines = [
      { cmd: "nmap -sV 10.10.10.5", out: "PORT   STATE SERVICE VERSION\n22/tcp open  ssh     OpenSSH 8.9\n80/tcp open  http    Apache 2.4.52" },
      { cmd: "sudo -l", out: "(root) NOPASSWD: /usr/bin/find" },
      { cmd: "ipcalc 192.168.10.0/26", out: "Netmask: 255.255.255.192  Hosts: 62  Range: .1 - .62" },
      { cmd: "./deploy.sh --prod", out: "[ok] build selesai · 0 error · siap deploy 🚀" },
    ];
    let li = 0;
    function typeLine() {
      const { cmd, out } = lines[li];
      cmdEl.textContent = ""; outEl.textContent = "";
      let ci = 0;
      const typer = setInterval(() => {
        cmdEl.textContent = cmd.slice(0, ++ci);
        if (ci >= cmd.length) {
          clearInterval(typer);
          setTimeout(() => {
            outEl.innerHTML = escapeHtml(out).replace(/\n/g, "<br>");
            setTimeout(() => { li = (li + 1) % lines.length; typeLine(); }, 2600);
          }, 450);
        }
      }, 45);
    }
    typeLine();
  }

  function setupYear() {
    const el = $("#year");
    if (el) el.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderCategories();
    renderPopularTags();
    renderStats();
    renderFilterBar();
    renderTutorials();
    setupSearch();
    setupFilterEvents();
    setupMobileMenu();
    setupBackToTop();
    setupScrollProgress();
    setupHeaderActive();
    setupTypedEffect();
    setupYear();
    observeFadeUps(document);
  });
})();
