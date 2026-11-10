/* Nantes en régulation — boucle p5 et écrans (Q41 : sketch.js = affichage, game.js = logique).
 * Prompt 16 : écran d'accueil + salle de contrôle 1920×1080. La logique des décisions (effets,
 * jauges, narration, fins) arrive aux prompts 17 à 19 : ici les actions ne font que passer au dossier suivant.
 * Direction artistique : jeu/11-direction-artistique.md (palette, polices, décor en couches).
 */
const L = 1920;
const H = 1080;

// ——— Palette (11-direction-artistique) ———
const C = {
	fond: '#F5EFE3',
	panneau: '#FFFDF7',
	texte: '#1C2733',
	accent: '#0E3B46',
	vert: '#1E7A3C',
	orange: '#B45309',
	rouge: '#B3261E',
	gris: '#6B7280',
	eau: '#CFE0E3',
	eauBord: '#B5CDD2',
	ombre: 'rgba(28,39,51,0.10)',
};
// Polices : Inter / IBM Plex Mono si installées, sinon une police système équivalente (aucun téléchargement).
// p5 entoure le nom de guillemets : on lui passe donc UN seul nom, celui de la première police réellement installée.
function policeInstallee(candidats, generique) {
	const ctx = document.createElement('canvas').getContext('2d');
	const mesure = (f) => ((ctx.font = '72px ' + f), ctx.measureText('mmmmmmmmmmlli 0123456789').width);
	const ref = mesure(generique);
	return candidats.find((n) => mesure('"' + n + '", ' + generique) !== ref) || candidats[candidats.length - 1];
}
const POLICE_TEXTE = policeInstallee(['Inter', 'Helvetica Neue', 'Segoe UI', 'Roboto', 'Arial'], 'monospace');
const POLICE_DONNEES = policeInstallee(['IBM Plex Mono', 'Menlo', 'Consolas', 'DejaVu Sans Mono', 'Courier New'], 'serif');

const reduireAnimationsSysteme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let reduireAnimations = reduireAnimationsSysteme;
const GRIS_NORMAL = '#6B7280';

/* Applique les réglages enregistrés (écran Paramètres) */
function appliquerReglages() {
	const R = Confort.Reglages;
	reduireAnimations = reduireAnimationsSysteme || R.reduireAnimations;
	C.gris = R.contrasteRenforce ? '#374151' : GRIS_NORMAL; // gris secondaire plus foncé : contraste renforcé
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
	for (let i = 0; i < 140; i++) gouttes.push({ x: random(), y: random(), v: random(0.6, 1.2) });
	setupBureau();
	demarrerLoire(); // prompt 34 : hauteur de la Loire (Hub'Eau) dans setup() + setInterval, jamais dans draw()
	appliquerReglages();
	if (Confort.Reglages.horsLigneForce) Jeu.enLigne = false; // mode hors ligne forcé (Paramètres)
	else Jeu.verifierConnexion(); // indicateur « mode hors ligne » + météo du jour pour le décor de l'accueil
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
	Confort.Son.ambiances.regler({ pluie: !!(m && m.pluie_mm >= 1), nuit: h < 7 || h >= 20, actif: PC.etat !== 'eteint' || ecran === 'jeu' });
}

function draw() {
	if (!chargementMasque) masquerChargement();
	majAmbianceSonore();
	// Prompt 35 : menu principal plein écran avant le bureau ; il se ferme dès qu'une partie démarre ou reprend
	if (MENU.actif && ecran === 'jeu') fermerMenuPrincipal();
	if (MENU.actif) {
		boutons = [];
		dessinerMenuPrincipal();
		if (fenetre) {
			boutons = [];
			dessinerFenetre();
		}
		dessinerTutoriel();
		majCurseur();
		return;
	}
	avancerTemps(); // horloge simulée, sieste, arrivée des incidents, fin de journée (immersion.js)
	if (Jeu.equipes) Jeu.majEquipes(millis()); // équipes envoyées depuis la carte (prompt 22)
	boutons = [];
	// 1. Contenu de l'écran du PC, en 1920×1080 : l'appli de régulation, ou le système (démarrage, bureau)
	ciblesGuide = {}; // prompt 37 : cibles des flèches, relevées pendant le dessin
	espaceDessin = 'pc';
	sourisVersEcran();
	background(C.fond);
	if (PC.etat === 'appli') {
		if (ecran === 'accueil') dessinerAppliSansPartie(); // prompt 35 : l'accueil est sorti du PC (menu principal)
		else {
			dessinerJeu();
			indicateurSauvegarde(); // prompt 33
		}
		if (enPause) dessinerPause();
		dessinerFermerAppli();
	} else dessinerOS();
	dessinerIndicateurs(); // prompt 36 : app flottante, au premier plan
	sourisRestaurer();
	espaceDessin = 'ecran';
	// 2. La pièce et le moniteur autour (bureau, zoom, ou « au poste » avec la pièce visible)
	composerVue();
	if (phase === 'reveil' && reveil && ecran === 'jeu' && !smsActif) {
		boutons = [];
		dessinerReveil();
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

// =====================================================================
// Écran d'accueil (Q34, Q56, Q14, Q16, Q55)
// =====================================================================
function dessinerAccueil() {
	// Décor identique au jeu, en grand et atténué, avec la météo du moment si disponible
	dessinerDecor({ x: 0, y: 0, l: L, h: H }, Jeu.meteoActuelle, 0.55, false);

	// Titre
	noStroke();
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textAlign(CENTER, TOP);
	textSize(88);
	text(t('accueil.titre'), L / 2, 90);
	textStyle(NORMAL);
	textSize(28);
	fill(C.accent);
	text(t('accueil.sousTitre'), L / 2, 200);

	// Liste des semaines
	const opts = optionsAccueil();
	const lp = 900;
	const x0 = (L - lp) / 2;
	let y = 262;
	opts.forEach((o, i) => {
		const sel = i === choixAccueil;
		const h = 124;
		panneau(x0, y, lp, h, sel ? C.accent : null);
		textAlign(LEFT, TOP);
		fill(o.desactive ? C.gris : sel ? C.accent : C.texte);
		textFont(POLICE_TEXTE);
		textStyle(sel ? BOLD : NORMAL);
		textSize(30);
		text(o.titre, x0 + 32, y + 20);
		textStyle(NORMAL);
		textFont(POLICE_DONNEES);
		textSize(22);
		fill(o.desactive ? C.gris : sel ? C.accent : C.texte);
		text(o.detail, x0 + 32, y + 62);
		fill(C.gris);
		textSize(18);
		text(o.info, x0 + 32, y + 92);
		if (o.sauvegarde) {
			// Prompt 33 : badge « sauvegardée » en haut à droite de la carte de la semaine
			textAlign(RIGHT, TOP);
			fill(C.accent);
			text(t('accueil.sauvegardee', { n: o.sauvegarde.etat.dossierIndex + 1, total: o.sauvegarde.etat.complet.paquet.length }), x0 + lp - 24, y + 66);
			textAlign(LEFT, TOP);
		}
		boutons.push({ x: x0, y, l: lp, h, action: () => (choixAccueil = i) });
		y += h + 14;
	});

	// Prompt 33 : « Continuer la partie » (sauvegarde la plus récente), visible seulement s'il y en a une
	const recente = Sauvegarde.lister()[0];
	if (recente) {
		bouton(80, 262, 380, 76, t('accueil.continuer'), continuerPartie);
		textFont(POLICE_DONNEES);
		textSize(17);
		fill(C.texte);
		textAlign(LEFT, TOP);
		const d = new Date(recente.sauvegardeLe);
		text(
			t('accueil.continuerDetail', {
				semaine: Sauvegarde.libelleSemaine(recente.semaine),
				n: recente.etat.dossierIndex + 1,
				total: recente.etat.complet.paquet.length,
				heure: String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'),
			}),
			80,
			350,
			380,
			80,
		);
	}

	// Bouton Jouer
	const bl = 320;
	bouton((L - bl) / 2, y + 24, bl, 76, t('accueil.jouer'), lancerPartie, opts[choixAccueil] && opts[choixAccueil].desactive);
	bouton((L - bl) / 2 - 260, y + 34, 220, 56, t('accueil.parametres'), () => ouvrir('parametres'), false, true);
	selecteurLangue(L - 80, 40);
	bouton((L + bl) / 2 + 40, y + 34, 220, 56, t('accueil.aide'), () => ouvrir('aide'), false, true);

	// Indicateur « mode hors ligne » (Q34) : discret, gris, monospace
	textFont(POLICE_DONNEES);
	textSize(20);
	textAlign(CENTER, BOTTOM);
	fill(C.gris);
	const statut = Jeu.enLigne === null ? t('accueil.verif') : Jeu.enLigne ? '' : t(Confort.Reglages.horsLigneForce ? 'accueil.horsLigneForce' : 'accueil.horsLigne');
	text(statut, L / 2, H - 70);
	textSize(16);
	text(t('accueil.pied'), L / 2, H - 36);
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
	p.then(() => {
		Jeu.nouvellePartie();
		demarrerJournee(); // journée 1, 6h00, en attente du premier incident
		if (!introVue) lancerIntroSMS(); // § 2 : une seule fois, pas sur « Rejouer »
		else if (!tutorielVu() && !optionGuide()) lancerTutoriel(); // prompt 34 (pas si le guide « Prendre en main » est choisi)
	});
}

let facteurDuree = 1; // prompt 23 : heure de pointe → compteur ×0,8
function nouveauDossier() {
	if (Jeu.demarrerModificateur) Jeu.demarrerModificateur(millis());
	facteurDuree = Jeu.modificateurActif && Jeu.modificateurActif(millis()) === 'heure_pointe' ? 0.8 : 1;
	arriveeDossier = millis();
	debutCompteur = millis();
	sourceChoisie = null;
	alerteTempsJouee = false;
	if (!Jeu.dossierCourant()) return apresDecision();
	if (Jeu.declencherPlainte) Jeu.declencherPlainte(Jeu.index); // prompt 28 : plainte liée au dossier réel (app Community)
	Confort.Son.bip('incident'); // prompt 30 : signal d'arrivée d'incident (timbre distinct)
	if (Jeu.conflit()) phase = 'conflit';
	else if (Jeu.dossierCourant().contradiction) phase = 'contradiction';
	else phase = 'decision';
}

/* Décision du joueur (ou compteur à 0 → 'temps', Q25) */
function decider(action) {
	if (phase !== 'decision' && !(action === 'temps' && phase === 'contradiction')) return;
	if (Jeu.actionBloquee && action === Jeu.actionBloquee()) return; // erreur système : action indisponible
	dernierResultat = Jeu.decider(action, sourceChoisie);
	if (!dernierResultat) return;
	annoncer(t('annonce.decision', { titre: dernierResultat.narration.titre, texte: dernierResultat.narration.texte }));
	Confort.Son.bip(action === 'temps' ? 'alerte' : 'action');
	phase = 'narration';
	debutNarration = millis();
	Sauvegarde.auto(false); // prompt 33 : après chaque décision (l'annonce de la décision n'est pas écrasée)
}

function continuer() {
	if (phase === 'narration' && !enPause) apresDecision(); // retour à la surveillance (immersion.js)
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
	if (phase === 'fin') return dessinerFin();
	if (phase === 'attente' || phase === 'reveil' || phase === 'mail') return dessinerJeuAttente();
	const d = dossierCourant();
	const meteo = d ? Jeu.meteoDuJour(d.date) : null;

	// Panneau gauche : en-tête, carte, liste des lignes
	panneau(GAUCHE.x, GAUCHE.y, GAUCHE.l, GAUCHE.h);
	textAlign(LEFT, TOP);
	noStroke();
	fill(C.accent);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(30);
	text(t('jeu.reseau'), GAUCHE.x + 24, GAUCHE.y + 22);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(20);
	fill(C.gris);
	text(enteteMode(), GAUCHE.x + 260, GAUCHE.y + 30);
	// Barre d'outils (souris / touch) — équivalents des touches H, M, R
	const bx = GAUCHE.x + GAUCHE.l - 24;
	const outils = [
		[t('jeu.recommencer'), () => ouvrir('reset')],
		[t('jeu.son', { etat: t(Confort.Reglages.son ? 'commun.oui' : 'commun.non') }), basculerSon],
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

	dessinerDecor(CARTE, meteo, 1, true);
	dessinerLignesEtat(CARTE, d);
	dessinerListeLignes(LISTE, d);

	// Panneau droit : jauges, puis selon la phase : conflit, dossier (avec contradiction) ou narration
	dessinerJauges();
	if (phase === 'narration') dessinerNarration();
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
	textSize(30);
	text(t('jeu.reseau'), GAUCHE.x + 24, GAUCHE.y + 22);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(20);
	fill(C.gris);
	text(enteteMode(), GAUCHE.x + 260, GAUCHE.y + 30);
	dessinerDecor(CARTE, meteo, 1, true);
	dessinerLignesEtat(CARTE, null);
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
function dessinerDecor(zone, meteo, opacite, avecCadre, sansLegende) {
	projection = projeter(zone);
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
	dessinerMeteo(zone, meteo, opacite, sansLegende);
	drawingContext.restore();
	pop();
}

function dessinerMeteo(zone, m, opacite, sansLegende) {
	if (!m) return;
	const pluie = m.pluie_mm || 0;
	const vent = m.rafales_max || 0;
	const chaud = m.temp_max >= 25;
	const froid = m.temp_min <= 0;
	noStroke();
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

// ——— Carte : état des lignes (Q29) — vert à l'heure, orange retard, rouge clignotant incident actif ———
function etatsLignes(dActuel) {
	const etats = new Map();
	(Jeu.etat.dossiers || []).forEach((d) => (d.lignes || []).forEach((n) => etats.set(n, 'retard')));
	if (dActuel) (dActuel.lignes || []).forEach((n) => etats.set(n, 'incident'));
	return etats;
}

function dessinerLignesEtat(zone, d) {
	if (!Jeu.lignes) return;
	const etats = etatsLignes(d);
	const clignote = reduireAnimations ? true : Math.floor(millis() / 500) % 2 === 0;
	push();
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(zone.x, zone.y, zone.l, zone.h);
	drawingContext.clip();
	noFill();
	// Lignes « à l'heure » d'abord, puis retard, puis incident (au-dessus)
	const ordre = { undefined: 0, retard: 1, incident: 2 };
	const liste = Jeu.lignes.lignes.slice().sort((a, b) => ordre[etats.get(a.nom)] - ordre[etats.get(b.nom)]);
	for (const l of liste) {
		const e = etats.get(l.nom);
		if (e === 'incident') {
			stroke(C.rouge);
			strokeWeight(clignote ? 8 : 4);
		} else if (e === 'retard') {
			stroke(C.orange);
			strokeWeight(5);
		} else {
			const v = color(C.vert);
			v.setAlpha(l.type === 0 ? 200 : 90);
			stroke(v);
			strokeWeight(l.type === 0 ? 3 : 1.2);
		}
		l.traces.forEach(tracer);
	}
	drawingContext.restore();
	pop();
}

// ——— Liste des lignes : alertes d'abord, puis retard décroissant (Q45) ———
function dessinerListeLignes(zone, dActuel) {
	const parLigne = new Map();
	(Jeu.etat.dossiers || []).forEach((d, i) => {
		(d.lignes || []).forEach((n) => {
			const prev = parLigne.get(n) || { nom: n, alerte: false, retard: null };
			prev.alerte = prev.alerte || d.type !== 'ligne en difficulté' || i === Jeu.index;
			if (d.retard !== null && (prev.retard === null || d.retard > prev.retard)) prev.retard = d.retard;
			parLigne.set(n, prev);
		});
	});
	const actives = new Set((dActuel && dActuel.lignes) || []);
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
	let y = zone.y + 58;
	if (!items.length) {
		textSize(18);
		fill(C.gris);
		text(t('lignes.aucune'), zone.x + 18, y);
		y += 120;
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
		textSize(17);
		fill(C.texte);
		text(t('bandeau.objectif', { libelle: o.libelle, v: Jeu.jauges[o.jauge] }), zone.x + 18, by + 12, zone.l - 36, 44);
		fill(mod ? C.orange : C.gris);
		text(mod ? mod.libelle + (mod.actionBloquee ? t('bandeau.bloquee', { action: Jeu.REGLAGES.effets[mod.actionBloquee].nom }) : '') + ' · ' + Math.ceil((mod.fin - millis()) / 1000) + ' s' : t('bandeau.aucunMod'), zone.x + 18, by + 60, zone.l - 36, 66);
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
	const defs = [
		[t('jaugeTitre.fluidite'), jauges.fluidite],
		[t('jaugeTitre.reputation'), jauges.reputation],
		[t('jaugeTitre.budget'), jauges.budget],
	];
	const lb = (z.l - 48 - 2 * 20) / 3;
	defs.forEach(([nom, v], i) => {
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
		fill('#E8E2D6');
		rect(x, z.y + 56, lb, 22, 4);
		// Jauge < 20 : clignotement discret (Q46), fixe si animations réduites
		const critique = v < 20;
		const visible = !critique || reduireAnimations || Math.floor(millis() / 700) % 2 === 0;
		fill(critique ? C.rouge : v < 40 ? C.orange : C.vert);
		if (!visible) fill('#D9A39E');
		rect(x, z.y + 56, (lb * constrain(v, 0, 100)) / 100, 22, 4);
	});
}

// ——— Dossier courant : ligne + retard + raison en priorité (Q5), glissement depuis la droite (Q10) ———
function dessinerDossier(d, meteo) {
	const base = { x: DROITE.x, y: DROITE.y + 130, l: DROITE.l, h: DROITE.h - 130 };
	const tA = reduireAnimations ? 1 : constrain((millis() - arriveeDossier) / 450, 0, 1);
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
	const duree = ((Jeu.etat.semaine && Jeu.etat.semaine.difficulte && Jeu.etat.semaine.difficulte.compteur_s) || 30) * 1000 * facteurDuree;
	const reste = constrain(1 - (millis() - debutCompteur) / duree, 0, 1);
	noStroke();
	fill('#E8E2D6');
	rect(x + 24, base.y + 22, base.l - 48, 14, 7);
	fill(reste < 0.25 ? C.rouge : C.accent);
	rect(x + 24, base.y + 22, (base.l - 48) * reste, 14, 7);
	textFont(POLICE_DONNEES);
	textSize(16);
	textAlign(RIGHT, TOP);
	fill(C.gris);
	text(Math.ceil((reste * duree) / 1000) + ' s', x + base.l - 24, base.y + 42);
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
	text(t('dossier.entete', { n: Jeu.index + 1, total: Jeu.paquet.length, type: tSi('type.' + d.type, d.type).toUpperCase(), affluence: d.affluence ? t('dossier.affluence') : '' }), x + 32, base.y + 42);

	// Priorité : ligne, retard, raison
	const ligne = d.lignes && d.lignes.length ? t('dossier.ligne', { lignes: d.lignes.join(', ') }) : t('dossier.ligneInconnue');
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(44);
	text(ligne, x + 32, base.y + 84);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(30);
	fill(d.retard !== null ? C.rouge : C.gris);
	text(d.retard !== null ? t('dossier.retard', { retard: d.retard }) : t('dossier.retardInconnu'), x + 32, base.y + 146);
	if (d.retard === null) {
		textSize(16);
		text(t('dossier.retardArchive'), x + 32, base.y + 184);
	}
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textSize(26);
	text(t('dossier.raison', { nature: d.nature }), x + 32, base.y + 212, base.l - (d.contradiction ? 300 : 64), 60);

	// Badge « contradiction » si deux sources se contredisent (Q9) — calculé au prompt 17
	if (d.contradiction) {
		fill(C.orange);
		rect(x + base.l - 230, base.y + 232, 198, 36, 18);
		fill(C.panneau);
		textFont(POLICE_DONNEES);
		textSize(18);
		textAlign(CENTER, CENTER);
		text(t('dossier.contradiction'), x + base.l - 131, base.y + 250);
		textAlign(LEFT, TOP);
	}

	// Détails (en dessous) : date, source, texte de la source, météo
	stroke('#E8E2D6');
	strokeWeight(2);
	line(x + 32, base.y + 276, x + base.l - 32, base.y + 276);
	noStroke();
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(C.gris);
	text(dateLongue(d.date) + (d.heure ? ' · ' + d.heure : ''), x + 32, base.y + 292);
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textSize(21);
	text(t('dossier.citation', { texte: d.texte_source }), x + 32, base.y + 326, base.l - 64, 120);
	textFont(POLICE_DONNEES);
	textSize(16);
	fill(C.gris);
	text(t('dossier.source', { source: d.source }), x + 32, base.y + 452, base.l - 64, 50);
	if (meteo) {
		text(t('dossier.meteo', { min: fmt(meteo.temp_min), max: fmt(meteo.temp_max), pluie: fmt(meteo.pluie_mm), rafales: fmt(meteo.rafales_max) }), x + 32, base.y + 506);
	}

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
	} else if (Jeu.conseil) {
		// Conseil contextuel (prompt 23 § 1) : une phrase factuelle, jamais l'action à choisir
		textFont(POLICE_TEXTE);
		textSize(17);
		fill(C.orange);
		text(t('dossier.conseil', { conseil: Jeu.conseil(d) }), x + 32, base.y + base.h - 250, base.l - 64, 46);
	}
	const bloquee = Jeu.actionBloquee ? Jeu.actionBloquee() : null;
	actions.forEach(([touche, nom, cle], i) => {
		const bx = x + 32 + (i % 2) * (ab + 16);
		const by = base.y + base.h - 200 + Math.floor(i / 2) * 88;
		bouton(bx, by, ab, 72, touche + '  ' + nom + (cle === bloquee ? t('dossier.indispo') : ''), () => decider(cle), cle === bloquee, i === 3);
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
	fill('#E8E2D6');
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
	bonne: { fond: '#FBF5E4', meteo: { pluie_mm: 0, rafales_max: 0, temp_min: 18, temp_max: 26 }, titre: '#1E7A3C' },
	moyenne: { fond: '#EDE7DA', meteo: { pluie_mm: 0.5, rafales_max: 10, temp_min: 10, temp_max: 15 }, titre: '#B45309' },
	mauvaise: { fond: '#2B3440', meteo: { pluie_mm: 9, rafales_max: 60, temp_min: 6, temp_max: 9 }, titre: '#B3261E' },
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
	textSize(52);
	text(b.titre, g.x + 48, g.y + 84, g.l - 96, 140);
	textStyle(NORMAL);
	textSize(26);
	text(b.texte, g.x + 48, g.y + 240, g.l - 96, 170);

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
		fill('#E8E2D6');
		rect(g.x + 48, y + 34, g.l - 96, 18, 4);
		fill(v < 20 ? C.rouge : v < 40 ? C.orange : C.vert);
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
		text(t('fin.profilDetail', { objectifs: p.objectifs, jour: p.meilleurJour, equipes: p.equipes, malus: p.malusFrequent }), g.x + 48, g.y + 816, g.l - 96, 60);
	}
	const bl = (g.l - 96 - 20) / 2;
	bouton(g.x + 48, g.y + g.h - 112, bl, 72, t('fin.rejouer'), rejouer);
	bouton(g.x + 68 + bl, g.y + g.h - 112, bl, 72, t('fin.changer'), retourAccueil, false, true);

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
	text(t('fin.sources'), d.x + 48, d.y + d.h - 50, d.l - 96, 40);
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

function panneau(x, y, l, h, bordure) {
	noStroke();
	fill(C.ombre);
	rect(x + 3, y + 5, l, h, 12);
	fill(C.panneau);
	if (bordure) {
		stroke(bordure);
		strokeWeight(3);
	}
	rect(x, y, l, h, 12);
	noStroke();
}

function bouton(x, y, l, h, label, action, desactive, secondaire) {
	const survol = !desactive && mouseX >= x && mouseX <= x + l && mouseY >= y && mouseY <= y + h;
	noStroke();
	if (secondaire) {
		fill(C.panneau);
		stroke(desactive ? C.gris : C.accent);
		strokeWeight(2);
	} else fill(desactive ? C.gris : survol ? C.texte : C.accent);
	rect(x, y, l, h, 10);
	noStroke();
	fill(secondaire ? (desactive ? C.gris : C.accent) : C.panneau);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(Math.min(30, h * 0.36));
	while (textSize() > 14 && textWidth(label) > l - 32) textSize(textSize() - 1); // le libellé tient dans le bouton
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
	if (Sauvegarde.dialogueOuvert) return; // prompt 33 : clics destinés à la boîte d'import HTML
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
	if (Sauvegarde.dialogueOuvert) return;
	Confort.Son.demarrer(); // l'audio ne peut démarrer qu'après un geste du joueur
	interaction();
	// Intro SMS (§ 2) : clic / Entrée pour avancer
	if (smsActif) {
		if (keyCode === ENTER || keyCode === RETURN || key === ' ') smsIndex === SMS.length - 1 ? terminerIntro() : smsSuivant();
		return false;
	}
	// Réveil (§ 4) : barre d'espace
	if (phase === 'reveil' && reveil) {
		if (key === ' ' || keyCode === ENTER || keyCode === RETURN) seReveiller();
		return false;
	}
	// Prompt 37 : G arrête le guide « Prendre en main »
	if ((key === 'g' || key === 'G') && GUIDE.actif && !MENU.actif) return arreterGuide(), false;
	// Prompt 34 : le tutoriel capte le clavier (L reste disponible pour changer de langue)
	if (tutoriel && !(key === 'l' || key === 'L')) return toucheTutoriel(), false;
	// Langue (prompt 24) : L bascule partout, sans toucher à la partie
	if (key === 'l' || key === 'L') return Langue.suivante(), false;
	// Fenêtres ouvertes : elles captent le clavier
	if (fenetre) {
		if (keyCode === ESCAPE || (fenetre === 'aide' && (key === 'h' || key === 'H' || key === '?'))) return fermer(), false;
		if (fenetre === 'aide' && (key === 't' || key === 'T')) return lancerTutoriel(), false; // prompt 34
		if (fenetre === 'telephone' && (keyCode === ENTER || keyCode === RETURN)) return fermer(), false; // prompt 38
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
			if (key === '5') Sauvegarde.exporter(); // prompt 33
			if (key === '6') Sauvegarde.copier();
			if (key === '7') return Sauvegarde.ouvrirImport(), false;
			if (keyCode === ENTER || keyCode === RETURN) fermer();
		}
		return false;
	}
	// Prompt 35 : menu principal (écran titre / choix de la semaine)
	if (MENU.actif) return toucheMenu(), false;
	// Au bureau (§ 1, § 7) : Échap = menu ; Tab = objets (écran, livres) ; Entrée = ouvrir / s'installer
	if (vue !== 'poste') {
		if (vue !== 'bureau') return false;
		if (keyCode === ESCAPE) return ouvrir('menu'), false;
		if (keyCode === TAB) {
			focusBureau = (focusBureau + (keyIsDown(SHIFT) ? OBJETS_BUREAU.length - 1 : 1)) % OBJETS_BUREAU.length;
			return false;
		}
		if (keyCode === ENTER || keyCode === RETURN || key === ' ') ouvrirObjetBureau(focusBureau > 0 ? OBJETS_BUREAU[focusBureau].nom : 'ecran');
		if (key === 'm' || key === 'M') basculerSon();
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
		if (PC.fenetre === 'carte' && ['1', '2', '3', '4'].includes(key)) envoyerEquipeCarte(Object.keys(Jeu.EQUIPES)[Number(key) - 1]);
		if (phase === 'mail' && PC.fenetre === null && (keyCode === ENTER || keyCode === RETURN)) return false;
		return false;
	}
	// Au poste : Échap fait se lever (sauf à l'écran de fin)
	if (keyCode === ESCAPE && !(ecran === 'jeu' && phase === 'fin')) return seLever(), false;
	// Prompt 26 : Tab place le focus sur « Quitter le PC » (et l'en retire), Entrée l'active
	if (keyCode === TAB) return basculerFocusQuitter(!focusQuitter), false;
	if (focusQuitter && (keyCode === ENTER || keyCode === RETURN || key === ' ')) return quitterPC(), false;
	if (phase === 'mail' && (keyCode === ENTER || keyCode === RETURN)) return journeeSuivante(), false;
	// Touches valables partout
	if (key === 'h' || key === 'H' || key === '?') return ouvrir('aide'), false;
	if (key === 'm' || key === 'M') return basculerSon(), false;
	if (ecran === 'jeu') {
		if (key === 'r' || key === 'R') return ouvrir('reset'), false;
		if (key === 'p' || key === 'P') return basculerPause(), false;
	}
	if (ecran === 'accueil') {
		if (keyCode === ENTER || keyCode === RETURN) ouvrirMenuPrincipal(); // prompt 35 : plus d'accueil dans le PC
	} else if (phase === 'decision') {
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
	if (scrollSortiePC(event.delta)) return false;
}

// Prompt 25 : la caméra du bureau ne suit la souris qu'une fois celle-ci réellement bougée sur le canevas
function mouseMoved() {
	sourisDansCanevas = mouseX >= 0 && mouseX <= L && mouseY >= 0 && mouseY <= H;
}

// Touch basique (Q32) : un appui = un clic sur les boutons
function touchStarted() {
	if (Sauvegarde.dialogueOuvert) return;
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
	fill(28, 39, 51, 150);
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
	voile();
	if (fenetre === 'aide') return fenetreAide();
	if (fenetre === 'reset') return fenetreReset();
	if (fenetre === 'parametres') return fenetreParametres();
	if (fenetre === 'reprise') return fenetreReprise();
	if (fenetre === 'menu') return fenetreMenu();
	if (fenetre === 'livre-stress') return fenetreLivreStress();
	if (fenetre === 'telephone') return fenetreTelephone(); // prompt 38
}

function fenetreAide() {
	const l = 1240;
	const h = 860;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	textAlign(LEFT, TOP);
	noStroke();
	fill(C.accent);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(40);
	text(t('aide.titre'), x + 48, y + 36);
	textStyle(NORMAL);
	// Raccourcis (08-raccourcis)
	const raccourcis = [
		['1 / 2 / 3', t('aide.k.actions')],
		[t('aide.k.rienTouche'), t('action.rien')],
		['A / B', t('aide.k.ab')],
		[t('aide.k.entreeTouche'), t('aide.k.entree')],
		['P', t('aide.k.pause')],
		['R', t('aide.k.reset')],
		['M', t('aide.k.son')],
		[t('aide.k.aideTouche'), t('aide.k.aide')],
		['↑ ↓', t('aide.k.semaine')],
		['← → ↑ ↓', t('aide.k.regarder')],
		[t('aide.k.quitterTouche'), t('aide.k.quitter')],
		['Tab', t('aide.k.objets')],
		['L', t('aide.k.langue')],
	];
	textSize(22);
	fill(C.texte);
	text(t('aide.raccourcis'), x + 48, y + 110);
	raccourcis.forEach(([k, d], i) => {
		textFont(POLICE_DONNEES);
		textSize(20);
		fill(C.accent);
		text(k, x + 48, y + 150 + i * 28);
		textFont(POLICE_TEXTE);
		fill(C.texte);
		text(d, x + 230, y + 150 + i * 28);
	});
	// Règles (00-concept, 03-actions, 04-jauges)
	const rx = x + 760;
	textSize(22);
	fill(C.texte);
	text(t('aide.regles'), rx, y + 110);
	textSize(19);
	text(
		t('aide.texte'),
		rx,
		y + 150,
		l - (rx - x) - 48,
		560,
	);
	// Table des malus (prompt 23 § 4)
	if (Jeu.MALUS) {
		textFont(POLICE_TEXTE);
		textSize(22);
		fill(C.texte);
		text(t('aide.malus'), x + 48, y + 516);
		Jeu.MALUS.forEach((m, i) => {
			textSize(16);
			fill(C.rouge);
			text(m.libelle, x + 48, y + 552 + i * 46);
			fill(C.gris);
			text(m.condition + ' → ' + m.consequence, x + 48, y + 572 + i * 46, 680, 24);
		});
	}
	bouton(x + l - 288, y + h - 104, 240, 64, t('commun.fermer'), fermer);
	bouton(x + l - 288 - 300, y + h - 104, 280, 64, t('tuto.relancer'), lancerTutoriel, false, true); // prompt 34
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
	textSize(22);
	fill(C.gris);
	text(t('reset.texte'), L / 2, y + 110);
	bouton(x + 48, y + h - 112, (l - 112) / 2, 72, t('reset.oui'), confirmerReset);
	bouton(x + 64 + (l - 112) / 2, y + h - 112, (l - 112) / 2, 72, t('reset.non'), fermer, false, true);
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
	const h = 860; // prompt 33 : + section « Progression »
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
		textSize(26);
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
	// Prompt 33 : Progression — exporter (fichier), copier (presse-papiers), importer (fichier ou texte collé)
	const yp = y + 120 + 5 * 96;
	textFont(POLICE_TEXTE);
	textSize(26);
	fill(C.texte);
	textAlign(LEFT, CENTER);
	text(t('parametres.progression'), x + 48, yp + 36);
	const lbp = 200;
	bouton(x + l - 48 - 3 * lbp - 32, yp + 8, lbp, 56, t('parametres.exporter'), () => Sauvegarde.exporter(), false, true);
	bouton(x + l - 48 - 2 * lbp - 16, yp + 8, lbp, 56, t('parametres.copier'), () => Sauvegarde.copier(), false, true);
	bouton(x + l - 48 - lbp, yp + 8, lbp, 56, t('parametres.importer'), () => Sauvegarde.ouvrirImport(), false, true);
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
