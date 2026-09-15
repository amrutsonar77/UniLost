/* UniLost — lost-list.js */
const PIN_SVG  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const CAL_SVG  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;

document.addEventListener("DOMContentLoaded", () => {
  populateCategoryOptions(document.getElementById("categoryFilter"), true);
  const p = new URLSearchParams(window.location.search).get("search");
  if (p) { document.getElementById("searchInput").value = p; searchLostItems(); } else loadLostItems();
});

async function loadLostItems() {
  showLoading("lostItemsContainer");
  try { renderLostItems(await (await fetch(`${API_BASE}/lost-items`)).json()); }
  catch { showError("lostItemsContainer","Could not load items. Is the backend running?"); }
}

async function searchLostItems() {
  const p = new URLSearchParams();
  const kw=document.getElementById("searchInput").value.trim(), cat=document.getElementById("categoryFilter").value,
        st=document.getElementById("statusFilter").value, col=document.getElementById("colorFilter").value.trim(),
        loc=document.getElementById("locationFilter").value.trim();
  if(kw)p.append("keyword",kw);if(cat)p.append("category",cat);if(st)p.append("status",st);
  if(col)p.append("color",col);if(loc)p.append("location",loc);
  showLoading("lostItemsContainer");
  try { renderLostItems(await(await fetch(`${API_BASE}/lost-items/search?${p}`)).json(),true); }
  catch { showError("lostItemsContainer","Search failed."); }
}

function resetLostFilters() {
  ["searchInput","colorFilter","locationFilter"].forEach(id=>{const e=document.getElementById(id);if(e)e.value="";});
  ["categoryFilter","statusFilter"].forEach(id=>{const e=document.getElementById(id);if(e)e.value="";});
  loadLostItems();
}

function renderLostItems(items, isSearch=false) {
  const info=document.getElementById("resultsInfo");
  if(info) info.textContent = items.length ? `${items.length} result${items.length!==1?"s":""}` : "";
  if(!items||!items.length){ showEmpty("lostItemsContainer", isSearch?"No items match your search":"No lost items yet", isSearch?"Try different filters.":"Be the first to report one."); return; }
  document.getElementById("lostItemsContainer").innerHTML = items.map(i=>`
    <div class="col-xl-3 col-lg-4 col-md-6">
      <div class="card h-100" style="cursor:pointer;" onclick="window.location='item-details.html?id=${i.id}&type=LOST'">
        <div class="item-img-wrap">
          <img class="item-image" src="${itemImageOrPlaceholder(i.imagePath)}" alt="${escHtml(i.itemName)}"
               onerror="this.src='https://placehold.co/400x200/F0F0F4/9ca3af?text=No+Image'">
          <div style="position:absolute;top:10px;left:10px;z-index:2;">${statusBadgeHtml(i.status)}</div>
        </div>
        <div class="card-body d-flex flex-column" style="padding:15px 17px;">
          <h6 style="font-weight:700;font-size:.92rem;margin-bottom:8px;color:var(--text);">${escHtml(i.itemName)}</h6>
          <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:9px;">
            ${i.category?`<span style="background:rgba(17,20,57,.06);color:var(--text-2);font-size:.65rem;font-weight:700;padding:2px 9px;border-radius:99px;border:1px solid var(--border);">${escHtml(i.category)}</span>`:""}
            ${i.color?`<span style="background:var(--bg-2);color:var(--text-3);font-size:.65rem;font-weight:600;padding:2px 9px;border-radius:99px;border:1px solid var(--border);">${escHtml(i.color)}</span>`:""}
            ${i.brand?`<span style="background:var(--bg-2);color:var(--text-3);font-size:.65rem;font-weight:600;padding:2px 9px;border-radius:99px;border:1px solid var(--border);">${escHtml(i.brand)}</span>`:""}
          </div>
          <p style="font-size:.78rem;color:var(--text-3);flex:1;margin-bottom:10px;line-height:1.5;">${escHtml((i.description||"").substring(0,75))}${(i.description||"").length>75?"…":""}</p>
          <div style="font-size:.75rem;color:var(--text-4);display:flex;flex-direction:column;gap:3px;margin-bottom:13px;">
            <span style="display:flex;align-items:center;gap:4px;color:var(--text-3);">${PIN_SVG} ${escHtml(i.location||"—")}</span>
            <span style="display:flex;align-items:center;gap:4px;">${CAL_SVG} ${i.date||"—"}</span>
          </div>
          <a href="item-details.html?id=${i.id}&type=LOST" class="btn-uni-primary btn btn-sm w-100" style="justify-content:center;" onclick="event.stopPropagation()">
            View Details &amp; AI Matches
          </a>
        </div>
      </div>
    </div>`).join("");
}
