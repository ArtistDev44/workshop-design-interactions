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
| 11 | `11-direction-artistique.md` | Direction artistique verrouillée : palette, polices, low poly léger |
| 12 | `12-bureau-pixel.md` | Bureau en pixel art : vue d'entrée, PC avec le jeu en direct, zoom au poste |
| 13 | `13-immersion.md` | Immersion : SMS, journées, horloge ×10, sieste, alertes rouges, mail, livres |
| 14 | `14-immersion-visuelle.md` | PC centré, vignettage, clignement d'œil, mail enrichi et évalué |
| 15 | `15-bureau-moderne-design-system.md` | Bureau moderne en vue depuis la chaise, vue sur le Château des ducs, Pixel Design System sur le PC |
| 16 | `16-bureau-apps.md` | Prompt 22 : apps du PC (patron, carte et équipes, community, journal), jauges fluidité / réputation / budget |
| 17 | `17-profondeur-tactique.md` | Prompt 23 : conseils, modificateurs de journée, objectifs, malus, paliers de budget, profil de fin |
| 18 | `18-multi-langue.md` | Prompt 24 : jeu en français et en anglais, dictionnaire `i18n.js`, textes différés, sélecteur FR / EN, touche L, aria-live |
| 19 | `19-vue-3d-pc.md` | Prompt 25 : dézoom fixe de la vue bureau (fond visible autour de la pièce), caméra fausse 3D façon FNAF (souris hors cadre, flèches, 12 px max, parallaxe) |
