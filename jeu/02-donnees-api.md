# 02 — Données et API

## Sources
| Source | Données | Usage |
|---|---|---|
| API Tanway/Lila — Open Data Nantes Métropole | Prochains passages temps réel, retards des lignes tram/bus | Détection des incidents (seuil 10 min), données du dossier |
| Open-Meteo (`api.open-meteo.com/v1/forecast` + archive) | Météo de Nantes sur la semaine choisie : température, vent, précipitations | Alertes météo, effets contextuels sur les jauges |

## Mapping API → incident
- Retard réel ≥ 10 min sur une ligne → dossier « ligne en difficulté ».
- Vent / précipitations / température hors seuils → dossier « alerte météo ».
- Données contradictoires (horaire prévu vs retard réel, ou deux sources API en
  désaccord) → le dossier le signale, le joueur choisit quelle source croire.

## Règles du livret
- Toujours prévoir un **fallback local** (`data/fallback.json`, voir `07-fallback-offline.md`).
- Le jeu doit rester **jouable sans réseau** pour l'évaluation finale.
- Ne jamais dépendre d'une clé API secrète dans le code.
