# Prompt 42 — Jeu « Nantes en régulation », étape 29 : le téléphone pris en main (animation réutilisable)

Objectif : la phase de messages fonctionne mal avec le téléphone (écran plein, sans lien
avec la pièce). Pour introduire l'expérience, **le joueur saisit son téléphone** : une
**animation réutilisable** fait monter le téléphone tenu en main au premier plan, devant la
pièce, et le dialogue se déroule dessus, comme dans la réalité.

## Attendu
- `leverTelephone()` / `baisserTelephone()` (nouveau `telephone-main.js`) : le téléphone
  monte du bas de l'écran, tenu par une main dessinée par le code (pouce, doigts, manche),
  légère inclinaison ; il redescend à la fin. Animations réduites : apparition directe.
- Le contenu de l'écran du téléphone est une fonction : **conversation** (bulles qui
  arrivent une à une, indicateur « … » en train d'écrire) ou **notifications** (prompt 38).
- Utilisations : intro de la première partie (Camille), ouverture des semaines 2 et 3
  (le patron présente le nouvel élément, prompt 41), clic sur le téléphone de la pièce
  (notifications de l'Agenda Nantes Métropole).
- Clavier : Entrée / Espace / clic = message suivant ; dernier message → « Poser le
  téléphone » ; Échap pour les notifications. Le temps du jeu est suspendu pendant une
  conversation (comme les SMS d'origine).

## Vérifications
- `npm run build`, `npm test` ; intro, semaines 2 et 3, téléphone de la pièce ; FR + EN ;
  clavier ; animations réduites.
- Documenter dans `jeu/38-telephone-en-main.md`. Fusion dans `main`.
