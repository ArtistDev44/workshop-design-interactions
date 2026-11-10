# Prompt 24 — Jeu « Nantes en régulation », étape 11 (dernier prompt) : jeu multi-langue

Objectif : rendre le jeu **jouable en plusieurs langues** — français (par défaut) et anglais,
avec une architecture qui permette d'en ajouter une troisième sans toucher au code — sans
modifier les décisions verrouillées Q1–Q61 ni la boucle de jeu de la salle de contrôle :
dictionnaire de chaînes externalisé, sélecteur de langue, persistance, attribut `lang`
dynamique et accessibilité des textes. S'appuie sur l'ensemble des prompts 14–23 (bureau
applicatif, jauges **Fluidité / Réputation / Budget**, conseils, modificateurs, fins).

## 0. Point de départ : lire le code existant avant toute modification

Fichiers concernés : `site/public/` (`sketch.js`, `game.js`, `bureau.js`, `confort.js`,
`index.html`, `style.css`, nouveau `i18n.js`), plus une mise à jour de `jeu/` et
`journal.md`.

Repérer dans le code actuel :

- `game.js` : `Jeu.narrer()` (ligne ~342) produit les textes de résultat, `Jeu.ton()`
  (ligne ~336), `LIBELLES_JAUGES` (ligne ~167), `Jeu.conseil()` (prompt 23), la table des
  malus et les dialogues du patron (prompt 23).
- `sketch.js` : écran d'accueil (sélection des semaines), zone dossier avec les 3 actions +
  « ne rien faire » et le bouton « Dossier suivant » (lignes ~780–805), panneau des jauges
  (ligne ~543), écran de fin + bilan (lignes ~806–880), aide (ligne ~1182).
- `bureau.js` : les 4 apps du bureau (Messages du patron, Carte, Community manager, Journal)
  et leurs textes (prompt 22).
- `confort.js` : écran Paramètres, aide, raccourcis, meilleur bilan `localStorage`
  (prompt 18).
- `index.html` : `<html lang="fr">` et textes statiques éventuels.

Règle absolue : aucune traduction n'invente de fait. Les noms propres et les données réelles
(lignes, lieux, incidents issus des API ou du fallback) restent dans leur langue d'origine ;
seules les **étiquettes d'interface** et les **textes écrits par le jeu** sont traduits.

## 1. Architecture i18n

### 1.1 Dictionnaire unique

- Nouveau fichier `i18n.js` chargé avant `game.js` dans `index.html` :

  ```js
  const TRADUCTIONS = {
    fr: { /* clés plates ou imbriquées, ex. 'actions.detourner': 'Détourner' */ },
    en: { /* mêmes clés, traduction fidèle */ },
  };
  const LANGUES = [ { code: 'fr', libelle: 'Français' }, { code: 'en', libelle: 'English' } ];
  ```

- Fonction globale `t(chemin, variables)` : retourne la chaîne de la langue active, avec
  interpolation `{variable}` ; si la clé manque dans la langue active, **retombe sur le
  français** ; si elle manque partout, retourne `"[À COMPLÉTER]"` (règle du dépôt : jamais de
  chaîne vide ni de clé affichée telle quelle).

### 1.2 Langue active

- `Langue.actuelle` (`'fr'` par défaut) ; `Langue.changer(code)` met à jour la variable,
  `document.documentElement.lang`, le `localStorage` (clé `pxe-nte001-langue`) et **re-rend
  l'écran courant sans réinitialiser la partie en cours** (les jauges, le dossier en cours et
  `Jeu.evenementsJournee` sont conservés).
- Ordre de détection au chargement : `localStorage` → paramètre d'URL `?lang=en` →
  `navigator.language` (préfixe `en` → anglais, sinon français) → `'fr'`.
- Toutes les chaînes affichées passent par `t(...)` : boutons d'action, « ne rien faire »,
  jauges, conseils (prompt 23), apps du bureau (prompt 22), messages du patron, mails de fin
  de journée (prompts 20–21), fins et bilan, aide, paramètres, toasts et annonces.

## 2. Couverture des textes

- Lister **toutes** les zones de texte du jeu (écrans 14–23) et les sortir dans
  `TRADUCTIONS` avec des clés explicites (`accueil.titre`, `jeu.action1`, `jauge.fluidite`,
  `patron.budget_bas`, `fin.bonne`, `aide.titre`, `parametres.langue`, etc.). Aucun texte en
  dur en français ne doit rester dans `sketch.js`, `game.js`, `bureau.js`, `confort.js` hors
  `i18n.js`.
- Textes générés avec variables (narrer, conseils, bilan) : la **structure** de la phrase
  est traduite (ordre des mots inclus), les variables (`{ligne}`, `{retard}`, `{valeur}`)
  restent des données réelles non traduites.

## 3. Données réelles non traduites

- Noms de lignes de tram/bus, stations, lieux nantais, intitulés d'incidents et contenus des
  dossiers (API GTFS-RT, Open-Meteo, fallback) : affichés tels quels, quelle que soit la
  langue (ce sont des noms propres / données brutes).
- Le sélecteur de langue n'a aucun effet sur les données chargées ni sur la graine
  déterministe (`mulberry32`) : la partie reste identique, seules les étiquettes changent.

## 4. Sélecteur de langue

- **Écran d'accueil** : boutons `FR | EN` visibles (même style que les semaines), actifs au
  clavier (Tab + Entrée) et au clic.
- **Paramètres** (`confort.js`, prompt 18) : même sélecteur, labelled via `t('parametres.langue')`.
- **URL** : `?lang=en` force l'anglais au chargement (utile pour un lien partagé) ; la
  préférence est ensuite persistée.
- Changement de langue **en cours de partie** : re-rendu immédiat, aucun rechargement de
  page, aucune perte de progression ; test avec une partie commencée en français passée en
  anglais au milieu d'une journée.

## 5. Accessibilité

- `document.documentElement.lang` toujours synchronisé (`fr` / `en`) pour les lecteurs
  d'écran.
- `aria-label`, `title` et annonces de la région `aria-live` (alertes jauge < 20, annonces
  de décision) passent par `t(...)` dans la langue active.
- Raccourcis clavier inchangés (1/2/3, 0/Espace, H, P, M, R…) : les chiffres ne sont pas
  traduits. Contraste ≥ 4,5:1 et `prefers-reduced-motion` inchangés ; aucun nouveau flash.

## 6. Extensibilité

- Ajouter une troisième langue doit se faire **uniquement** en ajoutant un bloc au
  dictionnaire et une entrée à `LANGUES` (plus un bouton) : aucun `if` de langue dispersé
  dans le code du jeu. Le fallback français couvre toute clé manquante.

## 7. Vérifications détaillées

- `npm run build` dans `site/`.
- Parcours complet en français puis en anglais : accueil, semaine choisie, salle de contrôle,
  3 actions + « ne rien faire », dossier suivant, jauges, conseil contextuel, bureau + 4 apps,
  modificateur (annonce comprise), fin de journée (mail), écran de fin et bilan, aide,
  paramètres — aucune chaîne en dur restante, aucune clé affichée, aucun `[À COMPLÉTER]`.
- `?lang=en` au chargement ; persistance après rechargement ; changement en cours de partie
  sans perte de progression ; `document.documentElement.lang` correct.
- Données réelles identiques dans les deux langues (mêmes dossiers, mêmes valeurs) ; graine et
  semaines inchangées.
- Accessibilité : clavier seul dans les deux langues, `aria-live` annonce dans la langue
  active, contraste ≥ 4,5:1, `prefers-reduced-motion`, hors ligne (fallback compris),
  1920×1080, aucun fichier image ajouté, aucun secret.
- Aucune régression des décisions verrouillées Q1–Q61 et des comportements des prompts
  14–23 (rejouer une semaine complète en anglais).
- Documenter dans `jeu/17-multi-langue.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-24-multi-langue`. À chaque push : entrée en tête de `journal.md`.
  Ne pas fusionner dans `main` sans demande.
