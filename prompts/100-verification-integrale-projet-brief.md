# Prompt 100 — Vérification intégrale du projet (brief, livrables, code, données, accessibilité, documentation)

Objectif : le jour J3 (jeudi 12 novembre, freeze fonctionnel à midi), passer **tout le projet** au
crible, facette par facette, et en premier lieu **contre le brief** (livret « PATRIMOINE.EXE - Nantes
001 — Cours étudiant B3 Design », dans `contexte/`). Ce prompt ne crée pas de fonctionnalité : il
**vérifie**, **corrige ce qui est faux ou cassé** (corrections minimales, sans réécrire l'architecture)
et **rend compte** de ce qui reste à la charge du groupe.

Règles absolues : français ; aucun secret ; aucune donnée, œuvre, source ou contribution inventée
(inconnu → `"[À COMPLÉTER]"`) ; aucune dépendance ajoutée à `site/package.json` ; décisions verrouillées
du jeu (Q1–Q61 et exceptions documentées) inchangées ; ne cocher que ce qui a été **réellement exécuté
et observé** ; branche `100-verification-integrale-projet-brief` ; entrée en tête de `journal.md` à
chaque push.

À lire : la section « Votre projet final », « La fiche de grammaire », « Une œuvre générative… »,
« Accessibilité de l'interaction », « Ce que chaque groupe remet » et « Notation individuelle » du
livret (lecture ciblée : `grep -n "^#"` puis `sed -n`), `note-eval.md`, `rendu/README.md`.

## 1. Conformité au brief (facette principale)
Pour chaque exigence, citer la **preuve** (fichier:ligne, commande rejouée, URL) ou l'écart.

| Exigence du livret | À vérifier |
|---|---|
| Source patrimoniale identifiable et documentée | `source-sheet.md` : contexte, provenance, droits, relevés, propriétés observables ; licences des API (`jeu/api.md`) |
| Grammaire explicite (≥ 1 règle structurante) | `grammar.md` : 7 champs de la fiche (primitives, relations, invariants, variables, temps, déclencheur, limites) remplis et vrais au regard du code |
| Test de qualité de la grammaire | une personne qui n'a pas vu la source peut reconstruire un comportement proche à la lecture seule de la fiche |
| Prototype lançable dans un navigateur | double clic sur `index.html` (archive `rendu/` **et** `site/public/`), URL canonique, hors ligne |
| ≥ 3 paramètres réellement opérants | nommer chaque paramètre, son effet mesurable et le test qui le prouve |
| Test par un autre groupe + ≥ 1 itération documentée | trace écrite (notes, journal, prompts) ; sinon `[À COMPLÉTER]` explicite pour le groupe |
| Documentation pour relancer le projet | README minimal du livret : 12 rubriques présentes (Titre, Auteurs, Source, Concept, Grammaire, Stack, Data/interaction, Lancer, Fallback/limites, Contributions, AI usage, Sources/droits) |
| Génératif : invariants / variables / plages / cohérence | documentés si le jeu tire au sort (graines, `randomSeed`) |
| Accessibilité de l'interaction | alternative clavier/touch aux interactions corporelles (micro, webcam), pas de flash, son non indispensable, compréhensible sans explication orale |
| Webcam : responsabilité | aucune image enregistrée ni envoyée, consentement explicite |
| Livrables | projet lançable, fiche-source, grammaire (`.md` + `.pdf`), README, manifest (`manifest.json` valide, champs de l'édition), cartel **80–120 mots** (compter) + source + système, captation (`hero.jpg`, `detail-01.jpg`, `process.jpg`, `demo.mp4` 20–30 s — mesurer la durée —, `thumb.jpg`), présentation |
| Structure de dossier recommandée | `rendu/PXE_NTE001_G01_…/` conforme, **resynchronisé** avec `site/public/` (procédure de `rendu/README.md`) |
| Évaluation /70 + /30 | `note-eval.md` à jour des derniers prompts (preuves rejouées) ; fiche individuelle : champs à remplir par chaque étudiant signalés |

## 2. Fonctionnement et code
- `cd site && npm run build && npm test` verts ; aucun nom global en double ; aucune clé i18n manquante.
- Parcours réel automatisé (Chromium) : jeu FR/EN au clavier, `file://`, hors ligne après une visite
  (service worker), pages `/cartel/`, `/making-of/`, `/presentation/` : 0 erreur console.
- Audit des textes hors cadre (`?audit=textes&parcours=1`) à 1920×1080, 1366×768 et 412×915 : 0 défaut.
- Code mort (fonctions déclarées jamais appelées), secrets (`api[_-]?key`, `bearer`, `password`).

## 3. Données
- Aucune donnée inventée : les replis (`data/fallback/`, semaines archivées) proviennent des API réelles
  (dates et provenance notées) ; appels réseau seulement au lancement / au clic, délai borné, repli.
- Licences et attributions des jeux de données affichées (appli « Données », `jeu/api.md`, README).

## 4. Accessibilité et design system
- Contrastes WCAG mesurés par calcul sur les jetons réellement utilisés (texte ≥ 4,5:1, grand texte ≥ 3:1).
- Clavier seul, `prefers-reduced-motion`, flashs ≤ 3/s, palettes daltonisme.
- Pixel Design System : polices (JetBrains Mono auto-hébergée, Bitsy Pixels), couleurs, pas de police
  Picon ni d'identité Nantes Métropole (`design-system/DESIGN.md`).

## 5. Documentation et traçabilité
- `prompts/README.md` : un statut par fichier de prompt, compte de prompts identique dans `README.md` et `notes.md`.
- `jeu/README.md` reflète tous les `jeu/*.md` ; symboles cités présents dans le code (ou signalés retirés).
- Liens Markdown internes et liens du build : 0 cassé.
- `journal.md` : une entrée par push ; mémoire des décisions du groupe (options désactivées, tests humains) listée.

## 6. Rapport
- Section « Vérification intégrale du JJ/MM/AAAA (prompt 100) » dans `notes.md` : tableau de conformité
  au brief (exigence → preuve → statut ✅ / ⚠️ / ◻), résultats des facettes 2 à 5, corrections faites
  (commits), et **liste de ce que seul le groupe peut faire** avant la soutenance (test croisé,
  contributions nominatives, fiche individuelle, numéro de groupe, police Bitsy Pixels…).

## Vérifications finales
- `npm run build && npm test` verts après la dernière modification ; `git diff` relu (aucun secret,
  aucune donnée inventée, `game.js` sans changement de règle).
- Statut du prompt 100 dans `prompts/README.md` ; `journal.md` à jour.
