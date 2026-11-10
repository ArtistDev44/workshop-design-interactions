# Prompt 21 — Jeu « Nantes en régulation », étape 8 : finitions visuelles et mail enrichi

Objectif : peaufiner la couche d'immersion du prompt 20 **sans toucher aux décisions
verrouillées Q1–Q61** (jauges, actions, fins inchangées) ni à la logique du bureau pixel art.
Trois ajouts de mise en scène, chacun détaillé étape par étape ci-dessous :

1. un **vignettage de flou** dans la vue bureau + le **centrage horizontal de l'écran du PC**
   quelle que soit la largeur de la page ;
2. une **animation de clignement d'œil** sur les transitions bureau → écran et écran → bureau ;
3. un **mail de fin de journée enrichi** qui intègre les événements externes avec
   l'évaluation de chaque décision.

## 0. Point de départ : lire le code existant avant toute modification

Fichiers concernés : `site/public/oeuvres/pxe-nte001-g01-w01/` (`bureau.js`, `sketch.js`,
`game.js`, `style.css`, `index.html`), plus une mise à jour de `jeu/` et `journal.md`.

Dans `bureau.js`, repérer et comprendre avant d'écrire quoi que ce soit :

- `let vue = 'bureau'; // 'bureau' | 'zoom-avant' | 'poste' | 'zoom-arriere'` (ligne ~20) et
  `let debutZoom = 0;` : ce sont les 4 états de la caméra. Aujourd'hui le zoom est
  **instantané** (`jeu/12-bureau-pixel.md` : « Animations réduites : le zoom devient
  instantané ») ;
- `dessinerVueBureau()` (ligne ~460) : dessine toute la scène bureau par-dessus le jeu ;
- `dessinerPieceBureau()`, `dessinerMur()`, `dessinerFenetre()`, `dessinerBureauBois()`,
  `dessinerPC(g)` (ligne ~382) : le PC est dessiné « légèrement à droite » et son écran fait
  576×324 à l'écran — c'est **cet écran qu'il faut centrer** ;
- `ombreTramee(g, x, y, l, h, alpha)` (ligne ~112) : utilitaire de trame déjà existant, à
  réutiliser pour le vignettage (aucun nouveau rendu coûteux) ;
- `sAsseoir()` (ligne ~541) et `seLever()` (ligne ~549) : basculent `vue` entre les états ;
  dans `sketch.js`, `keyPressed` (lignes ~1046–1052) appelle `sAsseoir()` sur Entrée/Espace
  au bureau et `seLever()` sur Échap au poste.

Règle absolue : rien n'est inventé côté données. Tout incident cité dans un texte (mail)
vient exclusivement des dossiers réellement joués pendant la partie (heure simulée, ligne,
retard, météo du moment, action choisie, deltas de jauges réels).

## 1. Vignettage de flou + centrage de l'écran du PC dans la vue bureau

### 1.1 Centrer l'écran du PC par rapport à la largeur de la page

Problème actuel : `dessinerPC` place le PC « légèrement à droite » (choix de cadrage de
`jeu/12-bureau-pixel.md`), donc à certaines largeurs de fenêtre l'écran du PC n'est pas
centré. Correction :

- Dans `dessinerPC(g)`, calculer la position horizontale du moniteur à partir de la largeur
  du canevas (dans la vue bureau, le décor fait `BW` pixels logiques, étiré sur la largeur
  de la fenêtre) : poser `pcX = (BW - largeurEcranLogique) / 2` pour que **le centre de
  l'écran du PC coincide avec le centre de la page**, et remplacer le décalage « à droite »
  par ce calcul. Les autres éléments du décor (fenêtre, plante, lampe) restent à leur place ;
  seul le PC se centre.
- Vérifier le centrage à 1280, 1600 et 1920 px de large : le milieu de l'écran du PC doit
  être à `width/2` à quelques pixels près.

### 1.2 Vignettage de flou

Le flou signale « clique ici pour entrer dans le jeu » : bords flous, centre (l'écran du PC)
net. En pixel art, on simule le flou par un **dégradé de trames sombres** sur les bords,
jamais par un vrai filtre GPU :

- Ajouter une fonction `dessinerVignettage(g)` appelée à la **fin** de `dessinerVueBureau()`
  (donc après tout le décor, PC compris) :
  - sur une bande de ~40 px logiques autour du canevas, tracer des trames de plus en plus
    denses vers l'extérieur avec `ombreTramee()` (espacement 4 px → 1 px), couleur sombre
    `#2b1d18` avec alpha croissant (ex. 0.15 → 0.55) ;
  - **laisser un « trou » net autour de l'écran du PC** : calculer le rectangle de l'écran
    (position centrée de 1.1 + taille 576×324 mise à l'échelle) et ne pas trammer dans ce
    rectangle (élargi de ~20 px de marge) ;
  - le vignettage est **statique** (pas d'animation de flou), donc compatible
    `prefers-reduced-motion` sans traitement spécial ; si une pulsation est ajoutée, la
    désactiver quand `prefers-reduced-motion` est actif.
- Le vignettage ne doit jamais masquer les éléments cliquables : les livres ressources et le
  texte d'aide restent lisibles (contraste ≥ 4,5:1 sur le texte et les icônes).

## 2. Clignement d'œil sur les transitions bureau ↔ écran

### 2.1 Mécanisme

Ajouter dans `bureau.js` une variable d'état de transition, par ex.
`let clignement = 0; // 0 = ouvert, 1 = fermé` et `let debutClignement = 0;`.

- `sAsseoir()` : au lieu de passer directement `vue` à `'zoom-avant'`/`'poste'`, lancer la
  séquence : `debutClignement = millis(); clignement = 0.0001;` puis, dans `draw()`, faire
  avancer `clignement` de 0 → 1 en ~150 ms (fermeture), puis de 1 → 0 en ~200 ms (ouverture),
  et **seulement à la réouverture** basculer `vue` vers `'poste'`. Durée totale ~350–400 ms.
- `seLever()` : même séquence en sens inverse, puis retour à `vue = 'bureau'`.
- Pendant la transition, le rendu dessine un **volet sombre plein écran** dont l'opacité suit
  `clignement` (forme de paupière : deux bandes qui se rejoignent au milieu, ou simple fondu
  au noir avec un arrondi — rester dans le style pixel art, ex. bandes horizontales de
  hauteur croissante).

### 2.2 Intégration avec le zoom existant

Les états `'zoom-avant'` / `'zoom-arriere'` existent déjà : conserver le zoom de caméra tel
quel, et **superposer** le clignement par-dessus pendant les ~400 ms (le clignement couvre
la coupure visuelle du changement de caméra). Ne pas allonger le zoom lui-même.

### 2.3 Accessibilité

- `prefers-reduced-motion` : remplacer le clignement par un fondu au noir simple de 150 ms
  (opacité 0→1→0), sans mouvement de paupières.
- Son : conserver le bip existant de changement de vue ; aucun son nouveau.
- Le clignement ne bloque jamais l'entrée : les entrées clavier (Entrée/Espace/Échap) restent
  actives, la transition est purement visuelle et non interruptible.

## 3. Mail de fin de journée : intégrer les événements externes et évaluer les décisions

### 3.1 Journaliser la journée pendant la partie

Dès qu'un dossier est traité (dans `Jeu.decider`, `game.js` ligne ~283), pousser une entrée
dans un tableau `Jeu.evenementsJournee` (créé dans `Jeu.nouvellePartie`, ligne ~229) :

```js
{ heure: '10:00',            // heure simulée du prompt 20, format HH:MM
  ligne: '4',                 // ligne réelle du dossier
  externe: 'trafic bloqué',   // événement externe réel (météo/affluence du dossier)
  retard: 12,                 // retard réel en minutes
  action: 'Bus de renfort',   // nom de l'action choisie
  deltas: { fluidite: -10, ... }, // deltas réels appliqués aux jauges
  meilleureAction: 'Bus de renfort' } // action qui aurait donné le meilleur delta
```

### 3.2 Format des lignes du mail

Le mail de fin de journée (prompt 20, affiché sur l'écran du PC avant l'écran de fin)
reprend ce journal et produit une ligne par événement marquant :

```
10:00 – Ligne 4 : trafic bloqué + retard 12 min → Bus de renfort (bon choix !)
10:15 – Ligne 5 : zone piétonne non anticipée → aucun détour → fluidité -10
```

Règles de rédaction :

- `heure – Ligne N : [événement externe] + retard X min → [action choisie] ([évaluation])` ;
- l'**évaluation** entre parenthèses est calculée, jamais inventée : comparer `deltas` de
  l'action choisie à ceux de `meilleureAction` — « bon choix ! » si identique ou meilleur,
  « raté » si moins bon, « aucun détour » quand aucune action ne convenait (meilleure action
  = « ne rien faire » ou tous les deltas négatifs), « trop tard » si le dossier a expiré sans
  décision ;
- si aucune action n'a été choisie : `→ aucune décision (trop tard)` ;
- en dessous de la liste, l'état des trois jauges en fin de journée avec leurs valeurs
  réelles, puis le bouton « Journée suivante » (comportement du prompt 20 inchangé).

### 3.3 Journée parfaite

Si aucun incident n'a été mal géré : mail court et positif, toujours ancré dans les
événements réels (ex. une seule ligne « Tout a été géré dans les temps, belle journée. »).

## 4. Vérifications détaillées

- `npm run build` dans `site/` (pas de captures d'écran répétées).
- Centrage : à 1280/1600/1920 px, mesurer que le centre de l'écran du PC ≈ `width/2`.
- Vignettage : bords sombres, écran du PC net, livres et textes lisibles.
- Clignement : tester Entrée/Espace au bureau et Échap au poste, dans les deux sens, avec et
  sans `prefers-reduced-motion` (émulation navigateur).
- Mail : partie avec au moins 3 dossiers traités dont un raté et un « aucun détour » ;
  vérifier que chaque ligne cite heure/ligne/retard réels et une évaluation correcte.
- Clavier seul, mode hors ligne (fallback), 1920×1080.
- Contraste ≥ 4,5:1 ; aucun flash > 3/s ; **aucun fichier image ajouté** (tout dessiné par le
  code, comme `bureau.js`).
- Documenter dans `jeu/14-immersion-visuelle.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-21-immersion-visuelle`. À chaque push : entrée en tête de `journal.md`.
  Ne pas fusionner dans `main` sans demande.
