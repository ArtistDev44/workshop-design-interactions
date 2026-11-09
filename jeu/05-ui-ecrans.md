# 05 — UI et écrans (salle de contrôle, 1920×1080)

## Écrans
1. **Écran d'accueil** (Q34) : titre **« Nantes en régulation »** (Q56), **liste des 3 semaines proposées** (Q14) +
   bouton Jouer + indicateur discret « mode hors ligne » si l'API est injoignable.
2. **Écran de jeu (principal)** : salle de contrôle à panneaux —
   - **Panneau gauche** : carte du réseau (tracés API au lancement + fallback
     local, Q42) + liste des lignes avec leur état — **alertes d'abord, puis tri
     par retard décroissant** (Q45) — et météo du jour dans le décor (Q30).
   - **Panneau droit** : dossier courant (données de l'incident), les 3 actions
     + « ne rien faire », le compteur de temps, les trois jauges.
3. **Écran de narration** : court texte entre deux décisions.
4. **Écran de fin** : bilan des jauges, fin obtenue, bouton Rejouer / changer de semaine.

## Principes
- p5.js, `pixelDensity(1)`, testé en 1920×1080.
- Régime temporel : interaction continue (clics/clavier) + événements (arrivée
  d'un incident).

## Décisions de design verrouillées (Q1–Q10)
- **Style** : carte Nantes stylisée en fond, avec **géographie réelle** des lignes.
- **Palette** : custom, propre au jeu (pas les couleurs officielles Naolib).
- **Typographie** : deux polices — monospace pour les données chiffrées,
  sans-serif pour les textes et boutons.
- **Météo** : visible directement dans le décor (nuages, pluie, soleil…), pas
  seulement dans une bannière.
- **Compteur de temps** : barre horizontale qui se vide en haut du panneau dossier.
- **Jauges** : trois barres horizontales compactes en bandeau.
- **Dossier** : ligne + retard + raison en priorité ; détails (affluence, météo)
  en dessous.
- **Contradiction de données** : badge « contradiction » sur le dossier.
- **Arrivée d'un dossier** : le panneau glisse depuis la droite.
- **État des lignes sur la carte** (Q29) : code couleur + épaisseur — vert = à
  l'heure, orange = retard, **rouge clignotant = incident actif**.
- **Décor météo** (Q8, Q30) : la météo réelle du jour se voit dans le décor.
- **Conflit de deux lignes** (Q27) : écran « quelle ligne traiter en priorité ? ».
- Le contraste doit rester suffisant pour les informations de médiation.
