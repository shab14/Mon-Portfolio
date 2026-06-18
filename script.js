<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mes Projets | Shabdpreet Singh</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="read-progress"></div>
    <nav>
        <div class="nav-container">
            <a href="index.html" class="logo">
                <span class="logo-mark">S</span>
                <span class="logo-text">Shabdpreet Singh</span>
            </a>
            <ul class="nav-links">
                <li><a href="index.html">Accueil</a></li>
                <li><a href="epreuve.html">Épreuves</a></li>
                <li><a href="projet.html">Projets</a></li>
                <li><a href="veille.html">Veille</a></li>
                <li><a href="certifs.html">Certifications</a></li>
            </ul>
        </div>
    </nav>

    <main>
        <h1>Mes Projets</h1>
        <p class="page-intro">Les réalisations techniques menées durant ma formation et mon alternance.</p>

        <div class="grid">
            <div class="card project-card reveal" data-i="1">
                <span class="project-tag">Projet scolaire</span>
                <div class="project-badge centreon-badge"><span class="badge-letter">C</span></div>
                <h3>Supervision avec Centreon</h3>
                <p>Mise en place d'une solution de supervision informatique avec Centreon : installation sur AlmaLinux, configuration des composants (Engine, Broker, MariaDB) et surveillance d'une infrastructure réseau.</p>
                <a href="fichiers/Projet_Centreon.docx" class="btn btn-outline" download>📄 Télécharger la documentation</a>
            </div>

            <div class="card project-card is-placeholder reveal" data-i="2">
                <span class="project-tag">À venir</span>
                <div class="project-badge soon-badge"><span class="badge-letter">2</span></div>
                <h3>Prochain projet</h3>
                <p>Un nouveau projet technique sera bientôt ajouté ici au fil de ma formation.</p>
            </div>

            <div class="card project-card is-placeholder reveal" data-i="3">
                <span class="project-tag">À venir</span>
                <div class="project-badge soon-badge"><span class="badge-letter">3</span></div>
                <h3>Prochain projet</h3>
                <p>Cet emplacement accueillera une future réalisation pour illustrer la diversité de mes compétences.</p>
            </div>
        </div>
    </main>

    <footer>
        <div class="footer-links">
            <a href="https://github.com/shab14" target="_blank" rel="noopener">GitHub</a>
            <a href="https://www.linkedin.com/in/shabdpreet-singh-401012376/" target="_blank" rel="noopener">LinkedIn</a>
            <a href="fichiers/CV_Shabdpreet_Singh.pdf" download>CV</a>
        </div>
        <p>© 2026 Shabdpreet Singh — Portfolio</p>
    </footer>
    <script src="script.js"></script>
</body>
</html>
