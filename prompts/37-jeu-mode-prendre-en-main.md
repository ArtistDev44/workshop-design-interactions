# Prompt 37 — Jeu « Nantes en régulation », étape 24 : mode « Prendre en main » avec flèches

Objectif : lors de la **première partie**, proposer via une **option** un mode
**« Prendre en main »** : des **flèches** montrent, à chaque moment, ce qu'il est possible
de faire (cliquer l'écran du PC, choisir une action, ouvrir les applis, se lever, ouvrir
un livre…). Les décisions Q1–Q61 ne changent pas ; le guide ne fait jamais l'action à la
place du joueur.

S'appuie sur les prompts 34 (tutoriel du livre « Commande »), 35 (écran « Nouvelle
partie ») et 36 (applis, Indicateurs).

Fichiers concernés : `site/public/` (nouveau `guide.js`, `menu.js`, `sketch.js`,
`bureau.js`, `os.js`, `i18n.js`), plus `jeu/` et `journal.md`.

Règles absolues : textes via `t(...)` FR + EN ; contraste ≥ 4,5:1 (flèches jaunes à
contour sombre, bulles sombres à texte clair) ; `prefers-reduced-motion` (flèches fixes,
sans rebond) ; aucune pause imposée ; le guide se désactive à tout moment.

## 1. L'option
- Dans l'écran « Nouvelle partie » (prompt 35) : case **« Prendre en main (guidé) »**,
  cochée par défaut si aucune partie n'a encore été jouée, mémorisée en `localStorage`.
- Si le guide est actif, le tutoriel automatique du livre (prompt 34) n'est pas imposé
  au démarrage (il reste disponible dans le livre « Commande » et l'aide).

## 2. Les étapes guidées (une flèche + une bulle à la fois)
1. Au bureau : flèche vers **l'écran du PC** — « Cliquez sur l'écran pour vous installer ».
2. En attente d'incident : flèche vers **les jauges** — leur rôle, le temps qui accélère.
3. Dossier ouvert : flèche vers **les actions** (1 / 2 / 3 / 0) et vers **le compteur**.
4. Après la première décision : flèche vers **la croix de l'appli** puis vers **les applis
   du bureau RégulOS** (patron, carte, community, Indicateurs).
5. Flèche vers **« Quitter le PC »** — « Levez-vous pour voir la pièce ».
6. Au bureau : flèche vers **le livre « Commande »** et **les objets** de la pièce.
- Chaque étape se valide quand le joueur fait l'action (ou via « Étape suivante ») ;
  bouton / touche **G** pour arrêter le guide ; fin : « Vous avez pris en main ! »
  (`localStorage`, ne revient plus sauf si l'option est recochée).
- Les flèches suivent la caméra (prompt 25) et le zoom au poste ; elles pointent les
  vraies positions des éléments (relevées au moment où ils sont dessinés).

## 3. Vérifications
- `npm run build` et `npm test` ; parcours complet guidé au clavier et à la souris ;
  G arrête ; FR + EN ; `prefers-reduced-motion` ; aucune régression de la sauvegarde.
- Documenter dans `jeu/32-prendre-en-main.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-37-prendre-en-main`. À chaque push : entrée en tête de `journal.md`.
