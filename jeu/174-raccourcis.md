# 174 — Raccourcis clavier : inventaire, conflits, pertinence

Prompt 174, exécuté après 171, 175, 178, 181, 182 et 183 (touches déjà retirées ou déplacées), puis après la suppression
de la fenêtre « Votre poste ». Remplace la liste de `08-raccourcis.md` (historique). L'onglet **Raccourcis** de l'aide
est tiré de `RACCOURCIS_AIDE` (`site/public/aide.js`) ; un test (`test-jeu.mjs`, bloc « Prompt 174 ») vérifie que
chaque touche qu'il cite est lue par le code et qu'aucune clé `aide.k.*` n'est orpheline.

## Règles générales (nouvelles)

- **Ctrl, Cmd ou Alt enfoncé** : le jeu ne lit rien (`saisieOuRaccourciNavigateur()`, `sketch.js`) — Ctrl+R recharge,
  Ctrl+L va à la barre d'adresse, Ctrl+P imprime, Alt+← revient en arrière, comme partout. Avant : Ctrl+R ouvrait
  « Recommencer la semaine », Ctrl+P mettait en pause, Ctrl+L changeait de langue.
- **Champ de saisie HTML au focus** (`input`, `textarea`, `select`, éditable) : le jeu ne lit rien (avant : seule la
  boîte d'import de sauvegarde était protégée). Vaut aussi pour le relâchement de M (micro).
- **Menu du jeu ouvert = pause** : `fenetre === 'menu'` ajouté à `tempsSuspendu()`.

## Tableau final (contexte · touche · action · libellé affiché)

| Contexte | Touche | Action | Libellé / aide |
|---|---|---|---|
| Partout (hors saisie) | F | Plein écran | aide (ligne L) · paramètres |
| Partout | L | Langue FR / EN | aide · paramètres |
| Démo automatique | toute touche | Reprendre la main | « Appuyez sur une touche » |
| Cinématique | Entrée / Espace / → · Échap | Plan suivant · passer | « Passer (Échap) » |
| Transition de journée | Entrée / Espace / Échap | Passer | — |
| Fin de partie (game over) | Tab / ← → · Entrée / Espace · Échap | Choisir · valider · changer de semaine | « Rejouer (Entrée) », « Changer de semaine (Échap) » |
| SMS d'intro | Entrée / Espace · Échap | Avancer · tout passer | — |
| Réveil, sieste | Espace / Entrée / Z | Se réveiller | « Se réveiller (Espace) » |
| Guide (`toucheGuide`) | Tab · Entrée / Espace · touches de l'étape · Échap ou G | Bulle · cible · quitter le guide (confirmation) | « Quitter le guide (Échap) » ; « Quitter le PC » **sans** « (Échap) » pendant le guide |
| Tutoriel | Tab · ← → · Entrée / Espace · Échap | Focus · étapes · valider · fermer | « Suivant (Entrée) », « Passer (Échap) » |
| Menu titre | ↑ ↓ / Tab · Entrée / Espace | Entrées du menu | — |
| Nouvelle partie | ← → ↑ ↓ / Tab · Entrée · Échap / Retour arrière · G | Mode · lancer · retour · option guide | « Lancer la partie (Entrée) », « Retour (Échap) », « touche G » |
| Reprendre une partie | ↑ ↓ / Tab · Entrée · Suppr · Échap | Emplacement · reprendre · supprimer (confirmation Entrée / Échap) · retour | « Reprendre (Entrée) », « Supprimer (Suppr) » |
| Avant de jouer, crédits, partage | ↑ ↓ / Tab · Entrée / Espace · Échap | Parcourir · activer · fermer | — |
| Paramètres | Tab / ↑ ↓ · ← → · Entrée / Espace · Page préc. / suiv. · Échap · M | Focus · régler · basculer · pages · fermer · son | — |
| Aide | ← → / Tab · 1–4 · ↑ ↓ / Page préc. / suiv. · T · H / ? / Échap | Onglets · pages · tutoriel · fermer | « Lancer le tutoriel (T) », « Fermer (Échap) » |
| Menu du jeu (pause) | ↑ ↓ / Tab · Entrée · Échap | Parcourir · valider · fermer | « Reprendre (Échap) » |
| Fenêtres modales (rapport, partir, blâme, démission, inspection, tâche, téléphone, recommencer) | Entrée · Échap · Tab (pages du rapport) · 1–3 (inspection) · 1–4 (tâche) · ↑ ↓ / Suppr (notifications du téléphone) | Valider · annuler | libellés « (Entrée) » / « (Échap) » / « (Tab) » |
| Bureau | ← → ↑ ↓ (maintenues) · Tab · Entrée / Espace · Échap · H / ? · M · Z · Q · D | Regarder · objets · ouvrir / s'installer · menu du jeu · aide · son / micro · sieste · quitter la journée · démission (jauges sous 20) | aide ; « Quitter la journée (Q) » ; « rendre votre badge (D) » |
| Soir, au bureau | Entrée | Sortir (quand la sortie est visible) | « Quitter le bureau (Entrée) » |
| Poste, carte | Échap | Retour d'écran, sinon `quitterPC()` (refusé si un choix attend) | « Quitter le PC (Échap) » |
| Poste, carte | Tab / Maj+Tab | Menu d'applis puis « Quitter le PC » | — |
| Poste, carte | ↑ ↓ · Entrée / Espace | File des signalements · prendre | « Prendre ce signalement (Entrée) » |
| Poste, carte | + / − · Origine · Maj + flèches · Échap | Zoom · recentrer · déplacer · annuler l'équipe choisie / réduire la fenêtre | aide, tutoriel |
| Poste, carte | Maj + 1–4 | Envoyer une équipe | « Envoyer (Maj+{n}) » |
| Poste, dossier | 1–3 · E · 5–8 · Tab | Répliques · En savoir plus · sources · signalement actif suivant | « En savoir plus (E) » |
| Poste, contradiction / conflit | A / B | Source à croire · ligne prioritaire | aide |
| Poste, narration | Entrée · P | Dossier suivant · pause | « Dossier suivant (Entrée) », « Reprendre (P) » |
| Poste, défi chrono | R | Ralenti pendant un dossier | « Ralenti (R) » |
| Poste | I · V · H / ? · M · Z · Q · D | Indicateurs · détails des Indicateurs · aide · son · sieste · quitter la journée · démission | « Détails (V) » |
| Poste, fin de semaine | Entrée · Échap / Retour arrière | Rejouer · accueil | « Rejouer (Entrée) » |
| Appli Mails (prompts 185, 195) | Tab · ← → · ↑ ↓ · Entrée · Échap · V · 1–n · saisie | Zones (barre d'outils, dossiers, liste, lecture) · dossiers (dans la barre : recherche puis actions Répondre, Archiver, Marquer comme non lu, Voir le dossier) · mails / défiler · ouvrir ou agir · effacer la recherche, puis retour à la liste (zone étroite) · tout déplier · réponses rapides · quand le champ de recherche a le focus, toute lettre (V, 1–3, L, F, I, M… compris) va au champ | — |
| Appli Community | ← → · ↑ ↓ · Tab · Entrée / Espace · 1–n | Onglets · défiler · réponses · répondre / publier | « Publier (Entrée) » ; bascule cartes / liste (prompt 186) : bouton à icône seulement, sans touche |
| Appli Journal | Tab · ← → · ↑ ↓ · Entrée · Échap | Zones · jour / filtre (contrôle segmenté) · cartes · enquête · retour | prompt 186 : V (pli « Détails ») et C (copier le résumé) retirés |

## Décisions

| Avant | Après | Raison |
|---|---|---|
| R hors dossier = « Recommencer la semaine » ; R pendant un dossier = ralenti | R = ralenti seulement (défi chrono, pendant un dossier) ; « Recommencer » par le menu du jeu | une touche, deux sens dans le même contexte ; action rare et destructrice ; Ctrl+R ouvrait la fenêtre |
| B pendant un dossier = « Publier » ; B en contradiction / conflit = source / ligne B | B = choix B seulement ; bouton « Publier » sans « (B) » | même touche, sens différent entre écrans voisins ; action rare |
| S au soir = sortie (doublon d'Entrée) | Entrée seulement ; `tuto.6.touches` dit « Q … · Entrée : sortie » | S servait aussi à « Semaine » (vue retirée au 140) ; doublon |
| J au game over = revoir le journal | Tab / flèches puis Entrée ; libellé sans « (J) » | seule lettre de l'écran, J retiré partout ailleurs (140 / 142) |
| « Quitter le PC (Échap) » pendant le guide | « Quitter le PC » | pendant le guide, Échap quitte le guide |
| Ctrl / Cmd / Alt + lettre lus par le jeu | laissés au navigateur | collisions navigateur |
| Menu du jeu sans pause | menu du jeu = temps suspendu | constat du prompt 183 |
| Aide : « Liste des signalements · semaine », « Recommencer la semaine · ralenti » | « Liste des signalements (Entrée : prendre) », « Ralenti, en défi chrono » ; lignes ajoutées : + / −, Origine, I | aide = tableau |

Gardés et signalés (en cas de doute) : **V** (détails, même sens dans Patron / Mails et Indicateurs — plus au Journal depuis le prompt 186 ; seule commande
clavier du « tout déplier » du Patron) ; **D** (démission, aussi un bouton) ; **Q** ; **Z** (sieste possible aussi
pendant un dossier, comportement voulu par le prompt 78) ; **G** (option guide au menu, quitter le guide en partie :
même sujet) ; **C** au Journal : retiré au prompt 186. Lecteurs d'écran : le jeu est un canevas, les lettres simples ne
sont lues qu'avec le focus sur la page ; NVDA / JAWS en mode navigation les interceptent avant le jeu (pas de
correctif possible côté page, non vérifié avec un lecteur réel).
