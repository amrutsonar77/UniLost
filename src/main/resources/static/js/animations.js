/* =========================================================
   UniLost — animations.js
   AdMaster-style animation stack:
     1. Custom cursor (dot + trailing ring)
     2. Magnetic buttons
     3. Scroll-reveal
     4. Floating particles
     5. Count-up stats
     6. Card 3D tilt
     7. Hero spotlight follow
   ========================================================= */

(function () {
  'use strict';

  // ── Skip on mobile / touch-only devices ─────────────────
  const isTouch = () => window.matchMedia('(hover: none)').matches;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ════════════════════════════════════════════════════════
     1. CURSOR — disabled, using default browser cursor
  ════════════════════════════════════════════════════════ */
  function initCursor() {
    // Custom cursor removed — browser default used
  }

  /* ════════════════════════════════════════════════════════
     2. MAGNETIC BUTTONS
     When cursor is within RADIUS px of a button, the button
     nudges toward the cursor. Snaps back on mouseout.
  ════════════════════════════════════════════════════════ */
  function initMagnetic() {
    if (isTouch() || reduced()) return;

    const RADIUS   = 80;   // px — activation distance
    const STRENGTH = 0.35; // 0 = no movement, 1 = full follow

    const sel = '.btn-primary, .btn-uni-primary, .btn-nav-cta, ' +
                '.btn-hero-green, .btn-hero-outline, .btn-auth, ' +
                '.btn-ghost, .btn-outline-green';

    function attachMagnetic(btn) {
      if (btn._magneticWired) return;
      btn._magneticWired = true;

      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < RADIUS) {
          const tx = dx * STRENGTH;
          const ty = dy * STRENGTH;
          btn.style.transform = `translate(${tx}px, ${ty}px)`;
        }
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    }

    // Wire existing buttons
    document.querySelectorAll(sel).forEach(attachMagnetic);

    // Wire dynamically added buttons (navbar renders after DOMContentLoaded)
    const obs = new MutationObserver(() => {
      document.querySelectorAll(sel).forEach(attachMagnetic);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  /* ════════════════════════════════════════════════════════
     3. SCROLL-REVEAL
     Tags cards, section headings, and stat cells with
     .sr-init .sr-up/left/right then adds .sr-visible
     when they cross into the viewport.
  ════════════════════════════════════════════════════════ */
  function initScrollReveal() {
    if (reduced()) return;
    if (typeof IntersectionObserver === 'undefined') return;

    // Elements to reveal automatically (not already tagged)
    const AUTO_SEL = [
      '.card:not(.sr-init)',
      '.hiw-card:not(.sr-init)',
      '.admin-stat-card:not(.sr-init)',
      '.stat-cell:not(.sr-init)',
      '.filter-bar:not(.sr-init)',
      '.section-header:not(.sr-init)',
      '.report-card:not(.sr-init)',
      '.report-tips:not(.sr-init)',
      '.auth-card:not(.sr-init)',
      '.profile-hero:not(.sr-init)',
      '.form-section:not(.sr-init)',
    ].join(', ');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('sr-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    function tagAndObserve(el, dir) {
      if (el.classList.contains('sr-init')) return;
      el.classList.add('sr-init', dir || 'sr-up');
      observer.observe(el);
    }

    // Auto-tag elements
    document.querySelectorAll(AUTO_SEL).forEach((el, i) => {
      // Alternate directions for visual variety
      const dirs = ['sr-up', 'sr-up', 'sr-scale'];
      tagAndObserve(el, dirs[i % dirs.length]);
    });

    // Stagger grid children
    document.querySelectorAll('.row.g-4, .row.g-3').forEach(row => {
      if (row.classList.contains('sr-stagger')) return;
      row.classList.add('sr-stagger');
      row.querySelectorAll(':scope > [class*="col-"]').forEach((col, i) => {
        col.classList.add('sr-init', 'sr-up');
        col.style.transitionDelay = (i * 0.07) + 's';
        observer.observe(col);
      });
    });

    // Re-run for dynamically added content
    const mutObs = new MutationObserver(() => {
      document.querySelectorAll(AUTO_SEL).forEach((el, i) => {
        tagAndObserve(el, 'sr-up');
      });
    });
    mutObs.observe(document.body, { childList: true, subtree: true });
  }

  /* ════════════════════════════════════════════════════════
  /* ════════════════════════════════════════════════════════
     5. COUNT-UP STATS
     Finds .stat-cell .n and any [data-count] and animates
     the number rolling up when scrolled into view.
     Also watches for content changes (async API data).
  ════════════════════════════════════════════════════════ */
  function initCountUp() {
    if (typeof IntersectionObserver === 'undefined') return;

    function animateCount(el) {
      const raw = el.textContent.replace(/[^0-9]/g, '');
      const end = parseInt(raw, 10);
      if (isNaN(end) || end === 0 || el._counted) return;
      el._counted = true;

      const DURATION = 1400;
      const start    = performance.now();
      el.classList.add('count-up', 'counting');

      function step(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / DURATION, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * end).toLocaleString();
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = end.toLocaleString();
          el.classList.remove('counting');
        }
      }
      requestAnimationFrame(step);
    }

    const targets = document.querySelectorAll(
      '.stat-cell .n, .admin-stat-card .num, [data-count]'
    );

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    targets.forEach(el => obs.observe(el));

    // Re-trigger when home.js fills in API data (text changes from "—" to a number)
    const mutObs = new MutationObserver(mutations => {
      mutations.forEach(m => {
        const el = m.target;
        if (el._counted) return;
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (inView) animateCount(el);
        else { el._counted = false; obs.observe(el); }
      });
    });
    targets.forEach(el => mutObs.observe(el, { childList: true, characterData: true, subtree: true }));
  }

  /* ════════════════════════════════════════════════════════
     6. CARD 3D TILT
     Adds a subtle 3D rotate on mousemove for .card elements
     and .hiw-card elements.
  ════════════════════════════════════════════════════════ */
  function initTilt() {
    if (isTouch() || reduced()) return;

    const MAX_TILT = 6; // degrees

    function attachTilt(el) {
      if (el._tiltWired) return;
      el._tiltWired = true;
      el.classList.add('tilt-card');

      el.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = (e.clientX - cx) / (rect.width  / 2);
        const dy   = (e.clientY - cy) / (rect.height / 2);
        const tx   = -dy * MAX_TILT;
        const ty   =  dx * MAX_TILT;

        el.style.transform = `perspective(700px) rotateX(${tx}deg) rotateY(${ty}deg) translateZ(4px)`;
        el.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width  * 100).toFixed(1)}%`);
        el.style.setProperty('--my', `${((e.clientY - rect.top)  / rect.height * 100).toFixed(1)}%`);
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    }

    const SEL = '.card, .hiw-card, .admin-stat-card, .stat-sm';
    document.querySelectorAll(SEL).forEach(attachTilt);

    // Wire dynamically added cards
    const obs = new MutationObserver(() => {
      document.querySelectorAll(SEL).forEach(attachTilt);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  /* ════════════════════════════════════════════════════════
     7. HERO SPOTLIGHT
     A soft glow follows the cursor inside .hero-outer.
  ════════════════════════════════════════════════════════ */
  function initSpotlight() {
    if (isTouch() || reduced()) return;

    const hero = document.querySelector('.hero-outer, .hero');
    if (!hero) return;

    // Inject spotlight layer
    const spot = document.createElement('div');
    spot.className = 'cursor-spotlight';
    hero.style.position = 'relative';
    hero.insertBefore(spot, hero.firstChild);

    hero.addEventListener('mousemove', e => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(2);
      const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(2);
      spot.style.setProperty('--sx', x + '%');
      spot.style.setProperty('--sy', y + '%');
    });
  }

  /* ════════════════════════════════════════════════════════
     BOOT — run everything after DOM is ready
  ════════════════════════════════════════════════════════ */
  function boot() {
    initCursor();
    initScrollReveal();
    initMagnetic();
    initCountUp();
    initTilt();
    initSpotlight();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
