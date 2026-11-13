# Prompt 199 — Menu principal : pile FR / EN · plein écran · télécharger, rangée de 5 icônes sous Paramètres

Date : 13/11/2026. Branche `199-jeu-menu-reorganisation-boutons-icones`.
Demande d'origine (prise de notes du 13/11/2026) : « Le switch FR / EN doit être au-dessus des boutons plein
écran et télécharger. Juste en dessous, placer les 3 boutons en gardant seulement les icônes : livrables,
dépôt git et partager. Le bouton Livrables doit se positionner en dessous des boutons situés à gauche,
notamment le bouton Paramètres. »

## Ce qui change (`site/public/menu.js`, `portrait.js` ; aucun texte ajouté ni retiré dans `i18n.js`)

- **Pile en haut à droite**, de haut en bas : sélecteur FR / EN, plein écran (icône seule `maximize` /
  `minimize`, prompt 193), télécharger (`download`, prompt 171). Même largeur que le sélecteur
  (`LARGEUR_PILE()` = 2 × 84 + 8 = 176 px), même hauteur (60 px), bord droit à 80 px, 16 px d'écart.
  L'infobulle (libellé + raccourci) s'affiche **à gauche** du bouton, sous lui elle couvrirait le suivant.
- **Rangée de 5 boutons à icône seule** (68 × 68 px, 16 px d'écart) : Livrables, Kit de presse, Présentation,
  Dépôt, Partager, alignée à gauche sur la colonne des cartes, **24 px sous Paramètres** (jamais sur le pied de
  page : la pile des cartes s'arrête 24 px au-dessus de la rangée). Le libellé passe dans l'infobulle, à droite
  de la rangée : « Livrables — Ouvrir la diapositive des livrables du projet (nouvel onglet) ». Annonces
  lecteur d'écran (`mp.*.annonce`) et actions inchangées.
- **Kit de presse et Présentation gardés** (choix du 13/11/2026, au lieu de l'hypothèse du § 4 du prompt
  qui les retirait) : ils rejoignent la rangée d'icônes, entre Livrables et Dépôt (icônes `newspaper` et
  `presentation`), et ouvrent toujours `./kit-presse/` et `./presentation/` dans un nouvel onglet.
- **Ordre clavier = ordre visuel** : cartes, puis pile (plein écran, télécharger), puis rangée (Livrables,
  Kit de presse, Présentation, Dépôt, Partager), puis retour à « Nouvelle partie ». Le sélecteur de langue reste à la souris / au toucher
  et par les Paramètres, comme avant. F bascule toujours le plein écran.
- **Portrait mobile** : pile et rangée ont leurs propres régions, agrandies ×2 (cibles ≥ 44 px à l'écran
  sur 412 px de large) ; colonne du menu jusqu'à Paramètres, puis la rangée, puis le pied de page.
- En exposition (prompt 160) : FR / EN seul en haut, pas de rangée.

## Vérification

- `test-jeu.mjs` : tests 171, 188 et 193 mis à jour, bloc 199 (ordre des extras, pile, largeur commune,
  rangée de 5 sous les cartes, icône seule, libellé dans l'infobulle, Kit de presse et Présentation gardés,
  régions portrait, clés FR / EN).
- Captures 1920×1080 (FR, focus Livrables), 1920×1080 (EN, focus plein écran), 1366×768 et portrait 412 px
  vérifiées.
- `npm run build` puis `npm test` verts ; audit des textes `?audit=textes&parcours=1` à **0 défaut** à 1920×1080, 1366×768 et 412×915 (FR + EN), aucune erreur de page.
