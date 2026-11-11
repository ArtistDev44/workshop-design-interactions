# Prompt 94 — Diaporama Slidev : un rendu professionnel, niveau soutenance (direction artistique, animations sobres, sommaire, métadonnées propres)

Demande d'origine (11/11/2026) :

> Rendre le diaporama Slidev de `/presentation/` plus professionnel pour la soutenance :
> une vraie direction artistique (découpage en actes, sommaire, pied de page avec numéro de
> diapo), des animations sobres au clic, une image OG et des métadonnées propres, sans casser
> le design system Pixel ni l'URL `/presentation/`. S'appuyer sur le prompt 82 (qui a posé la
> bascule Slidev) et appliquer le skill Slidev installé avec `npx skills add slidevjs/slidev`,
> en restant original : chaque slide a une mise en page justifiée par son propos, pas un layout
> unique répété.

Contexte : depuis le prompt 82, le deck est `slides/slides.md` (~280 lignes, `theme: none` +
`styles/index.css` Pixel Design System : fond #0D0C0C, primaire #D4031C, alerte #FFC138, succès
#00B74F, arrondi 0, JetBrains Mono / Bitsy Pixels), avec `global-top.vue` (aria-live du n° de
slide), `setup/shortcuts.ts` (Début/Fin), des captures annotées de flèches `<Arrow>` dans
`slides/public/img/`. Build : `cd slides && npm run build` → `slidev build slides.md --base
/presentation/ --out ../site/public/presentation`, servi à `/presentation/` ; liens depuis
`/cartel/` et `/making-of/`. Le deck actuel enchaîne cover / quote / center / two-cols / images
fléchées / end, sans sommaire, sans animations au clic, sans métadonnées SEO. Règles Q1–Q61
inchangées : `game.js` non touché, `test-jeu.mjs` reste vert.

## Prérequis — le skill Slidev, installé avec npx, est la référence
0. **Vérifier l'environnement** (prérequis du skill) : `node -v` ≥ 22.12.0 (ici v24 OK) et
   `npm -v`. **Installer (ou vérifier) le skill dédié** : `npx skills add slidevjs/slidev -y
   --agent '*' -g` — il est installé en global dans `~/.agents/skills/slidev/`. **Le lire et s'y
   référer pendant tout le prompt** : `SKILL.md` puis les références utiles ici :
   `references/core-syntax.md`, `core-headmatter.md`, `core-frontmatter.md`, `core-layouts.md`,
   `core-animations.md`, `core-components.md`, `core-cli.md`, `core-hosting.md`,
   `layout-global-layers.md`, `layout-slots.md`, `diagram-mermaid.md`,
   `animation-rough-marker.md`, `style-scoped.md`, `build-seo-meta.md`, `build-og-image.md`.
   Conventions Slidev à respecter : frontmatter d'entrée (headmatter), séparateurs `---`,
   layouts, composants built-in, `slidev build --base /presentation/`.

## Attendu
1. **Headmatter pro** : compléter le frontmatter d'entrée de `slides/slides.md` —
   `titleTemplate: '%s — PATRIMOINE.EXE · NTE001'`, `author` (auteurs du jeu, repris du cartel),
   `keywords`, `htmlAttrs: { lang: 'fr' }`, `highlighter: shiki`, `lineNumbers: false`,
   `defaults: { layout: default, transition: fade }`, et `seoMeta:` complet (`ogTitle`,
   `ogDescription`, `ogUrl: https://workshop-design-interactions.pages.dev/presentation/`,
   `twitterCard: summary_large_image`). Générer une **image OG** `og-image.png` (1200×630) dans
   `slides/public/` au visuel Pixel DS (fond #0D0C0C, barre #D4031C, titre du deck) — générée
   localement (script Node natif ou ImageMagick, déjà utilisé au prompt 82 ; aucun nouveau
   package lourd).
2. **Direction artistique en actes** : découper le deck en chapitres avec `layout: section`
   (« Le projet », « La chaîne source → grammaire → système → œuvre », « Les sources réelles »,
   « Le jeu », « Jouer »), `cover` + `intro` en ouverture, `end` en clôture. Varier les layouts
   selon le propos : `quote` pour la question, `statement` ou `fact` pour un chiffre clé
   (ex. seuil de retard ≥ 10 min), `two-cols-header` pour les duos titre + colonnes,
   `image-right` / `image-left` / `full` pour les captures fléchées, `center` pour une transition.
   **Jamais deux slides identiques de suite** : chaque mise en page est justifiée par le contenu.
3. **Sommaire et pied de page pro** : ajouter une slide `<Toc columns="2" />` après la cover ;
   créer `slides/global-bottom.vue` avec `<SlideCurrentNo /> / <SlidesTotal />`, le titre court
   du deck et le lien vers le site, masqué sur `cover`/`section`/`end`
   (`v-if="$nav.currentLayout !== 'cover' && …"`) ; conserver `global-top.vue` (aria-live) et
   `setup/shortcuts.ts` (Début/Fin). Un renvoi interne `<Link to="…">` au moins une fois
   (ex. depuis « Jouer » vers la slide des livrables).
4. **Animations sobres, au service du propos** : `v-click` / `<v-clicks>` sur les listes et
   blocs clés, `v-after` pour associer deux éléments, `transition: slide-left` entre sections
   (per-slide, le `fade` du `defaults` ailleurs), `v-motion` discret sur la cover uniquement.
   **Aucune animation gratuite** : `prefers-reduced-motion` désactive transitions et animations
   (media query CSS dans `styles/index.css`), aucun flash, navigation clavier ← → Début Fin
   intacte.
5. **La chaîne en diagramme Mermaid** : remplacer le HTML custom de la slide « La chaîne » par un
   bloc ` ```mermaid ` (flowchart LR, `theme: 'dark'`) : source → grammaire → système → œuvre,
   couleurs Pixel DS (#D4031C, #FFC138 sur fond sombre), avec un libellé d'accessibilité
   (`role="img"` / aria-label) décrivant le flux.
6. **Images fléchées conservées, mieux mises en scène** : garder les captures de
   `slides/public/img/` annotées (`<Arrow>` + étiquettes + `alt` décrivant chaque flèche), mais
   calées dans des layouts dédiés (`image-right`, `full`) avec éventuellement `background:` /
   `backgroundSize:` ; utiliser `v-mark.circle` ou `v-mark.underline` (rough marker) sur **un**
   mot-clé par slide maximum.
7. **Typographie pro** : hiérarchie stricte (un h1 par slide, h2/h3 rares), listes ≤ 6 items et
   ≤ 2 niveaux, `<AutoFitText>` pour le titre de la cover, `zoom:` par slide si un contenu
   déborde. Espacements cohérents (unité 4 px) dans `styles/index.css` ; Pixel Design System
   inchangé (arrondi 0, contraste ≥ 4,5:1, focus visible #FFC138, `strong` surligné primaire).
8. **Notes présentateur** : `<!-- … -->` sur chaque slide (2–3 lignes : ce qu'on dit à l'oral),
   avec `[click]` pour synchroniser une note à une étape d'animation là où c'est utile.
9. **Contenu réarrangé sans perte** : question, chaîne, sources réelles + licences + liens API,
   règles du jeu, interactions, accessibilité/hors ligne, livrables, crédits — FR uniquement,
   inconnu → `"[À COMPLÉTE]"`, aucun secret, aucune donnée inventée.
10. **Build, service, tests** : `cd slides && npm run build` (commande `slidev build slides.md
    --base /presentation/ --out ../site/public/presentation` **inchangée**), puis
    `cd site && npm run build && npm test` ; le service worker `sw.js` couvre les nouveaux
    assets (OG image comprise) et `scripts/smoke.mjs` liste les assets du deck dans
    `ESSENTIELS` ; liens depuis `/cartel/` et `/making-of/` inchangés ; aucune erreur console ;
    deck jouable hors ligne après install.

## Vérifications
- `cd slides && npm run build` puis `cd site && npm run build && npm test` OK ; `/presentation/`
  servi depuis le build Slidev, base `/presentation/` respectée, OG image et métadonnées SEO
  servies.
- Rendu pro visible : sommaire `<Toc>`, pied de page avec n° de diapo, actes en `section`,
  layouts variés (jamais deux slides identiques de suite), Mermaid rendu, captures fléchées
  avec alt descriptif, `v-click` fonctionnels, transitions sobres.
- Accessibilité : clavier ← → Début Fin, aria-live du n° de slide (global-top), contraste ≥ 4,5:1,
  focus visible, `prefers-reduced-motion` respecté, pas de flash, `lang="fr"`, responsive.
- Hors ligne après install (sw), 0 lien cassé depuis `/cartel/` et `/making-of/`, `npm test` vert.
- `git diff` relu : `game.js` et Q1–Q61 inchangés, aucun secret, aucune donnée inventée.
  Mettre à jour `prompts/README.md` (ligne 94) et `journal.md` (une ligne en tête).
  Branche dédiée `94-slides-rendu-pro-soutenance` ; fusion dans `main` sur demande.
