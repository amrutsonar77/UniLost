/* UniLost — admin.js */
requireAdmin();
let matchesLoaded = false;

document.addEventListener("DOMContentLoaded", () => {
  loadStats(); loadUsers(); loadLostItemsAdmin(); loadFoundItemsAdmin(); loadClaimsAdmin();
});

function showTab(name) {
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".admin-nav-item").forEach(b => b.classList.remove("active"));
  const panel = document.getElementById(`tab-${name}`);
  if (panel) panel.classList.add("active");
  document.querySelectorAll(".admin-nav-item").forEach(btn => {
    if (btn.getAttribute("onclick")?.includes(`'${name}'`)) btn.classList.add("active");
  });
  if (name === "matches" && !matchesLoaded) loadMatchesAdmin();
}

async function loadStats() {
  try {
    const s = await (await fetch(`${API_BASE}/admin/stats`)).json();
    const set = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v??'—'; };
    set("statUsers",s.totalUsers); set("statLost",s.totalLostItems); set("statFound",s.totalFoundItems);
    set("statRecovered",s.totalRecovered); set("statMatches",s.totalMatches); set("statClaims",s.pendingClaims);
  } catch { console.warn("Stats load failed"); }
}

const VIEW_SVG   = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const DEL_SVG    = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`;

async function loadUsers() {
  try {
    const users = await (await fetch(`${API_BASE}/admin/users`)).json();
    document.getElementById("usersTableBody").innerHTML = !users.length
      ? `<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--text-4);">No users.</td></tr>`
      : users.map(u=>`<tr>
          <td style="color:var(--text-4);font-size:.8rem;">${u.id}</td>
          <td style="font-weight:600;">${escHtml(u.fullName)}</td>
          <td style="color:var(--text-3);">${escHtml(u.email)}</td>
          <td style="color:var(--text-3);font-size:.82rem;">${escHtml(u.collegeName||'—')}</td>
          <td><span style="background:${u.role==='ADMIN'?'rgba(220,38,38,.08)':'rgba(5,150,105,.08)'};color:${u.role==='ADMIN'?'#dc2626':'#059669'};border:1px solid ${u.role==='ADMIN'?'rgba(220,38,38,.2)':'rgba(5,150,105,.2)'};font-size:.68rem;font-weight:700;padding:2px 9px;border-radius:99px;">${u.role}</span></td>
          <td><button onclick="deleteUser(${u.id})" style="background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.18);color:#dc2626;font-size:.75rem;font-weight:600;padding:4px 11px;border-radius:var(--r-xs);cursor:pointer;display:inline-flex;align-items:center;gap:4px;">${DEL_SVG} Delete</button></td>
        </tr>`).join("");
  } catch { document.getElementById("usersTableBody").innerHTML=`<tr><td colspan="6" style="color:var(--danger);text-align:center;padding:24px;">Failed.</td></tr>`; }
}

async function loadLostItemsAdmin() {
  try {
    const items = await (await fetch(`${API_BASE}/admin/lost-items`)).json();
    document.getElementById("lostTableBody").innerHTML = !items.length
      ? `<tr><td colspan="8" style="text-align:center;padding:28px;color:var(--text-4);">No lost items.</td></tr>`
      : items.map(i=>`<tr>
          <td style="color:var(--text-4);font-size:.8rem;">${i.id}</td>
          <td style="font-weight:600;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(i.itemName)}</td>
          <td><span style="background:rgba(17,20,57,.06);color:var(--text-2);font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:99px;border:1px solid var(--border);">${escHtml(i.category||'—')}</span></td>
          <td style="color:var(--text-3);">${escHtml(i.color||'—')}</td>
          <td style="color:var(--text-3);font-size:.82rem;">${escHtml(i.location||'—')}</td>
          <td style="color:var(--text-3);font-size:.82rem;">${i.date||'—'}</td>
          <td>${statusBadgeHtml(i.status)}</td>
          <td style="white-space:nowrap;display:flex;gap:5px;">
            <a href="item-details.html?id=${i.id}&type=LOST" style="background:var(--bg-2);border:1px solid var(--border);color:var(--text-2);font-size:.75rem;font-weight:600;padding:4px 10px;border-radius:var(--r-xs);display:inline-flex;align-items:center;gap:4px;text-decoration:none;">${VIEW_SVG} View</a>
            <button onclick="deleteLostItem(${i.id})" style="background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.18);color:#dc2626;font-size:.75rem;font-weight:600;padding:4px 10px;border-radius:var(--r-xs);cursor:pointer;display:inline-flex;align-items:center;gap:4px;">${DEL_SVG} Delete</button>
          </td>
        </tr>`).join("");
  } catch { document.getElementById("lostTableBody").innerHTML=`<tr><td colspan="8" style="color:var(--danger);text-align:center;padding:24px;">Failed.</td></tr>`; }
}

async function loadFoundItemsAdmin() {
  try {
    const items = await (await fetch(`${API_BASE}/admin/found-items`)).json();
    document.getElementById("foundTableBody").innerHTML = !items.length
      ? `<tr><td colspan="8" style="text-align:center;padding:28px;color:var(--text-4);">No found items.</td></tr>`
      : items.map(i=>`<tr>
          <td style="color:var(--text-4);font-size:.8rem;">${i.id}</td>
          <td style="font-weight:600;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(i.itemName)}</td>
          <td><span style="background:rgba(17,20,57,.06);color:var(--text-2);font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:99px;border:1px solid var(--border);">${escHtml(i.category||'—')}</span></td>
          <td style="color:var(--text-3);">${escHtml(i.color||'—')}</td>
          <td style="color:var(--text-3);font-size:.82rem;">${escHtml(i.location||'—')}</td>
          <td style="color:var(--text-3);font-size:.82rem;">${i.date||'—'}</td>
          <td>${statusBadgeHtml(i.status)}</td>
          <td style="white-space:nowrap;display:flex;gap:5px;">
            <a href="item-details.html?id=${i.id}&type=FOUND" style="background:var(--bg-2);border:1px solid var(--border);color:var(--text-2);font-size:.75rem;font-weight:600;padding:4px 10px;border-radius:var(--r-xs);display:inline-flex;align-items:center;gap:4px;text-decoration:none;">${VIEW_SVG} View</a>
            <button onclick="deleteFoundItem(${i.id})" style="background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.18);color:#dc2626;font-size:.75rem;font-weight:600;padding:4px 10px;border-radius:var(--r-xs);cursor:pointer;display:inline-flex;align-items:center;gap:4px;">${DEL_SVG} Delete</button>
          </td>
        </tr>`).join("");
  } catch { document.getElementById("foundTableBody").innerHTML=`<tr><td colspan="8" style="color:var(--danger);text-align:center;padding:24px;">Failed.</td></tr>`; }
}

async function loadClaimsAdmin() {
  try {
    const claims = await (await fetch(`${API_BASE}/admin/claims`)).json();
    document.getElementById("claimsTableBody").innerHTML = !claims.length
      ? `<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--text-4);">No claims.</td></tr>`
      : claims.map(c=>`<tr>
          <td style="color:var(--text-4);font-size:.8rem;">${c.id}</td>
          <td><a href="item-details.html?id=${c.foundItemId}&type=FOUND" style="color:#2563eb;font-weight:600;">#${c.foundItemId}</a></td>
          <td style="color:var(--text-3);">${c.claimantUserId}</td>
          <td style="font-size:.82rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-2);" title="${escHtml(c.reason||'')}">${escHtml((c.reason||'').substring(0,55))}${(c.reason||'').length>55?'…':''}</td>
          <td><span style="background:${c.status==='APPROVED'?'rgba(5,150,105,.1)':c.status==='REJECTED'?'rgba(220,38,38,.08)':'rgba(217,119,6,.1)'};color:${c.status==='APPROVED'?'#059669':c.status==='REJECTED'?'#dc2626':'#d97706'};border:1px solid ${c.status==='APPROVED'?'rgba(5,150,105,.2)':c.status==='REJECTED'?'rgba(220,38,38,.18)':'rgba(217,119,6,.2)'};font-size:.68rem;font-weight:700;padding:2px 9px;border-radius:99px;">${c.status}</span></td>
        </tr>`).join("");
  } catch { document.getElementById("claimsTableBody").innerHTML=`<tr><td colspan="5" style="color:var(--danger);text-align:center;padding:24px;">Failed.</td></tr>`; }
}

async function loadMatchesAdmin() {
  matchesLoaded = true;
  const tbody = document.getElementById("matchesTableBody");
  tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:32px;"><div class="spinner-uni" style="margin:0 auto;"></div></td></tr>`;
  try {
    const matches = await (await fetch(`${API_BASE}/matches`)).json();
    if (!matches.length) { tbody.innerHTML=`<tr><td colspan="11" style="text-align:center;padding:32px;color:var(--text-4);">No matches yet. Click "Generate New Matches".</td></tr>`; return; }
    tbody.innerHTML = matches.map(m=>`<tr>
      <td style="color:var(--text-4);font-size:.8rem;">${m.id}</td>
      <td><a href="item-details.html?id=${m.lostItemId}&type=LOST" style="color:#dc2626;font-weight:600;">#${m.lostItemId}</a></td>
      <td><a href="item-details.html?id=${m.foundItemId}&type=FOUND" style="color:#2563eb;font-weight:600;">#${m.foundItemId}</a></td>
      <td style="font-weight:700;color:${getScoreClass(m.imageSimilarity)==='score-high'?'#059669':getScoreClass(m.imageSimilarity)==='score-medium'?'#d97706':'var(--text-4)'};">${Math.round(m.imageSimilarity)}%</td>
      <td style="font-weight:700;color:${getScoreClass(m.categorySimilarity)==='score-high'?'#059669':getScoreClass(m.categorySimilarity)==='score-medium'?'#d97706':'var(--text-4)'};">${Math.round(m.categorySimilarity)}%</td>
      <td style="font-weight:700;color:${getScoreClass(m.textSimilarity)==='score-high'?'#059669':getScoreClass(m.textSimilarity)==='score-medium'?'#d97706':'var(--text-4)'};">${Math.round(m.textSimilarity)}%</td>
      <td style="font-weight:700;color:${getScoreClass(m.locationScore)==='score-high'?'#059669':getScoreClass(m.locationScore)==='score-medium'?'#d97706':'var(--text-4)'};">${Math.round(m.locationScore)}%</td>
      <td><strong style="color:#111439;font-size:.95rem;">${m.finalScore}%</strong></td>
      <td style="font-size:.78rem;color:var(--text-2);">${escHtml(m.confidenceLabel||'—')}</td>
      <td><span style="background:${m.status==='ACCEPTED'?'rgba(5,150,105,.1)':m.status==='REJECTED'?'rgba(220,38,38,.08)':'var(--bg-2)'};color:${m.status==='ACCEPTED'?'#059669':m.status==='REJECTED'?'#dc2626':'var(--text-3)'};font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:99px;">${m.status||'PENDING'}</span></td>
      <td style="font-size:.72rem;color:var(--text-4);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escHtml(m.matchReasons||'')}">${escHtml((m.matchReasons||'').replace(/,/g,' · '))}</td>
    </tr>`).join("");
  } catch { tbody.innerHTML=`<tr><td colspan="11" style="color:var(--danger);text-align:center;padding:24px;">Failed to load.</td></tr>`; }
}

async function generateAndReload() {
  const tbody = document.getElementById("matchesTableBody");
  if (tbody) tbody.innerHTML=`<tr><td colspan="11" style="text-align:center;padding:28px;color:var(--text-3);">Running AI engine…</td></tr>`;
  try { await fetch(`${API_BASE}/matches/generate`,{method:"POST"}); matchesLoaded=false; await loadMatchesAdmin(); loadStats(); showToast("AI matching complete!","success"); }
  catch { showToast("Could not generate matches.","error"); }
}

async function deleteUser(id) {
  if (!confirm("Permanently delete this user?")) return;
  try { await fetch(`${API_BASE}/admin/users/${id}`,{method:"DELETE"}); showToast("User deleted.","success"); loadUsers(); loadStats(); }
  catch { showToast("Delete failed.","error"); }
}
async function deleteLostItem(id) {
  if (!confirm("Delete this lost item?")) return;
  try { await fetch(`${API_BASE}/lost-items/${id}`,{method:"DELETE"}); showToast("Deleted.","success"); loadLostItemsAdmin(); loadStats(); }
  catch { showToast("Delete failed.","error"); }
}
async function deleteFoundItem(id) {
  if (!confirm("Delete this found item?")) return;
  try { await fetch(`${API_BASE}/found-items/${id}`,{method:"DELETE"}); showToast("Deleted.","success"); loadFoundItemsAdmin(); loadStats(); }
  catch { showToast("Delete failed.","error"); }
}
