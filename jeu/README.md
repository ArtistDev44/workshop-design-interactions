# jeu/ — Salle de contrôle Nantes (œuvre p5.js)

Ce dossier décrit, fichier par fichier, les fonctionnalités du jeu « Salle de
contrôle Nantes » : un jeu façon *Paper Please* où le joueur rejoue une semaine
réelle du réseau de transports nantais et tranche des décisions de régulation
à partir de données réelles (API Nantes Métropole + Open-Meteo), avec fallback
local obligatoire.

Phrase-problématique : *« Rejouer une semaine réelle du réseau de transports
nantais et prendre, en salle de contrôle, les décisions de régulation qui
préservent la fluidité du réseau — chaque incident réel de l'API devenant un
dossier à trancher sous pression. »*

## Sommaire

| N° | Fichier | Contenu |
|---|---|---|
| 00 | `00-concept.md` | Spec verrouillée, phrase-problématique, chaîne source → grammaire → système → œuvre |
| 01 | `01-boucle-gameplay.md` | Boucle de décision, détection des incidents, compteur de temps |
| 02 | `02-donnees-api.md` | Sources de données, mapping API → incident, seuils |
| 03 | `03-actions-decisions.md` | Les 3 actions + « ne rien faire », effets contextuels |
| 04 | `04-jauges-et-fins.md` | Jauges (fluidité, satisfaction, réputation) et fins multiples |
| 05 | `05-ui-ecrans.md` | Écrans de la salle de contrôle, mise en page 1920×1080 |
| 06 | `06-narration.md` | Textes entre les décisions, progression de la semaine |
| 07 | `07-fallback-offline.md` | `data/fallback.json` : 6 cas figés, mode hors ligne |
| 08 | `08-raccourcis.md` | Raccourcis clavier / touch du jeu |
| 09 | `09-parametres.md` | Paramètres réglables (difficulté, durée, accessibilité) |
| 10 | `10-accessibilite-robustesse.md` | Checklist accessibilité et robustesse du jeu |
