/* Nantes en régulation — le PC du bureau : démarrage et bureau d'un système FICTIF (« RégulOS »).
 * Fond d'écran ORIGINAL qui évoque l'esthétique bleue et lumineuse des bureaux d'ordinateur de la fin
 * des années 2000 (dégradé, traînées de lumière, bulles floues), pixelisé ; aucun logo ni visuel de
 * marque existant n'est reproduit. Tout est dessiné par le code (contenu 1920×1080 de l'écran du PC).
 */
const PC = { etat: 'eteint', debut: 0, selection: 0, fenetre: null, message: '' }; // etat : 'eteint' | 'demarrage' | 'os' | 'appli' ; fenetre : null | 'patron' | 'carte' | 'community' | 'journal'
const DUREE_DEMARRAGE = 3400;
let gFondOS = null;

function demarrerPC() {
	PC.etat = 'demarrage';
	PC.debut = millis();
	Confort.Son.bip('dossier');
}
function ouvrirAppli() {
	if (PC.etat !== 'os') return;
	PC.etat = 'appli';
	Confort.Son.bip('choix');
}
function fermerAppli() {
	if (PC.etat === 'appli') PC.etat = 'os';
}

/** Fond d'écran pixelisé (calculé une fois, 240×135 agrandi ×8) */
function fondOS() {
	if (gFondOS) return gFondOS;
	const g = createGraphics(240, 135);
	g.pixelDensity(1);
	g.noSmooth();
	g.noStroke();
	for (let y = 0; y < 135; y++)
		for (let x = 0; x < 240; x += 2) {
			const dx = (x - 150) / 240;
			const dy = (y - 50) / 135;
			const r = Math.sqrt(dx * dx * 1.4 + dy * dy);
			const t = Math.min(1, r * 1.6);
			g.fill(lerp(70, 8, t), lerp(170, 48, t), lerp(235, 118, t));
			g.rect(x, y, 2, 1);
		}
	// Traînées de lumière (courbes) et bulles floues
	for (let k = 0; k < 4; k++) {
		for (let x = 0; x < 240; x++) {
			const y = 78 + k * 7 - Math.sin((x / 240) * Math.PI) * (36 - k * 6) + Math.sin(x / 19 + k) * 2;
			g.fill(200, 240, 255, 70 - k * 12);
			g.rect(x, Math.round(y), 1, 2 + (k === 0 ? 1 : 0));
		}
	}
	[[60, 30, 10], [190, 24, 7], [120, 100, 12], [210, 90, 8], [30, 110, 6], [160, 60, 5]].forEach(([cx, cy, r]) => {
		for (let rr = r; rr > 0; rr -= 2) {
			g.fill(220, 245, 255, 18);
			for (let dy = -rr; dy <= rr; dy++) {
				const w = Math.floor(Math.sqrt(rr * rr - dy * dy));
				g.rect(cx - w, cy + dy, 2 * w + 1, 1);
			}
		}
	});
	gFondOS = g;
	return g;
}

/** Contenu de l'écran quand l'appli n'est pas ouverte (démarrage ou bureau du système) — Pixel Design System */
function dessinerOS() {
	if (PC.etat === 'eteint') {
		background('#050607');
		return;
	}
	if (PC.etat === 'demarrage') return dessinerDemarrage();
	drawingContext.imageSmoothingEnabled = false;
	image(fondOS(), 0, 0, L, H);
	drawingContext.imageSmoothingEnabled = true;
	// Icônes du bureau (2 colonnes) : libellé monospace, sélection en carré blanc 15 % + bordure (angles droits)
	ICONES_OS.forEach((ic, i) => {
		const x = 48 + Math.floor(i / 3) * 196;
		const y = 48 + (i % 3) * 196;
		const sel = PC.selection === i;
		const survol = mouseX >= x && mouseX <= x + 168 && mouseY >= y && mouseY <= y + 176;
		noStroke();
		if (sel || survol) {
			fill(DS.blanc15);
			rect(x, y, 168, 176);
			stroke(DS.blanc);
			strokeWeight(2);
			noFill();
			rect(x + 1, y + 1, 166, 174);
			noStroke();
		}
		ic.dessin(x + 44, y + 16, 1);
		fill(DS.noir50);
		textFont(DS.policeTexte);
		textSize(18);
		const tl = textWidth(ic.nom) + 12;
		rect(x + 84 - tl / 2, y + 116, tl, 30);
		dsTexte(ic.nom, x + 84, y + 120, 18, DS.blanc, 'center');
		boutons.push({ x, y, l: 168, h: 176, action: () => ouvrirIconeOS(i) });
		const b = badgeIcone(ic.cle);
		if (b) dsBadge(x + 140, y + 18, b, 'erreur');
	});
	// Fenêtre d'application ouverte (prompt 22)
	if (PC.fenetre) dessinerFenetreApp();
	// Barre des tâches : fond #0D0C0C, filet blanc 15 %, bouton « démarrer » rouge, applis épinglées, horloge
	noStroke();
	fill(DS.fond);
	rect(0, H - 64, L, 64);
	fill(DS.blanc15);
	rect(0, H - 64, L, 2);
	fill(DS.primaire);
	rect(8, H - 56, 120, 48);
	dsTitre('REGUL', 68, H - 48, 28, DS.blanc, 'center');
	ICONES_OS.slice(0, 5).forEach((ic, i) => {
		const x = 140 + i * 68;
		const actif = (ic.cle === 'regulation' && PC.etat === 'appli') || PC.fenetre === ic.cle;
		fill(actif ? DS.blanc15 : DS.blanc05);
		rect(x, H - 56, 60, 48);
		if (actif) {
			fill(DS.primaire);
			rect(x, H - 10, 60, 2);
		}
		ic.dessin(x + 10, H - 52, 0.5);
		boutons.push({ x, y: H - 56, l: 60, h: 48, action: () => ouvrirIconeOS(i) });
		const b = badgeIcone(ic.cle);
		if (b) dsBadge(x + 54, H - 54, b, 'erreur');
	});
	const hA = heureAffichee();
	dsTexte(String(hA.h).padStart(2, '0') + ':' + String(hA.m).padStart(2, '0'), L - 24, H - 46, 24, DS.blanc, 'right');
	if (Jeu.jauges && ecran === 'jeu') dsTexte(t('os.jauges', { b: Jeu.jauges.budget, r: Jeu.jauges.reputation, f: Jeu.jauges.fluidite }), L - 120, H - 44, 18, DS.blanc75, 'right');
	else dsTexte(t('os.aideClavier'), 500, H - 44, 18, DS.blanc50, 'left');
}

function dessinerDemarrage() {
	const tB = millis() - PC.debut;
	background(DS.fond);
	if (tB < 1200) {
		const lignes = [0, 1, 2, 3, 4].map((n) => t('os.bios.' + n));
		lignes.slice(0, 1 + Math.floor(tB / 220)).forEach((l, i) => dsTexte(l, 80, 80 + i * 44, 26, i === 0 ? DS.primaire : DS.blanc75, 'left'));
	} else if (tB < DUREE_DEMARRAGE - 500) {
		// Logo du système fictif (carré rouge, angles droits) + titre pixel + barre de progression
		const cx = L / 2;
		const cy = H / 2 - 80;
		noStroke();
		fill(DS.primaire);
		rect(cx - 64, cy - 64, 128, 128);
		fill(DS.blanc);
		rect(cx - 44, cy - 36, 88, 28);
		rect(cx - 40, cy - 4, 80, 12);
		rect(cx - 30, cy + 16, 16, 16);
		rect(cx + 14, cy + 16, 16, 16);
		fill(DS.primaire);
		rect(cx - 36, cy - 30, 30, 14);
		rect(cx + 6, cy - 30, 30, 14);
		dsTitre('RegulOS', cx, cy + 96, 56, DS.blanc, 'center');
		const p = constrain((tB - 1200) / (DUREE_DEMARRAGE - 1700), 0, 1);
		stroke(DS.blanc15);
		strokeWeight(2);
		noFill();
		rect(cx - 200, cy + 190, 400, 20);
		noStroke();
		fill(DS.primaire);
		const blocs = Math.floor(p * 24);
		for (let k = 0; k < blocs; k++) rect(cx - 196 + k * 16.4, cy + 194, 12, 12); // progression par blocs (pixel)
	} else {
		drawingContext.imageSmoothingEnabled = false;
		image(fondOS(), 0, 0, L, H);
		drawingContext.imageSmoothingEnabled = true;
		fill(DS.noir50);
		rect(L / 2 - 260, H / 2 - 60, 520, 120);
		dsTitre(t('os.bienvenue'), L / 2, H / 2 - 30, 56, DS.blanc, 'center');
	}
	if (tB >= DUREE_DEMARRAGE) PC.etat = 'os';
}

function iconeRegulation(x, y, s) {
	s = s || 1;
	push();
	translate(x, y);
	scale(s);
	noStroke();
	fill('#0e3b46');
	rect(0, 0, 80, 80, 12);
	fill('#f5efe3');
	rect(6, 6, 68, 68, 8);
	stroke('#1e7a3c');
	strokeWeight(6);
	line(14, 54, 66, 26);
	stroke('#b3261e');
	line(20, 20, 58, 64);
	noStroke();
	fill('#0e3b46');
	circle(40, 40, 16);
	pop();
}
function iconeCorbeille(x, y) {
	noStroke();
	fill('#cfd8e0');
	rect(x + 14, y + 16, 52, 62, 6);
	fill('#9aa8b6');
	rect(x + 8, y + 8, 64, 10, 4);
	fill('#7f8c99');
	for (let k = 0; k < 3; k++) rect(x + 24 + k * 12, y + 26, 4, 44, 2);
}

/** Barre de titre de l'appli (Pixel Design System) : titre pixel + bouton fermer carré → retour au bureau du système */
function dessinerFermerAppli() {
	noStroke();
	fill(DS.fond);
	rect(0, 0, L, 34);
	fill(DS.blanc15);
	rect(0, 34, L, 2);
	dsTitre(t('os.barreTitre'), 16, 6, 24, DS.blanc, 'left');
	dsTexte(t('os.poste'), L / 2, 8, 16, DS.blanc50, 'center');
	const x = L - 46;
	const y = 3;
	const survol = mouseX >= x && mouseX <= x + 40 && mouseY >= y && mouseY <= y + 28;
	fill(survol ? DS.primaire : DS.fond);
	rect(x, y, 40, 28);
	stroke(survol ? DS.primaire : DS.blanc);
	strokeWeight(2);
	noFill();
	rect(x + 1, y + 1, 38, 26);
	stroke(DS.blanc);
	strokeWeight(3);
	line(x + 14, y + 8, x + 26, y + 20);
	line(x + 26, y + 8, x + 14, y + 20);
	noStroke();
	boutons.push({ x, y, l: 40, h: 28, action: fermerAppli });
}

// =====================================================================
// Prompt 22 — applications du poste de travail (fenêtres RégulOS, Pixel Design System)
// Le temps ne s'arrête pas pendant la lecture d'une app (comme les livres du prompt 20).
// =====================================================================
const ICONES_OS = [
	{ cle: 'regulation', nom: T('app.regulation'), dessin: (x, y, s) => iconeRegulation(x, y, s || 1) },
	{ cle: 'patron', nom: T('app.patron'), dessin: (x, y, s) => iconePixel(x, y, s, 'enveloppe') },
	{ cle: 'carte', nom: T('app.carte'), dessin: (x, y, s) => iconePixel(x, y, s, 'carte') },
	{ cle: 'community', nom: T('app.community'), dessin: (x, y, s) => iconePixel(x, y, s, 'bulle') },
	{ cle: 'journal', nom: T('app.journal'), dessin: (x, y, s) => iconePixel(x, y, s, 'livre') },
	{ cle: 'corbeille', nom: T('app.corbeille'), dessin: (x, y) => iconeCorbeille(x, y) },
];

function ouvrirIconeOS(i) {
	PC.selection = i;
	const cle = ICONES_OS[i].cle;
	if (cle === 'regulation') return ouvrirAppli();
	if (cle === 'corbeille') return;
	if (PC.etat === 'appli') PC.etat = 'os';
	PC.fenetre = PC.fenetre === cle ? null : cle; // re-cliquer l'icône active referme l'app
	PC.message = '';
	if (PC.fenetre && Jeu.nonLus && Jeu.nonLus[cle] !== undefined) Jeu.nonLus[cle] = 0;
	Confort.Son.bip('choix');
}
function fermerFenetreApp() {
	PC.fenetre = null;
}
function badgeIcone(cle) {
	if (cle === 'regulation') return typeof incidentActif === 'function' && (incidentActif() || phase === 'mail') ? '!' : '';
	if (!Jeu.nonLus) return '';
	if (cle === 'carte') return typeof incidentActif === 'function' && incidentActif() && !Jeu.equipePour(Jeu.index) ? '1' : '';
	return Jeu.nonLus[cle] ? String(Jeu.nonLus[cle]) : '';
}

/** Icônes 80×80 en pixels (rectangles, angles droits), dessinées par le code */
function iconePixel(x, y, s, type) {
	s = s || 1;
	push();
	translate(x, y);
	scale(s);
	noStroke();
	fill(DS.fond);
	rect(0, 0, 80, 80);
	stroke(DS.blanc15);
	strokeWeight(2);
	noFill();
	rect(1, 1, 78, 78);
	noStroke();
	if (type === 'enveloppe') {
		fill(DS.blanc);
		rect(12, 22, 56, 38);
		fill(DS.primaire);
		for (let k = 0; k < 7; k++) rect(16 + k * 4, 26 + k * 3, 4, 4), rect(60 - k * 4, 26 + k * 3, 4, 4);
	} else if (type === 'carte') {
		fill('#2b3a4a');
		rect(10, 10, 60, 60);
		fill(DS.info);
		rect(10, 40, 60, 8); // la Loire
		fill(DS.blanc50);
		rect(36, 10, 4, 60);
		rect(10, 24, 60, 3);
		fill(DS.primaire);
		rect(22, 28, 10, 10);
		rect(50, 52, 8, 8);
	} else if (type === 'bulle') {
		fill(DS.blanc);
		rect(10, 14, 60, 38);
		rect(20, 52, 10, 10);
		fill(DS.fond);
		for (let k = 0; k < 3; k++) rect(20, 22 + k * 9, 40 - k * 10, 4);
	} else if (type === 'livre') {
		fill(DS.primaire);
		rect(12, 14, 26, 52);
		rect(42, 14, 26, 52);
		fill(DS.blanc);
		rect(16, 18, 18, 44);
		rect(46, 18, 18, 44);
		fill(DS.fond);
		for (let k = 0; k < 4; k++) rect(18, 24 + k * 9, 14, 2), rect(48, 24 + k * 9, 14, 2);
	}
	pop();
}

const FENETRE_APP = { x: 440, y: 56, l: 1440, h: 900 };
const TITRES_APPS = { patron: T('app.titre.patron'), carte: T('app.titre.carte'), community: T('app.titre.community'), journal: T('app.titre.journal') };

function dessinerFenetreApp() {
	const f = FENETRE_APP;
	dsPanneau(f.x, f.y, f.l, f.h, TITRES_APPS[PC.fenetre]);
	// Croix de fermeture (carré, angles droits)
	const cx = f.x + f.l - 52;
	const cy = f.y + 12;
	const survol = mouseX >= cx && mouseX <= cx + 36 && mouseY >= cy && mouseY <= cy + 36;
	noStroke();
	fill(survol ? DS.primaire : DS.fond);
	rect(cx, cy, 36, 36);
	stroke(DS.blanc);
	strokeWeight(3);
	line(cx + 11, cy + 11, cx + 25, cy + 25);
	line(cx + 25, cy + 11, cx + 11, cy + 25);
	noStroke();
	boutons.push({ x: cx, y: cy, l: 36, h: 36, action: fermerFenetreApp });
	if (Jeu.nonLus && Jeu.nonLus[PC.fenetre] !== undefined) Jeu.nonLus[PC.fenetre] = 0; // lu
	const zone = { x: f.x + 24, y: f.y + 76, l: f.l - 48, h: f.h - 170 };
	if (!Jeu.paquet || ecran !== 'jeu') dsTexte(t('app.aucunePartie'), zone.x, zone.y, 22, DS.blanc75, 'left', zone.l);
	else if (PC.fenetre === 'patron') appPatron(zone);
	else if (PC.fenetre === 'community') appCommunity(zone);
	else if (PC.fenetre === 'journal') appJournal(zone);
	else if (PC.fenetre === 'carte') appCarte(zone);
	dsBouton(f.x + f.l - 260, f.y + f.h - 80, 236, 56, t('commun.fermer'), fermerFenetreApp, 'contour');
}

function derniers(liste, n) {
	return liste.slice(Math.max(0, liste.length - n));
}

function appPatron(z) {
	if (Jeu.modificateurActif && Jeu.modificateurActif() === 'panne_messagerie') {
		// Prompt 23 : panne de la messagerie — les messages arriveront à la fin de la panne
		dsBadge(z.x + 80, z.y + 20, t('app.horsLigne'), 'erreur');
		dsTexte(t('app.panne', { s: Math.ceil((Jeu.modificateur.fin - millis()) / 1000) }), z.x, z.y + 60, 22, DS.blanc75, 'left', z.l - 40);
		return;
	}
	// Fil de bulles façon SMS (même esprit que l'intro du prompt 20), aux couleurs du design system
	let y = z.y;
	derniers(Jeu.messagesPatron, 9).forEach((m) => {
		textFont(DS.policeTexte);
		textSize(20);
		const lmax = z.l - 260;
		const lignes = Math.ceil(textWidth(m.texte) / (lmax - 32)) || 1;
		const h = 24 + lignes * 28;
		noStroke();
		fill(DS.blanc05);
		rect(z.x, y, Math.min(lmax, textWidth(m.texte) + 32), h);
		fill(DS.primaire);
		rect(z.x, y, 4, h);
		dsTexte(m.texte, z.x + 18, y + 12, 20, DS.blanc, 'left', lmax - 32);
		dsTexte(m.heure, z.x + z.l - 10, y + 12, 18, DS.blanc50, 'right');
		y += h + 12;
	});
	if (!Jeu.messagesPatron.length) dsTexte(t('app.pasMessage'), z.x, z.y, 20, DS.blanc50, 'left');
}

function appCommunity(z) {
	let y = z.y;
	dsTexte(t('app.reputation', { r: Jeu.jauges.reputation }), z.x, y, 20, DS.blanc75, 'left');
	y += 44;
	derniers(Jeu.commentaires, 8)
		.reverse()
		.forEach((c) => {
			noStroke();
			fill(DS.blanc05);
			rect(z.x, y, z.l, 76);
			stroke(DS.blanc15);
			strokeWeight(2);
			noFill();
			rect(z.x + 1, y + 1, z.l - 2, 74);
			noStroke();
			dsTexte(c.auteur + ' · ' + c.heure, z.x + 16, y + 10, 18, DS.blanc50, 'left');
			dsTexte(c.texte, z.x + 16, y + 38, 20, DS.blanc, 'left', z.l - 160);
			dsBadge(z.x + z.l - 60, y + 38, t('app.rep', { d: (c.delta > 0 ? '+' : '') + c.delta }), c.delta > 0 ? 'succes' : 'erreur');
			y += 88;
		});
	if (!Jeu.commentaires.length) dsTexte(t('app.aucunCommentaire'), z.x, y, 20, DS.blanc50, 'left');
}

function appJournal(z) {
	const j = Jeu.jourCourant();
	let y = z.y;
	dsTitre(t('app.journee', { date: j ? j.date.split('-').reverse().join('/') : '' }), z.x, y, 24, DS.blanc, 'left');
	y += 50;
	const lignes = (Jeu.evenementsJournee || []).filter((e) => j && e.jour === j.date).map((e) => ({ t: Jeu.ligneMail(e), ok: Jeu.evaluer(e) === 'bon' }));
	(Jeu.equipes || [])
		.filter((q) => j && q.jour === j.date)
		.forEach((q) => lignes.push({ t: T('app.equipeEnvoyee', { heure: q.heure, nom: q.nom, sujet: q.sujet, cout: q.cout, etat: q.arrivee_sim ? T('app.arrivee', { h: q.arrivee_sim }) : T('app.enRoute') }), ok: true, equipe: true }));
	if (!lignes.length) dsTexte(t('app.rien'), z.x, y, 20, DS.blanc50, 'left');
	lignes.forEach((l) => {
		noStroke();
		fill(l.equipe ? DS.info : l.ok ? DS.succes : DS.primaire);
		rect(z.x, y + 4, 6, 22);
		dsTexte(l.t, z.x + 18, y, 19, DS.blanc, 'left', z.l - 30);
		textFont(DS.policeTexte);
		textSize(19);
		y += textWidth(l.t) > z.l - 40 ? 60 : 36;
	});
}

// ——— Carte : position d'une ligne = centre réel de son tracé (data/lignes.json) ———
const cacheCentres = new Map();
function centreLigne(nom) {
	if (cacheCentres.has(nom)) return cacheCentres.get(nom);
	const l = Jeu.lignes && Jeu.lignes.lignes.find((x) => x.nom === nom);
	let c = null;
	if (l) {
		let sx = 0;
		let sy = 0;
		let n = 0;
		l.traces.forEach((t) => t.forEach((p) => ((sx += p[0]), (sy += p[1]), n++)));
		c = [sx / n, sy / n];
	}
	cacheCentres.set(nom, c);
	return c;
}

function appCarte(z) {
	const carte = { x: z.x, y: z.y, l: 900, h: z.h };
	noStroke();
	fill('#121a22');
	rect(carte.x, carte.y, carte.l, carte.h);
	const pr = projeter(carte);
	if (Jeu.lignes) {
		noStroke();
		fill(56, 96, 255, 90); // eau (info du design system, atténuée)
		Jeu.lignes.eau.forEach((a) => {
			beginShape();
			a.forEach((p) => vertex(pr.x(p[0]), pr.y(p[1])));
			endShape(CLOSE);
		});
		noFill();
		stroke(255, 255, 255, 38);
		strokeWeight(1.5);
		Jeu.lignes.lignes.forEach((l) =>
			l.traces.forEach((t) => {
				beginShape();
				t.forEach((p) => vertex(pr.x(p[0]), pr.y(p[1])));
				endShape();
			}),
		);
		noStroke();
	}
	// Incident actif (un seul à la fois) et équipes en route
	const actif = typeof incidentActif === 'function' && incidentActif() ? Jeu.dossierCourant() : null;
	const pos = (d) => {
		const c = d && d.lignes && d.lignes.length ? centreLigne(d.lignes[0]) : null;
		return c ? { x: pr.x(c[0]), y: pr.y(c[1]), libre: false } : { x: carte.x + carte.l / 2, y: carte.y + carte.h / 2, libre: true };
	};
	(Jeu.equipes || []).forEach((q) => {
		const p = pos(Jeu.paquet[q.index]);
		fill(q.arrivee_sim ? DS.succes : DS.info);
		rect(p.x + 14, p.y - 8, 16, 16);
		const reste = Math.max(0, Math.ceil((q.arrivee - millis()) / 1000));
		if (!q.arrivee_sim) dsTexte(q.nom + ' · ' + reste + ' s', p.x + 34, p.y - 10, 16, DS.infoClair, 'left');
	});
	const panneauX = carte.x + carte.l + 24;
	const panneauL = z.l - carte.l - 24;
	if (actif) {
		const p = pos(actif);
		const k = typeof pulsationRouge === 'function' ? pulsationRouge() : 1;
		fill(212, 3, 28, 255 * k);
		rect(p.x - 10, p.y - 10, 20, 20);
		noFill();
		stroke(DS.primaire);
		strokeWeight(2);
		rect(p.x - 18, p.y - 18, 36, 36);
		noStroke();
		dsTexte(p.libre ? t('carte.lieuInconnu') : t('dossier.ligne', { lignes: actif.lignes.join(', ') }), p.x + 24, p.y + 14, 16, DS.blanc, 'left');
		// Panneau latéral : incident + équipes
		dsTitre(t('carte.incident'), panneauX, z.y, 24, DS.blanc, 'left');
		dsTexte((actif.lignes && actif.lignes.length ? t('dossier.ligne', { lignes: actif.lignes.join(', ') }) + ' · ' : '') + actif.nature + (actif.retard !== null && actif.retard !== undefined ? ' · +' + actif.retard + ' min' : ''), panneauX, z.y + 44, 19, DS.blanc75, 'left', panneauL);
		dsTexte(t('carte.budget', { b: Jeu.jauges.budget }), panneauX, z.y + 104, 19, DS.alerte, 'left');
		const dejaEnvoyee = Jeu.equipePour(Jeu.index);
		Object.keys(Jeu.EQUIPES).forEach((cle, i) => {
			const q = Jeu.EQUIPES[cle];
			const effets = Object.keys(q.effets).map((k2) => Jeu.LIBELLES_JAUGES[k2] + ' +' + q.effets[k2]).join(', ');
			const verrou = q.palier && Jeu.jauges.budget < q.palier;
			const desactive = !!dejaEnvoyee || Jeu.jauges.budget < q.cout || verrou;
			dsBouton(panneauX, z.y + 150 + i * 92, panneauL, 64, i + 1 + ' · ' + q.nom + ' (−' + q.cout + ')' + (verrou ? t('carte.palier', { p: q.palier }) : ''), () => envoyerEquipeCarte(cle), i === 0 ? 'primaire' : 'secondaire', desactive);
			dsTexte(effets, panneauX, z.y + 218 + i * 92, 15, DS.blanc50, 'left');
		});
		if (dejaEnvoyee) dsTexte(t('carte.deja', { nom: dejaEnvoyee.nom }), panneauX, z.y + 530, 18, DS.infoClair, 'left', panneauL);
	} else {
		dsTitre(t('carte.aucun'), panneauX, z.y, 24, DS.blanc, 'left');
		dsTexte(t('carte.explication'), panneauX, z.y + 44, 19, DS.blanc50, 'left', panneauL);
		// Dernier incident résolu : y envoyer une équipe est possible, mais inutile (malus, prompt 23 § 4)
		const dernier = Jeu.index > 0 ? Jeu.paquet[Jeu.index - 1] : null;
		if (dernier && !Jeu.equipePour(Jeu.index - 1)) {
			dsTexte(t('carte.dernier', { quoi: dernier.lignes && dernier.lignes.length ? t('carte.ligneMin', { lignes: dernier.lignes.join(', ') }) : dernier.nature }), panneauX, z.y + 130, 18, DS.blanc75, 'left', panneauL);
			Object.keys(Jeu.EQUIPES).forEach((cle, i) => {
				const q = Jeu.EQUIPES[cle];
				dsBouton(panneauX, z.y + 190 + i * 76, panneauL, 56, i + 1 + ' · ' + q.nom + ' (−' + q.cout + ')', () => envoyerEquipeCarte(cle, Jeu.index - 1), 'contour', Jeu.jauges.budget < q.cout || (q.palier && Jeu.jauges.budget < q.palier));
			});
		}
	}
	if (PC.message) dsTexte(PC.message, panneauX, z.y + z.h - 60, 18, PC.messageOk ? DS.succesClair : DS.erreurClair, 'left', panneauL);
}

function envoyerEquipeCarte(cle, index) {
	const actif = typeof incidentActif === 'function' && incidentActif();
	if (index === undefined) {
		if (!actif) return;
		index = Jeu.index;
	}
	const r = Jeu.envoyerEquipe(index, cle, millis());
	PC.message = r.message;
	PC.messageOk = r.ok;
	Confort.Son.bip(r.ok ? 'action' : 'alerte');
}
