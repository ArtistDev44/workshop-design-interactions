# Prompt 197 — Jeu : réorganisation UX du menu principal (langue au-dessus, pile plein écran · télécharger, rangée d'icônes livrables · dépôt · partage)

Demande d'origine (prise de notes du 13/11/2026) :

> Le switch FR / EN doit être au-dessus des boutons plein écran et télécharger. Juste en dessous, placer
> les 3 boutons en gardant seulement les icônes : livrables, dépôt git et partager. Le bouton Livrables
> doit se positionner en dessous des boutons situés à gauche, notamment le bouton Paramètres.

Dépend des prompts 170 (icônes Lucide), 171 (menu épuré, télécharger), 188 (Kit de presse),
193 (plein écran). Menu principal : `site/public/menu.js` (`dessinerMenuPrincipal`, `EXTRAS_MENU`).

## À faire

### 1. Pile en haut à droite (`menu.js`)

De haut en bas :

1. **Sélecteur de langue FR / EN** (position la plus haute).
2. **Bouton plein écran** (prompt 193) juste en dessous — passe de bouton texte à **icône seule**
   (Lucide `maximize` / `minimize` selon l'état, `fullscreenchange` conservé), libellé en infobulle
   et annonce lecteur d'écran.
3. **Icône télécharger** (prompt 171, Lucide `download`, installation PWA) en dessous.

Même largeur/hauteur de bouton pour les trois, alignés à droite, même marge au bord (80 px à 1920×1080),
écart vertical régulier (16 px). Le logo à gauche garde sa ligne de base du prompt 171.

### 2. Rangée de 3 boutons icônes seuls

Sous la pile, une rangée de **3 boutons affichant uniquement l'icône** (plus de libellé texte ni de bouton
pleine largeur) :

1. **Livrables** (prompts 136 / 138, ouvre `presentation/#/livrables?clicks=5`)
2. **Dépôt git** (prompt 81, `DEPOT_URL`)
3. **Partager** (prompt 81, panneau de partage)

Même style de bouton à icône que la pile, même taille, écart horizontal régulier. Les infobulles et
annonces aria-live existantes (`mp.*.infobulle`, `mp.*.annonce`) sont conservées : le libellé passe de
l'écran à l'infobulle. Les actions derrière les boutons ne changent pas.

### 3. Position de la rangée : sous les boutons de gauche

La rangée Livrables · Dépôt · Partager se place **en dessous de la colonne des entrées de gauche**
(Nouvelle partie, Reprendre, Paramètres…), **alignée sous le bouton Paramètres**, et non plus au-dessus
du pied de page. Livrables s'aligne à gauche sur la colonne, Dépôt et Partager suivent sur la même
rangée.

### 4. Kit de presse et Présentation (à trancher avant d'exécuter)

Hypothèse retenue : la rangée ne contient que les 3 boutons demandés, donc **« Kit de presse » (188) et
« Présentation » (81) sont retirés du menu principal**. Si le groupe veut les garder, les replacer
explicitement avant d'exécuter ce prompt (par exemple en infobulle ou dans les Crédits) ; sinon, retirer
aussi leurs entrées `EXTRAS_MENU`, leurs dessins et leurs régions, sans supprimer les fichiers
`kit-presse/` ni `/presentation/`.

### 5. Navigation clavier, portrait, i18n

- `EXTRAS_MENU` réordonné : ordre clavier ↑ ↓ / Tab = ordre visuel (pile, puis rangée).
- `portrait.js` : régions tactiles recalculées (pile verticale + rangée de 3), cibles ≥ 44 px.
- `i18n.js` : aucun nouveau texte ; vérifier que les libellés retirés de l'écran restent dans les
  infobulles FR / EN.

## Vérifications

- Captures 1920×1080 et 1366×768, FR et EN : FR / EN en haut, plein écran et télécharger en dessous ;
  rangée Livrables · Dépôt · Partager sous le bouton Paramètres ; icônes seules, infobulles correctes.
- Portrait mobile : pile et rangée utilisables au toucher.
- Navigation clavier complète, ordre visuel = ordre de tabulation ; F bascule toujours le plein écran.
- `npm run build` puis `npm test` verts ; audit des textes (`?audit=textes`) à 0 défaut A–D (3 tailles, FR/EN).
- `prompts/README.md` (ligne 197) et `journal.md` mis à jour au push.

## Hors périmètre (ne pas faire)

- Ne pas modifier `game.js` ni les règles Q1–Q61.
- Ne pas changer la direction artistique (palette, polices, Pixel DS).
- Ne pas modifier les actions des boutons (livrables, dépôt, partage, plein écran, installation).
