# Prompt 209 — Jeu : mobile portrait, rendre lisibles les écrans hors du poste (défauts « T »)

Origine : rapport `jeu/205-mobile-portrait.md` § Limites. Le prompt 205 a rendu le **poste** lisible en portrait
(0 défaut T) ; les autres écrans gardent la recomposition d'avant, qui réduit l'image 16:9. Statut : **à exécuter**.

## Constat (13/11/2026, 412 × 915, Chromium tactile, `?audit=textes&parcours=1`, FR + EN)

Défaut « T » : en portrait, taille du texte × échelle de sa région recomposée × échelle du canevas portrait < 12 px CSS
(`audit-textes.js`, compté une fois par texte et par langue). **806 défauts hors poste** :

| Écran | Défauts | Taille rendue (min · médiane, px CSS) | Région recomposée aujourd'hui (`portrait.js`) |
|---|---|---|---|
| Bureau (vue de la pièce) | 193 | 3,5 · 4,3 | image entière 1920 de large → 1080 portrait |
| Fenêtre Paramètres | 143 | 4,7 · 6,2 | cadre « large » 1320 de large |
| Aide (et SMS ouvert par-dessus) | 124 | 5,6 · 10,6 | scène « main » 780 de large |
| Rapport de la semaine (`fenetre:rapport`) | 110 | 4,4 · 5,5 | 1420 de large |
| Téléphone / SMS | 87 | 7,9 · 9,5 | scène « main » 780 de large |
| Palmarès | 28 | 5,6 · 6,2 | cadre « large » 1320 |
| Installation, partage, partir, démission, remise à zéro | 52 | 6,6 · 9,1 | cadre « moyenne » 1000 |
| Mail de fin de semaine | 8 | 6,2 · 6,9 | cadre « large » 1320 |
| Menu principal : crédits, autorisations, semaines, titre | 29 | 6,4 · 8,2 | colonne du menu 908 |
| Lettre de licenciement | 16 | 4,2 · 5,3 | image entière |
| Cinématiques (bonne, moyenne, mauvaise) | 14 | 3,9 · 4,1 | image entière |
| Menu de l'appli (`fenetre:menu`) | 2 | 11,5 | cadre « étroite » 680 |

Pour atteindre 12 px CSS sur un écran de 412 px, il faut qu'**un texte de 20 px de l'image soit recomposé sur une
région source d'au plus ≈ 690 px de large** (20 × 1040 / 690 × 412 / 1080 ≈ 11,5 → viser 620–640, comme au poste).

Biais connu de la mesure : un texte de l'appli **masqué derrière une fenêtre** est rattaché à la région de la fenêtre
et compté (ex. « 8 h 00 » sous les SMS). Le corriger d'abord (étape 1), sinon les chiffres mentent.

## Méthode (celle du prompt 205)

Ne pas agrandir l'image réduite : en portrait, **dessiner l'écran dans une colonne étroite de l'image 1920 × 1080**,
puis la recomposer pleine largeur sur le canevas portrait (`region()` de `portrait.js`), défilable au doigt si elle
dépasse. Rien ne change sur ordinateur : tout passe par `PORTRAIT.actif`.

## Étapes (une étape = un commit ; audit 412 × 915 relancé après chacune)

1. **Mesure juste** — dans `audit-textes.js`, quand une fenêtre, les SMS, une cinématique ou la lettre sont affichés,
   ne compter en T que les textes dessinés **pendant** ce calque (pile de zones `A.pile`, ou drapeau posé au début du
   dessin de la fenêtre), pas l'appli qui reste dessous. Noter le nouveau total dans le rapport : c'est la référence.
2. **Fenêtres** (≈ 360 défauts, le plus gros gain) — en portrait, `DS.fenetre.etroite / moyenne / large` valent tous
   **640** (largeur du cadre), et `LARGEUR_FENETRE` / `CADRE_FENETRE` de `portrait.js` suivent (680 avec la marge).
   Chaque fenêtre (`aide.js`, `mecaniques.js` palmarès et autres, `installation.js`, `parametres.js`,
   `immersion.js`…) doit alors tenir dans 640 px : colonnes passées en pile, onglets sur deux rangées, tableaux en
   liste, boutons pleine largeur (≥ 44 px CSS). La hauteur peut dépasser 1080 → région défilable.
   Vérifier une par une : Paramètres (143), Aide (124), Palmarès (28), Installation, Partage, Partir, Démission,
   Remise à zéro, Mail de fin.
3. **Rapport de la semaine** (110) — même chose : en portrait, une colonne de 640 px, pages empilées et défilables ;
   les graphiques gardent leurs étiquettes à 20 px au moins.
4. **Téléphone / SMS** (87) — la main et le téléphone occupent 780 px : réduire la région source au seul écran du
   téléphone (≈ 600 px) et y agrandir le texte des bulles ; en portrait, le téléphone peut être dessiné sans la main.
5. **Menu principal** (29) — crédits, autorisations, choix de la semaine : colonne de 640 px au lieu de 908 en
   portrait (sous-titres des cartes, libellés en capitales espacées des crédits) ; le titre garde 64 px (prompt 205).
6. **Lettre de licenciement et cinématiques** (30) — en portrait, texte de la lettre et du plan 2 composés dans une
   colonne de 640 px, centrée, au-dessus de l'image qui reste en fond ; « Passer (Échap) » et « Rejouer » en boutons
   pleine largeur dessinés sur le canevas portrait (comme `dessinerBoutonPortrait`).
7. **Bureau** (193) — l'image de la pièce est un décor : ses objets sont déjà des boutons portrait
   (`boutonsBureau()`). Décider, et l'écrire dans le rapport :
   - les textes **utiles** dessinés dans la pièce (horloge, post-it, écran du PC, indices du guide, compteur de
     badges) passent en boutons ou en étiquettes portrait ≥ 32 px portrait ;
   - les textes purement **décoratifs** sont marqués comme tels (nouvel appel `zoneTexteDecor()` ou équivalent dans
     `audit-textes.js`) et exclus du T, avec la liste de ce qui a été exclu dans le rapport. **Aucune exclusion pour un
     texte qui porte une information de jeu.**
   - Les bulles du guide affichées sur le bureau (« Quitter le guide (Échap) » à 3,5 px) suivent la règle du poste.

## Cible

- **0 défaut T** sur les écrans des étapes 2 à 6 ; bureau : 0 défaut T hors textes déclarés décoratifs.
- **0 défaut A–E** en 1920 × 1080, 1366 × 768, 412 × 915 et 915 × 412 (rien ne régresse sur ordinateur).
- Si une étape s'avère trop lourde (plus d'une demi-journée), la laisser partielle, la décrire dans le rapport et
  passer à la suivante : l'ordre ci-dessus suit le nombre de défauts.

## Contraintes

- Rien ne change sur ordinateur (`PORTRAIT.actif` faux) ; paysage mobile inchangé.
- Contraste ≥ 4,5:1, cibles ≥ 44 px CSS, clavier, `prefers-reduced-motion`, pas de flash.
- Aucun texte inventé ni retiré pour « faire tenir » : reformuler seulement si la phrase reste juste, en FR et EN.
- `npm run build` puis `npm test` avant chaque push ; un test dans `test-jeu.mjs` vérifie que `DS.fenetre` vaut 640
  en portrait et reprend ses valeurs en sortant du portrait.

## Livrables

- Captures avant / après en 412 × 915 de chaque écran traité dans `jeu/209-captures/`.
- Rapport `jeu/209-mobile-portrait-hors-poste.md` : total T de référence (après l'étape 1), total final par écran,
  textes déclarés décoratifs, limites.
- `journal.md`, `prompts/README.md`, `jeu/README.md` à jour.
