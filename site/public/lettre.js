/* Nantes en régulation — prompt 228 : la lettre posée sur le bureau devient une vraie lettre.
 * Une enveloppe (papier vieilli, timbre et cachet pixel) attend sur le bureau tant qu'une lettre du jour n'est pas lue :
 * lettre de SANCTION (rappel à l'ordre ou dernier avertissement reçu aujourd'hui), sinon de BILAN (rapport de la veille),
 * sinon de MISSION (objectif et priorités du jour). Clic, Entrée ou L : l'enveloppe s'ouvre (rabat 200 ms), la lettre
 * se déplie ; en-tête (expéditeur, date de jeu), objet, corps, informations clés surlignées, signature manuscrite.
 * Rangée (Échap, L, bouton), elle est lue : elle passe dans Mails, dossier « Lettres lues ». Faits réels uniquement.
 * Remplace la fenêtre « rapport de la veille » du prompt 89 bis.
 */
const LETTRE = { courante: null, debut: 0, fermeture: null };
const PAPIER = '#F5F5DC';
const ENCRE = '#1A1A1A';
const ORDRE_LETTRES = ['sanction', 'bilan', 'mission'];

/** Lettres lues de la partie (sauvegardées avec Jeu.taches) */
function lettresLues() {
	const e = typeof Taches !== 'undefined' && Taches.etat ? Taches.etat() : null;
	if (!e) return [];
	if (!Array.isArray(e.lettresLues)) e.lettresLues = [];
	return e.lettresLues;
}
const dateCourte = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
/** Les lettres du jour (faits réels), dans l'ordre d'importance */
function lettresDuJour() {
	if (typeof Jeu === 'undefined' || ecran !== 'jeu' || phase === 'fin' || !Jeu.jourCourant || !Jeu.jourCourant()) return [];
	const jr = Jeu.jourCourant();
	const out = [];
	// Sanction : rappel à l'ordre ou dernier avertissement reçu aujourd'hui
	const S = Jeu.statutPatron;
	const sanctions = S && S.dates ? S.dates.filter((d) => String(d).split('|')[1] === jr.date) : [];
	if (sanctions.length && S.avertissements) {
		out.push({
			id: 'sanction|' + jr.date + '|' + S.avertissements,
			type: 'sanction',
			jour: jr.date,
			objet: t(S.avertissements >= 2 ? 'lettre.sanction.objetDernier' : 'lettre.sanction.objet'),
			corps: t(S.avertissements >= 2 ? 'lettre.sanction.corpsDernier' : 'lettre.sanction.corps'),
			cles: [
				{ lib: t('lettre.cle.avertissements'), val: String(S.avertissements) + ' / 2' },
				{ lib: t('lettre.cle.score'), val: Jeu.score() + ' / 300' },
				{ lib: t('lettre.cle.sortir'), val: t('lettre.sanction.sortir', { s: 140 }) },
			],
		});
	}
	// Bilan : le rapport de la veille (prompt 89 bis)
	const v = typeof rapportVeille === 'function' ? rapportVeille() : null;
	if (v) {
		const prio = (v.priorites || []).map((p) => t('tache.prio.' + p.id, p.vars) + ' — ' + t('tache.etat.' + p.etat));
		const cles = [{ lib: t('lettre.cle.fait'), val: String(v.fait) }];
		if (prio.length) cles.push({ lib: t('lettre.cle.priorites'), val: prio.join(' ; ') });
		if (v.demande) cles.push({ lib: t('lettre.cle.decision'), val: t('tache.demande.' + v.demande, Taches.R.demande) + ' — ' + t(v.accordee ? 'veilleRapport.accordee' : 'veilleRapport.refusee') });
		out.push({ id: 'bilan|' + v.date, type: 'bilan', jour: jr.date, objet: t('lettre.bilan.objet', { date: dateCourte(v.date) }), corps: t('lettre.bilan.corps'), cles });
	}
	// Mission : objectif et priorités du jour
	const o = Jeu.objectifDuJour ? Jeu.objectifDuJour() : null;
	if (o) {
		const tj = typeof Taches !== 'undefined' ? Taches.jour(jr.date) : null;
		const prio = tj && tj.priorites ? tj.priorites.map((p) => t('tache.prio.' + p.id, p.vars)) : [];
		const cles = [
			{ lib: t('lettre.cle.objectif'), val: String(o.libelle) },
			{ lib: t('lettre.cle.service'), val: Jeu.formaterHeure(Jeu.debutJournee ? Jeu.debutJournee() : 480) + ' → ' + Jeu.formaterHeure(Jeu.finJournee()) },
		];
		if (prio.length) cles.push({ lib: t('lettre.cle.priorites'), val: prio.join(' ; ') });
		out.push({ id: 'mission|' + jr.date, type: 'mission', jour: jr.date, objet: t('lettre.mission.objet', { date: dateCourte(jr.date) }), corps: t('lettre.mission.corps', { n: (jr.dossiers || []).length }), cles });
	}
	return out;
}
/** La lettre qui attend sur le bureau (la plus importante non lue), ou null */
function lettreSurBureau() {
	const lues = new Set(lettresLues().map((l) => l.id));
	return lettresDuJour().find((l) => !lues.has(l.id)) || null;
}
/** Texte complet d'une lettre (lecteur d'écran, Mails « Lettres lues ») */
function texteLettre(l) {
	return [t('lettre.de'), t('lettre.objetLigne', { objet: l.objet }), l.corps, ...l.cles.map((c) => c.lib + ' : ' + c.val), t('lettre.signature')].join('\n');
}

// ——— Ouvrir, ranger ———
function ouvrirLettre() {
	const l = lettreSurBureau() || LETTRE.courante;
	if (!l) return false;
	LETTRE.courante = l;
	LETTRE.debut = millis();
	LETTRE.fermeture = null;
	ouvrir('lettre');
	Confort.Son.bip('choix');
	annoncer(t('lettre.annonce', { type: t('lettre.type.' + l.type) }) + ' ' + texteLettre(l).replace(/\n/g, ' · '));
	return true;
}
function rangerLettre() {
	if (fenetre !== 'lettre' || !LETTRE.courante) return fermer();
	if (LETTRE.fermeture) return;
	LETTRE.fermeture = millis();
	const l = LETTRE.courante;
	if (!lettresLues().some((x) => x.id === l.id)) lettresLues().push({ id: l.id, type: l.type, jour: l.jour, heure: Jeu.horloge ? Jeu.formaterHeure(Jeu.horloge.minutes) : '', objet: l.objet, texte: texteLettre(l) });
	annoncer(t('lettre.rangee'));
	if (reduireAnimations) finRangement();
}
function finRangement() {
	LETTRE.fermeture = null;
	LETTRE.courante = null;
	if (fenetre === 'lettre') fermer();
}
/** Clavier : Échap / Entrée / L rangent la lettre ouverte ; L ouvre celle du bureau (sinon, L change la langue) */
function toucheLettre() {
	if (fenetre === 'lettre') {
		if (keyCode === ESCAPE || keyCode === ENTER || keyCode === RETURN || key === 'l' || key === 'L') return rangerLettre(), true;
		return true;
	}
	if ((key === 'l' || key === 'L') && ecran === 'jeu' && !fenetre && !MENU.actif && !tutoriel && lettreSurBureau()) return ouvrirLettre(), true;
	return false;
}

// ——— Dessin ———
/** Sur le bureau (pixel art, plan « proches ») : l'enveloppe fermée, timbre et cachet */
function dessinerEnveloppeBureau(g, o) {
	const x = o.x;
	const y = o.y;
	const w = o.l;
	const h = o.h;
	ombreTramee(g, x + 2, y + h, w, 2, 100);
	px(g, '#d8d2b4', x, y, w, h);
	px(g, PAPIER, x + 1, y + 1, w - 2, h - 2);
	for (let i = 0; i < Math.floor(h / 2); i++) {
		px(g, '#c9c2a2', x + 1 + i * 2, y + 1 + i, 2, 1); // rabat
		px(g, '#c9c2a2', x + w - 3 - i * 2, y + 1 + i, 2, 1);
	}
	px(g, '#b3261e', x + Math.floor(w / 2) - 2, y + Math.floor(h / 2) - 2, 5, 5); // cachet
	px(g, '#3860ff', x + w - 9, y + 2, 6, 5); // timbre
	px(g, '#f5f5dc', x + w - 8, y + 3, 4, 3);
}
/** La fenêtre : ouverture de l'enveloppe (200 ms), dépliage (350 ms), lettre stable ; rangement (200 ms) */
function fenetreLettre() {
	const l = LETTRE.courante;
	if (!l) return fermer();
	const portrait = typeof PORTRAIT !== 'undefined' && PORTRAIT.actif;
	const ms = millis() - LETTRE.debut;
	const kOuvre = reduireAnimations ? 1 : constrain(ms / 200, 0, 1);
	const kDeplie = reduireAnimations ? 1 : easeOut(constrain((ms - 200) / 350, 0, 1));
	let kRange = 0;
	if (LETTRE.fermeture) {
		kRange = constrain((millis() - LETTRE.fermeture) / 200, 0, 1);
		if (kRange >= 1) return finRangement();
	}
	const lp = portrait ? 600 : 1000;
	const tCorps = portrait ? 28 : 26;
	const tCle = portrait ? 30 : 28;
	// Hauteur du contenu
	const lc = lp - (portrait ? 64 : 120);
	const oCorps = { taille: tCorps, interligne: tCorps + 10, couleur: ENCRE, maxLignes: 8 };
	const oCle = { taille: tCle, interligne: tCle + 8, couleur: ENCRE, style: BOLD, maxLignes: 4 };
	const hCles = l.cles.reduce((s, c) => s + 36 + hauteurTexte(String(c.val), lc - 32, oCle) + 24, 0);
	const hp = Math.min(H - 60, 140 + 70 + hauteurTexte(l.corps, lc, oCorps) + 30 + hCles + 150 + (portrait ? 150 : 0)); // portrait : date sur sa ligne, signature au-dessus du bouton
	const x = (L - lp) / 2;
	const y0 = (H - hp) / 2;
	noStroke();
	fill(0, 0, 0, 140);
	rect(0, 0, L, H);
	push();
	if (kRange) {
		drawingContext.globalAlpha = 1 - kRange;
		translate(L / 2, H / 2);
		scale(1 - 0.08 * kRange);
		translate(-L / 2, -H / 2);
	}
	// Enveloppe ouverte (sous la lettre) pendant l'ouverture
	if (kDeplie < 1) {
		const ew = lp;
		const eh = 320;
		const ex = x;
		const ey = (H - eh) / 2 + 120;
		fill(0, 0, 0, 80);
		rect(ex + 14, ey + 18, ew, eh);
		fill('#e7e0bf');
		rect(ex, ey, ew, eh);
		// Rabat : triangle qui se soulève
		const apex = lerp(ey + eh * 0.55, ey - eh * 0.45, kOuvre);
		fill('#d8d0a8');
		triangle(ex, ey, ex + ew, ey, ex + ew / 2, apex);
		fill('#b3261e');
		if (kOuvre < 0.5) rect(ex + ew / 2 - 18, lerp(ey + eh * 0.5, ey, kOuvre * 2) - 18, 36, 36); // cachet qui se rompt
	}
	// La lettre qui sort et se déplie
	const hVisible = lerp(120, hp, kDeplie);
	const y = kDeplie < 1 ? lerp((H - 320) / 2 + 160, y0, kDeplie) : y0;
	fill(0, 0, 0, 90);
	rect(x + 16, y + 20, lp, hVisible);
	fill(PAPIER);
	rect(x, y, lp, hVisible);
	if (kDeplie >= 1) {
		// Plis du papier
		fill(0, 0, 0, 14);
		rect(x, y + hp / 3, lp, 2);
		rect(x, y + (2 * hp) / 3, lp, 2);
		const m = portrait ? 32 : 60;
		let yy = y + (portrait ? 28 : 44);
		textAlign(LEFT, TOP);
		textFont(POLICE_DONNEES);
		textSize(portrait ? 22 : 20);
		fill('#4a4538');
		text(t('lettre.de'), x + m, yy);
		const laDate = typeof jourDate === 'function' ? jourDate(l.jour) : l.jour;
		if (portrait) text(laDate, x + m, (yy += 34));
		else (textAlign(RIGHT, TOP), text(laDate, x + lp - m, yy));
		yy += 34;
		textAlign(LEFT, TOP);
		text(t('lettre.a'), x + m, yy);
		yy += 52;
		yy += dessinerTexte(t('lettre.objetLigne', { objet: l.objet }), x + m, yy, lc, { taille: portrait ? 30 : 30, interligne: 38, couleur: ENCRE, style: BOLD, maxLignes: 2 }).h + 18;
		yy += dessinerTexte(l.corps, x + m, yy, lc, oCorps).h + 24;
		l.cles.forEach((c) => {
			const hv = hauteurTexte(String(c.val), lc - 32, oCle);
			fill('#efe1a0');
			rect(x + m - 8, yy, lc + 16, 36 + hv + 12);
			fill('#b38f00');
			rect(x + m - 8, yy, 6, 36 + hv + 12);
			dessinerTexte(c.lib, x + m + 16, yy + 8, lc - 32, { taille: portrait ? 22 : 20, interligne: 26, couleur: '#4a4538', police: POLICE_DONNEES, maxLignes: 1 });
			dessinerTexte(String(c.val), x + m + 16, yy + 36, lc - 32, oCle);
			yy += 36 + hv + 24;
		});
		// Signature manuscrite : un paraphe tracé, puis le nom
		const sy = y + hp - (portrait ? 220 : 120);
		noFill();
		stroke(ENCRE);
		strokeWeight(3);
		textFont(POLICE_TEXTE);
		textStyle(ITALIC);
		textSize(portrait ? 24 : 22);
		const sx = x + lp - m - Math.max(260, textWidth(t('lettre.signature'))); // la signature reste dans la feuille
		textStyle(NORMAL);
		beginShape();
		[[0, 30], [20, 0], [34, 34], [52, 6], [70, 36], [96, 10], [120, 30], [170, 18], [230, 26]].forEach(([a, b]) => curveVertex(sx + a, sy + b));
		endShape();
		noStroke();
		textFont(POLICE_TEXTE);
		textStyle(ITALIC);
		textSize(portrait ? 24 : 22);
		fill(ENCRE);
		textAlign(LEFT, TOP);
		text(t('lettre.signature'), sx, sy + 46);
		textStyle(NORMAL);
		// Ranger
		if (!LETTRE.fermeture) bouton(x + m, y + hp - (portrait ? 96 : 84), portrait ? 360 : 320, hCible(56, 74), t('lettre.ranger'), rangerLettre); // primaire (rouge) : lisible sur le papier
	}
	pop();
	if (typeof zoneFenetre === 'function') zoneFenetre(x, y0, lp, hp);
}
