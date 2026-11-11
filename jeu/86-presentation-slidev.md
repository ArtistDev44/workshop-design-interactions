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

## Prompt 94 : rendu de soutenance

**Skill Slidev**
- Le skill est présent dans `~/.claude/skills/slidev/`. Ses références ont servi de base : headmatter, layouts, animations, composants, couches globales, Mermaid, rough marker, SEO, image OG.
- La commande `npx skills add slidevjs/slidev` n'a pas été relancée.

**Headmatter**
- `titleTemplate`, `author` (repris du cartel et de `LICENSE`), `keywords`, `htmlAttrs.lang: fr`, `highlighter: shiki`, `lineNumbers: false`.
- `defaults: { layout: default, transition: fade }`.
- `seoMeta` complet : og et twitter, `summary_large_image`, URL canonique `/presentation/`.

**Image OG** : `slides/public/og-image.png`, 1200×630, au visuel Pixel DS (fond #0D0C0C, barre #D4031C, titre, capture réelle du bureau). Elle est générée par `slides/scripts/generer-og.py` (PIL et JetBrains Mono, sans nouvelle dépendance npm).

**Actes**
- Ouverture : `cover`, avec `v-motion` discret et `AutoFitText`, puis `intro`, puis le sommaire `<Toc columns="2">` (les actes seulement, `hideInToc` ailleurs).
- 5 sections en `slide-left` : Le projet, La chaîne, Les sources réelles, Le jeu, Jouer. Clôture en `end`.
- Mises en page variées, jamais deux identiques de suite : `quote` (la question), `statement` (0 événement inventé), `fact` (≥ 10 min, avec un seul `v-mark.underline`), `two-cols-header` (invariants / variables), `two-cols` (sources ; interactions et accessibilité), `image-right` / `image-left` / `full` (captures fléchées), `center` (Jouer, Crédits).
- 24 diapositives en tout.

**Chaîne** : bloc Mermaid `flowchart LR` (`theme: dark`) aux couleurs du DS, dans un conteneur `role="img"` avec un `aria-label` qui décrit le flux.

**Captures**
- `image-right` / `image-left` avec `backgroundSize: contain`. Les flèches `<Arrow>` et les étiquettes sont recalculées pour la demi-page.
- Chaque capture a une description `role="img"` des flèches.
- La capture du briefing (prompt 88, retiré au prompt 91) est remplacée par une capture actuelle des cartes de sources (prompt 92) : `img/sources.webp`.

**Pied de page** : `global-bottom.vue` affiche le n° / total, le titre court et le lien du jeu. Il est masqué sur `cover`, `section`, `intro` et `end`. Comme ce calque est sous les diapositives, les mises en page de contenu ont un fond transparent (la page porte le fond du DS).

**Navigation et accessibilité**
- `global-top.vue` (aria-live) et `setup/shortcuts.ts` (Début / Fin) sont conservés.
- Renvoi interne `<Link to="livrables">`, depuis « À vous de réguler » vers la diapositive des livrables (`routeAlias`).
- `v-clicks` sur les listes, notes présentateur sur chaque diapositive, avec `[click]` là où une animation la rythme.
- `prefers-reduced-motion` coupe les transitions et les animations au clic (CSS). Le `v-motion` de la couverture est piloté en JavaScript ; il est court (500 ms) et sans flash.

**Contenu mis à jour**
- Priorités imposées (prompt 91), info trafic retirée.
- Enquête en cartes (prompt 92), audit des textes (prompt 93) cité dans les livrables.
- Licences Hub'Eau et Loyalty Freak vérifiées (leviers du 11/11).

**Build et tests**
- La commande de build est inchangée.
- `smoke.mjs` vérifie en plus : l'image OG et les captures du deck présentes, les méta `og:image`, `twitter:card` et `lang="fr"`.
- Chaque fichier du deck est en précache, Mermaid compris (le deck passe à environ 7 Mo).
- Chromium : 24 diapositives rendues, pied de page « n / 24 », aucune erreur de console.
