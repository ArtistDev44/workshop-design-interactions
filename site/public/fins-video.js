/* Nantes en régulation — prompt 226 : chaque fin devient une petite vidéo de trois séquences.
 * 12 fins (10 fins de posture du prompt 207, licenciement, démission) × 3 séquences de 5 s : le moment, la
 * conséquence, l'après. Tout est dessiné par le code (pixel, design system), sans fichier vidéo ni réseau.
 * Les chiffres affichés viennent de la partie (donneesVideoFin) ; une donnée absente n'est pas dessinée.
 * Tableau validé : jeu/226-fins-en-sequences.md. Remplace la cinématique par palier du prompt 41 (même état CINE).
 */
let CINE = null; // { cle, d, plan, debut, pause, pauseDepuis, suite }
const DUREE_SEQUENCE = 5000; // 3 × 5 s ≈ 15 s
const DUREE_SEQUENCE_REDUITE = 6000; // animations réduites : plans fixes, avancés toutes les 6 s ou à la main
const FINS_VIDEO = ['virale', 'burnout', 'imposteur', 'fauteuil', 'diplomate', 'insoumis', 'usagers', 'boucEmissaire', 'correcte', 'reprimande', 'licenciement', 'demission'];
/** Prompt 209 : colonne centrale de 640 px (mobile portrait) — la région recomposée de la scène « cine » */
const COLONNE_CINE = { x: 1920 / 2 - 320, l: 640, haut: 180, bas: 280 };
const TON_VIDEO = { licenciement: 'mauvaise', demission: 'mauvaise' };
const COULEURS_TON = { bonne: '#1e7a3c', moyenne: '#a15c07', mauvaise: '#b3261e' };
const PERSOS_VIDEO = {
	joueur: { corps: '#3d5a80', cheveux: '#2b2118' },
	patron: { corps: '#2f3136', cheveux: '#9a9a9a' },
	camille: { corps: '#8b3a62', cheveux: '#5a3a22' },
	direction: { corps: '#1f2a36', cheveux: '#6b6b6b' },
};

// ——— Données réelles de la partie (stockables dans la galerie : nombres et textes courts) ———
function donneesVideoFin(cle, b) {
	const s = (b && b.signaux) || (Jeu.signauxPosture ? Jeu.signauxPosture() : {});
	const h = (Jeu.historique || []).filter((x) => x && x.action);
	const clash = h.find((x) => x.clash && x.jour);
	const lignes = [...new Set(h.flatMap((x) => (x.dossier && x.dossier.lignes) || []).map(String))].slice(0, 6);
	const j = Jeu.jauges || {};
	const r = (v) => (typeof v === 'number' && isFinite(v) ? Math.round(v) : null);
	const d = {
		cle,
		ton: TON_VIDEO[cle] || ((Jeu.FINS_SEMAINE || []).find((f) => f.cle === cle) || {}).ton || 'moyenne',
		type: b && b.type ? b.type : Jeu.typeFin ? Jeu.typeFin(Jeu.score()) : 'moyenne',
		score: r(b && b.score !== undefined ? b.score : Jeu.score ? Jeu.score() : null),
		f: r(j.fluidite),
		rep: r(j.reputation),
		bu: r(j.budget),
		clashs: r(s.clashs),
		clashsD: r(s.clashsDecisions),
		clashsQ: r(s.clashsQuai),
		jourClash: clash ? String(clash.jour) : null,
		cafes: r(s.joursCafe),
		jours: r(s.joursJoues),
		renforts: r(s.renforts),
		decisions: r(s.decisions),
		bons: r(s.bons),
		quaiRep: s.quai ? r(s.quai.reponses) : null,
		quaiBonnes: s.quai ? r(s.quai.bonnes) : null,
		quaiSignalees: s.quai ? r(s.quai.signalees) : null,
		objectifs: r(s.objectifs),
		objectifsRates: r(s.objectifsRates),
		nonTraites: r(s.nonTraites),
		pluie: s.meteo ? s.meteo.pluie : null,
		rafales: s.meteo ? s.meteo.rafales : null,
		lignes,
		dossiers: r((Jeu.paquet || []).length),
		lundi: Jeu.etat && Jeu.etat.semaine ? Jeu.etat.semaine.lundi : null,
		jourFin: Jeu.jourCourant && Jeu.jourCourant() ? Jeu.jourCourant().date : null,
	};
	if (cle === 'licenciement' && Jeu.statutPatron) {
		const L0 = Jeu.statutPatron.licencie || {};
		d.dateLic = L0.date || null;
		d.heureLic = L0.heure || null;
		d.avert = r(Jeu.statutPatron.avertissements);
		const basse = ['fluidite', 'reputation', 'budget'].slice().sort((a, c) => (j[a] || 0) - (j[c] || 0))[0];
		d.jaugeBasse = basse;
		d.valeurBasse = r(j[basse]);
	}
	return d;
}
const connu = (v) => v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && !isFinite(v));
/** « mardi 13 octobre » avec majuscule (sous-titres) */
function jourVideo(iso) {
	const s = typeof jourDate === 'function' && iso ? jourDate(iso) : '';
	return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
/** Lundi qui suit la semaine jouée (convocation des usagers d'abord) */
function lundiSuivant(lundi) {
	if (!lundi) return null;
	const x = new Date(lundi + 'T12:00:00Z');
	x.setUTCDate(x.getUTCDate() + 7);
	return x.toISOString().slice(0, 10);
}

// ——— Lecture ———
function lancerVideoFin(cle, d, suite) {
	if (!FINS_VIDEO.includes(cle)) return suite && suite();
	CINE = { cle, d: d || { cle }, plan: 0, debut: millis(), pause: false, suite: suite || null };
	fenetre = null;
	annoncerSequence();
}
function nomFinVideo(cle) {
	return cle === 'licenciement' || cle === 'demission' ? t('video.nom.' + cle) : t('fin.' + cle + '.nom');
}
function annoncerSequence() {
	if (!CINE) return;
	annoncer(t('video.annonce', { nom: nomFinVideo(CINE.cle), n: CINE.plan + 1, texte: sousTitreSequence(CINE) }));
}
function sequenceSuivante() {
	if (!CINE) return;
	CINE.plan++;
	CINE.debut = millis();
	CINE.pause = false;
	if (CINE.plan > 2) return finVideo();
	annoncerSequence();
}
function finVideo() {
	const suite = CINE && CINE.suite;
	CINE = null;
	if (suite) suite();
}
function basculerPauseVideo() {
	if (!CINE) return;
	if (CINE.pause) CINE.debut += millis() - CINE.pauseDepuis;
	else CINE.pauseDepuis = millis();
	CINE.pause = !CINE.pause;
	annoncer(t(CINE.pause ? 'video.enPause' : 'video.reprise'));
}
function toucheVideoFin() {
	if (keyCode === ESCAPE) return finVideo();
	if ((key === 'p' || key === 'P') && !(typeof raccourciLettreBloque === 'function' && raccourciLettreBloque())) return basculerPauseVideo();
	if (keyCode === ENTER || keyCode === RETURN || key === ' ' || keyCode === RIGHT_ARROW) sequenceSuivante();
}
/** Avancement de la séquence (0 → 1) ; animations réduites : plan fixe (0,6) */
function avancementSequence(c) {
	const ecoule = (c.pause ? c.pauseDepuis : millis()) - c.debut;
	return { u: reduireAnimations ? 0.6 : constrain(ecoule / DUREE_SEQUENCE, 0, 1), fini: ecoule >= (reduireAnimations ? DUREE_SEQUENCE_REDUITE : DUREE_SEQUENCE) };
}

function dessinerVideoFin() {
	const c = CINE;
	const a = avancementSequence(c);
	if (a.fini && !c.pause) sequenceSuivante();
	if (!CINE) return;
	const u = a.u;
	background(0);
	push();
	const seq = SEQUENCES_FIN[c.cle][c.plan];
	seq.dessin(u, c.d);
	pop();
	// Fondus d'entrée / sortie (0,4 s ; aucun si animations réduites)
	if (!reduireAnimations) {
		const ms = u * DUREE_SEQUENCE;
		const f = ms < 400 ? 1 - ms / 400 : ms > DUREE_SEQUENCE - 400 ? (ms - (DUREE_SEQUENCE - 400)) / 400 : 0;
		noStroke();
		fill(0, 0, 0, 255 * constrain(f, 0, 1));
		rect(0, 0, L, H);
	}
	const sous = sousTitreSequence(c);
	if (typeof PORTRAIT !== 'undefined' && PORTRAIT.actif) return piedVideoPortrait(c, sous);
	noStroke();
	fill(0);
	rect(0, 0, L, 110);
	rect(0, H - 150, L, 150);
	textAlign(LEFT, CENTER);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill('rgba(255,255,255,0.75)');
	text(t('cine.titreFin', { nom: nomFinVideo(c.cle) }), 60, 55);
	progressionVideo(c, 60 + 620, 50, 300);
	bouton(L - 360 - 316, 30, 300, 56, t(c.pause ? 'video.reprendre' : 'video.pause'), basculerPauseVideo, false, true);
	bouton(L - 360, 30, 300, 56, t('cine.passer'), finVideo, false, true);
	zoneTexteDeclarer('sousTitreCine', 160, H - 150, L - 320, 150);
	dessinerTexte(sous, 160, H - 150 + Math.max(10, (150 - hauteurTexte(sous, L - 320, { taille: 30, interligne: 40 })) / 2), L - 320, { taille: 30, interligne: 40, couleur: '#ffffff', align: 'center', maxLignes: 3 });
	boutons.push({ x: 0, y: 110, l: L, h: H - 260, action: sequenceSuivante });
}
/** Trois segments : séquence en cours remplie selon l'avancement */
function progressionVideo(c, x, y, l) {
	const a = avancementSequence(c);
	const ls = (l - 16) / 3;
	noStroke();
	for (let i = 0; i < 3; i++) {
		fill(255, 255, 255, 60);
		rect(x + i * (ls + 8), y, ls, 6);
		fill('#ffffff');
		const k = i < c.plan ? 1 : i > c.plan ? 0 : reduireAnimations ? 1 : a.u;
		rect(x + i * (ls + 8), y, ls * k, 6);
	}
}
/** Prompt 209 : mobile portrait — titre, « Pause », « Passer » et sous-titre dans la colonne centrale */
function piedVideoPortrait(c, sous) {
	const C0 = COLONNE_CINE;
	noStroke();
	fill(0);
	rect(0, 0, L, C0.haut);
	rect(0, H - C0.bas, L, C0.bas);
	dessinerTexte(String(t('cine.titreFin', { nom: nomFinVideo(c.cle) })), C0.x, 14, C0.l, { taille: 20, interligne: 26, couleur: 'rgba(255,255,255,0.75)', police: POLICE_DONNEES, maxLignes: 1 });
	progressionVideo(c, C0.x, 52, C0.l);
	bouton(C0.x, 74, (C0.l - 12) / 2, 96, t(c.pause ? 'video.reprendre' : 'video.pause'), basculerPauseVideo, false, true);
	bouton(C0.x + (C0.l + 12) / 2, 74, (C0.l - 12) / 2, 96, t('cine.passer'), finVideo, false, true);
	const o = { taille: 28, interligne: 36, couleur: '#ffffff', align: 'center', maxLignes: 6 };
	const hs = hauteurTexte(sous, C0.l, o);
	zoneTexteDeclarer('sousTitreCine', C0.x, H - C0.bas, C0.l, C0.bas);
	dessinerTexte(sous, C0.x, H - C0.bas + Math.max(12, (C0.bas - hs) / 2), C0.l, o);
	boutons.push({ x: 0, y: C0.haut, l: L, h: H - C0.haut - C0.bas, action: sequenceSuivante });
}
function sousTitreSequence(c) {
	return String(SEQUENCES_FIN[c.cle][c.plan].sous(c.d));
}

// ——— Éléments communs ———
/** Étiquette de donnée réelle dans l'image : fond sombre, texte blanc (≥ 4,5:1) */
function etiquetteVideo(txt, x, y, align) {
	if (!txt) return;
	// Mobile portrait : la colonne centrale seule est visible — l'étiquette se centre en bas de la colonne
	if (typeof PORTRAIT !== 'undefined' && PORTRAIT.actif) (x = L / 2), (y = H - COLONNE_CINE.bas - 70), (align = 'centre');
	textFont(POLICE_DONNEES);
	textSize(24);
	const l = textWidth(String(txt)) + 32;
	const x0 = align === 'centre' ? x - l / 2 : align === 'droite' ? x - l : x;
	noStroke();
	fill(13, 12, 12, 225);
	rect(x0, y, l, 48);
	fill('#ffffff');
	textAlign(LEFT, CENTER);
	text(String(txt), x0 + 16, y + 25);
}
/** Silhouette pixel debout (pieds en x, y), échelle s ; options : carton, bras levés, applaudit, assis, badge */
function silhouette(x, y, s, qui, o = {}) {
	const c = PERSOS_VIDEO[qui] || PERSOS_VIDEO.joueur;
	noStroke();
	const dy = o.assis ? 6 * s : 0;
	fill('#d9a77a');
	rect(x - 3 * s, y - 26 * s + dy, 6 * s, 6 * s); // tête
	fill(c.cheveux);
	rect(x - 3 * s, y - 27 * s + dy, 6 * s, 2 * s);
	fill(c.corps);
	rect(x - 4 * s, y - 20 * s + dy, 8 * s, 11 * s); // buste
	fill('#22252b');
	if (o.assis) rect(x - 4 * s, y - 9 * s + dy, 9 * s, 3 * s);
	else (rect(x - 3 * s, y - 9 * s, 2.5 * s, 9 * s), rect(x + 0.5 * s, y - 9 * s, 2.5 * s, 9 * s));
	fill(c.corps);
	const leve = o.brasLeves || (o.applaudit && Math.floor((reduireAnimations ? 0 : millis()) / 400) % 2);
	if (leve) (rect(x - 6 * s, y - 26 * s + dy, 2 * s, 8 * s), rect(x + 4 * s, y - 26 * s + dy, 2 * s, 8 * s));
	else if (o.brasTendu) (rect(x - 6 * s, y - 20 * s + dy, 2 * s, 9 * s), rect(x + 4 * s, y - 18 * s + dy, 8 * s, 2 * s));
	else (rect(x - 6 * s, y - 20 * s + dy, 2 * s, 9 * s), rect(x + 4 * s, y - 20 * s + dy, 2 * s, 9 * s));
	if (o.carton) {
		fill('#b08850');
		rect(x - 7 * s, y - 17 * s + dy, 14 * s, 9 * s);
		fill('#8e6a3a');
		rect(x - 7 * s, y - 17 * s + dy, 14 * s, 1.5 * s);
		if (o.carton !== true) {
			fill('#2b1d0e');
			textFont(POLICE_DONNEES);
			textSize(Math.max(12, 2.4 * s));
			textAlign(CENTER, CENTER);
			text(String(o.carton), x, y - 12 * s + dy);
		}
	}
	if (o.brasTendu && o.badge) {
		fill('#ffffff');
		rect(x + 11 * s, y - 20 * s + dy, 4 * s, 5 * s);
		fill('#3d5a80');
		rect(x + 11 * s, y - 20 * s + dy, 4 * s, 1.5 * s);
	}
}
/** Jauge horizontale du bandeau (valeur 0–100), libellé dessus */
function jaugeVideo(x, y, l, v, nom) {
	noStroke();
	fill(13, 12, 12, 225);
	rect(x - 12, y - 44, l + 24, 92);
	fill('#ffffff');
	textFont(POLICE_DONNEES);
	textSize(22);
	textAlign(LEFT, TOP);
	text(nom + '  ' + Math.round(v), x, y - 36);
	fill('#3a3f46');
	rect(x, y, l, 20);
	fill(v < 20 ? '#d10b00' : v < 40 ? '#e07b00' : '#1e9e4a');
	rect(x, y, (l * constrain(v, 0, 100)) / 100, 20);
}
/** Pseudo-hasard stable (positions de foule, de vignettes) */
const hasardVideo = (i) => {
	const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
	return x - Math.floor(x);
};

// ——— Décors ———
/** V · Ville et Loire, ciel du palier (repris de la cinématique du prompt 41) */
function decorVille(type, u, o = {}) {
	const ciel = { bonne: ['#f2b16b', '#7fb5e0'], moyenne: ['#9aa4ad', '#c8cfd5'], mauvaise: ['#0b1220', '#1b2a44'], soir: ['#d9825b', '#3b4a6b'] }[type] || ['#9aa4ad', '#c8cfd5'];
	const g = drawingContext.createLinearGradient(0, 0, 0, H);
	g.addColorStop(0, ciel[1]);
	g.addColorStop(1, ciel[0]);
	drawingContext.fillStyle = g;
	drawingContext.fillRect(0, 0, L, H);
	const nuit = type === 'mauvaise' || type === 'soir';
	noStroke();
	[90, 140, 70, 180, 120, 200, 100, 160, 130, 210, 90, 150, 110, 170, 80, 190].forEach((h, i) => {
		fill(nuit ? '#0f1626' : '#5b6572');
		rect(i * 124, 640 - h, 124, h + 10);
		if (nuit) for (let k = 0; k < 4; k++) (fill('#e8c46a'), rect(i * 124 + 20 + k * 22, 660 - h + k * 18, 8, 8));
	});
	if (o.tour) {
		fill('#0f1626');
		rect(900, 300, 120, 350); // la tour de la direction
		fill('#ffe08a');
		rect(948, 380, 24, 20); // une lumière reste allumée
	}
	fill(nuit ? '#1b2a44' : '#4f7f9f');
	rect(0, 650, L, 300); // la Loire
	fill(nuit ? '#2e4264' : '#9cc3da');
	for (let x = 0; x < L; x += 90) rect(x + (reduireAnimations ? 0 : (millis() / 40) % 90), 720 + (x % 3) * 40, 40, 4);
	fill('#3a3f46');
	rect(0, 600, L, 26); // pont
	const n = o.trams === undefined ? 3 : o.trams;
	for (let i = 0; i < n; i++) {
		const x = ((i * L) / n + (reduireAnimations ? 0 : millis() * 0.2)) % (L + 200) - 100;
		fill('#e9ecef');
		rect(x, 560, 150, 40);
		fill(nuit ? '#e8c46a' : '#3c4450');
		for (let w = 0; w < 4; w++) rect(x + 12 + w * 34, 568, 22, 14);
	}
	if (o.pluie && !reduireAnimations) {
		fill(200, 215, 230, 120);
		for (let i = 0; i < 160; i++) rect((i * 97 + millis() * 0.2) % L, (i * 53 + millis() * 0.9) % H, 2, 14);
	} else if (o.pluie) {
		fill(200, 215, 230, 120);
		for (let i = 0; i < 160; i++) rect((i * 97) % L, (i * 53) % H, 2, 14);
	}
	void u;
}
/** B · La pièce du bureau (zoom lent) ; o.nuit : salle de nuit (S), écran seul allumé */
function decorPiece(u, o = {}) {
	if (!dernierRenduBureau || millis() - dernierRenduBureau > 250) {
		dessinerPieceBureau();
		dernierRenduBureau = millis();
	}
	const z = reduireAnimations ? 1.05 : 1.05 + u * 0.06;
	drawingContext.imageSmoothingEnabled = false;
	image(gBureau, (L - L * z) / 2, (H - H * z) / 2, L * z, H * z);
	drawingContext.imageSmoothingEnabled = true;
	noStroke();
	if (o.nuit) {
		fill(6, 8, 18, 200);
		rect(0, 0, L, H);
		fill(120, 170, 220, 40);
		rect(560, 160, 800, 460); // halo de l'écran
	} else if (o.voile) {
		fill(o.voile);
		rect(0, 0, L, H);
	}
}
/** C · Carte du réseau (stylisée) : 6 lignes, la Loire ; etat(i) → couleur de la ligne i ; noms réels si connus */
const TRACES_RESEAU = [
	[[360, 300], [620, 380], [900, 470], [1180, 520], [1560, 600]],
	[[480, 860], [700, 700], [930, 500], [1090, 330], [1240, 200]],
	[[380, 620], [700, 560], [960, 520], [1300, 420], [1540, 360]],
	[[760, 200], [820, 400], [960, 520], [1040, 720], [1120, 880]],
	[[420, 420], [640, 480], [880, 620], [1180, 740], [1500, 820]],
	[[1420, 180], [1320, 330], [1180, 520], [1020, 700], [880, 860]],
];
function decorCarte(u, o = {}) {
	background('#0d0f12');
	noStroke();
	fill('#14181d');
	rect(300, 150, 1320, 760);
	// La Loire
	noFill();
	stroke('#1f3b57');
	strokeWeight(34);
	beginShape();
	[[300, 690], [600, 640], [900, 680], [1200, 600], [1620, 640]].forEach((p) => vertex(p[0], p[1]));
	endShape();
	TRACES_RESEAU.forEach((tr, i) => {
		stroke(o.etat ? o.etat(i) : '#5b6572');
		strokeWeight(8);
		beginShape();
		tr.forEach((p) => vertex(p[0], p[1]));
		endShape();
		const nom = o.lignes && o.lignes[i];
		if (nom) {
			noStroke();
			fill(13, 12, 12, 225);
			rect(tr[0][0] - 8, tr[0][1] - 40, textWidth(String(nom)) + 28, 34);
			fill('#ffffff');
			textFont(POLICE_DONNEES);
			textSize(22);
			textAlign(LEFT, CENTER);
			text(String(nom), tr[0][0] + 6, tr[0][1] - 22);
		}
		noFill();
	});
	noStroke();
	(o.points || []).forEach((p) => {
		fill(p.c);
		rect(p.x - p.t / 2, p.y - p.t / 2, p.t, p.t);
	});
	void u;
}
/** T · Téléphone en main : cadre, écran ; contenu(x, y, l, h) dessine dans l'écran */
function decorTelephone(u, contenu) {
	background('#16181d');
	noStroke();
	fill('#22252b');
	rect(0, 820, L, 260); // le bureau, en bas
	fill('#d9a77a');
	rect(860, 900, 200, 180); // la main
	fill('#0b0c0f');
	rect(700, 120, 520, 860, 48);
	fill('#0f1720');
	const e = { x: 726, y: 190, l: 468, h: 720 };
	rect(e.x, e.y, e.l, e.h, 12);
	if (contenu) contenu(e, u);
}
/** Bulle de conversation dans l'écran du téléphone */
function bulleVideo(e, y, txt, cote, coul) {
	textFont(POLICE_TEXTE);
	textSize(22);
	const lmax = e.l - 80;
	const o = { taille: 22, interligne: 28, couleur: coul === '#e9ecef' ? '#16181d' : '#ffffff', maxLignes: 4 };
	const h = hauteurTexte(String(txt), lmax - 28, o) + 24;
	const x = cote === 'droite' ? e.x + e.l - 16 - lmax : e.x + 16;
	noStroke();
	fill(coul);
	rect(x, y, lmax, h, 14);
	dessinerTexte(String(txt), x + 14, y + 12, lmax - 28, o);
	return y + h + 14;
}
/** L · Lettre posée sur le bureau : en-tête, texte, tampon à la couleur du ton */
function decorLettre(u, o) {
	background('#cbb79a');
	noStroke();
	fill('#b49f80');
	for (let y = 0; y < H; y += 46) rect(0, y, L, 2);
	const k = reduireAnimations ? 1 : easeOut(constrain(u / 0.25, 0, 1));
	const portrait = typeof PORTRAIT !== 'undefined' && PORTRAIT.actif; // prompt 209 : lettre de 600 px dans la colonne centrale
	const l = portrait ? 600 : 820;
	const h = portrait ? H - COLONNE_CINE.haut - COLONNE_CINE.bas - 24 : 700;
	const x = (L - l) / 2;
	const y = (portrait ? COLONNE_CINE.haut + 12 : 150) + (1 - k) * 80;
	fill(0, 0, 0, 70);
	rect(x + 16, y + 20, l, h);
	fill('#fbf8f0');
	rect(x, y, l, h);
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(20);
	fill('#5a5348');
	const mx = portrait ? 32 : 60;
	text(String(o.entete), x + mx, y + 40);
	dessinerTexte(String(o.texte), x + mx, y + 100, l - 2 * mx, { taille: portrait ? 24 : 26, interligne: portrait ? 34 : 38, couleur: '#1d1a16', maxLignes: portrait ? 9 : 8 });
	(o.surligne || []).forEach((ly) => {
		fill(209, 11, 0, 60);
		rect(x + 56, y + ly, l - 112, 34);
	});
	if (o.tampon && (reduireAnimations || u > 0.45)) {
		push();
		translate(x + l - (portrait ? 170 : 200), y + h - 90);
		rotate(-0.15);
		noFill();
		stroke(o.couleur || '#b3261e');
		strokeWeight(5);
		rect(-150, -40, 300, 80);
		noStroke();
		fill(o.couleur || '#b3261e');
		textAlign(CENTER, CENTER);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(28);
		text(String(o.tampon), 0, 0);
		textStyle(NORMAL);
		pop();
	}
}
/** P · Bureau du patron (nouveau décor) : mur, baie vitrée sur la ville, porte vitrée et sa plaque, plante,
 * bureau et fauteuil ; o.occupant ('patron' | 'joueur' | 'direction'), o.carton, o.applaudit, o.brasTendu, o.badge,
 * o.plaque (texte), o.postit (texte), o.tampon (texte qui tombe sur le bureau), o.lever (aube) */
function decorPatron(u, o = {}) {
	background('#e9e1d3');
	noStroke();
	// Baie vitrée sur la ville
	fill('#5b4632');
	rect(1090, 170, 660, 440);
	const ciel = o.lever ? ['#f6c98a', '#9cc3da'] : ['#c8d6e0', '#9cc3da'];
	const g = drawingContext.createLinearGradient(0, 180, 0, 600);
	g.addColorStop(0, ciel[1]);
	g.addColorStop(1, ciel[0]);
	drawingContext.fillStyle = g;
	drawingContext.fillRect(1100, 180, 640, 420);
	fill('#6d7784');
	[60, 110, 80, 150, 95, 130, 70].forEach((h, i) => rect(1100 + i * 92, 600 - h, 92, h));
	fill('#4f7f9f');
	rect(1100, 560, 640, 40); // la Loire
	fill('#5b4632');
	rect(1415, 180, 10, 420); // montant
	// Parquet
	fill('#8a6a4a');
	rect(0, 760, L, H - 760);
	fill('#7a5c3e');
	for (let x = 0; x < L; x += 160) rect(x, 760, 4, H - 760);
	// Porte vitrée et sa plaque
	fill('#7d8a94');
	rect(170, 250, 280, 510);
	fill('#cfd8dc');
	rect(186, 266, 248, 494);
	fill('#7d8a94');
	rect(410, 500, 14, 50); // poignée
	if (o.plaque) {
		const k = reduireAnimations ? 1 : constrain((u - 0.15) / 0.35, 0, 1);
		textFont(POLICE_DONNEES);
		textSize(24);
		const lp = Math.max(240, textWidth(String(o.plaque)) + 36);
		fill(201, 162, 39, 255 * k);
		rect(310 - lp / 2, 316, lp, 60);
		fill(43, 29, 14, 255 * k);
		textAlign(CENTER, CENTER);
		text(String(o.plaque), 310, 347);
	}
	// Plante
	fill('#6b4a2e');
	rect(1770, 700, 80, 60);
	fill('#2f6b3a');
	[[1790, 600], [1760, 640], [1830, 620], [1810, 560]].forEach(([px, py]) => rect(px - 20, py, 40, 100));
	// Fauteuil
	fill('#2a2a2e');
	rect(880, 400, 160, 220);
	fill('#3a3a40');
	rect(870, 580, 180, 40);
	// Occupant (derrière le bureau)
	if (o.occupant) silhouette(960, 690, 9, o.occupant, { assis: true, applaudit: o.applaudit, brasTendu: o.brasTendu, badge: o.badge });
	if (o.debout) o.debout.forEach((p) => silhouette(p.x, 760, 9, p.qui, p.o || {}));
	// Bureau
	fill('#5b4632');
	rect(600, 600, 720, 40);
	fill('#4b3828');
	rect(620, 640, 680, 140);
	fill('#3b2c1f');
	rect(620, 640, 680, 8);
	if (o.carton) {
		fill('#b08850');
		rect(1120, 520, 150, 80);
		fill('#8e6a3a');
		rect(1120, 520, 150, 10);
	}
	if (o.papiers) {
		fill('#fbf8f0');
		rect(700, 570, 160, 30);
		rect(710, 562, 160, 30);
	}
	if (o.postit) {
		fill('#ffe066');
		rect(880, 520, 160, 80);
		fill('#2b1d0e');
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(30);
		textAlign(CENTER, CENTER);
		text(String(o.postit), 960, 560);
		textStyle(NORMAL);
	}
	if (o.tampon) {
		const k = reduireAnimations ? 1 : easeOut(constrain((u - 0.3) / 0.25, 0, 1));
		push();
		translate(960, lerp(250, 712, k)); // sur le devant du bureau (le visage reste visible)
		rotate(-0.12);
		noFill();
		stroke(o.couleur || '#1e7a3c');
		strokeWeight(5);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(30);
		const lt = textWidth(String(o.tampon)) + 48;
		rect(-lt / 2, -34, lt, 68);
		noStroke();
		fill(o.couleur || '#1e7a3c');
		textAlign(CENTER, CENTER);
		text(String(o.tampon), 0, 0);
		textStyle(NORMAL);
		pop();
	}
}
/** A · Couloir et ascenseur du siège (nouveau décor) : portes qui se ferment sur l'occupant (o.qui, o.carton),
 * indicateur d'étage (o.etage) ; o.porte : variante « porte du patron » fermée, chaise devant (o.assis) */
function decorAscenseur(u, o = {}) {
	background('#d7d3cc');
	noStroke();
	fill('#c4bfb6');
	rect(0, 0, L, 120); // corniche
	fill('#9c968c');
	rect(0, 820, L, H - 820);
	fill('#8c867c');
	for (let x = 0; x < L; x += 120) rect(x, 820, 2, H - 820);
	if (o.porte) {
		// Porte du bureau du patron, vitre dépolie, silhouette floue derrière ; chaise et attente devant
		fill('#5b4632');
		rect(760, 220, 400, 600);
		fill('#d9dfe2');
		rect(790, 260, 340, 300);
		fill(47, 49, 54, 110);
		rect(915, 330, 90, 230); // silhouette du patron derrière la vitre
		rect(935, 300, 50, 40);
		fill('#c9a227');
		rect(820, 596, 280, 52);
		fill('#2b1d0e');
		textFont(POLICE_DONNEES);
		textSize(24);
		textAlign(CENTER, CENTER);
		text(String(o.plaque || ''), 960, 623);
		// Chaise et joueur assis
		fill('#3a3f46');
		rect(1300, 700, 120, 20);
		rect(1300, 720, 12, 100);
		rect(1408, 720, 12, 100);
		rect(1408, 600, 12, 110);
		silhouette(1360, 760, 9, 'joueur', { assis: true });
		return;
	}
	// Cadre de l'ascenseur et cabine
	fill('#5c636b');
	rect(640, 200, 640, 640);
	fill('#2d3238');
	rect(680, 240, 560, 580);
	fill('#3c434b');
	rect(680, 780, 560, 40);
	if (o.qui) silhouette(960, 790, 10, o.qui, { carton: o.carton });
	// Portes qui se ferment
	const k = o.fermer === false ? 0 : reduireAnimations ? 0.7 : easeOut(constrain((u - 0.35) / 0.55, 0, 1));
	fill('#a9b1ba');
	rect(680, 240, 280 * k, 580);
	rect(1240 - 280 * k, 240, 280 * k, 580);
	fill('#8f98a2');
	if (k > 0.02) (rect(680 + 280 * k - 6, 240, 6, 580), rect(1240 - 280 * k, 240, 6, 580));
	// Indicateur d'étage
	fill('#16181d');
	textFont(POLICE_DONNEES);
	textSize(24);
	const le = Math.max(220, textWidth(String(o.etage || '')) + 40);
	rect(960 - le / 2, 140, le, 50);
	fill('#ffb000');
	textAlign(CENTER, CENTER);
	text(String(o.etage || ''), 960, 166);
	// Bouton d'appel
	fill('#5c636b');
	rect(1320, 500, 40, 80);
	fill('#ffe08a');
	rect(1330, 515, 20, 20);
}
/** Q · Quai de tram au matin (nouveau décor) : abri, rails, foule ; o.tram : 'entre' (s'arrête) | 'passe' ;
 * o.monter : la foule monte ; o.seul : une silhouette à l'écart (le joueur) */
function decorQuai(u, o = {}) {
	const g = drawingContext.createLinearGradient(0, 0, 0, 700);
	g.addColorStop(0, '#a9cbe6');
	g.addColorStop(1, '#f6d7a7');
	drawingContext.fillStyle = g;
	drawingContext.fillRect(0, 0, L, 760);
	noStroke();
	fill('#8d96a3');
	[220, 300, 180, 260, 340, 200, 280, 240].forEach((h, i) => rect(i * 250, 700 - h, 230, h));
	fill('#b7bec7');
	[[60, 520], [420, 470], [880, 540], [1300, 480], [1700, 530]].forEach(([x, y]) => rect(x, y, 140, 700 - y));
	// Voie
	fill('#5f5a52');
	rect(0, 700, L, 120);
	fill('#3a3f46');
	rect(0, 730, L, 10);
	rect(0, 790, L, 10);
	// Quai et bordure
	fill('#8d8f93');
	rect(0, 820, L, H - 820);
	fill('#e8c46a');
	rect(0, 816, L, 8);
	// Abri
	fill('#5c636b');
	rect(240, 470, 12, 350);
	rect(700, 470, 12, 350);
	fill('#3c434b');
	rect(220, 450, 512, 26);
	fill(207, 227, 239, 120);
	rect(252, 476, 448, 240);
	fill('#5c636b');
	rect(320, 740, 300, 16);
	// Tram
	let xt = null;
	if (o.tram === 'entre') xt = reduireAnimations ? 700 : lerp(L + 40, 700, easeOut(constrain(u / 0.5, 0, 1)));
	else if (o.tram === 'passe') xt = reduireAnimations ? 600 : lerp(L + 40, -1200, constrain(u, 0, 1));
	if (xt !== null) {
		fill('#e9ecef');
		rect(xt, 540, 1160, 190, 18);
		fill('#2a9d8f');
		rect(xt, 690, 1160, 16);
		fill('#3c4450');
		for (let w = 0; w < 9; w++) rect(xt + 40 + w * 124, 570, 90, 70);
		fill('#c9d1d9');
		[2, 5, 8].forEach((w) => rect(xt + 20 + w * 124, 580, 20, 140)); // portes
	}
	// Foule
	if (o.foule) {
		const n = o.foule;
		for (let i = 0; i < n; i++) {
			const x0 = 120 + i * (1500 / n) + hasardVideo(i) * 40;
			const porte = 700 + 20 + [2, 5, 8][i % 3] * 124 + 10;
			const k = o.monter ? (reduireAnimations ? 0.5 : constrain((u - 0.5) / 0.4, 0, 1)) : 0;
			if (k >= 0.98) continue;
			const qui = i % 4 === 0 ? 'camille' : i % 4 === 1 ? 'direction' : 'joueur';
			silhouette(lerp(x0, porte, k), 960, 6, qui);
		}
	}
	if (o.seul) silhouette(180, 990, 8, 'joueur');
}

// ——— Les 36 séquences (tableau : jeu/226-fins-en-sequences.md) ———
const etat = (c) => () => c; // couleur fixe d'une ligne de la carte
const pese = (k, v) => t('pese.' + k, v);
const SEQUENCES_FIN = {
	virale: [
		{
			dessin: (u, d) => {
				decorTelephone(u, (e) => {
					let y = e.y + 30;
					y = bulleVideo(e, y, t('video.virale.question'), 'gauche', '#e9ecef');
					if (reduireAnimations || u > 0.3) bulleVideo(e, y, t('video.virale.bulle'), 'droite', '#b3261e');
					if (reduireAnimations || u > 0.3) {
						fill('#ffffff');
						textFont(POLICE_DONNEES);
						textSize(24);
						textAlign(RIGHT, TOP);
						text(t('video.label.envoye'), e.x + e.l - 20, e.y + e.h - 44);
					}
				});
				if (connu(d.clashs)) etiquetteVideo(pese('clashs', { n: d.clashs }), 1260, 300);
			},
			sous: (d) => (d.jourClash ? t('video.virale.0', { jour: jourVideo(d.jourClash) }) : t('video.virale.0.sans')),
		},
		{
			dessin: (u, d) => {
				decorVille('mauvaise', u, { trams: 2 });
				const n = reduireAnimations ? 14 : Math.floor(1 + u * 24);
				for (let i = 0; i < n; i++) {
					const x = 120 + hasardVideo(i) * 1600;
					const y = 820 - ((hasardVideo(i + 50) * 600 + (reduireAnimations ? 0 : u * 500)) % 700);
					noStroke();
					fill(0, 0, 0, 120);
					rect(x + 8, y + 8, 120, 200);
					fill('#0b0c0f');
					rect(x, y, 120, 200, 12);
					fill('#b3261e');
					rect(x + 14, y + 60, 92, 40, 6);
					fill('#e9ecef');
					rect(x + 14, y + 20, 70, 28, 6);
				}
				const txt = connu(d.clashsD) && connu(d.clashsQ) && d.clashsD && d.clashsQ ? pese('clashsDetail', { d: d.clashsD, q: d.clashsQ }) : connu(d.clashs) ? pese('clashs', { n: d.clashs }) : '';
				etiquetteVideo(txt, 960, 140, 'centre');
			},
			sous: () => t('video.virale.1'),
		},
		{
			dessin: (u, d) => {
				decorAscenseur(u, { qui: 'joueur', carton: t('video.label.archives'), etage: t('video.label.etageArchives') });
				if (connu(d.score)) etiquetteVideo(pese('score', { s: d.score }), 260, 300);
			},
			sous: () => t('video.virale.2'),
		},
	],
	burnout: [
		{
			dessin: (u, d) => {
				decorPiece(u);
				const n = connu(d.cafes) ? Math.min(12, d.cafes) : 0;
				const vis = reduireAnimations ? n : Math.min(n, Math.floor(u * (n + 1) * 1.3));
				for (let i = 0; i < vis; i++) {
					const x = 1320 + (i % 3) * 70;
					const y = 860 - Math.floor(i / 3) * 90;
					noStroke();
					fill('#f2ead8');
					rect(x, y, 54, 70);
					fill('#7a4b2a');
					rect(x, y, 54, 12);
					fill('#b3261e');
					rect(x, y + 30, 54, 10);
				}
				if (connu(d.cafes) && d.jours > 0) etiquetteVideo(pese('cafes', { n: d.cafes, jours: d.jours }), 1300, 140);
			},
			sous: () => t('video.burnout.0'),
		},
		{
			dessin: (u, d) => {
				const n = connu(d.renforts) ? Math.min(12, Math.max(1, d.renforts)) : 6;
				const partis = reduireAnimations ? n : Math.floor(u * (n + 1));
				const points = [];
				for (let i = 0; i < n; i++) points.push({ x: 420 + hasardVideo(i) * 1100, y: 220 + hasardVideo(i + 9) * 620, t: 22, c: i < partis ? '#ffb000' : '#d10b00' });
				decorCarte(u, { points, etat: etat('#5b6572') });
				for (let i = 0; i < n; i++) {
					noStroke();
					fill(i < partis ? '#3a3f46' : '#e9ecef');
					rect(420 + i * 90, 940 - 60, 70, 50);
				}
				if (connu(d.renforts) && d.decisions > 0) etiquetteVideo(pese('renforts', { n: d.renforts, total: d.decisions }), 1600, 140, 'droite');
			},
			sous: () => t('video.burnout.1'),
		},
		{
			dessin: (u) => {
				decorPiece(u, { nuit: true });
				const vibre = !reduireAnimations && Math.floor(millis() / 250) % 2 ? 3 : 0;
				noStroke();
				fill('#0b0c0f');
				rect(1180 + vibre, 760, 120, 200, 14);
				fill('#1d4f7a');
				rect(1190 + vibre, 772, 100, 176, 8);
				const e = { x: 1000, y: 300, l: 520, h: 300 };
				bulleVideo(e, 420, t('video.burnout.sms'), 'gauche', '#2a6f97');
			},
			sous: () => t('video.burnout.2'),
		},
	],
	imposteur: [
		{
			dessin: (u, d) => {
				decorCarte(u, { etat: etat('#1e9e4a') });
				const k = reduireAnimations ? 1 : easeOut(u);
				jaugeVideo(360, 220, 300, lerp(30, d.f || 80, k), t('jaugeCourt.fluidite'));
				jaugeVideo(360, 340, 300, lerp(30, d.rep || 80, k), t('jaugeCourt.reputation'));
				jaugeVideo(360, 460, 300, lerp(30, d.bu || 80, k), t('jaugeCourt.budget'));
				const rates = connu(d.decisions) && connu(d.bons) ? Math.min(8, Math.max(0, d.decisions - d.bons)) : 0;
				for (let i = 0; i < rates; i++) {
					noStroke();
					fill(13, 12, 12, 225);
					rect(1240, 220 + i * 70, 300, 56);
					fill('#ff6b5e');
					textFont(POLICE_TEXTE);
					textSize(30);
					textAlign(CENTER, CENTER);
					text('✗', 1270, 248 + i * 70);
					fill('#ffffff');
					rect(1300, 244 + i * 70, 200, 6);
				}
				if (connu(d.bons) && d.decisions > 0) etiquetteVideo(pese('bons', { n: d.bons, total: d.decisions }), 960, 820, 'centre');
			},
			sous: () => t('video.imposteur.0'),
		},
		{
			dessin: (u, d) => {
				decorPatron(u, { occupant: 'patron', applaudit: true, tampon: t('video.label.felicitations'), couleur: '#1e7a3c' });
				if (connu(d.score)) etiquetteVideo(pese('score', { s: d.score }), 1100, 650);
			},
			sous: () => t('video.imposteur.1'),
		},
		{
			dessin: (u) => {
				decorPiece(u, { voile: color(10, 14, 30, reduireAnimations ? 120 : 40 + u * 140) });
				silhouette(960, 1000, 11, 'camille', { carton: false });
				noStroke();
				fill('#fbf8f0');
				const k = reduireAnimations ? 0.5 : u;
				rect(1010, 760, lerp(120, 20, k), 90); // le bilan qu'on referme
			},
			sous: () => t('video.imposteur.2'),
		},
	],
	fauteuil: [
		{
			dessin: (u, d) => {
				const n = TRACES_RESEAU.length;
				const verts = reduireAnimations ? n : Math.floor(u * (n + 1) * 1.2);
				decorCarte(u, { lignes: d.lignes, etat: (i) => (i < verts ? '#1e9e4a' : '#5b6572') });
				if (connu(d.score)) etiquetteVideo(pese('score', { s: d.score }), 960, 830, 'centre');
			},
			sous: () => t('video.fauteuil.0'),
		},
		{
			dessin: (u, d) => {
				decorPatron(u, { occupant: 'patron', brasTendu: true, badge: true, carton: true });
				if (connu(d.bu)) etiquetteVideo(pese('budget', { b: d.bu }), 1100, 650);
			},
			sous: () => t('video.fauteuil.1'),
		},
		{ dessin: (u) => decorPatron(u, { occupant: 'joueur', lever: true }), sous: () => t('video.fauteuil.2') },
	],
	diplomate: [
		{
			dessin: (u, d) => {
				decorTelephone(u, (e) => {
					let y = e.y + 30;
					const signale = reduireAnimations || u > 0.45;
					y = bulleVideo(e, y, signale ? t('video.label.signale') : t('video.diplomate.haine'), 'gauche', signale ? '#3a3f46' : '#e9ecef');
					y = bulleVideo(e, y, t('video.diplomate.question'), 'gauche', '#e9ecef');
					if (reduireAnimations || u > 0.6) bulleVideo(e, y, t('video.diplomate.reponse'), 'droite', '#1e7a3c');
				});
				if (connu(d.quaiBonnes) && d.quaiRep > 0) etiquetteVideo(pese('quai', { n: d.quaiBonnes, total: d.quaiRep }), 1260, 300);
			},
			sous: () => t('video.diplomate.0'),
		},
		{
			dessin: (u, d) => {
				decorTelephone(u, (e) => {
					const n = connu(d.quaiBonnes) ? Math.min(8, Math.max(2, d.quaiBonnes)) : 4;
					for (let i = 0; i < n; i++) {
						const y = e.y + e.h - 90 - ((i * 86 + (reduireAnimations ? 0 : u * 260)) % (e.h - 90));
						noStroke();
						fill('#1e7a3c');
						rect(e.x + 30 + (i % 2) * 150, y, 270, 64, 14);
						fill('#ffffff');
						textFont(POLICE_TEXTE);
						textSize(24);
						textAlign(LEFT, CENTER);
						text('♥  ' + t('video.label.merci'), e.x + 50 + (i % 2) * 150, y + 32);
					}
				});
				if (d.quaiRep > 0) etiquetteVideo(t('video.label.reponsesQuai', { n: d.quaiRep }), 1260, 300);
			},
			sous: () => t('video.diplomate.1'),
		},
		{
			dessin: (u, d) => {
				decorPatron(u, { plaque: t('video.label.crise') });
				silhouette(560, 760, 9, 'joueur');
				if (connu(d.score)) etiquetteVideo(pese('score', { s: d.score }), 1100, 650);
			},
			sous: () => t('video.diplomate.2'),
		},
	],
	insoumis: [
		{
			dessin: (u, d) => {
				decorPiece(u);
				const n = connu(d.objectifsRates) ? Math.min(5, Math.max(1, d.objectifsRates)) : 2;
				const k = reduireAnimations ? 1 : (u * n) % 1;
				const i0 = reduireAnimations ? n - 1 : Math.min(n - 1, Math.floor(u * n));
				noStroke();
				fill('#3a3f46');
				rect(1400, 760, 140, 160); // corbeille
				fill('#2a2e34');
				rect(1390, 740, 160, 24);
				const x = lerp(700, 1420, easeOut(k));
				const y = lerp(380, 700, easeOut(k));
				fill('#fbf8f0');
				rect(x, y, 260, 120);
				fill('#b3261e');
				rect(x, y, 260, 30);
				fill('#1d1a16');
				textFont(POLICE_DONNEES);
				textSize(24);
				textAlign(LEFT, TOP);
				text(t('video.label.objectifDuJour'), x + 14, y + 40);
				text('#' + (i0 + 1), x + 14, y + 74);
				if (connu(d.objectifsRates) && d.objectifs > 0) etiquetteVideo(pese('objectifs', { n: d.objectifsRates, total: d.objectifs }), 260, 140);
			},
			sous: () => t('video.insoumis.0'),
		},
		{
			dessin: (u, d) => {
				const points = [];
				TRACES_RESEAU.forEach((tr, i) => {
					const k = ((reduireAnimations ? 0.4 : u * 2) + i * 0.17) % 1;
					const s = Math.min(tr.length - 2, Math.floor(k * (tr.length - 1)));
					const f = k * (tr.length - 1) - s;
					points.push({ x: lerp(tr[s][0], tr[s + 1][0], f), y: lerp(tr[s][1], tr[s + 1][1], f), t: 18, c: '#ffffff' });
				});
				decorCarte(u, { lignes: d.lignes, etat: etat('#1e9e4a'), points });
				if (connu(d.score)) etiquetteVideo(pese('score', { s: d.score }), 960, 830, 'centre');
			},
			sous: () => t('video.insoumis.1'),
		},
		{ dessin: (u) => decorAscenseur(u, { qui: 'patron', carton: true, etage: t('video.label.etageRdc') }), sous: () => t('video.insoumis.2') },
	],
	usagers: [
		{
			dessin: (u, d) => {
				decorQuai(u, { tram: 'entre', foule: 9, monter: true });
				if (connu(d.f) && connu(d.rep)) etiquetteVideo(pese('fluiditeReputation', { f: d.f, r: d.rep }), 960, 140, 'centre');
			},
			sous: () => t('video.usagers.0'),
		},
		{
			dessin: (u, d) => {
				decorPiece(u);
				const k = reduireAnimations ? 1 : easeOut(u);
				const fin = connu(d.bu) ? d.bu : 10;
				jaugeVideo(760, 220, 400, lerp(60, fin, k), t('jaugeCourt.budget'));
				const n = reduireAnimations ? 6 : Math.floor(u * 7);
				for (let i = 0; i < n; i++) {
					noStroke();
					fill('#fbf8f0');
					rect(1300 + hasardVideo(i) * 40, 860 - i * 22, 240, 120);
					fill('#5a5348');
					rect(1320 + hasardVideo(i) * 40, 880 - i * 22, 140, 6);
				}
				if (connu(d.bu)) etiquetteVideo(pese('budget', { b: d.bu }), 260, 140);
			},
			sous: () => t('video.usagers.1'),
		},
		{
			dessin: (u, d) => {
				const lu = lundiSuivant(d.lundi);
				decorLettre(u, { entete: t('video.label.directionFinanciere'), texte: lu ? t('video.usagers.lettre', { date: typeof jourDate === 'function' ? jourDate(lu) : lu }) : t('video.usagers.lettre.sans'), tampon: t('video.label.convocation'), couleur: COULEURS_TON.moyenne });
			},
			sous: () => t('video.usagers.2'),
		},
	],
	boucEmissaire: [
		{
			dessin: (u, d) => {
				decorVille('mauvaise', u, { pluie: connu(d.pluie) && d.pluie > 0, trams: 1 });
				if (connu(d.pluie) && connu(d.rafales) && (d.pluie || d.rafales)) etiquetteVideo(pese('meteo', { pluie: d.pluie, vent: d.rafales }), 960, 140, 'centre');
			},
			sous: () => t('video.boucEmissaire.0'),
		},
		{
			dessin: (u, d) => {
				const rouge = !reduireAnimations && u > 0.6;
				decorCarte(u, { etat: () => (rouge ? '#b3261e' : '#1e9e4a') });
				const n = connu(d.bons) ? Math.min(10, Math.max(1, d.bons)) : 5;
				const points = [];
				for (let i = 0; i < n; i++) points.push({ x: 420 + hasardVideo(i + 3) * 1100, y: 220 + hasardVideo(i + 20) * 620, t: 24, c: '#1e9e4a' });
				points.forEach((p) => (noStroke(), fill(p.c), rect(p.x - 12, p.y - 12, 24, 24)));
				if (connu(d.bons) && d.decisions > 0) etiquetteVideo(pese('bons', { n: d.bons, total: d.decisions }), 960, 830, 'centre');
			},
			sous: () => t('video.boucEmissaire.1'),
		},
		{
			dessin: (u) =>
				decorPatron(u, {
					postit: t('video.label.vous'),
					debout: [
						{ qui: 'direction', o: { brasTendu: true } },
						{ qui: 'patron', o: {} },
					].map((p, i) => Object.assign(p, { x: 1350 + i * 160 })),
				}),
			sous: () => t('video.boucEmissaire.2'),
		},
	],
	correcte: [
		{
			dessin: (u, d) => {
				const points = [];
				for (let i = 0; i < 8; i++) {
					const vie = ((reduireAnimations ? 0.3 : u * 2) + hasardVideo(i)) % 1;
					points.push({ x: 420 + hasardVideo(i + 7) * 1100, y: 220 + hasardVideo(i + 30) * 620, t: 22, c: vie < 0.5 ? '#ffb000' : '#3a3f46' });
				}
				decorCarte(u, { lignes: d.lignes, points });
				if (connu(d.dossiers)) etiquetteVideo(t('video.label.dossiers', { n: d.dossiers }), 960, 830, 'centre');
			},
			sous: () => t('video.correcte.0'),
		},
		{
			dessin: (u, d) => {
				decorPiece(u);
				const amp = reduireAnimations ? 0 : (1 - u) * 25;
				const osc = (k) => amp * Math.sin(u * 12 + k);
				jaugeVideo(760, 220, 400, (d.f || 50) + osc(0), t('jaugeCourt.fluidite'));
				jaugeVideo(760, 340, 400, (d.rep || 50) + osc(1), t('jaugeCourt.reputation'));
				jaugeVideo(760, 460, 400, (d.bu || 50) + osc(2), t('jaugeCourt.budget'));
			},
			sous: () => t('video.correcte.1'),
		},
		{
			dessin: (u, d) => {
				decorVille('soir', u, { tour: true, trams: 2 });
				if (connu(d.score)) etiquetteVideo(pese('score', { s: d.score }), 960, 140, 'centre');
			},
			sous: () => t('video.correcte.2'),
		},
	],
	reprimande: [
		{
			dessin: (u, d) => {
				const n = connu(d.nonTraites) ? Math.min(10, Math.max(1, d.nonTraites)) : 4;
				const points = [];
				const lent = reduireAnimations ? 1 : 0.7 + 0.3 * Math.sin(millis() / 500); // < 1 Hz, sans clignotement
				for (let i = 0; i < n; i++) points.push({ x: 420 + hasardVideo(i + 11) * 1100, y: 220 + hasardVideo(i + 40) * 620, t: 26, c: color(209, 11, 0, 255 * lent) });
				decorCarte(u, { points, etat: etat('#5b6572') });
				if (d.nonTraites > 0) etiquetteVideo(t('video.label.nonTraites', { n: d.nonTraites }), 960, 830, 'centre');
			},
			sous: () => t('video.reprimande.0'),
		},
		{
			dessin: (u, d) => {
				decorLettre(u, { entete: t('rapport.entete'), texte: t('fin.reprimande.texte'), surligne: [150, 226], tampon: t('video.label.aRevoir'), couleur: COULEURS_TON.mauvaise });
				if (connu(d.score)) etiquetteVideo(pese('score', { s: d.score }), 260, 140);
			},
			sous: () => t('video.reprimande.1'),
		},
		{ dessin: (u) => decorAscenseur(u, { porte: true, plaque: t('video.label.direction') }), sous: () => t('video.reprimande.2') },
	],
	licenciement: [
		{
			dessin: (u, d) => {
				decorCarte(u, { etat: etat('#5b6572') });
				noStroke();
				fill('#7d1a15');
				rect(300, 150, 1320, 50);
				const k = reduireAnimations ? 1 : easeOut(u);
				const v = connu(d.valeurBasse) ? d.valeurBasse : 0;
				jaugeVideo(660, 480, 600, lerp(40, v, k), d.jaugeBasse ? t('jaugeCourt.' + d.jaugeBasse) : '');
			},
			sous: (d) => (d.dateLic && d.heureLic ? t('video.licenciement.0', { date: jourVideo(d.dateLic), heure: d.heureLic }) : t('video.licenciement.0.sans')),
		},
		{
			dessin: (u, d) => decorLettre(u, { entete: t('video.label.direction'), texte: connu(d.avert) && d.avert > 0 ? t('video.licenciement.lettre', { n: d.avert }) : t('video.licenciement.lettre.sans'), tampon: t('video.label.licencie'), couleur: COULEURS_TON.mauvaise }),
			sous: (d) => (connu(d.avert) && d.avert > 0 ? t('video.licenciement.1', { n: d.avert }) : t('video.licenciement.1.sans')),
		},
		{ dessin: (u) => decorAscenseur(u, { qui: 'joueur', carton: true, etage: t('video.label.etageSortie') }), sous: () => t('video.licenciement.2') },
	],
	demission: [
		{
			dessin: (u, d) => {
				decorPiece(u);
				jaugeVideo(760, 220, 400, d.f || 0, t('jaugeCourt.fluidite'));
				jaugeVideo(760, 340, 400, d.rep || 0, t('jaugeCourt.reputation'));
				jaugeVideo(760, 460, 400, d.bu || 0, t('jaugeCourt.budget'));
				noStroke();
				fill('#fbf8f0');
				rect(1260, 640, 300, 300);
				fill('#1d1a16');
				const n = reduireAnimations ? 6 : Math.floor(u * 7);
				for (let i = 0; i < n; i++) rect(1290, 680 + i * 36, 200 + hasardVideo(i) * 40, 5);
			},
			sous: () => t('video.demission.0'),
		},
		{
			dessin: (u) => {
				decorPiece(u, { voile: color(10, 14, 30, 60) });
				const k = reduireAnimations ? 1 : easeOut(constrain(u / 0.5, 0, 1));
				noStroke();
				fill(0, 0, 0, 90);
				rect(866, lerp(560, 730, k) + 10, 200, 130);
				fill('#ffffff');
				rect(860, lerp(560, 730, k), 200, 130);
				fill('#3d5a80');
				rect(860, lerp(560, 730, k), 200, 34);
				fill('#d9a77a');
				rect(880, lerp(560, 730, k) + 50, 50, 60);
				fill('#5a5348');
				rect(946, lerp(560, 730, k) + 60, 90, 8);
				rect(946, lerp(560, 730, k) + 84, 70, 8);
			},
			sous: () => t('video.demission.1'),
		},
		{ dessin: (u) => decorQuai(u, { tram: 'passe', foule: 0, seul: true }), sous: () => t('video.demission.2') },
	],
};
