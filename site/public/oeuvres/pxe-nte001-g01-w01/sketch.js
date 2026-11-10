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

const reduireAnimations = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
	const c = createCanvas(L, H);
	c.parent('scene');
	pixelDensity(1);
	randomSeed(Jeu.fallback ? Jeu.fallback.seed : 1001);
	for (let i = 0; i < 140; i++) gouttes.push({ x: random(), y: random(), v: random(0.6, 1.2) });
	Jeu.verifierConnexion(); // indicateur « mode hors ligne » + météo du jour pour le décor de l'accueil
}

// ——— Options de l'accueil : les 3 semaines réelles (Q14) + le mode « aujourd'hui » (prompt 14) ———
function optionsAccueil() {
	const opts = Jeu.semainesProposees().map((s) => ({
		type: 'semaine',
		lundi: s.lundi,
		titre: 'Semaine du ' + dateLongue(s.lundi) + ' au ' + dateLongue(s.dimanche),
		detail: s.niveau + ' · compteur ' + s.compteur_s + ' s',
		info: s.dossiers + ' dossier(s) d’archive · ' + s.evenements + ' événement(s) agenda',
	}));
	opts.push({
		type: 'direct',
		titre: 'Aujourd’hui, en temps réel',
		detail: Jeu.enLigne === false ? 'indisponible hors ligne' : 'flux GTFS-RT Naolib',
		info: 'Retards réels ≥ 10 min mesurés maintenant',
		desactive: Jeu.enLigne === false,
	});
	return opts;
}

function draw() {
	boutons = [];
	background(C.fond);
	if (ecran === 'accueil') dessinerAccueil();
	else dessinerJeu();
}

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
	text('Nantes en régulation', L / 2, 90);
	textStyle(NORMAL);
	textSize(28);
	fill(C.accent);
	text('Salle de contrôle des transports nantais — rejouez une semaine réelle du réseau', L / 2, 200);

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
		boutons.push({ x: x0, y, l: lp, h, action: () => (choixAccueil = i) });
		y += h + 14;
	});

	// Bouton Jouer
	const bl = 320;
	bouton((L - bl) / 2, y + 24, bl, 76, 'Jouer', lancerPartie, opts[choixAccueil] && opts[choixAccueil].desactive);

	// Indicateur « mode hors ligne » (Q34) : discret, gris, monospace
	textFont(POLICE_DONNEES);
	textSize(20);
	textAlign(CENTER, BOTTOM);
	fill(C.gris);
	const statut = Jeu.enLigne === null ? 'vérification de la connexion…' : Jeu.enLigne ? '' : 'mode hors ligne — semaines enregistrées disponibles';
	text(statut, L / 2, H - 70);
	textSize(16);
	text('↑ ↓ choisir · Entrée jouer — sources : Open Data Nantes Métropole, Open-Meteo', L / 2, H - 36);
}

function lancerPartie() {
	const o = optionsAccueil()[choixAccueil];
	if (!o || o.desactive) return;
	const p = o.type === 'direct' ? Jeu.chargerDirect() : Jeu.chargerSemaine(o.lundi);
	p.then(() => {
		Jeu.nouvellePartie();
		ecran = 'jeu';
		nouveauDossier();
	});
}

function nouveauDossier() {
	arriveeDossier = millis();
	debutCompteur = millis();
	sourceChoisie = null;
	if (Jeu.terminee) phase = 'fin';
	else if (Jeu.conflit()) phase = 'conflit';
	else if (Jeu.dossierCourant().contradiction) phase = 'contradiction';
	else phase = 'decision';
}

/* Décision du joueur (ou compteur à 0 → 'temps', Q25) */
function decider(action) {
	if (phase !== 'decision' && !(action === 'temps' && phase === 'contradiction')) return;
	dernierResultat = Jeu.decider(action, sourceChoisie);
	if (!dernierResultat) return;
	phase = 'narration';
	debutNarration = millis();
}

function continuer() {
	if (phase === 'narration') nouveauDossier();
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

function dessinerJeu() {
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
	text('Réseau Naolib', GAUCHE.x + 24, GAUCHE.y + 22);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(20);
	fill(C.gris);
	text(enteteMode(), GAUCHE.x + 260, GAUCHE.y + 30);
	if (Jeu.etat.horsLigne) {
		textAlign(RIGHT, TOP);
		text('mode hors ligne', GAUCHE.x + GAUCHE.l - 24, GAUCHE.y + 30);
	}

	dessinerDecor(CARTE, meteo, 1, true);
	dessinerLignesEtat(CARTE, d);
	dessinerListeLignes(LISTE, d);

	// Panneau droit : jauges, puis selon la phase : conflit, dossier (avec contradiction) ou narration
	dessinerJauges();
	if (phase === 'narration') dessinerNarration();
	else if (phase === 'fin') dessinerFinProvisoire();
	else if (phase === 'conflit') dessinerConflit();
	else dessinerDossier(d, meteo);
}

function enteteMode() {
	const e = Jeu.etat;
	if (e.mode === 'direct') return 'temps réel · ' + new Date(e.horodatage).toLocaleString('fr-FR');
	if (e.semaine) return 'semaine du ' + dateLongue(e.semaine.lundi) + (e.semaine.difficulte ? ' · ' + e.semaine.difficulte.niveau : '');
	return '';
}

// ——— Décor en couches : eau (1), relief léger des quais (2), météo du jour (Q8, Q30) ———
function dessinerDecor(zone, meteo, opacite, avecCadre) {
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
	dessinerMeteo(zone, meteo, opacite);
	drawingContext.restore();
	pop();
}

function dessinerMeteo(zone, m, opacite) {
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
	// Légende météo (données chiffrées en monospace, sur panneau)
	const txt = 'météo du jour : ' + fmt(m.temp_min) + '–' + fmt(m.temp_max) + ' °C · pluie ' + fmt(m.pluie_mm) + ' mm · rafales ' + fmt(m.rafales_max) + ' km/h' + (froid ? ' · gel' : '');
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
	text('Lignes concernées', zone.x + 18, zone.y + 16);
	textStyle(NORMAL);
	let y = zone.y + 58;
	if (!items.length) {
		textSize(18);
		fill(C.gris);
		text('Les archives de cette semaine\nne citent aucune ligne précise.\nToutes les lignes sont « à l’heure »\nfaute de donnée contraire.', zone.x + 18, y);
		y += 120;
	}
	for (const it of items.slice(0, 14)) {
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
		text(actif ? 'incident actif' : it.retard !== null ? '+' + it.retard + ' min' : 'perturbation', zone.x + 140, y + 12);
		y += 52;
	}
	// Légende
	const ly = zone.y + zone.h - 120;
	textFont(POLICE_DONNEES);
	textSize(16);
	[
		[C.vert, 'à l’heure'],
		[C.orange, 'retard / perturbation'],
		[C.rouge, 'incident actif' + (reduireAnimations ? '' : ' (clignote)')],
	].forEach(([c, t], i) => {
		stroke(c);
		strokeWeight(6);
		line(zone.x + 18, ly + i * 32 + 10, zone.x + 58, ly + i * 32 + 10);
		noStroke();
		fill(C.texte);
		text(t, zone.x + 70, ly + i * 32);
	});
}

// ——— Jauges : 3 barres horizontales compactes en bandeau (Q7) ———
function dessinerJauges() {
	const z = { x: DROITE.x, y: DROITE.y, l: DROITE.l, h: 110 };
	panneau(z.x, z.y, z.l, z.h);
	const jauges = Jeu.jauges || { fluidite: 50, satisfaction: 50, reputation: 50 }; // départ 50 (Q40)
	const defs = [
		['Fluidité', jauges.fluidite],
		['Satisfaction', jauges.satisfaction],
		['Réputation', jauges.reputation],
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
	const t = reduireAnimations ? 1 : constrain((millis() - arriveeDossier) / 450, 0, 1);
	const decal = (1 - easeOut(t)) * (L - base.x);
	const x = base.x + decal;
	panneau(x, base.y, base.l, base.h);

	if (!d) {
		textAlign(LEFT, TOP);
		fill(C.gris);
		textFont(POLICE_TEXTE);
		textSize(24);
		text('Aucun dossier pour cette semaine.', x + 32, base.y + 40);
		return;
	}

	// Compteur : barre horizontale qui se vide (Q6) — durée selon la semaine (Q16, Q55)
	const duree = ((Jeu.etat.semaine && Jeu.etat.semaine.difficulte && Jeu.etat.semaine.difficulte.compteur_s) || 30) * 1000;
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
	// Compteur à 0 : « ne rien faire » avec les seules conséquences naturelles du dossier (Q25)
	if (reste === 0 && t === 1 && (phase === 'decision' || phase === 'contradiction')) {
		phase = 'decision';
		decider('temps');
		return;
	}

	// En-tête du dossier
	textAlign(LEFT, TOP);
	text('DOSSIER ' + (Jeu.index + 1) + ' / ' + Jeu.paquet.length + ' · ' + d.type.toUpperCase() + (d.affluence ? ' · AFFLUENCE' : ''), x + 32, base.y + 42);

	// Priorité : ligne, retard, raison
	const ligne = d.lignes && d.lignes.length ? 'Ligne ' + d.lignes.join(', ') : 'Ligne non précisée';
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(44);
	text(ligne, x + 32, base.y + 84);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(30);
	fill(d.retard !== null ? C.rouge : C.gris);
	text(d.retard !== null ? 'Retard : +' + d.retard + ' min' : 'Retard : non renseigné', x + 32, base.y + 146);
	if (d.retard === null) {
		textSize(16);
		text('l’archive ne donne pas de durée de retard', x + 32, base.y + 184);
	}
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textSize(26);
	text('Raison : ' + d.nature, x + 32, base.y + 212, base.l - (d.contradiction ? 300 : 64), 60);

	// Badge « contradiction » si deux sources se contredisent (Q9) — calculé au prompt 17
	if (d.contradiction) {
		fill(C.orange);
		rect(x + base.l - 230, base.y + 232, 198, 36, 18);
		fill(C.panneau);
		textFont(POLICE_DONNEES);
		textSize(18);
		textAlign(CENTER, CENTER);
		text('contradiction', x + base.l - 131, base.y + 250);
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
	text('« ' + d.texte_source + ' »', x + 32, base.y + 326, base.l - 64, 120);
	textFont(POLICE_DONNEES);
	textSize(16);
	fill(C.gris);
	text('Source : ' + d.source, x + 32, base.y + 452, base.l - 64, 50);
	if (meteo) {
		text('Météo : ' + fmt(meteo.temp_min) + '–' + fmt(meteo.temp_max) + ' °C · pluie ' + fmt(meteo.pluie_mm) + ' mm · rafales ' + fmt(meteo.rafales_max) + ' km/h', x + 32, base.y + 506);
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
		].forEach(([t, lib, cle], i) => {
			const by = base.y + base.h - 200 + i * 88;
			bouton(x + 32, by, base.l - 64, 72, t + '  ' + lib, () => choisirSource(cle), false, true);
		});
		return;
	}
	// Actions : 3 actions + « ne rien faire » (Q5)
	const actions = [
		['1', 'Dévier la ligne', 'devier'],
		['2', 'Retenir en terminus', 'retenir'],
		['3', 'Bus de renfort', 'renfort'],
		['0', 'Ne rien faire', 'rien'],
	];
	if (sourceChoisie && d.contradiction) {
		textFont(POLICE_DONNEES);
		textSize(16);
		fill(C.gris);
		text('Source retenue : ' + d.contradiction[sourceChoisie].libelle, x + 32, base.y + base.h - 236, base.l - 64, 30);
	}
	actions.forEach(([touche, nom, cle], i) => {
		const bx = x + 32 + (i % 2) * (ab + 16);
		const by = base.y + base.h - 200 + Math.floor(i / 2) * 88;
		bouton(bx, by, ab, 72, touche + '  ' + nom, () => decider(cle), false, i === 3);
	});
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
	text('CONFLIT · ' + dateLongue(c.a.date), z.x + 32, z.y + 32);
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(40);
	text('Quelle ligne traiter en priorité ?', z.x + 32, z.y + 70, z.l - 64, 110);
	textStyle(NORMAL);
	[
		['A', c.a, 'a'],
		['B', c.b, 'b'],
	].forEach(([t, dd, cle], i) => {
		const by = z.y + 220 + i * 190;
		bouton(z.x + 32, by, z.l - 64, 160, '', () => choisirPriorite(cle), false, true);
		fill(C.accent);
		textAlign(LEFT, TOP);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(32);
		text(t + '  Ligne ' + dd.lignes.join(', ') + (dd.retard !== null ? '  · +' + dd.retard + ' min' : ''), z.x + 60, by + 26);
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
	text('JOURNAL DE LA SALLE · ton ' + r.narration.ton, z.x + 32, z.y + 32);
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
	const noms = ['Fluidité', 'Satisfaction', 'Réputation'];
	r.deltas.forEach((v, i) => {
		const de = r.des[i] ? '  (dé : ' + r.des[i] + ')' : '';
		fill(v > 0 ? C.vert : v < 0 ? C.rouge : C.gris);
		text(noms[i].padEnd(13, ' ') + (v > 0 ? '+' : '') + v + de, z.x + 32, z.y + 470 + i * 30);
	});
	const ctx = [r.contexte.meteo && 'météo défavorable', r.contexte.pointe && 'heure de pointe', r.contexte.affluence && 'affluence'].filter(Boolean);
	fill(C.gris);
	if (ctx.length) text('Contexte : ' + ctx.join(', ') + ' (effet renforcé)', z.x + 32, z.y + 570);

	// Suite automatique, ou Entrée / clic
	const t = constrain((millis() - debutNarration) / DUREE_NARRATION, 0, 1);
	fill('#E8E2D6');
	rect(z.x + 32, z.y + z.h - 140, z.l - 64, 6, 3);
	fill(couleurTon);
	rect(z.x + 32, z.y + z.h - 140, (z.l - 64) * t, 6, 3);
	bouton(z.x + 32, z.y + z.h - 112, z.l - 64, 72, Jeu.terminee ? 'Voir le bilan  (Entrée)' : 'Dossier suivant  (Entrée)', continuer);
	if (t >= 1) continuer();
}

// ——— Fin provisoire (l'écran de fin complet arrive au prompt 19) ———
function dessinerFinProvisoire() {
	const z = { x: DROITE.x, y: DROITE.y + 130, l: DROITE.l, h: DROITE.h - 130 };
	panneau(z.x, z.y, z.l, z.h, C.accent);
	textAlign(LEFT, TOP);
	noStroke();
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(40);
	text('Semaine terminée', z.x + 32, z.y + 40);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(26);
	text('Score combiné : ' + Jeu.score() + ' / 300', z.x + 32, z.y + 110);
	text('Dossiers traités : ' + Jeu.historique.filter((h) => h.action).length + ' / ' + Jeu.paquet.length, z.x + 32, z.y + 150);
	bouton(z.x + 32, z.y + z.h - 200, z.l - 64, 72, 'Rejouer la même semaine', rejouer);
	bouton(z.x + 32, z.y + z.h - 112, z.l - 64, 72, 'Changer de semaine', () => (ecran = 'accueil'), false, true);
}

function rejouer() {
	const e = Jeu.etat;
	const p = e.mode === 'semaine' ? Jeu.chargerSemaine(e.semaine.lundi) : e.mode === 'direct' ? Jeu.chargerDirect() : Jeu.chargerHorsLigne();
	p.then(() => {
		Jeu.nouvellePartie();
		nouveauDossier();
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
	return new Date(Date.UTC(a, m - 1, j)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// =====================================================================
// Entrées (raccourcis complets au prompt 18)
// =====================================================================
function mousePressed() {
	for (let i = boutons.length - 1; i >= 0; i--) {
		const b = boutons[i];
		if (mouseX >= b.x && mouseX <= b.x + b.l && mouseY >= b.y && mouseY <= b.y + b.h) {
			b.action();
			return;
		}
	}
}

function keyPressed() {
	if (ecran === 'accueil') {
		const n = optionsAccueil().length;
		if (keyCode === UP_ARROW) choixAccueil = (choixAccueil + n - 1) % n;
		if (keyCode === DOWN_ARROW) choixAccueil = (choixAccueil + 1) % n;
		if (keyCode === ENTER || keyCode === RETURN) lancerPartie();
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
	}
}
