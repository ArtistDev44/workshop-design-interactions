# Prompt 08 — Page œuvre individuelle et cartel au format du livret

> **Note historique (prompt 33, 10/11/2026).** Ce prompt a été exécuté tel quel ; il cite l'ancienne cible GitHub Pages (`https://artistdev44.github.io/workshop-design-interactions/…`), qui renvoie aujourd'hui une 404. L'URL canonique du projet est désormais **https://workshop-design-interactions.pages.dev/** (Cloudflare Pages, racine du domaine, `base: '/'`). Le texte ci-dessous n'est pas réécrit : il documente l'historique.

## Objectif
Générer une page statique par œuvre, à l'URL du framework
`/patrimoine-exe/nantes/001/<slug>/` (donc, avec la `base` du prompt 02 :
`https://artistdev44.github.io/workshop-design-interactions/patrimoine-exe/nantes/001/<slug>/`),
incluant le **cartel** au format du livret (section 11).

## Instructions
1. Créer `site/src/pages/[slug].astro` (à la racine de `pages/`, **pas** dans
   `oeuvres/`, pour respecter l'URL du framework) avec `getStaticPaths()` : un chemin
   par œuvre, `slug = slugDe(oeuvre)` (ex. `pxe-nte001-g01-w01`). Les slugs commencent
   tous par `pxe-nte001-` : aucun conflit avec les pages Méthode, Corpus, etc.
2. La page affiche, via `Layout.astro` et un composant `Cartel.astro` :
   - **PATRIMOINE.EXE / NANTES 001** + titre de l'œuvre + auteurs (ESD Nantes, B3
     Design, 2026) ;
   - **Source patrimoniale** : titre, lieu, référence/URL, droits ;
   - **Concept** : le cartel de 80 à 120 mots ;
   - **Système** : stack, mode, grammaire (règle, invariants, variables) et les
     paramètres opérants ;
   - la chaîne du livret `SOURCE → GRAMMAIRE → ALGORITHME → DATA/INTERACTION → ŒUVRE`
     (version détaillée de « source → grammaire → système → œuvre ») ;
   - captation : hero, detail, process (si présentes, sinon « Captation à venir ») ;
   - lien « Lancer l'œuvre » si `lien_oeuvre` est renseigné ;
   - emplacement du QR code `${import.meta.env.BASE_URL}assets/qr-{slug}.png`, affiché
     seulement si le fichier existe (les QR sont générés au prompt 13) ;
   - mention « AI usage » si présente dans le registre.
3. Page 404 personnalisée (`site/src/pages/404.astro`) renvoyant vers l'accueil.

## Vérifications
- Une page HTML statique par œuvre dans `site/dist/<slug>/index.html`.
- Le cartel respecte le format du livret et la limite de 80–120 mots.
- Aucune image cassée ; chemins compatibles avec `base`.
