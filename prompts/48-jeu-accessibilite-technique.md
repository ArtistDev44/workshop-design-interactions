# Prompt 48 — Jeu « Nantes en régulation », étape 34 : accessibilité, confort et robustesse technique

Demande d'origine (10/11/2026) — parties « 5. Accessibilité et confort » et « 6. Technique et
robustesse » :

> Mode daltonisme : palettes alternatives pour les jauges et alertes (protanopie,
> deuteranopie, tritanopie) · Taille de police réglable · Mode « lecture facile » : ralentir le
> compte à rebours, désactiver le tic-tac sonore · Sauvegarde cloud manuelle : un QR code de
> reprise sur un autre appareil · Tests automatisés du jeu (test-jeu.mjs qui simule une partie
> complète) · Mode « démo automatique » (attract mode sur le menu principal) · PWA complète :
> service worker pour un vrai fonctionnement hors ligne avec cache des données · Statistiques
> de partie : graphiques de l'évolution des jauges en fin de semaine

## Attendu
1. **Daltonisme** (Paramètres) : normal, protanopie / deutéranopie (bleu / orange), tritanopie
   (rouge / turquoise) pour les jauges, seuils et alertes ; mémorisé.
2. **Taille du texte** (Paramètres) : 100 %, 115 %, 130 % pour les textes de l'interface.
3. **Lecture facile** (Paramètres) : compte à rebours ×1,5, pas de tic-tac.
4. **Reprise sur un autre appareil** : une sauvegarde (≈ 25 ko) dépasse la capacité d'un QR
   code (≈ 3 ko) ; à la place, un QR code mène au jeu et l'export / import JSON existant
   (prompt 33) transporte la partie — expliqué dans les Paramètres.
5. **`test-jeu.mjs`** : simule une partie complète avec les vraies fonctions de `game.js`
   (Node, sans navigateur) et vérifie les invariants ; branché sur `npm test`.
6. **Démo automatique** : après 40 s sans action sur le menu principal, la caméra parcourt la
   pièce et des faits réels du jeu défilent ; une touche reprend la main.
7. **PWA** : `sw.js` met en cache le jeu et ses données (stratégie cache d'abord), enregistré
   seulement en http(s).
8. **Statistiques** : courbe des trois jauges, décision par décision, sur le rapport papier.

## Vérifications
- `npm run build`, `npm test` (dont `test-jeu.mjs`) ; chaque réglage ; hors ligne avec le
  service worker ; FR + EN. Documenter dans `jeu/43-…`. Fusion `main`.
