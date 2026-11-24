/* ============================================================
   IoT at Home — shared helpers (site + admin)
   ============================================================ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
function slugify(text) {
  return String(text || '').toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
function money(n) {
  const num = Number(n) || 0;
  return 'Rp ' + num.toLocaleString('id-ID');
}
function shortMoney(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) return 'Rp ' + (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + ' jt';
  if (num >= 1000) return 'Rp ' + Math.round(num / 1000) + 'rb';
  return money(num);
}
function formatDate(iso, withTime = false) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const opt = { day: '2-digit', month: 'short', year: 'numeric' };
  if (withTime) { opt.hour = '2-digit'; opt.minute = '2-digit'; }
  return d.toLocaleDateString('id-ID', opt);
}
function timeAgo(iso) {
  const then = new Date(iso).getTime();
  if (!then) return '';
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'baru saja';
  if (min < 60) return `${min} menit lalu`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} hari lalu`;
  return formatDate(iso);
}
function daysAgo(n, hours = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9 + hours, 15, 0, 0);
  return d.toISOString();
}
function debounce(fn, wait = 250) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}
function byText(a, b) { return String(a || '').localeCompare(String(b || ''), 'id'); }
function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function readJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try { resolve(JSON.parse(reader.result)); }
      catch (err) { reject(new Error('File bukan JSON yang valid.')); }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsText(file);
  });
}

/* ---------- Toasts ---------- */
function toast(message, type = 'success', title = '') {
  let stack = $('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const icons = { success: '✓', error: '!', warn: '⚠', info: 'i' };
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.setAttribute('role', 'status');
  node.innerHTML = `<div style="font-weight:800;color:${type === 'error' ? 'var(--danger)' : 'var(--primary-dark)'}">${icons[type] || '✓'}</div>
    <div><strong>${esc(title || (type === 'error' ? 'Gagal' : type === 'warn' ? 'Perhatian' : 'Berhasil'))}</strong><span>${esc(message)}</span></div>`;
  stack.appendChild(node);
  setTimeout(() => {
    node.style.opacity = '0';
    node.style.transform = 'translateY(-6px)';
    node.style.transition = 'all .2s';
    setTimeout(() => node.remove(), 220);
  }, 3400);
}

/* ---------- Modal ---------- */
function openModal({ title = '', body = '', footer = '', size = '', onMount, onClose, closeOnBackdrop = true }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head">
        <h3>${esc(title)}</h3>
        <button class="icon-btn modal-x" aria-label="Tutup" style="width:32px;height:32px;border-radius:9px">✕</button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
    </div>`;
  document.body.appendChild(backdrop);
  document.body.style.overflow = 'hidden';
  const close = () => {
    document.body.style.overflow = '';
    backdrop.remove();
    if (typeof onClose === 'function') onClose();
  };
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop && closeOnBackdrop) close(); });
  $('.modal-x', backdrop).addEventListener('click', close);
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape' && document.body.contains(backdrop)) { close(); document.removeEventListener('keydown', onKey); }
  });
  if (typeof onMount === 'function') onMount(backdrop, close);
  return { backdrop, close };
}

/* Promise-based confirmation dialog */
function confirmDialog({ title = 'Konfirmasi', message = '', confirmText = 'Ya, lanjutkan', cancelText = 'Batal', danger = true, extra = '' }) {
  return new Promise((resolve) => {
    let decided = false;
    openModal({
      title, size: '',
      body: `<p style="font-size:.9rem;color:#334155;margin:0">${message}</p>${extra}`,
      footer: `<button class="btn btn-outline" data-act="cancel">${esc(cancelText)}</button>
               <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="ok">${esc(confirmText)}</button>`,
      onMount(root, closeModal) {
        $('[data-act="cancel"]', root).addEventListener('click', () => { decided = true; resolve(false); closeModal(); });
        $('[data-act="ok"]', root).addEventListener('click', () => { decided = true; resolve(true); closeModal(); });
      },
      onClose: () => { if (!decided) resolve(false); }
    });
  });
}

/* ---------- Tiny SVG charts (no external deps) ---------- */
const Charts = {
  colors: ['#0d9488', '#0ea5e9', '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#14b8a6', '#f97316', '#64748b'],
  bar(data, { height = 200, max = null } = {}) {
    if (!data.length) return '<div class="chart-empty">Data belum tersedia</div>';
    const w = 620, padL = 8, padB = 34, padT = 10;
    const maxVal = max || Math.max(...data.map(d => d.value), 1);
    const bw = (w - padL * 2) / data.length;
    const bars = data.map((d, i) => {
      const h = Math.round(((height - padB - padT) * d.value) / maxVal) || 2;
      const x = padL + i * bw + bw * 0.16;
      const y = height - padB - h;
      const label = esc(d.label.length > 11 ? d.label.slice(0, 10) + '…' : d.label);
      return `<g>
        <rect x="${x}" y="${y}" width="${bw * 0.68}" height="${h}" rx="5" fill="${d.color || this.colors[i % this.colors.length]}" opacity=".9">
          <title>${esc(d.label)}: ${d.value}</title></rect>
        <text x="${x + bw * 0.34}" y="${height - padB + 14}" font-size="9.5" fill="#64748b" text-anchor="middle">${label}</text>
        <text x="${x + bw * 0.34}" y="${y - 5}" font-size="9.5" fill="#334155" text-anchor="middle" font-weight="600">${d.value}</text>
      </g>`;
    }).join('');
    return `<svg class="chart-svg" viewBox="0 0 ${w} ${height}" role="img" aria-label="Grafik batang">
      ${[0, 0.5, 1].map(f => `<line x1="${padL}" x2="${w - padL}" y1="${padT + (height - padB - padT) * f}" y2="${padT + (height - padB - padT) * f}" stroke="#eef2f7" stroke-width="1"/>`).join('')}
      ${bars}</svg>`;
  },
  line(points, { height = 200 } = {}) {
    if (points.length < 1) return '<div class="chart-empty">Data belum tersedia</div>';
    const w = 620, pad = 26, padB = 26;
    const maxVal = Math.max(...points.map(p => p.value), 1);
    const stepX = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
    const pts = points.map((p, i) => {
      const x = pad + i * stepX;
      const y = height - padB - ((height - padB - 16) * p.value) / maxVal;
      return { ...p, x, y };
    });
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = `${path} L${pts[pts.length - 1].x},${height - padB} L${pts[0].x},${height - padB} Z`;
    return `<svg class="chart-svg" viewBox="0 0 ${w} ${height}" role="img" aria-label="Grafik garis">
      <defs><linearGradient id="gLine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0d9488" stop-opacity=".28"/><stop offset="100%" stop-color="#0d9488" stop-opacity="0"/>
      </linearGradient></defs>
      ${[0, 0.5, 1].map(f => `<line x1="${pad}" x2="${w - pad}" y1="${16 + (height - padB - 16) * f}" y2="${16 + (height - padB - 16) * f}" stroke="#eef2f7"/>`).join('')}
      <path d="${area}" fill="url(#gLine)"/>
      <path d="${path}" fill="none" stroke="#0d9488" stroke-width="2.2" stroke-linejoin="round"/>
      ${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#fff" stroke="#0d9488" stroke-width="2"><title>${esc(p.label)}: ${p.value}</title></circle>`).join('')}
      ${pts.map((p, i) => (points.length <= 12 || i % 2 === 0) ? `<text x="${p.x}" y="${height - padB + 16}" font-size="9" fill="#64748b" text-anchor="middle">${esc(p.label)}</text>` : '').join('')}
    </svg>`;
  },
  donut(data, { size = 180 } = {}) {
    if (!data.length) return '<div class="chart-empty">Data belum tersedia</div>';
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const r = 58, c = 2 * Math.PI * r, cx = size / 2, cy = size / 2;
    let offset = 0;
    const segs = data.map((d, i) => {
      const len = (d.value / total) * c;
      const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${this.colors[i % this.colors.length]}"
        stroke-width="22" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-offset}"
        transform="rotate(-90 ${cx} ${cy})"><title>${esc(d.label)}: ${d.value}</title></circle>`;
      offset += len;
      return seg;
    }).join('');
    return `<svg class="chart-svg" viewBox="0 0 ${size} ${size}" style="max-width:${size}px;margin:0 auto" role="img" aria-label="Grafik donat">
      ${segs}
      <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="22" font-weight="800" fill="#1e293b">${total}</text>
      <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="9.5" fill="#64748b">total</text>
    </svg>
    <div class="chart-legend">${data.map((d, i) => `<span><i class="legend-dot" style="background:${this.colors[i % this.colors.length]}"></i>${esc(d.label)} (${d.value})</span>`).join('')}</div>`;
  }
};

/* Sidebar / header SVG icons (24px, stroke) */
const Icons = {
  dashboard: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  projects: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z"/></svg>',
  components: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></svg>',
  categories: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h6M4 12h6M4 18h6"/><circle cx="16.5" cy="6" r="2.5"/><circle cx="16.5" cy="18" r="2.5"/><path d="M14 12h5"/></svg>',
  ai: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="3.4"/></svg>',
  analytics: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-6M22 20H2"/></svg>',
  content: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  settings: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  back: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  eye: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l18 18M10.6 10.6A3 3 0 0 0 13.4 13.4M6.7 6.7C4 8.5 2 12 2 12s3.5 7 10 7c1.8 0 3.5-.5 4.9-1.3M9.9 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.1"/></svg>',
  search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  bell: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  edit: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/></svg>',
  copy: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  spark: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M18 16l.9 2.1L21 19l-2.1.9L18 22l-.9-2.1L15 19l2.1-.9z"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>'
};
