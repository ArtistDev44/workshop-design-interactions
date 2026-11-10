# 29 — Correctifs de rendu : plein écran, grue, porte, objets animés, livres ouverts (10/11/2026)

Retours de rendu appliqués après le prompt 34. Les décisions Q1–Q61 et la boucle de jeu ne changent pas.

## Vue bureau en plein écran (révision du prompt 25)
- `SURCADRAGE = 1.05` remplace `DEZOOM = 0.88`. La pièce remplit tout l'écran, ses extrémités sont coupées (≈ 48 px à gauche et à droite, ≈ 27 px en haut et en bas), et la caméra fausse 3D (±12 px) ne montre jamais de bord.
- `masqueFlouEtVignette(ox, oy, echelle)` traite les bords, de façon fixe à l'écran, en 480×270 puis agrandi avec lissage :
  - une copie floutée de la pièce (`blur(2px)`), refaite seulement quand la pièce est redessinée, est découpée par une **bande d'épaisseur constante de 36 px le long des quatre bords** (opaque au bord, transparente vers l'intérieur). Elle remplace le masque elliptique, qui descendait loin dans les coins (livre, téléphone, horloge) : après plusieurs retours de rendu, la zone floue est passée de ≈ 280 px sur les côtés, avec des coins très entamés, à 36 px partout ;
  - un vignettage radial `rgb(12,16,22)`, allégé après retour de rendu : transparent jusqu'à 95,8 % du rayon (pointe des coins), 0,10 à 97,9 %, 0,22 dans les coins (au lieu de 0,5 à partir de 80 %).
- Sont retirés : le fond assombri autour de la pièce, son ombre portée, la découpe au cadre et le vignettage pixel art cuit dans l'image.
- Pour rester dans le champ, le pan de mur de droite passe de x = 420 à 402, avec l'horloge (418) et l'applique (410). La zone de la fenêtre s'arrête à 398.

## Grue
- Elle est à l'échelle des immeubles d'arrière-plan : tour de 37 px, flèche de 60 px, cabine. Les plus hauts immeubles font 36 à 40 px.
- Sa silhouette est pleine et opaque (`#6f7a87` le jour, `#0b111d` la nuit), avec un contour plus sombre et des croisillons dessinés sur le fond plein : plus de treillis transparent sur le ciel.
- Elle est posée sur l'horizon des immeubles (x = 344), entre l'écran et le pan de mur.

## Porte supprimée
- Supprimés : `dessinerPorte`, l'objet `porte` de `OBJETS_BUREAU`, `bureau.porte`, `objet.porte`, et la mention de la porte dans l'aide.

## Souris et téléphone orientés vers l'écran
- Les fuyantes du plateau convergent vers (240, −130) : `POINT_FUITE_Y`, déduit de la demi-largeur du plateau, 210 + 0,7 × (y − 170).
- `decalVersEcran()` décale chaque ligne de l'objet le long de la fuyante qui passe par son pied. La souris et le téléphone ont donc la même orientation que la table, le haut penché vers l'écran. Leurs détails suivent l'inclinaison : séparation des boutons, molette, câble, caméra, barre gestuelle.

## Animations (aucune avec animations réduites)
- **Tasse de thé** (au lieu de café, textes FR/EN mis à jour) : thé ambré, sachet dont l'étiquette pend à gauche et se balance (période d'environ 4,4 s), trois volutes de vapeur qui montent et s'effacent.
- **Téléphone** : toutes les 9 s, l'écran s'allume 1,5 s avec une bulle de notification stylisée (sans aucun texte ni donnée) et une vibration de 1 px pendant 0,45 s.
- **Livres** : au survol ou au focus, le livre se soulève de 2 px avec une ombre (1 px sans transition si animations réduites). Le marque-page rouge du livre « Commande » se balance.
- La pièce est redessinée toutes les 66 ms au lieu de 125, pour la fluidité (image 480×270). Avec animations réduites, toutes les 250 ms.

## Les livres restent des livres une fois ouverts
- `dessinerLivreOuvert()` dessine un vrai livre ouvert : couverture à la couleur du livre, deux pages crème, creux du dos ombré, tranches de feuilles empilées, marque-page.
- Ouverture : depuis le dos, en 450 ms, puis le texte apparaît. Avec animations réduites, le livre est ouvert d'emblée.
- **Livre « Bien gérer son stress »** : couverture verte, titre et deux conseils à gauche, trois conseils à droite, « Fermer » sous le livre.
- **Livre « Commande » (tutoriel)** : couverture marine.
  - Page gauche : n° d'étape, progression et titre. Page droite : le texte.
  - Une page tourne (380 ms) à chaque étape suivante ou précédente.
  - Les boutons Passer / Précédent / Suivant sont sous le livre, avec un focus jaune.
  - Nouvelle clé `tuto.pied` (FR/EN).

## QR codes
- `public/assets/qr-edition.png` → `https://workshop-design-interactions.pages.dev/` et `qr-pxe-nte001-g01-w01.png` → `…/cartel/`.
- Régénérés avec `qrencode`, l'outil système (`-s 20 -m 2 -l M`, 740×740 px), parce que le téléchargement du paquet npm `qrcode` est bloqué. Les commandes sont à jour dans `site/README.md`.
- Aucun décodeur n'est disponible ici : il faut encore les scanner avec un téléphone.

## Vérifications
- `npm run build` OK et `npm test` OK.
- Tests automatisés (Chromium, 1920×1080), sans erreur console, en FR et en EN, en ligne et hors ligne :
  - caméra : ±12 px, recentrage, 0 en animations réduites ;
  - sortie du PC ;
  - objets de la pièce ;
  - tutoriel dans le livre ;
  - plaintes ;
  - sauvegarde et import identiques.
