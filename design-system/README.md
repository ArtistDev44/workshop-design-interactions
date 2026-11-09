# design-system/ — Design system de Nantes Métropole

Contenu extrait automatiquement de https://metropole.nantes.fr/ avec l'outil
**dembrandt** (`npm i -g dembrandt`, v0.39.2) le 2026-11-09 :

```
dembrandt https://metropole.nantes.fr/ --save-output --design-md --html --slow
```

Fichiers :

- `DESIGN.md` — design system lisible (couleurs, typographie, espacements, motion, composants, breakpoints), généré par dembrandt.
- `metropole-nantes-fr.tokens.json` — tokens bruts complets au format JSON de dembrandt (couleurs, 54 styles de texte, 13 breakpoints, frameworks détectés : Drupal 11, jQuery 4.0.0, Splide).
- `report-metropole-nantes-fr.html` — rapport HTML autonome généré par dembrandt.

Remplace l'ancien `index.md` / `index.html` rédigés à la main. Pour régénérer : relancer la commande dembrandt ci-dessus puis recopier les sorties dans ce dossier.
