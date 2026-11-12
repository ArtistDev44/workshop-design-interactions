# Prompt 105 — Jeu « Nantes en régulation » : l'appli principale en plein écran, sans barre des tâches

Demande d'origine (12/11/2026) :

> Je souhaite que l'appli soit en full screen sans barre des tâches.

Premier des cinq prompts 105 → 109, à exécuter dans l'ordre.

## Ce qui change

- **L'appli occupe tout l'écran du PC.** `FENETRE_APPLI` passe à l'échelle 1, à la position (0, 0) : la
  réduction à 91 % du prompt 50 et son ombre disparaissent.
- **Plus de barre des tâches** tant que l'appli (carte ou vue du menu) est ouverte.
  - La barre des tâches reste sur le bureau RégulOS (PC allumé, appli fermée).
- **Plus de barre de titre ni de croix** dans l'appli (`dessinerFermerAppli`) : on en sort par Échap, par
  « Quitter la journée » ou par « Quitter le PC », comme aujourd'hui.
- **Notifications du prompt 77 :** sans barre des tâches, elles reprennent leur place en haut à droite de
  l'écran.

## Ce qui ne change pas

- Toutes les coordonnées de l'appli (1920 × 1080). Les conversions de souris (`sourisAppli`, guide,
  portrait) passent par `FENETRE_APPLI`, donc elles suivent sans autre modification.
- Taille de texte minimale (`accessibilite.js`) et contraste ; clavier inchangé.

## Vérifications

- Carte, dossier, vues du menu : rien n'est coupé en bas, là où était la barre des tâches.
- Clics, glisser-déposer (cartes, jetons), molette : justes au pixel près.
- `npm run build`, `npm test`, audit des textes (`?audit=textes&parcours=1`) à 0 défaut.
- `journal.md`, `prompts/README.md`.
