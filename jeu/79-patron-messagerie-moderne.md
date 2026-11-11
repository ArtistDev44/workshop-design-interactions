# 79 — L'appli « Messages du patron » devient une messagerie moderne (prompt 86)

Code : `patron.js` (nouveau, remplace `appPatron` d'`os.js`), `game.js` (`Jeu.messagePatron(texte, type, meta)`,
`Jeu.TYPES_MESSAGES`, file `Jeu.patronEnAttente`, chaque appel typé), `carte.js`, `immersion.js`, `sketch.js`,
`portrait.js`, `sauvegarde.js`, `i18n.js`. Textes, déclencheurs et effets de jeu inchangés.

## Messages typés (données)
| Type | Messages | Couleur DS |
|---|---|---|
| consigne | consigne du jour (meta : objectif, seuil, budget, modificateur, dossiers attendus) | info |
| alerte | jauge < 20, rappel à l'ordre / dernier avertissement (meta : jauge et valeur, ou score et niveau) | erreur |
| conseil | jauge < 30, série ratée (prompt 74) | alerte |
| budget | paliers bas / moyen / haut (meta : budget, palier) | alerte / succès |
| reproche | décision ratée, dossier expiré, départ anticipé (meta : dossier, action, meilleure action) | primaire |
| equipes | effectifs du jour, plus d'équipe (meta : effectifs) | info |
| info | agenda, défis, transfert Community, autres | blanc 75 % |
`meta` garde les valeurs réelles au moment de l'envoi ; rien n'est recalculé. Ancienne sauvegarde sans type →
« info ». Pictogrammes pixel originaux (aucun emoji).

## Mise en page
En-tête (avatar original du patron, nom, rôle, statut « en ligne » / « hors ligne »), filtres Tout · Consignes ·
Alertes · Reproches · Budget avec compteurs ; consigne du jour **épinglée** (clic ou Entrée la déroule) ; fil avec
**historique complet** défilable (molette, ↑ ↓, barre DS), ouverture sur le premier non lu et séparateur
« Nouveaux messages », séparateurs de journée (date longue), regroupement des messages du même type à moins de
30 min (une seule heure). Cartes : barre de 4 px à la couleur du type, pictogramme, libellé, heure, texte 20 px,
**bloc enrichi** (puces de la consigne, mini-jauge avec seuil, rappel du dossier + « Voir le dossier » qui ouvre
l'enquête du Journal, palier de budget, effectifs). Non lu : point rouge et texte blanc ; lu : blanc 75 %.

## Réponses rapides, animations, panne
- Réponses rapides selon le type du dernier message (« Bien reçu », « Je m'en occupe », « Je redresse la
  situation », « Compris, je corrige ») : bulle du joueur à droite, « Vu ✓ ». **Aucun effet de jeu**, une par message.
- « Direction écrit… » 0,8 s avant un nouveau message (l'heure du message ne change pas), arrivée en glissé de
  8 px ; rien de tout cela si les animations sont réduites. Accusés « Envoyé » / « Lu · HH:MM ».
- Panne de messagerie : bandeau « Connexion perdue — reconnexion dans 42 s », historique lisible mais grisé,
  réponses désactivées ; les messages émis pendant la panne arrivent à la reconnexion avec leur heure d'origine
  et la mention « reçu en retard ».
- Son distinct pour une alerte ; `aria-live` « Alerte du patron : … ». Rendu des seules cartes visibles, hauteurs
  mises en cache. Portrait mobile : une colonne. Sauvegarde : types, meta, lu, réponses, filtre, défilement.

## Vérifications
- `npm test` : tous les messages d'une semaine jouée sont typés, meta réelle (consigne, reproche lié à un dossier
  traité, alerte sous le seuil, palier, effectifs), file pendant la panne puis « reçu en retard », ancienne
  sauvegarde en « info », réponses rapides sans effet, ancien rendu supprimé.
- Chromium FR / EN : épinglé, cartes typées, mini-jauges, filtres, panne ; aucune erreur console.
