# Prompt 26 — Jeu « Nantes en régulation », étape 13 : sortie du mode PC

Objectif : offrir **plusieurs moyens explicites de quitter le PC**, au lieu du seul
raccourci Échap — sans toucher aux décisions verrouillées Q1–Q61 ni à la boucle de jeu.
Trois voies de sortie : un **bouton « Quitter le PC »** visible au poste, le **scroll**
(molette) au poste, et la **porte d'entrée/sortie du bureau** cliquable en vue bureau.

S'appuie sur les prompts 14–25 (bureau pixel art, immersion, i18n, vue 3D). Le raccourci
Échap reste fonctionnel partout ; on ajoute des affordances visibles.

Fichiers concernés : `site/public/` (`bureau.js`, `sketch.js`, `immersion.js`,
`i18n.js` pour les nouveaux textes), plus une mise à jour de `jeu/` et `journal.md`.

Règle absolue : tout nouveau texte passe par `t(...)` (`i18n.js`, prompt 24) en FR et EN ;
aucun fichier image ajouté (la porte est dessinée par le code, comme le reste du décor).

## 1. Bouton « Quitter le PC » au poste

- En vue `poste` (`vue === 'poste'`), afficher un **bouton visible « Quitter le PC »**
  (même style que les boutons existants du jeu, ex. « Changer de semaine (Échap) »),
  par ex. en bas à droite de l'écran, qui déclenche `seLever()` (retour au bureau).
- Le raccourci **Échap continue de fonctionner** identiquement ; le bouton est une
  affordance supplémentaire, pas un remplacement. L'aide (H) et les raccourcis listés
  mentionnent les deux.
- Bouton accessible au clavier (Tab + Entrée) et announced via la région `aria-live`.

## 2. Scroll (molette) pour quitter le PC

- En vue `poste`, un mouvement de **molette (scroll)** déclenche `seLever()`.
- Anti-rebond : un délai court (ex. 600 ms) entre deux déclenchements, pour éviter de
  quitter involontairement par un scroll continu ; aucun effet en vue bureau ni dans
  les menus/fenêtres (aide, paramètres, mail) où le scroll garde son usage normal.
- `prefers-reduced-motion` ne change rien ici (pas d'animation impliquée).

## 3. Porte d'entrée/sortie du bureau

- En vue `bureau`, ajouter une **porte cliquable** dans le décor pixel art
  (`dessinerPieceBureau()`, `bureau.js`) : dessinée en pixel art comme le reste de la
  pièce (ex. porte sur le côté de la pièce, visible grâce au dézoom du prompt 25),
  avec une zone interactive listée comme les objets existants (écran, livres).
- Cliquer sur la porte (ou Tab + Entrée) ouvre le **menu** existant (reprendre,
  paramètres, quitter) — c'est-à-dire la même action que Échap au bureau (prompt 20) —
  la porte sert de repère visuel « sortie » du bureau.
- Infobulle/aide contextuelle discrète au survol : `t('bureau.porte')` (« Porte — sortie »).

## 4. Textes et accessibilité

- Nouveaux textes (bouton, porte, aide) ajoutés dans `i18n.js` : clés explicites
  (`poste.quitter_pc`, `bureau.porte`, mise à jour de `aide.raccourcis`), FR + EN,
  fallback FR automatique.
- Contraste ≥ 4,5:1 pour le bouton et le texte de la porte ; focus clavier visible ;
  `aria-live` pour l'annonce ; aucun flash > 3/s.

## 5. Vérifications

- `npm run build` dans `site/`.
- Tester : bouton « Quitter le PC » au poste (clic + clavier), Échap au poste (inchangé),
  scroll au poste (quitte, anti-rebond), scroll dans l'aide (ne quitte pas), porte au
  bureau (clic + Tab/Entrée → menu), Échap au bureau (inchangé), `prefers-reduced-motion`,
  clavier seul, hors ligne, 1920×1080, FR + EN (aucun texte en dur).
- Aucune régression Q1–Q61 ni des prompts 14–25 (partie complète rejouée).
- Documenter dans `jeu/19-sortie-mode-pc.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-26-sortie-pc`. À chaque push : entrée en tête de `journal.md`.
  Ne pas fusionner dans `main` sans demande.
