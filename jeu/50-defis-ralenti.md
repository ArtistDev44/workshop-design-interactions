# 50 — Défis de semaine et ralenti tactique (prompt 55)

Logique dans `game.js` (section « Prompt 55 », testée) ; interface dans `journee.js` (ralenti),
`histoire.js` (rapport). Les effets, les dés et les règles Q1–Q61 ne changent pas.

## Défis de semaine
- Trois défis tirés parmi cinq par **hachage de la graine** de la partie (même partie = mêmes défis ; le
  générateur de dés n'est pas consommé) :

| Défi | Valeur réelle mesurée | Tenu si | Bonus |
|---|---|---|---|
| Zéro dossier laissé au compteur | nombre de dossiers réglés par le compteur à 0 (ou laissés en partant) | 0 | réputation +5 |
| Budget ≥ 60 en fin de semaine | budget final | ≥ 60 | budget +5 |
| Fluidité ≥ 60 en fin de semaine | fluidité finale | ≥ 60 | fluidité +5 |
| Toutes les plaintes répondues | plaintes traitées / reçues (app Community) | toutes | réputation +5 |
| Aucune équipe sur un incident résolu | malus « équipe inutile » (prompt 23) | 0 | réputation +5 |

- Les deux derniers ne sont proposés que si l'élément est débloqué (mode histoire, prompt 41).
- Annoncés par le patron le premier matin, rappelés dans le mail de chaque soir ; le dernier soir, le
  mail donne le bilan de chaque défi avec la valeur réelle. Le bonus est appliqué **une seule fois**, à
  la fin de la dernière journée (pas après une démission). Le rapport papier liste les défis (✓ / ✗,
  valeur) et le nombre de ralentis utilisés.

## Ralenti tactique
- Pendant un dossier, **R** (ou le bouton « Ralenti (R) » à côté du compteur) met le compteur en pause
  **10 s**, **une fois par journée de jeu** ; un second appui : « Ralenti déjà utilisé aujourd'hui ».
  Disponible de nouveau le lendemain.
- Pendant le ralenti, le compteur ne descend pas et les sources (prompt 50) sont suspendues ; voile bleu
  discret et « RALENTI — 7 s » (animations réduites : le texte seul). Aucun effet sur les jauges.
- **R garde son rôle hors dossier** (recommencer la semaine, Q38) : les deux usages se distinguent par la
  phase. Échap reste disponible à tout moment.

## Vérifications
- `npm run build`, `npm test` (110 + 142 contrôles : défis reproductibles et sans consommer les dés,
  bonus appliqué une seule fois, défi raté sans bonus, ralenti accordé / actif / terminé / refusé /
  de nouveau accordé le lendemain).
- Chromium, sans erreur console : défis dans le message du patron du premier matin ; R pendant un dossier →
  compteur figé (1 105 ms → 1 107 ms en 3 s), source refusée pendant le ralenti, fin après 10 s, second R
  refusé ; mail du soir avec les défis ; mail du dernier soir avec le bilan réel ; rapport avec les défis.
