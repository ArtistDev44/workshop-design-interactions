# 59 — Webapp installable (prompt 65)

Code : `manifest.webmanifest`, `sw.js` (liste générée), `installation.js`, `scripts/generer-sw.mjs`, icônes.
Aucune dépendance ajoutée ; règles Q1–Q61 et `game.js` inchangés.

## Manifest
- `id`, `name`, `short_name`, `description`, `lang` fr, `dir`, `start_url` et `scope` `./`, `display`
  fullscreen + `display_override` (fullscreen, standalone), `orientation` any, couleurs #0D0C0C, `categories`
  (games, education), **icônes 192 / 384 / 512 « any » et 192 / 512 « maskable »**, 3 **captures** réelles
  (`captures/`), 2 **raccourcis** : « Nouvelle partie » (`./?action=nouvelle`) et « Reprendre la partie »
  (`./?action=reprendre`).
- Icônes rendues depuis `favicon.svg` par Chromium (Playwright local, aucun paquet) ; la version maskable
  réduit le logo à 60 % sur fond uni (zone de sécurité de 20 %). `apple-touch-icon` 180 refait ;
  `index.html` : `apple-mobile-web-app-status-bar-style` black-translucent, `apple-mobile-web-app-title`.

## Service worker
- **Liste générée au build** (`prebuild` → `scripts/generer-sw.mjs`, aussi `npm run sw`) : tous les fichiers de
  `public/` + les pages `/cartel/`, `/making-of/`, `/presentation/` (88 entrées) ; **VERSION = empreinte du
  contenu** : chaque mise en ligne déclenche la mise à jour, les anciens caches sont effacés à l'activation.
- Précache tolérant (une entrée absente n'empêche pas l'installation) ; **navigation : réseau d'abord**, repli
  sur le cache puis sur l'accueil ; fichiers : cache d'abord, mise à jour en arrière-plan ; API externes et
  lectures partielles (audio, vidéo) jamais mises en cache.
- Nouvelle version active → bandeau HTML « Nouvelle version disponible — Recharger » (FR + EN, `role=status`).
- Enregistrement seulement en http(s) ; en `file://`, rien ne change (jeu jouable).

## Installation
- « Installer l'application » en haut à droite du menu principal et dans Paramètres → Accessibilité et reprise,
  **seulement si le navigateur émet `beforeinstallprompt`** ; `appinstalled` → message de confirmation ; une
  fois installée (standalone / fullscreen) → mention « webapp installée » au menu.

## Vérifications
- `npm run build` (88 entrées précachées), `npm test` : smoke 183 contrôles (manifest, icônes, captures,
  VERSION générée, chaque référence de `index.html` dans le précache) + test du jeu 157.
- Chromium sur le site construit : 88 entrées en cache ; invitation simulée → bouton → `prompt()` ;
  `appinstalled` → bouton masqué, mention ; bandeau de nouvelle version ; **réseau coupé** → `?action=nouvelle`
  ouvre le choix de partie, une semaine complète se joue jusqu'au mail de fin, `/presentation/` s'ouvre ;
  `file://` sans service worker. Aucune erreur console.
- Installation réelle sur Android / Chrome de bureau : à faire par le groupe (non testable ici).
