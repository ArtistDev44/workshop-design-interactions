# 58 — Micro recentré sur le souffle, présence webcam réparée (prompt 64)

## Micro (`micro.js`)
- **Retirés** à la demande du groupe : la texture sonore granulaire (prompt 54) et la « radio des chauffeurs »
  (prompt 63). Le micro ne joue plus aucun son.
- **Reste** : M maintenue (ou clic maintenu sur le micro du poste) ; pendant le **boost du café**, souffler
  doucement fait redescendre le cœur deux fois plus vite et ralentit le compteur de moitié. Le panneau en
  haut à gauche montre amplitude, hauteur et souffle. Micro indisponible : le souffle ne peut pas être capté,
  rien d'autre ne change.

## Webcam (`webcam.js`, `immersion.js`)
- **Cause de la panne** : le « mouvement » était la moyenne de toutes les différences de pixels entre deux
  images. Le bruit d'une vraie webcam et ses variations d'exposition dépassaient à eux seuls le seuil (1,6) :
  une chaise vide paraissait toujours occupée.
- **Correctif** : mouvement = **part des pixels qui changent de plus de 20 niveaux** par rapport à l'image
  d'il y a ~1,2 s (image réduite à 48 × 27, qui moyenne le bruit). Absent sous 0,6 % pendant 8 s, ou caméra
  masquée ; geste de réveil au-dessus de 25 %.
- **Sieste** : l'absence endort aussi **pendant un dossier** (le compteur continue sans le joueur, Q25) ; un
  vrai geste à son retour le réveille. Entre deux dossiers, comme avant : le réveil se fait à l'incident
  suivant (bouton, espace ou main levée).

## Vérifications
- `npm run build`, `npm test`.
- Chromium, caméra remplacée par une scène simulée : objet en mouvement → 9,2 % de l'image, présent ; image fixe
  avec bruit de capteur ±8 → 0 %, endormi en plein dossier ; retour sans geste → toujours endormi ; clic →
  réveillé. Voix au micro pendant un dossier → plus d'info trafic ; plus aucune fonction de texture.
- Seuils à valider en salle avec la vraie webcam (éclairage).
