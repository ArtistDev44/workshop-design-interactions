# Prompt 122 — Jeu « Nantes en régulation » : un seul bouton « Aide et tutoriel » dans le menu

Demande d'origine (12/11/2026) :

> Pour le menu, le bouton aide se change en bouton aide et tutoriel, donc le bouton tutoriel est supprimé.

Suite des prompts 34 (tutoriel dans le livre « Aide »), 35 (menu principal) et 120 (pile de cartes calculée).

## 1. Constat

- Le menu principal a deux cartes voisines : « Aide (H) » et « Tutoriel (livre « Aide ») ». Elles mènent à deux
  écrans qui se renvoient déjà l'un à l'autre (bouton « Tutoriel (T) » dans l'aide).
- Sept cartes avec « Reprendre » : la pile passe en cartes compactes.

## 2. Menu principal

- La carte « Aide (H) » devient **« Aide et tutoriel (H) »** (`mp.aide`, FR + EN). Même icône « ? ».
- La carte « Tutoriel » est **supprimée** (`entreesMenu`). La clé `mp.tutoriel` est retirée d'`i18n.js`.
- La pile compte une carte de moins : vérifier que les cartes normales (84 / 104 px) tiennent de nouveau.

## 3. Fenêtre d'aide : le tutoriel en premier

- La fenêtre d'aide s'ouvre avec, bien visible, l'entrée **« Lancer le tutoriel (T) »** (bouton primaire) :
  c'est maintenant le seul chemin vers le tutoriel depuis le menu.
- Son titre devient « Aide et tutoriel ».
- Le menu Échap du jeu (pause) prend le même libellé « Aide et tutoriel (H) » (`accueil.aide`).
- Inchangé : touche H (aide), touche T depuis l'aide (tutoriel), livre « Aide » de la bibliothèque (tutoriel),
  case « guide de prise en main » de l'écran « Nouvelle partie ».

## 4. Accessibilité

- L'annonce `aria-live` de la carte dit « Aide et tutoriel ».
- Ordre clavier du menu : Nouvelle partie, (Reprendre), Palmarès, Paramètres, Aide et tutoriel, Crédits, puis
  les liens du bas.

## Vérifications

- Menu à 1920×1080 et 1366×768, FR et EN, avec et sans sauvegarde : aucun texte coupé.
- Entrée sur « Aide et tutoriel » → aide ; T → tutoriel ; Échap → retour au menu.
- `npm run build`, `npm test`, audit des textes à 0 défaut.
- Copie dans `rendu/`, rapport `jeu/121-125-signalements-aide-menu.md` (section 122), `prompts/README.md`,
  `journal.md`, `npm run auteurs`.
