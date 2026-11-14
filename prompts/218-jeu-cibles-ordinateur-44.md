# Prompt 218 — Jeu : cibles de l'ordinateur à 44 px au moins

Origine : demande du 15/11/2026 (« fais aussi les cibles ordinateur à 44 px minimum »), après le prompt 217 (mobile).
Statut : **exécuté le 15/11/2026**.

## Référence

L'image du jeu fait 1920 × 1080 : à cette taille d'écran, 1 px de l'image = 1 px CSS. La cible est donc **44 px dans
l'image** (taille du design system). L'appli Régulation y est dessinée réduite (×0,9) : ses commandes passent à 50 px.

## Constat (1920 × 1080, mesure des cibles en px CSS, prompt 214)

81 cibles sous 44 px : jetons des équipes (41 px), + / − / Recentrer (43), « × » de la fiche (43 × 40), barre de
Mails (40), marqueurs de la carte (36), pastilles de couleur des Paramètres (40), objets de la pièce (webcam 61 × 37,
un objet de 233 × 42).

## Fait

- Jetons des équipes : 46 → 50 px (rangées de 52 → 56).
- + / − / Recentrer, marqueurs de la carte (zone de toucher), « × » de la fiche, barre de Mails : 50 px sur ordinateur
  (`hCible(50, …)`, le minimum mobile du prompt 217 est inchangé).
- Pastilles de couleur des Paramètres : 40 → 44 px.
- Objets de la pièce : zone cliquable de 44 px au moins dans chaque sens, centrée sur l'objet (le contour de survol
  reste autour de l'objet).

## Vérifié

- `npm run build`, `npm test` (+5 contrôles, tests 217 mis à jour).
- **1920 × 1080 : 0 cible sous 44 px CSS** (81 avant), 0 défaut de texte.
- 1366 × 768 : l'image entière est réduite à 0,71 ; 303 cibles entre 31 et 44 px CSS (médiane 32), **aucune sous
  24 px CSS** (minimum WCAG 2.5.8 AA), 0 défaut de texte. Atteindre 44 px CSS à cette taille demanderait des
  commandes de 62 px dans l'image : non fait (décision à prendre).
- Mobile inchangé : 0 cible sous 44 px CSS en 412 × 915 et 915 × 412.
