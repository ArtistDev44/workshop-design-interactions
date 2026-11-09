# 02 — Données et API

## Sources
| Source | Données | Usage |
|---|---|---|
| Flux GTFS-RT Naolib (trip-updates + alerts, via api.okina.fr, référencé par Open Data Nantes Métropole) | Prochains passages temps réel, retards des lignes tram/bus — **tout le réseau** (Q21) | Détection des incidents (seuil 10 min), données du dossier |
| Open-Meteo (`api.open-meteo.com/v1/forecast` + archive) | Météo de Nantes sur la semaine choisie : température, vent, précipitations | Alertes météo, effets contextuels sur les jauges, décor météo (Q30) |

## Rejouer une semaine (Q22)
**Source officielle : les archives publiques existantes, sans aucune collecte**
(voir `api.md` §9) — changelog daté du GTFS Naolib (incidents réels : travaux,
déviations, manifestations, mouvements sociaux), versions archivées du GTFS sur
transport.data.gouv.fr, archive Open-Meteo pour la météo de la semaine, agenda des
événements filtré par date. Chaque entrée d'archive = un dossier réel embarqué dans
`data/fallback.json`. Les flux live (SIRI lite / GTFS-RT) servent uniquement au mode
« aujourd'hui en direct ».
L'**affluence** n'est affichée que si une source réelle la fournit (Q23) ;
sinon le dossier se limite à ligne + retard + raison + météo.
La répartition incidents de lignes / alertes météo suit **les données réelles de
l'API**, sans ratio fixe (Q36).

## Mapping API → incident
- Retard réel ≥ 10 min sur une ligne → dossier « ligne en difficulté ».
- Vent / précipitations / température **extrêmes par rapport à la normale de la
  semaine** (seuils dérivés des données, percentile — Q39) → dossier « alerte météo ».
- Tracés géographiques des lignes : récupérés via l'**API Open Data Nantes au
  lancement**, avec **fallback local** si indisponible (Q42).
- Données contradictoires (horaire prévu vs retard réel, ou deux sources API en
  désaccord) → **badge « contradiction »** sur le dossier (Q9) ; choisir la
  mauvaise source entraîne un **malus de réputation + la conséquence réelle** du
  dossier (Q31).

## Règles du livret
- Toujours prévoir un **fallback local** (`data/fallback.json`, voir `07-fallback-offline.md`).
- Le jeu doit rester **jouable sans réseau** pour l'évaluation finale.
- Ne jamais dépendre d'une clé API secrète dans le code.
