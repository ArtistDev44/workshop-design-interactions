# Prompt 176 — Jeu : la couleur d'accent choisie par le joueur s'applique partout

Demande d'origine (prise de notes du 12/11/2026) :

> Régler la couleur d'accent complètement sur la valeur choisie par l'utilisateur.

## À faire

1. **Inventaire** des couleurs d'accent codées en dur : `C.accent` (`sketch.js` ~l.17, blanc fixe), bleus / rouges
   de sélection dans `menu.js` (`carteMenu`, « liseré bleu »), `os.js`, `patron.js`, `community.js`, `journal.js`,
   `notifs-tel.js`, `taches-ui.js`, focus clavier, onglets actifs, interrupteurs, barres de progression.
2. Tout ce qui signifie **« sélectionné / actif / focus / lien / bouton principal »** lit la couleur d'accent de la
   palette active (`theme.js`, couleur principale et sa version translucide) — une seule source, aucun hexadécimal
   local.
3. **Ne pas** teinter les couleurs porteuses de sens : états des jauges (vert / orange / rouge), gravité, erreur,
   succès, couleurs des lignes du réseau.
4. **Contraste garanti** : pour chaque accent proposé, le texte posé dessus (blanc ou sombre, choisi
   automatiquement) atteint 4,5:1 ; l'accent sur le fond sombre atteint 3:1, sinon l'éclaircir pour l'usage en
   trait / texte.

## Vérifications

- Changer l'accent dans les paramètres : menu, pièce, PC, applis, téléphone, modales suivent immédiatement, sans
  recharger ; aucune zone restée dans l'ancienne couleur (captures des écrans principaux avec deux accents).
- Rapports de contraste de chaque accent listés dans le compte rendu.
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
