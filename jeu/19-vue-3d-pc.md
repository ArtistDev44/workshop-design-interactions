# 19 — Vue 3D / environnement PC (prompt 25)

> **Révision du 10/11/2026 (retour de rendu)** : le prompt avait été mal compris. Le jeu occupe désormais **tout l'écran** : plus de dézoom ni de fond autour de la pièce. La pièce est surcadrée à 1,05 (`SURCADRAGE`) : ses extrémités sont coupées (~48 px à gauche et à droite, ~27 px en haut et en bas), ce qui laisse à la caméra (12 px au plus) la place de bouger sans montrer de bord. Les bords sont adoucis par un **masque de flou** et un **vignettage**, tous deux fixes à l'écran (`masqueFlouEtVignette`, en basse résolution puis agrandis). Le vignettage pixel art qui était cuit dans l'image de la pièce est retiré. Détails : `29-correctifs-plein-ecran-livres.md`.

Décisions verrouillées. La vue bureau se lit comme un ordinateur posé dans une pièce : la pièce est légèrement dézoomée et une caméra « fausse 3D » regarde autour du PC. Les décisions Q1–Q61, la boucle de jeu et les apps du PC ne changent pas.

Note de numérotation : le prompt demandait `jeu/18-vue-3d-pc.md`, mais le n° 18 est déjà pris par le multi-langue (prompt 24). Ce fichier prend donc le n° 19.

## Dézoom fixe (`bureau.js`)
- `DEZOOM = 0.88` : la pièce (image pixel art 480×270 agrandie) occupe 88 % du canevas, soit 115 px de marge à gauche et à droite et 65 px en haut et en bas à 1920×1080 (6 % de chaque côté).
- Fond visible dans la marge : la pièce elle-même, agrandie à 104 %, assombrie par un voile `rgba(12,16,22,0.77)` et placée derrière. Une ombre portée et un liseré sombre détachent la pièce, qui se lit comme un plan plus proche. Aucun fichier image : tout est dessiné par le code.
- Le zoom n'est pas animé au lancement : le cadrage est fixe.
- Coordonnées : `versEcranBureau(x, y, l, h)` convertit un rectangle pixel art en pixels du canevas (dézoom et caméra compris). L'écran du PC (`rectEcranPC()`), les livres (`zonesObjetsBureau()`), l'étiquette de l'horloge et la zone cliquable de l'écran passent tous par cette fonction. Aucune coordonnée n'est codée en dur.
- `rectEcranBase()` donne l'écran à l'échelle 1. Il sert de référence pour placer la pièce autour d'un rectangle d'écran quelconque. La vue au poste (`ECRAN_POSTE`) et les zooms gardent donc le même cadrage qu'avant.

## Caméra fausse 3D (style FNAF)
- Elle n'est active qu'en vue `bureau`, sans fenêtre ouverte, sans SMS et sans réveil.
- Souris hors du cadre de l'écran du PC : la caméra regarde vers la souris. La pièce glisse dans l'autre sens, proportionnellement à l'écart au centre, et découvre le côté visé (grue, château, lampe, dossiers…). Le fond bouge moins (parallaxe) : l'effet de profondeur vient de là.
- Souris dans le cadre de l'écran : recentrage progressif.
- Amplitude bornée : 12 px au plus pour la pièce, 5 px pour le fond, diagonale bornée elle aussi. Aucune rotation.
- Lissage exponentiel (`CAMERA.lissage = 0.1` par image à 60 i/s), corrigé par `deltaTime` pour rester le même quel que soit le nombre d'images par seconde. Aucune saccade.
- Flèches ← → ↑ ↓ : tant qu'une flèche est maintenue, elle donne la direction et l'emporte sur la souris. La relâcher recentre la vue. Elles ne sont pas prises en compte si le focus est dans un champ (élément actif autre que `body` ou le canevas) ou si une fenêtre (menu, aide…) est ouverte.
- La caméra ne réagit pas tant que la souris n'a pas bougé sur le canevas. Après un appui tactile ou si la souris sort du canevas, elle se recentre : la position du dernier toucher ne reste pas « collée ».
- `prefers-reduced-motion` ou réglage « animations réduites » : caméra fixée à (0, 0), ni souris ni flèches.

## Textes
- Nouvelle clé `aide.k.regarder` (FR / EN) dans l'aide (H) : « Au bureau : regarder autour du PC (relâcher pour recentrer) ». L'interligne des raccourcis passe de 38 à 34 px pour faire place à cette ligne.

## Inchangé
- Clic sur l'écran → zoom au poste, Échap → menu ou se lever, clignement d'œil, flou au poste, sieste, bordures rouges.

## Vérifications
- `npm run build` OK.
- Test automatisé (Chromium, 1920×1080) :
  - souris à droite → caméra −11,7 px ;
  - retour au centre → 0 ;
  - ← maintenue → +12 px, relâchée → 0 ;
  - au poste → 0 ;
  - `reducedMotion: reduce` → 0 ;
  - aucune erreur console.
