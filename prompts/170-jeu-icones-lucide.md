# Prompt 170 — Jeu : intégrer la librairie d'icônes Lucide

Demande d'origine (prise de notes du 12/11/2026) :

> Intégrer une librairie d'icone -> lucide.

À exécuter **avant** les prompts 171, 175, 185 et 186, qui ajoutent des icônes.

## À faire

- **Sans réseau ni nouvelle dépendance d'exécution** (CLAUDE.md : site relançable hors ligne, seule dépendance
  `astro`) : pas de CDN. Copier dans le dépôt un **sous-ensemble** des icônes Lucide (tracés SVG 24×24, trait 2 px)
  dans un fichier unique `site/public/icones-lucide.js` (table `nom → tracés`), avec la licence ISC de Lucide en
  en-tête et dans `site/public/licences/` ; l'ajouter au cache de `sw.js` et à la liste des scripts de `index.html`.
- Une fonction de dessin unique pour le canvas p5, par exemple `iconeLucide(nom, x, y, taille, couleur)` (tracé via
  `Path2D` sur `drawingContext`, épaisseur de trait proportionnelle à la taille, extrémités arrondies), utilisable
  dans tous les espaces de dessin (menu, pièce, écran du PC, téléphone).
- Remplacer par Lucide les **icônes d'interface** dessinées à la main : `iconeMenu` et `iconeReseau` (`menu.js`),
  `PICTOS` (`patron.js`), `ICONES_TEL` (`notifs-tel.js`), les pictogrammes texte (`□`, `☾`, `⏱`, `⚠`, `✕`, flèches)
  employés comme icônes de bouton. Garder le **pixel art** pour le décor et les objets de la pièce
  (`bureau.js`, `iconePixel` des applis si le groupe le préfère : le signaler dans le compte rendu).
- Créditer Lucide (nom, licence ISC, lien) dans `credits.js` et dans la page des sources du site.
- Documenter l'usage dans `design-system/DESIGN.md` : tailles autorisées (16, 20, 24, 32), couleur héritée du texte,
  jamais d'icône seule sans `aria-label` / infobulle.

## Vérifications

- Jeu lancé **hors ligne** (service worker) : toutes les icônes s'affichent.
- Contraste des icônes ≥ 4,5:1 sur leur fond ; chaque bouton à icône seule a une infobulle et une annonce.
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
