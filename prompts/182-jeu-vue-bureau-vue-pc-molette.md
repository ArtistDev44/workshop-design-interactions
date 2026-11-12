# Prompt 182 — Jeu : distinguer la vue bureau de la vue PC ; molette de sortie seulement sans choix en cours

Demande d'origine (prise de notes du 12/11/2026) :

> Différencier le mode bureau et le mode pc (dans le mode bureau, aucune interaction avec l'application). Le scroll
> pour sortir du pc doit se faire quand il n'y a pas de choix.

Fichiers : `bureau.js` (`vue === 'bureau'` / `'poste'`, sortie du PC ~l.1006–1040), `sketch.js` (`mouseWheel`
~l.1338), `mobile.js` (balayage vertical), `glisser.js`.

## À faire

1. **Vue bureau** (`vue === 'bureau'`, assis en retrait) : **aucune interaction avec l'application** affichée sur le
   moniteur — ni clic sur un marqueur, un bouton ou une appli, ni survol / infobulle, ni raccourci de l'appli. Le
   moniteur n'est qu'un objet de la pièce : un clic dessus (ou Entrée) **installe le joueur au PC**. Les objets de
   la pièce (téléphone, tasse, livre) restent interactifs.
2. **Vue PC** (`vue === 'poste'`) : seules l'application et la barre du PC sont interactives ; les objets de la
   pièce ne le sont plus.
3. Rendre la différence **lisible** : en vue bureau, l'écran du moniteur est légèrement assombri ou sans curseur
   actif, avec l'invite « S'installer au PC » ; pas de nouveau texte permanent en vue PC.
4. **Molette / balayage vers le bas pour quitter le PC** : actif **uniquement quand aucun choix n'attend le
   joueur** (pas de dossier ouvert en `decision`, `contradiction` ou `conflit`, pas de modale). Pendant un choix, la
   molette fait défiler le contenu ou ne fait rien — jamais de sortie involontaire. Le bouton « Quitter le PC »
   suit la même règle (désactivé avec sa raison, ou confirmation).
5. Clavier et mobile : mêmes règles (`mobile.js`, balayage vertical).

## Vérifications

- Vue bureau : cliquer sur un marqueur de la carte n'ouvre rien et installe au PC ; vue PC : le téléphone ne
  répond pas.
- Dossier ouvert : dix crans de molette vers le bas ne font pas quitter le PC ; dossier fermé : un cran suffit.
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
