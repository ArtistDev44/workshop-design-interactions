# Prompt 173 — Jeu : modales (fond plus sombre, clic sur le fond, largeurs harmonisées) et mise en avant par l'obscurité

Demande d'origine (prise de notes du 12/11/2026) :

> Remplacer les contours jaunes par une obscurité des éléments non importants. Dans les modals, assombrir davantage
> le fond et lors du clic du fond, fermer la modal. Harmoniser les tailles des fenêtres (notamment des modals en
> width).

## À faire

1. **Plus de contour jaune de mise en avant** (cibles du guide `guide.js`, surbrillances d'éléments à regarder,
   liserés d'alerte jaunes) : à la place, **assombrir tout ce qui n'est pas la cible** (voile sombre percé autour de
   l'élément important, ≈ 60–70 % d'opacité, transition ≤ 200 ms, immédiate avec `prefers-reduced-motion`).
   L'**indicateur de focus clavier** reste visible (accessibilité) : s'il est jaune, le passer à la couleur d'accent
   (prompt 176), contraste ≥ 3:1 avec le fond.
2. **Fond des modales plus sombre** : un voile unique pour toutes les fenêtres (`voile()` d'`immersion.js`, pause,
   paramètres, partage, aide, bilans) — une seule constante dans `ds.js`, opacité relevée (≈ 0,8) pour que le contenu
   derrière ne concurrence plus la fenêtre.
3. **Clic (ou appui tactile) sur le fond = fermer la modale**, comme Échap. Exceptions : les fenêtres qui exigent une
   réponse (décision d'un dossier, confirmation destructive, autorisations micro / webcam) ne se ferment pas ainsi.
4. **Largeurs harmonisées** : relever les largeurs de toutes les fenêtres et modales, puis les ramener à **trois
   tailles** du DS (par ex. étroite 640, moyenne 960, large 1280 à 1920×1080) déclarées dans `ds.js` et documentées
   dans `design-system/DESIGN.md` ; mêmes marges internes et même hauteur d'en-tête partout.

## Vérifications

- Tableau avant / après des largeurs de fenêtres dans le compte rendu.
- Chaque modale non bloquante se ferme au clic sur le fond ; les fenêtres de décision non.
- Guide « Prendre en main » : la cible est éclairée, le reste assombri, sans contour jaune.
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
