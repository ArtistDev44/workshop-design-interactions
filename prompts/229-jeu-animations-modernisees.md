# Prompt 229 — Jeu : des animations modernes, cohérentes et réduites sur demande

Origine : demande du 15/11/2026 (« modernise les animations »). Statut : **à exécuter**.

## Constat

- Les fenêtres (`ouvrir()`, `sketch.js`) apparaissent d'un coup : ni fondu, ni mouvement.
- Les boutons (`bouton()`) passent d'un état à l'autre sans transition (survol tout ou rien) ; l'appui n'a aucun retour.
- Changer d'appli (Carte, Mails, Community, Journal, Données) remplace la vue instantanément.
- Chaque fichier a ses propres durées et courbes (`easeOut` cubique partout, 180 à 1200 ms) : pas de langage commun.
- Existant à garder : jauges animées et juice des décisions (prompt 96), vidéo de fin (226), lettre (228).

## À faire

1. **Langage commun** (`mouvement.js`) : jetons de durée (`rapide` 120 ms, `normal` 220 ms, `lent` 420 ms) et de courbe
   (`sortie` = ease-out cubique, `entreeSortie` = ease-in-out cubique, `ressort` = ease-out-back léger), documentés
   dans `design-system/DESIGN.md` ; une aide `Mouvement.progres(cle, duree, courbe)` qui repart quand la clé change, et
   `Mouvement.survol(cle, actif)` (valeur 0 → 1 lissée).
2. **Fenêtres** : à l'ouverture, voile en fondu et fenêtre qui monte de 16 px en grandissant de 97 % à 100 %, sur
   `normal` / `sortie`. Les zones de clic restent justes (animation courte, aucune action avant 60 %).
3. **Boutons** : survol lissé (`rapide`) — fond et double bordure en fondu ; appui : enfoncement de 2 px pendant 90 ms.
4. **Changement d'appli** : la vue entrante glisse de 12 px et apparaît en fondu (`normal`).
5. **Vidéo de fin** : léger zoom lent continu (100 % → 104 %) sur chaque séquence.
6. **Accessibilité** : animations réduites (réglage ou `prefers-reduced-motion`) → tout est instantané ; aucun
   clignotement ; rien ne bouge plus de 16 px.

## Vérification

`npm run build`, `npm test` (jetons, courbes bornées à [0, 1] et finissant à 1, mode réduit instantané, ouverture des
fenêtres et boutons branchés) ; audit des textes et des cibles à 0 en 1920 × 1080, 1366 × 768, 412 × 915, 915 × 412 ;
essai Chromium : ouverture d'une fenêtre (images à 0, 110 et 260 ms), survol d'un bouton, passage Carte → Mails.
