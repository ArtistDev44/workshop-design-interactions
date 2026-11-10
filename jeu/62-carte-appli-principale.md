# 62 — La Carte devient l'application principale, équipes limitées (prompt 68)

Code : `carte.js` (nouveau), `game.js` (bloc équipes), `os.js`, `sketch.js`, `immersion.js`, `enquete.js`,
`guide.js`, `histoire.js`, `i18n.js`. Exception documentée aux règles verrouillées : le bloc **équipes** de
`game.js` change (effectifs, cycle, pertinence) ; les effets des décisions et le tirage des dés sont inchangés.

## Une seule application de jeu : la Carte
- L'appli « Régulation » disparaît de RégulOS. Première icône : **Carte**, qui ouvre l'écran de jeu
  (fenêtre au-dessus de la barre des tâches, titre « CARTE · RÉGULATION NANTES »).
- Ordre des icônes : Carte, Patron, Community, Journal, Indicateurs, Corbeille, Données.

## Phase « sélection »
- Quand un incident arrive (ou au réveil), le jeu entre en phase **sélection** : l'incident apparaît sur la
  carte (repère qui pulse), le panneau de droite affiche type, gravité, file d'attente. **Pas de chrono** tant
  que l'incident n'est pas pris (Entrée / Espace / bouton « Prendre l'incident »).
- Un incident laissé en file trop longtemps (2 × le chrono de la semaine, × facteur de lecture) **expire** :
  il est compté comme « temps écoulé », comme avant.
- Le lieu n'est placé sur la carte qu'une fois connu (sinon « Réseau », au centre).
- **Gravité** (faible / moyenne / élevée) calculée sur le dossier (`Jeu.gravite`), affichée dans la sélection et
  la file — pas dans l'en-tête du dossier, où se trouve le bouton Ralenti.

## Onglets du dossier
- **Enquête** (sources 5 à 8, comme avant), **Historique** (passages du jour sur la même ligne),
  **Équipes** (envoi, disponibilité, coût).

## Équipes limitées
| Équipe | Effectif | Durée sur place |
|---|---|---|
| Police | 2 | 40 s |
| Ambulance | 1 | 50 s |
| Techniciens | 2 | 60 s |
| Pompiers | 1 | 60 s |

- Cycle : en route → sur place → retour (10 s) → libre. Une équipe par type et par incident.
- **Pertinence** par type d'incident (table + mots « accident, malaise, blessé, chute » → ambulance et police).
  Une équipe hors sujet n'apporte que la **moitié** de l'effet.
- Plus d'équipe libre : bip, message du patron « plus d'équipe… retour dans N s », refus compté.
- Le patron annonce les **effectifs du jour** chaque matin. Raccourcis : Maj + 1 à 4.
- Bandeau des disponibilités **en bas de la carte** (le zoom occupe le coin haut droit) ; pictogrammes
  d'équipes qui se déplacent ; traces des décisions qui s'estompent (4 s).
- Journal (volet « Suites ») : pertinence et durée ; rapport de fin de semaine : ligne « Équipes ».
- Sauvegarde : fin d'intervention, retour, refus.

## Légende des lignes
- Repliable (▸ / ▾) ; un clic sur une ligne la met en surbrillance sur la carte.

## Vérifications
- `npm run build`, `npm test` (tests prompt 68 : gravité, pertinence, envoi / doublon / refus, retour, demi-effet,
  sauvegarde, remise à zéro du matin).
- Chromium FR et EN : icônes, annonce des effectifs, sélection sans chrono, ambulance hors sujet puis refusée,
  file de 3, semaine complète jusqu'au mail de fin ; aucune clé manquante, aucune erreur console.
