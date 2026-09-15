/* UniLost — messages.js */
const currentUser = requireLogin();
if (!currentUser) throw new Error("Not logged in");

let activeConversationId = null;
let activeOtherName      = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadConversations();
  const preselect = new URLSearchParams(window.location.search).get("conversationId");
  if (preselect) openConversation(Number(preselect), null);
});

async function loadConversations() {
  const listEl = document.getElementById("convList");
  listEl.innerHTML = `<div style="padding:24px;text-align:center;"><div class="spinner-uni"></div></div>`;
  try {
    const convs = await (await fetch(`${API_BASE}/messages/conversations/${currentUser.id}`)).json();
    if (!convs||!convs.length) {
      listEl.innerHTML = `<div style="padding:24px 16px;text-align:center;color:var(--text-3);">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-4);margin-bottom:10px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <p style="font-size:.82rem;line-height:1.6;margin:0;">No conversations yet.<br>Go to an item page and click "Contact" to start one.</p>
      </div>`;
      return;
    }
    listEl.innerHTML = convs.map(c => {
      const initials = (c.otherUserName||"?").charAt(0).toUpperCase();
      const lastMsg  = (c.lastMessage||"No messages yet").substring(0,36);
      const typeLabel = c.itemType==="LOST" ? "Lost item" : "Found item";
      const unread   = c.unreadCount > 0
        ? `<span class="conv-unread-badge">${c.unreadCount}</span>` : "";
      return `
        <div class="conv-row" data-id="${c.conversationId}"
             onclick="openConversation(${c.conversationId},'${escHtml(c.otherUserName||"Student")}')">
          <div class="conv-avatar">${initials}</div>
          <div style="flex:1;min-width:0;">
            <div class="conv-name">${escHtml(c.otherUserName||"Student")}</div>
            <div class="conv-sub" style="color:var(--green);font-size:.7rem;">${typeLabel}</div>
            <div class="conv-sub">${escHtml(lastMsg)}</div>
          </div>
          ${unread}
        </div>`;
    }).join("");
  } catch {
    listEl.innerHTML = `<p style="color:var(--danger);font-size:.82rem;padding:16px;">Could not load conversations.</p>`;
  }
}

async function openConversation(id, name) {
  activeConversationId = id;
  activeOtherName      = name || activeOtherName || "Student";

  document.querySelectorAll(".conv-row").forEach(el =>
    el.classList.toggle("active", Number(el.dataset.id) === id));

  const header = document.getElementById("chatHeader");
  header.classList.remove("d-none");
  header.innerHTML = `
    <div class="conv-avatar" style="width:30px;height:30px;font-size:.7rem;">${activeOtherName.charAt(0).toUpperCase()}</div>
    <div>
      <div style="font-weight:700;font-size:.88rem;">${escHtml(activeOtherName)}</div>
      <div style="font-size:.7rem;color:var(--green);display:flex;align-items:center;gap:4px;">
        <span style="width:6px;height:6px;background:var(--green);border-radius:50%;display:inline-block;"></span>
        Active conversation
      </div>
    </div>`;

  document.getElementById("chatMessages").classList.remove("d-none");
  document.getElementById("chatInputRow").classList.remove("d-none");
  document.getElementById("chatWelcome").classList.add("d-none");

  const chatBox = document.getElementById("chatMessages");
  chatBox.innerHTML = `<div style="display:flex;justify-content:center;padding:32px;"><div class="spinner-uni"></div></div>`;

  fetch(`${API_BASE}/messages/read/${id}/${currentUser.id}`,{method:"PUT"}).catch(()=>{});

  try {
    const msgs = await (await fetch(`${API_BASE}/messages/conversation/${id}`)).json();
    renderMessages(msgs);
    loadConversations();
  } catch {
    chatBox.innerHTML = `<p style="color:var(--danger);text-align:center;padding:32px;font-size:.85rem;">Could not load messages.</p>`;
  }
}

function renderMessages(msgs) {
  const box = document.getElementById("chatMessages");
  if (!msgs||!msgs.length) {
    box.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-3);">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-4);margin-bottom:12px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <p style="font-size:.85rem;">No messages yet — say hello!</p>
    </div>`;
    return;
  }
  box.innerHTML = msgs.map(m => {
    const mine = m.senderId === currentUser.id;
    const time = formatMsgTime(m.sentAt);
    return `<div class="chat-bubble ${mine?"mine":"theirs"}"><div>${escHtml(m.messageText)}</div><div class="chat-time">${time}</div></div>`;
  }).join("");
  box.scrollTop = box.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const text  = input.value.trim();
  if (!text||!activeConversationId) return;
  input.value = "";

  const box    = document.getElementById("chatMessages");
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble mine";
  bubble.innerHTML = `<div>${escHtml(text)}</div><div class="chat-time">Sending…</div>`;
  box.appendChild(bubble);
  box.scrollTop = box.scrollHeight;

  try {
    await fetch(`${API_BASE}/messages/send`,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({conversationId:activeConversationId,senderId:currentUser.id,messageText:text})});
    const msgs = await (await fetch(`${API_BASE}/messages/conversation/${activeConversationId}`)).json();
    renderMessages(msgs);
  } catch { bubble.style.opacity=".4"; showToast("Message failed.","error"); }
}

document.addEventListener("keydown", e => {
  if (e.key==="Enter" && document.activeElement.id==="chatInput") { e.preventDefault(); sendChatMessage(); }
});

function formatMsgTime(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleString([],{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"short"}); }
  catch { return ""; }
}
