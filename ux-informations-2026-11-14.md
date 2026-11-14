# Revue UX : redondances d'information sur ordinateur (14/11/2026)

**Méthode** : skill `ux-questionner-informations`, centré sur la question 5 (redondance) et la question 6 (hiérarchie).
**Périmètre** : `main` à `24678fd` (après le prompt 209). Build servi localement, Chromium sans interface en
1920 × 1080 et 1366 × 768, semaine du 14/09/2026, 10 h. Écrans vus : bureau, poste (carte), fiche dossier, Mails,
Community, Journal, Données. Le retour de décision, le soir et les bilans n'ont pas été recapturés : ils sont traités
dans la revue du 12/11 (`ux-informations-2026-11-12.md`, volet D).
**Objectif** : une interface plus épurée sur ordinateur. La revue ne modifie pas le code. Les corrections sont faites
au prompt 211 (`prompts/211-jeu-epurer-ordinateur.md`, rapport `jeu/211-epurer-ordinateur.md`).

Une redondance est **voulue** quand elle double une couleur par un texte ou un symbole (accessibilité). Dans ce cas,
on la garde. Les autres coûtent de l'attention sans rien rendre (**P2**). Quand elles se contredisent, elles trompent
le joueur (**P1**).

---

## 1. Synthèse : huit constats

1. **P1 · Trois compteurs de dossiers, trois périmètres, aucun libellé qui les distingue.** En même temps à l'écran :
   « DOSSIER 1 / 16 » (en-tête de la fiche, total de la semaine), « Signalements · 1 · actifs 1/3 » (carte), le mail
   « 5 dossiers attendus aujourd'hui » et le Journal « Signalements 0/1 ». Données dit « 4 dossiers issus des archives ».
   Le joueur ne sait pas lequel compte. → **Fusionner** : un seul compteur du jour sur la carte (« 1 en cours · 4 à
   venir »). **Supprimer** « / 16 » de l'en-tête de la fiche.

2. **P2 · L'objectif du jour est dit quatre fois, les priorités trois fois.** Pour l'objectif : un repère sur la
   jauge (`dessinerSeuilObjectif`, prompt 143), le texte du bandeau « Objectif : fluidité ≥ 40 ✓ » (prompt 144), la
   carte « Objectif du jour » du Journal et le mail « Consigne ». Pour les priorités : le bandeau « budget ≥ 40 · zéro
   non traité », le mail, et les repères fixes 20 / 40 dessinés sur **chaque** jauge (`panneau.js:66`). Résultat :
   trois traits blancs par jauge de 88 px, qu'on ne distingue plus. → **Alléger** : garder le repère d'objectif seul
   sur sa jauge et retirer les repères fixes 20 / 40, déjà portés par la couleur et doublés par le texte au survol.
   Le bandeau ne garderait que ce qui n'est pas lisible sur une jauge : « zéro non traité ». Le texte complet passe
   au survol.

3. **P2 · La date et l'heure sont dites trois fois au bureau.** Une horloge murale à aiguilles, l'heure numérique
   « 10:01 » sous cette horloge, puis le coin du poste « lun. 14 sept. ▶ 10:03 ». → **À trancher** : l'horloge à
   aiguilles appartient au décor (œuvre). Le chiffre en dessous est une béquille de lisibilité. On peut retirer le
   chiffre, ou le garder pour l'accessibilité.

4. **P2 · La colonne Équipes double chaque information.** Pour chaque équipe, on lit : le pictogramme et le nom, la
   base tronquée (« Commissariat central… », « Semitan (exploitant d… »), N cases qui portent chacune le pictogramme,
   puis « 3/3 libres · coût 10 ». Les cases pleines ou vides disent déjà combien d'équipes sont libres, et la base est
   déjà sur la carte, sous forme d'épingle. La consigne « Glissez une équipe… » reste affichée en permanence, même
   après des dizaines d'envois. → **Supprimer** la ligne de base (au survol de l'épingle). **Fusionner**
   « 3/3 libres » dans les cases et garder « coût 10 » sur la ligne du nom. **Différer** la consigne : la montrer
   seulement tant qu'aucune équipe n'a été envoyée, puis au survol. Gain : environ 40 % de la hauteur de la colonne.

5. **P2 · La fiche dossier répète l'événement et le type.** « ÉVÉNEMENT » (en-tête), « Affluence supposée · Gravité
   moyenne » (titre), « Ateliers parents-enfants » dans le message, puis dans la ligne « Événement à l'agenda :
   Ateliers parents-enfants (Les Cabanes d… », coupée **avant** « Le jeu suppose de l'affluence », puis dans la
   réplique 3. → **Supprimer** le type de l'en-tête (le titre le dit). **Garder** la ligne d'agenda : c'est la
   **source** et l'hypothèse du jeu. Mais l'écrire sur deux lignes pour que la mention de l'hypothèse soit lisible.
   *Correction* : le tampon « SIGNALEMENT » s'efface après 2 s (prompt 204). La capture l'avait pris pendant
   l'animation.

6. **P2 · Les tendances des répliques répètent trois fois les noms des jauges.** « Fluidité ≈ Réputation ▲
   Budget ▼ » apparaît sous chaque réplique : 9 libellés pour 3 colonnes. → **Reformuler** : un en-tête de colonnes
   unique sous « Vos réponses » (Fluidité · Réputation · Budget) et des flèches alignées dessous. Pour le lecteur
   d'écran, l'annonce garde les noms. Point à vérifier en anglais (largeurs).

7. **P2 · Plusieurs signaux d'appel pour le même incident.** Au bureau : la pastille « 3 » sur l'écran, la pastille du
   téléphone et la consigne « Incident en cours : cliquez sur l'écran du PC (Entrée) » en bas. Au poste : la pastille
   « ! » sur Carte, « 2 » sur Mails et « 1 » sur Community. Dans Mails, la boîte de réception affiche une pastille
   rouge « 1 » **et** le total « 2 ». → **Garder** les pastilles des applis (elles servent la navigation).
   **Alléger** la consigne du bureau : la montrer seulement si le joueur n'a pas cliqué sur le PC depuis 10 s.
   Dans Mails, garder un seul chiffre (les non lus).

8. **P3 · Des étiquettes qui ne servent aucune décision sur ordinateur.** Elles restent affichées en permanence et
   coûtent un peu d'attention chacune :
   - « Zoom ×1,0 » à côté des boutons + / − / ⌖ ;
   - « Somnolence 0 % · Z : repos » alors qu'il n'y a pas de somnolence ;
   - « en ligne » à côté du titre Mails ;
   - dans Community, le titre « Comptes cités » au-dessus d'une liste vide, et « Ce qui se passe à Nantes », qui répète
     la carte et la météo ;
   - dans Données, « archive du 14/09/2026 au 20/09/2026 » répété dans trois cartes en plus de l'intro (« semaine
     passée : données archivées »), et « Ouvrir l'API ↗ › » avec deux flèches.

   Sur la hiérarchie : « Quitter le PC (Échap) » est un grand bouton **rouge primaire**, l'élément le plus saillant de
   l'écran, pour une action secondaire. → **Alléger** (bouton fantôme ou neutre).

---

## 2. Tableaux par écran

### Bureau
| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Horloge à aiguilles | mur droit (`bureau.js`) | interface / décor | ambiance, heure | redite de l'heure numérique et du poste | Garder (œuvre) | — |
| Heure numérique « 10:01 » | sous l'horloge | jeu | lire l'heure | 3e affichage de l'heure | À trancher | P2 |
| Pastille « 3 » sur l'écran | écran du PC | jeu | appel vers le poste | doublée par la consigne du bas | Garder | — |
| « Incident en cours : cliquez sur l'écran… » | bas, `bureau.incident` (`bureau.js:963`) | interface | apprendre l'entrée au poste | utile la 1re fois, du bruit ensuite | Différer (après 10 s sans action) | P2 |

### Poste : bandeau et cadre
| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Repères 20 / 40 sur chaque jauge | `panneau.js:66` | jeu | seuils critiques | la couleur (rouge < 20, orange < 40) les porte déjà ; 3 traits sur 88 px | Supprimer | P2 |
| Repère d'objectif sur la jauge | `dessinerSeuilObjectif`, prompt 143 | jeu | viser l'objectif | se confond avec les repères fixes | Garder (seul repère) | — |
| « Priorités : budget ≥ 40 · zéro non traité » | `bandeau.priorites` | jeu | contraintes du jour | « budget ≥ 40 » est un seuil de jauge | Alléger (texte au survol, garder « zéro non traité ») | P2 |
| « Objectif : fluidité ≥ 40 ✓ » | `bandeau.objectifCourt` | jeu | objectif atteint ou non | doublé par le repère et le Journal ; ✓ / ✗ utile | Fusionner : ✓ / ✗ à côté de la jauge visée | P2 |
| « lun. 14 sept. ▶ 10:03 » | `dessinerDateCoin` | jeu | temps qui passe | seul affichage au poste (prompt 144) | Garder | — |
| « Somnolence 0 % · Z : repos » | `dessinerSomnolence` (`sketch.js:306`), prompt 78 | jeu | se reposer | inutile à 0 % | Différer (au-delà d'un seuil, ex. 30 %) | P3 |
| « Quitter le PC (Échap) » rouge | `bureau.js:998` | interface | sortir | poids visuel maximal pour une action secondaire | Alléger | P3 |

### Poste : carte et équipes
| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| « Signalements · 1 · actifs 1/3 » | `carte-alertes.js:277` | jeu | charge en cours | 3e compteur, périmètre différent | Fusionner (constat 1) | P1 |
| « Zoom ×1,0 » | `carte.niveauZoom` (`carte-alertes.js:371`) | interface | — | aucune décision | Supprimer | P3 |
| Base de l'équipe (tronquée) | colonne Équipes | source (lieux) | savoir d'où part l'équipe | déjà sur la carte (épingle) ; tronquée | Déplacer (au survol de l'épingle) | P2 |
| Cases d'équipes + « 3/3 libres » | `carte-alertes.js:590-613` | jeu | disponibilité | la même information deux fois | Fusionner (cases seules + coût à côté du nom) | P2 |
| « Glissez une équipe… » (permanent) | `equipes.glisser` (`carte-alertes.js:619`) | interface | apprendre le geste | permanent après apprentissage | Différer | P2 |
| Infobulle du signalement | `carte-alertes.js:288`, prompt 133 | source + jeu | identifier le point | au survol seulement : correct | Garder | — |

### Fiche dossier
| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| « DOSSIER 1 / 16 · ÉVÉNEMENT » | `dossier.entete` (`sketch.js:658`) | jeu | progression | « 16 » = semaine, alors que le reste de l'écran compte le jour ; type redit en dessous | Reformuler : « Dossier 1 » ou rien | P1 |
| Tampon « SIGNALEMENT » | `sketch.js:696`, prompts 53 et 204 | interface | animation d'arrivée | s'efface après 2,1 s (vérifié) | Garder | — |
| « Affluence supposée · Gravité moyenne » | titre | hypothèse du jeu (prompt 134) | priorité | — | Garder | — |
| « Événement à l'agenda : Ateliers… (Les Cabanes d… » | `phraseSituation` (`panneau.js:344`) | **source** | vérité de la source | coupée avant « Le jeu suppose de l'affluence » | Reformuler (deux lignes) | P1 |
| Noms de jauges sous chaque réplique | `dessinerTendanceReponse` (`panneau.js:282`) | jeu | comparer les effets | 9 libellés pour 3 colonnes | Reformuler (en-tête de colonnes) | P2 |
| « @pseudo » au début de la réplique 1 | réplique | fiction | ton | redite du message, allonge la ligne | Garder (sens de la réplique) | — |

### Mails
| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Pastille « 1 » + total « 2 » | boîte de réception | jeu | non lus | deux chiffres côte à côte | Fusionner (non lus seuls) | P3 |
| Compteurs à 0 des catégories | liste des catégories | jeu | — | cinq « 0 » | Alléger (masquer les 0) | P3 |
| « en ligne » | en-tête | fiction | — | aucune décision | Supprimer | P3 |
| Consigne : objectif, budget, priorités | corps du mail | jeu | briefing | redit le bandeau ; « Journée ordinaire : rien d'annoncé » contredit « 1 alerte météo, 3 événements » | Garder le briefing, reformuler la contradiction | P1 |

### Community
| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| « Ce qui se passe à Nantes » (affluence, météo) | colonne droite | jeu + source | contexte | redit la carte et Données | Alléger ou supprimer | P3 |
| « Comptes cités » vide | colonne droite | — | — | titre sans contenu | Masquer si vide | P3 |
| « compte de service · @regul.nte · réseau Quai (fictif) » | en-tête | fiction assumée | dire la fiction | « (fictif) » nécessaire | Garder | — |

### Journal
| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Carte « Objectif du jour » | Journal | jeu | bilan | 4e affichage de l'objectif ; « en cours » en bleu | Garder (c'est le lieu du bilan), alléger | P3 |
| « Signalements 0/1 · dont 0 non traité » | Journal | jeu | bilan | compteur différent de la carte | Fusionner (constat 1) | P1 |
| Filtres « (0) » + « Rien à signaler » | Journal | jeu | — | quatre filtres vides au-dessus d'un état vide | Masquer les filtres tant que tout vaut 0 | P3 |

### Données
| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| « archive du 14/09 au 20/09/2026 » ×3 + intro | cartes | **source** | état de la donnée | utile quand les états diffèrent (une carte est « en direct ») | Garder l'état ; la date une fois dans l'intro | P3 |
| « Ouvrir l'API ↗ › » | cartes | interface | vérifier la source | deux flèches | Reformuler (« ↗ » seul) | P3 |

---

## 3. Information manquante

- Aucune nouvelle information à ajouter pour cet objectif. Retirer les redites libère la place pour la ligne de
  contexte demandée par la revue du 12/11 (constat 3 : météo et pointe avant la décision).

## 4. À trancher par le groupe

1. L'heure numérique sous l'horloge murale : on la retire (décor pur) ou on la garde (lisibilité) ?
2. Le bandeau : « Priorités · Objectif » reste écrit en entier, ou devient un ✓ / ✗ près des jauges avec le texte au
   survol ? Le visiteur d'exposition (`?expo=1`) a peut-être besoin de la version écrite.
3. La consigne « Glissez une équipe… » : on la masque après le premier envoi, ou seulement après le jour 1 ?

## 5. Suite

Prompt 211 (le 210 était déjà pris par une autre session) : constats 2 (repères fixes), 4, 5, 6 et 7, et les P3 sauf
les filtres du Journal. Le constat 1 est traité en partie : l'en-tête de la fiche compte maintenant le jour. Les
trois points « à trancher » n'ont pas été modifiés. Le détail est dans `jeu/211-epurer-ordinateur.md`.
