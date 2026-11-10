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
| 20 | `20-sortie-mode-pc.md` | Prompt 26 : sortir du PC — bouton « Quitter le PC » (clic, Tab), molette au poste avec anti-rebond, porte du bureau → menu |
| 21 | `21-loading-screen.md` | Prompt 27 : écran de chargement bleu + logo (anti-flash, fond sombre immédiat), musique de fond WebAudio dès le premier geste |
| 22 | `22-dialogues-nantais.md` | Prompt 28 : plaintes des Nantais dans `data/messages.json` (brut, modifiable), déclenchées par les dossiers réels, réponses avec effets dans l'app Community |
| 23 | `23-interactions-hors-ecran.md` | Prompt 29 : objets de la pièce en vue bureau (lampe persistée, store de la fenêtre avec vraie météo et heure, plante, tasse, dossiers), sans pause ni effet sur les jauges |
| 24 | `24-bandes-sonores.md` | Prompt 30 : ambiances WebAudio contextuelles (pluie réelle, ville/tram le jour, nuit calme) et signaux (incident, compteur à 0, mail, clics au poste) |
| 25 | `25-bureau-cadrage-chaise.md` | Prompt 31 : cadrage « sur la chaise » (recadrage centré, accoudoirs retirés), horloge murale à l'heure du jeu, applique murale à la place de la lampe d'architecte |
| 26 | `26-bureau-style-epure.md` | Prompt 32 : pièce blanche et épurée (plafond, menuiseries, plateau, porte), bois réduit à un chant, vignettage neutre, contour de survol double lisible sur blanc |
| 27 | `27-sauvegarde-progression.md` | Prompt 33 : sauvegarde automatique par semaine (`pxe-nte001-partie-<semaine>`), « Continuer la partie », reprise exacte (graine + tirages), export/import JSON validé dans les Paramètres |
