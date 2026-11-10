# 25 — Cadrage du bureau « sur la chaise » (prompt 31)

Décisions verrouillées. La vue bureau se voit depuis la chaise : elle est plus proche du poste et centrée sur lui, et la chaise n'apparaît plus. Les décisions Q1–Q61 et la boucle de jeu ne changent pas.

Note de numérotation : le prompt demandait `jeu/18-bureau-cadrage-chaise.md`, mais le n° 18 est déjà pris (multi-langue). Ce fichier prend donc le n° 25.

## Cadrage (`bureau.js`)
- `CADRAGE = { x: 24, y: 6, l: 432, h: 243 }` : seule la partie centrale de la pièce (480×270) est montrée. Le rectangle est en 16:9 et centré sur le PC (240), ce qui rapproche le poste d'environ 11 %.
- Le dézoom du prompt 25 (`DEZOOM = 0.88`) est conservé : il reste un peu de fond autour de la pièce.
- `origineBureau()` donne désormais `u`, la taille d'un pixel art à l'écran (`L × 0,88 / 432`). `versEcranBureau()` en tient compte : PC, porte, livres, objets, étiquette de l'horloge et caméra suivent tous le nouveau cadrage.
- La découpe est faite au canevas (`clip`), elle grandit avec le zoom vers le poste et disparaît au poste. Elle donne donc le même rendu au poste et pendant le zoom qu'avant.
- La caméra fausse 3D (prompt 25), les sorties du PC (prompt 26) et les objets (prompt 29) ont été retestés sans changement.

## Chaise
- Les accoudoirs du fauteuil (`dessinerAccoudoirs`) sont supprimés : on est assis sur la chaise, elle n'est plus dans le champ.

## Horloge
- L'horloge de bureau numérique est retirée du plateau, et l'étiquette « hh:mm ▶▶ ×10 » ne flotte plus devant la baie ni le store.
- Elle est remplacée par une horloge murale ronde (`HORLOGE_MURALE`) sur un nouveau pan de mur blanc, à droite de la baie (`MUR_DROIT_X = 420`). Ses aiguilles donnent l'heure du jeu (`heureAffichee()`, comme l'horloge du prompt 20). L'étiquette numérique s'affiche juste en dessous.

## Lampadaire → applique murale
- La lampe d'architecte posée sur le bureau, avec son long bras, est remplacée par une applique murale sur le pan de mur de droite. Allumée, elle projette un flux de lumière chaude vers le haut et vers le bas.
- La lampe interactive du prompt 29 garde la même clé (`lampe`). Seule sa zone change : 432,86 · 16×14.

## Autres ajustements
- La porte (prompt 26) passe à x = 28 pour rester dans le cadrage. Le pan de mur latéral s'élargit en conséquence.
- La zone de la fenêtre (prompt 29) s'arrête au pan de mur : 334,14 · 80×96. Le store ne couvre que la baie.
- Les arbres vus par la fenêtre ne changent pas.
- Le voile du fond passe à 0,84 d'opacité, pour que les reflets de la pièce derrière soient moins visibles.

## Vérifications
- `npm run build` OK. Le canevas est en 1920×1080 et mis à l'échelle par le CSS : le rendu est identique à 1280, 1600 et 1920 px.
- Tests des prompts 25, 26 et 29 relancés, sans erreur :
  - caméra : −11,7 px, recentrage, 0 en animations réduites ;
  - porte et bouton Quitter ;
  - objets, dont la lampe en applique ;
  - FR et EN, en ligne et hors ligne.
