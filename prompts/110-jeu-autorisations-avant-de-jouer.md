# Prompt 110 — Jeu « Nantes en régulation » : toutes les autorisations demandées avant de jouer

Demande d'origine (12/11/2026) :

> Avant de jouer, toutes les autorisations (micro, caméra, son) doivent être demandées.

Premier des prompts 110 → 113.

## 1. Constat

- Le micro (`micro.js`, prompt 54) et la webcam (`webcam.js`, prompt 57) n'appellent `getUserMedia` qu'au
  premier geste en jeu : appui sur M, clic sur le micro, clic sur la webcam.
- La fenêtre du navigateur tombe donc **en pleine partie**, sur la carte, pendant un dossier.
- Le son (`Confort.Son`) ne démarre qu'au premier geste : c'est la règle d'autoplay des navigateurs.

## 2. Écran « Autorisations »

- **Quand :** entre le choix de la semaine (« Nouvelle partie ») et le début de la partie. Il s'affiche
  aussi avant « Reprendre ».
  - Une fois par session de page. Il ne revient pas tant que les trois choix sont faits.
  - Il revient à la session suivante si une autorisation reste « non demandée ».
- **Contenu :** trois lignes, dessinées par le code avec le Pixel DS (`ds.js`, `DS.*`) :
  - **Son** : musique et bips. Le clic sur « Tout autoriser » démarre `Confort.Son` (geste utilisateur) ;
  - **Micro** : souffler pendant le boost du café (prompt 63) ;
  - **Caméra** : montrer la main pour la sieste (prompt 67).
  - **Statut** de chaque ligne : « Non demandé », « Autorisé », « Refusé » ou « Absent ». Lire le statut
    réel avec `navigator.permissions.query` quand il existe, sinon le dernier résultat.
- **Boutons :**
  - **« Tout autoriser »** (primaire, focus par défaut) : un seul `getUserMedia({ audio, video })`, donc une
    seule fenêtre du navigateur. Si l'appel échoue, retenter micro et caméra séparément pour savoir lequel
    manque.
  - **Une ligne par périphérique** : autoriser ce seul périphérique.
  - **« Jouer »** (« Continuer sans » tant que rien n'est autorisé) : lance la partie.
- **Pas de flux qui reste ouvert :** les pistes obtenues sont arrêtées tout de suite (`track.stop()`). Le
  voyant de la caméra s'éteint, et la permission reste retenue par le navigateur pour l'origine. Les
  modules `micro.js` et `webcam.js` gardent leur propre ouverture au geste.
- **Réglages :**
  - micro autorisé → `Confort.Reglages.micro` reste ou passe à `true` ;
  - caméra autorisée → `Confort.Reglages.webcam` **reste inchangé**. Ce réglage rallume la webcam au premier
    geste des sessions suivantes (`webcam.js`) : la passer à `true` ici l'allumerait sans clic. La webcam reste
    donc opt-in, au clic ou par l'option, et elle ne redemande plus la permission ;
  - son coupé dans les réglages → la ligne Son l'indique et propose de le rallumer.
- **Refus :** le jeu reste entièrement jouable. Le message dit ce qui ne marchera pas : « Sans micro, le café
  se calme seul ». Aucune relance insistante.
- **Contexte non sécurisé ou API absente** (`file://` de `rendu/`, vieux navigateur) : statut « Absent »,
  bouton « Jouer » seul actif.

## 3. Accessibilité

- Navigation au clavier : Tab / ↑ ↓, Entrée, Échap = retour au choix de la semaine.
- Les statuts sont annoncés par `annoncer()`.
- Contraste ≥ 4,5:1. Aucun flash ; `prefers-reduced-motion` respecté.
- Les textes passent par `t()`, en FR et en EN dans `i18n.js`.
- Mobile portrait (`PORTRAIT.actif`) : les lignes sont empilées, les cibles font au moins 44 px.

## 4. Fichiers

- Nouveau `site/public/autorisations.js`, chargé dans `index.html` avant `menu.js`.
- `menu.js` : `lancerDepuisMenu` et « Reprendre » passent par l'écran.
- `sw.js` : régénéré par le build. Faire la copie dans `rendu/` comme pour les prompts précédents.

## Vérifications

- Chromium avec périphériques simulés : `--use-fake-device-for-media-stream`.
  - Tout autoriser → trois « Autorisé » ;
  - en jeu, M maintenu et clic sur la webcam ne redemandent rien.
- Refus simulé (`--deny-permission-prompts`) : « Refusé », partie lancée, aucune erreur console.
- `npm run build`, `npm test`, audit des textes (`?audit=textes&parcours=1`) à 0 défaut.
- Doc `jeu/110-113-autorisations-badges-intro-credits.md`, `prompts/README.md`, `journal.md`.
