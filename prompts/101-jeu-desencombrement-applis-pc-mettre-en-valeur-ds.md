# Prompt 101 — Jeu « Nantes en régulation » : désencombrer les applis du PC pour mettre en valeur le design system

Demande d'origine (12/11/2026) :

> J'aime déjà le design system que nous avons, seulement je trouve qu'il y a une surcharge d'info : le design
> system n'est pas mis en valeur lorsque trop d'éléments sont présents.

Constat :
- Les prompts 85 (Community), 86 (Patron), 89 (Journal de bord), 90 (notifications) et 91 (applis reliées)
  ont chacun **ajouté** de l'information : bannière, statistiques, onglets, frise, sparklines, mini-jauges,
  réponses rapides, compteurs, badges.
- Pris un par un, ces ajouts sont justes. Mis ensemble, ils noient le Pixel Design System, dont la force
  tient à peu de choses :
  - un fond `#0D0C0C` profond, sur lequel le rouge `#D4031C` frappe parce qu'il est **rare** ;
  - des titres pixel « Bitsy Pixels » qui ne fonctionnent que s'ils sont **seuls** ;
  - les opacités de blanc, qui ne créent une hiérarchie que s'il y a **de l'espace** entre les niveaux.

Ordre de grandeur actuel, en appels de dessin dans le code :

| Fichier | Textes | Boutons | Badges |
|---|---|---|---|
| `journal.js` | ~65 | 10 | 3 |
| `community.js` | ~37 | 6 | 3 |
| `patron.js` | ~20 | 4 | 1 |

Objectif : **retirer, regrouper, révéler au bon moment**, sans rien ajouter. Le design system ne change
pas : on lui rend de la place.

C'est une **soustraction**, pas une refonte :
- aucune nouvelle couleur, police, composant décoratif ni animation ;
- aucune nouvelle fonctionnalité.

Règles :
- **Ne rien casser.**
  - `game.js`, les règles et les décisions Q1–Q61 ne changent pas.
  - Les données réelles et les clés `i18n.js` existantes ne changent pas.
  - `npm run build` et `npm test` restent verts.
- **Rien n'est supprimé du jeu, seulement déplacé.**
  - Chaque information retirée de la vue d'ouverture reste atteignable en **une action au plus**, au clavier
    comme à la souris (sélection, survol ou focus, « Détails », onglet, raccourci existant).
  - L'annonce `aria-live` (`annoncer`) suit ce déplacement.
- **Pas de doublon avec les prompts déjà exécutés.**
  - Le prompt 98 a traité l'écran Signalements (HUD, gestes directs).
  - Le prompt 93 a traité les textes hors de leur case.
  - Ici, on ne touche à Signalements que pour aligner ses en-têtes et ses marges sur les autres applis.
- Accessibilité :
  - contraste ≥ 4,5:1 (le texte secondaire reste au minimum `DS.blanc50` sur fond) ;
  - ordre de focus logique ;
  - `prefers-reduced-motion` respecté ;
  - pas de flash.
- Inconnu ou non tranché → `"[À COMPLÉTER]"`. Rien n'est inventé.

## 0. Point de départ : lire avant de modifier

1. Lire les fichiers suivants **uniquement dans les fonctions de dessin** :
   - `ds.js` (jetons et composants) ;
   - `os.js` : `dessinerFenetreApp`, `dessinerBarreTaches`, `dessinerIndicateurs`, `badgeIcone` ;
   - `journal.js` : `appJournal`, `barreJours`, `vueJour`, `frise`, `vueSemaine`, `ficheEnquete`, volets ;
   - `community.js` : `dessinerCompteSocial`, `ongletFil`, `carteDePost`, `colonneNantes`, onglets ;
   - `patron.js` : `appPatron`, `carteMessage`, `blocEnrichi`, `miniJauge`, `barreReponses`.
2. Relire les règles déjà posées par les prompts 85, 86, 89, 91 et 98, pour ne pas défaire une décision
   verrouillée. En cas de contradiction avec ce prompt, la noter dans le rapport et **demander** avant
   d'agir.

## 1. Mesurer la densité avant de toucher (outil de développement)

- Ajouter un mode `?audit=densite`, chargé **uniquement** avec ce paramètre, sur le modèle de `?audit=textes`
  du prompt 93. Ce mode réutilise le parcours `&parcours=1` du prompt 93.
- Pendant une frame, il enveloppe `dsTexte`, `dsTitre`, `dsBouton`, `dsBadge`, `rect` et `image`. Pour chaque
  vue d'appli, il compte :
  - les **éléments visibles** : textes, boutons, badges, blocs colorés ;
  - les **boutons primaires** (variante pleine rouge) ;
  - les **tailles de texte distinctes** ;
  - la **surface rouge**, en % de la fenêtre (pixels `#D4031C` / `DS.erreur`) ;
  - les **cadres imbriqués**, c'est-à-dire la profondeur maximale de rectangles bordés.
- Vues à mesurer, en 1920×1080 FR, chacune avec du contenu (milieu de semaine) **et** vide (jour 1) :
  - bureau + barre des tâches ;
  - Patron ;
  - Community : chacun des onglets ;
  - Journal : vue jour, vue semaine et fiche enquête ;
  - Corbeille ;
  - Indicateurs ;
  - Signalements.
- Écrire le rapport dans `jeu/101-densite-avant.json`, résumé en un tableau dans `notes.md`.

## 2. Les règles de mise en valeur (s'appliquent à chaque vue)

1. **Une question par vue.** Chaque vue répond à une seule question du joueur :
   - Patron : « que me demande-t-on ? » ;
   - Journal : « qu'ai-je fait aujourd'hui ? » ;
   - Community : « que disent les usagers ? ».

   Tout ce qui ne sert pas cette question passe derrière une action (§ 3).
2. **Un seul bouton primaire rouge par vue.** Les autres actions passent en contour ou fantôme. Les plus
   rares vont dans un menu `…` ou restent accessibles par leur raccourci existant (J, S, etc.).
3. **Le rouge est rare.** Il est réservé à l'élément le plus urgent de la vue et à l'action primaire.
   - Les compteurs, puces, séparateurs et pictos décoratifs passent en blanc (75/50/15).
   - Cible : surface rouge ≤ 3 % de la fenêtre, hors alerte réelle.
4. **Trois niveaux de texte, pas plus.**
   - Titre de vue en `dsTitre`, **un seul par vue**.
   - Texte courant en blanc.
   - Texte secondaire en `blanc50`.

   Les métadonnées (heure, source, identifiant, statistiques) sont du texte secondaire et ne s'affichent
   en entier que sur l'élément **sélectionné**.
5. **L'espace remplace les cadres.**
   - Marge intérieure de fenêtre `DS.esp.xxl` (24 px), 16 px entre blocs, 8 px dans un bloc.
   - Au plus **deux niveaux** de cadres imbriqués.
   - Séparateurs en `blanc15` d'1 px, ou rien.
6. **Les badges sont rares.**
   - Au plus 3 badges visibles par vue, et seulement pour ce qui demande une action.
   - Un compteur à 0 ne s'affiche pas.
   - Sur la barre des tâches, une icône ne porte un badge que si l'appli contient quelque chose **à
     faire** (pas seulement « du nouveau »).
7. **Une décoration n'existe que si elle remplace du texte.**
   - Une sparkline, une mini-jauge ou un picto qui **double** une information écrite à côté : on garde l'un
     ou l'autre, pas les deux.
   - Un picto qui remplace un mot (et a son texte alternatif) : on le garde.

## 3. Révéler au bon moment (divulgation progressive)

- **À l'ouverture**, chaque vue montre l'essentiel :
  - le titre ;
  - la liste des éléments, réduits à **une ligne** (titre + une information secondaire) ;
  - l'action primaire.
- **Sur sélection** (clic, Entrée, flèches), l'élément s'ouvre et affiche ses détails, ses métadonnées
  et ses actions secondaires. Un seul élément est ouvert à la fois.
- **Sur survol ou focus**, les actions de ligne (répondre, transmettre, enquêter) apparaissent. Elles sont
  toujours atteignables au clavier par Tab, et toujours visibles en mode tactile ou mobile, où le survol
  n'existe pas.
- **Les vues vides** affichent une phrase en `blanc50` et rien d'autre : pas de cadres vides, pas de
  compteurs à 0.

## 4. Application par appli

Les propositions ci-dessous sont à **vérifier contre la mesure du § 1** avant d'être appliquées : on ne
retire que ce qui pèse.

### Journal de bord (appli la plus chargée)
- **Vue jour :**
  - la frise du jour est l'élément principal ;
  - les tuiles de synthèse et les sparklines se réduisent à **une** ligne de chiffres en tête ;
  - le détail s'affiche au clic sur une tuile.
- **Filtres :** remplacer la rangée de boutons à compteurs par un seul sélecteur. Le compteur ne s'affiche
  que sur le filtre actif.
- **Actions secondaires :** « Copier le résumé », « Écrire une note (J) » et « Voir Community » passent
  dans un menu `…`. Le raccourci J est conservé.
- **Fiche enquête :** les volets restent un à la fois (déjà le cas, à vérifier). Les numéros de volet
  passent en `blanc50`.

### Community
- **En-tête du compte :**
  - bannière plus basse ;
  - avatar et nom conservés ;
  - les statistiques (abonnés, etc.) ne s'affichent que dans l'onglet Stats.
- **Commentaires :** chaque post n'affiche que le **premier commentaire**, puis « Voir les N autres ».
- **Colonne Nantes :** la masquer par défaut sous [À COMPLÉTER : largeur choisie par le groupe], ou la
  déplacer dans un onglet. Décision de groupe (§ 6).
- **Brouillon :** visible seulement quand un brouillon existe.

### Patron
- **Réponses rapides :** la barre ne s'affiche que sous le **dernier message auquel on peut répondre**,
  pas sous chaque message.
- **Mini-jauge :** seulement si le message parle d'une jauge précise. Sinon, la retirer.
- **Bloc enrichi :** replié en une ligne (« Dossier lié : … »), déplié au clic.
- **Séparateurs de jour :** texte `blanc50` seul, sans trait ni fond.

### Bureau, barre des tâches, Indicateurs, Corbeille
- **Badges d'icônes :** appliquer la règle 6.
- **Panneau Indicateurs :** replié par défaut sur les trois jauges, sans légende ; la légende et les
  seuils s'affichent au survol ou au focus. Décision de groupe (§ 6) avant de changer l'état par défaut.
- **Corbeille :** si elle est vide, état vide simple (§ 3).

### Signalements
- **Alignement seulement :** marges de fenêtre, en-tête et titre de vue identiques aux autres applis.
  Rien d'autre (couvert par 87 et 98).

## 5. Garde-fous

- **Mesurer après.** Relancer `?audit=densite&parcours=1`, écrire `jeu/101-densite-apres.json` et, dans
  `notes.md`, un tableau avant / après par vue.
- **Cibles par vue d'ouverture :**
  - éléments visibles : −30 % au moins, sauf vue déjà sobre (la justifier) ;
  - boutons primaires : 1 au plus ;
  - tailles de texte : 3 au plus ;
  - surface rouge : ≤ 3 % hors alerte ;
  - cadres imbriqués : 2 au plus.
- **Textes du prompt 93 :** relancer `?audit=textes&parcours=1`, qui doit rester à 0 défaut A–D.
- **Information conservée :** pour chaque élément retiré de l'ouverture, une ligne dans `notes.md` qui
  dit où il se trouve maintenant, et en combien d'actions (≤ 1).
- **Clavier :**
  - parcourir chaque appli au clavier seul (Tab, flèches, Entrée, Échap) ;
  - chaque détail se révèle au focus comme au survol.
- **Mobile :** vérifier à 412 px en portrait. Les actions révélées au survol y sont visibles en
  permanence.
- **Langues :** vérifier en FR et en EN. Un libellé raccourci ne l'est que dans `i18n.js`, sens conservé.
- **Tests :** `npm run build` et `npm test` restent verts.

## 6. Décisions à trancher en groupe avant exécution

| # | Question | Choix |
|---|---|---|
| D1 | À quoi le rouge est-il réservé : l'action primaire seule, ou aussi l'élément le plus urgent ? | [À COMPLÉTER] |
| D2 | Le panneau Indicateurs est-il replié par défaut ? | [À COMPLÉTER] |
| D3 | La colonne Nantes de Community : masquée sous quelle largeur, ou déplacée dans un onglet ? | [À COMPLÉTER] |
| D4 | Les actions secondaires du Journal : menu `…`, ou seulement des raccourcis visibles en `blanc50` ? | [À COMPLÉTER] |

Tant qu'une décision n'est pas prise, appliquer **le choix le plus conservateur** (ne pas changer l'état par
défaut) et le noter dans le rapport.

## 7. Livrables

- **Code :**
  - les fichiers d'appli modifiés ;
  - `ds.js`, seulement si une règle commune mérite une aide partagée (par exemple marges de vue, ligne de
    liste repliée ou dépliée, état vide), sans nouveau style.
- **Mesures :** `jeu/101-densite-avant.json` et `jeu/101-densite-apres.json`.
- **Rapport :** dans `notes.md` :
  - le tableau avant / après ;
  - la liste des éléments déplacés et leur nouvel emplacement ;
  - les décisions D1 à D4.
- **Index :**
  - `prompts/README.md` : statut mis à jour ;
  - `journal.md` : une ligne en tête du tableau.
