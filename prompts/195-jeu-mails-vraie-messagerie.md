# Prompt 195 — Jeu : l'appli Mails ressemble davantage à une vraie messagerie

Demande d'origine (12/11/2026) :

> L'interface de messagerie : fais en sorte qu'elle ressemble davantage à une messagerie.

Suite du prompt 185 (Patron → Mails : colonne de dossiers avec compteurs, liste, volet de lecture, `patron.js`).

## À faire

Partir d'une capture de l'appli telle qu'elle est (1920 × 1080, quelques mails dont un non lu et un reproche), puis
reprendre les codes reconnaissables d'un client de messagerie, sans copier l'identité d'un produit existant et
dans le Pixel Design System (`design-system/DESIGN.md`, accent `DS.primaire*`, icônes `iconeLucide`) :

1. **Barre d'outils** en haut de l'appli : champ de recherche (filtre local sur expéditeur / objet / texte, au
   clavier), et actions sur le mail ouvert sous forme d'icônes avec infobulle : Répondre (`reply`), Archiver
   (`archive`), Marquer comme non lu (`mail`), Voir le dossier (`external-link`) quand le mail en cite un.
2. **Colonne des dossiers** façon boîte mail : « Boîte de réception » en tête avec son compteur de non lus, puis
   les catégories ; dossier actif surligné (aplat translucide d'accent), compteurs alignés à droite.
3. **Liste des mails** : rangées de hauteur régulière ; pastille d'initiales de l'expéditeur à gauche ; sur la
   1re ligne l'expéditeur (gras si non lu) et l'heure alignée à droite ; 2e ligne l'objet (gras si non lu) ;
   3e ligne l'aperçu en gris, coupé par « … » ; point d'accent des non lus ; rangée sélectionnée surlignée ;
   séparateurs fins ; regroupement par jour (« Aujourd'hui », « Hier », date).
4. **Volet de lecture** : en-tête de mail (objet en titre, puis « De : … », « À : vous », date et heure de jeu),
   corps aéré, blocs enrichis (mini-jauges) inchangés ; en pied, une zone « Répondre » qui ressemble à un champ de
   réponse et propose les réponses rapides existantes (`REPONSES_RAPIDES`) ; la réponse envoyée s'affiche ensuite
   comme un message cité dans le fil.
5. **État vide** : « Aucun mail dans ce dossier » avec l'icône `inbox`.
6. **Archiver** : déplace le mail dans un dossier « Archives » (état mémorisé dans la sauvegarde) ; ne change aucune
   règle du jeu. Si cela demande de toucher aux règles, s'abstenir et le signaler.
7. Clavier (sans nouvelle lettre, voir `jeu/174-raccourcis.md`) : Tab entre barre d'outils, dossiers, liste,
   lecture ; ↑ ↓ ; Entrée ; Échap. Annonces lecteur d'écran à jour. Portrait / petite largeur : le mode deux
   colonnes du prompt 185 reste.

## Vérifications

- `npm run build` puis `npm test` dans `site/` (tests : recherche, archivage mémorisé, initiales, groupes par jour,
  état vide, actions de la barre, aucune clé i18n manquante en FR et EN).
- Une capture avant / après de l'appli à 1920 × 1080.
- `prompts/README.md` et `journal.md` mis à jour.
