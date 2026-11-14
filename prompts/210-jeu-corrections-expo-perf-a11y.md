# Prompt 210 — Jeu : corrections de l'audit 206 (exposition, rendu, performance, accessibilité, tests humains)

Origine : feuille de route de `jeu/206-audit-complet-projet.md`, demandée le 14/11/2026 : « 1. oui mais ne mets pas
le numéro de téléphone — règle le bug ; 2. fais tout ; 3. ; 4. ; 5. ». Statut : **exécuté** (branche
`210-jeu-corrections-expo-perf-a11y`). Rapport : `jeu/210-corrections-audit-206.md`.

Règles : aucune donnée inventée (licences relues dans les métadonnées de l'API le jour même), rien de ce qui dépend du
groupe n'est rempli à sa place (`[À COMPLÉTER]` conservés), un commit par étape, `npm run build` et `npm test` verts.

## 1. Avant toute nouvelle exposition

- **Commentaires violents** : masqués d'office en `?expo=1` (`Jeu.violenceMasquee`, réglage retiré des Paramètres en
  exposition) ; quand le masquage est actif, les 7 messages `incitation: true` ne sont plus tirés
  (`plainteCorrespond`). **Pas de numéro de téléphone ajouté** (consigne du groupe).
- **Avertissement de contenu et âge conseillé** sur l'écran titre (`avertissementContenu`, `menu.js`), FR / EN.
- **Webcam et micro** : en exposition, remis à leur valeur par défaut à chaque visiteur (`confort.js`) ; jeton de
  demande et garde contre les doubles demandes (`webcam.js`, `micro.js`) ; caméra coupée quand l'onglet est masqué.
- **Bug des plaintes Community** : une seule horloge, `tempsPlaintes()` (réponse dans `os.js`, recalage à la
  sauvegarde et à la reprise dans `sauvegarde.js`) ; test qui échoue sans le correctif.

## 2. Avant le rendu

- **Licences** : GTFS Naolib = ODbL, éditeur Semitan (et non « Licence Ouverte ») partout — données préparées,
  scripts de préparation, `manifest.json`, cartel (registre), appli « Données », source-sheet, README ; parkings,
  vélos (JCDecaux), fluidité = ODbL ; OSM, Lucide (ISC), JetBrains Mono (OFL, texte livré dans `licences/`), musiques
  CC0 / CC BY dans `LICENSE` ; Hub'Eau aux crédits du jeu.
- **Appli « Données » hors ligne** alimentée par `Jeu.fallback` (6 dossiers, météo, événements).
- **`rendu/` resynchronisé** en dernier.
- Restent au groupe : rôles, contributions, part humaine de l'IA, test croisé (`[À COMPLÉTER]`).

## 3. Qualité et performance

- Flou de la pièce au poste mis en cache (`pieceFloueAuPoste`, `bureau.js`).
- Précache réduit : noyau strict (`addAll`) ≈ 3,3 Mo, lot complémentaire non bloquant (MP3 seul, diaporama, kit de
  presse, pages Astro) repris de l'ancien cache ; OGG, vidéos, outils d'audit, `.md`, doublons `.json` hors précache ;
  `registration.update()` au chargement ; `messages.json` relu seulement en développement local.
- Son suspendu quand l'onglet est masqué.
- CI : `.github/workflows/tests.yml` (build + `npm test` avec navigateur) remplace la publication GitHub Pages (404).
- `scripts/test-navigateur.mjs` : le jeu lancé dans Chromium sans interface, hors ligne, 2 tailles, mode exposition,
  lecteur d'écran — échoue si `setup()` est cassé (vérifié par mutation).
- Diaporama Slidev sorti du `prebuild` (`npm run build:slides` à la demande) ; `_headers` (CSP en Report-Only,
  `Permissions-Policy`) ; page `404.html`.

## 4. Accessibilité

- Zoom par pincement autorisé (`user-scalable=no` retiré) ; tailles de texte supplémentaires (voir le rapport).
- Réglage « Raccourcis d'une lettre » (WCAG 2.1.4) : désactivé, Maj + la lettre garde le raccourci.
- Bandeau « Nouvelle version » atteignable au clavier (focus à l'apparition, Échap le ferme).
- `lecteur-ecran.js` : commandes HTML miroirs des zones cliquables, texte de l'écran, file d'annonces, canevas masqué
  aux lecteurs d'écran ; changement de langue annoncé.

## 5. Tests humains

Protocole : `jeu/210-protocole-tests-humains.md` (5 joueurs, PC d'exposition, téléphones réels, NVDA / VoiceOver,
raccourcis et zoom). Les résultats sont à saisir par le groupe.
