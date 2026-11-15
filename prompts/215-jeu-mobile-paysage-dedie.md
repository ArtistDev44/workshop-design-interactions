# Prompt 215 — Jeu : mise en page dédiée au téléphone tenu en paysage

Origine : rapport `jeu/214-mobile-plein-ecran-accessibilite.md` § 4 et demande du 14/11/2026 (« fais le prompt pour la
mise en page paysage mobile et exécute-le »). Statut : **exécuté le 14/11/2026** — compte rendu dans `jeu/215-mobile-paysage.md`.

## Constat (prompt 214, 915 × 412, Chromium tactile, mesure des cibles en px CSS)

En paysage, le téléphone affiche l'image 1920 × 1080 réduite d'un bloc : 412 / 1080 = **0,38 px CSS par pixel
d'image**. Un bouton de 44 px y fait 17 px CSS. Mesuré : médiane des cibles 18 px, **310 cibles sous 24 px CSS** (minimum
WCAG 2.5.8 AA) — Paramètres 133, poste 64, enquête 38, Mails 25, téléphone 13. Le portrait, recomposé (prompts 60, 205,
209, 214), est à 0 défaut de texte et sans cible sous 24 px hors équivalents.

## Principe : le portrait, à plat

Ne pas créer une troisième mise en page. En paysage mobile, le jeu se dessine **comme en portrait** (colonnes de 620 /
640 px, commandes de 74 px, boutons de 124 px : `PORTRAIT.actif` vrai) et le canevas recomposé prend la forme de
l'écran :

- canevas `PLW × 1080` avec `PLW = 1080 × largeur / hauteur de l'écran` (≈ 2400 pour 915 × 412) : **même échelle qu'en
  portrait** (≈ 0,38 px CSS par px du canevas), donc mêmes tailles de texte et de cibles à l'écran ;
- au centre, la **colonne de contenu** du portrait (1080 px), sur toute la hauteur, défilable au doigt ;
- à gauche, un **rail** : heure, vitesse du temps, les trois jauges chiffrées (zone d'excès comprise), et pendant un
  dossier les boutons « Envoyer une équipe » ;
- à droite, un **rail** : les onglets de l'appli (empilés, badges et verrous), « Se reposer » / « Se lever » ; au bureau,
  les objets de la pièce (« S'installer au PC » en tête).

Les autres écrans (fenêtres, rapport, menu, téléphone, cinématiques, lettre, transition) gardent leur colonne portrait,
centrée ; s'ils dépassent la hauteur, ils défilent au doigt (plus de colonne recentrée qui sort de l'écran).

## Étapes (une étape = un commit)

1. **Géométrie** (`portrait.js`, `mobile.js`, `style.css`) : `PORTRAIT.paysage`, largeur du canevas recomposé, décalage de
   la colonne (`region()` et boutons portrait), canevas plein écran (`100vw × 100dvh`), touchers convertis avec la
   largeur réelle. Le mobile (portrait comme paysage) passe par la recomposition ; l'ordinateur ne change pas.
2. **Poste** : jauges et équipes dans le rail gauche, onglets et actions dans le rail droit, colonne libre sur toute la
   hauteur.
3. **Bureau** : la pièce et les loupes dans la colonne, les objets en boutons dans le rail droit.
4. **Autres écrans** : normalisation générique (contenu ramené en haut s'il dépasse, défilement si besoin), menu
   principal compris.
5. **Mesure** : audit des textes et des cibles en px CSS (`petitesCiblesCSS`, prompt 214) en 915 × 412, 844 × 390 et
   740 × 360 ; non-régression en 412 × 915, 915 × 412, 1920 × 1080 et 1366 × 768. Captures avant / après dans
   `jeu/215-captures/`.

## Cible

- 0 défaut de texte A–E et T aux tailles mesurées.
- Paysage mobile : **0 cible sous 24 px CSS** hors contrôles qui ont un équivalent ≥ 44 px ; pas plus de cibles sous
  44 px qu'en portrait.
- Rien ne change sur ordinateur ; portrait inchangé.

## Contraintes

- Contraste ≥ 4,5:1, `prefers-reduced-motion`, pas de flash ; lecteur d'écran : le miroir HTML (prompt 210) reste la
  voie d'accès.
- `npm run build` puis `npm test` à chaque étape ; tests ajoutés dans `test-jeu.mjs`.
- Rapport `jeu/215-mobile-paysage.md` : chiffres avant / après, limites. Ressenti sur un vrai téléphone : [non renseigné].
