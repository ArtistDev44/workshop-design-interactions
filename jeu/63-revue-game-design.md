# 63 — Revue game design : compréhension du joueur (prompt 66)

Rapport complet : `notes.md`, section « Revue game design du 10/11/2026 ». `game.js` et règles Q1–Q61 inchangés ;
pas de conseil ni de flèche d'effet sous les boutons d'action (choix du prompt 50).

## Ce qui change pour le joueur
- **Correctif** : enchaîner plusieurs semaines ne fait plus expirer les signalements dès leur arrivée
  (`carte.js`, remise à zéro de la file à chaque nouveau paquet).
- **Guide « Prendre en main »** en 7 étapes : s'installer, jauges, **prendre le signalement**, sources et actions,
  applis, se lever, livre. Quand la cible est dans la colonne de droite (jauges, dossier, croix), la bulle se met
  à sa gauche avec une flèche horizontale : sources, actions et conséquences restent visibles. Pas de bulle sur
  le mail du soir.
- **Aide (H)** : règles de base (objectif, seuils 40 / 20, compteur 60 / 30 / 15 s, dé, score 0–300), puis Carte,
  gravité, équipes pertinentes ; raccourcis complets (Entrée, 5–8, 1–3, 0, A/B, Maj + 1–4, R, P, M, H, T, L, Tab,
  flèches, molette / Échap) en ≥ 18 px ; malus sous les raccourcis.
- **Tutoriel** (livre « Commande ») : signalement sur la Carte et prise avec Entrée, équipes (Maj + 1–4, hors sujet
  = moitié), ralenti (R), sablier.
- **Rapport** : décisions clés lisibles en entier ; **boutons DS** : le libellé s'ajuste à la largeur.

## Vérifications
- `npm run build`, `npm test` ; `git diff main -- site/public/game.js` vide.
- 3 semaines jouées après corrections, FR et EN, animations réduites : 106 / 192 / 151 (FR) et 106 / 192 / 143 (EN, choix au hasard différents), aucune erreur console.
