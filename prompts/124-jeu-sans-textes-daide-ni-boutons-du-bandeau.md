# Prompt 124 — Jeu « Nantes en régulation » : plus de lignes d'aide à l'écran, ni les trois boutons du bandeau

Demande d'origine (12/11/2026) :

> Sur le menu, enlever les lignes de texte d'aide pour le joueur car elles nuisent à l'immersion du gameplay,
> de même pour les trois boutons : quitter la journée, aide, recommencer.

Suite des prompts 43 (bandeau d'état), 94 (bouton « Quitter la journée ») et 98 (boutons du bandeau).

## 1. Constat

- **Menu principal** : sous les cartes, la ligne « ↑ ↓ choisir · Entrée valider · L langue · H aide ».
- **En jeu** : en bas de l'écran, le bandeau d'état « À VOUS · répondez au plaignant (clic ou 1 à 3)… » dicte
  au joueur ce qu'il doit faire, en permanence.
- **Bandeau du haut** : trois boutons — « Quitter la journée (Q) », « Aide (H) », « Recommencer (R) » —
  prennent 650 px à côté des jauges et rappellent sans cesse qu'on est dans une interface de jeu.

## 2. À retirer de l'écran

- Menu principal : la ligne `mp.clavier` n'est plus dessinée.
- En jeu : le bandeau d'état (`bandeauEtat`) n'est plus dessiné. La jauge de somnolence, dessinée au même
  endroit, **reste**.
- Au bureau : la consigne « Cliquez sur le PC ou Entrée pour vous installer · Tab : objets · Échap : menu »
  n'est plus affichée en permanence ; elle ne revient qu'après 10 s sans geste. Les messages d'état (incident,
  mail, soir) restent.
- Bandeau du haut : les trois boutons sont supprimés. La ligne 2 (priorités, objectif, équipes, heure)
  récupère leur largeur ; elle n'est plus tronquée.

## 3. Rien n'est perdu

- **Clavier inchangé** : Q, H et R gardent leur effet ; l'onglet « Raccourcis » de l'aide les liste.
- **Mobile (tactile)** : un seul bouton « ≡ » à droite du bandeau ouvre le menu, faute de touche Échap.
- **Souris et tactile** : le menu Échap (pause) reçoit deux entrées — « Quitter la journée » et
  « Recommencer la semaine » (avec la confirmation existante) — à côté de « Aide et tutoriel ».
  « Quitter la journée » n'y figure que lorsque l'action est possible (au poste, pendant une journée).
- **Lecteurs d'écran** : le texte du bandeau d'état reste annoncé (`aria-live`) à chaque changement de
  phase, sans être affiché.
- **Guide de prise en main** (prompt 37) : ses bulles ne dépendent pas de ces éléments ; vérifier qu'aucune
  cible du guide ne pointe sur un bouton supprimé.

## 4. À garder cohérent

- Tutoriel, aide et textes (`etat.finJournee`, `aide.texte`, étapes du tutoriel) : remplacer toute mention
  d'un bouton supprimé par la touche ou par le menu Échap.
- Audit des textes et audit de parcours : retirer les zones qui n'existent plus.
- Les clés i18n devenues inutiles sont supprimées (FR + EN) ; celles qui servent encore à l'annonce restent.

## Vérifications

- En jeu à 1920×1080 et 1366×768, FR et EN : plus de bandeau d'état, plus de boutons dans le bandeau du haut,
  ligne 2 entière.
- Q, H, R au clavier ; menu Échap à la souris : quitter la journée, aide, recommencer.
- `npm run build`, `npm test`, audit des textes à 0 défaut.
- Copie dans `rendu/`, rapport `jeu/121-125-signalements-aide-menu.md` (section 124), `prompts/README.md`,
  `journal.md`, `npm run auteurs`.
