/* UniLost — item-details.js */
const PIN  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const CAL  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
const USR  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const TAG  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
const MSG  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
const HAND = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const CHK  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
const CPU  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/></svg>`;
const EYE  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;

const urlParams   = new URLSearchParams(window.location.search);
const itemId      = urlParams.get("id");
const itemType    = (urlParams.get("type") || "LOST").toUpperCase();
const root        = document.getElementById("detailsRoot");
const currentUser = getLoggedInUser();

document.addEventListener("DOMContentLoaded", loadItem);

async function loadItem() {
  if (!itemId) { root.innerHTML = errState("No item ID in URL."); return; }
  const ep = itemType === "LOST" ? `${API_BASE}/lost-items/${itemId}/details` : `${API_BASE}/found-items/${itemId}/details`;
  try {
    const res = await fetch(ep);
    if (!res.ok) throw new Error();
    renderItem(await res.json());
  } catch { root.innerHTML = errState("Could not load this item. It may have been removed."); }
}

function renderItem(data) {
  const item  = data.item;
  const isOwn = currentUser && item.userId === currentUser.id;
  const isLost = itemType === "LOST";

  const typeBg  = isLost ? "rgba(220,38,38,.08)" : "rgba(5,150,105,.08)";
  const typeCl  = isLost ? "#dc2626"             : "#059669";
  const typeBdr = isLost ? "rgba(220,38,38,.18)" : "rgba(5,150,105,.18)";

  const chips = [
    item.category && `<span style="background:rgba(17,20,57,.06);color:var(--text-2);font-size:.68rem;font-weight:700;padding:3px 11px;border-radius:99px;border:1px solid var(--border);display:inline-flex;align-items:center;gap:4px;">${TAG}${escHtml(item.category)}</span>`,
    item.color    && `<span style="background:var(--bg-2);color:var(--text-2);font-size:.68rem;font-weight:600;padding:3px 11px;border-radius:99px;border:1px solid var(--border);">${escHtml(item.color)}</span>`,
    item.brand    && `<span style="background:var(--bg-2);color:var(--text-2);font-size:.68rem;font-weight:600;padding:3px 11px;border-radius:99px;border:1px solid var(--border);">${escHtml(item.brand)}</span>`,
  ].filter(Boolean).join(" ");

  let actions = "";
  if (!currentUser) {
    actions = `<a href="login.html" class="btn-uni-primary btn px-4" style="display:inline-flex;align-items:center;gap:7px;">${MSG} Login to Contact</a>`;
  } else if (!isOwn) {
    const lbl = isLost ? "Contact Owner" : "Contact Finder";
    actions += `<button class="btn-uni-primary btn px-4" onclick="contactReporter(${item.userId})" style="display:inline-flex;align-items:center;gap:7px;">${MSG} ${lbl}</button>`;
    if (!isLost) actions += `<button class="btn-outline-green btn px-4" data-bs-toggle="modal" data-bs-target="#claimModal" style="display:inline-flex;align-items:center;gap:7px;">${HAND} This is my item</button>`;
  }
  if (isOwn && item.status !== "RECOVERED") {
    actions += `<button class="btn-ghost btn px-4" onclick="markRecovered(${item.id})" style="display:inline-flex;align-items:center;gap:7px;">${CHK} Mark Recovered</button>`;
  }

  let html = `
    <nav aria-label="breadcrumb" style="margin-bottom:20px;">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="${isLost?'lost-items.html':'found-items.html'}">${isLost?'Lost Items':'Found Items'}</a></li>
        <li class="breadcrumb-item active" style="color:var(--text-3);">${escHtml(item.itemName)}</li>
      </ol>
    </nav>

    <div class="row g-5 mb-4">
      <div class="col-lg-5">
        <div style="border-radius:var(--r-lg);overflow:hidden;background:var(--bg-1);border:1px solid var(--border);">
          <img src="${itemImageOrPlaceholder(item.imagePath)}" alt="${escHtml(item.itemName)}"
               style="width:100%;max-height:380px;object-fit:contain;padding:8px;background:var(--bg-1);"
               onerror="this.src='https://placehold.co/500x360/F0F0F4/9ca3af?text=No+Image'">
        </div>
      </div>

      <div class="col-lg-7">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
          <span style="background:${typeBg};color:${typeCl};border:1px solid ${typeBdr};font-size:.65rem;font-weight:800;padding:3px 11px;border-radius:99px;text-transform:uppercase;letter-spacing:.5px;">${itemType}</span>
          ${statusBadgeHtml(item.status)}
        </div>
        <h1 style="font-size:1.8rem;font-weight:900;letter-spacing:-.5px;margin-bottom:12px;line-height:1.15;color:var(--text);">${escHtml(item.itemName)}</h1>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px;">${chips}</div>

        <div class="detail-meta-grid">
          <div class="detail-meta-item">
            <div class="meta-label">${PIN} Location</div>
            <div class="meta-value">${escHtml(item.location||"—")}</div>
          </div>
          <div class="detail-meta-item">
            <div class="meta-label">${CAL} Date</div>
            <div class="meta-value">${item.date||"—"}</div>
          </div>
          <div class="detail-meta-item">
            <div class="meta-label">${USR} Reported by</div>
            <div class="meta-value">${escHtml(data.reporterName||"—")}</div>
          </div>
          <div class="detail-meta-item">
            <div class="meta-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Status
            </div>
            <div class="meta-value">${item.status}</div>
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-4);margin-bottom:6px;">Description</div>
          <p style="color:var(--text-2);font-size:.9rem;line-height:1.7;margin:0;">${escHtml(item.description||"No description provided.")}</p>
        </div>

        ${item.additionalDetails ? `
        <div style="background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r-sm);padding:13px 15px;margin-bottom:16px;">
          <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-4);margin-bottom:5px;">Additional Details</div>
          <p style="color:var(--text-2);font-size:.875rem;margin:0;line-height:1.6;">${escHtml(item.additionalDetails)}</p>
        </div>` : ""}

        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:22px;">${actions}</div>
      </div>
    </div>`;

  if (isLost) {
    if (data.possibleMatches && data.possibleMatches.length > 0) {
      html += `
        <hr class="glow-line" style="margin:8px 0 36px;">
        <div class="section-header">
          <div>
            <span class="section-label">AI Analysis</span>
            <div class="section-title" style="display:flex;align-items:center;gap:8px;">${CPU} AI Match Suggestions</div>
            <div class="section-sub">Ranked by similarity score</div>
          </div>
          <span style="background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.2);color:#7c3aed;font-size:.8rem;font-weight:700;padding:4px 16px;border-radius:99px;">
            ${data.possibleMatches.length} match${data.possibleMatches.length!==1?"es":""}
          </span>
        </div>
        <div class="row g-4">${data.possibleMatches.map(m => matchCard(m)).join("")}</div>`;
    } else {
      html += `
        <hr class="glow-line" style="margin:8px 0 36px;">
        <div style="display:flex;align-items:center;gap:8px;font-size:1.1rem;font-weight:800;margin-bottom:16px;color:var(--text);">${CPU} AI Matches</div>
        <div class="card p-4 text-center">
          <div class="empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
          <h6 style="font-weight:700;color:var(--text-2);">No matches found yet</h6>
          <p style="color:var(--text-3);font-size:.85rem;margin:0;">As more found items are reported, the AI compares them automatically.</p>
        </div>`;
    }
  }

  if (!isLost && isOwn) {
    html += `
      <hr class="glow-line" style="margin:8px 0 36px;">
      <div style="display:flex;align-items:center;gap:8px;font-size:1.1rem;font-weight:800;margin-bottom:16px;color:var(--text);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
        Claim Requests
      </div>
      <div id="claimRequestsContainer"><div class="state-container"><div class="spinner-uni"></div></div></div>`;
  }

  root.innerHTML = html;
  if (!isLost && isOwn) loadClaimRequests(item.id);
  if (!isLost) wireClaimForm(item.id);
}

function matchCard(m) {
  const score  = m.finalScore ?? m.matchScore ?? 0;
  const badge  = confidenceBadge(score);
  const reasons = (m.matchReasons||"").split(",").filter(Boolean);
  return `
    <div class="col-lg-6">
      <div class="card">
        <div class="card-header-unilost">
          <div class="accent-bar"></div>
          <span style="flex:1;">Potential Match</span>
          <span class="confidence-badge ${badge.cls}">${badge.label}</span>
        </div>
        <div style="padding:16px 18px 0;">
          <div class="match-split">
            <div class="match-split-side">
              <img src="${itemImageOrPlaceholder(m.lostItem?.imagePath)}" alt="Lost"
                   onerror="this.src='https://placehold.co/200x100/161b22/30363d?text=No+Image'">
              <div style="font-size:.62rem;font-weight:700;text-transform:uppercase;color:#f85149;margin-bottom:3px;">LOST</div>
              <div style="font-size:.8rem;font-weight:700;color:var(--text);">${escHtml(m.lostItem?.itemName||"")}</div>
            </div>
            <div class="match-split-side">
              <img src="${itemImageOrPlaceholder(m.foundItem?.imagePath)}" alt="Found"
                   onerror="this.src='https://placehold.co/200x100/161b22/30363d?text=No+Image'">
              <div style="font-size:.62rem;font-weight:700;text-transform:uppercase;color:var(--green);margin-bottom:3px;">FOUND</div>
              <div style="font-size:.8rem;font-weight:700;color:var(--text);">${escHtml(m.foundItem?.itemName||"")}</div>
            </div>
          </div>
        </div>
        <div style="padding:0 18px 18px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
            <span class="match-score-lg">${score}%</span>
            <div style="flex:1;">
              <div style="font-size:.7rem;color:var(--text-4);margin-bottom:3px;">Overall match score</div>
              <div class="progress-track"><div class="progress-fill" style="width:${score}%"></div></div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:12px 0;">
            ${scoreChip("Image", m.imageSimilarity)}
            ${scoreChip("Category", m.categorySimilarity)}
            ${scoreChip("Text", m.textSimilarity)}
            ${scoreChip("Location", m.locationScore)}
          </div>
          ${reasons.length ? `<div style="margin-bottom:12px;">${reasons.map(r=>`<span class="reason-tag">${CHK} ${escHtml(r.trim())}</span>`).join("")}</div>` : ""}
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a href="item-details.html?id=${m.foundItem?.id}&type=FOUND" class="btn-ghost btn btn-sm flex-fill" style="display:inline-flex;align-items:center;justify-content:center;gap:5px;">${EYE} View Found Item</a>
            ${currentUser && m.foundItem?.userId !== currentUser.id
              ? `<button class="btn-uni-primary btn btn-sm flex-fill" onclick="contactReporter(${m.foundItem?.userId})" style="display:inline-flex;align-items:center;justify-content:center;gap:5px;">${MSG} Contact Finder</button>` : ""}
          </div>
        </div>
      </div>
    </div>`;
}

function scoreChip(label, value) {
  if (value===undefined||value===null) return "";
  const v = Math.round(value);
  const c = v>=65?"var(--green)":v>=40?"var(--warning)":"var(--text-4)";
  return `<div style="background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r-xs);padding:6px 4px;text-align:center;">
    <div style="font-size:.75rem;font-weight:800;color:${c};">${v}%</div>
    <div style="font-size:.58rem;color:var(--text-4);margin-top:2px;">${label}</div>
  </div>`;
}

async function contactReporter(otherId) {
  if (!currentUser) { window.location.href = "login.html"; return; }
  if (currentUser.id === otherId) { showToast("You cannot message yourself.","warning"); return; }
  try {
    const res  = await fetch(`${API_BASE}/messages/start`, { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ itemId, itemType, userOneId:currentUser.id, userTwoId:otherId }) });
    const conv = await res.json();
    window.location.href = `messages.html?conversationId=${conv.id}`;
  } catch { showToast("Could not start conversation.","error"); }
}

async function markRecovered(id) {
  if (!confirm("Mark this item as recovered?")) return;
  const ep = itemType==="LOST" ? `${API_BASE}/lost-items/${id}/recover` : `${API_BASE}/found-items/${id}/recover`;
  await fetch(ep,{method:"PUT"});
  showToast("Item marked as recovered!","success");
  loadItem();
}

function wireClaimForm(foundItemId) {
  const form = document.getElementById("claimForm"); if (!form) return;
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add("was-validated"); return; }
    if (!currentUser) { window.location.href="login.html"; return; }
    const ab = document.getElementById("claimAlert"), btn = form.querySelector("button[type=submit]");
    btn.disabled=true; btn.textContent="Submitting…";
    try {
      const res = await fetch(`${API_BASE}/claims`, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ foundItemId, claimantUserId:currentUser.id,
          reason:document.getElementById("claimReason").value.trim(),
          identifyingDetail:document.getElementById("claimDetail").value.trim(),
          lostLocation:document.getElementById("claimLocation").value.trim() }) });
      if (res.ok) {
        ab.className="alert"; ab.style.cssText="background:rgba(5,150,105,.08);border:1px solid rgba(5,150,105,.2);color:#059669;border-radius:var(--r-sm);font-size:.85rem;";
        ab.textContent="Claim submitted! The finder will review it."; ab.classList.remove("d-none");
        form.reset(); form.classList.remove("was-validated");
      } else { throw new Error((await res.json().catch(()=>({}))).message||"Failed"); }
    } catch(err) {
      ab.className="alert"; ab.style.cssText="background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.2);color:#dc2626;border-radius:var(--r-sm);font-size:.85rem;";
      ab.textContent=err.message||"Something went wrong."; ab.classList.remove("d-none");
    } finally { btn.disabled=false; btn.textContent="Submit Claim Request"; }
  });
}

async function loadClaimRequests(foundItemId) {
  const c = document.getElementById("claimRequestsContainer");
  try {
    const claims = await (await fetch(`${API_BASE}/claims/found-item/${foundItemId}`)).json();
    if (!claims||!claims.length) { c.innerHTML=`<p style="color:var(--text-3);font-size:.875rem;">No claim requests yet.</p>`; return; }
    c.innerHTML = claims.map(cl=>`
      <div class="card mb-3 p-3">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span style="font-weight:700;font-size:.875rem;color:var(--text);">Claim #${cl.id}</span>
          ${claimBadge(cl.status)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
          <div><div style="font-size:.65rem;font-weight:700;text-transform:uppercase;color:var(--text-4);margin-bottom:3px;">Reason</div><div style="font-size:.83rem;color:var(--text-2);">${escHtml(cl.reason)}</div></div>
          <div><div style="font-size:.65rem;font-weight:700;text-transform:uppercase;color:var(--text-4);margin-bottom:3px;">Lost at</div><div style="font-size:.83rem;color:var(--text-2);">${escHtml(cl.lostLocation)}</div></div>
        </div>
        <div style="margin-bottom:${cl.status==="PENDING"?'12':'0'}px;">
          <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;color:var(--text-4);margin-bottom:3px;">Identifying Detail</div>
          <div style="font-size:.83rem;color:var(--text-2);">${escHtml(cl.identifyingDetail)}</div>
        </div>
        ${cl.status==="PENDING"?`
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm flex-fill" style="background:rgba(5,150,105,.08);border:1px solid rgba(5,150,105,.2);color:#059669;font-weight:600;border-radius:var(--r-xs);display:inline-flex;align-items:center;justify-content:center;gap:5px;" onclick="reviewClaim(${cl.id},'approve',${foundItemId})">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Approve
            </button>
            <button class="btn btn-sm flex-fill" style="background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.18);color:#dc2626;font-weight:600;border-radius:var(--r-xs);display:inline-flex;align-items:center;justify-content:center;gap:5px;" onclick="reviewClaim(${cl.id},'reject',${foundItemId})">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Reject
            </button>
          </div>`:""}
      </div>`).join("");
  } catch { c.innerHTML=`<p style="color:var(--danger);font-size:.85rem;">Could not load claims.</p>`; }
}

function claimBadge(s) {
  const m = {
    PENDING:  { bg:"rgba(217,119,6,.1)",  c:"#d97706", bdr:"rgba(217,119,6,.2)"  },
    APPROVED: { bg:"rgba(5,150,105,.1)",  c:"#059669", bdr:"rgba(5,150,105,.2)"  },
    REJECTED: { bg:"rgba(220,38,38,.08)", c:"#dc2626", bdr:"rgba(220,38,38,.18)" }
  }[s] || { bg:"var(--bg-2)", c:"var(--text-3)", bdr:"var(--border)" };
  return `<span style="background:${m.bg};color:${m.c};border:1px solid ${m.bdr};font-size:.68rem;font-weight:700;padding:3px 11px;border-radius:99px;">${s}</span>`;
}

async function reviewClaim(claimId, action, foundItemId) {
  if (!confirm(`${action==="approve"?"Approve":"Reject"} this claim?`)) return;
  await fetch(`${API_BASE}/claims/${claimId}/${action}`,{method:"PUT"});
  showToast(`Claim ${action==="approve"?"approved":"rejected"}.`,"success");
  loadClaimRequests(foundItemId); loadItem();
}

function errState(msg) {
  return `<div class="state-container" style="min-height:60vh;">
    <div class="empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--danger);"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg></div>
    <h5 style="color:var(--text-2);margin-top:16px;">Could not load item</h5>
    <p style="color:var(--text-3);">${escHtml(msg)}</p>
    <a href="lost-items.html" class="btn-ghost btn btn-sm mt-3" style="display:inline-flex;align-items:center;gap:5px;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
      Back to Lost Items
    </a>
  </div>`;
}
