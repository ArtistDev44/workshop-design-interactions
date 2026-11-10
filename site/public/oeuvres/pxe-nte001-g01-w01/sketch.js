/* Nantes en régulation — boucle p5 (Q41).
 * Prompt 15 : écran de vérification des données (fondation). Les vrais écrans arrivent au prompt 16.
 * 1920×1080 (Q1), pixelDensity(1), seed fixe pour la reproductibilité (Q35).
 */
const L = 1920;
const H = 1080;
let statut = 'Chargement…';

function setup() {
	const c = createCanvas(L, H);
	c.parent('scene');
	pixelDensity(1);
	randomSeed(Jeu.fallback ? Jeu.fallback.seed : 1001);
	textFont('ui-monospace, Menlo, monospace');
	noLoop();
	Jeu.chargerHorsLigne().then(function () {
		statut = 'Données hors ligne prêtes';
		redraw();
	});
}

function draw() {
	background(14, 18, 24);
	dessinerLignes();
	fill(240);
	noStroke();
	textSize(56);
	textStyle(BOLD);
	text('Nantes en régulation', 80, 120);
	textStyle(NORMAL);
	textSize(22);
	const s = Jeu.semainesProposees();
	const lignes = [
		statut,
		'Lignes : ' + (Jeu.lignes ? Jeu.lignes.lignes.length : 0) + ' tracés (GTFS Naolib)',
		'Semaines proposées : ' + s.map((x) => x.lundi + ' (' + x.niveau + ')').join(' · '),
		'Hors ligne : ' + Jeu.etat.dossiers.length + ' dossiers réels, semaine du ' + (Jeu.etat.semaine ? Jeu.etat.semaine.lundi : '—'),
		'Écrans de la salle de contrôle : prompt 16',
	];
	lignes.forEach((t, i) => text(t, 80, 190 + i * 40));
}

/* Carte en géographie réelle (Q1, Q2) : projection simple lon/lat → écran sur l'emprise des lignes. */
function dessinerLignes() {
	if (!Jeu.lignes) return;
	const e = Jeu.lignes.emprise;
	const marge = 60;
	const zone = { x: 700, y: 60, l: L - 700 - marge, h: H - 120 };
	const kx = Math.cos((((e.nord + e.sud) / 2) * Math.PI) / 180); // correction de la latitude
	const echelle = Math.min(zone.l / ((e.est - e.ouest) * kx), zone.h / (e.nord - e.sud));
	const px = (lon) => zone.x + (lon - e.ouest) * kx * echelle;
	const py = (lat) => zone.y + (e.nord - lat) * echelle;
	noFill();
	Jeu.lignes.lignes.forEach(function (l) {
		const c = color(l.couleur || '#8899aa');
		c.setAlpha(l.type === 0 ? 255 : 110);
		stroke(c);
		strokeWeight(l.type === 0 ? 4 : 1.5);
		l.traces.forEach(function (t) {
			beginShape();
			t.forEach((p) => vertex(px(p[0]), py(p[1])));
			endShape();
		});
	});
}
