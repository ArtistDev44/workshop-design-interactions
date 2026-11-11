# Prompt 77 — temps ×100, jusqu'à 3 signalements actifs en parallèle, notifications bureau

## Temps ×100

`IMMERSION.compression = 100` (valeur verrouillée, `immersion.js`) entre les dossiers ; l'indicateur
« ×100 » suit la valeur (`surv.accelere`). Le temps reste suspendu pendant démarrage, pause, tutoriel,
sieste volontaire. Le compteur de difficulté (30/60/15 s) ne change pas.

## Plusieurs tâches en même temps (`carte.js`)

- Jusqu'à **3 signalements actifs en parallèle** (`NB_ACTIFS = 3`) : les 3 premiers arrivés démarrent
  **leur propre compteur** (même durée que le compteur de la semaine) à leur activation (`actifs()`,
  `resteActif`) ; les suivants restent en file avec expiration 2 × le compteur.
- Navigation : **Tab / ↑ / ↓** parcourt les actifs (focus visible, aria-live), **Entrée / clic** prend le
  signalement sélectionné (`activerSignalement` : il passe en tête de paquet — les règles de décision de
  `game.js` restent identiques — et son compteur démarre). Les autres compteurs continuent de tourner
  et passent en rouge sous 10 s.
- Compteur d'un actif à 0 → règle « non traité » (Q25, malus prompt 23) appliquée **à ce signalement seul**
  (`activerEtExpirer`) ; les autres continuent. Conflit A/B et contradiction continuent de fonctionner sur
  le signalement sélectionné.

## Notifications bureau

`notifier()` / `majNotifications()` / `dessinerNotifications()` (`carte.js`, dessinées dans `draw()` en
coordonnées écran, donc aussi sur la vue bureau si le PC est fermé) : à l'arrivée d'un **signalement**, d'un
**mail du patron**, d'un **commentaire Community** ou d'une **équipe arrivée**, une notification en haut à
droite (titre + extrait réel + icône de l'appli). Clic → ouvre l'appli concernée ou l'écran de jeu ;
disparition après 6 s ou au clic ; max 3 visibles ; annoncées `aria-live` ; le compteur de non lus de la
barre des tâches est réutilisé. Rien d'inventé : titre = type réel, extrait = ligne/nature réelle.

Règles Q1–Q61 inchangées ; `game.js` inchangé (seule la présentation change).
