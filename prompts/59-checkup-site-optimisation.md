# Prompt 59 — Check-up exhaustif du site et optimisation (code + documentation)

Objectif : passer le dépôt en revue de bout en bout — **vérifier** que tout fonctionne réellement,
**optimiser** le code sans changer son comportement, et **harmoniser** documentation et code — avant
le rendu. Ne toucher ni aux décisions verrouillées du jeu (Q1–Q61) ni à la boucle de jeu : tout
refactor est **pur** (mêmes règles, mêmes tests verts).

Règles absolues : travailler en **français** ; aucun secret, clé ou token ; aucune donnée, œuvre ou
source inventée (inconnu → `"[À COMPLÉTER]"`) ; **aucune dépendance ajoutée** à `site/package.json`
(Astro reste la seule) ; le jeu reste **jouable hors ligne** (double clic sur `site/public/index.html`,
service worker, données de repli) ; branche dédiée, pas de fusion dans `main` sans demande ; à chaque
push, entrée en tête de `journal.md`.

## 1. Check-up — vérifications exhaustives (cocher chaque point, corriger ce qui cloche)
- **Build et tests** : `cd site && npm run build` puis `npm test` (`scripts/smoke.mjs` + `scripts/test-jeu.mjs`)
  passent sans erreur ; rejouer `test-jeu.mjs` après chaque modification.
- **Hors ligne** : double clic sur `site/public/index.html` → le jeu se lance ; mode « hors ligne forcé »
  → replis locaux (`data/fallback/`, `data/loire.js`, semaines enregistrées) utilisés sans erreur ni
  clignotement ; `sw.js` enregistré sans erreur console.
- **Navigation réelle** (menu → tutoriel → partie → décisions → fin → rejouer), sans erreur ni warning
  console, en FR et en EN : aucune clé i18n manquante (toutes les clés `t('…')` existent dans les blocs
  `fr` et `en` d'`i18n.js`, au même endroit) ; aucun `[À COMPLÉTER]` affiché hors attentes humaines
  documentées.
- **Accessibilité** : contraste ≥ 4,5:1 partout (texte du PC inclus), parcours complet au clavier avec
  focus visible, annonces `aria-live` présentes, `prefers-reduced-motion` / « Réduire les animations »
  → états figés, palettes daltonisme fonctionnelles, **pas de flash** (max 3 pulsations/s), textes
  du PC ≥ 20 px en fenêtre réduite.
- **Liens et métadonnées** : aucun lien interne cassé (build + crawl des pages servies), une seule URL
  canonique (`https://workshop-design-interactions.pages.dev/`), title/description/OG image/favicon/
  canonique/manifest valides, page `/cartel/` générée depuis le registre.
- **Performance et poids** : poids des assets servis (p5, audio CC0, images, `data/fallback/`) ;
  chargement initial raisonnable ; aucun appel réseau dans `draw()` (API uniquement au clic/lancement,
  avec délai borné et repli) ; canevas hors écran mis en cache quand prévu.
- **Sécurité et robustesse** : `grep -rn` aucun motif de secret (`api[_-]?key`, `bearer`, `password`)
  dans `public/` hors `lib/` ; gestion d'erreurs de chaque API (échec → repli, pas de crash) ; tailles
  d'écran testées (1920×1080 cible, 1280×720 minimum) ; partie sauvegardée/reprise (export JSON) valide.

## 2. Optimisation du code (comportement inchangé, `npm test` vert avant et après)
- **Factoriser les doublons** : ex. généraliser l'animation « objet pris en main » (`telephone-main.js`)
  à la tasse et au sablier ; mutualiser les dessins répétés (objets du bureau, ombres tramées).
- **Supprimer le code mort** : fonctions/variables non appelées, commentaires obsolètes, branches
  mortes ; ne garder que ce qui sert.
- **Harmoniser** : nommage cohérent (français, mêmes préfixes), taille des fonctions raisonnable,
  ordre des fichiers documenté, `index.html` (ordre des `<script>`) et `style.css` relus en entier.
- **Alléger** sans dépendance ajoutée : fusionner les petits helpers redondants, purger les données
  de repli inutiles, compresser les images si surpoids constaté (outils locaux, licences notées dans
  `audio/CREDITS.md` et équivalents).
- Chaque optimisation est un commit séparé, testé (`npm run build && npm test`) avant de passer à la
  suivante.

## 3. Harmonisation documentation ↔ code
- `jeu/README.md` : la table reflète tous les `jeu/*.md` existants ; chaque doc cite des symboles qui
  existent réellement dans `site/public/` (grep de contrôle).
- `prompts/README.md` : statuts ✅/◻ vérifiés un par un (✅ = preuve dans le code, citée) ; le compte
  de prompts annoncé dans `README.md` / `notes.md` correspond au tableau.
- `site/README.md`, `README.md`, `CONTRIBUTING.md`, `todo.md`, `notes.md` : URL canonique unique,
  `[À COMPLÉTER]` restants justifiés (saisie humaine du groupe), chaînes de build à jour.
- `grammar.md` et `source-sheet.md` : champs remplis, en s'appuyant sur `jeu/00-concept.md`.
- `journal.md` : une entrée en tête par push.

## 4. Rapport de check-up
- Rédiger le bilan dans `notes.md` (section « Check-up du 10/11/2026 » ou date du jour) : checklist
  cochée point par point, problèmes trouvés, corrections faites (avec commits), ce qui reste ouvert
  et pourquoi. Ne cocher que ce qui a été réellement exécuté et observé.

## Vérifications finales
- `cd site && npm run build && npm test` : OK après la dernière modification.
- `git diff` relu : aucun secret, aucune donnée inventée, aucun changement de règles Q1–Q61
  (`game.js` : diff vide ou purement cosmétique prouvé par les tests).
- Rapport de check-up présent dans `notes.md` ; `journal.md` à jour. Branche dédiée (ex.
  `vibe/prompt-59-checkup-optimisation`) ; pas de fusion dans `main` sans demande.
