# Prompt 171 — Jeu : menu principal épuré (aide, crédits, flèche de retour, « PXE- », alignements)

Demande d'origine (prise de notes du 12/11/2026) :

> Supprimer le bouton du menu « aide et tutoriel ». Rajouter l'icone « télécharger » à droite de en-fr. Mettre au
> même niveau les boutons à droite et à gauche du menu (language et PXE). Supprime le bouton crédits. Enlever la
> flèche de retour (l'icone). Enlever PXE- sur le menu. Vérifier l'interlignage du texte en dessous du titre dans
> la page menu.

Dépend du prompt 170 (icônes Lucide). L'aide reste accessible en jeu (prompt 172).

## À faire

1. **Supprimer l'entrée « Aide et tutoriel »** du menu principal (`menu.js`, `entreesMenu` ~l.71, clé `mp.aide`) et
   son raccourci H **dans le menu**. La fenêtre d'aide n'est plus ouverte depuis le menu titre.
2. **Supprimer le bouton « Crédits »** (`EXTRAS_MENU` ~l.306, `mp.credits.menu`). Le pied de page avec les deux noms
   (`piedCredits`, prompt 125) reste le seul accès à l'écran des crédits — à confirmer dans le compte rendu si le
   groupe veut retirer l'écran lui-même.
3. **Icône « Télécharger »** (Lucide `download`) à **droite du sélecteur de langue FR / EN**, même hauteur, même
   style de bouton à icône. Hypothèse retenue : elle **installe le jeu** (PWA, prompt 65 : `beforeinstallprompt`) ;
   si l'installation n'est pas proposée par le navigateur, le bouton ouvre l'explication d'installation existante.
   Infobulle et annonce « Installer le jeu ». *Si le groupe voulait « télécharger la sauvegarde », le dire avant
   d'exécuter.*
4. **Même ligne de base** pour les éléments du haut de l'écran : le logo à gauche et le bloc langue + télécharger à
   droite partagent le même `y`, la même hauteur et la même marge au bord (80 px à 1920×1080).
5. **Retirer le préfixe « PXE- »** affiché sur le menu (logo / mention « PXE-NTE001 » : ne garder que le logo ou le
   titre du jeu). Les clés de stockage `pxe-nte001…` ne changent pas.
6. **Retirer l'icône de flèche** des boutons « Retour » (`mp.retour`, `param.retour`, écrans Nouvelle partie,
   Paramètres, Crédits) : le libellé seul reste, Échap fonctionne toujours.
7. **Interlignage du texte sous le titre** de la page menu : vérifier que la hauteur de ligne suit l'échelle du DS
   (`design-system/DESIGN.md`, ≈ 1,4 × le corps), sans chevauchement ni ligne orpheline en FR et en EN ; corriger la
   valeur dans `dessinerMenuPrincipal` (~l.250).

## Vérifications

- Captures 1920×1080 et 1366×768 du menu, FR et EN : plus de « Aide et tutoriel », plus de « Crédits », plus de
  « PXE- », plus de flèche ; logo et bloc langue alignés ; icône télécharger à droite de FR / EN.
- Navigation clavier du menu : l'ordre de tabulation reste cohérent après les suppressions.
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
