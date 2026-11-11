/* Nantes en régulation — prompt 53 : animations de feedback du gameplay.
 * - Jauges : la barre glisse vers sa nouvelle valeur (eased, ~600 ms) ; le delta réel flotte au-dessus et
 *   s'efface ; sous 20 (Q46), pulsation douce en opacité au lieu d'un clignotement sec.
 * - Arrivée d’un dossier : tampon « SIGNALEMENT » qui s’imprime (prompt 73 : plus de carte, donc plus de ligne qui pulse).
 * - Urgence (< 10 s) : barre du compteur rouge qui pulse, tic-tac plus fort.
 * Animations réduites : valeurs directes, deltas en texte fixe, tampon direct, rien ne pulse ni ne coule.
 * Toutes les pulsations ≤ 1,5 par seconde. game.js n'est pas touché.
 */
const JAUGES_AFF = { v: null, cible: null, depuis: null, debut: 0, deltas: [], paquet: null };
const DUREE_JAUGE_MS = 600;
const DUREE_DELTA_MS = 1600;
const NOMS_J = ['fluidite', 'reputation', 'budget'];

/** Pulsation douce 0 → 1 (sinus), fréquence en Hz (≤ 1,5) ; 1 fixe si animations réduites */
function pulsationDouce(hz) {
	if (reduireAnimations) return 1;
	return 0.5 + 0.5 * Math.sin((millis() / 1000) * Math.PI * 2 * hz);
}

/** Valeurs affichées des jauges (eased vers les vraies valeurs) ; détecte les variations pour les deltas */
function jaugesAffichees() {
	const reel = Jeu.jauges || { fluidite: 50, reputation: 50, budget: 50 };
	const A = JAUGES_AFF;
	if (!A.v || A.paquet !== Jeu.paquet) {
		// Nouvelle partie ou reprise : pas d'animation depuis l'ancienne partie
		A.v = Object.assign({}, reel);
		A.cible = Object.assign({}, reel);
		A.depuis = Object.assign({}, reel);
		A.deltas = [];
		A.paquet = Jeu.paquet;
	}
	if (NOMS_J.some((k) => reel[k] !== A.cible[k])) {
		NOMS_J.forEach((k) => {
			const d = reel[k] - A.cible[k];
			if (d) A.deltas.push({ jauge: k, d, t: millis() });
		});
		A.depuis = Object.assign({}, A.v);
		A.cible = Object.assign({}, reel);
		A.debut = millis();
	}
	const u = reduireAnimations ? 1 : constrain((millis() - A.debut) / DUREE_JAUGE_MS, 0, 1);
	const e = easeOut(u);
	NOMS_J.forEach((k) => (A.v[k] = A.depuis[k] + (A.cible[k] - A.depuis[k]) * e));
	A.deltas = A.deltas.filter((x) => millis() - x.t < (reduireAnimations ? 3000 : DUREE_DELTA_MS));
	return A.v;
}
/** Delta flottant au-dessus d'une jauge (x, y : coin haut gauche de la barre, l : largeur) */
function dessinerDeltasJauge(cle, x, y, l) {
	JAUGES_AFF.deltas
		.filter((d) => d.jauge === cle)
		.forEach((d, i) => {
			const u = (millis() - d.t) / DUREE_DELTA_MS;
			const monte = reduireAnimations ? 0 : easeOut(Math.min(1, u * 1.5)) * 14; // part de la barre et monte un peu
			const a = reduireAnimations ? 1 : 1 - Math.max(0, (u - 0.5) / 0.5);
			const c = color(d.d > 0 ? C.vert : C.rouge);
			c.setAlpha(255 * a);
			noStroke();
			fill(13, 12, 12, 200 * a);
			textFont(POLICE_DONNEES);
			textSize(20);
			const txt = (d.d > 0 ? '+' : '−') + Math.abs(d.d);
			const w = textWidth(txt) + 14;
			const bx = x + l - w - 4 - i * (w + 6); // à droite de la barre, sous la valeur
			rect(bx, y - 2 - monte, w, 26);
			fill(c);
			textAlign(CENTER, CENTER);
			zoneTexteDebut('pastille', bx, y - 2 - monte, w, 26); // prompt 93 : la pastille est le cadre du delta (elle monte exprès)
			text(txt, bx + w / 2, y + 11 - monte);
			zoneTexteFin();
			textAlign(LEFT, TOP);
		});
}
/** Opacité d'une jauge critique (< 20) : pulsation douce à 1 Hz, fixe si animations réduites */
function opaciteCritique() {
	return reduireAnimations ? 1 : 0.55 + 0.45 * pulsationDouce(1);
}

// ——— Urgence du compteur ———
const URGENCE = { u: 0, t: 0 };
/** Appelée par dessinerDossier avec le temps restant ; renvoie la couleur de la barre */
function couleurCompteur(resteMs) {
	if (resteMs < 10000) {
		URGENCE.u = 1 - resteMs / 10000;
		URGENCE.t = millis();
		const c = color(C.rougeFonce);
		c.setAlpha(255 * (reduireAnimations ? 1 : 0.65 + 0.35 * pulsationDouce(1.5)));
		return c;
	}
	return color(C.primaire);
}
/** Urgence en cours (0 si aucun compteur sous 10 s à cette image) */
const urgenceCompteur = () => (millis() - URGENCE.t < 250 ? URGENCE.u : 0);

// ——— Tampon « SIGNALEMENT » à l'arrivée du dossier ———
function dessinerTamponSignalement(x, y) {
	const u = reduireAnimations ? 1 : constrain((millis() - arriveeDossier - 300) / 350, 0, 1);
	if (u <= 0) return;
	const e = easeOut(u);
	push();
	translate(x, y);
	rotate(-0.14);
	scale(1.6 - 0.6 * e);
	const c = color(C.orange);
	c.setAlpha(255 * e);
	noFill();
	stroke(c);
	strokeWeight(3);
	rect(-88, -20, 176, 40);
	noStroke();
	fill(c);
	textFont(POLICE_DONNEES);
	textStyle(BOLD);
	textSize(20);
	textAlign(CENTER, CENTER);
	zoneTexteDebut('tampon', -88, -20, 176, 40); // prompt 93 : cadre du tampon (repère tourné)
	text(t('tampon.signalement'), 0, 1);
	zoneTexteFin();
	textStyle(NORMAL);
	pop();
	textAlign(LEFT, TOP);
}
