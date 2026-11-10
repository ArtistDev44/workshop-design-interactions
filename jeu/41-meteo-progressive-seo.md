# 41 — Météo progressive et SEO (prompt 45)

## Météo progressive par la baie vitrée (`bureau.js`)
- Deux facteurs lissés de 0 à 1 (`METEO_VISU`) remplacent les bascules jour/nuit et sec/pluie :
  - **nuit** suit l'heure simulée, avec une aube de 6 h à 7 h 30 et un crépuscule de 19 h 30 à 21 h ;
  - **pluie** passe à 1 au-delà d'1 mm le jour joué.
- Les deux facteurs convergent avec une constante de temps de 2,5 s : un changement de journée ou de météo se fait en fondu sur quelques secondes. Avec animations réduites, le changement est direct.
- Tout est mélangé (`melange()`) :
  - dégradé du ciel ;
  - soleil qui s'efface et lune qui apparaît ;
  - deux nuages de plus qui se forment avec la pluie ;
  - couleur de la ville et lumières qui s'allument ;
  - grue (et vitre de la cabine) ;
  - rive d'en face ;
  - eau, reflets et vaguelettes de la Loire ;
  - péniche et sillage ;
  - densité de la pluie.
  Les ambiances sonores suivaient déjà en fondu (prompt 30).
- La fenêtre montre désormais la **météo du jour joué** (`meteoFenetre()`, comme le store du prompt 29), et non la météo du moment.
- Mesure : passage à 9 mm de pluie → facteur 0,15 → 0,36 → 0,65 → 0,88 → 0,98 en 9 s.

## SEO (`site/public/index.html`, `src/pages/cartel.astro`)
- Titre : « Nantes en régulation — jeu de régulation des transports nantais ».
- Description : « Jeu en pixel art : régulez le réseau de transports nantais à partir de données réelles (retards Naolib, météo, agenda de Nantes Métropole). Mode histoire en trois semaines et mode temps réel. »
- URL canonique `https://workshop-design-interactions.pages.dev/` (et `/cartel/`), `robots` index, `theme-color #0d0c0c`.
- **Open Graph** : titre, description, URL, locale fr_FR / en_GB, image et son texte alternatif. **Carte Twitter** `summary_large_image`.
- **Image OG** `og-image.jpg` (1200×630, 60 ko) : capture du **vrai rendu** de l'écran titre du jeu, recadrée. Rien d'inventé.
- **Favicon** : nouveau pictogramme pixel du jeu (moniteur à écran rouge du Pixel Design System, ligne de bus, deux arrêts), en `favicon.svg`, `favicon.ico` (16/32/48), `apple-touch-icon.png` (180) et `icon-192` / `icon-512` (rendu au plus proche voisin). Il remplace l'ancien favicon par défaut d'Astro.
- `manifest.webmanifest` (nom, couleurs, icônes, plein écran).
- Données structurées JSON-LD `VideoGame` : nom, URL, description, langues, genre, plateforme, gratuit, image. Aucun auteur indiqué, l'information étant encore `[À COMPLÉTER]`.
- Aucun service externe ni traceur.

## Vérifications
- `npm run build` et `npm test` OK. Balises présentes dans `dist/index.html` et `dist/cartel/index.html`. Les fichiers d'icônes, l'image et le manifeste sont copiés dans `dist/`.
- Le jeu se charge sans erreur (test du menu principal).
