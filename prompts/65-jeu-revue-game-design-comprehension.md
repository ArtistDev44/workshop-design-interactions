# Prompt 65 — Jeu « Nantes en régulation », étape 48 : revue complète du game design pour la compréhensibilité joueur

Demande d'origine (10/11/2026) :

> Faire une revue très complète du game design du jeu sur différents aspects et l'améliorer pour le
> rendre plus compréhensible pour les joueurs.

Contrainte forte : les décisions verrouillées **Q1–Q61** et la boucle de jeu ne changent pas, et les
choix de design actés non plus (ex. prompt 50 : **pas de conseil ni de flèche d'effet** sous les boutons
d'action — on apprend en jouant, via tutoriel, guide, narration, journal, mail du soir et rapport).
Les améliorations passent par ces canaux-là. `game.js` (règles, effets, dés) n'est pas modifié.

## 1. Revue complète — axes d'analyse (jouer des parties réelles, noter chaque friction avec capture)
1. **Onboarding / première partie** : intro SMS (téléphone en main), tutoriel (livre « Commande »),
   guide « Prendre en main », choix de la semaine, premier dossier — un joueur nouveau comprend-il
   qui il est, où il est, quoi faire ?
2. **Compréhension de la boucle** : incident → enquête par les sources (touches 5–8, applis) → décision
   (3 actions + « ne rien faire ») → effets sur les jauges → narration. Chaque étape est-elle lisible ?
   Le compteur de temps est-il compris (30 s, ce qui se passe à 0) ?
3. **Lisibilité de l'UI** : panneau dossier, jauges (seuils 40/20 visibles), compteur, boutons
   d'action (noms, effets appris), carte, barre des tâches, applis. Textes ≥ 20 px, contraste, pas de
   surcharge.
4. **Feedback** : arrivée de dossier (prompt 53), deltas des jauges, narration, sons (lofi + alertes),
   mail du soir, rapport de semaine — le joueur comprend-il **pourquoi** ses jauges bougent ?
5. **Courbe de difficulté** : mode histoire (60/30/15 s, semaines facile → difficile), mode temps réel,
   défis (prompt 55), ralenti (touche R) — la progression est-elle lisible et motivante ?
6. **Affordances et contrôles** : objets cliquables de la pièce (téléphone, tasse, sablier, horloge,
   fenêtre, livres), raccourcis clavier (5–8, I, R, M, L, T, Échap…), aide — le joueur découvre-t-il
   seul ? L'aide est-elle à jour ?
7. **Gestion du temps et de la journée** : horloge simulée, compression du temps, sablier, café
   (boost), départ à 20 h, mail du patron — le rythme de la journée est-il compréhensible ?
8. **Fins et bilan** : 3 fins, écran de bilan (score, jauges, décisions clés), rapport — le joueur
   comprend-il son résultat et ce qu'il peut améliorer ?
9. **Accessibilité et confort** : animations réduites, daltonisme, taille du texte, clavier seul,
   micro/webcam optionnels et compréhensibles (prompts 54/57).
10. **Mobile** (prompt 60) : cibles, swipe, lisibilité en portrait.

## 2. Méthode
- Jouer **au moins 3 parties complètes** (une par niveau de difficulté) en navigateur, en notant à
  chaque écran : « qu'est-ce qu'un joueur nouveau ne comprendrait pas ici ? » — capture + note datée.
- Classer les frictions : **bloquant / confus / mineur**, avec l'axe concerné.
- Proposer pour chaque friction une amélioration concrète respectant les contraintes (ex. : rendre le
  tutoriel plus guidé, enrichir la narration des effets, ajouter une étape au guide, clarifier un
  libellé, améliorer l'aide, rendre le compteur plus explicite… — mais sans remettre de conseils
  sous les boutons d'action).

## 3. Implémentation
- Implémenter les améliorations **prioritaires** (bloquant, puis confus), une par commit, en FR + EN :
  textes, tutoriel, guide, aide, narration, libellés, onboarding — sans toucher aux règles.
- `npm run build && npm test` verts après chaque commit ; aucune erreur console ; accessibilité
  conservée (contraste, clavier, aria-live, animations réduites, pas de flash).
- Rapport de revue dans `notes.md` (section « Revue game design du … ») : axes couverts, frictions
  trouvées (avec captures si besoin dans `site/public/captures/`), améliorations faites (commits),
  reste ouvert. Documenter les changements joueur dans `jeu/53-…`. `journal.md` à jour.

## Vérifications
- 3 parties complètes rejouées après améliorations, FR + EN, clavier seul, animations réduites :
  aucune régression, aucune erreur console ; `test-jeu.mjs` vert (règles inchangées prouvées).
- `git diff` de `game.js` : vide (ou prouvé sans effet sur les règles par les tests).
- Branche dédiée ; fusion `main` sur demande.
