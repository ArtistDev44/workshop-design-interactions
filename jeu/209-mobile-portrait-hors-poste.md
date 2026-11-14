# 209 — Mobile portrait : écrans hors du poste lisibles (défauts « T »)

Prompt : `prompts/209-jeu-mobile-portrait-hors-poste-lisible.md`. Branche `209-jeu-mobile-portrait-hors-poste-lisible`.
Suite du prompt 205 (poste lisible en portrait). Rien ne change sur ordinateur ni en paysage mobile : tout passe par
`PORTRAIT.actif`.

## Mesure

Audit des textes `index.html?audit=textes&parcours=1` (FR + EN, ≈ 50 écrans), Chromium sans interface, 412 × 915
tactile, relancé sur chaque commit de la branche le 14/11/2026. Défaut « T » : taille rendue < 12 px CSS.

Le constat du prompt (806 défauts, 13/11) a été pris avant la galerie des fins du prompt 207 ; sur l'état de départ
de la branche, l'audit en compte **879** (dont 57 dans la galerie des fins).

| Commit | Étape | Défauts T | Autres défauts |
|---|---|---|---|
| `24678fd` | départ (avant 209) | 879 | 0 |
| `b99ac4a` | 1 · mesure juste — **référence** | **831** | 0 |
| `2aaf0de` | 2 · fenêtres à 640 px | 469 | 0 |
| `1a04500` | 3 · rapport et mail de fin | 360 | 0 |
| `86d51bc` | 4 · téléphone et SMS | 271 | 5 B (texte coupé) |
| `066d72a` | 5 · menu principal | 273 | 5 B |
| `4f686af` | 6 · lettre et cinématiques | 249 | 5 B |
| `a949737` | 5 (suite) · crédits et autorisations | 216 | 5 B |
| `4c154b8` | 7 · bureau | **0** | **0** |

Le total remonte parfois de quelques unités d'une étape à l'autre (bureau 235 → 259) : le parcours affiche plus ou
moins de textes selon l'état laissé par l'écran précédent ; les cinq « B » apparus à l'étape 4 ont disparu à
l'étape 7.

### Référence par écran (après l'étape 1) et résultat final

| Écran | Défauts T de référence | Final |
|---|---|---|
| Bureau (vue de la pièce, soir compris) | 235 | 0 (hors textes déclarés décoratifs, ci-dessous) |
| Paramètres | 128 | 0 |
| Aide | 127 | 0 |
| Rapport de la semaine et mail de fin | 113 | 0 |
| Galerie des fins | 57 | 0 |
| Installation, partage, partir, démission, remise à zéro | 52 | 0 |
| Menu principal (titre, semaines, crédits, autorisations) | 31 | 0 |
| Palmarès | 31 | 0 |
| Téléphone / SMS | 27 | 0 |
| Lettre de licenciement | 16 | 0 |
| Cinématiques (bonne, moyenne, mauvaise) | 14 | 0 |
| **Total** | **831** | **0** |

L'étape 1 a surtout corrigé les SMS (60 → 27) et les Paramètres (143 → 128) : les textes de l'appli **masqués**
par la fenêtre ou les SMS ne sont plus comptés.

### Non-régression (après fusion de `main`, prompts 210 à 212 compris — audit relancé après la fusion de 212)

| Taille | Défauts A–E | Défauts T | Écrans parcourus | Étapes en erreur |
|---|---|---|---|---|
| 1920 × 1080 | 0 | 0 | 50 | 0 |
| 1366 × 768 | 0 | 0 | 50 | 0 |
| 412 × 915 (tactile) | 0 | 0 | 48 | 0 |
| 915 × 412 (tactile) | 0 | 0 | 50 | 0 |

`npm run build` puis `npm test` : smoke, test du jeu (dont le test 209 : `DS.fenetre` vaut 640 en portrait et
reprend ses valeurs en sortant) et test navigateur verts.

## Ce qui a été fait (un commit par étape)

1. **Mesure juste** (`audit-textes.js`) — en T, seuls les textes du calque au premier plan (fenêtre, SMS) sont
   comptés.
2. **Fenêtres** — en portrait, `DS.fenetre.etroite / moyenne / large` valent 640 (cadre 680) et reprennent leurs
   valeurs en sortant (`appliquerFenetresPortrait`, `portrait.js`). Paramètres, aide, palmarès, galerie des fins,
   installation, partage, démission, partir, remise à zéro, blâme : colonnes empilées, onglets sur deux rangées,
   suite défilable, plancher de 20 px.
3. **Rapport de la semaine et mail de fin** — deux feuilles empilées dans une colonne de 640 px, défilables
   (`blocsRapportPortrait`, `histoire.js`).
4. **Téléphone et SMS** — région source réduite au seul téléphone (560 px, sans la main), plancher de 20 px ;
   transition du jour en colonne de 640 px.
5. **Menu principal** — écran titre et choix du mode en colonne de 640 px (cartes empilées, boutons pleine
   largeur) ; crédits et autorisations en flux sur trois colonnes de 640 px (`fluxPortrait`).
6. **Lettre de licenciement et cinématiques** — lettre puis boutons empilés et défilables ; cinématique : titre,
   « Passer » pleine largeur, sous-titre à 28 px dans une colonne de 640 px (`COLONNE_CINE`).
7. **Bureau** — voir ci-dessous.

## Bureau : textes déclarés décoratifs

Nouvel appel `zoneTexteDecor(true) … zoneTexteDecor(false)` (`sketch.js`, compté par `audit-textes.js`, sans effet
hors audit). En portrait, il encadre **un seul** élément :

- **la vignette de l'écran du PC vue depuis la pièce** (336 × 189 px de l'image) : c'est l'appli entière en
  miniature, illisible par nature ; tout ce qu'elle montre se lit en grand au poste.

Les textes **utiles** qu'elle portait ont été repris en clair sous l'image, à la taille portrait :

- la consigne et « Fin de journée. » ; l'heure numérique sous l'horloge murale, reprise à l'étape 7, a ensuite été
  retirée sur toutes les tailles par le prompt 212 (fusionné après) : l'heure se lit aux aiguilles, au poste et sur
  le téléphone ;
- la bulle du guide (dont « Quitter le guide (Échap) ») ;
- le compteur de badges, dans le bouton « S'installer au PC (n) ».

Aucun autre texte de la pièce n'est exclu.

## Captures (412 × 915)

`jeu/209-captures/avant-412-*.png` (état de départ `24678fd`) et `apres-412-*.png` : aide, bureau, cinématique,
démission, installation, lettre, mail de fin, crédits, choix de la semaine, palmarès, paramètres, partir, rapport,
SMS, téléphone. Les captures `apres-bureau-*.png` et `apres-menu-*.png` viennent des étapes 5 et 7.

## Limites

- Mesure automatique seulement : la lecture sur un vrai téléphone (doigts, luminosité, défilement) reste à faire
  (`jeu/210-protocole-tests-humains.md`).
- Le défilement des fenêtres longues se fait au doigt ; son indication visuelle n'a pas été testée avec des
  joueurs.
- Corrections apportées à la reprise de la branche (14/11) : l'étape 6 avait cassé le test du jeu (`COLONNE_CINE`
  lisait `L` avant sa déclaration dans le contexte du test) et deux tests qui lisent le code source (163, 171) ne
  connaissaient pas la colonne portrait ; tous trois sont réparés.
