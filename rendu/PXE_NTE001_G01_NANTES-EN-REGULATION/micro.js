/* Nantes en régulation — micro (prompt 54, simplifié au prompt 64).
 * Push-to-talk : touche M maintenue (≥ 250 ms ; un appui bref coupe le son, comme avant) ou clic maintenu sur
 * le micro du poste. getUserMedia n'est appelé qu'à ce geste. Le signal est analysé hors draw (toutes les 50 ms) :
 * amplitude, hauteur (autocorrélation), souffle (bruit continu sans hauteur).
 * Un seul usage en jeu : SOUFFLER pendant le boost du café calme le cœur et ralentit le compteur (prompt 63).
 * Prompt 64 : la texture sonore granulaire et la « radio des chauffeurs » ont été retirées à la demande du groupe.
 * Micro refusé ou absent : message « Micro indisponible », rien d'autre ne change. Le micro ne joue aucun son.
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
const microActive = () => Confort.Reglages.micro !== false && (typeof objetPresent !== 'function' || objetPresent('micro')); // prompt 104 : pas de micro avant qu'il soit posé

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
	if (Sauvegarde.dialogueOuvert || saisieOuRaccourciNavigateur() || (typeof rechercheMailsActive === 'function' && rechercheMailsActive())) return; // on tape dans une boîte de texte (prompt 174 : ou un champ HTML ; prompt 195 : ou la recherche de Mails)
	if (key === 'm' || key === 'M') toucheMRelachee();
}
function mouseReleased() {
	if (typeof relacherJeton === 'function' && relacherJeton()) return; // prompt 102 : dépôt d'un jeton d'équipe
	if (typeof relacherGlisser === 'function') relacherGlisser(); // prompt 94 : dépôt d'une carte (ou clic)
	if (MICRO.ouvert && MICRO.par === 'clic') arreterMicro();
}
function touchEnded(e) {
	if (horsCanevas(e)) return; // prompt 60
	if (MOBILE.actif) return (PORTRAIT.actif ? portraitFin(e) : toucherFin()), false; // prompt 60 : tap, appui long, swipe ; 60b : portrait
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
	MICRO.prochainGrain = c.currentTime + 0.05;
}
function arreterMicro() {
	const etait = MICRO.ouvert;
	MICRO.ouvert = false;
	clearInterval(MICRO.minuterieAnalyse);
	MICRO.minuterieAnalyse = null;
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
	usagesMicro(50); // prompt 63/64 : souffle anti-stress
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
		['micro.souffleBarre', m.souffle],
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
	annoncer(t('micro.reglage') + ' : ' + t(microActive() ? 'commun.active' : 'commun.desactive'));
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

// ——— Prompt 63/64 : souffler pendant le boost du café (bonus facultatif) ———
const RADIO = { souffleMs: 0, annonceSouffle: 0 }; // prompt 64 : la radio des chauffeurs a été retirée, reste le souffle
/** Appelée à chaque analyse (toutes les 50 ms) pendant l'appui */
function usagesMicro(dt) {
	const m = MICRO.mesures;
	if (MICRO.interne) return; // la source de repli ne compte pas comme une vraie voix
	const enDossier = ecran === 'jeu' && (phase === 'decision' || phase === 'contradiction');
	// Souffle (bruit continu sans hauteur) pendant le boost du café : le cœur redescend deux fois plus vite,
	//    le compteur ralentit de moitié
	const souffle = m.souffle > 0.35 && !m.hauteur;
	if (souffle && typeof boostActif === 'function' && boostActif()) {
		RADIO.souffleMs += dt;
		CAFE.boost -= dt; // le boost s'épuise deux fois plus vite
		if (enDossier && Jeu.defiChrono) debutCompteur += dt / 2; // compteur à mi-vitesse
		if (millis() - RADIO.annonceSouffle > 6000) {
			RADIO.annonceSouffle = millis();
			annoncer(t('micro.souffle'));
		}
	} else RADIO.souffleMs = 0;
}
