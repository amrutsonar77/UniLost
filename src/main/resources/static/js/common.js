/* =========================================================
   UniLost — common.js  (Stripe/light theme)
   ========================================================= */

const API_BASE = "/api";

// ── navigateTo — simple redirect, no animation ────────────
function navigateTo(url) {
  if (!url || url === "#") return;
  window.location.href = url;
}

// ── Session ───────────────────────────────────────────────
function getLoggedInUser() { try { return JSON.parse(localStorage.getItem("unilost_user")); } catch { return null; } }
function saveLoggedInUser(u) { localStorage.setItem("unilost_user", JSON.stringify(u)); }
function logoutUser() { localStorage.removeItem("unilost_user"); navigateTo("login.html"); }
function requireLogin() { const u = getLoggedInUser(); if (!u) { navigateTo("login.html"); return null; } return u; }
function requireAdmin() { const u = requireLogin(); if (u && u.role !== "ADMIN") { navigateTo("index.html"); return null; } return u; }

// ── Categories ────────────────────────────────────────────
const ITEM_CATEGORIES = ["Electronics","ID Cards","Books","Bags","Keys","Clothing","Accessories","Documents","Water Bottles","Other"];

// ── SVG NAV ICONS (inline, no emoji) ─────────────────────
const NAV_ICONS = {
  home:      `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  lost:      `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>`,
  found:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  matches:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
  messages:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  myReports: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  admin:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  bell:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  logout:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 0-2 2V5a2 2 0 0 1 2-2h4" transform="scale(-1,1) translate(-24,0)"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  user:      `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
};

// ── Navbar ────────────────────────────────────────────────
function renderNavbar() {
  const ph = document.getElementById("navbarPlaceholder");
  if (!ph) return;

  const user   = getLoggedInUser();
  const active = window.ACTIVE_NAV || "";
  const lc     = n => `nav-link${active === n ? " active" : ""}`;

  let links = `
    <li class="nav-item"><a class="${lc("home")}"    href="index.html">${NAV_ICONS.home} Home</a></li>
    <li class="nav-item"><a class="${lc("lost")}"    href="lost-items.html">${NAV_ICONS.lost} Lost Items</a></li>
    <li class="nav-item"><a class="${lc("found")}"   href="found-items.html">${NAV_ICONS.found} Found Items</a></li>
    <li class="nav-item"><a class="${lc("matches")}" href="matches.html">${NAV_ICONS.matches} AI Matches</a></li>`;

  let right;
  if (user) {
    links += `
      <li class="nav-item"><a class="${lc("messages")}"  href="messages.html">${NAV_ICONS.messages} Messages</a></li>
      <li class="nav-item"><a class="${lc("myReports")}" href="my-reports.html">${NAV_ICONS.myReports} My Reports</a></li>`;
    const adminLink = user.role === "ADMIN"
      ? `<li class="nav-item"><a class="${lc("admin")}" href="admin.html">${NAV_ICONS.admin} Admin</a></li>` : "";
    right = `
      ${adminLink}
      <li class="nav-item nav-bell" id="navBellItem">
        <a class="nav-link" href="#" onclick="toggleNotifications(event)" style="display:flex;align-items:center;gap:3px;">
          ${NAV_ICONS.bell}<span id="navBellCount" class="bell-count d-none">0</span>
        </a>
        <div id="navNotifDropdown" class="notif-dropdown d-none"></div>
      </li>
      <li class="nav-item">
        <a class="${lc("profile")}" href="profile.html" style="display:flex;align-items:center;gap:7px;">
          <span class="nav-avatar">${escHtml(user.fullName.charAt(0).toUpperCase())}</span>
          <span>${escHtml(user.fullName.split(" ")[0])}</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#" onclick="logoutUser()" style="display:flex;align-items:center;gap:5px;color:var(--text-3)!important;">
          ${NAV_ICONS.logout} Logout
        </a>
      </li>`;
  } else {
    right = `
      <li class="nav-item"><a class="nav-link" href="login.html">Sign in</a></li>
      <li class="nav-item"><a class="btn-nav-cta" href="register.html">Get Started</a></li>`;
  }

  ph.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-unilost">
      <div class="container">
        <a class="navbar-brand" href="index.html">
          <span class="brand-mark">
            <svg width="19" height="19" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="#ffffff" stroke-width="2"/>
              <circle cx="8.5" cy="7.5" r="1.6" fill="#ffffff"/>
              <path d="M8.5 9.1 C7.2 10.8 8.5 12.5 8.5 12.5 C8.5 12.5 9.8 10.8 8.5 9.1Z" fill="#ffffff"/>
              <line x1="13" y1="13" x2="18.5" y2="18.5" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </span>
          UniLost
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMenu">
          <ul class="navbar-nav me-auto gap-1">${links}</ul>
          <ul class="navbar-nav align-items-center gap-1">${right}</ul>
        </div>
      </div>
    </nav>`;

  if (user) refreshNotificationBell(user.id);
}

// ── Notification bell ─────────────────────────────────────
async function refreshNotificationBell(userId) {
  try {
    const res = await fetch(`${API_BASE}/notifications/${userId}/unread-count`);
    if (!res.ok) return;
    const data = await res.json();
    const el   = document.getElementById("navBellCount");
    if (!el) return;
    if (data.count > 0) { el.textContent = data.count; el.classList.remove("d-none"); }
    else { el.classList.add("d-none"); }
  } catch { /* silent */ }
}

const NOTIF_ICONS = {
  AI_MATCH:       `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/></svg>`,
  NEW_MESSAGE:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  CLAIM_REQUEST:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
  CLAIM_APPROVED: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
  CLAIM_REJECTED: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

async function toggleNotifications(e) {
  e.preventDefault();
  const dd   = document.getElementById("navNotifDropdown");
  const user = getLoggedInUser();
  if (!dd || !user) return;
  if (!dd.classList.contains("d-none")) { dd.classList.add("d-none"); return; }

  dd.innerHTML = `<div class="notif-empty"><div class="spinner-uni" style="width:24px;height:24px;border-width:2px;margin-bottom:0;"></div></div>`;
  dd.classList.remove("d-none");

  try {
    const notifs = await (await fetch(`${API_BASE}/notifications/${user.id}`)).json();
    if (!notifs || !notifs.length) {
      dd.innerHTML = `<div class="notif-dd-hdr">Notifications</div><div class="notif-empty" style="padding:20px;">No notifications yet</div>`;
      return;
    }
    dd.innerHTML = `<div class="notif-dd-hdr">Notifications</div>` +
      notifs.slice(0,10).map(n => `
        <div class="notif-item ${n.read ? "" : "notif-unread"}">
          <div class="notif-header">
            <span class="notif-title" style="display:flex;align-items:center;gap:5px;">
              <span style="color:var(--green);display:flex;">${NOTIF_ICONS[n.type]||NOTIF_ICONS.AI_MATCH}</span>
              ${escHtml(n.title)}
            </span>
            ${!n.read ? '<span class="notif-unread-dot"></span>' : ""}
          </div>
          <div class="notif-message">${escHtml(n.message)}</div>
          ${n.createdAt ? `<div class="notif-time">${formatRelativeTime(n.createdAt)}</div>` : ""}
        </div>`).join("");
    fetch(`${API_BASE}/notifications/${user.id}/read-all`, { method:"PUT" })
      .then(() => refreshNotificationBell(user.id));
  } catch {
    dd.innerHTML = `<div class="notif-empty" style="color:var(--danger)">Failed to load</div>`;
  }
}

document.addEventListener("click", e => {
  const b = document.getElementById("navBellItem");
  if (b && !b.contains(e.target)) { const d = document.getElementById("navNotifDropdown"); if (d) d.classList.add("d-none"); }
});

// ── Image upload ──────────────────────────────────────────
function wireImageUpload(inputId, previewId, removeBtnId, errorId) {
  const input = document.getElementById(inputId), preview = document.getElementById(previewId),
        removeBtn = document.getElementById(removeBtnId), errorEl = document.getElementById(errorId);
  if (!input || !preview) return;
  input.addEventListener("change", () => {
    if (errorEl) { errorEl.textContent = ""; errorEl.classList.add("d-none"); }
    const file = input.files[0];
    if (!file) { hidePreview(); return; }
    const err = validateImageFile(file);
    if (err) { if (errorEl) { errorEl.textContent = err; errorEl.classList.remove("d-none"); } input.value = ""; hidePreview(); return; }
    const reader = new FileReader();
    reader.onload = ev => { preview.src = ev.target.result; preview.style.display = "block"; if (removeBtn) removeBtn.style.display = "flex"; };
    reader.readAsDataURL(file);
  });
  if (removeBtn) removeBtn.addEventListener("click", () => { input.value = ""; hidePreview(); if (errorEl) errorEl.classList.add("d-none"); });
  function hidePreview() { preview.src = ""; preview.style.display = "none"; if (removeBtn) removeBtn.style.display = "none"; }
}

function validateImageFile(file) {
  if (!file) return null;
  if (!["image/jpeg","image/png","image/webp"].includes(file.type)) return "Unsupported type. Use JPG, PNG or WebP.";
  if (file.size > 5 * 1024 * 1024) return "File too large. Max 5 MB.";
  if (file.size === 0) return "File is empty.";
  return null;
}

function setMaxDate(el) { if (el) el.max = new Date().toISOString().split("T")[0]; }

// ── Category helpers ──────────────────────────────────────
function populateCategoryOptions(el, includeAll = false) {
  if (!el) return;
  if (includeAll) { const o = document.createElement("option"); o.value = ""; o.textContent = "All Categories"; el.appendChild(o); }
  ITEM_CATEGORIES.forEach(cat => { const o = document.createElement("option"); o.value = cat; o.textContent = cat; el.appendChild(o); });
}

// ── Rendering helpers ─────────────────────────────────────
function itemImageOrPlaceholder(p) { return p ? p : "https://placehold.co/400x200/F0F0F4/9ca3af?text=No+Image"; }

function statusBadgeHtml(s) {
  const map = { PENDING:"badge-pending", MATCHED:"badge-matched", RECOVERED:"badge-recovered" };
  return `<span class="${map[s]||"badge-pending"}">${s}</span>`;
}

function confidenceBadge(score) {
  if (score >= 90) return { label:"Very High Match", cls:"conf-veryhigh" };
  if (score >= 75) return { label:"High Match",      cls:"conf-high" };
  if (score >= 55) return { label:"Possible Match",  cls:"conf-possible" };
  return              { label:"Low Match",           cls:"conf-low" };
}

function getScoreClass(s) { return s >= 65 ? "score-high" : s >= 40 ? "score-medium" : "score-low"; }

// ── Utility ───────────────────────────────────────────────
function escHtml(s) {
  if (!s) return "";
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function formatRelativeTime(iso) {
  try {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (d < 60) return "just now"; if (d < 3600) return `${Math.floor(d/60)}m ago`;
    if (d < 86400) return `${Math.floor(d/3600)}h ago`; return `${Math.floor(d/86400)}d ago`;
  } catch { return ""; }
}

// ── State helpers ─────────────────────────────────────────
const EMPTY_SVG = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-4);"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`;
const ERROR_SVG = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--danger);"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

function showLoading(id) {
  const el = document.getElementById(id); if (!el) return;
  el.innerHTML = `<div class="col-12"><div class="state-container"><div class="spinner-uni"></div><p style="color:var(--text-4);font-size:.85rem;">Loading...</p></div></div>`;
}

function showEmpty(id, title, sub) {
  const el = document.getElementById(id); if (!el) return;
  el.innerHTML = `<div class="col-12"><div class="state-container">${EMPTY_SVG}<h5 style="margin-top:16px;">${escHtml(title)}</h5>${sub?`<p>${escHtml(sub)}</p>`:""}</div></div>`;
}

function showError(id, msg) {
  const el = document.getElementById(id); if (!el) return;
  el.innerHTML = `<div class="col-12"><div class="state-container">${ERROR_SVG}<h5 style="color:var(--danger);margin-top:16px;">Something went wrong</h5><p>${escHtml(msg)}</p></div></div>`;
}

function showToast(message, type = "info") {
  const icons = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>`,
    info:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };
  let c = document.getElementById("toastContainerUni");
  if (!c) { c = document.createElement("div"); c.id = "toastContainerUni"; c.className = "toast-container-uni"; document.body.appendChild(c); }
  const t = document.createElement("div");
  t.className = `uni-toast ${type}`;
  const iconColor = type==="success"?"var(--success)":type==="error"?"var(--danger)":type==="warning"?"var(--warning)":"var(--info)";
  t.innerHTML = `<span style="color:${iconColor};display:flex;flex-shrink:0;">${icons[type]||icons.info}</span>${escHtml(message)}`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('exiting'); setTimeout(()=>t.remove(),280); }, 3200);
}

// Legacy alias
function wireImagePreview(inputEl, previewEl) {
  if (!inputEl||!previewEl) return;
  inputEl.addEventListener("change", () => {
    const f = inputEl.files[0]; if (!f) { previewEl.style.display="none"; return; }
    const r = new FileReader(); r.onload = e => { previewEl.src = e.target.result; previewEl.style.display = "block"; }; r.readAsDataURL(f);
  });
}

// ── Scroll-reveal (IntersectionObserver) ─────────────────
function initScrollReveal() {
  if (typeof IntersectionObserver === 'undefined') return;
  // Target cards, stat cells, and section headers not already animated by CSS
  const selector = '.card, .admin-stat-card, .hiw-card, .stat-cell, .section-header, .filter-bar';
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll(selector).forEach(el => {
    // Only add reveal to elements below the fold (not already in view on load)
    if (el.getBoundingClientRect().top > window.innerHeight) {
      el.classList.add('reveal');
      observer.observe(el);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
  setTimeout(initScrollReveal, 120);

  // Load animations on every page (cursor, particles, tilt, count-up, etc.)
  const s = document.createElement('script');
  // Resolve path relative to common.js location so it works from any directory
  const base = (document.querySelector('script[src*="common.js"]') || {}).src || '';
  s.src = base ? base.replace('common.js', 'animations.js') : 'js/animations.js';
  document.body.appendChild(s);
});



