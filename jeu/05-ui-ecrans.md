# 05 — UI et écrans (salle de contrôle, 1920×1080)

## Écrans
1. **Écran d'accueil** : titre, sélection de la semaine réelle à rejouer
   (dans les limites de l'API), bouton Jouer.
2. **Écran de jeu (principal)** : salle de contrôle à panneaux —
   - **Panneau gauche** : carte/liste des lignes du réseau avec leur état
     (à l'heure / en retard / en alerte), météo du jour.
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
- **Palette** : custom, propre au jeu (pas les couleurs officielles Tanway).
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
- Le contraste doit rester suffisant pour les informations de médiation.
