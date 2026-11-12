# Prompt 115 — palettes de couleur principale

Date : 12/11/2026. Branche `jeu/110-111-textes-palette`.

## Palettes

Texte blanc sur la couleur, contraste mesuré :

| Palette | Couleur | Contraste |
|---|---|---|
| Rouge (défaut) | `#D4031C` | 5,48 |
| Bleu | `#2F5BE0` | 5,69 |
| Vert | `#0A7D45` | 5,21 |
| Violet | `#7A3FD1` | 6,07 |
| Orange | `#B54800` | 5,40 |
| Turquoise | `#00777A` | 5,36 |

## Mise en œuvre

- **`site/public/theme.js`** (nouveau, chargé après `ds.js`, mis en cache par le service worker) :
  - `PALETTES_COULEUR` ;
  - `Theme.appliquer` / `suivante` / `init` (appelé au début de `setup`) ;
  - `primaireRGBA(a)` ;
  - `selecteurCouleur`.
- **`Theme.appliquer`** met à jour `DS.primaire`, `C.primaire` et `MENU_C.bleu` (couleur primaire du menu
  principal), vide le cache des titres pixel et règle la variable CSS `--primaire`.
- **Réglage** dans les Paramètres : rangée « Couleur principale », 6 pastilles, touche C (Maj + C pour
  revenir en arrière). Les rangées passent de 80 à 72 px pour lui faire de la place.
  - Le choix est mémorisé (`pxe-nte001-couleur`) et annoncé.
  - `?couleur=bleu` sert à tester, sans rien écrire.
- **Rouges écrits en dur remplacés** :
  - guide (pastille) ;
  - mail du soir négatif ;
  - bouton HTML du Journal ;
  - boutons du portrait ;
  - onglet actif du bandeau ;
  - message important du patron ;
  - bulles du joueur au téléphone ;
  - écran du logo du jeu (canevas et écran de chargement HTML) ;
  - pastille du téléphone sur le bureau ;
  - `.sv-bouton` (CSS) ;
  - audit de densité (couleur active mesurée).
- **Inchangés :** les couleurs fonctionnelles (erreur `#D10B00`, succès, alerte, info) et le décor de la
  tasse de café.
- **Correctif au passage :** le nom `PALETTES` existait déjà dans `accessibilite.js` (daltonisme), et le
  doublon bloquait le chargement. Le module utilise donc `PALETTES_COULEUR`.

## Vérifié

- Navigateur, 1920 × 1080 :
  - en bleu : menu de gauche, boutons, bandeau et fenêtre du plaignant ;
  - en vert : Paramètres avec les 6 pastilles ;
  - en violet : audit des textes complet, 0 défaut.
- `npm run build` vert ; `npm test` : 491 + 550 contrôles réussis.
- Toutes les palettes sur tous les écrans, à l'œil et sur un vrai écran : [À COMPLÉTER].
