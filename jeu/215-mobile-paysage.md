# 215 — Téléphone tenu en paysage : mise en page dédiée

Prompt : `prompts/215-jeu-mobile-paysage-dedie.md`. Branche `215-jeu-mobile-paysage-dedie`.

## Principe retenu : le portrait « à plat »

Plutôt qu'une troisième mise en page, le paysage reprend la recomposition du portrait (prompts 60, 205, 209, 214) : le
jeu se dessine comme en portrait (colonnes de 620 / 640 px, commandes de 74 px, boutons de 120 px et plus), et le
canevas recomposé prend la forme de l'écran.

- **Canevas** `PLW × PH` : `PH` = 1080 (moins si l'écran fait moins de 412 px de haut, pour garder l'échelle du
  portrait : ≈ 0,38 px CSS par px), `PLW` = `PH` × largeur / hauteur de l'écran. Exemples : 915 × 412 → 2399 × 1080 ;
  740 × 360 → 1940 × 944.
- **Colonne** de 1080 px au centre, sur toute la hauteur, défilable au doigt.
- **Rail gauche** : vitesse du temps, heure, les trois jauges chiffrées (zone d'excès hachurée et « ⚠ » du prompt 213),
  et pendant un dossier « Envoyer une équipe » (message d'envoi sur trois lignes au plus) et les quatre équipes.
- **Rail droit** : au poste, les onglets de l'appli empilés (badges, verrous) puis « Se reposer » / « Se lever » ; au
  bureau, « S'installer au PC » et les objets de la pièce (deux colonnes si la hauteur manque), l'heure de la pièce
  passant dans le rail gauche.
- **Autres écrans** (fenêtres, rapport, menu, téléphone, cinématiques, lettre, transition) : leur colonne portrait,
  centrée ; s'ils dépassent la hauteur, ils remontent en haut et défilent (`defilementGenerique`, `portrait.js`).

Fichiers : `portrait.js` (géométrie, rails, défilement), `mobile.js` (tout le mobile passe par la recomposition),
`style.css` (le canevas recomposé remplit l'écran), `taches-ui.js` (fenêtres de tâches en mise en page portrait aussi
en paysage), `audit-textes.js` (échelle mesurée sur la largeur réelle du canevas).

## Mesure (Chromium tactile, parcours FR + EN de l'audit des textes, cibles en px CSS — prompt 214)

| Taille | Défauts de texte | Cibles < 44 px CSS | dont < 24 px CSS |
|---|---|---|---|
| 915 × 412 paysage — avant | 0 | 436 | **310** |
| 915 × 412 paysage — après | 0 | 94 | **9** |
| 844 × 390 paysage — après | 0 | 98 | 9 |
| 740 × 360 paysage — après | 0 | 98 | 9 |
| 412 × 915 portrait (non-régression) | 0 | 98 | 9 |
| 1920 × 1080 / 1366 × 768 (non-régression) | 0 / 0 | 81 / 286 | 0 / 0 |

Les 9 cibles sous 24 px restantes, en paysage comme en portrait, sont trois objets de la pièce dans l'image du bureau
(webcam, horloge, lampe), comptés sur trois écrans du bureau : chacun a son grand bouton dans le rail droit
(120 px ≈ 46 px CSS) — exception « contrôle équivalent » du critère WCAG 2.5.8.

Première mesure intermédiaire, avec un canevas toujours haut de 1080 : 706 défauts « T » en 844 × 390 et 973 en
740 × 360 (l'échelle tombait à 0,36 et 0,33). D'où la hauteur variable.

**Interactions vérifiées au toucher réel** (915 × 412) : onglet « Mails » du rail droit → Mails ouvert ; « S'installer
au PC » du rail → zoom vers le poste ; « Police » dans le rail gauche pendant un dossier → équipe envoyée. Aucune
erreur JavaScript pendant les parcours.

## Captures

`jeu/215-captures/` : `avant-915x412-*` et `apres-915x412-*` (poste, dossier, Mails, bureau, Paramètres, téléphone,
cinématique), `apres-915x412-menu-titre`, `apres-915x412-equipe-envoyee`, `apres-740x360-*` (poste, dossier, bureau,
Paramètres).

## Limites

- Les écrans qui ne sont pas le poste ni le bureau laissent les rails vides : la colonne y est de la même taille qu'en
  portrait, pas plus grande.
- Les cinématiques et le téléphone dépassent la hauteur et défilent : le bas (sous-titre d'une cinématique, bas du
  téléphone) demande un geste.
- Sous 360 px de haut, les rails n'ont plus la place de tout montrer (non mesuré). Sur un écran 16:9 bas
  (640 × 360), les rails ne font que 300 px : les noms d'équipe sont resserrés dans leur bouton.
- Les 98 cibles sous 44 px restantes sont celles du portrait (rapport `jeu/214-mobile-plein-ecran-accessibilite.md`
  § 4).
- Ressenti sur un vrai téléphone : [non renseigné].

## Tests ajoutés (`test-jeu.mjs`, +10)

Géométrie en 915 × 412 (canevas, colonne, rails, classes CSS), écran bas 740 × 360 (même échelle), contenu trop haut
ramené en haut et défilable, contenu qui tient sans défilement, retour au portrait puis à l'ordinateur, câblage de
`mobile.js`, des rails, des touchers et du CSS.
