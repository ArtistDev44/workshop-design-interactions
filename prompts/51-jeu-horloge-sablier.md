# Prompt 51 — Jeu « Nantes en régulation », étape 37 : finir sa journée à l'horloge, sablier

Demande d'origine (10/11/2026) :

> Aussi, à 20h, le joueur peut cliquer sur l'horloge pour quitter correctement sa journée. S'il le
> fait avant, il doit avoir un message d'alerte que la journée n'est pas finie. Or, s'il part quand
> même, la prochaine journée : il aura un mail mis en avant du patron qui lui retire sa crédibilité
> avec un message. Sur le bureau rajoute un sablier qui permettra de faire passer le temps entre les
> dossiers.

## Attendu
1. **Horloge murale cliquable** (souris et clavier) : à partir de la fin de journée (20 h, ou l'heure de
   fin de la journée jouée), elle termine proprement la journée (mail du soir, journée suivante).
2. **Départ anticipé** : avant l'heure, une alerte prévient que la journée n'est pas finie (dossiers
   restants, heure de fin) ; « Partir quand même » / « Rester ».
3. **Conséquence** : si le joueur part quand même, les dossiers restants du jour sont réglés par la
   règle « non traité » existante (conséquences naturelles, Q25) et, le lendemain, un **mail du patron
   mis en avant** (à l'ouverture de la journée) lui retire de la crédibilité : réputation en baisse, texte
   qui cite l'heure réelle du départ et le nombre de dossiers laissés.
4. **Sablier** posé sur le bureau (pixel art, même style que les objets) : entre deux dossiers, un clic
   fait avancer le temps jusqu'au prochain dossier (ou jusqu'à la fin de journée) ; sans effet pendant un
   dossier ; animation de sable (réduite si `prefers-reduced-motion`).
5. Le test `test-jeu.mjs` couvre le départ anticipé (dossiers réglés, malus appliqué une seule fois).

## Vérifications
- `npm run build`, `npm test` ; essai réel : horloge avant / après 20 h, mail du lendemain, sablier ;
  FR + EN ; clavier (objets accessibles par Tab). Documenter dans `jeu/46-…`. Fusion `main` sur demande.
