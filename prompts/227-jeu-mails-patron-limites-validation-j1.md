# Prompt 227 — Jeu : mails du patron limités à 1–2 par jour et validation des demandes différée au lendemain

Origine : demande du 15/11/2026 (« il y a trop de mails du patron. Il doit y en avoir un ou deux par jour. Aussi, quand on fait une demande au patron, on ne doit pas savoir le jour même si la demande a été validée mais le lendemain »).
Statut : **exécuté le 15/11/2026**.

## Constat

Actuellement, le patron envoie potentiellement plusieurs mails par jour (consignes, alertes, conseils, budget, feedback de fin de journée). Cela crée une surcharge d'informations et brise l'immersion.

## À faire

### 1. Limiter les mails du patron à **1–2 par jour maximum**
- **Regrouper les contenus** : fusionner les mails de type consigne/alerte/conseil en un seul mail quotidien (ex. « Briefing du matin » ou « Points clés de la journée »).
- **Prioriser le mail de fin de journée** : conserver le mail de bilan du soir (stats, feedback) comme deuxième mail obligatoire.
- **Autres mails** (budget urgent, alerte critique) : les intégrer dans le mail de briefing ou les différer au lendemain si non critiques.
- **Mécanique** : dans `patron.js` ou `mails.js`, ajouter un compteur `mailsEnvoyesAujourdhui` (reset à 0 à minuit heure de jeu) et bloquer l'envoi si ≥ 2, sauf exception documentée.

### 2. Validation des demandes différée au **lendemain**
- Quand le joueur envoie une demande au patron (ex. : demande de budget supplémentaire, clarification), **aucune réponse immédiate**.
- La demande est stockée dans une file `demandesEnAttente` (avec timestamp de jeu).
- **Le lendemain matin** (à 8h00 heure de jeu), le patron envoie un mail groupé avec :
  - Les réponses à toutes les demandes de la veille.
  - Statut clair pour chaque demande : « Validé », « Refusé », « Reporté » + explication concise.
- **Affichage** : dans l'appli Mails, les demandes en attente apparaissent en gris dans un dossier « En attente » (non comptabilisées dans les 1–2 mails/jour).

### 3. Indicateur visuel pour les demandes en attente
- Badge « 1 demande en attente » sur l'icône Mails si des demandes n'ont pas encore été traitées.
- Infobulle : « Réponse demain à 8h ».

## Vérifications

- `npm run build`, `npm test` ; partie jouée sur 3 jours :
  - Jour 1 : 2 mails max du patron (briefing + bilan), 1 demande envoyée → pas de réponse le jour même.
  - Jour 2 : mail à 8h00 avec la réponse à la demande du J1 + briefing du J2 (total = 2 mails).
  - Jour 3 : même pattern, 0 demande en attente après le mail du matin.
- `grep` : plus de mails du patron en dehors des slots autorisés (sauf exceptions documentées).
- Audit des textes : 0 défaut FR/EN en 1920×1080, 1366×768, 412×915 et 915×412.
- Code mort : supprimer les anciennes fonctions d'envoi de mails non utilisées.

## Fichiers concernés

- `patron.js` / `mails.js` : logique d'envoi, compteur, file des demandes.
- `i18n.js` : nouveaux libellés (« Briefing », « En attente », « Réponse demain »).
- `os.js` : badges et notifications de l'appli Mails.
- `game.js` : déclenchement des mails de briefing et de bilan.

## Fait (adapté au code réel : `game.js`, `patron.js`, `multitache.js`, `menu-app.js`, `taches-ui.js`)

- **Un ou deux mails par jour** : tous les messages du patron d'une journée (consigne, alertes, conseils, reproches,
  budget…) forment un seul mail, le **« Briefing du jour · n points »**, lu point par point (type et heure de chaque
  point) ; le second est le mail du soir. Les messages restent dans `Jeu.messagesPatron` (logique, tests, sauvegardes
  inchangés) ; `Jeu.groupeMail` et `listeMails` les regroupent. Un message ajouté à un briefing déjà reçu (`ajout`) ne
  fait ni nouveau mail, ni son, ni « Direction écrit… », ni notification ; le badge compte les mails, pas les messages.
  Pas de compteur bloquant : rien n'est perdu, tout est regroupé (exception aucune).
- **Réponse le lendemain** : le soir, le rapport n'annonce plus « accordée / refusée » mais « Demande envoyée : le
  patron répondra demain à 8 h » ; la réponse (accordée ou refusée, avec sa raison) arrive le lendemain matin dans le
  briefing (mécanique `Taches.matin`, inchangée). « Reporté » n'existe pas dans le jeu : non ajouté.
- **En attente** : dossier « En attente » dans Mails (entrée grisée, hors badge et hors des deux mails), pastille
  bleue « 1 » sur l'icône Mails, infobulle « 1 demande en attente — réponse demain à 8 h » (dessinée au premier plan).

## Vérifié

- `npm run build`, `npm test` (+4 contrôles : une semaine jouée, 1 ou 2 mails par jour quel que soit le nombre de
  messages ; demande « envoyée » le soir ; dossier et pastille ; ajouts sans notification ni son ; contrôles du
  prompt 195 mis à jour au regroupement, recherche dans tous les points d'un briefing).
- Chromium : 9 messages le même jour → 1 mail « Briefing du jour · 9 points », 1 non lu ; dossier « En attente » et
  infobulle sur l'icône.
- Audit : la phrase de la demande en attente débordait dans le bilan du soir (colonne étroite) → passe à la ligne ;
  0 défaut, 0 cible sous 44 px CSS en 1920 × 1080, 1366 × 768, 412 × 915, 915 × 412.
