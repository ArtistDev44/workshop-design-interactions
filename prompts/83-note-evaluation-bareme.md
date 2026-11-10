# Prompt 83 — Note d'évaluation : barème officiel du livret confronté à la proposition du dépôt

Objectif : créer **`note-eval.md` à la racine du dépôt** — un document qui reprend les
critères d'évaluation officiels du livret PATRIMOINE.EXE · NTE001, les confronte à ce qui est
**réellement démontrable** dans ce dépôt (la proposition « Nantes en régulation",
`PXE-NTE001-G01-W01`), attribue des points critère par critère avec preuves citées, calcule
une **note en bas du fichier**, et liste des **leviers actionnables** prioritaires avant la
soutenance J3 (jeudi 12 nov, 15:00).

Ce prompt est un **méta-prompt** (hors jeu) : il ne modifie **aucun fichier de code** du jeu
(`site/public/*.js`, `rendu/**/*.js`) — il ne crée que `note-eval.md` à la racine du dépôt.

Règles absolues : travailler en **français** ; aucun secret, clé ou token ; **aucune donnée,
œuvre ou source inventée** (inconnu → `"[À COMPLÉTER]"`) ; **n'attribuer des points que pour ce
qui est vérifiable dans le dépôt à la date du jour** (preuve = fichier, symbole, commande
rejouée, commit) — sinon indiquer le manque et ne pas prendre les points ; branche dédiée, pas
de fusion dans `main` sans demande ; à chaque push, une entrée en tête de `journal.md`.

## 1. Lire le barème officiel (ne pas le réinventer)

- Source principale : `contexte/PATRIMOINE.EXE - Nantes 001 — Cours étudiant B3 Design — ESD
  Nantes — 2026.md`, section évaluation (12 / ÉVALUATION) :
  - **Projet commun — 70 points** : Recherche patrimoniale & provenance (10) · Grammaire &
    concept (15) · Prototype & fonctionnement (15) · Data / interaction / mapping (10) ·
    Design visuel & expérience (10) · Processus, test & documentation (10) — avec les
    **indicateurs** du livret pour chaque critère.
  - **Évaluation individuelle — 30 points** : Contribution réelle et traçable (10) · Maîtrise
    et compréhension (8) · Oral individuel (5) · Autonomie, engagement, itération (4) ·
    Documentation personnelle & intégrité (3).
  - **Formule** : note /20 = (points projet /70 + points individuels /30) ÷ 5, avec l'échelle
    qualitative du livret (90–100 exemplaire … <60 insuffisant).
- Résumé aussi présent dans `todo.md`, section « Soutenance et évaluation » — vérifier que les
  deux correspondent ; le livret prime en cas d'écart.

## 2. Rassembler les preuves dans le dépôt (commandes à rejouer, résultats à citer)

Pour chaque critère, collecter des preuves concrètes, par exemple :

- **Recherche patrimoniale & provenance** : `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/source-sheet.md`
  et `site/public/source-sheet.md` (titre, lieu, URL, date d'accès 2026-11-10, licences,
  relevés, 3 propriétés observables, 1 propriété écartée) ; `manifest.json` (sources et
  droits) ; `LICENSE` et `site/public/audio/CREDITS.md` (droits des données et médias) ;
  `contexte/audit-api-open-data-nantes.md` ; instantanés horodatés `site/public/data/fallback/*.json`.
  Repérer les `[À COMPLÉTER]` restants (`grep -rn "À COMPLÉTER"` hors `node_modules`) : licence
  Hub'Eau, confirmation de la propriété écartée, licence Loyalty Freak Music…
- **Grammaire & concept** : `jeu/00-concept.md` (phrase-problématique, spec verrouillée Q1–Q61,
  mapping justifié en une phrase) ; `grammar.md` / `site/public/grammar.md` (règle structurante,
  invariants, variables) ; chaîne source → grammaire → système → œuvre.
- **Prototype & fonctionnement** : `cd site && npm run build && npm test` (résultats à citer) ;
  jouable hors ligne (double clic `site/public/index.html`, `sw.js`, `data/fallback.json` 6 cas)
  ; reset (`R`), sauvegarde/reprise (`sauvegarde.js`), paramètres opérants (`jeu/09-parametres.md`
  : difficulté, durée, langue, accessibilité) ; test 1920×1080 ; checklist de robustesse de
  `todo.md` (cocher ce qui est prouvé) ; version figée `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/`.
- **Data / interaction / mapping** : `gtfsrt.js` (GTFS-RT décodé), Open-Meteo (archive ERA5,
  seuil 95e percentile), semaines réelles `data/semaines/*.json` (aucun événement inventé),
  fallback `data/fallback/*.json` + `data/fallback.json` ; mapping perceptible (retard ≥ 10 min →
  dossier → 3 actions + « ne rien faire » → jauges) ; feedback (animations, sons, `aria-live`).
- **Design visuel & expérience** : `design-system/DESIGN.md` + tokens extraits de
  metropole.nantes.fr ; bureau pixel art + PC immersif ; captures réelles `rendu/…/hero.jpg`,
  `detail-01.jpg`, `process.jpg`, `thumb.jpg`, `demo.mp4` (durée à vérifier) ; PWA installable
  (`manifest.webmanifest`, icônes) ; adaptation mobile (prompt 60) ; i18n FR+EN.
- **Processus, test & documentation** : `journal.md` (une ligne par push ;
  `git log --oneline | wc -l`, `git shortlog -sn --all`) ; `prompts/` 01–83 + statuts dans
  `prompts/README.md` ; itérations documentées (prompts 58/59/66, rapport dans `notes.md`) ;
  README complet (`rendu/…/README.md` : Auteurs/Contributions/AI usage encore `[À COMPLÉTER]`) ;
  cartel 80–120 mots (`cartel.md`, `/cartel/`) ; `manifest.json` ; QR codes (scan réel restant).

## 3. Rédiger `note-eval.md` à la racine du dépôt

Structure imposée (markdown, français) :

```markdown
# note-eval.md — Évaluation « Nantes en régulation » (PXE-NTE001-G01-W01)

Date, évaluateur, méthode (barème du livret §12, preuves rejouées le jour même) et règle :
un point n'est attribué que s'il est prouvable dans le dépôt.

## 1. Barème officiel (rappel)
[tableaux 70 pts + 30 pts + formule /20 + échelle qualitative, copiés du livret]

## 2. Projet commun — critère par critère (/70)
### <Critère> — X / <max>
- **Preuves** : … (fichier/symbole/commande + résultat observé)
- **Manques / risques** : … (ex. `[À COMPLÉTER]` auteurs, licence, scan QR non fait…)
[répéter pour les 6 critères]

## 3. Évaluation individuelle (/30)
### <Critère> — X / <max>
- **Démontrable dans le dépôt** : commits (`git shortlog`), prompts rédigés, docs…
- **À confirmer en soutenance** : oral individuel, observation des 3 jours…
[répéter pour les 5 critères]

## 4. Note calculée (en bas du fichier)
- Projet commun : **X / 70**
- Individuel : **Y / 30** (démontrable aujourd'hui) — plage réaliste jusqu'à 30/30 à la soutenance
- **Note finale estimée : (X/70 + Y/30) ÷ 5 = … /20** — afficher la note sur la base du projet
  seul ET la fourchette avec l'individuel (Y/30 à 30/30), chaque valeur arrondie au dixième
- Lecture qualitative selon l'échelle du livret

## 5. Leviers actionnables avant la soutenance (priorisés)
| Priorité | Levier | Critère visé | Points en jeu | Fichier / action concrète |
|---|---|---|---|---|
| 1 | … | … | … | … |
[exemples attendus : remplir Auteurs/Contributions/AI usage du README, choisir la licence (MIT) dans LICENSE, confirmer la propriété écartée de source-sheet.md, vérifier la licence Hub'Eau, scanner le QR code en conditions réelles, refaire le test croisé 30–60 s, remplir la fiche individuelle, préparer les 8 questions de soutenance de todo.md… — chaque levier relié à un critère et à un fichier réel]
```

Règles de rédaction : points attribués ≤ points max de chaque critère ; total projet ≤ 70 ;
formule /20 exacte (total/100 ÷ 5) ; chaque point attribué ou refusé justifié par une preuve
nommée ; les leviers sont triés par points potentiels / effort, et chacun cite un fichier ou une
action vérifiable.

## 4. Vérifications finales

- `note-eval.md` existe à la racine, se relit de haut en bas, totaux cohérents (≤ 70, ≤ 30),
  note /20 recalculée à la main et identique à celle du fichier.
- `grep -n "À COMPLÉTER" note-eval.md` : les seuls `[À COMPLÉTER]` présents sont ceux qui
  désignent une saisie humaine réelle du groupe (ils apparaissent comme manques, pas comme
  oublis de l'évaluateur).
- Aucun secret, aucune donnée inventée ; aucune modification de `site/public/`, `rendu/` ou
  `jeu/` (`git status` : seul `note-eval.md` est nouveau).
- Branche dédiée (ex. `vibe/prompt-83-note-eval`) ; pas de fusion dans `main` sans demande ;
  entrée en tête de `journal.md` à chaque push.
