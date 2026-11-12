/* Nantes en régulation — prompt 110 : toutes les autorisations demandées AVANT de jouer.
 * Écran du menu (MENU.ecran = 'autorisations') entre le choix de la semaine (ou « Reprendre ») et la partie.
 * - Son : démarré au clic « Tout autoriser » (geste utilisateur, règle d'autoplay des navigateurs).
 * - Micro + caméra : UN seul getUserMedia({ audio, video }) → une seule fenêtre du navigateur ; en cas d'échec,
 *   micro et caméra sont redemandés séparément pour savoir lequel manque. Les pistes sont arrêtées aussitôt
 *   (le voyant s'éteint) : la permission reste retenue par le navigateur, micro.js et webcam.js rouvrent leur
 *   flux au geste en jeu, sans nouvelle fenêtre.
 * - La webcam reste opt-in (réglage « Webcam » inchangé) : autoriser ici ne l'allume jamais.
 * - Refus, API absente ou page non sécurisée (rendu/ en file://) : le jeu reste entièrement jouable.
 */
const AUTOR = {
	vu: false, // écran déjà passé pendant cette session de page
	suite: null, // action à lancer après l'écran (nouvelle partie ou reprise)
	choix: 0,
	debut: 0,
	enCours: false,
	etat: { son: 'nonDemande', micro: 'nonDemande', camera: 'nonDemande' }, // nonDemande | autorise | refuse | absent | coupe
};
const LIGNES_AUTOR = ['son', 'micro', 'camera'];
const mediasDisponibles = () => !!(window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

/** Statut réel lu auprès du navigateur quand l'API Permissions le permet (sinon : dernier résultat connu) */
async function lireAutorisations() {
	const E = AUTOR.etat;
	E.son = !Confort.Reglages.son ? 'coupe' : Confort.Son.ctx && Confort.Son.ctx.state === 'running' ? 'autorise' : E.son === 'autorise' ? 'autorise' : 'nonDemande';
	if (!mediasDisponibles()) {
		E.micro = E.camera = 'absent';
		return;
	}
	const lire = async (nom, cle) => {
		try {
			const p = await navigator.permissions.query({ name: nom });
			E[cle] = p.state === 'granted' ? 'autorise' : p.state === 'denied' ? 'refuse' : E[cle] === 'absent' ? 'absent' : 'nonDemande';
		} catch (e) {} // Firefox / Safari : nom non pris en charge → on garde le dernier résultat
	};
	if (navigator.permissions && navigator.permissions.query) await Promise.all([lire('microphone', 'micro'), lire('camera', 'camera')]);
}
/** Tout est réglé (aucune ligne « non demandée ») : l'écran n'a pas lieu d'être */
const autorisationsReglees = () => LIGNES_AUTOR.every((k) => AUTOR.etat[k] !== 'nonDemande');

/** Point d'entrée : avant de lancer `suite`, montrer l'écran une fois par session si une autorisation manque */
function avantDeJouer(suite) {
	if (AUTOR.vu || (typeof EXPO !== 'undefined' && EXPO.actif)) return suite(); // prompt 132 : pas d'écran en exposition (jeu jouable sans)
	AUTOR.suite = suite;
	lireAutorisations().then(() => {
		if (autorisationsReglees()) {
			AUTOR.vu = true;
			return suite();
		}
		AUTOR.retour = MENU.ecran; // Échap revient à l'écran d'origine (choix de la semaine ou titre)
		MENU.ecran = 'autorisations';
		MENU.debut = millis();
		AUTOR.choix = 0;
		annoncer(t('autor.titre') + '. ' + t('autor.intro') + ' ' + LIGNES_AUTOR.map(libelleLigneAutor).join('. '));
	});
}
const libelleLigneAutor = (k) => t('autor.' + k) + ' : ' + t('autor.statut.' + AUTOR.etat[k]);

function demarrerSonAutor() {
	if (!Confort.Reglages.son) Confort.Reglages.basculer('son'); // « Rallumer » : le réglage coupé est respecté jusqu'au clic
	else Confort.Son.demarrer();
	AUTOR.etat.son = 'autorise';
}
/** Demande au navigateur ; renvoie 'autorise' | 'refuse' | 'absent' et arrête aussitôt les pistes obtenues */
async function demanderMedia(contraintes) {
	try {
		const flux = await navigator.mediaDevices.getUserMedia(contraintes);
		flux.getTracks().forEach((p) => p.stop());
		return 'autorise';
	} catch (e) {
		return e && (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') ? 'absent' : 'refuse';
	}
}
async function autoriser(quoi) {
	if (AUTOR.enCours) return;
	const E = AUTOR.etat;
	if (quoi === 'son' || quoi === 'tout') demarrerSonAutor();
	const medias = quoi === 'tout' ? ['micro', 'camera'].filter((k) => E[k] !== 'autorise' && E[k] !== 'absent') : quoi === 'son' ? [] : [quoi];
	if (medias.length && mediasDisponibles()) {
		AUTOR.enCours = true;
		if (medias.length === 2) {
			const r = await demanderMedia({ audio: true, video: true });
			if (r === 'autorise') E.micro = E.camera = 'autorise';
			else for (const k of medias) E[k] = await demanderMedia(k === 'micro' ? { audio: true } : { video: true }); // savoir lequel manque
		} else E[medias[0]] = await demanderMedia(medias[0] === 'micro' ? { audio: true } : { video: true });
		AUTOR.enCours = false;
	} else if (medias.length) medias.forEach((k) => (E[k] = 'absent'));
	if (E.micro === 'autorise' && Confort.Reglages.micro === false) Confort.Reglages.choisir('micro', true);
	if (E.micro === 'autorise' && typeof MICRO !== 'undefined') MICRO.refus = false;
	if (E.camera === 'autorise' && typeof CAM !== 'undefined') CAM.refus = false;
	annoncer(LIGNES_AUTOR.map(libelleLigneAutor).join('. '));
	AUTOR.choix = LIGNES_AUTOR.length + 1; // focus sur « Jouer »
}
function jouerApresAutorisations() {
	AUTOR.vu = true;
	MENU.ecran = 'titre';
	const s = AUTOR.suite;
	AUTOR.suite = null;
	if (s) s();
}
const auMoinsUneAutorisation = () => LIGNES_AUTOR.some((k) => AUTOR.etat[k] === 'autorise');

/** Éléments focalisables, dans l'ordre : Tout autoriser, une ligne par périphérique, Jouer */
function elementsAutor() {
	const E = AUTOR.etat;
	const reste = (k) => (k === 'son' ? E[k] !== 'autorise' : E[k] === 'nonDemande'); // un refus ne se lève que dans le navigateur
	const el = [{ cle: 'tout', action: () => autoriser('tout'), libelle: t('autor.tout'), desactive: !LIGNES_AUTOR.some(reste) }];
	LIGNES_AUTOR.forEach((k) =>
		el.push({
			cle: k,
			action: () => autoriser(k),
			libelle: E[k] === 'coupe' ? t('autor.rallumer') : t('autor.autoriser'),
			desactive: E[k] === 'autorise' || E[k] === 'absent' || (k !== 'son' && E[k] === 'refuse'), // refus : seul le navigateur peut le lever
		}),
	);
	el.push({ cle: 'jouer', action: jouerApresAutorisations, libelle: t(auMoinsUneAutorisation() ? 'autor.jouer' : 'autor.sans') });
	return el;
}

function dessinerAutorisations() {
	const portrait = typeof PORTRAIT !== 'undefined' && PORTRAIT.actif;
	const k = reduireAnimations ? 1 : easeOut(constrain((millis() - MENU.debut) / 400, 0, 1));
	const l = portrait ? L - 80 : 1240;
	const x = (L - l) / 2;
	const y0 = (portrait ? 60 : 110) + (1 - k) * 30;
	const el = elementsAutor();
	if (AUTOR.choix >= el.length || el[AUTOR.choix].desactive) AUTOR.choix = el.length - 1;
	noStroke();
	fill('rgba(13,12,12,0.7)'); // voile : la pièce floutée reste devinable, le texte garde son contraste
	rect(0, 0, L, H);
	const focus = (i) => AUTOR.choix === i;
	dsTitre(t('autor.titre'), x, y0, portrait ? 52 : 64, DS.blanc, 'left');
	dsTexte(t('autor.intro'), x, y0 + 96, 24, DS.blanc75, 'left', l);
	let y = y0 + 190;
	const hL = portrait ? 170 : 140;
	LIGNES_AUTOR.forEach((cle, i) => {
		const s = AUTOR.etat[cle];
		noStroke();
		fill(DS.blanc05);
		rect(x, y, l, hL);
		fill(s === 'autorise' ? DS.succes : s === 'refuse' || s === 'coupe' ? DS.primaire : DS.blanc15);
		rect(x, y, 6, hL);
		textFont(DS.policeTexte);
		textStyle(BOLD);
		dsTexte(t('autor.' + cle), x + 32, y + 20, 28, DS.blanc, 'left');
		textStyle(NORMAL);
		const lb = portrait ? 300 : 260;
		dsTexte(t('autor.' + cle + '.usage') + ' ' + (cle !== 'son' && (s === 'refuse' || s === 'absent') ? t('autor.' + cle + '.sans') : ''), x + 32, y + 60, 20, DS.blanc75, 'left', l - lb - 260);
		// Statut (texte + couleur : jamais la couleur seule)
		textFont(POLICE_DONNEES);
		textSize(20);
		textAlign(RIGHT, CENTER);
		fill(s === 'autorise' ? DS.succesClair : s === 'refuse' || s === 'coupe' ? DS.erreurClair : DS.blanc75);
		text(t('autor.statut.' + s), x + l - lb - 48, y + hL / 2);
		textAlign(LEFT, TOP);
		const e = el[i + 1];
		dsBouton(x + l - lb - 24, y + (hL - 64) / 2, lb, 64, e.libelle, e.action, 'contour', e.desactive || AUTOR.enCours);
		if (focus(i + 1)) cadreFocusAutor(x + l - lb - 24, y + (hL - 64) / 2, lb, 64);
		y += hL + 16;
	});
	y += 24;
	const lt = portrait ? l : 520;
	dsBouton(x, y, lt, 76, el[0].libelle, el[0].action, 'primaire', el[0].desactive || AUTOR.enCours);
	if (focus(0)) cadreFocusAutor(x, y, lt, 76);
	const yj = portrait ? y + 96 : y;
	const lj = portrait ? l : 420;
	const xj = portrait ? x : x + l - lj;
	dsBouton(xj, yj, lj, 76, el[el.length - 1].libelle, el[el.length - 1].action, auMoinsUneAutorisation() ? 'secondaire' : 'contour');
	if (focus(el.length - 1)) cadreFocusAutor(xj, yj, lj, 76);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(DS.blanc75);
	textAlign(LEFT, TOP);
	text(t(mediasDisponibles() ? 'autor.pied' : 'autor.piedAbsent'), x, yj + 104, l, 80);
	text(t('autor.clavier'), x, H - 70);
}
function cadreFocusAutor(x, y, l, h) {
	noFill();
	stroke(DS.blanc);
	strokeWeight(3);
	rect(x - 8, y - 8, l + 16, h + 16);
	noStroke();
}
function toucheAutorisations() {
	const el = elementsAutor();
	const n = el.length;
	const suivant = (pas) => {
		for (let i = 1; i <= n; i++) {
			const j = (AUTOR.choix + pas * i + n * 2) % n;
			if (!el[j].desactive) return (AUTOR.choix = j);
		}
	};
	if (keyCode === UP_ARROW || (keyCode === TAB && keyIsDown(SHIFT))) suivant(-1);
	else if (keyCode === DOWN_ARROW || keyCode === TAB) suivant(1);
	else if (keyCode === ENTER || keyCode === RETURN || key === ' ') {
		const e = el[AUTOR.choix];
		if (e && !e.desactive && !AUTOR.enCours) e.action();
	} else if (keyCode === ESCAPE || keyCode === BACKSPACE) {
		AUTOR.suite = null;
		MENU.ecran = AUTOR.retour || 'titre';
		MENU.debut = millis();
		return true;
	}
	if (keyCode === UP_ARROW || keyCode === DOWN_ARROW || keyCode === TAB) {
		const e = el[AUTOR.choix];
		const i = LIGNES_AUTOR.indexOf(e.cle);
		annoncer(i >= 0 ? libelleLigneAutor(e.cle) + ' — ' + e.libelle : e.libelle);
	}
	return true;
}
