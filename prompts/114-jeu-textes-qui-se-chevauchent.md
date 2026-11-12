# Prompt 114 — Jeu « Nantes en régulation » : analyser tous les textes et supprimer les chevauchements

Demande d'origine (12/11/2026) :

> Je souhaite que tu analyses tous les textes, car certains textes se chevauchent. Je veux que ce soit
> arrangé.

Les prompts 102 à 109 ont beaucoup changé l'écran de jeu : carte plein écran, fenêtre flottante, panneau
des équipes, menu à gauche. L'audit du prompt 93 a été lancé surtout dans le petit panneau de test
(1024 × 768). Ce prompt refait l'analyse **sur la vraie taille** et ajoute les cas que l'audit ne voyait pas.

## 1. Analyse

- **Lancer `?audit=textes&parcours=1`** :
  - en **1920 × 1080**, puis en 1366 × 768 ;
  - en FR et en EN.
- **Compléter le parcours** avec les écrans nouveaux depuis le prompt 102, qui n'y étaient pas tous :
  - carte avec marqueurs et infobulle ;
  - fenêtre du plaignant avec « En savoir plus » ;
  - narration dans la fenêtre ;
  - panneau des équipes avec des équipes engagées ;
  - les 4 vues du menu.
- **Nouveau contrôle — texte caché sous un panneau :** un texte dessiné, puis recouvert en partie par un
  panneau opaque dessiné après lui (catégorie **F**). Exemple : la ligne d'état de la carte sous la fenêtre
  flottante.
- **Écrire le rapport** dans `jeu/114-textes-avant.json`. Il donne chaque défaut avec son écran, sa
  catégorie et le texte concerné.

## 2. Corrections (dans cet ordre de préférence, comme au prompt 93)

1. Déplacer le texte ou le panneau pour qu'ils ne se recouvrent plus (marges du DS : 8 / 16 / 24 px).
2. Agrandir la case qui contient le texte.
3. Couper proprement le texte, en entier, avec « … » et l'infobulle ou l'annonce qui donnent le texte complet.
4. Raccourcir le libellé dans `i18n.js`, en FR comme en EN, sans changer le sens.

**Interdit :**
- réduire une police sous la taille minimale (`accessibilite.js`) ;
- changer une règle de jeu ou une donnée.

## 3. Vérifications

- Audit relancé : **0 défaut A à F**, en FR et en EN, en 1920 × 1080 et en 1366 × 768. Rapport dans
  `jeu/114-textes-apres.json`.
- `npm run build` et `npm test` sont verts.
- Livrables :
  - le tableau avant / après dans `jeu/114-textes.md` ;
  - `prompts/README.md` ;
  - une ligne en tête de `journal.md`.
