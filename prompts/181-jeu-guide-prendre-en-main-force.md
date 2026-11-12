# Prompt 181 — Jeu : guide « Prendre en main » contraignant

Demande d'origine (prise de notes du 12/11/2026) :

> Sur le mode du guide, le joueur doit être forcé de faire ce qui est demandé s'il ne quitte pas le guide via le
> bouton dédié.

S'appuie sur le prompt 173 (cible éclairée, reste assombri).

## À faire

1. Tant que le guide est actif (`guide.js`, `GUIDE.actif`, `ETAPES_GUIDE` ~l.58), **seule la cible de l'étape en
   cours est interactive** : clics, touches et glisser-déposer hors cible sont ignorés (ni action, ni changement de
   vue, ni ouverture d'une autre fenêtre). Le voile sombre du prompt 173 matérialise la zone inactive.
2. **Bouton dédié « Quitter le guide »**, toujours visible et focalisable pendant le guide (plus Échap, avec
   confirmation courte) : c'est la seule autre action possible. Quitter rend toutes les interactions.
3. Un geste hors cible **rappelle la consigne** (la bulle se signale brièvement, annonce au lecteur d'écran), sans
   son agressif ni flash.
4. Le **temps de jeu est suspendu** entre les étapes pour que le joueur ne soit pas pénalisé pendant qu'il cherche
   la cible ; aucune étape ne peut devenir impossible (cible masquée, hors écran, appli fermée) : le guide ramène la
   vue nécessaire lui-même.
5. Clavier : le focus est piégé sur la cible et le bouton « Quitter le guide ».

## Vérifications

- Dérouler tout le guide à la souris puis au clavier : impossible de sortir du chemin sans « Quitter le guide » ;
  aucune étape bloquante (test automatisé dans `test-jeu.mjs` : chaque étape a une cible atteignable).
- Après « Quitter le guide », toutes les interactions sont revenues.
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
