# Prompt 114 — Jeu « Nantes en régulation » : nouveau design de l'écran Crédits, aucun texte coupé dans le menu

Demande d'origine (12/11/2026) :

> Modifie le design de la page Crédits. Sur le menu : veille à ce qu'aucun texte ne soit coupé.

Suite du prompt 113. Le contenu reste factuel : rien d'ajouté sans source, inconnu → `[À COMPLÉTER]`.

## 1. Constat (captures 1920×1080, FR et EN, avec et sans sauvegarde)

- **Menu, « Reprendre la partie (C) » :**
  - le sous-titre « 14/09/2026 · dossier 1/15 · sauvegardée à 13:22 » passe sur deux lignes ;
  - `carteMenu` le dessine dans une boîte de 40 px, donc la deuxième ligne est masquée ;
  - on lit « sauvegardée à » **sans l'heure**.
  - L'audit des textes ne le voit pas, car cette zone n'est pas déclarée.
- **Menu à 7 cartes** (avec « Reprendre ») : la carte « Crédits » finit à ~952 px. Elle touche le pied de page
  (« ↑ ↓ choisir… », ~958 px).
- **Écran Crédits (prompt 113) :**
  - deux longs paragraphes de 20 px (licence, IA), difficiles à parcourir ;
  - des portraits posés sans cadre ;
  - aucun rappel des fenêtres du Pixel DS, alors que la diapositive « L'équipe » en utilise.

## 2. Menu : aucun texte coupé

- **Sous-titre d'une carte** : sur une seule ligne, à une taille ajustée à la largeur (`ajusterTaille`,
  18 → 14 px). Ne jamais le dessiner dans une boîte plus petite que son texte.
  - Si, même à 14 px, il ne tient pas : deux lignes, et la carte grandit d'autant.
  - Déclarer la zone pour l'audit des textes (`zoneTexteDeclarer` / `zoneTexteDebut`).
- **Pile de cartes calculée :**
  - hauteurs et écarts répartis dans l'espace disponible, entre le sous-titre du jeu et le pied de page ;
  - au moins 16 px de marge au-dessus du pied de page ;
  - cartes normales (84 / 104 px) si elles tiennent, sinon compactes (72 / 92 px) avec un écart d'au moins
    6 px.
- **Vérifier à 1920×1080 et 1366×768**, en FR et en EN, avec et sans sauvegarde :
  - titres des cartes, sous-titres, pied de page, liens « Crédits » et licence, bloc Dépôt / Partager /
    Présentation, sélecteur de langue ;
  - aussi l'écran « Nouvelle partie » (choix de la semaine).
  - Aucun texte tronqué, masqué ou qui chevauche un autre.

## 3. Écran Crédits : nouveau design

- **Fenêtres du Pixel DS** (barre de titre en capitales, carrés pixel, bordure blanc 15 %), comme la
  diapositive « L'équipe » :
  - **Portraits** : une fenêtre par personne. Barre « Portrait », image pixel sans lissage, plaque du nom en
    dessous. La mention de l'atelier est sous le titre de l'écran.
  - **Licence** et **Utilisation de l'IA** : deux fenêtres à droite. Chaque fait est sur une ligne
    **libellé / valeur** : libellé en capitales jaune DS (`DS.alerte`), valeur en blanc 75 %. C'est la même
    grille que l'encadré « Crédits » du deck.
    - **Licence :** Code (MIT, © 2026), Données (Open Data Nantes Métropole, Open-Meteo, Hub'Eau
      [À COMPLÉTER]), Lieux (OpenStreetMap ODbL), Bibliothèque (p5.js LGPL-2.1), Musiques (CC0 1.0, et les
      autres composées en code).
    - **IA :** Outils (Claude Code d'Anthropic ; ponctuellement Mistral Vibe), Méthode (prompts écrits et
      relus par le groupe, `prompts/` et `/making-of/`), Données (réelles, rien d'inventé), Visuels
      (dessinés par le code), Part humaine ([À COMPLÉTER]).
- **Liens** (Lire la licence, Making-of, Dépôt du code, Retour) :
  - même rangée en bas ;
  - focus clavier en double bordure du DS (comme `dsBouton`) plutôt que le cadre rouge épais ;
  - Retour en bouton secondaire à droite.
- Les textes passent par `t()`, en FR et en EN. Les valeurs tiennent dans leur ligne : taille ajustée, ou
  retour à la ligne avec une hauteur calculée, jamais coupée. Contraste ≥ 4,5:1. Animation d'entrée douce,
  absente si les animations sont réduites.
- Clavier inchangé : Tab, ← →, Entrée, Échap.

## Vérifications

- Captures avant/après du menu (1920 / 1366, FR / EN, avec et sans sauvegarde) et de l'écran Crédits.
- `npm run build`, `npm test`, audit des textes à 0 défaut aux 3 tailles.
- Copie dans `rendu/`, ajout au rapport `jeu/110-113-autorisations-badges-intro-credits.md` (section 114),
  `prompts/README.md`, `journal.md`, `npm run auteurs`.
