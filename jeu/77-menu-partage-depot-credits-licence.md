# Prompt 81 — menu principal : partager, lien du dépôt, crédits et licence MIT

## Écran titre uniquement (ni jeu, ni menu Échap)

- **Bloc « partager / dépôt » en bas à droite** (`dessinerMenuPrincipal`, menu.js), style Pixel DS,
  icônes dessinées par le code (aucun fichier image) :
  - bouton **GitHub** → ouvre le dépôt dans un nouvel onglet (`window.open(url, '_blank', 'noopener')`) ;
  - bouton **« Partager »** → panneau modal par-dessus le menu (`dessinerPanneauPartage`, voile + croix +
    « Fermer », Échap ferme).
- **Options de partage** (icône pixel + libellé FR/EN, cibles ≥ 44 px) : X, Facebook, LinkedIn, Mastodon
  (URLs construites avec `encodeURIComponent`, texte `mp.partager.texte`) et **« Copier le lien »**
  (`navigator.clipboard.writeText(URL_JEU)` + repli `execCommand`, annonce `aria-live` « Lien copié »).
  Constantes nommées en tête de `menu.js` : `DEPOT_URL`, `LICENSE_URL`, `URL_JEU` (URL canonique).
  Le panneau s'ouvre et se parcourt aussi **hors ligne** (les liens externes restent au navigateur).
- **Pied de page** en bas à gauche : crédits `mp.credits` « Mattéo Brevet & Guillaume Renoult » + licence
  `mp.licence` « Code sous licence MIT » **cliquable** (ouvre le LICENSE du dépôt).
- Clavier : ↑/↓ ou Tab parcourt les options (focus visible, `aria-live`), Entrée active, Échap ferme.

## Fichier `LICENSE`

Texte **MIT complet**, `Copyright (c) 2026 Mattéo Brevet & Guillaume Renoult`, en conservant l'en-tête
PATRIMOINE.EXE · NTE001 et le périmètre (hors p5.js LGPL, données sous leurs licences d'origine).

`game.js` et Q1–Q61 inchangés ; `npm test` vert.
