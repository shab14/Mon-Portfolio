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

  /* ---- Spotlight + tilt 3D qui suivent la souris sur les cartes ---- */
  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    const MAXT = 5; // amplitude du tilt en degrés
    $$('.card, .apropos-bloc, .competence-bloc, .contact-card').forEach(card => {
      const tiltable = card.classList.contains('card') || card.classList.contains('contact-card');
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
        if (tiltable) {
          const ry = (px - 0.5) * 2 * MAXT;
          const rx = (0.5 - py) * 2 * MAXT;
          // inline-style → prime sur les règles :hover, donc pas de conflit
          card.style.transform =
            `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-4px)`;
        }
      });
      if (tiltable) {
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
      }
    });
  }

  /* ---- Boutons magnétiques (CTA principal) ---- */
  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    const STR = 0.28, MAX = 10;
    $$('.btn-primary, .btn-outline, .contact-soc').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        let dx = (e.clientX - (r.left + r.width / 2)) * STR;
        let dy = (e.clientY - (r.top + r.height / 2)) * STR;
        dx = Math.max(-MAX, Math.min(MAX, dx));
        dy = Math.max(-MAX, Math.min(MAX, dy));
        btn.style.transform = `translate(${dx.toFixed(1)}px, ${(dy - 2).toFixed(1)}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
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

  /* ---- Hero : rôles qui tournent ---- */
  (function roles() {
    const el = $('.role-word');
    if (!el) return;
    const words = (el.dataset.roles || '').split(',').map(w => w.trim()).filter(Boolean);
    if (words.length < 2 || reduced) return;
    let i = 0;
    setInterval(() => {
      el.style.opacity = '0';
      setTimeout(() => {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.style.opacity = '1';
      }, 200);
    }, 2300);
  })();

  /* ============================================================
     Timeline qui se dessine au scroll
     ============================================================ */
  (function timelineDraw() {
    const timelines = $$('.timeline');
    if (!timelines.length) return;
    if (reduced) {
      timelines.forEach(t => {
        t.style.setProperty('--tp', 1);
        $$('li', t).forEach(li => li.classList.add('lit'));
      });
      return;
    }
    const update = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const trigger = vh * 0.62;
      timelines.forEach(t => {
        const r = t.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (trigger - r.top) / (r.height || 1)));
        t.style.setProperty('--tp', p.toFixed(3));
        $$('li', t).forEach(li => {
          li.classList.toggle('lit', li.getBoundingClientRect().top < trigger);
        });
      });
    };
    let ticking = false;
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(() => { update(); ticking = false; }); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  })();

  /* ============================================================
     Transitions entre pages — fade out avant navigation interne
     ============================================================ */
  (function pageTransition() {
    if (reduced) return; // pas de fade sous mouvement réduit
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a');
      if (!a) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (a.origin !== location.origin) return;      // liens externes : navigation normale
      if (a.href === location.href) return;          // même page
      e.preventDefault();
      document.documentElement.classList.add('is-leaving');
      setTimeout(() => { location.href = a.href; }, 200);
    });
    // retour arrière (bfcache) : on enlève l'état "leaving"
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) document.documentElement.classList.remove('is-leaving');
    });
  })();

  /* ============================================================
     Filtre certifications (chips provider + recherche live)
     Progressive enhancement : sans JS, toutes les cartes restent.
     ============================================================ */
  (function certFilter() {
    const bar = $('.cert-filter');
    if (!bar) return;
    const grid = bar.nextElementSibling;
    const cards = $$('.cert-card', grid);
    const chips = $$('.chip:not(.cert-sort)', bar);
    const sortBtn = $('.cert-sort', bar);
    const search = $('.cert-search', bar);
    const count = $('.cert-count', bar);
    let prov = 'all';

    let noRes = grid.querySelector('.certs-no-result');
    if (!noRes) {
      noRes = document.createElement('div');
      noRes.className = 'certs-no-result';
      noRes.hidden = true;
      noRes.textContent = 'Aucune certification ne correspond.';
      grid.appendChild(noRes);
    }

    const apply = () => {
      const q = (search.value || '').trim().toLowerCase();
      let shown = 0;
      cards.forEach(card => {
        const okProv = prov === 'all' || card.dataset.provider === prov;
        const okText = !q || card.textContent.toLowerCase().includes(q);
        const show = okProv && okText;
        card.classList.toggle('is-hidden', !show);
        if (show) { card.classList.add('in'); shown++; }
      });
      noRes.hidden = shown !== 0;
      count.textContent = shown + ' / ' + cards.length + ' affichées';
    };

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        prov = chip.dataset.filter;
        apply();
      });
    });
    if (search) search.addEventListener('input', apply);

    if (sortBtn) {
      sortBtn.addEventListener('click', () => {
        const dir = sortBtn.dataset.dir === 'desc' ? 'asc' : 'desc';
        sortBtn.dataset.dir = dir;
        sortBtn.classList.add('is-active');
        sortBtn.textContent = dir === 'desc' ? '↓ Plus récent' : '↑ Plus ancien';
        const sorted = cards.slice().sort((a, b) => {
          const da = a.dataset.date || '', db = b.dataset.date || '';
          return dir === 'desc' ? db.localeCompare(da) : da.localeCompare(db);
        });
        sorted.forEach(c => grid.insertBefore(c, noRes));
        apply();
      });
    }

    apply();
  })();

  /* ============================================================
     Palette de commandes (⌘K / Ctrl+K / "/") + skip-link
     ============================================================ */
  (function commandPalette() {
    // --- Skip-link accessibilité (1er élément focusable) ---
    const main = document.querySelector('main');
    if (main) {
      if (!main.id) main.id = 'contenu';
      const skip = document.createElement('a');
      skip.className = 'skip-link';
      skip.href = '#' + main.id;
      skip.textContent = 'Aller au contenu';
      document.body.insertBefore(skip, document.body.firstChild);
    }

    // --- Actions disponibles ---
    const go   = (rel) => { location.href = './' + rel; };
    const ext  = (url) => { window.open(url, '_blank', 'noopener'); };
    const copy = (txt) => { if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {}); };
    const toggleTheme = () => {
      const root = document.documentElement;
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    };
    /* ============================================================
       SECRETS — accessibles uniquement en tapant le mot exact
       dans la recherche : "jeux" → dino runner, "easter egg" → crédits
       ============================================================ */
    const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Helper overlay générique ---
    const buildOverlay = (cls) => {
      const ov = document.createElement('div');
      ov.className = 'secret-overlay ' + cls;
      ov.setAttribute('role', 'dialog');
      ov.setAttribute('aria-modal', 'true');
      document.body.appendChild(ov);
      requestAnimationFrame(() => ov.classList.add('is-on'));
      document.body.style.overflow = 'hidden';
      const kill = () => {
        ov.classList.remove('is-on');
        document.body.style.overflow = '';
        setTimeout(() => ov.remove(), 320);
        window.removeEventListener('keydown', onKey, true);
      };
      const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); kill(); } };
      window.addEventListener('keydown', onKey, true);
      return { ov, kill };
    };

    /* ---------------- Easter egg : page crédits ---------------- */
    function launchEgg() {
      const { ov, kill } = buildOverlay('egg-overlay');
      ov.innerHTML =
        '<button class="secret-close" type="button" aria-label="Fermer">✕</button>' +
        '<div class="egg-stars" aria-hidden="true"></div>' +
        '<div class="egg-card">' +
          '<div class="term egg-term">' +
            '<div class="term-head"><span class="term-dots"><i></i><i></i><i></i></span>' +
            '<span class="term-title">secret — credits.sh</span></div>' +
            '<div class="term-body egg-body"></div>' +
          '</div>' +
          '<p class="egg-big">100% fait par <span class="grad">moi</span> &amp; <span class="accent2">Claude</span></p>' +
          '<p class="egg-sub">Conçu, codé, cassé puis réparé à la main. Aucune template, aucun builder — du HTML, du CSS et du JS écrits ligne par ligne.</p>' +
          '<div class="egg-badges">' +
            '<span class="egg-badge">⚡ Vanilla JS</span>' +
            '<span class="egg-badge">🎨 CSS maison</span>' +
            '<span class="egg-badge">🤖 Claude (Anthropic)</span>' +
            '<span class="egg-badge">🚀 GitHub Pages</span>' +
          '</div>' +
          '<p class="egg-foot">Tu as trouvé un secret. Il y en a un autre — tape <kbd>jeux</kbd> dans la recherche 🦕</p>' +
        '</div>';
      ov.querySelector('.secret-close').addEventListener('click', kill);
      ov.addEventListener('click', (e) => { if (e.target === ov) kill(); });

      // étoiles
      const stars = ov.querySelector('.egg-stars');
      let sh = '';
      for (let i = 0; i < 40; i++) {
        sh += `<span style="left:${Math.random()*100}%;top:${Math.random()*100}%;` +
              `animation-delay:${(Math.random()*3).toFixed(2)}s;` +
              `transform:scale(${(0.5+Math.random()).toFixed(2)})"></span>`;
      }
      stars.innerHTML = sh;

      // typewriter terminal
      const body = ov.querySelector('.egg-body');
      const lines = [
        { t: '$ git log --author="shab" --oneline | wc -l', cls: '' },
        { t: 'beaucoup de commits, quelques nuits blanches', cls: 'out' },
        { t: '$ whoami', cls: '' },
        { t: 'shabdpreet singh — créateur de ce site', cls: 'out ok2' },
        { t: '$ credits', cls: '' },
        { t: '100% fait par moi & Claude ✓', cls: 'out ok2' }
      ];
      if (motionReduced) {
        body.innerHTML = lines.map(l => `<p class="term-line ${l.cls}">${l.t}</p>`).join('');
        return;
      }
      let li = 0;
      const typeLine = () => {
        if (li >= lines.length || !document.body.contains(ov)) return;
        const l = lines[li];
        const p = document.createElement('p');
        p.className = 'term-line ' + l.cls;
        body.appendChild(p);
        let ci = 0;
        const tick = () => {
          if (!document.body.contains(ov)) return;
          p.textContent = l.t.slice(0, ++ci);
          if (ci < l.t.length) setTimeout(tick, 18);
          else { li++; setTimeout(typeLine, 260); }
        };
        tick();
      };
      setTimeout(typeLine, 350);
    }

    /* ---------------- Mini-jeu : dino runner ---------------- */
    function launchDino() {
      const { ov, kill } = buildOverlay('dino-overlay');
      ov.innerHTML =
        '<button class="secret-close" type="button" aria-label="Fermer">✕</button>' +
        '<div class="dino-wrap">' +
          '<div class="dino-hud"><span class="dino-title">🦕 dino://no-signal</span>' +
          '<span class="dino-score">score <b id="dinoScore">0</b> · record <b id="dinoBest">0</b></span></div>' +
          '<canvas id="dinoCanvas" width="720" height="220" aria-label="Mini-jeu dino runner"></canvas>' +
          '<p class="dino-hint"><kbd>espace</kbd> / <kbd>↑</kbd> / clic pour sauter · <kbd>esc</kbd> pour quitter</p>' +
        '</div>';
      ov.querySelector('.secret-close').addEventListener('click', kill);

      const cvs = ov.querySelector('#dinoCanvas');
      const ctx = cvs.getContext('2d');
      const scoreEl = ov.querySelector('#dinoScore');
      const bestEl  = ov.querySelector('#dinoBest');

      // couleurs liées au thème
      const styles = getComputedStyle(document.documentElement);
      const ink    = (styles.getPropertyValue('--ink') || '#0f172a').trim();
      const accent = (styles.getPropertyValue('--accent') || '#2563eb').trim();
      const muted  = (styles.getPropertyValue('--text-mute') || '#64748b').trim();

      const W = cvs.width, H = cvs.height, GROUND = H - 40;
      let best = 0;
      try { best = parseInt(localStorage.getItem('dinoBest') || '0', 10) || 0; } catch (e) {}
      bestEl.textContent = best;

      const dino = { x: 60, y: GROUND, w: 38, h: 42, vy: 0, jumping: false };
      const G = 0.9, JUMP = -15;
      let obstacles = [], speed = 6, score = 0, frame = 0, over = false, started = false, raf = 0;

      const reset = () => {
        obstacles = []; speed = 6; score = 0; frame = 0; over = false;
        dino.y = GROUND; dino.vy = 0; dino.jumping = false;
      };
      const jump = () => {
        if (over) { reset(); started = true; loop(); return; }
        if (!started) { started = true; loop(); }
        if (!dino.jumping) { dino.vy = JUMP; dino.jumping = true; }
      };

      const spawn = () => {
        const h = 26 + Math.random() * 24;
        const w = 14 + Math.random() * 16;
        obstacles.push({ x: W + 10, y: GROUND - h + 42, w, h });
      };

      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        // sol
        ctx.strokeStyle = muted; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, GROUND + 42); ctx.lineTo(W, GROUND + 42); ctx.stroke();
        // dino (bloc stylisé + œil)
        ctx.fillStyle = accent;
        ctx.fillRect(dino.x, dino.y, dino.w, dino.h);
        ctx.fillStyle = '#fff';
        ctx.fillRect(dino.x + dino.w - 12, dino.y + 8, 6, 6);
        // obstacles (cactus = barres)
        ctx.fillStyle = ink;
        obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
        // texte état
        ctx.fillStyle = muted;
        ctx.font = '600 14px ui-monospace, monospace';
        if (!started) {
          ctx.textAlign = 'center';
          ctx.fillText('appuie sur espace pour démarrer', W / 2, H / 2 - 6);
          ctx.textAlign = 'left';
        } else if (over) {
          ctx.textAlign = 'center';
          ctx.fillStyle = ink;
          ctx.font = '700 22px ui-monospace, monospace';
          ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
          ctx.fillStyle = muted;
          ctx.font = '600 13px ui-monospace, monospace';
          ctx.fillText('espace pour rejouer', W / 2, H / 2 + 14);
          ctx.textAlign = 'left';
        }
      };

      const loop = () => {
        if (!document.body.contains(ov)) { cancelAnimationFrame(raf); return; }
        if (over) { draw(); return; }
        frame++;
        // physique dino
        dino.vy += G; dino.y += dino.vy;
        if (dino.y >= GROUND) { dino.y = GROUND; dino.vy = 0; dino.jumping = false; }
        // spawn
        if (frame % Math.max(55, 95 - Math.floor(score / 100)) === 0) spawn();
        // déplacement + collision
        obstacles.forEach(o => o.x -= speed);
        obstacles = obstacles.filter(o => o.x + o.w > -10);
        for (const o of obstacles) {
          if (dino.x < o.x + o.w && dino.x + dino.w > o.x &&
              dino.y < o.y + o.h && dino.y + dino.h > o.y) {
            over = true;
            if (score > best) { best = score; bestEl.textContent = best;
              try { localStorage.setItem('dinoBest', String(best)); } catch (e) {} }
          }
        }
        score++; if (score % 6 === 0) scoreEl.textContent = Math.floor(score / 1);
        if (frame % 600 === 0) speed += 0.6;
        draw();
        raf = requestAnimationFrame(loop);
      };

      const onJump = (e) => {
        if (e.type === 'keydown') {
          if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === ' ') { e.preventDefault(); jump(); }
        } else { jump(); }
      };
      window.addEventListener('keydown', onJump);
      cvs.addEventListener('mousedown', onJump);
      cvs.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); }, { passive: false });

      // nettoyage quand l'overlay disparaît
      const obs = new MutationObserver(() => {
        if (!document.body.contains(ov)) {
          window.removeEventListener('keydown', onJump);
          cancelAnimationFrame(raf);
          obs.disconnect();
        }
      });
      obs.observe(document.body, { childList: true });

      draw();
    }

    // commandes secrètes (n'apparaissent QUE si on tape le bon mot)
    const secrets = [
      { triggers: ['jeux', 'jeu', 'dino', 'game', 'runner', 'play', 'no wifi', 'no signal'],
        icon: '🦕', label: 'Lancer le dino runner', hint: 'secret', run: launchDino },
      { triggers: ['easter egg', 'easteregg', 'egg', 'oeuf', 'œuf', 'credits', 'crédits', 'secret', 'made by'],
        icon: '🥚', label: 'Page secrète — crédits', hint: 'secret', run: launchEgg }
    ];

    const actions = [
      { icon: '🏠', label: 'Accueil',               hint: 'page',   run: () => go('index.html') },
      { icon: '📋', label: 'Épreuves',              hint: 'page',   run: () => go('epreuve.html') },
      { icon: '🗂️', label: 'Projets',               hint: 'page',   run: () => go('projet.html') },
      { icon: '📡', label: 'Veille technologique',  hint: 'page',   run: () => go('veille.html') },
      { icon: '🎓', label: 'Certifications',        hint: 'page',   run: () => go('certifs.html') },
      { icon: '◐',  label: 'Basculer le thème clair / sombre', hint: 'action', run: toggleTheme },
      { icon: '✉️', label: 'Copier mon email',      hint: 'action', run: () => copy('Shabdpreetsingh2@gmail.com') },
      { icon: '📄', label: 'Télécharger mon CV',    hint: 'fichier', run: () => go('fichiers/CV_Shabdpreet_Singh.pdf') },
      { icon: '💻', label: 'GitHub',                hint: 'lien',   run: () => ext('https://github.com/shab14') },
      { icon: '🔗', label: 'LinkedIn',              hint: 'lien',   run: () => ext('https://www.linkedin.com/in/shabdpreet-singh-401012376/') }
    ];

    // --- Construction du DOM de la palette ---
    const wrap = document.createElement('div');
    wrap.className = 'cmdk';
    wrap.id = 'cmdk';
    wrap.hidden = true;
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Palette de commandes');
    wrap.innerHTML =
      '<div class="cmdk-backdrop" data-close></div>' +
      '<div class="cmdk-panel">' +
        '<div class="cmdk-input-row">' +
          '<span class="cmdk-prompt" aria-hidden="true">›</span>' +
          '<input type="text" class="cmdk-input" placeholder="Rechercher une page, une action…" aria-label="Rechercher" autocomplete="off" spellcheck="false">' +
          '<kbd class="cmdk-esc">esc</kbd>' +
        '</div>' +
        '<ul class="cmdk-list" role="listbox" aria-label="Résultats"></ul>' +
        '<div class="cmdk-foot"><span>↑↓ naviguer</span><span>⏎ ouvrir</span><span>esc fermer</span></div>' +
      '</div>';
    document.body.appendChild(wrap);

    const input = wrap.querySelector('.cmdk-input');
    const list  = wrap.querySelector('.cmdk-list');
    let filtered = actions.slice();
    let sel = 0;
    let lastFocus = null;

    const render = () => {
      const q = input.value.trim().toLowerCase();
      filtered = q
        ? actions.filter(a => a.label.toLowerCase().includes(q) || a.hint.includes(q))
        : actions.slice();
      // secrets : on les ajoute uniquement si la saisie correspond à un déclencheur
      if (q.length >= 2) {
        secrets.forEach(s => {
          if (s.triggers.some(t => t.startsWith(q) || q.startsWith(t) || t.includes(q))) {
            if (!filtered.includes(s)) filtered.push(s);
          }
        });
      }
      if (sel >= filtered.length) sel = Math.max(0, filtered.length - 1);
      if (!filtered.length) {
        list.innerHTML = '<li class="cmdk-empty">Aucun résultat</li>';
        return;
      }
      list.innerHTML = filtered.map((a, i) =>
        `<li class="cmdk-item" role="option" data-i="${i}" aria-selected="${i === sel}">` +
          `<span class="cmdk-ico" aria-hidden="true">${a.icon}</span>` +
          `<span class="cmdk-label">${a.label}</span>` +
          `<span class="cmdk-hint">${a.hint}</span>` +
        `</li>`
      ).join('');
    };

    const move = (d) => {
      if (!filtered.length) return;
      sel = (sel + d + filtered.length) % filtered.length;
      render();
      const el = list.querySelector('[aria-selected="true"]');
      if (el) el.scrollIntoView({ block: 'nearest' });
    };

    const open = () => {
      lastFocus = document.activeElement;
      wrap.hidden = false;
      input.value = '';
      sel = 0;
      render();
      input.focus();
    };
    const close = () => {
      wrap.hidden = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    const exec = () => {
      const a = filtered[sel];
      if (!a) return;
      close();
      a.run();
    };

    input.addEventListener('input', () => { sel = 0; render(); });
    list.addEventListener('mousemove', (e) => {
      const li = e.target.closest('.cmdk-item');
      if (li) { sel = +li.dataset.i; render(); }
    });
    list.addEventListener('click', (e) => {
      const li = e.target.closest('.cmdk-item');
      if (li) { sel = +li.dataset.i; exec(); }
    });
    wrap.addEventListener('click', (e) => { if (e.target.dataset.close !== undefined) close(); });
    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter')     { e.preventDefault(); exec(); }
    });

    // --- Raccourcis globaux : Ctrl/Cmd+K et "/" ---
    window.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '')) || e.target.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        wrap.hidden ? open() : close();
      } else if (e.key === '/' && !typing && wrap.hidden) {
        e.preventDefault();
        open();
      }
    });

    // --- Bouton déclencheur dans la nav (discoverable) ---
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
      const isMac = /Mac|iPhone|iPad/.test(navigator.platform || '');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cmdk-trigger';
      btn.setAttribute('aria-label', 'Ouvrir la palette de commandes');
      btn.title = 'Palette de commandes';
      btn.innerHTML = '<span class="cmdk-trigger-label">Recherche</span>' +
                      `<kbd>${isMac ? '⌘' : 'Ctrl'} K</kbd>`;
      btn.addEventListener('click', open);
      navActions.insertBefore(btn, navActions.firstChild);
    }
  })();

  /* ============================================================
     Formulaire de contact — compose un mailto (statique, sans backend)
     ============================================================ */
  (function () {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const TO = 'shabdpreet.singh@example.com'; // ← adresse de destination
    const status = document.getElementById('formStatus');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      const v = (id) => (document.getElementById(id).value || '').trim();
      const prenom = v('cf-prenom'), nom = v('cf-nom');
      const email = v('cf-email'), entreprise = v('cf-entreprise');
      const sujet = v('cf-sujet'), message = v('cf-message');

      const subject = `[Portfolio] ${sujet} — ${prenom} ${nom}`;
      const body =
        `Prénom : ${prenom}\nNom : ${nom}\nEmail : ${email}\n` +
        `Entreprise : ${entreprise || '—'}\nSujet : ${sujet}\n\n${message}\n`;

      window.location.href =
        `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      if (status) {
        status.textContent = 'Votre messagerie va s\u2019ouvrir avec le message pré-rempli ✓';
        status.className = 'form-status ok';
      }
      if (window.__burstConfetti) window.__burstConfetti();
    });
  })();

  /* ============================================================
     Typewriter sur les titres de page (h1[data-tw])
     Texte réel dans le DOM (SEO/a11y) — réécrit lettre par lettre
     ============================================================ */
  (function titleTypewriter() {
    const h1 = $('h1[data-tw]');
    if (!h1) return;
    const full = h1.textContent.trim();
    if (reduced) return;                 // titre statique sous reduced-motion
    h1.style.minHeight = h1.offsetHeight + 'px';
    h1.innerHTML = '<span class="tw-text"></span><span class="tw-caret" aria-hidden="true"></span>';
    const span = h1.querySelector('.tw-text');
    const caret = h1.querySelector('.tw-caret');
    let i = 0;
    const tick = () => {
      i++;
      span.textContent = full.slice(0, i);
      if (i < full.length) setTimeout(tick, 38 + Math.random() * 30);
      else setTimeout(() => caret.classList.add('done'), 900);
    };
    setTimeout(tick, 220);
  })();

  /* ============================================================
     Confettis — petit burst canvas (envoi formulaire)
     ============================================================ */
  (function confetti() {
    if (reduced) { window.__burstConfetti = () => {}; return; }
    window.__burstConfetti = () => {
      const cv = document.createElement('canvas');
      cv.className = 'confetti-layer';
      document.body.appendChild(cv);
      const ctx = cv.getContext('2d');
      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      const W = cv.width = innerWidth * DPR, H = cv.height = innerHeight * DPR;
      cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
      ctx.scale(DPR, DPR);
      const cols = ['#2563eb', '#38bdf8', '#22c55e', '#1d4ed8', '#93c5fd'];
      const cx = innerWidth / 2, cy = innerHeight * 0.34;
      const N = 120;
      const parts = Array.from({ length: N }, () => {
        const a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 7;
        return {
          x: cx, y: cy,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4,
          g: 0.16 + Math.random() * 0.12,
          s: 5 + Math.random() * 5, rot: Math.random() * 6.28,
          vr: (Math.random() - 0.5) * 0.3, c: cols[(Math.random() * cols.length) | 0],
          life: 0, max: 90 + Math.random() * 40
        };
      });
      let raf;
      const frame = () => {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        let alive = false;
        parts.forEach(p => {
          if (p.life > p.max) return;
          alive = true;
          p.life++; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
          ctx.restore();
        });
        if (alive) raf = requestAnimationFrame(frame);
        else cv.remove();
      };
      frame();
    };
  })();

  /* ============================================================
     Skeleton loaders — shimmer sur images tant que pas chargées
     ============================================================ */
  (function skeletons() {
    $$('img[data-skeleton]').forEach(img => {
      const done = () => img.classList.add('img-loaded');
      if (img.complete && img.naturalWidth > 0) done();
      else { img.addEventListener('load', done); img.addEventListener('error', done); }
    });
  })();
})();
