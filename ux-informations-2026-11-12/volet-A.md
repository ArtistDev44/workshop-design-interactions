# Revue UX — volet A : entrée et cadre (12/11/2026)

Méthode : skill `ux-questionner-informations` (inventorier → 8 questions → verdict + priorité). Code lu dans
`wdi-ux/site/public/` ; écrans réels vus sur le build servi (`http://localhost:8737/`, 1920×1080, FR, EN et
`?expo=1&inactif=4`), captures dans `scratchpad/ux/A/` (`fr-*`, `en-*`, `expo-*`, `b-*`). Aucun fichier du dépôt modifié.

Abréviations d'origine : **UI** texte d'interface · **Calc** calculé par le jeu · **Fiction** fiction assumée ·
**Réel** donnée de la source · **Méta** projet / équipe. Les clés i18n sont citées avec leur ligne FR dans `i18n.js`
(la traduction EN a été relue pour les textes jugés ; seules les différences sont signalées).

---

## 1. Écran de chargement (`index.html:81-96`, `sketch.js:84-85`, `sketch.js:120-130`)

Vu : `b-00-chargement.jpg` (p5 ralenti exprès) ; en conditions normales il disparaît en < 300 ms.

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Pictogramme moniteur + ligne de bus (SVG) | `index.html:84-92` (`aria-hidden`) | UI | Identité, attente | Décoratif, masqué au lecteur d'écran : correct. | Garder | — |
| « Nantes en régulation » | `index.html:93` | UI | Nommer l'œuvre | Seul repère pendant l'attente. | Garder | — |
| Code `PXE-NTE001-G01-W01` | `index.html:94`, repris `menu.js:262` | Méta | Jury (registre de l'atelier) | Pour un visiteur, un code opaque, affiché deux fois (chargement + écran titre). Le jury le trouve aussi sur le cartel. | Alléger (une seule occurrence, sur l'écran titre) | P3 |
| « Chargement… · Loading… » puis `chargement.message` (l.301) | `index.html:95`, `sketch.js:84-85` | UI | Rassurer pendant l'attente | Bilingue avant détection de langue, puis traduit : bon choix (prompt 27). `role="status" aria-live` : annoncé. Aucun état d'échec (si p5 ou les données ne chargent pas, le texte reste « Chargement… » indéfiniment). | Garder ; Ajouter un état d'échec (voir « manquantes ») | P3 |
| `<noscript>` bilingue | `index.html:99` | UI | Sans JS | Correct. | Garder | — |
| Méta description / OG « données réelles (retards Naolib, météo, agenda…) » | `index.html:13, 40, 50, 58` | UI (partage) | Aperçu de lien, SEO | **Vérité** : depuis le prompt 134, les archives ne portent **aucun retard en minutes** ; seul le temps réel (verrouillé au départ) joue des retards. « retards Naolib » en tête promet la mécanique que le mode recommandé ne joue pas. Même dérive que celle corrigée sur le cartel. | Reformuler (« perturbations du réseau Naolib, météo, agenda » ; retards seulement en temps réel) | P2 |

## 2. Menu principal — écran titre (`menu.js:250-302`)

Vu : `fr-01-menu.jpg`, `fr-02-menu-focus-livrables.jpg`, `en-01-menu-en.jpg`.

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Fond : la pièce du bureau floutée, voile plus sombre à gauche | `menu.js:98-116` | Fiction | Ambiance, promesse du lieu | Porte l'œuvre sans coûter de lecture ; flou coupé si animations réduites (`menu.js:105`) — il reste alors une pièce nette derrière le texte, contraste à vérifier dans ce cas. | Garder | — |
| Code `PXE-NTE001-G01-W01` (20 px, blanc 75 %) | `menu.js:262` | Méta | Jury | Redondant avec le chargement ; discret, n'entre pas en concurrence avec le titre. | Garder (ici seulement) | P3 |
| Titre « Nantes en régulation » (Bitsy Pixels 88 px) | `menu.js:263`, `accueil.titre` (l.172) | UI | Identité | Juste. | Garder | — |
| Sous-titre « Salle de contrôle des transports nantais — rejouez une semaine réelle du réseau » | `menu.js:267`, `accueil.sousTitre` (l.173) | UI | Dire le pitch en une ligne au visiteur | Seul texte qui dit le « quoi » en 3 s. « semaine réelle » : vrai, mais sans dire que la plupart des dossiers viennent de l'agenda (hypothèse du jeu, prompt 134) — la nuance relève de « Nouvelle partie » plutôt qu'ici. | Garder | — |
| Carte « Nouvelle partie » (icône +) | `menu.js:54`, `mp.nouvelle` (l.530) | UI | Entrée principale | Focus par défaut (liseré + contour primaire) : la hiérarchie est bonne. | Garder | — |
| Carte « Reprendre la partie (C) » + sous-titre « {semaine} · dossier {n}/{total} · sauvegardée à {heure} » | `menu.js:55-67`, `mp.reprendre` (l.531), `accueil.continuerDetail` (l.302) | Calc | Décider reprendre / recommencer | Vu dans le code seulement (pas de sauvegarde dans les captures). Heure sans date : une sauvegarde d'hier « à 10:42 » se lit comme d'aujourd'hui. « dossier n/total » compte l'index du paquet, alors que plusieurs signalements arrivent en même temps (prompt 87) : le chiffre dit mal l'avancée réelle (jour n/5 serait plus parlant). « (C) » : raccourci dans le libellé (voir constat transverse sur les touches). | Reformuler (jour + date relative) | P3 |
| Carte « Palmarès » (trophée) | `menu.js:69`, `mp.palmares` (l.1019) | UI | Accès aux meilleurs bilans | Au premier lancement, ouvre un tableau entièrement « pas encore jouée » (voir § 6) : une carte de premier niveau pour un écran vide. | À trancher (déplacer dans « Nouvelle partie » ou le masquer tant que vide) | P2 |
| Carte « Paramètres » (icône engrenage à 8 rayons) | `menu.js:70`, `menu.js:133-138`, `mp.parametres` (l.532) | UI | Réglages | L'icône dessinée (cercle + 8 traits) se lit comme un **soleil / luminosité** (capture `fr-01`). | Reformuler l'icône (dents pleines) | P3 |
| Carte « Aide et tutoriel (H) » (icône ?) | `menu.js:71`, `mp.aide` (l.533) | UI | Aide + tutoriel (prompt 122 : une seule carte) | Choix du prompt 122 cohérent. | Garder | — |
| Carte « Crédits » (icône **hamburger** `menu`) | `menu.js:72`, `menu.js:177-180`, `mp.credits.menu` (l.1281) | Méta | Équipe, licence, IA (prompt 113) | L'icône « ≡ » signifie universellement « menu », pas « crédits ». Et la même destination est aussi offerte par les noms soulignés du pied (redondance). | Reformuler l'icône ; voir « Noms » ci-dessous | P3 |
| Focus clavier : carte blanche + contour primaire 4 px | `menu.js:203-248` | UI | Où suis-je au clavier | Double codage (fond + contour) : bon. | Garder | — |
| Sélecteur FR / EN (boutons 84×52, actif en rouge) | `menu.js:283`, `sketch.js:1584-1590` | UI | Changer de langue | Codes seuls, sans libellé « Langue » ni annonce de changement repérée ; pour le visiteur étranger, « EN » suffit. Aucun `annoncer()` dans `selecteurLangue`. | Garder ; Ajouter une annonce au changement | P3 |
| « Installer l'application » (bouton, seulement si le navigateur le propose) / badge « webapp installée » | `menu.js:285-293`, `pwa.installer` (l.817), `pwa.badge` (l.822) | UI | Installer la PWA (prompt 65) | En exposition (kiosque), un bouton d'installation n'a pas de sens ; le badge « webapp installée » ne sert aucune décision. | Différer en `?expo=1` ; Supprimer le badge | P3 |
| Pied : « Mattéo Brevet & Guillaume Renoult » souligné, cliquable → Crédits | `menu.js:313-329`, `mp.credits` (l.1249) | Méta | Signature (prompt 125 : noms seuls) | Choix voulu (prompt 125). Mais la même action existe déjà en carte « Crédits » : deux chemins pour une même page, dont un lien sans affordance hors survol. | Garder (signature) ; À trancher : retirer la carte « Crédits » ou le lien | P3 |
| Infobulle des noms « Voir les crédits : l'équipe, la licence, l'usage de l'IA » | `menu.js:328`, `mp.credits.infobulle` (l.1250) | UI | Dire où mène le lien | Survol seulement : invisible au clavier (les noms ne sont pas dans l'ordre Tab : `EXTRAS_MENU` ne les contient pas). | Ajouter le lien à l'ordre clavier, ou Supprimer (la carte suffit) | P3 |
| Bouton « Livrables » pleine largeur (812 px, icône carnet) + infobulle « Ouvrir la diapositive des livrables du projet (nouvel onglet) » + annonce | `menu.js:373`, `mp.livrables*` (l.1894-1896) | Méta | Jury (prompt 136) | **Hiérarchie** : c'est l'élément **le plus large de l'écran** (812 px contre 620 px pour « Nouvelle partie », capture `fr-01`), alors qu'il ne sert ni le visiteur ni le joueur. Choix demandé tel quel au prompt 136. | À trancher (taille et place voulues par le prompt 136) | P2 |
| Boutons « Dépôt du code » (icône pieuvre), « Partager », « Présentation » + 3 infobulles + annonces | `menu.js:366-381`, `mp.depot*` (l.1234-1235), `mp.partager*` (l.1236-1237), `mp.presentation*` (l.1891-1893) | Méta | Jury / partage | 4 sorties vers l'extérieur sur l'écran d'entrée ; « Dépôt du code » et « Présentation » existent aussi dans Crédits (`credits.js:35-40`) et dans les Livrables. En `?expo=1`, chaque clic ouvre un **nouvel onglet** sur le kiosque : le visiteur suivant trouve GitHub ou Slidev au lieu du jeu (aucune condition `EXPO` dans `menu.js`). | Différer : masquer le bloc en `?expo=1` ; hors expo, Fusionner (Livrables + Présentation pointent la même page `/presentation/`) | P2 |
| Annonce lecteur d'écran « Menu principal — … Flèches pour choisir, Entrée pour valider » | `menu.js:40`, `mp.annonce` (l.529) | UI | Orientation non-voyante | **Jamais émise au premier chargement** : `ouvrirMenuPrincipal()` n'est appelé qu'en revenant d'une partie ; mesuré : `#annonces` vide sur l'écran titre initial. Le canevas ne porte que l'`aria-label` du `<main>`. | Ajouter (émettre au premier affichage) | P2 |
| Annonces au clavier (`mp.{cle}`) | `menu.js:627` | UI | Dire la carte focalisée | Correct ; les extras (Livrables…) sont annoncés par leur libellé. | Garder | — |
| Démo automatique après 40 s : « Démo — faits réels des semaines rejouées · n / N », faits datés (`demo.semaine`, `demo.meteo`, `demo.agenda`), « Appuyez sur une touche pour reprendre la main » | `accessibilite.js:231-282`, `demo.*` (l.1011-1016) | Réel | Attirer le visiteur (prompt 48) | Très bon support de la chaîne source → œuvre (faits réels datés). « Appuyez sur une touche » alors que le voile d'expo dit « Touchez l'écran » : deux consignes pour le même dispositif. `demo.semaine` dit « {dossiers} dossier(s) réels du réseau » : vrai, et c'est la seule place où l'on voit la part réel / agenda. | Garder ; Reformuler la consigne (« Touchez l'écran ou appuyez sur une touche ») | P3 |

## 3. Panneau « Partager » (`menu.js:383-488`)

Vu : `fr-05-partage-copie.jpg`.

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Titre « Partager » | `menu.js:452`, `mp.partager` (l.1236) | UI | Contexte | — | Garder | — |
| URL du jeu en clair | `menu.js:457`, `URL_JEU` (`menu.js:11`) | Méta | Recopier à la main | Utile quand la copie échoue. | Garder | — |
| 4 boutons réseaux (X, Facebook, LinkedIn, Mastodon) + icônes pixel | `menu.js:385-391, 461-465`, `mp.partager.x…mastodon` (l.1240-1243) | UI | Partager | Pour le visiteur d'exposition, tous ouvrent un onglet externe (même problème qu'au § 2). Texte pré-rempli `mp.partager.texte` (l.1239) invisible avant envoi : le joueur ne sait pas ce qu'il publie. Mastodon forcé sur `mastodon.social`. | Garder hors expo ; Ajouter un aperçu du texte | P3 |
| « Copier le lien » → « Lien copié » (3 s) + annonce + bip | `menu.js:414-437, 463`, `mp.partager.copier/copie` (l.1244-1245) | UI | Retour d'action | Double retour visuel + annonce : bon. En échec, l'annonce `mp.partager.echec` (l.1246) n'est **que** dite au lecteur d'écran, rien à l'écran. | Ajouter l'échec à l'écran | P3 |
| Croix « × » + « Fermer (Échap) » | `menu.js:460, 466` | UI | Sortir | Deux fermetures : convention acceptable. | Garder | — |
| Aide clavier « ↑ ↓ ou Tab : choisir · Entrée : ouvrir · Échap : fermer » | `menu.js:478`, `mp.partager.clavier` (l.1248) | UI | Clavier | Le prompt 124 a retiré l'aide clavier du menu « pour l'immersion », elle reste ici, dans Crédits, Autorisations, Aide : règle non uniforme. Coupée sur 2 lignes (« fermer » seul à la ligne, capture). | Alléger (voir constat transverse) | P3 |
| Annonce d'ouverture « Partager le jeu : X, Facebook… » | `menu.js:404`, `mp.partager.annonce` (l.1238) | UI | Orientation | Bonne. | Garder | — |

## 4. Crédits (`credits.js`, prompts 113 et 120)

Vu : `fr-06-credits.jpg`, `en-03-credits-en.jpg`.

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Titre « Crédits » | `credits.js:151`, `credits.titre` (l.1251) | UI | — | — | Garder | — |
| « Atelier ESD Nantes · B3 Design · novembre 2026 » | `credits.js:156`, `credits.atelier` (l.1252) | Méta | Jury, contexte | Juste. | Garder | — |
| Deux fenêtres « PORTRAIT » + photo pixelisée + nom | `credits.js:119-143`, `credits.portrait` (l.1255) | Méta | Équipe | La barre « PORTRAIT » répétée deux fois n'apporte rien (le contenu est évidemment un portrait). Les rôles de chacun ne sont pas dits. | Reformuler la barre (nom ou rôle `[À COMPLÉTER]` par le groupe) | P3 |
| Fenêtre LICENCE : Code (MIT…), Données (Open Data Nantes Métropole… « Licence Ouverte ou ODbL selon le jeu » · Open-Meteo · Hub'Eau `[À COMPLÉTER]`), Lieux (OSM ODbL), Bibliothèque (p5.js LGPL-2.1), Musiques | `credits.js:43, 168`, `credits.lic.*` (l.1256-1265) | Méta / Réel | Jury, obligation d'attribution | **Vérité** : « selon le jeu » est ambigu (lire « jeu de données ») ; la licence Hub'Eau reste `[À COMPLÉTER]` **affiché au public** ; Naolib GTFS / GTFS-RT, qui est la source principale du mode temps réel, n'est pas nommé à part. Correct de ne rien inventer. | Reformuler (« selon le jeu de données ») ; Ajouter la ligne Naolib ; compléter Hub'Eau (groupe) | P2 |
| Fenêtre UTILISATION DE L'IA : Outils, Méthode, Données (« réelles, rien n'est inventé »), Visuels, Part humaine (`[À COMPLÉTER]`) | `credits.js:44, 169`, `credits.ia.*` (l.1266-1275) | Méta | Jury (transparence IA) | « Données : réelles, rien n'est inventé » **contredit** l'exception décidée au prompt 119 (un incident fictif par semaine, marqué « Fictif ») et l'hypothèse d'affluence (prompt 134). « Part humaine : `[À COMPLÉTER]` » visible du jury : c'est le champ que le jury lira en premier. | Reformuler (« réelles ; un incident fictif par semaine au plus, marqué ; affluence supposée ») ; compléter la part humaine (groupe) | P1 |
| Boutons « Lire la licence », « Making-of », « Dépôt du code », « Retour » | `credits.js:35-40, 171-184`, `credits.*` (l.1276-1279) | Méta | Approfondir | « Dépôt du code » doublonne le bouton du menu. En expo : sorties externes (§ 2). | Garder hors expo | P3 |
| Aide clavier « Tab / ← → : choisir · Entrée : ouvrir · Échap : retour au menu » | `credits.js:189`, `credits.clavier` (l.1280) | UI | Clavier | Collée sous les boutons (capture) : se lit comme une légende des boutons. | Alléger | P3 |
| Annonce « Crédits. Mattéo Brevet, Guillaume Renoult. Atelier… » | `credits.js:27` | UI | Orientation | Bonne. | Garder | — |

## 5. Paramètres et sous-fenêtres (`sketch.js:1460-1582`, `accessibilite.js:100+`, `taches-ui.js:493+`)

Vu : `fr-07-parametres.jpg`, `fr-08-optjeu.jpg`, `fr-09-accessibilite.jpg`.

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| 5 bascules oui/non : Son (touche 1), Forcer le mode hors ligne (2), Réduire les animations (3), Contraste renforcé (4), Défi chrono (prochaine partie) (0) | `sketch.js:1474-1495`, `param.*` (l.300, 376-379, 1463) | UI | Confort, mode de jeu | « Défi chrono » change la règle du jeu (budget 50 fixe, compteur, expiration : `game.js:284`) mais vit ici, loin du choix de partie ; l'écran « Nouvelle partie » ne le montre pas et affiche alors un budget faux (§ 7). « Forcer le mode hors ligne » est un outil d'équipe (démo sans réseau), pas une préférence de joueur. « oui » rouge plein / « non » contour : le **rouge primaire signale l'état actif**, alors qu'ailleurs il signale l'erreur ou l'urgence. | Déplacer « Défi chrono » dans « Nouvelle partie » ; Différer « hors ligne » (section avancée) ; À trancher : couleur de l'état « oui » | P2 |
| Libellés « touche N » sur chaque ligne | `sketch.js:1489`, `param.touche` (l.379) | UI | Clavier | Une colonne entière de raccourcis que personne ne retiendra ; la même touche « C » ouvre « Reprendre » au menu et « Couleur » ici ; « G » = guide (Nouvelle partie), options de jeu (ici), arrêter le guide (en jeu). | Alléger (afficher au focus) | P3 |
| Note « Réglages mémorisés sur cet appareil (localStorage). Les animations sont aussi réduites si le système le demande. » | `sketch.js:1498`, `param.note` (l.380) | UI | Confiance | « localStorage » : jargon technique. | Reformuler (« sur cet appareil ») | P3 |
| Langue FR/EN (touche L) | `sketch.js:1500-1511` | UI | Langue | Redondant avec l'écran titre (voulu, prompt 24 : accessible en jeu). | Garder | — |
| Musique « ♪ Night in a seashell — Komiku (CC0) » (touche 8) + ligne de crédits + infobulle longue | `sketch.js:1513-1531`, `param.musique*` (l.287, 294-295) | Réel (œuvres CC0) / Méta | Choisir la piste, attribuer | Les crédits musique sont dits trois fois : bouton, ligne `param.musiqueCredits`, infobulle `param.musiqueCreditsLong`, + Crédits. La ligne courte est à 14 px. | Fusionner (bouton + Crédits suffisent) | P3 |
| Progression : Exporter (5), Copier (6), Importer (7) | `sketch.js:1533-1543`, `parametres.*` (l.328-331) | UI | Sauvegarde portable (prompt 33) | Doublon : « Exporter (5) / Importer (7) » sont **aussi** dans « Accessibilité et reprise » avec les mêmes touches. | Fusionner (un seul endroit : « Reprise ») | P2 |
| « Accessibilité et reprise » → Ouvrir (touche 9) | `sketch.js:1545-1556`, `acc.titre/ouvrir` (l.995-996) | UI | Sous-fenêtre | Mélange accessibilité (daltonisme, taille, lecture facile, micro, webcam, secousse) et reprise multi-appareil : deux sujets sans lien. | Reformuler (deux entrées) | P3 |
| Sous-fenêtre Accessibilité : légende « bon / attention / critique » ; « Lecture facile : compte à rebours 1,5 fois plus long, sans tic-tac… » | `acc.niveau.*`, `acc.lecture.detail` (l.1005-1008) | UI | Comprendre l'option | Le compte à rebours n'existe plus par défaut (prompt 87/80 : sans chrono) : l'explication décrit un effet invisible hors « Défi chrono ». Les seuils 20/40 de la légende ne sont pas écrits. | Reformuler (« en défi chrono : … ») | P2 |
| Sous-fenêtre Reprise : « Une sauvegarde pèse de 6 à 45 ko… QR code (moins de 3 ko)… » + QR de l'URL | `acc.reprise.texte` (l.1010) | UI | Continuer ailleurs | Justification technique (ko) inutile au joueur ; l'action tient en une phrase. Le QR ne transporte que l'URL : clair dans le texte. | Alléger | P3 |
| « Options de jeu » → Ouvrir (G) ; sous-fenêtre de 11 options + « Progression : Stagiaire, 0 XP » + « Remettre à zéro (9) » | `sketch.js:1558-1569`, `optjeu.*` (l.1696-1931) | UI | Options soumises au groupe (prompts 88-91) | Note affichée au joueur : « Options proposées au groupe (prompts 88 à 91), désactivées par défaut » — vocabulaire de fabrication, pas de jeu. Titre « 3 Arbitrage hebdomadaire du » **coupé** (capture `fr-08`). La 10e option n'a pas de numéro. « Pression visible » cache volontairement la tension (choix assumé) : à garder caché, mais la phrase « marque les réponses conseillées » révèle qu'il existe une bonne réponse. | Reformuler la note ; corriger le titre coupé ; À trancher : ces options doivent-elles être visibles des visiteurs | P2 |
| Couleur principale : 6 pastilles (touche C) | `sketch.js:1571-1580`, `couleur.titre` (l.725) | UI | Personnaliser (prompt 115) | Pastilles sans nom : couleur seule (règle « jamais la couleur seule » du projet). | Ajouter le nom en infobulle / annonce | P3 |
| « Retour (Entrée) » rouge plein | `sketch.js:1581`, `param.retour` (l.381) | UI | Sortir | Entrée = retour, alors que dans « Nouvelle partie » Entrée = lancer : même touche, sens opposés selon l'écran. | Garder ; noter | P3 |
| Annonce à l'ouverture | — | UI | Orientation | Aucune annonce à l'ouverture de Paramètres ni du Palmarès (mesuré : `#annonces` garde le texte précédent, « Crédits… »). | Ajouter | P2 |

## 6. Palmarès (`mecaniques.js:188-237`, prompt 47)

Vu : `fr-10-palmares.jpg`.

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Titre « Palmarès » | `mecaniques.js:200`, `palmares.titre` (l.1057) | UI | — | — | Garder | — |
| En-têtes SEMAINE / MEILLEUR BILAN / JAUGES / PROFIL DE GESTION | `mecaniques.js:207`, `palmares.col.*` (l.1062-1065) | UI | Lire le tableau | Correct. | Garder | — |
| Lignes « Semaine du 14/09/2026 (facile) », « 02/11/2026 (normale) », « 12/10/2026 (difficile) », « aujourd'hui en temps réel » | `mecaniques.js:189-192`, `palmares.semaine` (l.1058) | Réel (dates) / Calc | Repérer la semaine | Les **dates** n'apparaissent nulle part ailleurs avant de jouer (« Nouvelle partie » dit « semaine 1/3 ») : le joueur ne peut pas relier « semaine 1/3 » à « 14/09 ». Ordre histoire (non chronologique) sans le dire. | Reformuler (« Semaine 1/3 · du 14/09/2026 · facile ») | P2 |
| « pas encore jouée » ×4 (état vide) | `mecaniques.js:217-220`, `palmares.vide` (l.1066) | Calc | État vide | Au premier lancement, l'écran entier est vide ; en `?expo=1` le palmarès est **conservé** d'un visiteur à l'autre (`expo.js:20`) : il devient un classement de salle, ce qui change son sens. | À trancher (palmarès de salle ou personnel en expo) | P2 |
| Score « n / 300 » + « le {date} » | `mecaniques.js:222-228` | Calc | Se mesurer | Correct, même échelle que l'aide. | Garder | — |
| Jauges « fluidité f · réputation r · budget b » | `mecaniques.js:231-232`, `palmares.jauges` (l.1068) | Calc | Détail du bilan | Utile pour le joueur qui rejoue. | Garder | — |
| Profil « le pompier / le stratège / … » + « défis n » | `mecaniques.js:233`, `profil.*` (l.1021-1024), `palmares.defis` (l.931) | Calc | Tonalité, rejouabilité | — | Garder | — |
| Note « Le profil vient de l'action la plus jouée : renfort → pompier, déviation → stratège, retenue → gestionnaire discret, rien → spectateur. » | `mecaniques.js:236`, `palmares.aide` (l.1069) | UI | Expliquer le profil | Parle de l'**ancienne table de 4 actions** (Q5-Q7) ; depuis le prompt 87 le joueur voit des répliques par catégorie, pas « déviation / retenue ». Le calcul passe par `h.famille` (`game.js:1962-1975`), invisible au joueur. | Reformuler avec les mots que le joueur a vus | P2 |
| « Fermer (Échap) » | `mecaniques.js:237`, `commun.fermer` (l.281) | UI | — | — | Garder | — |

## 7. Nouvelle partie — choix du mode (`menu.js:490-602`, prompts 41, 97)

Vu : `fr-15-nouvelle-partie.jpg`, `fr-16-np-temps-reel.jpg`, `en-02-np-en.jpg`.

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Titre « Nouvelle partie » | `menu.js:529`, `mp.semaines.titre` (l.557) | UI | — | — | Garder | — |
| « Choisissez un mode de jeu. Une partie : une semaine réelle, une quinzaine de signalements à trancher, 3 jauges à préserver. » | `menu.js:535`, `mp.mode.sous` (l.465) | UI / Réel | Cadrer la partie | **Vérité** : « une semaine réelle, une quinzaine de signalements » laisse croire à 15 incidents réels ; le prompt 134 établit 2 à 4 perturbations réelles, le reste étant des événements de l'agenda dont l'affluence est **supposée**. | Reformuler (« 2 à 4 perturbations réelles et des événements de l'agenda… ») | P1 |
| Badge « ★ RECOMMANDÉ » (rouge) | `menu.js:562-570`, `mp.mode.recommande` (l.470) | UI | Orienter | Avec le temps réel verrouillé, il n'y a de toute façon qu'un choix : le badge et le choix de carte n'éclairent aucune décision au premier lancement. | Alléger (badge inutile tant que le seul autre mode est verrouillé) | P3 |
| « Mode histoire » + « Trois semaines réelles… facile, puis normale, puis difficile. **Un nouvel élément de jeu chaque semaine.** » | `menu.js:508-509`, `mp.mode.histoire(.sous)` (l.467-468) | UI | Choisir | **Faux depuis le prompt 108** : les équipes sont actives dès la semaine 1 (`histoire.js:42`), donc la semaine 2 n'ajoute rien ; seul `crise` arrive en semaine 3 (`histoire.js:43`). Texte en rouge primaire sur la carte focalisée : poids d'alerte pour un texte descriptif. | Reformuler ; Alléger la couleur | P1 |
| « Prochaine étape : semaine n/3 — {élément} » (semaine 2 : « équipes de terrain depuis les signalements ») | `menu.js:510`, `mp.mode.histoire.etat` (l.469), `histoire.element.*` (l.459-461) | Calc | Savoir où l'on en est | L'élément annoncé pour la semaine 2 n'est plus nouveau (prompt 108). Pas de date de la semaine, pas de score des semaines déjà jouées. | Reformuler ; Ajouter la date de la semaine | P1 |
| « Difficulté facile : budget 60 · 3 signalement(s) à la fois · retards ×0,5 » | `menu.js:493-499`, `mp.difficulte` (l.466) | Calc | Anticiper la difficulté (prompt 97) | **Trompe sur la règle jouée** : `retards ×0,5` n'a **aucun effet** sur les archives (`retard: null` → `Jeu.retardEffectif` renvoie null, `game.js:563-571` ; grammaire, prompt 134). Si « Défi chrono » est coché dans Paramètres, le budget réel est 50 (`game.js:284`) mais l'écran affiche 60/40. « signalement(s) à la fois » : jargon interne (nombre de dossiers simultanés). EN : « easy difficulty: … » sans majuscule. | Reformuler (retirer ×aggravation hors temps réel ; afficher défi chrono et son budget) | P1 |
| « Mode temps réel » + « Les retards réels mesurés maintenant… (flux GTFS-RT), tous les éléments de jeu actifs » + cadenas + « Verrouillé : terminez le mode histoire pour le débloquer. » / « Indisponible hors ligne. » | `menu.js:515-522, 571-580`, `mp.mode.direct*` (l.471-474) | Réel / UI | Savoir qu'il existe | C'est **le seul mode où la règle structurante (seuil de 10 min) joue** (prompt 134) ; il est verrouillé derrière trois semaines : le visiteur de 3 min et le jury ne la verront jamais. « GTFS-RT » : sigle non expliqué au visiteur. Cadenas dessiné + texte : double codage correct. | À trancher (déverrouiller en `?expo=1` ou pour le jury) ; Reformuler le sigle | P2 |
| Case « Prendre en main (guidé) — touche G » (cochée si jamais joué) | `guide.js:218-248`, `guide.option` (l.513) + annonces `guide.option.oui/non` (l.514-515) | UI | Choisir l'accompagnement | Le joueur ne sait pas ce que « guidé » change par rapport au tutoriel (le guide **remplace** le tutoriel : `immersion.js:482`, `sketch.js:324`). | Reformuler (« Être guidé pas à pas (sinon : tutoriel illustré) ») | P3 |
| « Lancer la partie (Entrée) » (désactivé si verrou) / « Retour (Échap) » | `menu.js:600-601`, `mp.lancer/retour` (l.559-560) | UI | Agir | Bouton désactivé : texte gris sur gris (capture `fr-16`), contraste faible ; pas de raison affichée à côté. | Garder ; vérifier le contraste de l'état désactivé | P3 |
| Annonce au changement de carte « {titre} — {détail} » | `menu.js:616` | UI | Lecteur d'écran | N'annonce pas `info` (étape, difficulté, verrou) : l'utilisateur non-voyant ne sait pas que le temps réel est verrouillé. | Ajouter `info` | P3 |
| `mp.semaines.sous` « Choisissez une semaine réelle… ou le temps réel » | `i18n.js:558` | UI | — | Clé orpheline (plus dessinée) ; idem `accueil.info` (l.162) et `accueil.semaine` (l.160), qui portaient la part dossiers d'archive / événements agenda et les dates. | Supprimer ou réutiliser (voir « manquantes ») | P3 |

## 8. Avant de jouer — autorisations (`autorisations.js`, prompt 110)

Vu : `fr-17-autorisations.jpg`, `fr-18-autorisations-apres.jpg`.

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Titre « Avant de jouer » | `autorisations.js:132`, `autor.titre` (l.534) | UI | — | — | Garder | — |
| « Le jeu peut utiliser le son, le micro et la caméra… aucune fenêtre ne viendra interrompre la partie. Rien n'est enregistré ni envoyé. » | `autorisations.js:133`, `autor.intro` (l.535) | UI | Consentement éclairé | Promesse vérifiée dans le code (pistes arrêtées aussitôt, `autorisations.js:65-69`). Bonne. | Garder | — |
| Lignes Son / Micro / Caméra + usage (« Soufflez dans le micro pendant le boost du café… », « Montrez la main pour lancer ou interrompre la sieste (webcam du bureau à allumer) ») | `autorisations.js:136-160`, `autor.*.usage` (l.539-541) | UI | Décider d'autoriser | L'usage est concret : bon. Mais **la caméra autorisée ne s'allume jamais** (opt-in, `autorisations.js:8`) : après « Tout autoriser », la ligne affiche « Autorisé » en vert alors que le réglage Webcam reste « non » (capture `fr-09`). Le joueur croit la fonction active. « (webcam du bureau à allumer) » est trop elliptique. | Reformuler (« Autorisé · à allumer au bureau ») | P2 |
| Statuts « Non demandé / Autorisé / Refusé / Indisponible / Coupé » + liseré couleur | `autorisations.js:141, 150-154`, `autor.statut.*` (l.544-548) | Calc | État | Texte + couleur : conforme. | Garder | — |
| Bouton « Autoriser › » par ligne, grisé une fois autorisé | `autorisations.js:107-115, 157` | UI | Agir ligne à ligne | Après autorisation, trois boutons « Autoriser » grisés restent (capture `fr-18`) : bruit. | Alléger (masquer ou « ✓ ») | P3 |
| « Sinon : Z ou la jauge » / « Sans micro, le café se calme seul » (après refus) | `autorisations.js:148`, `autor.*.sans` (l.542-543) | UI | Rassurer | Bon : dit l'alternative. « la jauge » : laquelle ? (somnolence). | Reformuler (« la jauge de somnolence ») | P3 |
| « Tout autoriser » (primaire) / « Jouer » ou « Continuer sans » | `autorisations.js:116, 163-169`, `autor.tout/jouer/sans` (l.549-553) | UI | Avancer | Libellé qui change selon l'état : clair. | Garder | — |
| Pied « Un refus se change dans les réglages du site… » / « Micro et caméra indisponibles ici… » | `autorisations.js:174`, `autor.pied/piedAbsent` (l.554-555) | UI | Récupérer d'un refus | Affiché **avant** tout refus : texte de dépannage montré à tous. | Différer (n'afficher qu'après un refus) | P3 |
| Aide clavier « ↑ ↓ / Tab : choisir · Entrée : valider · Échap : retour » | `autorisations.js:175`, `autor.clavier` (l.556) | UI | Clavier | Voir constat transverse. | Alléger | P3 |
| Annonce d'entrée (titre + intro + 3 statuts) et après action | `autorisations.js:54, 91` | UI | Lecteur d'écran | Complète. | Garder | — |
| Écran entier (étape) | `autorisations.js:42-56` | UI | — | Une étape de plus avant la 1re décision, pour deux fonctions (souffle, main) que la plupart des joueurs ne croiseront pas en semaine 1. Supprimée à juste titre en `?expo=1` (prompt 132). | À trancher (demander au premier usage plutôt qu'avant la partie : le prompt 110 a choisi l'inverse exprès) | P2 |

## 9. Intro et narration de début (`immersion.js:18-25, 473-483`, `histoire.js:59-62`, `telephone-main.js:187`)

Vu : `fr-19-lancement.jpg` … `fr-25-intro-6.jpg`, `b-05-chap3.jpg`.

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| En-tête du téléphone « Camille · cheffe de salle » / « Salle de régulation » | `immersion.js:475`, `sms.camille` (l.382), `intro.salle` (l.432) | Fiction | Poser le personnage | Porte l'œuvre. | Garder | — |
| `sms.0` « Premier jour au travail, faut pas que je me loupe. » | `sms.0` (l.383) | Fiction | Ton | Court, juste. | Garder | — |
| `sms.1` « Ton poste : surveiller le réseau Naolib et traiter les incidents… » | l.384 | Fiction | Rôle | Juste. | Garder | — |
| `sms.2` « Chaque signalement arrive sur la carte… Pas de chrono, prends le temps de lire. » | l.385 | UI dans la fiction | Règle clé | Corrigé au prompt 131, conforme au jeu par défaut. | Garder | — |
| `sms.3` « garder les trois jauges au vert — fluidité du réseau, réputation de la salle, budget » | l.386 | UI dans la fiction | Objectif | Dit aussi par : `mp.mode.sous`, `histoire.c1.1`, `tuto.1.texte`, `guide.jauges`, `aide.texte` (objectif) → **6 fois** avant la 1re décision possible. | Fusionner (garder SMS + aide) | P2 |
| `sms.4` « Si l'écran du PC clignote en rouge, c'est urgent. Et gare à la somnolence… » | l.387 | UI dans la fiction | Prévenir | « clignote en rouge » : vérifier la conformité « pas de flash » (pulsation ≤ 1,5/s, `immersion.js:15` : OK). | Garder | — |
| `sms.5` « Ouverture à 8 h, on y va. » | l.388 | Fiction | Transition | — | Garder | — |
| Consigne « Clic ou Entrée : message suivant · Échap : tout passer » | `telephone-main.js:187`, `intro.suivant` (l.433) | UI | Avancer | 16 px blanc 60 % sur noir : plus petit texte de l'intro, coupé sur 2 lignes. | Garder (nécessaire) ; agrandir | P3 |
| Annonce « Prise en main 1/8 — Cliquez sur l'écran du PC… » **pendant** les SMS | `guide.js:75, 86` via `fermerMenuPrincipal` (`menu.js:45`) | UI | — | Mesuré : le guide démarre et s'annonce alors que le téléphone est à l'écran ; l'annonce est écrasée par le 1er SMS. Consigne hors de propos pour le lecteur d'écran. | Différer (démarrer le guide à `terminerIntro`) | P3 |
| Conversation de chapitre (patron) : en-tête « Le patron · direction de la salle » / « Mode histoire · semaine n/3 » | `histoire.js:59-62`, `histoire.patron/semaine` (l.448-449) | Fiction | Annoncer la semaine | Bon cadre narratif. | Garder | — |
| `histoire.c1.0` « …je vous confie les dossiers du réseau et les plaintes des Nantais (app Community). » | l.450 | Fiction | Élément de la semaine 1 | « app Community » : nom d'appli cité avant que le joueur ne l'ait vue. | Garder | — |
| `histoire.c2.0` « Nouveauté : vous pouvez envoyer des équipes de terrain… » + `c2.1` « …les pompiers ne sont disponibles qu'à partir de 70 » | l.453-454 | Fiction / Calc | Élément de la semaine 2 | **Faux depuis le prompt 108** : les équipes sont actives dès la semaine 1 (`histoire.js:42`). `c2.1` (palier 70, `game.js:1631`) est juste. | Reformuler `c2.0` | P1 |
| `histoire.c3.0` « Dernière semaine, et la plus dure : **15 secondes par dossier**. » | l.456 (EN l.2379) | Fiction présentée comme règle | Élément de la semaine 3 | **Faux** : sans « Défi chrono » (désactivé par défaut, `game.js:465`), il n'y a pas de compteur (prompts 80/87) ; la difficulté « difficile » joue 1 signalement à la fois et budget 40. Le joueur va se presser pour une contrainte inexistante, et `sms.2` lui a dit l'inverse. Même défaut que celui corrigé dans `sms.2` au prompt 131. Vu à l'écran (`b-05-chap3.jpg`). | Reformuler | P1 |
| `histoire.c3.1` « imprévus (météo aggravée, heure de pointe, panne de messagerie) et conflits entre deux lignes » | l.457 | Calc | Élément de la semaine 3 | Conforme (`game.js:440, 1825`). | Garder | — |

## 10. Guide « Prendre en main » (bulles, `guide.js`, prompt 37)

Vu : `fr-26-apres-intro.jpg`, `fr-27-apres-intro-2.jpg`, `expo-02-expo-lance.jpg`.

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Compteur « Prise en main n/8 » | `guide.js:151`, `guide.etape` (l.516) | UI | Se situer | Mesuré : passe de **1/8 à 3/8** ; l'étape 2 (`jauges`) se valide dès qu'un signalement est arrivé (`phase === 'selection'`, `guide.js:60`, `carte.js:49-50`), ce qui arrive presque toujours avant que le joueur ne s'assoie (voir horloge). | Reformuler la condition (ne valider `jauges` qu'après affichage) | P1 |
| Texte de l'étape 2 « Voici vos trois jauges… Sous 120 de score, le patron vous rappelle à l'ordre ; sous 90, dernier avertissement, puis licenciement. » | `guide.jauges` (l.518) | Calc | Seuils du patron (prompt 84) | Seule bulle qui donne les **seuils de licenciement** ; elle est sautée (ligne ci-dessus). Le joueur guidé ne voit donc jamais les seuils avant le 1er rappel. | Garder le contenu ; voir P1 ci-dessus | P1 |
| Étape 3 affichée « Ouvrez l'appli « Signalements »… » au lieu du texte « somnolence » | `guide.js:88-94`, `guide.ouvrirSignalements` (l.1125) | UI | Remettre le joueur sur la cible | Le numéro d'étape dit 3/8 mais le texte est celui d'une autre étape (cible de repli) ; la somnolence n'est expliquée qu'une fois l'appli ouverte. Le compteur ne correspond plus à ce qu'on lit. | Reformuler (compteur inchangé pendant les « retours à la cible ») | P2 |
| Flèche jaune rebondissante + contour jaune de la cible | `guide.js:110-168` | UI | Montrer où cliquer | Efficace ; rebond coupé si animations réduites. | Garder | — |
| Bulles `guide.installer/prendre/actions/apps.*/quitter/livre/retourPC/somnolence/alerte/sortir` | `guide.js:58-69`, l.517-524, 565, 814, 1119, 1221 | UI | Consignes pas à pas | `guide.actions` « répondez-lui (clic ou touche 1 à 3) » cohérent avec l'aide. `guide.prendre` « L'horloge du jeu se met en pause pendant la lecture » : vrai. | Garder | — |
| Boutons « Étape suivante » / « Arrêter le guide (G) » | `guide.js:211-214`, l.525-526 | UI | Contrôle | « Étape suivante » permet de sauter sans faire : voulu (« ne fait jamais l'action à sa place »). | Garder | — |
| « Guide arrêté. Le livre « Aide » et l'aide (H) restent disponibles. » / « Vous avez pris en main la salle de régulation ! » (4 s) | `guide.js:82, 105, 143`, l.527-528 | UI | Clore | Bon. | Garder | — |
| (absence) Horloge qui tourne pendant le guide | `IMMERSION.compression` ; aucun test `GUIDE.actif` dans le rythme | Calc | — | Mesuré : 08:00 → 10:03 pendant les deux premières bulles (`fr-27`), 3 signalements déjà en attente. Le guide ne suspend pas le temps, contrairement au tutoriel (`immersion.js:486`). | À trancher (suspendre le temps pendant les étapes 1-2) | P2 |

## 11. Aide et tutoriel (`aide.js`, prompts 122-123 ; tutoriel `immersion.js:486-680`, prompts 34, 112)

Vu : `fr-11…14-aide-*.jpg`, `en-04-aide-en.jpg`, `b-04-tuto-3.jpg`.

### 11a. Fenêtre d'aide

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Titre « Aide et tutoriel — Nantes en régulation » | `aide.js:218`, `aide.titre` (l.237) | UI | — | « — Nantes en régulation » redit le nom du jeu dans le jeu. | Alléger | P3 |
| Onglets « 1 · Bien démarrer », « 2 · Règles », « 3 · Raccourcis », « 4 · Malus » + annonce « Aide, onglet n sur 4 : … » | `aide.js:13-14, 220-257`, l.257-261, 262 | UI | Navigation | Bonne structure (prompt 123). | Garder | — |
| Onglet 1 : « OBJECTIF » + texte (26 px) « Garder fluidité, réputation et budget au vert — orange sous 40, rouge sous 20. Score de la semaine = somme des 3 jauges (0–300). » | `aide.js:293-297`, `aide.texte` §0 (l.259) | Calc | L'essentiel | Juste et lisible. | Garder | — |
| Légende des seuils 0–20 rouge / 20–40 orange / 40–100 vert + chiffres | `aide.js:299-309` | Calc | Lire une jauge | Redit le texte au-dessus (voulu : schéma + texte). | Garder | — |
| « · Fluidité · Réputation · Budget » sous la barre | `aide.js:311` | UI | — | Liste flottante sans rôle : les noms sont déjà dans la phrase. | Supprimer | P3 |
| Carte « LE TUTORIEL » : « 6 pages illustrées, dans le livre « Aide » : » + 6 titres + « Lancer le tutoriel (T) » | `aide.js:312-337`, `aide.tuto.*` (l.275-276), `tuto.n.titre` | UI | Accès au tutoriel | Bon (prompt 123). | Garder | — |
| Onglet 2 « Règles » : cartes SIGNALEMENTS, RÉPONDRE, GRAVITÉ ET RETARD, LE PATRON, TÂCHES DU JOUR, DÉFI CHRONO, SOMNOLENCE, COMPRENDRE UNE DÉCISION, GLOSSAIRE ; « Page 1 / 2 » | `aide.js:147-149`, `aide.texte`, `aide.carte.*` (l.265-274) | Calc | Référence | **Vérité** : « GRAVITÉ ET RETARD : Élevée (retard ≥ 20 min…), moyenne (10–19 min…). Le retard s'aggrave tant qu'il attend » — ne joue **qu'en temps réel** (prompt 134 : archives sans minutes). « TÂCHES DU JOUR » est un bloc de 9 lignes très dense (6 mécaniques en une carte). « carnet dans le Journal (K) » alors que l'ouverture du carnet est `J` (`mecaniques.js:262`) ; `K` bascule la vue du Journal (`journal.js:742`). | Reformuler (préciser « en temps réel ») ; vérifier J/K | P2 |
| Onglet 3 « Raccourcis » : 19 raccourcis en 4 groupes, touche en capsule | `aide.js:150-179`, `aide.k.*` | UI | Référence clavier | « 5 6 7 8 Sources » alors que le tutoriel (étape 3) et la règle « Répondre » disent « E : sources » ; `E`, `J`, `K`, `D`, `S`, `F`, `G`, `C`, `0` (défi) absents de la liste. « Tab : Objets · signalements actifs · logo RégulOS · tâche » : 4 sens pour une touche, illisible. | Reformuler (une liste juste, sans doublon de sens) | P3 |
| Onglet 4 « Malus » : 5 malus (nom en rouge + condition → conséquence) | `aide.js:137-145, 180`, `Jeu.MALUS` | Calc | Connaître les pénalités | « Incident non traité : dossier expiré sans décision → conséquences naturelles du dossier **(Q25)** » : référence interne au livret, illisible pour le joueur ; « expiré » ne vaut qu'en défi chrono (sinon « non traité » à 20 h). | Reformuler (retirer « (Q25) ») | P2 |
| Pied : « ← → ou 1 à 4 : onglets · T : tutoriel · Échap : fermer » / pagination ← Page n/N → / « Lancer le tutoriel (T) » / « Fermer (Échap) » | `aide.js:281-288`, `aide.clavier` (l.264), `aide.page` (l.263) | UI | Navigation | Correct ; l'aide clavier disparaît quand il y a pagination (choix de place). | Garder | — |

### 11b. Tutoriel (livre « Aide »)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| « Tutoriel — étape n/6 » + barre de progression cliquable | `immersion.js:618-631`, `tuto.etape` (l.397) | UI | Se situer, sauter | Bon (prompt 112). | Garder | — |
| Titre de page (46 px) + illustration pixel + texte (23 px) | `immersion.js:632-646`, `tuto.1…6.titre/texte` (l.404-417, 1218-1219) | Calc / UI | Apprendre | `tuto.1.texte` : « semaine réelle, de 8 h à 20 h… » juste. `tuto.4.texte` « l'équipe part de son centre réel » : vrai (prompt 109). | Garder | — |
| Bandeau des touches de l'étape (`tuto.n.touches`) | `immersion.js:648-655`, l.406-418, 1220 | UI | Raccourcis contextuels | `tuto.3.touches` « 1 à 3 : répondre · E : sources » contredit l'aide (« 5 6 7 8 »). | Fusionner avec l'aide (une seule vérité) | P3 |
| Pied de page gauche « Livre « Aide » · aussi dans l'aide (T) » | `immersion.js:645`, `tuto.pied` (l.403) | UI | Retrouver le tutoriel | Utile une fois. | Garder | — |
| « Passer (Échap) », « Précédent (←) », « Suivant / Terminer (Entrée) » + focus jaune | `immersion.js:660-670`, l.398-401 | UI | Avancer | Bon. | Garder | — |
| (absence) Tutoriel non montré si le guide est coché | `immersion.js:482`, `sketch.js:324` | UI | — | Les deux parcours s'excluent : le joueur guidé ne voit jamais le tutoriel illustré et inversement, sans que l'écran « Nouvelle partie » le dise. | Reformuler la case (§ 7) | P3 |

## 12. Mode exposition `?expo=1` (`expo.js`, prompt 132)

Vu : `expo-01-menu-expo.jpg`, `expo-02-expo-lance.jpg`, `expo-04-expo-pause.jpg`.

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Démarrage court « le joueur arrive assis devant la carte » | `expo.js:33-42`, `sketch.js:321` | UI | Gagner une minute au visiteur | **Non tenu à l'écran** : mesuré `vue = 'bureau'`, guide « Prise en main 1/8 · Cliquez sur l'écran du PC » + bandeau « Incident en cours : cliquez sur l'écran du PC (Entrée)… » (deux consignes identiques superposées). Cause probable : `expoAuPoste()` met `vue = 'poste'` dans la promesse, puis `fermerMenuPrincipal()` (`sketch.js:171` → `menu.js:48`) remet `vue = 'bureau'` à l'image suivante. À vérifier par l'équipe. | Corriger (à confirmer) | P1 |
| Horloge déjà à 10:02 quand le visiteur lit la 1re bulle ; 3 signalements en attente | capture `expo-02` | Calc | — | Deux heures de service perdues avant le premier geste du visiteur. | À trancher (temps suspendu jusqu'au 1er geste en expo) | P2 |
| Voile « Partie en pause » + « Touchez l'écran pour continuer · retour à l'accueil dans {s} s » (`role=alertdialog`, `aria-live=assertive`) | `expo.js:52-78`, `expo.pause/retour` (l.1175-1176), `style.css:31-58` | UI | Libérer le poste | **Vérité** : le jeu n'est **pas** en pause — mesuré 10:02 → 10:10 sous le voile (le temps file ×100). Si le visiteur revient, sa journée a avancé. Compte à rebours mis à jour toutes les 500 ms : annoncé en `assertive` à chaque seconde par le lecteur d'écran (bavard). | Reformuler (« Toujours là ? ») ou suspendre réellement le temps ; `aria-live` polite | P2 |
| (absence) Marque discrète « EXPO » sur l'écran titre | prompt 132 § 1 dernier point | UI | Que l'équipe sache le mode actif | Demandée au prompt 132, **absente** du code (aucun dessin conditionné à `EXPO.actif` dans `menu.js`). | Ajouter | P3 |
| Purge des clés sauf réglages, langue, palmarès | `expo.js:18-28` | UI | Visiteur suivant propre | Le palmarès gardé devient un classement de salle (voir § 6). | À trancher | P2 |
| Liens externes du menu (Livrables, Dépôt, Partager, Présentation, Crédits) | `menu.js:306-381` | Méta | — | Actifs en expo (voir § 2). | Différer en expo | P2 |
| Démo automatique de l'écran titre | `accessibilite.js:231+` | Réel | Attirer | Bon pour l'expo (faits réels datés). | Garder | — |

## 13. Filet d'erreur et bandeau de version (`installation.js:43-63, 108-138`)

Vu : `b-07-filet.jpg` (erreur provoquée dans `draw`).

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| « Petit souci d'affichage : on relance le jeu… » (`role=alert`) puis rechargement à 3 s, au plus 1/min | `installation.js:114-138`, `filet.message` (l.1177) | UI | Ne jamais laisser un écran figé | Ton juste, pas de jargon. Ne dit pas que la partie reprendra (« Reprendre » existe hors expo, purge en expo) : rassurer coûte trois mots. Sans `sessionStorage`, aucun message et l'écran reste figé (choix assumé contre la boucle). | Reformuler (« …votre partie est sauvegardée » hors expo) | P3 |
| Bandeau « Nouvelle version disponible. » + « Recharger » + « Fermer » | `installation.js:43-63`, `pwa.nouvelleVersion/recharger` (l.823-824) | UI | Mise à jour PWA | En pleine partie, « Recharger » sans dire si la partie est conservée. En expo, un visiteur peut le déclencher. | Reformuler ; Différer en expo | P3 |

---

## Informations manquantes

1. **Quelle semaine réelle, et combien de faits réels** — l'écran « Nouvelle partie » ne donne ni la date de la
   semaine (`accueil.semaine`, l.160, orpheline) ni la part « n perturbations réelles · n événements de l'agenda »
   (`accueil.info`, l.162, orpheline ; données `s.dossiers`, `s.evenements` déjà calculées `sketch.js:108`). C'est
   pourtant l'information qui tient la chaîne source → œuvre au moment du choix. **Ajouter — P1.**
2. **L'hypothèse d'affluence et l'incident fictif** — rien, avant la partie, ne dit que l'affluence d'un événement est
   supposée (prompt 134) ni qu'un incident par semaine peut être fictif (prompt 119, badge `fictif.badge` l.605 en jeu
   seulement). Crédits affirment l'inverse (§ 4). **Ajouter une ligne dans Crédits et dans « Nouvelle partie » — P1.**
3. **Où l'on voit la règle des 10 minutes** — le seul mode qui la joue est verrouillé ; aucun écran d'entrée ne dit au
   jury « en archives, pas de retard en minutes ; en temps réel, seuil 10 min ». **Ajouter (carte temps réel) — P2.**
4. **Statut « en ligne / hors ligne » sur l'écran titre** — la grammaire promet un indicateur « hors ligne » quand l'API
   ne répond pas ; l'écran titre ne montre rien (seule la carte temps réel dit « Indisponible hors ligne »). **Ajouter
   (discret) — P3.**
5. **État d'échec du chargement** — si p5 ou les données manquent, « Chargement… » ne change jamais. **Ajouter — P3.**
6. **Annonces lecteur d'écran** au premier affichage du menu, à l'ouverture de Paramètres, Palmarès et Aide. **Ajouter —
   P2.**
7. **Raison d'un bouton désactivé** (« Lancer la partie » sur le temps réel verrouillé) à côté du bouton. **P3.**

## À trancher par le groupe

1. **Bloc Livrables / Dépôt / Partager / Présentation** : le prompt 136 a voulu « Livrables » pleine largeur ; c'est
   aujourd'hui l'élément le plus large de l'écran d'entrée. Garder (jury d'abord) ou le réduire au niveau des trois
   autres ? Et en `?expo=1` : masquer ces sorties (nouvel onglet sur le kiosque) ?
2. **Autorisations avant la partie** (prompt 110) ou au premier usage (souffle au café, main pour la sieste) ? Le
   premier choix supprime toute fenêtre en jeu, le second retire un écran à tous ceux qui ne croiseront pas ces gestes.
3. **Mode temps réel** : le laisser verrouillé derrière 3 semaines, ou l'ouvrir en `?expo=1` / pour le jury, puisque
   c'est le seul mode où la règle structurante (10 min) joue ?
4. **Palmarès en exposition** : classement de salle partagé (gardé par la purge, `expo.js:20`) ou personnel (purgé) ?
   Et sa carte au menu tant qu'il est vide.
5. **Temps qui file pendant le guide et sous le voile « Partie en pause »** : suspendre l'horloge (vérité du mot
   « pause », visiteur qui revient) ou garder la pression du temps ?
6. **Options de jeu (prompts 88-91)** visibles de tous les joueurs, ou réservées à l'équipe (paramètre d'URL) ? La note
   « options proposées au groupe » n'a pas de sens pour un visiteur.
7. **Couleur de l'état « oui »** dans Paramètres et Accessibilité : rouge primaire (identité DS, prompt 115) ou une
   couleur qui ne se lit pas « erreur » ?
8. **Noms du pied + carte « Crédits »** : deux chemins vers la même page ; lequel garder (prompt 125 a voulu les noms) ?

## Constats transverses (volet A)

1. **Les textes d'entrée décrivent un autre jeu que celui qui tourne (P1).** Après le prompt 131 (`sms.2`, `sms.4`),
   il reste : « 15 secondes par dossier » (`histoire.c3.0`), « Nouveauté : équipes » (`histoire.c2.0`) et « un nouvel
   élément chaque semaine » / « semaine 2 — équipes » (menu) alors que les équipes sont là dès la semaine 1 (prompt
   108), « retards ×0,5 » comme variable de difficulté alors que les archives n'ont pas de minutes (prompt 134),
   « Données : réelles, rien n'est inventé » dans les Crédits malgré le prompt 119. Ce sont des affirmations que le
   joueur utilise pour décider (se presser, attendre les équipes, choisir une difficulté). Un contrôle du même type que
   celui du prompt 131 (`test-jeu.mjs` sur `sms.*`) étendu à `histoire.c*`, `mp.mode.*`, `mp.difficulte`,
   `credits.ia.donnees.v` les tiendrait à jour.
2. **La source est invisible au moment du choix (P1).** Les dates des semaines, la part perturbations réelles /
   événements de l'agenda et l'hypothèse d'affluence existent dans les données ou dans des clés i18n orphelines, mais
   aucun écran d'entrée ne les montre ; seule la démo automatique de l'écran titre cite des faits réels datés. Pour le
   jury, la chaîne source → œuvre doit être lisible avant la première partie.
3. **Le mode exposition ne tient pas ses deux promesses à l'écran (P1).** Le visiteur n'arrive pas « assis devant la
   carte » (vue bureau + guide 1/8 + bandeau, cause probable `fermerMenuPrincipal` après `expoAuPoste`), et « Partie en
   pause » laisse filer l'horloge. S'y ajoutent les liens externes ouverts en nouvel onglet sur le kiosque et la marque
   « EXPO » demandée au prompt 132 qui manque.
4. **Quatre systèmes d'accueil se recouvrent (P2).** SMS (6), guide (8 bulles) ou tutoriel (6 pages, exclusifs l'un de
   l'autre), aide (4 onglets) et livre « Aide » redisent la même règle : « gardez les 3 jauges au vert » apparaît 6 fois
   avant la première décision, tandis que l'information la plus utile — les seuils du patron (120 / 90) — n'est dans
   le guide qu'à l'étape 2, qui se valide toute seule dès qu'un signalement arrive. On répète l'évident et on perd
   l'essentiel.
5. **Raccourcis clavier : partout dans les libellés, nulle part cohérents (P3).** Le prompt 124 a retiré l'aide clavier
   de l'écran titre pour l'immersion, mais « (C) », « (H) », « (Entrée) », « (Échap) », « touche N » restent dans les
   libellés et les lignes d'aide de Partager, Crédits, Autorisations, Paramètres. Mêmes touches, sens différents selon
   l'écran (C, G, Entrée) ; l'aide liste « 5 6 7 8 » pour les sources quand le tutoriel dit « E ». Une table unique des
   raccourcis (source de l'aide, du tutoriel et des libellés) éviterait ces écarts.
6. **Lecteur d'écran : annonces présentes en navigation, absentes à l'arrivée (P2).** Chaque changement de focus est
   annoncé, mais le premier affichage du menu, l'ouverture de Paramètres, Palmarès et Aide ne disent rien ; à l'inverse
   le voile d'expo annonce son compte à rebours en `assertive` chaque seconde, et le guide s'annonce pendant les SMS.
