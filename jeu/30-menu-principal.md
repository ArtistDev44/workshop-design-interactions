# 30 — Menu principal modernisé (prompt 35)

L'écran d'accueil « Nantes en régulation » (choix de la semaine) n'est plus affiché **dans l'écran du PC**. Il est remplacé par un **menu principal plein écran**, affiché avant l'accès au bureau. Les décisions Q1–Q61 et la boucle de jeu ne changent pas.

## Écran titre (`menu.js`)
- Il s'affiche après l'écran de chargement (prompt 27), à la place de la vue bureau. `MENU.actif` vaut `true` au chargement.
- Fond : la pièce du bureau floutée (6 px), sous un voile bleu nuit `#0b1b33` dégradé de 94 % à gauche à 45 % à droite.
- Contenu : code de l'œuvre, titre, sous-titre, sélecteur FR / EN, et en pied les raccourcis et les sources des données.
- Cartes de menu (`carteMenu`), avec une icône dessinée par le code :
  - **Nouvelle partie** ;
  - **Reprendre la partie (C)**, seulement si une sauvegarde existe ; elle affiche la semaine, le dossier n/total et l'heure de sauvegarde (prompt 33) ;
  - **Paramètres** ;
  - **Aide (H)** ;
  - **Tutoriel** (livre « Commande », prompt 34).
- Sélection : carte blanche, texte `#0b1b33`, liseré et contour de focus bleu `#005ae1`. Les autres cartes sont translucides, avec un texte blanc sur le voile sombre (contraste > 12:1).
- Clavier : ↑ ↓ / Tab pour choisir, Entrée pour valider, C pour reprendre, H pour l'aide, L pour la langue. Annonces `aria-live`.
- Animations réduites : pas de glissement d'apparition, pas de flou.

## Nouvelle partie
- Quatre cartes en grille 2 × 2, construites avec les mêmes données qu'avant (`optionsAccueil()`) : les trois semaines réelles (dates, difficulté, compteur, dossiers et événements, meilleur score, badge « sauvegardée ») et le mode temps réel, désactivé hors ligne.
- ← → ↑ ↓ / Tab pour choisir, Entrée (ou un second clic) pour lancer, Échap pour revenir.
- Si une sauvegarde existe pour la semaine choisie, la fenêtre « Reprendre / Nouvelle partie » du prompt 33 s'ouvre.
- Dès que `ecran === 'jeu'` (nouvelle partie ou reprise), `fermerMenuPrincipal()` est appelé : on arrive au bureau, le PC déjà allumé sur l'appli de régulation. L'intro SMS et le reste du déroulé ne changent pas.

## Dans le PC
- L'appli « Régulation » sans partie en cours (`dessinerAppliSansPartie`) affiche le message « Aucune partie en cours » et un bouton « Menu principal ». Entrée au poste mène aussi au menu principal.
- Menu Échap modernisé dans le même style : **Reprendre**, **Paramètres**, **Aide**, **Menu principal**. Navigation avec ↑ ↓ / Tab et Entrée.
- Menu principal depuis le menu Échap : la partie est sauvegardée (`Sauvegarde.auto`), puis on retourne à l'écran titre, où « Reprendre » permet de la retrouver.
- L'écran de fin (« Changer de semaine ») ramène aussi au menu principal.

## Vérifications
- `npm run build` et `npm test` OK.
- Test automatisé, en FR, puis en EN avec animations réduites, sans erreur console : titre → Entrée → semaines → Entrée → partie lancée au bureau (PC sur l'appli, SMS) → Échap → menu modernisé → Menu principal → « Reprendre » apparaît → C → partie reprise.
- Tests des prompts 25, 26, 28, 29, 33 et 34 relancés, sans régression.


> Prompt 81 : bloc « partager / dépôt » en bas à droite de l'écran titre (panneau modal Partager : X, Facebook, LinkedIn, Mastodon, copier le lien), crédits + licence MIT cliquable en pied de page — voir `jeu/77-menu-partage-depot-credits-licence.md`.
