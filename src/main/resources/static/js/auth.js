/* =========================================================
   UniLost — auth.js
   Handles: Login, OTP Registration (2-step), Forgot Password (3-step)
   ========================================================= */

// ── Shared utility: toggle password visibility ───────────
function togglePwd(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  const svg = btn.querySelector('.eye-icon');
  if (svg) {
    svg.innerHTML = isHidden
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  }
}

// ── Password strength meter ───────────────────────────────
function checkPasswordStrength(pwd, fillId, labelId) {
  const fill  = document.getElementById(fillId);
  const label = document.getElementById(labelId);
  if (!fill || !label) return;

  let score = 0;
  if (pwd.length >= 6)                          score++;
  if (pwd.length >= 10)                         score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd))  score++;
  if (/\d/.test(pwd))                           score++;
  if (/[^A-Za-z0-9]/.test(pwd))                score++;

  const levels = [
    { pct: '0%',   color: 'transparent', text: '' },
    { pct: '25%',  color: '#dc2626',     text: 'Weak' },
    { pct: '50%',  color: '#d97706',     text: 'Fair' },
    { pct: '75%',  color: '#2563eb',     text: 'Good' },
    { pct: '100%', color: '#059669',     text: 'Strong' },
    { pct: '100%', color: '#059669',     text: 'Strong' },
  ];
  const level = levels[Math.min(score, 5)];
  fill.style.width      = pwd.length ? level.pct   : '0%';
  fill.style.background = pwd.length ? level.color : 'transparent';
  label.textContent     = pwd.length ? level.text  : '';
  label.style.color     = level.color;
}

// ── Alert helper ─────────────────────────────────────────
function showAlert(alertId, msgId, message, type = 'error') {
  const box = document.getElementById(alertId);
  const msg = document.getElementById(msgId);
  if (!box || !msg) return;
  box.className = `auth-alert ${type} show`;
  msg.textContent = message;
}
function hideAlert(alertId) {
  const box = document.getElementById(alertId);
  if (box) box.className = 'auth-alert';
}

// ── Button loading state ─────────────────────────────────
const SPIN_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .7s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-4.43"/></svg>`;

function setBtnLoading(btn, text) {
  btn.disabled = true;
  btn.dataset.original = btn.innerHTML;
  btn.innerHTML = `${SPIN_SVG} ${text}`;
}
function resetBtn(btn) {
  btn.disabled = false;
  if (btn.dataset.original) btn.innerHTML = btn.dataset.original;
}

// ── OTP digit-box keyboard + paste handling ───────────────
function wireOtpInputs(rowId) {
  const row    = document.getElementById(rowId);
  if (!row) return;
  const digits = Array.from(row.querySelectorAll('.otp-digit'));

  digits.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(-1);
      inp.classList.toggle('filled', inp.value !== '');
      if (inp.value && i < digits.length - 1) digits[i + 1].focus();
    });

    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && i > 0) {
        digits[i - 1].value = '';
        digits[i - 1].classList.remove('filled');
        digits[i - 1].focus();
      }
      if (e.key === 'ArrowLeft'  && i > 0)              digits[i - 1].focus();
      if (e.key === 'ArrowRight' && i < digits.length - 1) digits[i + 1].focus();
    });

    // Handle paste of full 6-digit code
    inp.addEventListener('paste', e => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      text.split('').slice(0, digits.length).forEach((ch, j) => {
        digits[j].value = ch;
        digits[j].classList.add('filled');
      });
      const nextEmpty = digits.findIndex(d => !d.value);
      (nextEmpty === -1 ? digits[digits.length - 1] : digits[nextEmpty]).focus();
    });
  });
}

function getOtpValue(rowId) {
  const row = document.getElementById(rowId);
  if (!row) return '';
  return Array.from(row.querySelectorAll('.otp-digit')).map(d => d.value).join('');
}

function clearOtpInputs(rowId) {
  const row = document.getElementById(rowId);
  if (!row) return;
  row.querySelectorAll('.otp-digit').forEach(d => {
    d.value = '';
    d.classList.remove('filled');
  });
  const first = row.querySelector('.otp-digit');
  if (first) first.focus();
}

// ── OTP countdown timer ───────────────────────────────────
let _otpTimerInterval = null;

function startOtpTimer(timerValId, totalSeconds) {
  if (_otpTimerInterval) clearInterval(_otpTimerInterval);
  const el = document.getElementById(timerValId);
  if (!el) return;

  let remaining = totalSeconds;
  const tick = () => {
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    el.textContent = `${m}:${s}`;
    el.className = 'timer-val' + (remaining <= 60 ? ' warn' : '');
    if (remaining <= 0) clearInterval(_otpTimerInterval);
    remaining--;
  };
  tick();
  _otpTimerInterval = setInterval(tick, 1000);
}

// ── Resend cooldown ───────────────────────────────────────
let _resendInterval = null;

function startResendCooldown(resendBtnId, cooldownSpanId, cooldownValId, seconds) {
  const btn      = document.getElementById(resendBtnId);
  const span     = document.getElementById(cooldownSpanId);
  const valEl    = document.getElementById(cooldownValId);
  if (!btn) return;

  btn.disabled = true;
  if (span) span.style.display = '';

  let remaining = seconds;
  if (_resendInterval) clearInterval(_resendInterval);

  _resendInterval = setInterval(() => {
    remaining--;
    if (valEl) valEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(_resendInterval);
      btn.disabled = false;
      if (span) span.style.display = 'none';
    }
  }, 1000);
}

// ═══════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!loginForm.checkValidity()) { loginForm.classList.add('was-validated'); return; }

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn      = document.getElementById('loginBtn');

    hideAlert('loginAlert');
    setBtnLoading(btn, 'Signing in…');

    try {
      const res  = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        saveLoggedInUser(data);
        // Admins go to the dashboard, everyone else to the homepage
        window.location.href = data.role === 'ADMIN' ? 'admin.html' : 'index.html';
      } else {
        showAlert('loginAlert', 'loginAlertMsg', data.message || 'Invalid email or password.');
        resetBtn(btn);
      }
    } catch {
      showAlert('loginAlert', 'loginAlertMsg', 'Could not connect to server. Please try again.');
      resetBtn(btn);
    }
  });
}

// ═══════════════════════════════════════════════════════════
// REGISTRATION — single step, no OTP
// ═══════════════════════════════════════════════════════════

const regForm = document.getElementById('regForm');
if (regForm) {
  // Wire password strength meter
  const pwdInput = document.getElementById('regPassword');
  if (pwdInput) {
    pwdInput.addEventListener('input', () =>
      checkPasswordStrength(pwdInput.value, 'pwdStrengthFill', 'pwdStrengthLabel'));
  }

  regForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!regForm.checkValidity()) { regForm.classList.add('was-validated'); return; }

    const fullName    = document.getElementById('fullName').value.trim();
    const email       = document.getElementById('regEmail').value.trim();
    const password    = document.getElementById('regPassword').value;
    const collegeName = document.getElementById('collegeName')?.value.trim() || '';
    const btn         = document.getElementById('registerBtn');

    hideAlert('regAlert');
    setBtnLoading(btn, 'Creating account…');

    try {
      const res  = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, collegeName })
      });
      const data = await res.json();

      if (data.success) {
        showAlert('regAlert', 'regAlertMsg', '✓ Account created! Redirecting to sign in…', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
      } else {
        showAlert('regAlert', 'regAlertMsg', data.message || 'Could not create account.');
        resetBtn(btn);
      }
    } catch {
      showAlert('regAlert', 'regAlertMsg', 'Could not connect to server. Please try again.');
      resetBtn(btn);
    }
  });
}

// ═══════════════════════════════════════════════════════════
// FORGOT PASSWORD — 2-STEP FLOW (email → new password, no OTP)
// ═══════════════════════════════════════════════════════════

let _fpEmail      = '';
let _fpResetToken = '';

// ── Step navigation ───────────────────────────────────────
function fpGoToStep1() {
  ['fpStep1','fpStep2','fpStep3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  setTimeout(() => {
    const s1 = document.getElementById('fpStep1');
    if (s1) s1.classList.add('active');
    updateFpDots(1);
    hideAlert('fpAlert');
  }, 20);
}

function fpGoToStep(n) {
  ['fpStep1','fpStep2','fpStep3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  setTimeout(() => {
    const s = document.getElementById(`fpStep${n}`);
    if (s) s.classList.add('active');
    updateFpDots(n);
  }, 20);
}

function updateFpDots(step) {
  const d = (n) => document.getElementById(`fpDot${n}`);
  const l = (n) => document.getElementById(`fpLine${n}`);
  if (!d(1)) return;
  d(1).className = 'step-dot ' + (step > 1 ? 'done' : 'active');
  if (l(1)) l(1).className = 'step-line ' + (step > 1 ? 'done' : '');
  if (d(2)) d(2).className = 'step-dot ' + (step >= 2 ? (step > 2 ? 'done' : 'active') : '');
}

// ── STEP 1: verify email exists ───────────────────────────
const fpStep1Form = document.getElementById('fpStep1Form');
if (fpStep1Form) {
  fpStep1Form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!fpStep1Form.checkValidity()) { fpStep1Form.classList.add('was-validated'); return; }

    const email = document.getElementById('fpEmail').value.trim();
    const btn   = document.getElementById('fpSendOtpBtn');

    hideAlert('fpAlert');
    setBtnLoading(btn, 'Verifying…');

    try {
      const res  = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (data.success) {
        _fpEmail      = email;
        _fpResetToken = data.resetToken || '';

        if (!_fpResetToken) {
          // Email not registered — show generic message, don't advance
          showAlert('fpAlert', 'fpAlertMsg',
            'If that email is registered, you can reset your password below.', 'success');
          resetBtn(btn);
          return;
        }

        fpGoToStep(2);
        // Wire password strength for new password field
        setTimeout(() => {
          const pwdInput = document.getElementById('fpNewPwd');
          if (pwdInput) {
            pwdInput.addEventListener('input', () =>
              checkPasswordStrength(pwdInput.value, 'fpPwdFill', 'fpPwdLabel'));
            pwdInput.focus();
          }
        }, 80);
      } else {
        showAlert('fpAlert', 'fpAlertMsg', data.message || 'Could not verify email.');
        resetBtn(btn);
      }
    } catch {
      showAlert('fpAlert', 'fpAlertMsg', 'Could not connect to server. Please try again.');
      resetBtn(btn);
    }
  });
}

// ── STEP 2: set new password ──────────────────────────────
const fpStep2Form = document.getElementById('fpStep2Form');
if (fpStep2Form) {
  fpStep2Form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const newPassword     = document.getElementById('fpNewPwd').value;
    const confirmPassword = document.getElementById('fpConfirmPwd').value;
    const btn             = document.getElementById('fpResetBtn');

    hideAlert('fpAlert');

    if (newPassword.length < 6) {
      fpStep2Form.classList.add('was-validated');
      return;
    }
    if (newPassword !== confirmPassword) {
      const feedback = document.getElementById('fpConfirmFeedback');
      document.getElementById('fpConfirmPwd').classList.add('is-invalid');
      if (feedback) feedback.textContent = 'Passwords do not match.';
      return;
    }
    document.getElementById('fpConfirmPwd').classList.remove('is-invalid');

    setBtnLoading(btn, 'Saving…');

    try {
      const res  = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:           _fpEmail,
          resetToken:      _fpResetToken,
          newPassword,
          confirmPassword
        })
      });
      const data = await res.json();

      if (data.success) {
        fpGoToStep(3);
      } else {
        showAlert('fpAlert', 'fpAlertMsg', data.message || 'Could not reset password. Please start over.');
        resetBtn(btn);
      }
    } catch {
      showAlert('fpAlert', 'fpAlertMsg', 'Could not connect. Please try again.');
      resetBtn(btn);
    }
  });
}

// ── Admin login (inline in admin-login.html) ──────────────
const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email    = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const btn      = document.getElementById('adminLoginBtn');
    const alertBox = document.getElementById('adminLoginAlert');
    const alertMsg = document.getElementById('adminLoginMsg');

    if (alertBox) alertBox.classList.add('d-none');
    setBtnLoading(btn, 'Verifying…');

    try {
      const res  = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success && data.role === 'ADMIN') {
        saveLoggedInUser(data);
        window.location.href = 'admin.html';
      } else {
        if (alertMsg) alertMsg.textContent = data.message || 'Access denied.';
        if (alertBox) alertBox.classList.remove('d-none');
        resetBtn(btn);
      }
    } catch {
      if (alertMsg) alertMsg.textContent = 'Could not connect to server.';
      if (alertBox) alertBox.classList.remove('d-none');
      resetBtn(btn);
    }
  });
}
