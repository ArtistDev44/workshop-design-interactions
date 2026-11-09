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
- Style « salle de contrôle » : sombre, lisible, informations de médiation en
  contraste suffisant.
- p5.js, `pixelDensity(1)`, testé en 1920×1080.
- Régime temporel : interaction continue (clics/clavier) + événements (arrivée
  d'un incident).
