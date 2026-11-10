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
- Vérifier l'équilibre avec `node scripts/test-difficulte.mjs`.
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
