# Prompt 65 — Site en webapp installable (PWA complète) : manifest, service worker, icônes, bouton d'installation

Demande d'origine (10/11/2026) :

> Rendre le site installable comme une webapp : manifest complet (icônes maskable, raccourcis, métadonnées),
> service worker qui précache tout le jeu pour un hors ligne total, bouton « Installer l'application »,
> et vérifications d'installation (build + tests + smoke).

Une base existe déjà (prompt 48 : `manifest.webmanifest` en `display: fullscreen`, `sw.js` cache-first
`VERSION = 'nte-regulation-v11'`, icônes 192/512, `apple-touch-icon`, enregistrement dans `index.html`
en http(s) uniquement). Ce prompt la rend **installable partout** et vérifiable. Règles Q1–Q61 inchangées,
`game.js` non touché, **aucune dépendance ajoutée** à `site/package.json`.

## Attendu
1. **Manifest complet** (`public/manifest.webmanifest`) : `id`, `name`, `short_name`, `description`,
   `lang` fr (+ `dir`), `start_url: "./"`, `scope: "./"`, `display: "fullscreen"` +
   `display_override: ["fullscreen", "standalone"]`, `background_color` / `theme_color` #0D0C0C,
   `orientation`, `categories`, **icônes 192, 384, 512 + `purpose: "any maskable"`** (icône sur fond uni
   #0D0C0C avec marge de safe zone ~ 20 %), `screenshots` (captures existantes de `public/captures/`),
   `shortcuts` (« Nouvelle partie », « Reprendre » → `./?action=…` si pertinent).
2. **Icônes** : générer les tailles/maskable manquantes avec un outil local (ImageMagick, ffmpeg ou script
   Node natif — **aucun nouveau package npm**) à partir du logo existant ; vérifier visuellement le
   rendu maskable (safe zone). `apple-touch-icon` 180×180 à jour ; `<meta name="theme-color">`,
   `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`,
   `apple-mobile-web-app-title` dans `index.html`.
3. **Service worker** (`public/sw.js`) : le précache (`ESSENTIELS`) doit couvrir **100 % des assets
   servis** — cross-check automatique avec `index.html` (scripts, CSS, data, audio, images, manifest,
   favicon) et `dist/` (page `/cartel/`, `/presentation/`, `/making-of/`) ; stratégie cache-first pour
   le site, **network-first avec repli cache pour la navigation**, les API externes jamais cachées
   (replis locaux du jeu) ; bump de `VERSION`, nettoyage des anciens caches à l'activation,
   `skipWaiting` + notification de nouvelle version discrète (bandeau « Nouvelle version disponible »,
   FR + EN) ; enregistrement toujours limité à http(s), jamais `file://`.
4. **Bouton d'installation** : dans le menu principal et les Paramètres, bouton « Installer
   l'application » visible uniquement si `beforeinstallprompt` est émis (et non encore installé),
   caché sinon ; à l'installation (`appinstalled`) → message de confirmation ; en mode `standalone`
   (`matchMedia('(display-mode: standalone)')`) → badge discret « webapp installée ». Textes FR + EN,
   `aria-live`.
5. **Smoke test** (`site/scripts/smoke.mjs`, sans dépendance) : le manifest parse en JSON et contient
   `name`, `short_name`, `start_url`, `display`, `icons` (chaque fichier d'icône existe dans `public/`),
   `theme_color` ; chaque `src`/`href` local de `index.html` est listé dans `ESSENTIELS` (ou couvert par
   le précache) ; `sw.js` contient `VERSION` ; aucune clé/secret.
6. **Hors ligne total** : après installation, couper le réseau → recharger → le jeu se lance et une
   partie complète (fallback) se joue sans erreur console.

## Vérifications
- `cd site && npm run build && npm test` (smoke + test-jeu) OK.
- Installation réelle testée (Chrome/Edge desktop + Android) : bouton Install, icône écran d'accueil,
  lancement en fullscreen/standalone, hors ligne complet ; `file://` inchangé (pas de sw, jeu jouable).
- `git diff` relu : aucun secret, aucune dépendance ajoutée. FR + EN. Documenter dans `jeu/59-…`.
  Branche dédiée ; fusion `main` sur demande.
