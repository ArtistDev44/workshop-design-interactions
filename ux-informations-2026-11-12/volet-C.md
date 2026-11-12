# Revue UX : architecture d'information, volet C (bureau, OS, applis secondaires, téléphone, corps)

Date : 12/11/2026 · Méthode : skill `ux-questionner-informations` (inventaire → 8 questions → verdict + priorité).
Périmètre : la vue bureau et tout ce qui entoure l'appli de régulation. Hors périmètre : menu, intro, aide et
tutoriel, carte, panneau de décision, jauges du bandeau, fins de journée et bilans. Ils ne sont cités que
lorsqu'une information de mon volet les répète ou les contredit.

Observé sur le build servi (`http://localhost:8737/`, 1920×1080), en trois parcours :
1. `?expo=1` ;
2. premier lancement normal avec `?jours=9` (bureau complet) ;
3. même parcours, guide coupé, avec trois décisions puis Patron, Community, téléphone, café, store, dossiers,
   livre « stress », micro, webcam et sieste.

Captures dans `…/scratchpad/ux/C/` : `p2/`, `p3/`, `p4/`, `tabs.jpg`, `tel-tabs.jpg`. Semaine jouée : 14/09/2026.

Légende Origine : **API** = donnée réelle (Open Data NM, Open-Meteo, Hub'Eau, GTFS) · **Calcul** = calculé par le jeu ·
**Fiction** = fiction assumée · **Interface** = texte d'interface. P1 = gêne la décision ou trompe sur la source ·
P2 = coûte de l'attention sans rien rendre · P3 = finition.

---

## 1. Vue bureau : la pièce et la consigne du bas

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Baie vitrée : ciel, pluie, Loire, grue, péniche ; nuit et lumière selon l'heure | bureau.js:159-372 (pluie progressive, prompt 45 ; feu de grue la nuit, prompt 69) | API (météo du jour joué, `meteoFenetre`, immersion.js:69) + Fiction | Porter l'œuvre : la météo réelle du jour se voit sans lire | La pluie à l'écran annonce une météo aggravante (Q24), mais rien ne le dit. C'est le seul indice météo sans texte. | **Garder** : c'est l'information de la source la plus « œuvre » du jeu | — |
| Horloge murale analogique | bureau.js:456 (prompt 31), heure du jeu | Calcul | Situer la journée (8 h–20 h) ; objet « finir la journée » | Redondante avec l'étiquette numérique placée juste dessous | **Garder** (diégétique) | — |
| Étiquette numérique sous l'horloge « 10:05 », plus « ▶▶ ×100 » quand le temps est accéléré | bureau.js:970-980 | Calcul | Lire l'heure précise et savoir que le temps file | L'heure est aussi dans le bandeau (« ▶ 10:05 »), la barre des tâches, le téléphone et l'horloge analogique : jusqu'à 5 fois. Au focus clavier, l'infobulle « Horloge : finir sa journée » recouvre l'étiquette (p3, tab9). | **Garder** l'étiquette ; **Déplacer** l'infobulle de l'horloge sous l'étiquette | P3 |
| Consigne d'état en bas : « Incident en cours : cliquez sur l'écran du PC (Entrée) pour le traiter » | bureau.js:983 · `bureau.incident` | Interface | Ramener au poste quand un signalement attend | Juste et utile. Elle reste affichée pendant que la bulle du guide dit la même chose (p1 `02-esc1`) : doublon. | **Garder** ; masquer pendant une bulle du guide qui dit la même chose | P3 |
| « Un nouveau mail est arrivé sur le PC… » | bureau.js:987 · `bureau.mail` | Interface | Indiquer le mail du soir | — | **Garder** | — |
| « Journée finie : cliquez sur l'horloge murale pour partir (Tab pour la sélectionner) » | bureau.js:989 · `bureau.finJournee` (prompt 51) | Interface | Finir la journée | Redit dans l'écran de transition (« touche Q, ou l'horloge »). La redondance est voulue. | **Garder** | — |
| « Cliquez sur le PC ou Entrée pour vous installer · Tab : objets · Échap : menu » (et sa version mobile) | bureau.js:990-994 · `bureau.installer` / `installerMobile` | Interface | Apprendre les gestes du bureau | N'apparaît qu'après 10 s sans geste (prompt 124) : bon compromis | **Garder** | — |
| Badge rouge chiffré au coin de l'écran du PC (« 2 ») | multitache.js:251-257 (`badgeEcranBureau`, prompt 111) | Calcul | Signaler qu'il y a du nouveau au PC | Le chiffre additionne trois choses : nouveaux signalements, **messages du patron non lus** (de l'information) et plaintes (à faire). Le prompt 101, règle 6, réserve pourtant le badge « à ce qui est À FAIRE » (os.js:386-387). Au 1er jour, le « 2 » compte deux messages du patron alors que la consigne dit « Incident en cours ». | **Reformuler** : ne compter que ce qui est à faire (signalements, plaintes), comme `badgeIcone` | P2 |
| Bordure rouge pulsée de l'écran du PC | bureau.js:944, immersion.js:362-365 (retard ≥ 20 min ou phase conflit) | Calcul | Urgence | Les archives n'ont pas de minutes de retard (prompt 134). Hors temps réel, la bordure ne s'allume qu'en phase « conflit ». Le SMS 4 la promet pourtant comme signal d'urgence (voir § 8). | **Garder** le signal ; **Reformuler** la promesse du SMS | P2 |
| Bouton « Quitter le PC (Échap) », rouge primaire, en bas à droite (vue poste) | bureau.js:1019 · `poste.quitter_pc` (prompt 43) | Interface | Revenir au bureau | Le rouge primaire est la couleur de l'action principale (DESIGN.md). Ici, il pèse autant que « Valider » et attire l'œil pendant la décision. La molette et Échap suffisent à l'expert. | **Alléger** (contour) | P2 |
| Annonce « Bouton « Quitter le PC » : Entrée pour revenir au bureau » | bureau.js:1035 · `poste.quitter_pc_focus` | Interface (lecteur d'écran) | Clavier | — | **Garder** | — |
| Voyant vert sous l'écran (alimentation) | bureau.js (dessin du moniteur) | Fiction | Décor | Aucune information | **Garder** (décor, n'affirme rien) | — |

## 2. Objets du bureau : infobulles (ordre Tab) et messages de la pièce

Ordre Tab observé : écran → Aide → Stress → lampe → plante → café → téléphone → dossiers → fenêtre → horloge →
webcam → micro (`OBJETS_BUREAU`, immersion.js:39-56). Le cadre photo, les post-it et le rapport (absent de cette
partie) ne sont pas dans cette liste ou n'étaient pas visibles.

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| « Écran du PC » | immersion.js:41 · `objet.ecran` | Interface | Focus | — | **Garder** | — |
| « Livre « Aide » (tutoriel) — Entrée pour ouvrir » | immersion.js:42 · `objet.aide` + `objet.ouvrir` | Interface | Réapprendre les règles | — | **Garder** | — |
| « Livre « Bien gérer son stress » — Entrée pour ouvrir » ; contenu du livre (`stress.0-5`) | immersion.js:43, i18n.js:389-394 | Fiction / Interface | Ton (bien-être au poste) | Le contenu est **périmé**. « Le chrono est long pour les semaines faciles » : il n'y a plus de chrono depuis le prompt 87. « « ne rien faire » » : la réponse s'appelle « attendre » depuis le prompt 87. « Faire des pauses… (touche P), pas pendant : un incident ne se met pas en pause » : faux, l'horloge s'arrête pendant la lecture (prompt 87). Le livre donne donc de fausses règles. | **Reformuler** (aligner sur le prompt 87) | P2 |
| « Lampe — Entrée : allumer / éteindre » → « Lampe éteinte : seule la lumière de l'écran éclaire le bureau. » | immersion.js:45, :92-97 · `piece.lampe.*` (prompts 29, 51) | Interface / Fiction | Ambiance | Sans effet de jeu, ce qui est assumé | **Garder** | — |
| « Plante — Entrée : s'en occuper » → « Dehors, il est tombé {pluie} mm… » / « Un peu d'eau pour la plante. Il est {heure}. » | immersion.js:46, :112-113 | API (pluie du jour) + Fiction | Ambiance qui fait remonter la météo réelle | Ton juste. La pluie réelle est glissée dans un geste de soin. | **Garder** | — |
| « Café — Entrée : le boire (un par journée) » | immersion.js:47 · `piece.tasse.survol` | Interface | Café, voir § 4 | — | **Garder** | — |
| `piece.tasse.jour` / `piece.tasse.libre` (« Une gorgée de café. {heure} : {n} dossier(s) prévus ») | immersion.js:114-116 | Calcul | — | **Texte mort** : la tasse appelle `boireCafe()` avant `interagirPiece` (immersion.js:994) | **Supprimer** (clé morte) | P3 |
| « Téléphone — Entrée : voir les notifications · {n} non lue(s) » | immersion.js:49 · `objet.telephone.survol`, `tel.nonLues` | Calcul | Savoir s'il y a du neuf sur le téléphone | Le nombre est aussi donné par la pastille rouge sur le téléphone : redondance utile pour le clavier | **Garder** | — |
| « Dossiers — Entrée : feuilleter » → « Journée du 14/09/2026 : 5 dossier(s) **réels** à traiter. » | immersion.js:50, :117-119 · `piece.dossiers.jour` | Calcul | Annoncer la charge du jour | **Trompe sur la source.** Le compte inclut les événements de l'agenda, dont l'affluence est une hypothèse du jeu (grammar.md, prompt 134), et le possible incident **fictif** de la semaine (prompt 119, marqué « Fictif » partout ailleurs). Le même nombre apparaît dans la consigne du patron (« 5 dossier(s) attendus ») et dans `transition.prevus` (« signalement(s) réel(s) »). | **Reformuler** : « {n} dossier(s) : {r} faits réels, {a} affluences supposées, {f} fictif » | **P1** |
| « Fenêtre — Entrée : baisser / relever le store » → « Store baissé. Météo du 14/09/2026 à Nantes : 14,9 à 30 °C, pluie 0 mm, rafales 22,3 km/h (archive Open-Meteo de la semaine jouée). Heure réelle 16:38 · heure du jeu 12:11. » | immersion.js:51, :98-110 · `piece.fenetre.*`, `meteo.source.*`, `piece.fenetre.heures` (prompts 29, 49) | API (Open-Meteo, archive) + Calcul | Météo du jour **et** source révélée gratuitement dans l'enquête (`revelerSource('meteo', false)`, prompt 50) | Le meilleur exemple de vérité sur la source : date, valeurs et provenance. Mais l'effet (« la source Météo est maintenant révélée dans le dossier ») n'est jamais dit : le joueur ne sait pas que regarder dehors fait avancer son enquête. « Heure réelle / heure du jeu » sert le jury (archive contre maintenant), pas la décision. | **Garder** ; **Ajouter** une demi-phrase « source Météo ajoutée au dossier » quand un dossier est ouvert | P2 |
| « Horloge : finir sa journée » | immersion.js:52 · `objet.horloge.survol` | Interface | Partir | En pleine journée, le clic ouvre une confirmation « partir » (journee.js:19), ce qui est cohérent | **Garder** | — |
| « Webcam : montrez la main pour faire une sieste, montrez-la encore pour vous réveiller — rien n'est enregistré » | immersion.js:53 · `objet.webcam.survol` (prompts 57, 67) | Interface | Consentement et geste | L'infobulle, très longue (p3, tab10), dépasse au-dessus de l'écran. La mention « rien n'est enregistré » est essentielle. | **Garder** ; raccourcir (« Webcam : la main lance / arrête la sieste · rien n'est enregistré ») | P3 |
| « Micro (M maintenue) : après le café, soufflez pour calmer le cœur (et ralentir le compteur en défi chrono) » | immersion.js:54 · `objet.micro.survol` (prompt 54) | Interface | Geste | Hors défi chrono, la seconde moitié ne s'applique pas | **Reformuler** : n'afficher « (… défi chrono) » qu'en défi chrono | P3 |
| Message de pièce (bandeau noir près de l'objet, 5 s) + annonce aria | immersion.js:120-123 | — | Retour du geste | 5 s suffisent pour 1 ligne, pas pour le texte de la fenêtre (3 lignes, 50 mots) | **Reformuler** : durée selon la longueur (≈ 250 mots/min) | P3 |

## 3. Progression du bureau au fil des journées (prompt 104)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Apparition des objets selon les jours joués : tasse (1), Aide et plante (2), dossiers (3), micro (4), stress (5), post-it (6), cadre (8), la plante grandit (10) | progression-bureau.js:9, :33-37 | Calcul (carrière) | Ancienneté ressentie ; porter l'œuvre | Bonne idée : le temps passé se lit sans chiffre | **Garder** | — |
| Annonce « Nouveau sur votre bureau : le micro du poste. » | progression-bureau.js:69 · `bureau.nouveau`, `bureau.objet.*` | Interface (aria-live seulement) | Signaler un nouvel objet | Pour qui voit l'écran, seul un « posé » de 4 px pendant 250 ms marque l'arrivée. Or le micro (jour 4) et le livre stress (jour 5) ont une **fonction**. Le joueur voyant ne l'apprend pas. | **Ajouter** un message de pièce visible (le même texte, 5 s) à l'arrivée d'un objet utilisable | P2 |
| Post-it, cadre photo de dos | progression-bureau.js:74-98 | Fiction | Décor narratif | Non focalisables, sans texte. Le cadre de dos laisse la place à l'imagination. | **Garder** | — |

## 4. Café, cœur et micro (prompts 52, 54, 78)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| La tasse en main (pixel art, gorgée de 2,8 s), puis effet « boost » : vignette rosée, traits, battements de cœur sonores, léger surcadrage | cafe.js:53-230 | Fiction | Ressentir l'adrénaline | Fort, lisible, sans flash. Porte l'œuvre : le corps du régulateur. | **Garder** | — |
| « Le café fait effet : le cœur s'accélère. Pendant quelques secondes, consulter une source ne coûte pas de temps. » | cafe.js:37 · `cafe.boost` | Interface | Dire l'effet | **Promesse vide par défaut.** Une source ne coûte du temps qu'en défi chrono (enquete.js:51). L'effet réel, somnolence −30 (cafe.js:33, prompt 78), n'est pas dit. | **Reformuler** : « … la somnolence redescend » ; la phrase sur les sources seulement en défi chrono | P2 |
| « La tasse est vide : un seul café par journée. » | cafe.js:19 · `cafe.vide` | Interface | Règle | — | **Garder** | — |
| Panneau « MICRO · souffle » : barres « amplitude / hauteur / souffle » ; « MICRO INDISPONIBLE » | micro.js:191-221 | Calcul (capteur) | Retour du souffle | Vocabulaire de technicien (« hauteur » = fréquence ?). Le joueur veut savoir s'il souffle assez et si le cœur ralentit. | **Reformuler** : une seule barre « souffle » et la tendance du cœur (bpm ▼) | P2 |
| « Micro ouvert : soufflez doucement pour calmer votre cœur après le café. » / « Micro fermé. » / « Vous respirez : le cœur ralentit… » / « Micro indisponible… (rien d'autre ne change) » / « Le micro est désactivé (Paramètres → Accessibilité). » | micro.js:67-252 | Interface | Retour et repli | Le repli honnête (« rien d'autre ne change ») est bien fait | **Garder** | — |

## 5. Somnolence, sieste, réveil, webcam et main (prompts 57, 67, 78)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Jauge « Somnolence 9 · Z » (bas droite du poste) ; variante « Somnolence {v} / seuil 70 · Z » + ⚠ | sieste.js:143 · `sieste.jauge` / `jaugeSeuil` | Calcul | Montrer quand la sieste forcée approche ; raccourci Z | Toujours visible pendant la décision, sous le panneau des équipes. Sa valeur (9) ne change rien à la décision en cours. | **Alléger** : n'afficher le chiffre qu'au-delà de 50, sinon la barre seule | P2 |
| Aide de la jauge : « Clic ou Z : se reposer… les signalements continuent d'arriver et **ceux qui expirent sont perdus**. » ; « Vous fermez les yeux… ceux qui expirent sont perdus. » | sieste.js:154 · `sieste.aide`, `sieste.volontaire` | Interface | Dire le prix de la sieste | **Faux hors défi chrono.** Depuis le prompt 87, rien n'expire en cours de journée (multitache.js:140 : `if (!Jeu.defiChrono) return`), et l'horloge est bloquée à la fin de service tant qu'il reste des signalements (immersion.js:277). La sieste devient une avance rapide gratuite, présentée comme risquée. L'étape 3/8 du guide reprend la même phrase (vu en `?expo=1`). | **Reformuler** selon le mode, ou rendre un vrai coût à la sieste : **À trancher** | **P1** |
| « Somnolence à 100 : vous vous endormez. Réveillez-vous (Espace) pour agir. » | i18n.js:1213 · `sieste.forcee` | Interface | Sieste forcée | — | **Garder** | — |
| « Pas maintenant : on ne peut pas se reposer pendant une narration, une fenêtre ou en fin de journée. » | sieste.js:48 · `sieste.impossible` | Interface | Refus explicite | Z après une décision restait sans effet visible (p4, `22-sieste`) : l'annonce existe, mais aucun texte n'apparaît à l'écran | **Ajouter** un message visible (même texte) | P3 |
| « Surv. : Zzz… vous somnolez au bureau. » ; paupières qui se ferment | immersion.js:418 · `surv.sieste` (prompt 65) | Fiction | Ressenti | — | **Garder** | — |
| Alerte de réveil : « Alerte ! Un incident arrive » · « {s} s pour réagir » · « Se réveiller (Espace) » | immersion.js:790-796 · `reveil.*` | Calcul | Réagir à un incident grave pendant la sieste | Un compte à rebours en secondes, alors que l'intro dit « pas de chrono ». Il est justifié (fenêtre de 3 s, prompt 87), mais le texte devrait dire ce que coûte un réveil raté. | **Reformuler** : « … sinon −{malus} » | P3 |
| Notification « Bilan de la sieste » : « Sieste : {durée} de journée passée, {n} signalement(s) arrivé(s), {e} expiré(s) sans réponse ; Fluidité +0… » | sieste.js:74-76 · `sieste.bilan` | Calcul | Résumer ce qu'a coûté la sieste | « expiré(s) » vaut toujours 0 hors défi chrono, ce qui confirme le point P1 ci-dessus | **Reformuler** (taire « expirés » hors défi chrono) | P3 |
| « Pendant votre sieste, les équipes en route sont arrivées. Prochain signalement attendu : {type} vers {heure}. » | sieste.js:90 · `sieste.prevision` | Calcul | Anticiper | Utile : la seule prévision du jeu. Elle donne pourtant l'avenir du paquet, que le joueur ne voit nulle part ailleurs. | **Garder** | — |
| Webcam : LED rouge (filme), verte (main vue) | webcam.js:120-128 | Calcul | Témoin de captation | La LED fait 1 pixel art (~4 px). Au poste, la webcam est hors cadre, en haut et coupée (p1, `01-poste`). | voir ligne suivante | — |
| Indicateur « ● CAM » dans la barre des tâches | webcam.js:131-137 · `webcam.barre`, appelé par os.js:225 | Interface | Montrer que la caméra est active | La barre des tâches n'est dessinée que sur le bureau RégulOS (os.js:141). Dans l'appli intégrée (prompt 103), où l'on passe 90 % du temps, **aucun témoin lisible ne dit que la caméra filme**. C'est une information de consentement. Elle compte d'autant plus en exposition, devant un public. | **Déplacer** le témoin « ● CAM » dans un coin fixe, visible dans toutes les vues | **P1** (confiance, hors grille) |
| « Webcam active : montrez la main… Rien n'est enregistré ni envoyé. » / « Webcam coupée. » / « Webcam indisponible : la sieste ne dépend que de l'inactivité. » / « Main vue par la webcam : vous faites une sieste… » | webcam.js:35-67, :192-193 | Interface | Retour et repli | « ne dépend que de l'inactivité » est **faux** depuis le prompt 78 : la sieste tombe quand la somnolence est pleine, l'inactivité n'en est qu'une composante | **Reformuler** : « … la sieste se lance au clavier (Z) ou d'elle-même » | P3 |

## 6. Démarrage du PC et RégulOS (jours 1 à 3 ; jamais en exposition, prompt 132)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Lignes BIOS « REGUL-BIOS v1.07 — Poste de régulation n°3 · Processeur…OK · Mémoire 4096 Mo…OK · Réseau salle…OK · Démarrage du système… » | os.js:273 · `os.bios.0-4` | Fiction | Rituel d'arrivée au poste | 1,2 s, illisible à cette vitesse (p3, `01-boot`), mais c'est un décor. Il ne revient pas après le jour 3. | **Garder** | — |
| Logo, « RegulOS », barre de progression | os.js:276-300 | Fiction | Rituel | Écrit en dur, sans accent, alors que l'interface dit partout « RégulOS » | **Reformuler** (« RégulOS ») | P3 |
| « BIENVENUE » | os.js:306 · `os.bienvenue` | Fiction | Rituel | — | **Garder** | — |
| Bureau RégulOS : une seule icône « Signalements » avec badge « ! » | os.js:106-136 (prompt 103 : une seule appli ; prompt 68 : « ! » si incident) | Calcul | Entrer dans l'appli | Simple et clair. Le « ! » est répété sur l'icône de la barre. | **Garder** | — |
| Barre des tâches : bouton d'accueil (logo), icône Signalements « ! », « Budget 60 · Réputation 50 · Fluidité 50 », heure « 10:01 » | os.js:196-229 · `os.jauges` | Calcul | Résumé avant d'ouvrir l'appli | L'ordre (Budget · Réputation · Fluidité) est **inverse** de celui du bandeau (Fluidité · Réputation · Budget). Vu une seconde, au démarrage seulement. | **Reformuler** : même ordre que le bandeau | P3 |
| « Tab : icônes · Entrée : ouvrir · Échap : fermer / se lever » | os.js:229 · `os.aideClavier` | Interface | Clavier | Hors partie seulement | **Garder** | — |
| Infobulle « Accueil de RégulOS (clic, ou Tab puis Entrée) » ; annonce « Accueil de RégulOS : vos applications. » | os.js:254-266 (prompt 75) | Interface | Revenir à l'accueil | — | **Garder** | — |
| Titre de fenêtre « SIGNALEMENTS · RÉGULATION NANTES » / « RégulOS · poste 3 » | os.js:334-335 | Fiction | Situer (hors partie) | « poste 3 » est un détail qui fait monde, repris dans le mail « À : régulateur · poste 3 » | **Garder** | — |
| Fenêtre « Votre poste : opérateur de régulation » (1re ouverture) : rôle, 4 gestes (Clic, 1 à 4, Glisser, Menu), « Aucune action n'est bonne partout : enquêtez (sources 5 à 8)… » | immersion.js:1155-1206 · `poste.*` (prompt 131) | Interface | Poser le rôle et les gestes | Le texte visible est juste et sobre. « Les chiffres rouges comptent les nouveautés » contredit pourtant le prompt 101 (règle 6 : badge = à faire) ; c'est le code qui varie (§ 1). | **Garder** | — |
| **Annonce lecteur d'écran** de cette fenêtre | immersion.js:1159 : `['devier','retenir','renfort','rien'].map(t('action.desc.'+a))` | Interface | Accessibilité | **Fausse.** Elle lit « Dévier… Retenir… Renfort… Ne rien faire… », l'ancienne table Q5–Q7, alors que l'écran montre les 4 gestes du prompt 131. Un joueur non voyant reçoit d'autres règles que le joueur voyant. | **Reformuler** : annoncer `poste.geste.*` | **P1** |
| Applis verrouillées : voile, cadenas, « Disponible à partir de la semaine {n} », « {appli} est verrouillée… », carte « Nouvelle appli : … » + une phrase | applis.js:24-93 · `applis.*` (prompt 91 § 2, **option désactivée par défaut**) | Interface | Montée en charge progressive | Option pertinente contre la surcharge (voir constats). `applis.intro.indicateurs` parle d'une appli retirée au prompt 103. | **À trancher** (activer ?) ; mettre `applis.intro.indicateurs` à jour | P3 |
| « Ouverture : {appli}. Échap pour revenir. » / « Retour : {appli}. » | applis.js:120-132 (prompt 91 § 3) | Interface | Pile de navigation | — | **Garder** | — |

## 7. Notifications et badges système (multitâche, prompts 77 et 111)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Badges rouges chiffrés du menu gauche : Patron « 2 », Community « 1 → 4 » | multitache.js:171-180 (`nombreBadge`) ; rendu menu-app.js | Calcul | Dire où agir | Patron compte les **messages non lus**, de l'information, ce qui contredit le prompt 101 règle 6 et `badgeIcone` (os.js:384-393). Community compte `max(non lus, plaintes en attente)`. Au 1er écran, « Patron 2 » tire l'œil avant le premier signalement. | **Reformuler** : Patron sans badge chiffré (point discret), Community = plaintes en attente seulement | P2 |
| Annonces aria-live : « Nouveau signalement : {type} · {gravité} · {lignes} », « Mail du patron : {extrait} », « Community : un usager se plaint : {extrait} », « {équipe} : intervention terminée », « Signalement réglé sans vous » | multitache.js:129-225 · `notif.*` | Calcul | Équivalent sonore des badges | Les cartes visuelles ont été supprimées (prompt 111). Le lecteur d'écran reçoit plus d'interruptions que l'œil. « Signalement réglé sans vous » n'arrive qu'en défi chrono : cohérent. | **Garder** ; **Alléger** les annonces Patron (info) pendant un dossier ouvert | P3 |
| « Déjà {n} signalements actifs : traitez-en un avant d'en prendre un autre. » / « Signalement actif : {quoi}, {s} s au compteur. » | multitache.js:66-83 · `multi.*` | Calcul | Limite de 3 actifs | Le compteur en secondes n'existe qu'en défi chrono. La variante sans secondes (`multi.selectionSans`) existe : bien. | **Garder** | — |
| « Retour de {auteur} : {texte} Signalement terminé. » | multitache.js:211 · `annonce.retour` (prompt 121) | Fiction (auteur) + Calcul | Clore un signalement | — | **Garder** | — |

## 8. Téléphone : SMS d'intro, centre de notifications, agenda, « En direct »

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Conversation « Camille · cheffe de salle / Salle de régulation », 6 bulles, téléphone en main | telephone-main.js:98-190, immersion.js:18-25 · `sms.0-5` (prompts 42, 131) | Fiction | Poser le rôle par une voix | Belle mise en scène. Elle ne passe pas en exposition (vu `?expo=1` : directement au poste). | **Garder** | — |
| `sms.2` « …Pas de chrono, prends le temps de lire. » | i18n.js:385 | Interface (fiction) | Rassurer | Vrai pour le dossier. Mais les plaintes Community ont un délai de 45 s (« répondre dans 29 s », prompts 79 et 131) et le réveil compte des secondes. Le joueur qui prend son temps perd de la réputation sans avoir été prévenu. | **Reformuler** : « Pas de chrono sur les dossiers ; sur Community, les usagers attendent une réponse rapide. » | P2 |
| `sms.4` « Si l'écran du PC clignote en rouge, c'est urgent… » | i18n.js:387 | Interface (fiction) | Apprendre un signal | Le signal promis ne s'allume presque jamais en archive (§ 1) : on attend un signal qui ne viendra pas | **Reformuler** : promettre le signal réellement vu (badge rouge et « ! ») | P2 |
| « Clic ou Entrée : message suivant · Échap : tout passer » / « Poser le téléphone (Entrée) » | telephone-main.js:184-187 | Interface | Contrôle | — | **Garder** | — |
| Téléphone posé : écran allumé, vibration de 2 px, pastille rouge | notifs-tel.js:171-176 | Calcul | Signaler une notification sans couper | Bonne hiérarchie : discret, diégétique, coupé pendant un dossier ouvert (prompt 87) | **Garder** | — |
| Écran verrouillé : grande heure « 12:04 », date « 14 septembre 2026 », fond pluie / nuit | notifs-tel.js:178-200 | Calcul + API (météo du jour) | Situer | Cinquième horloge. La date de la semaine archivée est une vérité utile (« on rejoue le 14/09 »). | **Garder** | — |
| Onglets « Notifications · Agenda · En direct » ; « Ne pas déranger : non » ; « Fermer (Échap) » | notifs-tel.js:205-213 | Interface | Naviguer | Les flèches ne changent pas d'onglet (essayé : seuls Tab et le clic marchent). C'est attendu sur un téléphone. | **Garder** | P3 |
| Carte « Quai · 11h49 · • — 2 plainte(s) en attente sur @regul.nte. » + « × » | notifs-tel.js:238-297 · `tel.n.quai` | Calcul | Rappeler les plaintes | Troisième endroit qui dit « 2 plaintes » : badge Community, onglet « Mentions · 2 », téléphone | **Fusionner** : sur le téléphone, ne garder Quai que si Community n'a pas été ouvert depuis | P3 |
| « +1 autres » / « Tout effacer » | notifs-tel.js:291-292 · `tel.autres`, `tel.toutEffacer` | Interface | Groupes | Faute d'accord : « +1 autres » | **Reformuler** (« +1 autre ») | P3 |
| Notifications prévues : Météo (vent ≥ 40, pluie ≥ 1, gel), Info travaux (changelog), Agenda (1 h avant l'affluence), Loire (Hub'Eau, médiane de la période), Messages (Camille, chauffeurs), Rappels (fin de service −1 h, rapport −20 min), Régul' (jauge < 30, objectif atteint, équipe sur place, avertissement, badge) | notifs-tel.js:28-115 · `tel.n.*` (prompt 90) ; data/messages.json `telephone` | API + Calcul + Fiction | Un fil vivant ; certaines notifications révèlent une source gratuitement quand on les ouvre pendant un dossier (`ouvrirNotifTel`, prompt 50) | Le cœur du téléphone **sert la décision**, parce qu'ouvrir une notification révèle une source gratuitement, mais le joueur ne le sait pas. La notification Loire (médiane sur toute la période des relevés, pas le jour joué) n'éclaire aucune décision. « Ça va chauffer vers 16 h 30 » (Camille, crise) est une heure écrite en dur, qui peut contredire l'heure réelle de la crise. | **Garder** le fil ; **Ajouter** « → révèle la source Météo » sur les cartes concernées ; **Alléger** Loire (ambiance) ; **Reformuler** le modèle « 16 h 30 » | P2 |
| Chauffeurs « Ligne {ligne} : on accumule du retard, {retard} min annoncées » | data/messages.json `telephone.chauffeur` | Fiction déclenchée par un dossier réel | Donner une voix au terrain | Le type « ligne en difficulté » n'existe qu'en temps réel, où le retard est connu : pas de « null » en archive. Les variantes « perturbation » citent la vraie nature : bien. Rien ne dit que le chauffeur est un personnage. | **Garder** | — |
| Ouvrir un SMS de **Camille** ouvre l'appli **Patron** | notifs-tel.js:404-410 (`cible.messages`) | Interface | Navigation | Camille (cheffe de salle) n'est pas le patron (la direction) : le joueur atterrit chez quelqu'un d'autre | **Reformuler** : rester dans le téléphone (fil Camille) | P2 |
| Onglet Agenda : 4 événements (titre, type, lieu, heure) + « Source : Agenda des événements, Open Data Nantes Métropole (en direct / instantané local de la semaine) » | telephone.js:36-67, notifs-tel.js:301-330 · `tel.source.*` (prompt 38) | API | Voir l'agenda du jour, ce qui révèle aussi la source Agenda du dossier (telephone.js:77) | **Trompe sur la date en repli.** Si l'API ne renvoie rien pour la date, `notifsRepli` prend les événements de **toute la semaine** (`duJour.length ? duJour : sources`, telephone.js:31) et les affiche sous la date du jour, sans leur date. | **Reformuler** : en repli, n'afficher que le jour, sinon « aucun événement » ; ou afficher la date de chaque événement | **P1** |
| Onglet « En direct » : « En direct aujourd'hui (Open Data Nantes Métropole) — Données d'aujourd'hui, pas de la semaine jouée » ; Parkings, Vélos, Trafic routier, Pollens « relevé à {heure} » | notifs-tel.js:332-388 · `tel.directTitre`, `tel.pasSemaine`, `tel.releve` | API (en direct, au clic) | Montrer le flux vivant à côté de l'archive | Étiquetage exemplaire. Ces relevés n'éclairent aucune décision d'une semaine archivée. Ils portent l'œuvre (la ville continue pendant qu'on rejoue le passé) et servent le jury. | **Garder**, mais **Différer** : ne montrer l'onglet qu'après le 1er jour | P3 |
| « Chargement des notifications… » / « Aucune notification : pas d'événement publié pour ce jour. » / « Aucune notification pour l'instant. » | telephone.js:104-107, notifs-tel.js:245 | Interface | États vides | — | **Garder** | — |

## 9. Community : réseau « Quai », compte @regul.nte, plaintes (prompts 79, 85, 101)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| En-tête : bannière, avatar, « Régul' Nantes · salle de contrôle · compte de service », « @regul.nte · réseau Quai (fictif) » | community.js:173-184 · `commu.nom`, `commu.reseau`, `commu.service` | Fiction assumée | Situer la fiction | « (fictif) » est bien visible. La bannière occupe 52 px de haut pour rien. | **Garder** | — |
| Onglets « Fil · Mentions · 2 · Messagerie · Statistiques » | community.js:200-209 | Calcul | Naviguer ; le compteur dit ce qui attend | — | **Garder** | — |
| « Vue grille › » / « Publier une info trafic › » | community.js:274-277 | Interface | Publier sur le dernier dossier traité | « Publier » existe aussi dans le dossier (B) et dans la tâche « Rédiger l'info trafic » (§ 11) : trois chemins pour un même geste | **Fusionner** (un seul chemin : depuis le dossier) | P2 |
| « Choisissez un modèle (1 à 3) : cohérent avec votre décision → réputation +1, sinon −2. » + 3 modèles | community.js:281-290 · `commu.publierAide`, `commu.info.*` | Interface + Calcul | Publier | La règle est dite avant le choix : bien | **Garder** | — |
| Post : photo pixel, heure, texte « Ligne 1 : Calmer la situation. », « ♥ 59 », « 2 commentaire(s) », « → Voir le dossier » | community.js:318-368 ; game.js:1550-1566 (`postsPartie`) | Calcul (texte = votre réponse) + Fiction (photo, likes) | Montrer la trace publique de la décision | **Fictif non marqué.** Ce post et ses plaintes portent sur l'incident inventé (bagarre ligne 1, prompt 119), qui doit être « toujours marqué Fictif ». Ici, aucune mention : ni le post, ni la plainte (« Ça se bat dans le tram… »), ni le téléphone. | **Ajouter** l'étiquette « Fictif » sur les posts, plaintes et notifications liés à un dossier `fictif` | **P1** |
| « ♥ {likes} » et « {abonnés} abonnés ▲ », calculés depuis la réputation | game.js:1560 ; community.js:186-191 | Calcul | Retour social | Une mention honnête existe, mais seulement dans Statistiques : « Abonnés et « j'aime » sont des valeurs de jeu dérivées de la réputation, pas des chiffres réels. » | **Garder** ; recopier la mention au survol de « ♥ » | P3 |
| Posts d'archive « archive du {date} » : faits réels de la semaine précédente | game.js:1569-1592 · `post.archive.*` | API (archive) | Épaissir le fil sans inventer | Bien sourcé. Une affluence d'archive (« pensez à anticiper vos trajets ») reste une hypothèse. | **Garder** | — |
| Plainte sous un post ou en mention : pseudo, heure, texte, « répondre dans 38 s », 2 réponses numérotées, « Transmettre au patron » | community.js:423-466 · `plainte.delai`, `commu.transmettre` | Fiction (data/messages.json `plaintes`) + Calcul (délai 45 s, prompts 79 et 131) | Gérer la réputation en temps limité | **Doublon de décision.** La même plainte (@coincee_dans_la_foule, même texte) est le « plaignant » du dossier, auquel on répond par 1 à 4 (p4, `00-decision`), **et** une mention Community avec son propre délai, ses propres réponses et son propre effet (game.js:1403-1418). On répond deux fois au même usager ; la seconde réponse est chronométrée en secondes réelles pendant qu'on lit le dossier « sans chrono ». | **À trancher** : fusionner (répondre au plaignant du dossier clôt la mention) ou rendre les deux voix distinctes | **P1** |
| Le texte des plaintes d'affluence affirme la foule (« On est serrés comme des s@#!nes ») pour un « Stage - Atelier - Activité à partager » | data/messages.json `plaintes` ; game.js:1407-1414 | Fiction qui affirme une hypothèse | Faire vivre la conséquence | grammar.md (prompt 134) : l'affluence est une **hypothèse du jeu**. Une voix d'usager la transforme en fait observé, sur un atelier de quelques personnes. Le joueur ne peut pas douter. | **Reformuler** les modèles d'affluence au conditionnel ou au doute (« ça risque d'être plein ? ») ; ou **À trancher** | P2 |
| « Restée sans réponse : le ton est monté. » / « Transmis au patron. » / « Réponse tardive : réputation −3. » / retour « bonne / mauvaise » + effets chiffrés | community.js:449-452 ; os.js:485-498 · `plainte.*` | Calcul | Retour de la réponse | Le retour chiffré (« réputation +2 ») est juste après le geste : bien | **Garder** | — |
| « Mentions à traiter : {n}. Répondez vite (délai affiché). » | community.js:475 | Interface | Consigne | — | **Garder** | — |
| Commentaires réactifs « Bien vu pour Ligne 1… », « …c'était réglé en 10:01, merci la régul 👍 » « +2 rép. » | community.js:383-400 · `com.*` (i18n.js:95) | Fiction | Retour social | « réglé **en** 10:01 » : une heure lue comme une durée. L'emoji dépend de la police système. « +2 rép. » est ambigu (réputation ou réponses ?). | **Reformuler** (« réglé dès 10:01 », « réputation +2 ») | P3 |
| « {auteur} écrit… » | community.js:387 | Fiction | Vie | — | **Garder** | — |
| Colonne « Ce qui se passe à Nantes » : « Météo du jour : 14.9 à 30 °C, 0 mm », événements, « Comptes cités » | community.js:529-560 · `commu.meteo`, `commu.cites` | API (météo, agenda) + Fiction (comptes) | Contexte | Point décimal anglais (« 14.9 » ; `nombreFr` n'est pas utilisé). « Comptes cités » (4 pseudos · 1) n'aide aucune décision. | **Reformuler** la virgule ; **Supprimer** « Comptes cités » | P3 |
| Statistiques : « Réputation actuelle : 70/100 — chaque commentaire la fait évoluer. », « plaintes traitées : 0/2 », « Réponses à temps 0 · tardives 0 · restées sans réponse 0 », « Réactions reçues : 0 », « Réponses jugées bonnes : 0 », compteurs « 2 publications · 1680 abonnés ▲ · réponses 0/2 », bio « … Fiction de jeu. » | community.js:519-527, :191-192 | Calcul | Bilan social | « réponses 0/2 » et « plaintes traitées : 0/2 » disent la même chose sur le même écran. La réputation est déjà dans le bandeau. | **Fusionner** les deux compteurs ; **Supprimer** la ligne réputation | P3 |
| Messagerie privée : « Aucun message privé pour l'instant. » | community.js:489-492 | Fiction | Plaintes privées | — | **Garder** | — |
| Brouillon « Info trafic · {ligne} · {cause} · {durée}. Merci de votre patience. » — « faits du dossier, à vérifier avant d'envoyer » | community.js:592-620 · `commu.brouillon.*` (prompt 91 § 3) | Calcul (faits du dossier) | Publier vite et juste | « à vérifier avant d'envoyer » invite à la vérification : porte la chaîne source → œuvre | **Garder** | — |
| Corbeille « Plaintes déjà traitées : {n}… vider ne change ni les jauges ni le bilan. » | os.js:512-541 · `app.corbeille.*` | Interface | Relire ses réponses | Retirée du PC au prompt 103 : code mort côté partie ? | **Supprimer** si plus accessible | P3 |

## 10. Messagerie du patron (prompt 86)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| En-tête « Direction de la régulation », avatar, « ■ en ligne » / « hors ligne » | patron.js:102-108 | Fiction | Statut ; « hors ligne » pendant la panne de messagerie (modificateur) | « en ligne » n'apporte rien, sauf en cas de panne | **Alléger** : n'afficher le statut que pendant la panne | P3 |
| Filtres « Tout 3 › · Consignes › · Alertes › · Reproches › · Budget › » | patron.js:9-15, :109-121 | Interface | Trier | Pour 2 à 3 messages par jour, 5 filtres coûtent plus qu'ils ne rendent. Les chevrons « › » suggèrent une navigation. | **Alléger** : filtres seulement au-delà de ~8 messages | P3 |
| Bandeau « Connexion perdue — reconnexion dans {s} s » | patron.js:127 | Calcul (modificateur) | Panne | — | **Garder** | — |
| Épinglé « Consigne du jour · Bonjour. 5 dossier(s) attendus aujourd'hui (14/09/2026). Objectif : Garder la fluidité ≥ 40. … » | patron.js:132-145 · `patron.consigne`, `patron.epingle` | Calcul | Objectif et charge du jour | Même problème « 5 dossiers » qu'au § 2. L'objectif est redit dans le bandeau (« Objectif : Garder la fluidité ≥ 40 (50) »). | **Garder** l'épingle ; voir P1 du § 2 pour le compte | P2 |
| Séparateur « Lundi 14 septembre 2026 » ; « Nouveaux messages » | patron.js:198, :242-251 | Calcul | Se repérer | — | **Garder** | — |
| Carte « INFO 08:00 — Défis de la semaine : Zéro dossier non traité · Toutes les plaintes répondues · Budget ≥ 60 en fin de semaine. Chaque défi tenu rapportera +5… » | patron.js:253-296 · `patron.defis` | Calcul | Objectifs de la semaine | Une **troisième couche d'objectifs** (avec les priorités du jour et l'objectif du jour). « Budget ≥ 60 » quand le budget de départ est 60 et la priorité du jour « budget ≥ 40 » : deux seuils différents pour la même jauge. Voir les constats. | **Fusionner** ou **À trancher** | **P1** |
| « INFO 11:49 — Patron : deux bonnes décisions d'affilée, continuez comme ça. » | i18n.js:1157 · `serie.bravo.0` | Calcul | Encourager | « Patron : » répété dans la messagerie du patron | **Reformuler** (retirer le préfixe) | P3 |
| Accusés « Lu · 11h54 » / « Envoyé » / « Vu ✓ » ; « Direction écrit… » | patron.js:210-216, :288 | Fiction | Imiter une messagerie | Ces marqueurs ne servent aucune décision, mais ils rendent la hiérarchie présente (on est lu). « Lu » écrit en « 11h54 », le bandeau en « 11:55 » : deux formats d'heure. | **Garder** ; harmoniser le format d'heure | P3 |
| Blocs enrichis : puces « Objectif {o} · Budget {b} · {n} dossier(s) attendu(s) · {mod} · {a} indisponible », mini-jauges, « Score de la salle », « il fallait : {a} », « Budget {b} / 100 », palier | patron.js:297-349 | Calcul | Expliquer reproches et budget | « il fallait : {a} » est l'information la plus pédagogique du jeu (la meilleure réponse). Elle est rangée dans un bloc replié (prompt 101). Les mini-jauges redoublent le bandeau. | **Garder** « il fallait » et le **Déplacer** vers le retour de décision ; **Supprimer** les mini-jauges | P2 |
| « Dossier lié : {r} » · « Voir le dossier » · « Détails » | patron.js:302-311 | Interface | Lien croisé (prompt 91 § 3) | — | **Garder** | — |
| Réponses rapides « 1 Bien reçu › » (sans effet de jeu) | patron.js:367-389 · `patron.rapide.*` | Fiction | Répondre | Un bouton numéroté « 1 » ressemble aux réponses du dossier, qui ont un effet. Celui-ci n'en a pas, et rien ne le dit. | **Reformuler** : « (sans effet) » au survol, ou retirer le numéro | P3 |

## 11. Tâches : briefing, événement à préparer, info trafic, arbitrage, inspection (prompts 88 et 91)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Fenêtre « PRÉPARER UN ÉVÉNEMENT » : « L'agenda annonce un événement aujourd'hui : préparez-vous avant l'affluence. » + exemple chiffré + « Agenda du jour : « Le livre d'artiste concours et exposition - Musée de l'imprimerie ». **L'affluence est attendue vers 13h00.** » + 3 choix (−3 de budget) | taches-ui.js:53-121, :298 · `tache.intro.evenement`, `tache.prep.*` ; taches.js:623 | API (nom de l'événement) + Calcul (heure) + **hypothèse** | Dépenser du budget avant l'affluence | **Hypothèse présentée comme fait.** « L'affluence est attendue » ne dit pas que la foule est une supposition du jeu (grammar.md). Pour une expo au Musée de l'imprimerie, le joueur ne peut pas peser la vraisemblance. La fenêtre arrive au milieu du 1er dossier, avant toute décision (p4, `01-apres1-0`). | **Reformuler** : « Le jeu suppose une affluence vers 13h00 (hypothèse : l'agenda dit seulement que l'événement a lieu) » | **P1** |
| « Exemple : pré-positionner une équipe de police coûte 3… réputation +3. » | i18n.js:1604 · `tache.exemple.evenement` | Interface | Rendre la règle explicite | Bonne pratique : l'effet est dit avant le choix | **Garder** | — |
| « 1 à 3 : choisir · Entrée : valider · Échap : ne rien préparer. » + « Passer (Échap) » / « Valider (Entrée) » | taches-ui.js:212-214 · `tache.consigne.*` | Interface | Clavier | — | **Garder** | — |
| Briefing du matin : « Choisissez 2 priorités », météo « {min} à {max} °C, {pluie} mm, rafales {vent} km/h », « Agenda : {n} événement(s)… dont « {nom} » », « Travaux… annoncés aujourd'hui : {n} » ; ou « Priorités imposées pour aujourd'hui : {liste}. » | taches-ui.js:226-228, taches.js:277-311 · `tache.briefing.*`, `tache.prio.*` | API + Calcul | Choisir où mettre l'attention | Le meilleur résumé de la source du jour (météo, agenda, travaux, tous réels). Il sert pourtant d'abord un système de priorités (+2 le soir) qui s'empile sur l'objectif du jour et les défis. | **Garder** le résumé de la source ; **À trancher** : priorités du jour **ou** objectif du jour | P2 |
| « Cellule de crise ouverte cet après-midi : {n} signalement(s)… Objectif : aucun signalement non traité. Réussi : réputation +3. » | taches.js:426 · `crise.annonce` | Calcul | Journée spéciale | Un objectif de plus. Le SMS de Camille fixe « vers 16 h 30 », écrit en dur dans le modèle. | **Garder** ; aligner l'heure sur le calcul | P3 |
| Info trafic : blocs « Ligne · Cause · Durée estimée · Alternative », causes « Retard mesuré / Affluence : {nom} / Alerte météo : {nature} », « Ligne non précisée », « Durée inconnue », « Un usager le signale sur Community. » | taches.js:437-477, taches-ui.js:90-103, :321-326 · `tache.info.*`, `tache.cause.*` | API (faits du dossier) + Calcul | Informer les voyageurs exactement | « Retard mesuré » comme cause n'est vrai qu'en temps réel (archives sans minutes, prompt 134). « Affluence : {nom} » répète l'hypothèse comme une cause. | **Reformuler** « Affluence supposée : {nom} » ; ne proposer « Retard mesuré » que s'il y a un retard | P2 |
| Conséquence en chaîne : « ligne saturée (conséquence de jeu) », « Conséquence de jeu de votre décision de {heure} (pas une donnée réelle) » | taches.js:559-561 · `chaine.*` | Calcul | Montrer l'effet d'une décision | Étiquetage exemplaire : c'est le modèle à suivre pour l'affluence et le fictif | **Garder** | — |
| Arbitrage du budget (1×/semaine) : « Budget actuel : {budget}. Où mettre l'effort pour la fin de la semaine ? » + 3 enveloppes | taches.js:617 · `tache.arbitrage.*` | Calcul | Choix stratégique | Clair, et l'exemple donne l'effet | **Garder** | — |
| SMS de Camille (inspection) : « Petit tuyau pour demain ({thème})… » / réponse « Merci, je relis mon journal ce soir. » | taches-ui.js:356-360 · `tache.sms.*` | Fiction | Annoncer l'inspection | — | **Garder** | — |
| Récap fin de journée, rapport du soir, grade et XP | taches-ui.js:380-428 | Calcul | — | Hors périmètre (bilans) ; cité pour le compte des objectifs | — | — |

## 12. Enquête (sources 5 à 8 : Lignes, Info trafic, Météo, Agenda ; prompts 50 et 92)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Boutons « 5 Lignes · Révèle les lignes concernées », « 6 Info trafic · **Révèle le retard** et le texte de l'alerte », « 7 Météo… », « 8 Agenda… » (+ « · −4 s au compteur » en défi chrono seulement) | enquete.js:23-28, :330-349 · `enq.source.*`, `enq.revele.*`, `enq.cout` | Interface | Choisir une source | « Révèle le retard » promet une donnée qui n'existe pas en archive (prompt 134). La carte, ensuite, dit honnêtement « Retard non précisé par la source ». | **Reformuler** `enq.revele.trafic` : « Révèle le texte de l'alerte (et le retard, s'il est connu) » | P2 |
| Carte de source : « En direct » / « Archive du {date} », pictogramme, fait principal, « Nature · Heure · Retard initial / actuel · Dates citées », citation « « … » », « (texte original en français) », « Réseau Naolib (GTFS, Open Data Nantes Métropole) », « Open-Meteo », « Agenda des événements de Nantes Métropole », « consultée à {heure} » | enquete.js:109-211 · `enq.*` | API | Décider en connaissant la source | La meilleure mise en scène de la chaîne source → œuvre : provenance, date, citation intacte, heure de consultation | **Garder** | — |
| « Événement réel : « {texte} ». » / « {n} événement(s) grand public à l'agenda du jour : » / « Événement réel du jour, cité par l'agenda » | enquete.js:82-85, :158 | API | Agenda | Juste : l'événement est réel. Il manque, juste à côté, que l'affluence est supposée. | **Ajouter** « affluence : hypothèse du jeu » | P2 |
| « Lire tout » / « Réduire » / « +{n} autres » ; annonces « {source} : texte complet affiché. » | enquete.js:292, :356-357, :468 | Interface | Lire la citation complète | — | **Garder** | — |
| « Ralenti en cours : les sources sont suspendues. » | enquete.js:44 · `ralenti.sourcesSuspendues` (prompt 55) | Interface | Refus | — | **Garder** | — |
| Révélation gratuite par un geste dans la pièce : fenêtre → Météo, téléphone → Agenda, notification ouverte → Météo / Trafic / Agenda / Lignes | immersion.js:99, telephone.js:77, notifs-tel.js:408 (prompt 50) | Calcul | Récompenser le geste d'enquête diégétique | **Mécanique invisible** : aucun texte ne la signale au joueur. C'est pourtant le lien le plus fort entre le bureau et la décision. | **Ajouter** voir « Informations manquantes » | P2 |

## 13. Divers : glisser, traces, texte, mobile

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Zone en pointillés « Déposer ici » ; annonce « {réponse} : carte reposée, aucun choix. » | glisser.js:58, :102 (prompt 94) | Interface | Retour du glisser-déposer | — | **Garder** | — |
| « Traités aujourd'hui » : « ✓ {heure} — {réponse} · {sujet} », « ✗ … non traité », détail « retard retenu au moment du choix : {r} min » ; Q25 « Conséquences naturelles : retard {r} min → {effets} (retard ÷ 5, entre 4 et 15). » | traces.js:21-92 (prompt 89 bis) | Calcul | Mémoire de la journée | Rendu dans la file (carte.js, autre volet). La formule Q25 lue en clair est rare et précieuse pour le jury. | **Garder** | — |
| texte.js : coupure de mots, typographie FR (espaces fines) | texte.js:1-30 (prompt 92) | — | Lisibilité | N'est pas utilisé partout : « 14.9 » dans Community | **Garder** ; l'étendre | P3 |
| mobile.js : « appui long = infobulle », swipe haut pour s'installer | mobile.js:1-15 ; `bureau.installerMobile` | Interface | Tactile | — | **Garder** | — |

---

## Informations manquantes

1. **Ce que fait un geste du bureau sur l'enquête** (P2). Regarder par la fenêtre, prendre le téléphone ou ouvrir une
   notification révèle une source gratuitement (prompt 50). Il faut le dire au moment du geste : « Source Météo ajoutée
   au dossier en cours ». Sans cela, le bureau paraît décoratif alors qu'il est un outil d'enquête.
2. **Ce qui est hypothèse, ce qui est fiction** (P1). « Fictif » sur toute trace (post, plainte, notification, mention) d'un
   dossier `fictif` ; « affluence supposée » partout où l'affluence d'un événement est dite (tâche « Préparer un
   événement », causes d'info trafic, plaintes, Camille). Le modèle existe déjà : `chaine.source` (« pas une donnée réelle »).
3. **Le vrai prix de la sieste** (P1) : « le temps file, rien n'expire avant la fin de service » (hors défi chrono), ou un coût
   réel. Aujourd'hui le texte dit l'inverse de la règle.
4. **Le vrai effet du café** (P2) : « somnolence −30 ».
5. **Un témoin caméra visible dans toutes les vues** (P1, consentement) : la LED fait un pixel et l'indicateur « CAM » ne vit
   que dans la barre des tâches.
6. **Un message visible à l'arrivée d'un objet utilisable** (micro, livre stress) (P2).
7. **La répartition du nombre de dossiers du jour** (P1, cf. § 2) : faits réels / affluences supposées / fictif.

## À trancher par le groupe

1. **Plainte du dossier et mention Community : une voix ou deux ?** (P1) La même plainte reçoit deux réponses, avec
   deux effets, dont une chronométrée (45 s réelles). (a) Répondre dans le dossier clôt la mention ; (b) Community
   ne garde que les réactions *après* la décision (commentaires, retours), sans délai ; (c) on garde les deux, mais avec
   des textes différents et un « Pas de chrono sauf sur Community » dit dès l'intro.
2. **Combien de couches d'objectifs ?** (P1) Aujourd'hui, en même temps : défis de la semaine (patron, 08:00), priorités du
   jour (briefing ou imposées), objectif du jour, consigne du jour, cellule de crise, statut auprès du patron, grade, XP et
   badges, demande au patron, arbitrage du budget. Proposition : un objectif du jour et un défi de semaine, le reste
   différé au bilan.
3. **La sieste doit-elle coûter quelque chose hors défi chrono ?** (P1) Sinon, il faut la présenter comme une avance rapide.
4. **Activer par défaut le déblocage progressif des applis** (prompt 91 § 2, aujourd'hui désactivé) ? Il réglerait une
   partie de la surcharge du 1er jour (Patron, Community, Journal et Données sont tous visibles avec des badges dès 10:00).
5. **Les plaintes d'affluence affirment la foule.** Faut-il des modèles au conditionnel, au nom de la grammaire
   (« hypothèse du jeu ») ?
6. **Onglet « En direct » du téléphone** : le garder dès le 1er jour (œuvre, jury) ou le différer ?

## Constats transverses

1. **Le bureau porte l'œuvre ; ses messages, eux, se trompent parfois de règle.** La pièce (pluie réelle à la vitre, Loire,
   plante « qui reste au sec » quand il a plu, store qui donne la météo d'archive avec sa source, date de la semaine sur
   le téléphone, objets qui arrivent au fil des jours) est la meilleure traduction sensible de la source. Mais plusieurs
   textes n'ont pas suivi le prompt 87 (plus de chrono, rien n'expire) : livre stress, aide de la sieste, effet du café,
   promesse du SMS 4, annonce de la fenêtre « Votre poste ». Ce ne sont pas des détails : ils décrivent un autre jeu que
   celui qui tourne. **P1** pour la sieste et l'annonce lecteur d'écran, **P2** pour le reste.
2. **La frontière réel / hypothèse / fiction tient dans la source et cède dans les voix.** Les cartes de l'enquête, la
   fenêtre, l'onglet « En direct » et `chaine.source` sont exemplaires. Dès qu'un personnage parle (usager Quai, Camille,
   consigne du patron, tâche « Préparer un événement », pile de dossiers « réels »), l'affluence supposée devient un fait
   et l'incident fictif perd son étiquette. C'est la principale fuite de vérité du volet (**P1**).
3. **Les informations secondaires parasitent la décision quand elles demandent une seconde réponse.** Elles la servent
   quand elles alimentent l'enquête. La plainte Community chronométrée doublonne le plaignant du dossier. La fenêtre
   « Préparer un événement » s'ouvre au milieu du premier dossier. Le badge « Patron 2 » tire l'œil avant le premier
   signalement. À l'inverse, le téléphone, la fenêtre et les notifications *nourrissent* la décision (sources révélées
   gratuitement), mais sans le dire. La règle à appliquer : une information secondaire ne doit jamais exiger une décision
   concurrente ; elle peut en éclairer une.
4. **Trop de systèmes d'objectifs pour un visiteur de 3 minutes.** Défis de semaine, priorités, objectif du jour, consigne,
   crise, statut, grade, XP, badges, demandes, arbitrage : chacun est défendable seul, mais l'ensemble rend illisible
   « ce qui compte maintenant ». En exposition (`?expo=1`), on arrive au poste à 10:05 avec un bandeau qui affiche déjà
   « Priorités … · Objectif … » et deux badges. **P1** (gêne la décision).
5. **Redondances : certaines voulues, certaines non.** L'heure apparaît 5 fois (horloge analogique, étiquette, bandeau,
   barre des tâches, téléphone) : c'est diégétique, acceptable. « 2 plaintes » apparaît 3 fois (badge, onglet, téléphone)
   et le compte de dossiers 3 fois, avec un mot « réels » trompeur : à fusionner. Les jauges sont répétées dans la barre
   des tâches (ordre inversé), les mini-jauges du patron et les statistiques Community : à retirer hors du bandeau.
6. **Ce qui porte l'œuvre et doit rester :** la vitre et la météo réelle, la Loire, le store avec sa source et
   « heure réelle / heure du jeu », la date d'archive sur le téléphone, l'onglet « En direct · pas la semaine jouée », le
   brouillon d'info trafic « à vérifier avant d'envoyer », le corps du régulateur (café, cœur, souffle, paupières), le
   rituel du démarrage les trois premiers jours, le bureau qui se remplit. Ces éléments disent « on rejoue une journée
   réelle de Nantes depuis un poste » sans ajouter de chiffre.
