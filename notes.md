# notes.md — Notes de travail du dépôt

Notes libres du projet : une page prête pour le wiki, les liens des API utilisées, et des pistes pour les animations.

## Page wiki (à copier-coller sur le wiki du dépôt)

```markdown
# PATRIMOINE.EXE · NTE001 — Site web de l'atelier

Bienvenue sur le wiki du dépôt `workshop-design-interactions`.

En ligne : https://workshop-design-interactions.pages.dev/ (jeu « Nantes en régulation » servi à la racine).

**Édition** : PXE · NTE001 · ESD Nantes · B3 Design — 9, 10 & 12 novembre 2026.
Intervenant : Kamel Ghabte. Groupes de 2 à 3 étudiants.

## Chaîne à tenir

source → grammaire → système → œuvre

Une source réelle avant un style. Un système stable avant une technologie
supplémentaire. Un mapping justifié avant une API.

## Fichiers de référence

- `todo.md` — protocole des 3 jours, jalons, checklist de robustesse et barème.
- `contexte/` — livret étudiant, framework PATRIMOINE.EXE, règles de travail.
- `prompts/` — 64 prompts numérotés (01 à 63, deux prompts 33) pour créer le site Astro.js et le jeu p5.js ; statut ✅ / ◻ dans `prompts/README.md`.
- `journal.md` — journal des pushes (une ligne par push, la plus récente en tête).
- `notes.md` — cette page wiki, les liens des API et les pistes d'animation.

## Règles de contribution

1. Travailler en français.
2. Ne jamais committer de clé privée, token ou secret.
3. À chaque push, ajouter une ligne dans `journal.md` (date, commit, fichiers, résumé).
4. Le site de l'édition doit rester relançable sans réseau ni API distante.
```

## Liens des API utilisées

Le site Astro.js de l'édition lui-même ne fait **aucun appel réseau** (rendu statique, registre local). Les API ci-dessous sont celles référencées par le livret pour les œuvres des étudiants, toujours avec un fallback local (`data/fallback.json`) :

| API | Lien | Usage dans le livret | Clé requise |
|---|---|---|---|
| Open-Meteo — prévision météo | [api.open-meteo.com/v1/forecast](https://api.open-meteo.com/v1/forecast) · [documentation](https://open-meteo.com/en/docs) | Météo de Nantes (température, vent, précipitations) mappée sur rotation / densité | Non (usages simples) |
| Open Data Nantes Métropole — API Explore v2.1 | [data.nantesmetropole.fr/api/explore/v2.1](https://data.nantesmetropole.fr/api/explore/v2.1/) | Dataset « patrimoine arboré » : [244400404_patrimoine-arbore-nantes-metropole](https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/244400404_patrimoine-arbore-nantes-metropole/records?limit=50) | Non |
| p5.js (CDN jsDelivr) | [cdn.jsdelivr.net/npm/p5@1.11.11/lib/p5.min.js](https://cdn.jsdelivr.net/npm/p5@1.11.11/lib/p5.min.js) · [référence officielle](https://p5js.org/reference/) | Bibliothèque de creative coding des sketches | Non |
| Nantes Patrimonia | Site de la Ville de Nantes (Direction du patrimoine et de l'archéologie) | Source institutionnelle de contextualisation (pas d'API, source documentaire) | Non |
| Cloudflare Pages | [workshop-design-interactions.pages.dev](https://workshop-design-interactions.pages.dev/) (URL canonique, racine du domaine) | Hébergement statique du site de l'édition (jeu à la racine) + QR code du cartel | Non |

Historique : jusqu'au prompt 13, le site visait GitHub Pages (`https://<owner>.github.io/<repo>/patrimoine-exe/nantes/001/`) ; cette adresse renvoie une 404 (vérifié le 10/11/2026) et n'est plus l'URL de référence.

Règle du livret : ne jamais dépendre du réseau pour l'évaluation finale — conserver un échantillon JSON local ou des valeurs de secours.

## Animations — comment les utiliser ?

Deux contextes, deux réponses.

### 1. Dans les œuvres p5.js des étudiants

Une animation n'est pas un effet ajouté : c'est un **régime temporel** choisi et justifié (livret, section 05). Quatre régimes possibles :

| Régime | Comment l'implémenter | Question à se poser |
|---|---|---|
| Statique généré | Un calcul, une image figée (`noLoop()` ou `draw()` unique) | Pourquoi générer plusieurs variantes ? |
| Évolution lente | `draw()` en boucle, `noise()` / `frameCount` pour dériver sans rupture | Quelle durée révèle la logique ? |
| Événement | Une condition déclenche une mutation (`keyPressed`, clic, seuil de donnée) | Qu'est-ce qui déclenche vraiment le changement ? |
| Interaction continue | La souris / le toucher module un paramètre en temps réel | Le lien action → effet est-il compréhensible ? |

Bonnes pratiques : fixer `randomSeed(seed)` / `noiseSeed(seed)` pour archiver une version reproductible, prévoir un reset (touche `R`), tester en 1920×1080 avec `pixelDensity(1)`, ne pas recréer de gros tableaux dans `draw()`.

### 2. Sur le site Astro.js de l'édition

Le site est statique et doit rester fluide sans API distante. Trois leviers, dans cet ordre de préférence :

1. **Transitions CSS** (hover, focus) — aucun JavaScript, aucun coût réseau.
2. **Révélation au scroll** avec `IntersectionObserver` (léger, vanilla JS) pour faire apparaître les cartes des œuvres.
3. **View Transitions API** d'Astro (`<ViewTransitions />`) pour des changements de page fluides entre la galerie et les cartels.

Contraintes d'accessibilité (prompts 04 et 12) : toujours respecter `prefers-reduced-motion` (désactiver ou réduire les animations), jamais d'animation flashante ni d'effet stroboscopique, durées courtes et easing doux. Une animation doit rendre la chaîne source → grammaire → système → œuvre plus lisible, jamais l'inverse.

## Check-up du 10/11/2026 (prompt 59)

Ne sont cochés que les points réellement exécutés et observés (Chromium automatisé via Playwright,
scripts Node ; essais humains en salle à prévoir pour le micro, la webcam et le scan des QR).

### 1. Vérifications
- [x] **Build et tests** : `npm run build` sans erreur ; `npm test` = smoke 113 contrôles (dont, depuis le
  prompt 50, la syntaxe de chaque script) + `test-jeu.mjs` 149 contrôles.
- [x] **Hors ligne** : double clic (`file://`, réseau coupé) sur `site/public/index.html` et sur la version
  archivée : partie lancée sur les archives, téléphone en repli local, aucune erreur JS. Les seules
  lignes console sont les deux requêtes refusées par le réseau coupé (météo, Loire) quand le mode
  « hors ligne forcé » n'est pas encore activé : elles retombent sur les replis, comme prévu ; avec le
  réglage déjà activé, elles ne partent pas. Service worker : enregistré en http(s) seulement.
- [x] **Navigation réelle** FR (1920×1080) et EN (1280×720) : menu → tutoriel → palmarès → paramètres →
  accessibilité → aide → semaine complète (enquête, décisions, inspection, mails, horloge) → mail de fin
  → rapport pages 1 et 2. Sonde sur `t()` : **aucune clé manquante affichée** ; **aucune erreur ni
  avertissement console**. Clés littérales : 579, toutes présentes en FR et en EN.
- [x] **Accessibilité** : pulsations ≤ 1,5/s (prompts 52–53), animations réduites testées aux prompts
  48–57, palettes daltonisme (prompt 48), textes du PC ≥ 18 px (≥ 20 px dans l'appli en fenêtre).
  Un défaut corrigé en route (prompt 56) : bouton blanc sur le papier crème du rapport, déplacé sur le
  fond sombre.
- [x] **Liens et métadonnées** : 3 pages générées (`/`, `/cartel/`, `/making-of/`), **aucun lien interne
  cassé** ; une seule canonique `https://workshop-design-interactions.pages.dev/`, `og:image` absolue ;
  aucune mention active de l'ancienne adresse GitHub Pages hors historique.
- [x] **Réseau** : appels `fetch` uniquement au lancement, au clic ou par minuterie (Loire, météo,
  agenda, GTFS-RT, messages), tous avec délai borné et repli ; aucun dans `draw()`.
- [x] **Secrets** : aucun motif (`api_key`, `bearer`, `password`) dans `public/` hors `lib/` (seul
  résultat : un commentaire de `confort.js` qui dit « jamais de secret »).
- [x] **Poids** : `public/` 30 Mo, dont audio 26 Mo (6 morceaux CC0 en `.ogg` d'origine + `.mp3` pour les
  navigateurs sans Vorbis), p5 1,1 Mo, captation 2,1 Mo, données 356 ko, scripts du jeu 533 ko.
  Non allégé : les `.ogg` sont les originaux sourcés (SHA-1 dans `audio/CREDITS.md`) ; ne retirer les
  `.mp3` qu'après avoir vérifié Safari.

### 2. Optimisations (comportement inchangé, tests verts avant et après)
- Code mort supprimé : `dessinerAccueil` (ancien accueil du PC, hors parcours depuis le prompt 35),
  `effetsResumes` (flèches d'effet, retirées au prompt 50), `smsSuivant` (intro remplacée au prompt 42),
  et 20 clés de traduction qui n'étaient plus utilisées. `Jeu.conseil` conservé (cité par `jeu/17`),
  annoté « plus affiché ».
- Déjà mutualisés pendant les prompts 51–52 : ombres des objets (`ombreObjet`), animation « objet en
  main » (`dessinerTelephoneEnMain(…, objet)` pour la tasse).

### 3. Documentation ↔ code
- 6 docs `jeu/` citaient des fonctions disparues (`noiseSeed`, `dessinerVignettage`,
  `dessinerAmbianceLampe`, `dessinerAccoudoirs`, `dessinerChateauDesDucs`, `dessinerPorte`) : note
  « Mise à jour (prompt 59) » ajoutée à chacune ; commentaire de `bureau.js` corrigé (pas de château
  dans la vue, accoudoirs hors champ).
- `prompts/README.md` : audité au prompt 58 ; compte des prompts à jour dans `README.md` et `notes.md`.
- `source-sheet.md` : contexte et 3 propriétés observables remplis à partir de faits vérifiables ;
  propriété écartée proposée (alertes de service GTFS-RT, non exploitées) — **à confirmer par le groupe**.
- Captation refaite sur le rendu final (enquête, appli en fenêtre, rapport) ; version archivée
  `rendu/` resynchronisée, PDF régénérés, relancée hors ligne sans erreur.

### Reste ouvert (et pourquoi)
- Saisies humaines `[À COMPLÉTER]` : auteurs, contributions, licence, numéro G01, propriété écartée.
- Scan réel des QR codes ; essais micro et webcam avec de vrais périphériques (seuils en salle).
- Variante du prompt 30 du collaborateur non fusionnée : à arbitrer.
- Licences à vérifier à la source : Hub'Eau, Loyalty Freak Music (Commons : « review needed »).
