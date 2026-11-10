# Prompt 39 — Jeu « Nantes en régulation », étape 26 : interface au Pixel Design System

Objectif : mettre à jour **tout le design de l'interface** avec le design system du groupe,
`design-system/pixel-design-system.md` (Pixel Design System, Figma Community) : menus,
écran de jeu de l'appli de régulation, fenêtres (aide, paramètres, reprise, reset, menu
Échap), guide « Prendre en main », bulles et infobulles, écran de chargement, boîte
d'import et toasts. Le décor pixel art de la pièce et les objets diégétiques (livres
ouverts, téléphone) gardent leur rendu. Les décisions Q1–Q61 ne changent pas.

S'appuie sur les prompts 22 (RégulOS déjà au Pixel DS, `ds.js`), 27, 33, 35–38.

Fichiers concernés : `site/public/` (`ds.js` pour les jetons, `sketch.js` pour la palette
`C`, `panneau()`, `bouton()` et les écrans, `menu.js`, `guide.js`, `immersion.js`,
`os.js`, `index.html` et `style.css` pour le chargement, la boîte d'import et les toasts),
plus `jeu/` et `journal.md`.

## Jetons à appliquer (extraits du design system)
- Fond `#0D0C0C` ; primaire `#D4031C` (texte blanc dessus) ; blanc et ses opacités 75 /
  50 / 15 / 05 ; bordure = blanc 15 % ; désactivé = fond blanc 15 %, texte blanc 50 %.
- Fonctionnels : succès `#00B74F`, alerte `#FFC138`, erreur `#D10B00`, info `#3860FF`,
  et leurs teintes claires (`#BFFFDB`, `#FFECC2`, `#FFC5C2`, `#C2CEFF`).
- Unité 4 px ; espacements 2 / 4 / 8 / 16 / 20 / 24 ; **arrondi 0** (General Roundness).
- Titres : Bitsy Pixels (repli : titres pixelisés de `dsTitre`) ; paragraphes : JetBrains
  Mono (repli monospace).
- Boutons : primaire (fond rouge, texte blanc), secondaire (fond blanc, texte noir),
  contour (bordure blanche), fantôme ; focus en double bordure.

## Règles
- Contraste ≥ 4,5:1 pour tout texte : pas de texte rouge primaire ni erreur primaire sur
  le fond sombre (utiliser blanc ou les teintes claires) ; textes secondaires en blanc
  75 % / 50 % uniquement sur `#0D0C0C`.
- Aucune information ni fonctionnalité retirée ; tout texte reste via `t(...)` ;
  `prefers-reduced-motion` et contraste renforcé conservés (blanc 75 % au lieu de 50 %).

## Vérifications
- `npm run build` et `npm test` ; captures de chaque écran (menu, nouvelle partie, jeu
  en attente, dossier, narration, mail, fin, aide, paramètres, reprise, menu Échap,
  guide, chargement, import) en FR et EN : aucun débordement de texte, contrastes OK.
- Documenter dans `jeu/34-interface-pixel-design-system.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-39-design-system`. À chaque push : entrée en tête de `journal.md`.
