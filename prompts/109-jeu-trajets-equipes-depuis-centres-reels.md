# Prompt 109 — Jeu « Nantes en régulation » : les équipes se déplacent sur la carte depuis leur centre d'intervention réel

Demande d'origine (12/11/2026) :

> Nous les voyons sur la carte se déplacer vers le lieu du signalement avec un tracé de leur parcours ;
> lorsqu'ils ont fini d'intervenir, ils retournent à leur départ (lieu où réside le centre d'intervention).

Dernier des prompts 105 → 109.

## 1. Centres d'intervention réels

Positions tirées d'OpenStreetMap (© contributeurs OpenStreetMap, ODbL) via Nominatim, dans
`data/lieux.json`, par `site/scripts/geocoder-lieux.mjs` :

| Équipe | Centre |
|---|---|
| Police | Commissariat central de Nantes, place Waldeck-Rousseau |
| Pompiers | Centre de secours principal de Nantes-Gouzé |
| Ambulanciers | Hôpital Nord Laennec (CHU de Nantes) |
| Techniciens | Semitan (exploitant du réseau Naolib), Dalby |

Les centres sont dessinés sur la carte : petit carré pictogramme, nom au survol.

## 2. Trajet

- **Cycle existant** (`Jeu.phaseEquipe`) : en route → sur place → retour → disponible.
- **Sur la carte :**
  - **en route** : la pastille avance du centre vers le lieu du signalement, au prorata du temps de trajet ;
  - **sur place** : elle reste sur le marqueur ;
  - **retour** : elle revient au centre.
- **Tracé :** une ligne en pointillés du centre au lieu. La partie déjà parcourue est pleine.
  - Le tracé est **à vol d'oiseau**, et la légende le dit. Il ne prétend pas suivre les rues, car aucune
    donnée de voirie n'est chargée.
  - Il s'efface quand l'équipe est rentrée.
- **Signalement sans lieu** (« Lieu à préciser ») : l'équipe reste affichée au centre, avec « en
  intervention » et sans tracé.
- **Durée :** le temps de trajet reste celui du jeu (20 s à l'aller, 10 s au retour). La distance réelle
  ne change pas les règles.
- **Animations réduites :** la pastille saute d'étape en étape, sans glissement ; le tracé reste.

## Vérifications

- Envoi de chaque type d'équipe sur un signalement placé : départ du bon centre, arrivée sur le marqueur,
  retour.
- Le rapport final `jeu/105-109-carte-dialogue-equipes.md` couvre les cinq prompts.
- `npm run build`, `npm test`, audit des textes à 0 défaut.
- `journal.md`, `prompts/README.md`.
