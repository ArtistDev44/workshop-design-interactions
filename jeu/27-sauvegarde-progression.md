# 27 — Sauvegarde de la progression, import / export (prompt 33)

Décisions verrouillées. Une partie peut être quittée puis reprise exactement là où elle s'était arrêtée. On peut aussi exporter sa progression et l'importer en JSON. Les décisions Q1–Q61 et la boucle de jeu ne changent pas : le même état, avec la même graine et le même nombre de tirages, donne les mêmes dés.

Note de numérotation : le prompt demandait `jeu/16-sauvegarde-progression.md`, mais le n° 16 est déjà pris (apps du PC). Ce fichier prend donc le n° 27. Note de branche : le nom demandé, `jeu/prompt-33-sauvegarde-progression`, est bien celui utilisé.

## Fichiers
- `site/public/sauvegarde.js` (nouveau), chargé après `i18n.js` et avant `game.js`. Il gère :
  - le stockage ;
  - l'encodage des textes différés ;
  - la validation ;
  - la reprise ;
  - l'export et l'import ;
  - la boîte d'import HTML et les toasts.
- `game.js` expose deux fonctions. La logique de restauration reste donc dans `game.js`, et `sauvegarde.js` ne touche pas directement à l'état interne :
  - `Jeu.instantane(maintenant)`, en lecture seule ;
  - `Jeu.restaurerInstantane(s, maintenant)`.
- Générateur de dés : `Jeu.initialiserAlea(graine, tirages)` compte les tirages (`Jeu.tirages`). Une reprise recrée `mulberry32(graine)` puis l'avance du même nombre de tirages.

## Modèle (clé `pxe-nte001-partie-<semaine>`, une par semaine)
```js
{
  version: 1,
  sauvegardeLe: "2026-11-10T15:47:00.000Z",
  semaine: "2026-09-14",          // lundi de la semaine, "fallback" ou "direct"
  etat: {
    dossierIndex, decisions, jauges, evenementsJournee, graine, modeHorsLigne,
    parametres: { son, contraste, reduireAnimations, tailleTexte },
    interface: { phase, ecoule },  // compte à rebours : temps déjà écoulé, recalculé à la reprise
    complet: { paquet, jours, jourIndex, horloge, tirages, messagesPatron, commentaires, plaintes,
               equipes, nonLus, alertesJauges, malus, objectifsResultats, modificateur, paliersBudget, terminee, … }
  }
}
```
- Les textes différés (`Texte`, `ListeTextes`) sont encodés en `{ __t: clé, v: variables }` ou `{ __l: [...] }`. Ils sont donc retraduits dans la langue active après une reprise (vérifié : un message du patron sauvegardé en FR s'affiche en EN).
- Les horodatages en `millis()` (modificateur de journée, équipes en route) sont stockés en durées relatives et recalés à la reprise.
- Les plaintes (prompt 28) sont stockées par `id`, puis reliées à `messages.json`. Une plainte supprimée du JSON entre-temps est ignorée.
- Aucune donnée personnelle, aucun secret. Les autres clés (`pxe-nte001:jeu:reglages`, `pxe-nte001:jeu:meilleurs-bilans`, `pxe-nte001-langue`, `pxe-nte001:jeu:lampe`) ne sont jamais écrites par ce module.

## Sauvegarde automatique (`Sauvegarde.auto()`)
- Elle se déclenche :
  - après chaque décision ;
  - à la pause (P), avec annonce ;
  - en fin de journée (mail), avec annonce ;
  - au passage au jour suivant ;
  - sur `beforeunload` et `visibilitychange` (onglet masqué).
- Après une décision, il n'y a pas d'annonce, pour ne pas couvrir l'annonce de la décision elle-même.
- Partie terminée (écran de fin) : la sauvegarde de la semaine est effacée. Le meilleur bilan reste, stocké à part.
- Indicateur discret « Partie sauvegardée à hh:mm », en bas à droite de l'écran du jeu.
- R (recommencer, avec confirmation) efface la sauvegarde de la semaine.

## Reprise
- À l'accueil, le bouton « Continuer la partie (C) » n'apparaît que si une sauvegarde valide existe. Il reprend la plus récente et affiche la semaine, le dossier n/total et l'heure de sauvegarde.
- Sur chaque semaine sauvegardée, un badge « sauvegardée · dossier n/total ». « Jouer » ouvre alors la fenêtre « Une partie est sauvegardée » : Reprendre (Entrée), Nouvelle partie (N, qui écrase la sauvegarde) ou Annuler (Échap).
- Sont restaurés :
  - la semaine, le dossier, les décisions, les jauges, le journal, les messages du patron et les commentaires ;
  - les plaintes, les équipes, les malus, les objectifs, le modificateur ;
  - l'horloge simulée, la graine et le nombre de tirages ;
  - le mode hors ligne et les paramètres (son, contraste, animations).
- Phase à la reprise :
  - si la sauvegarde a eu lieu en plein compte à rebours (décision, contradiction, conflit), la partie reprend dans cette phase, avec le temps déjà écoulé ;
  - narration ou pause → attente du prochain incident (la décision est déjà prise) ;
  - mail → mail.

## Import / export (Paramètres → Progression)
- Exporter (5) : la sauvegarde de la semaine en cours (sauvée juste avant), sinon la plus récente.
  - Fichier JSON téléchargé via un Blob local : `pxe-nte001-progression-<semaine>-<AAAAMMJJ-HHMM>.json`.
  - Le fichier contient en plus `jeu` et `exporteLe`.
- Copier (6) : `navigator.clipboard`, avec repli sur un textarea et `execCommand('copy')`.
- Importer (7) : boîte de dialogue HTML (`role="dialog"`, `aria-modal`, focus piégé, Échap pour fermer, focus rendu à l'origine). Elle propose :
  - un fichier `.json` (`<label>` utilisable au clavier avec Entrée ou Espace) ;
  - une zone de texte pour coller le JSON.
- Validation stricte avant toute écriture :
  - `JSON.parse` dans un `try/catch`, jamais d'`eval` ;
  - `version === 1` ;
  - semaine connue (`data/semaines.js`, `fallback` ou `direct`) ;
  - `dossierIndex` entier ≥ 0 ;
  - jauges numériques entre 0 et 100 ;
  - `graine` numérique ;
  - cohérence de `complet` : paquet, jours, index et nombre de tirages.
- En cas d'échec : toast « Fichier de progression invalide : rien n'a été modifié. », sans exception.
- En cas de succès : écriture dans la clé de la semaine, toast, puis bouton « Reprendre cette partie maintenant ».
- Pendant que la boîte est ouverte, le clavier et la souris du canevas sont ignorés : taper « L » dans le champ ne change pas la langue.
- Toasts : `role="status"`, annoncés, sans animation, texte blanc sur `#1c2733` (contraste > 14:1).
- Hors ligne : `localStorage`, Blob et presse-papiers seulement, aucun réseau.
- Stockage indisponible : un toast unique « Sauvegarde impossible sur cet appareil… », et le jeu reste jouable.

## Vérifications
- `npm run build` OK.
- Test automatisé (Chromium), sans erreur console :
  - 3 dossiers tranchés, sauvegarde, rechargement, C → index, jauges, nombre de tirages, graine, historique, journal, plaintes, commentaires, messages du patron et jour identiques (seule l'horloge a avancé pendant le test) ;
  - reprise en plein compte à rebours → phase `decision` conservée, temps écoulé 3,3 s repris ;
  - export : fichier `pxe-nte001-progression-2026-09-14-…json` (26 ko) ;
  - imports invalides (JSON cassé, version 2, semaine inconnue, budget 120, index −1) → refusés, clé inchangée ;
  - après effacement du stockage, import du texte collé dans la boîte puis « Reprendre » → état identique ;
  - R → sauvegarde effacée, langue et meilleurs bilans conservés.
