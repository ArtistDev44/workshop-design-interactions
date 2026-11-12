# Prompt 177 — Jeu : page « Nouvelle partie » simplifiée

Demande d'origine (prise de notes du 12/11/2026) :

> Pour le choix de partie : juste garder « choisissez un mode de jeu ». Sur la page nouvelle partie, disable le tab
> sur « mode temps réel ». Dans la page « nouvelle partie », intégrer par défaut pour la première partie le mode
> « prendre en main ». Aussi, quand on crée une nouvelle partie, pas besoin d'un modal qui te rappelle que tu as
> une sauvegarde.

Fichiers : `menu.js` (`modesNouvellePartie` ~l.500, `dessinerChoixSemaine` ~l.525, `lancerDepuisMenu` ~l.82),
`guide.js` (`optionGuide`, `dessinerOptionsNouvellePartie`), `i18n.js` (`mp.mode.sous`, `mp.semaines.sous`).

## À faire

1. **Sous-titre réduit à « Choisissez un mode de jeu. »** (`mp.mode.sous`, FR/EN) : retirer la phrase « Une partie :
   une semaine réelle, une quinzaine de signalements… ».
2. **« Mode temps réel » verrouillé ou indisponible** (`mp.mode.direct.verrou`, `mp.mode.direct.horsLigne`) : la
   carte **ne reçoit plus le focus** (Tab et flèches la sautent), n'est pas activable, porte `aria-disabled` et
   garde sa raison affichée. Elle redevient focalisable dès qu'elle est jouable.
3. **Première partie = « Prendre en main » activé par défaut** : tant qu'aucune partie n'a été terminée ni le guide
   achevé (`CLE_GUIDE_FINI`), l'option est cochée d'office sur la page ; le joueur peut la décocher. Aux parties
   suivantes, elle reprend son dernier état.
4. **Plus de modale « vous avez une sauvegarde »** au lancement d'une nouvelle partie : la partie démarre
   directement dans un nouvel emplacement, sans écraser les sauvegardes existantes (prompt 178, à exécuter avec
   celui-ci).

## Vérifications

- Stockage vidé : « Prendre en main » est coché ; après une partie terminée, il ne l'est plus par défaut.
- Tab sur la page : le focus ne s'arrête jamais sur « Mode temps réel » verrouillé.
- Nouvelle partie avec une sauvegarde présente : aucune modale, la sauvegarde est toujours là ensuite.
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
