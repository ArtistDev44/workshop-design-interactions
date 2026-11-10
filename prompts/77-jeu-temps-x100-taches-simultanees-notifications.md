# Prompt 77 — Jeu « Nantes en régulation », étape 59 : temps qui file ×100, plusieurs tâches en même temps, notifications sur le bureau

Demande d'origine (11/11/2026) :

> Pour le jeu, il faudrait que le temps s'écoule beaucoup plus rapidement (pas ×30 mais ×100) avec
> différentes tâches en mêmes temps, des notifications sur le bureau.

Aujourd'hui, entre deux dossiers, le temps est compressé **×30** (`immersion.js` :
`IMMERSION.compression = 30`, indicateur « ×30 » via `t('surv.accelere', { x: IMMERSION.compression })`),
un seul dossier est traité à la fois, et les arrivées ne préviennent que par un son et un repère.

## Attendu

1. **Temps compressé ×100** entre les dossiers : `IMMERSION.compression = 100` (valeur verrouillée,
   documentée), l'indicateur affiche « ×100 » (le texte existant suit la valeur). Le sablier, s'il est
   encore présent, garde sa mécanique (prompt 51) avec son propre facteur, mis à jour en conséquence
   (prompt 78 le remplace de toute façon). Le temps de jeu reste suspendu pendant démarrage, pause,
   tutoriel, sieste volontaire (comportement existant conservé).
2. **Plusieurs tâches en même temps** : jusqu'à **3 signalements actifs en parallèle** (les suivants
   restent en file d'attente avec expiration, prompt 68). Chaque signalement actif a **son propre
   compteur** (même durée que le compteur de la semaine), ses propres décisions et sa narration.
   - Navigation : Tab / clic sur la file pour passer d'un signalement actif à l'autre ; le signalement
     sélectionné est mis en évidence ; les autres compteurs continuent de tourner et passent en rouge
     sous 10 s.
   - À 0 sur un compteur : règle « non traité » (Q25, malus prompt 23) appliquée à ce signalement seul ;
     les autres continuent.
   - Conflit A/B (Q27) et contradiction de sources continuent de fonctionner sur le signalement
     sélectionné.
3. **Notifications sur le bureau** : à l'arrivée d'un signalement, d'un mail du patron, d'un commentaire
   Community ou d'une fin d'intervention d'équipe, une **notification style bureau** apparaît en haut à
   droite de l'écran du PC (et sur la vue bureau si le PC est fermé) : titre + extrait + icône de
   l'appli concernée, clic → ouvre l'appli ou sélectionne le signalement. Les notifications
   disparaissent au bout de quelques secondes (ou au clic), s'empilent (max 3 visibles), sont annoncées
   `aria-live`, et un compteur de non lues existe déjà dans la barre des tâches (réutilisé).

## Contraintes

- Règles Q1–Q61 inchangées : mêmes effets, mêmes malus, mêmes évaluations par action ; seule la
  **présentation** change (plusieurs dossiers visibles à la fois) — `game.js` peut exposer les dossiers
  actifs, mais les règles de décision restent identiques. Le compteur de difficulté (30/60/15 s) ne
  change pas.
- Données réelles uniquement ; rien d'inventé dans les notifications (titre = type réel, extrait =
  ligne/nature réelle).
- Accessibilité : clavier seul (Tab, Entrée, 1/2/3/0, A/B, Maj+1/2/3/4 conservés), contraste ≥ 4,5:1,
  `prefers-reduced-motion` (notifications sans animation), cibles ≥ 44 px en mobile portrait
  (signalements actifs empilés, notifications en overlay).
- `scripts/test-jeu.mjs` vert.

## Vérifications

- `npm run build`, `npm test` dans `site/` ; tests : 3 signalements actifs simultanés avec compteurs
  indépendants, expiration individuelle, décision sur chacun sans perdre les autres.
- Partie réelle FR + EN, clavier puis souris, 1920×1080 et mobile, hors ligne : ×100 affiché et effectif
  entre les dossiers ; deux puis trois signalements en parallèle gérables ; notifications à chaque
  arrivée (signalement, mail, commentaire, équipe de retour) avec clic fonctionnel ; aucune erreur
  console ; aucune régression des prompts 14–76 ni de Q1–Q61.
- Doc : `jeu/73-…` (nouvelle doc), `jeu/README.md`, `prompts/README.md`, `journal.md` à jour.
- Branche `jeu/prompt-77-temps-x100-multitache-notifications`. À chaque push : entrée en tête de
  `journal.md`. Fusion `main` sur demande.
