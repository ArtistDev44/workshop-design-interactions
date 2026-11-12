# Prompt 188 — Jeu : bouton « Kit de presse » dans le menu principal

Demande d'origine (12/11/2026) :

> Créer un kit de presse pour le jeu « Nantes en régulation », accessible depuis le menu principal. Le kit doit
> permettre à un journaliste ou un organisateur d'événement d'obtenir rapidement : un communiqué de presse,
> des captures d'écran, la vidéo de démo, le logo, et les liens vers le jeu, le dépôt et la présentation.

## À faire

### 1. Nouveau dossier `site/public/kit-presse/`

Créer le dossier avec :

- **`communique-de-presse.md`** (et version `.txt` identique) : communiqué de presse FR, 250–350 mots, structuré
  (titre, chapô, 3–4 paragraphes, « En bref » en puces, contact). Contenu à partir de `jeu/00-concept.md`,
  `README.md` et `cartel` : le jeu rejoue une semaine réelle du réseau Naolib avec des données ouvertes
  (Open Data Nantes Métropole), 3 jauges à préserver, aucun événement inventé (sauf incidents fictifs marqués
  comme tels). Mentionner : ESD Nantes, atelier B3 Design, novembre 2026, licence MIT, URL du jeu
  (`URL_JEU`), dépôt GitHub (`DEPOT_URL`), présentation (`/presentation/`). Pas de faux chiffres, pas de fausse
  citation de presse — tout chiffre doit venir du code ou des docs du dépôt, sinon `"[À COMPLÉTER]"`.
- **`README.md`** dans le kit : index lisible des fichiers, avec pour chaque : nom, format, taille, licence,
  et à quoi il sert (ex. « hero.jpg — capture 1920×1080 du menu principal, pour illustrer un article »).

### 2. Copier les médias existants (pas de re-capture)

Copier depuis `site/public/captures/` vers `site/public/kit-presse/` :

- `hero.jpg`, `detail-01.jpg`, `process.jpg`, `thumb.jpg` (captures du jeu, déjà à jour de main)
- `demo.mp4` (vidéo de démo 29 s)

Copier aussi `site/public/favicon.svg` vers `kit-presse/logo.svg`. Vérifier que chaque fichier copié est bien
servi en statique (Astro sert `public/` à la racine) et listé dans le précache du service worker
(`site/public/sw.js` — régénéré par `npm run build`).

### 3. Bouton « Kit de presse » dans le menu principal

Dans `site/public/menu.js`, suivre exactement le modèle du bouton « Livrables » (prompt 136) :

- Nouvelle fonction `ouvrirKitPresse()` qui ouvre `./kit-presse/` dans un nouvel onglet (chemin relatif, comme
  `ouvrirLivrables()`, fonctionne en ligne, en local et hors ligne).
- Ajouter `{ cle: 'kitpresse', action: () => ouvrirKitPresse() }` dans `EXTRAS_MENU` (après `livrables`,
  avant `depot` — ordre clavier ↑ ↓ / Tab = ordre visuel).
- Deuxième rangée de bouton pleine largeur au-dessus du bloc dépôt · partage · présentation, sous la rangée
  Livrables : même largeur (`3 * b.l + 32`), même hauteur (`b.h`), 16 px d'écart vertical, icône `presse`
  (ou `carnet` si l'icône n'existe pas — vérifier dans `ds.js` les icônes disponibles, ne pas en inventer une).
- Ajuster `dessinerMenuPrincipal` (~ligne 373) pour dessiner cette rangée : `boutonIcone(b.x, b.y - 2 * (b.h + 16), 3 * b.l + 32, b.h, 'presse', t('mp.kitpresse'), ouvrirKitPresse, focusExtra(n, 'kitpresse'))`.
- Mettre à jour `portrait.js` : la région du bloc en portrait inclut les deux rangées (Livrables + Kit de presse).

### 4. Textes i18n (`site/public/i18n.js`)

Ajouter pour FR et EN :

- `mp.kitpresse` : « Kit de presse » / "Press kit"
- `mp.kitpresse.infobulle` : « Ouvrir le kit de presse : communiqué, captures, vidéo, logo (nouvel onglet) » /
  "Open the press kit: release, screenshots, video, logo (new tab)"
- `mp.kitpresse.annonce` : annonce aria-live pour le lecteur d'écran, ex. « Kit de presse ouvert dans un nouvel onglet. » /
  "Press kit opened in a new tab."

### 5. Page d'index du kit (`site/public/kit-presse/index.html`)

Page statique autonome (pas de dépendance au jeu, servie telle quelle) au Pixel Design System (fond `#0D0C0C`,
primaire `#D4031C`, JetBrains Mono) :

- Titre « Nantes en régulation — Kit de presse », sous-titre avec l'URL du jeu.
- Section « Communiqué de presse » : le texte rendu en HTML lisible + lien de téléchargement
  (`communique-de-presse.txt`, `download`).
- Section « Visuels » : galerie des 4 captures JPG avec `<img>` (lazy), chacune avec légende et lien de
  téléchargement direct. `thumb.jpg` sert de vignette.
- Section « Vidéo » : `<video controls preload="none" poster="thumb.jpg">` pointant vers `demo.mp4`.
- Section « Logo » : `logo.svg` affiché sur fond sombre et clair, lien de téléchargement.
- Section « Liens » : boutons vers le jeu (`URL_JEU`), le dépôt (`DEPOT_URL`), la présentation
  (`/presentation/`), la licence (`LICENCE_URL`).
- Pied de page : « Mattéo Brevet & Guillaume Renoult — ESD Nantes, 2026 — Code sous licence MIT ».
- Accessibilité : contrastes ≥ 4,5:1, focus visible, `lang="fr"`, navigation clavier complète, responsive
  (mobile portrait ≥ 44 px pour les cibles tactiles).

### 6. Service worker et build

- `npm run build` dans `site/` régénère `sw.js` avec les nouveaux fichiers du précache. Vérifier que
  `kit-presse/` est servi hors ligne (test : couper le réseau, recharger, la page s'affiche).
- Mettre à jour `site/scripts/smoke.mjs` (ou équivalent) pour vérifier que `kit-presse/index.html`,
  `communique-de-presse.txt`, `logo.svg` et les 4 JPG + `demo.mp4` sont bien dans le manifest du service worker.

## Vérifications

- `npm run build` puis `npm test` dans `site/` verts.
- Capture 1920×1080 du menu principal : les deux rangées (Livrables, Kit de presse) sont alignées au-dessus du
  bloc dépôt · partage · présentation, même largeur, 16 px d'écart.
- Navigation clavier : ↑ ↓ parcourent les entrées dans l'ordre visuel (… Livrables → Kit de presse → Dépôt →
  Partager → Présentation) ; Entrée ouvre `./kit-presse/` dans un nouvel onglet.
- Ouvrir `./kit-presse/` en local (`file://` ou preview) : la page s'affiche, tous les médias se chargent,
  les liens externes s'ouvrent. Hors ligne après installation PWA : idem.
- Audit des textes (`?audit=textes`) à 0 défaut A–D sur les 3 tailles, FR et EN, y compris la page du kit.
- `prompts/README.md` (ligne 188) et `prompts/auteurs.json` mis à jour ; entrée dans `journal.md` au push.

## Hors périmètre (ne pas faire)

- Ne pas re-faire les captures (utiliser celles de `captures/`, déjà à jour).
- Ne pas modifier le jeu lui-même (`game.js`, règles Q1–Q61).
- Ne pas créer de compte presse ou de formulaire de contact externe.
- Ne pas traduire le kit de presse en anglais dans ce prompt (FR uniquement ; l'EN pourra être un prompt ultérieur).
