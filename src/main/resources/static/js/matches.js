/* UniLost — matches.js */
const MSG_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
const EYE_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const CHK_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;

const container   = document.getElementById("matchesContainer");
const currentUser = getLoggedInUser();

document.addEventListener("DOMContentLoaded", () => {
  const lostId = new URLSearchParams(window.location.search).get("lostId");
  lostId ? loadSuggestionsForLostItem(lostId) : loadAllSavedMatches();
});

async function loadSuggestionsForLostItem(lostId) {
  document.getElementById("matchInfoText").textContent = "Showing AI-suggested found items for this specific lost item.";
  showLoading("matchesContainer");
  try {
    const results = await (await fetch(`${API_BASE}/matches/suggest/${lostId}`)).json();
    if (!results||!results.length) { showEmpty("matchesContainer","No matches found yet","As more found items are reported, this list will populate."); return; }
    container.innerHTML = results.map(r => renderMatchCard(r.lostItem, r.foundItem, r)).join("");
  } catch { showError("matchesContainer","Could not load suggestions."); }
}

async function loadAllSavedMatches() {
  showLoading("matchesContainer");
  try {
    const [matchesRes, lostRes, foundRes] = await Promise.all([
      fetch(`${API_BASE}/matches`), fetch(`${API_BASE}/lost-items`), fetch(`${API_BASE}/found-items`)
    ]);
    const matches  = await matchesRes.json();
    const lostMap  = Object.fromEntries((await lostRes.json()).map(i=>[i.id,i]));
    const foundMap = Object.fromEntries((await foundRes.json()).map(i=>[i.id,i]));
    if (!matches||!matches.length) { showEmpty("matchesContainer","No matches generated yet",'Click "Generate Matches" to run the AI engine.'); return; }
    container.innerHTML = matches.map(m => {
      const l=lostMap[m.lostItemId], f=foundMap[m.foundItemId];
      return (l&&f) ? renderMatchCard(l,f,m) : "";
    }).join("");
  } catch { showError("matchesContainer","Could not load matches."); }
}

async function generateAllMatches() {
  const btn = document.getElementById("generateBtn");
  btn.disabled=true; btn.innerHTML=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .7s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-4.43"/></svg> Running…`;
  showLoading("matchesContainer");
  try {
    await fetch(`${API_BASE}/matches/generate`,{method:"POST"});
    await loadAllSavedMatches();
    showToast("AI matching complete!","success");
  } catch { showError("matchesContainer","Could not generate matches."); }
  finally {
    btn.disabled=false;
    btn.innerHTML=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Generate Matches`;
  }
}

function renderMatchCard(lost, found, m) {
  const score  = m.finalScore ?? m.matchScore ?? 0;
  const badge  = confidenceBadge(score);
  const reasons = (m.matchReasons||"").split(",").filter(Boolean);
  return `
    <div class="col-xl-6">
      <div class="card">
        <div class="card-header-unilost">
          <div class="accent-bar"></div>
          <span style="flex:1;">Potential Match</span>
          <span class="confidence-badge ${badge.cls}">${badge.label}</span>
        </div>
        <div style="padding:16px 18px 0;">
          <div class="match-split">
            <div class="match-split-side">
              <img src="${itemImageOrPlaceholder(lost.imagePath)}" alt="Lost"
                   onerror="this.src='https://placehold.co/200x100/161b22/30363d?text=No+Image'">
              <div style="font-size:.62rem;font-weight:700;text-transform:uppercase;color:#f85149;margin-bottom:3px;">LOST</div>
              <div style="font-size:.82rem;font-weight:700;color:var(--text);">${escHtml(lost.itemName)}</div>
              <div style="font-size:.7rem;color:var(--text-3);margin-top:2px;display:flex;align-items:center;gap:3px;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${escHtml(lost.location||"—")}
              </div>
            </div>
            <div class="match-split-side">
              <img src="${itemImageOrPlaceholder(found.imagePath)}" alt="Found"
                   onerror="this.src='https://placehold.co/200x100/161b22/30363d?text=No+Image'">
              <div style="font-size:.62rem;font-weight:700;text-transform:uppercase;color:var(--green);margin-bottom:3px;">FOUND</div>
              <div style="font-size:.82rem;font-weight:700;color:var(--text);">${escHtml(found.itemName)}</div>
              <div style="font-size:.7rem;color:var(--text-3);margin-top:2px;display:flex;align-items:center;gap:3px;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${escHtml(found.location||"—")}
              </div>
            </div>
          </div>
        </div>
        <div style="padding:0 18px 18px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
            <span class="match-score-lg">${score}%</span>
            <div style="flex:1;"><div style="font-size:.7rem;color:var(--text-4);margin-bottom:3px;">Overall match</div>
            <div class="progress-track"><div class="progress-fill" style="width:${score}%"></div></div></div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:12px 0;">
            ${sChip("Image",m.imageSimilarity)}${sChip("Category",m.categorySimilarity)}${sChip("Text",m.textSimilarity)}${sChip("Location",m.locationScore)}
          </div>
          ${reasons.length?`<div style="margin-bottom:12px;">${reasons.map(r=>`<span class="reason-tag">${CHK_SVG} ${escHtml(r.trim())}</span>`).join("")}</div>`:""}
          ${m.status?`<div style="margin-bottom:10px;"><span style="background:${m.status==='ACCEPTED'?'rgba(5,150,105,.1)':m.status==='REJECTED'?'rgba(220,38,38,.08)':'var(--bg-2)'};color:${m.status==='ACCEPTED'?'#059669':m.status==='REJECTED'?'#dc2626':'var(--text-3)'};font-size:.68rem;font-weight:700;padding:2px 10px;border-radius:99px;">${m.status}</span></div>`:""}
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            <a href="item-details.html?id=${lost.id}&type=LOST" class="btn-ghost btn btn-sm flex-fill" style="display:inline-flex;align-items:center;justify-content:center;gap:5px;">${EYE_SVG} Lost Item</a>
            <a href="item-details.html?id=${found.id}&type=FOUND" class="btn-ghost btn btn-sm flex-fill" style="display:inline-flex;align-items:center;justify-content:center;gap:5px;">${EYE_SVG} Found Item</a>
            ${currentUser && found.userId !== currentUser.id
              ? `<button class="btn-uni-primary btn btn-sm flex-fill" onclick="contactFromMatch(${found.userId},${lost.id})" style="display:inline-flex;align-items:center;justify-content:center;gap:5px;">${MSG_SVG} Contact</button>` : ""}
          </div>
        </div>
      </div>
    </div>`;
}

function sChip(label, value) {
  if (value===undefined||value===null) return "";
  const v = Math.round(value), c = v>=65?"#059669":v>=40?"#d97706":"var(--text-4)";
  return `<div style="background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r-xs);padding:6px 4px;text-align:center;">
    <div style="font-size:.75rem;font-weight:800;color:${c};">${v}%</div>
    <div style="font-size:.58rem;color:var(--text-4);margin-top:2px;">${label}</div>
  </div>`;
}

async function contactFromMatch(finderUserId, lostItemId) {
  if (!currentUser) { window.location.href="login.html"; return; }
  try {
    const res = await fetch(`${API_BASE}/messages/start`,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({itemId:lostItemId,itemType:"LOST",userOneId:currentUser.id,userTwoId:finderUserId})});
    const conv = await res.json();
    window.location.href = `messages.html?conversationId=${conv.id}`;
  } catch { showToast("Could not start conversation.","error"); }
}
