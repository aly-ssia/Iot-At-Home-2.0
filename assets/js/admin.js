/* ============================================================
   IoT at Home — Admin Dashboard
   Menggunakan Store yang sama dengan website utama.
   ============================================================ */
(function () {
  const root = document.getElementById('adminRoot');
  const SIDEBAR_KEY = 'iotAtHome.admin.sidebar';

  const ui = {
    collapsed: localStorage.getItem(SIDEBAR_KEY) === '1',
    mobileOpen: false,
    project: { q: '', category: '', difficulty: '', type: '', status: '', sort: 'createdAt', dir: 'desc', page: 1 },
    component: { q: '', category: '', sort: 'name', dir: 'asc', page: 1 },
    category: { q: '', sort: 'name', dir: 'asc', page: 1 },
    ai: { q: '', status: '', sort: 'createdAt', dir: 'desc', page: 1 },
    activityLimit: 12,
    contentTab: 'homepage',
    projectDraft: null,
    projectTab: 'general',
    editingId: null,
    importPayload: null
  };

  /* ---------------- generic helpers ---------------- */
  const PAGE_SIZE = 8;

  function setPath(obj, path, value) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  function sortList(list, key, dir) {
    const mult = dir === 'asc' ? 1 : -1;
    const valueOf = (item) => {
      if (key === 'cost') return Store.projectCost(item);
      if (key === 'category') return Store.categoryById(item.category)?.name || '';
      if (key === 'projects') return Store.categoryProjectCount(item.id);
      return item[key];
    };
    return [...list].sort((a, b) => {
      const av = valueOf(a);
      const bv = valueOf(b);
      if (typeof av === 'string' || typeof bv === 'string') return byText(av, bv) * mult;
      return ((Number(av) || 0) - (Number(bv) || 0)) * mult;
    });
  }

  function paginate(list, page) {
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const safePage = Math.min(Math.max(1, page), pages);
    return { slice: list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), pages, page: safePage, total: list.length };
  }

  function pager(ctx, meta) {
    if (!meta.total) return '';
    const btns = [];
    for (let i = 1; i <= meta.pages; i++) {
      if (meta.pages > 7 && i > 2 && i < meta.pages - 1 && Math.abs(i - meta.page) > 1) {
        if (btns[btns.length - 1] !== '…') btns.push('…');
        continue;
      }
      btns.push(i);
    }
    return `<div class="table-foot">
      <span>Menampilkan ${(meta.page - 1) * PAGE_SIZE + 1}–${Math.min(meta.total, meta.page * PAGE_SIZE)} dari ${meta.total}</span>
      <div class="pages">
        <button data-act="page" data-ctx="${ctx}" data-page="${meta.page - 1}" ${meta.page === 1 ? 'disabled' : ''}>‹</button>
        ${btns.map(b => b === '…' ? '<span style="padding:0 2px">…</span>' : `<button data-act="page" data-ctx="${ctx}" data-page="${b}" class="${b === meta.page ? 'active' : ''}">${b}</button>`).join('')}
        <button data-act="page" data-ctx="${ctx}" data-page="${meta.page + 1}" ${meta.page === meta.pages ? 'disabled' : ''}>›</button>
      </div>
    </div>`;
  }

  function th(ctx, key, label, extra = '') {
    const st = ui[ctx];
    const active = st.sort === key;
    return `<th data-act="sort" data-ctx="${ctx}" data-key="${key}" class="${active ? 'sorted' : ''} ${extra}">${label}<span class="sort-ind">${active ? (st.dir === 'asc' ? '▲' : '▼') : '↕'}</span></th>`;
  }

  function statusMeta(status) {
    return ({
      published: { label: 'Published', cls: 'badge-primary' },
      draft: { label: 'Draft', cls: '' },
      generated: { label: 'Generated', cls: 'badge-accent' },
      reviewed: { label: 'Reviewed', cls: 'badge-warn' },
      archived: { label: 'Archived', cls: 'badge-danger' },
      active: { label: 'Active', cls: 'badge-primary' },
      inactive: { label: 'Inactive', cls: '' }
    })[status] || { label: status || '—', cls: '' };
  }
  function badge(status) {
    const m = statusMeta(status);
    return `<span class="badge ${m.cls}">${esc(m.label)}</span>`;
  }
  function thumb(projectOrComp, kind = 'project') {
    if (projectOrComp.image) return `<img src="${esc(projectOrComp.image)}" alt="" />`;
    if (kind === 'project') {
      const cat = Store.categoryById(projectOrComp.category);
      return cat && cat.icon ? cat.icon : '🔌';
    }
    return '🔌';
  }
  function projTypeLabel(p) { return p.type === 'ai' ? 'AI generated' : 'Default'; }

  function pageHead(title, desc, actions = '') {
    return `<div class="page-head">
      <div><h2>${esc(title)}</h2><p>${esc(desc)}</p></div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ''}
    </div>`;
  }

  function emptyBlock(title, text, action = '') {
    return `<div class="empty-state"><span class="glyph">🗂️</span><h3>${esc(title)}</h3><p>${esc(text)}</p>${action}</div>`;
  }

  function applyAdminTheme() {
    const s = Store.get().settings;
    const h = (s.primaryColor || '#0d9488').replace('#', '');
    const num = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const clamp = v => Math.min(255, Math.max(0, v));
    const dark = '#' + [clamp((num >> 16) - 26), clamp(((num >> 8) & 0xff) - 22), clamp((num & 0xff) - 22)]
      .map(v => v.toString(16).padStart(2, '0')).join('');
    document.documentElement.style.setProperty('--primary', s.primaryColor || '#0d9488');
    document.documentElement.style.setProperty('--primary-dark', dark);
    document.documentElement.style.setProperty('--accent', s.accentColor || '#e0f2fe');
  }

  /* ============================================================
     LOGIN
     ============================================================ */
  function renderLogin() {
    document.title = 'Admin Login — IoT at Home';
    root.innerHTML = `
      <div class="login-screen">
        <div class="login-card">
          <a class="brand" href="index.html">
            <span class="brand-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><circle cx="12" cy="14.5" r="2.2"/></svg>
            </span>
            <span class="brand-text"><strong>IoT at Home</strong><span>Discover. Design. Build.</span></span>
          </a>
          <div class="login-badge">🔐 ADMIN PANEL</div>
          <h1>Admin Login</h1>
          <p class="login-sub">Manage and monitor IoT at Home</p>
          <div class="login-error" id="loginError"><span>⚠</span><span id="loginErrorText"></span></div>
          <form id="loginForm" novalidate>
            <div class="field">
              <label for="loginUser">Username</label>
              <input id="loginUser" name="username" autocomplete="username" placeholder="Masukkan username admin" required />
            </div>
            <div class="field">
              <label for="loginPass">Password</label>
              <div class="pw-wrap">
                <input id="loginPass" name="password" type="password" autocomplete="current-password" placeholder="Masukkan password" required />
                <button type="button" class="pw-toggle" id="pwToggle" aria-label="Tampilkan password">${Icons.eye}</button>
              </div>
            </div>
            <div class="err" id="loginFieldError"></div>
            <button type="submit" class="btn btn-primary btn-block" id="loginSubmit" style="margin-top:6px">Masuk ke dashboard</button>
          </form>
          <div class="login-hint">
            <strong>Prototype notice.</strong> Login ini berjalan sepenuhnya di browser menggunakan LocalStorage.
            Ini bukan autentikasi produksi — tidak ada server, enkripsi, atau pembatasan akses sungguhan.
            <br />Kredensial default tercatat pada dokumentasi setup (README) dan sebaiknya diganti di Settings.
          </div>
          <div style="text-align:center;margin-top:14px"><a class="small" href="index.html">← Kembali ke website</a></div>
        </div>
      </div>`;

    const form = document.getElementById('loginForm');
    const pw = document.getElementById('loginPass');
    const toggle = document.getElementById('pwToggle');
    toggle.addEventListener('click', () => {
      const show = pw.type === 'password';
      pw.type = show ? 'text' : 'password';
      toggle.innerHTML = show ? Icons.eyeOff : Icons.eye;
      toggle.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUser').value.trim();
      const password = pw.value;
      const errBox = document.getElementById('loginError');
      const errText = document.getElementById('loginErrorText');
      const fieldErr = document.getElementById('loginFieldError');
      const btn = document.getElementById('loginSubmit');
      errBox.classList.remove('show');
      fieldErr.textContent = '';
      document.getElementById('loginUser').classList.remove('input-error');
      pw.classList.remove('input-error');

      if (!username || !password) {
        fieldErr.textContent = 'Username dan password wajib diisi.';
        if (!username) document.getElementById('loginUser').classList.add('input-error');
        if (!password) pw.classList.add('input-error');
        return;
      }
      btn.disabled = true;
      btn.innerHTML = 'Memeriksa kredensial…';
      setTimeout(() => {
        const result = Auth.login(username, password);
        btn.disabled = false;
        btn.textContent = 'Masuk ke dashboard';
        if (!result.ok) {
          errText.textContent = result.error;
          errBox.classList.add('show');
          document.getElementById('loginUser').classList.add('input-error');
          pw.classList.add('input-error');
          pw.value = '';
          pw.focus();
          return;
        }
        toast('Selamat datang, admin.', 'success', 'Login berhasil');
        location.hash = '#/dashboard';
        renderShell();
        renderRoute();
      }, 520);
    });
  }

  /* ============================================================
     SHELL
     ============================================================ */
  const NAV = [
    { group: 'Overview', key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { group: 'Content', key: 'projects', label: 'Projects Management', icon: 'projects', count: () => Store.get().projects.length },
    { group: 'Content', key: 'components', label: 'Components Management', icon: 'components', count: () => Store.get().components.length },
    { group: 'Content', key: 'categories', label: 'Categories Management', icon: 'categories', count: () => Store.get().categories.length },
    { group: 'Content', key: 'ai-projects', label: 'AI Generated Projects', icon: 'ai', count: () => Store.aiProjects().length },
    { group: 'Insights', key: 'analytics', label: 'Visitor Analytics', icon: 'analytics' },
    { group: 'Site', key: 'content', label: 'Website Content', icon: 'content' },
    { group: 'Site', key: 'settings', label: 'Settings', icon: 'settings' }
  ];

  function navGroupsMarkup() {
    const groups = {};
    NAV.forEach(item => { (groups[item.group] = groups[item.group] || []).push(item); });
    return Object.entries(groups).map(([group, items]) => `
      <div class="nav-group-label">${esc(group)}</div>
      ${items.map(item => `<a class="nav-link" data-nav="${item.key}" href="#/${item.key}" data-tip="${esc(item.label)}">
        <span class="ico">${Icons[item.icon]}</span>
        <span class="nav-label">${esc(item.label)}</span>
        ${item.count ? `<span class="nav-count">${item.count()}</span>` : ''}
      </a>`).join('')}
    `).join('');
  }

  function renderShell() {
    const user = Auth.session();
    const totalNotif = Store.get().activity.filter(a => Date.now() - new Date(a.at).getTime() < 86400000).length;
    root.innerHTML = `
      <div class="admin-shell ${ui.collapsed ? 'collapsed' : ''}" id="adminShell">
        <aside class="admin-sidebar ${ui.mobileOpen ? 'open' : ''}" id="adminSidebar">
          <div class="sidebar-head">
            <a class="brand" href="index.html" title="Kembali ke website">
              <span class="brand-mark" style="width:34px;height:34px;border-radius:10px">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><circle cx="12" cy="14.5" r="2.2"/></svg>
              </span>
              <span class="brand-text"><strong>${esc(Store.get().settings.siteName)}</strong><span class="admin-tag">Admin Panel</span></span>
            </a>
          </div>
          <nav class="sidebar-nav">${navGroupsMarkup()}</nav>
          <div class="sidebar-foot">
            <a class="nav-link" href="index.html" data-tip="Back to Website">
              <span class="ico">${Icons.back}</span><span class="nav-label">Back to Website</span>
            </a>
            <button class="nav-link danger" data-act="logout" data-tip="Logout">
              <span class="ico">${Icons.logout}</span><span class="nav-label">Logout</span>
            </button>
            <button class="nav-link" data-act="toggle-sidebar" data-tip="${ui.collapsed ? 'Expand sidebar' : 'Collapse sidebar'}">
              <span class="ico">${ui.collapsed ? Icons.chevron : Icons.chevron}</span>
              <span class="nav-label">${ui.collapsed ? 'Expand' : 'Collapse'} sidebar</span>
            </button>
          </div>
        </aside>
        <div class="scrim ${ui.mobileOpen ? '' : 'hidden'}" id="scrim" data-act="close-mobile"></div>
        <div class="admin-main">
          <header class="admin-topbar">
            <button class="icon-btn admin-mobile-toggle" data-act="open-mobile" aria-label="Buka menu">☰</button>
            <div class="topbar-title">
              <div class="breadcrumb admin-crumb" id="topbarCrumb"></div>
              <h1 id="topbarTitle">Dashboard</h1>
            </div>
            <label class="topbar-search">
              ${Icons.search}
              <input id="adminSearch" type="search" placeholder="Cari proyek, komponen…" aria-label="Cari data admin" />
            </label>
            <div class="topbar-actions">
              <div class="notif-wrap">
                <button class="icon-btn" data-act="notif" aria-label="Notifikasi">
                  ${Icons.bell}${totalNotif ? '<span class="notif-dot"></span>' : ''}
                </button>
                <div class="notif-menu hidden" id="notifMenu">
                  <header>Aktivitas terbaru</header>
                  ${Store.get().activity.slice(0, 5).map(a => `<div class="notif-item">${esc(a.message)}<span>${timeAgo(a.at)}</span></div>`).join('') || '<div class="notif-item">Belum ada aktivitas.</div>'}
                </div>
              </div>
              <button class="profile-chip" data-act="profile">
                <span class="avatar">${esc((user?.username || 'A').slice(0, 1).toUpperCase())}</span>
                <span class="who"><strong>${esc(user?.username || 'admin')}</strong><span>Administrator</span></span>
              </button>
            </div>
          </header>
          <main class="admin-content" id="adminContent"></main>
        </div>
      </div>`;
    document.body.classList.add('admin-body');
    bindShell();
  }

  function bindShell() {
    const search = document.getElementById('adminSearch');
    if (search) {
      search.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const q = search.value.trim();
        ui.project.q = q;
        ui.project.page = 1;
        if (location.hash === '#/projects') renderRoute(); else location.hash = '#/projects';
        search.blur();
      });
    }
  }

  function updateChrome(route) {
    const meta = {
      dashboard: { crumb: 'Overview', title: 'Dashboard' },
      projects: { crumb: 'Projects Management', title: 'Projects Management' },
      components: { crumb: 'Components Management', title: 'Components Management' },
      categories: { crumb: 'Categories Management', title: 'Categories Management' },
      'ai-projects': { crumb: 'AI Generated Projects', title: 'AI Generated Projects' },
      analytics: { crumb: 'Visitor Analytics', title: 'Visitor Analytics' },
      content: { crumb: 'Website Content', title: 'Website Content' },
      settings: { crumb: 'Settings', title: 'Settings' }
    }[route] || { crumb: 'Dashboard', title: 'Dashboard' };
    const crumb = document.getElementById('topbarCrumb');
    const title = document.getElementById('topbarTitle');
    if (crumb) crumb.innerHTML = `<a href="#/dashboard">Admin</a><span>/</span><span>${esc(meta.crumb)}</span>`;
    if (title) title.textContent = meta.title;
    document.title = `${meta.title} — IoT at Home Admin`;
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.getAttribute('data-nav') === route));
  }

  /* ============================================================
     ROUTER
     ============================================================ */
  function parseHash() {
    const raw = (location.hash || '#/dashboard').replace(/^#/, '');
    const parts = raw.split('/').filter(Boolean);
    return { route: parts[0] || 'dashboard', parts };
  }

  let lastRouteKey = '';

  function renderRoute() {
    if (!Auth.isAuthed()) { renderLogin(); return; }
    Auth.refresh();
    const { route, parts } = parseHash();
    if (route === 'login') { location.hash = '#/dashboard'; return; }
    if (!document.getElementById('adminContent')) renderShell();

    if (route === 'projects' && (parts[1] === 'new' || (parts[1] && parts[2] === 'edit'))) {
      const id = parts[1] === 'new' ? null : parts[1];
      if (ui.projectDraft === null || ui.editingId !== id) startProjectEditor(id);
      updateChrome('projects');
      setActiveNavCustom('projects');
      document.getElementById('adminContent').innerHTML = projectEditorView();
      bindEditor();
      lastRouteKey = 'editor';
      return;
    }

    updateChrome(route);
    const content = document.getElementById('adminContent');
    const views = {
      dashboard: viewDashboard,
      projects: viewProjects,
      components: viewComponents,
      categories: viewCategories,
      'ai-projects': viewAiProjects,
      analytics: viewAnalytics,
      content: viewContent,
      settings: viewSettings
    };
    const view = views[route] || viewDashboard;
    content.innerHTML = view();
    bindRoute(route);
    window.scrollTo({ top: 0, behavior: 'instant' });
    lastRouteKey = route;
  }

  function setActiveNavCustom(key) {
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.getAttribute('data-nav') === key));
  }

  /* ============================================================
     DASHBOARD / OVERVIEW
     ============================================================ */
  function monthSeries(items, months = 6) {
    const out = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = items.filter(item => {
        const t = new Date(item.createdAt || item.at);
        return t >= d && t < next;
      }).length;
      out.push({ label: d.toLocaleDateString('id-ID', { month: 'short' }), value: count });
    }
    return out;
  }

  function viewDashboard() {
    const s = Store.get();
    const projects = s.projects;
    const visible = Store.visibleProjects();
    const ai = Store.aiProjects();
    const recent = s.activity.slice(0, 8);
    const newThisWeek = projects.filter(p => Date.now() - new Date(p.createdAt).getTime() < 7 * 86400000).length;
    const compCats = {};
    s.components.forEach(c => { compCats[c.category] = (compCats[c.category] || 0) + 1; });
    const sortedCats = Object.entries(compCats).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    const componentDonut = sortedCats.length > 6
      ? [...sortedCats.slice(0, 5), { label: 'Lainnya', value: sortedCats.slice(5).reduce((sum, c) => sum + c.value, 0) }]
      : sortedCats;
    const difficultyBar = ['Beginner', 'Intermediate', 'Advanced'].map(d => ({ label: d, value: projects.filter(p => p.difficulty === d).length }));
    const categoryBar = s.categories.map(c => ({ label: c.name, value: projects.filter(p => p.category === c.id).length })).filter(d => d.value > 0);
    const pageViews = s.events.filter(e => e.type === 'page_view').length;

    return `
      <div class="page-head">
        <div><h2>Good to see you, ${esc(Auth.session()?.username || 'admin')} 👋</h2>
          <p>Ringkasan data website dari LocalStorage browser ini. Sebagian data awal adalah dataset demo yang dapat di-reset di Settings.</p></div>
        <div class="page-actions">
          <a class="btn btn-outline btn-sm" href="index.html" target="_blank" rel="noopener">Lihat website</a>
          <a class="btn btn-primary btn-sm" href="#/projects/new">${Icons.plus} Tambah proyek</a>
        </div>
      </div>

      <div class="stat-grid">
        ${statCard({ icon: Icons.projects, num: projects.length, label: 'Total Projects', trend: newThisWeek ? `+${newThisWeek} dalam 7 hari` : 'Belum ada data baru', link: '#/projects', foot: `${visible.length} tampil di website` })}
        ${statCard({ icon: Icons.spark, num: ai.length, label: 'AI Generated Projects', trend: `${ai.filter(p => p.status === 'generated').length} menunggu review`, link: '#/ai-projects', foot: 'Dari AI Builder lokal' })}
        ${statCard({ icon: Icons.components, num: s.components.length, label: 'Total Components', trend: `${componentDonut.length} tipe komponen`, link: '#/components', foot: 'Database terpusat' })}
        ${statCard({ icon: Icons.categories, num: s.categories.length, label: 'Total Categories', trend: `${s.categories.filter(c => c.status === 'active').length} aktif`, link: '#/categories', foot: 'Tampil di website' })}
        ${statCard({ icon: Icons.check, num: s.myBuild.length, label: 'Saved Projects', trend: s.myBuild.length ? 'Dari My Build lokal' : 'Belum ada proyek disimpan', link: '#/projects', foot: 'Aktivitas pengunjung' })}
        ${statCard({ icon: Icons.analytics, num: pageViews, label: 'Page Views (lokal)', trend: 'Event tracking lokal', link: '#/analytics', foot: 'Bukan traffic real-world' })}
      </div>

      <div class="chart-grid">
        <div class="chart-card">
          <header><div><h3>Project creation activity</h3><p>Jumlah proyek dibuat per bulan (6 bulan terakhir)</p></div><span class="badge badge-primary">${projects.length} proyek</span></header>
          ${Charts.line(monthSeries(projects), { height: 200 })}
        </div>
        <div class="chart-card">
          <header><div><h3>Projects by category</h3><p>Distribusi proyek pada setiap kategori</p></div></header>
          ${categoryBar.length ? Charts.bar(categoryBar, { height: 200 }) : '<div class="chart-empty">Belum ada proyek dengan kategori.</div>'}
        </div>
      </div>

      <div class="chart-grid" style="grid-template-columns:1fr 1fr 1fr">
        <div class="chart-card">
          <header><div><h3>Generated projects</h3><p>Proyek AI per bulan</p></div></header>
          ${Charts.line(monthSeries(ai), { height: 170 })}
        </div>
        <div class="chart-card">
          <header><div><h3>Components distribution</h3><p>Berdasarkan kategori komponen</p></div></header>
          ${Charts.donut(componentDonut, { size: 170 })}
        </div>
        <div class="chart-card">
          <header><div><h3>Difficulty distribution</h3><p>Sebaran tingkat kesulitan proyek</p></div></header>
          ${Charts.bar(difficultyBar, { height: 170 })}
        </div>
      </div>

      <div class="two-col" style="margin-top:16px">
        <div class="panel">
          <div class="row between" style="margin-bottom:8px"><h3 style="margin:0">Recent activity</h3><a class="small" href="#/analytics">Lihat analytics →</a></div>
          <div class="activity-list">
            ${recent.map(a => {
              const cls = a.type === 'delete' ? 'del' : a.type === 'update' ? 'upd' : '';
              const glyph = a.type === 'delete' ? '🗑' : a.type === 'update' ? '✎' : a.type === 'duplicate' ? '⧉' : '+';
              return `<div class="activity-item"><span class="act-ico ${cls}">${glyph}</span>
                <div class="act-body"><p>${esc(a.message)}</p><span>${timeAgo(a.at)} · ${esc(a.entity)}</span></div></div>`;
            }).join('') || '<p class="small text-muted">Belum ada aktivitas.</p>'}
          </div>
        </div>
        <div class="stack">
          <div class="panel">
            <h3>Quick actions</h3>
            <p>Aksi cepat untuk mengelola konten website.</p>
            <div class="stack">
              <a class="btn btn-outline btn-sm" href="#/projects/new" style="justify-content:flex-start">${Icons.plus} Tambah proyek baru</a>
              <button class="btn btn-outline btn-sm" data-act="quick-component" style="justify-content:flex-start">${Icons.plus} Tambah komponen</button>
              <button class="btn btn-outline btn-sm" data-act="quick-category" style="justify-content:flex-start">${Icons.plus} Tambah kategori</button>
              <a class="btn btn-outline btn-sm" href="#/content" style="justify-content:flex-start">${Icons.content} Ubah konten homepage</a>
            </div>
          </div>
          <div class="panel">
            <h3>Status data</h3>
            <p>Semua angka dihitung langsung dari store yang sama dengan website.</p>
            <div class="summary-mini" style="justify-content:space-between">
              <span>Published <b>${projects.filter(p => p.status === 'published').length}</b></span>
              <span>Draft <b>${projects.filter(p => p.status === 'draft').length}</b></span>
              <span>Generating <b>${ai.filter(p => ['generated', 'reviewed'].includes(p.status)).length}</b></span>
              <span>Archived <b>${projects.filter(p => p.status === 'archived').length}</b></span>
            </div>
            <div class="kbd-note" style="margin-top:12px">Analytics bersifat lokal (event di browser ini), bukan data server atau pengunjung nyata.</div>
          </div>
        </div>
      </div>`;
  }

  function statCard({ icon, num, label, trend, link, foot }) {
    return `<a class="stat-card" href="${link}">
      <div class="stat-top"><span class="stat-ico">${icon}</span><span class="trend ${/belum/i.test(trend) ? 'flat' : ''}">${esc(trend)}</span></div>
      <div class="num">${num}</div>
      <div class="lbl">${esc(label)}</div>
      <div class="stat-link">${esc(foot)} →</div>
    </a>`;
  }

  /* ============================================================
     PROJECTS
     ============================================================ */
  function filteredProjects() {
    const f = ui.project;
    let list = Store.get().projects.slice();
    const q = f.q.toLowerCase();
    if (q) {
      list = list.filter(p => [p.name, p.slug, p.description, p.shortDescription, p.difficulty, p.type,
        Store.categoryById(p.category)?.name || '', (p.tags || []).join(' ')]
        .join(' ').toLowerCase().includes(q));
    }
    if (f.category) list = list.filter(p => p.category === f.category);
    if (f.difficulty) list = list.filter(p => p.difficulty === f.difficulty);
    if (f.type) list = list.filter(p => p.type === f.type);
    if (f.status) list = list.filter(p => p.status === f.status);
    return sortList(list, f.sort, f.dir);
  }

  function viewProjects() {
    const s = Store.get();
    const all = filteredProjects();
    const meta = paginate(all, ui.project.page);
    ui.project.page = meta.page;
    const f = ui.project;
    return `
      ${pageHead('Projects Management', 'Kelola proyek default maupun hasil AI Builder. Perubahan langsung tampil pada website.',
        `<a class="btn btn-primary btn-sm" href="#/projects/new">${Icons.plus} Add Project</a>`)}
      <div class="toolbar">
        <label class="search-inline">${Icons.search}<input id="projSearch" type="search" placeholder="Cari nama, kategori, deskripsi…" value="${esc(f.q)}" /></label>
        <select data-filter="project-category"><option value="">Semua kategori</option>${s.categories.map(c => `<option value="${c.id}" ${f.category === c.id ? 'selected' : ''}>${esc(c.icon + ' ' + c.name)}</option>`).join('')}</select>
        <select data-filter="project-difficulty">${['', 'Beginner', 'Intermediate', 'Advanced'].map(d => `<option value="${d}" ${f.difficulty === d ? 'selected' : ''}>${d || 'Semua level'}</option>`).join('')}</select>
        <select data-filter="project-type">${[['', 'Semua tipe'], ['default', 'Default'], ['ai', 'AI generated']].map(([v, l]) => `<option value="${v}" ${f.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <select data-filter="project-status">${[['', 'Semua status'], ['published', 'Published'], ['draft', 'Draft'], ['generated', 'Generated'], ['reviewed', 'Reviewed'], ['archived', 'Archived']].map(([v, l]) => `<option value="${v}" ${f.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <button class="btn btn-ghost btn-sm" data-act="reset-project-filter">Reset</button>
      </div>
      <div class="table-card">
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr>
              <th class="no-sort">Image</th>
              ${th('project', 'name', 'Project')}
              ${th('project', 'category', 'Category')}
              ${th('project', 'difficulty', 'Difficulty')}
              ${th('project', 'cost', 'Budget')}
              ${th('project', 'duration', 'Duration')}
              ${th('project', 'type', 'Type')}
              ${th('project', 'status', 'Status')}
              ${th('project', 'createdAt', 'Created')}
              <th class="no-sort" style="text-align:right">Actions</th>
            </tr></thead>
            <tbody>
              ${meta.slice.map(p => `<tr>
                <td><span class="thumb-sm">${thumb(p)}</span></td>
                <td><div class="cell-title"><div><strong>${esc(p.name)}</strong><small>${esc(p.slug)}</small></div></div></td>
                <td><span class="badge badge-primary">${esc(Store.categoryById(p.category)?.name || '—')}</span></td>
                <td><span class="badge ${p.difficulty === 'Beginner' ? 'badge-level-beginner' : p.difficulty === 'Intermediate' ? 'badge-level-intermediate' : 'badge-level-advanced'}">${esc(p.difficulty)}</span></td>
                <td class="price-cell">${money(Store.projectCost(p))}</td>
                <td class="small">${esc(p.duration || '—')}</td>
                <td><span class="badge ${p.type === 'ai' ? 'badge-accent' : ''}">${projTypeLabel(p)}</span></td>
                <td>${badge(p.status)}</td>
                <td class="small">${formatDate(p.createdAt)}</td>
                <td><div class="actions-cell">
                  <button class="mini-btn" data-act="proj-view" data-id="${p.id}" title="Lihat di website">${Icons.eye}</button>
                  <a class="mini-btn" href="#/projects/${p.id}/edit" title="Edit">${Icons.edit}</a>
                  <button class="mini-btn" data-act="proj-dup" data-id="${p.id}" title="Duplicate">${Icons.copy}</button>
                  <button class="mini-btn" data-act="proj-status" data-id="${p.id}" title="${p.status === 'published' ? 'Unpublish' : 'Publish'}">${p.status === 'published' ? '↺' : '✓'}</button>
                  <button class="mini-btn danger" data-act="proj-del" data-id="${p.id}" title="Delete">${Icons.trash}</button>
                </div></td>
              </tr>`).join('') || `<tr><td colspan="10">${emptyBlock('Tidak ada proyek', 'Ubah filter atau tambahkan proyek baru.', '<a class="btn btn-primary btn-sm" href="#/projects/new">Tambah proyek</a>')}</td></tr>`}
            </tbody>
          </table>
        </div>
        ${pager('projects', meta)}
      </div>
      <p class="small text-muted" style="margin-top:10px">Budget dihitung dari harga komponen terbaru pada database. ${meta.total} proyek cocok dengan filter saat ini.</p>`;
  }

  /* ============================================================
     PROJECT EDITOR
     ============================================================ */
  const blankProject = () => ({
    name: '', slug: '', category: Store.get().categories[0]?.id || '', difficulty: 'Beginner',
    duration: '1–2 hari', budget: 0, image: '', type: 'default', status: 'draft', tags: [],
    shortDescription: '', description: '', purpose: '', outcome: '',
    features: [], howItWorks: [],
    architecture: { description: '', input: '', controller: '', processing: '', output: '', communication: '' },
    components: [], buildGuide: [], testing: [], troubleshooting: [], upgrades: [],
    wiring: '', sourceCode: ''
  });

  function startProjectEditor(id) {
    if (id) {
      const p = Store.projectById(id);
      if (!p) { ui.projectDraft = blankProject(); ui.editingId = null; ui.projectTab = 'general'; return; }
      ui.projectDraft = JSON.parse(JSON.stringify(p));
      ui.editingId = id;
    } else {
      ui.projectDraft = blankProject();
      ui.editingId = null;
    }
    ui.projectTab = 'general';
  }

  const PROJECT_TABS = [
    ['general', 'General'], ['features', 'Features & Flow'], ['architecture', 'Architecture'],
    ['components', 'Components'], ['guide', 'Build Guide'], ['testing', 'Testing'],
    ['troubleshooting', 'Troubleshooting'], ['extras', 'Upgrades & Code']
  ];

  function projectEditorView() {
    const d = ui.projectDraft;
    return `
      <div class="page-head">
        <div>
          <div class="breadcrumb admin-crumb"><a href="#/projects">Projects</a><span>/</span><span>${ui.editingId ? 'Edit' : 'Add new'}</span></div>
          <h2>${ui.editingId ? esc(d.name || 'Edit project') : 'Add New Project'}</h2>
          <p>Lengkapi data proyek. Perubahan disimpan ke store yang sama dengan website utama.</p>
        </div>
        <div class="page-actions">
          <a class="btn btn-outline btn-sm" href="#/projects">Batal</a>
          ${ui.editingId ? `<button class="btn btn-danger btn-sm" data-act="editor-delete">Hapus</button>` : ''}
          <button class="btn btn-primary btn-sm" data-act="editor-save">${Icons.check} Simpan proyek</button>
        </div>
      </div>
      <div class="card">
        <div class="subtabs">
          ${PROJECT_TABS.map(([key, label]) => `<button data-act="editor-tab" data-tab="${key}" class="${ui.projectTab === key ? 'active' : ''}">${label}</button>`).join('')}
        </div>
        <form id="projectForm" novalidate>${projectTabBody(d)}</form>
        <div class="row between wrap" style="margin-top:18px;border-top:1px solid var(--border);padding-top:16px">
          <span class="small text-muted">${ui.editingId ? 'Terakhir diperbarui ' + formatDate(d.updatedAt, true) : 'Proyek baru akan tersimpan sebagai draft sampai dipublikasikan.'}</span>
          <div class="row"><a class="btn btn-ghost btn-sm" href="#/projects">Batal</a><button type="button" class="btn btn-primary btn-sm" data-act="editor-save">Simpan proyek</button></div>
        </div>
      </div>`;
  }

  function projectTabBody(d) {
    const tab = ui.projectTab;
    const cats = Store.get().categories;
    if (tab === 'general') {
      return `
        <div class="form-section"><h4>General information</h4><p>Informasi utama yang tampil pada kartu dan halaman detail proyek.</p>
          <div class="form-grid">
            <div class="field"><label>Project name *</label><input data-pfield="name" value="${esc(d.name)}" placeholder="Smart Plant Watering System" /></div>
            <div class="field"><label>Project slug *</label><input data-pfield="slug" value="${esc(d.slug)}" placeholder="smart-plant-watering-system" /><span class="hint">Dipakai pada URL halaman detail.</span></div>
            <div class="field"><label>Category *</label><select data-pfield="category">${cats.map(c => `<option value="${c.id}" ${d.category === c.id ? 'selected' : ''}>${esc(c.icon + ' ' + c.name)}</option>`).join('')}</select></div>
            <div class="field"><label>Difficulty</label><select data-pfield="difficulty">${['Beginner', 'Intermediate', 'Advanced'].map(v => `<option ${d.difficulty === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
            <div class="field"><label>Estimated build duration</label><input data-pfield="duration" value="${esc(d.duration)}" placeholder="2–3 hari" /></div>
            <div class="field"><label>Estimated budget (Rp)</label><input data-pfield="budget" type="number" min="0" step="5000" value="${Number(d.budget) || 0}" /><span class="hint">Budget acuan; biaya komponen dihitung otomatis.</span></div>
            <div class="field"><label>Project image URL</label><input data-pfield="image" value="${esc(d.image)}" placeholder="https://… atau kosongkan untuk ikon kategori" /></div>
            <div class="field"><label>Project type</label><select data-pfield="type"><option value="default" ${d.type === 'default' ? 'selected' : ''}>Default</option><option value="ai" ${d.type === 'ai' ? 'selected' : ''}>AI generated</option></select></div>
            <div class="field"><label>Status</label><select data-pfield="status">${[['draft', 'Draft'], ['published', 'Published'], ['generated', 'Generated'], ['reviewed', 'Reviewed'], ['archived', 'Archived']].map(([v, l]) => `<option value="${v}" ${d.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
            <div class="field"><label>Tags (pisahkan dengan koma)</label><input data-pfield="tags" value="${esc((d.tags || []).join(', '))}" placeholder="otomasi, esp32, tanaman" /></div>
            <div class="field full"><label>Short description</label><textarea data-pfield="shortDescription" rows="2" placeholder="Ringkasan singkat untuk kartu proyek">${esc(d.shortDescription)}</textarea></div>
            <div class="field full"><label>Description</label><textarea data-pfield="description" rows="4" placeholder="Deskripsi lengkap proyek">${esc(d.description)}</textarea></div>
            <div class="field"><label>Main purpose</label><textarea data-pfield="purpose" rows="3">${esc(d.purpose)}</textarea></div>
            <div class="field"><label>Expected outcome</label><textarea data-pfield="outcome" rows="3">${esc(d.outcome)}</textarea></div>
          </div>
        </div>`;
    }
    if (tab === 'features') {
      return `
        <div class="form-section"><h4>Project features</h4><p>Tambahkan fitur proyek secara dinamis.</p>
          <div data-listkey="features">${repeaterList(d.features, 'features', 'Contoh: Automatic watering')}</div>
          <button type="button" class="btn btn-outline btn-sm" data-act="list-add" data-key="features">${Icons.plus} Tambah feature</button>
        </div>
        <div class="form-section"><h4>How it works</h4><p>Alur kerja proyek dari input sampai output.</p>
          <div data-listkey="howItWorks">${repeaterList(d.howItWorks, 'howItWorks', 'Contoh: Sensor membaca kelembapan tanah')}</div>
          <button type="button" class="btn btn-outline btn-sm" data-act="list-add" data-key="howItWorks">${Icons.plus} Tambah langkah</button>
        </div>`;
    }
    if (tab === 'architecture') {
      const a = d.architecture || {};
      return `<div class="form-section"><h4>System architecture</h4><p>Jelaskan sistem secara ringkas agar pembaca memahami alurnya.</p>
        <div class="field"><label>System description</label><textarea data-pfield="architecture.description" rows="3">${esc(a.description)}</textarea></div>
        <div class="form-grid">
          <div class="field"><label>Input</label><input data-pfield="architecture.input" value="${esc(a.input)}" /></div>
          <div class="field"><label>Controller</label><input data-pfield="architecture.controller" value="${esc(a.controller)}" /></div>
          <div class="field"><label>Processing</label><input data-pfield="architecture.processing" value="${esc(a.processing)}" /></div>
          <div class="field"><label>Output</label><input data-pfield="architecture.output" value="${esc(a.output)}" /></div>
          <div class="field full"><label>Communication</label><input data-pfield="architecture.communication" value="${esc(a.communication)}" /></div>
        </div>
      </div>
      <div class="form-section"><h4>Wiring notes</h4><p>Catatan koneksi pin atau jalur kabel.</p>
        <div class="field"><textarea data-pfield="wiring" rows="3" placeholder="ESP32 GPIO34 → AO sensor…">${esc(d.wiring)}</textarea></div>
      </div>`;
    }
    if (tab === 'components') {
      const chosen = d.components || [];
      return `<div class="form-section"><h4>Project components</h4><p>Pilih komponen dari component database. Harga dihitung otomatis dari database.</p>
        <div class="form-grid" style="align-items:start">
          <div>
            <span class="label">Component database (${Store.get().components.length})</span>
            <div class="pick-list">
              ${Store.get().components.map(c => `<div class="pick-row">
                <label><input type="checkbox" data-pcomp-check="${c.id}" ${chosen.some(x => x.componentId === c.id) ? 'checked' : ''} />
                  <span class="grow">${esc(c.name)}<br /><span class="small text-muted">${money(c.price)} · ${esc(c.category)}</span></span></label>
              </div>`).join('')}
            </div>
          </div>
          <div>
            <span class="label">Komponen terpilih (${chosen.length})</span>
            <div class="comp-chosen" data-complist>
              ${chosen.map(item => {
                const c = Store.componentById(item.componentId);
                if (!c) return '';
                return `<div class="chosen-row">
                  <span class="grow"><strong>${esc(c.name)}</strong><br /><span class="small text-muted">${money(c.price)} / unit</span></span>
                  <input type="number" min="1" value="${item.qty || 1}" data-pcomp-qty="${c.id}" title="Qty" style="width:64px" />
                  <select data-pcomp-mandatory="${c.id}" title="Status">
                    <option value="true" ${item.mandatory ? 'selected' : ''}>Wajib</option>
                    <option value="false" ${!item.mandatory ? 'selected' : ''}>Opsional</option>
                  </select>
                  <input type="text" value="${esc(item.notes || '')}" data-pcomp-notes="${c.id}" placeholder="Catatan" style="max-width:150px" />
                </div>`;
              }).join('') || '<p class="small text-muted">Belum ada komponen dipilih.</p>'}
            </div>
            <div class="summary-box" style="margin-top:12px">
              <div class="summary-line"><span>Total komponen</span><strong>${money(chosen.reduce((sum, i) => { const c = Store.componentById(i.componentId); return sum + (c ? c.price * (i.qty || 1) : 0); }, 0))}</strong></div>
              <div class="summary-line"><span>Budget target</span><span>${money(d.budget)}</span></div>
            </div>
          </div>
        </div>
      </div>`;
    }
    if (tab === 'guide') {
      return `<div class="form-section"><h4>Build guide</h4><p>Susun langkah tutorial. Gunakan tombol panah untuk mengubah urutan.</p>
        <div data-listkey="buildGuide">
          ${(d.buildGuide || []).map((step, i) => `<div class="repeater-row" data-bguide>
            <div class="repeater-head"><strong>Langkah ${i + 1}</strong>
              <div class="repeater-actions">
                <div class="order-btns">
                  <button type="button" class="mini-btn" data-act="guide-move" data-index="${i}" data-dir="-1" title="Naik" ${i === 0 ? 'disabled' : ''}>▲</button>
                  <button type="button" class="mini-btn" data-act="guide-move" data-index="${i}" data-dir="1" title="Turun" ${i === (d.buildGuide || []).length - 1 ? 'disabled' : ''}>▼</button>
                </div>
                <button type="button" class="mini-btn danger" data-act="guide-remove" data-index="${i}">${Icons.trash}</button>
              </div>
            </div>
            <div class="form-grid">
              <div class="field"><label>Step title</label><input data-bk="title" value="${esc(step.title)}" /></div>
              <div class="field"><label>Image / illustration URL</label><input data-bk="image" value="${esc(step.image)}" placeholder="https://…" /></div>
              <div class="field full"><label>Step description</label><textarea data-bk="description" rows="2">${esc(step.description)}</textarea></div>
              <div class="field full"><label>Instructions (satu baris = satu instruksi)</label><textarea data-bk="instructions" rows="4">${esc((step.instructions || []).join('\n'))}</textarea></div>
              <div class="field"><label>Notes</label><textarea data-bk="notes" rows="2">${esc(step.notes)}</textarea></div>
              <div class="field"><label>Safety warning</label><textarea data-bk="warning" rows="2">${esc(step.warning)}</textarea></div>
            </div>
          </div>`).join('') || '<p class="small text-muted">Belum ada langkah build.</p>'}
        </div>
        <button type="button" class="btn btn-outline btn-sm" data-act="guide-add">${Icons.plus} Tambah langkah</button>
      </div>`;
    }
    if (tab === 'testing') {
      return `<div class="form-section"><h4>Testing</h4><p>Daftar pengujian yang perlu dilakukan sebelum proyek dianggap selesai.</p>
        <div data-listkey="testing">
          ${(d.testing || []).map((t, i) => `<div class="repeater-row" data-rrow="testing">
            <div class="repeater-head"><strong>Tes ${i + 1}</strong><div class="repeater-actions"><button type="button" class="mini-btn danger" data-act="row-remove" data-list="testing" data-index="${i}">${Icons.trash}</button></div></div>
            <div class="form-grid">
              <div class="field"><label>Test name</label><input data-rk="name" value="${esc(t.name)}" /></div>
              <div class="field"><label>Expected result</label><input data-rk="expected" value="${esc(t.expected)}" /></div>
              <div class="field full"><label>Test description</label><textarea data-rk="description" rows="2">${esc(t.description)}</textarea></div>
              <div class="field full"><label>Test instructions</label><textarea data-rk="instructions" rows="2">${esc(t.instructions)}</textarea></div>
            </div>
          </div>`).join('') || '<p class="small text-muted">Belum ada data testing.</p>'}
        </div>
        <button type="button" class="btn btn-outline btn-sm" data-act="row-add" data-list="testing">${Icons.plus} Tambah test</button>
      </div>`;
    }
    if (tab === 'troubleshooting') {
      return `<div class="form-section"><h4>Troubleshooting</h4><p>Masalah umum beserta penyebab dan solusinya.</p>
        <div data-listkey="troubleshooting">
          ${(d.troubleshooting || []).map((t, i) => `<div class="repeater-row" data-rrow="troubleshooting">
            <div class="repeater-head"><strong>Masalah ${i + 1}</strong><div class="repeater-actions"><button type="button" class="mini-btn danger" data-act="row-remove" data-list="troubleshooting" data-index="${i}">${Icons.trash}</button></div></div>
            <div class="form-grid">
              <div class="field full"><label>Problem</label><input data-rk="problem" value="${esc(t.problem)}" /></div>
              <div class="field"><label>Cause</label><textarea data-rk="cause" rows="2">${esc(t.cause)}</textarea></div>
              <div class="field"><label>Solution</label><textarea data-rk="solution" rows="2">${esc(t.solution)}</textarea></div>
            </div>
          </div>`).join('') || '<p class="small text-muted">Belum ada data troubleshooting.</p>'}
        </div>
        <button type="button" class="btn btn-outline btn-sm" data-act="row-add" data-list="troubleshooting">${Icons.plus} Tambah masalah</button>
      </div>`;
    }
    return `<div class="form-section"><h4>Upgrade ideas</h4><p>Ide pengembangan lanjutan untuk proyek.</p>
        <div data-listkey="upgrades">${repeaterList(d.upgrades, 'upgrades', 'Contoh: Tambahkan notifikasi Telegram')}</div>
        <button type="button" class="btn btn-outline btn-sm" data-act="list-add" data-key="upgrades">${Icons.plus} Tambah ide</button>
      </div>
      <div class="form-section"><h4>Source code</h4><p>Kode contoh yang tampil pada tab Build Guide.</p>
        <div class="field"><textarea data-pfield="sourceCode" rows="12" style="font-family:monospace;font-size:.8rem" placeholder="// kode Arduino / ESP32">${esc(d.sourceCode)}</textarea></div>
      </div>`;
  }

  function repeaterList(items, key, placeholder) {
    return (items || []).map((value, i) => `<div class="repeater-row" style="display:flex;gap:8px;align-items:center">
      <span class="drag-handle">≡</span>
      <input data-rf="${key}" value="${esc(value)}" placeholder="${esc(placeholder)}" style="flex:1" />
      <button type="button" class="mini-btn danger" data-act="list-remove" data-key="${key}" data-index="${i}">${Icons.trash}</button>
    </div>`).join('');
  }

  function collectProjectForm() {
    const d = ui.projectDraft;
    if (!d) return d;
    document.querySelectorAll('[data-pfield]').forEach(el => setPath(d, el.dataset.pfield, el.value));
    if (document.querySelector('[data-pfield="tags"]')) {
      d.tags = String(d.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    }
    const collectList = (key) => {
      if (!document.querySelector(`[data-listkey="${key}"]`)) return;
      /* Baris kosong dipertahankan saat editing; filter dilakukan saat simpan (normalizeProject). */
      d[key] = Array.from(document.querySelectorAll(`[data-rf="${key}"]`)).map(i => i.value.trim());
    };
    collectList('features');
    collectList('howItWorks');
    collectList('upgrades');
    if (document.querySelector('[data-listkey="testing"]')) {
      d.testing = Array.from(document.querySelectorAll('[data-rrow="testing"]')).map(row => ({
        name: row.querySelector('[data-rk="name"]').value,
        description: row.querySelector('[data-rk="description"]').value,
        expected: row.querySelector('[data-rk="expected"]').value,
        instructions: row.querySelector('[data-rk="instructions"]').value
      })).filter(t => t.name.trim() || t.description.trim());
    }
    if (document.querySelector('[data-listkey="troubleshooting"]')) {
      d.troubleshooting = Array.from(document.querySelectorAll('[data-rrow="troubleshooting"]')).map(row => ({
        problem: row.querySelector('[data-rk="problem"]').value,
        cause: row.querySelector('[data-rk="cause"]').value,
        solution: row.querySelector('[data-rk="solution"]').value
      })).filter(t => t.problem.trim());
    }
    if (document.querySelector('[data-listkey="buildGuide"]')) {
      d.buildGuide = Array.from(document.querySelectorAll('[data-bguide]')).map(card => ({
        title: card.querySelector('[data-bk="title"]').value,
        description: card.querySelector('[data-bk="description"]').value,
        image: card.querySelector('[data-bk="image"]').value,
        instructions: card.querySelector('[data-bk="instructions"]').value.split('\n').map(s => s.trim()).filter(Boolean),
        notes: card.querySelector('[data-bk="notes"]').value,
        warning: card.querySelector('[data-bk="warning"]').value
      }));
    }
    if (document.querySelector('[data-complist]')) {
      const chosen = [];
      document.querySelectorAll('[data-pcomp-check]:checked').forEach(cb => {
        const id = cb.getAttribute('data-pcomp-check');
        chosen.push({
          componentId: id,
          qty: Number(document.querySelector(`[data-pcomp-qty="${id}"]`)?.value) || 1,
          mandatory: document.querySelector(`[data-pcomp-mandatory="${id}"]`)?.value !== 'false',
          notes: document.querySelector(`[data-pcomp-notes="${id}"]`)?.value || ''
        });
      });
      d.components = chosen;
    }
    if (document.querySelector('[data-pfield="budget"]')) d.budget = Number(d.budget) || 0;
    return d;
  }

  function saveProject() {
    const d = collectProjectForm();
    if (!d) return;
    const errors = [];
    if (!d.name || d.name.trim().length < 3) errors.push('Nama proyek minimal 3 karakter.');
    if (!d.category) errors.push('Pilih kategori proyek.');
    if (!d.slug) d.slug = slugify(d.name);
    if (!d.slug) errors.push('Slug proyek tidak valid.');
    const duplicate = Store.get().projects.find(p => p.slug === d.slug && p.id !== ui.editingId);
    if (duplicate) errors.push('Slug sudah dipakai proyek lain.');
    if (errors.length) {
      toast(errors[0], 'error', 'Validasi gagal');
      ui.projectTab = 'general';
      document.getElementById('adminContent').innerHTML = projectEditorView();
      bindEditor();
      return;
    }
    if (ui.editingId) {
      Store.updateProject(ui.editingId, d);
      toast('Proyek berhasil diperbarui dan langsung tampil pada website.', 'success');
    } else {
      Store.addProject(d);
      toast('Proyek baru berhasil ditambahkan.', 'success');
    }
    ui.projectDraft = null;
    ui.editingId = null;
    location.hash = '#/projects';
  }

  function bindEditor() {
    const form = document.getElementById('projectForm');
    if (form) {
      form.addEventListener('submit', (e) => { e.preventDefault(); saveProject(); });
      form.addEventListener('input', (e) => {
        if (e.target.dataset.pfield === 'name') {
          const slugInput = form.querySelector('[data-pfield="slug"]');
          if (slugInput && !slugInput.dataset.touched) slugInput.value = slugify(e.target.value);
        }
        if (e.target.dataset.pfield === 'slug') e.target.dataset.touched = '1';
      });
      form.addEventListener('change', (e) => {
        if (e.target.matches('[data-pcomp-check]')) {
          const d = collectProjectForm();
          const id = e.target.getAttribute('data-pcomp-check');
          if (e.target.checked) {
            if (!d.components.some(c => c.componentId === id)) d.components.push({ componentId: id, qty: 1, mandatory: true, notes: '' });
          } else {
            d.components = d.components.filter(c => c.componentId !== id);
          }
          document.getElementById('adminContent').innerHTML = projectEditorView();
          bindEditor();
        }
      });
    }
  }

  /* ============================================================
     COMPONENTS
     ============================================================ */
  function filteredComponents() {
    const f = ui.component;
    let list = Store.get().components.slice();
    const q = f.q.toLowerCase();
    if (q) list = list.filter(c => [c.name, c.category, c.spec, c.communication, c.description, c.function, c.compatibility].join(' ').toLowerCase().includes(q));
    if (f.category) list = list.filter(c => c.category === f.category);
    return sortList(list, f.sort, f.dir);
  }

  function viewComponents() {
    const s = Store.get();
    const cats = [...new Set(s.components.map(c => c.category))].sort(byText);
    const all = filteredComponents();
    const meta = paginate(all, ui.component.page);
    ui.component.page = meta.page;
    return `
      ${pageHead('Components Management', 'Satu database komponen dipakai oleh project details, AI Builder, Budget Builder, Build Guide, dan Shopping List.',
        `<button class="btn btn-primary btn-sm" data-act="comp-add">${Icons.plus} Add Component</button>`)}
      <div class="toolbar">
        <label class="search-inline">${Icons.search}<input id="compAdminSearch" type="search" placeholder="Cari nama, kategori, spesifikasi…" value="${esc(ui.component.q)}" /></label>
        <select data-filter="comp-category"><option value="">Semua kategori</option>${cats.map(c => `<option value="${esc(c)}" ${ui.component.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
        <button class="btn btn-ghost btn-sm" data-act="reset-comp-filter">Reset</button>
      </div>
      <div class="table-card">
        <div class="table-wrap"><table class="admin-table">
          <thead><tr>
            <th class="no-sort">Image</th>
            ${th('component', 'name', 'Component')}
            ${th('component', 'category', 'Category')}
            ${th('component', 'price', 'Est. Price')}
            ${th('component', 'voltage', 'Voltage')}
            ${th('component', 'communication', 'Communication')}
            <th class="no-sort">Stock</th>
            <th class="no-sort">Used in</th>
            <th class="no-sort" style="text-align:right">Actions</th>
          </tr></thead>
          <tbody>
            ${meta.slice.map(c => `<tr>
              <td><span class="thumb-sm" style="background:var(--primary-soft);border:1px solid var(--primary-light)">${thumb(c, 'component')}</span></td>
              <td><div class="cell-title"><div><strong>${esc(c.name)}</strong><small>${esc(c.slug)}</small></div></div></td>
              <td><span class="badge">${esc(c.category)}</span></td>
              <td class="price-cell">${money(c.price)}</td>
              <td class="small">${esc(c.voltage || '—')}</td>
              <td class="small">${esc(c.communication || '—')}</td>
              <td><span class="badge">Tidak dilacak</span></td>
              <td class="small">${Store.componentUsageCount(c.id)} proyek</td>
              <td><div class="actions-cell">
                <button class="mini-btn" data-act="comp-edit" data-id="${c.id}" title="Edit">${Icons.edit}</button>
                <button class="mini-btn" data-act="comp-dup" data-id="${c.id}" title="Duplicate">${Icons.copy}</button>
                <button class="mini-btn danger" data-act="comp-del" data-id="${c.id}" title="Delete">${Icons.trash}</button>
              </div></td>
            </tr>`).join('') || `<tr><td colspan="9">${emptyBlock('Tidak ada komponen', 'Tambahkan komponen baru ke database.')}</td></tr>`}
          </tbody>
        </table></div>
        ${pager('components', meta)}
      </div>
      <p class="small text-muted" style="margin-top:10px">Stock status belum tersedia pada model data prototype ini, jadi ditandai "Tidak dilacak" — bukan klaim stok nyata.</p>`;
  }

  function componentFormBody(c) {
    return `
      <div class="form-section"><h4>Component information</h4>
        <div class="form-grid">
          <div class="field"><label>Component name *</label><input id="cfName" value="${esc(c.name)}" /></div>
          <div class="field"><label>Component slug</label><input id="cfSlug" value="${esc(c.slug)}" /></div>
          <div class="field"><label>Image URL</label><input id="cfImage" value="${esc(c.image)}" /></div>
          <div class="field"><label>Category</label><input id="cfCategory" value="${esc(c.category)}" placeholder="Sensor / Actuator / …" list="compCats" />
            <datalist id="compCats">${[...new Set(Store.get().components.map(x => x.category))].map(x => `<option value="${esc(x)}">`).join('')}</datalist></div>
          <div class="field"><label>Estimated price (Rp)</label><input id="cfPrice" type="number" min="0" step="500" value="${Number(c.price) || 0}" /></div>
          <div class="field"><label>Operating voltage</label><input id="cfVoltage" value="${esc(c.voltage)}" placeholder="3.3–5V" /></div>
          <div class="field"><label>Current rating</label><input id="cfCurrent" value="${esc(c.current)}" placeholder="80 mA" /></div>
          <div class="field"><label>Communication type</label><input id="cfComm" value="${esc(c.communication)}" placeholder="I2C, Wi-Fi, analog…" /></div>
          <div class="field"><label>Difficulty</label><select id="cfDifficulty">${['Beginner', 'Intermediate', 'Advanced'].map(v => `<option ${c.difficulty === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          <div class="field"><label>Datasheet URL</label><input id="cfDatasheet" value="${esc(c.datasheet)}" /></div>
          <div class="field"><label>Shopee search link</label><input id="cfShopee" value="${esc(c.shopee)}" /></div>
          <div class="field"><label>Tokopedia search link</label><input id="cfTokopedia" value="${esc(c.tokopedia)}" /></div>
          <div class="field full"><label>Description</label><textarea id="cfDescription" rows="2">${esc(c.description)}</textarea></div>
          <div class="field full"><label>Function</label><textarea id="cfFunction" rows="2">${esc(c.function)}</textarea></div>
          <div class="field full"><label>Specification</label><textarea id="cfSpec" rows="2">${esc(c.spec)}</textarea></div>
          <div class="field"><label>Compatibility</label><textarea id="cfCompat" rows="2">${esc(c.compatibility)}</textarea></div>
          <div class="field"><label>Optional notes</label><textarea id="cfNotes" rows="2">${esc(c.notes)}</textarea></div>
        </div>
      </div>
      <div class="form-section"><h4>Component alternatives</h4><p>Alternatif budget, recommended, atau premium.</p>
        <div id="altRows">${(c.alternatives || []).map(altRowMarkup).join('')}</div>
        <button type="button" class="btn btn-outline btn-sm" id="addAlt">${Icons.plus} Tambah alternatif</button>
      </div>`;
  }

  function altRowMarkup(a = {}) {
    return `<div class="repeater-row" data-alt-row>
      <div class="repeater-head"><strong>Alternatif</strong><button type="button" class="mini-btn danger" data-alt-remove>${Icons.trash}</button></div>
      <div class="form-grid">
        <div class="field"><label>Alternative name</label><input data-alt="name" value="${esc(a.name || '')}" /></div>
        <div class="field"><label>Price</label><input data-alt="price" type="number" min="0" value="${Number(a.price) || 0}" /></div>
        <div class="field"><label>Type</label><select data-alt="type">${['Budget', 'Recommended', 'Premium'].map(t => `<option ${a.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="field"><label>Compatibility notes</label><input data-alt="compatibility" value="${esc(a.compatibility || '')}" /></div>
        <div class="field full"><label>Description</label><input data-alt="description" value="${esc(a.description || '')}" /></div>
      </div>
    </div>`;
  }

  function openComponentEditor(id) {
    const existing = id ? Store.componentById(id) : null;
    const c = existing || {
      name: '', slug: '', image: '', category: '', description: '', function: '', price: 0,
      voltage: '', current: '', communication: '', spec: '', compatibility: '', difficulty: 'Beginner',
      datasheet: '', shopee: '', tokopedia: '', notes: '', alternatives: []
    };
    openModal({
      title: existing ? 'Edit component' : 'Add component',
      size: 'modal-xl',
      body: componentFormBody(c),
      footer: `<button class="btn btn-outline" data-modal-close>Batal</button><button class="btn btn-primary" data-act="comp-save" data-id="${id || ''}">Simpan komponen</button>`,
      onMount(modal) {
        modal.querySelectorAll('[data-modal-close]').forEach(b => b.addEventListener('click', () => modal.querySelector('.modal-x').click()));
        const nameInput = modal.querySelector('#cfName');
        nameInput.addEventListener('input', () => {
          const slug = modal.querySelector('#cfSlug');
          if (!slug.dataset.touched) slug.value = slugify(nameInput.value);
        });
        modal.querySelector('#cfSlug').addEventListener('input', (e) => { e.target.dataset.touched = '1'; });
        modal.querySelector('#addAlt').addEventListener('click', () => {
          modal.querySelector('#altRows').insertAdjacentHTML('beforeend', altRowMarkup());
        });
        modal.addEventListener('click', (e) => {
          const rm = e.target.closest('[data-alt-remove]');
          if (rm) rm.closest('[data-alt-row]').remove();
        });
        modal.querySelector('[data-act="comp-save"]').addEventListener('click', () => {
          const val = sel => modal.querySelector(sel).value;
          const name = val('#cfName').trim();
          if (name.length < 2) { toast('Nama komponen minimal 2 karakter.', 'error', 'Validasi gagal'); return; }
          const price = Number(val('#cfPrice')) || 0;
          if (price < 0) { toast('Harga tidak boleh negatif.', 'error', 'Validasi gagal'); return; }
          const alternatives = Array.from(modal.querySelectorAll('[data-alt-row]')).map(row => ({
            name: row.querySelector('[data-alt="name"]').value.trim(),
            price: Number(row.querySelector('[data-alt="price"]').value) || 0,
            type: row.querySelector('[data-alt="type"]').value,
            compatibility: row.querySelector('[data-alt="compatibility"]').value,
            description: row.querySelector('[data-alt="description"]').value
          })).filter(a => a.name);
          const payload = {
            name,
            slug: val('#cfSlug').trim() || slugify(name),
            image: val('#cfImage'), category: val('#cfCategory').trim() || 'Sensor',
            price, voltage: val('#cfVoltage'), current: val('#cfCurrent'),
            communication: val('#cfComm'), difficulty: val('#cfDifficulty'),
            datasheet: val('#cfDatasheet'), shopee: val('#cfShopee'), tokopedia: val('#cfTokopedia'),
            description: val('#cfDescription'), function: val('#cfFunction'), spec: val('#cfSpec'),
            compatibility: val('#cfCompat'), notes: val('#cfNotes'), alternatives
          };
          if (existing) {
            Store.updateComponent(existing.id, payload);
            toast('Komponen diperbarui. Harga baru langsung dipakai di proyek & shopping list.', 'success');
          } else {
            Store.addComponent(payload);
            toast('Komponen baru ditambahkan ke database.', 'success');
          }
          modal.querySelector('.modal-x').click();
          renderRoute();
        });
      }
    });
  }

  /* ============================================================
     CATEGORIES
     ============================================================ */
  function filteredCategories() {
    const f = ui.category;
    let list = Store.get().categories.slice();
    const q = f.q.toLowerCase();
    if (q) list = list.filter(c => [c.name, c.slug, c.description].join(' ').toLowerCase().includes(q));
    return sortList(list, f.sort, f.dir);
  }

  function viewCategories() {
    const all = filteredCategories();
    const meta = paginate(all, ui.category.page);
    ui.category.page = meta.page;
    return `
      ${pageHead('Categories Management', 'Kategori yang dibuat di sini otomatis muncul di homepage, filter Explore, form proyek, dan AI Builder.',
        `<button class="btn btn-primary btn-sm" data-act="cat-add">${Icons.plus} Add Category</button>`)}
      <div class="toolbar">
        <label class="search-inline">${Icons.search}<input id="catSearch" type="search" placeholder="Cari kategori…" value="${esc(ui.category.q)}" /></label>
        <button class="btn btn-ghost btn-sm" data-act="reset-cat-filter">Reset</button>
      </div>
      <div class="table-card">
        <div class="table-wrap"><table class="admin-table" style="min-width:720px">
          <thead><tr>
            <th class="no-sort">Icon</th>
            ${th('category', 'name', 'Category')}
            <th class="no-sort">Description</th>
            ${th('category', 'projects', 'Total Projects')}
            ${th('category', 'status', 'Status')}
            <th class="no-sort" style="text-align:right">Actions</th>
          </tr></thead>
          <tbody>
            ${meta.slice.map(c => `<tr>
              <td><span class="thumb-sm" style="font-size:1.2rem">${esc(c.icon || '📦')}</span></td>
              <td><div class="cell-title"><div><strong>${esc(c.name)}</strong><small>${esc(c.slug)}</small></div></div></td>
              <td class="small" style="max-width:320px">${esc(c.description || '—')}</td>
              <td><span class="badge badge-primary">${Store.categoryProjectCount(c.id)} proyek</span></td>
              <td>${badge(c.status)}</td>
              <td><div class="actions-cell">
                <button class="mini-btn" data-act="cat-edit" data-id="${c.id}" title="Edit">${Icons.edit}</button>
                <button class="mini-btn" data-act="cat-view" data-id="${c.id}" title="Lihat di website">${Icons.eye}</button>
                <button class="mini-btn danger" data-act="cat-del" data-id="${c.id}" title="Delete">${Icons.trash}</button>
              </div></td>
            </tr>`).join('') || `<tr><td colspan="6">${emptyBlock('Tidak ada kategori', 'Tambahkan kategori proyek pertama.')}</td></tr>`}
          </tbody>
        </table></div>
        ${pager('categories', meta)}
      </div>`;
  }

  function openCategoryEditor(id) {
    const existing = id ? Store.categoryById(id) : null;
    const c = existing || { name: '', slug: '', description: '', icon: '📦', image: '', status: 'active' };
    openModal({
      title: existing ? 'Edit category' : 'Add category',
      body: `<div class="form-grid">
        <div class="field"><label>Category name *</label><input id="catName" value="${esc(c.name)}" /></div>
        <div class="field"><label>Category slug</label><input id="catSlug" value="${esc(c.slug)}" /></div>
        <div class="field"><label>Icon (emoji)</label><input id="catIcon" value="${esc(c.icon)}" placeholder="🌱" /></div>
        <div class="field"><label>Status</label><select id="catStatus"><option value="active" ${c.status === 'active' ? 'selected' : ''}>Active</option><option value="inactive" ${c.status !== 'active' ? 'selected' : ''}>Inactive</option></select></div>
        <div class="field full"><label>Image URL (opsional)</label><input id="catImage" value="${esc(c.image)}" /></div>
        <div class="field full"><label>Description</label><textarea id="catDesc" rows="3">${esc(c.description)}</textarea></div>
      </div>`,
      footer: `<button class="btn btn-outline" data-modal-close>Batal</button><button class="btn btn-primary" id="catSave">Simpan kategori</button>`,
      onMount(modal) {
        modal.querySelectorAll('[data-modal-close]').forEach(b => b.addEventListener('click', () => modal.querySelector('.modal-x').click()));
        const name = modal.querySelector('#catName');
        name.addEventListener('input', () => {
          const slug = modal.querySelector('#catSlug');
          if (!slug.dataset.touched) slug.value = slugify(name.value);
        });
        modal.querySelector('#catSlug').addEventListener('input', e => { e.target.dataset.touched = '1'; });
        modal.querySelector('#catSave').addEventListener('click', () => {
          const payload = {
            name: name.value.trim(),
            slug: modal.querySelector('#catSlug').value.trim() || slugify(name.value),
            icon: modal.querySelector('#catIcon').value.trim() || '📦',
            status: modal.querySelector('#catStatus').value,
            image: modal.querySelector('#catImage').value,
            description: modal.querySelector('#catDesc').value
          };
          if (payload.name.length < 2) { toast('Nama kategori minimal 2 karakter.', 'error', 'Validasi gagal'); return; }
          if (existing) { Store.updateCategory(existing.id, payload); toast('Kategori diperbarui.', 'success'); }
          else { Store.addCategory(payload); toast('Kategori baru muncul di website.', 'success'); }
          modal.querySelector('.modal-x').click();
          renderRoute();
        });
      }
    });
  }

  function deleteCategoryFlow(id) {
    const c = Store.categoryById(id);
    if (!c) return;
    const count = Store.categoryProjectCount(id);
    const others = Store.get().categories.filter(x => x.id !== id);
    openModal({
      title: 'Hapus kategori',
      body: `<p style="font-size:.9rem;margin:0 0 12px">Kategori <strong>${esc(c.name)}</strong> akan dihapus permanen.</p>
        ${count ? `<div class="callout callout-warn" style="margin-bottom:12px">Kategori ini dipakai oleh <strong>${count} proyek</strong>. Pilih kategori pengganti agar proyek tidak kehilangan kategori.</div>
        <div class="field"><label>Pindahkan proyek ke</label><select id="catReassign">${others.map(o => `<option value="${o.id}">${esc(o.icon + ' ' + o.name)}</option>`).join('')}</select></div>`
        : `<p class="small text-muted">Tidak ada proyek yang memakai kategori ini.</p>`}`,
      footer: `<button class="btn btn-outline" data-modal-close>Batal</button><button class="btn btn-danger" id="catDeleteConfirm">Hapus kategori</button>`,
      onMount(modal) {
        modal.querySelectorAll('[data-modal-close]').forEach(b => b.addEventListener('click', () => modal.querySelector('.modal-x').click()));
        modal.querySelector('#catDeleteConfirm').addEventListener('click', () => {
          const reassign = modal.querySelector('#catReassign')?.value || null;
          Store.deleteCategory(id, reassign);
          modal.querySelector('.modal-x').click();
          toast('Kategori dihapus.' + (reassign && count ? ' Proyek dipindahkan ke kategori pengganti.' : ''), 'success');
          renderRoute();
        });
      }
    });
  }

  /* ============================================================
     AI GENERATED PROJECTS
     ============================================================ */
  function filteredAi() {
    const f = ui.ai;
    let list = Store.aiProjects();
    const q = f.q.toLowerCase();
    if (q) list = list.filter(p => [p.name, p.slug, p.description, p.aiMeta?.prompt || '', Store.categoryById(p.category)?.name || ''].join(' ').toLowerCase().includes(q));
    if (f.status) list = list.filter(p => p.status === f.status);
    return sortList(list, f.sort, f.dir);
  }

  function viewAiProjects() {
    const all = filteredAi();
    const meta = paginate(all, ui.ai.page);
    ui.ai.page = meta.page;
    const generated = Store.aiProjects();
    return `
      ${pageHead('AI Generated Projects', 'Semua proyek dari AI Builder masuk ke sini dan tetap tampil di Explore Projects. Admin hanya memantau dan mengelola statusnya.',
        `<a class="btn btn-outline btn-sm" href="index.html#/ai-builder" target="_blank" rel="noopener">Buka AI Builder</a>`)}
      <div class="stat-grid" style="grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:16px">
        ${['generated', 'reviewed', 'published', 'archived'].map(st => `<div class="stat-card" style="cursor:default">
          <div class="stat-top"><span class="stat-ico">${Icons.spark}</span></div>
          <div class="num">${generated.filter(p => p.status === st).length}</div>
          <div class="lbl">${statusMeta(st).label}</div></div>`).join('')}
      </div>
      <div class="toolbar">
        <label class="search-inline">${Icons.search}<input id="aiSearch" type="search" placeholder="Cari proyek AI atau prompt…" value="${esc(ui.ai.q)}" /></label>
        <select data-filter="ai-status">${[['', 'Semua status'], ['generated', 'Generated'], ['reviewed', 'Reviewed'], ['published', 'Published'], ['draft', 'Draft'], ['archived', 'Archived']].map(([v, l]) => `<option value="${v}" ${ui.ai.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <button class="btn btn-ghost btn-sm" data-act="reset-ai-filter">Reset</button>
      </div>
      <div class="table-card">
        <div class="table-wrap"><table class="admin-table" style="min-width:980px">
          <thead><tr>
            ${th('ai', 'name', 'Project Name')}
            ${th('ai', 'createdAt', 'Generated')}
            ${th('ai', 'category', 'Category')}
            ${th('ai', 'difficulty', 'Difficulty')}
            ${th('ai', 'cost', 'Budget')}
            ${th('ai', 'status', 'Generation Status')}
            <th class="no-sort" style="text-align:right">Actions</th>
          </tr></thead>
          <tbody>
            ${meta.slice.map(p => `<tr>
              <td><div class="cell-title"><span class="thumb-sm">${thumb(p)}</span><div><strong>${esc(p.name)}</strong><small>${esc(p.aiMeta?.prompt?.slice(0, 60) || p.slug)}</small></div></div></td>
              <td class="small">${formatDate(p.aiMeta?.generatedAt || p.createdAt)}</td>
              <td><span class="badge badge-primary">${esc(Store.categoryById(p.category)?.name || '—')}</span></td>
              <td class="small">${esc(p.difficulty)}</td>
              <td class="price-cell">${money(Store.projectCost(p))}</td>
              <td>${badge(p.status)}</td>
              <td><div class="actions-cell">
                <button class="mini-btn" data-act="ai-review" data-id="${p.id}" title="Review">${Icons.eye}</button>
                <a class="mini-btn" href="#/projects/${p.id}/edit" title="Edit">${Icons.edit}</a>
                <button class="mini-btn" data-act="ai-publish" data-id="${p.id}" title="Publish / Unpublish">${p.status === 'published' ? '↺' : '✓'}</button>
                <button class="mini-btn" data-act="ai-archive" data-id="${p.id}" title="Archive">📦</button>
                <button class="mini-btn" data-act="ai-dup" data-id="${p.id}" title="Duplicate">${Icons.copy}</button>
                <button class="mini-btn danger" data-act="ai-del" data-id="${p.id}" title="Delete">${Icons.trash}</button>
              </div></td>
            </tr>`).join('') || `<tr><td colspan="7">${emptyBlock('Belum ada proyek AI', 'Proyek yang dibuat lewat AI Builder di website akan muncul di sini.', '<a class="btn btn-primary btn-sm" href="index.html#/ai-builder" target="_blank" rel="noopener">Buka AI Builder</a>')}</td></tr>`}
          </tbody>
        </table></div>
        ${pager('ai', meta)}
      </div>
      <div class="callout callout-warn" style="margin-top:14px">
        <strong>Catatan verifikasi:</strong> blueprint AI dibuat oleh generator lokal berbasis template. Instruksi teknis, wiring, dan kode belum tentu terverifikasi — gunakan tombol Review untuk memeriksa sebelum dipublikasikan.
      </div>`;
  }

  function openAiReview(id) {
    const p = Store.projectById(id);
    if (!p) return;
    const comps = Store.projectComponentDetails(p);
    const warnings = [];
    if (comps.some(x => /\b5V\b/.test(x.component.voltage)) && comps.some(x => x.component.name.includes('ESP32'))) warnings.push('Ada komponen 5V bersama ESP32 — gunakan pin VIN/adaptor, jangan memberi 5V ke GPIO.');
    if (comps.some(x => ['Actuator'].includes(x.component.category)) && !comps.some(x => x.component.category === 'Power')) warnings.push('Aktuator arus besar sebaiknya diberi suplai daya terpisah.');
    if (!p.aiMeta?.verified) warnings.push('Blueprint ini belum ditandai terverifikasi.');
    openModal({
      title: `Review: ${p.name}`,
      size: 'modal-xl',
      body: `
        <div class="row wrap" style="gap:8px;margin-bottom:12px">
          ${badge(p.status)}
          <span class="badge badge-primary">${esc(Store.categoryById(p.category)?.name || '—')}</span>
          <span class="badge">${esc(p.difficulty)}</span>
          <span class="badge">${money(Store.projectCost(p))}</span>
          <span class="badge">${comps.length} komponen</span>
        </div>
        <div class="callout callout-danger" style="margin-bottom:14px">
          <strong>AI-generated, belum tentu terverifikasi.</strong> Periksa kembali kompatibilitas komponen, wiring, dan keamanan listrik sebelum instruksi dipublikasikan atau dirakit.
        </div>
        <div class="form-section"><h4>Prompt & deskripsi</h4>
          <p class="small text-muted" style="margin:0 0 8px">Prompt: “${esc(p.aiMeta?.prompt || '—')}”</p>
          <p style="font-size:.87rem;margin:0">${esc(p.description)}</p>
        </div>
        <div class="form-section"><h4>Komponen & kompatibilitas</h4>
          <div class="table-wrap"><table class="data" style="min-width:0">
            <thead><tr><th>Komponen</th><th>Qty</th><th>Voltage</th><th>Harga</th></tr></thead>
            <tbody>${comps.map(x => `<tr><td>${esc(x.component.name)}</td><td>×${x.qty}</td><td class="small">${esc(x.component.voltage)}</td><td class="price-cell">${money(x.component.price * x.qty)}</td></tr>`).join('')}</tbody>
          </table></div>
          <ul class="small" style="margin:10px 0 0;padding-left:18px;color:#92400e">${warnings.map(w => `<li>${esc(w)}</li>`).join('') || '<li>Tidak ada peringatan otomatis.</li>'}</ul>
        </div>
        <div class="form-section"><h4>Budget, wiring & build guide</h4>
          <div class="summary-line"><span>Estimasi komponen</span><strong>${money(Store.projectCost(p))}</strong></div>
          <div class="summary-line"><span>Budget target proyek</span><strong>${money(p.budget)}</strong></div>
          <p class="small" style="margin:10px 0 4px"><strong>Wiring:</strong> ${esc(p.wiring || '—')}</p>
          <ol class="small" style="padding-left:18px">${(p.buildGuide || []).map(s => `<li>${esc(s.title)}</li>`).join('') || '<li>Belum ada build guide.</li>'}</ol>
        </div>
        <div class="form-section"><h4>Source code</h4>
          ${p.sourceCode ? `<div class="code-block" style="max-height:240px;overflow:auto"><pre>${esc(p.sourceCode)}</pre></div>` : '<p class="small text-muted">Tidak ada source code.</p>'}
        </div>
        <div class="form-section"><h4>Testing & troubleshooting</h4>
          <p class="small" style="margin:0"><strong>${(p.testing || []).length}</strong> skenario testing · <strong>${(p.troubleshooting || []).length}</strong> catatan troubleshooting.</p>
        </div>`,
      footer: `<button class="btn btn-outline" data-modal-close>Tutup</button>
        <a class="btn btn-outline" href="index.html#/project/${esc(p.slug)}" target="_blank" rel="noopener" data-modal-close>Lihat halaman</a>
        <a class="btn btn-outline" href="#/projects/${p.id}/edit" data-modal-close>Edit proyek</a>
        <button class="btn btn-soft" data-ai-reviewed="${p.id}">Tandai Reviewed</button>
        <button class="btn btn-primary" data-ai-publish-in="${p.id}">${p.status === 'published' ? 'Unpublish' : 'Publish'}</button>`,
      onMount(modal, close) {
        modal.querySelectorAll('[data-modal-close]').forEach(b => b.addEventListener('click', close));
        modal.querySelector('[data-ai-reviewed]')?.addEventListener('click', () => {
          Store.setProjectStatus(p.id, 'reviewed');
          toast('Proyek ditandai Reviewed.', 'success');
          close(); renderRoute();
        });
        modal.querySelector('[data-ai-publish-in]')?.addEventListener('click', () => {
          Store.setProjectStatus(p.id, p.status === 'published' ? 'draft' : 'published');
          toast('Status publikasi diperbarui.', 'success');
          close(); renderRoute();
        });
      }
    });
  }

  /* ============================================================
     WEBSITE CONTENT
     ============================================================ */
  function viewContent() {
    const tabs = [['homepage', 'Homepage'], ['featured', 'Featured Projects'], ['categories', 'Homepage Categories'], ['sections', 'Homepage Sections']];
    return `
      ${pageHead('Website Content Management', 'Ubah konten yang tampil pada website utama. Setiap perubahan langsung dipakai halaman publik.',
        '<a class="btn btn-outline btn-sm" href="index.html" target="_blank" rel="noopener">Preview website</a>')}
      <div class="card">
        <div class="subtabs">${tabs.map(([k, l]) => `<button data-act="content-tab" data-tab="${k}" class="${ui.contentTab === k ? 'active' : ''}">${l}</button>`).join('')}</div>
        <div>${contentTabBody()}</div>
      </div>`;
  }

  function contentTabBody() {
    const s = Store.get();
    if (ui.contentTab === 'homepage') {
      const h = s.hero;
      return `<div class="two-col">
        <form id="heroForm">
          <div class="form-grid">
            <div class="field full"><label>Hero title</label><input data-hero="title" value="${esc(h.title)}" /></div>
            <div class="field"><label>Hero subtitle</label><input data-hero="subtitle" value="${esc(h.subtitle)}" /></div>
            <div class="field"><label>Hero image URL</label><input data-hero="image" value="${esc(h.image)}" placeholder="Kosongkan untuk ilustrasi bawaan" /></div>
            <div class="field full"><label>Hero description</label><textarea data-hero="description" rows="3">${esc(h.description)}</textarea></div>
            <div class="field"><label>CTA button text</label><input data-hero="ctaText" value="${esc(h.ctaText)}" /></div>
            <div class="field"><label>CTA button destination</label><input data-hero="ctaLink" value="${esc(h.ctaLink)}" placeholder="#/ai-builder" /></div>
          </div>
          <button type="submit" class="btn btn-primary btn-sm">Simpan konten homepage</button>
        </form>
        <div class="panel">
          <h3>Live preview</h3>
          <p>Tampilan ringkas hero berdasarkan isian saat ini.</p>
          <div class="card" style="background:linear-gradient(150deg,#f0fdfa,#e0f2fe)">
            <span class="eyebrow">${esc(h.subtitle)}</span>
            <h2 style="font-size:1.2rem;margin:6px 0">${esc(h.title)}</h2>
            <p class="small" style="color:#475569">${esc(h.description)}</p>
            <span class="btn btn-primary btn-sm">${esc(h.ctaText)} →</span>
          </div>
          <div class="kbd-note" style="margin-top:12px">Buka website di tab lain untuk melihat perubahan setelah disimpan.</div>
        </div>
      </div>`;
    }
    if (ui.contentTab === 'featured') {
      const featured = s.featured.map(id => Store.projectById(id)).filter(Boolean);
      const available = s.projects.filter(p => !s.featured.includes(p.id));
      return `<h3 style="font-size:.95rem;margin:0 0 3px">Featured projects</h3>
        <p class="small text-muted">Urutan menentukan tampilan pada section Featured Projects di homepage.</p>
        <div class="order-list">
          ${featured.map((p, i) => `<div class="order-item">
            <span class="thumb-sm">${thumb(p)}</span>
            <span class="grow"><strong>${esc(p.name)}</strong><br /><span class="small text-muted">${esc(Store.categoryById(p.category)?.name || '—')} · ${badge(p.status)}</span></span>
            <div class="order-btns">
              <button data-act="featured-move" data-index="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>▲</button>
              <button data-act="featured-move" data-index="${i}" data-dir="1" ${i === featured.length - 1 ? 'disabled' : ''}>▼</button>
            </div>
            <button class="mini-btn danger" data-act="featured-remove" data-id="${p.id}" title="Remove">${Icons.trash}</button>
          </div>`).join('') || '<p class="small text-muted">Belum ada featured project.</p>'}
        </div>
        <div class="row wrap" style="margin-top:14px">
          <select id="featuredAdd" style="max-width:340px"><option value="">Pilih proyek untuk ditambahkan…</option>${available.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
          <button class="btn btn-primary btn-sm" data-act="featured-add">${Icons.plus} Add Featured Project</button>
        </div>`;
    }
    if (ui.contentTab === 'categories') {
      return `<h3 style="font-size:.95rem;margin:0 0 3px">Homepage categories</h3>
        <p class="small text-muted">Pilih kategori yang ditampilkan pada section kategori di homepage. Semua kategori tetap muncul di filter Explore.</p>
        <div class="order-list">
          ${s.categories.map(c => `<label class="order-item" style="cursor:pointer">
            <input type="checkbox" data-act="home-cat" data-id="${c.id}" ${s.homeCategories.includes(c.id) ? 'checked' : ''} />
            <span style="font-size:1.1rem">${esc(c.icon)}</span>
            <span class="grow"><strong>${esc(c.name)}</strong><br /><span class="small text-muted">${Store.categoryProjectCount(c.id)} proyek · ${esc(c.status)}</span></span>
            ${s.homeCategories.includes(c.id) ? '<span class="badge badge-primary">Tampil</span>' : '<span class="badge">Disembunyikan</span>'}
          </label>`).join('')}
        </div>`;
    }
    return `<h3 style="font-size:.95rem;margin:0 0 3px">Homepage sections</h3>
      <p class="small text-muted">Atur urutan, judul, dan visibilitas section. Perubahan langsung dipakai homepage.</p>
      <div class="order-list">
        ${s.sections.map((sec, i) => `<div class="order-item" style="align-items:flex-start;flex-wrap:wrap">
          <div class="order-btns">
            <button data-act="section-move" data-index="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>▲</button>
            <button data-act="section-move" data-index="${i}" data-dir="1" ${i === s.sections.length - 1 ? 'disabled' : ''}>▼</button>
          </div>
          <div class="grow" style="min-width:200px">
            <strong>${esc(sec.id)}</strong>
            <div class="form-grid" style="margin-top:6px">
              <div class="field" style="margin-bottom:4px"><label>Section title</label><input data-sec-title="${sec.id}" value="${esc(sec.title)}" /></div>
              <div class="field" style="margin-bottom:4px"><label>Subtitle</label><input data-sec-sub="${sec.id}" value="${esc(sec.subtitle || '')}" /></div>
            </div>
          </div>
          <label class="switch" title="Tampilkan section">
            <input type="checkbox" data-act="section-toggle" data-id="${sec.id}" ${sec.enabled !== false ? 'checked' : ''} />
            <span class="track"></span>
          </label>
        </div>`).join('')}
      </div>
      <button class="btn btn-primary btn-sm" style="margin-top:12px" data-act="sections-save-titles">Simpan judul section</button>`;
  }

  /* ============================================================
     ANALYTICS
     ============================================================ */
  function viewAnalytics() {
    const s = Store.get();
    const events = s.events;
    const count = type => events.filter(e => e.type === type).length;
    const byDay = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      byDay.push({
        label: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        value: events.filter(e => e.type === 'page_view' && new Date(e.at) >= d && new Date(e.at) < next).length
      });
    }
    const projectViews = {};
    events.filter(e => e.type === 'project_view').forEach(e => {
      const id = e.meta?.projectId;
      if (id) projectViews[id] = (projectViews[id] || 0) + 1;
    });
    const popularProjects = Object.entries(projectViews).map(([id, n]) => ({ project: Store.projectById(id), n })).filter(x => x.project).sort((a, b) => b.n - a.n).slice(0, 6);
    const catViews = {};
    popularProjects.forEach(({ project, n }) => { const name = Store.categoryById(project.category)?.name || 'Tanpa kategori'; catViews[name] = (catViews[name] || 0) + n; });
    const catBar = Object.entries(catViews).map(([label, value]) => ({ label, value }));
    const genTypes = {};
    events.filter(e => e.type === 'project_generate').forEach(e => {
      const k = e.meta?.category || 'Tidak diketahui';
      genTypes[k] = (genTypes[k] || 0) + 1;
    });
    const genBar = Object.entries(genTypes).map(([label, value]) => ({ label, value }));
    const recentEvents = events.slice(0, 12);
    const totalPageViews = count('page_view');

    return `
      ${pageHead('Visitor Analytics', 'Event tracking lokal untuk prototype. Semua angka berasal dari event di browser ini — bukan traffic real-world atau data server.',
        '<button class="btn btn-outline btn-sm" data-act="analytics-export">Export analytics JSON</button>')}
      <div class="stat-grid">
        ${statCard({ icon: Icons.analytics, num: totalPageViews, label: 'Page views', trend: 'Sejak data dibuat', link: '#/analytics', foot: 'Event lokal' })}
        ${statCard({ icon: Icons.eye, num: count('project_view'), label: 'Project views', trend: `${Object.keys(projectViews).length} proyek dilihat`, link: '#/analytics', foot: 'Event lokal' })}
        ${statCard({ icon: Icons.spark, num: count('ai_builder_open'), label: 'AI Builder openings', trend: `${count('project_generate')} generasi`, link: '#/ai-projects', foot: 'Event lokal' })}
        ${statCard({ icon: Icons.components, num: count('component_view'), label: 'Component views', trend: `${count('project_save')} proyek disimpan`, link: '#/components', foot: 'Event lokal' })}
      </div>
      <div class="chart-grid" style="margin-top:16px">
        <div class="chart-card">
          <header><div><h3>Page views — 14 hari terakhir</h3><p>Dihitung dari event page_view lokal</p></div></header>
          ${Charts.line(byDay, { height: 210 })}
        </div>
        <div class="chart-card">
          <header><div><h3>Popular categories</h3><p>Berdasarkan project views</p></div></header>
          ${catBar.length ? Charts.bar(catBar, { height: 210 }) : '<div class="chart-empty">Belum ada data project view.</div>'}
        </div>
      </div>
      <div class="two-col" style="margin-top:16px">
        <div class="panel">
          <h3>Popular projects</h3>
          <p>Paling sering dibuka pada perangkat ini.</p>
          <div class="table-wrap"><table class="data" style="min-width:0">
            <thead><tr><th>Proyek</th><th>Kategori</th><th>Views</th></tr></thead>
            <tbody>${popularProjects.map(({ project, n }) => `<tr>
              <td><a href="index.html#/project/${esc(project.slug)}" target="_blank" rel="noopener">${esc(project.name)}</a></td>
              <td class="small">${esc(Store.categoryById(project.category)?.name || '—')}</td>
              <td class="price-cell">${n}</td></tr>`).join('') || '<tr><td colspan="3" class="text-muted">Data belum tersedia.</td></tr>'}</tbody>
          </table></div>
        </div>
        <div class="panel">
          <h3>Most frequently generated types</h3>
          <p>Kategori yang paling sering dipakai di AI Builder.</p>
          ${genBar.length ? Charts.bar(genBar, { height: 180 }) : '<div class="chart-empty">Belum ada data generasi proyek.</div>'}
          <div class="summary-mini" style="margin-top:10px;justify-content:space-between">
            <span>Generations <b>${count('project_generate')}</b></span>
            <span>Add to My Build <b>${count('project_save')}</b></span>
            <span>AI opens <b>${count('ai_builder_open')}</b></span>
          </div>
        </div>
      </div>
      <div class="panel" style="margin-top:16px">
        <div class="row between" style="margin-bottom:10px"><div><h3>Event log terbaru</h3><p>Event mentah yang tercatat di perangkat ini.</p></div>
          <button class="btn btn-ghost btn-sm" data-act="analytics-clear">Bersihkan event</button></div>
        <div class="table-wrap"><table class="data">
          <thead><tr><th>Waktu</th><th>Event</th><th>Metadata</th></tr></thead>
          <tbody>${recentEvents.map(e => `<tr><td class="small">${formatDate(e.at, true)}</td><td><span class="badge">${esc(e.type)}</span></td>
            <td class="small" style="max-width:420px">${esc(JSON.stringify(e.meta || {}))}</td></tr>`).join('') || '<tr><td colspan="3" class="text-muted">Belum ada event tercatat.</td></tr>'}</tbody>
        </table></div>
      </div>
      <div class="callout callout-info" style="margin-top:14px">
        Keterbatasan prototype: tidak ada backend, cookie pihak ketiga, atau IP tracking. Event disimpan di LocalStorage dan hanya mencerminkan aktivitas browser ini.
      </div>`;
  }

  /* ============================================================
     SETTINGS
     ============================================================ */
  function viewSettings() {
    const s = Store.get();
    const user = Auth.session();
    const bytes = Store.storageUsage();
    const pct = Math.min(100, Math.round((bytes / (5 * 1024 * 1024)) * 100));
    return `
      ${pageHead('Settings', 'Pengaturan website, akun admin prototype, dan manajemen data LocalStorage.')}
      <div class="two-col">
        <div class="panel">
          <h3>Website settings</h3>
          <p>Nama, warna, dan footer yang dipakai website serta dashboard.</p>
          <form id="siteSettingsForm">
            <div class="form-grid">
              <div class="field"><label>Website name</label><input data-set="siteName" value="${esc(s.settings.siteName)}" /></div>
              <div class="field"><label>Website tagline</label><input data-set="tagline" value="${esc(s.settings.tagline)}" /></div>
              <div class="field full"><label>Logo URL (opsional)</label><input data-set="logo" value="${esc(s.settings.logo)}" placeholder="Kosongkan untuk logo bawaan" /></div>
              <div class="field"><label>Primary color</label><div class="color-row"><input type="color" data-set="primaryColor" value="${esc(s.settings.primaryColor)}" /><input data-set="primaryHex" value="${esc(s.settings.primaryColor)}" /></div></div>
              <div class="field"><label>Accent color</label><div class="color-row"><input type="color" data-set="accentColor" value="${esc(s.settings.accentColor)}" /><input data-set="accentHex" value="${esc(s.settings.accentColor)}" /></div></div>
              <div class="field full"><label>Footer content</label><textarea data-set="footer" rows="3">${esc(s.settings.footer)}</textarea></div>
            </div>
            <button type="submit" class="btn btn-primary btn-sm">Simpan pengaturan website</button>
          </form>
        </div>
        <div class="stack">
          <div class="panel">
            <h3>Admin account</h3>
            <p>Prototype frontend — kredensial disimpan di LocalStorage, bukan di server.</p>
            <div class="spec-list">
              <div><span>Username aktif</span><strong>${esc(user?.username || 'admin')}</strong></div>
              <div><span>Session</span><strong>Login ${timeAgo(user?.loginAt || new Date().toISOString())}</strong></div>
              <div><span>Berakhir</span><strong>${user?.expiresAt ? formatDate(new Date(user.expiresAt).toISOString(), true) : '—'}</strong></div>
            </div>
            <form id="accountForm" style="margin-top:14px">
              <div class="field"><label>Username baru</label><input id="accUsername" value="${esc(user?.username || 'admin')}" /></div>
              <div class="field"><label>Password saat ini *</label><input id="accCurrent" type="password" autocomplete="current-password" /></div>
              <div class="field"><label>Password baru (opsional)</label><input id="accNew" type="password" autocomplete="new-password" placeholder="Minimal 4 karakter" /></div>
              <div class="field"><label>Konfirmasi password baru</label><input id="accConfirm" type="password" autocomplete="new-password" /></div>
              <div class="err" id="accError"></div>
              <div class="row wrap">
                <button type="submit" class="btn btn-primary btn-sm">Simpan akun</button>
                <button type="button" class="btn btn-outline btn-sm" data-act="logout">Logout</button>
              </div>
            </form>
            <div class="callout callout-warn" style="margin-top:12px">Password disimpan tanpa enkripsi kuat di LocalStorage. Jangan gunakan kredensial asli; ini hanya untuk demo/prototype.</div>
          </div>
          <div class="panel">
            <h3>Storage settings</h3>
            <p>Tipe penyimpanan: <strong>LocalStorage</strong> (frontend-only).</p>
            <div class="storage-bar"><div style="width:${pct}%"></div></div>
            <div class="row between small" style="margin-bottom:12px"><span>${(bytes / 1024).toFixed(1)} KB terpakai</span><span>≈ ${pct}% dari ~5 MB</span></div>
            <div class="stack">
              <button class="btn btn-outline btn-sm" data-act="export-data">Export semua data (JSON)</button>
              <label class="btn btn-outline btn-sm" style="cursor:pointer">Import data JSON
                <input type="file" id="importFile" accept="application/json,.json" style="display:none" />
              </label>
              <button class="btn btn-danger btn-sm" data-act="reset-data">Reset demo data</button>
            </div>
          </div>
        </div>
      </div>
      <div class="panel" style="margin-top:16px">
        <h3>Prototype limitations</h3>
        <p>Batasan yang perlu diketahui sebelum memakai dashboard ini di luar demo.</p>
        <div class="table-wrap"><table class="data capability-table">
          <thead><tr><th>Area</th><th>Status implementasi</th><th>Catatan</th></tr></thead>
          <tbody>
            <tr><td>Authentication</td><td><span class="badge badge-warn">Client-side</span></td><td>Login lokal tanpa server; bukan keamanan produksi.</td></tr>
            <tr><td>Database</td><td><span class="badge badge-primary">LocalStorage</span></td><td>Satu store dipakai website & admin; data hanya di browser ini.</td></tr>
            <tr><td>AI generator</td><td><span class="badge badge-primary">Lokal (template)</span></td><td>Tidak memanggil API AI; blueprint disusun dari aturan & component database.</td></tr>
            <tr><td>Analytics</td><td><span class="badge badge-primary">Event lokal</span></td><td>Tidak ada traffic real-world, IP, atau identitas pengunjung.</td></tr>
            <tr><td>Import / Export</td><td><span class="badge badge-primary">JSON</span></td><td>Import divalidasi dan butuh konfirmasi sebelum menimpa data.</td></tr>
          </tbody>
        </table></div>
      </div>`;
  }

  /* ============================================================
     ACTION HANDLERS
     ============================================================ */
  function bindRoute(route) {
    const content = document.getElementById('adminContent');
    if (!content) return;
    if (route === 'projects') {
      const search = document.getElementById('projSearch');
      if (search) search.addEventListener('input', debounce(() => { ui.project.q = search.value; ui.project.page = 1; renderRoute(); setTimeout(() => { const s = document.getElementById('projSearch'); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } }, 0); }, 320));
    }
    if (route === 'components') {
      const search = document.getElementById('compAdminSearch');
      if (search) search.addEventListener('input', debounce(() => { ui.component.q = search.value; ui.component.page = 1; renderRoute(); setTimeout(() => { const s = document.getElementById('compAdminSearch'); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } }, 0); }, 320));
    }
    if (route === 'categories') {
      const search = document.getElementById('catSearch');
      if (search) search.addEventListener('input', debounce(() => { ui.category.q = search.value; ui.category.page = 1; renderRoute(); setTimeout(() => { const s = document.getElementById('catSearch'); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } }, 0); }, 320));
    }
    if (route === 'ai-projects') {
      const search = document.getElementById('aiSearch');
      if (search) search.addEventListener('input', debounce(() => { ui.ai.q = search.value; ui.ai.page = 1; renderRoute(); setTimeout(() => { const s = document.getElementById('aiSearch'); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } }, 0); }, 320));
    }
    if (route === 'content') {
      const form = document.getElementById('heroForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const hero = {};
          form.querySelectorAll('[data-hero]').forEach(el => { hero[el.dataset.hero] = el.value; });
          if (!hero.title.trim()) { toast('Hero title tidak boleh kosong.', 'error', 'Validasi gagal'); return; }
          Store.updateHero(hero);
          toast('Konten homepage diperbarui dan langsung tampil di website.', 'success');
          renderRoute();
        });
      }
    }
    if (route === 'settings') {
      const siteForm = document.getElementById('siteSettingsForm');
      if (siteForm) {
        siteForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const payload = {};
          siteForm.querySelectorAll('[data-set]').forEach(el => { payload[el.dataset.set] = el.value; });
          const settings = Store.get().settings;
          Store.updateSettings({
            siteName: payload.siteName || settings.siteName,
            tagline: payload.tagline || settings.tagline,
            logo: payload.logo || '',
            primaryColor: payload.primaryHex || payload.primaryColor || settings.primaryColor,
            accentColor: payload.accentHex || payload.accentColor || settings.accentColor,
            footer: payload.footer
          });
          applyAdminTheme();
          toast('Pengaturan website disimpan.', 'success');
          renderShell();
          renderRoute();
        });
        const primaryColor = siteForm.querySelector('[data-set="primaryColor"]');
        const primaryHex = siteForm.querySelector('[data-set="primaryHex"]');
        if (primaryColor && primaryHex) {
          primaryColor.addEventListener('input', () => { primaryHex.value = primaryColor.value; });
          primaryHex.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(primaryHex.value)) primaryColor.value = primaryHex.value; });
        }
        const accentColor = siteForm.querySelector('[data-set="accentColor"]');
        const accentHex = siteForm.querySelector('[data-set="accentHex"]');
        if (accentColor && accentHex) {
          accentColor.addEventListener('input', () => { accentHex.value = accentColor.value; });
          accentHex.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(accentHex.value)) accentColor.value = accentHex.value; });
        }
      }
      const accountForm = document.getElementById('accountForm');
      if (accountForm) {
        accountForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const err = document.getElementById('accError');
          err.textContent = '';
          const username = document.getElementById('accUsername').value.trim();
          const current = document.getElementById('accCurrent').value;
          const next = document.getElementById('accNew').value;
          const confirm = document.getElementById('accConfirm').value;
          if (!current) { err.textContent = 'Masukkan password saat ini untuk menyimpan perubahan.'; return; }
          if (next && next !== confirm) { err.textContent = 'Konfirmasi password baru tidak cocok.'; return; }
          const result = Auth.updateCredentials({ username, password: next || null, currentPassword: current });
          if (!result.ok) { err.textContent = result.error; return; }
          toast('Kredensial admin diperbarui (lokal).', 'success');
          renderShell();
          renderRoute();
        });
      }
      const importFile = document.getElementById('importFile');
      if (importFile) {
        importFile.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          try {
            const payload = await readJSONFile(file);
            const check = Store.validateImport(payload);
            const data = check.data || {};
            openModal({
              title: check.valid ? 'Preview import data' : 'Import gagal divalidasi',
              size: 'modal-lg',
              body: `<div class="callout ${check.valid ? 'callout-warn' : 'callout-danger'}">
                  ${check.valid ? 'Data akan <strong>menimpa</strong> data yang ada saat ini setelah dikonfirmasi.' : 'File tidak dapat diimpor sampai error diperbaiki.'}
                </div>
                <div class="summary-mini" style="margin:12px 0">
                  <span>Projects <b>${(data.projects || []).length}</b></span>
                  <span>Components <b>${(data.components || []).length}</b></span>
                  <span>Categories <b>${(data.categories || []).length}</b></span>
                  <span>Activity <b>${(data.activity || []).length}</b></span>
                </div>
                ${check.errors.length ? `<ul class="small" style="color:#b91c1c;padding-left:18px">${check.errors.map(err => `<li>${esc(err)}</li>`).join('')}</ul>` : ''}
                <div class="import-preview">${esc(JSON.stringify(payload, null, 2).slice(0, 3000))}</div>`,
              footer: `<button class="btn btn-outline" data-modal-close>Batal</button>
                <button class="btn btn-primary" id="confirmImport" ${check.valid ? '' : 'disabled'}>Konfirmasi import</button>`,
              onMount(modal) {
                modal.querySelectorAll('[data-modal-close]').forEach(b => b.addEventListener('click', () => modal.querySelector('.modal-x').click()));
                const btn = modal.querySelector('#confirmImport');
                btn?.addEventListener('click', () => {
                  const result = Store.importData(payload);
                  if (!result.valid) { toast('Import gagal: data tidak valid.', 'error'); return; }
                  modal.querySelector('.modal-x').click();
                  toast('Data berhasil diimpor dari JSON.', 'success');
                  renderShell();
                  renderRoute();
                });
              }
            });
          } catch (err) {
            toast(err.message || 'File JSON tidak valid.', 'error', 'Import gagal');
          } finally {
            e.target.value = '';
          }
        });
      }
    }
  }

  function handleLogout() {
    confirmDialog({ title: 'Logout dari admin?', message: 'Kamu akan kembali ke halaman login. Data website tidak dihapus.', confirmText: 'Ya, logout', danger: false })
      .then(ok => {
        if (!ok) return;
        Auth.logout();
        toast('Berhasil logout.', 'info');
        location.hash = '#/login';
        renderLogin();
      });
  }

  function handleAction(act, el) {
    const id = el.getAttribute('data-id');
    switch (act) {
      case 'toggle-sidebar':
        ui.collapsed = !ui.collapsed;
        localStorage.setItem(SIDEBAR_KEY, ui.collapsed ? '1' : '0');
        renderShell();
        renderRoute();
        break;
      case 'open-mobile':
        ui.mobileOpen = true;
        document.getElementById('adminSidebar')?.classList.add('open');
        document.getElementById('scrim')?.classList.remove('hidden');
        break;
      case 'close-mobile':
        ui.mobileOpen = false;
        document.getElementById('adminSidebar')?.classList.remove('open');
        document.getElementById('scrim')?.classList.add('hidden');
        break;
      case 'logout': handleLogout(); break;
      case 'notif': document.getElementById('notifMenu')?.classList.toggle('hidden'); break;
      case 'profile':
        openModal({
          title: 'Admin profile',
          body: `<div class="row" style="gap:12px;margin-bottom:14px">
            <span class="avatar" style="width:46px;height:46px;border-radius:50%;background:var(--primary);color:#fff;display:grid;place-items:center;font-weight:700">${esc((Auth.session()?.username || 'A').slice(0, 1).toUpperCase())}</span>
            <div><strong>${esc(Auth.session()?.username || 'admin')}</strong><br /><span class="small text-muted">Administrator · prototype session</span></div>
          </div>
          <div class="kbd-note">Session berlaku 8 jam dan diperpanjang saat dashboard digunakan. Autentikasi berjalan di browser, bukan server.</div>`,
          footer: '<button class="btn btn-outline" data-modal-close>Tutup</button><a class="btn btn-primary" href="#/settings">Buka Settings</a>',
          onMount(modal) { modal.querySelectorAll('[data-modal-close]').forEach(b => b.addEventListener('click', () => modal.querySelector('.modal-x').click())); }
        });
        break;
      case 'page': {
        const ctx = el.getAttribute('data-ctx');
        const page = Number(el.getAttribute('data-page'));
        if (ctx === 'projects') ui.project.page = page;
        if (ctx === 'components') ui.component.page = page;
        if (ctx === 'categories') ui.category.page = page;
        if (ctx === 'ai') ui.ai.page = page;
        renderRoute();
        break;
      }
      case 'sort': {
        const ctx = el.getAttribute('data-ctx');
        const key = el.getAttribute('data-key');
        const st = ui[ctx];
        if (!st) break;
        if (st.sort === key) st.dir = st.dir === 'asc' ? 'desc' : 'asc'; else { st.sort = key; st.dir = 'asc'; }
        st.page = 1;
        renderRoute();
        break;
      }
      case 'reset-project-filter':
        ui.project = { q: '', category: '', difficulty: '', type: '', status: '', sort: 'createdAt', dir: 'desc', page: 1 };
        renderRoute(); break;
      case 'reset-comp-filter':
        ui.component = { q: '', category: '', sort: 'name', dir: 'asc', page: 1 };
        renderRoute(); break;
      case 'reset-cat-filter':
        ui.category = { q: '', sort: 'name', dir: 'asc', page: 1 };
        renderRoute(); break;
      case 'reset-ai-filter':
        ui.ai = { q: '', status: '', sort: 'createdAt', dir: 'desc', page: 1 };
        renderRoute(); break;

      /* projects */
      case 'proj-view': {
        const p = Store.projectById(id);
        if (p) window.open(`index.html#/project/${p.slug}`, '_blank', 'noopener');
        break;
      }
      case 'proj-dup': {
        const copy = Store.duplicateProject(id);
        if (copy) { toast(`Proyek diduplikasi sebagai "${copy.name}" (draft).`, 'success'); renderShell(); renderRoute(); }
        break;
      }
      case 'proj-status': {
        const p = Store.projectById(id);
        if (!p) break;
        const next = p.status === 'published' ? 'draft' : 'published';
        Store.setProjectStatus(id, next);
        toast(next === 'published' ? 'Proyek dipublikasikan.' : 'Proyek di-unpublish (draft).', 'success');
        renderRoute();
        break;
      }
      case 'proj-del': {
        const p = Store.projectById(id);
        if (!p) break;
        confirmDialog({
          title: 'Hapus proyek?', confirmText: 'Ya, hapus proyek',
          message: `Proyek <strong>${esc(p.name)}</strong> akan dihapus permanen. Proyek ini juga dilepas dari featured, My Build, dan Shopping List bila terkait. Komponen pada database tidak dihapus.`
        }).then(ok => {
          if (!ok) return;
          Store.deleteProject(id);
          toast('Proyek dihapus.', 'success');
          renderRoute(); renderShell();
        });
        break;
      }

      /* editor */
      case 'editor-tab':
        collectProjectForm();
        ui.projectTab = el.getAttribute('data-tab');
        document.getElementById('adminContent').innerHTML = projectEditorView();
        bindEditor();
        break;
      case 'editor-save': saveProject(); break;
      case 'editor-delete': {
        const d = ui.projectDraft;
        confirmDialog({ title: 'Hapus proyek ini?', message: `Proyek <strong>${esc(d?.name || '')}</strong> akan dihapus permanen beserta relasinya di website.`, confirmText: 'Ya, hapus' })
          .then(ok => {
            if (!ok) return;
            Store.deleteProject(ui.editingId);
            ui.projectDraft = null; ui.editingId = null;
            toast('Proyek dihapus.', 'success');
            location.hash = '#/projects';
          });
        break;
      }
      case 'list-add': {
        const key = el.getAttribute('data-key');
        const d = collectProjectForm();
        d[key] = Array.isArray(d[key]) ? d[key] : [];
        d[key].push('');
        document.getElementById('adminContent').innerHTML = projectEditorView();
        bindEditor();
        break;
      }
      case 'list-remove': {
        const key = el.getAttribute('data-key');
        const index = Number(el.getAttribute('data-index'));
        const d = collectProjectForm();
        d[key].splice(index, 1);
        document.getElementById('adminContent').innerHTML = projectEditorView();
        bindEditor();
        break;
      }
      case 'row-add': {
        const key = el.getAttribute('data-list');
        const d = collectProjectForm();
        d[key] = Array.isArray(d[key]) ? d[key] : [];
        d[key].push(key === 'testing'
          ? { name: '', description: '', expected: '', instructions: '' }
          : { problem: '', cause: '', solution: '' });
        document.getElementById('adminContent').innerHTML = projectEditorView();
        bindEditor();
        break;
      }
      case 'row-remove': {
        const key = el.getAttribute('data-list');
        const index = Number(el.getAttribute('data-index'));
        const d = collectProjectForm();
        d[key].splice(index, 1);
        document.getElementById('adminContent').innerHTML = projectEditorView();
        bindEditor();
        break;
      }
      case 'guide-add': {
        const d = collectProjectForm();
        d.buildGuide.push({ title: '', description: '', image: '', instructions: [], notes: '', warning: '' });
        document.getElementById('adminContent').innerHTML = projectEditorView();
        bindEditor();
        break;
      }
      case 'guide-remove': {
        const d = collectProjectForm();
        d.buildGuide.splice(Number(el.getAttribute('data-index')), 1);
        document.getElementById('adminContent').innerHTML = projectEditorView();
        bindEditor();
        break;
      }
      case 'guide-move': {
        const d = collectProjectForm();
        const i = Number(el.getAttribute('data-index'));
        const dir = Number(el.getAttribute('data-dir'));
        const target = i + dir;
        if (target < 0 || target >= d.buildGuide.length) break;
        [d.buildGuide[i], d.buildGuide[target]] = [d.buildGuide[target], d.buildGuide[i]];
        document.getElementById('adminContent').innerHTML = projectEditorView();
        bindEditor();
        break;
      }

      /* components */
      case 'comp-add': openComponentEditor(null); break;
      case 'comp-edit': openComponentEditor(id); break;
      case 'comp-dup': {
        const c = Store.componentById(id);
        if (!c) break;
        const copy = JSON.parse(JSON.stringify(c));
        delete copy.id;
        copy.name = `${c.name} (Copy)`;
        copy.slug = `${c.slug}-copy`;
        Store.addComponent(copy);
        toast('Komponen diduplikasi.', 'success');
        renderShell(); renderRoute();
        break;
      }
      case 'comp-del': {
        const c = Store.componentById(id);
        if (!c) break;
        const usage = Store.componentUsageCount(id);
        confirmDialog({
          title: 'Hapus komponen?', confirmText: 'Ya, hapus komponen',
          message: `Komponen <strong>${esc(c.name)}</strong> akan dihapus dari database.${usage ? ` Komponen ini dipakai pada <strong>${usage} proyek</strong> — referensinya akan dilepas dari proyek tersebut.` : ''}`
        }).then(ok => {
          if (!ok) return;
          Store.deleteComponent(id);
          toast('Komponen dihapus dari database.', 'success');
          renderShell(); renderRoute();
        });
        break;
      }

      /* categories */
      case 'cat-add': openCategoryEditor(null); break;
      case 'cat-edit': openCategoryEditor(id); break;
      case 'cat-view': window.open('index.html#/explore', '_blank', 'noopener'); break;
      case 'cat-del': deleteCategoryFlow(id); break;

      /* ai */
      case 'ai-review': openAiReview(id); break;
      case 'ai-publish': {
        const p = Store.projectById(id);
        if (!p) break;
        Store.setProjectStatus(id, p.status === 'published' ? 'draft' : 'published');
        toast('Status publikasi diperbarui.', 'success');
        renderRoute();
        break;
      }
      case 'ai-archive': {
        confirmDialog({ title: 'Archive proyek AI?', message: 'Proyek akan disembunyikan dari website tetapi datanya tetap tersimpan.', confirmText: 'Ya, archive', danger: false })
          .then(ok => { if (ok) { Store.setProjectStatus(id, 'archived'); toast('Proyek diarsipkan.', 'success'); renderRoute(); } });
        break;
      }
      case 'ai-dup': {
        const copy = Store.duplicateProject(id);
        if (copy) { toast('Proyek AI diduplikasi.', 'success'); renderShell(); renderRoute(); }
        break;
      }
      case 'ai-del': {
        const p = Store.projectById(id);
        if (!p) break;
        confirmDialog({ title: 'Hapus proyek AI?', message: `<strong>${esc(p.name)}</strong> akan dihapus permanen dari website dan dashboard.`, confirmText: 'Ya, hapus' })
          .then(ok => { if (ok) { Store.deleteProject(id); toast('Proyek dihapus.', 'success'); renderShell(); renderRoute(); } });
        break;
      }

      /* dashboard quick actions */
      case 'quick-component': location.hash = '#/components'; setTimeout(() => openComponentEditor(null), 80); break;
      case 'quick-category': location.hash = '#/categories'; setTimeout(() => openCategoryEditor(null), 80); break;

      /* content */
      case 'content-tab':
        ui.contentTab = el.getAttribute('data-tab');
        renderRoute();
        break;
      case 'featured-add': {
        const select = document.getElementById('featuredAdd');
        if (!select || !select.value) { toast('Pilih proyek terlebih dahulu.', 'warn'); break; }
        Store.setFeatured([...Store.get().featured, select.value]);
        toast('Featured project ditambahkan.', 'success');
        renderRoute();
        break;
      }
      case 'featured-remove':
        Store.setFeatured(Store.get().featured.filter(f => f !== id));
        toast('Featured project dihapus.', 'success');
        renderRoute();
        break;
      case 'featured-move': {
        const list = [...Store.get().featured];
        const i = Number(el.getAttribute('data-index'));
        const dir = Number(el.getAttribute('data-dir'));
        const t = i + dir;
        if (t < 0 || t >= list.length) break;
        [list[i], list[t]] = [list[t], list[i]];
        Store.setFeatured(list);
        renderRoute();
        break;
      }
      case 'section-move': {
        const list = [...Store.get().sections];
        const i = Number(el.getAttribute('data-index'));
        const dir = Number(el.getAttribute('data-dir'));
        const t = i + dir;
        if (t < 0 || t >= list.length) break;
        [list[i], list[t]] = [list[t], list[i]];
        Store.setSections(list);
        renderRoute();
        break;
      }
      case 'sections-save-titles': {
        const list = Store.get().sections.map(sec => {
          const title = document.querySelector(`[data-sec-title="${sec.id}"]`)?.value || sec.title;
          const subtitle = document.querySelector(`[data-sec-sub="${sec.id}"]`)?.value || '';
          return { ...sec, title, subtitle };
        });
        Store.setSections(list);
        toast('Judul section disimpan.', 'success');
        renderRoute();
        break;
      }

      /* analytics */
      case 'analytics-export':
        downloadJSON('iot-at-home-analytics.json', {
          exportedAt: new Date().toISOString(),
          note: 'Event tracking lokal (LocalStorage), bukan data traffic real-world.',
          events: Store.get().events
        });
        toast('Analytics diekspor sebagai JSON.', 'success');
        break;
      case 'analytics-clear':
        confirmDialog({ title: 'Bersihkan event analytics?', message: 'Semua event lokal akan dihapus. Data proyek, komponen, dan aktivitas tidak terpengaruh.', confirmText: 'Ya, bersihkan' })
          .then(ok => {
            if (!ok) return;
            Store.get().events = [];
            Store.save();
            toast('Event analytics dibersihkan.', 'success');
            renderRoute();
          });
        break;

      /* settings */
      case 'export-data': {
        const payload = Store.exportData();
        const stamp = new Date().toISOString().slice(0, 10);
        downloadJSON(`iot-at-home-backup-${stamp}.json`, payload);
        toast('Data lengkap diekspor sebagai JSON.', 'success');
        break;
      }
      case 'reset-data':
        confirmDialog({
          title: 'Reset demo data?', confirmText: 'Ya, reset data',
          message: 'Seluruh proyek, komponen, kategori, konten homepage, aktivitas, dan analytics akan dikembalikan ke dataset demo awal. Kredensial admin tidak berubah. Tindakan ini tidak dapat dibatalkan.'
        }).then(ok => {
          if (!ok) return;
          Store.resetData();
          toast('Data demo berhasil dikembalikan.', 'success');
          renderShell();
          renderRoute();
        });
        break;
      default: break;
    }
  }

  /* ============================================================
     DELEGATED EVENTS
     ============================================================ */
  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (el) {
      if (el.tagName === 'INPUT' && el.type === 'checkbox') return;
      e.preventDefault();
      handleAction(el.getAttribute('data-act'), el);
      return;
    }
    const closeMenu = e.target.closest('.notif-wrap');
    if (!closeMenu) document.getElementById('notifMenu')?.classList.add('hidden');
  });

  root.addEventListener('change', (e) => {
    const el = e.target;
    const act = el.getAttribute('data-act');
    if (act === 'home-cat') {
      const id = el.getAttribute('data-id');
      const list = Store.get().homeCategories.slice();
      if (el.checked && !list.includes(id)) list.push(id);
      if (!el.checked) list.splice(list.indexOf(id), 1);
      Store.setHomeCategories(list);
      toast('Kategori homepage diperbarui.', 'success');
      renderRoute();
      return;
    }
    if (act === 'section-toggle') {
      const id = el.getAttribute('data-id');
      const list = Store.get().sections.map(sec => sec.id === id ? { ...sec, enabled: el.checked } : sec);
      Store.setSections(list);
      renderRoute();
      return;
    }
    if (el.matches('[data-filter]')) {
      const kind = el.getAttribute('data-filter');
      if (kind === 'project-category') ui.project.category = el.value;
      if (kind === 'project-difficulty') ui.project.difficulty = el.value;
      if (kind === 'project-type') ui.project.type = el.value;
      if (kind === 'project-status') ui.project.status = el.value;
      if (kind === 'comp-category') ui.component.category = el.value;
      if (kind === 'ai-status') ui.ai.status = el.value;
      ui.project.page = 1; ui.component.page = 1; ui.ai.page = 1;
      renderRoute();
    }
  });

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    Store.init();
    applyAdminTheme();
    if (!Auth.isAuthed()) {
      if (location.hash && location.hash !== '#/login') history.replaceState(null, '', '#/login');
      renderLogin();
    } else {
      renderShell();
      if (!location.hash || location.hash === '#/login') history.replaceState(null, '', '#/dashboard');
      renderRoute();
    }
    window.addEventListener('hashchange', () => {
      if (!Auth.isAuthed()) { renderLogin(); return; }
      renderRoute();
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
