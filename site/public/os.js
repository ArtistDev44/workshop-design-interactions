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

/** Contenu de l'écran quand l'appli n'est pas ouverte (démarrage ou bureau du système) */
function dessinerOS() {
	if (PC.etat === 'eteint') {
		background('#050607');
		return;
	}
	if (PC.etat === 'demarrage') return dessinerDemarrage();
	// Bureau du système
	drawingContext.imageSmoothingEnabled = false;
	image(fondOS(), 0, 0, L, H);
	drawingContext.imageSmoothingEnabled = true;
	// Icônes du bureau
	const icones = [
		{ nom: 'Régulation Nantes', action: ouvrirAppli, dessin: iconeRegulation },
		{ nom: 'Corbeille', action: () => {}, dessin: iconeCorbeille },
	];
	icones.forEach((ic, i) => {
		const x = 60;
		const y = 60 + i * 190;
		const sel = PC.selection === i;
		const survol = mouseX >= x && mouseX <= x + 150 && mouseY >= y && mouseY <= y + 170;
		noStroke();
		if (sel || survol) {
			fill(255, 255, 255, sel ? 60 : 35);
			stroke(255, 255, 255, 120);
			strokeWeight(2);
			rect(x, y, 150, 170, 6);
			noStroke();
		}
		ic.dessin(x + 35, y + 16);
		textFont(POLICE_TEXTE);
		textSize(20);
		textAlign(CENTER, TOP);
		fill(0, 0, 0, 140);
		text(ic.nom, x + 76, y + 122, 150, 50);
		fill('#ffffff');
		text(ic.nom, x + 75, y + 121, 150, 50);
		boutons.push({ x, y, l: 150, h: 170, action: i === 0 ? ouvrirAppli : () => (PC.selection = i) });
		// Pastille : incidents en attente dans l'appli
		if (i === 0 && typeof incidentActif === 'function' && (incidentActif() || phase === 'mail')) {
			fill('#b3261e');
			circle(x + 120, y + 22, 34);
			fill('#ffffff');
			textAlign(CENTER, CENTER);
			textStyle(BOLD);
			text('!', x + 120, y + 22);
			textStyle(NORMAL);
		}
	});
	// Barre des tâches (verre sombre), bouton rond, appli épinglée, horloge
	fill(10, 24, 40, 200);
	rect(0, H - 64, L, 64);
	fill(255, 255, 255, 30);
	rect(0, H - 64, L, 2);
	fill('#2f8fd8');
	circle(46, H - 32, 48);
	fill(255, 255, 255, 120);
	circle(40, H - 40, 18);
	fill(255, 255, 255, PC.etat === 'appli' ? 60 : 30);
	rect(96, H - 58, 64, 52, 6);
	iconeRegulation(104, H - 54, 0.4);
	const hA = heureAffichee();
	fill('#ffffff');
	textFont(POLICE_DONNEES);
	textSize(22);
	textAlign(RIGHT, CENTER);
	text(String(hA.h).padStart(2, '0') + ':' + String(hA.m).padStart(2, '0'), L - 30, H - 32);
	textAlign(LEFT, CENTER);
	textSize(18);
	fill(255, 255, 255, 200);
	text('Cliquez sur « Régulation Nantes » pour ouvrir l’application (Entrée)', 200, H - 32);
}

function dessinerDemarrage() {
	const t = millis() - PC.debut;
	background('#050607');
	if (t < 1200) {
		// Écran de démarrage texte (style BIOS)
		textFont(POLICE_DONNEES);
		textSize(26);
		textAlign(LEFT, TOP);
		fill('#c9d2db');
		const lignes = ['REGUL-BIOS v1.07  —  Poste de régulation n°3', 'Processeur ........ OK', 'Mémoire 4096 Mo ... OK', 'Réseau salle ...... OK', 'Démarrage du système…'];
		lignes.slice(0, 1 + Math.floor(t / 220)).forEach((l, i) => text(l, 80, 80 + i * 44));
	} else if (t < DUREE_DEMARRAGE - 500) {
		// Logo du système fictif + barre de chargement
		noStroke();
		const cx = L / 2;
		const cy = H / 2 - 60;
		fill('#2f8fd8');
		rect(cx - 70, cy - 70, 140, 140, 28);
		fill('#ffffff');
		rect(cx - 44, cy - 10, 88, 20, 6); // rail
		circle(cx - 26, cy + 34, 22);
		circle(cx + 26, cy + 34, 22);
		rect(cx - 50, cy - 46, 100, 30, 8); // tram
		fill('#2f8fd8');
		rect(cx - 40, cy - 40, 30, 16, 3);
		rect(cx + 10, cy - 40, 30, 16, 3);
		fill('#e8eef3');
		textFont(POLICE_TEXTE);
		textSize(40);
		textAlign(CENTER, TOP);
		text('RégulOS', cx, cy + 100);
		const p = (t - 1200) / (DUREE_DEMARRAGE - 1700);
		fill(255, 255, 255, 40);
		rect(cx - 160, cy + 180, 320, 10, 5);
		fill('#7fc4ff');
		const k = reduireAnimations ? constrain(p, 0, 1) : (p * 3) % 1;
		rect(cx - 160 + (reduireAnimations ? 0 : k * 260), cy + 180, reduireAnimations ? 320 * k : 60, 10, 5);
	} else {
		drawingContext.imageSmoothingEnabled = false;
		image(fondOS(), 0, 0, L, H);
		drawingContext.imageSmoothingEnabled = true;
		fill('#ffffff');
		textFont(POLICE_TEXTE);
		textSize(48);
		textAlign(CENTER, CENTER);
		text('Bienvenue', L / 2, H / 2);
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

/** Petite croix (en haut à droite de l'appli) pour revenir au bureau du système */
function dessinerFermerAppli() {
	const x = L - 46;
	const y = 6;
	const survol = mouseX >= x && mouseX <= x + 38 && mouseY >= y && mouseY <= y + 28;
	noStroke();
	fill(survol ? '#b3261e' : 'rgba(28,39,51,0.75)');
	rect(x, y, 38, 28, 4);
	stroke('#ffffff');
	strokeWeight(3);
	line(x + 13, y + 8, x + 25, y + 20);
	line(x + 25, y + 8, x + 13, y + 20);
	noStroke();
	boutons.push({ x, y, l: 38, h: 28, action: fermerAppli });
}
