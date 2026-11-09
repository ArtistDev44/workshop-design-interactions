# Prompt 05 — Page d'accueil de l'édition NTE001

## Objectif
Construire la page d'accueil (`src/pages/index.astro`) qui présente l'édition comme
« preuve de fonctionnement » du framework : une ville, une institution hôte, un
événement public.

## Contexte
Framework, section 03 « The network » : 001 / Nantes / France / NTE001 / ESD Nantes /
STUDIO / 2026, « Pilot edition · B3 Design · 9, 10 & 12 Nov. 2026 ». Compteurs du
framework : 1 city activated · 1 host institution · 1 public live work. Manifeste :
« Le patrimoine n'est pas une banque de formes à copier, mais un ensemble de structures,
de savoirs, de gestes et de mémoires que l'on peut étudier, formaliser et reprogrammer. »

## Instructions
1. Page `index.astro` via `Layout.astro`, en français, structurée ainsi :
   - en-tête éditorial : **PATRIMOINE.EXE / NANTES 001**, édition NTE001, ESD Nantes,
     B3 Design, 9, 10 & 12 novembre 2026, type STUDIO ;
   - le manifeste du framework (citation ci-dessus, FR + EN) ;
   - compteurs : 1 ville activée · 1 institution hôte · 1 œuvre publique (données lues
     depuis `src/data/edition.json`, voir prompt 06 — créer ce fichier avec ces valeurs
     si le prompt 06 n'est pas encore exécuté) ;
   - la chaîne **SOURCE → GRAMMAIRE → SYSTÈME → ŒUVRE** présentée visuellement ;
   - appels vers Œuvres, Catalogue, Méthode.
2. Aucun contenu factice : toutes les informations proviennent de ce prompt (citations
   ci-dessus). Ne pas relire le livret complet : il n'apporte rien de plus ici.
3. Liens internes via `import.meta.env.BASE_URL` ; fichiers dans `site/src/pages/`.

## Vérifications
- La page s'affiche correctement en 1920×1080 et en mobile (responsive simple).
- `npm run build` génère `dist/index.html` sans erreur.
