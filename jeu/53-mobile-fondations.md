# 53 — Mobile, sous-étape 60a : fondations (prompt 60)

Code : `mobile.js` ; appels dans `sketch.js` (`touchStarted`, `setup`), `micro.js` (`touchEnded`),
`bureau.js` (ombres, consigne), `style.css`, `index.html`. Ordinateur inchangé, règles Q1–Q61 intactes.

## Ce qui est fait
- **Détection** : `estMobile()` = pointeur grossier **et** petit côté de l'écran < 900 px, réévalué à
  chaque `windowResized` ; classe `mobile` sur `<body>` (styles mobiles seulement).
- **Gestes** (mobile seulement) : le clic part **au relâchement** — tap = clic ; **appui long** (≥ 500 ms)
  = info-bulle de l'objet, sans l'ouvrir ; **swipe vers le haut** au bureau = s'installer au PC, **vers
  le bas** au poste = se lever (comme la molette, prompt 38) ; au-dessus de la carte, le swipe zoome. La
  caméra fausse 3D reste désactivée au doigt. Les touchers sur un élément HTML (boîtes, avis) ne sont plus
  interceptés par p5.
- **Paysage** : le canevas 16:9 remplit l'écran réel (`100dvh`), zoom par pincement et double-tap
  désactivés (`touch-action: none`, viewport `user-scalable=no`, `viewport-fit=cover`), mode application
  (`apple-mobile-web-app-capable`). Consigne du bureau adaptée au doigt.
- **Portrait** : message HTML lisible « Tournez votre téléphone » (avec les gestes), bouton « Continuer en
  portrait » (cible ≥ 44 px). Il disparaît dès qu'on passe en paysage.
- **Clavier virtuel** : les boîtes HTML (journal de bord, import) suivent la zone visible
  (`visualViewport`) et le champ actif reste centré.
- **Performance** : moitié moins de gouttes de pluie et ombres tramées allégées sur téléphone.

## Reste à faire (60b)
- Mise en page portrait dédiée : `L` / `H` dynamiques, canevas 1080 × 1920, appli Régulation en panneaux
  empilés avec défilement, fenêtres bornées à la largeur, bureau recadré. Voir le prompt 60, « Découpage ».

## Vérifications
- `npm run build`, `npm test` (116 + 150 contrôles).
- Chromium : ordinateur 1920×1080 → `estMobile()` faux, aucune classe, canevas 1920 px, 140 gouttes
  (inchangé). Téléphone émulé en paysage (844×390, tactile) : tap sur le menu, swipe haut → poste, swipe
  bas → bureau, appui long sur le téléphone → info-bulle sans ouverture, tap → téléphone ouvert ; aucune
  erreur console. Portrait (390×844) : avis affiché, « Continuer en portrait » le ferme, rotation en
  paysage → mode paysage.
