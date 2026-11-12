# Prompt 125 — Jeu « Nantes en régulation » : pied du menu principal réduit à nos noms

Demande d'origine (12/11/2026) :

> Je souhaite également que tu me supprimes les deux lignes au-dessus de nos noms et prénoms ainsi que le lien
> pour le code sous licence MIT dans le menu principal du jeu.

Suite des prompts 81 (crédits, licence, dépôt), 113 / 120 (écran Crédits) et 124 (ligne d'aide retirée).

## 1. Constat (bas gauche du menu principal)

1. « ↑ ↓ choisir · Entrée valider · L langue · H aide » — retirée par le prompt 124 ;
2. « Données réelles : Open Data Nantes Métropole, Naolib, Open-Meteo, Hub'Eau » ;
3. « Mattéo Brevet & Guillaume Renoult · Code sous licence MIT » (les noms mènent aux Crédits, la licence
   ouvre le dépôt).

## 2. Menu principal

- Les **deux lignes au-dessus des noms** ne sont plus dessinées (`mp.clavier`, `mp.sources`).
- Le lien **« Code sous licence MIT »** et le séparateur « · » sont supprimés. Il reste une seule ligne :
  nos noms, soulignés, qui ouvrent l'écran Crédits.
- L'entrée `licence` sort de `EXTRAS_MENU` : l'ordre clavier après les cartes devient
  Dépôt → Partager → Présentation.
- La pile de cartes regagne la hauteur libérée (`basPile`) : cartes normales et écart plus large.

## 3. L'information reste accessible

- Les sources des données et la licence MIT sont déjà dans l'écran **Crédits** (fenêtre « Licence », lien
  « Lire la licence ») : vérifier que les quatre sources y figurent, sinon les y ajouter (rien d'inventé).
- `LICENCE_URL` reste défini une seule fois (utilisé par l'écran Crédits).
- Les clés i18n devenues inutiles (`mp.clavier`, `mp.sources`, `mp.licence`, `mp.licence.infobulle`) sont
  supprimées, en FR et en EN.

## Vérifications

- Menu à 1920×1080 et 1366×768, FR et EN, avec et sans sauvegarde : une seule ligne en bas à gauche, aucun
  texte coupé, aucune carte qui touche le pied de page.
- Tab / ↑ ↓ : plus d'arrêt sur un lien de licence ; Entrée sur les noms → Crédits.
- `npm run build`, `npm test`, audit des textes à 0 défaut.
- Copie dans `rendu/`, rapport `jeu/121-125-signalements-aide-menu.md` (section 125), `prompts/README.md`,
  `journal.md`, `npm run auteurs`.
