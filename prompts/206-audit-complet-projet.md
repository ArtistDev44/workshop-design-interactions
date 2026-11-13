# Prompt 206 — Audit ultra-complet du projet

Demande d'origine (13/11/2026) : « Avec différents sous-agents qui travaillent en simultané, fais un audit
ultra-complet sur l'ensemble du projet ».

- Huit auditeurs en parallèle, un axe chacun, en lecture seule sur un worktree propre de `main` :
  robustesse du code du jeu · données, API, hors ligne, PWA · accessibilité · sécurité et vie privée · performance ·
  site Astro, build, tests, outillage · brief, rendu, documentation, suivi des audits · textes, i18n, design system.
- Ne pas refaire `audit-2026-11-12.md`, `jeu/200`, `jeu/201`, `jeu/203` : en faire le suivi.
- Chaque constat : `fichier:ligne`, gravité (bloquant / majeur / mineur), effort, niveau de preuve (vu en jeu /
  mesuré / lu dans le code). Rien d'inventé : inconnu → `[À COMPLÉTER]`.
- Revérifier les constats bloquants et majeurs sur le dernier `main` avant de les écrire.
- Ne modifier aucune règle, aucun écran, aucun fichier du jeu.
- Livrable : `jeu/206-audit-complet-projet.md` (synthèse, 12 constats clés, suivi des audits, feuille de route) et
  `jeu/206-annexes/` (rapport détaillé de chaque axe).
