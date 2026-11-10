# Prompt 29 — Jeu « Nantes en régulation », étape 16 : interactions hors écran, dans la pièce

Objectif : ajouter des **interactions en dehors du PC**, dans la pièce autour du poste —
reconnu comme pas évident à faire, donc conçu sobrement — sans toucher aux décisions
verrouillées Q1–Q61 ni à la boucle de jeu. Le joueur peut interagir avec quelques objets
de la vue bureau (hors de l'écran du PC) en plus de la porte (prompt 26) et des livres
(prompt 20).

S'appuie sur les prompts 14–28 (pièce entière et vue 3D du prompt 25, sortie du PC du
prompt 26, cadrage du bureau).

Fichiers concernés : `site/public/` (`bureau.js`, `sketch.js`, `immersion.js`, `confort.js`,
`i18n.js` pour les nouveaux textes), plus une mise à jour de `jeu/` et `journal.md`.

Règles absolues : tout nouveau texte passe par `t(...)` (`i18n.js`, prompt 24) en FR et
EN ; aucun fichier image ajouté (les objets restent dessinés par le code) ; aucune donnée
inventée (la fenêtre montre la vraie météo/heure du jour, comme l'horloge du prompt 20) ;
les interactions hors écran restent **secondaires** et ne remplacent jamais les actions du
jeu.

## 1. Principe : objets interactifs de la pièce

- En vue `bureau` (`vue === 'bureau'`), rendre cliquables **3 à 5 objets du décor** autour
  du PC, via la même mécanique que les objets existants (`boutons.push({...})` dans
  `bureau.js`) : ex. **lampe** (allumer/éteindre), **fenêtre / rideau** (voir dehors),
  **portemanteau**, **plante**, **tiroir du bureau**.
- Affordance sobre (reconnue comme peu évidente) : **surbrillance au survol** (contour
  discret, contraste ≥ 4,5:1) + curseur pointer + infobulle au clavier (focus Tab) ;
  l'aide (H) liste les objets interactifs.
- Un clic sur un objet déclenche une **micro-interaction** (1 à 3 lignes de texte via
  `t(...)`, ou un petit effet visuel/sonore) — jamais une décision de jeu.

## 2. Effets des interactions (légers, cohérents)

- **Lampe** : bascule allumée/éteinte ; la luminosité ambiante de la pièce change
  subtilement (teinte plus chaude/foncée), sans gêner la lisibilité de l'écran du PC ;
  état persisté dans `localStorage`.
- **Fenêtre** : ouvre/ferme le rideau et montre le **dehors réel** : météo du jour et heure
  réelle (mêmes sources que l'horloge du prompt 20, avec fallback local) ; aucun fait
  inventé.
- **Autres objets** (portemanteau, plante, tiroir) : courte réaction textuelle contextuelle
  (heure simulée de la journée, météo du moment), sans conséquence sur les jauges.
- `prefers-reduced-motion` : pas d'animation de transition sur ces interactions.

## 3. Frontières avec le reste du jeu

- Ces interactions ne mettent **pas la partie en pause** et n'affectent **pas les jauges**
  (la boucle de décision reste la seule source de conséquences chiffrées).
- Au poste (`vue === 'poste'`), les objets de la pièce restent visibles autour de
  l'écran (prompt 25) mais ne sont **pas cliquables** : on interagit hors écran depuis la
  vue bureau.
- Échap et la porte (prompt 26) continuent de fonctionner normalement.

## 4. Vérifications

- `npm run build` dans `site/`.
- Tester chaque objet : survol (surbrillance), clic souris, focus clavier + Entrée,
  infobulle, persistance de la lampe, fenêtre avec vraie météo/heure et fallback hors
  ligne, aucune pause du temps de jeu, aucune jauge modifiée.
- 1920×1080, FR + EN, clavier seul, `prefers-reduced-motion`, contraste ≥ 4,5:1, hors
  ligne / double clic local.
- Aucune régression Q1–Q61 ni des prompts 14–28.
- Documenter dans `jeu/16-interactions-hors-ecran.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-29-interactions-hors-ecran`. À chaque push : entrée en tête de
  `journal.md`. Ne pas fusionner dans `main` sans demande.
