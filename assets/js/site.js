/* ============================================================
   IoT at Home — Website utama
   Semua tampilan membaca Store (data yang sama dengan admin).
   ============================================================ */
(function () {
  const app = document.getElementById('app');

  /* ---------------- helpers ---------------- */
  function shade(hex, percent) {
    const h = String(hex || '#0d9488').replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const num = parseInt(full, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * percent / 100)));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(255 * percent / 100)));
    const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(255 * percent / 100)));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  function applyTheme() {
    const s = Store.get().settings;
    document.documentElement.style.setProperty('--primary', s.primaryColor || '#0d9488');
    document.documentElement.style.setProperty('--primary-dark', shade(s.primaryColor || '#0d9488', -14));
    document.documentElement.style.setProperty('--accent', s.accentColor || '#e0f2fe');
    document.getElementById('brandName').textContent = s.siteName;
    document.getElementById('brandTagline').textContent = s.tagline;
    document.getElementById('footerName').textContent = s.siteName;
    document.getElementById('footerTagline').textContent = s.tagline;
    document.getElementById('footerText').textContent = s.footer;
    document.title = `${s.siteName} — ${s.tagline}`;
  }

  function catOf(project) { return Store.categoryById(project.category); }
  function difficultyClass(level) {
    return 'badge-level-' + String(level || '').toLowerCase();
  }
  function statusLabel(status) {
    return ({
      published: 'Published', draft: 'Draft', generated: 'Generated', reviewed: 'Reviewed', archived: 'Archived'
    })[status] || status;
  }
  function thumbMarkup(project, compact = false) {
    if (project.image) return `<img src="${esc(project.image)}" alt="${esc(project.name)}" loading="lazy" />`;
    const cat = catOf(project);
    const glyph = cat && cat.icon ? cat.icon : '🔌';
    return compact ? `<span>${glyph}</span>` : `<span class="thumb-glyph">${glyph}</span>`;
  }
  function isSaved(projectId) { return Store.get().myBuild.some(b => b.projectId === projectId); }

  function projectCard(project) {
    const cat = catOf(project);
    const cost = Store.projectCost(project);
    const typeBadge = project.type === 'ai' ? '<span class="badge badge-accent type-tag">AI generated</span>' : '';
    return `
      <article class="project-card">
        <div class="project-thumb">
          ${thumbMarkup(project)}
          ${typeBadge}
          <button class="fav-btn ${isSaved(project.id) ? 'saved' : ''}" data-save="${project.id}"
            title="${isSaved(project.id) ? 'Tersimpan di My Build' : 'Simpan ke My Build'}"
            aria-label="Simpan ${esc(project.name)} ke My Build">
            ${isSaved(project.id) ? '★' : '☆'}
          </button>
        </div>
        <div class="project-body">
          <div class="row between" style="gap:8px">
            <span class="badge badge-primary">${esc(cat ? cat.icon + ' ' + cat.name : 'Tanpa kategori')}</span>
            <span class="badge ${difficultyClass(project.difficulty)}">${esc(project.difficulty)}</span>
          </div>
          <h3><a href="#/project/${esc(project.slug)}">${esc(project.name)}</a></h3>
          <p class="project-desc">${esc(project.shortDescription || project.description)}</p>
          <div class="meta-row">
            <div><strong>${shortMoney(cost)}</strong><br /><span style="font-size:.7rem">estimasi komponen</span></div>
            <div style="text-align:right"><strong>${esc(project.duration || '—')}</strong><br /><span style="font-size:.7rem">durasi build</span></div>
          </div>
        </div>
      </article>`;
  }

  function categoryCard(cat) {
    const count = Store.get().projects.filter(p => p.category === cat.id && Store.isVisible(p)).length;
    return `<button class="category-card" data-category="${cat.id}">
      <span class="category-icon">${esc(cat.icon)}</span>
      <span><strong>${esc(cat.name)}</strong><span>${count} proyek</span></span>
    </button>`;
  }

  function sectionHead(title, subtitle, link) {
    return `<div class="section-head">
      <div><h2>${esc(title)}</h2><p>${esc(subtitle || '')}</p></div>
      ${link ? `<a class="btn btn-outline btn-sm" href="${link.href}">${esc(link.text)} →</a>` : ''}
    </div>`;
  }

  /* ---------------- HOME ---------------- */
  function viewHome() {
    const s = Store.get();
    const visible = Store.visibleProjects();
    const hero = s.hero;
    const featuredProjects = s.featured.map(id => visible.find(p => p.id === id)).filter(Boolean);
    const popular = [...visible].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
    const beginner = visible.filter(p => p.difficulty === 'Beginner').slice(0, 3);
    const budgetFriendly = visible.filter(p => Store.projectCost(p) <= 250000).slice(0, 3);
    const homeCats = s.homeCategories.map(id => Store.categoryById(id)).filter(c => c && c.status === 'active');

    const heroVisual = hero.image
      ? `<img src="${esc(hero.image)}" alt="Ilustrasi proyek IoT" />`
      : `<div class="hero-board">
          <div class="dot-row"><span class="dot"></span><span class="dot"></span><span class="dot"></span>
            <span style="margin-left:auto;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;opacity:.8">Project blueprint</span></div>
          <div class="hero-node"><div><strong>Soil moisture</strong><br /><small>Input · analog</small></div><span>▶</span></div>
          <div class="hero-node"><div><strong>ESP32 Controller</strong><br /><small>Processing · threshold</small></div><span>⚙</span></div>
          <div class="hero-node"><div><strong>Water pump</strong><br /><small>Output · relay 5V</small></div><span>✓</span></div>
          <div class="hero-flow"><span>Sensor</span>→<span>Controller</span>→<span>Output</span>→<span>Notifikasi</span></div>
        </div>`;

    const blocks = {
      featured: () => featuredProjects.length
        ? `<div class="card-grid">${featuredProjects.map(projectCard).join('')}</div>`
        : emptyState('Belum ada featured project', 'Pilih proyek unggulan dari Admin → Content Management.'),
      popular: () => popular.length
        ? `<div class="card-grid">${popular.map(projectCard).join('')}</div>`
        : emptyState('Belum ada data kunjungan', 'Proyek akan muncul di sini setelah dilihat pengunjung.'),
      beginner: () => beginner.length
        ? `<div class="card-grid">${beginner.map(projectCard).join('')}</div>`
        : emptyState('Belum ada proyek pemula', 'Tambahkan proyek dengan difficulty Beginner dari Admin.'),
      budget: () => budgetFriendly.length
        ? `<div class="card-grid">${budgetFriendly.map(projectCard).join('')}</div>`
        : emptyState('Belum ada proyek hemat', 'Tambahkan proyek dengan estimasi komponen di bawah Rp 250.000.'),
      categories: () => homeCats.length
        ? `<div class="category-grid">${homeCats.map(categoryCard).join('')}</div>`
        : emptyState('Belum ada kategori aktif', 'Aktifkan kategori dari Admin → Categories.')
    };

    const sectionsHtml = (s.sections || []).filter(sec => sec.enabled !== false).map(sec => {
      const render = blocks[sec.id];
      if (!render) return '';
      return `<section class="section"><div class="container">
        ${sectionHead(sec.title, sec.subtitle, sec.id === 'featured' ? { href: '#/explore', text: 'Lihat semua' } : null)}
        ${render()}
      </div></section>`;
    }).join('');

    return `
      <section class="hero">
        <div class="container hero-grid">
          <div>
            <span class="eyebrow">${esc(hero.subtitle)}</span>
            <h1>${esc(hero.title)}</h1>
            <p class="hero-desc">${esc(hero.description)}</p>
            <div class="hero-cta">
              <a class="btn btn-primary" href="${esc(hero.ctaLink || '#/ai-builder')}">${esc(hero.ctaText)} →</a>
              <a class="btn btn-outline" href="#/explore">Jelajahi project</a>
            </div>
            <div class="hero-stats">
              <div><strong>${visible.length}</strong><span>Proyek</span></div>
              <div><strong>${Store.get().components.length}</strong><span>Komponen</span></div>
              <div><strong>${s.categories.filter(c => c.status === 'active').length}</strong><span>Kategori</span></div>
              <div><strong>${s.projects.filter(p => p.type === 'ai').length}</strong><span>AI generated</span></div>
            </div>
          </div>
          <div class="hero-visual">${heroVisual}</div>
        </div>
      </section>

      <section class="container" style="margin-top:26px">
        <div class="card" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
          <div class="brand-mark" style="width:44px;height:44px">${Icons.spark}</div>
          <div class="grow">
            <strong>Punya ide tapi bingung mulai dari mana?</strong>
            <p class="small text-muted" style="margin:2px 0 0">Tulis idemu di AI Builder — sistem menyusun blueprint komponen, budget, wiring, dan langkah build secara lokal.</p>
          </div>
          <a class="btn btn-soft btn-sm" href="#/ai-builder">Coba AI Builder</a>
        </div>
      </section>
      ${sectionsHtml}
      <section class="section"><div class="container">
        <div class="card card-pad-lg" style="background:linear-gradient(150deg,#0f766e,#0d9488);color:#fff;border:0">
          <div class="row between wrap" style="gap:20px">
            <div style="max-width:56ch">
              <h2 style="color:#fff;font-size:1.5rem">Bangun, uji, lalu dokumentasikan.</h2>
              <p style="color:#ccfbf1;margin:0">Simpan proyek ke My Build untuk melacak progres tiap langkah, lalu susun Shopping List dengan estimasi harga terbaru dari component database.</p>
            </div>
            <div class="row wrap">
              <a class="btn" href="#/my-build" style="background:#fff;color:#0f766e">Buka My Build</a>
              <a class="btn" href="#/budget" style="background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.4)">Budget Builder</a>
            </div>
          </div>
        </div>
      </div></section>`;
  }

  function emptyState(title, text) {
    return `<div class="empty-state card"><span class="glyph">🧰</span><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
  }

  /* ---------------- EXPLORE ---------------- */
  const exploreState = { q: '', category: '', difficulty: '', sort: 'newest', page: 1, budgetMax: '' };

  function viewExplore() {
    const cats = Store.get().categories.filter(c => c.status === 'active');
    const all = Store.visibleProjects();
    let list = [...all];
    const q = exploreState.q.toLowerCase();
    if (q) {
      list = list.filter(p => [p.name, p.shortDescription, p.description, p.difficulty, p.type]
        .concat((p.tags || [])).concat([catOf(p)?.name || ''])
        .join(' ').toLowerCase().includes(q));
    }
    if (exploreState.category) list = list.filter(p => p.category === exploreState.category);
    if (exploreState.difficulty) list = list.filter(p => p.difficulty === exploreState.difficulty);
    if (exploreState.budgetMax) list = list.filter(p => Store.projectCost(p) <= Number(exploreState.budgetMax));
    const sorters = {
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      name: (a, b) => byText(a.name, b.name),
      budgetAsc: (a, b) => Store.projectCost(a) - Store.projectCost(b),
      budgetDesc: (a, b) => Store.projectCost(b) - Store.projectCost(a),
      popular: (a, b) => (b.views || 0) - (a.views || 0)
    };
    list.sort(sorters[exploreState.sort] || sorters.newest);

    const perPage = 9;
    const pages = Math.max(1, Math.ceil(list.length / perPage));
    if (exploreState.page > pages) exploreState.page = pages;
    const slice = list.slice((exploreState.page - 1) * perPage, exploreState.page * perPage);

    return `<section class="section"><div class="container">
      <div class="breadcrumb"><a href="#/">Home</a><span>/</span><span>Explore Projects</span></div>
      <div class="section-head">
        <div><h2>Explore Projects</h2><p>${list.length} proyek dari database — termasuk proyek hasil AI Builder.</p></div>
        <button class="chip ${exploreState.q || exploreState.category || exploreState.difficulty || exploreState.budgetMax ? '' : 'active'}" data-reset-explore>Reset filter</button>
      </div>
      <div class="card" style="margin-bottom:20px">
        <div class="filter-bar">
          <label class="header-search" style="flex:1;min-width:220px;width:auto;background:var(--bg)">
            <span>${Icons.search}</span>
            <input id="exploreSearch" type="search" placeholder="Cari nama, kategori, deskripsi, tag…" value="${esc(exploreState.q)}" />
          </label>
          <select id="exploreCategory" aria-label="Filter kategori">
            <option value="">Semua kategori</option>
            ${cats.map(c => `<option value="${c.id}" ${exploreState.category === c.id ? 'selected' : ''}>${esc(c.icon + ' ' + c.name)}</option>`).join('')}
          </select>
          <select id="exploreDifficulty" aria-label="Filter difficulty">
            <option value="">Semua level</option>
            ${['Beginner', 'Intermediate', 'Advanced'].map(d => `<option value="${d}" ${exploreState.difficulty === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
          <select id="exploreBudget" aria-label="Filter budget">
            <option value="">Semua budget</option>
            ${[150000, 250000, 400000, 600000].map(v => `<option value="${v}" ${Number(exploreState.budgetMax) === v ? 'selected' : ''}>≤ ${money(v)}</option>`).join('')}
          </select>
          <select id="exploreSort" aria-label="Urutkan">
            <option value="newest" ${exploreState.sort === 'newest' ? 'selected' : ''}>Terbaru</option>
            <option value="popular" ${exploreState.sort === 'popular' ? 'selected' : ''}>Terpopuler</option>
            <option value="name" ${exploreState.sort === 'name' ? 'selected' : ''}>Nama A–Z</option>
            <option value="budgetAsc" ${exploreState.sort === 'budgetAsc' ? 'selected' : ''}>Budget terendah</option>
            <option value="budgetDesc" ${exploreState.sort === 'budgetDesc' ? 'selected' : ''}>Budget tertinggi</option>
          </select>
        </div>
      </div>
      ${slice.length ? `<div class="card-grid">${slice.map(projectCard).join('')}</div>` : emptyState('Tidak ada proyek yang cocok', 'Coba ubah kata kunci atau reset filter untuk melihat semua proyek.')}
      ${renderPagination(list.length, perPage, exploreState.page, 'explore')}
    </div></section>`;
  }

  function renderPagination(total, perPage, page, ctx) {
    const pages = Math.max(1, Math.ceil(total / perPage));
    if (pages <= 1) return '';
    let btns = '';
    for (let i = 1; i <= pages; i++) {
      btns += `<button class="${i === page ? 'active' : ''}" data-page="${i}" data-ctx="${ctx}">${i}</button>`;
    }
    const from = total ? (page - 1) * perPage + 1 : 0;
    const to = Math.min(total, page * perPage);
    return `<div class="pagination">
      <span>Menampilkan ${from}–${to} dari ${total}</span>
      <div class="pages">
        <button data-page="${page - 1}" data-ctx="${ctx}" ${page === 1 ? 'disabled' : ''}>‹</button>
        ${btns}
        <button data-page="${page + 1}" data-ctx="${ctx}" ${page === pages ? 'disabled' : ''}>›</button>
      </div>
    </div>`;
  }

  /* ---------------- PROJECT DETAIL ---------------- */
  let detailTab = 'overview';
  let currentSlug = '';

  function viewProject(slug) {
    const project = Store.projectBySlug(slug);
    if (!project || !Store.isVisible(project)) {
      return `<section class="section"><div class="container">${emptyState('Proyek tidak ditemukan', 'Proyek mungkin sudah dihapus, masih draft, atau belum dipublikasikan.')}</div></section>`;
    }
    if (currentSlug !== slug) { detailTab = 'overview'; currentSlug = slug; }
    const cat = catOf(project);
    const comps = Store.projectComponentDetails(project);
    const cost = Store.projectCost(project);
    const saved = isSaved(project.id);
    const tabs = [['overview', 'Overview'], ['components', 'Components'], ['guide', 'Build Guide'], ['testing', 'Testing'], ['troubleshoot', 'Troubleshooting']];

    return `<section class="section" style="padding-top:8px"><div class="container">
      <div class="breadcrumb"><a href="#/">Home</a><span>/</span><a href="#/explore">Explore</a><span>/</span><span>${esc(project.name)}</span></div>
      <div class="detail-grid">
        <div>
          <div class="detail-hero">${thumbMarkup(project)}</div>
          <div class="row wrap" style="margin-top:16px;gap:8px">
            <span class="badge badge-primary">${esc(cat ? cat.icon + ' ' + cat.name : 'Tanpa kategori')}</span>
            <span class="badge ${difficultyClass(project.difficulty)}">${esc(project.difficulty)}</span>
            <span class="badge">${esc(project.duration)}</span>
            ${project.type === 'ai' ? `<span class="badge badge-accent">AI generated · ${esc(statusLabel(project.status))}</span>` : `<span class="badge">${esc(statusLabel(project.status))}</span>`}
          </div>
          <h1 style="font-size:1.9rem;margin:14px 0 6px">${esc(project.name)}</h1>
          <p style="color:#475569;font-size:.98rem">${esc(project.description)}</p>
          <div class="tag-row" style="margin-bottom:6px">${(project.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</div>

          ${project.type === 'ai' ? `<div class="callout callout-info" style="margin-top:14px">
            <strong>Catatan verifikasi:</strong> blueprint ini dibuat oleh generator lokal (template-based). Instruksi teknis, wiring, dan kode belum tentu terverifikasi — periksa kembali sebelum merakit.
          </div>` : ''}

          <div class="tabs" role="tablist">
            ${tabs.map(([key, label]) => `<button role="tab" class="${detailTab === key ? 'active' : ''}" data-tab="${key}">${label}</button>`).join('')}
          </div>
          <div id="detailTabBody">${detailTabBody(project, comps)}</div>
        </div>
        <aside class="sidebar-sticky">
          <div class="card">
            <span class="eyebrow">Estimasi biaya</span>
            <div style="font-size:1.9rem;font-weight:800;letter-spacing:-.03em">${money(cost)}</div>
            <p class="small text-muted" style="margin:2px 0 14px">Dihitung dari ${comps.length} komponen pada database (harga terbaru).</p>
            <div class="spec-list">
              <div><span>Budget target</span><strong>${money(project.budget)}</strong></div>
              <div><span>Durasi build</span><strong>${esc(project.duration)}</strong></div>
              <div><span>Level</span><strong>${esc(project.difficulty)}</strong></div>
              <div><span>Sumber</span><strong>${project.type === 'ai' ? 'AI Builder' : 'Kurasi default'}</strong></div>
            </div>
            <div class="stack" style="margin-top:16px">
              <button class="btn btn-primary btn-block" data-save="${project.id}">${saved ? '★ Tersimpan di My Build' : '☆ Simpan ke My Build'}</button>
              <button class="btn btn-outline btn-block" data-add-project-shopping="${project.id}">Tambah komponen ke Shopping List</button>
              <a class="btn btn-ghost btn-block" href="#/budget">Hitung ulang di Budget Builder</a>
            </div>
          </div>
          <div class="card">
            <h3 style="font-size:.95rem">Komponen utama</h3>
            <div class="spec-list">
              ${comps.slice(0, 6).map(c => `<div><span>${esc(c.component.name)} ×${c.qty}</span><strong>${shortMoney(c.component.price * c.qty)}</strong></div>`).join('') || '<p class="small text-muted">Belum ada komponen.</p>'}
            </div>
          </div>
          <div class="sticky-note">Butuh bantuan memilih komponen? Tanya Nara Assistant di kanan bawah.</div>
        </aside>
      </div>
    </div></section>`;
  }

  function detailTabBody(project, comps) {
    if (detailTab === 'components') {
      return `<div class="table-wrap">
        <table class="data">
          <thead><tr><th>Komponen</th><th>Qty</th><th>Status</th><th>Harga</th><th>Subtotal</th><th></th></tr></thead>
          <tbody>
            ${comps.map(c => `<tr>
              <td><div class="comp-cell"><span class="comp-thumb">${c.component.image ? `<img src="${esc(c.component.image)}" alt="">` : '🔌'}</span>
                <div><strong>${esc(c.component.name)}</strong><br /><span class="small text-muted">${esc(c.component.category)} · ${esc(c.component.communication)}</span></div></div></td>
              <td>×${c.qty}</td>
              <td>${c.mandatory ? '<span class="badge badge-primary">Wajib</span>' : '<span class="badge">Opsional</span>'}</td>
              <td class="price-cell">${money(c.component.price)}</td>
              <td class="price-cell">${money(c.component.price * c.qty)}</td>
              <td><button class="btn btn-soft btn-sm" data-add-comp="${c.component.id}" data-qty="${c.qty}">+ List</button></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
        <div class="summary-box" style="margin-top:16px">
          <div class="summary-line"><span>Total komponen</span><strong>${money(Store.projectCost(project))}</strong></div>
          <div class="summary-line"><span>Catatan</span><span style="max-width:32ch;text-align:right">Harga estimasi pasar; bisa berbeda di toko.</span></div>
        </div>`;
    }
    if (detailTab === 'guide') {
      return `<div class="prose">
        ${project.architecture ? `<h3 style="margin-top:0">System architecture</h3>
          <p>${esc(project.architecture.description)}</p>
          <div class="arch-grid">
            ${[['Input', project.architecture.input], ['Controller', project.architecture.controller], ['Processing', project.architecture.processing], ['Output', project.architecture.output], ['Communication', project.architecture.communication]]
              .filter(([, v]) => v).map(([k, v]) => `<div class="arch-item"><span>${k}</span><strong>${esc(v)}</strong></div>`).join('')}
          </div>` : ''}
        ${project.wiring ? `<h3>Wiring</h3><div class="callout callout-info">${esc(project.wiring)}</div>` : ''}
        <h3>Langkah build</h3>
        ${(project.buildGuide || []).map((step, i) => `<div class="guide-step">
          <span class="step-num">${i + 1}</span>
          <div class="grow">
            <h4>${esc(step.title)}</h4>
            <p>${esc(step.description)}</p>
            ${step.image ? `<img class="file-preview" src="${esc(step.image)}" alt="Ilustrasi langkah ${i + 1}" />` : ''}
            <ol>${(step.instructions || []).map(t => `<li>${esc(t)}</li>`).join('')}</ol>
            ${step.notes ? `<div class="callout callout-info">📝 ${esc(step.notes)}</div>` : ''}
            ${step.warning ? `<div class="callout callout-warn">⚠ ${esc(step.warning)}</div>` : ''}
          </div>
        </div>`).join('') || '<p class="text-muted">Belum ada build guide.</p>'}
        ${project.sourceCode ? `<h3>Source code</h3><div class="code-block"><pre>${esc(project.sourceCode)}</pre></div>` : ''}
      </div>`;
    }
    if (detailTab === 'testing') {
      return `<div class="prose"><h3 style="margin-top:0">Testing checklist</h3>
        ${(project.testing || []).map((t, i) => `<div class="accordion ${i === 0 ? 'open' : ''}">
          <button data-acc>${esc(t.name)}<span>${Icons.chevron}</span></button>
          <div class="acc-body">
            <div class="acc-row"><b>Deskripsi:</b> ${esc(t.description)}</div>
            <div class="acc-row"><b>Instruksi:</b> ${esc(t.instructions)}</div>
            <div class="acc-row"><b>Hasil yang diharapkan:</b> ${esc(t.expected)}</div>
          </div></div>`).join('') || '<p class="text-muted">Belum ada data testing.</p>'}
      </div>`;
    }
    if (detailTab === 'troubleshoot') {
      return `<div class="prose"><h3 style="margin-top:0">Troubleshooting</h3>
        ${(project.troubleshooting || []).map(t => `<div class="accordion">
          <button data-acc>${esc(t.problem)}<span>${Icons.chevron}</span></button>
          <div class="acc-body">
            <div class="acc-row"><b>Penyebab:</b> ${esc(t.cause)}</div>
            <div class="acc-row"><b>Solusi:</b> ${esc(t.solution)}</div>
          </div></div>`).join('') || '<p class="text-muted">Belum ada data troubleshooting.</p>'}
        <h3>Upgrade ideas</h3>
        <ul>${(project.upgrades || []).map(u => `<li>${esc(u)}</li>`).join('') || '<li>Belum ada ide upgrade.</li>'}</ul>
      </div>`;
    }
    return `<div class="prose">
      ${project.purpose ? `<h3 style="margin-top:0">Tujuan</h3><p>${esc(project.purpose)}</p>` : ''}
      ${project.outcome ? `<h3>Hasil yang diharapkan</h3><p>${esc(project.outcome)}</p>` : ''}
      <h3>Fitur utama</h3>
      <ul class="feature-list">${(project.features || []).map(f => `<li>${esc(f)}</li>`).join('') || '<li>Belum ada fitur tercatat.</li>'}</ul>
      <h3>Cara kerja</h3>
      <div class="flow-line">
        ${(project.howItWorks || []).map((step, i) => `${i ? '<span class="arrow">→</span>' : ''}<span class="step">${esc(step)}</span>`).join('') || '<span class="text-muted small">Belum diisi.</span>'}
      </div>
      <h3>Ringkasan arsitektur</h3>
      <div class="arch-grid">
        ${project.architecture ? [['Input', project.architecture.input], ['Controller', project.architecture.controller], ['Processing', project.architecture.processing], ['Output', project.architecture.output]]
          .filter(([, v]) => v).map(([k, v]) => `<div class="arch-item"><span>${k}</span><strong>${esc(v)}</strong></div>`).join('') : ''}
      </div>
    </div>`;
  }

  /* ---------------- COMPONENTS ---------------- */
  const compState = { q: '', category: '', sort: 'name', page: 1 };

  function viewComponents() {
    const all = Store.get().components;
    const cats = [...new Set(all.map(c => c.category))].sort(byText);
    let list = [...all];
    const q = compState.q.toLowerCase();
    if (q) list = list.filter(c => [c.name, c.category, c.spec, c.communication, c.description, c.function, c.compatibility].join(' ').toLowerCase().includes(q));
    if (compState.category) list = list.filter(c => c.category === compState.category);
    list.sort(compState.sort === 'price' ? (a, b) => a.price - b.price : compState.sort === 'priceDesc' ? (a, b) => b.price - a.price : (a, b) => byText(a.name, b.name));
    const perPage = 12;
    const pages = Math.max(1, Math.ceil(list.length / perPage));
    if (compState.page > pages) compState.page = pages;
    const slice = list.slice((compState.page - 1) * perPage, compState.page * perPage);

    return `<section class="section"><div class="container">
      <div class="breadcrumb"><a href="#/">Home</a><span>/</span><span>Components</span></div>
      <div class="section-head">
        <div><h2>Component Explorer</h2><p>${all.length} komponen pada database yang sama dengan project & budget builder.</p></div>
        <a class="btn btn-outline btn-sm" href="#/budget">Buka Budget Builder</a>
      </div>
      <div class="card" style="margin-bottom:20px">
        <div class="filter-bar">
          <label class="header-search" style="flex:1;min-width:220px;width:auto;background:var(--bg)">
            <span>${Icons.search}</span>
            <input id="compSearch" type="search" placeholder="Cari nama, spesifikasi, komunikasi…" value="${esc(compState.q)}" />
          </label>
          <select id="compCategory"><option value="">Semua tipe</option>${cats.map(c => `<option value="${esc(c)}" ${compState.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
          <select id="compSort">
            <option value="name" ${compState.sort === 'name' ? 'selected' : ''}>Nama A–Z</option>
            <option value="price" ${compState.sort === 'price' ? 'selected' : ''}>Harga terendah</option>
            <option value="priceDesc" ${compState.sort === 'priceDesc' ? 'selected' : ''}>Harga tertinggi</option>
          </select>
        </div>
      </div>
      ${slice.length ? `<div class="table-wrap"><table class="data">
        <thead><tr><th>Komponen</th><th>Kategori</th><th>Harga</th><th>Voltage</th><th>Komunikasi</th><th>Aksi</th></tr></thead>
        <tbody>${slice.map(c => `<tr>
          <td><div class="comp-cell"><span class="comp-thumb">${c.image ? `<img src="${esc(c.image)}" alt="">` : '🔌'}</span>
            <div><strong>${esc(c.name)}</strong><br /><span class="small text-muted">${esc(c.spec)}</span></div></div></td>
          <td><span class="badge">${esc(c.category)}</span></td>
          <td class="price-cell">${money(c.price)}</td>
          <td class="small">${esc(c.voltage)}</td>
          <td class="small">${esc(c.communication)}</td>
          <td><div class="row" style="gap:6px;flex-wrap:nowrap">
            <button class="btn btn-ghost btn-sm" data-comp-view="${c.id}">Detail</button>
            <button class="btn btn-soft btn-sm" data-add-comp="${c.id}" data-qty="1">+ List</button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table></div>` : emptyState('Komponen tidak ditemukan', 'Ubah kata kunci pencarian atau tambahkan komponen baru dari Admin Dashboard.')}
      ${renderPagination(list.length, perPage, compState.page, 'components')}
    </div></section>`;
  }

  function openComponentModal(id) {
    const c = Store.componentById(id);
    if (!c) return;
    Store.track('component_view', { componentId: c.id });
    const usedIn = Store.get().projects.filter(p => (p.components || []).some(x => x.componentId === c.id));
    openModal({
      title: c.name, size: 'modal-lg',
      body: `<div class="row wrap" style="align-items:flex-start;gap:18px">
        <div class="comp-thumb" style="width:96px;height:96px;font-size:2rem">${c.image ? `<img src="${esc(c.image)}" alt="">` : '🔌'}</div>
        <div class="grow" style="min-width:220px">
          <div class="row wrap" style="gap:6px"><span class="badge badge-primary">${esc(c.category)}</span><span class="badge">${esc(c.difficulty)}</span><span class="badge">${esc(c.communication)}</span></div>
          <p class="small" style="margin:10px 0 0">${esc(c.description)}</p>
        </div>
        <div style="text-align:right"><div class="price-cell" style="font-size:1.25rem">${money(c.price)}</div><span class="small text-muted">estimasi</span></div>
      </div>
      <div class="spec-list" style="margin-top:16px">
        <div><span>Fungsi</span><strong style="max-width:60%">${esc(c.function)}</strong></div>
        <div><span>Spesifikasi</span><strong style="max-width:60%">${esc(c.spec)}</strong></div>
        <div><span>Operating voltage</span><strong>${esc(c.voltage)}</strong></div>
        <div><span>Current rating</span><strong>${esc(c.current)}</strong></div>
        <div><span>Kompatibilitas</span><strong style="max-width:60%">${esc(c.compatibility)}</strong></div>
        <div><span>Dipakai di</span><strong>${usedIn.length} proyek</strong></div>
      </div>
      ${c.notes ? `<div class="callout callout-info" style="margin-top:12px">${esc(c.notes)}</div>` : ''}
      ${(c.alternatives || []).length ? `<h3 style="font-size:.95rem;margin:18px 0 8px">Alternatif komponen</h3>
        <div class="table-wrap"><table class="data" style="min-width:0"><tbody>
        ${c.alternatives.map(a => `<tr><td><strong>${esc(a.name)}</strong><br /><span class="small text-muted">${esc(a.compatibility)}</span></td>
          <td><span class="badge ${a.type === 'Budget' ? 'badge-primary' : a.type === 'Premium' ? 'badge-warn' : 'badge-accent'}">${esc(a.type)}</span></td>
          <td class="price-cell">${money(a.price)}</td></tr>`).join('')}
        </tbody></table></div>` : ''}
      <div class="row wrap" style="margin-top:18px;gap:8px">
        ${c.shopee ? `<a class="btn btn-outline btn-sm" href="${esc(c.shopee)}" target="_blank" rel="noopener">Cari di Shopee</a>` : ''}
        ${c.tokopedia ? `<a class="btn btn-outline btn-sm" href="${esc(c.tokopedia)}" target="_blank" rel="noopener">Cari di Tokopedia</a>` : ''}
        ${c.datasheet ? `<a class="btn btn-ghost btn-sm" href="${esc(c.datasheet)}" target="_blank" rel="noopener">Datasheet</a>` : ''}
      </div>`,
      footer: `<button class="btn btn-outline" data-modal-close>Tutup</button>
        <button class="btn btn-primary" data-add-comp="${c.id}" data-qty="1" data-close-modal>+ Tambah ke Shopping List</button>`,
      onMount(root, close) {
        root.querySelectorAll('[data-modal-close]').forEach(b => b.addEventListener('click', close));
        root.querySelector('[data-close-modal]')?.addEventListener('click', () => {
          Store.addToShoppingList(c.id, 1);
          refreshChrome();
          toast('Komponen ditambahkan ke Shopping List.', 'success');
          setTimeout(close, 120);
        });
      }
    });
  }

  /* ---------------- MY BUILD ---------------- */
  function viewMyBuild() {
    const items = Store.get().myBuild.map(item => ({ ...item, project: Store.projectById(item.projectId) })).filter(x => x.project);
    const totalSteps = items.reduce((s, i) => s + (i.project.buildGuide || []).length, 0);
    const doneSteps = items.reduce((s, i) => s + i.progress.length, 0);
    if (!items.length) {
      return `<section class="section"><div class="container">
        <div class="breadcrumb"><a href="#/">Home</a><span>/</span><span>My Build</span></div>
        ${emptyState('Belum ada proyek di My Build', 'Simpan proyek dari kartu Explore atau halaman detail proyek untuk mulai melacak progres build.')}
        <div style="text-align:center"><a class="btn btn-primary" href="#/explore">Jelajahi proyek</a></div>
      </div></section>`;
    }
    return `<section class="section"><div class="container">
      <div class="breadcrumb"><a href="#/">Home</a><span>/</span><span>My Build</span></div>
      <div class="section-head"><div><h2>My Build</h2><p>${items.length} proyek tersimpan · ${doneSteps}/${totalSteps} langkah selesai.</p></div>
        <a class="btn btn-outline btn-sm" href="#/explore">Tambah proyek</a></div>
      <div class="stack" style="gap:18px">
        ${items.map(item => {
          const steps = item.project.buildGuide || [];
          const pct = steps.length ? Math.round((item.progress.length / steps.length) * 100) : 0;
          return `<div class="card">
            <div class="build-item" style="padding-top:0">
              <div class="build-thumb">${catOf(item.project)?.icon || '🔌'}</div>
              <div class="grow">
                <div class="row between wrap" style="gap:10px">
                  <div><h3 style="margin:0;font-size:1.05rem"><a href="#/project/${esc(item.project.slug)}">${esc(item.project.name)}</a></h3>
                    <span class="small text-muted">${esc(catOf(item.project)?.name || 'Tanpa kategori')} · ${money(Store.projectCost(item.project))} · ${esc(item.project.duration)}</span></div>
                  <div class="row" style="gap:6px">
                    <button class="btn btn-soft btn-sm" data-add-project-shopping="${item.project.id}">Shopping list</button>
                    <button class="btn btn-ghost btn-sm" data-remove-build="${item.project.id}">Hapus</button>
                  </div>
                </div>
                <div class="row" style="margin:12px 0 6px;justify-content:space-between"><span class="small text-muted">Progres build</span><strong class="small">${pct}%</strong></div>
                <div class="progress-track"><div style="width:${pct}%"></div></div>
              </div>
            </div>
            <div class="grid-2" style="gap:20px;margin-top:8px">
              <div>
                <span class="label">Checklist langkah</span>
                ${steps.length ? steps.map((step, idx) => `<label class="check-row ${item.progress.includes(idx) ? 'done' : ''}">
                  <input type="checkbox" data-build-step="${item.project.id}" data-step="${idx}" ${item.progress.includes(idx) ? 'checked' : ''} />
                  <span>${esc(step.title)}</span></label>`).join('') : '<p class="small text-muted">Proyek ini belum memiliki build guide.</p>'}
              </div>
              <div>
                <label class="label" for="notes-${item.project.id}">Catatan build</label>
                <textarea id="notes-${item.project.id}" data-build-notes="${item.project.id}" placeholder="Catatan komponen, kendala, atau hasil pengujian…">${esc(item.notes || '')}</textarea>
                <div class="sticky-note" style="margin-top:8px">Catatan disimpan otomatis di browser ini saat kamu mengetik (setelah berhenti sejenak).</div>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div></section>`;
  }

  /* ---------------- SHOPPING LIST ---------------- */
  function viewShoppingList() {
    const list = Store.get().shoppingList.map(i => ({ ...i, component: Store.componentById(i.componentId) })).filter(x => x.component);
    const total = list.reduce((s, i) => s + i.component.price * i.qty, 0);
    const checkedTotal = list.filter(i => i.checked).reduce((s, i) => s + i.component.price * i.qty, 0);
    return `<section class="section"><div class="container">
      <div class="breadcrumb"><a href="#/">Home</a><span>/</span><span>Shopping List</span></div>
      <div class="section-head"><div><h2>Shopping List</h2><p>${list.length} jenis komponen · total ${money(total)} (harga estimasi database).</p></div>
        ${list.length ? '<button class="btn btn-ghost btn-sm" id="clearShopping">Kosongkan list</button>' : ''}</div>
      ${list.length ? `<div class="table-wrap"><table class="data">
        <thead><tr><th>Beli</th><th>Komponen</th><th>Harga</th><th>Qty</th><th>Subtotal</th><th>Toko</th><th></th></tr></thead>
        <tbody>${list.map(i => `<tr style="${i.checked ? 'opacity:.55' : ''}">
          <td><input type="checkbox" data-shop-check="${i.componentId}" ${i.checked ? 'checked' : ''} aria-label="Tandai sudah dibeli" /></td>
          <td><div class="comp-cell"><span class="comp-thumb">${i.component.image ? `<img src="${esc(i.component.image)}" alt="">` : '🔌'}</span>
            <div><strong>${esc(i.component.name)}</strong><br /><span class="small text-muted">${esc(i.component.category)}</span></div></div></td>
          <td class="price-cell">${money(i.component.price)}</td>
          <td><input class="qty-input" type="number" min="1" value="${i.qty}" data-shop-qty="${i.componentId}" aria-label="Jumlah ${esc(i.component.name)}" /></td>
          <td class="price-cell">${money(i.component.price * i.qty)}</td>
          <td><div class="row" style="gap:4px;flex-wrap:nowrap">
            ${i.component.shopee ? `<a class="btn btn-ghost btn-sm" href="${esc(i.component.shopee)}" target="_blank" rel="noopener">Shopee</a>` : ''}
            ${i.component.tokopedia ? `<a class="btn btn-ghost btn-sm" href="${esc(i.component.tokopedia)}" target="_blank" rel="noopener">Tokped</a>` : ''}
          </div></td>
          <td><button class="mini-btn danger" data-shop-remove="${i.componentId}" aria-label="Hapus">✕</button></td>
        </tr>`).join('')}</tbody>
      </table></div>
      <div class="grid-2" style="margin-top:18px">
        <div class="summary-box">
          <div class="summary-line"><span>Total estimasi</span><strong>${money(total)}</strong></div>
          <div class="summary-line"><span>Sudah dibeli</span><span>${money(checkedTotal)}</span></div>
          <div class="summary-line"><span>Belum dibeli</span><span>${money(total - checkedTotal)}</span></div>
          <div class="summary-line total"><span>Sisa budget</span><span>Cek di Budget Builder</span></div>
        </div>
        <div class="card">
          <h3 style="font-size:.95rem">Catatan</h3>
          <p class="small text-muted">Harga adalah estimasi dari component database dan bisa berubah kapan saja. Link toko mengarah ke hasil pencarian, bukan produk tertentu.</p>
          <button class="btn btn-outline btn-block" id="copyShopping">Salin daftar belanja</button>
          <a class="btn btn-ghost btn-block" href="#/budget" style="margin-top:8px">Buka Budget Builder</a>
        </div>
      </div>` : emptyState('Shopping list masih kosong', 'Tambahkan komponen dari halaman proyek, Component Explorer, atau Budget Builder.')}
    </div></section>`;
  }

  /* ---------------- BUDGET BUILDER ---------------- */
  const budgetState = { target: 300000, items: {}, groupByProject: '' };

  function viewBudget() {
    const s = Store.get();
    const projects = Store.visibleProjects();
    const total = Object.entries(budgetState.items).reduce((sum, [id, qty]) => {
      const c = Store.componentById(id);
      return sum + (c ? c.price * qty : 0);
    }, 0);
    const remaining = budgetState.target - total;
    const pct = budgetState.target ? Math.min(100, Math.round((total / budgetState.target) * 100)) : 0;
    const chosen = Object.entries(budgetState.items).map(([id, qty]) => ({ component: Store.componentById(id), qty })).filter(x => x.component);

    return `<section class="section"><div class="container">
      <div class="breadcrumb"><a href="#/">Home</a><span>/</span><span>Budget Builder</span></div>
      <div class="section-head"><div><h2>Budget Builder</h2><p>Susun komponen dan bandingkan dengan budget yang kamu siapkan. Harga mengikuti component database.</p></div></div>
      <div class="detail-grid">
        <div class="card">
          <div class="grid-2">
            <div class="field"><label for="budgetTarget">Budget maksimal (Rp)</label>
              <input id="budgetTarget" type="number" min="0" step="10000" value="${budgetState.target}" /></div>
            <div class="field"><label for="budgetProject">Muat komponen dari proyek</label>
              <select id="budgetProject"><option value="">Pilih proyek…</option>
                ${projects.map(p => `<option value="${p.id}">${esc(p.name)} · ${shortMoney(Store.projectCost(p))}</option>`).join('')}
              </select></div>
          </div>
          <div class="field"><label for="budgetComponent">Tambah komponen</label>
            <select id="budgetComponent"><option value="">Pilih komponen…</option>
              ${s.components.map(c => `<option value="${c.id}">${esc(c.name)} — ${money(c.price)}</option>`).join('')}
            </select></div>
          <div class="summary-box" style="margin:6px 0 16px">
            <div class="summary-line"><span>Total komponen dipilih</span><strong>${money(total)}</strong></div>
            <div class="summary-line"><span>Budget</span><span>${money(budgetState.target)}</span></div>
            <div class="summary-line total"><span>${remaining >= 0 ? 'Sisa budget' : 'Melebihi budget'}</span><span style="color:${remaining >= 0 ? 'var(--primary-dark)' : 'var(--danger)'}">${money(Math.abs(remaining))}</span></div>
            <div class="progress-track" style="margin-top:10px"><div style="width:${pct}%;background:${remaining >= 0 ? '' : 'var(--danger)'}"></div></div>
          </div>
          ${chosen.length ? `<div class="comp-chosen">${chosen.map(({ component, qty }) => `<div class="chosen-row">
            <span class="grow"><strong>${esc(component.name)}</strong><br /><span class="small text-muted">${money(component.price)} × ${qty} = ${money(component.price * qty)}</span></span>
            <input type="number" min="1" value="${qty}" data-budget-qty="${component.id}" aria-label="Jumlah" />
            <button class="mini-btn danger" data-budget-remove="${component.id}" aria-label="Hapus">✕</button>
          </div>`).join('')}</div>` : `<div class="empty-state" style="padding:22px"><span class="glyph">🧮</span><h3>Belum ada komponen</h3><p>Pilih komponen atau muat dari proyek yang sudah ada.</p></div>`}
          <div class="row wrap" style="margin-top:16px;gap:8px">
            <button class="btn btn-primary" id="budgetToShopping" ${chosen.length ? '' : 'disabled'}>Tambah semua ke Shopping List</button>
            <button class="btn btn-ghost" id="budgetClear" ${chosen.length ? '' : 'disabled'}>Reset pilihan</button>
          </div>
        </div>
        <aside class="sidebar-sticky">
          <div class="card">
            <h3 style="font-size:.95rem">Rekomendasi cepat</h3>
            <p class="small text-muted">Muat kerangka komponen proyek hemat di bawah ini.</p>
            <div class="stack">
              ${projects.filter(p => Store.projectCost(p) <= 300000).slice(0, 4).map(p => `<button class="btn btn-outline btn-sm" data-budget-load="${p.id}" style="justify-content:space-between">${esc(p.name)}<span>${shortMoney(Store.projectCost(p))}</span></button>`).join('') || '<p class="small text-muted">Belum ada proyek hemat.</p>'}
            </div>
          </div>
          <div class="card">
            <h3 style="font-size:.95rem">Tips budget</h3>
            <ul class="small text-muted" style="padding-left:18px;margin:0">
              <li>Sisihkan ±15% untuk kabel, casing, dan ongkos kirim.</li>
              <li>Mulai dari board murah (NodeMCU) jika sensor sedikit.</li>
              <li>Beli komponen opsional setelah prototipe berhasil.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div></section>`;
  }

  function loadProjectIntoBudget(projectId) {
    const project = Store.projectById(projectId);
    if (!project) return;
    budgetState.items = {};
    (project.components || []).forEach(item => { budgetState.items[item.componentId] = item.qty || 1; });
    budgetState.target = Math.max(0, Math.round(Store.projectCost(project) * 1.15 / 10000) * 10000);
    render();
  }

  /* ---------------- AI BUILDER ---------------- */
  let generatedProjectId = null;

  const RECIPES = [
    {
      key: 'garden',
      match: ['tanaman', 'siram', 'hidroponik', 'kebun', 'garden', 'pot', 'soil', 'tanah', 'bibit'],
      category: 'cat_garden', name: 'Smart Garden Automation', glyph: '🌱',
      purpose: 'Menjaga tanaman tetap terawat dengan penyiraman berbasis data sensor.',
      outcome: 'Penyiraman otomatis dan pemantauan kondisi tanaman.',
      features: ['Penyiraman otomatis berbasis kelembapan tanah', 'Proteksi pompa saat air habis', 'Jadwal & kooldown penyiraman', 'Status ditampilkan di layar', 'Notifikasi Wi-Fi (opsional)'],
      components: ['cmp_esp32', 'cmp_soil', 'cmp_relay', 'cmp_pump', 'cmp_waterlevel', 'cmp_jumper', 'cmp_power'],
      steps: ['Siapkan wadah & jalur air', 'Rangkai sensor kelembapan', 'Hubungkan pompa melalui relay', 'Upload & kalibrasi ambang', 'Uji 24 jam'],
      code: `// Smart Garden Automation — ESP32 (blueprint lokal)
#define SOIL_PIN 34
#define RELAY_PIN 26
#define DRY_THRESHOLD 2600
#define PUMP_MS 4000

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);
}

void loop() {
  int soil = analogRead(SOIL_PIN);
  if (soil > DRY_THRESHOLD) {
    digitalWrite(RELAY_PIN, LOW);
    delay(PUMP_MS);
    digitalWrite(RELAY_PIN, HIGH);
    delay(30UL * 60UL * 1000UL);
  }
  delay(1500);
}`,
      tests: ['Uji pembacaan kelembapan tanah', 'Uji relay & pompa', 'Uji jeda anti-penyiraman ganda'],
      risks: ['Pompa kering jika wadah kosong', 'Korosi probe sensor murah']
    },
    {
      key: 'lighting',
      match: ['lampu', 'lighting', 'led', 'lorong', 'cahaya', 'lampu tidur', 'lampu kamar'],
      category: 'cat_lighting', name: 'Smart Lighting Control', glyph: '💡',
      purpose: 'Pencahayaan otomatis yang hemat energi dan nyaman.',
      outcome: 'Lampu menyala sesuai gerakan atau jadwal dengan warna yang dapat diatur.',
      features: ['Deteksi gerak untuk menyalakan lampu', 'Efek fade in/out halus', 'Durasi nyala dapat diatur', 'Warna LED dapat diubah', 'Mode hemat energi'],
      components: ['cmp_esp32', 'cmp_pir', 'cmp_led', 'cmp_power', 'cmp_jumper'],
      steps: ['Uji sensor gerak', 'Hubungkan LED strip', 'Upload logika fade', 'Atur durasi & sensitivitas'],
      code: `// Smart Lighting Control — ESP32 (blueprint lokal)
#include <Adafruit_NeoPixel.h>
#define LED_PIN 13
#define PIR_PIN 27
#define HOLD_MS 30000
Adafruit_NeoPixel strip(30, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  pinMode(PIR_PIN, INPUT);
  strip.begin();
  strip.setBrightness(0);
  strip.show();
}

void loop() {
  if (digitalRead(PIR_PIN) == HIGH) {
    strip.setBrightness(120);
    strip.fill(strip.Color(255, 200, 140));
    strip.show();
    delay(HOLD_MS);
    strip.setBrightness(0);
    strip.show();
  }
  delay(100);
}`,
      tests: ['Uji deteksi gerak', 'Uji timer mati otomatis', 'Uji efek warna'],
      risks: ['Sensor PIR salah deteksi karena panas/AC', 'Adaptor kurang daya untuk strip panjang']
    },
    {
      key: 'security',
      match: ['kunci', 'pintu', 'keamanan', 'rfid', 'alarm', 'security', 'akses'],
      category: 'cat_security', name: 'Smart Security Access', glyph: '🔒',
      purpose: 'Mengamankan akses ruang dengan autentikasi perangkat.',
      outcome: 'Akses hanya terbuka untuk identitas terdaftar dan tercatat.',
      features: ['Autentikasi kartu/tag RFID', 'Umpan balik buzzer & layar', 'Log akses terakhir', 'Kunci otomatis setelah beberapa detik', 'Mode kartu master'],
      components: ['cmp_esp32', 'cmp_rfid', 'cmp_servo', 'cmp_oled', 'cmp_buzzer', 'cmp_power', 'cmp_jumper'],
      steps: ['Sambungkan modul RFID (3.3V)', 'Pasang servo & buzzer', 'Daftarkan kartu akses', 'Uji buka-tutup otomatis'],
      code: `// Smart Security Access — ESP32 (blueprint lokal)
#include <SPI.h>
#include <MFRC522.h>
MFRC522 rfid(5, 4);
const String ALLOWED = "A1B2C3D4";

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) uid += String(rfid.uid.uidByte[i], HEX);
  uid.toUpperCase();
  Serial.println(uid == ALLOWED ? "Akses diterima" : "Akses ditolak");
  rfid.PICC_HaltA();
}`,
      tests: ['Uji kartu terdaftar', 'Uji kartu asing', 'Uji auto-lock'],
      risks: ['Bukan sistem keamanan bersertifikat', 'Modul RFID rusak jika diberi 5V']
    },
    {
      key: 'climate',
      match: ['suhu', 'kamar', 'ruangan', 'udara', 'ventilasi', 'kelembapan', 'cuaca', 'ac', 'lembap'],
      category: 'cat_room', name: 'Room Climate Monitor', glyph: '🌡️',
      purpose: 'Memantau dan menjaga kenyamanan suhu ruangan.',
      outcome: 'Data suhu & kelembapan real-time dengan kontrol pendingin otomatis.',
      features: ['Pembacaan suhu & kelembapan', 'Ambang kenyamanan dapat diatur', 'Kipas otomatis via relay', 'Tampilan layar lokal', 'Riwayat min/maks harian'],
      components: ['cmp_esp32', 'cmp_dht22', 'cmp_oled', 'cmp_relay', 'cmp_power', 'cmp_jumper'],
      steps: ['Rangkai sensor DHT22', 'Pasang layar OLED', 'Hubungkan relay kipas', 'Upload & kalibrasi ambang'],
      code: `// Room Climate Monitor — ESP32 (blueprint lokal)
#include <DHT.h>
#define DHTPIN 4
#define RELAY_FAN 26
DHT dht(DHTPIN, DHT22);

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(RELAY_FAN, OUTPUT);
  digitalWrite(RELAY_FAN, HIGH);
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t)) {
    bool hot = t > 30.0;
    digitalWrite(RELAY_FAN, hot ? LOW : HIGH);
    Serial.printf("Suhu %.1f C, RH %.0f%%\\n", t, h);
  }
  delay(5000);
}`,
      tests: ['Uji akurasi suhu', 'Uji relay kipas', 'Uji tampilan layar'],
      risks: ['DHT22 butuh pull-up 10kΩ', 'Relay 220V memerlukan isolasi aman']
    },
    {
      key: 'pet',
      match: ['kucing', 'anjing', 'hewan', 'pet', 'pakan', 'makan hewan', 'feeder'],
      category: 'cat_pet', name: 'Pet Care Automation', glyph: '🐾',
      purpose: 'Menjaga jadwal makan hewan peliharaan tetap konsisten.',
      outcome: 'Pakan keluar otomatis sesuai jadwal dengan porsi terkendali.',
      features: ['Jadwal pemberian pakan harian', 'Porsi diatur dari durasi katup', 'Tombol manual', 'Pengingat & buzzer', 'Status jadwal berikutnya'],
      components: ['cmp_esp32', 'cmp_servo', 'cmp_rtc', 'cmp_oled', 'cmp_buzzer', 'cmp_power', 'cmp_jumper'],
      steps: ['Rangkai RTC & OLED', 'Buat mekanisme katup servo', 'Atur jadwal pemberian', 'Uji porsi & timer'],
      code: `// Pet Care Automation — ESP32 (blueprint lokal)
#include <RTClib.h>
#include <ESP32Servo.h>
RTC_DS3231 rtc;
Servo gate;
const int FEED_HOURS[] = { 7, 18 };

void setup() {
  Wire.begin(21, 22);
  rtc.begin();
  gate.attach(13);
  gate.write(0);
}

void loop() {
  DateTime now = rtc.now();
  for (int h : FEED_HOURS) {
    if (now.hour() == h && now.minute() == 0) {
      gate.write(90);
      delay(1200);
      gate.write(0);
      delay(61000);
    }
  }
  delay(1000);
}`,
      tests: ['Uji jadwal pemberian', 'Uji tombol manual', 'Uji porsi konsisten'],
      risks: ['Pakan bisa menyumbat katup', 'Servo lemah untuk porsi besar']
    },
    {
      key: 'kitchen',
      match: ['gas', 'dapur', 'kebocoran', 'asap', 'kompor', 'kitchen', 'lpg'],
      category: 'cat_kitchen', name: 'Kitchen Safety Monitor', glyph: '🍳',
      purpose: 'Memberi peringatan dini terhadap kebocoran gas di dapur.',
      outcome: 'Alarm lokal dan notifikasi saat gas terdeteksi.',
      features: ['Deteksi gas LPG & asap', 'Alarm buzzer 85 dB', 'LED indikator status', 'Notifikasi Wi-Fi', 'Tombol uji alarm'],
      components: ['cmp_esp32', 'cmp_mq2', 'cmp_buzzer', 'cmp_power', 'cmp_jumper'],
      steps: ['Rangkai sensor MQ-2', 'Pasang buzzer & LED', 'Kalibrasi baseline', 'Uji alarm tanpa gas asli'],
      code: `// Kitchen Safety Monitor — ESP32 (blueprint lokal)
#define GAS_PIN 35
#define BUZZER 32
#define THRESHOLD 1800

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER, OUTPUT);
}

void loop() {
  int gas = analogRead(GAS_PIN);
  if (gas > THRESHOLD) {
    tone(BUZZER, 2000, 300);
    delay(350);
    Serial.println("Peringatan gas!");
  }
  delay(1000);
}`,
      tests: ['Uji baseline sensor', 'Uji alarm buzzer'],
      risks: ['Bukan pengganti detektor gas bersertifikat', 'Sensor perlu pemanasan 24 jam']
    },
    {
      key: 'voice',
      match: ['suara', 'voice', 'perintah suara', 'asisten', 'assistant'],
      category: 'cat_voice', name: 'Voice Control Assistant', glyph: '🎙️',
      purpose: 'Mengendalikan perangkat ruangan dengan perintah suara dasar.',
      outcome: 'Perintah suara dikenali dan memicu aktuator yang sesuai.',
      features: ['Pengenalan beberapa perintah', 'Kontrol relay perangkat', 'Umpan balik buzzer & layar', 'Mode tombol manual', 'Log perintah terakhir'],
      components: ['cmp_esp32', 'cmp_relay', 'cmp_oled', 'cmp_buzzer', 'cmp_power', 'cmp_jumper'],
      steps: ['Latih modul pengenal suara', 'Hubungkan relay & beban', 'Petakan perintah ke aktuator', 'Uji tiap perintah'],
      code: `// Voice Control Assistant — ESP32 (blueprint lokal)
const int CMD_PINS[] = { 34, 35, 36, 39 };
const int RELAY_PINS[] = { 25, 26, 27, 14 };

void setup() {
  for (int i = 0; i < 4; i++) {
    pinMode(CMD_PINS[i], INPUT);
    pinMode(RELAY_PINS[i], OUTPUT);
    digitalWrite(RELAY_PINS[i], HIGH);
  }
}

void loop() {
  for (int i = 0; i < 4; i++) {
    if (digitalRead(CMD_PINS[i]) == HIGH) {
      digitalWrite(RELAY_PINS[i], LOW);
      delay(500);
      digitalWrite(RELAY_PINS[i], HIGH);
    }
  }
}`,
      tests: ['Uji tiap perintah', 'Uji perintah tidak dikenal'],
      risks: ['Akurasi bergantung kualitas modul & kebisingan', 'Beban 220V butuh isolasi']
    },
    {
      key: 'robot',
      match: ['robot', 'line follower', 'roda', 'bergerak', 'robotika', 'mobil'],
      category: 'cat_robot', name: 'Robotika Dasar', glyph: '🤖',
      purpose: 'Belajar kontrol motor dan sensor pada robot sederhana.',
      outcome: 'Robot bergerak mengikuti aturan sensor yang diprogram.',
      features: ['Kontrol dua motor', 'Sensor garis atau jarak', 'Kalibrasi kecepatan', 'Indikator buzzer', 'Logika koreksi arah'],
      components: ['cmp_esp32', 'cmp_ultrasonic', 'cmp_servo', 'cmp_buzzer', 'cmp_power', 'cmp_jumper'],
      steps: ['Rakit chassis & motor', 'Hubungkan driver motor', 'Upload logika gerak', 'Kalibrasi lintasan'],
      code: `// Robotika Dasar — ESP32 (blueprint lokal)
#define TRIG 5
#define ECHO 18
#define BUZZER 32

long readDistance() {
  digitalWrite(TRIG, LOW); delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  return pulseIn(ECHO, HIGH) / 58;
}

void setup() {
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(BUZZER, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  long cm = readDistance();
  Serial.printf("Jarak: %ld cm\\n", cm);
  if (cm < 15) tone(BUZZER, 1200, 150);
  delay(150);
}`,
      tests: ['Uji sensor jarak', 'Uji gerak motor', 'Uji hindaran rintangan'],
      risks: ['Motor butuh arus besar dari baterai terpisah', 'HC-SR04 5V pada ESP32 butuh divider']
    },
    {
      key: 'automation',
      match: ['gorden', 'curtain', 'jadwal', 'rutinitas', 'otomatis', 'home automation', 'blind'],
      category: 'cat_automation', name: 'Home Automation Routine', glyph: '🏠',
      purpose: 'Mengotomasi rutinitas rumah berdasarkan waktu dan sensor.',
      outcome: 'Perangkat bergerak/aktif otomatis sesuai jadwal yang ditentukan.',
      features: ['Jadwal harian otomatis', 'Kontrol manual sebagai override', 'Posisi/status tersimpan', 'Indikator status', 'Siap diintegrasikan ke MQTT'],
      components: ['cmp_esp32', 'cmp_stepper', 'cmp_rtc', 'cmp_relay', 'cmp_power', 'cmp_jumper'],
      steps: ['Siapkan mekanik & driver', 'Atur arus driver stepper', 'Rangkai RTC & tombol', 'Uji jadwal & posisi'],
      code: `// Home Automation Routine — ESP32 (blueprint lokal)
#define STEP_PIN 18
#define DIR_PIN 19
#define EN_PIN 5
#define STEPS 1600

void move(bool open) {
  digitalWrite(EN_PIN, LOW);
  digitalWrite(DIR_PIN, open ? HIGH : LOW);
  for (int i = 0; i < STEPS; i++) {
    digitalWrite(STEP_PIN, HIGH); delayMicroseconds(700);
    digitalWrite(STEP_PIN, LOW); delayMicroseconds(700);
  }
  digitalWrite(EN_PIN, HIGH);
}

void setup() {
  pinMode(STEP_PIN, OUTPUT);
  pinMode(DIR_PIN, OUTPUT);
  pinMode(EN_PIN, OUTPUT);
  move(true);
}`,
      tests: ['Uji arah gerak', 'Uji jadwal otomatis', 'Uji posisi setelah restart'],
      risks: ['Driver stepper mudah panas', 'Mekanik macet dapat merusak motor']
    }
  ];

  function pickRecipe(text, categoryId, difficulty) {
    const t = String(text || '').toLowerCase();
    let best = null, bestScore = 0;
    RECIPES.forEach(r => {
      let score = 0;
      r.match.forEach(k => { if (t.includes(k)) score += 2; });
      if (r.category === categoryId) score += 3;
      if (difficulty === 'Beginner' && r.components.length <= 5) score += 1;
      if (score > bestScore) { best = r; bestScore = score; }
    });
    return best || RECIPES.find(r => r.category === categoryId) || RECIPES[0];
  }

  function generateProject({ idea, categoryId, difficulty, targetBudget, extraFeature }) {
    const recipe = pickRecipe(idea, categoryId, difficulty);
    const cat = Store.categoryById(categoryId) || Store.categoryById(recipe.category) || Store.get().categories[0];
    const controllerId = targetBudget && targetBudget < 180000 ? 'cmp_nodemcu' : 'cmp_esp32';
    const ids = recipe.components.filter(id => id !== 'cmp_esp32').slice();
    ids.unshift(controllerId);
    const components = ids.map((componentId, i) => {
      const comp = Store.componentById(componentId);
      if (!comp) return null;
      const optional = (comp.category === 'Module' || comp.category === 'Display') && i > 3;
      return { componentId, qty: 1, mandatory: !optional, notes: optional ? 'Opsional — tambahkan bila diperlukan.' : '' };
    }).filter(Boolean);

    const cost = components.reduce((sum, item) => {
      const comp = Store.componentById(item.componentId);
      return sum + (comp ? comp.price * item.qty : 0);
    }, 0);
    const words = String(idea || '').trim().split(/\s+/).filter(w => w.length > 3).slice(0, 4);
    const baseName = words.length ? words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      : recipe.name;
    const name = /smart|iot|auto/i.test(baseName) ? baseName : `${baseName} — IoT Blueprint`;
    const features = [extraFeature, ...recipe.features].filter(Boolean);
    const steps = recipe.steps.map((title, i) => ({
      title,
      description: `Langkah ${i + 1} dari blueprint ${name}.`,
      image: '',
      instructions: [
        `Siapkan komponen yang dibutuhkan dan pastikan kondisi baik.`,
        i === 0 ? 'Rangkai di breadboard sebelum instalasi permanen.' : 'Periksa kembali koneksi daya dan grounding.',
        'Catat hasil pengujian pada serial monitor.'
      ],
      notes: i === 0 ? 'Jangan memberi daya sebelum wiring diperiksa ulang.' : '',
      warning: i === 2 ? 'Matikan daya sebelum mengubah wiring.' : ''
    }));
    const architectureParts = {
      input: components.filter(c => Store.componentById(c.componentId)?.category === 'Sensor').map(c => Store.componentById(c.componentId).name).join(', ') || 'Input manual / jadwal',
      controller: Store.componentById(controllerId)?.name || 'ESP32',
      processing: 'Logika threshold + jadwal lokal',
      output: components.filter(c => ['Actuator', 'Output', 'Display'].includes(Store.componentById(c.componentId)?.category)).map(c => Store.componentById(c.componentId).name).join(', ') || 'Indikator LED',
      communication: 'Wi-Fi (opsional), Serial monitor'
    };

    return {
      name,
      slug: slugify(name),
      category: cat.id,
      difficulty,
      duration: difficulty === 'Beginner' ? '1–2 hari' : difficulty === 'Intermediate' ? '2–3 hari' : '3–5 hari',
      budget: Math.round(cost * 1.15 / 5000) * 5000,
      type: 'ai',
      status: 'generated',
      tags: [cat.name.toLowerCase(), 'generated', difficulty.toLowerCase(), ...(idea.toLowerCase().match(/[a-z]{4,}/g) || []).slice(0, 3)],
      shortDescription: `Blueprint otomatis untuk: ${idea || recipe.name}.`,
      description: `Blueprint lokal yang dihasilkan dari input "${idea}". Kerangka ini memakai ${components.length} komponen dari component database dan logika ${recipe.key}. Instruksi teknis belum diverifikasi — periksa kembali sebelum merakit.`,
      purpose: recipe.purpose,
      outcome: recipe.outcome,
      features,
      howItWorks: ['Sensor / input mengirim data ke controller', 'Controller memproses logika threshold dan jadwal', 'Aktuator dijalankan sesuai hasil pemrosesan', 'Status dicatat dan ditampilkan'],
      architecture: { description: `Blueprint ${recipe.key} yang disusun otomatis dari komponen database.`, ...architectureParts },
      components,
      buildGuide: steps,
      testing: recipe.tests.map(t => ({ name: t, description: 'Pengujian dasar dari blueprint otomatis.', expected: 'Perilaku sesuai dengan logika yang dijelaskan.', instructions: 'Ikuti langkah pengujian dan catat hasil di serial monitor.' })),
      troubleshooting: recipe.risks.map(r => ({ problem: r, cause: 'Perlu diverifikasi pada perakitan nyata.', solution: 'Periksa wiring, daya, dan nilai ambang pada kode sebelum mengubah komponen.' })),
      upgrades: ['Tambahkan notifikasi ke Telegram atau dashboard web.', 'Tambahkan pencatatan data ke microSD.', 'Integrasikan dengan asisten suara lokal.'],
      wiring: `Lihat pin pada source code. ${architectureParts.input} → ${architectureParts.controller}; output → ${architectureParts.output}.`,
      sourceCode: recipe.code,
      aiMeta: { prompt: idea, generatedAt: new Date().toISOString(), reviewStatus: 'Generated', verified: false }
    };
  }

  function viewAI() {
    const generated = generatedProjectId ? Store.projectById(generatedProjectId) : null;
    const cats = Store.get().categories.filter(c => c.status === 'active');
    return `<section class="section"><div class="container">
      <div class="breadcrumb"><a href="#/">Home</a><span>/</span><span>AI Builder</span></div>
      <div class="section-head"><div><h2>AI Builder</h2><p>Ubah idemu menjadi blueprint proyek: komponen, budget, wiring, kode, dan langkah build.</p></div></div>
      <div class="ai-wrap">
        <div class="card">
          <form id="aiForm">
            <div class="field"><label for="aiIdea">Ide proyekmu</label>
              <textarea id="aiIdea" placeholder="Contoh: alat penyiram tanaman otomatis untuk pot di balkon dengan pengingat saat air habis" required></textarea>
              <span class="hint">Generator lokal memakai kata kunci + component database. Bukan model AI cloud.</span></div>
            <div class="grid-2">
              <div class="field"><label for="aiCategory">Kategori</label>
                <select id="aiCategory">${cats.map(c => `<option value="${c.id}">${esc(c.icon + ' ' + c.name)}</option>`).join('')}</select></div>
              <div class="field"><label for="aiDifficulty">Difficulty</label>
                <select id="aiDifficulty">${['Beginner', 'Intermediate', 'Advanced'].map(d => `<option ${d === 'Beginner' ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
            </div>
            <div class="grid-2">
              <div class="field"><label for="aiBudget">Target budget (Rp)</label>
                <input id="aiBudget" type="number" min="50000" step="10000" value="300000" /></div>
              <div class="field"><label for="aiFeature">Fitur tambahan (opsional)</label>
                <input id="aiFeature" type="text" placeholder="Contoh: notifikasi WhatsApp" /></div>
            </div>
            <div class="err" id="aiError"></div>
            <button class="btn btn-primary btn-block" type="submit" id="aiSubmit">${Icons.spark} Generate project blueprint</button>
          </form>
          <div class="callout callout-info" style="margin-top:14px">
            Hasil generator disimpan sebagai proyek bertipe AI, muncul di Explore Projects, My Build (jika kamu simpan), dan halaman AI Generated Projects di Admin.
          </div>
        </div>
        <div class="card ai-output" id="aiOutput">
          ${generated ? `
            <div class="gen-result-head">
              <div><span class="eyebrow">Blueprint siap</span><h3 style="font-size:1.15rem;margin:4px 0">${esc(generated.name)}</h3>
                <span class="small text-muted">Dibuat ${formatDate(generated.createdAt, true)} · status ${esc(generated.status)}</span></div>
              <span class="badge badge-accent">AI generated</span>
            </div>
            <div class="gen-meta">
              <div><span>Kategori</span><strong>${esc(Store.categoryById(generated.category)?.name || '—')}</strong></div>
              <div><span>Difficulty</span><strong>${esc(generated.difficulty)}</strong></div>
              <div><span>Estimasi budget</span><strong>${money(Store.projectCost(generated))}</strong></div>
              <div><span>Komponen</span><strong>${generated.components.length} item</strong></div>
            </div>
            <div class="row wrap" style="gap:8px">
              <a class="btn btn-primary btn-sm" href="#/project/${esc(generated.slug)}">Lihat blueprint</a>
              <button class="btn btn-soft btn-sm" data-save="${generated.id}">Simpan ke My Build</button>
              <button class="btn btn-ghost btn-sm" id="aiRegenerate">Generate lagi</button>
            </div>
          ` : `<div class="empty-state" style="padding:26px"><span class="glyph">${Icons.spark}</span>
            <h3>Belum ada blueprint</h3><p>Isi ide proyek lalu generate. Hasilnya bisa langsung dibuka sebagai halaman proyek lengkap.</p></div>`}
        </div>
      </div>
    </div></section>`;
  }

  function handleGenerate(e) {
    e.preventDefault();
    const idea = document.getElementById('aiIdea').value.trim();
    const categoryId = document.getElementById('aiCategory').value;
    const difficulty = document.getElementById('aiDifficulty').value;
    const targetBudget = Number(document.getElementById('aiBudget').value) || 0;
    const extraFeature = document.getElementById('aiFeature').value.trim();
    const err = document.getElementById('aiError');
    err.textContent = '';
    if (idea.length < 8) { err.textContent = 'Tulis ide minimal 8 karakter agar blueprint relevan.'; return; }

    const btn = document.getElementById('aiSubmit');
    const output = document.getElementById('aiOutput');
    btn.disabled = true;
    btn.textContent = 'Menyusun blueprint…';
    output.innerHTML = `<span class="eyebrow">Memproses</span>` + Array.from({ length: 6 }).map(() => '<div class="loading-line"></div>').join('');

    setTimeout(() => {
      Store.track('project_generate', { idea, category: Store.categoryById(categoryId)?.name || '', difficulty });
      const blueprint = generateProject({ idea, categoryId, difficulty, targetBudget, extraFeature });
      const project = Store.addProject(blueprint);
      generatedProjectId = project.id;
      toast('Blueprint berhasil dibuat dan ditambahkan ke Explore.', 'success', 'AI Builder');
      render();
      window.location.hash = '#/ai-builder';
    }, 900);
  }

  /* ---------------- Nara assistant ---------------- */
  const naraHistory = [];

  function naraPush(html, who = 'bot') {
    naraHistory.push({ who, html });
    const body = document.getElementById('naraBody');
    if (!body) return;
    const el = document.createElement('div');
    el.className = `msg ${who}`;
    el.innerHTML = html;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  function naraArticle(project) {
    return `<a href="#/project/${esc(project.slug)}" style="font-weight:700">${esc(project.name)}</a><br />
      <span class="small">${esc(Store.categoryById(project.category)?.name || '')} · ${esc(project.difficulty)} · ${money(Store.projectCost(project))}</span>`;
  }

  function naraAnswer(text) {
    const q = text.toLowerCase();
    const projects = Store.visibleProjects();
    const comps = Store.get().components;

    if (/^(hai|hi|halo|hello|hey)\b/.test(q) || q.length < 3) {
      return `Halo! Aku Nara, asisten lokal IoT at Home. Aku bisa bantu cari proyek, menjelaskan komponen, atau menyusun budget.
        <div><span class="sugg" data-nara="proyek pemula">Proyek pemula</span><span class="sugg" data-nara="proyek murah">Proyek murah</span><span class="sugg" data-nara="cara pakai ai builder">Cara pakai AI Builder</span></div>`;
    }
    if (q.includes('ai builder') || q.includes('generate') || q.includes('cara pakai')) {
      return `Buka <a href="#/ai-builder">AI Builder</a>, tulis idemu, pilih kategori & budget, lalu generate. Blueprint otomatis disimpan sebagai proyek AI dan muncul di <a href="#/explore">Explore</a>. Generator-nya lokal (template + database komponen), bukan model AI cloud.`;
    }
    if (q.includes('murah') || q.includes('hemat') || q.includes('budget') || q.includes('rp')) {
      const cheap = projects.filter(p => Store.projectCost(p) <= 250000).sort((a, b) => Store.projectCost(a) - Store.projectCost(b)).slice(0, 3);
      if (cheap.length) return `Proyek paling hemat:<br />${cheap.map(naraArticle).join('<br /><br />')}<br /><a href="#/explore?budgetMax=250000">Lihat semua proyek ≤ Rp 250.000</a>`;
      return 'Belum ada proyek di bawah Rp 250.000 saat ini.';
    }
    if (q.includes('pemula') || q.includes('beginner') || q.includes('baru mulai')) {
      const easy = projects.filter(p => p.difficulty === 'Beginner').slice(0, 3);
      return easy.length ? `Mulai dari yang ini:<br />${easy.map(naraArticle).join('<br /><br />')}` : 'Belum ada proyek level Beginner.';
    }
    const foundComp = comps.find(c => q.includes(c.name.toLowerCase().split(' ')[0]) && c.name.length > 3);
    if (foundComp && (q.includes('komponen') || q.includes('sensor') || q.includes('harga') || q.includes('apa itu'))) {
      Store.track('component_view', { componentId: foundComp.id });
      return `<strong>${esc(foundComp.name)}</strong><br /><span class="small">${esc(foundComp.function)}</span><br />
        Harga estimasi <b>${money(foundComp.price)}</b> · ${esc(foundComp.voltage)} · ${esc(foundComp.communication)}<br />
        <span class="small">${esc(foundComp.spec)}</span>`;
    }
    const projectMatch = projects.find(p => q.includes(p.name.toLowerCase()) || p.name.toLowerCase().split(' ').some(w => w.length > 5 && q.includes(w)));
    if (projectMatch) {
      return `${naraArticle(projectMatch)}<br /><span class="small">${esc(projectMatch.shortDescription)}</span><br /><a href="#/project/${esc(projectMatch.slug)}">Buka detail proyek →</a>`;
    }
    const cat = Store.get().categories.find(c => q.includes(c.name.toLowerCase()) || q.includes(c.slug));
    if (cat) {
      const list = projects.filter(p => p.category === cat.id);
      return list.length ? `Proyek kategori <b>${esc(cat.name)}</b>:<br />${list.slice(0, 3).map(naraArticle).join('<br /><br />')}` : `Belum ada proyek di kategori ${esc(cat.name)}.`;
    }
    const tokens = q.split(/\s+/).filter(w => w.length > 3);
    const matches = projects.filter(p => tokens.some(t => [p.name, p.shortDescription, p.tags?.join(' '), p.difficulty].join(' ').toLowerCase().includes(t)));
    if (matches.length) return `Mungkin ini yang kamu cari:<br />${matches.slice(0, 3).map(naraArticle).join('<br /><br />')}`;
    return `Aku belum menemukan yang cocok. Coba kata kunci seperti "tanaman", "keamanan", "lampu", "komponen ESP32", atau "proyek murah".
      <div><span class="sugg" data-nara="proyek pemula">Proyek pemula</span><span class="sugg" data-nara="proyek murah">Proyek murah</span><span class="sugg" data-nara="komponen esp32">Komponen ESP32</span></div>`;
  }

  function initNara() {
    const fab = document.getElementById('naraFab');
    const panel = document.getElementById('naraPanel');
    const body = document.getElementById('naraBody');
    fab.addEventListener('click', () => {
      panel.classList.toggle('hidden');
      fab.setAttribute('aria-expanded', String(!panel.classList.contains('hidden')));
      if (!panel.classList.contains('hidden') && !body.childElementCount) {
        naraPush('Halo! Aku Nara. Mau cari proyek, cek harga komponen, atau mulai dari ide?');
      }
    });
    document.getElementById('naraClose').addEventListener('click', () => panel.classList.add('hidden'));
    document.getElementById('naraForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('naraInput');
      const text = input.value.trim();
      if (!text) return;
      naraPush(esc(text), 'user');
      input.value = '';
      setTimeout(() => naraPush(naraAnswer(text), 'bot'), 260);
    });
    body.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-nara]');
      if (!chip) return;
      const text = chip.getAttribute('data-nara');
      naraPush(esc(text), 'user');
      setTimeout(() => naraPush(naraAnswer(text), 'bot'), 220);
    });
  }

  /* ---------------- Chrome / chrome events ---------------- */
  function refreshChrome() {
    const s = Store.get();
    const count = s.shoppingList.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartCount').textContent = count;
  }

  function setActiveNav(route) {
    const map = { home: 'home', explore: 'explore', project: 'explore', components: 'components', 'ai-builder': 'ai-builder', 'my-build': 'my-build', 'shopping-list': 'my-build', budget: 'budget' };
    const active = map[route];
    document.querySelectorAll('[data-route]').forEach(a => a.classList.toggle('active', a.getAttribute('data-route') === active));
  }

  function routeFromHash() {
    const raw = (location.hash || '#/').replace(/^#/, '');
    const [path, query] = raw.split('?');
    const parts = path.split('/').filter(Boolean);
    const params = new URLSearchParams(query || '');
    return { route: parts[0] || 'home', parts, params };
  }

  function trackPage(route) {
    Store.track('page_view', { page: route });
  }

  /* ---------------- render ---------------- */
  let lastRouteKey = '';
  let lastTrackedRoute = '';
  const viewedProjects = new Set();

  function render() {
    const { route, parts, params } = routeFromHash();
    applyTheme();
    setActiveNav(route);
    document.getElementById('mobileNav').classList.remove('open');
    const routeKey = route + '|' + (parts[1] || '');
    const shouldScrollTop = lastRouteKey !== routeKey;
    if (route === 'home') {
      app.innerHTML = viewHome();
    } else if (route === 'explore') {
      if (params.get('q') !== null) exploreState.q = params.get('q');
      if (params.get('category')) exploreState.category = params.get('category');
      if (params.get('difficulty')) exploreState.difficulty = params.get('difficulty');
      if (params.get('budgetMax')) exploreState.budgetMax = params.get('budgetMax');
      app.innerHTML = viewExplore();
    } else if (route === 'project') {
      app.innerHTML = viewProject(parts[1] || '');
      const project = Store.projectBySlug(parts[1] || '');
      if (project && Store.isVisible(project) && !viewedProjects.has(project.id)) {
        viewedProjects.add(project.id);
        project.views = (project.views || 0) + 1;
        Store.track('project_view', { projectId: project.id });
      }
    } else if (route === 'components') {
      app.innerHTML = viewComponents();
    } else if (route === 'my-build') {
      app.innerHTML = viewMyBuild();
    } else if (route === 'shopping-list') {
      app.innerHTML = viewShoppingList();
    } else if (route === 'budget') {
      app.innerHTML = viewBudget();
    } else if (route === 'ai-builder') {
      app.innerHTML = viewAI();
      Store.track('ai_builder_open', {});
    } else {
      app.innerHTML = `<section class="section"><div class="container">${emptyState('Halaman tidak ditemukan', 'Periksa kembali tautan atau kembali ke halaman utama.')}</div></section>`;
    }
    refreshChrome();
    if (lastTrackedRoute !== route) { trackPage(route); lastTrackedRoute = route; }
    if (shouldScrollTop) window.scrollTo({ top: 0, behavior: 'instant' });
    lastRouteKey = routeKey;
    bind();
  }

  let notesTimer = null;

  function bind() {
    const search = document.getElementById('exploreSearch');
    if (search) search.addEventListener('input', debounce(() => { exploreState.q = search.value; exploreState.page = 1; render(); setTimeout(() => { const s = document.getElementById('exploreSearch'); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } }, 0); }, 320));
    const compSearch = document.getElementById('compSearch');
    if (compSearch) compSearch.addEventListener('input', debounce(() => { compState.q = compSearch.value; compState.page = 1; render(); setTimeout(() => { const s = document.getElementById('compSearch'); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } }, 0); }, 320));

    const budgetComponent = document.getElementById('budgetComponent');
    if (budgetComponent) budgetComponent.addEventListener('change', (e) => {
      const id = e.target.value;
      if (!id) return;
      budgetState.items[id] = (budgetState.items[id] || 0) + 1;
      e.target.value = '';
      render();
    });
    const budgetProject = document.getElementById('budgetProject');
    if (budgetProject) budgetProject.addEventListener('change', (e) => {
      if (e.target.value) loadProjectIntoBudget(e.target.value);
    });
    const budgetTarget = document.getElementById('budgetTarget');
    if (budgetTarget) budgetTarget.addEventListener('change', (e) => {
      budgetState.target = Math.max(0, Number(e.target.value) || 0);
      render();
    });

    const aiRegen = document.getElementById('aiRegenerate');
    if (aiRegen) aiRegen.addEventListener('click', () => { generatedProjectId = null; render(); });
    const aiForm = document.getElementById('aiForm');
    if (aiForm) aiForm.addEventListener('submit', handleGenerate);
  }

  function appClickHandler(e) {
    const tab = e.target.closest('[data-tab]');
    if (tab) {
      detailTab = tab.getAttribute('data-tab');
      const project = Store.projectBySlug(currentSlug);
      if (project) {
        document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b === tab));
        const body = document.getElementById('detailTabBody');
        if (body) body.innerHTML = detailTabBody(project, Store.projectComponentDetails(project));
      }
      return;
    }
    const acc = e.target.closest('[data-acc]');
    if (acc) { acc.closest('.accordion').classList.toggle('open'); return; }

    const save = e.target.closest('[data-save]');
    if (save) {
      const id = save.getAttribute('data-save');
      if (isSaved(id)) {
        Store.removeFromMyBuild(id);
        toast('Proyek dihapus dari My Build.', 'info');
      } else {
        Store.saveToMyBuild(id);
        toast('Proyek disimpan ke My Build.', 'success');
      }
      render();
      return;
    }

    const addComp = e.target.closest('[data-add-comp]');
    if (addComp) {
      Store.addToShoppingList(addComp.getAttribute('data-add-comp'), Number(addComp.getAttribute('data-qty') || 1));
      refreshChrome();
      toast('Komponen ditambahkan ke Shopping List.', 'success');
      return;
    }

    const addProjectShopping = e.target.closest('[data-add-project-shopping]');
    if (addProjectShopping) {
      const count = Store.addProjectToShoppingList(addProjectShopping.getAttribute('data-add-project-shopping'));
      refreshChrome();
      toast(`${count} komponen ditambahkan ke Shopping List.`, 'success');
      return;
    }

    const compView = e.target.closest('[data-comp-view]');
    if (compView) { openComponentModal(compView.getAttribute('data-comp-view')); return; }

    const category = e.target.closest('[data-category]');
    if (category) {
      exploreState.category = category.getAttribute('data-category');
      exploreState.page = 1;
      const target = '#/explore';
      if (location.hash === target) render(); else location.hash = target;
      return;
    }

    const page = e.target.closest('[data-page]');
    if (page) {
      const num = Number(page.getAttribute('data-page'));
      if (num < 1 || page.disabled) return;
      if (page.getAttribute('data-ctx') === 'components') compState.page = num; else exploreState.page = num;
      render();
      return;
    }

    const reset = e.target.closest('[data-reset-explore]');
    if (reset) {
      exploreState.q = ''; exploreState.category = ''; exploreState.difficulty = ''; exploreState.budgetMax = ''; exploreState.sort = 'newest'; exploreState.page = 1;
      render();
      return;
    }

    const removeBuild = e.target.closest('[data-remove-build]');
    if (removeBuild) {
      Store.removeFromMyBuild(removeBuild.getAttribute('data-remove-build'));
      toast('Proyek dihapus dari My Build.', 'info');
      render();
      return;
    }

    const shopCheck = e.target.closest('[data-shop-check]');
    if (shopCheck) { Store.toggleShoppingChecked(shopCheck.getAttribute('data-shop-check')); render(); return; }

    const shopRemove = e.target.closest('[data-shop-remove]');
    if (shopRemove) { Store.removeShoppingItem(shopRemove.getAttribute('data-shop-remove')); render(); return; }

    const clearShopping = e.target.closest('#clearShopping');
    if (clearShopping) {
      confirmDialog({ title: 'Kosongkan Shopping List?', message: 'Semua item pada shopping list akan dihapus. Tindakan ini tidak menghapus komponen dari database.', confirmText: 'Ya, kosongkan' })
        .then(ok => { if (ok) { Store.clearShoppingList(); refreshChrome(); render(); toast('Shopping list dikosongkan.', 'success'); } });
      return;
    }

    const copyShopping = e.target.closest('#copyShopping');
    if (copyShopping) {
      const list = Store.get().shoppingList.map(i => ({ ...i, c: Store.componentById(i.componentId) })).filter(x => x.c);
      const text = list.map(i => `- ${i.c.name} x${i.qty} = ${money(i.c.price * i.qty)}`).join('\n') + `\nTotal: ${money(list.reduce((s, i) => s + i.c.price * i.qty, 0))}`;
      navigator.clipboard?.writeText(text).then(() => toast('Daftar belanja disalin.', 'success')).catch(() => toast('Clipboard tidak tersedia di browser ini.', 'warn'));
      return;
    }

    const budgetLoad = e.target.closest('[data-budget-load]');
    if (budgetLoad) { loadProjectIntoBudget(budgetLoad.getAttribute('data-budget-load')); return; }

    const budgetRemove = e.target.closest('[data-budget-remove]');
    if (budgetRemove) { delete budgetState.items[budgetRemove.getAttribute('data-budget-remove')]; render(); return; }

    const budgetClear = e.target.closest('#budgetClear');
    if (budgetClear) { budgetState.items = {}; render(); return; }

    const budgetToShopping = e.target.closest('#budgetToShopping');
    if (budgetToShopping) {
      let n = 0;
      Object.entries(budgetState.items).forEach(([id, qty]) => { Store.addToShoppingList(id, qty); n++; });
      refreshChrome();
      toast(`${n} komponen ditambahkan ke Shopping List.`, 'success');
      return;
    }

    const external = e.target.closest('a[href^="#/"]');
    if (external && !external.getAttribute('href').startsWith('#/project/')) {
      // default hash navigation handles it
    }
  }

  function appInputHandler(e) {
    if (e.target.id === 'exploreSearch' || e.target.id === 'compSearch') return;
    const notes = e.target.closest('[data-build-notes]');
    if (notes) {
      clearTimeout(notesTimer);
      const id = notes.getAttribute('data-build-notes');
      notesTimer = setTimeout(() => Store.setBuildNotes(id, notes.value), 400);
    }
  }

  function appChangeHandler(e) {
    if (e.target.id === 'exploreCategory') { exploreState.category = e.target.value; exploreState.page = 1; render(); }
    if (e.target.id === 'exploreDifficulty') { exploreState.difficulty = e.target.value; exploreState.page = 1; render(); }
    if (e.target.id === 'exploreBudget') { exploreState.budgetMax = e.target.value; exploreState.page = 1; render(); }
    if (e.target.id === 'exploreSort') { exploreState.sort = e.target.value; render(); }
    if (e.target.id === 'compCategory') { compState.category = e.target.value; compState.page = 1; render(); }
    if (e.target.id === 'compSort') { compState.sort = e.target.value; render(); }

    const step = e.target.closest('[data-build-step]');
    if (step) { Store.toggleBuildStep(step.getAttribute('data-build-step'), Number(step.getAttribute('data-step'))); render(); return; }

    if (e.target.matches('[data-budget-qty]')) {
      const id = e.target.getAttribute('data-budget-qty');
      budgetState.items[id] = Math.max(1, Number(e.target.value) || 1);
      render();
      return;
    }
    if (e.target.matches('[data-shop-qty]')) {
      Store.updateShoppingQty(e.target.getAttribute('data-shop-qty'), e.target.value);
      render();
    }
  }

  /* ---------------- init ---------------- */
  function initSearch() {
    const go = (value) => {
      const q = value.trim();
      location.hash = q ? `#/explore?q=${encodeURIComponent(q)}` : '#/explore';
      if (routeFromHash().route === 'explore') { exploreState.q = q; render(); }
    };
    ['globalSearch', 'globalSearchMobile'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(el.value); el.blur(); } });
    });
    document.getElementById('searchIcon').innerHTML = Icons.search;
    document.getElementById('searchIconMobile').innerHTML = Icons.search;
    document.getElementById('naraIcon').innerHTML = Icons.spark;
  }

  function init() {
    Store.init();
    Store.subscribe(() => { if (!document.querySelector('.modal-backdrop')) refreshChrome(); });
    applyTheme();
    initSearch();
    initNara();
    document.getElementById('mobileToggle').addEventListener('click', () => {
      const nav = document.getElementById('mobileNav');
      nav.classList.toggle('open');
      document.getElementById('mobileToggle').setAttribute('aria-expanded', String(nav.classList.contains('open')));
    });
    /* Delegation dipasang sekali untuk seluruh halaman. */
    app.addEventListener('click', appClickHandler);
    app.addEventListener('input', appInputHandler);
    app.addEventListener('change', appChangeHandler);
    window.addEventListener('hashchange', render);
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
