# Prompt 120 — Design : planche de comparaison des pistes de logo de « Nantes en régulation »

Demande d'origine (12/11/2026) :

> Je souhaite créer un logo pour ce jeu, je veux que tu me fasses des recommandations en te basant sur le jeu.
> → « Les 4 en planche »

## À produire

Une page autonome `site/public/logo/planche.html` (aucune image ni appel externe, polices du site) qui montre :

- le **logo actuel** (`LOGO_PXE`, ds.js) en référence ;
- **piste 1, le pin d'alerte** : marqueur de carte avec « ! » ;
- **piste 2, la bulle-pin** (recommandée) : bulle de dialogue à pointe de marqueur, « &#@! » en grand, « … » en petit ;
- **piste 3, l'écran de régulation** : le poste avec un pin et une Loire en escalier ;
- **piste 4, le logotype pixel** : « NANTES EN RÉGULATION » en lettres 3×5, accent du É en forme de pin, monogramme « NÉR ».

Chaque piste en 256, 48 et 16 px, sur fond sombre et sur fond clair, dans les six couleurs principales du
prompt 115, plus une simulation d'onglet de navigateur ; points forts et points faibles en texte.

## Contraintes

- Pixel art sur grille (16×16, ou 24×20 comme `LOGO_PXE`), une couleur principale + blanc + gris.
- Ni police Picon, ni identité Nantes Métropole, Naolib ou Semitan, ni monument ; aucune animation.
- Page lisible au clavier, sans défilement horizontal à 375 px.

## Suite

Le choix de la piste revient à l'équipe. La piste retenue sera codée au format `LOGO_PXE` dans un prompt suivant.
