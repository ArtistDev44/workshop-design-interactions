# Prompt 205 — Mobile portrait : le poste devient jouable

Date : 13/11/2026. Branche `205-jeu-mobile-portrait-jouable`. Constat d'origine : `jeu/203-audit-ux.md` § 8 (constat 1).
Captures avant / après : `jeu/205-captures/`.

## Décision (étape 0)

**Option B retenue** : mise en page portrait du poste. Le travail avait commencé ainsi dans une session précédente ;
il a été repris et terminé. Rien ne change sur ordinateur : tout passe par `PORTRAIT.actif`, vrai seulement quand
`estMobile()` est vrai et que l'écran est en portrait.

## Ce qui a changé

| Sujet | Avant (412 × 915) | Après | Fichiers |
|---|---|---|---|
| Principe | L'image 16:9 du poste réduite : 5 à 8 px de texte à l'écran | Au poste, la carte, les vues et la fiche sont dessinées dans l'image en **colonnes de 620 px** (`GEO_PORTRAIT`), puis recomposées sur toute la largeur du téléphone : le texte de 20 px de l'appli fait ≈ 13 px CSS | `portrait.js` |
| Bandeau | Jauges, priorités, date à 5–6 px ; « Somnolence » écrite sur une autre étiquette | Barre du haut dessinée sur le canevas portrait : Fluidité / Réputation / Budget avec leur valeur (48 px) et une barre colorée aux seuils 40 / 20, l'heure et la vitesse du temps à droite | `portrait.js` |
| Contenu | Carte réduite en haut **et** fiche dessous ; Community au quart supérieur | **Une vue à la fois** en plein écran, défilable au doigt : carte, ou fiche du dossier (qui monte du bas en 0,3 s, immédiate si les animations sont réduites), ou Mails / Community / Journal / Données | `portrait.js`, `panneau.js`, `carte-alertes.js`, `sketch.js` |
| Équipes | Colonne des équipes illisible | Pendant un choix : bande « Envoyer une équipe (coût en budget) », un bouton par équipe avec « n libres · coût » ; un toucher l'envoie sur le dossier ouvert | `portrait.js` |
| Somnolence, sortie | Étiquette superposée ; « Se lever » seul | Rangée de deux boutons : « Se reposer / Se réveiller » avec la somnolence en % et sa jauge, « Se lever » (estompé tant qu'un choix attend, prompt 182) | `portrait.js`, `i18n.js` |
| Menu de l'appli | Barre d'onglets à 40 px dans l'image, illisible | Barre d'onglets en bas (150 px portrait ≈ 57 px CSS) : Carte, Mails, Community, Journal, Données ; badges, verrous, filet rouge sur l'entrée affichée | `portrait.js`, `menu-app.js` |
| Vues étroites | — | Mails : dossiers en grille de 3 ; Community : onglets sur 2 × 2, photo réduite, « Voir le dossier » sur sa ligne ; Journal : filtres sur 2 × 2, cartes plus hautes ; Données : 4 blocs empilés (2 colonnes de l'image empilées) ; fiche : statut du signalement sous l'en-tête | `patron.js`, `community.js`, `journal.js`, `donnees.js`, `sketch.js` |
| Guide | « Quitter le guide (Échap) » réduit à 11,6 px CSS | Bouton élargi en portrait, libellé à taille normale | `guide.js` |
| Menu principal | Titre coupé (« Nantes en régulat… ») | Titre à 64 px en portrait (88 px sur ordinateur), entier dans la colonne recadrée ; la pile FR / EN · plein écran · télécharger était déjà au-dessus (prompt 199) | `menu.js` |
| Audit des textes | 0 défaut à 412 px : mesure avant la mise à l'échelle | Nouveau défaut **« T »** : en portrait, taille du texte × échelle de sa région recomposée × échelle du canevas portrait < 12 px CSS | `audit-textes.js` |

## Vérifications

- `npm run build` : vert. `npm test` : 647 + 5 933 contrôles réussis (le test du prompt 182 attendait `primaire: false` sur le bouton
  « Se lever » : remis).
- Audit des textes (`?audit=textes&parcours=1`, FR + EN, contraste normal et renforcé) :

| Taille | Défauts A–E | Défauts T (< 12 px CSS, portrait) |
|---|---|---|
| 1920 × 1080 | 0 | — |
| 1366 × 768 | 0 | — |
| 412 × 915 portrait (tactile) | 0 | **0 au poste** (carte, fiche, vues de l'appli) ; 806 ailleurs : fenêtres 494, bureau 193, téléphone / SMS 60, menu 29, lettre de licenciement 16, cinématiques 14 |
| 915 × 412 paysage (tactile, ajouté) | 0 | — (mise en page ordinateur) |

  Le défaut T est compté une fois par texte et par langue. Avant correction, le poste en avait plusieurs centaines
  (jauges, priorités, date, menu de l'appli entre 3,5 et 8 px) ; le dernier, « Quitter le guide (Échap) » à 11,6 px,
  est corrigé (bouton élargi à 360 px en portrait, `guide.js`).

- Captures (Chromium sans interface, 412 × 915 et 915 × 412, tactile) : menu, carte, Community, dossier ouvert, avant
  et après (`jeu/205-captures/`).

## Limites et suite

- Le défaut T couvre **tout** le portrait, pas seulement le poste : il reste des textes sous 12 px CSS dans les écrans
  qui gardent la recomposition d'avant — menu principal (sous-titres des cartes, crédits, autorisations, choix de la
  semaine), fenêtres (paramètres, palmarès, rapport du soir, installation, partage), téléphone et SMS, bureau (image
  entière, les objets restent accessibles par les gros boutons), cinématiques, lettre de licenciement, rapport de fin.
  Le poste lui-même n'en a presque plus. Piste pour un prompt suivant : appliquer aux fenêtres la même méthode
  (colonne étroite dans l'image, recomposée pleine largeur).
- Le reflet diagonal de l'écran du poste reste visible sur la colonne (il vient de l'image du jeu).
- En paysage (915 × 412), la mise en page est celle de l'ordinateur réduite : le défaut T ne s'y applique pas.
- Non vérifié : téléphone réel, lecteur d'écran mobile ; ressenti joueur `[À COMPLÉTER]`.
