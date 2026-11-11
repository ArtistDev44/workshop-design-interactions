# Contribuer à « Nantes en régulation »

Guide court pour modifier le jeu sans casser la chaîne **source → grammaire → système → œuvre**.
Les règles du projet sont dans `CLAUDE.md` ; la description du jeu, fichier par fichier, est dans `jeu/`.

## Règles communes
- **Aucune donnée inventée.** Un dossier, une plainte ou un événement vient d'une source réelle,
  datée et citée. Inconnu → `[À COMPLÉTER]`.
- Aucun secret, clé ou token. Le jeu doit rester **jouable hors ligne** (double clic sur
  `site/public/index.html`).
- Accessibilité : contraste ≥ 4,5:1, tout au clavier, `prefers-reduced-motion` respecté, pas de flash.
- Travailler sur une branche ; avant chaque push, dans `site/` : `npm run build` puis `npm test`.
- À chaque push, ajouter une ligne **en tête** du tableau de `journal.md` (date, commit,
  fichiers, résumé).

## Ajouter une semaine rejouée
Les semaines viennent des **archives publiques** (changelog GTFS Naolib, agenda de Nantes Métropole,
météo Open-Meteo ERA5). Le script est lancé à la main, jamais au build :

```sh
cd site
node scripts/preparer-semaines.mjs --lister                  # semaines les plus perturbées
node scripts/preparer-semaines.mjs --semaines 2025-09-22,…   # écrit data/semaines/{lundi}.json + semaines.js
```

- Le script **réécrit** `public/data/semaines.js` (chargé par `index.html`) avec les seules
  semaines passées en argument : y redonner les semaines existantes en plus de la nouvelle.
- Le **mode histoire** prend trois semaines dans l'ordre facile → normale → difficile
  (`semainesHistoire()` dans `public/histoire.js`) ; ajouter une semaine ne crée pas de chapitre.
- Vérifier avec `npm test` : `scripts/test-jeu.mjs` joue chaque semaine de bout en bout avec les vraies
  fonctions du jeu (`scripts/test-difficulte.mjs` demande en plus un navigateur Playwright et un `base.mjs` hors dépôt).
- Ne pas ouvrir à la main `public/data/fallback/` (instantané hors ligne, volumineux) :
  le régénérer avec `scripts/snapshot.mjs`.

## Ajouter un message (plainte d'usager)
1. Ouvrir `site/public/data/messages.json` et ajouter une entrée dans `plaintes`. Le champ
   `_lisezMoi` du fichier décrit chaque champ : `condition` (type, retard, ligne, pointe, météo),
   `texte` en `fr` et `en`, variables `{ligne}`, `{retard}`, `{nature}`, et au moins une
   réponse `bonne: true`. Effets bornés à ±15.
2. Lancer `npm run messages` (aussi lancé avant chaque build) pour régénérer `messages.js`.
3. Une plainte dont une variable n'existe pas pour le dossier joué n'est jamais proposée.

## Ajouter ou corriger une traduction
- Tous les textes passent par `t('clé')` (`public/i18n.js`). Le fichier a un bloc `fr: { … }`
  puis un bloc `en: { … }` : ajouter la **même clé dans les deux blocs**, au même endroit
  (près d'une clé voisine du même écran).
- Une clé absente en anglais retombe sur le français ; absente partout, elle affiche
  `[À COMPLÉTER]` (repérable à l'écran).
- Nouvelle langue : l'ajouter à `LANGUES` (fin de `i18n.js`) et créer son bloc, en
  partant d'une copie du bloc `en`.
- Variables : `t('tel.annonce', { n: 3 })` remplace `{n}` dans le texte.

## Ajouter un prompt
Les prompts `prompts/NN-*.md` décrivent chaque étape. En ajouter un = un nouveau fichier
numéroté et une ligne dans le tableau de `prompts/README.md` (`◻ prévu`, puis `✅` une fois fait).
La page `/making-of/` du site est générée depuis ce tableau au build.

## Service worker (hors ligne)
La liste des fichiers mis en cache dans `site/public/sw.js` est **générée** à chaque `npm run build` (ou `npm run sw`) par `scripts/generer-sw.mjs` : ajouter un fichier dans `public/` suffit, ne pas éditer la liste à la main.

## Dessiner du texte (règle du prompt 93)

- **Plusieurs lignes** : `dessinerTexte(texte, x, y, largeur, { taille, maxLignes, … })` ou `couperLignes` (`site/public/texte.js`). La coupure est réelle, et un texte tronqué finit par « … » après un mot entier, avec un moyen de lire la suite (« Lire tout », infobulle, volet).
- **Libellé court** (bouton, badge, titre) : `ajusterTaille(texte, largeur, tailleMax, tailleMin)`, sans descendre sous les minimums (corps 22 px, métadonnées 18 px, en coordonnées 1920×1080).
- **Cadre déclaré** :
  - un conteneur encadre son libellé avec `zoneTexteDebut(nom, x, y, l, h)` / `zoneTexteFin()`, ou déclare sa carte avec `zoneTexteDeclarer(nom, x, y, l, h)` ;
  - une zone défilante est déclarée avec `{ clip: true }`.
- **Interdit** :
  - un nouveau `text(…, x, y)` sans largeur dans une zone de taille fixe ;
  - une estimation `textWidth(...) * 1.05`.
- `npm test` refuse ces deux cas. Les exceptions (heures, chiffres, touches) sont plafonnées par fichier dans `scripts/test-jeu.mjs`.
- **Avant toute fusion qui touche l'interface** : ouvrir `index.html?audit=textes&parcours=1` (à 1920×1080, 1366×768 et en mobile portrait). Le rapport doit garder 0 défaut A à D (détail dans `jeu/89-textes-hors-cadre.md`).
