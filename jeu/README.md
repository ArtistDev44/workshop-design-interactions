# jeu/ — Salle de contrôle Nantes (œuvre p5.js)

Ce dossier décrit, fichier par fichier, les fonctionnalités du jeu « Salle de
contrôle Nantes » : un jeu façon *Paper Please* où le joueur rejoue une semaine
réelle du réseau de transports nantais et tranche des décisions de régulation
à partir de données réelles (API Nantes Métropole + Open-Meteo), avec fallback
local obligatoire.

Phrase-problématique : *« Rejouer une semaine réelle du réseau de transports
nantais et prendre, en salle de contrôle, les décisions de régulation qui
préservent la fluidité du réseau — chaque incident réel de l'API devenant un
dossier à trancher sous pression. »*

## Sommaire

| N° | Fichier | Contenu |
|---|---|---|
| 00 | `00-concept.md` | Spec verrouillée, phrase-problématique, chaîne source → grammaire → système → œuvre |
| 01 | `01-boucle-gameplay.md` | Boucle de décision, détection des incidents, compteur de temps |
| 02 | `02-donnees-api.md` | Sources de données, mapping API → incident, seuils |
| 03 | `03-actions-decisions.md` | Les 3 actions + « ne rien faire », effets contextuels |
| 04 | `04-jauges-et-fins.md` | Jauges (fluidité, satisfaction, réputation) et fins multiples |
| 05 | `05-ui-ecrans.md` | Écrans de la salle de contrôle, mise en page 1920×1080 |
| 06 | `06-narration.md` | Textes entre les décisions, progression de la semaine |
| 07 | `07-fallback-offline.md` | `data/fallback.json` : 6 cas figés, mode hors ligne |
| 08 | `08-raccourcis.md` | Raccourcis clavier / touch du jeu |
| 09 | `09-parametres.md` | Paramètres réglables (difficulté, durée, accessibilité) |
| 10 | `10-accessibilite-robustesse.md` | Checklist accessibilité et robustesse du jeu |
| 11 | `11-direction-artistique.md` | Direction artistique verrouillée : palette, polices, low poly léger |
| 12 | `12-bureau-pixel.md` | Bureau en pixel art : vue d'entrée, PC avec le jeu en direct, zoom au poste |
| 13 | `13-immersion.md` | Immersion : SMS, journées, horloge ×10, sieste, alertes rouges, mail, livres |
| 14 | `14-immersion-visuelle.md` | PC centré, vignettage, clignement d'œil, mail enrichi et évalué |
| 15 | `15-bureau-moderne-design-system.md` | Bureau moderne en vue depuis la chaise, vue sur le Château des ducs, Pixel Design System sur le PC |
| 16 | `16-bureau-apps.md` | Prompt 22 : apps du PC (patron, carte et équipes, community, journal), jauges fluidité / réputation / budget |
| 17 | `17-profondeur-tactique.md` | Prompt 23 : conseils, modificateurs de journée, objectifs, malus, paliers de budget, profil de fin |
| 18 | `18-multi-langue.md` | Prompt 24 : jeu en français et en anglais, dictionnaire `i18n.js`, textes différés, sélecteur FR / EN, touche L, aria-live |
| 19 | `19-vue-3d-pc.md` | Prompt 25 : dézoom fixe de la vue bureau (fond visible autour de la pièce), caméra fausse 3D façon FNAF (souris hors cadre, flèches, 12 px max, parallaxe) |
| 20 | `20-sortie-mode-pc.md` | Prompt 26 : sortir du PC — bouton « Quitter le PC » (clic, Tab), molette au poste avec anti-rebond, porte du bureau → menu |
| 21 | `21-loading-screen.md` | Prompt 27 : écran de chargement bleu + logo (anti-flash, fond sombre immédiat), musique de fond WebAudio dès le premier geste |
| 22 | `22-dialogues-nantais.md` | Prompt 28 : plaintes des Nantais dans `data/messages.json` (brut, modifiable), déclenchées par les dossiers réels, réponses avec effets dans l'app Community |
| 23 | `23-interactions-hors-ecran.md` | Prompt 29 : objets de la pièce en vue bureau (lampe persistée, store de la fenêtre avec vraie météo et heure, plante, tasse, dossiers), sans pause ni effet sur les jauges |
| 24 | `24-bandes-sonores.md` | Prompt 30 : ambiances WebAudio contextuelles (pluie réelle, ville/tram le jour, nuit calme) et signaux (incident, compteur à 0, mail, clics au poste) |
| 25 | `25-bureau-cadrage-chaise.md` | Prompt 31 : cadrage « sur la chaise » (recadrage centré, accoudoirs retirés), horloge murale à l'heure du jeu, applique murale à la place de la lampe d'architecte |
| 26 | `26-bureau-style-epure.md` | Prompt 32 : pièce blanche et épurée (plafond, menuiseries, plateau, porte), bois réduit à un chant, vignettage neutre, contour de survol double lisible sur blanc |
| 27 | `27-sauvegarde-progression.md` | Prompt 33 : sauvegarde automatique par semaine (`pxe-nte001-partie-<semaine>`), « Continuer la partie », reprise exacte (graine + tirages), export/import JSON validé dans les Paramètres |
| 28 | `28-fenetre-loire-tutoriel.md` | Prompt 34 : baie sur la Loire (hauteur réelle Hub'Eau, repli médiane), grue aux couleurs de la ville, plus de château ni de quai, souris et téléphone en perspective, livre « Commande » (« Aide » depuis le prompt 70) et tutoriel en 5 étapes |
| 29 | `29-correctifs-plein-ecran-livres.md` | Retours de rendu : vue plein écran surcadrée avec bords flous et vignettage, grue opaque à l'échelle des immeubles, porte supprimée, souris et téléphone orientés vers l'écran, tasse de thé, téléphone et livres animés, livres ouverts en double page, QR codes régénérés |
| 30 | `30-menu-principal.md` | Prompt 35 : menu principal plein écran avant le bureau (Nouvelle partie, Reprendre, Paramètres, Aide, Tutoriel), choix de la semaine sorti du PC, menu Échap modernisé ; prompt 81 : dépôt, partage (X, Facebook, LinkedIn, Mastodon, copier le lien), crédits et licence MIT |
| 31 | `31-applications-indicateurs.md` | Prompt 36 : icônes RégulOS agrandies, Corbeille fonctionnelle, app flottante « Indicateurs » déplaçable (fluidité, réputation, budget, objectif, palier) |
| 32 | `32-prendre-en-main.md` | Prompt 37 : option « Prendre en main » à la première partie, 6 étapes fléchées validées par les actions du joueur, cibles relevées au dessin |
| 33 | `33-scroll-telephone-pluie.md` | Prompt 38 : molette ↑ pour s'installer au PC, téléphone cliquable avec notifications réelles de l'Agenda Nantes Métropole (repli local), pluie aléatoire et réaliste |
| 34 | `34-interface-pixel-design-system.md` | Prompt 39 : toute l'interface au Pixel Design System (fond #0D0C0C, primaire #D4031C, arrondi 0, JetBrains Mono / Bitsy Pixels), textes ajustés à la police monospace |
| 35 | `35-parallaxe-fausse-3d.md` | Prompt 40 : parallaxe multicouche — 6 plans de la pièce décalés à leur propre échelle avec la caméra (0,35 à 1,25), zones cliquables qui suivent leur plan |
| 36 | `36-tests-difficulte.md` | Trois tests de difficulté (4 profils simulés × 3 semaines) et rééquilibrage des valeurs des actions : bonne fin de nouveau atteignable |
| 37 | `37-mode-histoire.md` | Prompt 41 : mode histoire (facile → normale → difficile) et temps réel à débloquer, un élément de jeu de plus par semaine, rapport papier sur la table, 3 cinématiques de fin |
| 38 | `38-telephone-en-main.md` | Prompt 42 : le téléphone pris en main (animation réutilisable) pour l'intro, les conversations du patron et les notifications |
| 39 | `39-vue-pc-ux-temps-transitions.md` | Prompt 43 : écran du PC à 90 % au poste, indicateurs redondants retirés, bandeau d'état, effets des actions et seuils visibles, temps ×30, écran noir « JOUR n — SEMAINE n » |
| 40 | `40-musiques-immersion-sonore.md` | Prompt 44 : 4 morceaux chiptune originaux au choix (Paramètres, touche 8) et 7 pistes d'immersion sonore (radio, alertes par source, tic-tac, clics, jauges, vent / canicule, signatures de fin) |
| 41 | `41-meteo-progressive-seo.md` | Prompt 45 : météo de la baie en fondu (jour/nuit, pluie), et SEO : description, canonique, Open Graph, carte Twitter, image OG du vrai rendu, nouveau favicon, manifeste, JSON-LD |
| 42 | `42-mecaniques-narration.md` | Prompt 47 : inspection surprise, palmarès et profils de gestion, journal de bord, fin « démission », épilogue du mail, agenda anticipé |
| 43 | `43-accessibilite-technique.md` | Prompt 48 : daltonisme, taille du texte, lecture facile, reprise sur un autre appareil, démo automatique, service worker hors ligne, courbes des jauges, `test-jeu.mjs` |
| 44 | `44-lofi-lisibilite-meteo.md` | Prompt 49 : lofi CC0 par défaut et bruitages en retrait, textes du PC ≥ 18 px, carte sans météo, climat selon le mode (direct : API ; semaine : archives) |
| 45 | `45-enquete-sources.md` | Prompt 50 : signalement vague, faits révélés par carte, info trafic, météo, agenda (5 à 8, −4 s) ou par la pièce ; plus de conseil ni de flèches ; appli Régulation en fenêtre, barre des tâches visible |
| 46 | `46-horloge-sablier-lumiere.md` | Prompt 51 : finir sa journée à l'horloge (alerte, départ anticipé, blâme du patron le lendemain), sablier, lumière de la pièce (lampe, stores, heure, halo de l'écran), ombres portées |
| 47 | `47-cafe-boost.md` | Prompt 52 : le café en main (animation du téléphone), boost de 25 s — cœur qui s'accélère, pulsation rouge des bords, lignes de vitesse, flou, champ élargi ; sources gratuites pendant le boost |
| 48 | `48-animations-feedback.md` | Prompt 53 : arrivée du dossier (300 ms, tampon « SIGNALEMENT », ligne qui pulse), jauges qui glissent avec deltas flottants, pulsation douce sous 20, urgence du compteur sous 10 s (barre rouge, sablier qui s'emballe, tic-tac plus fort) |
| 49 | `49-micro-interaction-sonore.md` | Prompt 54 : push-to-talk (M maintenue, micro du poste), analyse amplitude / hauteur / souffle / pics, texture granulaire (densité, hauteur, fragmentation, turbulence), repli interne, réglage Micro |
| 50 | `50-defis-ralenti.md` | Prompt 55 : trois défis de semaine tirés par la graine (bilan réel, +5 si tenu, une fois) et ralenti tactique (R, 10 s, une fois par jour) |
| 51 | `51-rapport-semaine-deblocage.md` | Prompt 56 : mail du patron du dernier soir, rapport en deux pages (chiffres réels de la semaine), rapport avant la cinématique, autre semaine archivée, défis au palmarès |
| 52 | `52-webcam-presence-sieste.md` | Prompt 57 : webcam du poste (opt-in), présence par luminance centrale et mouvement en local (48×27, rien d'affiché ni envoyé), absence de 8 s → sieste, LED et « CAM » |
| 53 | `53-mobile-fondations.md` | Prompt 60 (sous-étape 60a) : détection du téléphone, gestes (tap au relâchement, appui long, swipe), paysage plein écran, avis portrait, clavier virtuel, allègement ; ordinateur inchangé |
| 54 | `54-mobile-portrait.md` | Prompt 60 (sous-étape 60b) : mise en page portrait par recomposition (canevas 1080×1920) — appli en colonne défilante, objets du bureau en grosses cibles, fenêtres et objets en main recadrés ; ordinateur inchangé |
| 55 | `55-donnees-presentation.md` | Prompt 61 : appli « Données » plein écran (données réelles du mode joué, état, source, licence, lien d'API) et page /presentation générée depuis slides.md |
| 56 | `56-tasse-musique-sieste.md` | Prompt 62 : tasse redessinée en pixel art (gorgée, vapeur, main), « Chillin' Poupi » par défaut, sieste qui se déclenche réellement (inactivité plus remise à zéro par les suites automatiques) |
| 57 | `57-community-enquete-micro-webcam.md` | Prompt 63 : 0–3 réactions échelonnées aux réponses Community, enquête après coup dans le Journal (4 volets, journées), radio des chauffeurs et souffle au micro, geste de réveil à la webcam |
| 58 | `58-micro-souffle-webcam-presence.md` | Prompt 64 : micro limité au souffle (texture et radio retirées), présence webcam réparée (part de pixels qui changent, sieste aussi pendant un dossier) |
| 59 | `59-webapp-installable.md` | Prompt 65 : webapp installable — manifest complet (maskable, captures, raccourcis), précache généré de tout le site, réseau d'abord pour les pages, bandeau de nouvelle version, bouton d'installation |
| 61 | `61-main-webcam-sieste.md` | Prompt 67 : une main montrée à la webcam lance ou interrompt la sieste (couleur peau + mouvement, local) ; l'absence ne déclenche plus la sieste |
| 62 | `62-carte-appli-principale.md` | Prompt 68 : la Carte remplace l'appli Régulation (phase sélection sans chrono, file, gravité, onglets Enquête / Historique / Équipes), équipes limitées (effectifs, cycle, pertinence, demi-effet hors sujet) |
| 63 | `63-revue-game-design.md` | Prompt 66 : revue game design — correctif de la file de la Carte entre deux semaines, guide en 7 étapes dont la bulle ne masque plus le dossier, aide et tutoriel complets, rapport lisible |
| 64 | `64-fin-de-journee-nuit-sortie.md` | Prompt 69 : « Ranger le poste », la nuit tombe (21 h en 4 s), flèche « Sortie » au bord gauche, pan vers le couloir, écran noir, lendemain 8 h (prompt 76) ou bilan |
| 65 | `65-sieste-paupieres.md` | Sieste : paupières en surcouche plein écran (tout le contenu caché), fermeture avec sursaut et ouverture avec clignement, fondu si animations réduites |
| 66 | `66-livre-aide.md` | Prompt 70 : le livre « Commande » devient « Aide » (objet, couverture pixel, textes FR + EN, guide) |
| 67 | `67-demarrage-pc-chaque-jour.md` | Prompt 71 : démarrage du PC rejoué au début des jours 1 à 3 (après « JOUR n »), une fois par jour, temps suspendu, écourté si animations réduites |
| 68 | `68-alertes-choix-reponses.md` | Prompt 72 : alertes (météo, secours, affluence) — 2 ou 3 réponses rédigées sur les données réelles, chacune une action ou un envoi d'équipe, ordre mélangé par la graine, actions de base toujours disponibles |
| 69 | `69-suppression-carte.md` | Prompt 73 : plus de carte (aucune géométrie dans les sources) — appli « Signalements », liste à gauche (heure, type, ligne + nom réel, gravité, expiration), n'importe quel signalement se prend au clic ou ↑ ↓ Entrée, équipes en texte |
| 70 | `70-variete-comprehension-regulation.md` | Prompt 74 : explication du poste à la première ouverture, actions en langage métier (tutoriel, aide, guide), ordre d'arrivée par la graine, fil de la journée (objectif, bilan de la veille, liaisons, rythme 10 h / 12 h / 17 h, séries), narration enrichie |
| 71 | `71-logo-bouton-demarrer.md` | Prompt 75 : le bouton en bas à gauche de la barre des tâches reprend le logo du chargement (formes uniques `LOGO_PXE`, testées contre le SVG), retour à l'accueil de RégulOS au clic ou Tab + Entrée |
| 72 | `72-horaires-8h.md` | Prompt 76 : la journée commence à 8 h 00 (fin 20 h), dossiers d'avant 8 h ramenés à 8 h (calcul sur l'heure de la partie), anciennes sauvegardes recalées, textes FR + EN |
| 73 | `73-temps-x100-multitache-notifications.md` | Prompt 77 : temps ×100 entre les dossiers, jusqu'à 3 signalements actifs avec compteurs indépendants (Tab / clic, expiration individuelle en arrière-plan), notifications style bureau cliquables |
| 74 | `74-somnolence-sieste.md` | Prompt 78 : jauge de somnolence (temps de jeu + inactivité, valeurs verrouillées) à la place du sablier supprimé ; sieste volontaire (jauge, Z, main) ou forcée à 100, temps ×100, signalements expirés pendant la sieste = « non traité » + malus de sieste, bilan au réveil ; tutoriel « Le jour et la sieste » |
| 75 | `75-retards-aggravation-community.md` | Prompt 79 : retard effectif = vrai retard + 1 min / 2 min de jeu (plafond +30, figé à la décision), lu par Q58 / gravité / conséquences / conflit ; +5 min durables sur la ligne après un raté ; Community : délai de réponse, réponse tardive ou expiration = −3 de réputation, bilan au mail |
| 76 | `76-revue-ux-globale.md` | Prompt 80 : revue UX globale — bandeau d'état lisible (règle des 20 px), notifications en barre des tâches quand une appli est ouverte, aide (H) entière et à jour, codes couleur expliqués ; rapport dans notes.md |
| 77 | `77-rappel-licenciement-game-over.md` | Prompt 84 : sanction progressive (rappel à l'ordre, dernier avertissement, licenciement) sur les 3 jauges avec hystérésis, écran « LICENCIÉ » et lettre du patron (faits réels), exception à Q47 |
| 78 | `78-community-compte-social.md` | Prompt 85 : Community devient le compte fictif @regul.nte du réseau inventé « Quai » — profil, fil de posts réels et d'archive illustrés de photos pixel dessinées par le code, mentions, messagerie privée, info trafic publiée par le joueur |
| 79 | `79-patron-messagerie-moderne.md` | Prompt 86 : messagerie du patron modernisée — messages typés avec valeurs réelles, consigne épinglée, filtres, historique complet avec séparateurs, cartes enrichies, réponses rapides sans effet, panne avec messages « reçus en retard » |
| 80 | `80-decision-sans-chrono.md` | Prompt 87 : plus de chrono par défaut (horloge en pause pendant la lecture, « non traité » à l'heure de fin, difficulté = actifs / aggravation / budget), mode « Défi chrono » optionnel, panneau en 3 blocs + « En savoir plus », réponses par catégorie (retard, travaux, affluence, météo, accident) avec tendance et retour expliqué ; exceptions Q5/Q6/Q16/Q25/Q40/Q55/Q57–Q60 |
| 81 | `81-diagnostic-repetition.md` | Prompt 88 § 0 : mesure de la répétition sur les 3 semaines réelles (`scripts/mesure-repetition.mjs`) — part du type dominant, types par journée, suites, textes identiques, journées vides ou surchargées ; priorités et propositions écartées |
| 82 | `82-engouement-variete.md` | Prompt 88 : briefing du matin, info trafic, préparer un événement, rapport du soir et carnet ; rotation des tâches ; thème du jour et cellule de crise ; expérience, grade et badges ; options du groupe (chaînes, déblocages, arbitrage) désactivées par défaut ; mesure avant / après (type dominant 82 % → 31 %, textes répétés 30 → 0) |
| 83 | `83-journal-de-bord-moderne.md` | Prompt 89 : appli Journal en tableau de bord — pastilles des journées, tuiles (mini-courbes réelles), filtres, frise horaire de cartes groupées, vue Semaine (courbe 0–300 et seuils), enquête en fiche (citation, puces, dés pixel, barres des effets attendus), copie du résumé |
| 84 | `84-pression-morale-interface-narratrice.md` | Prompt 89 (pression morale) : la file devient le journal visuel de la journée (traités, non traités avec calcul Q25), retard figé rappelé, mémoire de la ligne, rapport de la veille sur le bureau, mail du soir citant le fait marquant ; options du groupe désactivées par défaut (trace dans le dossier, pression visible, dé visible, éclairage lié aux jauges) |
| 85 | `85-notifications-telephone.md` | Prompt 90 : le téléphone devient un fil de notifications — une appli par source (agenda, météo, travaux, Loire, messages, Régul', Quai, rappels ; parkings, vélos, trafic, pollens en direct seulement), arrivées spontanées mesurées, priorités, Ne pas déranger, écran de verrouillage et centre de notifications |
| 86 | `86-presentation-slidev.md` | Prompt 82 : /presentation en Slidev (dossier `slides/`), thème Pixel Design System, layouts variés, captures du jeu annotées de flèches, Début / Fin et annonce du numéro ; bouton « Présentation » dans le menu du jeu |
| 87 | `87-applis-reliees-somnolence-priorites.md` | Prompt 91 : correctif de la messagerie figée (nom global en double), applis reliées (publier sur Community depuis le dossier, « Voir le dossier », Échap revient), priorités imposées 2 → 3, sieste utile ; déblocage par semaine et somnolence nécessaire en options désactivées |
