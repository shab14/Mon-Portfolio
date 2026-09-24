/* ============================================================
   sw.js — le kit embarqué (mode hors ligne)
   ------------------------------------------------------------
   Le jour de l'oral, si le wifi de la salle lâche, le portfolio
   s'affiche quand même : les pages sont gardées dans le cache
   du navigateur.

   Stratégies :
   · pages, styles, scripts, images, docs du site : RÉSEAU D'ABORD
     (en ligne, tout est toujours à jour ; la copie en cache est
     rafraîchie au passage), CACHE EN SECOURS (hors ligne) ;
   · polices Google : CACHE D'ABORD (elles ne changent jamais) ;
   · API GitHub et requêtes HEAD (checks du panneau SYSTÈMES) :
     jamais interceptées — ce sont des données live.

   Le cache porte le même nom côté page (script.js, « mode oral »,
   qui embarque aussi les gros documents). Changer la liste CORE →
   incrémenter CACHE.
   ============================================================ */
'use strict';

const CACHE = 'sh14-kit-v1';
const NETWORK_TIMEOUT_MS = 4000;   // réseau trop lent : on sert la copie locale

/* Pièces embarquées dès l'installation (légères : ~0,5 Mo) */
const CORE = [
  './',
  './index.html',
  './epreuve.html',
  './projet.html',
  './veille.html',
  './certifs.html',
  './contact.html',
  './mentions-legales.html',
  './404.html',
  './style.css',
  './script.js',
  './pilote.js',
  './favicon.svg',
  './site.webmanifest',
  './fichiers/icon-192.png',
  './fichiers/allianc3-logo.png',
  './fichiers/allianc3-mark.png',
  './fichiers/CV_Shabdpreet_Singh.pdf',
  './fichiers/Tableau_synthese_E4_BTS_SIO.xlsx',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // pièce par pièce : un fichier manquant n'empêche pas d'embarquer le reste
    const results = await Promise.allSettled(CORE.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
    const missing = results.filter((r) => r.status === 'rejected').length;
    if (missing) console.info(`[kit] ${missing} pièce(s) non embarquée(s) à l'installation`);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('sh14-kit-') && key !== CACHE)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                 // HEAD des checks : réseau direct
  if (req.headers.has('range')) return;             // lecture partielle (lecteurs PDF) : réseau direct
  const url = new URL(req.url);
  if (url.hostname === 'api.github.com') return;    // données live : jamais en cache
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(req));
    return;
  }
  if (url.origin !== self.location.origin) return;  // autres sites : pas nos affaires
  event.respondWith(networkFirst(req));
});

/* Réseau d'abord : la réponse fraîche remplace la copie en cache */
async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetchWithTimeout(req, NETWORK_TIMEOUT_MS);
    if (res.status === 200 && res.type === 'basic') {
      cache.put(req, res.clone()).catch((err) => console.info('[kit] cache plein ?', err.message));
    }
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') {
      // page jamais visitée ni embarquée : l'accueil plutôt qu'une erreur du navigateur
      const home = await cache.match('./index.html');
      if (home) return home;
    }
    throw err;
  }
}

/* Cache d'abord : polices (réponses parfois opaques, Vary ignoré) */
async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') {
    cache.put(req, res.clone()).catch((err) => console.info('[kit] police non gardée :', err.message));
  }
  return res;
}

function fetchWithTimeout(req, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(req).then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}
