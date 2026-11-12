/* Nantes en régulation — prompt 104 : le bureau se remplit au fil des journées jouées.
 * Toujours là : téléphone (il appartient au joueur), clavier, souris, écran, et la pièce (baie, lampe, horloge,
 * webcam). Le reste du plateau arrive avec les journées terminées de la CARRIÈRE (Taches.carriere().jours,
 * gardé en local entre les parties) ; sans stockage local, le compteur de la partie ou le jour de la semaine.
 * Un objet absent n'est ni dessiné, ni cliquable, ni atteignable au clavier. Arrivée : un léger posé (4 px,
 * 250 ms, rien si animations réduites) et une annonce aria-live, une seule fois. ?jours=N : outil de test
 * (n'écrit rien). Remettre la carrière à zéro vide le bureau.
 */
const OBJETS_PROGRESSION = { tasse: 1, aide: 2, plante: 2, dossiers: 3, micro: 4, stress: 5, postit: 6, cadre: 8, planteGrande: 10 };
const CLE_BUREAU_ANNONCES = 'pxe-nte001-bureau-annonces';
const PROG = { apparu: {}, annonces: null, test: null };
(() => {
	try {
		const q = new URLSearchParams(location.search).get('jours');
		if (q !== null && q !== '' && !Number.isNaN(Number(q))) PROG.test = Math.max(0, Math.floor(Number(q)));
	} catch (e) {}
})();

/** Journées terminées (carrière), au minimum celles de la partie et le jour de la semaine en cours */
function joursPasses() {
	if (PROG.test !== null) return PROG.test;
	let n = 0;
	try {
		if (typeof Taches !== 'undefined') {
			n = Math.max(n, (Taches.carriere().jours || []).length);
			if (typeof Jeu !== 'undefined' && Jeu.taches) n = Math.max(n, Taches.etat().joursJoues || 0);
		}
	} catch (e) {}
	if (typeof Jeu !== 'undefined' && typeof ecran !== 'undefined' && ecran === 'jeu') n = Math.max(n, Jeu.jourIndex || 0);
	return n;
}
/** L'objet est-il posé sur le bureau ? (le livre d'aide est là dès le 1er jour tant que le guide le montre) */
function objetPresent(cle) {
	if (!(cle in OBJETS_PROGRESSION)) return true;
	if (cle === 'aide' && typeof GUIDE !== 'undefined' && GUIDE.actif) return true;
	return joursPasses() >= OBJETS_PROGRESSION[cle];
}
/** Décalage vertical du « posé » (0 une fois arrivé) */
function poseObjet(cle) {
	const t0 = PROG.apparu[cle];
	if (!t0 || reduireAnimations) return 0;
	const k = Math.min(1, (millis() - t0) / 250);
	return k >= 1 ? 0 : -Math.round(4 * (1 - k * k));
}

function lireAnnonces() {
	if (PROG.annonces) return PROG.annonces;
	try {
		PROG.annonces = JSON.parse(localStorage.getItem(CLE_BUREAU_ANNONCES) || '[]');
	} catch (e) {
		PROG.annonces = [];
	}
	return PROG.annonces;
}
/** Une fois par image (vue bureau, partie en cours) : annonce les objets qui viennent d'arriver */
function majProgressionBureau() {
	if (typeof ecran === 'undefined' || ecran !== 'jeu' || PROG.test !== null) return;
	try {
		if (typeof Taches !== 'undefined' && !(Taches.carriere().jours || []).length && lireAnnonces().length && !(Jeu.jourIndex > 0)) PROG.annonces = []; // carrière remise à zéro : le bureau est vide
	} catch (e) {}
	const deja = lireAnnonces();
	const nouveaux = Object.keys(OBJETS_PROGRESSION).filter((k) => OBJETS_PROGRESSION[k] > 0 && objetPresent(k) && !deja.includes(k) && !(k === 'aide' && joursPasses() < OBJETS_PROGRESSION.aide));
	if (!nouveaux.length) return;
	nouveaux.forEach((k) => (PROG.apparu[k] = millis()));
	PROG.annonces = deja.concat(nouveaux);
	try {
		localStorage.setItem(CLE_BUREAU_ANNONCES, JSON.stringify(PROG.annonces));
	} catch (e) {}
	annoncer(t('bureau.nouveau', { objets: nouveaux.map((k) => t('bureau.objet.' + k)).join(', ') }));
}

// ——— Nouveaux décors (pixel art, palette du bureau ; non cliquables, sans effet de jeu) ———
/** Deux post-it au pied de l'écran, sur le plateau (motifs, aucun texte lisible) */
function dessinerPostIt(g) {
	if (!objetPresent('postit')) return;
	const dy = poseObjet('postit');
	const x = BW / 2 + 44; // posés sur le plateau, au pied de l'écran (à droite du socle) : ils ne couvrent jamais l'écran
	const y = PLATEAU_Y + 5 + dy;
	px(g, '#e8c95a', x + 2, y + 1, 9, 9); // ombre / second post-it, décalé
	px(g, '#ffe27a', x, y, 9, 9);
	px(g, '#d9b94a', x + 1, y + 2, 6, 1); // traits de crayon (illisibles)
	px(g, '#d9b94a', x + 1, y + 4, 4, 1);
	px(g, '#ffb3c7', x - 11, y + 2, 8, 8);
	px(g, '#e58aa3', x - 10, y + 4, 5, 1);
}
/** Cadre photo vu de dos (le dos du cadre et son pied : aucune personne représentée) */
function dessinerCadreDos(g) {
	if (!objetPresent('cadre')) return;
	const dy = poseObjet('cadre');
	const x = 114;
	const y = 152 + dy;
	ombreObjet(g, x - 1, 172, 16);
	px(g, P.contour, x, y, 14, 19);
	px(g, '#7a5535', x + 1, y + 1, 12, 17);
	px(g, '#5e3f22', x + 3, y + 4, 8, 1); // agrafe du dos
	px(g, '#5e3f22', x + 6, y + 10, 2, 9); // pied chevalet
	px(g, '#4a3019', x + 7, y + 18, 4, 2);
}
