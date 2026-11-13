/* Nantes en régulation — boucle p5 et écrans (Q41 : sketch.js = affichage, game.js = logique).
 * Prompt 16 : écran d'accueil + salle de contrôle 1920×1080. La logique des décisions (effets,
 * jauges, narration, fins) arrive aux prompts 17 à 19 : ici les actions ne font que passer au dossier suivant.
 * Direction artistique : jeu/11-direction-artistique.md (palette, polices, décor en couches).
 */
const L = 1920;
const H = 1080;

// ——— Palette (11-direction-artistique) ———
// Prompt 39 : palette de l'interface = jetons du Pixel Design System (design-system/pixel-design-system.md).
// Fond #0D0C0C, texte blanc, primaire #D4031C (toujours avec texte blanc), fonctionnels succès / alerte,
// erreur en teinte claire pour le texte (contraste ≥ 4,5:1 sur le fond sombre).
const C = {
	fond: '#0D0C0C',
	panneau: '#171616', // fond + blanc 05 %
	texte: '#FFFFFF',
	accent: '#FFFFFF', // titres et bordures accentuées (le rouge primaire est réservé aux fonds de boutons)
	// Prompt 176 : la couleur d'accent n'a qu'une source, DS (ds.js / theme.js)
	get primaire() {
		return DS.primaire;
	},
	get surPrimaire() {
		return DS.surPrimaire;
	},
	get primaireTrait() {
		return DS.primaireTrait;
	},
	get primaireTexte() {
		return DS.primaireTexte;
	},
	vert: '#00B74F',
	orange: '#FFC138',
	rouge: '#FFC5C2', // Error Light : lisible en texte sur fond sombre
	rougeFonce: '#D10B00', // Error Primary : barres et pastilles uniquement
	gris: 'rgba(255,255,255,0.6)',
	eau: '#1b2a44',
	eauBord: '#2e4264',
	ombre: 'rgba(0,0,0,0.5)',
	bord: 'rgba(255,255,255,0.15)',
	piste: 'rgba(255,255,255,0.15)', // fond des barres de progression
};
// Polices : JetBrains Mono en webfont auto-hébergée (fonts.css) ou installée, sinon une police système équivalente.
// p5 entoure le nom de guillemets : on lui passe donc UN seul nom, celui de la première police réellement installée.
function policeInstallee(candidats, generique) {
	const ctx = document.createElement('canvas').getContext('2d');
	const mesure = (f) => ((ctx.font = '72px ' + f), ctx.measureText('mmmmmmmmmmlli 0123456789').width);
	const ref = mesure(generique);
	return candidats.find((n) => mesure('"' + n + '", ' + generique) !== ref) || candidats[candidats.length - 1];
}
let POLICE_TEXTE = policeInstallee(['JetBrains Mono', 'IBM Plex Mono', 'Menlo', 'Consolas', 'DejaVu Sans Mono', 'Courier New'], 'serif'); // prompt 39 : paragraphes en JetBrains Mono
let POLICE_DONNEES = POLICE_TEXTE;
// La webfont (fonts.css) peut arriver après le premier parse : re-détection une fois les polices chargées
if (document.fonts && document.fonts.ready) {
	document.fonts.ready.then(() => {
		POLICE_TEXTE = policeInstallee(['JetBrains Mono', 'IBM Plex Mono', 'Menlo', 'Consolas', 'DejaVu Sans Mono', 'Courier New'], 'serif');
		POLICE_DONNEES = POLICE_TEXTE;
	});
}

const reduireAnimationsSysteme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let reduireAnimations = reduireAnimationsSysteme;
const GRIS_NORMAL = 'rgba(255,255,255,0.6)'; // blanc 60 % sur #0D0C0C ≈ 7:1

/* Applique les réglages enregistrés (écran Paramètres) */
function appliquerReglages() {
	const R = Confort.Reglages;
	reduireAnimations = reduireAnimationsSysteme || R.reduireAnimations;
	C.gris = R.contrasteRenforce ? 'rgba(255,255,255,0.85)' : GRIS_NORMAL; // contraste renforcé : texte secondaire plus clair
	appliquerAccessibilite(); // prompt 48 : palette daltonisme, taille du texte
}

// ——— Confort (prompt 18) : fenêtres, pause, meilleur bilan ———
let fenetre = null; // null | 'aide' | 'reset' | 'parametres' (une seule fenêtre à onglets, parametres.js)
let enPause = false;
let debutPause = 0;
let bilanFin = null; // { meilleur, record, ancien } calculé à la fin de partie
let alerteTempsJouee = false;

// ——— État d'affichage ———
let ecran = 'accueil'; // 'accueil' | 'jeu'
let choixAccueil = 0; // index dans optionsAccueil()
let phase = 'decision'; // 'conflit' | 'contradiction' | 'decision' | 'narration' | 'fin'
let sourceChoisie = null; // 'a' | 'b' quand le dossier contient une contradiction (Q9)
let dernierResultat = null;
let debutNarration = 0;
const DUREE_NARRATION = 10000; // prompt 131 : défi chrono seulement (6 s → 10 s) ; sinon pas de suite automatique
let arriveeDossier = 0; // millis() d'arrivée du dossier (glissement, Q10)
let debutCompteur = 0;
let boutons = []; // zones cliquables recalculées à chaque image
let projection = null;
let gouttes = [];

function setup() {
	if (typeof Theme !== 'undefined') Theme.init(); // prompt 115 : couleur principale choisie (C, DS et menu sont définis)
	Langue.detecter(); // prompt 24 : ?lang= → localStorage → navigateur → fr
	const msgChargement = document.getElementById('chargement-message');
	if (msgChargement) msgChargement.textContent = t('chargement.message'); // prompt 27 : dans la langue active
	const c = createCanvas(L, H);
	c.parent('scene');
	c.elt.addEventListener('mouseleave', () => (sourisDansCanevas = false)); // prompt 25 : la caméra se recentre
	pixelDensity(1);
	randomSeed(Jeu.fallback ? Jeu.fallback.seed : 1001);
	majModeMobile(); // prompt 60 : téléphone ou ordinateur
	for (let i = 0; i < (MOBILE.actif ? 70 : 140); i++) gouttes.push({ x: random(), y: random(), v: random(0.6, 1.2) }); // mobile : moitié moins de particules
	setupBureau();
	demarrerLoire(); // prompt 34 : hauteur de la Loire (Hub'Eau) dans setup() + setInterval, jamais dans draw()
	appliquerReglages();
	if (Confort.Reglages.horsLigneForce) Jeu.enLigne = false; // mode hors ligne forcé (Paramètres)
	else Jeu.verifierConnexion(); // indicateur « mode hors ligne » + météo du jour pour le décor de l'accueil
	actionDepuisUrl(); // prompt 65 : raccourcis de la webapp installée (?action=nouvelle | reprendre)
}

// ——— Options de l'accueil : les 3 semaines réelles (Q14) + le mode « aujourd'hui » (prompt 14) ———
function optionsAccueil() {
	const opts = Jeu.semainesProposees().map((s) => ({
		type: 'semaine',
		lundi: s.lundi,
		titre: T('accueil.semaine', { debut: { toString: () => dateLongue(s.lundi) }, fin: { toString: () => dateLongue(s.dimanche) } }),
		detail: Confort.Reglages.defiChrono ? T('accueil.detailChrono', { niveau: T('niveau.' + s.niveau), s: s.compteur_s }) : T('accueil.detail', { niveau: T('niveau.' + s.niveau) }), // prompt 87
		info: T('accueil.info', { d: s.dossiers, e: s.evenements, meilleur: texteMeilleur(s.lundi) }),
	}));
	opts.push({
		type: 'direct',
		titre: T('accueil.direct.titre'),
		detail: T(Jeu.enLigne === false ? 'accueil.direct.indispo' : 'accueil.direct.flux'),
		info: T('accueil.direct.info', { meilleur: texteMeilleur('direct') }),
		desactive: Jeu.enLigne === false,
	});
	return opts;
}

function texteMeilleur(cle) {
	const m = Confort.Bilans.meilleur(cle);
	return m ? t('accueil.meilleur', { score: m.score }) : '';
}

// Prompt 27 : l'écran de chargement (index.html) disparaît au premier draw() effectif — fondu 300 ms,
// immédiat si les animations sont réduites. Il ne bloque jamais l'accès au jeu (pointer-events: none).
let chargementMasque = false;
function masquerChargement() {
	chargementMasque = true;
	const el = document.getElementById('chargement');
	if (!el) return;
	const fin = () => {
		el.hidden = true;
		el.setAttribute('aria-hidden', 'true');
	};
	if (reduireAnimations) return fin();
	el.classList.add('masque');
	setTimeout(fin, 350);
}

// Prompt 30 : contexte des ambiances (pluie réelle du jour, nuit simulée), réévalué une fois par seconde
let dernierContexteSonore = 0;
function majAmbianceSonore() {
	if (millis() - dernierContexteSonore < 1000 || !Confort.Son.ambiances) return;
	dernierContexteSonore = millis();
	const m = typeof meteoFenetre === 'function' ? meteoFenetre() : Jeu.meteoActuelle;
	const h = heureAffichee().h;
	Confort.Son.ambiances.regler({ pluie: !!(m && m.pluie_mm >= 1), vent: !!(m && m.rafales_max >= 50), chaleur: !!(m && m.temp_max >= 30), nuit: h < 7 || h >= 20 || phase === 'soir', actif: PC.etat !== 'eteint' || ecran === 'jeu' }); // prompt 44 § 6 : + vent, chaleur
}

function draw() {
	if (!chargementMasque) masquerChargement();
	majAmbianceSonore();
	// Prompt 41 : cinématique de fin, plein écran
	if (CINE) {
		boutons = [];
		dessinerCinematique();
		majCurseur();
		return;
	}
	// Prompt 84 : licenciement — écran « game over » plein écran
	if (GAMEOVER) {
		boutons = [];
		dessinerGameOver();
		majCurseur();
		return;
	}
	// Prompt 35 : menu principal plein écran avant le bureau ; il se ferme dès qu'une partie démarre ou reprend
	if (MENU.actif && ecran === 'jeu') fermerMenuPrincipal();
	if (MENU.actif) {
		boutons = [];
		if (!dessinerDemo()) dessinerMenuPrincipal(); // prompt 48 : démo automatique après 40 s sans action
		if (fenetre) {
			boutons = [];
			dessinerFenetre();
		}
		dessinerTutoriel();
		majCurseur();
		return;
	}
	verifierMecaniques(); // prompt 47 : inspection surprise (avant l'horloge, qui s'arrête alors)
	verifierTaches(); // prompt 88 : briefing du matin, tâches courtes
	majAmbianceTaches(); // prompt 88 : humeur musicale de la crise
	majSeuilSomnolence(); // prompt 91 § 5 (option)
	majMultitache(); // prompts 68 / 77 : arrivées, compteurs des signalements actifs, expirations en arrière-plan
	majNotifsTel(); // prompt 90 : notifications spontanées du téléphone (aucun appel réseau ici)
	majNotifications(); // prompt 77 : mails, commentaires, fins d'intervention
	majLicenciement(); // prompt 84 : messages après la panne, licenciement hors décision
	majPatron(); // prompt 86 : son, indicateur de saisie
	if (PC.fenetre !== 'patron') PATRON.ouvert = false; // prochaine ouverture : sur le premier non lu
	majRythme(); // prompt 74 : événements de rythme à heures fixes
	majSoir(); // prompt 69 : crépuscule accéléré, sortie du bureau
	if (typeof majProgressionBureau === 'function') majProgressionBureau(); // prompt 104 : nouvel objet sur le bureau (annonce, une fois)
	majDemarrageJour(); // prompt 71 : démarrage du PC en début de journée (jours 1 à 3)
	avancerTemps(); // horloge simulée, sieste, arrivée des incidents, fin de journée (immersion.js)
	if (Jeu.equipes) Jeu.majEquipes((typeof tempsEquipes === 'function' ? tempsEquipes() : millis())); // prompt 95 : temps de jeu // équipes envoyées depuis les signalements (prompts 22, 68)
	majRetardsEtCommunity(); // prompt 79 : retards qui s'aggravent, plaintes qui s'enveniment
	boutons = [];
	// 1. Contenu de l'écran du PC, en 1920×1080 : l'appli de régulation, ou le système (démarrage, bureau)
	ciblesGuide = {}; // prompt 37 : cibles des flèches, relevées pendant le dessin
	espaceDessin = 'pc';
	sourisVersEcran();
	background(C.fond);
	const integree = typeof vueIntegree === 'function' && vueIntegree(); // prompt 103 : Patron, Community, Journal, Données = vues de l'appli
	if (PC.etat === 'appli' || integree) {
		// Prompt 50 : l'appli est une fenêtre de RégulOS, la barre des tâches reste visible
		dessinerFondOS();
		const n0 = entrerFenetreAppli();
		noStroke();
		fill(C.fond);
		rect(0, 0, L, H);
		if (ecran === 'accueil') dessinerAppliSansPartie(); // prompt 35 : l'accueil est sorti du PC (menu principal)
		else if (integree) {
			dessinerBandeau();
			dessinerVueApp();
			dessinerMenuApp();
		} else {
			dessinerJeu();
			dessinerMenuApp(); // prompt 103
			bandeauEtat(); // prompt 43
			indicateurSauvegarde(); // prompt 33
			// Prompt 93 : ligne complète du bandeau ; prompt 98 : infobulle après 350 ms de survol (validations : tooltip-no-delay)
			if (BANDEAU.survol !== BANDEAU.survolPrec) (BANDEAU.survolPrec = BANDEAU.survol), (BANDEAU.survolDepuis = millis());
			if (BANDEAU.survol && millis() - BANDEAU.survolDepuis >= 350) infobulle(BANDEAU.survol, Math.min(BANDEAU.survolX ? BANDEAU.survolX - textWidth(BANDEAU.survol) - 28 : BANDEAU.x + 16, L - 28 - textWidth(BANDEAU.survol)), BANDEAU.y + BANDEAU.h + 4); // prompt 144 : sous la date quand c'est elle
			BANDEAU.survol = null;
			BANDEAU.survolX = null;
		}
		if (enPause) dessinerPause();
		// Prompt 105 : plein écran — plus de barre de titre ni de croix (Échap, « Quitter la journée », « Quitter le PC »)
		sortirFenetreAppli(n0);
		// Prompt 105 : plus de barre des tâches sous l'appli
	} else dessinerOS();
	// Prompt 111 : plus de cartes de notification sur l'écran du PC — badges rouges chiffrés dans le menu à gauche
	dessinerIndicateurs(); // prompt 36 : app flottante, au premier plan
	sourisRestaurer();
	espaceDessin = 'ecran';
	// 2. La pièce et le moniteur autour (bureau, zoom, ou « au poste » avec la pièce visible)
	const d0 = typeof Juice !== 'undefined' ? Juice.decalage(millis()) : { x: 0, y: 0 }; // prompt 96 : secousse par trauma² (temps réel)
	const secousse = d0.x || d0.y ? d0 : null;
	if (secousse) push(), translate(secousse.x, secousse.y);
	composerVue();
	if (vue === 'bureau' && !fenetre) badgeEcranBureau(); // prompt 111 : PC « fermé » : un seul badge, le total, au coin de l'écran
	if (secousse) pop();
	dessinerBoost(); // prompt 52 : cœur, pulsation rouge, lignes de vitesse, flou
	dessinerMicro(); // prompt 54 : oscilloscope et mesures pendant l'appui
	dessinerOffreDemission(); // prompt 47 : les trois jauges sous 20 → « Rendre son badge »
	dessinerSommeil(); // sieste : paupières plein écran, au-dessus de tout le contenu (fenêtres et réveil exceptés)
	if (phase === 'reveil' && reveil && ecran === 'jeu' && !smsActif) {
		boutons = [];
		dessinerReveil(); // l'alarme réveille : son panneau passe au-dessus des paupières
	}
	if (fenetre) {
		boutons = []; // seule la fenêtre ouverte est cliquable
		dessinerFenetre();
	}
	if (smsActif) {
		boutons = [];
		dessinerSMS();
	}
	dessinerGuide(); // prompt 37 : flèches « Prendre en main »
	dessinerTutoriel(); // prompt 34 : par-dessus l'écran et les fenêtres
	if (typeof dessinerRespirationSoir === 'function') dessinerRespirationSoir(); // prompt 191 : « Fin de journée. », passable
	dessinerNoirSoir(); // prompt 69 : fondu et écran noir de la sortie
	dessinerTransitionJour(); // prompt 43 : écran noir entre les journées, au-dessus de tout
	dessinerClignement(); // prompt 21 § 2 : par-dessus tout, purement visuel (n'intercepte aucune entrée)
	majCurseur();
}
/** Prompt 29 : curseur « main » au survol de toute zone cliquable (objets de la pièce compris) */
function majCurseur() {
	const surZone = boutons.some((b) => mouseX >= b.x && mouseX <= b.x + b.l && mouseY >= b.y && mouseY <= b.y + b.h);
	if (surZone !== curseurMain) {
		curseurMain = surZone;
		cursor(surZone ? HAND : ARROW);
	}
}
let curseurMain = false;

// Prompt 59 : l'ancien écran d'accueil du PC (dessinerAccueil, hors parcours depuis le prompt 35) et le résumé des
// effets sous les actions (effetsResumes, retiré au prompt 50) ont été supprimés : ils n'étaient plus appelés.

/** Prompt 43 : état du jeu — ce qu'il faut faire maintenant. Prompt 124 : ce texte n'est plus affiché (il nuisait à
 * l'immersion) ; il reste annoncé aux lecteurs d'écran à chaque changement d'état (aria-live). */
let dernierEtatAnnonce = '';
function bandeauEtat() {
	if (ecran !== 'jeu') return;
	const cle = { attente: 'attente', reveil: 'attente', selection: 'selection', decision: 'decision', contradiction: 'contradiction', conflit: 'conflit', narration: 'narration', soir: 'soir', fin: 'fin' }[phase];
	if (!cle) return;
	const fin = phase === 'attente' && Jeu.journeeFinie && Jeu.journeeFinie();
	const id = fin ? 'finJournee' : cle + (cle === 'decision' && Jeu.defiChrono ? 'Chrono' : '');
	if (id !== dernierEtatAnnonce) {
		dernierEtatAnnonce = id;
		if (!fenetre && !tutoriel) annoncer(fin ? t('etat.finJournee', { fin: Jeu.formaterHeure(Jeu.finJournee()) }) : t('etat.' + id, { x: IMMERSION.compression }));
	}
	dessinerSomnolence(); // prompt 78 : jauge de somnolence, cliquable (se reposer)
	dessinerStatutPatron(); // prompt 84 : pastille « Sous surveillance » / « Dernier avertissement »
}

function lancerPartie() {
	const o = optionsAccueil()[choixAccueil];
	if (!o || o.desactive) return;
	// Prompt 178 : chaque nouvelle partie a son emplacement — plus de fenêtre « Reprendre / Nouvelle partie ». Seule
	// la limite d'emplacements arrête le lancement : l'écran « Reprendre une partie » propose de supprimer la plus ancienne
	if (Sauvegarde.pleine()) return allerSauvegardes(lancerNouvellePartie);
	lancerNouvellePartie();
}
function lancerNouvellePartie() {
	const o = optionsAccueil()[choixAccueil];
	if (!o || o.desactive) return;
	Sauvegarde.nouvelle(); // prompt 178 : nouvel emplacement, créé à la première sauvegarde automatique (les autres parties restent)
	fenetre = null;
	const p = o.type === 'direct' ? Jeu.chargerDirect() : Jeu.chargerSemaine(o.lundi);
	Confort.Son.bip('choix');
	RAPPORT = null;
	p.then(() => {
		Jeu.defiChrono = !!Confort.Reglages.defiChrono; // prompt 87 : sans chrono par défaut
		Jeu.nouvellePartie();
		nouvellePartieRythme(); // prompt 74 : ordre d'arrivée tiré par la graine, fil de la journée remis à zéro
		demarrerJournee(); // journée 1, 8h00 (prompt 76), en attente du premier incident
		const ch = chapitreCourant();
		if (typeof EXPO !== 'undefined' && EXPO.actif) return expoAuPoste(); // prompt 132 : exposition, droit à la carte
		if (!introVue) lancerIntroSMS(); // § 2 : une seule fois, pas sur « Rejouer »
		else if (ch) conversationChapitre(ch); // prompt 41 : le patron présente la semaine et son nouvel élément
		else if (!tutorielVu() && !optionGuide()) lancerTutoriel(); // prompt 34 (pas si le guide « Prendre en main » est choisi)
	});
}

let dernierTic = 0; // prompt 44
let facteurDuree = 1; // prompt 23 : heure de pointe → compteur ×0,8
function nouveauDossier() {
	if (Jeu.demarrerModificateur) Jeu.demarrerModificateur(millis());
	facteurDuree = Jeu.modificateurActif && Jeu.modificateurActif(millis()) === 'heure_pointe' ? 0.8 : 1;
	arriveeDossier = millis();
	debutCompteur = millis();
	sourceChoisie = null;
	alerteTempsJouee = false;
	if (!Jeu.dossierCourant()) return apresDecision();
	if (typeof feedback === 'function') feedback('small'); // prompt 96 : un dossier arrive (tampon et cartes en pop)
	if (Jeu.declencherPlainte) Jeu.declencherPlainte(Jeu.index); // prompt 28 : plainte liée au dossier réel (app Community)
	// Prompt 44 § 2 : signal propre à la source (GTFS-RT, Open-Meteo, archives, agenda), plus fort s'il reste beaucoup d'incidents
	const dInc = Jeu.dossierCourant();
	const jInc = Jeu.jourCourant();
	const restants = jInc ? jInc.dossiers.filter((x) => Jeu.paquet.indexOf(x) >= Jeu.index).length : 1;
	Confort.Son.alerteDossier(dInc.type, restants);
	if (dInc.lignes && dInc.lignes.length) setTimeout(() => Confort.Son.radio(dInc.lignes.join(''), 1), 700); // § 1 : annonce radio liée à la ligne
	if (Jeu.conflit()) phase = 'conflit';
	else if (Jeu.dossierCourant().contradiction) phase = 'contradiction';
	else phase = 'decision';
	annoncer(t('annonce.signalement', { quoi: t('enq.signalement.' + dInc.type) })); // prompt 53 : arrivée annoncée (aria-live)
}

/* Décision du joueur (ou compteur à 0 → 'temps', Q25) */
function decider(action) {
	if (phase !== 'decision' && !(action === 'temps' && phase === 'contradiction')) return;
	// Prompt 56 : mesures de la décision (temps réel de décision, sources consultées) pour le rapport de semaine
	const mesures = { dureeMs: Math.max(0, millis() - arriveeDossier), sources: typeof enqueteDossier === 'function' ? Object.keys(enqueteDossier().revele).length : 0 };
	const dDecide = Jeu.dossierCourant();
	dernierResultat = Jeu.decider(action, sourceChoisie);
	if (!dernierResultat) return;
	retirerActif(dDecide); // prompt 77 : ce signalement n'est plus actif
	if (action !== 'temps') Object.assign(dernierResultat, mesures);
	else dernierResultat.sources = mesures.sources;
	dernierResultat.contexteNarr = Rythme.contexteNarration(dernierResultat, Jeu.index - 1); // prompt 74 : phrase de contexte réelle
	if (action !== 'temps') tachesApresDecision(dernierResultat); // prompt 88 : rotation des tâches
	if (typeof tracerDecision === 'function') tracerDecision(dernierResultat); // prompt 89 bis : trace dans la file
	annoncer(t('annonce.decision', { titre: dernierResultat.narration.titre, texte: typeof lireMasques === 'function' ? lireMasques(dernierResultat.narration.texte) : dernierResultat.narration.texte }) + ' ' + phraseEcarts(dernierResultat.deltas)); // prompt 53 ; prompt 184 : une phrase « fluidité en hausse, budget en baisse » ; prompt 196 : les masques hors alphabet sont lus « mot masqué »
	Confort.Son.clicAction(Jeu.familleDe ? Jeu.familleDe(action) : action); // prompt 44 § 4 : un clic de console par action ; prompt 89 bis : famille de la réponse (son distinct)
	Confort.Son.jauges(dernierResultat.deltas); // § 5 : chute brutale ou remontée nette, audibles
	if (typeof feedback === 'function') feedback(dernierResultat.clash ? 'large' : Juice.tierDeltas(dernierResultat.deltas)); // prompts 94 / 96 : tier selon l'effet réel (small / medium / large) ; prompt 196 : le clash déclenche un choc « large » (qui donne envie de le choisir), conséquences inchangées
	phase = 'narration';
	debutNarration = millis();
	if (dernierResultat.contexteNarr) annoncer(t(dernierResultat.contexteNarr.cle, dernierResultat.contexteNarr.vars));
	verifierSerie(); // prompt 74 : 2 bonnes ou 2 ratées d'affilée → mot du patron (sans effet sur les jauges)
	Sauvegarde.auto(false); // prompt 33 : après chaque décision (l'annonce de la décision n'est pas écrasée)
}

/** Prompt 184 : sens des écarts en une phrase pour le lecteur d'écran (jauges inchangées omises) */
function phraseEcarts(deltas) {
	const p = ['fluidite', 'reputation', 'budget'].map((k, i) => [k, deltas[i]]).filter(([, v]) => v).map(([k, v]) => t(v > 0 ? 'annonce.hausse' : 'annonce.baisse', { jauge: t('jaugeTitre.' + k).toLowerCase() }));
	if (!p.length) return t('narr.aucunEffet');
	const phrase = p.join(', ');
	return phrase.charAt(0).toUpperCase() + phrase.slice(1) + '.';
}

function continuer() {
	if (phase === 'narration' && !enPause) apresDecision(); // retour à la surveillance (immersion.js)
}

// ——— Pause (Q13) : uniquement entre deux dossiers, c'est-à-dire pendant la narration ———
function basculerPause() {
	if (phase !== 'narration') return; // jamais pendant un compteur actif
	if (!enPause && MULTI.actifs.length && Jeu.defiChrono) return annoncer(t('multi.pause')); // prompt 77 : d'autres compteurs tournent
	if (enPause) {
		debutNarration += millis() - debutPause; // le temps de pause ne compte pas
		enPause = false;
	} else {
		enPause = true;
		debutPause = millis();
		Sauvegarde.auto(true); // prompt 33 : à la pause, avec annonce
	}
	Confort.Son.bip('choix');
}

function ouvrir(nom) {
	fenetre = nom;
	Confort.Son.bip('choix');
}
function fermer() {
	if (fenetre === 'telephone' && typeof noterTelephoneLu === 'function') noterTelephoneLu(); // prompt 179 : première lecture du téléphone faite
	fenetre = null;
}

// ——— Prompt 173 : clic (ou appui tactile) sur le fond = fermer la fenêtre, comme Échap ———
// Point unique : mousePressed (le tactile y passe aussi), quand aucun bouton n'a pris le clic.
// FENETRES_BLOQUANTES : elles exigent une réponse (décision, confirmation, bilan à lire, animation) et ne se ferment
// JAMAIS au clic sur le fond. FERMETURE_FOND : ce que fait Échap dans chaque fenêtre qui se ferme ainsi.
// Une fenêtre absente des deux listes est traitée comme bloquante.
const FENETRES_BLOQUANTES = ['reset', 'demission', 'partir', 'blame', 'inspection', 'tache', 'mailFin', 'rapport', 'rapportVeille', 'cafe'];
const FERMETURE_FOND = {
	aide: fermer,
	parametres: fermer,
	partage: fermer,
	installation: fermer,
	palmares: fermer,
	menu: fermer,
	telephone: fermer,
};
let ZONE_FENETRE = null; // rectangle de la fenêtre dessinée à cette image (premier panneau), null hors fenêtre
let FENETRE_EN_DESSIN = false;
function zoneFenetre(x, y, l, h) {
	if (FENETRE_EN_DESSIN && !ZONE_FENETRE) ZONE_FENETRE = { x, y, l, h };
}
/** Vrai si le clic a fermé la fenêtre (clic hors du panneau d'une fenêtre non bloquante) */
function clicFondFenetre() {
	const z = ZONE_FENETRE;
	if (!fenetre || !z || tutoriel || smsActif || FENETRES_BLOQUANTES.includes(fenetre) || !FERMETURE_FOND[fenetre]) return false;
	if (mouseX >= z.x && mouseX <= z.x + z.l && mouseY >= z.y && mouseY <= z.y + z.h) return false;
	FERMETURE_FOND[fenetre]();
	Confort.Son.clic();
	return true;
}

// ——— Recommencer la semaine (R, avec confirmation, Q38) ———
function confirmerReset() {
	fenetre = null;
	enPause = false;
	Sauvegarde.effacerCourante(); // prompt 33 : le reset efface la sauvegarde de la partie en cours (prompt 178 : son emplacement, pas les autres)
	rejouer();
}

// ——— Prompt 33 : reprendre une partie sauvegardée (prompt 178 : le choix se fait dans l'écran « Reprendre une partie », menu.js) ———
/** Raccourci de la webapp installée (?action=reprendre) : la partie la plus récente */
function continuerPartie() {
	const o = Sauvegarde.lister()[0];
	if (o) Sauvegarde.reprendre(o);
}

// =====================================================================
// Écran de jeu (Q1–Q10, Q29, Q30, Q45)
// =====================================================================
// Prompt 87 : deux colonnes sous un bandeau fin (BANDEAU et PANNEAU : panneau.js) — liste à gauche, signalement à droite
const FILE_SIG = { x: 40, y: 92, l: 700, h: 940 }; // prompt 145 : bandeau d'une ligne, le contenu monte de 40 px

function dossierCourant() {
	return Jeu.dossierCourant ? Jeu.dossierCourant() : null;
}

/** Prompt 33 : indicateur discret « Partie sauvegardée à hh:mm », en bas à droite de l'écran du jeu */
/** Prompt 95 : « Aujourd'hui : reste n · prochain vers 14h30 », en bas de la file des signalements */
function texteResteJournee() {
	const j = Jeu.jourCourant ? Jeu.jourCourant() : null;
	if (!j || !Jeu.horloge || ecran !== 'jeu') return '';
	const n = Jeu.dossiersRestantsDuJour();
	const venir = j.dossiers.filter((d) => Jeu.paquet.indexOf(d) >= Jeu.index && d.minute > Jeu.horloge.minutes).map((d) => d.minute);
	if (!n) return t('jour.resteAucun', { fin: Jeu.formaterHeure(Jeu.finJournee()) });
	return venir.length ? t('jour.reste', { n, heure: Jeu.formaterHeure(Math.min(...venir)) }) : t('jour.resteArrives', { n });
}
function indicateurSauvegarde() {
	const r = texteResteJournee();
	// Prompt 102 : « reste de la journée » dans la ligne d'état de la carte (carte-alertes.js) ; plus de doublon ici
	const s = Sauvegarde.texteIndicateur();
	if (!s || phase === 'narration') return; // prompt 131 : il chevauchait le titre de la narration
	textFont(POLICE_DONNEES);
	textSize(16);
	textAlign(RIGHT, BOTTOM);
	noStroke();
	fill(C.gris);
	const zc = typeof CARTE !== 'undefined' && (CARTE.zoneLibre || CARTE.zone) ? CARTE.zoneLibre || CARTE.zone : FILE_SIG; // prompt 114 : partie libre de la carte
	text(couperLargeurCarte(s, zc.l - 32, 20), zc.x + zc.l - 16, zc.y + zc.h - 212); // prompt 114 : au-dessus des boutons de zoom (les notifications occupent le haut) // prompt 114 : sous le zoom et la légende ; correctif : en haut à droite de la carte, sous le zoom (H_PLATEAU n'existe plus depuis le prompt 108 — l'erreur figeait l'écran)
}

function dessinerJeu() {
	if (phase === 'fin') return RAPPORT ? dessinerEcranRapportImprime() : dessinerFin(); // prompt 41
	if (phase === 'attente' || phase === 'reveil' || phase === 'soir') return dessinerJeuAttente(); // prompt 69 : le soir, l'appli reste consultable
	const d = dossierCourant();
	const meteo = d ? Jeu.meteoDuJour(d.date) : null;
	// Prompt 87 : bandeau fin (jauges, objectif, équipes, heure), liste des signalements, panneau du signalement ouvert
	dessinerBandeau();
	dessinerCarteAlertes(); // prompt 102 : la carte des alertes réelles remplace la liste (prompt 73)
	if (phase === 'selection') return; // prompt 102 : cliquer un marqueur prend le signalement (plus d'étape « Prendre »)
	positionnerDialogue(); // prompt 107 : le dossier s'ouvre dans une fenêtre flottante sur la carte
	if (DIALOGUE.reduit && (phase === 'decision' || phase === 'contradiction') && d) return dessinerOngletDialogue(d);
	if (phase === 'narration') dessinerNarration();
	else if (phase === 'conflit') dessinerConflit();
	else dessinerDossier(d, meteo);
}

/* Écran de jeu sans incident actif : bandeau, liste des signalements, horloge simulée à droite */
function dessinerJeuAttente() {
	dessinerBandeau();
	dessinerCarteAlertes(); // prompt 102 : carte pleine largeur entre deux signalements
	if (enSieste) {
		Object.assign(PANNEAU, { x: ZONE_CARTE.x + (ZONE_CARTE.l - FENETRE_DIALOGUE.l) / 2, y: ZONE_CARTE.y + 16, l: FENETRE_DIALOGUE.l, h: FENETRE_DIALOGUE.h }); // prompt 107
		dessinerAttente(); // sieste : le panneau d'attente dit qu'on dort (prompt 194 : plus de mail plein écran le soir)
	}
}


// ——— Décor d'ambiance (écran de fin) : eau, lignes en filigrane, météo — prompt 73 : plus de carte dans l'écran de jeu ———
function dessinerDecor(zone, meteo, opacite, sansLegende) {
	projection = projeter(zone);
	push();
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(zone.x, zone.y, zone.l, zone.h);
	drawingContext.clip();

	// Couche 1 : eau (Loire, Erdre, Sèvre — occupation du sol 2022), ombre douce = couche 2 « quais »
	if (Jeu.lignes && Jeu.lignes.eau) {
		const eau = color(C.eau);
		eau.setAlpha(255 * opacite);
		const bord = color(C.eauBord);
		bord.setAlpha(255 * opacite);
		for (const anneau of Jeu.lignes.eau) {
			noStroke();
			fill(0, 0, 0, 10 * opacite);
			beginShape();
			anneau.forEach((p) => vertex(projection.x(p[0]) + 3, projection.y(p[1]) + 4));
			endShape(CLOSE);
			stroke(bord);
			strokeWeight(1);
			fill(eau);
			beginShape();
			anneau.forEach((p) => vertex(projection.x(p[0]), projection.y(p[1])));
			endShape(CLOSE);
		}
	}
	// Lignes en filigrane (fond d'ambiance)
	if (Jeu.lignes) {
		noFill();
		for (const l of Jeu.lignes.lignes) {
			stroke(28, 39, 51, l.type === 0 ? 70 * opacite : 30 * opacite);
			strokeWeight(l.type === 0 ? 3 : 1.2);
			l.traces.forEach(tracer);
		}
	}
	dessinerMeteo(zone, meteo, opacite, sansLegende, false);
	drawingContext.restore();
	pop();
}

function dessinerMeteo(zone, m, opacite, sansLegende, sansPictos) {
	if (!m) return;
	const pluie = m.pluie_mm || 0;
	const vent = m.rafales_max || 0;
	const chaud = m.temp_max >= 25;
	const froid = m.temp_min <= 0;
	noStroke();
	if (!sansPictos) dessinerPictosMeteo(zone, m, opacite, pluie, vent, chaud);
	// Légende météo (données chiffrées en monospace, sur panneau) — jamais sur un décor d'ambiance (fin)
	if (sansLegende) return;
	const txt = t('meteo.jour', { min: fmt(m.temp_min), max: fmt(m.temp_max), pluie: fmt(m.pluie_mm), rafales: fmt(m.rafales_max), gel: froid ? t('meteo.gel') : '' });
	textFont(POLICE_DONNEES);
	textSize(17);
	const tl = textWidth(txt) + 24;
	noStroke();
	fill(C.panneau);
	rect(zone.x + 12, zone.y + zone.h - 44, tl, 32, 6);
	fill(C.texte);
	textAlign(LEFT, CENTER);
	text(txt, zone.x + 24, zone.y + zone.h - 28);
}
/** Soleil, nuages, pluie et vent dessinés (fond d'ambiance de l'écran de fin) */
function dessinerPictosMeteo(zone, m, opacite, pluie, vent, chaud) {
	// Soleil (journée sèche) ou nuages (pluie)
	if (pluie < 1) {
		fill(chaud ? 'rgba(232,163,23,0.85)' : 'rgba(232,184,64,0.7)');
		circle(zone.x + zone.l - 90, zone.y + 90, 90 * (chaud ? 1.2 : 1));
	}
	const nbNuages = pluie >= 1 ? 4 : pluie > 0 ? 2 : 1;
	for (let i = 0; i < nbNuages; i++) {
		const nx = zone.x + zone.l * (0.15 + 0.22 * i);
		const ny = zone.y + 70 + (i % 2) * 30;
		fill(pluie >= 1 ? 'rgba(140,150,160,0.55)' : 'rgba(255,255,255,0.8)');
		ellipse(nx, ny, 160, 60);
		ellipse(nx + 50, ny - 22, 110, 70);
		ellipse(nx - 50, ny - 10, 90, 50);
	}
	// Pluie : traits obliques, inclinés par le vent ; immobiles si animations réduites
	if (pluie > 0) {
		const n = Math.min(gouttes.length, Math.round(20 + pluie * 8));
		const pente = Math.min(25, vent / 3);
		stroke(90, 120, 140, 110 * opacite);
		strokeWeight(2);
		const t = reduireAnimations ? 0 : millis() / 1000;
		for (let i = 0; i < n; i++) {
			const g = gouttes[i];
			const gy = zone.y + ((g.y + t * 0.25 * g.v) % 1) * zone.h;
			const gx = zone.x + g.x * zone.l;
			line(gx, gy, gx - pente, gy + 22);
		}
	}
	// Vent fort : traînées horizontales
	if (vent >= 40) {
		stroke(28, 39, 51, 60 * opacite);
		strokeWeight(2);
		noFill();
		for (let i = 0; i < 3; i++) {
			const y = zone.y + 170 + i * 26;
			bezier(zone.x + 30, y, zone.x + 120, y - 12, zone.x + 200, y + 12, zone.x + 300, y);
		}
	}
}

// ——— Dossier courant : ligne + retard + raison en priorité (Q5), glissement depuis la droite (Q10) ———
function dessinerDossier(d, meteo) {
	const base = Object.assign({}, PANNEAU);
	const tA = reduireAnimations ? 1 : constrain((millis() - arriveeDossier) / 300, 0, 1); // prompt 53 : 300 ms, ease out
	const decal = (1 - easeOut(tA)) * (L - base.x);
	const x = base.x + decal;
	panneau(x, base.y, base.l, base.h);
	if (!d) {
		textAlign(LEFT, TOP);
		fill(C.gris);
		textFont(POLICE_TEXTE);
		textSize(24);
		text(t('dossier.aucun'), x + 32, base.y + 40);
		return;
	}
	noStroke();
	textFont(POLICE_DONNEES);
	textSize(16);
	textAlign(LEFT, TOP);
	fill(C.gris);
	text(t('dossier.entete', { n: Jeu.index + 1, total: Jeu.paquet.length, type: tSi('type.' + d.type, d.type).toUpperCase(), affluence: '' }), x + 32, base.y + 24);
	if (Jeu.defiChrono) {
		// Mode « Défi chrono » (prompt 87, optionnel) : le compteur d'avant (Q6, Q16, Q55), ralenti, alerte des 5 s, 0 → Q25
		figerCompteurRalenti(); // prompt 55 : pendant le ralenti, le compteur ne descend pas
		const duree = ((Jeu.etat.semaine && Jeu.etat.semaine.difficulte && Jeu.etat.semaine.difficulte.compteur_s) || 30) * 1000 * facteurDuree * facteurLecture(); // prompt 48 : lecture facile ×1,5
		const reste = constrain(1 - (millis() - debutCompteur) / duree, 0, 1);
		const resteMs = reste * duree;
		if (!Confort.Reglages.lectureFacile && resteMs > 0 && resteMs < 10000 && (phase === 'decision' || phase === 'contradiction' || phase === 'conflit')) {
			const pas = resteMs < 4000 ? 250 : resteMs < 7000 ? 500 : 1000;
			if (millis() - dernierTic >= pas) {
				dernierTic = millis();
				Confort.Son.tic(1 - resteMs / 10000);
			}
		}
		noStroke();
		fill(C.piste);
		rect(x + 24, base.y + 6, base.l - 48, 10);
		fill(couleurCompteur(resteMs)); // prompt 53 : sous 10 s, rouge qui pulse doucement
		rect(x + 24, base.y + 6, (base.l - 48) * reste, 10);
		textAlign(RIGHT, TOP);
		fill(C.gris);
		text(Math.ceil(resteMs / 1000) + ' s', x + base.l - 32, base.y + 24);
		dessinerRalenti(x, base); // prompt 55 : bouton « Ralenti (R) » ou « Pause — 7 s »
		if (resteMs < 5000 && reste > 0 && !alerteTempsJouee && (phase === 'decision' || phase === 'contradiction')) {
			alerteTempsJouee = true;
			Confort.Son.bip('alerte'); // plus que 5 secondes
		}
		if (reste === 0 && tA === 1 && (phase === 'decision' || phase === 'contradiction')) {
			phase = 'decision';
			decider('temps');
			Confort.Son.bip('consequence'); // prompt 30 : compteur à 0
			return;
		}
	} else {
		// prompt 119 : « Horloge en pause » retiré de la fenêtre — le bandeau l'affiche déjà (« en pause hh:mm ») et le texte chevauchait l'en-tête
	}
	textAlign(LEFT, TOP);
	dessinerPanneauSignalement(d, x, base); // prompt 87 : 3 blocs, « En savoir plus », conseil, réponses de la catégorie
	dessinerTamponSignalement(x + base.l - 150, base.y + 96); // prompt 53 : tampon « SIGNALEMENT » à l'arrivée (rebranché au check-up du prompt 59)
}

// ——— Prompt 79 : annonces (aria-live) de l'aggravation du retard affiché, et des plaintes Community expirées ———
let dernierRetardAnnonce = { d: null, v: null };
function majRetardsEtCommunity() {
	if (ecran !== 'jeu' || !Jeu.paquet || phase === 'fin' || enPause || tempsSuspendu()) return;
	(Jeu.majPlaintes ? Jeu.majPlaintes(tempsPlaintes()) : []).forEach((p) => {
		annoncer(t('community.envenimeAnnonce', { auteur: p.auteur }));
		Confort.Son.bip('alerte');
	});
	const d = PHASES_ACTIVES.includes(phase) ? Jeu.dossierCourant() : null;
	const re = d ? Jeu.retardEffectif(d) : null;
	if (re === null) return;
	if (dernierRetardAnnonce.d !== d) dernierRetardAnnonce = { d, v: re };
	else if (re >= dernierRetardAnnonce.v + 5) {
		dernierRetardAnnonce.v = re;
		annoncer(t('retard.aggrave', { reel: d.retard, effectif: re }));
		// Prompt 91 § 3 : info non publiée sur Community et retard qui s'aggrave → un usager se plaint (une plainte par dossier)
		if (!(Jeu.postsJoueur || []).some((p) => p.index === Jeu.index)) Jeu.declencherPlainte(Jeu.index);
	}
}

function choisirSource(cle) {
	if (phase !== 'contradiction') return;
	sourceChoisie = cle;
	phase = 'decision';
}

// ——— Conflit de deux lignes (Q27) : choix binaire explicite ———
function dessinerConflit() {
	const z = Object.assign({}, PANNEAU);
	panneau(z.x, z.y, z.l, z.h, C.orange);
	const c = Jeu.conflit();
	textAlign(LEFT, TOP);
	noStroke();
	fill(C.orange);
	textFont(POLICE_DONNEES);
	textSize(18);
	text(t('conflit.titre', { date: dateLongue(c.a.date) }), z.x + 32, z.y + 32);
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(40);
	text(t('conflit.question'), z.x + 32, z.y + 70, z.l - 64, 110);
	textStyle(NORMAL);
	[
		['A', c.a, 'a'],
		['B', c.b, 'b'],
	].forEach(([tA, dd, cle], i) => {
		const by = z.y + 220 + i * 190;
		bouton(z.x + 32, by, z.l - 64, 160, '', () => choisirPriorite(cle), false, true);
		fill(C.accent);
		textAlign(LEFT, TOP);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(32);
		text(t('conflit.ligne', { lettre: tA, lignes: dd.lignes.join(', '), retard: dd.retard !== null ? '  · +' + dd.retard + ' min' : '' }), z.x + 60, by + 26);
		textStyle(NORMAL);
		textSize(20);
		fill(C.texte);
		text(dd.texte_source, z.x + 60, by + 80, z.l - 120, 70);
	});
}

function choisirPriorite(cle) {
	if (phase !== 'conflit') return;
	const ancien = Jeu.dossierCourant();
	Jeu.choisirPriorite(cle);
	phase = Jeu.dossierCourant().contradiction ? 'contradiction' : 'decision';
	debutCompteur = millis();
	apresChoixPriorite(ancien); // prompt 77 : la fiche du signalement actif suit le dossier choisi
}

// ——— Narration entre deux décisions (06-narration, Q17) ———
function dessinerNarration() {
	const z = Object.assign({}, PANNEAU);
	const r = dernierResultat;
	const couleurTon = { neutre: C.accent, tendu: C.orange, critique: C.rouge }[r.narration.ton];
	panneau(z.x, z.y, z.l, z.h, couleurTon);
	textAlign(LEFT, TOP);
	noStroke();
	fill(couleurTon);
	textFont(POLICE_DONNEES);
	textSize(18);
	text(t('narration.entete', { ton: t('ton.nom.' + r.narration.ton) }), z.x + 32, z.y + 32);
	// Prompt 121 : statut du signalement — clos (aucune équipe) ou en attente du retour du plaignant (équipe envoyée)
	const iSig = Jeu.paquet.indexOf(r.dossier);
	const stSig = iSig >= 0 && Jeu.statutSignalement ? Jeu.statutSignalement(iSig) : null;
	if (stSig && stSig !== 'ouvert') {
		const eqSig = (Jeu.equipes || []).filter((q) => q.index === iSig && !q.inutile).map((q) => String(q.nom)).join(', ');
		const libSig = t('sig.statut.' + stSig, { equipe: eqSig });
		textSize(18);
		const lSig = Math.min(z.l - 420, textWidth(libSig) + 28);
		noFill();
		stroke(stSig === 'attente' ? C.orange : C.gris);
		strokeWeight(2);
		rect(z.x + z.l - 32 - lSig, z.y + 24, lSig, 34);
		noStroke();
		fill(stSig === 'attente' ? C.orange : C.gris);
		textAlign(CENTER, CENTER);
		ajusterTaille(libSig, lSig - 20, 18, 14);
		zoneTexteDeclarer('statutSignalement', z.x + z.l - 32 - lSig + 10, z.y + 28, lSig - 20, 26);
		text(libSig, z.x + z.l - 32 - lSig / 2, z.y + 41);
		textAlign(LEFT, TOP);
	}
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(34);
	text(r.narration.titre, z.x + 32, z.y + 70, z.l - 64, 100);
	textStyle(NORMAL);
	textSize(26);
	text(r.narration.texte, z.x + 32, z.y + 190, z.l - 64, 260);

	// Prompt 184 : plus de liste des écarts (« Fluidité −9 (dé : 3) », « Effets : … ») — les jauges du bandeau s'animent
	// (segment vert / rouge, feedback.js) ; le détail chiffré reste dans l'appli Journal. Restent le contexte qui a
	// renforcé l'effet, l'explication (pourquoi, meilleure réponse) et la phrase de contexte réelle.
	textFont(POLICE_DONNEES);
	textSize(18);
	const ctx = [r.contexte.meteo && t('ctx.meteo'), r.contexte.pointe && t('ctx.pointe'), r.contexte.affluence && t('ctx.affluence')].filter(Boolean);
	fill(C.gris);
	if (ctx.length) text(t('narration.contexte', { liste: ctx.join(', ') }), z.x + 32, z.y + 470);
	// Prompt 74 : une phrase de contexte tirée de la situation réelle (météo, heure, ligne, agenda)
	// Prompt 87 : avant elle, l'explication — ce qui s'est passé, et pourquoi (ou quelle réponse convenait mieux)
	const expl = explicationDecision(r, true).concat(r.contexteNarr ? [t(r.contexteNarr.cle, r.contexteNarr.vars)] : []);
	push(); // textLeading est un état global de p5 : encadré
	textFont(POLICE_TEXTE);
	textSize(20);
	textLeading(28);
	fill(C.texte);
	text(expl.join('\n'), z.x + 32, z.y + (ctx.length ? 512 : 470), z.l - 64, ctx.length ? 250 : 292);
	pop();

	// Suite automatique, ou Entrée / clic
	// Prompt 131 : plus de suite automatique hors défi chrono — le joueur lit à son rythme (Entrée, clic ou « Suivant »)
	const auto = !!Jeu.defiChrono;
	const tA = auto ? constrain((millis() - debutNarration) / DUREE_NARRATION, 0, 1) : 0;
	if (auto) {
		fill(C.piste);
		rect(z.x + 32, z.y + z.h - 140, z.l - 64, 6, 3);
		fill(couleurTon);
		rect(z.x + 32, z.y + z.h - 140, (z.l - 64) * tA, 6, 3);
	}
	// Prompt 183 : plus de bouton « Pause » dans l'appli (la touche P et le menu du jeu restent)
	bouton(z.x + 32, z.y + z.h - 112, z.l - 64, 72, t(Jeu.terminee ? 'narration.bilan' : 'narration.suivant'), continuer);
	if (auto && tA >= 1 && !enPause && !fenetre) continuer();
}

// ——— Écran de fin (Q47–Q55) : 3 fins, bilan détaillé, décor selon la fin (Q53) ———
// Le décor d'ambiance n'affiche aucune donnée : c'est une teinte, pas une météo réelle.
const AMBIANCES = {
	bonne: { fond: '#0D0C0C', meteo: { pluie_mm: 0, rafales_max: 0, temp_min: 18, temp_max: 26 }, titre: '#00B74F' },
	moyenne: { fond: '#0D0C0C', meteo: { pluie_mm: 0.5, rafales_max: 10, temp_min: 10, temp_max: 15 }, titre: '#FFC138' },
	mauvaise: { fond: '#0D0C0C', meteo: { pluie_mm: 9, rafales_max: 60, temp_min: 6, temp_max: 9 }, titre: '#FFC5C2' },
};
let bilanCalcule = null;

function dessinerFin() {
	if (!bilanCalcule) bilanCalcule = Jeu.bilan();
	const b = bilanCalcule;
	const amb = AMBIANCES[b.type];
	noStroke();
	fill(amb.fond);
	rect(0, 0, L, H);
	dessinerDecor({ x: 0, y: 0, l: L, h: H }, amb.meteo, b.type === 'mauvaise' ? 0.45 : 0.6, true);

	// Panneau gauche : la fin, le texte, les jauges
	const g = { x: 80, y: 70, l: 860, h: 940 };
	panneau(g.x, g.y, g.l, g.h, amb.titre);
	textAlign(LEFT, TOP);
	noStroke();
	textFont(POLICE_DONNEES);
	textSize(20);
	fill(amb.titre);
	text(t('fin.entete', { type: t('fin.type.' + b.type), score: b.score }), g.x + 48, g.y + 44);
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(44);
	textLeading(54);
	text(b.titre, g.x + 48, g.y + 84, g.l - 96, 140);
	textStyle(NORMAL);
	textSize(21);
	textLeading(29);
	text(b.texte, g.x + 48, g.y + 236, g.l - 96, 180);

	// Jauges finales
	const noms = [
		[t('fin.jauge.fluidite'), b.jauges.fluidite],
		[t('fin.jauge.reputation'), b.jauges.reputation],
		[t('fin.jauge.budget'), b.jauges.budget],
	];
	noms.forEach(([n, v], i) => {
		const y = g.y + 440 + i * 76;
		textFont(POLICE_TEXTE);
		textSize(22);
		fill(C.texte);
		textAlign(LEFT, TOP);
		text(n, g.x + 48, y);
		textFont(POLICE_DONNEES);
		textAlign(RIGHT, TOP);
		text(v + ' / 100', g.x + g.l - 48, y);
		fill(C.piste);
		rect(g.x + 48, y + 34, g.l - 96, 18, 4);
		fill(v < 20 ? C.rougeFonce : v < 40 ? C.orange : C.vert);
		rect(g.x + 48, y + 34, ((g.l - 96) * v) / 100, 18, 4);
	});
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(20);
	fill(C.texte);
	text(t('fin.traites', { n: b.traites, total: b.total, sans: b.sansDecision ? t('fin.sansDecision', { n: b.sansDecision }) : '' }), g.x + 48, g.y + 680);
	// Prompt 28 : plaintes traitées x/y, sur la même ligne que les mauvaises sources s'il y en a
	const bp = Jeu.bilanPlaintes ? Jeu.bilanPlaintes() : { total: 0 };
	const lp = bp.total ? t('fin.plaintes', { x: bp.traitees, y: bp.total, b: bp.bonnes }) : '';
	const l712 = [b.mauvaisesSources ? t('fin.mauvaisesSources', { n: b.mauvaisesSources }) : '', lp].filter(Boolean).join(' · ');
	if (l712) {
		textSize(b.mauvaisesSources && lp ? 16 : 20);
		text(l712, g.x + 48, g.y + 712, g.l - 96, 40);
		textSize(20);
	}
	if (bilanFin && bilanFin.meilleur) {
		fill(bilanFin.record ? C.vert : C.gris);
		text(
			(bilanFin.record ? t('fin.record') : t('fin.meilleur', { score: bilanFin.meilleur.score, le: bilanFin.meilleur.le })) + (Jeu.defiChrono ? ' · ' + t('fin.defiChrono') : '') + (typeof Taches !== 'undefined' ? ' · ' + t('fin.grade', { grade: t('grade.' + Taches.grade().i), xp: (Jeu.taches && Jeu.taches.xpPartie) || 0 }) : ''), // prompt 87 ; prompt 88 : grade et expérience de la partie
			g.x + 48,
			g.y + 752,
		);
	}
	// Profil de la semaine (prompt 23 § 6) — calculé sur la partie réellement jouée
	if (Jeu.profilSemaine) {
		const p = Jeu.profilSemaine();
		fill(C.accent);
		text(t('fin.profil', { phrase: p.phrase }), g.x + 48, g.y + 784, g.l - 96, 30);
		fill(C.gris);
		textSize(17);
		const det = t('fin.profilDetail', { objectifs: p.objectifs, jour: p.meilleurJour, equipes: p.equipes, malus: p.malusFrequent });
		dessinerTexte(det, g.x + 48, g.y + 806, g.l - 96, { taille: 14, couleur: C.gris, maxLignes: 2, interligne: 19 }); // prompt 39 : deux lignes au plus ; prompt 98 : 13 → 14 px, « … » en fin de mot si besoin
	}
	const bl = (g.l - 96 - 20) / 2;
	bouton(g.x + 48, g.y + g.h - 92, bl, 64, t('fin.rejouer'), rejouer); // prompt 39 : abaissés sous le profil
	bouton(g.x + 68 + bl, g.y + g.h - 92, bl, 64, t('fin.changer'), retourAccueil, false, true);

	// Panneau droit : bilan chiffré — faits réels de la semaine (Q52) et décisions clés (Q37)
	const d = { x: 1000, y: 70, l: 840, h: 940 };
	panneau(d.x, d.y, d.l, d.h);
	textAlign(LEFT, TOP);
	fill(C.accent);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(32);
	text(t('fin.bilanChiffre'), d.x + 48, d.y + 40);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(20);
	fill(C.texte);
	let y = d.y + 100;
	const f = b.faits;
	text(t(Jeu.etat.mode === 'direct' ? 'fin.releve' : 'fin.semaine', { periode: f.periode }), d.x + 48, y);
	y += 36;
	text(
		t('fin.dossiers', {
			liste: Object.entries(f.parType)
				.map(([ty, n]) => n + ' ' + (n > 1 ? tSi('typeP.' + ty, ty + 's') : tSi('type.' + ty, ty)))
				.join(' · '),
		}),
		d.x + 48,
		y,
		d.l - 96,
		60,
	);
	y += 70;
	text(f.pireRetard ? t('fin.pireRetard', { min: f.pireRetard.minutes, ligne: f.pireRetard.ligne }) : t('fin.pireRetardInconnu'), d.x + 48, y);
	y += 60;
	fill(C.accent);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(26);
	text(t('fin.decisions'), d.x + 48, y);
	textStyle(NORMAL);
	y += 46;
	const couleurs = { meilleure: C.vert, pire: C.rouge, 'mauvaise source': C.orange };
	b.decisionsCles.forEach((k) => {
		fill(couleurs[k.qualite]);
		rect(d.x + 48, y + 4, 8, 96, 3);
		textFont(POLICE_DONNEES);
		textSize(16);
		text(tSi('qualite.' + k.qualite, k.qualite).toUpperCase(), d.x + 72, y);
		fill(C.texte);
		textFont(POLICE_TEXTE);
		textSize(22);
		text(k.titre, d.x + 72, y + 24, d.l - 140, 30);
		textFont(POLICE_DONNEES);
		textSize(18);
		fill(C.gris);
		const ds = [t('jauge.fluidite'), t('jauge.reputation'), t('jauge.budget')].map((n, i) => n + ' ' + (k.deltas[i] > 0 ? '+' : '') + k.deltas[i]).join(' · ');
		text(k.action + ' → ' + ds, d.x + 72, y + 58, d.l - 140, 50);
		y += 126;
	});
	textFont(POLICE_DONNEES);
	textSize(15);
	fill(C.gris);
	textLeading(20);
	text(t('fin.sources'), d.x + 48, d.y + d.h - 60, d.l - 96, 48);
}

function retourAccueil() {
	bilanCalcule = null;
	ecran = 'accueil';
	ouvrirMenuPrincipal(); // prompt 35 : retour à l'écran titre
}

function rejouer() {
	bilanCalcule = null;
	Sauvegarde.nouvelle(); // prompt 178 : la partie rejouée prend un nouvel emplacement
	const e = Jeu.etat;
	const p = e.mode === 'semaine' ? Jeu.chargerSemaine(e.semaine.lundi) : e.mode === 'direct' ? Jeu.chargerDirect() : Jeu.chargerHorsLigne();
	p.then(() => {
		Jeu.defiChrono = !!Confort.Reglages.defiChrono; // prompt 87 : sans chrono par défaut
		Jeu.nouvellePartie();
		nouvellePartieRythme(); // prompt 74
		demarrerJournee(); // pas d'intro SMS sur « Rejouer » (§ 2)
	});
}

// =====================================================================
// Outils de dessin
// =====================================================================
function projeter(zone) {
	if (!Jeu.lignes) return { x: () => zone.x, y: () => zone.y };
	const e = Jeu.lignes.emprise;
	const m = 30;
	const kx = Math.cos((((e.nord + e.sud) / 2) * Math.PI) / 180);
	const ech = Math.min((zone.l - 2 * m) / ((e.est - e.ouest) * kx), (zone.h - 2 * m) / (e.nord - e.sud));
	const ox = zone.x + (zone.l - (e.est - e.ouest) * kx * ech) / 2;
	const oy = zone.y + (zone.h - (e.nord - e.sud) * ech) / 2;
	return { x: (lon) => ox + (lon - e.ouest) * kx * ech, y: (lat) => oy + (e.nord - lat) * ech };
}

function tracer(t) {
	beginShape();
	t.forEach((p) => vertex(projection.x(p[0]), projection.y(p[1])));
	endShape();
}

/** Prompt 39 : taille de texte réduite (de tailleMax vers tailleMin) jusqu'à tenir dans « largeur » — police monospace plus large */
// Prompt 93 : cadres des textes, pour le détecteur ?audit=textes (audit-textes.js les remplace) ; vides en jeu normal
function zoneTexteDebut() {}
function zoneTexteFin() {}
function zoneTexteDeclarer() {}
function ajusterTaille(txt, largeur, tailleMax, tailleMin) {
	textSize(tailleMax);
	while (textSize() > (tailleMin || 12) && textWidth(String(txt)) > largeur) textSize(textSize() - 1);
}

function panneau(x, y, l, h, bordure) {
	// Prompt 39 : container du Pixel DS — fond sombre, bordure blanc 15 % (ou accentuée), arrondi 0
	noStroke();
	fill(C.panneau);
	stroke(bordure || C.bord);
	strokeWeight(2);
	rect(x + 1, y + 1, l - 2, h - 2);
	noStroke();
	zoneTexteDeclarer('panneau', x, y, l, h); // prompt 93
	zoneFenetre(x, y, l, h); // prompt 173 : clic sur le fond
}

function bouton(x, y, l, h, label, action, desactive, secondaire) {
	// Prompt 39 : boutons du Pixel DS — primaire (fond rouge, texte blanc), contour (bordure blanche),
	// désactivé (fond blanc 15 %, texte blanc 50 %), arrondi 0, survol / focus en double bordure
	const survol = !desactive && mouseX >= x && mouseX <= x + l && mouseY >= y && mouseY <= y + h;
	noStroke();
	if (desactive) {
		fill(255, 255, 255, 38);
		rect(x, y, l, h);
	} else if (secondaire) {
		fill(survol ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)');
		stroke('#FFFFFF');
		strokeWeight(2);
		rect(x + 1, y + 1, l - 2, h - 2);
	} else {
		fill(C.primaire);
		rect(x, y, l, h);
	}
	if (survol) {
		noFill();
		stroke(secondaire ? '#FFFFFF' : C.primaireTrait);
		strokeWeight(2);
		rect(x - 5, y - 5, l + 10, h + 10);
		stroke(C.fond);
		rect(x - 2, y - 2, l + 4, h + 4);
	}
	noStroke();
	fill(desactive ? 'rgba(255,255,255,0.5)' : secondaire ? '#FFFFFF' : C.surPrimaire);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(Math.min(28, h * 0.34));
	while (textSize() > 14 && textWidth(label) > l - 28) textSize(textSize() - 1); // le libellé tient dans le bouton ; prompt 98 : jamais sous 14 px
	textAlign(CENTER, CENTER);
	zoneTexteDebut('bouton', x, y, l, h); // prompt 93
	text(label, x + l / 2, y + h / 2);
	zoneTexteFin();
	textStyle(NORMAL);
	if (!desactive) boutons.push({ x, y, l, h, action });
}

function easeOut(t) {
	return 1 - Math.pow(1 - t, 3);
}

function fmt(v) {
	return v === null || v === undefined ? '—' : String(Math.round(v * 10) / 10).replace('.', ',');
}

function dateLongue(iso) {
	if (!iso) return '';
	const [a, m, j] = iso.split('-').map(Number);
	return new Date(Date.UTC(a, m - 1, j)).toLocaleDateString(localeActive(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// =====================================================================
// Entrées : souris, touch, clavier (raccourcis complets, 08-raccourcis)
// =====================================================================
function mousePressed() {
	if (Sauvegarde.dialogueOuvert) return; // prompt 33 : clics destinés à la boîte d'import HTML
	if (arreterDemo()) return; // prompt 48
	Confort.Son.demarrer();
	interaction();
	if (typeof GUIDE !== 'undefined') GUIDE.clavier = false; // prompt 181 : le contour de focus clavier du guide s'efface à la souris
	if (typeof guideBloque === 'function' && guideBloque(mouseX, mouseY)) return rappelerConsigneGuide(); // prompt 181 : guide contraignant — hors de la cible, le clic est ignoré
	if (typeof debutJeton === 'function' && debutJeton()) return; // prompt 102 : jeton d'équipe saisi (glisser-déposer)
	if (typeof PATRON !== 'undefined' && PATRON.zoneFocus === 'barre') PATRON.zoneFocus = null; // prompt 195 : un clic hors du champ quitte la recherche de Mails (le champ, cliqué, la reprend)
	for (let i = boutons.length - 1; i >= 0; i--) {
		const b = boutons[i];
		if (mouseX >= b.x && mouseX <= b.x + b.l && mouseY >= b.y && mouseY <= b.y + b.h) {
			if (vue === 'poste') Confort.Son.clic(); // prompt 30 : clic très discret au poste
			b.action();
			return;
		}
	}
	if (clicFondFenetre()) return; // prompt 173 : clic sur le fond = fermer (fenêtres non bloquantes)
	if (typeof debutPanCarte === 'function') debutPanCarte(); // prompt 106 : glisser la carte
}

function basculerSon() {
	Confort.Reglages.basculer('son');
}

/** Prompt 133 : plein écran du document (1920×1080 du brief sans barres du navigateur).
 * Prompt 175 : une seule logique pour la touche F et l'interrupteur des paramètres ; l'état affiché est l'état RÉEL
 * (document.fullscreenElement, ou plein écran du navigateur ouvert par F11), jamais un réglage mémorisé — le
 * navigateur exige un geste. L'annonce part de l'événement « fullscreenchange » (sortie par Échap comprise). */
const pleinEcranPossible = () => typeof document !== 'undefined' && !!(document.documentElement && document.documentElement.requestFullscreen && document.exitFullscreen) && document.fullscreenEnabled !== false;
/** Plein écran ouvert par le navigateur (F11) : la page ne peut pas en sortir elle-même */
function pleinEcranNavigateur() {
	try {
		return !document.fullscreenElement && typeof matchMedia === 'function' && matchMedia('(display-mode: fullscreen)').matches;
	} catch (e) {
		return false;
	}
}
const pleinEcranActif = () => typeof document !== 'undefined' && (!!document.fullscreenElement || pleinEcranNavigateur());
function basculerPleinEcran() {
	if (!pleinEcranPossible()) return;
	try {
		if (document.fullscreenElement) document.exitFullscreen();
		else if (pleinEcranNavigateur()) annoncer(t('pleinEcran.f11'));
		else document.documentElement.requestFullscreen().catch(() => {});
	} catch (e) {}
}
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('fullscreenchange', () => annoncer(t(document.fullscreenElement ? 'pleinEcran.entree' : 'pleinEcran.sortie')));
/** Prompt 174 : true si la touche n'est pas pour le jeu — un champ de saisie HTML a le focus (le texte tapé lui
 * appartient), ou Ctrl / Cmd / Alt est enfoncé (Ctrl+R, Ctrl+L, Ctrl+P, Alt+← restent au navigateur) */
function saisieOuRaccourciNavigateur() {
	const a = typeof document !== 'undefined' ? document.activeElement : null;
	if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return true;
	return keyIsDown(CONTROL) || keyIsDown(ALT) || keyIsDown(91) || keyIsDown(93);
}
function keyPressed() {
	// Prompt 33 : boîte d'import ouverte (champ texte, fichier) → le clavier lui appartient
	if (Sauvegarde.dialogueOuvert) return;
	if (saisieOuRaccourciNavigateur()) return; // prompt 174 : champ de texte au focus, ou Ctrl / Cmd / Alt (raccourcis du navigateur) → le jeu ne lit rien
	if (arreterDemo()) return false; // prompt 48 : une touche arrête la démo automatique
	if (CINE) return toucheCinematique(), false; // prompt 41
	if (GAMEOVER) return toucheGameOver(), false; // prompt 84
	if (TRANSITION_JOUR && (keyCode === ENTER || keyCode === RETURN || key === ' ' || keyCode === ESCAPE)) return passerTransitionJour(), false; // prompt 43
	Confort.Son.demarrer(); // l'audio ne peut démarrer qu'après un geste du joueur
	interaction();
	if (typeof guideFiltre === 'function' && guideFiltre() && toucheGuide()) return false; // prompt 181 : guide contraignant — liste blanche de touches (guide.js)
	if (!smsActif && !tutoriel && typeof saisieRechercheMails === 'function' && saisieRechercheMails()) return false; // prompt 195 : le champ de recherche de Mails a le focus — la frappe lui appartient (aucune lettre n'atteint les raccourcis)
	// Intro SMS (§ 2) : clic / Entrée pour avancer
	if (smsActif) {
		if (keyCode === ENTER || keyCode === RETURN || key === ' ') avancerConversation(); // prompt 42
		else if (keyCode === ESCAPE) passerConversation(); // prompt 97 : une touche pour tout passer (learn < 1 min)
		return false;
	}
	// Réveil (§ 4) : barre d'espace
	if (phase === 'reveil' && reveil) {
		if (key === ' ' || keyCode === ENTER || keyCode === RETURN) seReveiller();
		return false;
	}
	// Prompt 78 : endormi — Espace, Entrée ou Z réveillent (la sieste forcée bloque tout le reste) ; L reste disponible
	if (enSieste && ecran === 'jeu' && !fenetre && !(key === 'l' || key === 'L')) {
		if (key === ' ' || key === 'z' || key === 'Z' || keyCode === ENTER || keyCode === RETURN) reveiller();
		return false;
	}
	// Prompt 78 : Z = se reposer (sieste volontaire)
	if ((key === 'z' || key === 'Z') && ecran === 'jeu' && !fenetre && !tutoriel && !MENU.actif) return dormir(true), false;
	// Prompt 37 : G arrête le guide « Prendre en main »
	if ((key === 'g' || key === 'G') && GUIDE.actif && !MENU.actif) return arreterGuide(), false;
	// Prompt 34 : le tutoriel capte le clavier (L reste disponible pour changer de langue)
	if (tutoriel && !(key === 'l' || key === 'L')) return toucheTutoriel(), false;
	// Prompt 133 : F = plein écran (entrée / sortie), partout hors saisie ; rien si l'API est absente
	if ((key === 'f' || key === 'F') && !keyIsDown(CONTROL) && !keyIsDown(91)) return basculerPleinEcran(), false;
	// Langue (prompt 24) : L bascule partout, sans toucher à la partie
	if (key === 'l' || key === 'L') return Langue.suivante(), false;
	// Prompt 47 : inspection, démission, palmarès ; J = journal de bord, D = rendre son badge
	if (toucheParametres() || toucheTelephone() || toucheTaches() || toucheMecaniques() || toucheJournee()) return false; // prompts 47 et 51 ; prompt 175 : la fenêtre des paramètres capte le clavier (Tab, flèches, Entrée, Espace)
	if (appliInteractive() && typeof toucheCarte === 'function' && toucheCarte()) return false; // prompt 102 : Échap annule un jeton d'équipe choisi ; prompt 182 : raccourcis de l'appli seulement au poste
	// Fenêtres ouvertes : elles captent le clavier
	if (fenetre) {
		if (keyCode === ESCAPE || (fenetre === 'aide' && (key === 'h' || key === 'H' || key === '?'))) return fermer(), false;
		if (fenetre === 'aide' && toucheAide()) return false; // prompt 123 : onglets (← → Tab, 1 à 4) et pages (↑ ↓)
		if (fenetre === 'aide' && (key === 't' || key === 'T')) return lancerTutoriel(), false; // prompt 34
		if (fenetre === 'telephone' && (keyCode === ENTER || keyCode === RETURN)) return fermer(), false; // prompt 38
		if (fenetre === 'partage' && keyCode !== ESCAPE) return touchePartage(), false; // prompt 81
		if (fenetre === 'installation' && (keyCode === ENTER || keyCode === RETURN || key === ' ')) return fermer(), false; // prompt 171
		if (fenetre === 'rapport' && (keyCode === ENTER || keyCode === RETURN)) return actionRapport(), false; // prompt 41
		if (fenetre === 'rapportVeille' && (keyCode === ENTER || keyCode === RETURN || keyCode === ESCAPE)) return fermer(), false; // prompt 89 bis
		if (fenetre === 'menu') {
			// Prompt 35 : menu Échap modernisé — ↑ ↓ / Tab pour choisir, Entrée pour valider
			const ENTREES_PAUSE = entreesPause(); // prompt 124
			const n = ENTREES_PAUSE.length;
			if (keyCode === UP_ARROW || (keyCode === TAB && keyIsDown(SHIFT))) choixPause = (choixPause + n - 1) % n;
			else if (keyCode === DOWN_ARROW || keyCode === TAB) choixPause = (choixPause + 1) % n;
			else if (keyCode === ENTER || keyCode === RETURN) ENTREES_PAUSE[choixPause].action();
			if (keyCode === UP_ARROW || keyCode === DOWN_ARROW || keyCode === TAB) annoncer(t(ENTREES_PAUSE[choixPause].cle));
			return false;
		}
		if (fenetre === 'reset') {
			if (keyCode === ENTER || keyCode === RETURN || key === 'o' || key === 'O') confirmerReset();
			if (key === 'n' || key === 'N') fermer();
		}
		return false;
	}
	// Prompt 35 : menu principal (écran titre / choix de la semaine)
	if (MENU.actif) return toucheMenu(), false;
	if (toucheSoir()) return false; // prompt 69 : Entrée → sortie du bureau (prompt 174 : plus de S)
	// Au bureau (§ 1, § 7) : Échap = menu ; Tab = objets (écran, livres) ; Entrée = ouvrir / s'installer
	if (vue !== 'poste') {
		if (vue !== 'bureau') return false;
		if (keyCode === ESCAPE) return ouvrir('menu'), false;
		if (keyCode === TAB) {
			const n = OBJETS_BUREAU.length;
			do focusBureau = (focusBureau + (keyIsDown(SHIFT) ? n - 1 : 1)) % n;
			while (OBJETS_BUREAU[focusBureau].visible && !OBJETS_BUREAU[focusBureau].visible()); // prompt 41 : objets invisibles sautés
			return false;
		}
		if (keyCode === ENTER || keyCode === RETURN || key === ' ') ouvrirObjetBureau(focusBureau > 0 ? OBJETS_BUREAU[focusBureau].nom : 'ecran');
		if (key === 'm' || key === 'M') toucheMEnfoncee(); // prompt 54 : brève = son, maintenue = micro
		if (key === 'h' || key === 'H' || key === '?') ouvrir('aide');
		return false;
	}
	// Prompt 36 : I ouvre / ferme l'app flottante « Indicateurs » (au poste)
	if (key === 'i' || key === 'I') return basculerIndicateurs(), false;
	// Prompt 101 (D2) : V déplie / replie les détails des Indicateurs (le Patron / Mails garde son V quand il est ouvert ;
	// prompt 186 : le Journal n'a plus de pli « Détails », V y garde ce sens)
	if ((key === 'v' || key === 'V') && PC.flottant && PC.fenetre !== 'patron') return basculerDetailsIndicateurs(), false;
	// Prompt 183 : plus de bureau d'icônes — au poste, PC.etat vaut 'appli' (carte) ou 'os' (une autre appli en vue
	// intégrée, PC.fenetre) ; éteint ou en démarrage, seul « Quitter le PC » répond
	if (PC.fenetre && PC.etat === 'appli') PC.etat = 'os'; // prompt 91 § 1 : la vue ouverte reçoit les touches d'abord
	if (PC.etat === 'os' && !PC.fenetre) versAppliPrincipale();
	if (PC.etat !== 'appli') {
		if (PC.etat === 'os' && typeof toucheJournal === 'function' && toucheJournal()) return false; // prompt 89 : jours, filtres, cartes, enquête (Échap revient)
		if (keyCode === ESCAPE && typeof echapPatron === 'function' && echapPatron()) return false; // prompt 185 : Mails en zone étroite, la lecture revient à la liste
		if (keyCode === ESCAPE) return (depilerNavigation() || (PC.etat === 'os' ? fermerFenetreApp() : quitterPC())), false; // prompt 91 § 3 : Échap revient d'abord à l'écran d'origine, puis à la carte (prompt 183) ; prompt 182 : sortie par quitterPC
		if (focusQuitter && (keyCode === ENTER || keyCode === RETURN || key === ' ')) return quitterPC(), false; // prompt 26
		if (PC.etat !== 'os') {
			if (keyCode === TAB) basculerFocusQuitter(!focusQuitter);
			return false;
		}
		// Prompt 103 : le menu a le focus (Tab) → Entrée ouvre l'entrée choisie avant les raccourcis de la vue
		if (MENU_FOCUS.actif && (keyCode === ENTER || keyCode === RETURN || key === ' ')) return ouvrirEntreeMenu(ICONES_OS[PC.selection].cle), false;
		if (ecran === 'jeu' && toucheCommunity()) return false; // prompt 85 : onglets, défilement, publication
		if (ecran === 'jeu' && touchePatron()) return false; // prompt 86 : filtres, défilement, réponses rapides
		// Prompt 28 : plainte en attente dans l'app Community — Tab parcourt les réponses, Entrée / 1-2-3 répond
		const plainte = PC.fenetre === 'community' && ecran === 'jeu' ? cibleCommunity() : null;
		if (plainte && !focusQuitter) {
			const n = plainte.def.reponses.length;
			if (keyCode === TAB) {
				focusReponse = focusReponse < 0 ? (keyIsDown(SHIFT) ? n - 1 : 0) : (focusReponse + (keyIsDown(SHIFT) ? n - 1 : 1)) % n; // prompt 204 : premier Tab = première réponse
				const rTab = plainte.def.reponses[Jeu.ordreReponses(plainte)[focusReponse]]; // prompt 197 : ordre mélangé + texte du clash, lu « mot masqué »
				annoncer(typeof lireMasques === 'function' ? lireMasques(Jeu.texteReponse(plainte, rTab)) : Jeu.texteReponse(plainte, rTab));
				return false;
			}
			if (keyCode === ENTER || keyCode === RETURN || key === ' ') return (focusReponse < 0 ? annoncer(t('commu.choisir')) : repondrePlainte(focusReponse)), false; // prompt 204 : aucune réponse choisie → rien n'est envoyé
			if (Number(key) >= 1 && Number(key) <= n) return repondrePlainte(Number(key) - 1), false;
		}
		if (keyCode === TAB) return tabMenuApp(), false; // prompts 26 / 103 : entrées du menu, puis « Quitter le PC »
		return false;
	}
	// Au poste : Échap fait se lever (sauf à l'écran de fin)
	if (keyCode === ESCAPE && !(ecran === 'jeu' && phase === 'fin')) return (depilerNavigation() || quitterPC()), false; // prompt 91 § 3 ; prompt 182 : sortie retenue si un choix attend
	// Prompt 183 : le menu de l'appli a le focus (Tab) → Entrée / Espace ouvre l'appli choisie
	if (MENU_FOCUS.actif && ecran === 'jeu' && (keyCode === ENTER || keyCode === RETURN || key === ' ')) return ouvrirEntreeMenu(ICONES_OS[PC.selection].cle), false;
	// Prompt 72 : réponses d'une alerte — ↑ ↓ / Tab les parcourent, Entrée valide (le focus « Quitter le PC » d'abord s'il est pris)
	if (!focusQuitter && !MENU_FOCUS.actif && ecran === 'jeu' && toucheSourcesEnquete()) return false; // prompt 92 : Tab / Entrée / ↑ ↓ dans les sources d'« En savoir plus »
	if (!focusQuitter && !MENU_FOCUS.actif && ecran === 'jeu' && toucheMultitache()) return false; // prompt 77 : Tab passe d'un signalement actif à l'autre
	// Prompt 26 : Tab place le focus sur « Quitter le PC » ; prompt 183 : il passe d'abord par le menu de l'appli
	// (Patron, Community, Journal, Données) — seul chemin au clavier vers les autres applis depuis la carte
	if (keyCode === TAB) return ecran === 'jeu' && phase !== 'fin' ? tabMenuApp() : basculerFocusQuitter(!focusQuitter), false;
	if (focusQuitter && (keyCode === ENTER || keyCode === RETURN || key === ' ')) return quitterPC(), false;
	// Touches valables partout
	if (key === 'h' || key === 'H' || key === '?') return ouvrir('aide'), false;
	if (key === 'm' || key === 'M') return toucheMEnfoncee(), false; // prompt 54 : brève = son, maintenue = micro
	if (ecran === 'jeu') {
		// Prompt 174 : R = ralenti tactique (défi chrono) seulement ; « Recommencer la semaine », action rare et destructrice, n'a plus de touche (menu du jeu)
		if ((key === 'r' || key === 'R') && Jeu.defiChrono && ['decision', 'contradiction', 'conflit'].includes(phase)) return demanderRalentiUI(), false;
		if (key === 'p' || key === 'P') return basculerPause(), false;
	}
	if (ecran === 'accueil') {
		if (keyCode === ENTER || keyCode === RETURN) ouvrirMenuPrincipal(); // prompt 35 : plus d'accueil dans le PC
	} else if (toucheEquipes()) {
		// prompt 68 : Maj + 1/2/3/4 envoie une équipe sur l'incident
	} else if (toucheFileSignalements()) {
		// prompt 73 : ↑ ↓ choisissent un signalement de la file, Entrée le prend (le compteur démarre)
	} else if ((phase === 'decision' || phase === 'contradiction') && toucheEnquete()) {
		// prompt 50 : 5 à 8 consultent une source
	} else if (phase === 'decision') {
		// Prompt 87 : 1 à 4 = cartes de réponse affichées ; 0 ou Espace = la réponse « attendre » ; E = En savoir plus
		toucheReponses(); // prompt 117 : 1 à 3 = les répliques affichées (plus de raccourci caché « 0 = attendre »)
	} else if (phase === 'contradiction') {
		if (key === 'a' || key === 'A') choisirSource('a');
		if (key === 'b' || key === 'B') choisirSource('b');
	} else if (phase === 'conflit') {
		if (key === 'a' || key === 'A') choisirPriorite('a');
		if (key === 'b' || key === 'B') choisirPriorite('b');
	} else if (phase === 'narration' && (keyCode === ENTER || keyCode === RETURN)) {
		continuer();
	} else if (phase === 'fin') {
		if (keyCode === ENTER || keyCode === RETURN) rejouer();
		if (keyCode === ESCAPE || keyCode === BACKSPACE) retourAccueil();
	}
	if (key === ' ' || keyCode === UP_ARROW || keyCode === DOWN_ARROW) return false; // pas de défilement de la page
}

// Prompt 26 : au poste, la molette fait quitter le PC (anti-rebond dans bureau.js) ; ailleurs, scroll normal
// Prompt 182 : le contenu qui défile prend la molette d'abord ; la sortie n'est possible que si aucun choix n'attend
function mouseWheel(event) {
	interaction();
	if (typeof guideBloque === 'function' && guideBloque(mouseX, mouseY)) return rappelerConsigneGuide(), false; // prompt 181 : molette hors de la cible du guide
	if (typeof molletteCarte === 'function' && molletteCarte(event.delta)) return false; // prompt 106 : zoom de la carte
	if (molletteCommunity(event.delta)) return false; // prompt 85 : défilement du fil
	if (mollettePatron(event.delta)) return false; // prompt 86 : historique du patron
	if (molletteJournal(event.delta)) return false; // prompt 89 : frise du Journal
	if (molletteEnquete(event.delta)) return false; // prompt 92 : sources de l'enquête
	if (scrollSortiePC(event.delta)) return false;
}

// Prompt 25 : la caméra du bureau ne suit la souris qu'une fois celle-ci réellement bougée sur le canevas
function mouseMoved() {
	sourisDansCanevas = mouseX >= 0 && mouseX <= L && mouseY >= 0 && mouseY <= H;
}

// Touch basique (Q32) : un appui = un clic sur les boutons
function touchStarted(e) {
	if (horsCanevas(e)) return; // prompt 60 : un bouton HTML (avis portrait, boîtes) garde son comportement normal
	if (Sauvegarde.dialogueOuvert) return;
	if (MOBILE.actif) return (PORTRAIT.actif ? portraitDebut(e) : toucherDebut()), false; // prompt 60 : sur téléphone, le clic part au relâchement (swipe, appui long) ; 60b : portrait
	sourisDansCanevas = false; // au doigt, pas de caméra (la position du dernier appui resterait « collée »)
	Confort.Son.demarrer();
	mousePressed();
	return false;
}

// =====================================================================
// Fenêtres : aide, confirmation de reset, paramètres ; voile de pause
// =====================================================================
function voile() {
	dsVoile(); // prompt 173 : un seul voile (DS.voile, ds.js) derrière toutes les fenêtres
}

function dessinerPause() {
	voile();
	const l = DS.fenetre.etroite;
	const h = 240;
	panneau((L - l) / 2, (H - h) / 2, l, h, C.accent);
	textAlign(CENTER, CENTER);
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(48);
	text(t('pause.titre'), L / 2, H / 2 - 50);
	textStyle(NORMAL);
	bouton((L - 360) / 2, H / 2 + 10, 360, 72, t('pause.reprendre'), basculerPause);
}

function dessinerFenetre() {
	// Prompt 173 : la zone de la fenêtre (premier panneau dessiné) sert au clic sur le fond
	ZONE_FENETRE = null;
	FENETRE_EN_DESSIN = true;
	try {
		contenuFenetre();
	} finally {
		FENETRE_EN_DESSIN = false;
	}
}
function contenuFenetre() {
	if (fenetre === 'telephone') return fenetreTelephone(); // prompt 42 : le téléphone en main (voile du DS, prompt 173)
	if (fenetre === 'cafe') return fenetreCafe(); // prompt 52 : même animation, la tasse en main
	voile();
	if (fenetre === 'rapport') return fenetreRapport(); // prompt 41
	if (fenetre === 'rapportVeille') return fenetreRapportVeille(); // prompt 89 bis
	if (fenetre === 'mailFin') return fenetreMailFin(); // prompt 56
	if (fenetre === 'inspection') return fenetreInspection(); // prompt 47
	if (fenetre === 'tache') return fenetreTache(); // prompt 88
	if (fenetre === 'demission') return fenetreDemission(); // prompt 47
	if (fenetre === 'palmares') return fenetrePalmares(); // prompt 47
	if (fenetre === 'partir') return fenetrePartir(); // prompt 51
	if (fenetre === 'blame') return fenetreBlame(); // prompt 51
	if (fenetre === 'partage') return fenetrePartage(); // prompt 81
	if (fenetre === 'installation') return fenetreInstallation(); // prompt 171
	if (fenetre === 'aide') return fenetreAide();
	if (fenetre === 'reset') return fenetreReset();
	if (fenetre === 'parametres') return fenetreParametres(); // prompt 175 : parametres.js
	if (fenetre === 'menu') return fenetreMenu();
	if (fenetre === 'telephone') return fenetreTelephone(); // prompt 38
}

// Prompt 123 : la fenêtre d'aide (onglets, cartes, pagination) est dans aide.js

function fenetreReset() {
	const l = DS.fenetre.moyenne; // prompt 173 (était 760)
	const h = 300;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.orange);
	textAlign(CENTER, TOP);
	noStroke();
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(40);
	text(t('reset.titre'), L / 2, y + 48);
	textStyle(NORMAL);
	ajusterTaille(t('reset.texte'), l - 80, 22);
	fill(C.gris);
	text(t('reset.texte'), L / 2, y + 110);
	bouton(x + 48, y + h - 112, (l - 112) / 2, 72, t('reset.oui'), confirmerReset);
	bouton(x + 64 + (l - 112) / 2, y + h - 112, (l - 112) / 2, 72, t('reset.non'), fermer, false, true);
}

/** Prompt 44 : morceau suivant (mémorisé), joué tout de suite si le son est actif */
function musiqueSuivante(sens) {
	const liste = Confort.Son.musique.pistes();
	const i = liste.indexOf(Confort.Reglages.musique || 'coquillage');
	const suivante = liste[(i + (sens || 1) + liste.length) % liste.length];
	Confort.Son.demarrer();
	Confort.Son.musique.changer(suivante);
	annoncer(t('param.musique') + ' : ' + t('musique.' + suivante));
}

function basculerReglage(nom) {
	Confort.Reglages.basculer(nom);
	appliquerReglages();
	if (nom === 'horsLigneForce') {
		if (Confort.Reglages.horsLigneForce) Jeu.enLigne = false;
		else {
			Jeu.enLigne = null;
			Jeu.verifierConnexion();
		}
	}
}

// Prompt 175 : la fenêtre des paramètres (quatre sections à onglets) est dans parametres.js

/** Sélecteur de langue (prompt 24) : un bouton par entrée de LANGUES, aligné à droite sur xDroite ; touche L partout */
function selecteurLangue(xDroite, y, h) {
	const lb = 84;
	LANGUES.forEach((lg, i) => {
		const x = xDroite - (LANGUES.length - i) * (lb + 8);
		bouton(x, y, lb, h || 52, lg.code.toUpperCase(), () => Langue.changer(lg.code), false, lg.code !== Langue.actuelle);
	});
}
