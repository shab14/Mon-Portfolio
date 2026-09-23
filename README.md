# Portfolio — Shabdpreet Singh

Portfolio personnel d'un étudiant **BTS SIO option SISR** en alternance chez **ALLIANC3**.
Vitrine de mon parcours, de mes compétences réseau & infrastructure, de mes projets et de mes certifications — pensé pour les recruteurs et l'évaluation BTS (épreuves E4 / E6).

🔗 **En ligne :** [shab14.github.io/Mon-Portfolio](https://shab14.github.io/Mon-Portfolio)

---

## ✨ Aperçu

Un site **100% vanilla** (HTML / CSS / JS, sans framework), construit sur une direction artistique **« MASTER GRADE »** : le portfolio comme un kit à monter. Le hero est un box art (grand, frontal), le corps une notice de montage (étapes `STEP 0X`, typo mono, références de pièces, lignes de panneau), les détails une planche de stickers.

- 🎨 Identité visuelle : Barlow Condensed (titres) + Barlow (texte) + IBM Plex Mono (technique) ; palette kit — blanc cassé, graphite, rouge, bleu, or ; deux faces **KIT** (clair) / **BOX ART** (sombre)
- 🤖 **Le pilote SH-14** : la mascotte du kit, dessinée en SVG et animée — voir plus bas
- 🖥️ Hero animé : le panneau `SYSTÈMES` arrive, le pilote s'assemble dessus pièce par pièce, s'allume, allume les services un par un, puis te salue
- 🎞️ Mouvement : titres `STEP` qui se déroulent au scroll, profondeur du hero au scroll, transitions de page « volet », micro-interactions (boutons, tags, radar, logo)
- 📊 Visualisations : radar de compétences (balayage + légende liée), schéma d'architecture Centreon, jauge et anneaux de score
- ⌨️ Palette de commandes (`Ctrl/Cmd + K` ou `/`)
- 📬 Page **Contact** avec formulaire (envoi par mail) et infos de disponibilité
- ♿ Accessibilité : tout respecte `prefers-reduced-motion`, rien n'est caché sans JavaScript, robots en `aria-hidden`
- 🔍 SEO / partage : Open Graph, JSON-LD, `sitemap.xml`, `robots.txt`, manifest

La DA complète (concept, palette, typo, règles DO / DON'T, évolution) est documentée dans le projet Claude « Portfolio » (`direction-artistique-master-grade.md`).

---

## 🤖 Le pilote SH-14

La figurine du kit : même grammaire que le site (aplats, lignes de panneau, ombre dure, mouvement de servo). Visière **LED matricielle** pour les expressions, bras articulés, propulseurs, et une « **LED unit** » qui ne s'allume vraiment que sur la face BOX ART (thème sombre).

**Où il apparaît** — jamais en copier-coller, toujours avec un rôle :

| Endroit | Pose / rôle |
|---|---|
| Hero (accueil) | debout sur son socle (le panneau SYSTÈMES) : suit le curseur, fait coucou au survol, réagit au clic, s'endort après 20 s |
| Compagnon (toutes les pages) | le bouton « remonter » devient son socle : il atterrit, commente les sections, décolle au clic |
| À propos | passe la tête au-dessus du cadre photo (coucou-caché au clic) |
| Projets | P-02 : il serre les boulons (clé à cliquet, étincelles) · P-03 : silhouette en pointillés (slot réservé) |
| Veille | en sentinelle sur la console, main en visière |
| Contact | accueille, regarde le champ en cours de saisie, célèbre l'envoi |
| 404 | il lui manque son bras droit (contour pointillé façon notice) |
| Transitions de page | son casque est frappé sur le volet |
| Secrets | coureur du mini-jeu (`jeux` dans la palette), mode alerte (code Konami), « Appeler le pilote » dans la palette |

**Le réutiliser** (tout est déclaratif) :

```html
<div data-pilote="hero|peek|work|ghost|watch|hello|lost"></div>   <!-- une apparition -->
<h2 data-pl="happy|Texte de la bulle">…</h2>                       <!-- réaction du compagnon -->
<main data-pl-hello="check|Phrase d'arrivée sur la page">          <!-- salut à l'arrivée -->
```

Humeurs disponibles : `open`, `happy`, `wink`, `surprise`, `focus`, `alert`, `question`, `check`, `loading`, `dizzy`, `sleep`.

---

## 📂 Structure

| Page | Description |
|------|-------------|
| `index.html` | Accueil — hero, supervision, présentation |
| `epreuve.html` | Épreuves E4 / E6 |
| `projet.html` | Projets (dont projet Centreon) |
| `veille.html` | Veille technologique |
| `certifs.html` | Certifications (Anthropic Academy, PIX…) |
| `contact.html` | Contact — formulaire & disponibilité |
| `404.html` | Page d'erreur personnalisée |

```
Mon-Portfolio/
├── index.html · epreuve.html · projet.html · veille.html · certifs.html · contact.html · 404.html
├── style.css          # styles globaux + thèmes + pilote + motion
├── script.js          # interactions, animations, palette de commandes (émet les événements kit:*)
├── pilote.js          # le pilote SH-14 : dessin SVG (source unique) + comportements
├── favicon.svg
├── fichiers/          # CV, images, logos, OG image
├── sitemap.xml · robots.txt · site.webmanifest
└── README.md
```

`script.js` et `pilote.js` communiquent par événements (`kit:svc`, `kit:theme`, `kit:incident`, `kit:copy`, `kit:sent`, `kit:call`) : chacun reste lisible seul.

---

## 🛠️ Stack

- **HTML5 / CSS3 / JavaScript** (vanilla, zéro dépendance)
- **Google Fonts** — Barlow Condensed, Barlow, IBM Plex Mono
- **GitHub Pages** pour l'hébergement
- SVG & Canvas pour les visualisations et animations ; `@property` CSS pour les articulations du pilote

**Performance** : animations sur `transform` / `opacity` uniquement, robots mis en pause hors écran, compagnon en pause quand il est rangé, profondeur du hero sur des calques GPU. Au repos, le pilote coûte moins de 1 % du thread principal.

---

## 🚀 Lancer en local

Aucune installation nécessaire — il suffit d'ouvrir `index.html` dans un navigateur.

Pour un rendu fidèle (chemins relatifs, fetch…), un petit serveur local est recommandé :

```bash
# Python
python3 -m http.server 8000

# ou Node
npx serve
```

Puis ouvrir `http://localhost:8000`.

---

## 📦 Déploiement

Le site est déployé via **GitHub Pages** (branche `main`, racine du repo).
Toute modification poussée sur `main` est publiée automatiquement.

---

## 👤 À propos

**Shabdpreet Singh** — BTS SIO SISR en alternance chez ALLIANC3 (Paris).
Spécialisé en supervision, réseaux et infrastructure. Ouvert aux opportunités 2026.

- 💼 [LinkedIn](https://www.linkedin.com/in/shabdpreet-singh-401012376/)
- 🐙 [GitHub](https://github.com/shab14)

---

> 💡 *Astuce : tapez `easter egg`, `jeux` ou `pilote` dans la palette de commandes…*

<sub>© 2026 Shabdpreet Singh — Tous droits réservés.</sub>
