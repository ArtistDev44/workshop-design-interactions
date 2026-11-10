# 43 — Accessibilité et technique (prompt 48)

Code : `accessibilite.js` (réglages, démo, courbes), `sw.js` (hors ligne), `scripts/test-jeu.mjs` (tests).

## Paramètres → « Accessibilité et reprise » (touche 9)
Réglages mémorisés avec les autres (`pxe-nte001:jeu:reglages`).
- **Couleurs (daltonisme)**, touche 1 : normales / protanopie / deutéranopie (bon = bleu, attention =
  jaune pâle, critique = orange) / tritanopie (bon = turquoise, attention = rose, critique = rouge).
  S'applique aux jauges, seuils, alertes, légendes de la carte, appli Indicateurs et encre du rapport papier.
  Aperçu des trois niveaux dans la fenêtre. Sur le rapport, les courbes se distinguent aussi par leur
  motif (plein, tirets, pointillés).
- **Taille du texte**, touche 2 : 100 / 115 / 130 %. Les **petits textes (< 24 px)** grandissent, jusqu'à
  24 px au plus ; l'interligne suit. Les titres et grands textes gardent leur taille : à 130 % pour tous
  les textes, l'appli et le rapport se chevauchaient (essai écarté). Les boîtes HTML (import, journal de
  bord) suivent la même échelle (`--echelle-texte`). `textSize()` lu par le code renvoie la taille demandée,
  pas la taille agrandie (sinon `ajusterTaille` grossissait le texte en boucle et bloquait la page).
- **Lecture facile**, touche 3 : compte à rebours ×1,5 (60 s → 90 s en semaine facile), pas de tic-tac.

## Reprendre sur un autre appareil
- Une sauvegarde pèse **de 6 à 45 ko environ** selon l'avancée de la semaine (mesuré : 6,4 ko au début,
  43 ko en fin de semaine) ; un QR code contient moins de 3 ko. Pas de « QR de reprise » donc : la fenêtre
  explique l'export / import JSON (prompt 33) et montre le QR code qui mène au jeu
  (`assets/qr-edition.png`). Rien n'est envoyé sur un serveur.

## Démo automatique
- Après **40 s sans action** sur l'écran titre, la caméra parcourt lentement la pièce (immobile si les
  animations sont réduites) et des **faits réels** défilent toutes les 6 s : semaines (dossiers, événements,
  niveau), météo réelle la plus ventée, un événement réel de l'agenda. Toute touche, clic ou mouvement de
  souris rend la main au menu (l'appui ne déclenche rien d'autre).

## Hors ligne (PWA)
- `sw.js` : précache du jeu (HTML, scripts, données, p5), puis **cache d'abord** pour tous les fichiers du
  site, mis à jour en arrière-plan (la version suivante sert à la visite d'après). Les API ne sont jamais
  mises en cache par le service worker (le jeu a ses instantanés). Enregistré seulement en http(s).
- Musique : les requêtes partielles (range) des fichiers audio ne sont pas mises en cache.

## Courbes des jauges
- Rapport papier : courbe des trois jauges, décision par décision (`jaugesApres` enregistré à chaque
  décision), de 50 au départ jusqu'aux valeurs finales (objectifs, plaintes et malus compris).

## Tests automatisés
- `scripts/test-jeu.mjs`, lancé par `npm test` : charge les vrais `data/*.js`, `i18n.js` et `game.js` dans
  un contexte Node isolé, joue chaque semaine archivée de bout en bout de 3 façons (renfort/déviation/retenue,
  ne rien faire, déviation seule) et vérifie : jauges entières dans 0–100, paquet entièrement joué, score =
  somme des jauges, type de fin, aucun texte manquant dans les mails et le bilan, au plus une inspection,
  profil attendu, **reprise d'une sauvegarde** au 3e dossier → même score final, taille de sauvegarde,
  reproductibilité, agenda sans fiche fourre-tout, démission seulement sous 20, toutes les clés traduites en
  anglais, partie en anglais, et chaque script de `index.html` présent dans le cache de `sw.js`.
- 127 contrôles. Contrôle du test : un score volontairement faussé (+1) fait échouer 9 contrôles.

## Vérifications
- `npm run build`, `npm test` (smoke 72 contrôles + test du jeu 127 contrôles).
- Chromium 1920×1080, sans erreur console : réglages (protanopie, 130 %, lecture facile) appliqués et
  mémorisés, Échap revient aux Paramètres ; démo lancée après 40 s puis arrêtée par une touche ; partie
  complète avec compteur à 90 s ; rapport avec courbes ; page rechargée **hors réseau** servie par le
  service worker (jeu chargé).
