/* Nantes en régulation — prompt 54 : interaction sonore au micro (voix, souffle, bruit).
 * Push-to-talk : touche M maintenue (≥ 250 ms ; un appui bref coupe le son, comme avant) ou clic maintenu sur
 * le micro du poste. getUserMedia n'est appelé qu'à ce geste. Le signal est analysé hors draw (toutes les
 * 50 ms) : amplitude (RMS), hauteur (autocorrélation), souffle/bruit (RMS sans hauteur), fragmentation
 * (pics). Ces mesures pilotent une texture GRANULAIRE faite de grains lus dans les 2 dernières secondes
 * captées : amplitude → volume et densité, hauteur → hauteur des grains, pics → grains plus courts,
 * souffle → turbulence (gigue de départ et de hauteur). Micro refusé ou absent : repli silencieux sur une
 * source synthétisée en interne, message « Micro indisponible ». Aucune incidence sur le jeu (Q1–Q61).
 */
const MICRO = {
	ouvert: false, // push-to-talk en cours
	par: null, // 'touche' | 'clic'
	appuiM: 0,
	minuterieM: null,
	flux: null,
	source: null,
	analyseur: null,
	bus: null,
	anneau: null, // Float32Array : 2 s de signal (micro ou repli synthétique)
	ecriture: 0,
	interne: false, // repli : pas de micro
	refus: false,
	mesures: { amp: 0, hauteur: 0, souffle: 0, frag: 0, densite: 0 },
	forme: new Float32Array(128),
	minuterieAnalyse: null,
	minuterieGrains: null,
	prochainGrain: 0,
};
const MICRO_APPUI_MS = 250;
const microActive = () => Confort.Reglages.micro !== false;

// ——— Touche M : brève = son (comme avant), maintenue = micro ———
function toucheMEnfoncee() {
	if (MICRO.minuterieM || MICRO.ouvert) return; // répétition automatique de la touche : ignorée
	MICRO.appuiM = millis();
	if (!microActive()) return;
	MICRO.minuterieM = setTimeout(() => {
		MICRO.minuterieM = null;
		if (keyIsDown(77)) demarrerMicro('touche'); // 77 = M
	}, MICRO_APPUI_MS);
}
function toucheMRelachee() {
	if (MICRO.minuterieM) {
		clearTimeout(MICRO.minuterieM);
		MICRO.minuterieM = null;
	}
	if (MICRO.ouvert && MICRO.par === 'touche') return arreterMicro();
	if (millis() - MICRO.appuiM < MICRO_APPUI_MS) basculerSon();
}
function keyReleased() {
	if (Sauvegarde.dialogueOuvert || CARNET.ouvert) return; // on tape dans une boîte de texte
	if (key === 'm' || key === 'M') toucheMRelachee();
}
function mouseReleased() {
	if (MICRO.ouvert && MICRO.par === 'clic') arreterMicro();
}
function touchEnded() {
	mouseReleased();
}
/** Objet « micro du poste » : appui maintenu */
function clicMicro() {
	interaction();
	if (!microActive()) {
		PIECE.message = { texte: t('micro.desactive'), objet: 'micro', jusqua: millis() + 4000 };
		return annoncer(t('micro.desactive'));
	}
	demarrerMicro('clic');
}

// ——— Ouverture / fermeture ———
async function demarrerMicro(par) {
	if (MICRO.ouvert) return;
	Confort.Son.demarrer();
	const S = Confort.Son;
	if (!S.ctx) return;
	MICRO.ouvert = true;
	MICRO.par = par;
	const c = S.ctx;
	if (!MICRO.anneau) MICRO.anneau = new Float32Array(Math.round(c.sampleRate * 2));
	if (!MICRO.bus) {
		MICRO.bus = c.createGain();
		MICRO.bus.gain.value = 0.32;
		MICRO.bus.connect(c.destination);
	}
	MICRO.bus.gain.setTargetAtTime(Confort.Reglages.son ? 0.32 : 0, c.currentTime, 0.05);
	if (!MICRO.flux && !MICRO.refus) {
		try {
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('getUserMedia absent');
			MICRO.flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
			MICRO.source = c.createMediaStreamSource(MICRO.flux);
			MICRO.analyseur = c.createAnalyser();
			MICRO.analyseur.fftSize = 2048;
			MICRO.source.connect(MICRO.analyseur); // jamais vers les haut-parleurs : pas de larsen
		} catch (e) {
			MICRO.refus = true; // repli silencieux : source interne
		}
	}
	if (!MICRO.ouvert) return arreterMicro(); // relâché pendant la demande d'autorisation
	MICRO.interne = !MICRO.analyseur;
	if (MICRO.interne) {
		PIECE.message = { texte: t('micro.indisponible'), objet: 'micro', jusqua: millis() + 4000 };
		annoncer(t('micro.indisponible'));
	} else annoncer(t('micro.on'));
	MICRO.minuterieAnalyse = setInterval(analyserMicro, 50);
	MICRO.minuterieGrains = setInterval(programmerGrains, 25);
	MICRO.prochainGrain = c.currentTime + 0.05;
}
function arreterMicro() {
	const etait = MICRO.ouvert;
	MICRO.ouvert = false;
	clearInterval(MICRO.minuterieAnalyse);
	clearInterval(MICRO.minuterieGrains);
	MICRO.minuterieAnalyse = MICRO.minuterieGrains = null;
	MICRO.mesures = { amp: 0, hauteur: 0, souffle: 0, frag: 0, densite: 0 };
	if (MICRO.flux) {
		MICRO.flux.getTracks().forEach((p) => p.stop()); // le voyant micro du navigateur s'éteint
		MICRO.flux = null;
		MICRO.source = null;
		MICRO.analyseur = null;
	}
	if (etait) annoncer(t('micro.off'));
}

// ——— Analyse (hors draw) ———
const bufTemps = new Float32Array(2048);
function analyserMicro() {
	const c = Confort.Son.ctx;
	const n = 2048;
	if (MICRO.interne) {
		// Repli : souffle + voyelle douce synthétisés, modulés lentement (le joueur entend que le système vit)
		const tps = millis() / 1000;
		const f0 = 180 + 60 * Math.sin(tps * 0.7);
		const souffle = 0.5 + 0.5 * Math.sin(tps * 0.37);
		for (let i = 0; i < n; i++) bufTemps[i] = (Math.sin((2 * Math.PI * f0 * (i + tps * c.sampleRate)) / c.sampleRate) * (1 - souffle) + (Math.random() * 2 - 1) * souffle) * 0.25;
	} else MICRO.analyseur.getFloatTimeDomainData(bufTemps);
	// Anneau : on y copie les derniers échantillons (les grains y puisent)
	const A = MICRO.anneau;
	const nouv = Math.min(n, Math.round(c.sampleRate * 0.05));
	for (let i = 0; i < nouv; i++) {
		A[MICRO.ecriture] = bufTemps[n - nouv + i];
		MICRO.ecriture = (MICRO.ecriture + 1) % A.length;
	}
	// Amplitude (RMS) et pic
	let s = 0;
	let pic = 0;
	for (let i = 0; i < n; i++) {
		s += bufTemps[i] * bufTemps[i];
		pic = Math.max(pic, Math.abs(bufTemps[i]));
	}
	const rms = Math.sqrt(s / n);
	const hauteur = rms > 0.01 ? hauteurAutocorrelation(bufTemps, c.sampleRate) : 0;
	const m = MICRO.mesures;
	const lisse = (a, b, k) => a + (b - a) * k;
	m.amp = lisse(m.amp, Math.min(1, rms * 6), 0.5);
	m.hauteur = hauteur ? lisse(m.hauteur || hauteur, hauteur, 0.5) : lisse(m.hauteur, 0, 0.2);
	m.souffle = lisse(m.souffle, rms > 0.02 && !hauteur ? Math.min(1, rms * 8) : 0, 0.3); // RMS continu sans hauteur
	m.frag = lisse(m.frag, Math.min(1, Math.max(0, pic / Math.max(rms, 1e-4) - 3) / 5), 0.4); // pics (bruit, chocs)
	m.densite = 3 + m.amp * 45;
	for (let i = 0; i < MICRO.forme.length; i++) MICRO.forme[i] = bufTemps[i * 16];
}
/** Hauteur par autocorrélation (80–1000 Hz) ; 0 si le signal n'est pas assez périodique (souffle, bruit) */
function hauteurAutocorrelation(b, sr) {
	const n = 1024;
	let meilleur = 0;
	let decal = 0;
	let energie = 0;
	for (let i = 0; i < n; i++) energie += b[i] * b[i];
	for (let d = Math.floor(sr / 1000); d <= Math.floor(sr / 80); d++) {
		let s = 0;
		for (let i = 0; i < n; i++) s += b[i] * b[i + d];
		if (s > meilleur) {
			meilleur = s;
			decal = d;
		}
	}
	return energie > 0 && meilleur / energie > 0.5 ? sr / decal : 0; // clarté > 0,5 : son voisé
}

// ——— Grains ———
function programmerGrains() {
	const c = Confort.Son.ctx;
	if (!c || !MICRO.ouvert) return;
	MICRO.bus.gain.setTargetAtTime(Confort.Reglages.son ? 0.32 : 0, c.currentTime, 0.05); // toujours sous l'interrupteur Son
	const m = MICRO.mesures;
	if (m.amp < 0.02) return;
	while (MICRO.prochainGrain < c.currentTime + 0.1) {
		jouerGrain(MICRO.prochainGrain);
		MICRO.prochainGrain += 1 / m.densite;
	}
}
function jouerGrain(t0) {
	const c = Confort.Son.ctx;
	const m = MICRO.mesures;
	const A = MICRO.anneau;
	const duree = 0.16 - m.frag * 0.13; // fragmentation : grains plus courts
	const n = Math.round(c.sampleRate * duree);
	const turb = m.souffle; // turbulence
	const depart = (MICRO.ecriture - Math.round(c.sampleRate * (0.3 + Math.random() * turb * 1.2)) + A.length) % A.length;
	const tampon = c.createBuffer(1, n, c.sampleRate);
	const d = tampon.getChannelData(0);
	for (let i = 0; i < n; i++) d[i] = A[(depart + i) % A.length];
	const src = c.createBufferSource();
	src.buffer = tampon;
	const base = m.hauteur ? constrain(m.hauteur / 220, 0.5, 2) : 1; // voix aiguë → grains plus aigus
	src.playbackRate.value = base * (1 + (Math.random() - 0.5) * turb * 0.6);
	const g = c.createGain();
	const v = 0.15 + m.amp * 0.6;
	g.gain.setValueAtTime(0.0001, t0);
	g.gain.exponentialRampToValueAtTime(v, t0 + duree * 0.3);
	g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
	src.connect(g).connect(MICRO.bus);
	src.start(t0);
	src.stop(t0 + duree + 0.02);
}

// ——— Affichage : oscilloscope et barres (en bas à gauche de l'écran), seulement pendant l'appui ———
function dessinerMicro() {
	if (!MICRO.ouvert) return;
	const m = MICRO.mesures;
	const l = 420;
	const h = 150;
	const x = 24;
	const y = 110; // en haut à gauche : ne masque ni les objets du bureau ni l'écran du PC
	noStroke();
	fill(13, 12, 12, 235);
	rect(x, y, l, h);
	fill(C.primaire);
	rect(x, y, 6, h);
	textFont(POLICE_DONNEES);
	textSize(16);
	textAlign(LEFT, TOP);
	fill(C.texte);
	text(MICRO.interne ? t('micro.titreInterne') : t('micro.titre'), x + 18, y + 10);
	// Oscilloscope (figé en animations réduites : seulement les barres chiffrées)
	if (!reduireAnimations) {
		noFill();
		stroke(C.vert);
		strokeWeight(2);
		beginShape();
		for (let i = 0; i < MICRO.forme.length; i++) vertex(x + 18 + (i / (MICRO.forme.length - 1)) * 180, y + 76 + constrain(MICRO.forme[i] * 120, -36, 36));
		endShape();
		noStroke();
	}
	const barres = [
		['micro.amp', m.amp],
		['micro.hauteur', m.hauteur ? constrain((m.hauteur - 80) / 600, 0, 1) : 0],
		['micro.densite', (m.densite - 3) / 45],
		['micro.frag', m.frag],
		['micro.turb', m.souffle],
	];
	barres.forEach(([cle, v], i) => {
		const by = y + 36 + i * 21;
		fill(C.gris);
		textSize(14);
		text(t(cle), x + 214, by);
		fill(C.piste);
		rect(x + 320, by + 3, 82, 10);
		fill(C.vert);
		rect(x + 320, by + 3, 82 * constrain(v, 0, 1), 10);
	});
}
function basculerMicroReglage() {
	Confort.Reglages.basculer('micro');
	if (!microActive()) arreterMicro();
	annoncer(t('micro.reglage') + ' : ' + t(microActive() ? 'commun.oui' : 'commun.non'));
}

/** Micro de table en pixel art (pied, tige, capsule grillagée) ; voyant rouge pendant l'appui */
function dessinerMicroPoste(g) {
	const x = 152;
	const y = 171;
	ombreObjet(g, x - 2, y + 23, 12);
	boite(g, x - 2, y + 20, 12, 3, '#2c3036', '#4a5058', '#1a1d21'); // pied
	px(g, '#4a5058', x + 3, y + 10, 2, 10); // tige
	boite(g, x, y, 7, 11, '#3a3f46', '#6a717a', '#22262b'); // capsule
	for (let k = 1; k < 10; k += 2) px(g, '#1a1d21', x + 1, y + k, 5, 1); // grille
	px(g, MICRO.ouvert ? '#ff3b30' : '#5a2a2a', x + 8, y + 20, 2, 1); // voyant
}
