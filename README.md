# Portfolio — Shabdpreet Singh

Portfolio personnel d'un étudiant **BTS SIO option SISR** en alternance chez **ALLIANC3**.
Vitrine de mon parcours, de mes compétences réseau & infrastructure, de mes projets et de mes certifications — pensé pour les recruteurs et l'évaluation BTS (épreuves E4 / E6).

🔗 **En ligne :** [shab14.github.io/Mon-Portfolio](https://shab14.github.io/Mon-Portfolio)

---

## ✨ Aperçu

Un site **100% vanilla** (HTML / CSS / JS, sans framework), construit sur une direction artistique **« MASTER GRADE »** : le portfolio comme un kit à monter. Le hero est un box art (grand, frontal), le corps une notice de montage (étapes `STEP 0X`, typo mono, références de pièces, lignes de panneau), les détails une planche de stickers.

- 🎨 Identité visuelle : Barlow Condensed (titres) + Barlow (texte) + IBM Plex Mono (technique) ; palette kit — blanc cassé, graphite, rouge, bleu, or ; deux faces **KIT** (clair) / **BOX ART** (sombre)
- 🖥️ Hero animé : assemblage des pièces au chargement, panneau `SYSTÈMES` (LED, uptime, log), plaque rouge hachurée
- 📊 Visualisations : radar de compétences avec barres segmentées, schéma d'architecture Centreon, jauge et anneaux de score
- ⌨️ Palette de commandes (`Ctrl/Cmd + K` ou `/`)
- 📬 Page **Contact** avec formulaire (envoi par mail) et infos de disponibilité
- ♿ Accessibilité : animations respectant `prefers-reduced-motion`, fallback sans JS
- 🔍 SEO / partage : Open Graph, JSON-LD, `sitemap.xml`, `robots.txt`, manifest

La DA complète (concept, palette, typo, règles DO / DON'T, évolution) est documentée dans le projet Claude « Portfolio » (`direction-artistique-master-grade.md`).

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
├── style.css          # styles globaux + thèmes
├── script.js          # interactions, animations, palette de commandes
├── favicon.svg
├── fichiers/          # CV, images, logos, OG image
├── sitemap.xml · robots.txt · site.webmanifest
└── README.md
```

---

## 🛠️ Stack

- **HTML5 / CSS3 / JavaScript** (vanilla, zéro dépendance)
- **Google Fonts** — Barlow Condensed, Barlow, IBM Plex Mono
- **GitHub Pages** pour l'hébergement
- SVG & Canvas pour les visualisations et animations

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

> 💡 *Astuce : tapez `easter egg` ou `jeux` dans la palette de commandes…*

<sub>© 2026 Shabdpreet Singh — Tous droits réservés.</sub>
