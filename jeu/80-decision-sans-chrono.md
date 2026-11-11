# 80 — Décider sans chrono : écran simplifié et réponses par catégorie (prompt 87)

Code : `panneau.js` (nouveau : bandeau, panneau en 3 blocs, cartes de réponse, retour expliqué), `game.js`
(`REGLAGES.difficultes`, `Jeu.defiChrono`, `Jeu.categorie`, `Jeu.situation`, `Jeu.reponse`,
`Jeu.actionsPossibles`, `Jeu.effetsAttendus`, `Jeu.expirerFinJournee`), `data/reponses.json` (+ `reponses.js`
généré par `npm run messages`), `sketch.js`, `enquete.js` (`corpsEnquete`), `multitache.js`, `immersion.js`,
`carte.js`, `portrait.js`, `confort.js`, `i18n.js`. `alertes.js` (prompt 72) est retiré : ses réponses sont
remplacées par les réponses par catégorie.

## Exceptions aux décisions verrouillées
| Décision | Avant | Maintenant |
|---|---|---|
| Q6, Q16, Q55 | compteur par dossier, durée selon la semaine | pas de compteur par défaut ; mode « Défi chrono » optionnel |
| Q25 | compteur à 0 → « non traité » | « non traité » seulement à l'heure de fin de service |
| Q40 | budget de départ 50 | 60 / 50 / 40 selon la difficulté (50 en défi chrono) |
| Q5, Q57–Q60 | 3 actions + « ne rien faire », table unique | 4 réponses par catégorie ; la table reste le repli |

## Pression sans chrono
- L'horloge s'arrête pendant la lecture d'un signalement ouvert (`lecturePanneau()` dans `tempsSuspendu`).
  Mention « Horloge en pause pendant la lecture ».
- Le retard effectif (prompt 79) monte en file : « s'aggrave ↑ » dans la liste.
- Aucune expiration en cours de journée ; à l'heure de fin, ce qui reste du jour suit Q25.
- `REGLAGES.difficultes` : facile 3 actifs, ×0,5, budget 60 ; normale 2, ×1, 50 ; difficile 1, ×1,5, 40.

## Mode « Défi chrono »
Paramètres → touche `0`. Rétablit compteur, ralenti, alerte des 5 s, expiration en file, coût des sources
(−4 s), souffle et café sur le compteur, 3 actifs, budget 50. Indiqué sur l'écran de fin ; palmarès séparé
(clé `lundi|chrono`). Une ancienne sauvegarde sans le champ se reprend en défi chrono.

## Écran principal
- Bandeau fin : 3 jauges, objectif du jour, équipes disponibles, heure ; Aide (H) et Recommencer (R).
- Liste à gauche ; panneau du signalement à droite, en 3 blocs : **Ce qui se passe** (une phrase sur les
  données réelles), **Pourquoi c'est important** (au plus 3 puces), **Ce qu'on sait / ne sait pas**.
- « En savoir plus » (E) : sources, historique, équipes (ancien contenu de l'enquête).
- Conseil factuel (prompt 23) au-dessus des réponses, sans désigner de réponse.

## Catégories et réponses
| Catégorie | Condition | Réponses |
|---|---|---|
| accident | texte contenant accident, malaise, blessé, chute, collision | secours, couper, amont, attendre |
| meteo | alerte météo, ou pluie ≥ 10 mm / rafales ≥ 60 km/h | ralentir, inspection, prévenir, attendre |
| retard | ligne en difficulté | injecter, régulariser, informer, attendre |
| travaux | perturbation | déviation, navette, signaler, attendre |
| affluence | événement | fréquence, agents, prévenir, attendre |

Situation d'un dossier : calme, ou les facteurs présents (meteo, pointe, long > 20 min, forte) joints par
« + ». Pour la catégorie météo, « forte » = alerte vent / pluie / orage, ou pluie ≥ 5 mm, ou rafales ≥ 50 km/h :
les archives réelles n'atteignent jamais 10 mm ni 60 km/h, et sans ce seuil « ralentir » et « inspection »
n'auraient jamais été les meilleures réponses (rééquilibrage demandé par le prompt).

Chaque carte affiche le libellé, ce que fait la réponse, la tendance attendue sur les 3 jauges (▲▲ ▲ ≈ ▼ ▼▼,
même calcul que l'évaluation) et l'équipe liée. Après la décision, la narration explique l'effet et, si besoin,
la réponse qui convenait mieux, avec la raison.

## Données réelles
Les semaines archivées et le fallback ne contiennent ni retard mesuré (GTFS-RT, mode direct) ni accident : ces
deux catégories ne se rencontrent qu'en mode « aujourd'hui ». Les tests les couvrent par des variantes de
perturbations réelles (mêmes lignes, dates, heures).
