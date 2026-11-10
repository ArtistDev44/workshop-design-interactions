# Prompt 25 — Jeu « Nantes en régulation », étape 12 : vue 3D / environnement PC

Objectif : rendre la vue bureau lisible comme **un ordinateur dans une pièce**, et non
plus comme un plein écran abstrait — sans toucher aux décisions verrouillées Q1–Q61 ni
à la boucle de jeu. Deux mouvements : (1) un **léger dézoom** de la vue bureau pour que
l'on voie le fond autour de l'écran du PC (on comprend que l'on est dans un ordinateur,
dans un jeu vidéo) ; (2) une **caméra fausse 3D façon FNAF** : quand la souris sort du
cadre de l'écran, la vue s'oriente subtilement pour regarder autour de l'ordinateur ;
quand elle revient au centre, la vue se recentre sur l'écran.

S'appuie sur les prompts 14–24 (bureau pixel art `jeu/12-bureau-pixel.md`, immersion,
bureau applicatif, profondeur tactique, i18n). Le décor pixel art existant est réutilisé
tel quel ; on ne redessine pas la pièce.

Fichiers concernés : `site/public/` (`bureau.js`, `sketch.js`, `immersion.js`,
`i18n.js` pour les nouveaux textes, `style.css` si besoin), plus une mise à jour de
`jeu/` et `journal.md`.

Règle absolue : tout nouveau texte d'interface passe par `t(...)` (`i18n.js`, prompt 24)
dans les deux langues ; aucune donnée inventée ; aucun fichier image ajouté (tout reste
dessiné par le code).

## 1. Dézoom de la vue bureau (voir le fond autour de l'écran)

- En vue `bureau` (`bureau.js`, variable `vue`), appliquer un **léger dézoom** : le PC
  n'occupe plus toute la largeur de l'écran, on voit le mur/le fond autour du moniteur,
  ce qui rappelle que c'est un PC. Le jeu à l'intérieur de l'écran du PC garde sa propre
  mise en page (il « ne prend pas toute la largeur » de la fenêtre, mais il remplit
  correctement l'écran du PC).
- Le dézoom est fixe et subtil (marge visible autour du PC, ex. ~5–8 % de chaque côté à
  1920×1080), pas un zoom animé au lancement : la lisibilité du bureau prime.
- Les zones interactives existantes (écran du PC, livres, horloge, etc.) suivent le
  dézoom : leurs coordonnées sont recalculées à partir de la géométrie du PC, pas
  codées en dur.

## 2. Caméra fausse 3D (style FNAF), mouvement subtil uniquement

- Quand `vue === 'bureau'` et que la souris est **hors du cadre de l'écran du PC**, la
  scène se décale doucement dans la direction de la souris (parallaxe légère : la pièce
  semble tourner autour du PC), pour découvrir ce qu'il y a autour de l'ordinateur
  (haut du moniteur, côtés, plante, fenêtre, horloge murale — éléments déjà présents ou
  ajoutés en pixel art dans `dessinerPieceBureau()`).
- Quand la souris **revient au centre** (dans le cadre de l'écran), la vue se recentre
  progressivement sur l'écran du PC.
- **Amplitude faible et bornée** (ex. déplacement max ~10–14 px à 1920×1080, rotation
  imperceptible) : jamais de grands mouvements de tête, la navigation au bureau doit
  rester simple et ne pas donner le mal des transports.
- Lissage doux (easing) sur le déplacement ; aucune saccade.
- **Flèches directionnelles** (← → ↑ ↓) : en alternative à la souris, maintenir une
  flèche applique le même décalage subtil dans cette direction ; relâcher recentre.
  Ne pas consommer les flèches quand le focus est dans un champ ou un menu.
- `prefers-reduced-motion` : aucun décalage de caméra (ni souris ni flèches), la vue
  reste strictement centrée.
- Le mouvement ne s'applique **qu'en vue bureau** : au poste (`vue === 'poste'`) et dans
  les zooms, rien ne change.

## 3. Ce qui ne change pas

- Clic sur l'écran du PC → zoom au poste ; Échap → menu / se lever (prompt 20) ;
  les transitions existantes (clignement d'œil, prompt 21) sont conservées.
- La boucle de jeu, les jauges, les décisions Q1–Q61, les apps du bureau (prompt 22)
  et les textes i18n (prompt 24) ne sont pas modifiés.

## 4. Vérifications

- `npm run build` dans `site/`.
- Tester à 1920×1080 : vue bureau dézoomée (fond visible autour du PC), déplacement
  subtil souris hors cadre / retour au centre, flèches directionnelles, recentrage au
  relâchement, aucun mouvement au poste, `prefers-reduced-motion` (vue fixe), clavier
  seul, hors ligne (fallback), contraste ≥ 4,5:1 sur les nouveaux éléments du décor.
- Tous les nouveaux textes passent par `t(...)` en FR et EN ; aucun `À COMPLÉTER`.
- Aucune régression des prompts 14–24 (partie complète rejouée).
- Documenter dans `jeu/18-vue-3d-pc.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-25-vue-3d-pc`. À chaque push : entrée en tête de `journal.md`.
  Ne pas fusionner dans `main` sans demande.
