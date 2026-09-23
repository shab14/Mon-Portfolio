/* ============================================================
   pilote.js — SH-14, le pilote du kit (mascotte)
   ------------------------------------------------------------
   Une seule source de vérité : build() dessine le robot,
   la classe Pilote le fait vivre. Toutes les apparitions
   sortent d'ici — hero, compagnon (bouton remonter), caméos
   de page, 404, sprite du dino runner.

   Côté HTML c'est déclaratif :
     <div data-pilote="hero|peek|work|ghost|watch|hello|lost">
   Réactions de section (compagnon) :
     data-pl="humeur|texte"   sur un titre ou un bloc
     data-pl-hello="humeur|texte"  sur <main> (arrivée sur la page)
   Événements écoutés (émis par script.js) :
     kit:svc  kit:theme  kit:incident  kit:copy  kit:sent  kit:call

   Règles DA : aplats, lignes de panneau, ombre dure, mouvement
   de servo (ça claque, ça s'arrête net). La seule lumière du
   kit, c'est la « LED unit » : visière et voyants, qui ne
   brillent vraiment que sur la face BOX ART (sombre).
   Sous prefers-reduced-motion : poses fixes, expressions
   sans mouvement, pas de vol.
   ============================================================ */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let uid = 0;

  /* ============================================================
     1. DESSIN — primitives + pièces (viewBox 200 × 310)
     Classes courtes, toutes scopées sous .pl-svg (voir style.css) :
     k = graphite · s = plastique ombré · n = sans trait
     r / b / y = rouge / bleu / or · v = visière · e = LED
     t = trait fin · m = trait moyen · h = reflet
     ============================================================ */
  const poly = (pts, c) => `<polygon${c ? ` class="${c}"` : ''} points="${pts}"/>`;
  const rect = (x, y, w, h, c) => `<rect${c ? ` class="${c}"` : ''} x="${x}" y="${y}" width="${w}" height="${h}"/>`;
  const line = (x1, y1, x2, y2, c) => `<line${c ? ` class="${c}"` : ''} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const path = (d, c) => `<path${c ? ` class="${c}"` : ''} d="${d}"/>`;
  const grp  = (c, inner, extra) => `<g${c ? ` class="${c}"` : ''}${extra || ''}>${inner}</g>`;
  /* pièce du kit : wrapper d'assemblage (+ wrapper de respiration) */
  const part = (name, inner, d, idle) =>
    `<g class="pl-part pl-p-${name}" style="--d:${d}s">${idle ? grp('pl-idle', inner) : inner}</g>`;

  const FLAMES =
    grp('pl-flames',
      poly('66,306 92,307.6 79,338', 'r n pl-fl') + poly('108,307.6 134,306 121,338', 'r n pl-fl') +
      poly('72,307 86,307.8 79,326', 'y n pl-fl') + poly('114,307.8 128,307 121,326', 'y n pl-fl'));

  const BACK =
    poly('58,72 70,66 76,92 60,95', 's') + poly('142,72 130,66 124,92 140,95', 's') +
    poly('59.4,73.2 69.6,68.2 70.5,72.4 60.3,77.4', 'r n') + poly('140.6,73.2 130.4,68.2 129.5,72.4 139.7,77.4', 'r n');

  const LEGS =
    /* cuisses */
    poly('74,178 98,178 96,216 72,214', 'k') + poly('102,178 126,178 128,214 104,216', 'k') +
    /* genoux + rotule boulonnée */
    poly('70,214 97,216 96,238 68,236') + poly('103,216 130,214 132,236 104,238') +
    poly('75,219.5 91,220.6 90.4,232 74.4,231', 's n') + poly('109,220.6 125,219.5 125.6,231 109.6,232', 's n') +
    rect(81, 224, 3.6, 3.6, 'k n') + rect(115.4, 224, 3.6, 3.6, 'k n') +
    /* tibias : face ombrée, bande rouge, ouïes */
    poly('69,238 96,240 94,286 67,284') + poly('104,240 131,238 133,284 106,286') +
    poly('87,239.3 96,240 94,286 85.4,285.4', 's n') + poly('124,238.5 131,238 133,284 126.4,284.5', 's n') +
    poly('75,248 83,248 81,280 73,280', 'r n') + poly('117,248 125,248 127,280 119,280', 'r n') +
    line(86.6, 262, 92.4, 262.4, 't') + line(86.4, 267, 92.2, 267.4, 't') + line(86.2, 272, 92, 272.4, 't') +
    line(107.6, 262.4, 113.4, 262, 't') + line(107.8, 267.4, 113.6, 267, 't') + line(108, 272.4, 113.8, 272, 't') +
    /* pieds (tuyères dessous) */
    poly('63,284 95,286 97,308 58,306', 'k') + poly('105,286 137,284 142,306 103,308', 'k') +
    line(61.6, 297, 95.6, 298.6, 'h') + line(104.4, 298.6, 138.6, 297, 'h');

  const HIP = (o) =>
    /* jupe latérale + bassin + boucle or */
    poly('64,160 76,157 73,181 61,178') + rect(66, 166, 5, 5, 'b n') +
    poly('76,156 124,156 128,178 72,178', 'k') +
    rect(93, 161, 14, 9, 'y n') + rect(99, 162.5, 2, 6, 'k n') +
    /* jupes avant, liseré rouge */
    poly('77,178 98,178 97,192 80,194') + poly('102,178 123,178 120,194 103,192') +
    poly('79,188.6 97.3,187.6 97,192 80,194', 'r n') + poly('102.7,187.6 121,188.6 120,194 103,192', 'r n') +
    /* sacoche de technicien + flamme « REMOVE BEFORE FLIGHT » (clin d'œil aéro) */
    poly('126,158 143,158 145,180 128,180') + line(128, 168, 144, 168, 't') +
    grp('pl-tag',
      line(137.5, 180, 137.8, 185, 't') +
      poly('134.6,185 141,185 140.8,200 137.8,197.6 134.8,200', 'r n') +
      line(136, 188.4, 139.6, 188.4, 'pl-tagl') + line(136, 191.6, 139.6, 191.6, 'pl-tagl'));

  const TORSO =
    poly('70,92 130,92 136,110 130,144 100,160 70,144 64,110') +
    poly('116,92 130,92 136,110 130,144 116,151.5', 's n') +
    poly('80,92 120,92 116.6,98 83.4,98', 'k') +                       /* col */
    poly('86,101 114,101 114,138 100,146 86,138', 'k') +               /* insert poitrine */
    grp('pl-cells',                                                    /* jauge d'énergie (5 cellules) */
      rect(95.5, 131, 9, 5, 'r n') + rect(95.5, 125, 9, 5, 'r n') + rect(95.5, 119, 9, 5, 'r n') +
      rect(95.5, 113, 9, 5, 'r n') + rect(95.5, 107, 9, 5, 'r n')) +
    line(67, 124, 86, 124, 'm') + line(114, 124, 133, 124, 'm') +
    rect(71, 130, 9, 9, 'b n') +
    rect(118.5, 130, 7, 7, 'r n pl-led') +
    '<text class="pl-decal" x="73.6" y="119.4">14</text>';

  const SHOULDERS = (id) =>
    /* épaulière gauche : panneau rouge, rivets */
    poly('34,96 54,86 72,94 72,124 44,128 30,114') +
    poly('30,114 44,121.6 72,118.4 72,124 44,128', 's n') +
    poly('38,99 54,91 54,103 38,109', 'r n') +
    rect(46.5, 120.5, 3, 3, 'k n') + rect(63.5, 118.5, 3, 3, 'k n') +
    /* épaulière droite : sticker hazard */
    poly('166,96 146,86 128,94 128,124 156,128 170,114') +
    poly('170,114 156,121.6 128,118.4 128,124 156,128', 's n') +
    grp('pl-hz',
      line(134, 114, 156, 92) + line(139, 114, 161, 92) + line(144, 114, 166, 92) +
      line(149, 114, 171, 92) + line(154, 114, 176, 92) + line(159, 114, 181, 92),
      ` clip-path="url(#plh${id})"`) +
    poly('146,93 162,101 162,111 146,103', 't') +
    rect(150.5, 120.5, 3, 3, 'k n') + rect(133.5, 118.5, 3, 3, 'k n');

  /* bras articulés : bras (épaule) + avant-bras (coude) — deux groupes
     indépendants, l'avant-bras compose les deux rotations en CSS */
  const ARM = {
    l: {
      ua: poly('36,104 62,110 57,148 31,142') + poly('52,107.7 62,110 57,148 48.5,146', 's n'),
      fa: poly('40,141.5 48,141.5 50.5,145 50.5,151 48,154.5 40,154.5 37.5,151 37.5,145', 'k') +
          poly('30,148 56,152 52,190 26,186') + poly('46,150.5 56,152 52,190 42.4,188.6', 's n') +
          poly('28,162 55,166 54,177 27,173', 'k') +
          poly('24,190 50,194 47,212 21,208') + poly('40,192.5 50,194 47,212 37.4,210.6', 's n') +
          line(22.8, 200, 48.6, 203.8, 't'),
    },
    r: {
      ua: poly('164,104 138,110 143,148 169,142') + poly('154,106.3 164,104 169,142 159,144.3', 's n'),
      fa: poly('153,141.5 161,141.5 163.5,145 163.5,151 161,154.5 153,154.5 150.5,151 150.5,145', 'k') +
          poly('170,148 144,152 148,190 174,186') + poly('160,149.5 170,148 174,186 164.4,187.5', 's n') +
          poly('172,162 145,166 146,177 173,173', 'k') +
          poly('176,190 150,194 153,212 179,208') + poly('166,191.5 176,190 179,208 169.4,209.4', 's n') +
          line(151.4, 203.8, 177.2, 200, 't'),
    },
  };
  /* clé plate tenue en main (pose « work »), + étincelles */
  const WRENCH_HAND =
    poly('162.4,196 167.4,196 168.6,238 163.6,238', 'k') +
    poly('157.6,236 174.4,236 175,247 170.4,247 170.2,241.4 162.2,241.4 162.4,247 157.8,247', 'k') +
    grp('pl-sparks',
      rect(158, 252, 3, 3, 'y n') + rect(170, 254, 2.6, 2.6, 'y n') + rect(164, 258, 2.4, 2.4, 'r n') +
      rect(175.5, 249, 2.2, 2.2, 'y n'));
  /* bras manquant (404) : contour pointillé façon notice */
  const MISSING_R =
    grp('pl-missing',
      poly('164,104 138,110 143,148 169,142') + poly('170,148 144,152 148,190 174,186') +
      poly('176,190 150,194 153,212 179,208')) +
    rect(128.5, 101, 8, 8, 'k');

  /* visière LED matricielle : mono-œil (scan) + expressions */
  const FACE =
    grp('pl-matrix',
      line(74, 40.5, 126, 40.5) + line(74, 43.5, 126, 43.5) + line(74, 46.5, 126, 46.5) + line(74, 49.5, 126, 49.5) +
      line(74, 52.5, 126, 52.5) + line(74, 55.5, 126, 55.5) + line(74, 58.5, 126, 58.5)) +
    grp('pl-scanwrap', grp('pl-eyewrap', rect(90, 44.2, 20, 3.6, 'e pl-eye'))) +
    grp('pl-x pl-x-open', rect(83, 44, 9, 6, 'e') + rect(108, 44, 9, 6, 'e')) +
    grp('pl-x pl-x-happy', path('M81,51.4 L87.5,44.6 L94,51.4 M106,51.4 L112.5,44.6 L119,51.4', 'pl-ln')) +
    grp('pl-x pl-x-wink', path('M81,51.4 L87.5,44.6 L94,51.4', 'pl-ln') + rect(108, 44, 9, 6, 'e')) +
    grp('pl-x pl-x-surprise', rect(84, 42.6, 8, 8, 'pl-ln') + rect(108, 42.6, 8, 8, 'pl-ln')) +
    grp('pl-x pl-x-focus', path('M82.4,43.6 L93,47.2 M117.6,43.6 L107,47.2', 'pl-ln') + rect(84, 49, 8, 3, 'e') + rect(108, 49, 8, 3, 'e')) +
    grp('pl-x pl-x-alert', rect(98.2, 40.4, 3.6, 9.4, 'e pl-red') + rect(98.2, 52.4, 3.6, 3.6, 'e pl-red')) +
    grp('pl-x pl-x-question', path('M95,45 L95,41.6 L105,41.6 L105,47.4 L100,47.4 L100,50.6', 'pl-ln') + rect(98.2, 53.4, 3.6, 3.6, 'e')) +
    grp('pl-x pl-x-check', path('M88.6,48.6 L96,55.4 L111.4,41', 'pl-ln')) +
    grp('pl-x pl-x-loading', rect(86, 46.4, 5, 5, 'e pl-dot') + rect(97.5, 46.4, 5, 5, 'e pl-dot') + rect(109, 46.4, 5, 5, 'e pl-dot')) +
    grp('pl-x pl-x-dizzy', path('M83.6,43 L91.4,50.8 M91.4,43 L83.6,50.8 M108.6,43 L116.4,50.8 M116.4,43 L108.6,50.8', 'pl-ln')) +
    grp('pl-x pl-x-sleep', rect(83, 49.6, 9, 2.2, 'e') + rect(108, 49.6, 9, 2.2, 'e'));

  const HEAD = (id) =>
    /* cou (ne suit pas l'inclinaison de la tête) */
    rect(89, 76, 22, 16, 'k') + line(91, 81.5, 109, 81.5, 'h') + line(91, 86.5, 109, 86.5, 'h') +
    grp('pl-look', grp('pl-head',
      /* casque */
      poly('70,32 80,20 120,20 130,32 130,60 120,76 80,76 70,60') +
      poly('116,20 120,20 130,32 130,60 120,76 116,76', 's n') +
      poly('90,20 110,20 106.6,28 93.4,28', 's') + rect(97, 22.4, 6, 3.4, 'r n pl-cam') +
      line(74.6, 63.6, 79.6, 70.6, 't') + line(125.4, 63.6, 120.4, 70.6, 't') +
      line(92, 66.6, 108, 66.6, 't') + line(93.6, 70, 106.4, 70, 't') + line(95.2, 73.4, 104.8, 73.4, 't') +
      /* visière + matrice LED */
      poly('74,38 126,38 126,52 117,62 83,62 74,52', 'v') +
      grp('pl-face', grp('pl-lid', FACE), ` clip-path="url(#plv${id})"`) +
      poly('77,40.4 88,40.4 82.6,46 77,46', 'pl-glint n') +
      /* casque-micro : oreillette + balise or + antenne + perche micro */
      rect(58, 38, 13, 19, 'k') + rect(61, 44, 6, 6, 'y n pl-beacon') +
      poly('60,38 66,26 71,27 66,38', 'k') +
      path('M65,57 L67,66 L83.4,70.4', 'pl-boom') + rect(83, 67.6, 6, 5, 'k') + rect(85, 69.2, 2, 1.8, 'r n') +
      line(130, 44, 137, 44, 'm') +
      /* « z » du mode veille */
      grp('pl-zz', path('M134,22 L141,22 L134,29 L141,29', 'pl-zl') + path('M143,10 L148,10 L143,15 L148,15', 'pl-zl'))
    ));

  function defs(id) {
    return '<defs>' +
      `<clipPath id="plv${id}"><polygon points="74,38 126,38 126,52 117,62 83,62 74,52"/></clipPath>` +
      `<clipPath id="plh${id}"><polygon points="146,93 162,101 162,111 146,103"/></clipPath>` +
      '</defs>';
  }

  /* build(opts) → chaîne SVG
     variant : full (défaut) | peek (tête + poings posés sur un bord)
     wrench  : clé plate dans la main droite
     noArmR  : bras droit manquant (404)
     frontL / frontR : avant-bras dessiné devant la tête (poses main-visière) */
  function build(o = {}) {
    const id = ++uid;
    if (o.variant === 'peek') {
      const fists =
        poly('60,59 78,61.4 77.4,73 59.4,72') + poly('71,60.5 78,61.4 77.4,73 70.6,72.4', 's n') + line(59.8, 65.6, 77.8, 67.8, 't') +
        poly('140,59 122,61.4 122.6,73 140.6,72') + poly('133,60 140,59 140.6,72 133.4,72.5', 's n') + line(122.2, 67.8, 140.2, 65.6, 't');
      return `<svg class="pl-svg pl-svg--peek" viewBox="48 10 104 62" aria-hidden="true" focusable="false">${defs(id)}` +
        grp('pl-body', part('head', HEAD(id), 0, false) + part('fists', fists, 0, false)) + '</svg>';
    }
    const vb = o.wrench ? '-4 -4 212 318' : '0 0 200 310';
    const faL = grp('pl-fa pl-fa-l', ARM.l.fa);
    const faR = grp('pl-fa pl-fa-r', (o.wrench ? WRENCH_HAND : '') + ARM.r.fa);
    const armL = grp('pl-ua pl-ua-l', ARM.l.ua) + (o.frontL ? '' : faL);
    const armR = o.noArmR ? MISSING_R : grp('pl-ua pl-ua-r', ARM.r.ua) + (o.frontR ? '' : faR);
    const front = (o.frontL ? faL : '') + (o.frontR && !o.noArmR ? faR : '');
    return `<svg class="pl-svg" viewBox="${vb}" aria-hidden="true" focusable="false">${defs(id)}` +
      grp('pl-body',
        FLAMES +
        part('back', BACK, 0.30, true) +
        part('legs', LEGS, 0.00, false) +
        part('hip', HIP(o), 0.08, false) +
        part('arm-l', armL, 0.34, true) +
        part('arm-r', armR, 0.38, true) +
        part('torso', TORSO, 0.16, true) +
        part('shoulders', SHOULDERS(id), 0.26, true) +
        part('head', HEAD(id), 0.46, true) +
        (front ? part('front', front, 0.40, true) : '')) +
      '</svg>';
  }

  /* ============================================================
     2. COMPORTEMENT — une instance = un robot vivant
     ============================================================ */
  const MOODS = ['open', 'happy', 'wink', 'surprise', 'focus', 'alert', 'question', 'check', 'loading', 'dizzy', 'sleep'];
  const all = [];

  class Pilote {
    constructor(host, o = {}) {
      this.host = host;
      this.o = o;
      this.baseMood = o.mood || null;
      this.basePose = o.pose || 'stand';
      this.busy = false;
      host.classList.add('pl');
      if (o.interactive) host.classList.add('pl--interactive');
      host.setAttribute('aria-hidden', 'true');
      const svg = build(o);
      host.innerHTML = (o.clip ? `<div class="pl-clip">${svg}</div>` : svg) +
        (o.bubble ? '<div class="pl-say"><span class="pl-say-txt"></span></div>' : '');
      this.svg = $('.pl-svg', host);
      this.sayEl = $('.pl-say', host);
      this.sayTxt = $('.pl-say-txt', host);
      this.pose(this.basePose);
      this.mood(this.baseMood);
      if (o.scan !== false) host.classList.add('is-scanning');
      all.push(this);
      /* hors écran : on met tout en pause (perf) */
      if ('IntersectionObserver' in window) {
        this.visible = false;
        new IntersectionObserver((ents) => {
          ents.forEach(e => {
            this.visible = e.isIntersecting;
            host.classList.toggle('pl-paused', !e.isIntersecting);
          });
        }, { rootMargin: '80px' }).observe(host);
      } else this.visible = true;
    }

    /* humeur de la visière (null = mono-œil) ; ms = retour à l'humeur de base */
    mood(m, ms) {
      clearTimeout(this._mt);
      if (m && MOODS.indexOf(m) !== -1) this.host.setAttribute('data-mood', m);
      else this.host.removeAttribute('data-mood');
      this.flick();
      if (ms) this._mt = setTimeout(() => this.mood(this.baseMood), ms);
      return this;
    }
    /* la matrice LED « claque » quand elle change d'affichage */
    flick() {
      if (reduced) return;
      this.host.classList.remove('is-flick');
      void this.host.offsetWidth;
      this.host.classList.add('is-flick');
      clearTimeout(this._ft);
      this._ft = setTimeout(() => this.host.classList.remove('is-flick'), 140);
    }
    pose(p, ms) {
      clearTimeout(this._pt);
      /* une nouvelle pose annule un coucou en cours (sinon son minuteur
         ramènerait la pose de base au milieu, ex. pendant une célébration) */
      if (p !== 'wave') { clearTimeout(this._wt); this.host.classList.remove('is-waving'); }
      this.host.setAttribute('data-pose', p || 'stand');
      if (ms) this._pt = setTimeout(() => this.pose(this.basePose), ms);
      return this;
    }
    /* regard normalisé (-1..1) : l'œil file, la tête suit un peu */
    look(nx, ny) {
      nx = clamp(nx, -1, 1); ny = clamp(ny, -1, 1);
      const s = this.svg.style;
      s.setProperty('--ex', (nx * 15).toFixed(2) + 'px');
      s.setProperty('--ey', (ny * 3.2).toFixed(2) + 'px');
      s.setProperty('--hx', (nx * 2.6).toFixed(2) + 'px');
      s.setProperty('--hy', (ny * 1.6).toFixed(2) + 'px');
      s.setProperty('--hr', (nx * 3.5).toFixed(2) + 'deg');
      this.host.classList.remove('is-scanning');
      this.host.classList.add('is-tracking');
      return this;
    }
    /* regarder un point de l'écran */
    lookAt(x, y) {
      const r = this.svg.getBoundingClientRect();
      if (!r.width) return this;
      const vb = this.svg.viewBox.baseVal;
      const hx = r.left + ((100 - vb.x) / vb.width) * r.width;
      const hy = r.top + ((48 - vb.y) / vb.height) * r.height;
      const range = Math.max(260, r.width * 2.4);
      return this.look((x - hx) / range, (y - hy) / (range * 0.8));
    }
    lookAtEl(el) {
      if (!el) return this;
      const r = el.getBoundingClientRect();
      return this.lookAt(r.left + r.width / 2, r.top + r.height / 2);
    }
    /* rend la main : retour au regard libre + scan si prévu */
    release() {
      const s = this.svg.style;
      ['--ex', '--ey', '--hx', '--hy', '--hr'].forEach(p => s.removeProperty(p));
      this.host.classList.remove('is-tracking');
      if (this.o.scan !== false) this.host.classList.add('is-scanning');
      return this;
    }
    blink() {
      if (reduced) return this;
      this.host.classList.add('is-blink');
      setTimeout(() => this.host.classList.remove('is-blink'), 130);
      return this;
    }
    /* bulle HUD tapée à la machine */
    say(text, ms = 2800) {
      if (!this.sayEl || !text) return this;
      clearTimeout(this._st); clearTimeout(this._sh);
      this.sayEl.classList.add('is-on');
      const t = this.sayTxt;
      if (reduced) t.textContent = text;
      else {
        let i = 0;
        t.textContent = '';
        const tick = () => {
          t.textContent = text.slice(0, ++i);
          if (i < text.length) this._st = setTimeout(tick, 22);
        };
        tick();
      }
      this._sh = setTimeout(() => this.sayEl.classList.remove('is-on'), ms + text.length * 22);
      return this;
    }
    hush() { if (this.sayEl) this.sayEl.classList.remove('is-on'); return this; }
    /* propulseurs */
    fly(on) { this.host.classList.toggle('is-flying', !!on); return this; }
    hop() {
      if (reduced) return this;
      this.host.classList.remove('is-hop');
      void this.host.offsetWidth;
      this.host.classList.add('is-hop');
      clearTimeout(this._ht);
      this._ht = setTimeout(() => this.host.classList.remove('is-hop'), 950);
      return this;
    }
    wave(ms = 1700) {
      this.pose('wave');
      if (!reduced) {
        this.host.classList.add('is-waving');
        clearTimeout(this._wt);
        this._wt = setTimeout(() => { this.host.classList.remove('is-waving'); this.pose(this.basePose); }, ms);
      } else this.pose('wave', ms);
      return this;
    }
    alert(ms = 2600) {
      this.host.classList.add('is-alert');
      this.mood('alert');
      setTimeout(() => { this.host.classList.remove('is-alert'); this.mood('check', 900); }, ms);
      return this;
    }
    /* mise sous tension : la visière clignote, la jauge se remplit */
    powerOn() {
      this.host.classList.remove('is-off');
      this.host.classList.add('is-powering');
      setTimeout(() => this.host.classList.remove('is-powering'), 900);
      return this;
    }
  }

  /* ============================================================
     3. PRÉSETS — chaque apparition a un rôle, une pose, un sens
     ============================================================ */
  const LINES = {
    boot: 'SH-14 en ligne. Tous les systèmes sont verts.',
    back: 'Te revoilà. Tout est toujours vert.',
    heat: 'Surchauffe… je refroidis.',
    click: [
      ['happy', 'Salut ! Moi c’est SH-14, je supervise le site.'],
      ['wink', 'Hé, ça chatouille les servos.'],
      ['check', 'Kit monté à 100 %. Aucune pièce en trop.'],
      ['open', 'Uptime impeccable. Je ne dors jamais.'],
      ['happy', 'Le CV ? Bouton « Mon CV », juste à gauche.'],
    ],
  };

  /* Suivi du curseur partagé (un seul listener, throttlé rAF) */
  const trackers = new Set();
  let ptr = null, ptrRaf = 0;
  if (!reduced) {
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      ptr = { x: e.clientX, y: e.clientY };
      if (!ptrRaf) ptrRaf = requestAnimationFrame(() => {
        ptrRaf = 0;
        trackers.forEach(fn => fn(ptr));
      });
    }, { passive: true });
  }
  const onReveal = (el, fn, opts) => {
    if (!('IntersectionObserver' in window) || reduced) { fn(); return; }
    const io = new IntersectionObserver((ents) => {
      ents.forEach(en => { if (en.isIntersecting) { io.disconnect(); fn(); } });
    }, opts || { threshold: 0.5 });
    io.observe(el);
  };

  /* ---- HERO : la figurine sur son socle (le panneau SYSTÈMES) ---- */
  function heroPilote(host) {
    const pl = new Pilote(host, { bubble: true, interactive: true });
    const stage = host.closest('.hero-stage');
    let seq = true;             // séquence de démarrage en cours
    let idleT = 0, asleep = false, clicks = [], ci = 0, cooling = false;

    if (reduced) {
      pl.mood('happy');
      pl.baseMood = 'happy';
    } else {
      host.classList.add('is-kit', 'is-off');
      /* le socle (panneau) arrive d'abord, puis les pièces s'emboîtent
         dessus (délai CSS), puis la visière s'allume */
      const start = () => {
        host.classList.add('is-built');
        setTimeout(() => pl.powerOn(), 1600);
      };
      if (!stage || stage.classList.contains('played')) requestAnimationFrame(start);
      else {
        const mo = new MutationObserver(() => {
          if (stage.classList.contains('played')) { mo.disconnect(); start(); }
        });
        mo.observe(stage, { attributes: true, attributeFilter: ['class'] });
      }
    }

    /* il allume les services un par un et regarde chaque ligne */
    document.addEventListener('kit:svc', (e) => {
      const d = e.detail || {};
      if (reduced) return;
      pl.lookAtEl(d.row);
      pl.blink();
      if (d.last) {
        setTimeout(() => {
          pl.release();
          pl.look(-0.25, 0.1).mood('happy', 2600);
          pl.wave(1800);
          pl.say(LINES.boot, 2600);
          setTimeout(() => { pl.release(); seq = false; }, 2600);
        }, 420);
      }
    });
    /* filet de sécurité : si aucun service n'arrive, on rend la main */
    setTimeout(() => { if (seq) { seq = false; pl.release(); } }, 7000);

    /* suivi du curseur (souris uniquement) */
    trackers.add((p) => {
      if (seq || pl.busy || !pl.visible) return;
      if (asleep) { wake(); return; }
      pl.lookAt(p.x, p.y);
      clearTimeout(idleT);
      idleT = setTimeout(() => { if (!pl.busy) pl.release(); }, 2600);
    });

    /* survol : il arrête son scan, te regarde et fait coucou */
    if (finePointer) {
      host.addEventListener('pointerenter', () => {
        if (seq || pl.busy || asleep) return;
        pl.mood('open');
        if (!reduced) pl.wave(1600);
      });
      host.addEventListener('pointerleave', () => {
        if (seq || pl.busy) return;
        pl.mood(pl.baseMood);
      });
    }

    /* clic : réactions en boucle ; clics frénétiques → surchauffe */
    host.addEventListener('click', () => {
      if (seq || cooling) return;
      if (asleep) { wake(); return; }
      const now = Date.now();
      clicks = clicks.filter(t => now - t < 2600);
      clicks.push(now);
      if (clicks.length >= 6) {
        cooling = true; clicks = [];
        pl.busy = true;
        host.classList.add('is-overheat');
        pl.mood('dizzy').say(LINES.heat, 2200);
        setTimeout(() => {
          host.classList.remove('is-overheat');
          pl.mood(pl.baseMood); pl.busy = false; cooling = false;
        }, 3000);
        return;
      }
      const [m, txt] = LINES.click[ci++ % LINES.click.length];
      pl.mood(m, 2400).say(txt, 2400);
      pl.hop();
      if (!reduced) {
        pl.fly(true);
        setTimeout(() => pl.fly(false), 700);
        /* le socle encaisse l'atterrissage */
        const panel = document.getElementById('statusPanel');
        if (panel) setTimeout(() => {
          panel.classList.remove('is-impact'); void panel.offsetWidth; panel.classList.add('is-impact');
        }, 760);
      }
    });

    /* veille : 20 s sans rien → il s'endort ; il sursaute au réveil */
    let lastAct = Date.now();
    const act = () => { lastAct = Date.now(); };
    ['pointermove', 'keydown', 'scroll', 'touchstart'].forEach(ev => window.addEventListener(ev, act, { passive: true }));
    const wake = () => {
      if (!asleep) return;
      asleep = false;
      host.classList.remove('is-asleep');
      pl.release().mood('surprise', 900).hop();     // release : le scan reprend
      lastAct = Date.now();
    };
    if (!reduced) setInterval(() => {
      if (seq || asleep || pl.busy || !pl.visible || document.hidden) return;
      if (Date.now() - lastAct > 20000) {
        asleep = true;
        pl.release();
        host.classList.remove('is-scanning');
        host.classList.add('is-asleep');
        pl.mood('sleep');
      }
    }, 1000);
    window.addEventListener('scroll', () => { if (asleep && window.scrollY > 10) wake(); }, { passive: true });

    /* retour au hero après un long scroll : un mot, une fois */
    let far = false, greeted = false;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 1400) far = true;
      if (far && !greeted && window.scrollY < 120 && !seq) {
        greeted = true;
        pl.mood('happy', 2400).say(LINES.back, 2400);
        pl.wave(1500);
      }
    }, { passive: true });

    /* clignement occasionnel (vivant, pas mécanique) */
    if (!reduced) {
      const blinkLoop = () => {
        if (!seq && !asleep && pl.visible && !document.hidden) pl.blink();
        setTimeout(blinkLoop, 2600 + Math.random() * 3800);
      };
      setTimeout(blinkLoop, 4000);
    }
    return pl;
  }

  /* ---- PEEK : il passe la tête au-dessus du cadre photo ---- */
  function peekPilote(host) {
    const pl = new Pilote(host, { variant: 'peek', bubble: true, scan: false, clip: true, interactive: true });
    const zone = host.closest('.about-intro') || host.parentElement;
    const fig = host.closest('.portrait');
    const rise = () => {
      host.classList.add('is-up');
      if (reduced) { pl.mood('happy'); return; }
      pl.look(0, 1).mood('open');                        // il regarde la photo…
      setTimeout(() => { pl.look(0.2, -0.2).mood('happy', 1800); }, 900);   // …puis toi
      setTimeout(() => { pl.release(); pl.say('Le pilote humain, c’est lui.', 2400); }, 1300);
    };
    const go = () => setTimeout(rise, reduced ? 0 : 700);
    if (fig && !reduced) {
      if (fig.classList.contains('in')) go();
      else onReveal(fig, go, { threshold: 0.35 });
    } else go();
    let inZone = false;
    if (zone && finePointer) {
      zone.addEventListener('pointerenter', () => { inZone = true; });
      zone.addEventListener('pointerleave', () => { inZone = false; pl.release(); });
    }
    trackers.add((p) => { if (inZone && host.classList.contains('is-up') && !pl.busy) pl.lookAt(p.x, p.y); });
    /* clic : coucou-caché */
    host.addEventListener('click', () => {
      if (pl.busy || reduced) return;
      pl.busy = true;
      host.classList.remove('is-up');
      setTimeout(() => { host.classList.add('is-up'); pl.mood('wink', 1400); }, 520);
      setTimeout(() => { pl.busy = false; }, 900);
    });
    if (!reduced) {
      const loop = () => { if (pl.visible && !document.hidden) pl.blink(); setTimeout(loop, 3000 + Math.random() * 4000); };
      setTimeout(loop, 3000);
    }
    return pl;
  }

  /* ---- WORK : slot P-02 en chantier, il serre les boulons ---- */
  function workPilote(host) {
    const pl = new Pilote(host, { wrench: true, mood: 'focus', pose: 'work', scan: false, bubble: true, interactive: true });
    const card = host.closest('.card') || host;
    if (finePointer) {
      card.addEventListener('pointerenter', () => {
        host.classList.add('is-paused-work');
        pl.mood('open').lookAt(window.innerWidth / 2, window.innerHeight / 2);
      });
      card.addEventListener('pointerleave', () => {
        host.classList.remove('is-paused-work');
        pl.mood('focus').release();
      });
    }
    host.addEventListener('click', () => pl.mood('happy', 1600).say('Bientôt livré. Promis.', 2000));
    return pl;
  }

  /* ---- GHOST : slot P-03, la silhouette en pointillés (pièce à venir) ---- */
  function ghostPilote(host) {
    host.classList.add('pl--ghost');
    return new Pilote(host, { scan: false });
  }

  /* ---- WATCH : page veille, en sentinelle, la main en visière ---- */
  function watchPilote(host) {
    const pl = new Pilote(host, { pose: 'lookout', frontR: true, bubble: true, scan: false, interactive: true });
    host.classList.add('is-watching');
    host.addEventListener('pointerenter', () => { host.classList.remove('is-watching'); pl.mood('happy').look(-0.4, 0.2); });
    host.addEventListener('pointerleave', () => { host.classList.add('is-watching'); pl.mood(null).release(); });
    host.addEventListener('click', () => pl.mood('check', 1800).say('Rien à signaler… pour l’instant.', 2200));
    onReveal(host, () => { if (!reduced) setTimeout(() => pl.say('Vigilance : élevée.', 1800), 500); });
    return pl;
  }

  /* ---- HELLO : page contact, il accueille et suit ta saisie ---- */
  function helloPilote(host) {
    const pl = new Pilote(host, { bubble: true, interactive: true });
    const form = host.closest('form') || document.getElementById('contactForm');
    onReveal(host, () => {
      if (reduced) { pl.mood('happy'); return; }
      setTimeout(() => { pl.mood('happy', 2200).wave(1800); pl.say('Écris-lui, je transmets.', 2400); }, 400);
    });
    if (form) {
      let typing = 0;
      form.addEventListener('focusin', (e) => {
        if (!e.target.matches('input, select, textarea')) return;
        pl.busy = true;
        pl.lookAtEl(e.target).mood('open');
      });
      form.addEventListener('input', () => {
        pl.mood('loading');
        clearTimeout(typing);
        typing = setTimeout(() => pl.mood('open'), 700);
      });
      form.addEventListener('focusout', () => {
        setTimeout(() => {
          if (!form.contains(document.activeElement)) { pl.busy = false; pl.release().mood(null); }
        }, 60);
      });
    }
    trackers.add((p) => { if (!pl.busy && pl.visible) pl.lookAt(p.x, p.y); });
    document.addEventListener('kit:sent', () => {
      pl.busy = true;
      pl.pose('celebrate', 2400).mood('happy', 2400).hop();
      pl.fly(true); setTimeout(() => pl.fly(false), 700);
      pl.say('Message prêt à partir !', 2400);
      setTimeout(() => { pl.busy = false; }, 2400);
    });
    host.addEventListener('click', () => pl.mood('wink', 1400).wave(1400));
    return pl;
  }

  /* ---- LOST : 404, il lui manque une pièce (son bras droit) ---- */
  function lostPilote(host) {
    const pl = new Pilote(host, { noArmR: true, pose: 'scratch', mood: 'question', frontL: true, bubble: true, scan: false, interactive: true });
    host.classList.add('is-scratching');
    if (!reduced) {
      const glance = () => {
        if (!pl.busy) {
          pl.look(0.9, 0.5).mood('surprise');                     // il regarde l'épaule vide…
          setTimeout(() => { if (!pl.busy) pl.release().mood('question'); }, 1100);
        }
        setTimeout(glance, 4200 + Math.random() * 2500);
      };
      setTimeout(glance, 2200);
    }
    host.addEventListener('click', () => {
      pl.busy = true;
      pl.mood('question').say('Tu n’aurais pas vu mon bras ?', 2400);
      setTimeout(() => { pl.busy = false; }, 2400);
    });
    setTimeout(() => pl.say('Pièce manquante. Classique.', 2200), reduced ? 0 : 1200);
    return pl;
  }

  const PRESETS = { hero: heroPilote, peek: peekPilote, work: workPilote, ghost: ghostPilote, watch: watchPilote, hello: helloPilote, lost: lostPilote };

  /* ============================================================
     4. COMPAGNON — le bouton « remonter » devient son socle
     Il atterrit quand on descend, réagit aux sections, et
     décolle (propulseurs) quand on clique pour remonter.
     ============================================================ */
  function initDock() {
    const btn = document.getElementById('scrollTop');
    if (!btn) return null;
    btn.classList.add('dock');
    btn.innerHTML =
      '<span class="dock-pilot"></span>' +
      '<span class="dock-base" aria-hidden="true"><i></i>TOP</span>';
    const pl = new Pilote($('.dock-pilot', btn), { bubble: true, interactive: true });
    const main = document.querySelector('main');
    const wide = () => window.innerWidth >= 900;
    let landed = false, helloDone = false;

    const parse = (s) => {
      const i = (s || '').indexOf('|');
      return i === -1 ? [null, s] : [s.slice(0, i) || null, s.slice(i + 1)];
    };
    const react = (spec) => {
      if (!btn.classList.contains('show') || pl.busy) return;
      const [m, txt] = parse(spec);
      if (m) pl.mood(m, 2600);
      if (txt && wide()) pl.say(txt, 2400);
      else pl.blink();
    };

    const land = () => {
      if (reduced) return;
      const h = pl.host;
      h.classList.remove('is-launch');
      h.classList.add('is-landing');
      pl.fly(true);
      setTimeout(() => pl.fly(false), 520);
      setTimeout(() => h.classList.remove('is-landing'), 760);
      if (!helloDone && main && main.dataset.plHello) {
        helloDone = true;
        setTimeout(() => react(main.dataset.plHello), 800);
      }
    };
    pl.host.classList.add('pl-hold');          // rangé : animations en pause
    new MutationObserver(() => {
      const on = btn.classList.contains('show');
      pl.host.classList.toggle('pl-hold', !on);
      if (on && !landed) { landed = true; land(); }
      else if (!on && landed) {
        landed = false;
        pl.hush();
        setTimeout(() => { if (!btn.classList.contains('show')) pl.host.classList.remove('is-launch'); }, 400);
      }
    }).observe(btn, { attributes: true, attributeFilter: ['class'] });

    btn.addEventListener('click', () => {
      if (reduced) return;
      pl.hush();
      pl.mood('happy');
      pl.fly(true);
      pl.host.classList.add('is-launch');
      setTimeout(() => { pl.fly(false); pl.mood(null); }, 1100);
    });
    if (finePointer) {
      btn.addEventListener('pointerenter', () => { if (!pl.busy) pl.look(0, -1).mood('open'); });
      btn.addEventListener('pointerleave', () => { pl.release().mood(null); });
    }

    /* réactions de section : data-pl="humeur|texte" (une fois chacune) */
    const spots = $$('[data-pl]');
    if (spots.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((ents) => {
        ents.forEach(en => {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          react(en.target.dataset.pl);
        });
      }, { rootMargin: '0px 0px -45% 0px', threshold: 0 });
      spots.forEach(s => io.observe(s));
    }

    /* événements du site */
    document.addEventListener('kit:copy', () => react('check|Copié. Il ne reste qu’à coller.'));
    document.addEventListener('kit:theme', (e) => {
      const dark = e.detail && e.detail.theme === 'dark';
      react(dark ? 'happy|LED UNIT : ON.' : 'open|LED UNIT : OFF.');
    });
    return pl;
  }

  /* ============================================================
     5. ÉVÉNEMENTS GLOBAUX
     ============================================================ */
  document.addEventListener('kit:incident', () => all.forEach(p => { if (p.visible) p.alert(2500); }));
  document.addEventListener('kit:theme', () => all.forEach(p => { if (p.visible && !p.busy) p.blink(); }));
  /* palette ⌘K → « Appeler le pilote » : le plus proche répond */
  document.addEventListener('kit:call', () => {
    const dock = Pilote.dock;
    const dockOn = dock && dock.host.closest('.show');
    const pick = all.find(p => p.visible && p !== dock && !p.host.classList.contains('pl--ghost')) || (dockOn ? dock : null);
    if (!pick) { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); return; }
    pick.mood('happy', 2400).say('Présent ! SH-14, à ton service.', 2400);
    if (pick.o.variant !== 'peek' && !pick.o.noArmR && pick.basePose === 'stand') pick.wave(1600);
    else pick.hop();
  });

  /* ============================================================
     6. SPRITE PIXEL — le runner du mini-jeu (script.js l'appelle)
     Grille 19 × 21, 1 unité = u px. frame 0/1 = course, 2 = saut.
     ============================================================ */
  function drawRunner(ctx, x, y, u, frame, c) {
    const px = (cx, cy, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x + cx * u, y + cy * u, w * u, h * u); };
    const box = (cx, cy, w, h, col) => { px(cx - 1, cy - 1, w + 2, h + 2, c.line); px(cx, cy, w, h, col); };
    // antenne + oreillette
    px(4, 0, 1, 1, c.gold); px(4, 1, 1, 2, c.line);
    px(1, 4, 2, 4, c.line); px(1, 5, 1, 2, c.gold);
    // casque, visière, mono-œil (regarde devant)
    box(4, 3, 11, 7, c.plastic);
    px(5, 5, 9, 3, c.line);
    px(10, 6, 4, 1, c.led);
    px(13, 3, 2, 7, c.shade);
    // cou + torse + épaulières
    px(8, 10, 3, 1, c.line);
    box(5, 12, 9, 4, c.plastic);
    px(8, 12, 3, 4, c.line); px(9, 13, 1, 3, c.red);
    box(3, 11, 2, 2, c.plastic); px(3, 11, 2, 1, c.red);
    box(14, 11, 2, 2, c.plastic);
    const air = frame === 2;
    // bras (balancier)
    if (frame === 0) { px(3, 14, 2, 2, c.plastic); px(14, 13, 2, 2, c.plastic); }
    else { px(3, 13, 2, 2, c.plastic); px(14, 14, 2, 2, c.plastic); }
    // bassin
    px(6, 16, 7, 1, c.line); px(9, 16, 1, 1, c.gold);
    // jambes
    if (air) {
      box(6, 17, 2, 2, c.plastic); box(11, 17, 2, 2, c.plastic);
      px(5, 19, 4, 1, c.line); px(10, 19, 4, 1, c.line);
      px(6, 20, 2, 1, c.red); px(11, 20, 2, 1, c.red);          // propulseurs
    } else if (frame === 0) {
      box(6, 17, 2, 2, c.plastic); px(5, 20, 4, 1, c.line); px(6, 19, 2, 1, c.red);
      box(11, 17, 2, 1, c.plastic); px(11, 19, 4, 1, c.line);
    } else {
      box(6, 17, 2, 1, c.plastic); px(5, 19, 4, 1, c.line);
      box(11, 17, 2, 2, c.plastic); px(10, 20, 4, 1, c.line); px(11, 19, 2, 1, c.red);
    }
  }

  /* ============================================================
     7. MONTAGE
     ============================================================ */
  function mountAll() {
    $$('[data-pilote]').forEach(el => {
      if (el.__pilote) return;
      const fn = PRESETS[el.dataset.pilote];
      if (fn) el.__pilote = fn(el);
    });
    Pilote.dock = initDock();
  }

  window.Pilote = Pilote;
  Pilote.build = build;
  Pilote.all = all;
  Pilote.drawRunner = drawRunner;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
  else mountAll();
})();
