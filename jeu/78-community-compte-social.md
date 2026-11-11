# 78 — L'appli Community devient le compte social de la régulation (prompt 85)

Code : `community.js` (nouveau), `game.js` (posts, archive, info trafic, messages privés, transfert),
`data/messages.json` (+ 7 plaintes, dont 3 privées, et 3 modèles d'info trafic), `os.js`, `sketch.js`,
`portrait.js`, `sauvegarde.js`, `i18n.js`. Crédits « fiction » : `README.md`.

## Un réseau inventé, un compte fictif
Réseau « Quai » (fictif), compte « Régul' Nantes · salle de contrôle » (@regul.nte), badge « compte de service »,
bio « … Fiction de jeu. » Aucun logo, nom, couleur ni mise en page d'un réseau social ou d'un transporteur réel ;
avatar = pictogramme pixel original d'un feu de signalisation tram. Design system Pixel (DS).

## Mise en page
- **En-tête** : bannière (même heure et même météo que la baie vitrée), avatar, nom, identifiant, bio, compteurs
  — publications (réelles), abonnés = 1 200 × réputation / 50 avec la tendance du jour, réponses / plaintes
  (`Jeu.bilanPlaintes`). Abonnés et « j'aime » sont des **valeurs de jeu**, dites comme telles (Statistiques).
- **Onglets** Fil · Mentions (avec compte à rebours du prompt 79) · Messagerie · Statistiques, indicateur rouge.
- **Colonne** « Ce qui se passe à Nantes » (signalement en cours, météo du jour, événement d'agenda) et
  « Comptes cités » (pseudonymes fictifs les plus actifs).
- Clavier : ← → onglets, ↑ ↓ défilement (ou conversations), Tab / Entrée / 1-2-3 pour répondre ; molette ;
  barre de défilement DS. Portrait mobile : une colonne, onglets en bas.

## Fil
- **Posts de la partie** : un par dossier traité, texte construit sur la ligne ou la nature réelle, le retard réel
  et l'action choisie ; « j'aime » selon l'évaluation (valeur de jeu).
- **Posts d'archive** (6 à 9) : faits réels de la **semaine archivée précédente** (changelog, alertes météo,
  agenda, jours de pluie ou de rafales). Première semaine archivée : aucun post (rien d'inventé pour remplir).
- **Info trafic publiée par le joueur** : sur le dernier dossier traité, 3 modèles (annonce, excuses,
  prévention météo) remplis avec les vraies valeurs ; cohérent avec la décision → réputation +1, sinon −2 ; une
  par dossier.
- Sous chaque post : plaintes (prompt 28) avec « Répondre » (brouillons de réponse sur plusieurs lignes),
  commentaires (prompt 22), indicateur « @x écrit… » avant une réaction (prompt 63), lien « Voir dans
  Signalements ». Vue **grille** des photos (3 colonnes).
- **Nouvelles plaintes** (conditions sur des champs réels) : travaux et déviation, sécurité le soir et
  accessibilité à la sortie d'un événement, horaires pendant une perturbation.

## Photos pixel « à peine perceptibles »
Dessinées par le code (`createGraphics` 160 × 100, agrandies avec un lissage léger), mises en cache par sujet,
météo et heure : tram, bus (couleur réelle de la ligne), navibus, travaux, foule devant le château, ciel sur la
Loire et la grue. Pluie si ≥ 1 mm le jour du fait, nuit selon l'heure de jeu. Ni personne identifiable ni logo.
Texte alternatif annoncé (« Illustration : bus à un arrêt sous la pluie »). Aucun fichier image ajouté.

## Messagerie privée
Les plaintes `prive: true` (objet oublié sur une ligne réelle, accessibilité après un événement, question sur une
déviation) arrivent ici : liste à gauche, conversation à droite. Même délai et mêmes effets ; une relance privée au
plus (pas de réaction publique) ; « Transmettre au patron » crée un message dans l'appli Patron, sans effet.

## Vérifications
- `npm test` : 21 plaintes valides (FR + EN, une bonne et une mauvaise réponse, conditions sur champs connus),
  3 modèles ; archive vide la première semaine, réelle ensuite ; post fidèle à l'action ; info trafic +1 / −2,
  une par dossier ; message privé (réponse rapide, relance ≤ 1, transfert) ; sauvegarde ; aucun nom réel.
- Chromium FR / EN : profil, fil illustré, grille, mentions avec délai, statistiques ; aucune erreur console.
