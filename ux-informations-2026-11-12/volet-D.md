# Revue UX — volet D : le temps et les bilans (12/11/2026)

Méthode : skill `ux-questionner-informations` (inventorier → 8 questions → verdict + priorité).
Ce que j'ai lu : `site/public/` (journee.js, soir.js, gameover.js, histoire.js, immersion.js [transition, attente, mail, fil],
rythme.js, sauvegarde.js, progression-bureau.js, taches-ui.js [rapport du soir, récapitulatif], journal.js [vues Jour/Semaine],
mecaniques.js [palmarès], game.js [bilan, mails, statut patron, stats], sketch.js [dessinerFin, reprise, indicateur], i18n.js FR/EN),
`jeu/04-jauges-et-fins.md`, `site/public/grammar.md`, `prompts/README.md`.
Captures réelles (1920×1080, `?expo=1`, état forcé par `page.evaluate`) : `…/scratchpad/ux/D/*.jpg` (scripts `d1.mjs` à `d5.mjs`).
**Limite** : les décisions ont été jouées par `Jeu.decider` (sans l'interface). « Temps moyen de décision : — » et « Sources
consultées : 0 » sur le rapport page 2 sont donc peut-être des artefacts. Ce n'est pas le cas des compteurs par action à 0
(voir constat 1).

Légende Origine : **API** = donnée réelle Open Data / Open-Meteo / GTFS · **Calcul** = calcul du jeu sur la partie ·
**Fiction** = fiction assumée · **Interface** = texte d'interface. P1 gêne la décision ou trompe sur la source · P2 coûte de
l'attention sans rien rendre · P3 finition.

---

## Synthèse — constats transverses (P1 d'abord)

1. **P1 — Le bilan chiffré se contredit.** Sur la page 2 du rapport (« Chiffres réels de la semaine »), les lignes Dévier,
   Retenir, Renfort et Ne rien faire valent **0** alors que la même page affiche « Dossiers traités 16 » et « Profil de
   gestion : le pompier, 7 décision(s) sur 16 (renfort) ». La cause : `statsSemaine` (game.js:2140-2141) compte
   `h.action` avec les anciennes clés du modèle à 4 actions, alors que les réponses sont désormais classées par catégorie
   depuis le prompt 87. `profilPartie` (game.js:1975), lui, lit `h.famille`. Les libellés « Dévier la ligne… » datent de
   l'ancien modèle et ne correspondent plus aux répliques jouées (« Renforcer la fréquence », « Agents sur les quais »…).
2. **P1 — L'incident fictif perd son étiquette « Fictif » dans tous les bilans.** `grammar.md:26` et le prompt 119 exigent
   que l'incident fictif soit « toujours marqué Fictif ». Or il apparaît sans marque dans plusieurs bilans :
   - « Ligne 1 : agression en cours → Calmer la situation (bon choix !) » dans le mail du soir et dans le journal du
     game over (`Jeu.ligneMail`, game.js:993) ;
   - les faits proposés au rapport du soir, puis repris dans le carnet et dans « Fait marquant » ;
   - les décisions clés.

   Il est en plus **compté** dans « {n} signalement(s) **réel(s)** prévu(s) aujourd'hui » de la transition de journée
   (immersion.js:172). Seul `dessinerFin` écrit « 1 incident (fictif) », et cet écran est inatteignable (constat 3).
3. **P1 — L'écran de fin qui reliait la semaine à ses sources est mort.** Plusieurs informations n'existent que sur
   `dessinerFin` (sketch.js:837-984) :
   - « Pire retard réel » (exigé par Q52) ;
   - les dossiers par type avec « (fictif) » ;
   - la ligne « Sources : Open Data Nantes Métropole (GTFS Naolib, agenda), Open-Meteo. Aucun événement inventé. » ;
   - « Nouveau meilleur bilan ! » / « Meilleur bilan : … » ;
   - le grade.

   Or `finDeSemaine` pose toujours `RAPPORT` (histoire.js:69) et `sketch.js:486` n'affiche alors que l'écran « Rapport
   imprimé ». En parcours normal, ces informations ne sont donc jamais vues. Le jury perd le dernier maillon
   **source → œuvre**, et le joueur ne sait pas qu'il a battu son record.
4. **P1 — La narration entre deux décisions est invisible.** Le « fil de la journée » (prompt 74) rassemble l'objectif avec
   sa règle, le bilan de la veille, les liaisons (météo, agenda, radio) et les événements de 10 h, 12 h et 17 h **avec
   leur règle** (« l'affluence compte ×1,25… »). Il ne se dessine que pendant la sieste (`sketch.js:507`,
   `dessinerAttente`). Le reste du temps, il n'existe qu'en aria-live, et `majRythme` joue un `bip('choix')` sans aucun
   visuel. Pour un joueur voyant, ce sont des sons orphelins, et la règle de contexte qui pèse sur ses décisions ne
   s'affiche jamais.
5. **P1 — « Partir maintenant ? » punit un départ sans conséquence.** À 16:36, avec tout traité, la fenêtre dit « il reste
   0 dossier(s). Si vous partez, ils seront réglés sans vous… (réputation −8) » (capture `12-partir.jpg`). Le blâme du
   lendemain (« en laissant 0 dossier(s) en plan ») s'applique pourtant, parce que `Jeu.appliquerBlame` ne regarde pas
   `laisses`. Le texte et la sanction se contredisent.
6. **P2 — Trop de bilans par soirée, et trop d'étapes entre deux journées.** Le soir enchaîne Rapport du soir →
   récapitulatif « Fin de journée » (XP) → mail du soir → « Ranger le poste » → crépuscule de 4 s → flèche « Sortie »
   (8 s) → pan et fondu → écran noir de 1,5 s → transition de 5,2 s → démarrage du PC (prompt 71). Cela fait 6 gestes et
   environ 25 s. La journée est résumée **quatre fois** : récapitulatif, mail, rapport de la veille posé sur la table,
   ligne « Hier : … » du fil. Les formats changent d'un écran à l'autre, et le vocabulaire aussi (dossier / signalement /
   incident ; heures « 16:36 », « 20h00 », « 15h48 », « 8 h » ; dates ISO, jj/mm/aaaa, « lundi 14 septembre »).

---

## 1. Transition de journée « JOUR n/N — SEMAINE s »
Capture `28-transition-jour2.jpg`. Code `immersion.js:145-235` (prompts 43, 95, 112).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| « JOUR 2/6 — SEMAINE 1 » (ou « JOUR j/n », « JOUR j — TEMPS RÉEL ») | immersion.js:193-198, 217 · `transition.jour`, `transition.jourArchive`, `transition.jourDirect` | Calcul | Se situer dans la semaine | Clair. « SEMAINE 1 » est un chapitre de l'histoire, pas un numéro de semaine calendaire : le visiteur peut confondre. | Garder | P3 |
| Date « mardi 15 septembre » | immersion.js:222 · `jourDate` | API (date de la semaine archivée) | Ancrer la journée dans le réel | L'année manque, alors que le reste du jeu écrit « 14/09/2026 ». La date réelle rejouée et le « vrai » aujourd'hui ne sont pas distingués (la partie est en 2026, l'atelier le 12/11/2026). | Garder | P3 |
| « {n} signalement(s) réel(s) prévu(s) aujourd'hui, d'après les données de ce jour-là » | immersion.js:172 · `transition.prevus` | API + **Fiction** | Annoncer la charge | `j.dossiers.length` **compte l'incident fictif** (prompt 119) : « réels » est faux le jour où il tombe. | Reformuler (« n signalements dont 1 fictif ») | **P1** |
| « Service de 8h00 à 20h00 » | :173 · `transition.service` | Interface (invariant de `grammar.md`) | Connaître la fin | Répété chaque jour alors que c'est un invariant. | Alléger (jour 1 seulement) | P3 |
| « Le temps file ×100 quand rien n'arrive… » | :174 · `transition.rythme` | Interface | Comprendre l'horloge | Utile le jour 1, puis du bruit. | Différer (jour 1, puis Aide) | P2 |
| « Pour finir la journée : touche Q, ou l'horloge murale » | :175 · `transition.finir` | Interface | Savoir sortir | Il manque l'étape « Ranger le poste » et la flèche « Sortie », qui viennent après. | Garder, jour 1 seulement | P3 |
| « Semaine de {n} jours : aucun événement réel le {jours} » | :176-177 · `transition.courte` | API (absence de données) | Honnêteté sur une semaine courte | Bonne information de vérité. Elle n'apparaît **que** le jour 1, et c'est justement la transition courte de la première partie (prompt 112) qui la masque. Les textes de fin disent pourtant « ces sept jours » (§ 13). | Garder et la répéter au bilan | P2 |
| « Entrée ou clic pour commencer » | :232 · `transition.passer` | Interface | Passer | Rien à redire. | Garder | — |
| Annonce aria-live (titre, date et lignes) | :191 | Interface | Lecteur d'écran | L'annonce est faite même quand la transition est courte. | Garder | — |

## 2. Déroulé de la journée : horloge, vitesse, reste, fin atteinte
Captures `11-poste-attente.jpg`, `13-fin-atteinte.jpg`, `29-jour2-matin.jpg`. Code `panneau.js:50`, `sketch.js:466-480`,
`journee.js:170-179`, `immersion.js:236-330`.

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Heure de jeu + état « ▶ / ▶▶ ×100 / en pause » (bandeau du PC, horloge du bureau) | panneau.js:50 · `temps.*` ; bureau `11:00 ▶▶ ×100` | Calcul | Savoir si le temps file | À 20:00, l'horloge est arrêtée (`finJourneeAtteinte`) mais affiche encore « ▶▶ ×100 20:00 » (capture 13), car `tempsCompresse()` reste vrai. Le jeu ment sur la vitesse au moment même où il faut agir. | Reformuler (« arrêtée — fin de service ») | P2 |
| « Aujourd'hui : {n} à traiter · prochain vers {heure} » / « tout est traité · fin du service à 20h00 (Q) » | sketch.js:469-475 · `jour.reste*` | Calcul | Planifier la journée | Utile. « (Q) » est le seul indice visible pour finir. | Garder | — |
| Horloge arrêtée à 20:00 (fin atteinte) | journee.js:172-178 · `horloge.finAtteinte` (aria seul) | Interface | Savoir que la journée est finie | Le message « Il est 20h00 : la journée est finie. Cliquez sur l'horloge murale » n'est **qu'annoncé**. À l'écran du poste, rien ne change (capture 13) ; seul le bureau montre la consigne en bas. | Ajouter un signal visible au poste | P2 |
| Bulle de pièce « Il est {heure}. Aucune journée en cours » / « lisez le mail du soir » | journee.js:14-16 · `horloge.libre`, `horloge.mail`, `soir.annonce` | Interface | Retour au clic sur l'horloge | Rien à redire. | Garder | — |
| Fenêtre « Partir maintenant ? » + texte malus | journee.js:42-73 · `partir.titre`, `partir.texte` | Calcul | Décider de partir tôt | Avec 0 dossier restant : « il reste 0 dossier(s)… ils seront réglés sans vous… (réputation −8) », et le blâme tombe quand même (constat 5). | Reformuler (variante n=0) et trancher la règle | **P1** |
| Boutons « Rester (Échap) » en rouge primaire / « Partir quand même (Entrée) » en secondaire | journee.js:71-72 | Interface | Choisir | Le bouton rouge est l'option sûre et Entrée déclenche l'option risquée : le poids visuel et le raccourci se contredisent. | Garder le bouton rouge, mais Entrée doit faire « Rester » | P2 |
| Annonce `horloge.nonTraites` + calcul Q25 à 20 h | immersion.js:310-315 | Calcul | Expliquer les signalements expirés | Annonce seulement, rien n'est visible. On ne voit la perte que dans le mail. | Ajouter une ligne au mail (c'est déjà fait par dossier) | P3 |
| Indicateur « Partie sauvegardée à 15h48 · jour 1 » | sketch.js:476-480 · `sauvegarde.autoJeu` | Calcul (heure de jeu) | Rassurer | Voir § 19. | Voir § 19 | P2 |

## 3. Fil de la journée, narration entre décisions, panneau d'attente
Code `immersion.js:1062-1150`, `rythme.js`, `immersion.js:386-433`. Dessin seulement si `enSieste` (`sketch.js:507`, prompt 107).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Objectif du jour avec sa règle « — actuellement {v}. Vérifié ce soir : atteint → bonus ; manqué → −5 » | immersion.js:431 · `fil.objectifRegle` | Calcul | Viser la jauge | Visible uniquement pendant la sieste. Le bandeau dit seulement « Objectif : Garder la fluidité ≥ 40 (66) », **sans la sanction**. | Déplacer la règle vers l'infobulle du bandeau ou l'aide | P2 |
| « Hier : {n} dossier(s), {bons} bon(s) choix ; objectif « … » atteint/manqué » | rythme.js:159-166 · `veille.*` | Calcul | Faire le lien d'un jour à l'autre | Invisible hors sieste, et redondant avec le rapport de la veille (§ 10) et le mail. | Fusionner avec le rapport de la veille | P2 |
| Liaisons « Météo du jour : {min} à {max} °C… », « Agenda du jour : « {nom} » », « Radio : … ligne {ligne} » | rythme.js:83-104 · `liaison.*` | API (météo, agenda) + Fiction (radio) | Faire vivre la journée avec du réel | Seule narration réelle **entre** deux décisions, et elle est **invisible** (aria seulement). La radio est une fiction non marquée (« un chauffeur… accuse réception »). | Déplacer (fil visible, une ligne sous la carte) ; marquer la radio comme fiction | **P1** |
| Événements 10 h / 12 h / 17 h avec règle « ×{coef} » | rythme.js:107-124 · `rythme.*` ; `bip('choix')` immersion.js:1117 | API + Calcul (règle Q24) | Anticiper le contexte qui multiplie les effets | La règle qui change l'effet des décisions n'est jamais lisible. Le bip sonne sans rien montrer : c'est un son orphelin. | Déplacer (notification visible), sinon supprimer le bip | **P1** |
| Séries « Patron : deux bonnes décisions d'affilée… » | immersion.js:1124-1131 · `serie.*` | Calcul | Encourager | Elles arrivent aussi dans l'appli Patron (doublon voulu, le seul visible). | Garder | — |
| Panneau d'attente (sieste) : « SURVEILLANCE DU RÉSEAU · {date} », grande heure, « ▶▶ temps accéléré ×100 », « Aucun incident… », « Dossiers restant cette semaine : n / N · Jour j sur J », « Zzz… vous somnolez » | immersion.js:386-433 · `surv.*` | Calcul | État pendant la sieste | Grande heure redondante avec le bandeau et l'horloge murale. « Dossiers restant **cette semaine** » est le seul compteur de semaine du jeu, et il n'est visible qu'en sieste. | Alléger (heure) ; déplacer le compteur de semaine | P3 |

## 4. Blâme du lendemain (« Votre départ d'hier »)
Capture `30-blame.jpg`. Code `journee.js:104-147`, `game.js:2075-2085` (prompt 51).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Bandeau « MAIL PRIORITAIRE · DE : LE PATRON » | journee.js:127 · `blame.bandeau` | Fiction | Mettre le mail en avant | Le rouge est justifié : c'est une sanction. | Garder | — |
| « Réputation −8 » (en-tête gris) | :132 · `blame.entete` | Calcul | Montrer le coût | En petit et en gris au-dessus du titre : sous-pondéré par rapport à l'enjeu. Répété dans le corps du texte. | Fusionner (garder dans le texte) | P3 |
| Titre « Votre départ d'hier » + texte « Hier ({date}), vous avez quitté… en laissant {n} dossier(s) en plan… » | :133-140 · `blame.titre`, `patron.blame` | Calcul | Comprendre la sanction | Avec n = 0, la phrase devient absurde (constat 5). | Reformuler (variante n = 0, ou pas de blâme) | **P1** |
| « J'ai compris (Entrée) » | :141 | Interface | Fermer | Rien à redire. | Garder | — |

## 5. Statut patron : pastille, rappel, dernier avertissement, levée
Captures `70/71-*.jpg`. Code `gameover.js:141-158` (fichier listé : 696-713), `game.js:1118-1224`, `os.js:674` (prompt 84).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Pastille « Sous surveillance » (jaune) / « Dernier avertissement » (rouge) | gameover.js:141-158 · `statut.surveillance`, `statut.dernier` | Calcul | Sentir la menace | Visible au poste seulement, pas au bureau (capture 32). Elle ne dit ni le seuil ni l'écart. `Jeu.pointsPourSortir` existe, mais seul le conseil de l'appli l'utilise (game.js:1798). | Ajouter « +n pts pour sortir » | P2 |
| Message « Rappel à l'ordre : {liste}. Score de la salle {score}/300. {detail}{decision} Redressez la situation avant ce soir. » | game.js:1196-1206 · `patron.rappel` | Calcul | Comprendre pourquoi | Bon message (vraies valeurs, dernière décision ratée). « avant ce soir » est faux : le dernier avertissement tombe **le soir suivant** (`finJourneeStatut`). | Reformuler | P2 |
| « Dernier avertissement : … Si demain soir la salle est toujours sous {seuil}, vous êtes remercié. » (patron + première ligne rouge du mail du soir) | game.js:1161-1166, 1028-1033 · `patron.dernier`, `mail.dernier` | Calcul | Connaître le seuil (90) | Doublon voulu (prompt 84). C'est le seul endroit où un seuil de licenciement est donné. | Garder | — |
| « La salle remonte à {score}, je lève la surveillance. » | game.js:1210-1213 · `patron.leve` | Calcul | Soulagement | Rien à redire. | Garder | — |
| Bip « alerte » à chaque message important | gameover.js:17-18 | Interface | Attirer l'attention | Redondance son + texte, voulue. | Garder | — |

## 6. Rapport du soir (fait marquant + demande au patron)
Capture `20-rapport-soir.jpg`. Code `taches-ui.js:67-72, 168-262`, `taches.js:340-390` (prompt 88).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Titre « RAPPORT DU SOIR » | taches-ui.js:180 · `tache.titre.rapport` | Interface | Situer | Il s'ouvre **avant** le mail du soir : on rédige son rapport sans avoir reçu le bilan de la direction. L'ordre est-il voulu ? | À trancher (ordre rapport / mail) | P2 |
| Carte d'intro + exemple « Le patron l'accorde si votre réputation est d'au moins 50 ; elle vaut pour le lendemain » | :182-194 · `tache.intro.rapport`, `tache.exemple.rapport` | Interface | Comprendre la règle | Affichée la première fois seulement. La règle (réputation ≥ 50) est utile à chaque fois, car elle conditionne le choix. | Garder la règle en permanence (une ligne) | P2 |
| Faits proposés « {heure} · {sujet} : « {action} », un bon choix » / « il fallait « {meilleure} » » / « {n} signalement(s) laissé(s) sans réponse » / « L'affluence de « {nom} » » / « Une journée calme » | taches.js:340-353 · `tache.fait.*` | Calcul + API (agenda) | Choisir le fait marquant | Le fait tiré de l'incident fictif ne porte pas « Fictif ». Les heures sont toutes « 10:02 » (heure de jeu de la décision), alors que l'heure réelle de la source n'est pas donnée. | Ajouter le marqueur Fictif | **P1** |
| Demandes « Plus de budget (+5 demain) », « Une équipe de police de plus demain (+1) », « Un jour plus calme (objectif allégé de 5) » | taches-ui.js:258 · `tache.demande.*` | Calcul (fiction de gestion) | Préparer demain | La réputation actuelle n'est pas rappelée, alors qu'elle décide de l'accord. | Ajouter « réputation {r} / 50 requis » | P2 |
| Pied « 1 à 4 : choisir · Tab : … · Échap : envoyer sans demande » + « Passer (Échap) » / « Valider (Entrée) » | :202-206 · `tache.consigne.rapport` | Interface | Clavier | « Passer » et « envoyer sans demande » désignent le même geste (Échap) sous deux noms. | Reformuler (un seul nom) | P3 |
| Bandeau de pièce « Journée finie : cliquez sur l'horloge murale pour partir » sous la fenêtre | capture 20 | Interface | — | Consigne périmée : le joueur a déjà cliqué. | Supprimer quand une fenêtre est ouverte | P3 |

## 7. Récapitulatif « Fin de journée » (XP, grade, priorités, badges)
Capture `21-recap.jpg`. Code `taches-ui.js:371-442` (prompt 88).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Titre « FIN DE JOURNÉE » | `tache.titre.recap` | Interface | Situer | Ce titre ressemble à celui de l'écran noir « Fin de la journée du … » qui vient ensuite, et le mail du soir arrive encore après. On a trois « fins » de suite. | Renommer (« Expérience du jour ») | P2 |
| « +85 XP » (grand, vert, animé) | :387-389 | Calcul (fiction de carrière) | Récompenser | C'est l'élément le plus gros du soir, alors que le texte d'intro précise « elle ne change pas les jauges ». Le poids visuel est inversé par rapport aux jauges, qui ne sont pas montrées ici. | Alléger | P2 |
| « Stagiaire · 85 XP · encore 65 XP pour Régulateur·rice » + barre | :393-400 · `recap.grade`, `recap.prochain` | Calcul | Progression entre parties | Garde du sens pour le joueur sur plusieurs semaines, mais rien pour le visiteur de 3 min. | Garder (masquer en `?expo=1` ?) | P3 |
| Lignes « Décisions (5), série comprise +50 », « Priorités du matin tenues (2) +20 », « Objectif du jour atteint +15 » | :409-414 | Calcul | Expliquer l'XP | Rien à redire. | Garder | — |
| Priorités « ✓ Garder le budget à 40 ou plus — tenue » | :418-422 · `carnet.etat.*` | Calcul | Bilan des priorités | Symbole + couleur + mot : la redondance est accessible. | Garder | — |
| « Fait marquant : … » + « Le patron accordera votre demande demain. » | :424-430 · `recap.fait` | Calcul | Confirmer | Répète mot pour mot l'écran précédent, puis le mail du soir le répète une troisième fois (`mail.faitMarquant`). | Supprimer ici (garder dans le mail) | P2 |
| Badge pixel « Zéro non traité » | :431-436 · `badge.*` | Calcul | Récompense | Rien à redire. | Garder | — |

## 8. Mail du soir (« Merci pour cette journée » / « Points à revoir »)
Captures `22-mail-soir.jpg`, `42-mail-soir-poste.jpg`. Code `immersion.js:437-470`, `game.js:993-1064` (prompts 20, 21, 47, 55, 79, 84, 89 bis).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| « MESSAGERIE », badge « 1 nouveau » (vert ou rouge) | immersion.js:449-450 · `mailf.titre`, `mailf.nouveau` | Interface | Cadre diégétique | « 1 nouveau » est toujours vrai et n'apprend rien. Le badge rouge signale « journée imparfaite ». | Supprimer le badge (la couleur suffit avec l'objet) | P3 |
| « De : Direction de la régulation », « À : régulateur · poste 3 » | :451-452 · `mail.de`, `mailf.a` | Fiction | Diégèse | Peu de coût. | Garder | — |
| Objet « MERCI POUR CETTE JOURNÉE — 19/09/2026 » / « POINTS À REVOIR — {date} » | game.js:1060 · `mail.objetMerci`, `mail.objetRevoir` | Calcul | Verdict du jour | « Points à revoir » sur fond rouge dès qu'**une** décision n'est pas « bon » : 4/5 bons choix donne un mail rouge. C'est sévère, et ça ne s'accorde pas avec la fin « bonne » à 240. | À trancher (seuil du ton) | P2 |
| « Fait marquant retenu dans votre rapport : … » | game.js:1037 · `mail.faitMarquant` | Calcul | Écho du rapport | Troisième répétition du soir (§ 6, § 7). | Garder ici seulement | P2 |
| « Tout a été géré dans les temps, belle journée. » OU « Journal de la journée du {date} : » + une ligne par dossier « {heure} – {sujet} : {externe} + retard {r} min → {action} ({éval}, il fallait : {meilleure}) → {impacts} » | game.js:993-1018, 1038-1042 · `mail.ligne`… | API (sujet, retard) + Calcul (éval, impacts) | Comprendre chaque décision | C'est la bonne information pour apprendre. Une journée parfaite **masque** le détail, alors qu'un joueur qui réussit peut aussi vouloir voir les données. L'incident fictif n'est pas marqué. Les lignes sont longues : 60 px de hauteur quand elles débordent. | Garder ; ajouter « Fictif » | **P1** (fictif) |
| « Community : {temps} à temps, {tard} tardive(s), {expire} sans réponse » | game.js:1045 · `mail.community` | Calcul | Plaintes | Rien à redire. | Garder | — |
| « Retards aggravés durablement aujourd'hui : {lignes} (+n min) » | :1046-1047 · `mail.aggravation` | Calcul sur une donnée API | Conséquence durable | Rien à redire. Sans équivalent ailleurs. | Garder | — |
| « Objectif du jour — {libelle} : atteint (bonus réputation +8). » | :1048-1049 · `mail.objectif` | Calcul | Résultat de l'objectif | Le « +8 » vient du ×1,5 de la semaine 1 (histoire.js:47), qui n'est expliqué nulle part. | Ajouter « (×1,5 semaine 1) » | P3 |
| « Jauges en fin de journée : fluidité {f}, réputation {r}, budget {b}. » | :1050 · `mail.jauges` | Calcul | État | Doublon avec le bandeau : seule utilité, l'instantané. **L'écart du jour** (+/−) serait plus utile ; il n'existe que dans le Journal. | Reformuler (valeur + écart) | P2 |
| « Défis de la semaine : … » chaque soir ; le dernier soir « Bilan des défis » avec « ✓ Toutes les plaintes répondues (valeur réelle : 0/0) — réputation +5 » | :1052-1056 · `mail.defis`, `defi.tenu` | Calcul | Défis | Le défi des plaintes est **tenu à 0/0** : un bonus pour rien, présenté comme « valeur réelle ». Le bilan des défis revient ensuite dans le mail de fin de semaine et sur les deux pages du rapport (4 fois). | Reformuler (« sans objet » si 0/0) ; fusionner | P2 |
| « Votre style aujourd'hui : le gestionnaire discret (1 décision(s) sur 1 : retenue au terminus). » | :1057-1058 · `mail.style` | Calcul | Épilogue personnalisé | « retenue au terminus » qualifie « Agents sur les quais » : ce sont les libellés de l'ancien modèle à 4 actions, qui ne correspondent plus aux répliques jouées. | Reformuler (familles actuelles) | P2 |
| « DERNIER AVERTISSEMENT… » (1ʳᵉ ligne, rouge) / « Un dernier avertissement est en cours… » | :1027-1034 · `mail.dernier`, `mail.avertissementEnCours` | Calcul | Menace explicite | Rien à redire. | Garder | — |
| « — La direction » + bouton « Ranger le poste (Entrée) › » | :468-469 · `mailf.signature`, `soir.ranger` | Interface | Suite | « Ranger le poste » n'annonce pas qu'il mène à la nuit puis au lendemain. | Garder | P3 |

## 9. Soir, nuit, sortie du bureau, écran noir
Captures `23/24/26/27-*.jpg`. Code `soir.js` (prompts 69, 94).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Crépuscule accéléré (horloge qui file jusqu'à 21:00), « La nuit tombe sur Nantes… » | soir.js:62-72 · `soir.tombe` | Fiction (la météo reste celle du jour, réelle) | Clore la journée | Joli. Il coûte 4 s à chaque soirée. | Garder ; à trancher en expo | P3 |
| Flèche « Sortie » (pictogramme vert, flèche jaune pulsée) | soir.js:142-177 (listing 420-455) · `soir.sortie` | Interface | Sortir | Elle part seule au bout de 8 s (`DELAI_SORTIE_AUTO`) : la flèche n'est alors qu'un décor, et le joueur n'a pas le temps de lire le guide. | À trancher (auto ou geste) | P3 |
| Bulle guide « Le soir, la nuit tombe : quittez le bureau… Vous revenez demain à 8 h. » | soir.js:250-261 · `guide.sortir` | Interface | Premier soir | Rien à redire. | Garder | — |
| Consigne « La journée est finie. La sortie est à gauche (Entrée). » | soir.js:71 · `soir.annonce` | Interface | Redondance accessible | Doublon voulu avec la bulle et la flèche. | Garder | — |
| Écran noir « Fin de la journée du {date} » + « Retour demain, 8 h » / « Fin de la semaine » / « Fin de service » | soir.js:95-99, 211-239 (listing 373-377, 489-517) · `soir.finJour`, `soir.demain`, `soir.finSemaine`, `soir.finService` | Calcul | Transition | Juste avant, la transition « JOUR n+1 » redonne une date : deux écrans noirs se suivent. | Fusionner avec la transition du lendemain | P2 |
| Musique atténuée (0,55), couloir sombre | soir.js:310, 457-487 | Fiction | Ambiance | Rien à redire. | Garder | — |

## 10. Rapport de la veille posé sur le bureau
Capture `29-jour2-matin.jpg` (feuille à tampon rouge). Code `histoire.js:597-619` (prompt 89 bis).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Feuille sur la table, avec un tampon rouge | histoire.js:111-125 | Interface | Rappeler la veille | Le tampon est toujours rouge (`#b3261e`), même après une bonne journée. Est-ce lu comme un signal d'échec ? | Reformuler (couleur neutre) | P3 |
| Fenêtre « Votre rapport du {date} » / « Fait marquant : … » / « Priorités : … (tenue) » / « Demande « … » : accordée/refusée » | :605-618 · `veilleRapport.*` | Calcul | Faire le lien d'un jour à l'autre | Utile. La conséquence concrète de la demande (« +5 de budget ce matin ») est dite **ailleurs** (message patron `tache.demande.accordee.*`). | Fusionner (ajouter l'effet appliqué) | P3 |

## 11. Journal (appli) — vues Jour et Semaine (partie bilan)
Captures `40-journal-jour.jpg`, `41-journal-semaine.jpg`. Code `journal.js:82-230, 455-529` (prompts 89, 101).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Pastilles J1…J6 avec date et ✓ / ✗ / • | journal.js:95-127 · `journal.pastille` | Calcul | Naviguer, état du jour | ✓ veut dire « objectif atteint », mais sans légende on peut lire « journée réussie ». | Ajouter une infobulle | P3 |
| Ligne de résumé « Signalements 1/1 · Bons choix 1/1 · F 0 R 0 B −3 · Objectif du jour ✓… » | :160-175 | Calcul | Résumé du jour | Coupée (« ✓… »). « F R B » sans légende dans cette vue. | Reformuler | P3 |
| Vue Semaine, tuiles par jour : thème, « n signalement(s) », « n/total bon(s) choix », « ✓ atteint », « F R B » de fin de journée | :455-480 · `journal.sem.*` | Calcul | Comparer les jours | **Textes qui se chevauchent** : le thème (« Journée ordinaire ») passe sous « 5 signalement(s) », et « B 100 » déborde de la tuile (capture 41). | Corriger la mise en page | P2 |
| Courbe « Jauges et score en fin de journée » 0–300, seuils pointillés 150 / 240 | :483-512 · `journal.courbeSemaine`, `journal.legendeCourbe` | Calcul | Voir sa trajectoire vers la fin | C'est la seule vue qui montre les seuils des fins. **Les seuils de licenciement (120 / 90) n'y sont pas**, alors qu'ils comptent autant pour le joueur. Les jauges tracées sur une échelle 0–300 s'écrasent en bas (capture 41). | Ajouter 120 / 90 ; à trancher : jauges sur 0–100 | P2 |
| « Décisions clés de la semaine » Meilleure / Pire / Mauvaise source | :516-523 | Calcul | Apprendre | Voir § 13 (« Pire » peut être un bon choix). | Voir § 13 | P2 |
| « Carnet de la semaine (K) » : « {date} · {fait} » | :525-527 · `carnet.ligne` | Calcul | Mémoire du joueur | Les lignes se chevauchent (deux colonnes, capture 41). L'incident fictif n'est pas marqué. | Corriger ; marquer Fictif | P2 |

## 12. Fin de semaine — mail du patron
Capture `50-mail-fin-semaine.jpg`. Code `histoire.js:145-174`, `game.js:2158-2171` (prompt 56).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Bandeau « MAIL · DE : LE PATRON · FIN DE SEMAINE » (rouge) | histoire.js:157 · `finSemaine.bandeau` | Fiction | Cadre | Bandeau rouge primaire même quand l'objet est « Belle semaine » : le rouge n'est plus réservé aux sanctions. | Alléger (couleur selon la fin) | P3 |
| Objet « Belle semaine » / « Votre semaine, en chiffres » | game.js:2170 | Calcul | Verdict | Rien à redire. | Garder | — |
| « Semaine terminée : score {s}/300, {t} dossier(s) traité(s) sur {r}. » | :2164 · `finSemaine.intro` | Calcul | Résumé | Redit sur la page 1 du rapport juste après. | Garder (c'est l'introduction) | — |
| « Objectifs du jour tenus (6/6) : c'est exactement… » / « On peut faire mieux. » | :2165-2166 | Calcul | Résumé | Rien à redire. | Garder | — |
| « Attention à la jauge {j} : {v}/100 » (si < 40) | :2167 | Calcul | Alerte | Rien à redire. | Garder | — |
| « Défis manqués : … » / « Tous les défis… tenus. Bravo. » | :2168-2169 | Calcul | Défis | Quatrième rappel des défis (§ 8). | Fusionner (ne garder qu'au rapport) | P2 |
| « {n} dossier(s) non traité(s) : la salle doit réagir plus vite. » | :2170 | Calcul | Pointer le défaut | Rien à redire. | Garder | — |
| Le mail ne cite **aucune donnée de la source** (pire retard, alerte météo, événement marquant de la semaine) | — | — | — | Le texte de `jeu/04` (Q52) réserve ces faits au bilan chiffré, mais celui-ci est mort (constat 3). | Ajouter (une ligne réelle) | P2 |
| « Lire le rapport (Entrée) » | :172 · `finSemaine.lire` | Interface | Suite | Rien à redire. | Garder | — |

## 13. Rapport hebdomadaire — page 1 (bilan)
Capture `51-rapport-p1.jpg`. Code `histoire.js:181-327` (prompts 41, 47, 48, 55, 56, 66).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| « SALLE DE RÉGULATION · RAPPORT HEBDOMADAIRE », « Rapport — semaine 1 » | histoire.js:207-215 | Interface | Cadre | Rien à redire. | Garder | — |
| « Période : 2026-09-14 → 2026-09-20 » | :219 · `rapport.periode` | API | Ancrer | Format ISO, alors que le reste du jeu écrit « 14/09/2026 ». La période couvre 7 jours, mais 6 seulement ont été joués (le dimanche n'avait aucun événement). | Reformuler (jj/mm + « 6 jours joués ») | P2 |
| Tampon « VALIDÉ » / « À SURVEILLER » / « À REVOIR » / « DÉMISSION » | :221-239 · `rapport.tampon.*` | Calcul | Verdict d'un coup d'œil | Couleur + mot : accessible. Il porte le type de fin sans le nommer (« bonne / moyenne / mauvaise » n'apparaît nulle part sur le rapport). | Garder | — |
| « Score 292 / 300 — La direction félicite la salle de contrôle » | :248 · `rapport.score`, `fin.*.titre` | Calcul | Résultat | Le seuil n'est pas donné (« bonne fin ≥ 240 »). | Ajouter le seuil | P3 |
| Texte de fin « …la salle de contrôle sort renforcée de ces sept jours. » | :254 · `fin.bonne.texte` | Fiction générique (Q54) | Ton | « sept jours » est faux quand la semaine est courte (6 jours ici, `transition.courte`). | Reformuler (« de cette semaine ») | P2 |
| Trois jauges « Fluidité 94/100 » + barres colorées | :257-268 · `jaugeTitre.*` | Calcul | État final | Doublon avec la page 2 (« Jauges finales ») et le mail. | Garder ici, supprimer en page 2 | P3 |
| « Dossiers traités : 16/16 (sans décision : 0) · plaintes traitées : 0/0 (bonnes réponses : 0) » | :272 · `rapport.faits` | Calcul | Volume | « 0/0 (bonnes réponses : 0) » ne fait que du bruit quand il n'y a pas eu de plainte. | Alléger (masquer si 0) | P3 |
| « Décisions clés » : « MEILLEURE · 17/09/2026 — affluence « Atelier couture et arts du fil » — Ne rien » / « PIRE · … » | :274-289 | API (titre) + Calcul | Apprendre de la semaine | Le texte est **tronqué** : l'action est coupée (« Ne rien », « — » vide). « Meilleure » et « Pire » sont calculées sur la somme des deltas (game.js:745-750) : la « pire » est ici « Renforcer la fréquence », un **bon choix** selon le journal (fluidité +6, budget −7). On montre comme pire une décision correcte. Le marqueur Fictif manque aussi. | Reformuler (rang selon l'évaluation, pas la somme) ; corriger la coupure | P2 |
| Courbes « Jauges, décision par décision (16) » | :290 · `rapport.courbes` | Calcul | Trajectoire | Rien à redire. | Garder | — |
| « Défis : ✓ Zéro dossier non traité (0) · ✓ Toutes les plaintes répondues (0/0) · … · ralenti utilisé 0 fois » | :292-299 · `rapport.defis` | Calcul | Défis | Doublon avec la page 2. « ralenti utilisé 0 fois » ne sert à rien. | Supprimer ici (garder en page 2) | P3 |
| Extrait du carnet « Journal de bord : « … » » (italique) | :301-307 · `rapport.carnet` | Joueur | Mémoire | Bonne idée (prompt 47). | Garder | — |
| « Profil : Semaine solide sur réputation (100). » + « Profil de gestion : le pompier — 7 décision(s) sur 16 (renfort). » | :309-310 · `fin.profil`, `rapport.gestion` | Calcul | Épilogue | Deux « profils » différents sur la même page, et le second utilise l'ancien vocabulaire à 4 actions. | Fusionner | P2 |
| « Semaine 2 : nouvel élément — équipes de terrain depuis les signalements » | :320 · `histoire.prochain`, `histoire.element.equipes` | Interface | Donner envie de continuer | **Faux** depuis le prompt 108 : les équipes sont actives dès la semaine 1 (`Jeu.elementDebloque`, histoire.js:41-47). | Reformuler (seule « crise » est encore verrouillée) | P2 |
| Bouton « Semaine suivante (Entrée) » (histoire) / « Rejouer », « Autre semaine archivée », « Menu principal » (hors histoire) | :311-325 | Interface | Suite | En mode histoire, on ne peut **pas rejouer** la semaine depuis le rapport. Q55 prévoyait pourtant « Rejouer / changer de semaine », et le palmarès pousse à améliorer son meilleur bilan. La barre d'aide du bureau, en dessous, dit « Entrée pour vous installer » : deux sens pour Entrée. | À trancher (rejouer en histoire) ; masquer la barre | P2 |
| « Page 2 · chiffres (Tab) » | :496-498 · `rapport.versPage2` | Interface | Naviguer | Rien à redire. | Garder | — |

## 14. Rapport hebdomadaire — page 2 (« Chiffres réels de la semaine »)
Capture `52-rapport-p2.jpg`. Code `histoire.js:504-596`, `game.js:2138-2156` (prompts 56, 68).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Titre « Chiffres **réels** de la semaine » | histoire.js:530 · `rapport.chiffresTitre` | Calcul (pas l'API) | — | Dans `grammar.md`, « réel » désigne la **source**. Ici, ce sont les statistiques du joueur. Même glissement pour « valeur réelle » dans les défis. Le jury ne peut pas distinguer donnée et calcul. | Reformuler (« Votre semaine en chiffres ») | **P1** |
| Dossiers reçus 16 / traités 16 / Non traités (Q25) 0 | :533-535 · `stats.*` | Calcul | Volume | « (Q25) » est un code interne de décision, opaque pour le joueur. | Reformuler (supprimer « Q25 ») | P3 |
| Dévier la ligne 0 / Retenir en terminus 0 / Bus de renfort 0 / Ne rien faire 0 | :536-539 | Calcul **faux** | Répartition des choix | Tout est à 0 alors que 16 dossiers ont été traités (constat 1). Les libellés appartiennent à l'ancien modèle. | Reformuler (familles actuelles) et corriger le calcul | **P1** |
| Temps moyen de décision / Sources consultées / Ralentis utilisés | :540-542 | Calcul | Comportement | Ça mérite d'être vérifié en jeu réel (artefact possible de ma simulation). « Ralentis » est un mécanisme absent du parcours expo. | Garder ; vérifier | P3 |
| Objectifs du jour tenus 6/6 | :543 | Calcul | Résumé | Doublon avec le mail de fin de semaine. | Garder | — |
| « Équipes envoyées » + « {n} · {p} pertinente(s) · {r} refus faute d'effectif » | :544 | Calcul | Usage des équipes | **Débordement** : la valeur passe par-dessus le libellé (capture 52). | Corriger la mise en page | P2 |
| Courbes + « Jauges finales : … » + « Score 292 / 300 » | :556-566 · `stats.final`, `rapport.score` | Calcul | État final | Triple doublon (page 1, mail, page 2). | Supprimer « Jauges finales » ici | P3 |
| « Défis de la semaine » ✓/✗ « — valeur réelle {v} · Réputation +5 appliqué » | :568-581 · `stats.defis`, `stats.valeur`, `stats.bonus` | Calcul | Comprendre les bonus | Défi des plaintes à 0/0 compté comme tenu (§ 8). « valeur réelle » : voir le titre. | Reformuler | P2 |
| « Profil de gestion : … » | :583-586 | Calcul | Épilogue | Doublon avec la page 1. | Supprimer ici | P3 |

## 15. Écran de fin `dessinerFin` (bilan narratif + « Bilan chiffré »)
Capture `53-dessinerFin.jpg` (forcée). Code `sketch.js:830-984`, appelé à `sketch.js:486` seulement si `phase==='fin' && !RAPPORT`.
**Inatteignable** en parcours normal : `allerFin` → `finDeSemaine` pose toujours `RAPPORT`, puis `actionRapport` ou
`quitterRapport` changent d'écran. Le game over masque tout. Cet écran contient pourtant la plupart des exigences de
`jeu/04` (décor teinté Q53, bilan chiffré Q52, Q37).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| « FIN BONNE · SCORE 292 / 300 » | sketch.js:852 · `fin.entete` | Calcul | Nommer la fin | C'est le seul endroit qui nomme le type de fin. | Déplacer vers le rapport page 1 | P2 |
| Décor teinté selon la fin (Q53) | :843 · `AMBIANCES` | Fiction | Ambiance | Perdu : le rapport est toujours posé sur un bureau en plein jour. | À trancher | P3 |
| « Pire retard réel : +{min} min (ligne {ligne}) » / « Pire retard : non renseigné par les archives » | :929 · `fin.pireRetard*` | **API** | Relier les décisions aux données de la semaine (Q52) | C'est l'information « source » la plus forte du bilan, et **personne ne la voit**. | Déplacer vers le rapport | **P1** |
| « Dossiers : 11 événements · 1 incident (fictif) · 2 alertes météo · 2 perturbations » | :917-927 · `fin.dossiers` | API + Fiction marquée | Composition de la semaine | C'est le seul endroit où « fictif » est écrit dans un bilan. | Déplacer vers le rapport | **P1** |
| « Sources : Open Data Nantes Métropole (GTFS Naolib, agenda), Open-Meteo. Aucun événement inventé. » | :980 · `fin.sources` | Interface (citation) | Crédit de la source au jury | Invisible. En plus, « Aucun événement inventé » est **faux** depuis le prompt 119 (1 incident fictif par semaine). | Déplacer + reformuler (« sauf 1 incident marqué Fictif ») | **P1** |
| « Nouveau meilleur bilan pour cette semaine ! » / « Meilleur bilan : {s}/300 ({le}) » · « palmarès défi chrono » · « {grade}, +{xp} XP » | :879-887 · `fin.record`, `fin.meilleur`, `fin.grade` | Calcul | Motivation à rejouer | Le record est calculé (`bilanFin`, immersion.js:356) mais jamais montré. Le texte déborde du panneau (capture 53). | Déplacer vers le rapport | P2 |
| « Mauvaise source retenue : {n} fois », « Plaintes des Nantais traitées : x/y » | :870-876 | Calcul | Erreurs de source | « Mauvaise source » n'est pas sur le rapport. | Déplacer | P2 |
| Profil + détail « Objectifs atteints · meilleur jour · équipes envoyées · malus le plus fréquent » | :889-897 · `fin.profilDetail` | Calcul | Épilogue | Le « malus le plus fréquent » est utile pour comprendre ses pertes, et il n'apparaît pas sur le rapport. | Déplacer (une ligne) | P2 |
| Décisions clés avec deltas « fluidité −4 · réputation 0 · budget +13 » | :940-958 | Calcul | Apprendre | Plus complet que le rapport, qui n'a pas de deltas. | Déplacer | P2 |
| Boutons « Rejouer (Entrée) » / « Changer de semaine (Échap) » | :900-901 | Interface | Q55 | Absents du rapport en mode histoire (§ 13). | À trancher | P2 |

## 16. Cinématique de fin (après la semaine 3)
Captures `60/61/62-cine-*.jpg`. Code `histoire.js:330-470` (prompts 41, 56).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| « ÉPILOGUE · BONNE / MOYENNE / MAUVAISE FIN » | histoire.js:385 · `cine.titre.*` | Calcul | Nommer la fin | Rien à redire. | Garder | — |
| Plan 1 « Lundi matin. Les trams traversent la Loire à l'heure. » (trams, pont, pluie) | :380 · `cine.*.0` | Fiction | Épilogue | Fiction non marquée, mais clairement un épilogue. | Garder | P3 |
| Lettre « Trois semaines sous pression… Votre poste… est confirmé. » + tampon | :430-450 · `cine.lettre.*` | Fiction | Verdict des 3 semaines | **Le type de fin ne dépend que du score de la semaine 3** (`lancerCinematique(b.type, b)`, histoire.js:180), alors que la lettre parle de « trois semaines ». Deux bonnes semaines et une mauvaise donnent une lettre de réprimande sur les trois. | À trancher (fin sur la moyenne ou le cumul des 3) | P2 |
| « Semaine 1 : {s1} · semaine 2 : {s2} · semaine 3 : {s3} — mode temps réel débloqué » | :382 · `cine.bilan` | Calcul | Récapituler la campagne | Bonne information, mais en sous-titre de 6,5 s, passable. On y voit les scores, pas les fins par semaine. | Garder | P3 |
| « Passer (Échap) » | :387 | Interface | Passer | Rien à redire. | Garder | — |
| Annonce « Mode histoire terminé : le mode temps réel est débloqué. » | :348 · `histoire.debloque` | Interface | Déblocage | Annoncée en aria seulement, au retour au menu. | Ajouter une trace visible au menu | P3 |

## 17. Licenciement (game over)
Captures `73-gameover-lettre.jpg`, `74-gameover-journal.jpg`. Code `gameover.js` (listing 556-694), `game.js:1226-1249` (prompt 84).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| « LICENCIÉ » (titre pixel rouge) + « Game over » | gameover.js:67-73 · `gameover.titre`, `gameover.sous` | Interface | Verdict | À l'écran, l'accent du « É » n'apparaît pas (« LICENCIE », capture 73). « Game over » est en anglais dans la version française. | Reformuler (« Fin de mission ») ; vérifier le glyphe | P3 |
| Objet « Direction de la régulation — fin de votre mission » | :87 · `gameover.objet` | Fiction | Cadre | Rien à redire. | Garder | — |
| « Le {date}, {heure} (heure du jeu). » | `gameover.quand` | Calcul | Situer | Rien à redire. | Garder | — |
| « Jauges finales : … — score de la salle {s} / 300. » | `gameover.jauges` | Calcul | Comprendre pourquoi | Les **seuils** franchis manquent (« sous 90 », « une jauge à 0 »). | Ajouter le seuil franchi | P2 |
| « Avertissements reçus : {n} ({dates}). » | `gameover.avertissements` | Calcul | Rappeler les signaux | Rien à redire. | Garder | — |
| « Vos décisions les plus coûteuses : — {jour} {heure} · {sujet} · {action} → {effet} » | game.js:1229-1235 · `gameover.pires`, `gameover.decision` | API (sujet) + Calcul | **Comprendre pourquoi on a perdu** | C'est la meilleure réponse du jeu à « pourquoi ai-je perdu ? ». Elle n'apparaît que si une somme de deltas est négative. Elle ne cite pas le contexte réel (météo ou pointe qui a aggravé l'effet). | Garder ; ajouter le contexte | P2 |
| « Malus le plus fréquent : {libelle} ({n} fois). » | `gameover.malus` | Calcul | Comprendre | Rien à redire. | Garder | — |
| Cause « Malgré le dernier avertissement… » / « …sur-le-champ » / « …vous y êtes retombé » | `gameover.cause.*` | Calcul | Cause | Pour l'effondrement (une jauge à 0), le licenciement est immédiat et sans aucun avertissement possible. Le joueur l'apprend-il quelque part avant ? | À trancher | P2 |
| « Pour la prochaine fois : la {jauge} est tombée à {v} — … » | `gameover.conseil.*` | Calcul + conseil | Rejouer mieux | Rien à redire. | Garder | — |
| Tampon « RÉSILIÉ » | :97-115 | Fiction | Verdict | Doublon avec le titre, mais fort pour l'œuvre. | Garder | — |
| Vue « Revoir le journal (J) » : 20 dernières lignes `ligneMail` | :119-124 | API + Calcul | Revoir ses décisions | **L'incident fictif n'est pas marqué** (« Ligne 1 : agression en cours → Calmer la situation »). Lignes longues en police données ; sans défilement. | Ajouter « Fictif » | **P1** |
| Boutons « Rejouer la même semaine (Entrée) » / « Changer de semaine (Échap) » / « Revoir le journal (J) » | :126-137 | Interface | Suite | Pas de palmarès, sauvegarde effacée (voulu par le prompt 84), mais l'écran ne le dit pas. | Ajouter « sauvegarde effacée » | P3 |
| Annonce « Vous êtes licencié. Score {s} sur 300. Entrée : … » | :35 · `gameover.annonce` | Interface | Lecteur d'écran | Rien à redire. | Garder | — |

## 18. Palmarès
Capture `64-palmares.jpg`. Code `mecaniques.js:188-240` (prompts 47, 56).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Lignes « Semaine du 14/09/2026 (facile) » ×3 + « aujourd'hui en temps réel » | mecaniques.js:189-192 · `palmares.semaine` | API (dates) | Choisir quoi améliorer | Rangées par difficulté, pas par date (voulu). Le numéro de chapitre (« semaine 1/3 ») n'est pas repris, alors que le rapport l'utilise. | Ajouter « Sem. 1 · » | P3 |
| « 292 / 300 » + « le 12/11/2026 » | :222-228 · `palmares.le` | Calcul | Record | Ici « le » renvoie à la date **réelle** du jeu, alors qu'ailleurs les dates désignent la semaine rejouée. C'est ambigu. | Reformuler (« joué le ») | P3 |
| « fluidité 94 · réputation 100 · budget 98 » | :232 · `palmares.jauges` | Calcul | Détail | Le type de fin (bonne / moyenne) n'est pas indiqué. | Ajouter le tampon | P3 |
| « le pompier · défis 3/3 » | :233 · `profil.*`, `palmares.defis` | Calcul | Style | Ancien vocabulaire (§ 8). | Reformuler | P3 |
| « pas encore jouée » (temps réel) | :219 · `palmares.vide` | Interface | — | Pour le mode temps réel, encore **verrouillé**, il faudrait « débloqué après l'histoire ». | Reformuler | P3 |
| Aide « Meilleur bilan… gardé sur cet appareil. Le profil vient de l'action la plus jouée : renfort → pompier… » | :238 · `palmares.aide` | Interface | Transparence | « gardé sur cet appareil » est une bonne vérité. La table du profil renvoie à l'ancien modèle à 4 actions. | Reformuler | P3 |

## 19. Sauvegarde et reprise
Captures `80-indicateur-sauvegarde.jpg`, `81-menu-reprendre.jpg`, `83-reprise.jpg`. Code `sauvegarde.js:118-137`, `sketch.js:296-310, 412-447, 466-480`, `menu.js:53-66` (prompts 33, 95, 110).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Indicateur « Partie sauvegardée à 15h48 · jour 1 » (gris, sur la carte) | sauvegarde.js:132-137 · `sauvegarde.autoJeu` | Calcul (heure de jeu, prompt 95) | Rassurer | Le bandeau affiche en même temps « 18:35 » : l'heure de sauvegarde, plus ancienne, ressemble à une horloge en retard. Format « 15h48 » contre « 18:35 ». Rien n'est visible en vue bureau ni pendant la narration. | Reformuler (« sauvegardé ✓ » discret, sans heure) | P2 |
| Menu « Reprendre la partie (C) » + « 14/09/2026 · dossier 6/16 · sauvegardée à 16:38 » | menu.js:53-66 · `accueil.continuerDetail` | Calcul | Choisir de reprendre | « 16:38 » est l'heure **réelle**, alors que l'indicateur en jeu donnait l'heure **de jeu** : deux horloges pour la même sauvegarde. « 14/09/2026 » est le lundi de la semaine, pas le jour en cours. Ni jour n/N, ni score. | Reformuler (« Semaine 1 · jour 1/6 · score 195 ») | P2 |
| Fenêtre « Une partie est sauvegardée » / « Vous en étiez au dossier 6/16… la sauvegarde sera écrasée ? » | sketch.js:425-447 · `reprise.*` | Calcul | Éviter l'écrasement | La semaine, le jour et le score manquent. « dossier » ici contre « signalement » ailleurs. | Reformuler | P3 |
| « Reprendre (Entrée) » rouge / « Nouvelle partie (N) » / « Annuler (Échap) » | :444-446 | Interface | Choisir | « Nouvelle partie » détruit la sauvegarde sans seconde confirmation (le texte prévient). | Garder | — |
| Annonce « Partie reprise : {semaine}, dossier {n}/{total}. » | sauvegarde.js:288 · `sauvegarde.reprise` | Interface | Confirmation | Aria seulement. Après la reprise, on arrive sans transition de journée : ni rappel du jour ni objectif. | Ajouter une transition courte à la reprise | P2 |
| Toast « Sauvegarde impossible sur cet appareil… » | sauvegarde.js:53-57 | Interface | Vérité technique | Rien à redire. | Garder | — |
| Fin de partie : sauvegarde effacée en silence (`auto` en phase « fin ») | sauvegarde.js:120-123 | Calcul | — | « Reprendre » disparaît du menu sans explication (palmarès gardé). | Ajouter une mention au rapport | P3 |

## 20. Progression du bureau d'un jour à l'autre
Code `progression-bureau.js` (prompt 104).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Objets qui apparaissent (tasse J1, aide et plante J2, dossiers J3, micro J4, stress J5, post-it J6, cadre J8, grande plante J10) | progression-bureau.js:9, 33-44 | Calcul (carrière) | Sentir l'ancienneté | Arrivée discrète (4 px, 250 ms). Le joueur voyant ne la remarque probablement pas, ce qui est voulu (prompt 104). Les objets portent des fonctions (aide, micro, stress) : leur absence au début est-elle expliquée ? | Garder | P3 |
| Annonce « Nouveau sur votre bureau : {objets}. » | :69 · `bureau.nouveau` | Interface | Lecteur d'écran | Aria seulement : asymétrie avec les joueurs voyants. | À trancher (petite bulle visible) | P3 |

---

## Informations manquantes

1. **Lien décisions → données réelles de la semaine.** Le bilan de fin atteignable (mail + rapport) ne cite **aucun fait de
   la source** : ni pire retard, ni alerte météo, ni événement d'agenda marquant, ni ligne la plus touchée, ni crédit des
   sources. Tout cela n'existe que sur `dessinerFin`, qui est inatteignable. Les seuls faits réels cités sont les titres
   des décisions clés (tronqués). → déplacer `fin.pireRetard`, `fin.dossiers` et `fin.sources` (reformulé) sur la page 1.
2. **Le joueur comprend-il pourquoi il a perdu ?**
   - Pour un licenciement : plutôt oui (cause, avertissements datés, décisions coûteuses, conseil). Il manque le seuil
     franchi et le contexte réel qui a aggravé les effets.
   - Pour une **mauvaise fin de semaine** (< 150) : non. Le texte générique dit « demande des comptes sur les décisions
     listées », mais la décision listée comme « Pire » peut être un bon choix (tri par somme de deltas), et rien ne dit
     quelle jauge a coûté le plus ni quel malus revenait le plus (détail présent seulement sur `dessinerFin`).
3. **Seuils des fins et du licenciement au moment de décider.** 150 / 240 n'apparaissent que sur la courbe du Journal (vue
   Semaine). 120 / 90 / 45 ne sont visibles que dans le message « dernier avertissement ». Entre 120 et 150, on peut finir
   « mauvaise » sans aucun signal. Il manque une jauge de score avec ses seuils, ou au moins le score courant dans le
   bandeau.
4. **Écart du jour sur les jauges** (« fluidité −12 aujourd'hui ») dans le mail du soir : il n'existe que dans le Journal.
5. **Règles de contexte du moment** (pointe, météo dégradée, affluence ×1,25) visibles pendant la journée (constat 4).
6. **Étiquette « Fictif »** sur l'incident inventé partout où il est résumé (mail, carnet, rapport, game over, transition).
7. **Record battu** : calculé mais jamais affiché (§ 15).
8. **À la reprise d'une sauvegarde** : jour, objectif et état ne sont pas rappelés (§ 19).
9. **Compteur de semaine** (« dossiers restants cette semaine », jour n/N) hors de la transition : il n'existe que pendant
   la sieste.

## À trancher par le groupe

- **A1. L'écran `dessinerFin` (prompt 41 → 56).** Le supprimer et migrer ses informations Q52/Q53 (pire retard, types de
  dossiers avec « fictif », sources, record, deltas) dans le rapport papier, ou le rétablir comme écran final après le
  rapport ? *Alternative :* une 3ᵉ page « Sources et faits de la semaine » dans le rapport.
- **A2. Partir avant 20 h quand tout est traité.** (a) pas de blâme si `laisses = 0` ; (b) le bouton « Partir » devient
  « Finir la journée » ; (c) blâme maintenu mais texte honnête (« vous partez avant la fin du service »).
- **A3. Le fil de la journée (prompt 74).** Le rendre visible (bande sous la carte ou notifications) ou l'assumer comme
  « audio + lecteur d'écran » et supprimer les bips orphelins ?
- **A4. Nombre de bilans le soir.** Un seul écran du soir (récapitulatif + mail fusionnés), ou garder la chaîne rapport →
  XP → mail → nuit → noir → transition ? En `?expo=1`, sauter crépuscule, flèche et noir ?
- **A5. « Meilleure / Pire décision ».** Classer selon l'évaluation (bon / raté / trop tard) puis l'ampleur, plutôt que
  selon la somme brute des deltas ?
- **A6. La fin de la campagne.** Fondée sur la semaine 3 seule (actuel) ou sur le cumul ou la moyenne des 3 semaines,
  dont parle la lettre ?
- **A7. Rejouer une semaine en mode histoire** depuis le rapport (Q55), alors que le palmarès y invite ?
- **A8. Ton du mail du soir.** « Points à revoir » en rouge dès une seule décision imparfaite : faut-il un seuil (par
  exemple ≥ 80 % de bons choix = « Merci ») ?
- **A9. Vocabulaire et formats.** Choisir un terme unique (« signalement » ou « dossier »), un format d'heure (« 16 h 36 »
  ou « 16:36 ») et un format de date pour les bilans. Réserver « réel » aux données de la source.
- **A10. Documentation.** `jeu/04-jauges-et-fins.md` liste encore « Satisfaction usagers » comme jauge, alors que le jeu
  utilise Budget. Il faut mettre à jour le document verrouillé ou le noter comme dérogation.

## Constats transverses (3 à 6)

1. **La chaîne source → œuvre se casse à la fin.** Pendant la partie, chaque dossier cite sa source. Le bilan final
   atteignable ne cite plus aucune donnée réelle, emploie « réel » pour des statistiques de joueur, et ne marque pas
   l'incident fictif. Le seul écran honnête (`dessinerFin`) est inatteignable. **P1.**
2. **Le modèle de jeu a changé, pas les bilans.** Les familles de réponses (prompt 87), les équipes dès la semaine 1
   (prompt 108) et l'incident fictif (prompt 119) ont été ajoutés sans que les bilans suivent. Résultat : compteurs par
   action à 0, profils « retenue au terminus », « nouvel élément : équipes » en semaine 2, « aucun événement inventé ».
   Les textes de bilan sont des copies d'anciennes règles. **P1 / P2.**
3. **Ce qui aide à décider est caché, ce qui récompense est mis en avant.**
   - Caché ou relégué : les règles de contexte (fil invisible), les seuils de fin et de licenciement (Journal seulement),
     l'écart des jauges.
   - Mis en avant : « +85 XP » en 40 px vert, badge « 1 nouveau », tampon rouge permanent.

   La hiérarchie favorise la récompense plutôt que la compréhension. **P2.**
4. **Redondance non voulue en fin de journée et de semaine.**
   - Le fait marquant est dit 3 fois, les défis 4 fois, les jauges finales 3 fois, le profil 2 fois sur la même page.
   - Deux écrans noirs se suivent (« Fin de la journée » puis « JOUR n »).
   - Trois écrans s'appellent « fin de journée ».

   Chaque répétition coûte de l'attention au visiteur de 3 min. **P2.**
5. **Mise en page des bilans.** Les textes se chevauchent dans le Journal (vue Semaine, carnet) et sur le rapport page 2
   (« Équipes envoyées »), et les décisions clés sont tronquées sur le rapport page 1. Le relevé `?audit=textes` devrait
   couvrir la vue Semaine et la page 2. **P2.**
