# Prompt 106 — Jeu « Nantes en régulation » : carte entièrement interactive, signalements affichés là où ils ont été faits

Demande d'origine (12/11/2026) :

> Je souhaite que la carte soit entièrement interactive, que les signalements faits par les Nantais
> s'affichent au bon endroit, où ils ont fait leur signalement.

Deuxième des prompts 105 → 109.

## 1. Carte interactive

- **Déplacer :**
  - glisser la carte à la souris ou au doigt (hors marqueur et hors jeton) ;
  - au clavier, Maj + flèches.
- **Zoomer :**
  - molette, centrée sur le curseur ;
  - boutons « + » et « − » en bas à droite de la carte ;
  - touches + et −.
  - De 1× (métropole entière) à 8×.
- **Recentrer :** un bouton (et la touche 0) revient à la vue d'ensemble, ou au signalement ouvert.
- À l'ouverture d'un signalement, la carte glisse **une fois** vers lui (300 ms, instantané si animations
  réduites) ; ensuite elle reste là où le joueur la met.
- Au survol d'un marqueur : son infobulle (heure, type, lieu).
- Au survol d'une ligne : son numéro et son nom réel (GTFS).

## 2. Les signalements à leur lieu — jamais un lieu inventé

| Signalement | Lieu affiché | Source réelle |
|---|---|---|
| Retard ou perturbation d'une ligne | **sur le tracé de la ligne concernée** (point du tracé réel, choisi de façon déterministe pour le dossier : « sur la ligne 2 ») | tracés GTFS Naolib, `data/lignes.json` |
| Événement de l'agenda | **le lieu de l'événement** | nom du lieu dans `texte_source`, géocodé dans `data/lieux.json` |
| Alerte météo | toute la métropole (marqueur au centre, voile léger) | Open-Meteo, Nantes |
| Lieu introuvable dans les sources | case « Lieu à préciser » | — |

- **Géocodage** : `site/scripts/geocoder-lieux.mjs`, lancé à la main, jamais au build. Il interroge
  OpenStreetMap (© contributeurs OpenStreetMap, ODbL) via Nominatim, une requête par seconde.
  - Un lieu non trouvé n'est pas placé.
  - Aujourd'hui, 13 lieux sur 28 sont trouvés.
- Le plaignant parle depuis ce lieu : son avatar apparaît sur le marqueur à l'ouverture du dialogue
  (prompt 107).
- **La ligne est connue dès le signalement :** c'est le plaignant qui dit où il est. La source « Lignes » de
  l'enquête (prompt 50) donne toujours le nom complet et l'historique de la ligne.

## Vérifications

- Chaque marqueur placé l'est sur une ligne réellement citée par le dossier, ou sur un lieu géocodé.
  Le rapport `jeu/105-109-…md` donne la liste.
- La carte se manipule à la souris, à la molette, au clavier et au doigt.
- La carte ne se recentre pas d'elle-même après le premier glissement.
- `npm run build`, `npm test`, audit des textes à 0 défaut.
