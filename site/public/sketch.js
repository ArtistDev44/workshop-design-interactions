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
	primaire: '#D4031C',
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
// Polices : Inter / IBM Plex Mono si installées, sinon une police système équivalente (aucun téléchargement).
// p5 entoure le nom de guillemets : on lui passe donc UN seul nom, celui de la première police réellement installée.
function policeInstallee(candidats, generique) {
	const ctx = document.createElement('canvas').getContext('2d');
	const mesure = (f) => ((ctx.font = '72px ' + f), ctx.measureText('mmmmmmmmmmlli 0123456789').width);
	const ref = mesure(generique);
	return candidats.find((n) => mesure('"' + n + '", ' + generique) !== ref) || candidats[candidats.length - 1];
}
const POLICE_TEXTE = policeInstallee(['JetBrains Mono', 'IBM Plex Mono', 'Menlo', 'Consolas', 'DejaVu Sans Mono', 'Courier New'], 'serif'); // prompt 39 : paragraphes en JetBrains Mono
const POLICE_DONNEES = POLICE_TEXTE;

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
let fenetre = null; // null | 'aide' | 'reset' | 'parametres'
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
const DUREE_NARRATION = 6000;
let arriveeDossier = 0; // millis() d'arrivée du dossier (glissement, Q10)
let debutCompteur = 0;
let boutons = []; // zones cliquables recalculées à chaque image
let focusReponseAlerte = 0; // prompt 72 : réponse d'alerte focalisée au clavier (↑/↓, Entrée)
let projection = null;
let gouttes = [];

function setup() {
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
		detail: T('accueil.detail', { niveau: T('niveau.' + s.niveau), s: s.compteur_s }),
		info: T('accueil.info', { d: s.dossiers, e: s.evenements, meilleur: texteMeilleur(s.lundi) }),
		sauvegarde: Sauvegarde.pour(s.lundi), // prompt 33
	}));
	opts.push({
		type: 'direct',
		titre: T('accueil.direct.titre'),
		detail: T(Jeu.enLigne === false ? 'accueil.direct.indispo' : 'accueil.direct.flux'),
		info: T('accueil.direct.info', { meilleur: texteMeilleur('direct') }),
		desactive: Jeu.enLigne === false,
		sauvegarde: Sauvegarde.pour('direct'),
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
	// Prompt 35 : menu principal plein écran avant le bureau ; il se ferme dès qu'une partie démarre ou reprend
	if (MENU.actif && ecran === 'jeu') fermerMenuPrincipal();
	if (MENU.actif) {
		boutons = [];
		if (!dessinerDemo()) dessinerMenuPrincipal(); // prompt 48 : démo automatique après 40 s sans action
		if (MENU.partage) dessinerPanneauPartage(); // prompt 81 : panneau modal « Partager » par-dessus
		if (fenetre) {
			boutons = [];
			dessinerFenetre();
		}
		dessinerTutoriel();
		majCurseur();
		return;
	}
	verifierMecaniques(); // prompt 47 : inspection surprise (avant l'horloge, qui s'arrête alors)
	majSelection(); // prompt 68/77 : signalements actifs, expiration individuelle
	majNotifications(); // prompt 77 : notifications bureau (signalement, mail, commentaire, équipe)
	if (Jeu.majPlaintes) Jeu.majPlaintes(); // prompt 79 : plaintes Community qui s'enveniment à l'expiration
	majSoir(); // prompt 69 : crépuscule accéléré, sortie du bureau
	majDemarrageJour(); // prompt 71 : démarrage du PC en début de journée (jours 1 à 3)
	avancerTemps(); // horloge simulée, sieste, arrivée des incidents, fin de journée (immersion.js)
	if (Jeu.equipes) Jeu.majEquipes(millis()); // équipes envoyées depuis la carte (prompt 22)
	boutons = [];
	// 1. Contenu de l'écran du PC, en 1920×1080 : l'appli de régulation, ou le système (démarrage, bureau)
	ciblesGuide = {}; // prompt 37 : cibles des flèches, relevées pendant le dessin
	espaceDessin = 'pc';
	sourisVersEcran();
	background(C.fond);
	if (PC.etat === 'appli') {
		// Prompt 50 : l'appli est une fenêtre de RégulOS, la barre des tâches reste visible
		dessinerFondOS();
		const n0 = entrerFenetreAppli();
		noStroke();
		fill(C.fond);
		rect(0, 0, L, H);
		if (ecran === 'accueil') dessinerAppliSansPartie(); // prompt 35 : l'accueil est sorti du PC (menu principal)
		else {
			dessinerJeu();
			bandeauEtat(); // prompt 43
			indicateurSauvegarde(); // prompt 33
		}
		if (enPause) dessinerPause();
		dessinerFermerAppli();
		sortirFenetreAppli(n0);
		dessinerBarreTaches();
	} else dessinerOS();
	dessinerIndicateurs(); // prompt 36 : app flottante, au premier plan
	sourisRestaurer();
	espaceDessin = 'ecran';
	// 2. La pièce et le moniteur autour (bureau, zoom, ou « au poste » avec la pièce visible)
	composerVue();
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
	dessinerExplicationPoste(); // prompt 74 : première ouverture — qui est le joueur, ce que fait le poste
	if (smsActif) {
		boutons = [];
		dessinerSMS();
	}
	dessinerGuide(); // prompt 37 : flèches « Prendre en main »
	dessinerTutoriel(); // prompt 34 : par-dessus l'écran et les fenêtres
	dessinerNoirSoir(); // prompt 69 : fondu et écran noir de la sortie
	dessinerNotifications(); // prompt 77 : en haut à droite, par-dessus tout (vue PC comme vue bureau)
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

/** Prompt 43 : bandeau d'état en bas de l'écran du jeu — ce qu'il faut faire maintenant */
function bandeauEtat() {
	if (ecran !== 'jeu') return;
	const cle = { attente: 'attente', reveil: 'attente', selection: 'selection', decision: 'decision', contradiction: 'contradiction', conflit: 'conflit', narration: 'narration', mail: 'mail', soir: 'soir', fin: 'fin' }[phase];
	if (!cle) return;
	const txt = phase === 'attente' && Jeu.journeeFinie && Jeu.journeeFinie() ? t('etat.finJournee', { fin: Jeu.formaterHeure(Jeu.finJournee()) }) : t('etat.' + cle, { x: IMMERSION.compression }); // prompt 51
	const urgent = ['decision', 'contradiction', 'conflit'].includes(phase);
	noStroke();
	fill(urgent ? C.primaire : 'rgba(255,255,255,0.08)');
	rect(GAUCHE.x, H - 38, 1180, 32);
	fill('#ffffff');
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	ajusterTaille(txt, 1160, 18);
	textAlign(LEFT, CENTER);
	text(txt, GAUCHE.x + 14, H - 22);
	textStyle(NORMAL);
	// Prompt 78 : jauge de somnolence à droite du bandeau — cliquable pour se reposer volontairement
	if (typeof somnolence !== 'undefined') {
		const jx = GAUCHE.x + 1200;
		const jl = 300;
		textAlign(LEFT, CENTER);
		textFont(POLICE_DONNEES);
		textSize(15);
		fill(C.gris);
		text(t('somnolence.titre'), jx, H - 22);
		const jw = jl - textWidth(t('somnolence.titre')) - 90;
		fill(C.piste);
		rect(jx + 90 + textWidth(t('somnolence.titre')), H - 30, jw, 16, 4);
		const sc = color(somnolence >= SOMNOLENCE.max ? C.rougeFonce : somnolence >= 70 ? C.orange : C.vert);
		fill(sc);
		rect(jx + 90 + textWidth(t('somnolence.titre')), H - 30, (jw * Math.min(100, somnolence)) / 100, 16, 4);
		boutons.push({ x: jx, y: H - 38, l: jl, h: 32, action: () => seReposer() });
		const survolJauge = mouseX >= jx && mouseX <= jx + jl && mouseY >= H - 38 && mouseY <= H - 6;
		if (survolJauge) infobulle(t('somnolence.aide'), jx, H - 84);
	}
}

function lancerPartie() {
	const o = optionsAccueil()[choixAccueil];
	if (!o || o.desactive) return;
	// Prompt 33 : une sauvegarde existe pour cette semaine → « Reprendre » ou « Nouvelle partie » (écrasement confirmé)
	if (o.sauvegarde) return ouvrir('reprise');
	lancerNouvellePartie();
}
function lancerNouvellePartie() {
	const o = optionsAccueil()[choixAccueil];
	if (!o || o.desactive) return;
	if (o.sauvegarde) Sauvegarde.effacer(o.sauvegarde.semaine);
	fenetre = null;
	const p = o.type === 'direct' ? Jeu.chargerDirect() : Jeu.chargerSemaine(o.lundi);
	Confort.Son.bip('choix');
	RAPPORT = null;
	p.then(() => {
		Jeu.nouvellePartie();
		derniereSerieAnnoncee = 0; // prompt 74
		demarrerJournee(); // journée 1, 8h00 (prompt 76), en attente du premier incident
		const ch = chapitreCourant();
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
	focusReponseAlerte = 0; // prompt 72
	if (!Jeu.dossierCourant()) return apresDecision();
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
	if (Jeu.actionBloquee && action === Jeu.actionBloquee()) return; // erreur système : action indisponible
	// Prompt 56 : mesures de la décision (temps réel de décision, sources consultées) pour le rapport de semaine
	const mesures = { dureeMs: Math.max(0, millis() - arriveeDossier), sources: typeof enqueteDossier === 'function' ? Object.keys(enqueteDossier().revele).length : 0 };
	dernierResultat = Jeu.decider(action, sourceChoisie);
	if (!dernierResultat) return;
	if (action !== 'temps') Object.assign(dernierResultat, mesures);
	else dernierResultat.sources = mesures.sources;
	const dj = dernierResultat.deltas.map((v, i) => t('jaugeTitre.' + ['fluidite', 'reputation', 'budget'][i]) + ' ' + (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v)).join(', ');
	annoncer(t('annonce.decision', { titre: dernierResultat.narration.titre, texte: dernierResultat.narration.texte }) + ' ' + dj + '.'); // prompt 53 : variations annoncées
	Confort.Son.clicAction(action); // prompt 44 § 4 : un clic de console par action
	Confort.Son.jauges(dernierResultat.deltas); // § 5 : chute brutale ou remontée nette, audibles
	feedbackSerie(); // prompt 74 : 2 bonnes évaluations d'affilée → félicitation du patron ; 2 « raté » → encouragement
	phase = 'narration';
	debutNarration = millis();
	Sauvegarde.auto(false); // prompt 33 : après chaque décision (l'annonce de la décision n'est pas écrasée)
}

function continuer() {
	if (phase === 'narration' && !enPause) apresDecision(); // retour à la surveillance (immersion.js)
}

// ——— Prompt 74 : feedback de série (présentation seule, aucun effet sur les jauges) ———
let derniereSerieAnnoncee = 0;
function feedbackSerie() {
	if (!Jeu.messagePatron) return;
	const s = serieDecisions();
	if (s.n >= 2 && s.n !== derniereSerieAnnoncee) {
		derniereSerieAnnoncee = s.n;
		if (s.type === 'bon') Jeu.messagePatron(T('serie.bravo', { n: s.n }));
		else Jeu.messagePatron(T('serie.encourage', { n: s.n }));
	}
}

// ——— Prompt 74 : première ouverture de l'écran de jeu — qui est le joueur, ce que fait le poste ———
const CLE_EXPLIQUE_POSTE = 'pxe-nte001:poste-explique-';
function explicationPosteActive() {
	if (ecran !== 'jeu' || !Jeu.graine || MENU.actif || tutoriel || smsActif || fenetre) return false;
	try {
		return localStorage.getItem(CLE_EXPLIQUE_POSTE + Jeu.graine) !== 'oui';
	} catch (e) {
		return true;
	}
}
function fermerExplicationPoste() {
	try {
		localStorage.setItem(CLE_EXPLIQUE_POSTE + (Jeu.graine || 0), 'oui');
	} catch (e) {}
	annoncer(t('poste.explique'));
	Confort.Son.bip('choix');
}
function dessinerExplicationPoste() {
	if (!explicationPosteActive()) return;
	boutons = [];
	voile();
	const l = 1060;
	const h = 560;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	textAlign(LEFT, TOP);
	noStroke();
	fill(C.accent);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(34);
	text(t('poste.titre'), x + 48, y + 36);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(21);
	textLeading(31);
	fill(C.texte);
	text(t('poste.explique'), x + 48, y + 96, l - 96, h - 200);
	bouton(x + l - 48 - 300, y + h - 92, 300, 64, t('poste.compris'), fermerExplicationPoste);
}

// ——— Pause (Q13) : uniquement entre deux dossiers, c'est-à-dire pendant la narration ———
function basculerPause() {
	if (phase !== 'narration') return; // jamais pendant un compteur actif
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
	fenetre = null;
}

// ——— Recommencer la semaine (R, avec confirmation, Q38) ———
function confirmerReset() {
	fenetre = null;
	enPause = false;
	Sauvegarde.effacer(Sauvegarde.semaineCourante()); // prompt 33 : le reset efface la sauvegarde de la semaine
	rejouer();
}

// ——— Prompt 33 : reprendre une partie sauvegardée ———
function continuerPartie() {
	const o = Sauvegarde.lister()[0];
	if (o) Sauvegarde.reprendre(o);
}
function reprendreSemaineChoisie() {
	const o = optionsAccueil()[choixAccueil];
	fenetre = null;
	if (o && o.sauvegarde) Sauvegarde.reprendre(o.sauvegarde);
}
function fenetreReprise() {
	const o = optionsAccueil()[choixAccueil];
	if (!o || !o.sauvegarde) return fermer();
	const l = 860;
	const h = 340;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	textAlign(CENTER, TOP);
	noStroke();
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(36);
	text(t('reprise.titre'), L / 2, y + 44);
	textStyle(NORMAL);
	textSize(22);
	fill(C.gris);
	text(t('reprise.texte', { n: o.sauvegarde.etat.dossierIndex + 1, total: o.sauvegarde.etat.complet.paquet.length }), x + 48, y + 104, l - 96, 80);
	const lb = (l - 128) / 3;
	bouton(x + 48, y + h - 112, lb, 72, t('reprise.reprendre'), reprendreSemaineChoisie);
	bouton(x + 64 + lb, y + h - 112, lb, 72, t('reprise.nouvelle'), lancerNouvellePartie, false, true);
	bouton(x + 80 + 2 * lb, y + h - 112, lb, 72, t('reprise.annuler'), fermer, false, true);
}

// =====================================================================
// Écran de jeu (Q1–Q10, Q29, Q30, Q45)
// =====================================================================
const GAUCHE = { x: 40, y: 40, l: 1160, h: 1000 };
const CARTE = { x: 60, y: 110, l: 760, h: 910 };
const LISTE = { x: 840, y: 110, l: 340, h: 910 };
const DROITE = { x: 1230, y: 40, l: 650, h: 1000 };

function dossierCourant() {
	return Jeu.dossierCourant ? Jeu.dossierCourant() : null;
}

/** Prompt 33 : indicateur discret « Partie sauvegardée à hh:mm », en bas à droite de l'écran du jeu */
function indicateurSauvegarde() {
	const s = Sauvegarde.texteIndicateur();
	if (!s) return;
	textFont(POLICE_DONNEES);
	textSize(16);
	textAlign(RIGHT, BOTTOM);
	noStroke();
	fill(C.gris);
	text(s, L - 44, H - 14);
}

function dessinerJeu() {
	if (phase === 'fin') return RAPPORT ? dessinerEcranRapportImprime() : dessinerFin(); // prompt 41
	if (phase === 'attente' || phase === 'reveil' || phase === 'mail' || phase === 'soir') return dessinerJeuAttente(); // prompt 69 : le soir, l'appli reste consultable
	const d = dossierCourant();
	const meteo = d ? Jeu.meteoDuJour(d.date) : null;

	// Panneau gauche : en-tête, carte, liste des lignes
	panneau(GAUCHE.x, GAUCHE.y, GAUCHE.l, GAUCHE.h);
	textAlign(LEFT, TOP);
	noStroke();
	fill(C.accent);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	ajusterTaille(t('jeu.reseau'), 220, 30);
	text(t('jeu.reseau'), GAUCHE.x + 24, GAUCHE.y + 22);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	ajusterTaille(enteteMode(), 470, 20);
	fill(C.gris);
	text(enteteMode(), GAUCHE.x + 260, GAUCHE.y + 30);
	// Barre d'outils (souris / touch) — équivalents des touches H, M, R
	const bx = GAUCHE.x + GAUCHE.l - 24;
	const outils = [
		[t('jeu.recommencer'), () => ouvrir('reset')],
		[t('accueil.aide'), () => ouvrir('aide')],
	];
	let ox = bx;
	textFont(POLICE_TEXTE);
	outils.forEach(([lib, act]) => {
		textSize(16);
		const w = Math.max(120, textWidth(lib) + 36);
		ox -= w;
		bouton(ox, GAUCHE.y + 18, w, 44, lib, act, false, true);
		ox -= 10;
	});
	if (Jeu.etat.horsLigne) {
		textFont(POLICE_DONNEES);
		textSize(18);
		fill(C.gris);
		textAlign(RIGHT, TOP);
		text(t('jeu.horsLigne'), ox - 10, GAUCHE.y + 30);
	}

	dessinerFileSignalements(CARTE, d); // prompt 73 : plus de carte — la file des signalements
	dessinerBandeauEquipes(); // prompt 68
	dessinerListeLignes(LISTE, d);

	// Panneau droit : jauges, puis selon la phase : signalement en file (prompt 68), conflit, dossier ou narration
	dessinerJauges();
	if (phase === 'selection') dessinerSelection();
	else if (phase === 'narration') dessinerNarration();
	else if (phase === 'conflit') dessinerConflit();
	else dessinerDossier(d, meteo);
}

/* Écran de jeu sans incident actif : carte + liste, horloge simulée à droite ; mail en fin de journée */
function dessinerJeuAttente() {
	const j = Jeu.jourCourant();
	const meteo = j ? Jeu.meteoDuJour(j.date) : null;
	panneau(GAUCHE.x, GAUCHE.y, GAUCHE.l, GAUCHE.h);
	textAlign(LEFT, TOP);
	noStroke();
	fill(C.accent);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	ajusterTaille(t('jeu.reseau'), 220, 30);
	text(t('jeu.reseau'), GAUCHE.x + 24, GAUCHE.y + 22);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	ajusterTaille(enteteMode(), 470, 20);
	fill(C.gris);
	text(enteteMode(), GAUCHE.x + 260, GAUCHE.y + 30);
	dessinerFileSignalements(CARTE, null); // prompt 73 : plus de carte — la file des signalements
	dessinerBandeauEquipes(); // prompt 68
	dessinerListeLignes(LISTE, null);
	dessinerJauges();
	dessinerAttente();
	if (phase === 'mail') dessinerMail();
}

function enteteMode() {
	const e = Jeu.etat;
	if (e.mode === 'direct') return t('mode.direct', { date: new Date(e.horodatage).toLocaleString(localeActive()) });
	const h = heureAffichee();
	const horloge = Jeu.jourCourant() ? ' · ' + dateLongue(Jeu.jourCourant().date) + ' · ' + String(h.h).padStart(2, '0') + ':' + String(h.m).padStart(2, '0') : '';
	if (e.semaine) return t('niveau.' + (e.semaine.difficulte ? e.semaine.difficulte.niveau : 'semaine')) + horloge;
	if (e.mode === 'hors ligne') return t('mode.horsLigne') + horloge;
	return '';
}

// ——— Décor en couches : eau (1), relief léger des quais (2), météo du jour (Q8, Q30) ———
// Prompt 73 : la carte géographique est supprimée de l'écran de jeu (la source ne donne aucune
// géométrie de ligne) — plus de zoom ni de déplacement : rien à conserver ici.

function dessinerDecor(zone, meteo, opacite, avecCadre, sansLegende) {
	projection = projeter(zone); // fonds d'ambiance uniquement (accueil, fin) — jamais l'écran de jeu
	push();
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(zone.x, zone.y, zone.l, zone.h);
	drawingContext.clip();

	if (avecCadre) {
		noStroke();
		fill(C.fond);
		rect(zone.x, zone.y, zone.l, zone.h, 8);
	}
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
	// Lignes en filigrane sur l'accueil
	if (!avecCadre && Jeu.lignes) {
		noFill();
		for (const l of Jeu.lignes.lignes) {
			stroke(28, 39, 51, l.type === 0 ? 70 * opacite : 30 * opacite);
			strokeWeight(l.type === 0 ? 3 : 1.2);
			l.traces.forEach(tracer);
		}
	}
	if (!avecCadre) dessinerMeteo(zone, meteo, opacite, sansLegende, false); // prompt 49 : plus aucune météo sur la carte de l'appli (ni pictos, ni ligne chiffrée)
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
/** Soleil, nuages, pluie et vent dessinés (fonds d'ambiance : accueil, fin) — plus sur la carte de l'appli */
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

// ——— Liste des lignes : alertes d'abord, puis retard décroissant (Q45) ———
// Prompt 73 : plus de carte associée ; un clic sur une ligne met en surbrillance ses signalements dans la file
function dessinerListeLignes(zone, dActuel) {
	const parLigne = new Map();
	(Jeu.etat.dossiers || []).forEach((d, i) => {
		if (!dossierConnu(i)) return; // prompt 50 : pas de lignes révélées d'avance
		(d.lignes || []).forEach((n) => {
			const prev = parLigne.get(n) || { nom: n, alerte: false, retard: null };
			prev.alerte = prev.alerte || d.type !== 'ligne en difficulté' || i === Jeu.index;
			if (d.retard !== null && (prev.retard === null || d.retard > prev.retard)) prev.retard = d.retard;
			parLigne.set(n, prev);
		});
	});
	const actives = new Set((dActuel && dossierConnu(Jeu.index) && dActuel.lignes) || []);
	const items = Array.from(parLigne.values()).sort(
		(a, b) => (actives.has(b.nom) - actives.has(a.nom)) || (b.alerte - a.alerte) || ((b.retard || 0) - (a.retard || 0)),
	);

	noStroke();
	fill(C.fond);
	rect(zone.x, zone.y, zone.l, zone.h, 8);
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(22);
	fill(C.texte);
	text(t('lignes.titre'), zone.x + 18, zone.y + 16);
	textStyle(NORMAL);
	// Prompt 73 : légende repliable ; un clic sur une ligne met en surbrillance ses signalements dans la file
	bouton(zone.x + zone.l - 74, zone.y + 10, 56, 36, SELECTION.legendeRepliee ? '▸' : '▾', () => (SELECTION.legendeRepliee = !SELECTION.legendeRepliee), false, true);
	textAlign(LEFT, TOP); // bouton() laisse un alignement centré
	let y = zone.y + 58;
	if (SELECTION.legendeRepliee) items.length = 0;
	if (!items.length && !SELECTION.legendeRepliee) {
		textSize(18);
		textLeading(26);
		fill(C.gris);
		// Prompt 50 : tant que la carte n'est pas consultée, aucune ligne n'est connue
		const dC = Jeu.dossierCourant ? Jeu.dossierCourant() : null;
		const semaineSansLigne = !(Jeu.paquet || []).some((x) => x.lignes && x.lignes.length);
		const cache = !semaineSansLigne || (dC && dC.lignes && dC.lignes.length && !dossierConnu(Jeu.index));
		text(t(cache ? 'lignes.aConsulter' : 'lignes.aucune').replace(/\n/g, ' '), zone.x + 18, y, zone.l - 36, 220);
		y += 230;
	}
	for (const it of items.slice(0, Jeu.objectifDuJour ? 10 : 14)) {
		const actif = actives.has(it.nom);
		const couleur = actif ? C.rouge : C.orange;
		fill(couleur);
		rect(zone.x + 18, y + 6, 10, 30, 3);
		fill(C.texte);
		textFont(POLICE_DONNEES);
		textSize(24);
		text(it.nom, zone.x + 40, y + 6);
		textSize(18);
		fill(actif ? C.rouge : C.gris);
		text(actif ? t('lignes.actif') : it.retard !== null ? '+' + it.retard + ' min' : t('lignes.perturbation'), zone.x + 140, y + 12);
		if (SELECTION.surbrillance === it.nom) {
			noFill();
			stroke('#ffffff');
			strokeWeight(2);
			rect(zone.x + 10, y, zone.l - 20, 44);
			noStroke();
		}
		const nom = it.nom;
		boutons.push({ x: zone.x + 10, y, l: zone.l - 20, h: 44, action: () => (SELECTION.surbrillance = SELECTION.surbrillance === nom ? null : nom) });
		y += 52;
	}
	// Bandeau tactique (prompt 23) : objectif du jour et modificateur actif
	if (Jeu.objectifDuJour) {
		const o = Jeu.objectifDuJour();
		const mod = Jeu.modificateurActif() ? Jeu.modificateur : null;
		const by = zone.y + zone.h - 250;
		fill(mod ? C.orange : C.accent);
		rect(zone.x + 18, by, zone.l - 36, 4);
		textFont(POLICE_TEXTE);
		textSize(14);
		fill(C.texte);
		textLeading(25);
		text(t('bandeau.objectif', { libelle: o.libelle, v: Jeu.jauges[o.jauge] }), zone.x + 18, by + 12, zone.l - 36, 78);
		fill(mod ? C.orange : C.gris);
		text(mod ? mod.libelle + (mod.actionBloquee ? t('bandeau.bloquee', { action: Jeu.REGLAGES.effets[mod.actionBloquee].nom }) : '') + ' · ' + Math.ceil((mod.fin - millis()) / 1000) + ' s' : t('bandeau.aucunMod'), zone.x + 18, by + 92, zone.l - 36, 50);
	}
	// Légende
	const ly = zone.y + zone.h - 120;
	textFont(POLICE_DONNEES);
	textSize(16);
	[
		[C.vert, t('legende.heure')],
		[C.orange, t('legende.retard')],
		[C.rouge, t('legende.actif') + (reduireAnimations ? '' : t('legende.clignote'))],
	].forEach(([c, lib], i) => {
		stroke(c);
		strokeWeight(6);
		line(zone.x + 18, ly + i * 32 + 10, zone.x + 58, ly + i * 32 + 10);
		noStroke();
		fill(C.texte);
		text(lib, zone.x + 70, ly + i * 32);
	});
}

// ——— Jauges : 3 barres horizontales compactes en bandeau (Q7) ———
function dessinerJauges() {
	const z = { x: DROITE.x, y: DROITE.y, l: DROITE.l, h: 110 };
	panneau(z.x, z.y, z.l, z.h);
	cibleGuide('jauges', z.x, z.y, z.l, z.h); // prompt 37
	const jauges = Jeu.jauges || { fluidite: 50, reputation: 50, budget: 50 }; // départ 50 (Q40)
	const aff = jaugesAffichees(); // prompt 53 : barres qui glissent vers leur nouvelle valeur
	const defs = [
		[t('jaugeTitre.fluidite'), jauges.fluidite, 'fluidite'],
		[t('jaugeTitre.reputation'), jauges.reputation, 'reputation'],
		[t('jaugeTitre.budget'), jauges.budget, 'budget'],
	];
	const lb = (z.l - 48 - 2 * 20) / 3;
	defs.forEach(([nom, v, cle], i) => {
		const x = z.x + 24 + i * (lb + 20);
		textAlign(LEFT, TOP);
		noStroke();
		textFont(POLICE_TEXTE);
		textSize(18);
		fill(C.texte);
		text(nom, x, z.y + 18);
		textFont(POLICE_DONNEES);
		textAlign(RIGHT, TOP);
		text(Math.round(v), x + lb, z.y + 18);
		fill(C.piste);
		rect(x, z.y + 56, lb, 22, 4);
		// Jauge < 20 (Q46) : pulsation douce en opacité (prompt 53), fixe si animations réduites
		const va = aff[cle];
		const critique = va < 20;
		const c = color(critique ? C.rougeFonce : va < 40 ? C.orange : C.vert);
		if (critique) c.setAlpha(255 * opaciteCritique());
		fill(c);
		rect(x, z.y + 56, (lb * constrain(va, 0, 100)) / 100, 22, 4);
		// Prompt 43 : repères des seuils réels (20 critique, 40 orange) sur chaque jauge
		fill(255, 255, 255, 170);
		[20, 40].forEach((s) => rect(x + (lb * s) / 100 - 1, z.y + 52, 2, 30));
		dessinerDeltasJauge(cle, x, z.y + 56, lb); // prompt 53 : delta réel qui flotte puis s'efface
	});
}

// ——— Dossier courant : ligne + retard + raison en priorité (Q5), glissement depuis la droite (Q10) ———
function dessinerDossier(d, meteo) {
	const base = { x: DROITE.x, y: DROITE.y + 130, l: DROITE.l, h: DROITE.h - 130 };
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

	// Compteur : barre horizontale qui se vide (Q6) — durée selon la semaine (Q16, Q55)
	figerCompteurRalenti(); // prompt 55 : pendant le ralenti, le compteur ne descend pas
	const duree = ((Jeu.etat.semaine && Jeu.etat.semaine.difficulte && Jeu.etat.semaine.difficulte.compteur_s) || 30) * 1000 * facteurDuree * facteurLecture(); // prompt 48 : lecture facile ×1,5
	const reste = constrain(1 - (millis() - debutCompteur) / duree, 0, 1);
	// Prompt 44 § 3 : tic-tac sous les 10 dernières secondes, qui s'accélère (1 s → 0,5 s → 0,25 s)
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
	rect(x + 24, base.y + 22, base.l - 48, 14, 7);
	fill(couleurCompteur(resteMs)); // prompt 53 : sous 10 s, rouge qui pulse doucement
	rect(x + 24, base.y + 22, (base.l - 48) * reste, 14, 7);
	textFont(POLICE_DONNEES);
	textSize(16);
	textAlign(RIGHT, TOP);
	fill(C.gris);
	text(Math.ceil((reste * duree) / 1000) + ' s', x + base.l - 24, base.y + 42);
	dessinerRalenti(x, base); // prompt 55 : bouton « Ralenti (R) » ou « Pause — 7 s »
	if (reste * duree < 5000 && reste > 0 && !alerteTempsJouee && (phase === 'decision' || phase === 'contradiction')) {
		alerteTempsJouee = true;
		Confort.Son.bip('alerte'); // plus que 5 secondes
	}
	// Compteur à 0 : « ne rien faire » avec les seules conséquences naturelles du dossier (Q25)
	if (reste === 0 && tA === 1 && (phase === 'decision' || phase === 'contradiction')) {
		phase = 'decision';
		decider('temps');
		Confort.Son.bip('consequence'); // prompt 30 : compteur à 0
		return;
	}

	// En-tête du dossier
	textAlign(LEFT, TOP);
	text(t('dossier.entete', { n: Jeu.index + 1, total: Jeu.paquet.length, type: tSi('type.' + d.type, d.type).toUpperCase(), affluence: '' }), x + 32, base.y + 42); // prompt 50 : l'affluence se découvre dans l'agenda (gravité : panneau de sélection et file, prompt 68)

	// Prompt 50 : signalement vague, faits révélés source par source (enquete.js)
	dessinerEnquete(d, x, base);

	const ab = (base.l - 64 - 16) / 2;
	if (phase === 'contradiction') {
		// Contradiction (Q9, Q31) : choisir d'abord la source à croire
		const c = d.contradiction;
		fill(C.orange);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(22);
		text(c.question, x + 32, base.y + base.h - 250, base.l - 64, 40);
		textStyle(NORMAL);
		[
			['A', c.a.libelle, 'a'],
			['B', c.b.libelle, 'b'],
		].forEach(([tA, lib, cle], i) => {
			const by = base.y + base.h - 200 + i * 88;
			bouton(x + 32, by, base.l - 64, 72, tA + '  ' + lib, () => choisirSource(cle), false, true);
		});
		return;
	}
	// Prompt 72 : une alerte (météo, secours, affluence) propose des réponses rédigées pour la
	// situation réelle, à la place des simples « 1 / 2 / 3 / 0 » (les touches continuent de fonctionner)
	const reponses = estAlerte(d) ? reponsesAlerte(d) : [];
	if (reponses.length) {
		if (sourceChoisie && d.contradiction) {
			textFont(POLICE_DONNEES);
			textSize(16);
			fill(C.gris);
			text(t('dossier.sourceRetenue', { libelle: d.contradiction[sourceChoisie].libelle }), x + 32, base.y + base.h - 260 - reponses.length * 88, base.l - 64, 30);
		}
		const bh = 76;
		const y0 = base.y + base.h - 24 - reponses.length * (bh + 12);
		reponses.forEach((r, i) => {
			const by = y0 + i * (bh + 12);
			const lib = t(r.cle, r.vars);
			const focusRep = focusReponseAlerte === i;
			bouton(x + 32, by, base.l - 64, bh, lib, () => activerReponseAlerte(r), false, r.vers.type === 'equipe');
			if (focusRep) {
				noFill();
				stroke(C.accent);
				strokeWeight(3);
				rect(x + 32 - 6, by - 6, base.l - 64 + 12, bh + 12);
				noStroke();
			}
		});
		cibleGuide('actions', x + 32, y0, base.l - 64, reponses.length * (bh + 12)); // prompt 37
		return;
	}
	// Actions : 3 actions + « ne rien faire » (Q5)
	const actions = [
		['1', t('action.devier'), 'devier'],
		['2', t('action.retenir'), 'retenir'],
		['3', t('action.renfort'), 'renfort'],
		['0', t('action.rien'), 'rien'],
	];
	if (sourceChoisie && d.contradiction) {
		textFont(POLICE_DONNEES);
		textSize(16);
		fill(C.gris);
		text(t('dossier.sourceRetenue', { libelle: d.contradiction[sourceChoisie].libelle }), x + 32, base.y + base.h - 236, base.l - 64, 30);
	} // prompt 50 : plus de conseil — le joueur enquête lui-même
	const bloquee = Jeu.actionBloquee ? Jeu.actionBloquee() : null;
	actions.forEach(([touche, nom, cle], i) => {
		const bx = x + 32 + (i % 2) * (ab + 16);
		const by = base.y + base.h - 200 + Math.floor(i / 2) * 88;
		bouton(bx, by, ab, 72, touche + '  ' + nom + (cle === bloquee ? t('dossier.indispo') : ''), () => decider(cle), cle === bloquee, i === 3);
		// Prompt 50 : plus de flèches d'effet sous les boutons — les effets s'apprennent en jouant (journal, mail, rapport)
	});
	cibleGuide('actions', x + 32, base.y + base.h - 200, base.l - 64, 160); // prompt 37
}

function choisirSource(cle) {
	if (phase !== 'contradiction') return;
	sourceChoisie = cle;
	phase = 'decision';
}

// ——— Conflit de deux lignes (Q27) : choix binaire explicite ———
function dessinerConflit() {
	const z = { x: DROITE.x, y: DROITE.y + 130, l: DROITE.l, h: DROITE.h - 130 };
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
	Jeu.choisirPriorite(cle);
	phase = Jeu.dossierCourant().contradiction ? 'contradiction' : 'decision';
	debutCompteur = millis();
}

// ——— Narration entre deux décisions (06-narration, Q17) ———
function dessinerNarration() {
	const z = { x: DROITE.x, y: DROITE.y + 130, l: DROITE.l, h: DROITE.h - 130 };
	const r = dernierResultat;
	const couleurTon = { neutre: C.accent, tendu: C.orange, critique: C.rouge }[r.narration.ton];
	panneau(z.x, z.y, z.l, z.h, couleurTon);
	textAlign(LEFT, TOP);
	noStroke();
	fill(couleurTon);
	textFont(POLICE_DONNEES);
	textSize(18);
	text(t('narration.entete', { ton: t('ton.nom.' + r.narration.ton) }), z.x + 32, z.y + 32);
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(34);
	text(r.narration.titre, z.x + 32, z.y + 70, z.l - 64, 100);
	textStyle(NORMAL);
	textSize(26);
	text(r.narration.texte, z.x + 32, z.y + 190, z.l - 64, 260);
	// Prompt 74 : court texte de liaison varié vers le dossier suivant (données réelles, graine)
	const dSuivant = (Jeu.paquet || [])[Jeu.index];
	const liaison = dSuivant ? texteLiaison(dSuivant) : '';
	if (liaison) {
		textFont(POLICE_DONNEES);
		textSize(18);
		fill(C.gris);
		text(liaison, z.x + 32, z.y + 440, z.l - 64, 30);
	}

	// Détail des effets : base + 1d6 et contexte (lisible pour la soutenance)
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(C.gris);
	const noms = [t('jaugeTitre.fluidite'), t('jaugeTitre.reputation'), t('jaugeTitre.budget')];
	r.deltas.forEach((v, i) => {
		const de = r.des[i] ? t('narration.de', { d: r.des[i] }) : '';
		fill(v > 0 ? C.vert : v < 0 ? C.rouge : C.gris);
		text(noms[i].padEnd(13, ' ') + (v > 0 ? '+' : '') + v + de, z.x + 32, z.y + 470 + i * 30);
	});
	const ctx = [r.contexte.meteo && t('ctx.meteo'), r.contexte.pointe && t('ctx.pointe'), r.contexte.affluence && t('ctx.affluence')].filter(Boolean);
	fill(C.gris);
	if (ctx.length) text(t('narration.contexte', { liste: ctx.join(', ') }), z.x + 32, z.y + 570);

	// Suite automatique, ou Entrée / clic
	const tA = constrain((millis() - debutNarration) / DUREE_NARRATION, 0, 1);
	fill(C.piste);
	rect(z.x + 32, z.y + z.h - 140, z.l - 64, 6, 3);
	fill(couleurTon);
	rect(z.x + 32, z.y + z.h - 140, (z.l - 64) * tA, 6, 3);
	const lb = (z.l - 64 - 16) * 0.68;
	bouton(z.x + 32, z.y + z.h - 112, lb, 72, t(Jeu.terminee ? 'narration.bilan' : 'narration.suivant'), continuer);
	bouton(z.x + 48 + lb, z.y + z.h - 112, z.l - 64 - 16 - lb, 72, t(enPause ? 'pause.reprendre' : 'pause.pause'), basculerPause, false, true);
	if (tA >= 1 && !enPause && !fenetre) continuer();
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
	dessinerDecor({ x: 0, y: 0, l: L, h: H }, amb.meteo, b.type === 'mauvaise' ? 0.45 : 0.6, false, true);

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
			bilanFin.record ? t('fin.record') : t('fin.meilleur', { score: bilanFin.meilleur.score, le: bilanFin.meilleur.le }),
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
		textSize(13);
		textLeading(17);
		text(det, g.x + 48, g.y + 808, g.l - 96, 36); // prompt 39 : deux lignes au plus, au-dessus des boutons
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
	const e = Jeu.etat;
	const p = e.mode === 'semaine' ? Jeu.chargerSemaine(e.semaine.lundi) : e.mode === 'direct' ? Jeu.chargerDirect() : Jeu.chargerHorsLigne();
	p.then(() => {
		Jeu.nouvellePartie();
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
		stroke(secondaire ? '#FFFFFF' : C.primaire);
		strokeWeight(2);
		rect(x - 5, y - 5, l + 10, h + 10);
		stroke(C.fond);
		rect(x - 2, y - 2, l + 4, h + 4);
	}
	noStroke();
	fill(desactive ? 'rgba(255,255,255,0.5)' : '#FFFFFF');
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(Math.min(28, h * 0.34));
	while (textSize() > 13 && textWidth(label) > l - 28) textSize(textSize() - 1); // le libellé tient dans le bouton
	textAlign(CENTER, CENTER);
	text(label, x + l / 2, y + h / 2);
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
	if (Sauvegarde.dialogueOuvert || CARNET.ouvert) return; // prompt 33 : clics destinés à la boîte d'import HTML
	if (arreterDemo()) return; // prompt 48
	Confort.Son.demarrer();
	interaction();
	for (let i = boutons.length - 1; i >= 0; i--) {
		const b = boutons[i];
		if (mouseX >= b.x && mouseX <= b.x + b.l && mouseY >= b.y && mouseY <= b.y + b.h) {
			if (vue === 'poste') Confort.Son.clic(); // prompt 30 : clic très discret au poste
			b.action();
			return;
		}
	}
}

function basculerSon() {
	Confort.Reglages.basculer('son');
}

function keyPressed() {
	// Prompt 33 : boîte d'import ouverte (champ texte, fichier) → le clavier lui appartient
	if (Sauvegarde.dialogueOuvert || CARNET.ouvert) return;
	if (arreterDemo()) return false; // prompt 48 : une touche arrête la démo automatique
	if (CINE) return toucheCinematique(), false; // prompt 41
	if (TRANSITION_JOUR && (keyCode === ENTER || keyCode === RETURN || key === ' ' || keyCode === ESCAPE)) return passerTransitionJour(), false; // prompt 43
	Confort.Son.demarrer(); // l'audio ne peut démarrer qu'après un geste du joueur
	interaction();
	// Intro SMS (§ 2) : clic / Entrée pour avancer
	if (smsActif) {
		if (keyCode === ENTER || keyCode === RETURN || key === ' ') avancerConversation(); // prompt 42
		return false;
	}
	// Réveil (§ 4) : barre d'espace ; prompt 78 : réveille aussi d'une sieste volontaire (paupières fermées)
	if (phase === 'reveil' && reveil) {
		if (key === ' ' || keyCode === ENTER || keyCode === RETURN) seReveiller();
		return false;
	}
	if (enSieste && (key === ' ' || keyCode === ENTER || keyCode === RETURN)) return seReveillerVolontaire(), false;
	// Prompt 37 : G arrête le guide « Prendre en main »
	if ((key === 'g' || key === 'G') && GUIDE.actif && !MENU.actif) return arreterGuide(), false;
	// Prompt 34 : le tutoriel capte le clavier (L reste disponible pour changer de langue)
	if (tutoriel && !(key === 'l' || key === 'L')) return toucheTutoriel(), false;
	// Langue (prompt 24) : L bascule partout, sans toucher à la partie
	if (key === 'l' || key === 'L') return Langue.suivante(), false;
	// Prompt 47 : inspection, démission, palmarès ; J = journal de bord, D = rendre son badge
	if (toucheMecaniques() || toucheAccessibilite() || toucheJournee()) return false; // prompts 47, 48 et 51
	// Fenêtres ouvertes : elles captent le clavier
	if (fenetre) {
		if (keyCode === ESCAPE || (fenetre === 'aide' && (key === 'h' || key === 'H' || key === '?'))) return fermer(), false;
		if (fenetre === 'aide' && (key === 't' || key === 'T')) return lancerTutoriel(), false; // prompt 34
		if (fenetre === 'telephone' && (keyCode === ENTER || keyCode === RETURN)) return fermer(), false; // prompt 38
		if (fenetre === 'rapport' && (keyCode === ENTER || keyCode === RETURN)) return actionRapport(), false; // prompt 41
		if (fenetre === 'menu') {
			// Prompt 35 : menu Échap modernisé — ↑ ↓ / Tab pour choisir, Entrée pour valider
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
		if (fenetre === 'reprise') {
			if (keyCode === ENTER || keyCode === RETURN) reprendreSemaineChoisie();
			if (key === 'n' || key === 'N') lancerNouvellePartie();
		}
		if (fenetre === 'parametres') {
			const cles = { 1: 'son', 2: 'horsLigneForce', 3: 'reduireAnimations', 4: 'contrasteRenforce' };
			if (cles[key]) basculerReglage(cles[key]);
			if (key === '8') musiqueSuivante(); // prompt 44
			if (key === '9') return ouvrirAccessibilite(), false; // prompt 48
			if (key === '5') Sauvegarde.exporter(); // prompt 33
			if (key === '6') Sauvegarde.copier();
			if (key === '7') return Sauvegarde.ouvrirImport(), false;
			if (keyCode === ENTER || keyCode === RETURN) fermer();
		}
		return false;
	}
	// Prompt 35 : menu principal (écran titre / choix de la semaine)
	if (MENU.actif) return toucheMenu(), false;
	if (toucheSoir()) return false; // prompt 69 : Entrée / S → sortie du bureau
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
	// Au poste, système du PC (bureau RégulOS) : Tab = icônes, Entrée = ouvrir, Échap = fermer l'app puis se lever
	if (PC.etat !== 'appli') {
		if (keyCode === ESCAPE) PC.fenetre ? fermerFenetreApp() : seLever();
		if (focusQuitter && (keyCode === ENTER || keyCode === RETURN || key === ' ')) return quitterPC(), false; // prompt 26
		if (PC.etat !== 'os') {
			if (keyCode === TAB) basculerFocusQuitter(!focusQuitter);
			return false;
		}
		// Prompt 28 : plainte en attente dans l'app Community — Tab parcourt les réponses, Entrée / 1-2-3 répond
		const plainte = PC.fenetre === 'community' && Jeu.plaintesEnAttente && ecran === 'jeu' ? Jeu.plaintesEnAttente()[0] : null;
		if (plainte && !focusQuitter) {
			const n = plainte.def.reponses.length;
			if (keyCode === TAB) {
				focusReponse = (focusReponse + (keyIsDown(SHIFT) ? n - 1 : 1)) % n;
				annoncer(Jeu.texteMessage(plainte.def.reponses[focusReponse].texte, plainte.vars));
				return false;
			}
			if (keyCode === ENTER || keyCode === RETURN || key === ' ') return repondrePlainte(focusReponse), false;
			if (Number(key) >= 1 && Number(key) <= n) return repondrePlainte(Number(key) - 1), false;
		}
		if (keyCode === TAB) {
			// Prompt 26 : le cycle Tab passe par les icônes puis par le bouton « Quitter le PC »
			const n = ICONES_OS.length;
			const recul = keyIsDown(SHIFT);
			if (focusQuitter) {
				basculerFocusQuitter(false);
				PC.selection = recul ? n - 1 : 0;
			} else if ((!recul && PC.selection === n - 1) || (recul && PC.selection === 0)) basculerFocusQuitter(true);
			else PC.selection = (PC.selection + (recul ? n - 1 : 1)) % n;
			return false;
		}
		if (keyCode === ENTER || keyCode === RETURN || (key === ' ' && !PC.fenetre)) ouvrirIconeOS(PC.selection);
		if (phase === 'mail' && PC.fenetre === null && (keyCode === ENTER || keyCode === RETURN)) return false;
		return false;
	}
	// Au poste : Échap fait se lever (sauf à l'écran de fin)
	if (keyCode === ESCAPE && !(ecran === 'jeu' && phase === 'fin')) return seLever(), false;
	// Prompt 26 : Tab place le focus sur « Quitter le PC » (et l'en retire), Entrée l'active
	if (keyCode === TAB) return basculerFocusQuitter(!focusQuitter), false;
	if (focusQuitter && (keyCode === ENTER || keyCode === RETURN || key === ' ')) return quitterPC(), false;
	if (phase === 'mail' && (keyCode === ENTER || keyCode === RETURN)) return rangerPoste(), false; // prompt 69 : on range le poste, la nuit tombe
	// Touches valables partout
	if (key === 'h' || key === 'H' || key === '?') return ouvrir('aide'), false;
	if (key === 'm' || key === 'M') return toucheMEnfoncee(), false; // prompt 54 : brève = son, maintenue = micro
	if (ecran === 'jeu') {
		// Prompt 55 : pendant un dossier, R = ralenti tactique ; sinon R = recommencer la semaine (Q38)
		if (key === 'r' || key === 'R') return ['decision', 'contradiction', 'conflit'].includes(phase) ? demanderRalentiUI() : ouvrir('reset'), false;
		if (key === 'p' || key === 'P') return basculerPause(), false;
	}
	if (ecran === 'accueil') {
		if (keyCode === ENTER || keyCode === RETURN) ouvrirMenuPrincipal(); // prompt 35 : plus d'accueil dans le PC
	} else if (toucheEquipes()) {
		// prompt 68 : Maj + 1/2/3/4 envoie une équipe sur l'incident
	} else if (phase === 'selection' && (keyCode === TAB || keyCode === UP_ARROW || keyCode === DOWN_ARROW)) {
		// Prompt 77 : Tab / ↑ / ↓ parcourt les signalements actifs (max 3), annoncé en aria-live
		const n = Math.max(1, actifs().length);
		SELECTION.focusActif = (SELECTION.focusActif + (keyCode === TAB && keyIsDown(SHIFT) || keyCode === UP_ARROW ? n - 1 : 1)) % n;
		const it = actifs()[SELECTION.focusActif % n];
		if (it) annoncer(t('enq.signalement.' + it.d.type) + ' · ' + t('gravite.' + Jeu.gravite(it.d)));
		return false;
	} else if (phase === 'selection' && (keyCode === ENTER || keyCode === RETURN || key === ' ')) {
		// Prompt 77 : prendre le signalement actif sélectionné, son compteur démarre
		const a = actifs();
		activerSignalement(a[SELECTION.focusActif % Math.max(1, a.length)].index);
	} else if ((phase === 'decision' || phase === 'contradiction') && toucheEnquete()) {
		// prompt 50 : 5 à 8 consultent une source
	} else if (phase === 'decision') {
		const reps = dossierCourant() && estAlerte(dossierCourant()) ? reponsesAlerte(dossierCourant()) : [];
		if (reps.length && (keyCode === UP_ARROW || keyCode === DOWN_ARROW || keyCode === TAB)) {
			// Prompt 72 : ↑/↓ ou Tab parcourt les réponses proposées, annoncé en aria-live
			focusReponseAlerte = (focusReponseAlerte + (keyCode === UP_ARROW || (keyCode === TAB && keyIsDown(SHIFT)) ? reps.length - 1 : 1)) % reps.length;
			annoncer(t(reps[focusReponseAlerte].cle, reps[focusReponseAlerte].vars));
			return false;
		}
		if (reps.length && (keyCode === ENTER || keyCode === RETURN) && !keyIsDown(SHIFT)) {
			activerReponseAlerte(reps[focusReponseAlerte]);
			return false;
		}
		const actions = { 1: 'devier', 2: 'retenir', 3: 'renfort', 0: 'rien', ' ': 'rien' };
		if (actions[key]) decider(actions[key]);
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
function mouseWheel(event) {
	interaction();
	if (scrollSortiePC(event.delta)) return false; // prompt 73 : plus de zoom de carte à la molette
}

// Prompt 25 : la caméra du bureau ne suit la souris qu'une fois celle-ci réellement bougée sur le canevas
function mouseMoved() {
	sourisDansCanevas = mouseX >= 0 && mouseX <= L && mouseY >= 0 && mouseY <= H;
}

// Touch basique (Q32) : un appui = un clic sur les boutons
function touchStarted(e) {
	if (horsCanevas(e)) return; // prompt 60 : un bouton HTML (avis portrait, boîtes) garde son comportement normal
	if (Sauvegarde.dialogueOuvert || CARNET.ouvert) return;
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
	noStroke();
	fill(13, 12, 12, 190); // prompt 39 : voile = fond du DS
	rect(0, 0, L, H);
}

function dessinerPause() {
	voile();
	const l = 640;
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
	if (fenetre === 'telephone') return fenetreTelephone(); // prompt 42 : le téléphone en main a son propre voile
	if (fenetre === 'cafe') return fenetreCafe(); // prompt 52 : même animation, la tasse en main
	voile();
	if (fenetre === 'rapport') return fenetreRapport(); // prompt 41
	if (fenetre === 'mailFin') return fenetreMailFin(); // prompt 56
	if (fenetre === 'inspection') return fenetreInspection(); // prompt 47
	if (fenetre === 'demission') return fenetreDemission(); // prompt 47
	if (fenetre === 'palmares') return fenetrePalmares(); // prompt 47
	if (fenetre === 'accessibilite') return fenetreAccessibilite(); // prompt 48
	if (fenetre === 'partir') return fenetrePartir(); // prompt 51
	if (fenetre === 'blame') return fenetreBlame(); // prompt 51
	if (fenetre === 'aide') return fenetreAide();
	if (fenetre === 'reset') return fenetreReset();
	if (fenetre === 'parametres') return fenetreParametres();
	if (fenetre === 'reprise') return fenetreReprise();
	if (fenetre === 'menu') return fenetreMenu();
	if (fenetre === 'livre-stress') return fenetreLivreStress();
	if (fenetre === 'telephone') return fenetreTelephone(); // prompt 38
}

function fenetreAide() {
	// Prompt 66 : aide réorganisée — tous les raccourcis lisibles (≥ 18 px), règles de base complètes (jauges,
	// seuils, compteur, dé, score) puis la Carte et les équipes ; malus sous les raccourcis.
	const l = 1720;
	const h = 1040;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	textAlign(LEFT, TOP);
	noStroke();
	fill(C.accent);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(36);
	text(t('aide.titre'), x + 48, y + 30);
	textStyle(NORMAL);
	const raccourcis = [
		[t('aide.k.entreeTouche'), t('aide.k.entree')],
		['5 6 7 8', t('aide.k.sources')],
		['1 / 2 / 3', t('aide.k.actions')],
		[t('aide.k.rienTouche'), t('action.rien')],
		['A / B', t('aide.k.ab')],
		[t('aide.k.majTouche'), t('aide.k.equipes')],
		['R', t('aide.k.reset')],
		['P', t('aide.k.pause')],
		['M', t('aide.k.son')],
		[t('aide.k.aideTouche'), t('aide.k.aide')],
		['T', t('aide.k.tuto')],
		['L', t('aide.k.langue')],
		['Tab', t('aide.k.objets')],
		['← → ↑ ↓', t('aide.k.regarder')],
		[t('aide.k.quitterTouche'), t('aide.k.quitter')],
		['↑ ↓', t('aide.k.semaine')],
	];
	textSize(24);
	fill(C.texte);
	textStyle(BOLD);
	text(t('aide.raccourcis'), x + 48, y + 96);
	textStyle(NORMAL);
	raccourcis.forEach(([k, d], i) => {
		textFont(POLICE_DONNEES);
		ajusterTaille(k, 196, 20);
		fill(C.accent);
		text(k, x + 48, y + 136 + i * 31);
		textFont(POLICE_TEXTE);
		ajusterTaille(d, 580, 20);
		fill(C.texte);
		text(d, x + 260, y + 136 + i * 31);
	});
	// Malus (prompt 23 § 4), sous les raccourcis
	if (Jeu.MALUS) {
		const ym = y + 136 + raccourcis.length * 31 + 18;
		textFont(POLICE_TEXTE);
		textSize(24);
		textStyle(BOLD);
		fill(C.texte);
		text(t('aide.malus'), x + 48, ym);
		Jeu.MALUS.forEach((m, i) => {
			const yy = ym + 38 + i * 50;
			textStyle(BOLD);
			ajusterTaille(String(m.libelle), 780, 18);
			fill(C.rouge);
			text(m.libelle, x + 48, yy);
			textStyle(NORMAL);
			const txt = m.condition + ' → ' + m.consequence;
			ajusterTaille(txt, 790, 18);
			fill(C.gris);
			text(txt, x + 48, yy + 23);
		});
	}
	// Règles (00-concept, 03-actions, 04-jauges) puis la Carte (prompt 68)
	const rx = x + 900;
	const rl = l - (rx - x) - 48;
	textSize(24);
	textStyle(BOLD);
	fill(C.texte);
	text(t('aide.regles'), rx, y + 96);
	textStyle(NORMAL);
	textSize(19);
	textLeading(27);
	text(t('aide.texte'), rx, y + 136, rl, 820);
	textLeading(textSize() * 1.25);
	bouton(x + l - 288, y + h - 92, 240, 60, t('commun.fermer'), fermer);
	bouton(x + l - 288 - 300, y + h - 92, 280, 60, t('tuto.relancer'), lancerTutoriel, false, true); // prompt 34
}

function fenetreReset() {
	const l = 760;
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
function musiqueSuivante() {
	const liste = Confort.Son.musique.pistes();
	const i = liste.indexOf(Confort.Reglages.musique || 'chillin');
	const suivante = liste[(i + 1) % liste.length];
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

function fenetreParametres() {
	const l = 1000;
	const h = 1052; // prompt 33 : + section « Progression » ; prompt 44 : + « Musique » ; prompt 48 : + « Accessibilité »
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	textAlign(LEFT, TOP);
	noStroke();
	fill(C.accent);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(40);
	text(t('param.titre'), x + 48, y + 36);
	textStyle(NORMAL);
	const R = Confort.Reglages;
	const lignes = [
		['1', t('param.son'), 'son'],
		['2', t('param.horsLigne'), 'horsLigneForce'],
		['3', t('param.animations'), 'reduireAnimations'],
		['4', t('param.contraste'), 'contrasteRenforce'],
	];
	lignes.forEach(([k, lib, nom], i) => {
		const ly = y + 120 + i * 96;
		textFont(POLICE_TEXTE);
		ajusterTaille(lib, 490, 26);
		fill(C.texte);
		textAlign(LEFT, CENTER);
		text(lib, x + 48, ly + 36);
		textFont(POLICE_DONNEES);
		textSize(18);
		fill(C.gris);
		text(t('param.touche', { k }), x + 560, ly + 36);
		bouton(x + l - 248, ly + 6, 200, 60, t(R[nom] ? 'commun.oui' : 'commun.non'), () => basculerReglage(nom), false, !R[nom]);
	});
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(16);
	fill(C.gris);
	text(t('param.note'), x + 48, y + h - 104, l - 360, 60);
	// Langue (prompt 24) : même sélecteur qu'à l'accueil, touche L
	textFont(POLICE_TEXTE);
	textSize(26);
	fill(C.texte);
	textAlign(LEFT, CENTER);
	text(t('langue.titre'), x + 48, y + 120 + 4 * 96 + 36);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(C.gris);
	text(t('param.touche', { k: 'L' }), x + 560, y + 120 + 4 * 96 + 36);
	textAlign(LEFT, TOP);
	selecteurLangue(x + l - 48, y + 120 + 4 * 96 + 10);
	// Prompt 44 : choix de la musique (morceaux originaux, chiptune), touche 8
	const ym = y + 120 + 5 * 96;
	textFont(POLICE_TEXTE);
	textSize(26);
	fill(C.texte);
	textAlign(LEFT, CENTER);
	text(t('param.musique'), x + 48, ym + 36);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(C.gris);
	text(t('param.touche', { k: '8' }), x + 560, ym + 36);
	bouton(x + l - 48 - 280, ym + 8, 280, 56, '♪ ' + t('musique.' + (Confort.Reglages.musique || 'chillin')), musiqueSuivante, false, true);
	textFont(POLICE_DONNEES);
	textSize(14);
	fill(C.gris);
	textAlign(LEFT, TOP);
	text(t('param.musiqueCredits'), x + 48, ym + 70, 640, 24); // crédits des morceaux CC0
	// Prompt 33 : Progression — exporter (fichier), copier (presse-papiers), importer (fichier ou texte collé)
	const yp = y + 120 + 6 * 96;
	textFont(POLICE_TEXTE);
	textSize(26);
	fill(C.texte);
	textAlign(LEFT, CENTER);
	text(t('parametres.progression'), x + 48, yp + 36);
	const lbp = 200;
	bouton(x + l - 48 - 3 * lbp - 32, yp + 8, lbp, 56, t('parametres.exporter'), () => Sauvegarde.exporter(), false, true);
	bouton(x + l - 48 - 2 * lbp - 16, yp + 8, lbp, 56, t('parametres.copier'), () => Sauvegarde.copier(), false, true);
	bouton(x + l - 48 - lbp, yp + 8, lbp, 56, t('parametres.importer'), () => Sauvegarde.ouvrirImport(), false, true);
	// Prompt 48 : accessibilité (daltonisme, taille du texte, lecture facile) et reprise sur un autre appareil
	const ya = yp + 96;
	textFont(POLICE_TEXTE);
	textSize(26);
	fill(C.texte);
	textAlign(LEFT, CENTER);
	text(t('acc.titre'), x + 48, ya + 36);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(C.gris);
	text(t('param.touche', { k: '9' }), x + 560, ya + 36);
	bouton(x + l - 48 - 280, ya + 8, 280, 56, t('acc.ouvrir'), ouvrirAccessibilite, false, true);
	textAlign(LEFT, TOP);
	bouton(x + l - 288, y + h - 104, 240, 64, t('param.retour'), fermer);
}

/** Sélecteur de langue (prompt 24) : un bouton par entrée de LANGUES, aligné à droite sur xDroite ; touche L partout */
function selecteurLangue(xDroite, y) {
	const lb = 84;
	LANGUES.forEach((lg, i) => {
		const x = xDroite - (LANGUES.length - i) * (lb + 8);
		bouton(x, y, lb, 52, lg.code.toUpperCase(), () => Langue.changer(lg.code), false, lg.code !== Langue.actuelle);
	});
}
