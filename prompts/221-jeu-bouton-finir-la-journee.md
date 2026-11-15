# Prompt 221 — Jeu : bouton « Finir la journée » à côté de « Quitter le PC »

Origine : demande du 15/11/2026 (« pour la fin de journée, à côté du bouton "sortir du pc", rajouter un bouton "finir la
journée" »). Statut : **exécuté le 15/11/2026**.

## Constat

Au poste, le seul bouton de la pièce est « Quitter le PC (Échap) » (`bureau.js`, sous l'écran, à droite). Finir la
journée passe par la touche Q, l'horloge ou le menu d'objet : rien ne le montre au poste.

## À faire

1. Bouton secondaire **« Finir la journée (Q) »** à gauche de « Quitter le PC », même hauteur (50 px, ≥ 44 px CSS en
   1920 × 1080), même style (contour sur fond sombre). Action : `quitterJourneeRapide()` — fin de service atteinte → le
   soir ; avant l'heure → la fenêtre « Partir quand même ? » (malus expliqué) ; le soir → sortie du bureau.
2. Visible quand une journée est en cours (`journeeQuittable`) ; désactivé avec sa raison quand un choix attend
   (`raisonRetenuAuPC`, comme « Quitter le PC »).
3. Clavier : Tab au poste passe de « Finir la journée » à « Quitter le PC » ; Entrée active le bouton qui a le focus.
4. Textes FR + EN (`poste.finirJournee`), annonce lecteur d'écran.
5. Mobile (portrait, paysage) : le bouton suit « Quitter le PC » dans ses colonnes s'il y est ; sinon ne rien casser.

## Vérification

`npm run build`, `npm test` (contrôle : bouton dessiné, action `quitterJourneeRapide`) ; audit des textes et des cibles
à 0 en 1920 × 1080, 1366 × 768, 412 × 915.

## Fait

- `bureau.js` : `rectBoutonFinir`, `dessinerBoutonFinir`, `finirJourneeBouton` — bouton contour de 300 × 50 px, 16 px à
  gauche de « Quitter le PC », visible quand une journée est en cours et hors guide ; refusé avec sa raison si un choix
  attend (comme « Quitter le PC ») ; sinon `quitterJourneeRapide()`.
- `menu-app.js` : Tab au poste → entrées du menu → « Finir la journée » → « Quitter le PC » → aucun focus ; Entrée /
  Espace active le bouton qui a le focus (`sketch.js`) ; annonces FR + EN (`poste.finirJournee*`).
- Mobile : non ajouté (rangée d'actions déjà pleine : se reposer, se lever) ; la journée se finit par Q, l'horloge ou le menu.

## Vérifié

- `npm run build`, `npm test` (+3 contrôles).
- Chromium 1920 × 1080 : bouton à gauche de « Quitter le PC », même hauteur ; clic avant l'heure → « Partir quand même ? » ;
  cinq Tab → focus sur « Finir la journée ».
- Audit : 0 défaut de texte, 0 cible sous 44 px CSS en 1920 × 1080, 1366 × 768, 412 × 915.
