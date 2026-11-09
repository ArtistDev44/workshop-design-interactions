# Prompt 17 — Jeu « Nantes en régulation » : boucle de jeu, effets et jauges (étape 4/6)

Lire d'abord le prompt 14. Les écrans existent (prompt 16) : brancher ici la
logique de jeu complète.

## Instructions
1. Boucle : incident réel (retard ≥ 10 min, ou alerte météo Open-Meteo avec
   seuils **dérivés des données** — extrême vs normale de la semaine, Q39) →
   choix du joueur → effets sur les jauges → narration (ton adaptatif selon
   jauges, Q17) → incident suivant. ~15 décisions (Q15 : 30 s par défaut),
   aucun événement inventé. Le réseau complet est concerné (Q21) ; la semaine
   rejouée combine données **live au lancement + archive météo/incidents
   enregistrés** (Q22) ; la répartition lignes/météo suit les données réelles de
   l'API, sans ratio fixe (Q36). L'**affluence** n'apparaît que si une source
   réelle la fournit (Q23). « Communiquer aux usagers » est un effet secondaire
   des actions, pas une 4e action (Q28). Conflit de deux lignes = choix binaire
   explicite (Q27). Si le compteur atteint 0 : « ne rien faire » avec les seules
   conséquences naturelles du dossier (Q25).
2. Table des effets (base + **1d6**, Q57/Q61), modificateurs contextuels (Q24) :
   - Dévier la ligne : fluidité −10, satisfaction +5, réputation 0
   - Retenir en terminus : fluidité −7, satisfaction −12, réputation +8 si
     retard > 20 min sinon +4 (Q58)
   - Bus de renfort : fluidité +12, satisfaction +8, réputation −3 (Q59)
   - Ne rien faire : −2 à −8 sur une jauge tirée au hasard (Q60)
   Jauges : départ **50**, poids égaux, score combiné 0–300 (Q40, Q44).
   Jauge < 20 : clignotement discret (Q46).
3. Le mapping API → incident → action → jauges doit tenir en une phrase (voir
   `jeu/02-donnees-api.md`).

## Vérifications
- Une partie complète de 15 dossiers se déroule de bout en bout (fallback).
- Chaque action applique la table des effets + 1d6 sur les 3 jauges ; le
  compteur à 0 déclenche « ne rien faire » avec conséquences naturelles (Q25).
- Aucune erreur console en 1920×1080 ; partie rejouable sans réseau.
