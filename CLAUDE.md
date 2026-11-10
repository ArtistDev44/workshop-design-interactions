# CLAUDE.md — règles courtes pour l'assistant (PATRIMOINE.EXE · NTE001)

Lire ce fichier plutôt que le livret complet. N'ouvrir `contexte/` que si un prompt le demande.

## Projet
- Atelier ESD Nantes, B3 Design, 9, 10 & 12 nov. 2026. Chaîne à tenir : **source → grammaire → système → œuvre**.
- Langue de travail : français.
- Site Astro statique dans **`site/`** (commandes `npm` dans `site/`). Seule dépendance : `astro`.
- `base` GitHub Pages : `/workshop-design-interactions/patrimoine-exe/nantes/001/` — tout lien interne passe par `lien()` de `site/src/lib/liens.ts` (menu : `NAVIGATION`).
- Jeu p5.js « Nantes en régulation » : décisions verrouillées dans `jeu/`, prompts 14–19.
- Design : `design-system/DESIGN.md` (couleurs, échelle), sans police Picon ni identité Nantes Métropole.
- Données : API Open Data Nantes Métropole côté navigateur uniquement, instantanés réels dans `site/public/data/fallback/` (voir `contexte/audit-api-open-data-nantes.md`).

## Règles
- Exécuter les `prompts/NN-*.md` un par un, dans l'ordre ; vérifier avant de passer au suivant.
- Aucune donnée, œuvre ou source inventée : inconnu → `"[À COMPLÉTER]"`.
- Aucun secret, clé ou token dans le code. Site relançable sans réseau.
- Accessibilité : contraste ≥ 4,5:1, clavier, `prefers-reduced-motion`, pas de flash.
- À chaque push : une ligne en tête du tableau de `journal.md` (racine) — date, commit, fichiers, résumé.
- Travailler sur une branche, fusionner dans `main` sur demande.

## Économie de tokens
- Ne pas lire : `design-system/metropole-nantes-fr.tokens.json`, `design-system/report-*.html`, `site/public/data/fallback/`, `site/node_modules/`, `site/dist/`.
- Échantillonner les API avec `limit=1` et `select`, jamais de réponse complète dans la conversation.
- Vérifier par `npm run build`, pas par des captures d'écran répétées.
