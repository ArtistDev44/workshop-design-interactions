# Prompt 99 — Diaporama Slidev : resserrer le deck (fusions, suppressions), polices du design system, compositions originales et bouton « Lancer le jeu »

Demande d'origine (11/11/2026) :

> Fusionne la slide 1 & 2 en utilisant des clics pour faire afficher le contenu progressivement.
> Reformule le titre de l'actuelle slide 4 en « notre objectif », le texte centré en citation.
> Fusionne les pages actuelles 6 & 7. Supprime l'actuelle page 8 & 10. Mets sur la même page les
> livrables et crédits. Supprime l'actuelle slide 19 & 20. Et à la dernière slide, rajoute après
> un clic un bouton qui nous amène vers la page index du jeu : le bouton doit correspondre au
> design des boutons habituels du jeu. Aussi, mets la toc à maxdepth 2 ou 3 (`slides/slides.md`).
> Aussi, rajoute dans les slides les polices du design system
> (`design-system/pixel-design-system.md`). Je souhaite aussi qu'à l'aide du skill slidev tu
> puisses améliorer le rendu des slides. Je souhaite des compositions originales, variées &
> professionnelles. Rajoute ce prompt dans le répertoire.

Précision de l'auteur : les numéros désignent les slides **telles qu'elles sont avant
modification** (deck du prompt 94, 24 slides, 1 = couverture).

| N° (avant) | Slide | Action |
|---|---|---|
| 1 + 2 | couverture + « Le projet en une phrase » | fusion, contenu révélé au clic |
| 4 | section « Le projet » | titre « Notre objectif », texte centré en citation |
| 6 + 7 | « 0 événement inventé » + section « La chaîne » | fusion |
| 8 | diagramme Mermaid source → œuvre | supprimée |
| 10 | « La grammaire » (invariants / variables) | supprimée |
| 19 | « Les interactions » | supprimée |
| 20 | section « Jouer » | supprimée |
| 22 + 23 | « Les livrables » + « Crédits » | même page |
| 24 | fin | bouton primaire du jeu au clic, vers `/` |

## Prérequis — le skill Slidev
Lire et appliquer le skill `slidev` (`~/.claude/skills/slidev/SKILL.md` et ses références :
`core-animations`, `core-frontmatter`, `core-components` pour `<Toc>`, `layout-global-layers`,
`style-scoped`). Commande de build inchangée : `slidev build slides.md --base /presentation/
--out ../site/public/presentation`.

## Attendu
1. **Fusions et suppressions** selon le tableau ci-dessus, sans perte du fil
   source → grammaire → système → œuvre (les quatre maillons restent sur la slide fusionnée 6 + 7).
2. **Sommaire à deux niveaux** : `<Toc minDepth="1" maxDepth="2" />` ; les slides d'ouverture
   d'acte sont de niveau 1, les autres de niveau 2 (`title:` / `level: 2` en frontmatter),
   couverture, sommaire et fin restent `hideInToc`.
3. **Polices du design system** (§ 1.3) : JetBrains Mono (paragraphes) auto-hébergée dans
   `slides/public/fonts/` (`@font-face`, SIL OFL 1.1), Bitsy Pixels (titres) déclarée en
   `local()` — fichier non versionné tant que la licence de redistribution n'est pas vérifiée
   ([À COMPLÉTER]) ; repli JetBrains Mono ExtraBold en capitales. Aucun appel externe.
4. **Compositions variées** : une mise en page propre à chaque slide (fenêtre « RégulOS » du jeu
   sur la couverture, sommaire en actes numérotés, citation centrée, énoncé à étiquette, grand
   « 0 » + maillons au clic, chiffre + jauge de 20 cases, actes en filigrane numéroté, tableau
   DS des sources, billet d'accès, liste + fenêtre crédits, fin avec bouton).
5. **Bouton de fin** : même dessin que `dsBouton(…, 'primaire')` de `site/public/ds.js` — rouge
   #D4031C plein, texte blanc JetBrains Mono suivi de « › », angles droits, survol / focus en
   double bordure (anneau fond puis anneau rouge) ; révélé au clic (`v-click`), lien `../`.
6. **Accessibilité** : contraste ≥ 4,5:1 pour le texte courant (rouge réservé aux grands
   glyphes et aplats), `prefers-reduced-motion` coupe transitions et animations (l'entrée de la
   couverture est une animation CSS, plus `v-motion`), clavier ← → Début Fin, `aria-live`
   conservé, alternatives textuelles des captures et de la jauge.

## Vérifications
- `cd site && npm run build && npm test` vert ; `/presentation/` construit avec la base
  `/presentation/`, polices servies depuis `/presentation/fonts/`, précache `sw.js` à jour.
- 17 slides : couverture (4 clics), sommaire à 2 niveaux, actes 01–05, fin avec bouton au clic.
- Mettre à jour `prompts/README.md` (ligne 99) et `journal.md` (une ligne en tête).
- Branche dédiée `99-slides-fusion-compositions-polices-ds`.
