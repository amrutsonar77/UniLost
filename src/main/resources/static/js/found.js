/* =========================================================
   UniLost – found.js
   Handles the "Report Found Item" form.
   ========================================================= */

(function () {
  const form = document.getElementById("foundItemForm");
  if (!form) return;

  const currentUser = requireLogin();
  populateCategoryOptions(document.getElementById("category"));
  setMaxDate(document.getElementById("date"));
  wireImageUpload("image", "imagePreview", "removeImageBtn", "imageError");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const imageError = validateImageFile(document.getElementById("image").files[0]);
    if (imageError) {
      showImageError(imageError);
      return;
    }

    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.textContent = "Submitting…";

    const formData = buildFormData(currentUser.id);

    try {
      const res = await fetch(`${API_BASE}/found-items`, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        showAlert("success", "✅ Found item reported! Redirecting…");
        form.reset();
        form.classList.remove("was-validated");
        resetImagePreview();
        setTimeout(() => (window.location.href = "found-items.html"), 1400);
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Server error — please try again.");
      }
    } catch (err) {
      showAlert("danger", err.message || "Something went wrong. Please try again.");
      btn.disabled = false;
      btn.textContent = "Submit Found Item Report";
    }
  });

  function buildFormData(userId) {
    const fd = new FormData();
    fd.append("itemName",    document.getElementById("itemName").value.trim());
    fd.append("category",    document.getElementById("category").value);
    fd.append("color",       document.getElementById("color").value.trim());
    fd.append("brand",       document.getElementById("brand").value.trim());
    fd.append("description", document.getElementById("description").value.trim());
    fd.append("location",    document.getElementById("location").value.trim());
    fd.append("date",        document.getElementById("date").value);
    fd.append("additionalDetails", document.getElementById("additionalDetails").value.trim());
    fd.append("userId", userId);
    const file = document.getElementById("image").files[0];
    if (file) fd.append("image", file);
    return fd;
  }

  function showAlert(type, msg) {
    const box = document.getElementById("formAlert");
    box.className = `alert alert-${type}`;
    box.textContent = msg;
    box.classList.remove("d-none");
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function showImageError(msg) {
    const el = document.getElementById("imageError");
    el.textContent = msg;
    el.classList.remove("d-none");
  }

  function resetImagePreview() {
    document.getElementById("imagePreview").style.display = "none";
    document.getElementById("imagePreview").src = "";
    document.getElementById("removeImageBtn").style.display = "none";
    document.getElementById("imageError").classList.add("d-none");
  }
})();
