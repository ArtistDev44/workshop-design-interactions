# Grammaire — Nantes en régulation

Chaîne : source (données réelles Nantes) → grammaire (seuil, alertes) → système (incident → décision → jauges) → œuvre (salle de contrôle p5.js).

## Règle structurante
Un retard réel d'au moins 10 minutes sur une ligne (mode « aujourd'hui »), une perturbation datée
des archives (travaux, manifestation, mouvement social, événement) ou une alerte météo extrême par
rapport à la semaine (95e percentile, Q39) devient un dossier à trancher. Tant qu'il n'est pas
traité, son retard s'aggrave ; à l'heure de fin de service, ce qui reste en file subit ses
conséquences naturelles (Q25).

## Invariants
- Seuil de retard : 10 minutes
- 4 réponses par catégorie de dossier (accident, météo, retard, travaux, affluence), dont toujours
  « attendre » — prompt 87, qui remplace les 3 actions + « ne rien faire » de Q5–Q7 ; la table
  d'effets Q57–Q60 reste le repli
- 3 jauges : fluidité, réputation, budget (depuis le prompt 22 ; le trio d'origine était fluidité,
  satisfaction, réputation ; voir `game.js`)
- Aucun événement inventé

## Variables
- Semaine rejouée
- Difficulté (prompt 87, remplace le compteur 60 / 30 / 15 s de Q16 et Q55) : signalements pris en
  même temps 3 / 2 / 1, vitesse d'aggravation du retard ×0,5 / ×1 / ×1,5, budget de départ
  60 / 50 / 40 ; le mode « Défi chrono » (Paramètres, touche 0) rétablit le compteur par décision
- Météo de la semaine
- Heure de pointe
- Tirage 1d6 ajouté aux effets de base (Q57)

## Mapping en une phrase
« Le flux GTFS-RT Naolib fournit le retard réel des lignes et Open-Meteo la météo de
la semaine choisie : le seuil de 10 min et les alertes météo génèrent les
dossiers, et chaque réponse du joueur module les trois jauges selon le contexte. »
(phrase de `jeu/00-concept.md`, « action » devenue « réponse » au prompt 87 ; le groupe peut la reformuler)
