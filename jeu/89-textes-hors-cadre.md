# 89 — Textes hors de leur cadre : détecter, réparer, sans rien casser (prompt 93)

Rapports : `jeu/89-audit-textes-avant.json` (avant correction) et `jeu/89-audit-textes-apres.json` (après), aux tailles 1920×1080, 1366×768 et 412×915 (mobile portrait). Chaque rapport couvre les 2 langues et le contraste normal ou renforcé.

## Outil : `site/public/audit-textes.js` (développement seulement)

**Chargement**
- Le fichier n'est chargé qu'avec `?audit=textes`, par un chargeur placé en fin d'`installation.js`, avant l'initialisation de p5.
- Sans ce paramètre, il n'est jamais demandé au serveur. `zoneTexteDebut`, `zoneTexteFin` et `zoneTexteDeclarer` restent des fonctions vides dans `sketch.js` : aucun coût.
- `npm test` vérifie que le module n'est actif qu'avec le paramètre.

**Cadres déclarés**
- `bouton()`, `dsBouton()`, `dsBadge()`, les infobulles, les pastilles de delta et les tampons encadrent leur libellé (`zoneTexteDebut` / `zoneTexteFin`).
- Ces conteneurs déclarent leur cadre pour l'image en cours (`zoneTexteDeclarer`) : `panneau()`, `dsPanneau()`, l'écran du téléphone, les cartes de réponse, les cartes de la file, les tuiles et cartes du Journal, les messages du Patron, les posts Community et les notifications.
- Les zones défilantes sont déclarées « clip » : sources de l'enquête, fil Community, frise du Journal, fil du Patron. Un texte masqué par le défilement n'y est pas signalé. Un texte entièrement visible y est vérifié contre sa carte.

**Mesure**
- `text()` est enveloppé au niveau de `p5.prototype`, comme le fait `i18n.js`. Pour chaque appel, l'outil calcule la boîte réelle :
  - `textWidth`, `textAscent` / `textDescent`, interligne ;
  - `textAlign` horizontal et vertical ;
  - coupure mot par mot recalculée comme p5 pour les textes en boîte.
- La boîte est convertie en pixels du canevas par la transformation en cours (`getTransform`).
  - Le contenu du PC et la pièce ne mélangent pas leurs zones.
  - Les `p5.Graphics` sont mesurés dans leur propre cadre.
  - Les tampons tournés sont comparés dans leur repère local.
- Zone de référence d'un texte, dans cet ordre :
  1. la zone encadrante active ;
  2. sinon, la zone déclarée la plus récente qui contient le point d'ancrage (la plus au premier plan) ;
  3. sinon, l'écran du PC ou le canevas.

**Défauts signalés**
- Un défaut est signalé si la boîte sort de sa zone de plus de 1 px, ou si un texte en boîte est coupé (hauteur nécessaire supérieure à `h`, sans « … »).
- Catégories : **A** bouton ou pastille, **B** multi-ligne coupé, **C** carte ou panneau, **D** écran ou canevas, **E** chevauchement de deux textes dans une même zone.
- Pour E, la boîte des chiffres et des capitales ne compte pas la descente (aucun jambage).

**Restitution**
- Contours fixes (aucun clignotement) : rouge autour du texte, orange autour de la zone.
- Panneau de rapport HTML repliable, avec un bouton JSON (`audit-textes-AAAA-MM-JJ.json`).
- `window.AUDIT_TEXTES.rapport()` renvoie le rapport.
- Dédoublonnage par écran, texte et zone. Chaque défaut indique l'écran, l'étape, la fonction et la ligne appelantes, la langue, la taille et le contraste.

**Parcours** (`?audit=textes&parcours=1`)
- 59 étapes, chacune jouée en 2 langues avec et sans contraste renforcé :
  - menu (titre, chaque semaine, paramètres, aide, options, accessibilité, palmarès, partage) ;
  - bureau, RégulOS et chaque appli (Patron, Community, Journal jour et semaine, Indicateurs, Données, Corbeille) ;
  - Signalements : file, un dossier de chaque type (événement, alerte météo, perturbation avec contradiction), sources révélées, Historique, Équipes, narration ;
  - fenêtres en partie (aide, paramètres, options, reset, menu, démission, café, partir), pause, téléphone, SMS, carte de déblocage ;
  - cas extrêmes : jauges à 0 et 100, retard de 125 min, lignes « C1, C2, C3, 4, 5 », plus long `texte_source` réel ;
  - mail du soir, soir, rapport de la veille, fin de semaine et rapport, 3 cinématiques, licenciement (lettre et journal).
- Seul l'état stable est relevé : les 3 dernières images de chaque étape, pas les animations d'entrée.
- La taille d'écran est celle de la fenêtre. Le parcours a été lancé avec Playwright (Chromium) aux 3 tailles.

## Rapport avant correction

| Taille | Total | B | C | E |
|---|---|---|---|---|
| 1920×1080 | 85 | 53 | 26 | 6 |
| 1366×768 | 87 | 53 | 29 | 5 |
| 412×915 (mobile) | 96 | 53 | 36 | 7 |

**Remarque :** le rapport « avant » a été pris sans les cadres de `panneau()` et `bouton()` dans `sketch.js` (ajout perdu puis remis). Les défauts liés à ces cadres n'y sont donc pas comptés. Le rapport « après », lui, les mesure : aucun défaut A ou C n'y reste.

Défauts par cause, en 1920×1080, à rapprocher de la liste des corrections :

| Fonction (fichier:ligne) | Nombre | Cat. | Défaut |
|---|---|---|---|
| `dessinerBandeau` (panneau.js:55) | 34 | B | ligne 2 du bandeau en boîte d'une ligne : l'heure disparaissait quand la ligne était longue |
| `contenuConversation` (telephone-main.js:137) | 22 | C | « Le patron · direction de la salle » (EN : « The boss · control room management ») sortait de l'écran du téléphone de 21 px |
| `dessinerCartesReponses` (panneau.js:286) | 7 | B | explication des cartes de réponse coupée quand « En savoir plus » est ouvert, par le décalage de 50 px ajouté au prompt 92 (régression) |
| `fenetreParametres` (sketch.js:1534) | 5 | B | crédits musicaux sur 2 lignes dans une case d'une ligne (640 px) |
| `dessinerFileSignalements` (carte.js:271) | 4 | B | noms de lignes multiples coupés sans « … » |
| `fenetrePalmares` (mecaniques.js:238) | 3 | B | aide du palmarès coupée (case de 70 px) |
| `tuileFond` / tuile « signalements » (journal.js) | 4 | C | titre « BONNES DÉCISIONS » plus large que sa tuile ; « dont n non traité(s) » sous le bas de la tuile |
| (chevauchements) | 6 | E | horloge du téléphone / date ; titre de la courbe / « 300 » : effet de la descente, corrigé dans la mesure |

Les 10 pires défauts sont tous le nom du contact dans le téléphone en anglais (+21 px).

## Corrections (la plus petite qui marche, dans l'ordre du prompt)

- **Lot 2, Signalements :**
  - **Bandeau** (solution 2) : l'heure reste entière, alignée à droite ; le début de la ligne finit par « … » après un mot entier ; la ligne complète s'affiche en infobulle au survol.
  - **Cartes de réponse** : retour à la hauteur d'origine. J'ai annulé le décalage de 50 px du prompt 92 ; la zone des sources repasse à 238 px et défile.
  - **File** (solution 1) : `dessinerTexte` sur une ligne, avec « … » en fin de mot. Les noms complets restent dans la source « Lignes » du dossier.
- **Lot 3, applis :**
  - Titre de tuile du Journal raccourci dans `i18n.js` (solution 4) : « Bons choix » (EN inchangé : « Good calls »).
  - « dont n non traité(s) » remonté de 12 px dans sa tuile, sous le chiffre (solution 5).
  - Courbe de la semaine 20 px plus étroite (solution 5) : l'étiquette de seuil « 150 » tient dans sa tuile.
  - Community : les 3 estimations `textWidth × 1,05` sont remplacées par `couperLignes` (solution 1, même zone).
- **Lot 4, fenêtres :**
  - Crédits musicaux : case élargie à la largeur libre sous le bouton (solution 5) et libellé plus court en FR et en EN (solution 4). La version longue est gardée (`param.musiqueCreditsLong`) et s'affiche en infobulle au survol.
  - Aide du palmarès : case de 70 à 100 px, jusqu'au bas libre de la fenêtre (solution 5).
- **Lot 5, téléphone :** nom du contact ajusté par `ajusterTaille` entre 26 et 22 px (solution 3, sans passer sous le minimum de 22 px).
- **Mesure seulement** (rendu inchangé) :
  - cadre des pastilles de delta des jauges, qui montent exprès au-dessus du bandeau ;
  - cadres locaux des tampons tournés (« SIGNALEMENT », tampon du rapport, « RÉSILIÉ »).
- **Lots 1 et 6** (boutons, mobile) : aucun défaut propre relevé.

Les 6 lots sont livrés en un seul commit, qui liste les corrections ; le parcours a été relancé après chaque série et il ne fait apparaître aucun nouveau défaut.

## Rapport après correction

| Taille | Total | A | B | C | D | E |
|---|---|---|---|---|---|---|
| 1920×1080 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1366×768 | 0 | 0 | 0 | 0 | 0 | 0 |
| 412×915 (mobile) | 29 | 0 | 0 | 0 | 0 | 29 |

**E restants, mobile uniquement :** horloge « 08:34 » sur « ▶▶ temps accéléré ×100 » (panneau d'attente, et rapport de la veille). La capture en mobile portrait ne montre **aucun recouvrement visible**. La boîte mesurée de l'horloge (110 px) dépasse ses glyphes dans cette configuration ; c'est un faux positif de l'heuristique E, laissé dans le rapport.

**Non mesurables : 0** (tampons tournés comparés dans leur repère).

## Ne rien casser
- `game.js` (règles, effets, dés, jauges), les données et les textes cités ne sont pas modifiés.
- `npm test` passe : 318 contrôles smoke et 449 contrôles du jeu. Il comprend les contrôles du prompt 93 :
  - module inactif par défaut ;
  - parcours complet avec `?audit=textes` ;
  - libellés longs réels (crédits, aide du palmarès, contacts du téléphone) en FR et en EN, mesurés à 0,6 em pour JetBrains Mono ;
  - aucune estimation `× 1,05` dans `site/public/` ;
  - plafond de `text()` sans largeur par fichier d'appli.
- Parties réelles en Chromium sans audit (dossiers de chaque type, sources, clavier, Journal, mobile, animations réduites) : aucune erreur de console.

## Règle de texte (pour la suite)

Elle est reprise dans `CONTRIBUTING.md`.
- Tout texte passe par `dessinerTexte` / `couperLignes` (multi-ligne) ou par `ajusterTaille` (libellé court, sans descendre sous les minimums : corps 22 px, métadonnées 18 px).
- Il est dessiné dans une zone déclarée (`zoneTexteDebut` / `zoneTexteDeclarer`).
- Aucun nouveau `text()` mono-ligne sans largeur dans une zone de taille fixe.
- `npm test` refuse :
  - les estimations `textWidth(...) * 1.05` ;
  - tout `text(…, x, y)` sans largeur au-delà du plafond figé par fichier d'appli (exceptions motivées dans `test-jeu.mjs` : heures, chiffres, touches, titres courts centrés).
- Relancer `?audit=textes&parcours=1` avant chaque fusion qui touche l'interface.
