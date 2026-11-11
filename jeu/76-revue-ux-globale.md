# Prompt 80 — revue UX globale du jeu

Parcours complet revu (3 parties rejouées FR + EN via `test-jeu.mjs` + lecture écran par écran) : menu →
bureau → PC → file de signalements → panneau incident → décision → narration → applis → notifications →
sieste → fin de journée → fins et rapport.

## Frictions corrigées (par ordre bloquant → confus → mineur)

- **Confus** : libellés « carte / map » résiduels après le renommage en « Signalements » (prompt 73) et la
  suppression de la carte — bandeau d'état (`etat.decision`), tutoriel (`tuto.2.texte` FR+EN),
  `enq.source.carte` (EN), `enq.carte.lignes` (« surlignée dans la file », plus de carte).
- **Mineur** : infobulles au survol des icônes de la barre des tâches (toutes les applis, FR + EN).

## Vérifié conforme (checklist)

Navigation (Échap/croix/« Fermer » partout), états vides explicites, états actifs visibles, libellés FR+EN,
feedback immédiat (clic, delta de jauge, notification), onboarding (tutoriel + guide + explication de
première ouverture, prompt 74), cohérence bureau ↔ PC, mobile (cibles ≥ 44 px), accessibilité
(con contraste ≥ 4,5:1, clavier seul, `aria-live`, animations réduites).

Rapport détaillé : `notes.md`, section « Revue UX globale du 11/11/2026 ». `game.js` et Q1–Q61 inchangés.
