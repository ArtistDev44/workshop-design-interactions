# Prompt 122 — Jeu « Nantes en régulation » : mode exposition et filet en cas d'erreur

Demande d'origine (12/11/2026) : prompts tirés de `audit-2026-11-12.md`, sections 3.3 et 6.

## 1. Mode exposition (`?expo=1`)

### Constat

- Il faut plus d'une minute et une quinzaine de gestes avant la première décision : écran « Avant de jouer »
  (micro et caméra), six SMS, s'asseoir, démarrage du PC, fenêtre « Votre poste », briefing des priorités.
- Aucun retour au menu après inactivité en partie : un visiteur qui part laisse le jeu en sieste ou figé à 20 h.
- Tout persiste en `localStorage` (clés `pxe-nte001*`) : le visiteur suivant tombe sur « Reprendre » et ne voit
  ni l'intro ni le tutoriel.

### À faire

- Paramètre d'URL `?expo=1` (ou `#expo`), lu une fois au chargement : `EXPO.actif`.
- **Au chargement en mode expo** : effacer toutes les clés `pxe-nte001*` **sauf** les réglages de confort
  (langue, son, animations réduites, palette) — vérifier leurs noms dans `confort.js` et `i18n.js`.
- **Démarrage court** :
  - pas d'écran « Avant de jouer » (le jeu reste jouable sans micro ni caméra) ;
  - pas de SMS d'intro ;
  - le joueur est assis, le PC démarré et l'appli ouverte ;
  - pas de fenêtre « Votre poste » ni de briefing bloquant (priorités tirées d'office) ;
  - le guide « Prendre en main » reste proposé, sans l'attente imposée de 10 s.
- **Inactivité** : après 90 s sans geste (clavier, souris, toucher) **en partie**, un écran « Partie en pause —
  touchez pour continuer » avec un compte à rebours de 15 s, puis retour à l'écran titre avec purge comme au
  chargement. Rien ne se passe sur l'écran titre (la démo automatique existante s'en charge).
- Un discret « EXPO » dans un coin de l'écran titre, pour que l'équipe sache le mode actif.
- Hors `?expo=1`, rien ne change.

## 2. Filet en cas d'erreur

### Constat

Une exception dans `draw()` arrête p5 : l'écran reste figé pour de bon (bug `H_PLATEAU` corrigé ce matin). Aucun
`window.onerror` dans le jeu.

### À faire

- Dans `installation.js` : un écouteur `error` (et `unhandledrejection` pour les erreurs de rendu seulement) qui,
  si p5 a cessé de dessiner (`frameCount` figé depuis 2 s), affiche un message sobre « Petit souci, on relance… »
  puis recharge la page après 3 s. Au plus un rechargement par minute (horodatage en `sessionStorage`), pour
  éviter une boucle.
- Ne rien recharger pour une erreur réseau ou une promesse rejetée qui ne touche pas le rendu.

## Vérifications

- Navigateur sans tête : `?expo=1` → première décision en moins de 4 gestes ; stockage purgé ; retour au titre
  après inactivité (tester avec un délai réduit par un paramètre de test).
- Erreur provoquée volontairement dans `draw()` (console) : message puis rechargement, une seule fois.
- `npm run build`, `npm test`.
- Doc commune `jeu/120-124-audit-experience-rendu.md`, `prompts/README.md`, `journal.md` ; ajouter l'URL
  d'exposition au `README.md` de `site/` et de `rendu/`.
