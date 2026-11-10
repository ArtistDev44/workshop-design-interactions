# 15 — Bureau moderne à la première personne et Pixel Design System sur le PC

## Pièce (bureau.js)
- **Vue depuis la chaise** : le plateau en chêne clair occupe le bas de l'image en perspective, le grand écran (bord fin noir, pied aluminium) est face au joueur, les **accoudoirs** de son fauteuil dépassent dans les coins. L'écran reste centré sur la page.
- **Modernisé** : open space avec **baie vitrée toute hauteur** (montants aluminium, reflets), clavier et souris sombres, lampe d'architecte, smartphone, horloge de bureau numérique (heure du jeu), tasse, petite plante, pile de dossiers, livres TUTO / STRESS.
- **Vue sur Nantes** : le **Château des ducs de Bretagne** (dessin original simplifié : courtine crénelée en tuffeau, tours rondes à mâchicoulis, grand logis aux toits d'ardoise à lucarnes, douves, pont) et la **grue Titan** jaune de l'île de Nantes, au bord de la Loire ; ciel selon l'heure du jeu et la météo réelle.
- La porte d'entrée n'est plus dans le champ (la vue est maintenant celle du joueur assis).
- Sieste en première personne : paupières qui s'alourdissent (bandes sombres) et « Z ».

## Pixel Design System (ds.js), appliqué au PC
Source : « Pixel Design System (Community) », PDF fourni par le groupe (non versionné dans le dépôt).
- Jetons : fond `#0D0C0C`, primaire `#D4031C`, blanc 100/75/50/15/05 %, succès `#00FB74`/`#BFFFDB`, alerte `#FFC138`/`#FFECC2`, erreur `#D1000B`/`#FFC5C2`, info `#3860FF`/`#C2CEFF` ; arrondi 0 ; unité 4 px ; espacements 2/4/8/16/20/24 px.
- Polices : titres « Bitsy Pixels » et texte « JetBrains Mono » si installées ; sinon titres rendus en vrais pixels (texte réduit puis agrandi ×4 sans lissage) et monospace système. Aucune police téléchargée.
- Composants : `dsBouton` (primaire, secondaire, contour, fantôme ; survol en double bordure), `dsBadge`, `dsPanneau`, `dsTitre`, `dsTexte`.
- Appliqué à : démarrage du PC (BIOS, logo carré rouge, progression par blocs), bureau du système (icônes, sélection, barre des tâches, bouton « REGUL »), **barre de titre de l'appli** (titre pixel + bouton fermer), **messagerie** (mail de fin de journée).
- L'intérieur de l'appli de régulation garde sa direction artistique (`11-direction-artistique.md`) : à étendre au design system si le groupe le souhaite.
