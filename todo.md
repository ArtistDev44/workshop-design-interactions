# todo.md — PATRIMOINE.EXE / Nantes 001 (STUDIO)

Édition : PXE · NTE001 · ESD Nantes · B3 Design — 9, 10 & 12 novembre 2026
Stack : p5.js / JS / Open Data · Durée : 21 h · Dépôt : workshop-design-interactions

Méthode en 10 étapes : observer, documenter, décomposer, formaliser, coder, connecter, tester, éditer, exposer, archiver.
Corpus Nantes 001 : Passage Pommeraye, Île Feydeau, Tour LU, Château des ducs de Bretagne, Grue Titan, patrimoine arboré, inventaires locaux, mémoire de la traite.

## Phase 0 — Cadrage (avant J1, lundi 9 nov)

- [ ] Choisir une seule source patrimoniale dans le corpus Nantes 001
- [ ] Réserver l'identifiant d'œuvre au format PXE-NTE001-G{groupe}-W{numéro}
- [ ] Créer l'arborescence du dépôt : code/ data/ sources/ docs/
- [ ] Vérifier l'accès aux open data de Nantes Métropole et noter les URLs utilisées
- [ ] Noter le slug de l'œuvre pour l'URL cible : /patrimoine-exe/nantes/001/{slug}/

## Phase 1 — Observer & documenter (J1, lundi 9 nov)

- [ ] Récolter la matière source : photos, plans, relevés, métadonnées, sons
- [ ] Remplir la source sheet : situation, provenance, contexte historique
- [ ] Vérifier les droits de chaque média et source (licences, ayants droit si mémoire sensible)
- [ ] Consigner les données open data pertinentes dans data/ avec leur source

## Phase 2 — Décomposer & formaliser (fin J1 → J2, mardi 10 nov)

- [ ] Décomposer la source en éléments observables (structures, motifs, rythmes, matières)
- [ ] Écrire la grammaire : règles de transformation de la source en système
- [ ] Dessiner la grammar map (schéma source → règles → système)
- [ ] Fixer les paramètres opératoires : variables, contraintes, plage de variation
- [ ] Choisir la forme de sortie et l'interaction principale (une seule idée lisible)

## Phase 3 — Coder & connecter (J2 → début J3, jeudi 12 nov)

- [ ] Partir du starter p5.js et brancher la grammaire (le code incarne les règles)
- [ ] Connecter la donnée : API ou JSON local dans data/
- [ ] Écrire le fallback : l'œuvre doit tourner même si la donnée en ligne tombe
- [ ] Remplir la mapping sheet : quel geste ou donnée produit quel effet visible, et pourquoi
- [ ] Commit régulier sur main, un commit par étape franchie

## Phase 4 — Tester & éditer (J3, jeudi 12 nov)

- [ ] Tester en conditions réelles : navigateur, écran, éventuellement tablette
- [ ] Vérifier le mapping perceptible : chaque interaction a un retour lisible
- [ ] Ajouter reset et état initial propre (rejouable sans recharger)
- [ ] Contrôler lisibilité, contrastes, tailles, temps de réponse
- [ ] Rédiger la déclaration IA si des outils génératifs ont été utilisés

## Phase 5 — Exposer & archiver (fin de semaine, 13–15 nov)

- [ ] Capturer l'œuvre en action : vidéo ou capture d'écran de référence
- [ ] Rédiger le cartel : titre, auteur·e, groupe, source patrimoniale, technique
- [ ] Écrire le README du dépôt : installation, lancement, dépendances
- [ ] Produire le manifest JSON de l'œuvre (identifiant PXE-NTE001-G…-W…, sources, médias)
- [ ] Assembler le package archive relançable : code, sources, médias, cartel, manifest
- [ ] Pousser le tout sur main et vérifier que le dépôt se clone et se lance tel quel

## Contrôle final — les 7 invariants du standard

Une édition n'est conforme que si les 7 cases sont cochées.

- [ ] Source réelle & provenance — preuve : source sheet
- [ ] Grammaire explicite — preuve : grammar map
- [ ] Système computationnel — preuve : code / logic
- [ ] Mapping perceptible — preuve : mapping sheet
- [ ] Œuvre montrable — preuve : live / capture
- [ ] Robustesse & responsabilité — preuve : preflight
- [ ] Archive relançable — preuve : archive package

## Jalons de la semaine

| Date | Jalon |
|---|---|
| Lun 9 nov | J1 : source choisie, source sheet remplie, grammaire amorcée |
| Mar 10 nov | J2 : grammaire formalisée, prototype p5.js branché sur la donnée |
| Jeu 12 nov | J3 : œuvre fonctionnelle, testée, capturée |
| Ven 13–15 nov | Archive complète, manifest, cartel, dépôt finalisé |
