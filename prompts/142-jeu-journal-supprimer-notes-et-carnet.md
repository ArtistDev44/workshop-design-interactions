# Prompt 142 — Jeu : supprimer la fonctionnalité de notes et de carnets, et tous les boutons dédiés

Demande d'origine (12/11/2026) :

> Supprime la fonctionnalité de notes et de carnets et tous les boutons dédiés.

## À faire

- Appli Journal :
  - `site/public/journal-donnees.js` : retirer `'notes'` de `FILTRES` (~ligne 114) et tout le code
    `sorte === 'note'` (filtrage ~ligne 120, compteurs ~ligne 132) ;
  - `site/public/journal.js` : supprimer `carteNote()` (~ligne 427), le bouton « Écrire une note (J) »
    (~ligne 429), la hauteur `HAUTEURS_CARTES.note`, les branches `sorte === 'note'` (~lignes 281, 286, 370,
    777, 786) et la touche `K` (~ligne 742, déjà retirée par le prompt 140 si exécuté avant).
- Carnet du joueur (`site/public/mecaniques.js`) : supprimer `ouvrirCarnet()` et toute sa boîte de dialogue
  (titre, aide, zone de saisie, compteur, bouton enregistrer ~lignes 86–140), le raccourci global `J`
  (~ligne 260), `Jeu.carnet` / `Jeu.CARNET_MAX` (`game.js` ~lignes 310, 377, 403) et la ligne « carnet » du
  rapport de fin de journée (`mecaniques.js` ~lignes 268–271).
- Carnet de la semaine (prompt 88) : supprimer les entrées de carnet des tâches — `etat().carnet`
  (`taches.js` ~lignes 213, 390–391), son affichage dans le rapport du soir (`histoire.js` ~lignes 300–303,
  594–602) et `taches-ui.js` ~ligne 421–423 (le résumé des priorités tenues/manquées y reste si affiché
  ailleurs, sinon la ligne part avec).
- **Ne pas supprimer les priorités du jour** (`Taches.prioritesDuJour`, `tache.prioCourt.*`) : elles restent
  dans le bandeau et sont fusionnées avec l'objectif par le prompt 144.
- `site/public/i18n.js` : supprimer en FR et EN toutes les clés mortes : `carnet.*`, `journal.filtre.notes`,
  `journal.noteTitre`, `journal.noteVide`, `journal.ecrireNote`, `rapport.carnet`, etc.
- Aucun bouton, icône, touche ou entrée de menu ne doit plus mener à une note ou un carnet
  (`grep -rn "carnet\|ouvrirCarnet\|ecrireNote" site/public` nettoyé, hors commentaires d'historique).

## Vérifications

- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN) ; partie réelle
  de 2 jours au clavier et à la souris : aucun filtre « Mes notes », aucune carte note, touche J inerte, rapport
  de fin sans ligne carnet.
- Sauvegarde d'une partie commencée avant le prompt : au rechargement, plus rien ne restaure de carnet.
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
