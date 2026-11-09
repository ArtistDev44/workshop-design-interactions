# Prompt 12 — Build, déploiement GitHub Pages, README et QR code

## Objectif
Finaliser le site : build propre, déploiement sur GitHub Pages (URL de l'édition),
README complet au format du livret, et génération du QR code pointant vers le site.

## Instructions
1. Build final : `npm run build`, vérifier `dist/` (toutes les pages présentes, base
   `/patrimoine-exe/nantes/001/` respectée).
2. Déploiement : publier le contenu de `dist/` sur la branche `gh-pages` du dépôt
   GitHub (GitHub Pages), ou via GitHub Actions — sans ajouter de dépendance au projet.
   L'URL finale doit correspondre à la convention
   `https://<owner>.github.io/<repo>/patrimoine-exe/nantes/001/`.
3. QR code : générer une image QR pointant vers l'URL en ligne de l'édition, la placer
   dans `public/assets/qr-edition.png`, l'afficher sur la page d'accueil et/ou la page
   crédits, et **tester le scan en conditions réelles** (todo.md, J3).
4. README.md du site au format du livret : Auteurs, Édition, Concept, Stack (Astro,
   rendu statique), Données (registre local, aucun appel réseau), Lancer le projet
   (`npm install`, `npm run dev`, `npm run build`), Fallback/limites, Contributions,
   AI usage (3 à 5 lignes si applicable), Sources/droits.
5. Ne committer aucun secret ; vérifier `git status` avant chaque commit.

## Vérifications
- Le site déployé répond à l'URL de l'édition et affiche la galerie et au moins une
  page œuvre.
- Le QR code scanné ouvre bien la page en ligne.
- Le README permet à une autre personne de relancer le projet localement.
