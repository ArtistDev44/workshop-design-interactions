# Prompt 82 — Page `/presentation` : refonte des slides en Slidev (design system conservé, modèles de slides variés, images fléchées)

Demande d'origine (11/11/2026) :

> Améliorer les slides de la page `/presentation` en changeant la technologie pour la technologie
> Slidev. Garder le design system existant mais y intégrer des modèles différents de slides.
> Y insérer plusieurs images avec des flèches pour démontrer le propos de la slide, notre objectif,
> et réarranger le contenu existant afin de le faire rentrer dans cette nouvelle technologie.
> Installer le prompt dédié et s'y référer : `npx skills add slidevjs/slidev`

— renuméroté 82 : le n° 62 est pris par `62-jeu-tasse-musique-sieste.md`.

Contexte : la page `/presentation/` existe depuis le prompt 61 (`site/src/pages/presentation.astro`,
diaporama maison généré au build depuis `slides.md` à la racine du dépôt, au Pixel Design System du
prompt 39 : fond #0D0C0C, primaire #D4031C, arrondi 0, JetBrains Mono / Bitsy Pixels). Liens vers
`/presentation/` depuis `/cartel/` et `/making-of/`. Règles Q1–Q61 inchangées : `game.js` non touché,
`test-jeu.mjs` reste vert.

## Prérequis — installer le skill Slidev et s'y référer
0. **Avant tout**, installer le prompt/skill dédié : `npx skills add slidevjs/slidev`, puis le lire et
   s'y référer pendant tout le prompt (conventions Slidev : frontmatter, `---` séparateurs, layouts
   `layouts/`, thème custom, commandes `slidev build` / export statique, assets dans `public/`).

## Attendu
1. **Basculer la page `/presentation/` sur Slidev** : ajouter `@slidev/cli` en dépendance de dev de
   `site/` (ou dossier dédié `slides/` à la racine — choix à documenter), configurer le deck pour que
   son entrée soit le contenu existant de `slides.md` (racine du dépôt), réarrangé pour Slidev
   (frontmatter, séparateurs `---`, notes de présentateur si utiles).
2. **Conserver le design system existant** : thème Slidev custom qui reprend le Pixel Design System
   (fond #0D0C0C, primaire #D4031C, blanc, arrondi 0, JetBrains Mono / Bitsy Pixels, contraste ≥ 4,5:1,
   focus visible) — via le CSS/thème Slidev, pas un thème par défaut.
3. **Intégrer plusieurs modèles de slides différents** : utiliser les layouts variés de Slidev
   (`cover`, `intro`, `section`, `two-cols`, `image`, `quote`, `center`, layouts custom…) pour que
   chaque partie du propos ait sa mise en page (page de garde, sections, colonnes, citation…), et non
   une seule mise en page répétée.
4. **Plusieurs images avec des flèches** : insérer dans les slides plusieurs images qui démontrent le
   propos (captures du jeu depuis `site/public/captures/`, schémas de la chaîne
   source → grammaire → système → œuvre, jauges, salle de contrôle…) **annotées de flèches** pointant
   les éléments montrés (flèches dessinées en SVG superposé ou annotées localement avec ImageMagick /
   script Node natif — aucun nouveau package lourd ; assets placés dans le dossier `public/` du deck).
   Objectif de la présentation à faire apparaître : le projet « Nantes en régulation » et sa chaîne
   source → grammaire → système → œuvre.
5. **Réarranger le contenu existant** de `slides.md` pour le faire rentrer dans cette nouvelle
   technologie : reprendre tout le contenu conforme au brief (question, chaîne, sources réelles + liens
   API + licences, règles du jeu, interactions, accessibilité/hors ligne, livrables, crédits) en le
   répartissant sur les nouveaux modèles de slides — sans perte de contenu, FR uniquement.
6. **Servir le résultat à l'URL stable `/presentation/`** : build statique Slidev (`slidev build`)
   copié dans `site/public/presentation/` via un script npm (ex. `npm run build:slides`, appelé par
   `npm run build` avant le build Astro) ; supprimer `site/src/pages/presentation.astro` (ou le
   remplacer par une redirection) pour éviter le conflit de route ; les liens depuis `/cartel/` et
   `/making-of/` continuent de marcher sans changement d'URL.
7. **Hors ligne + tests** : le service worker `sw.js` (prompt 65, précache à 100 %) couvre les nouveaux
   assets de `/presentation/` ; `scripts/smoke.mjs` vérifie que les assets du deck sont listés dans
   `ESSENTIELS` ; `npm test` reste vert.
8. **Accessibilité** : navigation clavier du diaporama (← / →, Accueil/Fin), annonce du numéro de slide,
   contraste ≥ 4,5:1, textes d'images (alt) décrivant les flèches, responsive, animations réduites
   respectées.

## Vérifications
- `cd site && npm run build && npm test` OK ; page `/presentation/` servie depuis le build Slidev,
  thème Pixel Design System respecté, plusieurs layouts visibles, images fléchées présentes et
  décrites (alt), navigation clavier, liens internes 0 cassé depuis `/cartel/` et `/making-of/`,
  hors ligne après install (sw), aucune erreur console, aucune donnée inventée, aucun secret.
- `git diff` relu : `game.js` et Q1–Q61 inchangés. Documenter dans `jeu/60-…` (numéro libre suivant)
  et mettre à jour `prompts/README.md`, `journal.md`. Branche dédiée ; fusion `main` sur demande.
