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
