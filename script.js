/* ============================================================
   Portfolio — interactions
   DA « MASTER GRADE » : le mouvement raconte l'assemblage
   (les pièces s'emboîtent, les services s'allument) ou signale
   un état. Rien de décoratif. Tout est désactivé sous
   prefers-reduced-motion.
   Le pilote SH-14 (pilote.js) écoute les événements « kit:* »
   émis ici : kit:svc, kit:theme, kit:incident, kit:copy,
   kit:sent, kit:call, kit:feed (veille), kit:filter (certifs).
   ============================================================ */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));

  /* ---- Horloge Paris (footer) ---- */
  const clock = $('#clock');
  if (clock) {
    const render = () => {
      try {
        const t = new Date().toLocaleTimeString('fr-FR', {
          timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        clock.textContent = 'PARIS · ' + t;
      } catch (e) {
        clock.textContent = 'PARIS · ' + new Date().toLocaleTimeString('fr-FR');
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
        emit('kit:incident');
        if (toast) { toast.classList.add('show'); }
        setTimeout(() => {
          document.body.classList.remove('incident');
          if (toast) toast.classList.remove('show');
        }, 2600);
      }
    });
  })();

  /* ---- Thème clair/sombre (persisté) ----
     v4 : la bascule KIT ↔ BOX ART est un balayage de visière — la
     nouvelle face descend derrière une ligne rouge (View Transitions
     si le navigateur les gère, sinon bascule directe + la ligne). */
  const switchTheme = (() => {
    const root = document.documentElement;
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) {}
    if (!saved) {
      saved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', saved);
    let busy = false;
    return () => {
      if (busy) return;
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      const apply = () => {
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
      };
      /* la ligne de balayage démarre avec le volet (même durée, même courbe) */
      const scanLine = () => {
        if (reduced) return;
        const scan = document.createElement('div');
        scan.className = 'theme-scan';
        scan.setAttribute('aria-hidden', 'true');
        document.body.appendChild(scan);
        setTimeout(() => scan.remove(), 700);
      };
      const tg = $('#themeToggle');
      if (tg && !reduced) { tg.classList.remove('is-flip'); void tg.offsetWidth; tg.classList.add('is-flip'); }
      if (!reduced && document.startViewTransition) {
        busy = true;
        root.classList.add('vt-theme');
        const vt = document.startViewTransition(apply);
        vt.ready.then(scanLine).catch(() => {});
        vt.finished.finally(() => { root.classList.remove('vt-theme'); busy = false; });
      } else { apply(); scanLine(); }
      emit('kit:theme', { theme: next });
    };
  })();
  (function themeButton() {
    const btn = $('#themeToggle');
    if (btn) btn.addEventListener('click', switchTheme);
  })();

  /* ---- Copier au clic (email / tel) ---- */
  $$('.copyable').forEach(el => {
    el.addEventListener('click', (ev) => {
      if (ev.target.tagName === 'A') return; // laisser mailto/tel marcher
      const txt = el.dataset.copy || '';
      const done = () => {
        el.classList.add('copied');
        emit('kit:copy');
        setTimeout(() => el.classList.remove('copied'), 1500);
      };
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
      bar.classList.toggle('is-on', scrolled > 0.012);   // la visière du pilote suit le fil rouge
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
      '[30/10] RAM DDR5 32 Go : 119 € → 414 € en un an',
      '[30/10] SSD 1 To : 215 € de prix médian',
      '[02/10] Raspberry Pi 5 2 Go : passe à 76 €',
      '[23/09] Disque NAS 4 To : 243 € chez LDLC',
      '[17/09] Data centers : 18 GW réservés chez RTE',
      '[10/06] Gartner : +26 % d\u2019électricité pour les datacenters'
    ];
    const caret = '<span class="caret" aria-hidden="true"></span>';
    if (reduced) { feed.innerHTML = lines[0] + caret; return; }
    let li = 0, ci = 0, deleting = false;
    const tick = () => {
      const full = lines[li];
      if (!deleting) {
        ci++;
        if (ci === 1) emit('kit:feed', { text: full });   // le pilote de la veille lit le flux
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

  /* ---- Reveal au scroll (avec filets de sécurité) ----
     .reveal : les pièces arrivent de la grappe ; .section-title : l'étiquette
     STEP se déroule et la ligne de panneau se trace. Le filet de sécurité ne
     dévoile plus tout au bout de 3 s (ça tuait l'animation au scroll) : il
     vérifie au scroll ce qui est passé à l'écran, et tout s'affiche à
     l'impression. Sans JS, rien n'est caché (états initiaux scopés sous .js). */
  const revealables = $$('.reveal, .section-title');
  if (revealables.length) {
    const show = (el) => el.classList.add('in');
    if (reduced || !('IntersectionObserver' in window)) {
      revealables.forEach(show);
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
      revealables.forEach(el => io.observe(el));

      // Filet 1 : ce qui est déjà visible au chargement s'affiche
      const check = () => {
        const vh = window.innerHeight || document.documentElement.clientHeight;
        revealables.forEach(el => {
          if (el.classList.contains('in')) return;
          if (el.getBoundingClientRect().top < vh) show(el);
        });
      };
      check();
      // Filet 2 : au scroll, tout ce qui a déjà traversé l'écran est affiché
      // (throttlé : l'IntersectionObserver fait le vrai travail, ceci n'est
      //  qu'une sécurité — pas de lecture de layout à chaque image)
      let t = 0;
      window.addEventListener('scroll', () => {
        clearTimeout(t);                   // débounce : vérifie quand le scroll s'arrête
        t = setTimeout(check, 160);
      }, { passive: true });
      // Filet 3 : impression → tout visible
      window.addEventListener('beforeprint', () => revealables.forEach(show));
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
     HERO — panneau SYSTÈMES : une vraie supervision (v4.1)
     Le moment mémorable du chargement reste le même (le pilote
     s'assemble puis allume les services un par un), mais chaque
     ligne « data-check » est vérifiée pour de vrai :
       · github : API GitHub → dernier commit, n° de build, et
         l'uptime compte depuis ce dernier déploiement ;
       · head   : requête HEAD sur le fichier → code HTTP, taille,
         latence mesurée.
     Une ligne ne s'allume qu'une fois son check revenu (et jamais
     avant son tour). Ensuite, un check tourne toutes les 20 s tant
     que le panneau est à l'écran. Hors ligne : les fichiers déjà
     embarqués (service worker) passent en CACHE, pas en panne.
     ============================================================ */
  const heroStage = $('.hero-stage');
  const panel = $('#statusPanel');
  const rows = panel ? $$('.status-row', panel) : [];
  const logEl = $('#statusLog');
  const uptimeEl = $('#uptime');
  // Avec le pilote sur son socle : il s'assemble, s'allume, PUIS allume les services
  const heroPilot = !!$('[data-pilote="hero"]');
  const svcStart = heroPilot ? 1850 : 600;
  const svcStep  = heroPilot ? 300 : 260;

  const CHECK_TIMEOUT_MS = 4000;          // au-delà : « timeout »
  const GITHUB_CACHE_MS  = 10 * 60e3;     // API publique limitée à 60 requêtes / h / IP
  const MONITOR_EVERY_MS = 20000;         // un check toutes les 20 s, panneau visible
  const OFFLINE_CACHE    = 'sh14-kit-v2'; // même nom que dans sw.js
  const PILL = { up: 'UP', cache: 'CACHE', down: 'DOWN', api: 'API' };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const absUrl = (u) => new URL(u, location.href).href;
  const fmtSize = (n) => !n ? '' : n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' Mo' : Math.max(1, Math.round(n / 1e3)) + ' Ko';
  const ago = (iso) => {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 3600)  return 'il y a ' + Math.max(1, Math.round(s / 60)) + ' min';
    if (s < 86400) return 'il y a ' + Math.round(s / 3600) + ' h';
    return 'il y a ' + Math.round(s / 86400) + ' j';
  };
  const rowName = (row) => ($('.svc-name', row) || {}).textContent || 'service';

  /* fetch avec délai maximum : AbortController, pas de requête pendue */
  const timedFetch = async (url, opts = {}) => {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), CHECK_TIMEOUT_MS);
    try { return await fetch(url, Object.assign({}, opts, { signal: ctl.signal })); }
    finally { clearTimeout(timer); }
  };
  const inOfflineCache = async (url) => {
    if (!('caches' in window)) return false;
    try { return !!(await caches.match(absUrl(url), { ignoreSearch: true })); }
    catch (err) { console.info('[kit] cache illisible :', err.message); return false; }
  };

  /* ---- check HEAD : code HTTP, taille, latence ---- */
  async function checkHead(row) {
    const url = row.dataset.url;
    const name = rowName(row);
    const t0 = performance.now();
    try {
      const res = await timedFetch(url, { method: 'HEAD', cache: 'no-store' });
      const ms = Math.round(performance.now() - t0);
      if (!res.ok) return { state: 'down', meta: 'HTTP ' + res.status, log: `HEAD ${name} → ${res.status}` };
      const size = fmtSize(parseInt(res.headers.get('content-length') || '0', 10));
      return { state: 'up', ms, meta: (size ? size + ' · ' : '') + ms + ' ms', log: `HEAD ${name} → ${res.status} · ${ms} ms` };
    } catch (err) {
      // pas de réponse : réseau coupé ou délai dépassé → la pièce est-elle embarquée ?
      if (await inOfflineCache(url)) return { state: 'cache', meta: 'dispo hors ligne', log: `HEAD ${name} → hors ligne · cache ✓` };
      const why = err.name === 'AbortError' ? 'timeout' : navigator.onLine ? 'injoignable' : 'hors ligne';
      return { state: 'down', meta: why, log: `HEAD ${name} → ${why}` };
    }
  }

  /* ---- check API GitHub : dernier commit + n° de build (nb de commits) ---- */
  const readGithub = (key) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } };
  async function checkGithub(row) {
    const repo = row.dataset.repo;
    const key = 'kit-gh:' + repo;
    const saved = readGithub(key);
    const describe = (d) => (d.build ? 'build #' + d.build + ' · ' : '') + d.sha;   // l'âge est dans l'uptime
    if (saved && navigator.onLine === false) {
      return { state: 'cache', data: saved, meta: describe(saved), log: 'GET api.github.com → hors ligne · cache' };
    }
    if (saved && Date.now() - saved.at < GITHUB_CACHE_MS) {
      return { state: 'up', data: saved, meta: describe(saved), log: `portfolio.git · build #${saved.build || '?'} · ${saved.sha}` };
    }
    const t0 = performance.now();
    try {
      const res = await timedFetch(`https://api.github.com/repos/${repo}/commits?per_page=1`,
                                   { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
      const ms = Math.round(performance.now() - t0);
      if (!res.ok) throw Object.assign(new Error('HTTP ' + res.status), { status: res.status });
      const list = await res.json();
      const c = list && list[0];
      if (!c || !c.sha) throw new Error('réponse vide');
      const last = /[?&]page=(\d+)>;\s*rel="last"/.exec(res.headers.get('link') || '');
      const data = { sha: c.sha.slice(0, 7), date: c.commit.committer.date, build: last ? +last[1] : 1, at: Date.now() };
      try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* stockage plein ou bloqué : on s'en passe */ }
      return { state: 'up', ms, data, meta: describe(data), log: `GET api.github.com → ${res.status} · ${ms} ms` };
    } catch (err) {
      const why = err.status === 403 || err.status === 429 ? 'quota API' : err.name === 'AbortError' ? 'timeout' : navigator.onLine ? 'API muette' : 'hors ligne';
      console.info('[kit] API GitHub :', err.message);
      // le site, lui, répond (tu le lis) : on garde la dernière valeur connue
      if (saved) return { state: 'cache', data: saved, meta: describe(saved), log: `GET api.github.com → ${why} · cache` };
      return { state: 'api', meta: why, log: `GET api.github.com → ${why}` };
    }
  }
  const probe = (row) => row.dataset.check === 'github' ? checkGithub(row) : checkHead(row);

  /* ---- affichage d'un résultat sur sa ligne ---- */
  const applyResult = (row, res) => {
    const prev = row.dataset.state;
    row.dataset.state = res.state;
    const pill = $('.status-pill', row);
    const meta = $('.svc-meta', row);
    if (pill) pill.textContent = PILL[res.state] || 'UP';
    if (meta && res.meta) meta.textContent = res.meta;
    if (res.data && res.data.date) setUptimeFrom(res.data.date);
    return prev;
  };

  /* ---- journal : la dernière ligne tapée, les suivantes remplacent ---- */
  let logTimer = 0;
  const log = (line) => {
    if (!logEl || !line) return;
    clearTimeout(logTimer);
    if (reduced) { logEl.textContent = line; return; }
    let i = 0;
    const tick = () => {
      logEl.textContent = line.slice(0, ++i);
      if (i < line.length) logTimer = setTimeout(tick, 14);
    };
    tick();
  };

  /* ---- uptime : depuis le dernier déploiement (sinon depuis l'ouverture) ---- */
  const pad = (n) => String(n).padStart(2, '0');
  let upFrom = Date.now();
  function setUptimeFrom(iso) {
    const t = new Date(iso).getTime();
    if (Number.isFinite(t) && t < Date.now()) upFrom = t;
  }
  if (uptimeEl) {
    const render = () => {
      const s = Math.floor((Date.now() - upFrom) / 1000);
      const d = Math.floor(s / 86400);
      uptimeEl.textContent = 'uptime ' + (d ? d + 'j ' : '') + `${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
    };
    render();
    setInterval(render, 1000);
  }

  /* ---- boot : les services s'allument un par un, au rythme des vrais checks ---- */
  async function bootPanel() {
    const t0 = performance.now();
    const pending = rows.map(r => (r.dataset.check ? probe(r) : Promise.resolve(null)));   // tous en parallèle
    let down = 0;
    const lat = [];
    let next = t0 + (reduced ? 0 : svcStart);          // un check lent décale la suite, sans la tasser
    for (let i = 0; i < rows.length; i++) {
      const [res] = await Promise.all([pending[i], sleep(Math.max(0, next - performance.now()))]);
      next = reduced ? 0 : Math.max(next, performance.now()) + svcStep;
      const row = rows[i];
      if (res) {
        applyResult(row, res);
        if (res.state === 'down') down++;
        if (res.ms) lat.push(res.ms);
        if (!reduced) log(res.log);
      }
      row.classList.add('online');
      emit('kit:svc', { row, index: i, last: i === rows.length - 1, ok: !res || res.state !== 'down', down,
                        offline: navigator.onLine === false });
    }
    const checked = rows.filter(r => r.dataset.check).length;
    const avg = lat.length ? ' · moy. ' + Math.round(lat.reduce((a, b) => a + b, 0) / lat.length) + ' ms' : '';
    log(`${checked} checks · ${down ? down + ' en panne' : 'tout répond'}${avg}`);
    monitor();
  }

  /* ---- surveillance continue : un check toutes les 20 s, panneau visible ---- */
  function monitor() {
    const targets = rows.filter(r => r.dataset.check);
    if (!targets.length) return;
    let k = 0;
    setInterval(async () => {
      if (document.hidden || !panel.classList.contains('is-live')) return;
      const row = targets[k++ % targets.length];
      const res = await probe(row);
      const prev = applyResult(row, res);
      log(res.log);
      if (prev && prev !== res.state) emit('kit:check', { name: rowName(row), row, state: res.state, prev });
    }, MONITOR_EVERY_MS);
  }

  if (heroStage) {
    if (reduced) {
      // Pas d'orchestration : tout est posé, les checks remplissent les lignes
      heroStage.classList.add('played');
      rows.forEach(r => r.classList.add('online'));
      bootPanel();
    } else {
      // 1. Le hero se met en place
      if (panel) panel.classList.add('boot');
      requestAnimationFrame(() => requestAnimationFrame(() => heroStage.classList.add('played')));
      // 2. Les services s'allument un par un ; le pilote regarde chaque ligne
      if (rows.length) bootPanel();
    }
  }

  /* ---- Hero : rôles qui tournent ---- */
  (function roles() {
    const el = $('.role-word');
    if (!el) return;
    const words = (el.dataset.roles || '').split(',').map(w => w.trim()).filter(Boolean);
    if (words.length < 2 || reduced) return;
    let i = 0;
    // bascule façon afficheur à volets : le mot sort par le haut, le suivant monte
    setInterval(() => {
      if (document.hidden) return;
      el.classList.add('is-out');
      setTimeout(() => {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.classList.remove('is-out');
        el.classList.add('is-in');
        void el.offsetWidth;
        el.classList.remove('is-in');
      }, 210);
    }, 2300);
  })();

  /* ============================================================
     Hero — profondeur au scroll : le nom glisse, la plaque recule,
     la figurine et son socle montent. Les décalages sont écrits
     directement sur les 4 calques concernés (propriété translate,
     couches GPU) : pas de variable héritée qui forcerait à
     recalculer tout le hero à chaque image.
     ============================================================ */
  (function heroDepth() {
    const hero = $('.hero-stage');
    if (!hero || reduced) return;
    const wide = window.matchMedia('(min-width: 901px)');
    const layers = [
      [$('.name-line:nth-child(1)', hero), (p) => `${(p * 36).toFixed(1)}px 0`],
      [$('.name-line:nth-child(2)', hero), (p) => `${(p * 110).toFixed(1)}px 0`],
      [$('.hero-plate', hero),              (p) => `${(p * 70).toFixed(1)}px ${(p * 36).toFixed(1)}px`],
      [$('.panel-stage', hero),             (p) => `0 ${(p * -46).toFixed(1)}px`],
    ].filter(l => l[0]);
    let raf = 0, last = -1;
    const update = () => {
      raf = 0;
      const p = wide.matches ? Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight || 1))) : 0;
      const q = Math.round(p * 400) / 400;
      if (q === last) return;              // hors du hero : plus aucune écriture
      last = q;
      layers.forEach(([el, f]) => { el.style.translate = q ? f(q) : ''; });
    };
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    wide.addEventListener && wide.addEventListener('change', update);
    update();
  })();

  /* ============================================================
     Animations continues hors écran → en pause (radar, flux…)
     ============================================================ */
  (function pauseOffscreen() {
    const els = $$('[data-live]');
    if (!els.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((ents) => {
      ents.forEach(e => e.target.classList.toggle('is-live', e.isIntersecting));
    }, { rootMargin: '60px' });
    els.forEach(el => io.observe(el));
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
     v4 — Notice de montage : une étape lue est une étape validée.
     Quand une section est entièrement passée, son titre STEP se
     coche et le carré au bout de la ligne de panneau s'allume.
     ============================================================ */
  (function stepsDone() {
    const titles = $$('section > .section-title[data-step]');
    if (!titles.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((ents) => {
      ents.forEach(e => {
        const past = !e.isIntersecting && e.rootBounds && e.boundingClientRect.bottom <= e.rootBounds.top + 1;
        if (!past) return;
        const t = e.target.querySelector(':scope > .section-title');
        if (t) t.classList.add('is-done');
        io.unobserve(e.target);
      });
    }, { rootMargin: '-38% 0px 0px 0px', threshold: 0 });
    titles.forEach(t => io.observe(t.parentElement));
  })();

  /* ============================================================
     v4 — Ça clique : un clic sur une commande principale fait
     sauter quelques éclats carrés (rouge, or, graphite), comme
     les étincelles de la clé du pilote. Souris / tactile, 380 ms.
     ============================================================ */
  (function clickSparks() {
    if (reduced) return;
    const COLORS = ['var(--red)', 'var(--gold)', 'var(--ink)'];
    document.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const t = e.target.closest('.btn-primary, .chip, .scroll-top.dock, .contact-soc');
      if (!t) return;
      for (let i = 0; i < 6; i++) {
        const s = document.createElement('i');
        const a = (Math.PI * 2 * i) / 6 + (Math.random() - 0.5) * 0.7;
        const d = 16 + Math.random() * 16;
        s.className = 'kit-spark';
        s.style.left = e.clientX + 'px';
        s.style.top = e.clientY + 'px';
        s.style.setProperty('--dx', (Math.cos(a) * d).toFixed(1) + 'px');
        s.style.setProperty('--dy', (Math.sin(a) * d - 6).toFixed(1) + 'px');
        s.style.setProperty('--c', COLORS[i % COLORS.length]);
        document.body.appendChild(s);
        s.addEventListener('animationend', () => s.remove(), { once: true });
      }
    }, { passive: true });
  })();

  /* ============================================================
     Transitions entre pages — le volet du kit
     Un panneau graphite frappé du casque du pilote glisse depuis
     la gauche (280 ms), la page suivante l'ouvre vers la droite.
     Le script inline du <head> pose .shutter-in avant le 1er rendu
     (drapeau sessionStorage) : aucun flash, et l'ouverture est
     100 % CSS — si le JS casse, le volet s'ouvre quand même.
     ============================================================ */
  const PAGE_LABELS = {
    'index.html': 'Accueil', 'epreuve.html': 'Épreuves', 'projet.html': 'Projets',
    'veille.html': 'Veille', 'certifs.html': 'Certifications', 'contact.html': 'Contact',
    'mentions-legales.html': 'Mentions légales', 'hangar.html': 'Hangar SH-14'
  };
  const navigate = (url) => {
    const root = document.documentElement;
    if (reduced) { location.href = url; return; }
    let file = '';
    try { file = new URL(url, location.href).pathname.split('/').pop() || 'index.html'; } catch (e) {}
    const label = (PAGE_LABELS[file] ? 'STEP → ' + PAGE_LABELS[file] : 'Pièce suivante').toUpperCase();
    try { sessionStorage.setItem('kit-nav', label); } catch (e) {}
    root.style.setProperty('--shutter-label', JSON.stringify(label));
    root.classList.remove('shutter-in');
    root.classList.add('is-leaving');
    setTimeout(() => { location.href = url; }, 300);
  };
  (function pageTransition() {
    if (reduced) return; // pas de volet sous mouvement réduit
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a');
      if (!a) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (a.origin !== location.origin) return;      // liens externes : navigation normale
      if (a.href === location.href) return;          // même page
      if (!/\.html?$|\/$/.test(a.pathname)) return;  // fichiers (pdf, docx…) : navigation normale
      e.preventDefault();
      navigate(a.href);
    });
    // retour arrière (bfcache) : on range le volet
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) document.documentElement.classList.remove('is-leaving', 'shutter-in');
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

    // user = true : filtrage déclenché par l'utilisateur → les cartes gardées
    // se re-emboîtent (petite cascade). Au chargement, on laisse le reveal
    // au scroll faire son travail (avant : toutes les cartes étaient
    // marquées .in d'office et n'apparaissaient jamais en cascade).
    const apply = (user) => {
      const q = (search.value || '').trim().toLowerCase();
      let shown = 0;
      cards.forEach(card => {
        const okProv = prov === 'all' || card.dataset.provider === prov;
        const okText = !q || card.textContent.toLowerCase().includes(q);
        const show = okProv && okText;
        card.classList.toggle('is-hidden', !show);
        if (show) {
          shown++;
          if (user === true) {
            card.classList.add('in');
            if (!reduced) {
              card.classList.remove('is-refit');
              void card.offsetWidth;
              card.style.setProperty('--refit', Math.min(shown, 8));
              card.classList.add('is-refit');
            }
          }
        }
      });
      noRes.hidden = shown !== 0;
      count.textContent = shown + ' / ' + cards.length + ' affichées';
      if (user === true) emit('kit:filter', { shown, total: cards.length, provider: prov });
    };

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        prov = chip.dataset.filter;
        apply(true);
      });
    });
    if (search) search.addEventListener('input', () => apply(true));

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
        apply(true);
      });
    }

    apply(false);
  })();

  /* ============================================================
     MODE HORS LIGNE — le kit embarqué (voir sw.js)
     · enregistre le service worker : les pages visitées restent
       dans le cache du navigateur ;
     · bandeau « HORS LIGNE » quand le réseau tombe, « RÉTABLI »
       quand il revient (le pilote le dit aussi : kit:net) ;
     · « mode oral » : embarque TOUT d'un coup (pages, docs,
       polices), même le gros docx Centreon, avant l'examen.
     ============================================================ */
  const KIT_FILES = [
    './', './index.html', './epreuve.html', './projet.html', './veille.html', './certifs.html',
    './contact.html', './mentions-legales.html', './hangar.html', './404.html',
    './style.css', './script.js', './pilote.js', './favicon.svg', './site.webmanifest',
    './fichiers/icon-192.png', './fichiers/allianc3-logo.png', './fichiers/allianc3-mark.png',
    './fichiers/schola-nova-logo.png',
    './fichiers/CV_Shabdpreet_Singh.pdf', './fichiers/Tableau_synthese_E4_BTS_SIO.xlsx',
    './fichiers/Doc_Technique_Portfolio.pdf', './fichiers/Projet_Centreon.docx'
  ];

  (function registerKit() {
    if (!('serviceWorker' in navigator)) return;
    const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    if (location.protocol !== 'https:' && !local) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .catch((err) => console.warn('[kit] service worker non enregistré :', err.message));
    });
  })();

  /* bandeau réseau (en bas à gauche : le dock occupe la droite) */
  const netToast = (() => {
    let el = null, hideT = 0;
    return (text, tone, ms) => {
      if (!el) {
        el = document.createElement('div');
        el.className = 'net-toast';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.innerHTML = '<span class="net-led" aria-hidden="true"></span><span class="net-txt"></span>';
        document.body.appendChild(el);
      }
      clearTimeout(hideT);
      el.dataset.tone = tone || 'warn';
      el.querySelector('.net-txt').textContent = text;
      requestAnimationFrame(() => el.classList.add('show'));
      if (ms) hideT = setTimeout(() => el.classList.remove('show'), ms);
    };
  })();

  (function watchNetwork() {
    const off = () => { netToast('Hors ligne · le kit tourne sur le cache', 'warn'); emit('kit:net', { online: false }); };
    const on  = () => { netToast('Réseau rétabli', 'ok', 2400); emit('kit:net', { online: true }); };
    window.addEventListener('offline', off);
    window.addEventListener('online', on);
    if (navigator.onLine === false) off();
  })();

  /* ============================================================
     v5 — NOTICE DE VISITE : chaque page vue est une étape montée
     (un carré rouge s'allume sur son lien dans la nav, le compteur
     avance en pied de page). Les six pages vues → kit complet :
     SH-14 gagne l'antenne V dorée et la garde sur tout le site.
     Stockage local uniquement (clé kit-notice), rien n'en sort.
     ============================================================ */
  const NOTICE = [
    ['index.html', 'Accueil'], ['epreuve.html', 'Épreuves'], ['projet.html', 'Projets'],
    ['veille.html', 'Veille'], ['certifs.html', 'Certifications'], ['contact.html', 'Contact'],
  ];
  const NOTICE_KEY = 'kit-notice';
  const isNoticeStep = (f) => NOTICE.some(([n]) => n === f);
  const readNotice = () => {
    try {
      const d = JSON.parse(localStorage.getItem(NOTICE_KEY) || 'null');
      if (d && Array.isArray(d.steps)) return { steps: d.steps.filter(isNoticeStep), vfin: !!d.vfin };
    } catch (e) { /* stockage illisible : on repart de zéro */ }
    return { steps: [], vfin: false };
  };
  const writeNotice = (d) => {
    try { localStorage.setItem(NOTICE_KEY, JSON.stringify(d)); } catch (e) { /* bloqué : la notice ne persiste pas */ }
  };
  /* pilote.js lit ce drapeau : sur les pages qui chargent script.js, c'est ici
     qu'on décide quand l'antenne apparaît (après la cérémonie, pas avant) */
  document.documentElement.dataset.kitScript = '1';

  const notice = (() => {
    const d = readNotice();
    const fresh = isNoticeStep(here) && !d.steps.includes(here);
    const steps = fresh ? [...d.steps, here] : d.steps;
    const complete = NOTICE.every(([f]) => steps.includes(f));
    const first = complete && !d.vfin;
    const state = { steps, vfin: d.vfin || complete };
    if (fresh || first) writeNotice(state);
    return { ...state, fresh, first };
  })();
  if (notice.vfin && !notice.first) document.documentElement.classList.add('pl-vfin-on');

  /* pied de page : « NOTICE 4/6 » + six cases ; un clic ouvre la palette sur la notice */
  const footNotice = (() => {
    const foot = $('footer');
    if (!foot) return null;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'footer-notice';
    const anchor = $('.footer-uptime', foot);
    if (anchor) anchor.after(b); else foot.appendChild(b);
    b.addEventListener('click', () => emit('kit:palette', { q: 'notice' }));
    return b;
  })();
  function renderNotice(d) {
    $$('.nav-links a').forEach((a) => {
      const f = (a.getAttribute('href') || '').split('/').pop() || 'index.html';
      a.classList.toggle('is-built', d.steps.includes(f));
    });
    /* page Hangar : la notice en grand (six étapes, liens, état de l'antenne) */
    $$('[data-notice-board]').forEach((box) => {
      const rows = NOTICE.map(([f, label], k) => {
        const on = d.steps.includes(f);
        return `<li class="${on ? 'is-on' : ''}"><a href="./${f}"><b>${String(k + 1).padStart(2, '0')}</b>${label}</a>` +
          `<span>${on ? 'monté ✓' : 'à monter'}</span></li>`;
      }).join('');
      box.innerHTML = `<ol class="nb-list" aria-label="Étapes de la notice">${rows}</ol>` +
        `<p class="nb-foot"><span>Notice ${d.steps.length}/${NOTICE.length}</span>` +
        `<span class="${d.vfin ? 'nb-v is-on' : 'nb-v'}">Antenne V : ${d.vfin ? 'montée' : 'à gagner'}</span></p>`;
    });
    if (!footNotice) return;
    const n = d.steps.length, total = NOTICE.length;
    const cells = NOTICE.map(([f]) => `<i class="${d.steps.includes(f) ? 'on' : ''}"></i>`).join('');
    footNotice.innerHTML = `<span class="fn-k">Notice</span><span class="fn-cells" aria-hidden="true">${cells}</span>` +
      `<span class="fn-n">${n}/${total}</span>` +
      (d.vfin ? '<span class="fn-done">kit complet · antenne V</span>' : '<span class="fn-hint">étapes montées</span>');
    footNotice.setAttribute('aria-label', `Notice de visite : ${n} pages sur ${total} vues` + (d.vfin ? ', kit complet' : '') + '. Ouvrir la liste.');
  }
  renderNotice(notice);

  /* cérémonie : antenne V au 6/6 ; coup de pouce au 5/6 (une seule fois) */
  {
    const onHome = !!$('.hero-stage');
    if (notice.first) {
      setTimeout(() => {
        const root = document.documentElement;
        root.classList.add('pl-vfin-on', 'pl-vfin-new');
        setTimeout(() => root.classList.remove('pl-vfin-new'), 1800);
        netToast('Notice 6/6 · kit complet · antenne V débloquée', 'ok', 5600);
        emit('kit:notice', { complete: true });
      }, onHome ? 7200 : 1900);
    } else if (notice.fresh && notice.steps.length === NOTICE.length - 1) {
      const left = NOTICE.find(([f]) => !notice.steps.includes(f));
      setTimeout(() => emit('kit:notice', { done: notice.steps.length, total: NOTICE.length, left: left[1] }), onHome ? 7600 : 2600);
    }
  }
  const resetNotice = () => {
    writeNotice({ steps: isNoticeStep(here) ? [here] : [], vfin: false });
    document.documentElement.classList.remove('pl-vfin-on');
    renderNotice(readNotice());
    netToast('Notice remise à zéro · l’antenne V est rangée', 'warn', 3600);
    emit('kit:notice', { reset: true });
  };
  $$('[data-notice-reset]').forEach((b) => b.addEventListener('click', resetNotice));

  /* mobile : la nav défile ; on amène le lien de la page en cours dans le champ */
  (function navActiveInView() {
    const list = $('.nav-links');
    const a = list && $('a.active', list);
    if (!list || !a || list.scrollWidth <= list.clientWidth) return;
    const r = a.getBoundingClientRect(), lr = list.getBoundingClientRect();
    list.scrollLeft = Math.max(0, r.left - lr.left + list.scrollLeft - (lr.width - r.width) / 2);
  })();

  /* mode oral : chaque pièce est téléchargée puis rangée dans le cache */
  let embarking = false;
  async function embarkKit(onStep) {
    if (!('caches' in window)) throw new Error('cache indisponible sur ce navigateur');
    const cache = await caches.open(OFFLINE_CACHE);
    let bytes = 0, done = 0;
    for (const url of KIT_FILES) {
      const res = await fetch(url, { cache: 'reload' });
      if (!res.ok) throw new Error(`${url.replace('./', '') || 'accueil'} → HTTP ${res.status}`);
      bytes += parseInt(res.headers.get('content-length') || '0', 10);
      await cache.put(url, res);
      if (onStep) onStep(++done, KIT_FILES.length, url);
    }
    await embarkFonts(cache);
    if (navigator.storage && navigator.storage.persist) {
      // demande au navigateur de ne pas vider ce cache s'il manque de place
      try { await navigator.storage.persist(); } catch (e) { console.info('[kit] stockage persistant refusé'); }
    }
    return { files: done, bytes };
  }
  /* polices Google : la feuille CSS, puis chaque fichier de police qu'elle cite */
  async function embarkFonts(cache) {
    const link = $('link[href*="fonts.googleapis.com/css"]');
    if (!link) return;
    try {
      const css = await fetch(link.href, { mode: 'cors' });
      if (!css.ok) return;
      const text = await css.clone().text();
      await cache.put(link.href, css);
      const urls = Array.from(text.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g), (m) => m[1]);
      await Promise.all(urls.map((u) => fetch(u, { mode: 'cors' }).then((r) => (r.ok ? cache.put(u, r) : null))));
    } catch (err) {
      console.info('[kit] polices non embarquées :', err.message);   // le site reste lisible (polices de secours)
    }
  }
  async function runEmbark() {
    if (embarking) return;
    embarking = true;
    netToast('Embarquement du kit…', 'busy');
    emit('kit:net', { embark: 'start' });
    try {
      const r = await embarkKit((done, total, url) => {
        netToast(`Embarquement ${done}/${total} · ${url.split('/').pop() || 'accueil'}`, 'busy');
      });
      const mo = (r.bytes / 1e6).toFixed(1).replace('.', ',');
      netToast(`Kit embarqué · ${r.files} pièces · ${mo} Mo`, 'ok', 5200);
      emit('kit:net', { embark: 'done', files: r.files, bytes: r.bytes });
      $$('[data-embark-status]').forEach((el) => {
        el.textContent = `Embarqué sur cet appareil : ${r.files} pièces, ${mo} Mo. Le site fonctionne maintenant sans réseau.`;
      });
    } catch (err) {
      console.warn('[kit] embarquement interrompu :', err.message);
      netToast('Embarquement interrompu · ' + err.message, 'err', 5200);
      emit('kit:net', { embark: 'fail' });
    } finally {
      embarking = false;
    }
  }
  $$('[data-embark]').forEach((btn) => btn.addEventListener('click', runEmbark));

  /* ============================================================
     Palette de commandes (⌘K / Ctrl+K / "/") + skip-link
     ============================================================ */
  (function commandPalette() {
    // --- Skip-link accessibilité (1er élément focusable) ---
    // (déjà présent dans le HTML de chaque page : on n'en crée un que s'il manque,
    //  avant il y en avait deux)
    const main = document.querySelector('main');
    if (main && !document.querySelector('.skip-link')) {
      if (!main.id) main.id = 'contenu';
      const skip = document.createElement('a');
      skip.className = 'skip-link';
      skip.href = '#' + main.id;
      skip.textContent = 'Aller au contenu';
      document.body.insertBefore(skip, document.body.firstChild);
    }

    // --- Actions disponibles ---
    const go   = (rel) => navigate('./' + rel);
    const ext  = (url) => { window.open(url, '_blank', 'noopener'); };
    const copy = (txt) => {
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => emit('kit:copy')).catch(() => {});
    };
    const toggleTheme = switchTheme;
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
            '<span class="term-title">console — credits.sh</span></div>' +
            '<div class="term-body egg-body"></div>' +
          '</div>' +
          '<p class="egg-big">100% monté par <span class="grad">moi</span> &amp; <span class="accent2">Claude</span></p>' +
          '<p class="egg-sub">Conçu, codé, cassé puis réparé à la main. Aucun template, aucun builder — du HTML, du CSS et du JS écrits ligne par ligne, comme un kit qu\'on ne colle pas.</p>' +
          '<div class="egg-badges">' +
            '<span class="egg-badge">Vanilla JS</span>' +
            '<span class="egg-badge">CSS maison</span>' +
            '<span class="egg-badge">Claude (Anthropic)</span>' +
            '<span class="egg-badge">GitHub Pages</span>' +
          '</div>' +
          '<p class="egg-foot">Tu as trouvé un secret. Il y en a un autre — tape <kbd>jeux</kbd> dans la recherche.</p>' +
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
        { t: '100% monté par moi & Claude ✓', cls: 'out ok2' }
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
          '<div class="dino-hud"><span class="dino-title">dino://no-signal</span>' +
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
      const ink    = (styles.getPropertyValue('--ink') || '#15161A').trim();
      const accent = (styles.getPropertyValue('--red') || '#D42B1E').trim();
      const muted  = (styles.getPropertyValue('--text-mute') || '#8A8D94').trim();
      const dark   = document.documentElement.getAttribute('data-theme') === 'dark';
      // le coureur, c'est le pilote SH-14 en pixel art (sprite de pilote.js)
      const sprite = {
        line: dark ? '#0E0F12' : '#23252B', plastic: dark ? '#E6E4DD' : '#FBFAF6',
        shade: dark ? '#BDBAB2' : '#E2DFD4', red: accent, gold: '#C9A227', led: '#6F9BFF'
      };
      const runner = window.Pilote && window.Pilote.drawRunner;
      if (runner) { const d = document.querySelector('.dino-title'); if (d) d.textContent = 'sh-14://no-signal'; }

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
        // coureur : le pilote (sinon, repli sur le bloc stylisé d'origine)
        if (runner) {
          const f = dino.jumping ? 2 : (started && !over ? (Math.floor(frame / 6) % 2) : 0);
          runner(ctx, dino.x, dino.y, 2, f, sprite);
        } else {
          ctx.fillStyle = accent;
          ctx.fillRect(dino.x, dino.y, dino.w, dino.h);
          ctx.fillStyle = '#fff';
          ctx.fillRect(dino.x + dino.w - 12, dino.y + 8, 6, 6);
        }
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
        icon: 'RUN', label: 'Lancer le dino runner', hint: 'secret', run: launchDino },
      { triggers: ['easter egg', 'easteregg', 'egg', 'oeuf', 'œuf', 'credits', 'crédits', 'secret', 'made by'],
        icon: 'SEC', label: 'Page secrète — crédits', hint: 'secret', run: launchEgg }
    ];

    /* v5 : les pages affichent leur état dans la notice (« monté ✓ ») */
    const NOTICE_KW = 'notice étape kit';
    const actions = [
      { icon: 'GO', label: 'Visite guidée — l\'essentiel en 1 min', hint: 'oral', kw: 'visite tour jury oral présentation guide', run: () => tour.start() },
      { icon: '00', label: 'Accueil',               hint: 'page', file: 'index.html',   kw: NOTICE_KW, run: () => go('index.html') },
      { icon: '01', label: 'Épreuves',              hint: 'page', file: 'epreuve.html', kw: NOTICE_KW, run: () => go('epreuve.html') },
      { icon: '02', label: 'Projets',               hint: 'page', file: 'projet.html',  kw: NOTICE_KW, run: () => go('projet.html') },
      { icon: '03', label: 'Veille technologique',  hint: 'page', file: 'veille.html',  kw: NOTICE_KW, run: () => go('veille.html') },
      { icon: '04', label: 'Certifications',        hint: 'page', file: 'certifs.html', kw: NOTICE_KW, run: () => go('certifs.html') },
      { icon: '05', label: 'Contact',               hint: 'page', file: 'contact.html', kw: NOTICE_KW, run: () => go('contact.html') },
      { icon: 'THM', label: 'Basculer le thème KIT / BOX ART', hint: 'action', run: toggleTheme },
      { icon: 'SH', label: 'Appeler le pilote SH-14', hint: 'mascotte', run: () => emit('kit:call') },
      { icon: 'HGR', label: 'Hangar SH-14 — la fiche du robot', hint: 'page', kw: 'robot mascotte pilote making-of poses', run: () => go('hangar.html') },
      { icon: 'OFF', label: 'Mode oral : embarquer tout le site hors ligne', hint: 'action', run: runEmbark },
      { icon: 'LEG', label: 'Mentions légales',     hint: 'page',   run: () => go('mentions-legales.html') },
      { icon: '@',  label: 'Copier mon email',      hint: 'action', run: () => copy('Shabdpreetsingh2@gmail.com') },
      { icon: 'CV', label: 'Télécharger mon CV',    hint: 'fichier', run: () => { location.href = './fichiers/CV_Shabdpreet_Singh.pdf'; } },
      { icon: 'GH', label: 'GitHub',                hint: 'lien',   run: () => ext('https://github.com/shab14') },
      { icon: 'IN', label: 'LinkedIn',              hint: 'lien',   run: () => ext('https://www.linkedin.com/in/shabdpreet-singh-401012376/') },
      { icon: 'RST', label: 'Notice : remettre à zéro (range l\'antenne V)', hint: 'kit', kw: 'notice reset antenne', run: resetNotice }
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
      const steps = readNotice().steps;
      actions.forEach(a => { if (a.file) a.hint = steps.includes(a.file) ? 'monté ✓' : 'à monter'; });
      filtered = q
        ? actions.filter(a => a.label.toLowerCase().includes(q) || a.hint.includes(q) || (a.kw || '').includes(q))
        : actions.slice();
      /* « notice » : une ligne d'état en tête (n/6, antenne V) */
      if (q && 'notice'.startsWith(q) && q.length >= 3) {
        const d = readNotice();
        filtered.unshift({ icon: d.steps.length + '/6', label: d.vfin ? 'Notice complète — antenne V montée' : `Notice : ${d.steps.length} pages sur 6 vues`,
                           hint: 'kit', run: () => {} });
      }
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

    const open = (q) => {
      lastFocus = document.activeElement;
      wrap.hidden = false;
      input.value = typeof q === 'string' ? q : '';
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

    /* ouverture depuis ailleurs (pied de page « notice ») */
    document.addEventListener('kit:palette', (e) => open(e.detail && e.detail.q));

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
     v5 — VISITE GUIDÉE (pensée pour l'oral) : 12 étapes, ~1 min,
     à travers les six pages. Un bandeau-console en bas de l'écran
     tape le commentaire, des repères de calage rouges encadrent le
     point montré, et le SH-14 visible le regarde. L'étape en cours
     survit au changement de page (sessionStorage, clé kit-tour).
     ← → : étape précédente / suivante · espace : pause · Échap : quitter.
     Un défilement à la main met la visite en pause (on reprend avec ▶).
     ============================================================ */
  const TOUR = [
    { page: 'index.html', sel: '.hero h1', mood: 'happy',
      text: 'Visite express du kit : 12 étapes, à peine une minute. Je te montre l’essentiel.' },
    { page: 'index.html', sel: '#statusPanel', mood: 'focus',
      text: 'Ce panneau est vivant : il vérifie vraiment les fichiers du site — code HTTP, taille, latence, dernier commit.' },
    { page: 'index.html', sel: '.about-intro', mood: 'happy',
      text: 'Shabdpreet Singh, 19 ans : 2e année de BTS SIO option SISR à Schola Nova, en alternance chez ALLIANC3.' },
    { page: 'index.html', sel: '.radar-wrap', mood: 'focus',
      text: 'Ses domaines : réseau, systèmes, sécurité, support et scripting — le support en tête.' },
    { page: 'epreuve.html', sel: '.card[data-part="E-05"]', mood: 'focus',
      text: 'Épreuve E5, le support : le tableau de synthèse se remplit au fil des deux ans. Il se télécharge ici.' },
    { page: 'epreuve.html', sel: '.card[data-part="E-06"]', mood: 'loading',
      text: 'E6, systèmes et réseaux, puis E7, cybersécurité : en préparation pour la session 2027.' },
    { page: 'projet.html', sel: '.card[data-part="P-01"]', mood: 'happy',
      text: 'Projet phare : la supervision Centreon sur AlmaLinux, de l’installation à la documentation complète.' },
    { page: 'projet.html', sel: '.archi', mood: 'focus',
      text: 'Le schéma suit une donnée de supervision, de l’hôte jusqu’à l’interface web.' },
    { page: 'veille.html', sel: '.stand--watch', mood: 'focus',
      text: 'La veille : l’IA et les infrastructures. Pénurie de mémoire, datacenters, énergie, dans un journal daté et sourcé.' },
    { page: 'certifs.html', sel: '.certs-summary', mood: 'star',
      text: '13 certifications, dont 12 du parcours Anthropic. AI Fluency : 10/10.' },
    { page: 'contact.html', sel: '#contactForm', mood: 'happy',
      text: 'Pour le contacter : ce formulaire ou l’email. Réponse en moins de 24 h.' },
    { page: 'contact.html', sel: '.contact-avail', mood: 'wink',
      text: 'Ouvert aux opportunités pour la rentrée 2027. Fin de la visite — merci de l’avoir suivie !' },
  ];
  const ICON = {
    prev: '<svg viewBox="0 0 16 16" aria-hidden="true"><polygon points="11,3 4.5,8 11,13"/></svg>',
    next: '<svg viewBox="0 0 16 16" aria-hidden="true"><polygon points="5,3 11.5,8 5,13"/></svg>',
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><polygon points="5,2.5 13,8 5,13.5"/></svg>',
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4" y="3" width="3" height="10"/><rect x="9" y="3" width="3" height="10"/></svg>',
    close: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4 12 12M12 4 4 12"/></svg>',
  };
  const tour = (() => {
    const KEY = 'kit-tour';
    let i = -1, playing = false, hud = null, frame = null, target = null;
    let nextT = 0, typeT = 0, showT = 0, raf = 0;
    const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify({ i, playing })); } catch (e) { /* navigation privée stricte */ } };
    const forget = () => { try { sessionStorage.removeItem(KEY); } catch (e) { /* idem */ } };
    const dur = (s) => Math.min(4800, Math.max(3200, 1500 + s.text.length * 26));
    const pad = (n) => String(n).padStart(2, '0');

    function build() {
      if (hud) return;
      hud = document.createElement('div');
      hud.className = 'tour-hud';
      hud.setAttribute('role', 'region');
      hud.setAttribute('aria-label', 'Visite guidée');
      hud.innerHTML =
        '<div class="tour-bar" aria-hidden="true"><i></i></div>' +
        '<div class="tour-row">' +
          '<span class="tour-face" aria-hidden="true"></span>' +
          '<p class="tour-txt" aria-live="polite"><b class="tour-step"></b><span class="tour-say"></span></p>' +
          '<div class="tour-ctl">' +
            `<button class="tour-btn" type="button" data-t="prev" aria-label="Étape précédente">${ICON.prev}</button>` +
            `<button class="tour-btn" type="button" data-t="play" aria-label="Pause">${ICON.pause}</button>` +
            `<button class="tour-btn" type="button" data-t="next" aria-label="Étape suivante">${ICON.next}</button>` +
            `<button class="tour-btn" type="button" data-t="close" aria-label="Quitter la visite">${ICON.close}</button>` +
          '</div>' +
        '</div>';
      document.body.appendChild(hud);
      frame = document.createElement('div');
      frame.className = 'tour-frame';
      frame.setAttribute('aria-hidden', 'true');
      frame.innerHTML = '<i></i><i></i><i></i><i></i><b class="tour-tag"></b>';
      document.body.appendChild(frame);
      hud.addEventListener('click', (e) => {
        const b = e.target.closest('[data-t]');
        if (!b) return;
        const t = b.dataset.t;
        if (t === 'prev') go(i - 1);
        else if (t === 'next') go(i + 1);
        else if (t === 'play') toggle();
        else if (t === 'close') stop();
        else if (t === 'again') start();
      });
    }
    function setPlayBtn() {
      const b = hud && $('[data-t="play"]', hud);
      if (!b) return;
      b.innerHTML = playing ? ICON.pause : ICON.play;
      b.setAttribute('aria-label', playing ? 'Pause' : 'Reprendre');
    }
    /* les repères suivent la cible pendant le défilement */
    function track() {
      cancelAnimationFrame(raf);
      const loop = () => {
        if (!target || !frame) return;
        const r = target.getBoundingClientRect();
        frame.style.transform = `translate(${Math.round(r.left - 8)}px, ${Math.round(r.top - 8)}px)`;
        frame.style.width = Math.round(r.width + 16) + 'px';
        frame.style.height = Math.round(r.height + 16) + 'px';
        raf = requestAnimationFrame(loop);
      };
      loop();
    }
    function type(text) {
      const say = $('.tour-say', hud);
      clearTimeout(typeT);
      if (reduced) { say.textContent = text; return; }
      let k = 0;
      const tick = () => {
        say.textContent = text.slice(0, ++k);
        if (k < text.length) typeT = setTimeout(tick, 15);
      };
      tick();
    }
    function show(k) {
      clearTimeout(nextT); clearTimeout(showT);
      i = k;
      const st = TOUR[k];
      document.documentElement.classList.add('is-touring');
      build();
      hud.classList.add('is-on');
      hud.classList.remove('is-end');
      $('.tour-bar i', hud).style.transform = `scaleX(${(k + 1) / TOUR.length})`;
      $('.tour-step', hud).textContent = `${pad(k + 1)}/${pad(TOUR.length)}`;
      setPlayBtn();
      /* étape sur une autre page : on y va (le volet du kit), la visite reprend là-bas */
      if (st.page !== here) {
        save();
        target = null; frame.classList.remove('is-on');
        type('→ ' + (PAGE_LABELS[st.page] || st.page) + '…');
        showT = setTimeout(() => navigate('./' + st.page), reduced ? 0 : 520);
        return;
      }
      save();
      target = $(st.sel);
      if (!target) { nextT = setTimeout(() => go(k + 1), 200); return; }
      frame.classList.remove('is-on');
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      showT = setTimeout(() => {
        $('.tour-tag', frame).textContent = `VISITE · ${pad(k + 1)}`;
        void frame.offsetWidth;
        frame.classList.add('is-on');
        track();
        type(st.text);
        emit('kit:tour', { el: target, mood: st.mood, i: k, n: TOUR.length });
        if (playing) nextT = setTimeout(() => go(k + 1), dur(st));
      }, reduced ? 60 : 620);
    }
    function go(k) {
      if (k < 0) k = 0;
      if (k >= TOUR.length) { finish(); return; }
      show(k);
    }
    function toggle() {
      playing = !playing;
      setPlayBtn(); save();
      clearTimeout(nextT);
      if (playing) nextT = setTimeout(() => go(i + 1), 1400);
    }
    function pause() {
      if (!playing) return;
      playing = false; clearTimeout(nextT); setPlayBtn(); save();
    }
    function finish() {
      clearTimeout(nextT); clearTimeout(showT);
      playing = false; forget();
      target = null;
      if (frame) frame.classList.remove('is-on');
      if (!hud) return;
      hud.classList.add('is-end');
      $('.tour-step', hud).textContent = 'FIN';
      $('.tour-bar i', hud).style.transform = 'scaleX(1)';
      type('Visite terminée. Kit monté à 100 % — tout est dans le menu (Ctrl K).');
      $('.tour-ctl', hud).innerHTML =
        '<button class="tour-btn tour-btn--txt" type="button" data-t="again">Revoir</button>' +
        `<button class="tour-btn" type="button" data-t="close" aria-label="Fermer">${ICON.close}</button>`;
      emit('kit:tour', { end: true });
      i = -1;
    }
    function stop() {
      clearTimeout(nextT); clearTimeout(showT); clearTimeout(typeT);
      cancelAnimationFrame(raf);
      playing = false; i = -1; target = null; forget();
      document.documentElement.classList.remove('is-touring');
      if (hud) { hud.remove(); hud = null; }
      if (frame) { frame.remove(); frame = null; }
      emit('kit:tour', { stop: true });
    }
    function start() {
      if (hud) { hud.remove(); hud = null; }
      if (frame) { frame.remove(); frame = null; }
      playing = true;
      go(0);
    }
    /* reprise après un changement de page */
    function resume() {
      let st = null;
      try { st = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { st = null; }
      if (!st || typeof st.i !== 'number' || st.i < 0 || st.i >= TOUR.length) return;
      /* on n'est pas arrivé ici par la visite (retour arrière, autre onglet…) : on n'insiste pas */
      if (TOUR[st.i].page !== here) { forget(); return; }
      playing = !!st.playing;
      i = st.i;
      document.documentElement.classList.add('is-touring');
      setTimeout(() => go(i), reduced ? 100 : 900);
    }
    /* clavier + défilement à la main (pause) */
    window.addEventListener('keydown', (e) => {
      if (!hud || i < 0) return;
      const cmdk = $('#cmdk');
      if (cmdk && !cmdk.hidden) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || '')) return;
      if (e.key === 'Escape') { e.preventDefault(); stop(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); pause(); go(i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); pause(); go(i - 1); }
      else if (e.key === ' ') { e.preventDefault(); toggle(); }
    });
    ['wheel', 'touchmove'].forEach((ev) => window.addEventListener(ev, () => { if (hud && i >= 0) pause(); }, { passive: true }));
    /* un lien cliqué pendant la visite = on reprend la main : la visite s'arrête */
    document.addEventListener('click', (e) => {
      if (hud && i >= 0 && e.target.closest('a[href]') && !e.target.closest('.tour-hud')) stop();
    }, true);
    return { start, stop, resume, active: () => i >= 0 };
  })();
  $$('[data-tour-start]').forEach((b) => b.addEventListener('click', () => tour.start()));
  tour.resume();

  /* ============================================================
     Formulaire de contact — compose un mailto (statique, sans backend)
     ============================================================ */
  (function () {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const TO = 'Shabdpreetsingh2@gmail.com'; // ← adresse de destination
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
      emit('kit:sent');
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
      const cols = ['#D42B1E', '#1D48A8', '#C9A227', '#23252B', '#F3F1EA'];
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
