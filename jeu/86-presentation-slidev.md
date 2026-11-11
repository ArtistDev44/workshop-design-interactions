# 86 — La page /presentation passe sur Slidev (prompt 82)

## Organisation (choix documenté)
- Deck dans un **dossier dédié `slides/`** à la racine (et non dans `site/`) : `site/` garde `astro` comme seule
  dépendance (règle du projet) ; `slides/package.json` porte `@slidev/cli` en dépendance de dev.
- Source : `slides/slides.md` (le contenu de l'ancien `slides.md` racine, réarrangé et mis à jour avec les règles
  actuelles du jeu : décision sans chrono, réponses par catégorie, tâches, journal, téléphone). Le `slides.md`
  racine renvoie désormais vers lui.
- Build : `cd slides && npm install && npm run build` → `site/public/presentation/` (base `/presentation/`, routeur
  en mode hash). `site/scripts/construire-slides.mjs` (appelé par `npm run build` via `prebuild`, ou
  `npm run build:slides`) reconstruit le deck si Slidev est installé, sinon conserve le build versionné dans le
  dépôt (CI et hors ligne). `site/src/pages/presentation.astro` est supprimé : plus de conflit de route ; les liens
  de `/cartel/` et `/making-of/` sont inchangés.
- Le skill `npx skills add slidevjs/slidev` demandé n'a pas pu être installé (refusé par la protection de
  l'environnement de l'assistant) : le deck suit les conventions de la documentation Slidev embarquée dans
  `@slidev/cli` (frontmatter, séparateurs `---`, layouts, `styles/`, `setup/shortcuts.ts`, `global-top.vue`).

## Thème et modèles
- `theme: none` + `slides/styles/index.css` : Pixel Design System (fond #0D0C0C, primaire #D4031C, arrondi 0,
  JetBrains Mono / Bitsy Pixels, polices locales sans Google Fonts, focus visible, `prefers-reduced-motion`).
- Layouts variés : `cover`, `quote`, `center`, `two-cols`, `fact`, `section`, défaut avec capture annotée, `end`.
- 5 captures du jeu actuel (prises dans Chromium sur la semaine réelle du 12/10/2026, `slides/public/img/*.webp`) :
  décision, briefing, journal, bureau, téléphone, chacune **annotée de flèches SVG** (composant `Arrow` de Slidev)
  et d'étiquettes ; le texte `alt` décrit ce que désigne chaque flèche.

## Accessibilité
← / → (Slidev), Début / Fin (`setup/shortcuts.ts`), annonce « Diapositive n sur N » (`aria-live`,
`global-top.vue`), contraste ≥ 4,5:1, animations coupées si réduites, verrou d'écran désactivé.

## Menu du jeu
Demande du 11/11 : un bouton **« Présentation »** (icône écran de projection) à côté de « Dépôt du code » et
« Partager » ouvre `./presentation/` ; accessible au clavier dans le menu, infobulle FR / EN, cibles ≥ 44 px en
portrait mobile.

## Vérifications
`npm run build`, `npm test` (smoke : chaque fichier du deck en précache du service worker, base `/presentation/`
dans le build). Chromium : 17 diapositives, images chargées, Début / Fin, annonce du numéro, aucune erreur
console. `game.js` et Q1–Q61 inchangés.
