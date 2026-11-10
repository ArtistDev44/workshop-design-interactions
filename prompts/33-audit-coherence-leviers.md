# Prompt 33 — Audit de cohérence du dépôt et leviers d'amélioration

Objectif : appliquer les leviers d'amélioration issus de la **critique du projet** (audit du
10 novembre 2026) pour rendre le dépôt cohérent, complet et vérifiable avant le rendu J3 —
sans toucher aux décisions verrouillées du jeu (Q1–Q61) ni à la boucle de jeu.

Ce prompt est un **méta-prompt** (hors jeu) : il porte sur la documentation, la cohérence
des références et la finalisation des livrables, pas sur `site/public/*.js`.

Fichiers concernés : `README.md`, `notes.md`, `site/README.md`, `site/public/source-sheet.md`,
`site/public/grammar.md`, `prompts/README.md`, `todo.md`, `journal.md`, `site/package.json`,
`site/src/`, racine du dépôt. Le code du jeu (`site/public/sketch.js`, `game.js`, etc.) n'est
modifié que si une incohérence documentaire l'exige.

Règles absolues : travailler en **français** ; aucun secret, clé ou token dans le code ;
aucune donnée, œuvre ou source inventée (inconnu → `"[À COMPLÉTER]"`) ; aucune dépendance
ajoutée à `site/package.json` ; le site doit rester relançable hors ligne (`npm run build`
dans `site/`, double clic sur `site/public/index.html`).

## 1. Cohérence documentaire — une seule URL canonique
- Le dépôt contient deux adresses contradictoires : GitHub Pages
  (`https://artistdev44.github.io/workshop-design-interactions/patrimoine-exe/nantes/001/`,
  citée dans `README.md`, `notes.md`, `prompts/02` et `prompts/13`) et Cloudflare Pages à la
  racine (`https://workshop-design-interactions.pages.dev/`, citée dans `site/astro.config.mjs`,
  `site/README.md` et `.github/workflows/deploy.yml`).
- **Décider d'une seule URL canonique** (celle réellement servie par le workflow de déploiement)
  et l'écrire partout : `README.md`, `notes.md` (page wiki), `site/README.md`, `CLAUDE.md`,
  `prompts/02`, `prompts/13`. Les autres occurrences deviennent des redirects ou des mentions
  historiques clairement identifiées.
- Corriger le nombre de prompts annoncé : `README.md` dit « 14 prompts », `notes.md` « 12 prompts »
  — le compte réel est celui de la table de `prompts/README.md` (32 prompts, 33 après celui-ci).

## 2. Supprimer les `[À COMPLÉTER]` restants (sans rien inventer)
- `site/README.md` : section **Auteurs** (noms et rôles du groupe), **Contributions**
  (nominatif, précis) et **AI usage** (3 à 5 lignes) — à remplir par le groupe ; si une
  information manque, garder `"[À COMPLÉTER]"` et le noter dans `todo.md`.
- `site/public/source-sheet.md` : champs d'analyse de la fiche-source V1 (contexte, licence
  Open-Meteo à vérifier, 3 propriétés observables, 1 propriété écartée).
- `site/public/grammar.md` : règle structurante formulée en une phrase, en s'appuyant sur
  `jeu/00-concept.md`.
- Rechercher tous les `[À COMPLÉTER]` restants (`grep -rn "À COMPLÉTER"`) et ne garder que
  ceux qui attendent réellement une saisie humaine du groupe.

## 3. Statut réel des prompts 24–32
- Les prompts 24 à 32 (i18n, vue 3D, dialogues `messages.json`, bandes sonores, cadrage
  « sur la chaise », style épuré) sont documentés mais partiellement ou non implémentés dans
  `site/public/`.
- Ajouter dans `prompts/README.md` une colonne ou une note de **statut** (✅ implémenté /
  ◻ prévu) pour chaque prompt 14–32, vérifiée fichier par fichier dans `site/public/`
  (ex. : pas d'`i18n.js` → prompt 24 ◻). Ne marquer ✅ que ce qui est réellement dans le code.

## 4. Finalisation des livrables J3 (todo.md)
- Cocher dans `todo.md` les lignes effectivement réalisées et lister explicitement ce qui
  reste : `manifest.json` (modèle du livret), cartel 80–120 mots, captures
  (`hero.jpg`, `detail-01.jpg`, `process.jpg`, `demo.mp4` 20–30 s, `thumb.jpg`), QR code
  scanné en conditions réelles, checklist de robustesse, « version finale sauvegardée dans un
  dossier distinct ».
- Ne cocher que ce qui existe réellement dans le dépôt.

## 5. Smoke test sans dépendance
- Ajouter un script `"test"` dans `site/package.json` qui exécute un script Node natif
  (ex. `node scripts/smoke.mjs`, aucune dépendance) vérifiant que :
  - chaque `src` de `<script>` de `public/index.html` existe dans `public/` ;
  - les JSON de `public/data/` (`fallback.js`, `semaines.js`, `lignes.js`, `semaines/*.json`,
    `fallback/*.json`) se chargent/parsent sans erreur ;
  - aucun motif de secret (`api[_-]?key`, `bearer`, `password`) n'apparaît dans `public/*.js`
    et `public/data/*.js` (hors `lib/p5.min.js`).
- `npm run build` doit continuer à passer.

## 6. Sort de la coquille Astro restante
- `site/src/` ne contient plus de pages (build « 0 page(s) built ») : soit générer au moins
  une page utile depuis la collection `src/content/oeuvres/` (ex. cartel de l'œuvre servie
  hors du jeu), soit supprimer la collection et `content.config.ts` devenus inutiles.
  Documenter le choix dans `site/README.md`.

## 7. Licence du dépôt
- Ajouter un fichier `LICENSE` à la racine du dépôt (licence du code du projet), distincte
  des licences des données (Licence Ouverte Nantes Métropole, CC BY 4.0 Open-Meteo), déjà
  citées dans `site/README.md`.

## Vérifications
- `cd site && npm run build` et `npm test` passent sans erreur.
- `grep -rn "workshop-design-interactions.pages.dev\|artistdev44.github.io"` : une seule URL
  canonique restante hors mentions historiques identifiées.
- `grep -rn "À COMPLÉTER" README.md notes.md site/README.md site/public/*.md` : aucun marqueur
  oublié hors attente réelle du groupe.
- Aucun secret, aucune clé, aucun token dans le diff (`git diff` relu avant commit).
- `journal.md` : entrée en tête de tableau. Branche `vibe/prompt-33-audit-coherence-4c094b` ;
  ne pas fusionner dans `main` sans demande.
