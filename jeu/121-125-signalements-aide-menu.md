# Prompts 121 à 125 — statut des signalements, aide et tutoriel, écran épuré

Date : 12/11/2026. Une branche par prompt, au nom du fichier du prompt.

## 121 — Signalement clos sans équipe, terminé au retour du plaignant

- **Statut** (`Jeu.statutSignalement(index)`, lecture seule, calculé sur l'état réel) :
  - `ouvert` tant que le joueur n'a pas répondu ;
  - `clos` dès la réponse si aucune équipe utile n'a été envoyée ;
  - `attente` si une équipe a été envoyée et n'a pas fini ;
  - `termine` quand le plaignant a répondu.
- **Retour du plaignant** (`Jeu.retourPlaignant`, déclenché par `Jeu.majRetours`) :
  - une seule fois par signalement, quand le joueur a répondu **et** que toutes les équipes ont fini
    (`finIntervention`) ;
  - auteur : le plaignant du dossier (`Jeu.plaignantPour`), sinon un pseudo existant ;
  - texte : `retour.merci.0` à `2` (FR + EN), choisi par numéro de dossier, sans dé ;
  - réputation : +1 par équipe, comme l'ancien commentaire « équipe » (`com.equipe.0`, supprimé) ;
  - commentaire rattaché au post du dossier dans Community, marqué `retour: true`.
- **Cas limites :**
  - équipe envoyée après la réponse : toujours « inutile », le signalement reste clos ;
  - fin de journée : une équipe déjà sur place reçoit son retour avant le lendemain (`journeeSuivante`) ;
  - reprise : le drapeau `remercie` est enregistré avec l'équipe ; une ancienne sauvegarde (sans drapeau)
    ne rejoue pas de remerciement.
- **Interface :**
  - panneau des conséquences : badge « Signalement clos » ou « En attente du retour · {équipe} » ;
  - carte : marqueur creux (contour à la couleur de gravité, sablier pixel) à son lieu réel, avec une
    infobulle ; ni cliquable, ni cible d'une équipe (`dessinerSuivis`) ;
  - ligne d'état de la carte : « · n en attente de retour » ;
  - notification « Retour du plaignant » et annonce `aria-live` ;
  - une phrase ajoutée aux règles de l'aide.
- **Vérifié :** `npm run build`, `npm test` (5 contrôles ajoutés, 570 au total), audit des textes à
  1920×1080 (3 étapes ajoutées au parcours) ; captures du badge et du marqueur en attente dans une partie pilotée sans écran.

## 122 — Un seul bouton « Aide et tutoriel »

- **Menu principal** (`entreesMenu`) : la carte « Tutoriel » est supprimée ; « Aide (H) » devient
  « Aide et tutoriel (H) » (`mp.aide`, FR + EN). La clé `mp.tutoriel` est retirée.
  - Une carte de moins : sans sauvegarde, 5 cartes ; avec « Reprendre », 6 (au lieu de 7).
- **Fenêtre d'aide** : titre « Aide et tutoriel — Nantes en régulation » ; le bouton
  « Lancer le tutoriel (T) » passe en primaire, « Fermer (Échap) » en secondaire.
- **Menu Échap** (pause) : même libellé « Aide et tutoriel (H) ».
- **Inchangé :** touche H, touche T depuis l'aide, livre « Aide » de la bibliothèque, guide de prise en main.
- **Vérifié :** captures du menu (1366×768) et de l'aide (1920×1080), `npm run build`, `npm test`, audit des
  textes à 1920×1080 : 0 défaut.

## 123 — L'aide revue pour être lisible

- **Nouveau fichier `site/public/aide.js`** (chargé après `sketch.js`) : `fenetreAide` quitte `sketch.js`.
- **Quatre onglets** (fenêtre du Pixel DS, onglet actif blanc à liseré primaire et double bordure) :
  1. **Bien démarrer** : l'objectif à 26 px, la légende des seuils (rouge 0–20, orange 20–40, vert 40–100),
     puis le tutoriel — ses 6 titres de pages réels et le bouton primaire « Lancer le tutoriel (T) » ;
  2. **Règles** : les paragraphes de `aide.texte` (texte inchangé) en cartes titrées sur deux colonnes,
     paginées (2 pages à 1920×1080) ; le glossaire en lignes terme / définition ;
  3. **Raccourcis** : quatre groupes (Signalement, Équipes et carte, Bureau, Général), la touche dans une
     capsule ;
  4. **Malus** : nom, puis condition → conséquence.
- **Lisibilité :** texte courant à 20 px, interligne 28 px ; plus aucune taille ajustée vers le bas pour le
  texte courant (avant : jusqu'à 13 px). Lignes de 66 signes environ.
  - L'amorce d'un paragraphe qui répète le titre de sa carte (« Gravité : », « Glossaire — ») est retirée
    à l'affichage seulement.
- **Navigation :** clic, ← → ou Tab, touches 1 à 4 ; ↑ ↓ ou les flèches du pied pour les pages ; T lance le
  tutoriel ; H, ? ou Échap ferment. Onglet et page annoncés (`aria-live`). Entrée douce (220 ms), absente si
  les animations sont réduites. La fenêtre rouvre toujours sur le premier onglet.
- **Portrait mobile :** fenêtre de 1260 px, une colonne, onglets de 96 px de haut.
- **Tests :** 10 paragraphes de règles en FR et en EN, un titre par carte, `aide.js` chargé, texte à 20 px.
  Cinq étapes ajoutées au parcours de l'audit des textes (les quatre onglets et la page 2 des règles).
- **Écart avec le prompt :** les corps des cartes ne sont pas recopiés dans de nouvelles clés ; ils restent
  dans `aide.texte` (une seule source, déjà traduite et testée).

## 124 — Plus de lignes d'aide à l'écran, ni les trois boutons du bandeau

- **Retiré de l'écran :**
  - menu principal : la ligne « ↑ ↓ choisir · Entrée valider · L langue · H aide » ;
  - en jeu : le bandeau d'état du bas (« À VOUS · répondez au plaignant… ») ; la jauge de somnolence reste ;
  - bandeau du haut : « Quitter la journée (Q) », « Aide (H) », « Recommencer (R) » ;
  - au bureau : la consigne « Cliquez sur le PC… » ne s'affiche plus qu'après 10 s sans geste.
- **Bandeau du haut :** les trois jauges s'élargissent (370 → 580 px) et la ligne 2 (priorités, thème, objectif,
  heure) tient entière.
- **Rien n'est perdu :**
  - touches Q, H et R inchangées (listées dans l'onglet « Raccourcis » de l'aide) ;
  - menu Échap : deux entrées de plus, « Quitter la journée (Q) » (seulement pendant une journée) et
    « Recommencer (R) » (avec la confirmation existante), soit 7 cartes ;
  - mobile : un bouton « ≡ » à droite du bandeau ouvre ce menu (pas de touche Échap au toucher) ;
  - lecteurs d'écran : le texte d'état est annoncé (`aria-live`) à chaque changement, hors fenêtre et tutoriel.
- **Textes ajustés :** `transition.finir` et `etat.finJournee` citent la touche Q et l'horloge murale, plus le
  bouton.
- **Tests :** l'ancien contrôle du prompt 133 (bouton « Quitter la journée » secondaire dans le bandeau) est
  remplacé par quatre contrôles du prompt 124.
- **Non fait :** les clés `etat.*`, `quitter.bouton`, `jeu.recommencer` restent (annonces, menu Échap) ;
  `mp.clavier` est supprimée au prompt 125.

## 125 — Pied du menu principal réduit à nos noms

- **Menu principal :** les deux lignes au-dessus des noms (« ↑ ↓ choisir… », « Données réelles… ») et le lien
  « Code sous licence MIT » avec son séparateur ne sont plus dessinés. Il reste une ligne : nos noms,
  soulignés, qui ouvrent l'écran Crédits.
- **Clavier :** `licence` sort de `EXTRAS_MENU` ; après les cartes : Dépôt → Partager → Présentation.
- **Pile de cartes :** `basPile` passe de `H − 144` à `H − 90` ; les cartes normales tiennent avec un écart
  plus large.
- **Crédits :** la ligne « Données » cite maintenant le réseau Naolib (« Open Data Nantes Métropole, dont le
  réseau Naolib… »), seule source du pied de page qui n'y figurait pas. Aucune licence ajoutée. `LICENCE_URL`
  reste défini une fois (`menu.js`) et utilisé par l'écran Crédits.
- **i18n :** `mp.clavier`, `mp.sources`, `mp.licence`, `mp.licence.infobulle` supprimées en FR et en EN.
- **Tests :** deux contrôles ajoutés (pied réduit aux noms, clés supprimées, Naolib dans les Crédits).
- **Vérifié :** captures du menu (1366×768) et des Crédits (1920×1080), `npm run build`, `npm test`, audit des
  textes à 1920×1080 : 0 défaut.

## Limites des vérifications (121 à 125)

- Audit des textes lancé à 1920×1080 seulement (FR / EN, contraste renforcé ou non) ; pas à 1366×768 ni en
  portrait mobile.
- Menu avec sauvegarde (« Reprendre »), bouton « ≡ » mobile et aide en portrait : non regardés à l'écran.
- Aucun essai avec un lecteur d'écran.
