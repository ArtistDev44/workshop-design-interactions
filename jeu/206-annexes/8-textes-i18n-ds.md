# Audit axe 8 : textes, i18n, design system

Dépôt audité : worktree `wt-205`, commit `f07351b` (origin/main), lecture seule.
Méthode : `i18n.js` chargé dans un `vm` Node (faux `localStorage`, `location` et `navigator`) pour extraire `TRADUCTIONS`, puis comparaison par script avec les appels `t()`, `T()`, `tSi()` et `Jeu.variante()` de tous les `.js` servis. Les couleurs, les tailles et les chaînes en dur ont été comptées par regex, commentaires exclus. Les scripts sont dans `scratchpad/scripts/` (`i18n.mjs`, `usage.mjs`, `vars.mjs`, `typo.mjs`, `couleurs.mjs`, `endur.mjs`).
Ce rapport ne refait pas ces points, déjà relevés ailleurs : les 133 chaînes « (s) » et les abréviations Flu./F/R/B (`jeu/203-audit-ux.md`), les 136 clés mortes retirées (`jeu/200`), et « [À COMPLÉTER] » pour la licence Hub'Eau (`audit-2026-11-12.md:120`).

## Synthèse chiffrée

| Mesure | Valeur |
|---|---|
| Clés FR / EN | 1 933 / 1 933. Mêmes jeux de clés, aucun doublon dans le littéral, aucune valeur vide |
| Clés FR absentes en EN, et l'inverse | 0 / 0 (le test `test-jeu.mjs:966` le garantit) |
| Placeholders `{x}` différents entre FR et EN | 0 |
| Appels `t('…')` littéraux vers une clé absente | 0 sur 1 452 appels littéraux (seul `rapport.page` remonte : faux positif, la clé est concaténée en `histoire.js:197`) |
| Variables passées à `t(k, {…})` et placeholders | cohérents (le seul écart, `game.js:774`, est un faux positif dû à un commentaire) |
| Clés jamais référencées (certain) | 2 × 2 langues : `mailf.fait.titre` (`i18n.js:491` / `2427`) et `trace.titre` (`i18n.js:1822` / `3758`) |
| Clés construites dynamiquement (à confirmer) | 680 clés, ~100 préfixes (`repl.` 108, `patron.ton.` 27, `credits.` 26, `clash.` 20, `reactionClash.` 20, `tuto.` 18, `optjeu.` 18…) |
| Valeurs EN identiques au FR | 67, presque toutes légitimes : noms propres, crédits musicaux, « Budget », « Community », gabarits `{a} {b}` |
| Chaînes FR avec espace insécable (U+00A0 ou U+202F) | **0 sur 1 933** |
| Couleurs hors palette dans les `.js`/`.css` servis | 397 occurrences, 237 teintes. 85 % dans le décor en pixels (`bureau.js` 137, `histoire.js` 55, `immersion.js` 47) |
| Police Picon ou couleurs de marque dans le code servi | aucune trace de Picon. Il reste 3 couleurs issues de l'extraction metropole.nantes.fr (voir M5) |

---

## Constats majeurs

### M1. `DESIGN.md`, présenté comme le design system du projet, est l'identité de Nantes Métropole (Picon)
- **Où** : `design-system/DESIGN.md:1-226`. Le front matter dit `name: "Nantes, ville et métropole"` et déclare 5 couleurs de marque (`#005AE1`, `#00CA64`, `#0000EE`…). Il définit aussi 48 styles typographiques en `Picon` / `Picon Condensed` et liste les URL des fichiers `LCTPicon-*.woff2` hébergés sur metropole.nantes.fr (`DESIGN.md:202`). Le README du dossier s'intitule « Design system de Nantes Métropole » (`design-system/README.md:1`).
- **Conflit** : `CLAUDE.md` renvoie à « `design-system/DESIGN.md` (couleurs, échelle), sans police Picon ni identité Nantes Métropole ». Or l'échelle et les couleurs de ce fichier sont justement celles de Picon et de Nantes Métropole. Le jeu applique en réalité le Pixel Design System (`ds.js:9-38`, `pixel-palette.tokens.json`). Seules les sections ajoutées à la main (prompts 170, 173, 175, 186, `DESIGN.md:227-363`) décrivent le jeu.
- **Risque** : `design-system/README.md` explique comment régénérer `DESIGN.md` avec dembrandt (« relancer la commande… puis recopier les sorties »). Suivre cette consigne écraserait les sections écrites à la main (icônes, voiles, interrupteur, segments).
- **Gravité** : majeur, car c'est la documentation de référence de l'assistant et de l'équipe. Effort S. Preuve : lecture directe.
- **Piste** : déplacer l'extraction dembrandt dans `design-system/reference-metropole/`, marquée « référence, ne pas appliquer ». Faire de `DESIGN.md` le Pixel DS : palette de `pixel-palette.tokens.json`, polices Bitsy Pixels et JetBrains Mono, et les sections 170 à 186. Corriger la consigne de régénération.

### M2. Aucune espace insécable dans les 1 933 chaînes françaises, alors que le projet a fixé cette règle
- **Où** : tout le bloc `fr` de `i18n.js`. On y compte 579 chaînes avec « ␠: », 40 avec « ␠? », 37 avec « ␠; », 8 avec « ␠! » et 90 avec « «␠ », toutes avec une espace ordinaire. On ne trouve aucune ponctuation haute collée, donc la convention dominante est « espace avant la ponctuation haute », mais jamais insécable.
- **Règle existante** : `jeu/88-textes-enquete.md:30-35` prévoit une espace fine insécable avant `; : ! ?` et dans les guillemets « », ainsi que l'apostrophe ’. Cette règle n'est appliquée que par `nettoyerTexteSource()` (`texte.js:103-129`) aux textes des sources (`enquete.js:107`, `journal.js:405`, `journal.js:444`), pas à l'interface.
- **Effet** : `couperLignes` (`texte.js:56`) découpe sur `/ +/` et le `text(x, y, l, h)` de p5 coupe aussi sur les espaces. Un « : », un « ? » ou un « » » peut donc se retrouver seul en début de ligne. Exemple : `jour.reste` (`i18n.js:326`) « Aujourd'hui : {n} à traiter… ». Je n'ai pas vu de capture de ce défaut : c'est un risque démontré par le code, pas un bug constaté.
- **Gravité** : majeur, par la quantité et parce qu'il contredit une règle écrite du projet. Effort S (une fonction appliquée dans `t()` quand la langue est `fr`, plutôt que 750 éditions à la main). Preuve : comptage par script.
- **Piste** : dans `t()` (`i18n.js:3890`), pour `fr` seulement, remplacer ` ([:;!?»])` par ` $1` et `« ` par `« `, hors heures `15:00` et hors URL. `U+00A0` est sûr dans JetBrains Mono. Pour `U+202F`, vérifier d'abord le glyphe (non vérifié). Ajouter un test.

### M3. Textes du dossier fictif et noms de sources codés en français, visibles en anglais
- **Incident fictif** : `game.js:274-275` définit `source: 'Scénario du jeu (fictif)'` et `texte_source: 'Agression en cours signalée à bord' / 'Vol à main armée signalé à un arrêt' + ', ligne ' + ligne + ' — incident fictif'`. La nature est traduite (`natureAffichee`, `T('fictif.nature.*')`, `game.js:263`), mais ces deux champs ne le sont pas. Ils s'affichent dans la bulle du plaignant quand aucune plainte n'est associée (`panneau.js:299-300`, `t('plaignant.source', { source: d.source })`), dans la citation de l'enquête (`enquete.js:73`) et via `phrase.*` (`panneau.js:147-154`). En anglais, le joueur lit donc une phrase française.
- **Panneau Données** : `donnees.js:18,76,86,99,116,126` code en dur `'Licence Ouverte (Nantes Métropole)'`, `'Open-Meteo — prévision'`, `'Agenda des événements de Nantes Métropole'`, `'Changelog daté du GTFS Naolib'` et `"Hub'Eau — hydrométrie, station M800001010"`. Le même libellé est pourtant traduit ailleurs (`enq.prov.agenda` = « Nantes Métropole events agenda »). La règle « données réelles jamais traduites » couvre le nom officiel d'un jeu de données, pas les descriptifs « prévision », « hydrométrie » ou « Changelog daté ».
- **Ponctuation française codée en dur** : 17 concaténations `+ ' : ' +` hors `i18n.js` (par exemple `accessibilite.js:76,84,96`, `parametres.js:92,152`, `autorisations.js:57`, `donnees.js:97`, `journal.js:508,571`, `community.js:511`, `sketch.js:1454`, `notifs-tel.js:440`) et 6 guillemets `'« ' + … + ' »'` (`donnees.js:84,114`, `enquete.js:85`, `panneau.js:229,243`, `journee.js:40`). En anglais, cela donne « Volume : 70 % » ou « « Accident » ». La plupart sont des annonces pour lecteur d'écran.
- **Bilan des chaînes françaises hors i18n** : 62 littéraux trouvés (`game.js` 34, `donnees.js` 6, `taches.js` 6, etc.). 47 sont des identifiants internes (`'événement'`, `'alerte météo'`, `'ligne en difficulté'`, des types de données). Ils ne s'affichent pas et sont traduits par `tSi('type.'+…)`, ce qui est sain. Les seuls textes visibles en dur sont ceux listés ci-dessus, plus deux replis sains : `installation.js:174` (texte affiché si `t` n'est pas chargé) et `expo.js:90` (repli de `texte('expo.retour')`).
- **Gravité** : majeur pour le fictif, qui touche chaque semaine en anglais et contredit la règle de marquage bilingue du prompt 162. Mineur pour le reste. Effort S. Preuve : lecture du code, non rejoué en jeu.
- **Piste** : clés `fictif.texte.agression`, `fictif.texte.vol` et `fictif.source` en `T()`. Clés `donnees.src.*`. Clé `commun.deuxPoints` (« {a} : {b} » / « {a}: {b} ») et `commun.cite` (« « {x} » » / « “{x}” »).

### M4. La police de titre déclarée n'est jamais livrée
- **Où** : `fonts.css:39-45` déclare `Bitsy Pixels` avec seulement `local()`, et le commentaire indique « fichier BitsyPixels.woff2 non fourni ». `site/public/fonts/` ne contient que les 4 fichiers JetBrains Mono. `style.css:14`, `index.html:74`, `cartel.astro` (h1–h3) et `making-of.astro` (h1, h2) l'appellent pourtant.
- **Effet** : pour presque tous les joueurs, `ds.js:83-118` dessine les titres en pixels de remplacement (JetBrains Mono bold réduit, binarisé puis agrandi ×2 ou ×4). Les pages Astro et l'écran de chargement HTML retombent sur JetBrains Mono normal. On obtient ainsi trois rendus de titre différents selon la surface, et le rendu « Bitsy » n'apparaît que sur la machine de quelqu'un qui a installé la police.
- **Gravité** : majeur pour la cohérence visuelle. Effort S si la licence permet la redistribution. Selon `fonts.css:34`, elle est « gratuite pour un usage personnel et commercial », mais la redistribution du fichier n'est pas vérifiée. Preuve : lecture et `ls`.
- **Piste** : vérifier la licence sur itch.io et déposer `fonts/BitsyPixels.woff2`. À défaut, retirer `Bitsy Pixels` des piles CSS et écrire dans le DS que le titre pixel est rendu par `dsTitre`.

### M5. Restes de l'identité Nantes Métropole dans le code servi (couleurs)
- **Où** : `site/src/pages/cartel.astro:31` et `site/src/pages/making-of.astro:57` utilisent `--lien: #005ae1`, la couleur `primary` de l'extraction metropole.nantes.fr (`DESIGN.md:5`). `site/public/ds.js:496` utilise `#00ca64`, la couleur `tertiary` de la même extraction, comme « fenêtre » de l'icône moniteur.
- **Le reste est sain** : aucune occurrence de « Picon » dans `site/public` ni `site/src` (hors données). Les 70 mentions de « Nantes Métropole » sont toutes des attributions de source (`manifest.json:19,21`, `telephone.js:8`, `i18n.js` crédits et provenance), sans logo ni revendication d'identité.
- **Gravité** : mineur, mais la règle de `CLAUDE.md` est explicite. Effort S. Preuve : grep. Le contraste de `#005ae1` sur blanc est de 5,92:1, conforme.
- **Piste** : liens des pages Astro en `#0D0C0C` souligné, ou en `DS.info` assombri. Remplacer `#00ca64` par `DS.succes` (`#00B74F`).

---

## Constats mineurs

| # | Constat | Où | Effort | Preuve / exemple | Piste |
|---|---|---|---|---|---|
| m1 | Apostrophes mélangées. FR : 168 chaînes avec `'` droite, 186 avec `’`. EN : 135 contre 49. Le même nom s'écrit de deux façons : `tel.app.regul` « Régul' » contre `commu.nom` « Régul’ Nantes ». Hors i18n, on trouve « Hub'Eau » (`donnees.js:126`) contre « Hub’Eau » dans les crédits | `i18n.js:1847`, `1419`, `326`, `303` | S | script `typo.mjs` | normaliser en `’` (règle de `jeu/88`), par script, en excluant le code |
| m2 | 2 clés mortes, présentes dans les deux langues | `i18n.js:491/2427` `mailf.fait.titre`, `1822/3758` `trace.titre` | S | aucune référence littérale ni par préfixe | supprimer |
| m3 | 680 clés lues seulement par concaténation (`'repl.' + r.cle`, `'tuto.' + n + '.titre'`, `'histoire.c' + n + '.' + k + 'Chrono'`…), donc invisibles à une recherche par grep. Les 11 clés `histoire.c*` passaient pour mortes avant vérification (`histoire.js:76`) | voir `usage.json` | M | analyse par préfixes | ajouter au test une liste des familles attendues (comme `test-jeu.mjs:547-567` le fait pour les variantes) |
| m4 | « [À COMPLÉTER] » visible par le joueur dans les Crédits : licence Hub'Eau (déjà relevé dans `audit-2026-11-12.md:120`, toujours présent) et `credits.ia.humain.v` « relecture, tests en salle : [À COMPLÉTER] ». En anglais, le marqueur reste en français | `i18n.js:1351/3287`, `1369/3305` | S | valeurs du dictionnaire | compléter avec une source vérifiée, ou retirer la ligne |
| m5 | Le seul accord au nombre géré est `mp.actifs.un/plusieurs` (`histoire.js:13`). Je confirme les 133 « (s) » de `jeu/203` (67 FR + 65 EN) ; l'anglais hérite des « notification(s) », « fact(s) » | `i18n.js` | M | script | mécanisme `{n}` à formes `one/other` dans `t()` via `Intl.PluralRules` |
| m6 | Abréviation `jaugeCourt.budget` « Bud. » identique en FR et EN, et doubles espaces d'alignement dans 3 chaînes (« Voir le bilan␠␠(Entrée) ») | `i18n.js:1545/3481`, `186`, `195`, `196` | S | script | cf. `jeu/203`, constat 4 pour les abréviations ; une seule espace |
| m7 | Couleurs d'interface hors palette. La courbe « fluidité » du Journal est `#7FB2FF`, une teinte présente une seule fois dans le code ; la courbe « réputation » utilise `#FFC138`, que `DESIGN.md:239` réserve au sens « alerte / jauge sous 40 ». Le fond de page `#0c1016` (`style.css:6`) diffère de `DS.fond` `#0D0C0C`, volontairement selon le commentaire. Les couleurs « papier » `#1e7a3c`, `#a15c07` et `#b3261e` sont répétées en littéral dans `accessibilite.js:9`, `histoire.js:235,474` et `bureau.js:34` au lieu d'être des jetons | `journal.js:190-194` ; `style.css:6` ; `histoire.js:235` | S | `couleurs.mjs` | `DS.info`/`DS.infoClair` pour la fluidité ; une teinte non sémantique pour la réputation ; un objet `DS.papier` partagé |
| m8 | Pas d'échelle typographique écrite. On compte 26 tailles distinctes (14→110 px), dont des valeurs impaires (17 ×13, 19 ×11, 21, 23, 25). 35 appels en 14–15 px, dont 21 dans `journal.js`, sont relevés à l'exécution à 18/20 px dans l'espace PC (`accessibilite.js:57-59`) : la taille écrite dans le code ne correspond pas à la taille rendue | `journal.js`, `notifs-tel.js` | M | `couleurs.mjs` (relevé `textSize`/`dsTexte`) | une échelle `DS.texte = {xs:16, sm:18, md:20, lg:24, xl:32, xxl:48}` dans `ds.js`, documentée dans `DESIGN.md` |
| m9 | Deux sources pour la palette : `pixel-palette.tokens.json` n'est lu par aucun script, et `ds.js:9-30` recopie les valeurs à la main | `design-system/pixel-palette.tokens.json` | S | grep `pixel-palette` sans résultat dans `site/` | test qui compare `DS` au JSON |
| m10 | La licence du Pixel DS (PDF Figma Community redistribué dans le dépôt) vaut « [À COMPLÉTER] ». `pixel-design-system.md:5-11` contient aussi l'adresse e-mail et l'identifiant Figma personnels du compte, ce qui n'est pas un secret mais relève de l'hygiène | `design-system/README.md`, `pixel-design-system.md:5-11` | S | lecture | relever la licence sur la page Community ; retirer l'e-mail et l'identifiant |
| m11 | Pages Astro : français uniquement, thème clair (fond blanc, texte noir) à l'opposé du jeu sombre en pixels, apostrophes droites (« l'édition », « l'œuvre »). Commentaire périmé « Seule page Astro du site » (`cartel.astro:2`) alors qu'il en existe deux. Sur le fond, le ton (factuel, « vraie partie », sources citées) et les noms (« Nantes en régulation », « PATRIMOINE.EXE · NTE001 ») sont cohérents avec le jeu | `site/src/pages/cartel.astro:2,31,49`, `making-of.astro:57` | S–M | lecture | corriger le commentaire ; `’` ; décider si le cartel suit le DS sombre ou reste en clair pour l'impression |

---

## Ce qui est sain
- Parité totale des clés FR et EN, gardée par un test (`test-jeu.mjs:966-968`). Placeholders identiques dans les deux langues, aucune valeur vide, aucun doublon dans l'objet littéral.
- `t()` retombe sur le français, puis sur `[À COMPLÉTER]` (`i18n.js:3890-3896`), et `T()` produit un texte différé qui change de langue en cours de partie. Les 1 452 appels littéraux visent tous une clé existante.
- Aucune majuscule non accentuée (« Etat », « A la ») dans les chaînes FR, 112 capitales accentuées. Les tirets sont des cadratins (69) ou des demi-cadratins (6), jamais « - » entre espaces. On compte 17 « … » ; les 3 « ... » sont des points de conduite volontaires dans le BIOS (`os.bios.*`). Pas de guillemets droits `"` en FR, pas de « » ni d'espace avant la ponctuation en EN.
- Traductions anglaises naturelles et plus courtes (seulement 7 chaînes EN dépassent le FR de plus de 20 %).
- Aucune police Picon ni identité Nantes Métropole revendiquée dans le code servi. JetBrains Mono est auto-hébergée (OFL), avec `font-display: swap`, et chargée hors ligne.
- Couleurs fonctionnelles : `DS.erreur` (3,50:1), `DS.info` (3,99:1) et `DS.primaire` (3,56:1) ne servent jamais de couleur de texte dans `dsTexte` (0 occurrence). `DS.primaireTexte` `#E04A5C` donne 4,93:1. Les accents sont calculés et testés par palette (`theme.js:1-60`).
- Le décor en pixels (`bureau.js`, `immersion.js`, `histoire.js`) est explicitement hors palette selon `DESIGN.md:239` : ses 237 teintes ne sont pas une dérive.
