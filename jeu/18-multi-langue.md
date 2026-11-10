# 18 — Jeu multi-langue (prompt 24)

Décisions verrouillées. Le jeu se joue en français (langue par défaut) et en anglais. Une troisième langue s'ajoute sans toucher au code du jeu.

## Architecture
- `site/public/i18n.js` est chargé juste après p5 et avant `game.js`. Il contient :
  - `TRADUCTIONS` : un bloc par langue, avec les mêmes clés plates (`accueil.titre`, `jauge.fluidite`, `patron.budgetBas`…), 365 clés ;
  - `LANGUES` : la liste des langues proposées.
- `t(cle, variables)` : renvoie la chaîne de la langue active, avec interpolation `{variable}`. Si la clé manque dans cette langue, on prend le français ; si elle manque partout, on affiche `[À COMPLÉTER]`.
- `T(cle, variables)` : texte **différé**, traduit à chaque affichage. Il sert pour tout ce que le jeu stocke : messages du patron, commentaires, lignes du mail et du journal, narration, conseils, modificateurs, objectifs, malus, profil de fin. Un message déjà reçu change donc de langue avec le reste. `Liste(items)` joue le même rôle pour une liste de textes.
- `p5.text()` et `p5.textWidth()` acceptent directement ces textes différés.
- `Jeu.evaluer()` renvoie des codes (`bon`, `rate`, `aucun_detour`, `trop_tard`), traduits à l'affichage. Les couleurs du mail reposent sur des drapeaux, plus sur le texte.

## Langue active (`Langue`)
- Détection au chargement : `?lang=en` (un lien partagé l'emporte) → `localStorage` (`pxe-nte001-langue`) → `navigator.language` → `fr`.
  - Écart avec le prompt : celui-ci place `localStorage` avant l'URL. On met l'URL en premier, sinon `?lang=en` ne forcerait rien chez quelqu'un qui a déjà joué.
- `Langue.changer(code)` met à jour, sans rechargement ni perte de progression :
  - `document.documentElement.lang`, le titre de la page et l'`aria-label` de la scène ;
  - le `localStorage` ;
  - l'affichage. Jauges, dossier en cours et journal ne bougent pas.
- Sélecteur :
  - boutons `FR | EN` en haut à droite de l'accueil, et ligne « Langue » dans les Paramètres ;
  - touche **L** partout. Les boutons du jeu ne prennent pas le focus Tab, la touche L tient lieu d'accès clavier.

## Données réelles non traduites
Restent dans leur langue d'origine, quelle que soit la langue choisie :
- noms et numéros de lignes, lieux ;
- natures d'incidents, textes et noms des sources (agenda, changelog GTFS, Open-Meteo) ;
- pseudonymes des commentaires, nom de Camille, marque RégulOS ;
- étiquettes pixel « TUTO » et « STRESS » des livres, dessinées dans le décor.

Seuls les étiquettes d'interface et les textes écrits par le jeu sont traduits. Les données chargées et la graine `mulberry32` ne changent pas : à semaine égale, la partie est identique dans les deux langues.

## Accessibilité
- Région `aria-live="polite"` (`#annonces`), qui annonce dans la langue active :
  - chaque décision (titre et narration) ;
  - chaque message du patron (y compris l'alerte jauge < 20).
- Raccourcis inchangés : les chiffres et lettres ne sont pas traduits, L s'ajoute à la liste de l'aide.
- Pas de nouvelle image, pas de flash.

## Ajouter une langue
1. Copier le bloc `fr` de `TRADUCTIONS`, le traduire sous un nouveau code (par ex. `es`).
2. Ajouter `{ code: 'es', libelle: 'Español' }` à `LANGUES`. Le bouton apparaît tout seul.
3. Ajouter la locale de date dans la clé `locale` (`es-ES`).

Une clé oubliée retombe sur le français.

## Vérifié
Parcours en anglais (`?lang=en`) sur tous les écrans, en relevant chaque texte affiché :
- écrans parcourus : accueil, paramètres, aide, reset, menu, SMS, bureau, livre stress, dossier, 4 apps, narration, sieste, réveil, démarrage du PC, mail, fin ;
- aucune clé brute, aucun `[À COMPLÉTER]` ;
- le seul français restant vient des données réelles.

Passage EN → FR en pleine journée : jauges et index de dossier conservés, message du patron et narration retraduits. La langue reste choisie après rechargement. `npm run build` passe.
