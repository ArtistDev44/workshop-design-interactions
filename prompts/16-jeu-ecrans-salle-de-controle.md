# Prompt 16 — Jeu « Nantes en régulation » : écrans (étape 3/6)

Lire d'abord le prompt 14. La structure et les données existent (prompt 15) :
implémenter ici les deux écrans du jeu, sans encore brancher la logique.

## Instructions
1. Écran d'accueil : titre **« Nantes en régulation »** (Q56), liste des
   **3 semaines réelles proposées** (Q14) — chacune = un niveau de difficulté
   (compteur 60 / 30 / 15 s, Q16+Q55) — + bouton Jouer + indicateur « mode hors
   ligne » si l'API est injoignable (Q34). Français uniquement (Q33).
2. Écran de jeu en 1920×1080, style carte Nantes stylisée en **géographie
   réelle** (Q1, Q2) : tracés issus de `data/lignes.json`, palette custom (Q3),
   deux polices — monospace pour les données, sans-serif pour les textes (Q4).
   Panneau gauche : carte + liste des lignes (alertes d'abord, puis retard
   décroissant, Q45), état en code couleur + épaisseur — vert / orange /
   rouge clignotant (Q29), météo du jour visible **dans le décor** (Q8, Q30).
   Panneau droit : dossier courant avec **ligne + retard + raison en priorité**
   (Q5), badge « contradiction » si deux sources se contredisent (Q9) —
   mauvaise source = malus réputation + conséquence réelle (Q31) — 3 actions +
   « ne rien faire », **compteur en barre horizontale** (Q6), 3 jauges en barres
   horizontales compactes (Q7). Arrivée du dossier : **glissement du panneau**
   (Q10).

## Vérifications
- Enchaînement accueil → Jouer → salle de contrôle en 1920×1080, sans erreur
  console.
- La carte affiche les tracés réels de `data/lignes.json` ; la météo du jour
  apparaît dans le décor.
- Les deux écrans restent lisibles sans réseau (données du prompt 15).
