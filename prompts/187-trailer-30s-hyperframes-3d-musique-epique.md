# Prompt 187 — Trailer de 30 s du jeu « Nantes en régulation » (3D, musique épique libre de droits, montage)

Objectif : une **bande-annonce de 30 s exactement**, 1920 × 1080, 30 i/s, qui donne envie de jouer, **montée à
partir d'une capture vidéo du jeu** : on enregistre d'abord une vraie partie, et cette capture est la matière
principale du film (au moins 80 % de la durée à l'écran). Les effets 3D, titres et transitions viennent
**autour et au service** de la capture ; ils ne la remplacent jamais. Musique épique dont la licence est
**vérifiée et créditée**. Chaîne à rendre visible, même en 30 s :
**source → grammaire → système → œuvre** (la donnée de Nantes devient un dossier, le dossier devient un choix).

## 0. Skills à charger (déjà installés dans `~/.claude/skills/`)

Avant toute ligne de code, charger dans cet ordre et suivre leur contrat :

1. `/hyperframes` — contrat de rendu (timeline GSAP en pause, déterministe), boucle de travail. Lire ensuite
   `references/types/launch.md`, `references/types/3d.md`, `references/story.md`, `references/spec.md`,
   `references/motion.md`, `references/sound.md`, `references/runtimes.md` (Three.js) et `references/review.md`.
2. `/hyperframes-cli` — `init`, `check`, `snapshot`, `preview`, `beats`, `render`.
3. `/hyperframes-registry` — **chercher un bloc existant avant d'écrire un effet** (transitions, glitch, grain,
   titres cinétiques, mouvements de caméra, 3D).
4. `/media-use` — musique, effets sonores, mixage, étalonnage.
5. `/game-feel` en appui pour le rythme des impacts (punch-in, hit-stop visuel calé sur les temps forts).

Fraîcheur : suivre `hyperframes/references/skill-lifecycle.md` (CLI épinglé, Node ≥ 22, FFmpeg présents).
Rendu **local** uniquement (`npx hyperframes render`), jamais le rendu cloud.

## 1. Préparation (règles du dépôt)

- `git fetch` puis partir de `origin/main` à jour. D'autres sessions travaillent dans le même dossier : si la
  branche courante n'est pas `main` ou si l'arbre est sale, travailler dans un worktree
  (`git worktree add ../wdi-187 -b 187-trailer-30s-hyperframes-3d-musique-epique origin/main`, lien symbolique
  vers `site/node_modules`).
- Projet vidéo dans **`trailer/`** à la racine (`npx hyperframes init trailer`). Ajouter au `.gitignore` :
  `trailer/node_modules/`, `trailer/renders/`, `trailer/assets/raw/`, et le fichier musical si sa licence
  interdit la redistribution seule (voir § 3).
- Ne lire ni `site/public/data/fallback/`, ni les tokens Nantes Métropole, ni `site/dist/` (CLAUDE.md).

## 2. Capture du jeu d'abord (base du trailer)

Avant tout storyboard, enregistrer le jeu :

- Script `trailer/scripts/capture.mjs` (Playwright : `playwright-core` du cache `npx`, voir la mémoire « audit des
  textes ») : `npm run build && npm run preview` dans `site/`, partie jouée **hors réseau** (données de repli),
  viewport 1920 × 1080, enregistrement vidéo de la page (`recordVideo`), curseur visible,
  `prefers-reduced-motion` désactivé.
- Le script joue une **partie complète et lisible** : menu principal → arrivée au bureau / vue 3D du PC → ouverture
  de dossiers réels → choix → jauges qui réagissent → téléphone et messages → carte → passage des jours → rapport
  de fin de semaine. Temps d'attente explicites entre les actions pour que chaque geste soit lisible.
- Sortie : `trailer/assets/raw/partie-complete.webm`, ré-encodée en H.264 30 i/s dans
  `trailer/assets/clips/partie-complete.mp4`, plus une capture séparée (2–4 s) par moment fort dans
  `trailer/assets/clips/` si un plan doit être refait plus proprement.
- Dérusher : écrire `trailer/DERUSHAGE.md` — liste horodatée des moments utilisables (début, fin, ce qu'on voit,
  intérêt pour le trailer). **Le storyboard (§ 4) se construit à partir de cette liste**, pas l'inverse.
- Si un écran n'est pas atteignable de façon fiable : `npx hyperframes capture`, sinon `site/public/captures/demo.mp4`
  en secours, sinon un placeholder étiqueté « Capture : [écran] » signalé dans la réponse. Jamais d'écran recréé.
- Relancer la capture si le jeu a changé depuis : le trailer montre l'état actuel de `main`.

## 2 bis. Matière réelle complémentaire (rien à inventer)

| Matière | Où | Usage dans le trailer |
|---|---|---|
| Tracés réels des lignes Naolib + Loire | `site/public/data/lignes.json` (Open Data Nantes Métropole, Licence Ouverte) | accent 3D bref (≤ 3 s) qui s'enchaîne sur la carte capturée du jeu |
| Dossiers réels des archives (perturbations datées, météo, agenda) | `site/public/data/fallback.json` — n'en extraire que 3 à 5 libellés avec `node -e`, jamais le fichier entier | textes des alertes, en citant date et source |
| Image Open Graph « carte réelle de nuit, titre pixel » | `site/scripts/og-image.html` + `og-image.mjs` | **référence de direction artistique** (rendu pixel du titre, rouge, fond) |
| Logo bulle-pin | `site/public/favicon.svg` | carton final |
| Police JetBrains Mono auto-hébergée | `site/public/fonts.css` + fichiers liés | copier dans `trailer/assets/fonts/` avec `@font-face` |
| Couleurs | `design-system/pixel-design-system.md`, `pixel-palette.tokens.json` (rouge `#D4031C`, fond `#0D0C0C`, blanc) | toute la palette du film |
| Démo existante (29 s, sans son) | `site/public/captures/demo.mp4` | secours seulement si une capture échoue |

Interdits : police Picon, identité visuelle Nantes Métropole, faux écran de jeu, faux chiffre, fausse citation de
presse, fausse note ou faux nombre de joueurs. Toute info manquante → `"[À COMPLÉTER]"` dans `SPEC.md` et
signalée dans la réponse finale.

## 3. Musique épique libre de droits (licence vérifiée, jamais supposée)

Ordre de préférence :

1. **CC0 / domaine public ou CC BY 4.0** (redistribuable avec le dépôt public). Piste à vérifier en premier :
   Kevin MacLeod sur incompetech.com, catégorie épique / cinématique (ex. « Five Armies », « Heroic Age ») —
   licence CC BY 4.0, crédit obligatoire :
   `"<Titre>" Kevin MacLeod (incompetech.com) — Licensed under Creative Commons: By Attribution 4.0 License
   http://creativecommons.org/licenses/by/4.0/`. Autres sources acceptables si la page de la piste affiche la
   licence : Free Music Archive (filtre CC0 / CC BY), Openverse audio.
2. **Pixabay Music** (licence Pixabay, crédit facultatif mais ajouté) : la licence interdit de redistribuer le
   fichier seul → **ne pas commiter le MP3**, seulement la vidéo finale ; noter l'URL de téléchargement dans
   `trailer/CREDITS.md`. Si le téléchargement exige une connexion, me demander de le faire (`! …`) plutôt que de
   contourner.
3. Catalogue HeyGen via `/media-use` seulement si `heygen` est déjà connecté ; sinon génération locale MusicGen
   (`media-use/audio/references/bgm.md`) en dernier recours, notée comme telle.

Critères de choix : montée orchestrale/percussions, un **drop ou un impact net entre 18 et 24 s** du montage
(chercher le passage dans la piste, pas forcément son début), tempo 120–140 BPM pour couper sur les temps.
Télécharger dans un dossier vide `trailer/assets/raw/music/`, vérifier avec `ffprobe`, puis découper/fondre en
une piste de 30 s (`trailer/assets/music.*`, fondu de sortie ~1,5 s calé sur le carton). Lancer
`npx hyperframes beats --json` et **caler chaque coupe sur la grille de temps**.

Effets sonores (whoosh, impact, bip radio, clic) : Openverse CC0 / CC BY via `/media-use`, ou synthétisés ;
chacun crédité. Mix : musique dominante, SFX sous la musique, crête ≤ −1 dBTP, ~−14 LUFS intégrés
(`media-use/references/mixing.md`).

`trailer/CREDITS.md` liste pour **chaque** son : titre, auteur, URL de la page, licence + lien, date de
téléchargement. Aucune piste sans page de licence consultée.

## 4. Récit et découpage (proposition — à faire valider)

Suivre `story.md` : proposer **trois storylines en mots, toutes montées à partir des moments de
`DERUSHAGE.md`** (chaque beat cite son horodatage dans la capture), et **attendre mon choix** (si je réponds
« sans arrêt », prendre la A). Storyline A, de référence :

| t (s) | Beat | Image (extrait de la capture) | Effet |
|---|---|---|---|
| 0 – 3 | Accroche | Noir. Un bip radio. Capture : le bureau de la salle de contrôle / la **vue 3D du PC** du jeu qui s'allume | lente poussée de caméra sur la capture, flou de mouvement ; possible accent 3D bref : les tracés réels de `lignes.json` qui s'allument et se fondent dans la carte du jeu |
| 3 – 8 | Tension | Capture : alertes et notifications réelles qui arrivent dans le jeu (téléphone, messages, dossiers) | punch-ins sur chaque alerte, coupes sur les temps, titre cinétique « 7 jours. ~15 décisions. » (chiffres pris dans `jeu/00-concept.md`) |
| 8 – 12 | Révélation | Capture : on entre dans l'écran du PC, l'appli principale s'ouvre | « zoom à travers » l'écran capturé (launch.md), transition causée par un objet à l'écran |
| 12 – 22 | Preuve | Capture : dossier ouvert, choix cliqué, jauges qui bougent, carte, passage des jours | punch-ins 1,6–2× sur le contrôle utile, curseur grand (4–7 % du cadre), 3 à 5 types de transition au total, aucune UI inclinée en 3D |
| 22 – 26 | Point culminant | Drop musical : rafale de plans courts de la capture, jauges au bord du rouge, tampon du rapport de fin de semaine | accélération du rythme (coupes à la noire), léger shake de caméra, grain/scanlines du registre appliqués à la capture |
| 26 – 30 | Carton | Logo bulle-pin puis « NANTES EN RÉGULATION » en rendu pixel (comme l'OG), sous-titre « Rejouez une vraie semaine du réseau nantais », `workshop-design-interactions.pages.dev`, « Données : Open Data Nantes Métropole », crédit musique en petit | logo « joué » et non fondu (launch.md), tenu ≥ 2 s |

Puis écrire `trailer/SPEC.md` (`spec.md`) : chaque adjectif en nombre (durées, eases, échelles, couleurs), plan par
plan, liste des clichés bannis (titre sur capture assombrie, logo dans un coin, liste de fonctionnalités en
3 cartes…). Textes à l'écran en français, ≤ 6 mots par carton, ≥ 26 px à 1080p après zoom.

## 5. Montage de la capture

- Chaque plan du trailer est un extrait de `partie-complete.mp4` (ou d'un clip de `assets/clips/`), découpé par
  `data-media-start` / `data-duration`, jamais une interface redessinée.
- Contrôle : à la fin, `trailer/REVIEW.md` donne la part de la durée occupée par la capture (objectif ≥ 80 %).
- Les `<video>` du trailer sont `muted` (le son vient de la piste musique et des SFX).

## 6. Construction

- Une sous-composition par beat dans `trailer/compositions/` ; `index.html` ne contient que les hôtes de scène,
  la musique et les SFX ; textes et couleurs en variables (`data-var-text`, `var(--…)`).
- 3D : Three.js selon `runtimes.md` ; tout rendu = fonction pure du temps de la timeline, hasard **graine fixe**,
  préparation lourde dans `window.__hf.buildReady`, valeurs bornées (un NaN noircit l'image via le bloom).
- Étalonnage/grain des clips via `npx hyperframes media-treatment`, jamais des filtres CSS.

## 7. Accessibilité et sécurité de l'image

- **Aucun flash** : pas plus de 3 éclairs par seconde (WCAG 2.3.1), pas de plein écran rouge clignotant, shake
  léger. Contraste du texte ≥ 4,5:1.
- `trailer/trailer.fr.vtt` : description textuelle des cartons et des sons (pas de voix), à joindre à la vidéo.

## 8. Vérifier, rendre, livrer

1. `npx hyperframes check --json` : zéro erreur, chaque avertissement pesé.
2. `npx hyperframes snapshot --review` → `trailer/REVIEW.md` (lisibilité, rythme sur les temps, plongée 3D,
   carton final, aucun cadre noir, durée = 30,0 s).
3. Ouvrir l'aperçu (`npx hyperframes preview`) et **attendre mon accord** avant le rendu final (sauf « sans arrêt »).
4. Rendu local, puis livraison :
   - `site/public/captures/trailer.mp4` — H.264 yuv420p, AAC 192 kb/s, `-movflags +faststart`, **≤ 20 Mo**
     (limite Cloudflare Pages 25 Mio par fichier) ; vérifier avec `ffprobe` durée 30,00 s, 1920 × 1080, 30 i/s.
   - `site/public/captures/trailer-poster.jpg` (image du carton final).
   - `site/public/captures/trailer.fr.vtt`.
5. Ne pas remplacer `demo.mp4` ni modifier `cartel.astro` : **proposer** l'intégration (balise `<video controls
   preload="none" poster=…>` avec `<track kind="descriptions">`) et attendre ma réponse.
6. `npm run build` puis `npm test` dans `site/` ; ligne de statut dans `prompts/README.md` ; ligne en tête de
   `journal.md` ; commit, push de la branche, fusion dans `main` et push (`--no-ff`), suppression du worktree.

## Réponse finale attendue

Lien local de la vidéo, durée/poids mesurés, la musique retenue avec sa licence et son crédit exact, la liste des
captures réelles utilisées, les `"[À COMPLÉTER]"` restants, et ce qui a été écarté (et pourquoi).
