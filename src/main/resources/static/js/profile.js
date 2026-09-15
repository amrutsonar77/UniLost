/* UniLost — profile.js */
const currentUser = requireLogin();
if (!currentUser) throw new Error("Not logged in");

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res=await fetch(`${API_BASE}/profile/${currentUser.id}`);
    if(!res.ok) throw new Error();
    const p=await res.json();
    document.getElementById("fullName").value    = p.fullName    || "";
    document.getElementById("email").value       = p.email       || "";
    document.getElementById("collegeName").value = p.collegeName || "";
    const initial=(p.fullName||"?").charAt(0).toUpperCase();
    document.getElementById("profileAvatar").textContent      = initial;
    document.getElementById("profileHeaderName").textContent  = p.fullName  || "Student";
    document.getElementById("profileHeaderEmail").textContent = p.email     || "";
    document.getElementById("profileHeaderRole").textContent  = p.role      || "STUDENT";
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v??'—';};
    set("statLostReports",   p.totalLostReports);
    set("statFoundReports",  p.totalFoundReports);
    set("statRecoveredItems",p.itemsRecovered);
  } catch { showToast("Could not load profile.","error"); }
});

document.getElementById("profileForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form=document.getElementById("profileForm");
  if(!form.checkValidity()){form.classList.add("was-validated");return;}
  const alertBox=document.getElementById("profileAlert");
  const btn=document.getElementById("saveProfileBtn");
  btn.disabled=true;
  btn.innerHTML=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .7s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-4.43"/></svg> Saving…`;
  try {
    const res=await fetch(`${API_BASE}/profile/${currentUser.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({fullName:document.getElementById("fullName").value.trim(),collegeName:document.getElementById("collegeName").value.trim()})});
    if(!res.ok) throw new Error("Save failed.");
    const updated=await res.json();
    const u=getLoggedInUser(); u.fullName=updated.fullName; saveLoggedInUser(u);
    document.getElementById("profileHeaderName").textContent=updated.fullName;
    document.getElementById("profileAvatar").textContent=(updated.fullName||"?").charAt(0).toUpperCase();
    alertBox.style.cssText="background:rgba(0,234,100,.1);border:1px solid var(--green-bdr);color:var(--green);border-radius:var(--r-sm);padding:10px 14px;font-size:.85rem;display:flex;align-items:center;gap:8px;margin-bottom:16px;";
    alertBox.innerHTML=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Profile updated!`;
    alertBox.classList.remove("d-none");
    showToast("Profile saved!","success");
  } catch {
    alertBox.style.cssText="background:rgba(248,81,73,.1);border:1px solid rgba(248,81,73,.25);color:#f85149;border-radius:var(--r-sm);padding:10px 14px;font-size:.85rem;display:flex;align-items:center;gap:8px;margin-bottom:16px;";
    alertBox.textContent="Could not save changes. Please try again.";
    alertBox.classList.remove("d-none");
  } finally {
    btn.disabled=false;
    btn.innerHTML=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Save Changes`;
  }
});
