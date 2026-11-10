# Prompt 35 — Jeu « Nantes en régulation », étape 22 : menu principal modernisé avant le bureau

Objectif : retirer l'écran d'accueil « Nantes en régulation » (choix de la semaine) qui
s'affiche aujourd'hui **dans l'écran du PC**, et le remplacer par un **menu principal
modernisé**, plein écran, affiché **avant l'accès au bureau**. Ce menu est le **menu de
jeu** : Nouvelle partie (créer), Reprendre, Paramètres, Aide, Langue. Les décisions
verrouillées Q1–Q61 et la boucle de jeu ne changent pas.

S'appuie sur les prompts 14–34 et les correctifs de rendu (`jeu/29-…`) : sauvegarde du
prompt 33 (`Sauvegarde.lister()`, `Sauvegarde.reprendre()`), i18n du prompt 24, écran de
chargement du prompt 27, menu Échap du prompt 20.

Fichiers concernés : `site/public/` (nouveau `menu.js` chargé avant `immersion.js`,
`sketch.js` pour `draw()` / clavier / souris, `os.js` pour l'appli de régulation sans
partie, `immersion.js` pour le menu Échap, `i18n.js`), plus `jeu/` et `journal.md`.

Règles absolues : aucun fichier image (tout est dessiné par le code) ; tout texte via
`t(...)` en FR + EN ; contraste ≥ 4,5:1 ; clavier complet (↑ ↓ Entrée Échap Tab) ;
`aria-live` ; `prefers-reduced-motion` (pas d'animation, apparition directe) ; aucune
donnée inventée (les semaines, difficultés et compteurs viennent de `data/semaines.js`).

## 1. Menu principal (écran titre)
- Affiché après l'écran de chargement, **à la place de la vue bureau**, en plein écran
  (1920×1080) : fond = la pièce du bureau floutée et assombrie (rappel du jeu), titre
  « Nantes en régulation », sous-titre, code de l'œuvre, liste verticale de boutons larges
  et modernes (cartes à angles arrondis, icône dessinée par le code, survol et focus
  visibles), sélecteur de langue FR / EN en haut à droite, pied avec les sources.
- Entrées : **Nouvelle partie** · **Reprendre** (visible seulement si une sauvegarde
  existe ; reprend la plus récente, avec semaine, dossier n/total et heure) ·
  **Paramètres** (fenêtre existante) · **Aide** (fenêtre existante) · **Tutoriel** (livre
  « Commande »).
- Clavier : ↑ ↓ (ou Tab) pour choisir, Entrée pour valider, L pour la langue, H pour
  l'aide, C pour reprendre.

## 2. Écran « Nouvelle partie » (choix de la semaine)
- Remplace l'ancien accueil du PC : une carte par semaine réelle (dates, difficulté,
  compteur, nombre de dossiers et d'événements, meilleur score, badge « sauvegardée ») et
  le mode « Aujourd'hui en temps réel » (désactivé hors ligne).
- Boutons : **Lancer la partie** (Entrée), **Retour** (Échap). Si une sauvegarde existe
  pour la semaine choisie : la fenêtre « Reprendre / Nouvelle partie » du prompt 33.
- Au lancement : le menu disparaît, on arrive **au bureau**, PC allumé sur l'appli de
  régulation ; l'intro SMS (première partie) et le reste du déroulé sont inchangés.

## 3. Le PC ne contient plus l'accueil
- Dans l'appli « Régulation », sans partie en cours : message court et bouton « Menu
  principal ». Avec une partie : le jeu, comme avant.
- Menu Échap (prompt 20) modernisé dans le même style : **Reprendre**, **Paramètres**,
  **Aide**, **Menu principal** (sauvegarde automatique puis retour à l'écran titre).

## 4. Vérifications
- `npm run build` et `npm test` dans `site/`.
- Parcours au clavier seul et à la souris : titre → Nouvelle partie → semaine → partie ;
  Échap → Menu principal → Reprendre (état identique, prompt 33) ; FR + EN ;
  `prefers-reduced-motion` ; hors ligne (le mode temps réel est désactivé).
- Documenter dans `jeu/30-menu-principal.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-35-menu-principal`. À chaque push : entrée en tête de `journal.md`.
