# Prompt 04 — Layout commun et design system de l'édition

## Objectif
Mettre en place le layout partagé et le design system du site, sobre et conforme à
l'esprit du livret (stabiliser avant de complexifier).

## Référence de design (ordre de priorité)
1. **`design-system/DESIGN.md`** (racine du dépôt) : tokens extraits de
   metropole.nantes.fr — couleurs (`primary #005AE1`, `tertiary #00CA64`, noir / blanc),
   échelle typographique, espacements, rayons, breakpoints. C'est la référence visuelle
   du site : **lire uniquement le bloc YAML de tête et les sections utiles**, pas le
   fichier `metropole-nantes-fr.tokens.json` (trop volumineux).
2. Ce que le design system ne couvre pas : rester sobre (fond clair, texte noir).

Limites à respecter :
- **Ne pas reprendre la police « Picon » / « Picon Condensed »** (propriétaire, non
  livrée) : utiliser une pile de polices système condensées / sans-serif
  (`system-ui, "Helvetica Neue", Arial, sans-serif`). Aucune police téléchargée.
- Ne reprendre **ni logo, ni nom, ni mentions** de Nantes Métropole : le site est celui
  de l'édition PATRIMOINE.EXE / ESD Nantes et ne doit pas passer pour un site officiel.
  On s'inspire des couleurs et du rythme, pas de l'identité.

## Instructions
1. Compléter `site/src/layouts/Layout.astro` (déjà créé au prompt 01) : HTML sémantique,
   `lang="fr"`, meta viewport, `<title>` par page via `Astro.props`
   (« Titre — PATRIMOINE.EXE · NTE001 »), lien d'évitement « Aller au contenu »,
   `<Header />`, `<main id="contenu">`, `<Footer />`.
2. Créer `site/src/styles/global.css`, importé dans le layout :
   - variables CSS (`:root`) issues de `DESIGN.md` : couleurs, tailles de texte,
     espacements, rayons ;
   - contraste WCAG AA vérifié pour chaque couple texte / fond utilisé (≥ 4,5:1) —
     `#005AE1` sur blanc passe pour le texte, `#00CA64` sur blanc **ne passe pas** :
     le réserver aux aplats / décorations, jamais au texte ;
   - focus visible sur tous les éléments interactifs ;
   - `@media (prefers-reduced-motion: reduce)` qui coupe transitions et animations ;
   - aucune animation flashante ni stroboscopique.
3. Créer `site/src/components/Header.astro` et `Footer.astro`. Navigation :
   Accueil, Œuvres, Catalogue, Statistiques, Méthode, Corpus, Données, Crédits.
   Liens construits avec `import.meta.env.BASE_URL` ; lien actif signalé par
   `aria-current="page"`. (Les pages Corpus et Données seront créées aux prompts 10 et
   11 : les liens peuvent pointer vers des pages pas encore créées.)
4. `site/src/pages/index.astro` : garder un contenu minimal rendu via `Layout`
   (contenu réel au prompt 05).

## Vérifications
- Toutes les pages passent par `Layout.astro`.
- Contraste texte / fond ≥ 4,5:1 pour le corps de texte.
- Aucune ressource externe (police, CDN) : le site fonctionne hors ligne.
- Navigation entièrement utilisable au clavier, focus visible.
