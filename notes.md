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
- `prompts/` — 104 prompts numérotés (01 à 101, deux prompts 33, deux prompts 89 et deux prompts 94) pour créer le site Astro.js et le jeu p5.js ; statut ✅ / ◻ dans `prompts/README.md`.
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

## Désencombrement des applis du PC (prompt 101, 12/11/2026)

Mesure `?audit=densite&parcours=1` (1920×1080, FR), même outil avant (code de `main`) et après :
`jeu/101-densite-avant.json`, `jeu/101-densite-apres.json`. Détail et justifications : `jeu/95-desencombrement-applis-pc.md`.

### Avant / après
| Vue | Éléments avant → après | Primaires | Tailles de texte | Rouge % | Cadres imbriqués | Badges |
|---|---|---|---|---|---|---|
| Bureau + barre des tâches — vide | 50 → 48 (-4 %) | 0 → 0 | 3 → 3 | 0.6 → 0.5 | 2 → 2 | 2 → 0 |
| Patron — vide | 38 → 30 (-21 %) | 1 → 0 | 3 → 3 | 0.7 → 0 | 2 → 2 | 0 → 0 |
| Community · fil — vide | 26 → 21 (-19 %) | 0 → 0 | 3 → 3 | 0.4 → 0.4 | 1 → 1 | 1 → 0 |
| Community · mentions — vide | 26 → 21 (-19 %) | 0 → 0 | 3 → 3 | 0.4 → 0.4 | 1 → 1 | 1 → 0 |
| Community · messagerie — vide | 25 → 20 (-20 %) | 0 → 0 | 3 → 3 | 0.4 → 0.4 | 1 → 1 | 1 → 0 |
| Community · stats — vide | 30 → 27 (-10 %) | 0 → 0 | 3 → 3 | 0.4 → 0.4 | 1 → 1 | 1 → 0 |
| Journal · jour — vide | 63 → 34 (-46 %) | 2 → 0 | 4 → 3 | 2 → 0.5 | 2 → 2 | 1 → 0 |
| Journal · semaine — vide | 66 → 53 (-20 %) | 1 → 0 | 2 → 2 | 0.8 → 0 | 2 → 2 | 0 → 0 |
| Corbeille — vide | 5 → 4 (-20 %) | 0 → 0 | 2 → 2 | 0 → 0 | 1 → 1 | 0 → 0 |
| Indicateurs — vide | 24 → 24 (0 %) | 0 → 0 | 3 → 3 | 0 → 0 | 1 → 1 | 0 → 0 |
| Signalements — vide | 32 → 32 (0 %) | 0 → 0 | 5 → 5 | 5 → 5 | 2 → 2 | 0 → 0 |
| Bureau + barre des tâches — milieu de semaine | 52 → 48 (-8 %) | 0 → 0 | 3 → 3 | 0.7 → 0.5 | 2 → 2 | 4 → 0 |
| Patron — milieu de semaine | 43 → 36 (-16 %) | 1 → 0 | 3 → 3 | 0.8 → 0.1 | 2 → 2 | 0 → 0 |
| Community · fil — milieu de semaine | 53 → 48 (-9 %) | 0 → 0 | 3 → 3 | 0.8 → 0.6 | 3 → 2 | 2 → 0 |
| Community · mentions — milieu de semaine | 62 → 57 (-8 %) | 0 → 0 | 3 → 3 | 1.8 → 0.4 | 1 → 1 | 8 → 0 |
| Community · messagerie — milieu de semaine | 32 → 27 (-16 %) | 0 → 0 | 3 → 3 | 0.4 → 0.4 | 1 → 1 | 1 → 0 |
| Community · stats — milieu de semaine | 37 → 34 (-8 %) | 0 → 0 | 3 → 3 | 0.4 → 0.4 | 1 → 1 | 1 → 0 |
| Journal · jour — milieu de semaine | 106 → 75 (-29 %) | 2 → 0 | 3 → 2 | 2.9 → 0.7 | 2 → 2 | 5 → 0 |
| Journal · semaine — milieu de semaine | 93 → 66 (-29 %) | 1 → 0 | 2 → 2 | 0.8 → 0 | 2 → 2 | 0 → 0 |
| Journal · fiche enquête — milieu de semaine | 22 → 26 (+18 %) | 0 → 0 | 4 → 4 | 0.3 → 0.3 | 2 → 2 | 1 → 1 |
| Corbeille — milieu de semaine | 5 → 4 (-20 %) | 0 → 0 | 2 → 2 | 0 → 0 | 1 → 1 | 0 → 0 |
| Indicateurs — milieu de semaine | 26 → 26 (0 %) | 0 → 0 | 3 → 3 | 0 → 0 | 1 → 1 | 0 → 0 |
| Signalements — milieu de semaine | 35 → 35 (0 %) | 0 → 0 | 5 → 5 | 0.8 → 0.8 | 2 → 2 | 0 → 0 |

### Ce qui a changé, et où se trouve maintenant l'information
| Vue | Changement | Où est l'information | Actions |
|---|---|---|---|
| Journal · jour | 6 tuiles (sparklines, détail équipes, thème, XP) → une ligne de chiffres | bouton « Détails (V) » (fantôme) ou touche V | 1 |
| Journal · jour | 5 boutons de filtres à compteurs → un sélecteur « Afficher : Tout (4) » | clic = filtre suivant ; Tab → zone filtres puis ← → (inchangé) | 1 |
| Journal · jour | « Enquêter » / « Voir Community » sur chaque carte | au survol ou au focus (↑ ↓) de la carte ; toujours visibles en tactile/mobile ; Entrée ouvre l'enquête | 1 |
| Journal · jour | badges pleins « ✗ raté / ✓ bon… » | même symbole + mot, en couleur claire ; le liseré de la carte garde la couleur pleine | 0 |
| Journal | Jour / Semaine actif en rouge plein | variante « secondaire » (blanc) ; seul le jour sélectionné reste rouge | 0 |
| Journal · semaine | barres verticales des jauges (doublaient les chiffres, règle 7) | chiffres « F · R · B » de chaque journée ; évolution sur la courbe de la semaine | 0 |
| Journal · semaine | tuiles « à venir » encadrées vides | une phrase en blanc 50 % | 0 |
| Journal · fiche enquête | numéros des volets dans le libellé | numéro en texte secondaire (blanc 50 %), touches 1–4 inchangées | 0 |
| Community | compteurs du compte (publications, abonnés, réponses) et bio dans l'en-tête | onglet Statistiques (← → au clavier) | 1 |
| Community | badge bleu « compte de service » | texte bleu clair après le nom | 0 |
| Community | bannière 70 px | 52 px | — |
| Community | tous les commentaires sous chaque post | le premier (et toute plainte qui attend une réponse), puis « Voir les N autres » ; tous les commentaires restent listés dans Mentions | 1 |
| Community | badges rouges/verts « −3 rép. » sur chaque commentaire | effet en texte coloré (clair) | 0 |
| Community | fond sur les 4 onglets ; cadre autour des photos | fond sur l'onglet actif seulement ; photo sans cadre (2 niveaux de cadres au plus) | 0 |
| Patron | filtres à compteurs, actif en rouge plein | compteur sur le filtre actif seulement, actif en « secondaire », autres en « fantôme » ; ← → inchangés | 1 |
| Patron | blocs enrichis (puces de consigne, rappel du reproche + « Voir le dossier », palier de budget, effectifs) | repliés en une ligne (« Dossier lié : … › » / « Détails › »), dépliés au clic ou par V (tous) ; le **dernier** message reste déplié | 1 |
| Patron | séparateurs de jour avec traits ; « Nouveaux messages » en rouge | texte blanc 50 % seul ; trait blanc 50 % d'1 px | 0 |
| Patron | textes 16 px (type, accusé, puces) | 18 px (niveau secondaire) : 3 niveaux 32 / 20 / 18 | — |
| Bureau, barre des tâches | badges « nouveaux messages » (Patron, Community) et « ● » Indicateurs | badge seulement pour ce qui est **à faire** : plaintes Community qui attendent une réponse ; nouveaux messages annoncés par les notifications et « Nouveaux messages » | 1 |
| Corbeille | phrase d'intro « 0 … » + « vide » | une phrase en blanc 50 % | 0 |
| Signalements | titre à 16 px du bord | marge 24 px (`DS.esp.xxl`) comme les autres applis ; barre de 34 px conservée (HUD verrouillé au prompt 98) | — |

Déjà conformes, vérifiés : réponses rapides du Patron sous le **dernier** message seulement ; mini-jauge seulement
pour un message qui parle d'une jauge précise ; brouillon Community visible seulement s'il existe ; volets de la
fiche d'enquête un à la fois.

### Décisions de groupe (§ 6) — non tranchées, choix conservateur appliqué
| # | Question | Appliqué |
|---|---|---|
| D1 | Rouge réservé à l'action primaire seule, ou aussi à l'élément le plus urgent ? | [À COMPLÉTER] — état actuel gardé : rouge pour la sélection (jour du Journal, onglet actif), le primaire et le liseré d'un dossier raté ; tout le reste en blanc ou en couleur claire |
| D2 | Panneau Indicateurs replié par défaut ? | **Oui** (décision du groupe, 12/11/2026) — replié sur les trois jauges (nom, valeur, barre, dernière variation) ; objectif du jour, palier de budget, statut auprès du patron, grade et badges au survol du panneau, ou épinglés par « Détails (V) » (bouton au même endroit dans les deux états, utilisable au toucher) |
| D3 | Colonne Nantes de Community : masquée sous quelle largeur, ou déplacée en onglet ? | [À COMPLÉTER] — non modifiée (déjà absente en portrait) |
| D4 | Actions secondaires du Journal : menu « … » ou raccourcis visibles ? | [À COMPLÉTER] — non modifié (« Copier le résumé (C) » reste en bas à gauche) |

### Écarts aux cibles du § 5, justifiés
- **−30 % d'éléments** atteint ou approché sur le Journal (jour −29 / −46 %, semaine −29 / −20 %), pas sur Community
  (−8 à −20 %) ni Patron (−16 / −21 %) : la colonne Nantes (D3) et les cartes de messages restent ; un contenu
  réel n'est pas retiré.
- **Fiche enquête +18 %** : les numéros de volet sont désormais des textes séparés (demandé au § 4).
- **Signalements** : 5 tailles de texte et 5 % de rouge en jour 1 — vue hors périmètre (prompts 87, 98), seul
  l'alignement est fait ici.
- **Indicateurs** : replié par défaut (D2 tranchée le 12/11) — 324 px de haut au lieu de 572.

### Vérifications
- `npm run build` + `npm test` verts (smoke 460, jeu 541 contrôles, dont les modules `?audit=densite` / `?audit=textes`).
- Audit des textes du prompt 93 (`?audit=textes&parcours=1`, FR/EN, contraste normal/renforcé) : **0 défaut A–D** à
  1920×1080, 1366×768 et 412×915 (25 chevauchements « E » en mobile, 28 avant), 0 erreur console.
- Clavier seul (Chromium) : V déplie/replie les détails du Journal et tous les blocs du Patron ; Tab → zone filtres,
  ← → change de filtre ; ↑ ↓ met une carte au focus (ses actions apparaissent) ; Entrée ouvre l'enquête ; ← → change
  d'onglet Community. En 412×915 tactile : actions de ligne toujours visibles.
- Contraste : le texte secondaire reste au minimum `DS.blanc50` (5,3:1) ; les évaluations passent en couleurs claires
  (≥ 12:1). Aucune animation ni flash ajouté.
- Test humain (lisibilité ressentie, test croisé) : [À COMPLÉTER].

## Vérification intégrale du 12/11/2026 (prompt 100)

Jour J3, avant le freeze de midi. Seul ce qui a été exécuté et observé est coché ; ✅ conforme, ⚠️ partiel, ◻ à la charge du groupe.

### 1. Conformité au brief (livret « Cours étudiant B3 Design », sections « Votre projet final », « Livrables », « Notation »)

| Exigence | Preuve | Statut |
|---|---|---|
| Source patrimoniale identifiable et documentée | `source-sheet.md` / `.pdf` : contexte, URL, date d'accès, droits, relevés, 3 propriétés, 1 propriété écartée (placeholder contradictoire retiré) | ✅ |
| Grammaire explicite | `grammar.md` : règle structurante + **7 champs de la fiche du livret ajoutés** (primitives, relations, invariants, variables, temps, déclencheur, limites) + espace génératif (graine) ; `grammar.pdf` régénéré | ✅ |
| Test de qualité de la grammaire (reconstruction sans la source) | fiche lisible seule, valeurs chiffrées tirées de `game.js` ; non testé sur une personne | ⚠️ |
| Prototype lançable | `rendu/…/index.html` en `file://` : partie lancée, 15 dossiers, 0 erreur console (Chromium) ; URL canonique en ligne | ✅ |
| ≥ 3 paramètres opérants | semaine, difficulté, en ligne / hors ligne, défi chrono ; **nouveau test** : budget, aggravation et signalements simultanés ordonnés par niveau (`test-jeu.mjs`) | ✅ |
| Test par un autre groupe + itération | aucune trace écrite (`todo.md` l. 57 non coché) | ◻ |
| Documentation pour relancer | README de `rendu/` **réécrit aux 12 rubriques du livret** (il reprenait le README du site) | ✅ (rubriques) / ◻ (contributions, part humaine IA) |
| Génératif : invariants, variables, plages, cohérence | section « Espace génératif » de `grammar.md` (graine `graineDe`, Q35) | ✅ |
| Accessibilité de l'interaction | micro et webcam doublés au clavier/souris, pas de flash (≤ 3/s), son non indispensable, contraste calculé | ✅ |
| Webcam : responsabilité | `webcam.js` : 48 × 27 px, jamais affichée, enregistrée ni envoyée ; activée par un geste | ✅ |
| Cartel 80–120 mots + source + système | 106 mots ; Système, Données et chaîne ajoutés au `cartel.md` de `rendu/` ; registre aligné (4 réponses, perturbations datées) | ✅ |
| Manifest | `manifest.json` : JSON valide, 16 champs de l'édition, auteurs, sources et droits ; `ai_usage` avec part humaine `[À COMPLÉTER]` | ⚠️ |
| Captation | `hero.jpg`, `detail-01.jpg`, `process.jpg` 1920×1080, `thumb.jpg` 640×360, `demo.mp4` **28 s** H.264 1280×720 (`ffprobe`) | ✅ |
| Structure de dossier recommandée | `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/` **resynchronisé** avec `site/public/` (polices, correctifs du jour) | ✅ |
| Présentation | `/presentation/` (Slidev, 17 slides), hors ligne, 0 erreur console | ✅ |
| Évaluation /70 + /30 | `note-eval.md` mis à jour (preuves du 12/11, score inchangé) ; fiche individuelle de chaque étudiant à remplir | ◻ |

### 2. Fonctionnement, données, accessibilité, documentation
- [x] `npm run build` + `npm test` : smoke 353 + jeu 536 contrôles verts (dont le nouveau test de difficulté).
- [x] Parcours Chromium, audit des textes, contrastes, liens, secrets, poids, doc ↔ code : voir le check-up du même jour
  (prompt 59) ci-dessous — 0 erreur console, 0 défaut A–D, 0 lien cassé.
- [x] Données : repli `data/fallback.json` = 6 dossiers réels (semaine du 12/10/2026, préparée le 10/11) ; appels
  API au lancement seulement, échecs hors ligne rattrapés par le repli.
- [x] QR codes : identiques octet pour octet à `qrencode` sur l'URL canonique et `/cartel/` → mentions
  « à régénérer » retirées de `site/README.md` et `todo.md`.

### 3. Ce que seul le groupe peut faire avant la soutenance
1. **Test croisé silencieux** (30–60 s, un autre groupe, 3 observations) et une itération qui en découle, à consigner.
2. **Contributions nominatives** et rôles (README de `rendu/`, correspondance compte git → personne, dont « Skyfe »).
3. **AI usage** : ce qui a été relu, réécrit et testé par le groupe (README, `manifest.json`).
4. **Fiche individuelle** du livret (3 contributions, une décision de design, une décision technique, une difficulté, IA).
5. Relecture du cartel ; test des QR codes au téléphone ; fichier `BitsyPixels.woff2` si la police doit être embarquée.

## Check-up du 12/11/2026 (prompt 59, réexécution après les prompts 92 à 99 et les polices du DS)

Seuls les points réellement exécutés et observés sont cochés (Chromium 156 automatisé via Playwright, scripts Node/Python).

### 1. Vérifications
- [x] **Build et tests** : `npm run build` sans erreur (Slidev compris) ; `npm test` = smoke 353 contrôles +
  `test-jeu.mjs` 533 contrôles, verts après chaque correction.
- [x] **Navigation réelle** : jeu FR et EN au clavier (menu → partie), `file://…/site/public/index.html`, `/cartel/`,
  `/making-of/`, `/presentation/` : **0 erreur ni avertissement console** (après correctifs, voir § 2).
- [x] **Hors ligne** : après une visite, réseau coupé → jeu (189 fichiers en cache, service worker actif) et
  `/presentation/` rechargés ; seuls échecs : les appels Hub'Eau et Open-Meteo, attendus, avec repli local.
- [x] **Textes hors cadre** (`?audit=textes&parcours=1`, FR/EN, contraste normal/renforcé) : 0 défaut à 1920×1080 et
  1366×768 ; 412×915 : 28 chevauchements « E » (29 dans la référence `jeu/89-audit-textes-apres.json`), 0 défaut A–D —
  le passage à JetBrains Mono en webfont ne crée aucun débordement.
- [x] **Contraste** (calcul WCAG sur les jetons de `ds.js` / `sketch.js`) : blanc 19,5:1, blanc 75 % 11:1, gris 60 % 7,3:1,
  blanc 50 % 5,3:1, succès 7,3:1, alerte 12:1, erreur claire 13:1, info claire 12,6:1 sur `#0D0C0C` ; blanc sur
  primaire 5,5:1. Couleurs < 4,5:1 sur fond sombre (primaire 3,6, erreur 3,5, info 4,0) : aucun texte courant
  dessiné avec elles (recherche `fill(…)` → `text(…)`) ; seul cas, le tampon « RÉSILIÉ » (44 px gras) sur papier
  `#f2ead8` ≈ 4,6:1.
- [x] **Liens** : 0 lien interne cassé dans `dist/` ; 0 lien Markdown cassé (racine, `jeu/`, `prompts/README.md`,
  `site/README.md`, `design-system/`).
- [x] **Sécurité** : aucun motif `api[_-]?key|bearer|password|secret` dans notre code (hors `lib/` et build Slidev).
- [x] **Poids** : audio 26 Mo, captures 2,4 Mo, présentation 1,6 Mo, p5 1,1 Mo, données 0,4 Mo, polices 128 Ko ;
  aucun `fetch` dans un fichier qui définit `draw()`.
- [x] **Doc ↔ code** : `jeu/README.md` liste les 95 `jeu/*.md` ; symboles cités absents du code tous signalés comme
  retirés dans leur doc (ou API p5 / Slidev) ; compte de prompts mis à jour (102 fichiers, 01 à 99 ; il annonçait encore 93).
- [ ] Essais humains (pouce, clavier seul par un novice, micro, webcam, test croisé) : [À COMPLÉTER].

### 2. Problèmes trouvés et corrigés
- **Polices du DS** (modification locale non commitée trouvée en début de séance) : dossier `site/public/fonts/`
  absent alors que `fonts.css` et `sw.js` le référençaient → restauré depuis les fichiers du deck ; `BitsyPixels.woff2`
  (non fourni) → 404 + rejet non intercepté de `document.fonts.load` : Bitsy en `local()` seulement ; en `file://`,
  le navigateur bloque les polices (origine `null`) → `fonts.css` et preload injectés seulement en http(s).
- **Présentation** : le favicon par défaut de Slidev venait de `cdn.jsdelivr.net` (échec hors ligne) → `/favicon.svg`.
- **Code mort** : cache `enCache` / `signature` de `journal-donnees.js` déclaré mais jamais appelé, retiré.
- **Smoke test** : contrôle des polices (fichiers référencés par `fonts.css`, chargement par `index.html`).

### 3. Reste ouvert
- Fichier `BitsyPixels.woff2` à déposer par le groupe (`site/public/fonts/README.md`) ; tests humains ci-dessus.

## Check-up du 11/11/2026 (prompt 59, réexécution après les prompts 82 à 91)

Seuls les points réellement exécutés et observés sont cochés (Chromium automatisé via Playwright, scripts Node).

### 1. Vérifications
- [x] **Build et tests** : `npm run build` sans erreur (Slidev compris) ; `npm test` = smoke 313 contrôles +
  `test-jeu.mjs` 374 contrôles, verts après chaque correction.
- [x] **Hors ligne** : double clic (`file://…/site/public/index.html`) → menu puis partie (15 dossiers, repli local) sans
  erreur ; après une première visite, réseau coupé → le jeu **et** `/presentation/` se rechargent depuis le service
  worker (166 fichiers en cache).
- [x] **Navigation réelle** : semaines complètes jouées au clavier (FR et EN, et une en mobile avec animations réduites),
  sans erreur console ; 1280×720 : partie lancée sans erreur.
- [x] **i18n** : toutes les clés `t('…')` existent en FR et en EN (mêmes clés des deux côtés) ; 17 clés devenues
  orphelines supprimées (`dossier.sourceRetenue`, `plainte.titre`, `jeu.reseau`, `tel.direct`, `sig.equipe*`…).
- [x] **Liens** : 0 lien interne cassé dans `dist/` (accueil, cartel, making-of, présentation).
- [x] **Sécurité** : aucun motif de secret dans notre code ; les seules occurrences de « password » sont dans le code
  minifié de p5 et de Slidev.
- [x] **Poids** : audio 26 Mo (morceaux CC0), captures 2,4 Mo, p5 1,1 Mo, présentation 1,2 Mo, données 0,4 Mo ;
  aucun appel réseau dans `draw()` (téléphone : au clic, 10 min, 6 s).
- [ ] Contraste et daltonisme : non re-mesurés à l'outil aujourd'hui (couleurs des nouvelles fenêtres reprises du
  design system) — à refaire avec un outil de contraste.
- [ ] Essais humains (micro, webcam, QR, test de jeu des prompts 88 à 91) : [À COMPLÉTER].

### 2. Problèmes trouvés et corrigés
- **Messagerie du patron figée** (prompt 91 § 1) : `journal.js` redéfinissait la fonction globale `hauteurCarte` de
  `patron.js` → exception à chaque image. Renommée ; doublon `ouvrirLien` (menu / données) séparé ; **nouveau test :
  aucun nom global en double entre les scripts**.
- **Tampon « SIGNALEMENT »** (prompt 53) plus affiché depuis la refonte du panneau (prompt 87) : rebranché.
- **Code mort supprimé** : `enteteMode` (sketch.js), `sourisAppli` (os.js), `selectionnerIncident` et
  `dessinerEtatEquipes` (carte.js), et leurs clés.
- **Journal** : extrait de plainte et réponse qui se chevauchaient, tuile Équipes qui débordait.
- **Docs** : `jeu/45` et `jeu/68` signalent les symboles retirés ; `README.md` / `notes.md` annoncent 93 prompts
  (01 à 91, deux 33 et deux 89) et le dossier `slides/`.

### 3. Reste ouvert
- Prompt 83 (barème d'évaluation) : non exécuté (non demandé).
- Mise en page portrait dédiée pour le Journal et le téléphone ; mesure de contraste outillée ; tests humains.

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
- Licences vérifiées à la source le 11/11/2026 : Hub'Eau (Licence Ouverte Etalab, CGU § 5.1.3) ; Loyalty Freak Music (CC0 1.0 sur Free Music Archive ; la revue Commons reste en attente).

## Revue game design du 10/11/2026 (prompt 66)

Méthode : parties jouées dans Chromium (1920 × 1080, animations réduites), FR et EN, comme un nouveau joueur
(stockage vidé, menu → Nouvelle partie → SMS → guide), puis les 3 semaines du mode histoire jouées en entier
avec trois styles : ne rien faire (semaine 1), renfort systématique (semaine 2), au hasard (semaine 3).
Mobile portrait (412 × 915, tactile) vérifié sur la Carte. Captures de travail hors dépôt.
Règles Q1–Q61 et `game.js` inchangés (`git diff` vide, `test-jeu.mjs` vert).

| Semaine | Style | Score | Dossiers décidés |
|---|---|---|---|
| 1 (facile) | ne rien faire | 106 / 300 | 0 / 15 |
| 2 (normale) | renfort systématique | 192 / 300 | 15 / 15 |
| 3 (difficile) | au hasard | 151 / 300 (FR), 143 / 300 (EN) | 15 / 15 |

### Frictions trouvées et corrections

| Gravité | Axe | Friction | Correction (commit) |
|---|---|---|---|
| Bloquant | 2. Boucle | Après deux semaines jouées dans la même session, tous les signalements de la semaine suivante expiraient dès leur arrivée (file de la Carte, prompt 68, jamais remise à zéro) | Arrivées remises à zéro à chaque nouveau paquet (45bef1b) |
| Confus | 1. Onboarding | Le guide ne disait pas qu'il faut **prendre** le signalement (Entrée) ; sa bulle masquait le bouton « Prendre le dossier » | Étape « Prendre le signalement » (guide en 7 étapes) (e2074ac) |
| Confus | 1. Onboarding / 3. UI | La bulle « consultez les sources (5 à 8) » masquait les sources 5 à 7, puis la bulle suivante masquait le texte des conséquences | Bulle placée à gauche des cibles de la colonne de droite, flèche horizontale (e2074ac) |
| Confus | 6. Aide | Aide : règles de base perdues au prompt 68 (jauges, seuils, compteur, dé, score) ; texte coupé ; raccourcis 5–8, Maj+1–4, R ralenti absents ; libellés réduits sous 18 px | Aide réorganisée (1720 × 1040), règles complètes, 16 raccourcis lisibles, malus sous les raccourcis (e2074ac) |
| Confus | 1. Onboarding | Tutoriel muet sur la Carte, la prise du signalement, les équipes, le ralenti et le sablier | Pages 2, 3, 4 réécrites (e2074ac) |
| Mineur | 7. Journée | Bulle du guide par-dessus le mail du soir | Pas de bulle pendant le mail (e2074ac) |
| Mineur | 8. Bilan | Rapport : décisions clés coupées (« Bus de… ») | Qualité en tête, texte sur deux lignes (d2baca4) |
| Mineur | 3. UI | « Journée suivante (Entrée) › » débordait du bouton | Libellé des boutons DS ajusté à la largeur (≥ 18 px) (d2baca4) |
| Mineur | 1. Onboarding | Pied du livre « Commande » tronqué | Texte raccourci (e2074ac) |

### Points vérifiés sans friction
- Accueil, choix du mode (histoire recommandé, temps réel verrouillé), SMS d'intro (Entrée), premier signalement en ~2 s réelles.
- Bandeau d'état en bas de l'appli (À VOUS, CONSÉQUENCES, SURVEILLANCE…) : explique chaque phase.
- Narration : deltas et dés affichés, contexte (« affluence : effet renforcé ») — on comprend pourquoi les jauges bougent.
- Mail du soir (journal de la journée, « il fallait : … »), mail de fin de semaine, rapport (tampon, courbes, défis, profil).
- Mobile portrait : jauges, Carte, panneau de sélection et dossier lisibles, cibles ≥ 44 px.

### Reste ouvert
- Sur mobile, les mentions clavier « (Entrée) », « (R) » restent affichées sur les boutons tactiles.
- Le rapport papier garde des textes de 15–16 px (hors PC) : à agrandir si on change sa mise en page.
- Pas de test automatique de `carte.js` (le test du jeu ne charge que `game.js`) : le correctif est vérifié en navigateur.

## Prompt 74 — variété et compréhension du poste (11/11/2026)

**Joué** (Chromium, pilote clavier automatisé, 1920 × 1080 sauf mention) : trois semaines complètes jusqu'au
mail de fin et au bilan — semaine 1 « facile » en français, semaine 2 « normale » en anglais, semaine 3
« difficile » en français en portrait mobile 412 × 915 avec animations réduites. 15 décisions par semaine,
inspection surprise, contradiction de sources, soirées et sorties traversées ; aucune erreur console. Les
données jouées sont les archives du dépôt (aucun réseau).

**Ce qui change pour le joueur :**
- À la première ouverture de l'appli « Signalements » de la partie, une fenêtre explique qui il est (opérateur
  du centre de régulation), ce que fait le poste et ce que veulent dire 1 Dévier, 2 Retenir, 3 Renfort,
  0 Ne rien faire et les équipes, en langage métier, sans dire laquelle est « bonne ». Temps arrêté pendant
  la lecture ; vue une fois par partie (gardée dans la sauvegarde).
- Les mêmes phrases sont dans le tutoriel / livre « Aide » (étape 3), l'aide (H) et le guide « Prendre en main ».
- L'ordre d'arrivée des dossiers sans heure réelle change d'une semaine à l'autre (graine), et à minute égale
  aussi ; la sauvegarde le fige.
- Le panneau d'attente montre l'objectif du jour avec sa règle et sa valeur actuelle, puis un **fil de la
  journée** : objectif et bilan de la veille au matin, un texte de liaison après chaque dossier (météo du
  jour, agenda du jour, radio d'un chauffeur avec le vrai retard, signalements restants — jamais deux fois le
  même d'affilée), les événements de rythme de 10 h (agenda), 12 h (météo) et 17 h (pointe) avec la règle
  déjà en vigueur (× 1,25), et les mots du patron après 2 bonnes ou 2 ratées d'affilée.
- Après chaque décision, la narration ajoute une phrase de contexte réelle (météo du jour, heure de la
  décision, nom réel de la ligne, événement d'agenda).

**Limites connues :** les semaines archivées citent rarement une ligne, si bien que la radio des chauffeurs
apparaît peu ; la variété reste bornée par les données réelles (aucun texte inventé pour combler).

## Revue UX du 11/11/2026 (prompt 80)

**Méthode.** Chromium 1920 × 1080 et portrait 412 × 915 (Playwright), FR et EN. Tour complet capturé écran par
écran : menu principal → écran « JOUR n » → bureau → s'installer → RégulOS → explication du poste → liste des
signalements → dossier → narration → applis Patron, Community, Journal, Indicateurs → aide (H) → sieste et réveil
→ vue bureau levé. Puis semaines complètes jouées au clavier jusqu'au mail de fin et au bilan : semaine 1 FR
(animations réduites), semaine 2 EN, semaine 3 EN, et après correction semaine 1 FR et semaine 3 EN ; aucune erreur
console. Données : archives du dépôt (hors ligne).

**Frictions trouvées** (après les prompts 72 à 79) :

| Gravité | Écran | Friction | Correction |
|---|---|---|---|
| Bloquant | Écran de jeu, bandeau d'état | Dans l'appli, aucun texte ne descend sous 20 px (prompt 49) : les messages longs du bandeau (« SIGNALEMENT · … », « À VOUS · … ») débordaient sur la jauge de somnolence, illisible ; l'indicateur « Partie sauvegardée » était sous la jauge | `dd73c46` : messages raccourcis FR + EN, jauge en un seul libellé « Somnolence 42 · Z » (aide au survol), indicateur de sauvegarde entre les jauges et le dossier |
| Confus | Écran de jeu, applis | Les notifications (prompt 77) couvraient les jauges, le compteur et le haut du dossier, ou le début des messages du patron, pendant 6 s à chaque arrivée | `ee6f913` : appli ou fenêtre ouverte → la dernière notification tient en une ligne dans la barre des tâches (+n), cliquable ; la pile en haut à droite reste pour le bureau RégulOS vide et la vue bureau |
| Confus | Aide (H) | Les règles, allongées par les prompts 72 à 79, étaient coupées en bas ; les raccourcis ne citaient ni Z, ni Tab entre signalements actifs, ni ↑ ↓ dans la liste | `e087a00` : règles réécrites plus court, taille ajustée pour tenir en entier (≈ 20 px) ; raccourcis à jour |
| Mineur | Aide (H) | Les codes couleur (rouge, orange, vert, bleu) n'étaient expliqués nulle part | `56dcfcc` : rouge = urgent, orange = attention, vert = bon choix, bleu = Community et somnolence (FR + EN) |

**Checklist (§ 2).** Navigation : chaque appli a sa croix et « Fermer (Échap) », le PC « Quitter le PC (Échap) »,
le logo de la barre des tâches ramène à l'accueil de RégulOS (prompt 75) ; Échap ferme toutes les fenêtres.
Action en cours : signalement sélectionné encadré en rouge, actifs en rouge sombre avec leur compteur, appli
ouverte soulignée dans la barre des tâches. Libellés : boutons et onglets nommés en toutes lettres, icônes de
RégulOS sous-titrées, données réelles (« +12 min (réel) ») séparées des actions. Feedback : bip, deltas qui
flottent sur les jauges, notifications, fil de la journée. Onboarding : tutoriel en 6 étapes, explication du poste,
guide « Prendre en main » (somnolence, alertes). Bureau ↔ PC : chaque objet a une infobulle et un effet (le sablier
a disparu au prompt 78). Mobile : liste en haut, dossier dessous, somnolence ≥ 44 px. Accessibilité : `aria-live`
sur toutes les annonces ajoutées, animations réduites respectées, contraste du Pixel Design System.

**Reste ouvert.** Test par un membre du groupe qui n'a jamais vu le jeu (tutoriel + première journée sans aide) :
**à faire en salle**. En portrait mobile, le bureau RégulOS (hors appli de jeu) n'est pas recomposé (antérieur aux
prompts 72 à 80). Le retard qui s'aggrave (prompt 79) ne se voit qu'en mode « aujourd'hui » (les archives n'ont pas
de retard chiffré). Webcam et micro réels : à essayer en salle (prompts 54, 57, 67).

## Test joueur novice (prompt 97, à faire)
- Joueur hors projet, semaine 1, sans aide extérieure : 3e décision atteinte en moins de 2 min ? [À COMPLÉTER]
- Dit à voix haute ce qu'il doit préserver (les 3 jauges) ? [À COMPLÉTER]
- Verbatim 1 : [À COMPLÉTER]
- Verbatim 2 : [À COMPLÉTER]
- Verbatim 3 : [À COMPLÉTER]

## Revue UI / HUD (prompt 98, 11/11/2026)
Les écrans ont été audités par le parcours `?audit=textes&parcours=1` : 59 étapes, en FR et en EN, avec et sans contraste renforcé, en 1920×1080 et en mobile portrait. Détail dans `jeu/94-revue-ui-hud.md`.

| Écran | Avant | Après |
|---|---|---|
| Signalement ouvert | 19 boutons ; « En savoir plus », onglets et bandeau à 36-39 px | 19 boutons ; 43-45 px |
| Liste des signalements | 15 boutons ; ✕ de 21 px, somnolence 27 px | 15 boutons ; ✕ 43 px, somnolence 54 px |
| Aide H | deux libellés à 13 px | 14 px au minimum (libellés raccourcis) |
| Paramètres | bouton de musique à 13 px | 14 px (bouton de 340 px) |
| Rapport de semaine | axes à 13 px | 15 px |
| Journal (jour et semaine) | axes et légendes à 12-13 px | 14 px |

- Défauts A à D : 0 avant comme après.
- Tests humains (pouce seul en mobile portrait, clavier seul de bout en bout) : [À COMPLÉTER].
