# Prompt 06 — Registre machine-readable de l'édition et schéma des œuvres

## Objectif
Mettre en place la **colonne vertébrale technique** du site : un registre JSON de
l'édition et une collection d'œuvres validée par schéma, conformément au framework
(« One edition = one machine-readable identity » — pages, galeries, cartels,
statistiques et catalogues générés depuis les mêmes métadonnées).

## Instructions
1. Créer `site/src/data/edition.json` au format du livret (annexe C, manifest minimal) :
   `framework: "PATRIMOINE.EXE"`, `edition: "NTE001"`, `city: "Nantes"`,
   `country: "France"`, `host: "ESD Nantes"`, `type: "STUDIO"`,
   `dates: ["2026-11-09", "2026-11-10", "2026-11-12"]`, `year: 2026`,
   `projects: []`, `heritage_sources: []`, `datasets: []`.
2. Créer `site/src/content.config.ts` : une collection `oeuvres` avec le loader
   `glob({ pattern: "*.json", base: "./src/content/oeuvres" })` (import depuis
   `astro/loaders`) et un schéma **`z` importé depuis `astro/zod`** (inclus dans
   Astro — **ne pas installer le paquet `zod`**). Champs :
   - `id` : `PXE-NTE001-G{nn}-W{nn}` (regex) ; `titre` ; `auteurs` (liste) ; `groupe` ;
   - `statut` : `"STUDENT" | "SELECTED" | "COLLECTION"` (libellé affiché pour
     COLLECTION : « PATRIMOINE.EXE COLLECTION ») ;
   - `source` : `{ titre, lieu, type, url, date_acces, droits }` ;
   - `grammaire` : `{ regle, invariants[], variables[] }` ;
   - `parametres` : liste d'au moins **3** paramètres opérants `{ nom, effet }` ;
   - `stack` ; `mode` : `"generative" | "data" | "interactif"` ;
   - `fallback` : description du fonctionnement hors ligne (obligatoire) ;
   - `datasets` : liste d'`id` de jeux de données (optionnelle) ;
   - `cartel` : texte de **80 à 120 mots** (vérifié par un `refine` qui compte les mots) ;
   - `assets` : `{ hero?, detail?, process?, thumb?, demo? }` — **tous optionnels** :
     tant qu'une image n'existe pas, les composants affichent un emplacement neutre
     « Captation à venir », jamais une image cassée ;
   - `lien_oeuvre` (optionnel) : chemin de l'œuvre jouable (ex. le jeu, prompts 14–19) ;
   - `ai_usage` : texte de 3 à 5 lignes (optionnel).
3. **Pas d'œuvre fictive.** Créer une seule entrée réelle :
   `site/src/content/oeuvres/pxe-nte001-g01-w01.json` pour le jeu
   « Nantes en régulation », rempli à partir de `jeu/README.md` et `jeu/00-concept.md`
   uniquement. Toute information absente de ces fichiers (numéro de groupe, auteurs,
   cartel définitif…) est écrite `"[À COMPLÉTER]"` — ne rien inventer. Le cartel
   provisoire peut résumer `jeu/00-concept.md` en 80–120 mots.
4. Créer `site/src/lib/oeuvres.ts` avec `getOeuvres()` (appelle
   `getCollection("oeuvres")`, trie par identifiant) et `slugDe(oeuvre)` (identifiant en
   minuscules).
5. Aucune donnée lue depuis le réseau à cette étape : tout est local.

## Vérifications
- `npm run build` réussit ; `getOeuvres()` retourne l'œuvre du jeu.
- Test de rejet : retirer temporairement `cartel` du JSON → le build échoue avec un
  message clair indiquant le champ manquant ; puis remettre le champ.
- `package.json` ne contient toujours qu'`astro` en dépendance.
