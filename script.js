/* ============================================================
   Portfolio — interactions
   Direction : supervision réseau. La motion sert à raconter
   (le système qui démarre) ou à signaler un état — jamais
   à décorer. Tout est désactivé sous prefers-reduced-motion.
   ============================================================ */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---- Spotlight qui suit la souris sur les cartes ---- */
  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    $$('.card, .apropos-bloc, .competence-bloc').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  /* ---- Horloge Paris (footer) ---- */
  const clock = $('#clock');
  if (clock) {
    const render = () => {
      try {
        const t = new Date().toLocaleTimeString('fr-FR', {
          timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        clock.textContent = '🕑 ' + t + ' — Paris';
      } catch (e) {
        clock.textContent = '🕑 ' + new Date().toLocaleTimeString('fr-FR');
      }
    };
    render();
    setInterval(render, 1000);
  }

  /* ---- Easter egg : code Konami → mode incident ---- */
  (function konami() {
    const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let pos = 0;
    const toast = $('#incidentToast');
    window.addEventListener('keydown', (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = (k === seq[pos]) ? pos + 1 : (k === seq[0] ? 1 : 0);
      if (pos === seq.length) {
        pos = 0;
        document.body.classList.add('incident');
        if (toast) { toast.classList.add('show'); }
        setTimeout(() => {
          document.body.classList.remove('incident');
          if (toast) toast.classList.remove('show');
        }, 2600);
      }
    });
  })();

  /* ---- Thème clair/sombre (persisté) ---- */
  (function theme() {
    const root = document.documentElement;
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) {}
    if (!saved) {
      saved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', saved);
    const btn = $('#themeToggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
      });
    }
  })();

  /* ---- Copier au clic (email / tel) ---- */
  $$('.copyable').forEach(el => {
    el.addEventListener('click', (ev) => {
      if (ev.target.tagName === 'A') return; // laisser mailto/tel marcher
      const txt = el.dataset.copy || '';
      const done = () => { el.classList.add('copied'); setTimeout(() => el.classList.remove('copied'), 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(done).catch(() => {});
      }
    });
  });

  /* ---- Scroll-to-top ---- */
  const topBtn = $('#scrollTop');
  if (topBtn) {
    let t = false;
    const onScroll = () => {
      if (!t) { t = true; requestAnimationFrame(() => {
        topBtn.classList.toggle('show', window.scrollY > 500);
        t = false;
      }); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* ---- Barre de progression de lecture ---- */
  const bar = $('.read-progress');
  if (bar) {
    let ticking = false;
    const update = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      bar.style.width = (Math.min(1, Math.max(0, scrolled)) * 100).toFixed(2) + '%';
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---- Nav active selon la page ---- */
  const here = (location.pathname.split('/').pop() || 'index.html');
  $$('.nav-links a').forEach(a => {
    const hrefFile = (a.getAttribute('href') || '').split('/').pop() || 'index.html';
    if (hrefFile === here || (here === '' && hrefFile === 'index.html')) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
  });

  /* ---- Flux terminal générique (data-feed) ---- */
  $$('[data-feed]').forEach(feed => {
    const lines = [
      '[CVE-2026-3148] severity HIGH — patch dispo',
      '[ANSSI] nouveau bulletin de sécurité',
      '[RSS] LLM : nouveau modèle annoncé',
      '[r/sysadmin] retour d\u2019xp supervision',
      '[CERT-FR] alerte ransomware en cours',
      '[RSS] protocole MCP : mise à jour'
    ];
    const caret = '<span class="caret" aria-hidden="true"></span>';
    if (reduced) { feed.innerHTML = lines[0] + caret; return; }
    let li = 0, ci = 0, deleting = false;
    const tick = () => {
      const full = lines[li];
      if (!deleting) {
        ci++;
        feed.innerHTML = full.slice(0, ci) + caret;
        if (ci >= full.length) { deleting = true; setTimeout(tick, 1600); return; }
        setTimeout(tick, 26);
      } else {
        ci--;
        feed.innerHTML = full.slice(0, ci) + caret;
        if (ci <= 0) { deleting = false; li = (li + 1) % lines.length; setTimeout(tick, 260); return; }
        setTimeout(tick, 11);
      }
    };
    setTimeout(tick, 400);
  });

  /* ---- Reveal au scroll (avec filets de sécurité) ---- */
  const revealables = $$('.reveal');
  if (revealables.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      revealables.forEach(el => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
      revealables.forEach(el => io.observe(el));

      // Filet 1 : ce qui est déjà visible au chargement s'affiche
      const vh = window.innerHeight || document.documentElement.clientHeight;
      revealables.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) el.classList.add('in');
      });
      // Filet 2 : jamais de contenu caché — tout devient visible après 3s
      setTimeout(() => revealables.forEach(el => el.classList.add('in')), 3000);
    }
  }

  /* ---- Compteur qui s'incrémente (stats certifications) ---- */
  const countEls = $$('[data-count]');
  if (countEls.length) {
    const animateCount = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      if (reduced || !Number.isFinite(target)) { el.textContent = target + suffix; return; }
      const dur = 900, start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window && !reduced) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { animateCount(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.4 });
      countEls.forEach(el => io.observe(el));
    } else {
      countEls.forEach(animateCount);
    }
  }

  /* ============================================================
     HERO — séquence de boot (le moment mémorable du chargement)
     ============================================================ */
  const heroStage = $('.hero-stage');
  const panel = $('#statusPanel');
  const rows = panel ? $$('.status-row', panel) : [];

  if (heroStage) {
    if (reduced) {
      // Pas d'orchestration : tout est posé immédiatement
      heroStage.classList.add('played');
      rows.forEach(r => r.classList.add('online'));
    } else {
      // 1. Le hero se met en place
      requestAnimationFrame(() => requestAnimationFrame(() => heroStage.classList.add('played')));
      // 2. Les services "s'allument" un par un, après l'arrivée du panneau
      rows.forEach((row, i) => {
        setTimeout(() => row.classList.add('online'), 600 + i * 260);
      });
    }
  }

  /* ---- Uptime qui tourne (réintroduit le thème supervision) ---- */
  const uptimeEl = $('#uptime');
  if (uptimeEl) {
    const start = Date.now();
    const pad = (n) => String(n).padStart(2, '0');
    const render = () => {
      const s = Math.floor((Date.now() - start) / 1000);
      uptimeEl.textContent = `uptime ${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
    };
    render();
    setInterval(render, 1000);
  }

  /* ---- Logs façon terminal ---- */
  const logEl = $('#statusLog');
  if (logEl) {
    const lines = [
      'check centreon-srv… 200 OK (12ms)',
      'sync veille-rss… 6 nouveaux articles',
      'build projet-2… en cours (encore un peu de patience)',
      'ping portfolio.git… pong',
      'scan ports… aucune anomalie'
    ];
    if (reduced) {
      logEl.textContent = lines[0];
    } else {
      let li = 0, ci = 0, deleting = false;
      const startDelay = heroStage ? 600 + rows.length * 260 + 200 : 400;
      const tick = () => {
        const full = lines[li];
        if (!deleting) {
          ci++;
          logEl.textContent = full.slice(0, ci);
          if (ci >= full.length) { deleting = true; setTimeout(tick, 1800); return; }
          setTimeout(tick, 28);
        } else {
          ci--;
          logEl.textContent = full.slice(0, ci);
          if (ci <= 0) { deleting = false; li = (li + 1) % lines.length; setTimeout(tick, 300); return; }
          setTimeout(tick, 12);
        }
      };
      setTimeout(tick, startDelay);
    }
  }

  /* ============================================================
     Réseau animé dans le hero (canvas) — ambiance, gérée proprement
     ============================================================ */
  const net = $('.hero-net');
  if (net && !reduced) {
    const canvas = document.createElement('canvas');
    net.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let w, h, nodes, raf = null, running = false;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function size() {
      w = net.clientWidth; h = net.clientHeight;
      canvas.width = w * DPR; canvas.height = h * DPR;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const count = Math.max(16, Math.min(42, Math.round(w / 30)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        r: Math.random() * 1.8 + 1.2
      }));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < 120) {
            ctx.strokeStyle = `rgba(37, 99, 235, ${0.16 * (1 - d / 120)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; frame(); } }
    function stop()  { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    size();
    start();

    let to;
    window.addEventListener('resize', () => {
      clearTimeout(to);
      to = setTimeout(() => { stop(); size(); start(); }, 200);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else start();
    });
  }
})();
