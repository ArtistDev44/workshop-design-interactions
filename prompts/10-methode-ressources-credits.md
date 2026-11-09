# Prompt 10 — Pages protocole, corpus Nantes et crédits/brand

## Objectif
Ajouter les pages éditoriales qui rendent le **CORE** (invariant) et la **CITY LAYER**
(variable) du framework visibles : méthode, corpus nantais, crédits.

## Instructions
1. `src/pages/methode.astro` : présenter le protocole en 10 étapes du framework
   (Observer, Documenter, Décomposer, Formaliser, Coder, Connecter, Tester, Éditer,
   Exposer, Archiver), la chaîne source → grammaire → système → œuvre, les quatre
   régimes temporels et les 7 invariants du standard (source, grammaire, système,
   mapping, œuvre montrable, robustesse, archive relançable).
2. `src/pages/corpus.astro` : le corpus Nantes 001 du livret (Passage Pommeraye,
   Île Feydeau / mascarons, Château des ducs de Bretagne, Tour LU, grues et chantiers
   navals, patrimoine arboré, inventaires locaux, mémoire de la traite) avec pour
   chaque élément les familles de traduction possibles (géométrie, répétition,
   hiérarchie, matière, temporalité, usage, mémoire).
3. `src/pages/credits.astro` : crédits de l'édition (framework, intervenant Kamel
   Ghabte, ESD Nantes, B3 Design 2026), convention de nommage `PXE_NTE001_G{nn}_SLUG`,
   et section « AI usage » (3 à 5 lignes) si un assistant IA a été utilisé, conformément
   au livret.
4. Toutes les pages via `Layout.astro`, en français, sans contenu inventé.

## Vérifications
- Les trois pages sont générées statiquement et accessibles depuis le header.
- Les informations correspondent à `contexte/` (aucune invention).
