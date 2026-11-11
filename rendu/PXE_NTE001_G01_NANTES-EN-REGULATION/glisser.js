/* Nantes en régulation — prompt 94 : décider par glisser-déposer, et donner du poids aux décisions.
 * - Les cartes de réponse (panneau.js) sont relevées à chaque image dans CARTES, et la zone du dossier dans
 *   ZONE_DEPOT (titre + blocs « Ce qui se passe / Pourquoi / Ce que vous savez »), en coordonnées de l'écran du PC.
 * - Appui sur une carte → elle flotte (inertie, inclinaison selon la vitesse, ombre) ; la zone du dossier se
 *   surligne en pointillés « Déposer ici ». Relâchée sur le dossier → decider(cle). Ailleurs → retour en ressort,
 *   aucun choix, annonce aria-live. Un simple clic (déplacement < 8 px) décide toujours ; touches 1-4 inchangées ;
 *   au doigt (mobile), le tap décide directement (pas de glisser).
 * - Poids : secousse d'écran selon l'amplitude réelle des deltas (≥ 10 forte, ≥ 6 moyenne, sinon légère), frappe
 *   de la carte sur le dossier (un seul éclair bref + son de console existant), éclair sur la jauge qui change
 *   (feedback.js). Tout est coupé avec les animations réduites ; aucun clignotement répété (≤ 1 éclair par geste).
 * Aucune règle de jeu ici : la décision passe par decider() (sketch.js) → Jeu.decider (game.js inchangé).
 */
let CARTES = []; // [{ cle, x, y, l, h, lib }] — relevées par dessinerCartesReponses
let ZONE_DEPOT = null; // { x, y, l, h }
const GLISSER = { carte: null, x: 0, y: 0, dx: 0, dy: 0, x0: 0, y0: 0, vx: 0, ang: 0, retour: null, frappe: null };
const SECOUSSE = { t: -1e9, amp: 0 };
const SEUIL_CLIC_PX = 8;

/** Souris en coordonnées de l'écran du PC (1920×1080), hors image (dans mousePressed / mouseReleased) */
function sourisPC() {
	if (vue !== 'poste' || typeof ECRAN_POSTE === 'undefined') return { x: mouseX, y: mouseY };
	const r = ECRAN_POSTE;
	return { x: ((mouseX - r.x) * L) / r.l, y: ((mouseY - r.y) * H) / r.h };
}
const dansRect = (p, r) => !!r && p.x >= r.x && p.x <= r.x + r.l && p.y >= r.y && p.y <= r.y + r.h;
function glisserPossible() {
	return ecran === 'jeu' && phase === 'decision' && vue === 'poste' && typeof PC !== 'undefined' && PC.etat === 'appli' && !fenetre && !(typeof MOBILE !== 'undefined' && MOBILE.actif) && !(typeof enPause !== 'undefined' && enPause);
}

/** Appui : une carte de réponse est saisie (true si l'appui est pris) */
function debutGlisser() {
	if (!glisserPossible() || GLISSER.carte) return false;
	const p = sourisPC();
	const c = CARTES.find((k) => dansRect(p, k));
	if (!c) return false;
	Object.assign(GLISSER, { carte: c, x: c.x, y: c.y, dx: p.x - c.x, dy: p.y - c.y, x0: p.x, y0: p.y, vx: 0, ang: 0, retour: null });
	return true;
}
/** Relâchement : clic (décide), dépôt sur le dossier (décide + frappe), ou retour en ressort */
function relacherGlisser() {
	const c = GLISSER.carte;
	if (!c) return false;
	const p = sourisPC();
	GLISSER.carte = null;
	const deplace = Math.hypot(p.x - GLISSER.x0, p.y - GLISSER.y0);
	if (deplace < SEUIL_CLIC_PX) {
		Confort.Son.clic();
		decider(c.cle);
		return true;
	}
	const centre = { x: p.x - GLISSER.dx + c.l / 2, y: p.y - GLISSER.dy + c.h / 2 };
	if (dansRect(p, ZONE_DEPOT) || dansRect(centre, ZONE_DEPOT)) {
		GLISSER.frappe = { t: millis(), x: GLISSER.x, y: GLISSER.y, l: c.l, h: c.h };
		secouer(4);
		decider(c.cle);
		return true;
	}
	GLISSER.retour = { carte: c, x: GLISSER.x, y: GLISSER.y, t: millis() };
	annoncer(t('glisser.annule', { reponse: c.lib }));
	return true;
}

// ——— Poids ———
/** Secousse d'écran : amplitude selon l'effet le plus fort (deltas réels), coupée avec les animations réduites */
function secouer(amp) {
	if (reduireAnimations) return;
	const reste = millis() - SECOUSSE.t < 300 ? SECOUSSE.amp : 0;
	SECOUSSE.t = millis();
	SECOUSSE.amp = Math.max(amp, reste);
}
function amplitudeDeltas(deltas) {
	const m = Math.max(0, ...(deltas || []).map((v) => Math.abs(v)));
	return m >= 10 ? 9 : m >= 6 ? 5 : m > 0 ? 2 : 0;
}
/** Décalage de la secousse pour cette image ({x, y}) ou null */
function decalageSecousse() {
	if (reduireAnimations) return null;
	const u = (millis() - SECOUSSE.t) / 360;
	if (u >= 1 || !SECOUSSE.amp) return null;
	const a = SECOUSSE.amp * (1 - u) * (1 - u);
	return { x: Math.round(Math.sin(millis() / 17) * a), y: Math.round(Math.cos(millis() / 23) * a * 0.6) };
}

// ——— Dessin (appelé par panneau.js, dans l'écran du PC) ———
/** Emplacement vide d'une carte saisie : pointillés */
function emplacementCarte(c) {
	noFill();
	stroke(255, 255, 255, 90);
	strokeWeight(2);
	drawingContext.setLineDash([8, 8]);
	rect(c.x + 1, c.y + 1, c.l - 2, c.h - 2);
	drawingContext.setLineDash([]);
	noStroke();
}
const carteSaisie = (cle) => (GLISSER.carte && GLISSER.carte.cle === cle) || (GLISSER.retour && GLISSER.retour.carte.cle === cle);
/** Zone de dépôt, carte flottante, retour en ressort, frappe */
function dessinerGlisser() {
	const c = GLISSER.carte;
	const z = ZONE_DEPOT;
	if (c && z) {
		// Carte flottante : suit la souris avec un léger retard, s'incline selon la vitesse
		const tx = mouseX - GLISSER.dx;
		const ty = mouseY - GLISSER.dy;
		const k = reduireAnimations ? 1 : 0.38;
		const nx = GLISSER.x + (tx - GLISSER.x) * k;
		GLISSER.vx = nx - GLISSER.x;
		GLISSER.x = nx;
		GLISSER.y += (ty - GLISSER.y) * k;
		GLISSER.ang = reduireAnimations ? 0 : constrain(GLISSER.vx * 0.006, -0.12, 0.12);
		const dessus = dansRect({ x: mouseX, y: mouseY }, z) || dansRect({ x: GLISSER.x + c.l / 2, y: GLISSER.y + c.h / 2 }, z);
		// Zone du dossier : pointillés, « Déposer ici »
		noStroke();
		fill(dessus ? 'rgba(255,193,56,0.16)' : 'rgba(255,193,56,0.06)');
		rect(z.x, z.y, z.l, z.h);
		noFill();
		stroke(C.orange);
		strokeWeight(dessus ? 4 : 3);
		drawingContext.setLineDash([14, 10]);
		rect(z.x + 2, z.y + 2, z.l - 4, z.h - 4);
		drawingContext.setLineDash([]);
		noStroke();
		const lib = t('glisser.deposer');
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(22);
		const ll = textWidth(lib) + 32;
		fill(C.orange);
		rect(z.x + z.l / 2 - ll / 2, z.y + z.h / 2 - 22, ll, 44);
		fill(DS.fond);
		textAlign(CENTER, CENTER);
		text(lib, z.x + z.l / 2, z.y + z.h / 2);
		textStyle(NORMAL);
		carteFlottante(c, GLISSER.x, GLISSER.y, GLISSER.ang, true);
	}
	// Retour en ressort (250 ms, instantané si animations réduites)
	const r = GLISSER.retour;
	if (r) {
		const u = reduireAnimations ? 1 : Math.min(1, (millis() - r.t) / 250);
		const e = 1 - Math.pow(1 - u, 3) + (u < 1 ? Math.sin(u * Math.PI) * 0.08 : 0);
		carteFlottante(r.carte, r.x + (r.carte.x - r.x) * e, r.y + (r.carte.y - r.y) * e, 0, false);
		if (u >= 1) GLISSER.retour = null;
	}
	// Frappe sur le dossier : un éclair bref (160 ms), une seule fois
	const f = GLISSER.frappe;
	if (f && z) {
		const u = (millis() - f.t) / 160;
		if (u >= 1 || reduireAnimations) GLISSER.frappe = null;
		else {
			noStroke();
			fill(255, 255, 255, 60 * (1 - u));
			rect(z.x, z.y, z.l, z.h);
		}
	}
}
/** Carte de réponse dessinée hors de sa grille : ombre, fond, liseré, titre */
function carteFlottante(c, x, y, ang, ombre) {
	push();
	translate(x + c.l / 2, y + c.h / 2);
	rotate(ang);
	noStroke();
	if (ombre) {
		fill(0, 0, 0, 110);
		rect(-c.l / 2 + 12, -c.h / 2 + 16, c.l, c.h);
	}
	fill('#232121');
	rect(-c.l / 2, -c.h / 2, c.l, c.h);
	stroke('#FFFFFF');
	strokeWeight(3);
	noFill();
	rect(-c.l / 2 + 1, -c.h / 2 + 1, c.l - 2, c.h - 2);
	noStroke();
	fill(C.primaire);
	rect(-c.l / 2, -c.h / 2, 44, 40);
	fill('#FFFFFF');
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(20);
	textAlign(CENTER, CENTER);
	text(c.touche, -c.l / 2 + 22, -c.h / 2 + 20);
	textAlign(LEFT, CENTER);
	ajusterTaille(String(c.lib), c.l - 70, 20, 16);
	text(String(c.lib), -c.l / 2 + 56, -c.h / 2 + 20);
	textStyle(NORMAL);
	pop();
	textAlign(LEFT, TOP);
}
