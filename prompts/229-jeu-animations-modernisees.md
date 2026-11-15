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

## Fait

- `site/public/mouvement.js` (nouveau) : `Mouvement.DUREES` (120 / 220 / 420 ms), `COURBES` (sortie, entreeSortie,
  ressort, linéaire), `progres`, `survol`, `appuyer` / `enfoncement` ; ralenti possible par le mode dev (prompt 230).
  Section « Mouvement » ajoutée à `design-system/DESIGN.md`.
- Fenêtres (`sketch.js`, `dessinerFenetre`) : voile et fenêtre en fondu, montée de 16 px, 97 → 100 % ; clics ignorés
  avant 60 % de l'ouverture (`fenetreEnOuverture`).
- Boutons (`bouton`) : survol lissé (fond, double bordure), enfoncement de 2 px à l'appui (90 ms) ; la zone de clic
  reste à sa place.
- Applis (`entreeVueApp`, `menu-app.js`) : Carte, Mails, Community, Journal, Données entrent en glissant de 12 px.
- Vidéo de fin (`fins-video.js`) : zoom lent 100 → 104 % par séquence.
- Animations réduites : tout instantané. Non modifié : jauges et juice (prompt 96), lettre (228), cinématiques internes.

## Vérifié

- `npm run build`, `npm test` (+6 contrôles : courbes bornées et finissant à 1, jetons, transition qui repart, mode
  réduit instantané, fenêtres, boutons, applis, vidéo, section du design system).
- Chromium : ouverture des Paramètres mesurée — 0,04 à 10 ms, 0,49 à 110 ms (clics bloqués), 0,97 à 216 ms, 1 à 323 ms.
- Audit : 0 défaut de texte, 0 cible sous 44 px CSS en 1920 × 1080, 1366 × 768, 412 × 915, 915 × 412.
