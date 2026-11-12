/* Nantes en régulation — prompt 53 : animations de feedback du gameplay.
 * - Jauges : la barre glisse vers sa nouvelle valeur (eased, ~600 ms) ; sous 20 (Q46), pulsation douce en opacité
 *   au lieu d'un clignotement sec.
 * - Prompt 184 : après un changement, plus de chiffre flottant ni d'éclair — le segment gagné apparaît en vert
 *   (DS.succes éclairci) puis rejoint la couleur de la barre, le segment perdu reste en rouge (DS.erreur) puis se
 *   résorbe ; un triangle ▲ / ▼ sous le segment (forme, pas seulement couleur) ; ~900 ms ; jauge inchangée : rien.
 *   Couleurs des palettes daltonisme (accessibilite.js). Animations réduites ou « Secousses des décisions » à 0 % :
 *   aucun mouvement, le segment s'affiche entier puis disparaît en fondu court.
 * - Arrivée d’un dossier : tampon « SIGNALEMENT » qui s’imprime (prompt 73 : plus de carte, donc plus de ligne qui pulse).
 * - Urgence (< 10 s) : barre du compteur rouge qui pulse, tic-tac plus fort.
 * Animations réduites : valeurs directes, tampon direct, rien ne pulse ni ne coule.
 * Toutes les pulsations ≤ 1,5 par seconde. game.js n'est pas touché.
 */
const JAUGES_AFF = { v: null, cible: null, depuis: null, debut: 0, deltas: [], paquet: null };
const DUREE_JAUGE_MS = 600;
const DUREE_ECART_MS = 900; // prompt 184 : durée du segment coloré (600–900 ms demandés)
const NOMS_J = ['fluidite', 'reputation', 'budget'];

/** Pulsation douce 0 → 1 (sinus), fréquence en Hz (≤ 1,5) ; 1 fixe si animations réduites */
function pulsationDouce(hz) {
	if (reduireAnimations) return 1;
	return 0.5 + 0.5 * Math.sin((millis() / 1000) * Math.PI * 2 * hz);
}
/** Prompt 184 : pas de mouvement des jauges (animations réduites, ou « Secousses des décisions » à 0 %) */
const jaugesSansMouvement = () => !!reduireAnimations || (typeof Juice !== 'undefined' && Juice.intensite() === 0);

/** Valeurs affichées des jauges (eased vers les vraies valeurs) ; note chaque écart (avant → après) des jauges qui changent */
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
			if (d) A.deltas.push({ jauge: k, d, avant: A.cible[k], apres: reel[k], t: millis() }); // jauge inchangée : aucun écart
		});
		A.depuis = Object.assign({}, A.v);
		A.cible = Object.assign({}, reel);
		A.debut = millis();
	}
	const u = jaugesSansMouvement() ? 1 : constrain((millis() - A.debut) / DUREE_JAUGE_MS, 0, 1);
	const e = easeOut(u);
	NOMS_J.forEach((k) => (A.v[k] = A.depuis[k] + (A.cible[k] - A.depuis[k]) * e));
	A.deltas = A.deltas.filter((x) => millis() - x.t < DUREE_ECART_MS);
	return A.v;
}
/** Prompt 184 : segments colorés en cours sur une jauge, à l'instant donné — [{ sens: 1 | -1, de, a, alpha }] en
 * valeurs 0–100. Gain : le segment pousse avec la barre (même courbe), puis se fond dans sa couleur. Perte : le segment
 * retiré reste entier un instant, puis se résorbe vers la nouvelle valeur. Sans mouvement : entier, puis fondu court. */
function segmentsEcart(cle, maintenant) {
	const fixe = jaugesSansMouvement();
	const force = fixe ? 1 : 0.6 + 0.4 * (typeof Juice !== 'undefined' ? Juice.intensite() : 1); // intensité du signal (prompt 175)
	return JAUGES_AFF.deltas
		.filter((d) => d.jauge === cle)
		.map((d) => {
			const u = (maintenant - d.t) / DUREE_ECART_MS;
			if (u < 0 || u >= 1) return null;
			const fondu = 1 - constrain((u - 0.7) / 0.3, 0, 1); // ~270 ms de fondu à la fin, jamais de clignotement
			if (fixe) return { sens: Math.sign(d.d), de: d.avant, a: d.apres, alpha: fondu };
			if (d.d > 0) return { sens: 1, de: d.avant, a: d.avant + d.d * easeOut(constrain(u / (DUREE_JAUGE_MS / DUREE_ECART_MS), 0, 1)), alpha: force * (1 - constrain((u - 0.55) / 0.45, 0, 1)) };
			return { sens: -1, de: d.apres, a: d.avant + d.d * easeOut(constrain((u - 0.3) / 0.7, 0, 1)), alpha: force };
		})
		.filter((s) => s && s.alpha > 0 && Math.abs(s.a - s.de) > 0.05);
}
/** Prompt 184 : segment gagné (vert) ou perdu (rouge) et son triangle ▲ / ▼ sous la barre (x, y : coin haut gauche,
 * l : largeur, hb : hauteur). Remplace le chiffre flottant et l'éclair des prompts 53 / 94. */
function dessinerDeltasJauge(cle, x, y, l, hb) {
	const h = hb || 16;
	segmentsEcart(cle, millis()).forEach((s) => {
		const x0 = x + (l * constrain(Math.min(s.de, s.a), 0, 100)) / 100;
		const x1 = x + (l * constrain(Math.max(s.de, s.a), 0, 100)) / 100;
		const gain = s.sens > 0;
		const c = gain ? lerpColor(color(DS.succes), color(DS.blanc), 0.45) : color(DS.erreur); // vert éclairci : distinct d'une barre déjà verte
		c.setAlpha(255 * s.alpha);
		noStroke();
		fill(c);
		rect(x0, y, Math.max(2, x1 - x0), h);
		const bord = color(DS.fond); // séparation nette avec la barre (barre rouge sous 20, verte au-dessus de 40)
		bord.setAlpha(255 * s.alpha);
		fill(bord);
		rect(x0 - 1, y, 2, h); // au point de départ (gain) ou d’arrivée (perte)
		const cs = color(gain ? DS.succes : C.rouge); // ▲ / ▼ : la forme porte le sens, pas seulement la couleur
		cs.setAlpha(255 * s.alpha);
		fill(cs);
		const cx = constrain((x0 + x1) / 2, x + 6, x + l - 6);
		const ty = y + h + 3;
		if (gain) triangle(cx - 6, ty + 7, cx + 6, ty + 7, cx, ty);
		else triangle(cx - 6, ty, cx + 6, ty, cx, ty + 7);
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
	const eb = u >= 1 ? 1 : 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2); // prompt 96 : pop ease-out-back, finit exactement à 1
	scale(1.6 - 0.6 * eb);
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
