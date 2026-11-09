# 02 — Données et API

## Sources
| Source | Données | Usage |
|---|---|---|
| API Tanway/Lila — Open Data Nantes Métropole | Prochains passages temps réel, retards des lignes tram/bus — **tout le réseau** (Q21) | Détection des incidents (seuil 10 min), données du dossier |
| Open-Meteo (`api.open-meteo.com/v1/forecast` + archive) | Météo de Nantes sur la semaine choisie : température, vent, précipitations | Alertes météo, effets contextuels sur les jauges, décor météo (Q30) |

## Rejouer une semaine (Q22)
Combinaison de deux approches : données **live au lancement** (semaine glissante)
+ **archive Open-Meteo et incidents enregistrés** pour les semaines proposées.
L'**affluence** n'est affichée que si une source réelle la fournit (Q23) ;
sinon le dossier se limite à ligne + retard + raison + météo.
La répartition incidents de lignes / alertes météo suit **les données réelles de
l'API**, sans ratio fixe (Q36).

## Mapping API → incident
- Retard réel ≥ 10 min sur une ligne → dossier « ligne en difficulté ».
- Vent / précipitations / température hors seuils → dossier « alerte météo ».
- Données contradictoires (horaire prévu vs retard réel, ou deux sources API en
  désaccord) → **badge « contradiction »** sur le dossier (Q9) ; choisir la
  mauvaise source entraîne un **malus de réputation + la conséquence réelle** du
  dossier (Q31).

## Règles du livret
- Toujours prévoir un **fallback local** (`data/fallback.json`, voir `07-fallback-offline.md`).
- Le jeu doit rester **jouable sans réseau** pour l'évaluation finale.
- Ne jamais dépendre d'une clé API secrète dans le code.
