# Prompt 58 — Méta-prompt : vérifier que tous les prompts précédents ont été faits jusqu'au bout, et les finir si nécessaire

Objectif : auditer **un par un** les prompts 01 à 57 de `prompts/README.md`, vérifier dans le code et
les docs ce qui est réellement implémenté, **terminer ceux qui ne le sont pas** (ou partiellement),
puis mettre à jour les statuts. Ne toucher ni aux décisions verrouillées du jeu (Q1–Q61) ni à la
boucle de jeu.

Ce prompt est un **méta-prompt** : il orchestre l'exécution des autres prompts. Règles absolues :
travailler en **français** ; aucun secret, clé ou token ; aucune donnée, œuvre ou source inventée
(inconnu → `"[À COMPLÉTER]"`) ; aucune dépendance ajoutée à `site/package.json` ; le site reste
relançable hors ligne (`npm run build` dans `site/`, double clic sur `site/public/index.html`) ;
ne pas fusionner dans `main` sans demande explicite.

## 1. Audit de statut réel, prompt par prompt
- Pour chaque ligne du tableau de `prompts/README.md` (01–57), vérifier le statut annoncé (✅ / ◻) à
  l'épreuve du dépôt : présence des fichiers et symboles attendus dans `site/public/` (grep des noms
  cités dans la colonne « Preuves dans le code » et dans chaque prompt), présence de la doc `jeu/NN-*.md`
  quand le prompt la prévoit, traductions FR + EN dans `i18n.js` quand prévues.
- Ne marquer ✅ que ce qui est réellement dans le code et les docs ; tout écart repassé en ◻ avec une
  note courte disant ce qui manque exactement (ex. : « prompt 52 ◻ : pas de `telephone-main` réutilisé
  pour la tasse, pas de battements Web Audio »).
- Consigner le résultat de l'audit dans `prompts/README.md` (colonne Statut corrigée + note de ce qui
  manquait) et, si besoin, une section « Audit du 10/11/2026 » en dessous du tableau.

## 2. Achèvement des prompts manquants ou partiels, dans l'ordre
- Pour chaque prompt repassé ◻ (ou partiellement fait) : l'exécuter **entièrement**, dans l'ordre
  croissant des numéros, en suivant sa section « Attendu » point par point — y compris les demandes
  complémentaires — puis sa section « Vérifications » (`npm run build`, `npm test` dans `site/`,
  essai réel souris + clavier, animations réduites, FR + EN, aucune erreur console).
- Un prompt à la fois ; si un prompt est trop gros pour une conversation, le découper en sous-étapes
  explicites plutôt que de le faire à moitié.
- Après chaque prompt terminé : statut ✅ dans `prompts/README.md`, doc `jeu/NN-*.md` rédigée (le
  numéro de la doc suit le prochain libre dans `jeu/`, en notant le renommage comme déjà fait pour
  d'autres), entrée en tête de `journal.md` (date, commit, fichiers, résumé) selon
  `contexte/instructions-personnelles.md`.
- Priorité si le temps manque : finir d'abord les prompts du jeu encore ◻ (49–57 : lofi, enquête par
  les sources, horloge/sablier/lumière, café boost, animations de feedback, défis/ralenti, rapport de
  semaine, micro, webcam), puis les éventuels écarts des prompts 01–48.

## 3. Cohérence de fin de chaîne
- `jeu/README.md` liste toutes les docs `jeu/` : vérifier qu'elle est à jour après chaque ajout.
- `todo.md` : cocher uniquement ce qui existe réellement.
- `prompts/README.md` : le compte annoncé dans `README.md` / `notes.md` doit correspondre au tableau.

## Vérifications
- `cd site && npm run build` et `npm test` passent sans erreur à la fin de chaque prompt terminé.
- `prompts/README.md` : plus aucun ◻ sans note expliquant ce qui manque ; chaque ✅ prouvé par un
  symbole/fichier réellement présent (`grep` cité dans la note).
- `git diff` relu avant chaque commit : aucun secret, aucune donnée inventée.
- `journal.md` : une entrée par prompt achevé. Branche dédiée (ex. `vibe/prompt-58-audit-achevement`) ;
  ne pas fusionner dans `main` sans demande.
