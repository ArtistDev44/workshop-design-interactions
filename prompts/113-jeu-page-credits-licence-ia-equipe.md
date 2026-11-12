# Prompt 113 — Jeu « Nantes en régulation » : page Crédits (licence, usage de l'IA, l'équipe) + diapositive Slidev

Demande d'origine (12/11/2026) :

> Intègre une page crédits avec lien depuis le menu. Il y aurait la licence, l'utilisation de l'IA, et nos deux
> images de profil avec nos noms (`matteo-pp.webp`, `guillaume-pp.webp`). Insère ces mêmes images dans une slide
> Slidev avec nos noms.

Dernier des prompts 110 → 113.

## 1. Images

- **Sources :** `matteo-pp.webp` et `guillaume-pp.webp`, à la racine du dépôt, fournies par le groupe.
  - Portraits pixelisés sur fond rouge, 700 × 700.
  - Elles collent au Pixel DS (rouge primaire `#D4031C`).
- **Copies :**
  - dans `site/public/assets/credits/` pour le jeu, avec un chemin relatif `./` (relançable hors ligne et
    depuis `rendu/`) ;
  - dans `slides/public/img/equipe/` pour le deck.
- **Taille :** les servir réduites, par exemple 320 px en WebP. Garder le rendu pixel (`image-rendering:
  pixelated`, ou `imageSmoothingEnabled = false` dans p5).
- **Texte alternatif :** « Portrait de Mattéo Brevet » / « Portrait de Guillaume Renoult ».
- **Service worker :** les images sont listées pour l'usage hors ligne.

## 2. Écran « Crédits » dans le jeu

- **Accès :**
  - nouvelle entrée **« Crédits »** dans le menu principal (`entreesMenu`, `menu.js`), après « Tutoriel » ;
  - le pied de page « Mattéo Brevet & Guillaume Renoult · Code sous licence MIT » devient lui aussi un lien
    vers cet écran ;
  - vérifier que les cartes du menu tiennent toujours dans 1080 px : ajuster l'écart, déjà géré pour plus
    de 5 entrées.
- **Écran du menu :** `MENU.ecran = 'credits'`, même fond que le menu, dessiné par le code avec le Pixel DS.
  Pas de page HTML séparée.
- **Contenu, sans rien inventer** (inconnu → `[À COMPLÉTER]`) :
  1. **L'équipe** : les deux portraits côte à côte, avec dessous le nom (Mattéo Brevet, Guillaume Renoult).
     - Ajouter le rôle seulement s'il est connu par le dépôt (README, `prompts/auteurs.json` ou
       `/making-of/`), sinon ne pas en mettre.
     - Mention : « Atelier ESD Nantes, B3 Design, novembre 2026 ».
  2. **Licence** :
     - le code est sous licence MIT, © 2026 Mattéo Brevet & Guillaume Renoult (d'après `LICENSE`) ;
     - les données gardent leur licence d'origine : Licence Ouverte / ODbL Nantes Métropole, CC BY 4.0
       Open-Meteo, Hub'Eau, OpenStreetMap ODbL pour les lieux géocodés (prompt 106) ;
     - p5.js est sous LGPL-2.1 ;
     - musiques : d'après `audio/CREDITS.md` ;
     - un lien « Lire la licence » ouvre `LICENCE_URL`.
  3. **Utilisation de l'IA** — factuel, d'après le dépôt :
     - le jeu, le site et la documentation ont été produits par un assistant IA, Claude Code (Anthropic),
       et ponctuellement par Mistral Vibe ;
     - les assistants exécutaient les prompts écrits et relus par le groupe (`prompts/`, visibles sur
       `/making-of/`) ;
     - les décisions de design sont verrouillées dans `jeu/` (Q1–Q61) ;
     - les données sont réelles et rien n'est inventé ;
     - la part humaine détaillée (relecture, tests en salle) reste `[À COMPLÉTER]` par le groupe s'il n'y
       a pas de source ;
     - aucune image du jeu n'est générée par IA : à vérifier, sinon le dire.
- **Navigation :** Échap ou « Retour » revient au menu. Tab / ↑ ↓ passent sur les liens (licence, dépôt,
  making-of). Annonce `annoncer()` à l'ouverture.
- **i18n :** FR et EN. Contraste ≥ 4,5:1. Mobile portrait : portraits et sections empilés.

## 3. Diapositive Slidev

- Dans `slides/slides.md`, nouvelle diapositive **« L'équipe »**, juste avant « Livrables & crédits » ou à la
  fin, avant « Merci ».
  - Les deux portraits avec les noms en dessous.
  - Style du deck : classes existantes de `slides/styles/index.css`, fenêtre Pixel DS.
  - Notes de présentateur courtes.
- Dans l'encadré « Crédits » existant, ligne IA : reprendre le même texte factuel que le jeu, au lieu du seul
  `[À COMPLÉTER]`, et garder `[À COMPLÉTER]` pour la part humaine.
- Build du deck : `cd slides && npm run build`, ou via `npm run build` dans `site/` s'il le reconstruit. La
  page `/presentation/` doit montrer la diapositive.

## Vérifications

- Menu → Crédits → Retour, à la souris et au clavier. Les images s'affichent en ligne, hors ligne, et depuis
  `rendu/index.html`.
- `npm run build`, `npm test`, audit des textes à 0 défaut. Le deck se construit.
- Doc commune `jeu/110-113-autorisations-badges-intro-credits.md`, qui couvre les quatre prompts.
- `prompts/README.md`, `journal.md`. `cd site && npm run auteurs` pour `prompts/auteurs.json`.
