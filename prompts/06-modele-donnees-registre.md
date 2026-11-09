# Prompt 06 — Registre machine-readable de l'édition et schéma des œuvres

## Objectif
Mettre en place la **colonne vertébrale technique** du site : un registre JSON de
l'édition et un schéma de validation des œuvres, conformément au framework
(« One edition = one machine-readable identity » — pages, galeries, cartels,
statistiques et catalogues générés depuis les mêmes métadonnées).

## Instructions
1. Créer `src/data/edition.json` au format du livret (annexe C, manifest minimal) :
   `framework: "PATRIMOINE.EXE"`, `edition: "NTE001"`, `city: "Nantes"`,
   `country: "France"`, `host: "ESD Nantes"`, `type: "STUDIO"`, `dates`, `year: 2026`,
   `projects: []`, `heritage_sources: []`, `datasets: []`.
2. Créer `src/data/oeuvres/` avec **un fichier JSON exemple** `g01-w01.json` conforme à
   la convention d'identifiant `PXE-NTE001-G01-W01` : titre, auteurs, groupe, source
   patrimoniale (titre, url, droits), grammaire (règles, invariants, variables),
   stack, mode (generative/data/interactif), statut parmi
   `STUDENT / SELECTED / PATRIMOINE.EXE COLLECTION`, cartel (80–120 mots), assets
   (hero.jpg, detail-01.jpg, process.jpg, demo.mp4, thumb.jpg), QR code, `ai_usage`.
3. Définir un schéma Zod dans `src/data/schema.ts` validant chaque œuvre (champs
   obligatoires du livret : source documentée, grammaire explicite, 3 paramètres
   opérants, fallback, droits) et une fonction `getOeuvres()` qui lit tous les JSON
   de `src/data/oeuvres/` et les valide.
4. Ne jamais lire de données depuis le réseau à cette étape : tout est local.

## Vérifications
- `getOeuvres()` retourne la liste des œuvres valides sans erreur.
- Un JSON d'œuvre invalide (champ manquant) est rejeté avec un message clair.
