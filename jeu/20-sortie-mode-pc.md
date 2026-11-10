# 20 — Sortie du mode PC (prompt 26)

> **Révision du 10/11/2026** : la porte du bureau et sa fonctionnalité sont **supprimées** (dessin, objet cliquable, textes `bureau.porte` / `objet.porte`). On sort du PC par le bouton « Quitter le PC », la molette ou Échap ; Échap au bureau ouvre toujours le menu.

Décisions verrouillées. On peut quitter le PC de trois façons visibles, en plus d'Échap qui ne change pas. Les décisions Q1–Q61 et la boucle de jeu restent les mêmes.

Note de numérotation : le prompt demandait `jeu/19-sortie-mode-pc.md`, mais le n° 19 est déjà pris par la vue 3D (prompt 25). Ce fichier prend donc le n° 20.

## 1. Bouton « Quitter le PC » (au poste)
- Il est dessiné par `dessinerBoutonQuitterPC()` (`bureau.js`) en bas à droite, dans la pièce, sous le moniteur. Il reprend le style des boutons du jeu (`bouton()`).
- Libellé : `poste.quitter_pc` (« Quitter le PC (Échap) » / « Leave the PC (Esc) »). Il remplace l'ancienne étiquette non cliquable « Échap : se lever ».
- Action : `quitterPC()` → `seLever()`, avec clignement d'œil et zoom arrière comme pour Échap.
- Clavier :
  - dans l'appli de régulation, Tab place le focus sur le bouton et l'en retire ;
  - sur le bureau RégulOS, le cycle Tab passe par les icônes puis par le bouton (Maj+Tab dans l'autre sens) ;
  - Entrée ou Espace active le bouton.
  - Le focus se voit à un cadre jaune `#f2c94c`. La région `aria-live` annonce `poste.quitter_pc_focus`.
- Contraste : texte `C.panneau` sur fond `C.accent`, la paire déjà validée pour les boutons du jeu (≥ 4,5:1).

## 2. Molette (au poste)
- `mouseWheel()` (`sketch.js`) → `scrollSortiePC()` (`bureau.js`).
- La sortie se déclenche au-delà de 100 de delta cumulé, avec un anti-rebond de 600 ms : un même geste de molette ne déclenche qu'une seule sortie.
- La molette ne fait rien en vue bureau, pendant un clignement, quand une fenêtre est ouverte (aide, paramètres, menu…), quand une app RégulOS est ouverte, pendant le mail de fin de journée, pendant le réveil ou pendant l'intro SMS. Dans ces cas, le scroll garde son usage normal.

## 3. Porte du bureau
- Le mur latéral gauche et sa porte sont dessinés en perspective par `dessinerPorte(g)` (pixel art), avec un pictogramme « sortie » vert au-dessus.
- Nouvel objet `porte` dans `OBJETS_BUREAU` (`immersion.js`). Ses coordonnées passent par `versEcranBureau()`, comme les autres objets : la zone suit donc le dézoom et la caméra du prompt 25.
- Clic, ou Tab puis Entrée → `ouvrir('menu')`, la même action qu'Échap au bureau.
- Infobulle au survol ou au focus : `bureau.porte` (« Porte — sortie (menu) »).

## 4. Aide
- Nouvelle ligne de l'aide : `aide.k.quitterTouche` / `aide.k.quitter` (« Échap / molette » → « Poste : quitter le PC · bureau : menu (ou la porte) »). L'interligne passe à 31 px.

## Vérifications
- `npm run build` OK.
- Test automatisé (Chromium, 1920×1080), sans erreur console :
  - porte au clic → menu ; porte au clavier (Tab ×4 puis Entrée) → menu ;
  - petite molette (40) → reste au poste ; molette (120) → bureau ;
  - bouton au clic → bureau ;
  - bureau RégulOS : Tab jusqu'au bouton, annonce `aria-live`, Entrée → bureau ;
  - appli : Tab puis Entrée → bureau ;
  - aide ouverte + molette → reste au poste.
