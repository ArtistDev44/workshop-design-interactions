# Prompt 143 — Jeu : jauges sans pourcentage, barre blanche de seuil quand la jauge est un objectif

Demande d'origine (12/11/2026) :

> Pour les indicateurs : tu peux enlever les pourcentages en gardant seulement un indicateur (barre blanche)
> si cet indicateur sert à représenter un objectif (comme garder au min 60% de popularité).

## À faire

- Ne plus afficher la **valeur chiffrée** des jauges à l'écran :
  - bandeau de l'écran de jeu (`site/public/panneau.js`, `dessinerBandeau`) : remplacer
    `t('jaugeTitre.' + cle) + ' ' + Math.round(jauges[cle])` par le libellé seul, sans nombre ;
  - fenêtre flottante « Indicateurs » (`site/public/os.js`, `dessinerIndicateurs`) : supprimer le
    `dsTexte(v + ' / 100', …)` à droite de chaque jauge.
  - L'annonce `aria-live` `indic.annonce` peut garder les valeurs pour les lecteurs d'écran.
- Chaque jauge garde sa **barre** (remplissage coloré sur piste). N'y ajouter une **barre blanche verticale**
  (seuil) que si la jauge sert d'**objectif du jour** : `Jeu.objectifDuJour()` renvoie `{ libelle, jauge, seuil }`
  (ex. réputation ≥ 60) — la barre blanche se dessine à la position `seuil` sur la piste, dans le bandeau comme
  dans la fenêtre Indicateurs (le bandeau a déjà des seuils blancs à 20 et 40 : ne pas les confondre, le seuil
  d'objectif est distinct et libellé en infobulle, ex. « objectif : ≥ 60 »). Une jauge sans objectif du jour
  n'a plus aucun marqueur ajouté.
- Ne pas toucher aux deltas ▲ +4 / ▼ −7 (ce sont des points, pas des pourcentages) ni aux couleurs de barre.
- `bandeau.objectifCourt` : la valeur `({v})` n'est plus affichée (la ligne objectif est fusionnée avec les
  priorités par le prompt 144).

## Vérifications

- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- Captures 1920×1080 du bandeau et de la fenêtre Indicateurs : aucun chiffre de jauge à l'écran ; barre blanche
  de seuil visible uniquement sur la jauge de l'objectif du jour (vérifier avec un jour dont l'objectif porte
  sur la réputation, puis un jour sans objectif).
- Contraste de la barre blanche sur la piste ≥ 4,5:1 ; information doublée par un symbole/libellé, pas par la
  seule couleur.
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
