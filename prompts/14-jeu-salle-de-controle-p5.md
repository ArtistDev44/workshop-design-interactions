# Prompt 14 — Jeu « Nantes en régulation » : chapeau (œuvre p5.js, étape 1/6)

Ce prompt est le **point d'entrée** du jeu « Nantes en régulation » : il pose le
cadre. Les 5 prompts suivants (15 à 19) découpent la réalisation en étapes
vérifiables, à exécuter **dans l'ordre**, un par un.

## Objectif
Créer le jeu décrit dans `jeu/` : une salle de contrôle des transports nantais,
façon *Paper Please*, où le joueur rejoue une semaine réelle du réseau et tranche
des décisions de régulation à partir de données réelles (flux temps réel **Naolib
GTFS-RT** + Open-Meteo), avec fallback local obligatoire (`data/fallback.json`).

## Emplacement
Le jeu est une œuvre p5.js autonome, servie par le site :
`site/public/oeuvres/pxe-nte001-g01-w01/` (remplacer `g01` par le vrai numéro de
groupe). Il s'ouvre à
`…/patrimoine-exe/nantes/001/oeuvres/pxe-nte001-g01-w01/index.html` et sa fiche du
registre (prompt 06) pointe dessus via `lien_oeuvre`. Tous ses chemins sont
**relatifs** (`./sketch.js`, `./data/fallback.json`) : il fonctionne aussi ouvert seul.
**p5.js est copié en local** (`lib/p5.min.js`, version 1.11.11) : aucun CDN, sinon le
jeu ne démarre pas sans réseau.

## Données réelles : ce qui est possible (vérifié le 9 nov. 2026)
- **Retards** : flux GTFS-RT `trip-updates` de Naolib,
  `https://api.okina.fr/gateway/semgtfsrt/realtime/trip-updates/NAOLIBORG`
  (référencé par le jeu `244400404_reseau-transports-collectifs-naolib`). Sans clé,
  CORS autorisé, mais **format binaire protobuf (≈ 1 Mo par appel)** et **aucun
  historique** : on ne lit que l'instant présent.
- **Alertes / perturbations** : flux GTFS-RT `alerts` (même passerelle, `…/alerts/NAOLIBORG`).
- **Tracés des lignes** : jeu GTFS statique `244400404_transports_commun_naolib_nantes_metropole_gtfs`.
- **Météo** : Open-Meteo `forecast` (semaine glissante) et `archive-api.open-meteo.com`
  (semaines passées) — JSON, sans clé.

Conséquence pour « rejouer une semaine réelle » (Q14, Q22) : il faut **enregistrer
soi-même** les semaines. Créer `site/scripts/enregistrer-semaine.mjs` (Node, lancé à la
main pendant la semaine, jamais au build) qui interroge `trip-updates` et `alerts` à
intervalle régulier (ex. toutes les 10 min), décode le protobuf **dans le script**,
ne garde que les incidents (retard ≥ 10 min, alertes) et les écrit en JSON lisible
dans `data/semaines/{date-debut}.json`. Le décodage peut utiliser une dépendance de
développement du script (ex. `gtfs-realtime-bindings` installée en `devDependencies`) :
**le jeu lui-même ne lit que du JSON**, jamais le protobuf. Si le groupe ne peut pas
enregistrer 3 semaines avant le J3, les semaines proposées sont celles réellement
enregistrées (au minimum celle du `fallback.json`) — aucun incident inventé.

## Décisions verrouillées
Toutes les décisions Q1–Q61 sont dans `jeu/` (index : `jeu/README.md`) — les prompts
15–19 en sont le résumé exécutable, étape par étape.

## Plan des étapes suivantes

| Prompt | Fichier | Étape |
|---|---|---|
| 15 | `15-jeu-fondation-donnees.md` | Structure du livret, p5.js local, semaines enregistrées, `lignes.json`, `fallback.json` |
| 16 | `16-jeu-ecrans-salle-de-controle.md` | Écran d'accueil + écran de jeu 1920×1080 (carte, panneaux, météo dans le décor) |
| 17 | `17-jeu-boucle-effets-jauges.md` | Boucle de jeu, 3 actions + « ne rien faire », table des effets base + 1d6, jauges |
| 18 | `18-jeu-controles-confort.md` | Raccourcis clavier, son, pause, reset, aide, meilleur bilan en `localStorage` |
| 19 | `19-jeu-fins-robustesse.md` | 3 fins + bilan détaillé, accessibilité, vérifications finales |

## Vérifications (à valider à la fin du prompt 19)
- Le jeu se lance et reste jouable sans réseau (fallback testé).
- Testé en plein écran 1920×1080, aucune erreur continue dans la console.
- Aucune clé privée, token ou secret dans le code.
- Le mapping API → incident → action → jauges tient en une phrase (voir `jeu/02-donnees-api.md`).
