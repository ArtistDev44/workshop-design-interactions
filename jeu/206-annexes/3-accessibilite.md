# Audit 3 — Accessibilité (PATRIMOINE.EXE · NTE001, commit f07351b)

Worktree audité : `/home/guillaume/ESD_Docs/design-interaction/wt-205`, rien n'y a été modifié. Pilotage : Chromium headless
(playwright-core 1.65, chrome-headless-shell 1248), serveur `http.server 8403`. Scripts et mesures brutes :
`/tmp/claude-1000/-home-guillaume-ESD-Docs-design-interaction-workshop-design-interactions/88dcdbf9-0df7-4d43-8294-89b0b713b755/scratchpad/a11y/`
(`sonde.js`, `contraste-run.mjs`, `contraste-1920b.json`, `mouvement*.mjs`, `secousse.mjs`, `clavier.mjs`, `zoom.mjs`, `cibles-1366.json`).

Ce rapport ne reprend pas ce que `jeu/203-audit-ux.md` a déjà relevé : texte de 5 à 8 px en mobile portrait,
focus initial sur une réponse du clash Community, Tab qui ne passe jamais dans le DOM, pied de Paramètres qui déborde.
Quand je confirme un de ces constats, je le cite.

## Méthode

1. **Contraste mesuré au pixel, dans le canevas.** Une sonde (`sonde.js`) enveloppe `p5.prototype.text`. À chaque appel,
   elle lit dans le contexte de dessin la couleur de remplissage, l'alpha (alpha du remplissage × `globalAlpha`) et la couleur
   de fond majoritaire sous la boîte du texte (`getImageData` avant le tracé). Elle calcule ensuite le rapport WCAG après
   composition de l'alpha. Elle a tourné sur tout le parcours `?audit=textes&parcours=1` : environ 70 écrans × FR/EN ×
   contraste normal/renforcé, en 1920 × 1080. Résultat : 2 804 couples texte/couleur/fond distincts. Pour chaque couple, la sonde
   garde l'état le plus opaque, pour ne pas compter les fondus d'ouverture.
2. **Calcul des ratios des jetons** (`ds.js`, `sketch.js` `C`, `theme.js`, `accessibilite.js`, `style.css`, pages Astro,
   `design-system/DESIGN.md`).
3. **Clavier** : démarrage à froid, Tab, flèches, L, puis bandeau DOM « nouvelle version » (`clavier.mjs`).
4. **Mouvement** : émulation `reducedMotion: 'reduce'` comparée à `no-preference`. La secousse est mesurée par `Juice.E.trauma`
   après `feedback('large')`, la variation d'image par luminance sur une grille 64 × 36, avec recherche de flashs alternés
   ΔL ≥ 0,1 par zone et par seconde.
5. **Zoom** : émulation 200 % et 300 % (fenêtre CSS divisée et `deviceScaleFactor` ×2 et ×3), puis mesure de la taille
   physique du canevas.
6. **Cibles** : `petitesCibles` du rapport `AUDIT_TEXTES` en 1366 × 768.
7. **Lecture du code** : `accessibilite.js`, `confort.js`, `juice.js`, `feedback.js`, `cafe.js`, `webcam.js`, `micro.js`,
   `expo.js`, `installation.js`, `i18n.js`, `sketch.js` (`keyPressed`), pages `site/src/pages/*.astro`.

## Synthèse

| # | Constat | Critère | Gravité | Effort | Preuve |
|---|---|---|---|---|---|
| 1 | Aucune structure accessible : le jeu entier est un `<canvas>` sans rôle ni nom, et les commandes ne sont pas exposées | 1.3.1, 4.1.2 | **Bloquant** (lecteur d'écran) | L | mesuré + code |
| 2 | Le zoom du navigateur ne grossit rien, et le zoom tactile est interdit | 1.4.4, 1.4.10 | **Majeur** | M | mesuré |
| 3 | Raccourcis d'une seule lettre, globaux, impossibles à désactiver (L, F, Z, I, V, H, M…) | 2.1.4 (A) | **Majeur** | S | code + vu |
| 4 | Bandeau DOM « Nouvelle version » inatteignable au clavier : le jeu avale Tab | 2.1.1, 2.4.3 | **Majeur** | S | mesuré |
| 5 | « Taille du texte » plafonnée à 130 % et à 24 px | 1.4.4 | Majeur (lié au 2) | M | code |
| 6 | Changement de langue (L) non annoncé ; l'annonce en cours reste dans l'ancienne langue | 4.1.3, 3.1.2 | Mineur | S | mesuré |
| 7 | `prefers-reduced-motion` lu une seule fois au chargement | 2.3.3 (AAA) / engagement projet | Mineur | S | code |
| 8 | Jauge critique : barre rouge sur la piste à 2,5:1, et à environ 1,6:1 au creux de sa pulsation ; aucune valeur chiffrée | 1.4.11, 1.4.1 | Mineur | S | calculé + code |
| 9 | Mode expo : 15 s pour prolonger avant rechargement (le seuil WCAG est de 20 s) | 2.2.1 | Mineur | S | code |
| 10 | Bonus du souffle au micro sans équivalent clavier (défi chrono) | 2.1.1 (fonction facultative) | Mineur | S | code |
| 11 | Texte anglais du chargement et du `<noscript>` sans `lang="en"` | 3.1.2 | Mineur | S | code |
| 12 | `DESIGN.md` : paire `surface` / `on-surface` à 2,23:1 (jeton non utilisé par le jeu) | 1.4.3 (doc) | Mineur | S | calculé |

Aucun constat bloquant ou majeur sur le contraste du texte, le respect des animations réduites ou les flashs : les
engagements de `jeu/10` et `jeu/43` sont tenus sur ces points (détail dans « Ce qui est sain »).

---

## Constats détaillés

### 1. Le canevas n'expose ni structure ni commandes aux technologies d'assistance — bloquant pour un joueur au lecteur d'écran
- **Où** : `site/public/index.html:127-129` (`<main aria-label>` qui contient seulement `<p id="annonces" aria-live="polite">`) ;
  `sketch.js:98` (`createCanvas`) ; `i18n.js:3998-4001` (`annoncer` écrase `textContent`).
- **Critères** : 1.3.1 Information et relations, 4.1.2 Nom, rôle et valeur, 2.4.6 En-têtes et étiquettes.
- **Preuve** : mesuré. Attributs du canevas : `tabindex=null`, `role=null`, `aria-label=null`, `aria-hidden=null`.
  `document.activeElement` reste `BODY` après Tab, ce qui confirme `jeu/203` § 7. Aucun bouton, onglet ni réglage n'existe dans le DOM.
- **Scénario** : avec NVDA, le joueur entend « Nantes en régulation, région principale », puis les messages de la région
  live au fil de l'eau (« Palmarès », « Paramètres »…). Il ne peut ni relire le dossier en cours, ni lister les actions
  possibles, ni connaître la valeur des jauges à la demande. L'information n'existe que si une annonce passe au bon moment,
  et une annonce chasse la précédente (`textContent` remplacé).
- **Ce qui existe déjà** : la couverture des annonces est étendue (environ 40 fichiers appellent `annoncer` : décisions, hausse
  et baisse des jauges, signalements, menu, Community, guide). C'est un vrai effort, pas cosmétique.
- **Piste** : ajouter un **miroir DOM minimal** hors écran (`.sr-only`), mis à jour à chaque changement d'écran :
  un `<h1>` pour l'écran courant, la liste des actions de la vue sous forme de `<button>` qui appellent les mêmes fonctions,
  et une ligne d'état « Fluidité 42 / Réputation 61 / Budget 18 ». Donner au canevas `aria-hidden="true"` une fois le miroir
  en place. À défaut, au minimum : une touche « relire » (dossier courant + jauges) et `role="application"` assumé sur
  `#scene`. Test NVDA / VoiceOver : `[À COMPLÉTER]` (non fait dans cet audit, ni dans `jeu/203`).

### 2. Le zoom du navigateur n'agrandit rien, et le zoom tactile est bloqué
- **Où** : `index.html:5` (`maximum-scale=1, user-scalable=no`) ; mise à l'échelle du canevas dans `mobile.js:29` (`windowResized`).
- **Critères** : 1.4.4 Redimensionnement du texte (AA), 1.4.10 Redistribution.
- **Preuve** : mesuré (`zoom.mjs`).

  | Fenêtre CSS | Zoom émulé | Canevas CSS | Canevas en px physiques |
  |---|---|---|---|
  | 1366 × 768 | 100 % | 1365 | 1365 |
  | 683 × 384 | 200 % | 683 | **1365** |
  | 455 × 256 | 300 % | 455 | **1365** |

  Le canevas se recale toujours sur la fenêtre, donc Ctrl + « + » ne change pas la taille physique du texte. Seule la netteté
  change : le tampon reste en 1920 × 1080 avec `pixelDensity(1)`. Sur téléphone, `user-scalable=no` interdit le pincement :
  Chrome Android le respecte par défaut ; iOS l'ignore depuis iOS 10.
- **Scénario** : une personne malvoyante, en 1366 × 768, ne peut pas agrandir les textes de 13 à 14 px réels relevés par
  `jeu/203` § 4. Sur téléphone, elle ne peut pas pincer les textes de 5 à 8 px (`jeu/203` § 8).
- **Piste** : retirer `maximum-scale=1, user-scalable=no` (garder `viewport-fit=cover`). Pour le bureau, deux voies.
  (a) Lire `devicePixelRatio / zoom` et passer la vue en « mise en page agrandie », par exemple en réutilisant la
  recomposition de `portrait.js`. (b) Plus simple : porter l'option « Taille du texte » jusqu'à 200 % (voir constat 5).

### 3. Raccourcis d'une seule lettre, actifs partout et non désactivables
- **Où** : `sketch.js:1202` (Z = s'endormir), `:1208` (F = plein écran), `:1210` (L = langue), `:1259` (I = Indicateurs),
  V, H, M (micro), J, D, Q (fin de journée, annoncée sur l'écran de transition), chiffres 1 à 3 (réponses Community).
  Aucun réglage pour les couper dans `confort.js:32` (`DEFAUTS`).
- **Critère** : 2.1.4 Raccourcis clavier avec un caractère (niveau A).
- **Preuve** : lu dans le code ; vu en jeu (L a fait passer `lang` de `fr` à `en` sur l'écran titre).
- **Scénario** : un joueur en commande vocale (Dragon, Voice Control) dicte une phrase. Chaque « l » bascule la langue et
  chaque « z » endort le personnage. Pendant une sieste forcée, Espace, Entrée et Z réveillent : d'autres touches ont des
  effets de jeu irréversibles (D = rendre son badge, derrière une confirmation : à vérifier).
- **Piste** : ajouter un réglage « Raccourcis à une lettre : activés / désactivés » dans Paramètres → Accessibilité. Une fois
  désactivés, n'accepter ces touches qu'avec un modificateur (Maj + L) ou seulement quand la vue concernée a le focus.
  `saisieOuRaccourciNavigateur()` (`sketch.js:1168`) est le bon endroit pour filtrer.

### 4. Le bandeau DOM « Nouvelle version » ne peut pas être atteint au clavier
- **Où** : `installation.js:84-104` (`bandeauNouvelleVersion` : deux `<button>`, sans `focus()`) ; `sketch.js:1168-1176` : le jeu
  ne laisse passer le clavier que si le focus est dans un INPUT, un TEXTAREA ou un SELECT, puis `keyPressed` renvoie `false` et
  annule Tab. Le kiosque n'est pas concerné (`expo.js:12`).
- **Critères** : 2.1.1 Clavier, 2.4.3 Parcours du focus.
- **Preuve** : mesuré. Après `bandeauNouvelleVersion()`, six appuis sur Tab laissent `document.activeElement` sur `BODY`
  à chaque fois. Les boutons « Recharger » et « Fermer » ne sont atteignables qu'à la souris.
- **Ce qui marche** : la boîte d'import de sauvegarde, elle, est exemplaire (`sauvegarde.js:457-530` : `role="dialog"`,
  `aria-modal`, focus initial, Tab bouclé, Échap, focus rendu à l'origine).
- **Piste** : dans `saisieOuRaccourciNavigateur`, laisser passer aussi le clavier quand `document.activeElement` est un
  `BUTTON` ou `A`, ou est à l'intérieur de `#nouvelle-version`. Donner le focus au bouton « Recharger » à l'apparition du bandeau,
  ou ajouter un raccourci annoncé.

### 5. L'option « Taille du texte » ne suffit pas à compenser le constat 2
- **Où** : `accessibilite.js:17` (`TAILLES_TEXTE = [100, 115, 130]`), `:57` (`v = s < 24 ? Math.min(s * ECHELLE_TEXTE, 24) : s`).
- **Critère** : 1.4.4.
- **Preuve** : lu dans le code ; `jeu/43` documente ce plafond (« à 130 % pour tous les textes, l'appli et le rapport se chevauchaient »).
- **Scénario** : un texte de 18 px sur le canevas, affiché à environ 12,8 px CSS en 1366 × 768, monte au mieux à 23,4 px sur le canevas,
  soit environ 16,6 px CSS. On est loin du ×2 attendu.
- **Piste** : ajouter un palier 160 % puis 200 % qui bascule sur une mise en page « grand texte ». Il peut s'agir de la
  recomposition portrait (`portrait.js`), qui agrandit déjà les régions, utilisée aussi en paysage.

### 6. Le changement de langue n'est pas annoncé
- **Où** : `i18n.js:3977-3994` (`changer` / `suivante` : met à jour `lang`, le `title` et l'`aria-label` de `#scene`, mais
  n'appelle pas `annoncer`).
- **Critères** : 4.1.3 Messages d'état ; 3.1.2 pour le contenu laissé dans l'ancienne langue.
- **Preuve** : mesuré. Après L sur l'écran titre, `lang="en"`, mais `#annonces` contient encore « Installer le jeu » en
  français, et aucune annonce de bascule n'est faite.
- **Piste** : `annoncer(t('langue.annonce'))` dans `changer` quand `!initial`. Le message est lu par la synthèse anglaise
  puisque `lang` a déjà changé.

### 7. `prefers-reduced-motion` n'est lu qu'au chargement
- **Où** : `sketch.js:60-61` (`matchMedia(...).matches`, sans écouteur `change`), `:67`.
- **Critère** : 2.3.3 (AAA) ; engagement du projet (« `prefers-reduced-motion` respecté »).
- **Preuve** : lu dans le code.
- **Scénario** : une personne qui active « Réduire les animations » dans son système en cours de partie, par exemple après une
  nausée pendant le boost du café, garde la secousse et le flou jusqu'au rechargement. Le réglage du jeu, lui, reste disponible.
- **Piste** : `matchMedia(...).addEventListener('change', appliquerReglages)`.

### 8. Jauge critique peu contrastée, et seule sa couleur porte l'état
- **Où** : `panneau.js:56-65` (« plus de valeur chiffrée, la barre suffit ») ; `feedback.js:100` (opacité du critique
  0,55 + 0,45 × pulsation) ; `sketch.js:41` (`C.piste` = blanc 15 %).
- **Critères** : 1.4.11 Contraste des éléments non textuels, 1.4.1 Utilisation de la couleur.
- **Preuve** : calculé. Le rouge `#D10B00` sur la piste (blanc 15 % sur `#0D0C0C`, soit `#2C2B2B`) donne **2,53:1** (le seuil est
  de 3:1). À l'opacité 0,55 du creux de pulsation, on tombe à environ 1,6:1. Le vert (5,30) et l'orange (8,70) passent.
  La palette tritanopie (`#E8003D`) donne 3,02. Les repères de seuil 20 / 40 (blanc 170/255) sont, eux, bien visibles.
- **Scénario** : un joueur malvoyant ne distingue plus la longueur de la barre quand la jauge est sous 20, alors que c'est
  le moment où l'information compte le plus. `jeu/203` § 4 note aussi l'absence de valeur chiffrée.
- **Piste** : en dessous de 20, entourer la barre d'un liseré clair ou utiliser `DS.erreurClair` (`#FFC5C2`, 12:1) ; ne pas
  descendre sous l'opacité 0,8 ; ou rendre la valeur chiffrée au survol et au focus.

### 9. Mode exposition : le délai pour prolonger est court
- **Où** : `expo.js:7`, `:33` (`compteRebours: 15000`).
- **Critère** : 2.2.1 Réglage du délai : au moins 20 s pour prolonger d'un geste simple.
- **Preuve** : lu dans le code. Le reste est sain : 90 s d'inactivité, horloge du jeu suspendue, annonce aria-live unique.
- **Piste** : passer `compteRebours` à 20 000 ms.

### 10. Le bonus du souffle n'a pas d'équivalent sans micro
- **Où** : `micro.js:216-233` (souffle pendant le boost : le compteur ralentit de moitié en défi chrono).
- **Critère** : 2.1.1. La fonction est facultative ; c'est surtout une question d'équité entre joueurs.
- **Preuve** : lu dans le code. **Sain par ailleurs** : le micro est en push-to-talk, refusé ou absent il donne seulement
  « Micro indisponible ». La webcam est désactivée par défaut, et la sieste par la main a un équivalent clavier, Z
  (`sieste.js:10`, `sketch.js:1198-1202`).
- **Piste** : maintenir Espace pendant le boost ferait le même effet, ou couper ce bonus quand le micro est indisponible.

### 11. Textes anglais sans `lang`
- **Où** : `index.html:124` (« Chargement… · Loading… »), `:128` (`<noscript>` bilingue).
- **Critère** : 3.1.2 Langue d'un passage. **Gravité** : mineur. **Piste** : `<span lang="en">Loading…</span>`.

### 12. `DESIGN.md` : une paire de jetons sous le seuil
- **Où** : `design-system/DESIGN.md:8-9` (`surface #0000EE` / `on-surface #000000` : **2,23:1**). `tertiary #00CA64` sur
  blanc : 2,18:1. Ces jetons, issus du site de la Métropole, ne sont utilisés nulle part dans `site/public` (vérifié par grep) :
  ce n'est un risque que si quelqu'un les reprend.
- **Piste** : annoter ces jetons « non utilisés, ne pas employer en paire texte/fond », ou les retirer.

---

## Ce qui est sain (vérifié)

- **Contraste du texte du canevas : tenu.** Sur les 2 804 couples mesurés au pixel (FR/EN, contraste normal et renforcé),
  aucun texte opaque n'est sous 4,5:1 (ou sous 3:1 pour un texte ≥ 24 px ou ≥ 18,66 px en gras). Les seules alertes
  restantes sont 5 pastilles de ligne (« C1 », « C3 », `#0D0C0C` sur un fond relevé `#171616` ou `#D4031C`, `texte.js:217`
  appelé depuis `enquete.js:246`). Elles sont **non vérifiées et probablement des artefacts** du relevé de fond : la fonction
  `texteSurCouleur` (`enquete.js:191-196`) choisit le meilleur de blanc ou noir avec le bon seuil de luminance (0,18 ≈ 0,179),
  et sur `#D4031C` elle rendrait du blanc (5,48:1). Les textes à moins de 4,5:1 sont tous pris pendant un fondu (aide, paramètres,
  sources : `aide.js:354`, `parametres.js:295`, `enquete.js:409`) ou sont des entrées verrouillées à 40 % (`menu-app.js:55` :
  composant inactif, exempté par 1.4.3).
- **Jetons** : blanc 75 % → 10,99:1, gris 60 % → 7,29 (7,07 sur panneau), blanc 50 % → 5,37, `primaireTexte #E04A5C` → 4,93
  (4,56 sur panneau), succès 7,34, alerte 12,03, `erreurClair` 13,04 ; blanc sur primaire 5,48, blanc sur erreur 5,59.
  `theme.js:36-60` **calcule** les dérivées de l'accent (texte à 4,5:1 ou plus, trait à 3:1 ou plus sur `#171616`) pour chacune des six palettes,
  et c'est testé dans `test-jeu.mjs`. Les palettes daltonisme ont toutes leur texte critique à 4,5:1 ou plus. Seuils de vigilance :
  `DS.erreur #D10B00` (3,50) et `DS.info #3860FF` (3,99) ne doivent jamais servir de couleur de texte. Le code les réserve aux
  aplats et barres ; à garder ainsi.
- **Focus visible** : trait `primaireTrait` à 3,56:1 sur le fond (3,29 sur panneau), donc 3:1 ou plus (2.4.7 / 1.4.11) ; cadre épais
  confirmé par `jeu/203` § 1.
- **Animations réduites : tenu** (mesuré). Avec `reducedMotion: 'reduce'`, `reduireAnimations === true`. Après
  `feedback('large')`, le trauma de la secousse reste à **0** sur 8 mesures, contre 0,66 → 0 en environ 0,5 s sans réduction
  (`juice.js:22, 33`). La parallaxe à la souris est fortement atténuée : part de pixels qui changent 0,32 % au lieu de 4,15 %.
  La pluie est figée (`bureau.js:281-284` : `tps = 0`, densité ÷ 2), la météo passe sans transition (`bureau.js:204`), le
  voile est immédiat (`ds.js`), le chargement n'a pas de transition (`index.html`), le boost du café est remplacé par un
  liseré fixe (`cafe.js:196-203`). Un réglage de jeu « Secousses 0 / 50 / 100 % » existe à côté.
- **Flashs : aucun** au-delà de 3 par seconde (mesuré sur le menu, le bureau, le poste, une décision, la parallaxe : 2
  au plus, dus au survol simulé). Par construction, le battement rouge du boost plafonne à 140 bpm, soit 2,33 Hz
  (`cafe.js:152-153`), et uniquement en vignette sur les bords. Les jauges n'ont plus d'éclair (`feedback.js:4, 65`).
- **Délais** : Échap (menu) et l'aide suspendent l'horloge (`immersion.js:252-253`). La pause n'est refusée qu'en défi chrono
  facultatif, avec d'autres compteurs actifs (`sketch.js:403`, annoncé). Lecture facile : ×1,5.
- **Langue** : `lang` mis à jour à chaud avec le `title` et l'`aria-label` (`i18n.js:3981-3984`) ; `annoncer` parle toujours
  la langue active.
- **Capteurs** : webcam et micro sont facultatifs, demandés seulement sur un geste, sans image enregistrée ; tout est jouable sans eux.
- **Glisser-déposer** : il existe une alternative au clic (jeton choisi puis marqueur, `carte-alertes.js:408-419`) et au clavier
  (Maj + touches d'équipe) — 2.5.7.
- **Cibles (desktop)** : en 1366 × 768, la plus petite cible mesure 36 px sur le canevas, soit environ **25,6 px CSS**, donc 24 px ou plus
  (2.5.8). En mobile portrait, voir `jeu/203` § 8.
- **Orientation** : portrait et paysage pris en charge (`portrait.js`), donc 1.3.4 tenu.
- **Pages Astro** (`cartel.astro`, `making-of.astro`) : `lang="fr"`, `<main>`, titres hiérarchisés, `alt` descriptifs sur
  les captures et les QR codes, `focus-visible` à 3 px, contrastes texte 21:1, trait `#5C5C5C` 6,69:1, liens `#005AE1` 5,92:1,
  bande-annonce avec `track kind="descriptions"` et transcription liée. Rien à signaler, à part l'absence de lien
  d'évitement (mineur, pages courtes).

## Engagements de `jeu/10` et `jeu/43` : tenus ou non ?

| Engagement | Verdict |
|---|---|
| Contraste suffisant (jauges, alertes, textes) | **Tenu pour le texte** (mesuré) ; **non tenu pour la jauge critique** comme élément graphique (constat 8) |
| Pas de flash rapide | **Tenu** (mesuré + code) |
| `prefers-reduced-motion` respecté | **Tenu** au chargement ; pas de réaction en cours de partie (constat 7) |
| Jouable au clavier seul | **Tenu dans le canevas** ; **non tenu** pour le bandeau DOM (constat 4) ; raccourcis à une lettre sans possibilité de les couper (constat 3) |
| Version fonctionnelle sans audio | Non contredit (les annonces et les visuels doublent les sons). Écoute réelle : `[À COMPLÉTER]` |
| Taille du texte 100 / 115 / 130 % | Tenu tel que documenté, mais insuffisant au regard de 1.4.4 (constats 2 et 5) |
| Palettes daltonisme | Tenu : ratios du texte critique 4,5:1 ou plus pour chaque palette |

## Limites
- Pas de test avec un vrai lecteur d'écran (NVDA, VoiceOver, TalkBack) : `[À COMPLÉTER]`.
- La sonde de contraste prend comme fond la couleur opaque majoritaire sous la boîte du texte. Les textes posés sur des
  dégradés ou sur la pièce en pixel art, et les 281 relevés non mesurables (fond transparent d'un tampon), ne sont pas couverts.
- La mesure des flashs couvre des séquences de 3 à 5 s sur 6 situations, pas une partie complète.
