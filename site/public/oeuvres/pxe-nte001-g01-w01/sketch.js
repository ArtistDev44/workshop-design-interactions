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
	const c = createCanvas(L, H);
	c.parent('scene');
	pixelDensity(1);
	randomSeed(Jeu.fallback ? Jeu.fallback.seed : 1001);
	for (let i = 0; i < 140; i++) gouttes.push({ x: random(), y: random(), v: random(0.6, 1.2) });
	setupBureau();
	appliquerReglages();
	if (Confort.Reglages.horsLigneForce) Jeu.enLigne = false; // mode hors ligne forcé (Paramètres)
	else Jeu.verifierConnexion(); // indicateur « mode hors ligne » + météo du jour pour le décor de l'accueil
}

// ——— Options de l'accueil : les 3 semaines réelles (Q14) + le mode « aujourd'hui » (prompt 14) ———
function optionsAccueil() {
	const opts = Jeu.semainesProposees().map((s) => ({
		type: 'semaine',
		lundi: s.lundi,
		titre: 'Semaine du ' + dateLongue(s.lundi) + ' au ' + dateLongue(s.dimanche),
		detail: s.niveau + ' · compteur ' + s.compteur_s + ' s',
		info: s.dossiers + ' dossier(s) d’archive · ' + s.evenements + ' événement(s) agenda' + texteMeilleur(s.lundi),
	}));
	opts.push({
		type: 'direct',
		titre: 'Aujourd’hui, en temps réel',
		detail: Jeu.enLigne === false ? 'indisponible hors ligne' : 'flux GTFS-RT Naolib',
		info: 'Retards réels ≥ 10 min mesurés maintenant' + texteMeilleur('direct'),
		desactive: Jeu.enLigne === false,
	});
	return opts;
}

function texteMeilleur(cle) {
	const m = Confort.Bilans.meilleur(cle);
	return m ? ' · meilleur bilan : ' + m.score + ' / 300' : '';
}

function draw() {
	boutons = [];
	background(C.fond);
	if (ecran === 'accueil') dessinerAccueil();
	else dessinerJeu();
	if (enPause) dessinerPause();
	if (fenetre) {
		boutons = []; // seule la fenêtre ouverte est cliquable
		dessinerFenetre();
	}
	// Vue d'entrée : le bureau pixel art, avec le jeu en direct dans l'écran du PC
	if (vue !== 'poste') dessinerVueBureau();
	else if (!fenetre) dessinerCadrePoste();
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
	bouton((L - bl) / 2 - 260, y + 34, 220, 56, 'Paramètres', () => ouvrir('parametres'), false, true);
	bouton((L + bl) / 2 + 40, y + 34, 220, 56, 'Aide (H)', () => ouvrir('aide'), false, true);

	// Indicateur « mode hors ligne » (Q34) : discret, gris, monospace
	textFont(POLICE_DONNEES);
	textSize(20);
	textAlign(CENTER, BOTTOM);
	fill(C.gris);
	const statut = Jeu.enLigne === null ? 'vérification de la connexion…' : Jeu.enLigne ? '' : Confort.Reglages.horsLigneForce ? 'mode hors ligne (forcé dans les paramètres)' : 'mode hors ligne — semaines enregistrées disponibles';
	text(statut, L / 2, H - 70);
	textSize(16);
	text('↑ ↓ choisir · Entrée jouer · H aide · M son — sources : Open Data Nantes Métropole, Open-Meteo', L / 2, H - 36);
}

function lancerPartie() {
	const o = optionsAccueil()[choixAccueil];
	if (!o || o.desactive) return;
	const p = o.type === 'direct' ? Jeu.chargerDirect() : Jeu.chargerSemaine(o.lundi);
	Confort.Son.bip('choix');
	p.then(() => {
		Jeu.nouvellePartie();
		ecran = 'jeu';
		enPause = false;
		nouveauDossier();
	});
}

function nouveauDossier() {
	arriveeDossier = millis();
	debutCompteur = millis();
	sourceChoisie = null;
	alerteTempsJouee = false;
	if (Jeu.terminee) {
		phase = 'fin';
		bilanFin = Confort.Bilans.enregistrer(Confort.Bilans.cle(Jeu.etat), Jeu.score(), Jeu.jauges); // Q19
		Confort.Son.bip('fin');
		return;
	}
	Confort.Son.bip('dossier');
	if (Jeu.conflit()) phase = 'conflit';
	else if (Jeu.dossierCourant().contradiction) phase = 'contradiction';
	else phase = 'decision';
}

/* Décision du joueur (ou compteur à 0 → 'temps', Q25) */
function decider(action) {
	if (phase !== 'decision' && !(action === 'temps' && phase === 'contradiction')) return;
	dernierResultat = Jeu.decider(action, sourceChoisie);
	if (!dernierResultat) return;
	Confort.Son.bip(action === 'temps' ? 'alerte' : 'action');
	phase = 'narration';
	debutNarration = millis();
}

function continuer() {
	if (phase === 'narration' && !enPause) nouveauDossier();
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
	rejouer();
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
	if (phase === 'fin') return dessinerFin();
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
	// Barre d'outils (souris / touch) — équivalents des touches H, M, R
	const bx = GAUCHE.x + GAUCHE.l - 24;
	const outils = [
		['Recommencer (R)', () => ouvrir('reset')],
		['Son (M) : ' + (Confort.Reglages.son ? 'oui' : 'non'), basculerSon],
		['Aide (H)', () => ouvrir('aide')],
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
		text('mode hors ligne', ox - 10, GAUCHE.y + 30);
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

function enteteMode() {
	const e = Jeu.etat;
	if (e.mode === 'direct') return 'temps réel · ' + new Date(e.horodatage).toLocaleString('fr-FR');
	if (e.semaine) return 'semaine du ' + dateLongue(e.semaine.lundi) + (e.semaine.difficulte ? ' · ' + e.semaine.difficulte.niveau : '');
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
	if (reste * duree < 5000 && reste > 0 && !alerteTempsJouee && (phase === 'decision' || phase === 'contradiction')) {
		alerteTempsJouee = true;
		Confort.Son.bip('alerte'); // plus que 5 secondes
	}
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
	const lb = (z.l - 64 - 16) * 0.68;
	bouton(z.x + 32, z.y + z.h - 112, lb, 72, Jeu.terminee ? 'Voir le bilan  (Entrée)' : 'Dossier suivant  (Entrée)', continuer);
	bouton(z.x + 48 + lb, z.y + z.h - 112, z.l - 64 - 16 - lb, 72, enPause ? 'Reprendre (P)' : 'Pause (P)', basculerPause, false, true);
	if (t >= 1 && !enPause && !fenetre) continuer();
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
	text('FIN ' + b.type.toUpperCase() + ' · SCORE ' + b.score + ' / 300', g.x + 48, g.y + 44);
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
		['Fluidité du réseau', b.jauges.fluidite],
		['Satisfaction usagers', b.jauges.satisfaction],
		['Réputation de la salle', b.jauges.reputation],
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
	text('Dossiers traités : ' + b.traites + ' / ' + b.total + (b.sansDecision ? ' · ' + b.sansDecision + ' sans décision (temps écoulé)' : ''), g.x + 48, g.y + 680);
	if (b.mauvaisesSources) text('Mauvaise source retenue : ' + b.mauvaisesSources + ' fois', g.x + 48, g.y + 712);
	if (bilanFin && bilanFin.meilleur) {
		fill(bilanFin.record ? C.vert : C.gris);
		text(
			bilanFin.record ? 'Nouveau meilleur bilan pour cette semaine !' : 'Meilleur bilan : ' + bilanFin.meilleur.score + ' / 300 (' + bilanFin.meilleur.le + ')',
			g.x + 48,
			g.y + 752,
		);
	}
	const bl = (g.l - 96 - 20) / 2;
	bouton(g.x + 48, g.y + g.h - 112, bl, 72, 'Rejouer (Entrée)', rejouer);
	bouton(g.x + 68 + bl, g.y + g.h - 112, bl, 72, 'Changer de semaine (Échap)', retourAccueil, false, true);

	// Panneau droit : bilan chiffré — faits réels de la semaine (Q52) et décisions clés (Q37)
	const d = { x: 1000, y: 70, l: 840, h: 940 };
	panneau(d.x, d.y, d.l, d.h);
	textAlign(LEFT, TOP);
	fill(C.accent);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(32);
	text('Bilan chiffré', d.x + 48, d.y + 40);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(20);
	fill(C.texte);
	let y = d.y + 100;
	const f = b.faits;
	text((Jeu.etat.mode === 'direct' ? 'Relevé temps réel : ' : 'Semaine : ') + f.periode, d.x + 48, y);
	y += 36;
	text(
		'Dossiers : ' +
			Object.entries(f.parType)
				.map(([t, n]) => n + ' ' + (n > 1 ? { 'alerte météo': 'alertes météo', 'ligne en difficulté': 'lignes en difficulté' }[t] || t + 's' : t))
				.join(' · '),
		d.x + 48,
		y,
		d.l - 96,
		60,
	);
	y += 70;
	text(f.pireRetard ? 'Pire retard réel : +' + f.pireRetard.minutes + ' min (ligne ' + f.pireRetard.ligne + ')' : 'Pire retard : non renseigné par les archives', d.x + 48, y);
	y += 60;
	fill(C.accent);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(26);
	text('Décisions clés', d.x + 48, y);
	textStyle(NORMAL);
	y += 46;
	const couleurs = { meilleure: C.vert, pire: C.rouge, 'mauvaise source': C.orange };
	b.decisionsCles.forEach((k) => {
		fill(couleurs[k.qualite]);
		rect(d.x + 48, y + 4, 8, 96, 3);
		textFont(POLICE_DONNEES);
		textSize(16);
		text(k.qualite.toUpperCase(), d.x + 72, y);
		fill(C.texte);
		textFont(POLICE_TEXTE);
		textSize(22);
		text(k.titre, d.x + 72, y + 24, d.l - 140, 30);
		textFont(POLICE_DONNEES);
		textSize(18);
		fill(C.gris);
		const ds = ['fluidité', 'satisfaction', 'réputation'].map((n, i) => n + ' ' + (k.deltas[i] > 0 ? '+' : '') + k.deltas[i]).join(' · ');
		text(k.action + ' → ' + ds, d.x + 72, y + 58, d.l - 140, 50);
		y += 126;
	});
	textFont(POLICE_DONNEES);
	textSize(15);
	fill(C.gris);
	text('Sources : Open Data Nantes Métropole (GTFS Naolib, agenda), Open-Meteo. Aucun événement inventé.', d.x + 48, d.y + d.h - 50, d.l - 96, 40);
}

function retourAccueil() {
	bilanCalcule = null;
	ecran = 'accueil';
}

function rejouer() {
	bilanCalcule = null;
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
// Entrées : souris, touch, clavier (raccourcis complets, 08-raccourcis)
// =====================================================================
function mousePressed() {
	Confort.Son.demarrer();
	for (let i = boutons.length - 1; i >= 0; i--) {
		const b = boutons[i];
		if (mouseX >= b.x && mouseX <= b.x + b.l && mouseY >= b.y && mouseY <= b.y + b.h) {
			b.action();
			return;
		}
	}
}

function basculerSon() {
	Confort.Reglages.basculer('son');
}

function keyPressed() {
	Confort.Son.demarrer(); // l'audio ne peut démarrer qu'après un geste du joueur
	// Au bureau : Entrée / Espace pour s'installer au poste ; M (son) et H (aide) restent actifs
	if (vue !== 'poste') {
		if (vue === 'bureau' && (keyCode === ENTER || keyCode === RETURN || key === ' ')) sAsseoir();
		if (key === 'm' || key === 'M') basculerSon();
		return false;
	}
	// Au poste : Échap fait se lever (sauf si une fenêtre est ouverte ou à l'écran de fin)
	if (keyCode === ESCAPE && !fenetre && !(ecran === 'jeu' && phase === 'fin')) return seLever(), false;
	// Fenêtres ouvertes : elles captent le clavier
	if (fenetre) {
		if (keyCode === ESCAPE || (fenetre === 'aide' && (key === 'h' || key === 'H' || key === '?'))) return fermer();
		if (fenetre === 'reset') {
			if (keyCode === ENTER || keyCode === RETURN || key === 'o' || key === 'O') confirmerReset();
			if (key === 'n' || key === 'N') fermer();
		}
		if (fenetre === 'parametres') {
			const cles = { 1: 'son', 2: 'horsLigneForce', 3: 'reduireAnimations', 4: 'contrasteRenforce' };
			if (cles[key]) basculerReglage(cles[key]);
			if (keyCode === ENTER || keyCode === RETURN) fermer();
		}
		return false;
	}
	// Touches valables partout
	if (key === 'h' || key === 'H' || key === '?') return ouvrir('aide'), false;
	if (key === 'm' || key === 'M') return basculerSon(), false;
	if (ecran === 'jeu') {
		if (key === 'r' || key === 'R') return ouvrir('reset'), false;
		if (key === 'p' || key === 'P') return basculerPause(), false;
	}
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
	} else if (phase === 'fin') {
		if (keyCode === ENTER || keyCode === RETURN) rejouer();
		if (keyCode === ESCAPE || keyCode === BACKSPACE) retourAccueil();
	}
	if (key === ' ' || keyCode === UP_ARROW || keyCode === DOWN_ARROW) return false; // pas de défilement de la page
}

// Touch basique (Q32) : un appui = un clic sur les boutons
function touchStarted() {
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
	text('Pause', L / 2, H / 2 - 50);
	textStyle(NORMAL);
	bouton((L - 360) / 2, H / 2 + 10, 360, 72, 'Reprendre (P)', basculerPause);
}

function dessinerFenetre() {
	voile();
	if (fenetre === 'aide') return fenetreAide();
	if (fenetre === 'reset') return fenetreReset();
	if (fenetre === 'parametres') return fenetreParametres();
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
	text('Aide — Nantes en régulation', x + 48, y + 36);
	textStyle(NORMAL);
	// Raccourcis (08-raccourcis)
	const raccourcis = [
		['1 / 2 / 3', 'Dévier la ligne / Retenir en terminus / Bus de renfort'],
		['0 ou Espace', 'Ne rien faire'],
		['A / B', 'Choisir une source (contradiction) ou une ligne (conflit)'],
		['Entrée', 'Valider, dossier suivant, rejouer'],
		['P', 'Pause — seulement entre deux dossiers'],
		['R', 'Recommencer la semaine (avec confirmation)'],
		['M', 'Couper / réactiver le son'],
		['H ou ?', 'Afficher / fermer cette aide · Échap : fermer'],
		['↑ ↓', 'Choisir une semaine à l’accueil'],
	];
	textSize(22);
	fill(C.texte);
	text('Raccourcis', x + 48, y + 110);
	raccourcis.forEach(([k, d], i) => {
		textFont(POLICE_DONNEES);
		textSize(20);
		fill(C.accent);
		text(k, x + 48, y + 150 + i * 38);
		textFont(POLICE_TEXTE);
		fill(C.texte);
		text(d, x + 230, y + 150 + i * 38);
	});
	// Règles (00-concept, 03-actions, 04-jauges)
	const rx = x + 760;
	textSize(22);
	fill(C.texte);
	text('Règles', rx, y + 110);
	textSize(19);
	text(
		'Chaque dossier vient de données réelles : retard ≥ 10 min (temps réel), perturbation datée (archives), alerte météo ou affluence (agenda).\n\n' +
			'Choisissez une action avant la fin du compteur. À 0, rien n’est décidé : seules les conséquences naturelles du dossier s’appliquent.\n\n' +
			'Chaque action modifie 3 jauges (départ 50) : fluidité, satisfaction, réputation. Effet de base + 1 dé à 6 faces, renforcé par la météo, l’heure de pointe ou l’affluence.\n\n' +
			'Fin de semaine : score = somme des 3 jauges (0–300).',
		rx,
		y + 150,
		l - (rx - x) - 48,
		560,
	);
	bouton(x + l - 288, y + h - 104, 240, 64, 'Fermer (Échap)', fermer);
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
	text('Recommencer la semaine ?', L / 2, y + 48);
	textStyle(NORMAL);
	textSize(22);
	fill(C.gris);
	text('Les jauges repartent à 50 ; la partie en cours est perdue.', L / 2, y + 110);
	bouton(x + 48, y + h - 112, (l - 112) / 2, 72, 'Oui, recommencer (Entrée)', confirmerReset);
	bouton(x + 64 + (l - 112) / 2, y + h - 112, (l - 112) / 2, 72, 'Non (Échap)', fermer, false, true);
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
	const h = 600;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	textAlign(LEFT, TOP);
	noStroke();
	fill(C.accent);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(40);
	text('Paramètres', x + 48, y + 36);
	textStyle(NORMAL);
	const R = Confort.Reglages;
	const lignes = [
		['1', 'Son (ambiance + bips)', 'son'],
		['2', 'Forcer le mode hors ligne', 'horsLigneForce'],
		['3', 'Réduire les animations', 'reduireAnimations'],
		['4', 'Contraste renforcé', 'contrasteRenforce'],
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
		text('touche ' + k, x + 560, ly + 36);
		bouton(x + l - 248, ly + 6, 200, 60, R[nom] ? 'oui' : 'non', () => basculerReglage(nom), false, !R[nom]);
	});
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(16);
	fill(C.gris);
	text('Réglages mémorisés sur cet appareil (localStorage). Les animations sont aussi réduites si le système le demande.', x + 48, y + h - 150, l - 360, 60);
	bouton(x + l - 288, y + h - 104, 240, 64, 'Retour (Entrée)', fermer);
}
