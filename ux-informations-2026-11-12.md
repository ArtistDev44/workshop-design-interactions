# Revue UX — chaque information du jeu questionnée (12/11/2026)

**Méthode** : skill de projet `ux-questionner-informations` (`.claude/skills/ux-questionner-informations/SKILL.md`),
installé pour cette revue. Chaque information affichée (texte, chiffre, badge, couleur signifiante, icône, infobulle,
notification, annonce au lecteur d'écran) est inventoriée avec son fichier et sa clé i18n, puis passée aux 8 questions
(décision servie, public, moment, vérité de la source, redondance, hiérarchie, forme, absence), et reçoit un verdict et
une priorité : **P1** gêne la décision ou trompe sur la source · **P2** coûte de l'attention sans rien rendre ·
**P3** finition.

**Périmètre** : le jeu tel qu'il est sur `main` le 12/11 (après le prompt 136), build servi localement et parcouru
avec Chromium sans interface (1920 × 1080, semaine du 14/09/2026, mode normal et `?expo=1`), plus lecture du code.
Quatre volets, détaillés en annexe avec un tableau par écran :

| Volet | Écrans | Informations questionnées | P1 | P2 | P3 |
|---|---|---|---|---|---|
| [A — Entrée et cadre](ux-informations-2026-11-12/volet-A.md) | chargement, menu, partage, crédits, paramètres, palmarès, nouvelle partie, autorisations, intro, guide, aide, tutoriel, mode exposition, filet d'erreur | 79 | 10 | 26 | 43 |
| [B — Cœur de la décision](ux-informations-2026-11-12/volet-B.md) | bandeau, menu de l'appli, carte des alertes, équipes, dossier, volet PLUS, retour de décision, annonces, rythme | 67 | 11 | 33 | 23 |
| [C — Bureau et applis](ux-informations-2026-11-12/volet-C.md) | pièce, fenêtre, OS, Community, Patron, tâches, téléphone, café, sieste, webcam, micro | 61 | 8 | 23 | 30 |
| [D — Temps et bilans](ux-informations-2026-11-12/volet-D.md) | transition de journée, horloge, fil, blâme, statut patron, rapport du soir, récapitulatif, mail, nuit, journal, fin de semaine, rapports, fins, licenciement, sauvegarde | 105 | 12 | 49 | 44 |
| **Total** | | **≈ 310** | **41** | **131** | **140** |

Environ la moitié des informations sont **gardées** telles quelles ; un tiers est à **reformuler** ; le reste à
ajouter, alléger, déplacer, fusionner, différer ou supprimer, et 25 choix sont laissés **à trancher** par le groupe.

Aucune modification du code dans cette revue. Les constats marqués ✔ ont été revérifiés dans le code pour la synthèse.

---

## 1. Synthèse — dix constats transverses

### P1 — gênent la décision ou trompent sur la source

1. **Des textes décrivent un autre jeu que celui qui tourne.** Le modèle a changé (prompt 87 : plus de chrono par
   défaut, rien n'expire ; prompt 108 : équipes dès la semaine 1 ; prompt 117 : trois répliques), les textes non :
   - « Dernière semaine, et la plus dure : 15 secondes par dossier » ✔ (`histoire.c3.0`) ;
   - « Nouveauté : vous pouvez envoyer des équipes » en semaine 2 ✔ (`histoire.c2.0`) ;
   - « quatre répliques », « 1 à 4 » ✔ (`poste.geste.repondre`, issu du prompt 131) et l'annonce au lecteur d'écran
     de la même fenêtre qui liste encore Dévier / Retenir / Renfort / Ne rien faire (`immersion.js:1159`) ;
   - aide de la sieste « ceux qui expirent sont perdus » (`sieste.js:154`), alors que rien n'expire hors défi chrono ;
   - difficulté « retards ×0,5 » sans effet sur les archives (pas de minutes de retard).
   → **Reformuler**, et étendre le contrôle de `test-jeu.mjs` (fait au prompt 131 pour `sms.*`) à `histoire.c*`,
   `mp.mode.*`, `mp.difficulte`, `poste.*`, `sieste.*`, `credits.*`, `fin.*`.

2. **« Réel », « rien n'est inventé » : la frontière réel / hypothèse / fiction cède dans les voix.**
   Les cartes de source sont exemplaires ; dès qu'un personnage ou un bilan parle, elle se perd :
   - Crédits « Données : réelles, rien n'est inventé » ✔ et écran de fin « Aucun événement inventé » ✔, malgré
     l'incident fictif hebdomadaire (prompt 119) ;
   - l'incident fictif perd son étiquette « Fictif » dans Community, le téléphone, le mail du soir, le carnet, le
     rapport, le game over, et il est compté dans « n signalement(s) réel(s) » (`immersion.js:172`) ;
   - l'affluence d'un événement est affirmée (« X attire du monde », « Affluence signalée », « L'affluence est attendue
     vers 13h00 », plaintes « trams bondés ») alors que la grammaire la donne pour une hypothèse du jeu (prompt 134) —
     11 dossiers sur 16 de la semaine testée sont des événements d'agenda quelconques (atelier, pause-café) ;
   - deux définitions de l'affluence coexistent (`scoreAffluence` et `MOTIF_AFFLUENCE`) : un dossier « Affluence
     signalée » et une carte Agenda « Aucun événement grand public » le même jour.
   → **Ajouter** « Fictif » et « affluence supposée » partout où ces faits sont dits (le modèle existe :
   `fictif.badge`, `chaine.source`) ; **réserver le mot « réel » aux données de la source.**

3. **Le contexte de la décision arrive après la décision.** Depuis la refonte du prompt 107, les puces d'importance et
   les savoirs sont du code mort (`pucesImportance`, `panneau.js:112`). La météo du jour, la pointe et la jauge en manque,
   qui font varier les tendances, n'apparaissent qu'au retour. Pire : le moteur calcule la pointe sur l'heure de la
   **source** (`d.heure`), l'écran montre l'heure **de la partie** ; et la narration affiche « Contexte : … (effet
   renforcé) » alors que ce renforcement n'est pas appliqué aux réponses par catégorie.
   → **Ajouter** une ligne de contexte sous la situation, calculée sur ce que le joueur voit ; **reformuler** ou
   supprimer « (effet renforcé) ».

4. **Gravité, retour et ton se contredisent.** La gravité ne dépend que du type (événement = moyenne, perturbation
   réelle = faible, alerte météo = élevée) ; le retour peut dire « Bon choix, parce que la situation est calme » après
   une agression ; le ton « Rien d'alarmant » sur une alerte élevée. Le joueur ne peut pas apprendre une règle qui se
   contredit d'un panneau à l'autre. → **À trancher** : renommer (« priorité de jeu ») ou calculer sur la situation.

5. **Le choix entre trois répliques n'en est parfois que deux, et il n'est pas accessible.** Quand la meilleure
   réponse est « attendre », la réplique clash est son jumeau (2 dossiers sur 5 joués). Le lecteur d'écran n'entend ni
   les répliques ni leurs tendances. → **Reformuler** le tirage du clash ; **ajouter** les annonces.

6. **La chaîne source → œuvre se casse à la fin de la semaine.** `finDeSemaine` pose toujours le rapport papier : l'écran
   `dessinerFin` (`sketch.js:837`), le seul qui cite le pire retard réel, les types de dossiers et les sources, est
   inatteignable ✔ (`sketch.js:486`). La page 2 du rapport, titrée « Chiffres réels de la semaine », affiche Dévier /
   Retenir / Renfort / Rien = 0 : `statsSemaine` compte encore avec les anciennes clés d'action ✔ (`game.js:2140`).
   → **Déplacer** pire retard, faits et sources dans le rapport ; **corriger** le comptage et le titre.

7. **Le mode exposition ne tient pas sa promesse à l'écran.** Le visiteur arrive au bureau, pas devant la carte :
   `expoAuPoste()` règle `vue = 'poste'` mais laisse le menu ouvert, et `fermerMenuPrincipal()` remet `vue = 'bureau'`
   à l'image suivante ✔ (`sketch.js:171`, `menu.js:48`). Défaut du prompt 132, correction d'une ligne. S'y ajoutent :
   « Partie en pause » qui laisse filer l'horloge (10:02 → 10:10 mesuré), et les liens Livrables / Dépôt / Partager /
   Présentation qui ouvrent un onglet sur le poste d'exposition.

8. **Trop de couches d'objectifs pour un visiteur de trois minutes.** À 10:05 en exposition, s'affichent ensemble :
   défis de la semaine, priorités du jour, objectif du jour, consigne, cellule de crise, statut patron, grade, XP,
   badges, demande au patron, préparation d'un événement — et la plainte du dossier revient en mention Community avec
   un délai de 45 s réelles alors que l'intro dit « Pas de chrono ». → **À trancher** : un objectif du jour et un défi
   de semaine visibles, le reste différé au bilan ; une seule voix par plainte.

### P2 — coûtent de l'attention sans rien rendre

9. **La redondance est mal placée.** Après une décision, les écarts de jauges sont dits cinq fois (narration, liste,
   retour, pastille, annonce) ; avant, le contexte zéro fois. « Gardez les 3 jauges au vert » apparaît six fois avant
   la première décision, mais les seuils du patron (120 / 90) et des fins (150 / 240) ne sont visibles nulle part au
   moment de décider (l'étape « jauges » du guide se valide d'elle-même dès qu'un signalement arrive). Le soir, quatre
   résumés de la même journée se suivent (≈ 6 gestes, 25 s), deux écrans noirs, trois écrans nommés « fin de journée ».

10. **La hiérarchie récompense plutôt qu'elle n'explique.** « +85 XP » en 40 px vert, badge « 1 nouveau », tampon rouge
    permanent, « Livrables » plus large que tout l'écran titre ; tandis que le fait réel du dossier est en 16 px gris
    tronqué sous la plainte inventée en 20 px blanc, et que le fil de la journée (règles de 10 h, 12 h, 17 h) n'est
    visible que pendant la sieste — ailleurs, un bip sans rien à l'écran.

### Ce qui porte l'œuvre et doit rester

La vitre et la météo réelle, la Loire, le store qui donne la météo d'archive **avec sa source** et « heure réelle /
heure du jeu », la date d'archive sur le téléphone, l'onglet « En direct · pas la semaine jouée », les cartes de source
du volet PLUS, le badge « Fictif » et « à vol d'oiseau » là où ils existent, le brouillon d'info trafic « à vérifier
avant d'envoyer », le corps du régulateur (café, souffle, paupières), le bureau qui se remplit au fil des jours, la
gravité jamais dite par la couleur seule (taille + infobulle), les tendances par symbole. Ces éléments disent « on
rejoue une journée réelle de Nantes depuis un poste » sans ajouter de chiffre.

---

## 2. Informations manquantes (regroupées)

| Information à ajouter | Où | Pourquoi | P |
|---|---|---|---|
| Date de la semaine et part « perturbations réelles · événements d'agenda · fictif » | Nouvelle partie (clés `accueil.semaine`, `accueil.info` orphelines), pile de dossiers | tient la chaîne source → œuvre au moment du choix | P1 |
| « Fictif » et « affluence supposée » sur chaque trace | Community, téléphone, tâches, mail, rapports, game over, crédits | vérité de la source | P1 |
| Contexte de décision (météo du jour, pointe sur l'heure affichée, jauge en manque) | fenêtre du dossier, avant les répliques | c'est ce qui change les tendances | P1 |
| Annonces des répliques et tendances au lecteur d'écran | dossier | accessibilité de la décision | P1 |
| Faits réels de la semaine dans le bilan (pire retard, alerte, ligne la plus touchée, sources) | rapport de fin de semaine | la chaîne se casse à la fin | P1 |
| Prix réel de la sieste hors défi chrono, effet du café | téléphone, sieste, café | texte faux aujourd'hui | P1 / P2 |
| Témoin caméra visible dans toutes les vues | appli, bureau | consentement (hors grille, signalé P1) | P1 |
| Seuils patron et fins, score courant | bandeau ou Indicateurs | on peut finir « mauvaise » sans signal | P2 |
| Équipe adaptée avant l'envoi | panneau équipes | l'effet est divisé par deux sans qu'on le sache | P2 |
| Mode et source en un coup d'œil (« Archive du 14/09 », « Temps réel », « Repli local ») | bandeau | aujourd'hui seul « hors ligne » s'affiche | P2 |
| « Source Météo ajoutée au dossier » au moment du geste au bureau | fenêtre, téléphone, notifications | le bureau est un outil d'enquête qui ne le dit pas | P2 |
| Annonces à l'arrivée du menu, des Paramètres, du Palmarès, de l'Aide | lecteur d'écran | navigation annoncée, arrivée muette | P2 |
| Record battu, écart du jour sur les jauges, rappel à la reprise d'une sauvegarde | bilans, reprise | calculés mais jamais montrés | P3 |

---

## 3. À trancher par le groupe

Ces choix ne relèvent pas d'une correction : ils engagent l'intention de l'œuvre. Les alternatives sont détaillées
dans les volets.

1. **Clash indiscernable (prompt 117) ou tendance honnête (prompt 130) ?** Masquer la tendance du clash, ou retirer
   « indiscernables » du prompt 117. Dans les deux cas, supprimer le doublon « attendre / clash ». *(B)*
2. **Affluence** : garder les événements d'agenda quelconques en le disant (« le jeu suppose »), ou ne garder que les
   événements grand public (semaines plus courtes). *(B, C)*
3. **Hiérarchie fait réel / plainte inventée** dans la fenêtre du dossier : le fait d'abord, ou la plainte d'abord
   avec « usager fictif » et le fait non tronqué. *(B)*
4. **Gravité** : renommer en « priorité de jeu » ou la calculer sur la situation. *(B)*
5. **Plainte du dossier et mention Community** : une voix (le dossier clôt la mention) ou deux voix (sans délai, textes
   différents). *(C)*
6. **Combien de couches d'objectifs** ; activer par défaut le déblocage progressif des applis (prompt 91) ? *(C)*
7. **Pression en mode archive** : assumer un jeu de lecture sans pression, ou une pression douce visible sur la carte ;
   la sieste doit-elle coûter quelque chose hors défi chrono ? *(B, C)*
8. **Options « Pression visible » et « Trace dans le dossier »** : les rebrancher ou réécrire leurs libellés. *(B)*
9. **Écran `dessinerFin`** : le supprimer en migrant ses informations dans le rapport (3ᵉ page « Sources et faits de la
   semaine ») ou le rétablir après le rapport. *(D)*
10. **Partir avant 20 h quand tout est traité** : pas de blâme si aucun dossier n'est laissé, ou texte honnête. *(D)*
11. **Soirée** : un seul écran du soir, ou la chaîne actuelle ; en exposition, sauter crépuscule et écrans noirs ? *(D)*
12. **Fin de campagne** : sur la semaine 3 seule, ou sur le cumul des trois. « Meilleure / pire décision » classées par
    évaluation plutôt que par somme des écarts ? *(D)*
13. **Mode exposition** : masquer les liens externes ; suspendre l'horloge sous « Partie en pause » et pendant le guide ;
    palmarès de salle partagé ou personnel ; ouvrir le mode temps réel (seul mode où le seuil de 10 min joue) au jury
    ou en exposition. *(A)*
14. **Bloc Livrables** (prompt 136) : pleine largeur (jury d'abord) ou au gabarit des trois autres boutons. *(A)*
15. **Autorisations caméra / micro** : avant la partie (prompt 110) ou au premier usage. *(A)*
16. **Vocabulaire** : un seul terme (« signalement » ou « dossier »), un format d'heure, un format de date ; et la
    dérogation « Budget » à noter dans `jeu/04-jauges-et-fins.md`, qui parle encore de « Satisfaction usagers ». *(D)*

---

## 4. Suites proposées (prompts à écrire, non exécutés)

| Ordre | Prompt proposé | Constats | Nature |
|---|---|---|---|
| 1 | Mode exposition : arrivée réelle au poste, pause qui arrête l'horloge, liens externes masqués | 7 | correction (défaut du prompt 132) |
| 2 | Textes alignés sur la règle jouée + contrôle automatique des clés de règle | 1 | reformulation |
| 3 | « Fictif » et « affluence supposée » partout ; mot « réel » réservé à la source | 2 | ajout / reformulation |
| 4 | Rapport de fin de semaine : comptage par catégorie, faits réels et sources (sort de `dessinerFin`) | 6 | correction / déplacement |
| 5 | Contexte avant la décision (pointe sur l'heure affichée) et annonces des répliques | 3, 5 | ajout |
| 6 | Couches d'objectifs et soirée allégées | 8, 9, 10 | après arbitrage du groupe (§ 3) |

Les prompts 4 à 6 dépendent en partie des choix du § 3 ; les prompts 1 à 3 peuvent être exécutés sans arbitrage.
