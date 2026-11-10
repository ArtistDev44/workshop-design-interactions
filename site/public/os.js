/* Nantes en régulation — le PC du bureau : démarrage et bureau d'un système FICTIF (« RégulOS »).
 * Fond d'écran ORIGINAL qui évoque l'esthétique bleue et lumineuse des bureaux d'ordinateur de la fin
 * des années 2000 (dégradé, traînées de lumière, bulles floues), pixelisé ; aucun logo ni visuel de
 * marque existant n'est reproduit. Tout est dessiné par le code (contenu 1920×1080 de l'écran du PC).
 */
const PC = { etat: 'eteint', debut: 0, selection: 0 }; // 'eteint' | 'demarrage' | 'os' | 'appli'
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
	// Icônes du bureau : libellé monospace, sélection en carré blanc 15 % + bordure (angles droits)
	const icones = [
		{ nom: 'Régulation Nantes', dessin: iconeRegulation },
		{ nom: 'Corbeille', dessin: iconeCorbeille },
	];
	icones.forEach((ic, i) => {
		const x = 48;
		const y = 48 + i * 196;
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
		ic.dessin(x + 44, y + 16);
		fill(DS.noir50);
		textFont(DS.policeTexte);
		textSize(18);
		const tl = textWidth(ic.nom) + 12;
		rect(x + 84 - tl / 2, y + 116, tl, 30);
		dsTexte(ic.nom, x + 84, y + 120, 18, DS.blanc, 'center');
		boutons.push({ x, y, l: 168, h: 176, action: i === 0 ? ouvrirAppli : () => (PC.selection = i) });
		if (i === 0 && typeof incidentActif === 'function' && (incidentActif() || phase === 'mail')) dsBadge(x + 136, y + 18, '!', 'erreur');
	});
	// Barre des tâches : fond #0D0C0C, filet blanc 15 %, bouton « démarrer » rouge, appli épinglée, horloge
	noStroke();
	fill(DS.fond);
	rect(0, H - 64, L, 64);
	fill(DS.blanc15);
	rect(0, H - 64, L, 2);
	fill(DS.primaire);
	rect(8, H - 56, 120, 48);
	dsTitre('REGUL', 68, H - 48, 28, DS.blanc, 'center');
	fill(PC.etat === 'appli' ? DS.blanc15 : DS.blanc05);
	rect(140, H - 56, 60, 48);
	iconeRegulation(150, H - 52, 0.5);
	const hA = heureAffichee();
	dsTexte(String(hA.h).padStart(2, '0') + ':' + String(hA.m).padStart(2, '0'), L - 24, H - 46, 24, DS.blanc, 'right');
	dsTexte('Cliquez sur « Régulation Nantes » pour ouvrir l’application (Entrée)', 224, H - 44, 18, DS.blanc50, 'left');
}

function dessinerDemarrage() {
	const t = millis() - PC.debut;
	background(DS.fond);
	if (t < 1200) {
		const lignes = ['REGUL-BIOS v1.07 — Poste de régulation n°3', 'Processeur ........ OK', 'Mémoire 4096 Mo ... OK', 'Réseau salle ...... OK', 'Démarrage du système…'];
		lignes.slice(0, 1 + Math.floor(t / 220)).forEach((l, i) => dsTexte(l, 80, 80 + i * 44, 26, i === 0 ? DS.primaire : DS.blanc75, 'left'));
	} else if (t < DUREE_DEMARRAGE - 500) {
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
		const p = constrain((t - 1200) / (DUREE_DEMARRAGE - 1700), 0, 1);
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
		dsTitre('BIENVENUE', L / 2, H / 2 - 30, 56, DS.blanc, 'center');
	}
	if (t >= DUREE_DEMARRAGE) PC.etat = 'os';
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
	dsTitre('REGULATION NANTES', 16, 6, 24, DS.blanc, 'left');
	dsTexte('RégulOS · poste 3', L / 2, 8, 16, DS.blanc50, 'center');
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
