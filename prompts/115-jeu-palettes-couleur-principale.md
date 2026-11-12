# Prompt 115 — Jeu « Nantes en régulation » : choisir la couleur principale du design system parmi des palettes prédéfinies

Demande d'origine (12/11/2026) :

> Pouvoir avoir une palette de couleurs prédéfinie pour changer la couleur principale du design system
> (ici elle est rouge).

## 1. Les palettes

| Palette | Primaire | Contraste du texte blanc sur la couleur |
|---|---|---|
| Rouge (défaut, Pixel DS) | `#D4031C` | 5,48:1 |
| Bleu | `#2F5BE0` | 5,69:1 |
| Vert | `#0A7D45` | 5,21:1 |
| Violet | `#7A3FD1` | 6,07:1 |
| Orange | `#B54800` | 5,40:1 |
| Turquoise | `#00777A` | 5,36:1 |

- Chaque primaire porte du **texte blanc à 4,5:1 au moins** (boutons primaires, menu actif, badges).
- Sur le fond `#0D0C0C`, chaque couleur reste au-dessus de 3:1, le seuil des composants d'interface.
- **Seule la couleur principale change.** Les couleurs fonctionnelles du DS gardent leur sens :
  - erreur `#D10B00` ;
  - succès, alerte, info ;
  - fond, blancs et leurs opacités.

## 2. Où se règle la couleur

- **Paramètres (H puis Paramètres, ou le menu principal) :** une rangée « Couleur principale » avec six
  pastilles.
  - Clic ou flèches gauche / droite, puis Entrée.
  - La pastille choisie a la double bordure de focus du DS.
- **Effet immédiat**, sans recharger.
- **Choix mémorisé** en local (`pxe-nte001-couleur`) et annoncé (`aria-live`) : « Couleur principale :
  bleu ».
- Le paramètre `?couleur=bleu` sert à tester, sans rien enregistrer.

## 3. Mise en œuvre

- **Un seul module, `theme.js`**, chargé juste après `ds.js` :
  - `PALETTES` ;
  - `Theme.appliquer(id)`, qui met à jour `DS.primaire`, `C.primaire`, la couleur primaire du menu
    principal et la variable CSS `--primaire` des éléments HTML (`style.css`) ;
  - `primaireRGBA(a)`, pour les fonds translucides.
- **Remplacer les rouges écrits en dur** (`#D4031C`, `rgba(212,3,28,…)`) par `DS.primaire` ou
  `primaireRGBA(…)` dans l'interface :
  - carte, Patron, guide, portrait, téléphone, mail ;
  - logo du jeu ;
  - notification de l'écran du bureau.
- **Restent rouges**, car ce sont des objets du décor et non l'interface :
  - le logo du café (tasse) ;
  - les jauges en erreur.
- L'audit de densité (`audit-densite.js`) mesure la surface de la **couleur primaire active**.

## 4. Vérifications

- Les six palettes passées en revue : menu principal, carte, fenêtre du plaignant, boutons, menu de
  gauche, Paramètres.
- Aucun rouge du DS ne reste dans l'interface, sauf les erreurs.
- Le choix tient après rechargement ; `?couleur=` ne l'écrit pas.
- `npm run build`, `npm test`, audit des textes à 0 défaut.
- Livrables :
  - `jeu/111-palettes.md` ;
  - `prompts/README.md` ;
  - une ligne en tête de `journal.md`.
