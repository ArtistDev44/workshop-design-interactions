# Prompt 04 — Layout commun et design system de l'édition

## Objectif
Mettre en place le layout partagé et le design system minimal de la marque
**PATRIMOINE.EXE**, inspiré du framework (bible design / brand, toolkit `00_CORE` et
`11_BRAND`) et sobre, conforme à l'esprit du livret (stabiliser avant de complexifier).

## Instructions
1. Créer `src/layouts/Layout.astro` : HTML sémantique, `lang="fr"`, meta viewport,
   titre par page via `Astro.props`, header avec navigation (Accueil, Œuvres, Catalogue,
   Statistiques, Méthode, Crédits), footer avec crédits d'édition.
2. Créer `src/styles/global.css` importé dans le layout :
   - palette sobre : fond papier `#F4F1E9` (comme les starters p5.js du livret), texte
     encre `#14140F`, accent sobre ; contraste conforme WCAG AA ;
   - typographie système (pas de police externe téléchargée) ;
   - pas d'animation flashante ni d'effet stroboscopique (règle d'accessibilité).
3. Créer `src/components/Header.astro` et `src/components/Footer.astro` réutilisables,
   avec des liens utilisant `import.meta.env.BASE_URL`.
4. Remplacer le contenu de `src/pages/index.astro` par un simple rendu via `Layout`
   (contenu réel au prompt 05).

## Vérifications
- Toutes les pages passent par `Layout.astro`.
- Contraste texte/fond ≥ 4,5:1 pour le corps de texte.
- Aucune ressource externe bloquante (police, CDN) : le site doit fonctionner hors ligne.
