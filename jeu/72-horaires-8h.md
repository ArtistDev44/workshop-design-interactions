# 72 — Des horaires réalistes : la journée commence à 8 h 00 (prompt 76)

Code : `game.js` (**uniquement** la constante `DEBUT_JOURNEE = 8 * 60` et son commentaire — effets, règles et dés
inchangés), `rythme.js` (`clamperDebut`), `immersion.js`, `sauvegarde.js`, `soir.js`, `sketch.js` (commentaires),
`i18n.js`.

## Ce qui change
- La journée de jeu démarre à **8 h 00** (au lieu de 6 h 00) : `Jeu.debutJournee()`, l'horloge au début de chaque
  journée, le lendemain après la sortie du soir (prompt 69). La fin reste à **20 h 00** : la journée jouée va de
  8 h à 20 h. Le nombre de dossiers et le compteur de décision ne changent pas.
- Horloge du bureau, barre des tâches (`heureAffichee()`), en-tête de l'écran de jeu, écran « JOUR n », mail et
  rapport suivent l'horloge de la partie : aucune heure avant 8 h ne s'affiche.
- Textes FR + EN corrigés : SMS d'intro (« Ouverture à 8 h »), tutoriel étape 5, guide « Quitter le bureau »,
  « Retour demain, 8 h » ; `npm test` interdit toute mention de 6 h dans les traductions.
- **Dossiers avant 8 h** : l'heure d'arrivée dans la partie (`d.minute`) d'un dossier dont l'heure réelle ou le
  créneau calculé tombe avant le début de la journée est ramenée à 8 h (`Rythme.clamperDebut`, appelé au début
  de la partie, avant le mélange du prompt 74). C'est un calcul : `d.heure` (la donnée de la source) n'est pas
  modifiée et le contexte « heure de pointe » (Q24) la lit toujours.
- **Sauvegardes d'avant le changement** : à la reprise, horloge et dossiers antérieurs à 8 h sont ramenés à 8 h.
- Le mode « aujourd'hui » (direct) garde l'heure réelle de la journée, comme avant.

## Vérifications
- `npm test` : début 8 h et fin 20 h sur les 3 semaines, lendemain à 8 h, aucun dossier avant 8 h, heures réelles
  intactes, ancienne sauvegarde (6 h 30, dossier à 7 h) ramenée à 8 h, aucun texte « 6 h ».
- Chromium FR / EN : en-tête « 08:12 » peu après l'ouverture, premier signalement à 9 h 24, fin 20 h 00 ;
  semaine complète jusqu'au bilan sans erreur console.
