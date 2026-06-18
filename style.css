/* Portfolio — interactions
   Bleu léger, épuré, vivant. Respecte prefers-reduced-motion. */

(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Barre de progression de lecture ---- */
  const bar = document.querySelector('.read-progress');
  if (bar) {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      bar.style.width = (scrolled * 100).toFixed(2) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- Nav active selon la page ---- */
  const here = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === here || (here === '' && href === 'index.html')) a.classList.add('active');
  });

  /* ---- Reveal au scroll (avec filets de sécurité) ---- */
  const revealables = document.querySelectorAll('.reveal');
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

      // Filet 1 : tout élément déjà dans le viewport au chargement s'affiche
      const showIfVisible = () => {
        const vh = window.innerHeight || document.documentElement.clientHeight;
        revealables.forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.top < vh && r.bottom > 0) el.classList.add('in');
        });
      };
      showIfVisible();
      // Filet 2 : au cas où, tout devient visible après 3s (jamais de contenu caché)
      setTimeout(() => revealables.forEach(el => el.classList.add('in')), 3000);
    }
  }

  /* ---- Réseau animé dans le hero (canvas) ---- */
  const net = document.querySelector('.hero-net');
  if (net && !reduced) {
    const canvas = document.createElement('canvas');
    net.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let w, h, nodes, raf;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function size() {
      w = net.clientWidth; h = net.clientHeight;
      canvas.width = w * DPR; canvas.height = h * DPR;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const count = Math.max(18, Math.min(46, Math.round(w / 28)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 1.2
      }));
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      // liens
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
      // nœuds
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }

    size();
    tick();
    let to;
    window.addEventListener('resize', () => {
      clearTimeout(to);
      to = setTimeout(() => { cancelAnimationFrame(raf); size(); tick(); }, 200);
    });
    // pause hors écran
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else tick();
    });
  }
})();
