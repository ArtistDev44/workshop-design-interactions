# Prompt 32 — Jeu « Nantes en régulation », étape 19 : direction « moderne et épurée » du bureau

Objectif : faire évoluer le rendu de la pièce vers une direction **plus moderne et
épurée** — **murs blancs, moins de bois, beaucoup de blanc** — l'écran du jeu étant déjà
joli et conservé tel quel — sans toucher aux décisions verrouillées Q1–Q61 ni à la
boucle de jeu.

S'appuie sur les prompts 14–31 (décor pixel art de la pièce, cadrage « sur la chaise » du
prompt 31 à appliquer en même temps ou juste avant).

Fichiers concernés : `site/public/` (`bureau.js`, `style.css` si besoin, `i18n.js` si
nouveaux textes), plus une mise à jour de `jeu/` et `journal.md`.

Règles absolues : aucun fichier image ajouté (tout reste dessiné par le code, pixel art) ;
la lisibilité est prioritaire — contraste ≥ 4,5:1 entre les zones cliquables/survolées et
le fond, cibles de clic inchangées ; tout nouveau texte passe par `t(...)` FR + EN.

## 1. Nouvelle palette de la pièce

- Redessiner le décor de la vue bureau (`bureau.js`) dans une palette **claire et épurée** :
  murs blancs / blanc cassé dominant, **beaucoup moins de bois** (strictement nécessaire :
  plateau du bureau, éventuellement un détail), tons neutres et pastel légers pour le
  mobilier.
- Conserver les éléments validés : arbres par la fenêtre, porte (prompt 26), livres
  (prompt 20), objets interactifs (prompt 29) — redessinés dans la même palette claire.
- L'**écran du PC et le contenu du jeu à l'intérieur restent inchangés** (déjà jugés jolis).

## 2. Cohérence avec le reste

- La transition bureau ↔ poste (clignement d'œil du prompt 21) et le vignettage restent
  cohérents avec la nouvelle luminosité de la pièce.
- Les états de la lampe (prompt 29) : allumée = lumière chaude douce sur les murs blancs,
  éteinte = pièce plus sombre mais toujours lisible.
- `prefers-reduced-motion` inchangé (pas d'animation ajoutée).

## 3. Vérifications

- `npm run build` dans `site/`.
- Tester visuellement à 1280/1600/1920 px : murs blancs dominants, bois limité, contraste
  des textes et boutons ≥ 4,5:1, zones cliquables toujours visibles (survol), écran du
  PC inchangé ; FR + EN, clavier seul, hors ligne / double clic local.
- Aucune régression Q1–Q61 ni des prompts 14–31.
- Documenter dans `jeu/19-bureau-style-epure.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-32-bureau-style-epure`. À chaque push : entrée en tête de
  `journal.md`. Ne pas fusionner dans `main` sans demande.
