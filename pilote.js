/* ============================================================
   pilote.js — SH-14, le pilote du kit (mascotte)
   ------------------------------------------------------------
   Une seule source de vérité : build() dessine le robot,
   la classe Pilote le fait vivre. Toutes les apparitions
   sortent d'ici — hero, compagnon (bouton remonter), caméos
   de page, 404, sprite du dino runner.

   Côté HTML c'est déclaratif :
     <div data-pilote="hero|peek|work|ghost|watch|hello|lost|badge|stamp">
   Réactions de section (compagnon) :
     data-pl="humeur|texte"   sur un titre ou un bloc
     data-pl-hello="humeur|texte"  sur <main> (arrivée sur la page)
   Événements écoutés (émis par script.js) :
     kit:svc  kit:theme  kit:incident  kit:copy  kit:sent  kit:call
     kit:feed (flux de veille)  kit:filter (filtre des certifs)
   Un seul personnage : les apparitions « station » (hero, portrait,
   chantier, veille, contact, médaille, tampon) et le dock ne se
   montrent jamais en même temps — il va de l'une à l'autre.

   Règles DA : aplats, lignes de panneau, ombre dure, mouvement
   de servo (ça claque, ça s'arrête net). La seule lumière du
   kit, c'est la « LED unit » : visière et voyants, qui ne
   brillent vraiment que sur la face BOX ART (sombre).
   Sous prefers-reduced-motion : poses fixes, expressions
   sans mouvement, pas de vol.

   v4 — KIT DELUXE + BATTLE-WORN
   Même silhouette, plus de matière : ombrage box art en aplats
   durs (trois tons, jamais de dégradé), gravures de panneau,
   décalques (série, caution, marques de mission), et l'usure
   d'un robot qui travaille vraiment : éclats de peinture,
   rayures, graisse sur les poings, sticker qui se décolle,
   plaque réparée sur le terrain. Les détails fins (.pl-fine)
   disparaissent sur les petites apparitions pour rester nets.
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
     v4 (détails) :
     d  = ombre portée (3e ton, coins que la lumière n'atteint pas)
     hw = arête éclairée (voile blanc à plat, lumière haut-gauche)
     pn = gravure de panneau · th = contour fin (petites pièces)
     wr = éclat de peinture (sous-couche graphite)
     wp = éclat sur pièce de couleur (le plastique réapparaît)
     sc = rayure · so = graisse / suie · g = LED verte « UP »
     ============================================================ */
  /* Marques de mission (cuisse gauche) : 1 carré plein par projet
     livré, un carré vide par projet en préparation.
     → à mettre à jour quand P-02 / P-03 sont livrés. */
  const MISSIONS = { done: 1, total: 3 };
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
    line(61.6, 297, 95.6, 298.6, 'h') + line(104.4, 298.6, 138.6, 297, 'h') +
    DX_LEGS();

  /* ---- v4 : jambes deluxe + usure ---- */
  function DX_LEGS() {
    /* marques de mission : pleines = livrées, vides = en préparation */
    let marks = '';
    for (let i = 0; i < MISSIONS.total; i++) {
      const x = 80.2 + i * 5.3;
      marks += i < MISSIONS.done ? rect(x, 195, 3.8, 3.8, 'r n pl-mm') : rect(x + 0.45, 195.45, 2.9, 2.9, 'pl-mm-o');
    }
    return grp('pl-dx',
      /* reflets sur le graphite des cuisses */
      poly('75.1,180 77.7,180 75.9,212.4 73.3,212.4', 'hw') +
      poly('103.3,180 105.9,180 107.7,214.6 105.1,214.6', 'hw') +
      marks +
      /* plaque réparée sur le terrain, un peu de travers, rivetée */
      poly('109.4,188.4 121.8,188 122.2,198.4 109.8,198.8', 's th') +
      rect(110.5, 189.5, 1.8, 1.8, 'k n') + rect(119.7, 189.2, 1.8, 1.8, 'k n') +
      rect(110.8, 196, 1.8, 1.8, 'k n') + rect(120, 195.7, 1.8, 1.8, 'k n') +
      /* genoux : boulons éclairés, éclats aux angles */
      rect(81, 224, 3.6, 1.1, 'hw') + rect(115.4, 224, 3.6, 1.1, 'hw') +
      poly('68.9,233.4 71.8,235.9 68.9,236.2', 'wr n') + poly('131.1,233.4 128.2,235.9 131.1,236.2', 'wr n') +
      /* tibias : bandes rouges éclairées, écaillées ; ombre au pied */
      poly('75.3,248.6 77.5,248.6 75.5,279.4 73.4,279.4', 'hw') +
      poly('117.3,248.6 119.5,248.6 121.4,279.4 119.3,279.4', 'hw') +
      poly('76.4,262.2 79.6,261.6 77.8,264.6', 'wp n') + poly('121.2,270.4 124,271 121.8,273', 'wp n') +
      poly('67.3,280.6 94.2,282.5 94,286 67,284', 'd n') + poly('106.2,282.5 132.8,280.6 133,284 106,286', 'd n') +
      /* sticker « caution » sur le tibia droit */
      poly('108.2,258.6 115.4,258.6 111.8,252.4', 'y th') + rect(111.3, 254.5, 1.1, 2.3, 'k n') + rect(111.3, 257.2, 1.1, .8, 'k n') +
      /* pieds : arête avant éclairée ; tuyères qui gardent la chaleur */
      poly('63.6,285 94.4,287 94.5,288.3 63.4,286.3', 'hw') + poly('105.6,287 136.4,285 136.6,286.3 105.5,288.3', 'hw') +
      rect(71.5, 305.2, 15, 2.2, 'pl-heat') + rect(113.5, 305.2, 15, 2.2, 'pl-heat')) +
    grp('pl-dx pl-fine',
      line(68.7, 244.3, 95.6, 246.2, 'pn') + line(104.4, 246.2, 131.3, 244.3, 'pn') +
      line(112, 196.6, 119.8, 190.4, 'pn') +
      line(72.6, 229.6, 77.2, 226.6, 'sc') + line(70.2, 271, 71.6, 265.4, 'sc') + line(126.6, 226.8, 128.8, 231.6, 'sc'));
  }

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
      line(136, 188.4, 139.6, 188.4, 'pl-tagl') + line(136, 191.6, 139.6, 191.6, 'pl-tagl')) +
    /* v4 : arêtes éclairées, ombre sous la jupe, jupes écaillées, rivet de sacoche */
    grp('pl-dx',
      poly('77.2,157.1 122.8,157.1 123.1,158.4 76.9,158.4', 'hw') + rect(93.4, 161.4, 13.2, 1.1, 'hw') +
      poly('61.6,175.4 73.3,178.2 73,181 61,178', 'd n') +
      poly('84.2,189.2 87.2,188.9 85.5,190.7', 'wp n') + poly('114.6,188.9 117.4,189.2 115.9,190.8', 'wp n') +
      rect(134.6, 162.4, 2.2, 2.2, 'k n')) +
    grp('pl-dx pl-fine', line(87.6, 180.2, 87.4, 187.2, 'pn') + line(112.4, 180.2, 112.6, 187.2, 'pn'));

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
    '<text class="pl-decal" x="73.6" y="119.4">14</text>' +
    /* v4 : ombre sous le plastron, LED verte « UP » au col, éclats */
    grp('pl-dx',
      poly('72.4,141.2 100,154.6 100,160 70,144', 'd n') +
      poly('81.6,92.9 118.4,92.9 117.9,94 82.1,94', 'hw') +
      rect(110.4, 94.4, 3.6, 2.2, 'g n pl-ok') +
      poly('70.9,92.8 74.8,92.8 71.9,95.8', 'wr n') + poly('64.9,108.6 67,110.2 65.1,112.2', 'wr n') +
      /* médaille épinglée (gagnée sur la page Certifications) */
      grp('pl-medal', rect(76.4, 120.6, 3.8, 3.4, 'r n') + poly('74.6,123.6 82,123.6 82,129.8 80.4,131.4 74.6,131.4', 'y th') +
        rect(77.4, 126, 1.8, 1.8, 'k n'))) +
    grp('pl-dx pl-fine',
      line(66.6, 104, 86, 104, 'pn') + line(114, 104, 133.4, 104, 'pn') +
      /* ouïes + numéro de série (code-barres) côté ombre */
      line(119, 108.6, 128.4, 108.6, 'pn') + line(119, 111.6, 128.8, 111.6, 'pn') + line(119, 114.6, 129.2, 114.6, 'pn') +
      rect(119.2, 139, .9, 4.2, 'k n') + rect(120.8, 139, .5, 4.2, 'k n') + rect(121.9, 139, 1.2, 4.2, 'k n') +
      rect(123.7, 139, .5, 4.2, 'k n') + rect(124.8, 139, .9, 4.2, 'k n') + rect(126.2, 139, .5, 3.4, 'k n') +
      line(74.4, 98.4, 79, 95.6, 'sc') + line(76.6, 136.4, 81.4, 133.2, 'sc'));

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
    rect(150.5, 120.5, 3, 3, 'k n') + rect(133.5, 118.5, 3, 3, 'k n') +
    /* v4 : panneau rouge éclairé et écaillé, coins marqués, sticker hazard
       qui se décolle, ombre portée sous les épaulières */
    grp('pl-dx',
      poly('38.8,99.5 53.2,92 53.2,93.9 38.8,101.4', 'hw') +
      poly('48.6,93.6 51.6,92.1 50.6,95', 'wp n') + poly('38.9,106.4 41.3,105.2 39.9,108.3', 'wp n') +
      poly('34.9,96.5 38,95 36.2,98.4', 'wr n') + poly('168.2,113.4 169.3,111 166.4,112.3', 'wr n') +
      poly('44.2,125.8 72,122 72,124 44,128', 'd n') + poly('155.8,125.8 128,122 128,124 156,128', 'd n') +
      poly('162,111 158.6,109.3 162,106.9', 'wp n') + line(158.6, 109.3, 162, 106.9, 'pn')) +
    grp('pl-dx pl-fine',
      line(62.5, 96.4, 62.5, 118.8, 'pn') + line(137.5, 96.4, 137.5, 118.8, 'pn') +
      line(65.6, 100.4, 69.2, 104.4, 'sc') + line(58.6, 113, 62.8, 110.4, 'sc') + line(152.6, 115.4, 157.6, 112.6, 'sc'));

  /* bras articulés : bras (épaule) + avant-bras (coude) — deux groupes
     indépendants, l'avant-bras compose les deux rotations en CSS */
  const ARM = {
    l: {
      ua: poly('36,104 62,110 57,148 31,142') + poly('52,107.7 62,110 57,148 48.5,146', 's n') +
          /* v4 : brassard bleu (ombré côté droit), ombre au coude */
          grp('pl-dx',
            poly('32.6,130.6 58.3,136.4 57.6,142.2 31.9,136.4', 'b n') +
            poly('49,134.3 58.3,136.4 57.6,142.2 48.3,140.1', 'sh n') +
            poly('32.7,130.8 58.2,136.5 58.1,137.6 32.6,131.9', 'hw') +
            poly('31.6,140.2 57.3,146 57,148 31,142', 'd n')) +
          grp('pl-dx pl-fine', line(37.6, 138.2, 41.8, 135.4, 'sc')),
      fa: poly('40,141.5 48,141.5 50.5,145 50.5,151 48,154.5 40,154.5 37.5,151 37.5,145', 'k') +
          poly('30,148 56,152 52,190 26,186') + poly('46,150.5 56,152 52,190 42.4,188.6', 's n') +
          poly('28,162 55,166 54,177 27,173', 'k') +
          poly('24,190 50,194 47,212 21,208') + poly('40,192.5 50,194 47,212 37.4,210.6', 's n') +
          line(22.8, 200, 48.6, 203.8, 't') +
          /* v4 : manchette éclairée, ombre au poignet, graisse sur le poing */
          grp('pl-dx',
            poly('28.1,162.7 54.8,166.7 54.7,168 28,164', 'hw') +
            poly('26.6,182.6 52.4,186.4 52,190 26,186', 'd n') +
            poly('21.5,204.6 47.6,208.4 47,212 21,208', 'so n')) +
          grp('pl-dx pl-fine', line(33, 157.6, 37.6, 154.2, 'sc')),
    },
    r: {
      ua: poly('164,104 138,110 143,148 169,142') + poly('154,106.3 164,104 169,142 159,144.3', 's n') +
          /* v4 : écusson or « certifié » (chevron de grade), ombre au coude */
          grp('pl-dx',
            poly('145.4,130.6 154.6,129 156.2,130.8 157,138.8 147.8,140.4 146.2,138.6', 'y th') +
            path('M148.6,136.8 L151.6,133.9 L154.8,135.9', 'pl-chev') +
            poly('142.8,145.2 168.5,139.6 169,142 143,148', 'd n')) +
          grp('pl-dx pl-fine', line(159.4, 131.4, 163.6, 134.6, 'sc')),
      fa: poly('153,141.5 161,141.5 163.5,145 163.5,151 161,154.5 153,154.5 150.5,151 150.5,145', 'k') +
          poly('170,148 144,152 148,190 174,186') + poly('160,149.5 170,148 174,186 164.4,187.5', 's n') +
          poly('172,162 145,166 146,177 173,173', 'k') +
          poly('176,190 150,194 153,212 179,208') + poly('166,191.5 176,190 179,208 169.4,209.4', 's n') +
          line(151.4, 203.8, 177.2, 200, 't') +
          grp('pl-dx',
            poly('145.2,166.7 171.9,162.7 172,164 145.3,168', 'hw') +
            poly('147.6,186.4 173.4,182.6 174,186 148,190', 'd n') +
            poly('152.4,208.4 178.5,204.6 179,208 153,212', 'so n')) +
          grp('pl-dx pl-fine', line(163, 154.2, 167.6, 157.6, 'sc')),
    },
  };
  /* clé plate tenue en main (pose « work »), + étincelles */
  const WRENCH_HAND =
    poly('162.4,196 167.4,196 168.6,238 163.6,238', 'k') +
    poly('157.6,236 174.4,236 175,247 170.4,247 170.2,241.4 162.2,241.4 162.4,247 157.8,247', 'k') +
    grp('pl-sparks',
      rect(158, 252, 3, 3, 'y n') + rect(170, 254, 2.6, 2.6, 'y n') + rect(164, 258, 2.4, 2.4, 'r n') +
      rect(175.5, 249, 2.2, 2.2, 'y n'));
  /* médaille brandie (page Certifications, pose « victory ») :
     dessinée dans le repère de l'avant-bras au repos, donc tête en bas —
     une fois le bras levé (~ -173°), elle se lit droite. Visible
     uniquement bras levé (voir style.css). */
  const BADGE_HAND =
    grp('pl-badge',
      rect(160.6, 208.6, 7.6, 11, 'r th') +
      poly('156.4,218 172.4,218 174.4,220 174.4,236 172.4,238 156.4,238 154.4,236 154.4,220', 'y th') +
      poly('164.4,234.6 162.9,230.5 158.5,230.3 161.9,227.6 160.8,223.4 164.4,225.8 168,223.4 166.9,227.6 170.3,230.3 165.9,230.5', 'k n') +
      rect(156.4, 236, 16, 1.2, 'hw'));
  /* tampon (page Épreuves) : il pend toujours droit sous le poing —
     une contre-rotation CSS annule celle du bras (voir .pl-stamp).
     Dessiné devant l'avant-bras : bras levé, on le voit devant. */
  const STAMP_HAND =
    grp('pl-stamp',
      rect(32.5, 210.6, 6, 6.8, 'k n') +
      poly('24.5,217 46.5,217 48,226 23,226', 'r th') + rect(25.2, 217.7, 20.6, 1.2, 'hw') +
      rect(23.4, 223.4, 24.2, 2.6, 'k n') + rect(22.6, 226, 25.8, 3.6, 'k n'));

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
    grp('pl-scanwrap', grp('pl-eyewrap', rect(86.6, 42.2, 26.8, 7.6, 'e pl-bloom') + rect(90, 44.2, 20, 3.6, 'e pl-eye'))) +
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
    grp('pl-x pl-x-sleep', rect(83, 49.6, 9, 2.2, 'e') + rect(108, 49.6, 9, 2.2, 'e')) +
    /* v4 : yeux étoiles (badge débloqué) + joues LED (il est content) */
    grp('pl-x pl-x-star',
      path('M87.5,42 L89.1,45.6 L92.8,47.2 L89.1,48.8 L87.5,52.4 L85.9,48.8 L82.2,47.2 L85.9,45.6 Z', 'e pl-gold') +
      path('M112.5,42 L114.1,45.6 L117.8,47.2 L114.1,48.8 L112.5,52.4 L110.9,48.8 L107.2,47.2 L110.9,45.6 Z', 'e pl-gold')) +
    grp('pl-x pl-x-blush', rect(79.6, 55, 7, 2.2, 'e pl-red') + rect(113.4, 55, 7, 2.2, 'e pl-red'));

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
      /* v4 : ombre sous la visière, bandeau frontal gravé, casque écaillé */
      grp('pl-dx',
        poly('83.5,62.6 116.5,62.6 114.6,65.2 85.4,65.2', 'd n') +
        poly('80.6,20.9 84.6,20.9 81.4,23.8', 'wr n') + poly('129.1,57.2 129.1,61.4 127.3,59.6', 'wr n') +
        poly('71.2,56.6 73.6,59.2 71.2,60.2', 'wr n') + rect(97, 22.4, 6, 1, 'hw')) +
      grp('pl-dx pl-fine',
        line(77, 34.6, 123, 34.6, 'pn') + line(84.2, 27.4, 88.8, 24.6, 'sc') + line(121.6, 66.8, 124.4, 62.2, 'sc')) +
      /* visière + matrice LED (+ balayage de rafraîchissement) */
      poly('74,38 126,38 126,52 117,62 83,62 74,52', 'v') +
      grp('pl-face', grp('pl-lid', FACE) + rect(74, 35.6, 52, 2.4, 'pl-scanl'), ` clip-path="url(#plv${id})"`) +
      poly('77,40.4 88,40.4 82.6,46 77,46', 'pl-glint n') +
      poly('119.2,40.4 122.6,40.4 120.2,43 116.8,43', 'pl-glint n') +
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
     badge   : médaille dans la main droite (visible bras levé)
     stamp   : tampon dans la main gauche
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
    const faL = grp('pl-fa pl-fa-l', ARM.l.fa + (o.stamp ? STAMP_HAND : ''));
    const faR = grp('pl-fa pl-fa-r', (o.wrench ? WRENCH_HAND : '') + (o.badge ? BADGE_HAND : '') + ARM.r.fa);
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
  const MOODS = ['open', 'happy', 'wink', 'surprise', 'focus', 'alert', 'question', 'check', 'loading', 'dizzy', 'sleep', 'star'];
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
    /* propulseurs — à l'extinction, les tuyères restent rouges un moment */
    fly(on) {
      const was = this.host.classList.contains('is-flying');
      this.host.classList.toggle('is-flying', !!on);
      if (was && !on && !reduced) {
        this.host.classList.remove('is-hot');
        void this.host.offsetWidth;
        this.host.classList.add('is-hot');
        clearTimeout(this._hot);
        this._hot = setTimeout(() => this.host.classList.remove('is-hot'), 2600);
      }
      return this;
    }
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
    /* bascule de thème : la LED unit se coupe et redémarre sur l'autre face */
    powerCycle() {
      if (reduced || this.host.classList.contains('is-off')) return this;
      this.host.classList.add('is-off');
      clearTimeout(this._pc);
      this._pc = setTimeout(() => this.powerOn(), 160);
      return this;
    }
    /* petite séquence : [[ms, fn], …] — annulée si une autre commence */
    play(steps) {
      (this._seq || []).forEach(clearTimeout);
      this._seq = steps.map(([ms, fn]) => setTimeout(fn, ms));
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
    const pl = new Pilote(host, { bubble: true, interactive: true, station: true });
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

    /* ---- v4 : un seul personnage qui voyage ----
       Quand on descend, il décolle de son socle et c'est lui qui
       atterrit sur le bouton « remonter » (le dock). Quand on
       revient en haut, le dock redécolle et il se repose ici :
       le visiteur suit toujours le même robot (voir initDock). */
    let away = false, greeted = false;
    const panel = document.getElementById('statusPanel');
    const impact = () => {
      if (!panel) return;
      panel.classList.remove('is-impact'); void panel.offsetWidth; panel.classList.add('is-impact');
    };
    pl.depart = () => {
      if (away || reduced) return;
      away = true;
      pl.hush();
      clearTimeout(idleT);
      if (asleep) { asleep = false; host.classList.remove('is-asleep'); pl.mood(pl.baseMood); }
      host.classList.remove('is-arriving');
      pl.fly(true);
      host.classList.add('is-away');
      setTimeout(() => pl.fly(false), 700);
    };
    pl.arrive = () => {
      if (!away || reduced) return;
      away = false;
      pl.busy = true;
      host.classList.remove('is-away');
      host.classList.add('is-arriving');
      pl.fly(true);
      setTimeout(() => { pl.fly(false); impact(); }, 640);
      setTimeout(() => {
        host.classList.remove('is-arriving');
        pl.busy = false;
        if (!greeted) { greeted = true; pl.mood('happy', 2400).say(LINES.back, 2400); pl.wave(1500); }
        else pl.mood('happy', 1200).blink();
      }, 920);
      lastAct = Date.now();
    };

    /* survol des boutons du hero : il regarde, et ça se voit sur sa visière */
    if (finePointer && stage) {
      $$('.btn', stage).forEach(btn => {
        btn.addEventListener('pointerenter', () => {
          if (seq || away || asleep || pl.busy) return;
          const m = btn.classList.contains('btn-primary') ? 'happy'
            : btn.hasAttribute('download') ? 'check'
            : btn.target === '_blank' ? 'wink' : 'open';
          pl.lookAtEl(btn).mood(m, 1600);
        });
      });
    }

    /* petites manies au repos : il regarde autour, vérifie sa jauge,
       s'étire, salue. Jamais quand on bouge la souris, jamais bavard. */
    let lastPtr = 0, fi = 0;
    trackers.add(() => { lastPtr = Date.now(); });
    const FIDGETS = [
      () => pl.play([[0, () => pl.look(-0.9, 0.05)], [700, () => pl.look(0.9, 0.05)], [1400, () => pl.release()]]),
      () => { pl.look(0.05, 1).mood('loading'); pl.play([[1000, () => pl.mood('check', 900)], [1900, () => pl.release()]]); },
      () => { pl.pose('celebrate', 1100); pl.mood('happy', 1100); },
      () => { pl.pose('salute', 1600); pl.mood('wink', 1600); },
    ];
    if (!reduced) {
      const fidget = () => {
        const calm = Date.now() - lastPtr > 2500 && Date.now() - lastAct < 18000;
        if (calm && !seq && !away && !asleep && !pl.busy && pl.visible && !document.hidden) FIDGETS[fi++ % FIDGETS.length]();
        setTimeout(fidget, 9000 + Math.random() * 6000);
      };
      setTimeout(fidget, 11000);
    }

    /* clignement occasionnel (vivant, pas mécanique) */
    if (!reduced) {
      const blinkLoop = () => {
        if (!seq && !asleep && pl.visible && !document.hidden) pl.blink();
        setTimeout(blinkLoop, 2600 + Math.random() * 3800);
      };
      setTimeout(blinkLoop, 4000);
    }
    Pilote.hero = pl;
    return pl;
  }

  /* ---- PEEK : il passe la tête au-dessus du cadre photo ---- */
  function peekPilote(host) {
    const pl = new Pilote(host, { variant: 'peek', bubble: true, scan: false, clip: true, interactive: true, station: true });
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
    const pl = new Pilote(host, { wrench: true, mood: 'focus', pose: 'work', scan: false, bubble: true, interactive: true, station: true });
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
    const pl = new Pilote(host, { pose: 'lookout', frontR: true, bubble: true, scan: false, interactive: true, station: true });
    host.classList.add('is-watching');
    host.addEventListener('pointerenter', () => { host.classList.remove('is-watching'); pl.mood('happy').look(-0.4, 0.2); });
    host.addEventListener('pointerleave', () => { host.classList.add('is-watching'); pl.mood(null).release(); });
    host.addEventListener('click', () => pl.mood('check', 1800).say('Rien à signaler… pour l’instant.', 2200));
    onReveal(host, () => { if (!reduced) setTimeout(() => pl.say('Vigilance : élevée.', 1800), 500); });
    /* v4 : il lit vraiment le flux — une alerte le fait réagir */
    let hovered = false;
    host.addEventListener('pointerenter', () => { hovered = true; });
    host.addEventListener('pointerleave', () => { hovered = false; });
    const term = host.parentElement && host.parentElement.querySelector('.term');
    document.addEventListener('kit:feed', (e) => {
      if (reduced || hovered || !pl.visible || document.hidden) return;
      const txt = (e.detail && e.detail.text) || '';
      if (/HIGH|alerte|ransomware/i.test(txt)) {
        host.classList.add('is-alarm');
        pl.mood('alert', 1500);
        setTimeout(() => host.classList.remove('is-alarm'), 1500);
      } else {
        host.classList.remove('is-watching');
        pl.lookAtEl(term).mood('focus', 900);
        setTimeout(() => { if (!hovered) { pl.release(); host.classList.add('is-watching'); } }, 1000);
      }
    });
    return pl;
  }

  /* ---- HELLO : page contact, il accueille et suit ta saisie ---- */
  function helloPilote(host) {
    const pl = new Pilote(host, { bubble: true, interactive: true, station: true });
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

  /* ---- BADGE : page certifications, il brandit la médaille ----
     Au premier passage, il la lève, puis l'épingle sur son plastron :
     à partir de là, il la porte sur tout le site (localStorage). */
  function badgePilote(host) {
    const pl = new Pilote(host, { badge: true, bubble: true, interactive: true, scan: false, station: true });
    const grid = document.querySelector('.cert-filter + .grid');
    const lines = ['Collection en cours.', 'AI Fluency : 10/10.', 'Prochain badge : en approche.'];
    let li = 0;
    const cheer = (txt, then) => {
      pl.busy = true;
      pl.pose('victory').mood('star');
      if (!reduced) { pl.hop(); pl.fly(true); setTimeout(() => pl.fly(false), 600); }
      if (txt) pl.say(txt, 2400);
      setTimeout(() => {
        pl.pose('stand'); pl.mood(null); pl.busy = false;
        if (then) then();
      }, 2700);
    };
    onReveal(host, () => setTimeout(() => cheer('13 badges au compteur. Celle-là, je la garde.', () => {
      document.documentElement.classList.add('pl-decorated');
      try { localStorage.setItem('pl-medal', '1'); } catch (e) {}
      pl.mood('happy', 1400).blink();
    }), reduced ? 0 : 500), { threshold: 0.6 });
    host.addEventListener('click', () => { if (!pl.busy) cheer(lines[li++ % lines.length]); });
    /* filtre, tri, recherche : il vérifie la grille */
    document.addEventListener('kit:filter', (e) => {
      const d = e.detail || {};
      if (!pl.visible || pl.busy) return;
      if (!d.shown) { pl.mood('question', 1800).say('Aucune pièce ne correspond.', 1800); return; }
      pl.lookAtEl(grid).mood('check', 1200);
      clearTimeout(pl._rl);
      pl._rl = setTimeout(() => pl.release(), 1300);
    });
    return pl;
  }

  /* ---- STAMP : page épreuves, contrôle qualité de l'épreuve livrée ----
     Il lève le tampon, frappe, l'encre « LIVRÉE » reste sur la carte. */
  function stampPilote(host) {
    const pl = new Pilote(host, { stamp: true, bubble: true, interactive: true, scan: false, station: true });
    const card = host.closest('.card');
    const mark = document.createElement('span');
    mark.className = 'qc-stamp';
    mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML = '<b>LIVRÉE</b><i>E4 · QC OK</i>';
    host.appendChild(mark);
    let first = true;
    const stamp = () => {
      if (pl.busy) return;
      pl.busy = true;
      const say = first;
      first = false;
      if (reduced) {
        mark.classList.add('is-on');
        pl.mood('check', 1800);
        if (say) pl.say('E4 : livrée. Tamponnée.', 2200);
        pl.busy = false;
        return;
      }
      pl.pose('stamp-up').mood('focus');
      pl.play([
        [560, () => pl.pose('stamp-down')],
        [720, () => {                           /* impact : l'encre se dépose, la carte encaisse */
          mark.classList.remove('is-thump'); void mark.offsetWidth;
          mark.classList.add('is-on', 'is-thump');
          if (card) { card.classList.remove('is-stamped'); void card.offsetWidth; card.classList.add('is-stamped'); }
          pl.mood('check', 1800);
        }],
        [1100, () => { pl.pose('stand'); if (say) pl.say('E4 : livrée. Tamponnée.', 2200); }],
        [1400, () => { pl.busy = false; }],
      ]);
    };
    onReveal(host, () => setTimeout(stamp, reduced ? 0 : 450), { threshold: 0.6 });
    host.addEventListener('click', stamp);
    if (finePointer) host.addEventListener('pointerenter', () => { if (!pl.busy) pl.mood('happy', 1400).wave(1400); });
    /* E6 en préparation : il y jette un œil quand elle arrive à l'écran */
    const e6 = document.querySelector('.card[data-part="E-06"]');
    if (e6 && !reduced) onReveal(e6, () => setTimeout(() => {
      if (pl.busy || !pl.visible) return;
      pl.lookAtEl(e6).mood('loading', 1800).say('E6 : en build. Je repasse.', 2000);
      setTimeout(() => pl.release(), 1900);
    }, 2200), { threshold: 0.6 });
    return pl;
  }

  /* ---- PAQUET : schéma Centreon (projets), une donnée qui voyage ----
     La tête du pilote saute de brique en brique, comme une donnée
     qui remonte la chaîne : chaque brique s'allume quand il s'y pose,
     jusqu'à l'interface web. Puis il repart de l'hôte. */
  function initPackets() {
    if (reduced) return;
    $$('.archi:not(.is-placeholder) svg').forEach((svg) => {
      const nodes = $$('.node', svg);
      if (nodes.length < 2) return;
      const xs = nodes.map((n) => {
        const r = n.querySelector('rect');
        return r ? parseFloat(r.getAttribute('x')) + parseFloat(r.getAttribute('width')) / 2 : 0;
      });
      const NS = 'http://www.w3.org/2000/svg';
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'pl-packet');
      g.innerHTML =
        '<g class="pl-packet-in">' +
        poly('-11,-5 -8,-9 8,-9 11,-5 11,4 8,8 -8,8 -11,4', 'pp-h') + poly('3.6,-9 8,-9 11,-5 11,4 8,8 3.6,8', 'pp-s') +
        poly('-8.6,-3.6 8.6,-3.6 8.6,1 5.6,4.2 -5.6,4.2 -8.6,1', 'pp-v') + rect(-3.6, -1.9, 7.2, 1.8, 'pp-e') +
        rect(-1.6, -9.8, 3.2, 1.4, 'pp-r') + '</g>';
      svg.appendChild(g);                          /* au-dessus des briques : il se pose dessus */
      const inner = g.firstChild;
      let i = 0, t = 0, live = false;
      const at = (k) => { g.style.transform = `translate(${xs[k]}px, 27px)`; };
      const hop = () => { inner.classList.remove('is-hop'); void inner.getBoundingClientRect(); inner.classList.add('is-hop'); };
      const light = (k) => nodes.forEach((n, j) => n.classList.toggle('is-current', j === k));
      const step = () => {
        clearTimeout(t);
        if (!live) return;
        light(i);
        const last = i === nodes.length - 1;
        t = setTimeout(() => {
          if (!live) return;
          if (last) {                               /* il s'éclipse, repart de l'hôte */
            g.classList.add('is-out');
            t = setTimeout(() => {
              light(-1);
              g.classList.add('is-reset'); i = 0; at(0);
              void g.getBoundingClientRect();
              g.classList.remove('is-reset', 'is-out');
              t = setTimeout(step, 700);
            }, 260);
          } else {
            light(-1); i++; at(i); hop();
            t = setTimeout(step, 520);
          }
        }, last ? 1500 : 650);
      };
      at(0);
      const wrap = svg.closest('.archi') || svg;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((ents) => {
          ents.forEach((en) => {
            const was = live;
            live = en.isIntersecting;
            if (live && !was) t = setTimeout(step, 700);
            if (!live) { clearTimeout(t); light(-1); }
          });
        }, { threshold: 0.4 }).observe(wrap);
      } else { live = true; step(); }
    });
  }

  const PRESETS = { hero: heroPilote, peek: peekPilote, work: workPilote, ghost: ghostPilote, watch: watchPilote,
                    hello: helloPilote, lost: lostPilote, badge: badgePilote, stamp: stampPilote };

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
    const h = pl.host;
    const main = document.querySelector('main');
    const wide = () => window.innerWidth >= 900;
    let shown = false, present = false, helloDone = false;

    const parse = (s) => {
      const i = (s || '').indexOf('|');
      return i === -1 ? [null, s] : [s.slice(0, i) || null, s.slice(i + 1)];
    };
    const react = (spec) => {
      if (!present || pl.busy) return;
      const [m, txt] = parse(spec);
      if (m) pl.mood(m, 2600);
      if (txt && wide()) pl.say(txt, 2400);
      else pl.blink();
    };

    /* ---- un seul SH-14 à l'écran ----
       Le robot n'occupe le dock que si aucune « station » (hero,
       portrait, formulaire, veille, tampon, médaille, chantier)
       n'est visible : sinon c'est qu'il est là-bas, au travail. */
    const stationsOn = new Set();
    const stationBusy = () => [...stationsOn].some(el => !el.classList.contains('is-away'));
    const land = () => {
      h.classList.remove('is-launch', 'is-gone', 'pl-hold');
      if (reduced) return;
      h.classList.add('is-landing');
      pl.fly(true);
      setTimeout(() => pl.fly(false), 520);
      setTimeout(() => h.classList.remove('is-landing'), 760);
      if (!helloDone && main && main.dataset.plHello) {
        helloDone = true;
        setTimeout(() => react(main.dataset.plHello), 800);
      }
    };
    const takeoff = () => {
      pl.hush();
      if (reduced) { h.classList.add('is-gone', 'pl-hold'); return; }
      pl.fly(true);
      h.classList.add('is-launch');
      setTimeout(() => { pl.fly(false); h.classList.add('is-gone', 'pl-hold'); }, 900);
    };
    let syncT = 0;
    const sync = (now) => {
      clearTimeout(syncT);
      syncT = setTimeout(() => {
        const want = shown && !stationBusy();
        if (want && !present) { present = true; land(); }
        else if (!want && present) { present = false; takeoff(); }
      }, now ? 0 : 260);
    };
    h.classList.add('pl-hold', 'is-gone');           // rangé : invisible, animations en pause

    /* le robot du hero part quand on l'a quitté des yeux (jamais sous
       ton nez), et revient se poser quand on remonte */
    const hero = Pilote.hero && Pilote.hero.depart ? Pilote.hero : null;
    let heroSeen = !!hero;
    const maybeDepart = () => { if (hero && shown && !heroSeen) hero.depart(); };
    new MutationObserver(() => {
      const on = btn.classList.contains('show');
      if (on === shown) return;
      shown = on;
      if (on) maybeDepart();
      else if (hero) hero.arrive();
      sync(!on);
    }).observe(btn, { attributes: true, attributeFilter: ['class'] });

    const stationHosts = all.filter(p => p !== pl && p.o.station).map(p => p.host);
    if (stationHosts.length && 'IntersectionObserver' in window) {
      const sio = new IntersectionObserver((ents) => {
        ents.forEach(en => {
          if (en.isIntersecting && en.intersectionRatio >= 0.3) stationsOn.add(en.target);
          else stationsOn.delete(en.target);
          if (hero && en.target === hero.host) { heroSeen = en.isIntersecting; maybeDepart(); }
        });
        sync();
      }, { threshold: [0, 0.3, 0.6] });
      stationHosts.forEach(el => sio.observe(el));
    }

    btn.addEventListener('click', () => {
      if (reduced || !present) return;
      pl.hush();
      pl.mood('happy');
      pl.fly(true);
      h.classList.add('is-launch');
      setTimeout(() => { pl.fly(false); pl.mood(null); }, 1100);
    });
    if (finePointer) {
      btn.addEventListener('pointerenter', () => { if (present && !pl.busy) pl.look(0, -1).mood('open'); });
      btn.addEventListener('pointerleave', () => { if (present) pl.release().mood(null); });
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

    /* fin de page : il remercie, une fois */
    const foot = document.querySelector('footer');
    if (foot && 'IntersectionObserver' in window) {
      const fio = new IntersectionObserver((ents) => {
        if (!ents[0].isIntersecting || !present) return;
        fio.disconnect();
        setTimeout(() => {
          if (!present || pl.busy) return;
          pl.mood('happy', 2600).wave(1600);
          if (wide()) pl.say('Fin du kit. Merci de l’avoir monté avec moi.', 2600);
        }, 350);
      }, { threshold: 0.5 });
      fio.observe(foot);
    }

    /* scroll très rapide : il s'accroche, propulseurs allumés */
    if (!reduced) {
      let lastY = window.scrollY, lastT = performance.now(), cool = 0;
      window.addEventListener('scroll', () => {
        const now = performance.now(), y = window.scrollY;
        const v = Math.abs(y - lastY) / Math.max(1, now - lastT);   // px / ms
        lastY = y; lastT = now;
        if (v > 3.2 && present && !pl.busy && now > cool) {
          cool = now + 2200;
          pl.mood('surprise', 700).fly(true);
          setTimeout(() => pl.fly(false), 600);
        }
      }, { passive: true });
    }

    /* événements du site */
    document.addEventListener('kit:copy', () => react('check|Copié. Il ne reste qu’à coller.'));
    document.addEventListener('kit:theme', (e) => {
      const dark = e.detail && e.detail.theme === 'dark';
      react(dark ? 'happy|LED UNIT : ON.' : 'open|LED UNIT : OFF.');
    });
    pl.isPresent = () => present;
    return pl;
  }

  /* ============================================================
     5. ÉVÉNEMENTS GLOBAUX
     ============================================================ */
  document.addEventListener('kit:incident', () => all.forEach(p => { if (p.visible) p.alert(2500); }));
  /* bascule KIT ↔ BOX ART : chaque LED unit visible se coupe et redémarre */
  document.addEventListener('kit:theme', () => all.forEach(p => { if (p.visible && !p.host.classList.contains('pl--ghost')) p.powerCycle(); }));
  /* palette ⌘K → « Appeler le pilote » : le plus proche répond */
  document.addEventListener('kit:call', () => {
    const dock = Pilote.dock;
    const dockOn = dock && dock.isPresent && dock.isPresent();
    const pick = all.find(p => p.visible && p !== dock && !p.host.classList.contains('pl--ghost') &&
                               !p.host.classList.contains('is-away')) || (dockOn ? dock : null);
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
    /* médaille gagnée sur la page Certifications : il la garde partout */
    try { if (localStorage.getItem('pl-medal') === '1') document.documentElement.classList.add('pl-decorated'); } catch (e) {}
    $$('[data-pilote]').forEach(el => {
      if (el.__pilote) return;
      const fn = PRESETS[el.dataset.pilote];
      if (fn) el.__pilote = fn(el);
    });
    Pilote.dock = initDock();
    initPackets();
  }

  window.Pilote = Pilote;
  Pilote.build = build;
  Pilote.all = all;
  Pilote.drawRunner = drawRunner;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
  else mountAll();
})();
