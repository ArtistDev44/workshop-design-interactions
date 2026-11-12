# Grammaire — Nantes en régulation

Chaîne : source (données réelles Nantes) → grammaire (seuil, alertes) → système (incident → décision → jauges) → œuvre (salle de contrôle p5.js).

## Règle structurante
Un retard réel d'au moins 10 minutes sur une ligne (mode « aujourd'hui »), une perturbation datée
des archives (travaux, manifestation, mouvement social, événement) ou une alerte météo extrême par
rapport à la semaine (95e percentile, Q39) devient un dossier à trancher. Tant qu'il n'est pas
traité, son retard s'aggrave ; à l'heure de fin de service, ce qui reste en file subit ses
conséquences naturelles (Q25).

## Invariants
- Seuil de retard : 10 minutes
- 4 réponses par catégorie de dossier (accident, météo, retard, travaux, affluence), dont toujours
  « attendre » — prompt 87, qui remplace les 3 actions + « ne rien faire » de Q5–Q7 ; la table
  d'effets Q57–Q60 reste le repli
- 3 jauges : fluidité, réputation, budget (depuis le prompt 22 ; le trio d'origine était fluidité,
  satisfaction, réputation ; voir `game.js`)
- Aucun événement inventé

## Variables
- Semaine rejouée
- Difficulté (prompt 87, remplace le compteur 60 / 30 / 15 s de Q16 et Q55) : signalements pris en
  même temps 3 / 2 / 1, vitesse d'aggravation du retard ×0,5 / ×1 / ×1,5, budget de départ
  60 / 50 / 40 ; le mode « Défi chrono » (Paramètres, touche 0) rétablit le compteur par décision
- Météo de la semaine
- Heure de pointe
- Tirage 1d6 ajouté aux effets de base (Q57)

## Fiche de grammaire (format du livret, 7 champs)

Complétée au prompt 100 (12/11/2026) d'après le code et les décisions verrouillées (`jeu/`) ; rien d'inventé.

| Champ | Contenu |
|---|---|
| Primitives | le **dossier** (un incident réel : ligne, retard en minutes ou perturbation datée, heure, source citée) ; la **réponse** (4 par catégorie, dont « attendre ») ; la **jauge** (fluidité, réputation, budget, 0–100) ; l'**horloge** de la journée de service. |
| Relations | un fait de la source → un dossier ; un dossier → une réponse → des effets sur les jauges, modulés par le contexte — météo, heure de pointe, affluence (amplitude × 1,25, Q24) ; un dossier non traité → son retard effectif s'aggrave, puis conséquence « naturelle » en fin de service (Q25) ; la somme des jauges (0–300) → avertissements du patron, puis licenciement (prompt 84). |
| Invariants | seuil de 10 min ; 4 réponses par catégorie dont « attendre » ; 3 jauges à 50 au départ (budget 60 / 50 / 40 selon la difficulté) ; effet d'une décision borné à ± 15 ; service de 8 h 00 à 20 h 00 ; aucun événement inventé. |
| Variables | la semaine rejouée (archives) ou le jour (temps réel) ; la difficulté (3 / 2 / 1 signalements simultanés, aggravation × 0,5 / × 1 / × 1,5) ; la météo de la semaine ; l'heure (pointe ou creuse) ; le dé 1d6 ajouté à l'amplitude des effets (Q57, Q61) ; les réponses du joueur. |
| Temps | journée de service 8 h – 20 h ; le temps file × 100 quand aucun dossier n'est ouvert ou pendant la sieste (prompt 77), il est en pause pendant la lecture d'un dossier (prompt 87) ; une semaine = les journées de la semaine archivée qui portent des dossiers (`Jeu.jours`) ; la somnolence (0–100) monte avec le temps de jeu, sieste forcée à 100 (prompt 78). |
| Déclencheur | donnée urbaine : retard GTFS-RT ≥ 10 min, perturbation datée du changelog GTFS, météo extrême (au-dessus du 95e centile horaire de la semaine et d'un plancher physique, `scripts/preparer-semaines.mjs`) ; puis le joueur (clic, glisser-déposer, touches 1–4, Q). |
| Limites | jauges bornées 0–100 ; effet borné à ± 15 ; tirages à **graine fixe** par semaine (même semaine = mêmes dés, Q35 ; reprise exacte de la partie, prompt 33) ; API coupée ou lente (délai borné) → semaine de référence locale (`data/fallback.json`, 6 dossiers réels) avec indicateur « hors ligne » ; reset : « Rejouer » ou nouvelle semaine. |

### Espace génératif (rubrique du livret « Seeds et archive »)
Ce qui varie d'une partie à l'autre : l'ordre d'arrivée des dossiers (graine), le dé 1d6 et les réponses du
joueur ; ce qui reste invariant : les faits de la source, les règles et les bornes ci-dessus. La graine dérive
du lundi de la semaine (`graineDe` dans `game.js`) : une même semaine se rejoue à l'identique, ce qui garantit
la cohérence des variantes et permet l'archive.

## Mapping en une phrase
« Le flux GTFS-RT Naolib fournit le retard réel des lignes et Open-Meteo la météo de
la semaine choisie : le seuil de 10 min et les alertes météo génèrent les
dossiers, et chaque réponse du joueur module les trois jauges selon le contexte. »
(phrase de `jeu/00-concept.md`, « action » devenue « réponse » au prompt 87 ; le groupe peut la reformuler)
