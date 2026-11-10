# Prompt 64 — Jeu « Nantes en régulation », étape 48 : micro recentré sur le souffle, présence webcam réparée

Demande d'origine (10/11/2026) : retirer « Parler aux chauffeurs » (radio, prompt 63) et « Ambiance » (texture
sonore granulaire, prompt 54) ; la présence par webcam (« si vous quittez votre poste environ 8 s, votre
personnage s'endort ») ne marche pas.

## Attendu
1. Micro : plus de texture sonore ni de radio ; il ne sert qu'au **souffle** pendant le boost du café
   (prompt 63, point 4). Le micro ne joue plus aucun son. Textes, info-bulles, slides et docs mis à jour.
2. Webcam : présence détectée de façon robuste face à une vraie caméra (bruit du capteur, exposition) ;
   l'absence endort le joueur environ 8 s après son départ, y compris pendant un dossier ; un geste à son
   retour le réveille ; le geste de réveil (main levée) reste valable pendant le réveil.

## Vérifications
- `npm run build`, `npm test` ; scène simulée (image fixe bruitée = chaise vide, objet en mouvement =
  personne) : présent → pas de sieste ; vide → sieste ; geste → réveil. Documenter dans `jeu/58-…`.
