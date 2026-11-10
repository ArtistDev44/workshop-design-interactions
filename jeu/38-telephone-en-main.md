# 38 — Le téléphone pris en main (prompt 42)

Les messages ne s'affichent plus sur un téléphone en plein écran : le joueur **saisit son téléphone**.

## Animation réutilisable (`telephone-main.js`)
- `leverTelephone()` fait monter le téléphone du bas de l'écran en 450 ms (*ease out*). `baisserTelephone(auFin)` le fait redescendre, puis appelle `auFin`. Avec animations réduites, il apparaît et disparaît directement.
- `dessinerTelephoneEnMain(contenu)` :
  - la pièce reste visible derrière, assombrie ;
  - le téléphone (coque fine, bouton latéral, caméra) est tenu par une **main** dessinée par le code : pouce sur le bord gauche, doigts derrière le bord droit, paume et manche en bas ;
  - la main ne couvre jamais l'écran ;
  - le contenu de l'écran est une fonction `contenu(ecran, pret)`.
- Contenus fournis :
  - **conversation** (`lancerConversation`) : en-tête du contact, bulles (envoyées en rouge du design system, reçues en gris), indicateur « … » de 650 ms avant chaque message reçu (absent si animations réduites), « Clic ou Entrée : message suivant », puis « Poser le téléphone (Entrée) » ;
  - **notifications** (`contenuNotifications`, prompt 38) : heure, date, notifications réelles de l'Agenda Nantes Métropole, source, Fermer.

## Utilisations
- **Intro de la première partie** : conversation avec Camille (les SMS existants). Quand on pose le téléphone, on passe à `terminerIntro()`.
- **Ouverture des semaines 2 et 3, et des parties suivantes** (prompt 41) : le patron présente le nouvel élément de jeu.
- **Téléphone de la pièce** : notifications d'événements.
- Le temps du jeu est suspendu pendant une conversation (`smsActif`, comme avant). Clavier : Entrée ou Espace pour avancer, Entrée ou Échap pour fermer les notifications. Chaque message est annoncé en `aria-live`.

## Vérifications
- `npm run build` et `npm test` OK.
- Test automatisé, sans erreur console : intro (message suivant, « … », poser → bureau), notifications au clic sur le téléphone, conversations du patron en semaines 2 et 3. Captures contrôlées : boutons et bulles jamais masqués par la main.
