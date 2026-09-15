/* UniLost — my-reports.js */
const currentUser = requireLogin();
if (!currentUser) throw new Error("Not logged in");
let editModal;
const itemRegistry = {};

const VIEW_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EDIT_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const CHK_SVG  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
const DEL_SVG  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`;

document.addEventListener("DOMContentLoaded", () => {
  populateCategoryOptions(document.getElementById("editCategory"));
  setMaxDate(document.getElementById("editDate"));
  editModal = new bootstrap.Modal(document.getElementById("editModal"));
  loadMyLostItems(); loadMyFoundItems(); wireEditForm();
});

async function loadMyLostItems() {
  showLoading("myLostContainer");
  try { renderMyItems("myLostContainer", await(await fetch(`${API_BASE}/lost-items/user/${currentUser.id}`)).json(), "LOST"); }
  catch { showError("myLostContainer","Could not load your lost items."); }
}
async function loadMyFoundItems() {
  showLoading("myFoundContainer");
  try { renderMyItems("myFoundContainer", await(await fetch(`${API_BASE}/found-items/user/${currentUser.id}`)).json(), "FOUND"); }
  catch { showError("myFoundContainer","Could not load your found items."); }
}

function renderMyItems(containerId, items, type) {
  if (!items||!items.length) {
    showEmpty(containerId, `No ${type==="LOST"?"lost":"found"} reports yet`,
      `Visit the ${type==="LOST"?"Lost":"Found"} Items page to create your first report.`);
    return;
  }
  items.forEach(item => { itemRegistry[`${type}_${item.id}`] = item; });
  const container = document.getElementById(containerId);
  container.innerHTML = items.map(item => `
    <div class="col-xl-3 col-lg-4 col-md-6">
      <div class="card h-100">
        <div class="item-img-wrap">
          <img class="item-image" src="${itemImageOrPlaceholder(item.imagePath)}" alt="${escHtml(item.itemName)}"
               onerror="this.src='https://placehold.co/400x200/F0F0F4/9ca3af?text=No+Image'">
          <div style="position:absolute;top:10px;left:10px;z-index:2;">${statusBadgeHtml(item.status)}</div>
        </div>
        <div class="card-body" style="padding:14px 16px;">
          <h6 style="font-weight:700;font-size:.9rem;margin-bottom:5px;color:var(--text);">${escHtml(item.itemName)}</h6>
          <div style="font-size:.73rem;margin-bottom:11px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
            ${item.category?`<span style="background:rgba(17,20,57,.06);color:var(--text-2);padding:1px 8px;border-radius:99px;font-weight:600;font-size:.65rem;border:1px solid var(--border);">${escHtml(item.category)}</span>`:""}
            <span style="color:var(--text-4);display:flex;align-items:center;gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${item.date||"—"}</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:5px;">
            <a href="item-details.html?id=${item.id}&type=${type}"
               style="flex:1;text-align:center;background:var(--bg-2);color:var(--text-2);font-size:.73rem;font-weight:600;padding:6px 8px;border-radius:var(--r-xs);text-decoration:none;border:1px solid var(--border);display:inline-flex;align-items:center;justify-content:center;gap:4px;">${VIEW_SVG} View</a>
            <button data-item-key="${type}_${item.id}" onclick="openEditModal(this)"
               style="flex:1;background:rgba(124,58,237,.08);color:#7c3aed;font-size:.73rem;font-weight:600;padding:6px 8px;border-radius:var(--r-xs);border:1px solid rgba(124,58,237,.2);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;">${EDIT_SVG} Edit</button>
            ${item.status!=="RECOVERED"?`<button onclick="markRecovered(${item.id},'${type}')"
               style="flex:1;background:rgba(5,150,105,.08);color:#059669;font-size:.73rem;font-weight:600;padding:6px 8px;border-radius:var(--r-xs);border:1px solid rgba(5,150,105,.2);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;">${CHK_SVG} Done</button>`:""}
            <button onclick="deleteItem(${item.id},'${type}')"
               style="flex:1;background:rgba(220,38,38,.08);color:#dc2626;font-size:.73rem;font-weight:600;padding:6px 8px;border-radius:var(--r-xs);border:1px solid rgba(220,38,38,.18);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;">${DEL_SVG} Del</button>
          </div>
        </div>
      </div>
    </div>`).join("");
}

function openEditModal(btn) {
  const key=btn.dataset.itemKey, item=itemRegistry[key]; if(!item) return;
  const [type]=key.split("_");
  document.getElementById("editId").value=item.id; document.getElementById("editType").value=type;
  document.getElementById("editItemName").value=item.itemName||""; document.getElementById("editCategory").value=item.category||"";
  document.getElementById("editColor").value=item.color||""; document.getElementById("editBrand").value=item.brand||"";
  document.getElementById("editDescription").value=item.description||""; document.getElementById("editLocation").value=item.location||"";
  document.getElementById("editDate").value=item.date||""; document.getElementById("editAdditionalDetails").value=item.additionalDetails||"";
  document.getElementById("editAlert").classList.add("d-none"); document.getElementById("editImageError").classList.add("d-none");
  document.getElementById("editImage").value=""; document.getElementById("editForm").classList.remove("was-validated");
  editModal.show();
}

function wireEditForm() {
  document.getElementById("editForm").addEventListener("submit", async e => {
    e.preventDefault();
    const form=document.getElementById("editForm");
    if(!form.checkValidity()){form.classList.add("was-validated");return;}
    const id=document.getElementById("editId").value, type=document.getElementById("editType").value;
    const alertBox=document.getElementById("editAlert"), saveBtn=document.getElementById("editSaveBtn");
    const imgFile=document.getElementById("editImage").files[0];
    if(imgFile){const err=validateImageFile(imgFile);if(err){const el=document.getElementById("editImageError");el.textContent=err;el.classList.remove("d-none");return;}}
    saveBtn.disabled=true; saveBtn.innerHTML=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .7s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-4.43"/></svg> Saving…`;
    const fd=new FormData();
    ["editItemName","editCategory","editColor","editBrand","editDescription","editLocation","editDate","editAdditionalDetails"].forEach(id=>{
      const key=id.replace("edit","").charAt(0).toLowerCase()+id.replace("edit","").slice(1);
      fd.append(key==="itemName"?"itemName":key,document.getElementById(id).value.trim());
    });
    fd.set("itemName",document.getElementById("editItemName").value.trim());
    fd.set("category",document.getElementById("editCategory").value);
    fd.set("color",document.getElementById("editColor").value.trim());
    fd.set("brand",document.getElementById("editBrand").value.trim());
    fd.set("description",document.getElementById("editDescription").value.trim());
    fd.set("location",document.getElementById("editLocation").value.trim());
    fd.set("date",document.getElementById("editDate").value);
    fd.set("additionalDetails",document.getElementById("editAdditionalDetails").value.trim());
    if(imgFile) fd.append("image",imgFile);
    const ep=type==="LOST"?`${API_BASE}/lost-items/${id}`:`${API_BASE}/found-items/${id}`;
    try {
      const res=await fetch(ep,{method:"PUT",body:fd});
      if(!res.ok) throw new Error((await res.json().catch(()=>({}))).message||"Save failed.");
      editModal.hide(); showToast("Changes saved!","success");
      type==="LOST"?loadMyLostItems():loadMyFoundItems();
    } catch(err){
      alertBox.style.cssText="background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.2);color:#dc2626;border-radius:var(--r-sm);padding:10px 14px;font-size:.85rem;";
      alertBox.textContent=err.message||"Could not save."; alertBox.classList.remove("d-none");
    } finally{saveBtn.disabled=false;saveBtn.innerHTML=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Save Changes`;}
  });
}

async function markRecovered(id,type){
  if(!confirm("Mark as recovered?"))return;
  const ep=type==="LOST"?`${API_BASE}/lost-items/${id}/recover`:`${API_BASE}/found-items/${id}/recover`;
  await fetch(ep,{method:"PUT"}); showToast("Marked as recovered!","success");
  type==="LOST"?loadMyLostItems():loadMyFoundItems();
}
async function deleteItem(id,type){
  if(!confirm("Delete this report permanently?"))return;
  const ep=type==="LOST"?`${API_BASE}/lost-items/${id}`:`${API_BASE}/found-items/${id}`;
  await fetch(ep,{method:"DELETE"}); showToast("Report deleted.","success");
  type==="LOST"?loadMyLostItems():loadMyFoundItems();
}
