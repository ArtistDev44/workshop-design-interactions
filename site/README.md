# Site de l'édition PATRIMOINE.EXE · NTE001

Site statique (Astro) de l'édition Nantes 001 — ESD Nantes, B3 Design, 9, 10 & 12 novembre 2026.
Ce README sera complété au prompt 13 (auteurs, concept, stack, données, lancement, contributions, AI usage, sources).

## Lancer le projet

```sh
cd site
npm install
npm run dev       # développement
npm run build     # construit site/dist/
npm run preview   # sert la version construite
```

Le site s'ouvre à `http://localhost:4321/workshop-design-interactions/patrimoine-exe/nantes/001/`.

## Robustesse

Contrôles du prompt 12 (livret, sections 13 et 14), effectués le 10/11/2026 sur les 10 pages
(accueil, œuvres, page œuvre, catalogue, statistiques, méthode, corpus, données, crédits, 404).

| Contrôle | Résultat |
|---|---|
| Contraste texte / fond ≥ 4,5:1 (3:1 pour les grands titres), mesuré sur chaque élément de texte visible | ✅ aucune erreur |
| `lang="fr"`, un seul `<h1>` par page, pas de saut de niveau de titre | ✅ |
| Titres de page uniques | ✅ 10 titres différents |
| Images avec `alt`, liens et boutons avec un nom | ✅ |
| Tableaux avec `<th scope>` | ✅ |
| Navigation clavier : lien « Aller au contenu », focus visible (contour 3 px), filtres et boutons utilisables | ✅ |
| Aucune animation si l'utilisateur la refuse (`prefers-reduced-motion`) ; aucun flash ni effet stroboscopique | ✅ |
| Contenu lisible sans JavaScript (rendu statique) ; sur `/donnees/`, message explicite à la place des valeurs | ✅ |
| API coupée : `/donnees/` affiche les instantanés locaux avec « Données locales du JJ/MM/AAAA » | ✅ testé |
| Aucun appel aux API au build ni dans une boucle de rendu | ✅ |
| Assets via `import.meta.env.BASE_URL`, aucune image cassée | ✅ |
| Aucune clé, aucun token, aucun secret dans le code | ✅ |
| 1920×1080 et mobile (375 px) : aucun débordement horizontal | ✅ |
| Console sans erreur continue | ✅ |
| `rm -rf dist && npm run build` régénère le site proprement | ✅ |

Corrections apportées lors de ce contrôle :

- le contenu principal (`<main>`), cible du lien « Aller au contenu », ne s'entoure plus d'un cadre de focus sur toute la page.

À faire par l'équipe : un audit Lighthouse dans le navigateur avant l'exposition, et un test réel
Wi-Fi coupé sur la machine d'exposition.
