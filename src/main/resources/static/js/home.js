/* UniLost — home.js */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [lostRes, foundRes, matchRes] = await Promise.all([
      fetch(`${API_BASE}/lost-items`),
      fetch(`${API_BASE}/found-items`),
      fetch(`${API_BASE}/matches`)
    ]);
    const lost    = await lostRes.json();
    const found   = await foundRes.json();
    const matches = matchRes.ok ? await matchRes.json() : [];

    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set("statLost",      lost.length);
    set("statFound",     found.length);
    set("statRecovered", lost.filter(i=>i.status==="RECOVERED").length + found.filter(i=>i.status==="RECOVERED").length);
    set("statMatches",   matches.length);

    renderRecent(lost, found);
  } catch {
    const c = document.getElementById("recentItemsContainer");
    if (c) c.innerHTML = `<div class="col-12" style="text-align:center;padding:32px;color:#dc2626;">Could not load items. Is the backend running?</div>`;
  }
});

function renderRecent(lost, found) {
  const c = document.getElementById("recentItemsContainer");
  if (!c) return;

  const all = [
    ...lost.map(i  => ({...i, kind:"LOST"})),
    ...found.map(i => ({...i, kind:"FOUND"}))
  ].sort((a,b) => b.id - a.id).slice(0,6);

  if (!all.length) {
    c.innerHTML = `
      <div class="col-12" style="text-align:center;padding:56px 24px;">
        <div style="font-size:3rem;margin-bottom:14px;">📭</div>
        <h6 style="color:#6b7280;font-weight:700;margin-bottom:6px;">No items reported yet</h6>
        <p style="color:#9ca3af;font-size:.85rem;">Be the first to report a lost or found item.</p>
      </div>`;
    return;
  }

  c.innerHTML = all.map(item => {
    const isLost   = item.kind === "LOST";
    const img      = item.imagePath ? item.imagePath : `https://placehold.co/400x190/F0F0F4/9ca3af?text=No+Image`;
    const statusBg = item.status==="RECOVERED" ? "rgba(5,150,105,.1)"  : item.status==="MATCHED" ? "rgba(217,119,6,.1)" : "rgba(17,20,57,.05)";
    const statusCl = item.status==="RECOVERED" ? "#059669"             : item.status==="MATCHED" ? "#d97706"            : "#6b7280";
    const statusBdr= item.status==="RECOVERED" ? "rgba(5,150,105,.2)"  : item.status==="MATCHED" ? "rgba(217,119,6,.2)" : "rgba(17,20,57,.12)";

    return `
      <div class="col-lg-4 col-md-6">
        <div class="item-card">
          <div class="item-card-img-wrap">
            <img src="${img}" alt="${escHtml(item.itemName)}"
                 onerror="this.src='https://placehold.co/400x190/F0F0F4/9ca3af?text=No+Image'">
            <div class="item-img-overlay"></div>
            <div style="position:absolute;top:12px;left:12px;">
              <span class="kind-tag ${isLost?'kind-lost':'kind-found'}">${item.kind}</span>
            </div>
            <div style="position:absolute;top:12px;right:12px;">
              <span style="background:${statusBg};border:1px solid ${statusBdr};color:${statusCl};font-size:.6rem;font-weight:700;padding:2px 8px;border-radius:99px;">${item.status}</span>
            </div>
          </div>
          <div class="item-card-body">
            <h6 style="font-weight:700;font-size:.92rem;color:#111439;margin-bottom:7px;">${escHtml(item.itemName)}</h6>
            <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:9px;">
              ${item.category ? `<span class="item-tag">${escHtml(item.category)}</span>` : ""}
              ${item.color    ? `<span class="item-tag item-tag-gray">🎨 ${escHtml(item.color)}</span>` : ""}
              ${item.brand    ? `<span class="item-tag item-tag-gray">${escHtml(item.brand)}</span>` : ""}
            </div>
            <p style="font-size:.78rem;color:#6b7280;margin-bottom:10px;line-height:1.5;">
              ${escHtml((item.description||"").substring(0,72))}${(item.description||"").length>72?"…":""}
            </p>
            <div style="font-size:.73rem;color:#9ca3af;display:flex;flex-direction:column;gap:3px;">
              <span>📍 ${escHtml(item.location||"—")}</span>
              <span>📅 ${item.date||"—"}</span>
            </div>
          </div>
          <div class="item-card-footer">
            <a href="item-details.html?id=${item.id}&type=${item.kind}" class="btn-view">
              View Details →
            </a>
          </div>
        </div>
      </div>`;
  }).join("");
}
