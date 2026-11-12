/* Nantes en régulation — carte des alertes réelles (prompt 102), rendue interactive et peuplée (prompts 106, 108, 109).
 * - Fond réel : eau (occupation du sol 2022) et tracés des lignes (GTFS Naolib) de data/lignes.json.
 * - Prompt 106 : carte interactive — glisser pour se déplacer, molette (centrée sur le curseur), boutons + / −,
 *   « Recentrer » (touche Origine), Maj + flèches. Elle glisse UNE fois vers le signalement ouvert, puis reste
 *   là où le joueur la met. Les signalements sont à leur lieu réel (jamais inventé) :
 *     · ligne(s) citée(s) par le dossier → un point du tracé GTFS de la ligne (choisi de façon déterministe) ;
 *     · événement de l'agenda → le lieu géocodé (data/lieux.json, OpenStreetMap via Nominatim) ;
 *     · alerte météo → toute la métropole ; sinon → case « Lieu à préciser ».
 * - Prompt 108 : panneau des équipes à droite (x 1576 → 1880) ; une pastille par équipe ; glisser une pastille
 *   disponible sur N'IMPORTE QUEL marqueur (ou sur la fenêtre du dossier ouvert) = Jeu.envoyerEquipe. Clic sur une
 *   pastille puis sur un marqueur = même chose ; Maj + 1–4 envoient au dossier ouvert.
 * - Prompt 109 : les équipes partent de leur centre d'intervention réel (data/lieux.json), avancent vers le lieu
 *   (tracé à vol d'oiseau, en pointillés, partie parcourue pleine), restent sur place, puis rentrent.
 */
Jeu.incidentsFictifs = (() => {
	// prompt 119 : incidents inventés rares, marqués « Fictif » ; ?fictifs=0 les retire
	try {
		return new URLSearchParams(location.search).get('fictifs') !== '0';
	} catch (e) {
		return true;
	}
})();
Jeu.plateauEquipesVisible = true; // prompt 103 : le panneau des équipes dit les effectifs (pas de doublon chez le patron)
const CARTE = { zone: null, vue: null, cible: null, marqueurs: [], arrivees: {}, jeton: null, jetonChoisi: null, retour: null, jetons: [], depots: [], pan: null, centreSur: null, ligneSurvol: null, survolFrame: 0, controles: [] };
const MENU_APP = { x: 40, y: 132, l: 128, h: 900 }; // prompt 103 : colonne du menu
const ZONE_CARTE = { x: 184, y: 132, l: 1376, h: 900 }; // prompt 108 : la carte laisse la droite aux équipes
const PANNEAU_EQUIPES = { x: 1576, y: 132, l: 304, h: 900 };
const FENETRE_DIALOGUE = { l: 820, h: 868 }; // prompt 107 : fenêtre flottante du plaignant
const ZONE_CARTE_PLEINE = ZONE_CARTE; // compatibilité (portrait, indicateur de sauvegarde)
const PHASES_DOSSIER_CARTE = ['decision', 'contradiction', 'conflit', 'narration'];
const LIEUX = (typeof window !== 'undefined' && window.LIEUX_DONNEES) || { centres: {}, lieux: {} };

/** Souris (hors image) dans les coordonnées de l'appli (plein écran depuis le prompt 105) */
function sourisAppli() {
	const p = typeof sourisPC === 'function' ? sourisPC() : { x: mouseX, y: mouseY };
	const A = typeof FENETRE_APPLI !== 'undefined' ? FENETRE_APPLI : null;
	if (!A || typeof PC === 'undefined' || !(PC.etat === 'appli' || (typeof vueIntegree === 'function' && vueIntegree()))) return p;
	return { x: (p.x - A.x) / A.k, y: (p.y - A.y) / A.k };
}
const dossierOuvert = () => typeof phase !== 'undefined' && PHASES_DOSSIER_CARTE.includes(phase);
const zoneCarte = () => ZONE_CARTE;
const dansZone = (p, r) => !!r && p.x >= r.x && p.x <= r.x + r.l && p.y >= r.y && p.y <= r.y + r.h;

// ——— Lieu d'une alerte (jamais inventé) ———
const centreEmprise = () => {
	const e = Jeu.lignes.emprise;
	return [(e.est + e.ouest) / 2, (e.nord + e.sud) / 2];
};
const fraction = (i) => (((i + 1) * 2654435761) % 1000) / 1000; // déterministe pour un dossier
function pointSurLigne(ln, i) {
	let best = null;
	(ln.traces || []).forEach((tr) => {
		if (!best || tr.length > best.length) best = tr;
	});
	if (!best || !best.length) return null;
	const k = Math.floor((0.2 + 0.6 * fraction(i)) * (best.length - 1));
	return best[k];
}
const lieuEvenement = (d) => {
	const p = String(d.texte_source || '').split(' — ');
	return p.length > 1 ? p[p.length - 1] : null;
};
function lieuAlerte(it) {
	const d = it.d;
	if (!Jeu.lignes || !d) return { sorte: 'aPreciser' };
	if (d.type === 'alerte météo') return { sorte: 'metropole', pt: centreEmprise() };
	if (d.lignes && d.lignes.length) {
		// Prompt 106 : le plaignant dit sur quelle ligne il est — un point du tracé réel de cette ligne
		const lignes = d.lignes.map((n) => Jeu.lignes.lignes.find((x) => x.nom === String(n))).filter(Boolean);
		const pt = lignes.length ? pointSurLigne(lignes[0], it.index) : null;
		if (pt) return { sorte: 'ligne', pt, lignes };
	}
	const v = lieuEvenement(d);
	const g = v && LIEUX.lieux ? LIEUX.lieux[v] : null;
	if (g) return { sorte: 'lieu', pt: [g.lon, g.lat], nom: v };
	return { sorte: 'aPreciser' };
}
function texteLieu(lieu, d) {
	if (lieu.sorte === 'ligne') return lieu.lignes.map((l) => t('sujet.ligne', { ligne: l.nom })).join(', ');
	if (lieu.sorte === 'metropole') return t('carte.metropole');
	if (lieu.sorte === 'lieu') return lieu.nom;
	const v = lieuEvenement(d);
	return t('carte.lieuAPreciser') + (v ? ' · ' + v : '');
}

// ——— Vue : centre et échelle, interactifs (prompt 106) ———
function echelleBase(z) {
	const e = Jeu.lignes.emprise;
	const kx = Math.cos((((e.nord + e.sud) / 2) * Math.PI) / 180);
	return { ech: Math.min(z.l / ((e.est - e.ouest) * kx), z.h / (e.nord - e.sud)) * 1.05, kx };
}
function initVue(z) {
	const b = echelleBase(z);
	const c = centreEmprise();
	if (!CARTE.cible) CARTE.cible = { lon: c[0], lat: c[1], ech: b.ech };
	if (!CARTE.vue) CARTE.vue = Object.assign({}, CARTE.cible);
	CARTE.kx = b.kx;
	CARTE.ech0 = b.ech;
}
function borner() {
	const c = CARTE.cible;
	c.ech = constrain(c.ech, CARTE.ech0, CARTE.ech0 * 8);
	const e = Jeu.lignes.emprise;
	c.lon = constrain(c.lon, e.ouest, e.est);
	c.lat = constrain(c.lat, e.sud, e.nord);
}
function majVue(z) {
	initVue(z);
	borner();
	if (reduireAnimations || CARTE.pan) CARTE.vue = Object.assign({}, CARTE.cible);
	else {
		const k = Math.min(1, (deltaTime || 16) / 90);
		['lon', 'lat', 'ech'].forEach((p) => (CARTE.vue[p] += (CARTE.cible[p] - CARTE.vue[p]) * k));
	}
	const v = CARTE.vue;
	const kx = CARTE.kx;
	return {
		x: (lon) => z.x + z.l / 2 + (lon - v.lon) * kx * v.ech,
		y: (lat) => z.y + z.h / 2 - (lat - v.lat) * v.ech,
	};
}
function zoomer(facteur, px, py) {
	if (!CARTE.cible || !CARTE.zone) return;
	const z = CARTE.zone;
	const c = CARTE.cible;
	const ax = px === undefined ? z.x + z.l / 2 : px;
	const ay = py === undefined ? z.y + z.h / 2 : py;
	// le point sous le curseur reste sous le curseur
	const lon = c.lon + (ax - z.x - z.l / 2) / (CARTE.kx * c.ech);
	const lat = c.lat - (ay - z.y - z.h / 2) / c.ech;
	const ech = constrain(c.ech * facteur, CARTE.ech0, CARTE.ech0 * 8);
	c.lon = lon - (ax - z.x - z.l / 2) / (CARTE.kx * ech);
	c.lat = lat + (ay - z.y - z.h / 2) / ech;
	c.ech = ech;
	borner();
}
function deplacer(dx, dy) {
	if (!CARTE.cible) return;
	CARTE.cible.lon -= dx / (CARTE.kx * CARTE.cible.ech);
	CARTE.cible.lat += dy / CARTE.cible.ech;
	borner();
}
function recentrer() {
	if (!CARTE.zone || !Jeu.lignes) return;
	const m = CARTE.marqueurs.find((k) => k.courant && k.lieu.pt);
	const c = m ? m.lieu.pt : centreEmprise();
	CARTE.cible = { lon: c[0], lat: c[1], ech: m ? CARTE.ech0 * 2.5 : CARTE.ech0 };
	annoncer(t('carte.recentrer'));
}

// ——— Dessin de la carte ———
function tracerLigne(pr, tr) {
	beginShape();
	tr.forEach((p) => vertex(pr.x(p[0]), pr.y(p[1])));
	endShape();
}
function dessinerCarteAlertes() {
	const z = ZONE_CARTE;
	CARTE.zone = z;
	CARTE.zoneLibre = null;
	CARTE.depots = [];
	CARTE.controles = [];
	noStroke();
	fill(DS.fond);
	rect(z.x, z.y, z.l, z.h);
	const f = fileIncidents();
	const enCours = ['decision', 'contradiction', 'conflit'].includes(phase);
	CARTE.marqueurs = f.map((it, r) => ({ it, r, lieu: lieuAlerte(it), courant: (enCours || phase === 'narration') && it.index === Jeu.index, actif: typeof actifDe === 'function' && !!actifDe(it.d) }));
	if (!Jeu.lignes) return dessinerPanneauEquipes();
	const pr = majVue(z);
	CARTE.pr = pr;
	// Signalement ouvert : la carte glisse une fois vers lui
	if (dossierOuvert() && CARTE.centreSur !== Jeu.index) {
		CARTE.centreSur = Jeu.index;
		const m = CARTE.marqueurs.find((k) => k.courant && k.lieu.pt);
		if (m) Object.assign(CARTE.cible, { lon: m.lieu.pt[0], lat: m.lieu.pt[1], ech: Math.max(CARTE.cible.ech, CARTE.ech0 * 2.5) });
	}
	// Glisser la carte
	if (CARTE.pan) {
		deplacer(mouseX - CARTE.pan.x, mouseY - CARTE.pan.y);
		CARTE.pan.x = mouseX;
		CARTE.pan.y = mouseY;
		CARTE.vue = Object.assign({}, CARTE.cible);
	}
	push();
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(z.x, z.y, z.l, z.h);
	drawingContext.clip();
	noStroke();
	fill('#132233');
	(Jeu.lignes.eau || []).forEach((anneau) => {
		beginShape();
		anneau.forEach((p) => vertex(pr.x(p[0]), pr.y(p[1])));
		endShape(CLOSE);
	});
	noFill();
	Jeu.lignes.lignes.forEach((ln) => {
		const sv = CARTE.ligneSurvol === ln;
		stroke(sv ? ln.couleur || DS.blanc : 'rgba(255,255,255,' + (ln.type === 0 ? 0.18 : 0.09) + ')');
		strokeWeight(sv ? 4 : ln.type === 0 ? 2.5 : 1.2);
		ln.traces.forEach((tr) => tracerLigne(pr, tr));
	});
	CARTE.marqueurs.forEach((m) => {
		if (m.lieu.sorte !== 'ligne') return;
		m.lieu.lignes.forEach((ln) => {
			stroke(ln.couleur || DS.blanc);
			strokeWeight(m.courant ? 6 : 4);
			ln.traces.forEach((tr) => tracerLigne(pr, tr));
		});
	});
	noStroke();
	if (CARTE.marqueurs.some((m) => m.lieu.sorte === 'metropole')) {
		fill(56, 96, 255, 16);
		rect(z.x, z.y, z.l, z.h);
	}
	dessinerCentres(pr);
	dessinerTrajets(pr);
	const pris = [];
	CARTE.marqueurs.forEach((m) => {
		if (!m.lieu.pt) return;
		let x = pr.x(m.lieu.pt[0]);
		const y = pr.y(m.lieu.pt[1]);
		while (pris.some((p) => Math.abs(p.x - x) < 30 && Math.abs(p.y - y) < 30)) x += 34;
		pris.push({ x, y });
		Object.assign(m, { x: x - 14, y: y - 14 });
	});
	CARTE.marqueurs.filter((m) => m.lieu.pt).forEach(dessinerMarqueur);
	drawingContext.restore();
	pop();
	// Ligne survolée (toutes les 6 images, hors glisser) : numéro et nom réel
	if (!CARTE.pan && !CARTE.jeton && frameCount - CARTE.survolFrame > 5 && dansZone({ x: mouseX, y: mouseY }, z)) {
		CARTE.survolFrame = frameCount;
		CARTE.ligneSurvol = ligneSous(pr, mouseX, mouseY);
	}
	// Case « Lieu à préciser » (dans la partie libre de la carte, prompt 114)
	const zl = zoneLibreCarte();
	const sans = CARTE.marqueurs.filter((m) => !m.lieu.pt);
	if (sans.length) {
		const lc = Math.min(zl.l - 32, 32 + sans.length * 44 + 220);
		const yc = z.y + z.h - 76;
		fill(13, 12, 12, 230);
		rect(zl.x + 16, yc, lc, 60);
		stroke(DS.blanc15);
		strokeWeight(1);
		noFill();
		rect(zl.x + 16, yc, lc, 60);
		noStroke();
		dsTexte(t('carte.lieuAPreciser'), zl.x + 32, yc + 18, 16, DS.blanc75, 'left');
		sans.forEach((m, i) => {
			Object.assign(m, { x: zl.x + 32 + 210 + i * 44, y: yc + 16 });
			dessinerMarqueur(m);
		});
	}
	// Ligne d'état
	let etat;
	if (f.length) etat = t('sig.titre', { n: f.length }) + (MULTI.actifs.length ? ' · ' + t('multi.actifs', { n: MULTI.actifs.length, max: MULTI.MAX }) : '');
	else {
		const pv = typeof Taches !== 'undefined' ? Taches.prevision() : null;
		etat = pv ? t('deblocage.prevision', { heure: Jeu.formaterHeure(pv.minute), type: t('enq.signalement.' + pv.type), g: t('gravite.' + pv.gravite) }) : texteResteJournee() || t('sig.vide');
	}
	panneauTexte(etat, zl.x + 16, z.y + 16, zl === z ? z.l - 300 : zl.l - 32);
	dessinerControlesCarte(zl);
	// Infobulles : marqueur, sinon centre, sinon ligne
	const sv = CARTE.marqueurs.find((m) => m.survol) || (phase === 'selection' ? CARTE.marqueurs[SELECTION.focus] : null);
	if (sv && sv.x !== undefined) infobulleCarte(Jeu.formaterHeure(sv.it.d.minute) + ' · ' + t('enq.signalement.' + sv.it.d.type) + ' · ' + t('carte.gravite', { g: t('gravite.' + Jeu.gravite(sv.it.d)) }) + ' · ' + texteLieu(sv.lieu, sv.it.d), sv.x + 14, sv.y); // prompt 128 : gravité écrite
	else if (CARTE.centreSurvol) infobulleCarte(CARTE.centreSurvol, mouseX, mouseY - 10);
	else if (CARTE.ligneSurvol && dansZone({ x: mouseX, y: mouseY }, z)) infobulleCarte(t('sujet.ligne', { ligne: CARTE.ligneSurvol.nom }) + ' · ' + CARTE.ligneSurvol.libelle, mouseX, mouseY - 10);
	if (f.length && CARTE.marqueurs[0].x !== undefined) cibleGuide('fileSignalements', CARTE.marqueurs[0].x - 8, CARTE.marqueurs[0].y - 8, 44, 44);
	dessinerPanneauEquipes();
}
/** Prompt 114 : partie de la carte non couverte par la fenêtre flottante (les commandes et textes s'y placent) */
function zoneLibreCarte() {
	const z = ZONE_CARTE;
	const ouverte = dossierOuvert() && typeof PANNEAU !== 'undefined' && !(typeof DIALOGUE !== 'undefined' && DIALOGUE.reduit) && PANNEAU.x >= z.x && PANNEAU.x < z.x + z.l;
	if (!ouverte) return z;
	const gauche = PANNEAU.x - z.x; // place à gauche de la fenêtre
	const droite = z.x + z.l - (PANNEAU.x + PANNEAU.l); // place à droite
	return gauche >= droite ? { x: z.x, y: z.y, l: gauche - 8, h: z.h } : { x: PANNEAU.x + PANNEAU.l + 8, y: z.y, l: droite - 8, h: z.h };
}
function panneauTexte(txt, x, y, lmax) {
	textFont(DS.policeTexte);
	textSize(18);
	const l = Math.min(lmax, textWidth(txt) + 24);
	noStroke();
	fill(13, 12, 12, 210);
	rect(x, y, l, 36);
	dsTexte(couperLargeurCarte(txt, l - 24, 18), x + 12, y + 8, 18, DS.blanc75, 'left');
}
function infobulleCarte(txt, cx, cy) {
	const z = CARTE.zoneLibre || CARTE.zone; // prompt 114 : jamais sous la fenêtre flottante
	textFont(DS.policeTexte);
	textSize(16);
	const lt = Math.min(z.l - 24, textWidth(txt) + 20);
	const xt = constrain(cx - lt / 2, z.x + 8, z.x + z.l - lt - 8);
	const yt = cy - 40 < z.y + 60 ? cy + 36 : cy - 40;
	noStroke();
	fill(DS.blanc);
	rect(xt, yt, lt, 30);
	dsTexte(couperLargeurCarte(txt, lt - 20, 16), xt + 10, yt + 6, 16, DS.fond, 'left');
}
function ligneSous(pr, mx, my) {
	let best = null;
	let dmin = 7;
	for (const ln of Jeu.lignes.lignes) {
		for (const tr of ln.traces) {
			for (let i = 1; i < tr.length; i++) {
				const ax = pr.x(tr[i - 1][0]);
				const ay = pr.y(tr[i - 1][1]);
				const bx = pr.x(tr[i][0]);
				const by = pr.y(tr[i][1]);
				if (mx < Math.min(ax, bx) - dmin || mx > Math.max(ax, bx) + dmin || my < Math.min(ay, by) - dmin || my > Math.max(ay, by) + dmin) continue;
				const l2 = (bx - ax) ** 2 + (by - ay) ** 2;
				const k = l2 ? constrain(((mx - ax) * (bx - ax) + (my - ay) * (by - ay)) / l2, 0, 1) : 0;
				const d = Math.hypot(mx - (ax + k * (bx - ax)), my - (ay + k * (by - ay)));
				if (d < dmin) (dmin = d), (best = ln);
			}
		}
	}
	return best;
}
/** Boutons + / − / Recentrer (bas droite de la carte), zoom et légende des trajets */
function dessinerControlesCarte(z) {
	const x = z.x + z.l - 64;
	let y = z.y + z.h - 196 - (CARTE.marqueurs.some((m) => !m.lieu.pt) && z.l < 900 ? 84 : 0); // au-dessus de « Lieu à préciser » si la place manque
	[
		['+', () => zoomer(1.4)],
		['−', () => zoomer(1 / 1.4)],
	].forEach(([lib, action]) => {
		const sv = mouseX >= x && mouseX <= x + 48 && mouseY >= y && mouseY <= y + 48;
		noStroke();
		fill(sv ? DS.blanc75 : DS.blanc);
		rect(x, y, 48, 48);
		dsTexte(lib, x + 24, y + 10, 24, DS.fond, 'center');
		boutons.push({ x, y, l: 48, h: 48, action });
		CARTE.controles.push({ x, y, l: 48, h: 48 });
		y += 56;
	});
	textFont(DS.policeTexte);
	textSize(20);
	const lr = textWidth(t('carte.recentrer')) + 64;
	dsBouton(z.x + z.l - 16 - lr, y, lr, 48, t('carte.recentrer'), recentrer, 'contour');
	CARTE.controles.push({ x: z.x + z.l - 16 - lr, y, l: lr, h: 48 });
	// zoom et légende : sous la ligne d'état (y + 64), à droite de la partie libre
	dsTexte(t('carte.niveauZoom', { z: (CARTE.vue.ech / CARTE.ech0).toFixed(1).replace('.', ',') }), z.x + z.l - 16, z.y + 64, 16, DS.blanc50, 'right');
	if ((Jeu.equipes || []).some((q) => !q.inutile && Jeu.phaseEquipe(q, tempsCarte()) !== 'libre')) dsTexte(couperLargeurCarte(t('carte.volOiseau'), z.l - 32, 20), z.x + z.l - 16, z.y + 92, 16, DS.blanc50, 'right');
	CARTE.zoneLibre = z;
}
function couperLargeurCarte(txt, l, taille) {
	textFont(DS.policeTexte);
	textSize(taille);
	if (textWidth(txt) <= l) return txt;
	let c = txt;
	while (c.length > 4 && textWidth(c + '…') > l) c = c.slice(0, -1);
	return c.trimEnd() + '…';
}
const tempsCarte = () => (typeof tempsEquipes === 'function' ? tempsEquipes() : millis());

function dessinerMarqueur(m) {
	const d = m.it.d;
	const x = m.x;
	const y = m.y;
	if (CARTE.arrivees[m.it.index] === undefined) CARTE.arrivees[m.it.index] = millis();
	const age = millis() - CARTE.arrivees[m.it.index];
	if (!reduireAnimations && age < 600) {
		const k = age / 600;
		noFill();
		stroke(255, 255, 255, 200 * (1 - k));
		strokeWeight(2);
		rect(x - 18 * k, y - 18 * k, 28 + 36 * k, 28 + 36 * k);
		noStroke();
	}
	m.survol = mouseX >= x - 6 && mouseX <= x + 34 && mouseY >= y - 6 && mouseY <= y + 34;
	noStroke();
	// Prompt 128 : la gravité est doublée par la taille (élevée 36 px avec liseré blanc, moyenne 28, faible 20),
	// jamais par la seule couleur ; le carré reste centré sur la même position
	const g = Jeu.gravite(d);
	const tm = g === 'elevee' ? 36 : g === 'moyenne' ? 28 : 20;
	const xm = x + 14 - tm / 2;
	const ym = y + 14 - tm / 2;
	if (g === 'elevee') {
		fill(DS.blanc);
		rect(xm - 3, ym - 3, tm + 6, tm + 6);
	}
	fill(couleurGravite(g));
	rect(xm, ym, tm, tm);
	fill(g === 'elevee' ? DS.blanc : DS.fond);
	rect(x + 10, y + 10, 8, 8);
	if (m.courant || m.actif || (phase === 'selection' && m.r === SELECTION.focus)) {
		noFill();
		stroke(m.courant ? DS.primaire : DS.blanc);
		strokeWeight(3);
		if (!m.courant && !m.actif) drawingContext.setLineDash([4, 4]);
		rect(x - 5, y - 5, 38, 38);
		drawingContext.setLineDash([]);
		noStroke();
	}
	if (CARTE.jeton || CARTE.jetonChoisi) {
		// prompt 108 : tout signalement arrivé accepte une équipe — pointillés
		noFill();
		stroke(DS.blanc);
		strokeWeight(2);
		drawingContext.setLineDash([6, 6]);
		rect(x - 16, y - 16, 60, 60);
		drawingContext.setLineDash([]);
		noStroke();
	}
	CARTE.depots.push({ x: x - 16, y: y - 16, l: 60, h: 60, index: m.it.index });
	if (CARTE.jetonChoisi) boutons.push({ x: x - 6, y: y - 6, l: 40, h: 40, action: () => deposerJeton(CARTE.jetonChoisi, m.it.index) });
	else if (!m.courant || (typeof DIALOGUE !== 'undefined' && DIALOGUE.reduit)) boutons.push({ x: x - 6, y: y - 6, l: 40, h: 40, action: () => ouvrirMarqueur(m) });
}
/** Clic sur un marqueur : prendre le signalement (prompt 77), ou rouvrir sa fenêtre (prompt 107) */
function ouvrirMarqueur(m) {
	if (typeof DIALOGUE !== 'undefined') DIALOGUE.reduit = false;
	if (m.courant) return;
	if (phase === 'selection' || ['decision', 'contradiction', 'conflit'].includes(phase)) prendreSignalement(m.r);
}

// ——— Centres d'intervention et trajets (prompt 109) ———
function positionCentre(cle) {
	const c = LIEUX.centres && LIEUX.centres[cle];
	return c ? [c.lon, c.lat] : null;
}
function dessinerCentres(pr) {
	CARTE.centreSurvol = null;
	Jeu.TYPES_EQUIPES.forEach((cle) => {
		const p = positionCentre(cle);
		if (!p) return;
		const x = pr.x(p[0]);
		const y = pr.y(p[1]);
		noStroke();
		fill(DS.blanc15);
		rect(x - 13, y - 13, 26, 26);
		stroke(DS.blanc50);
		strokeWeight(1);
		noFill();
		rect(x - 13, y - 13, 26, 26);
		noStroke();
		pictoEquipe(cle, x - 8, y - 8, 2, DS.blanc75);
		if (Math.abs(mouseX - x) < 14 && Math.abs(mouseY - y) < 14) CARTE.centreSurvol = LIEUX.centres[cle].nom + ' · OpenStreetMap';
	});
}
/** Position d'une équipe engagée sur la carte (null si rien à montrer) */
function positionEquipe(q, tm) {
	const ph = Jeu.phaseEquipe(q, tm);
	if (ph === 'libre') return null;
	const B = positionCentre(q.cle);
	const T = lieuAlerte({ d: Jeu.paquet[q.index], index: q.index }).pt;
	if (!B) return null;
	if (!T) return { ph, pos: B, B, T: null };
	if (reduireAnimations) return { ph, pos: ph === 'route' ? B : T, B, T };
	if (ph === 'route') {
		const k = constrain((tm - q.depart) / Math.max(1, q.arrivee - q.depart), 0, 1);
		return { ph, pos: [lerp(B[0], T[0], k), lerp(B[1], T[1], k)], B, T };
	}
	if (ph === 'place') return { ph, pos: T, B, T };
	const k = constrain((tm - q.finIntervention) / Math.max(1, q.libre - q.finIntervention), 0, 1);
	return { ph, pos: [lerp(T[0], B[0], k), lerp(T[1], B[1], k)], B, T, retour: true };
}
function dessinerTrajets(pr) {
	const tm = tempsCarte();
	(Jeu.equipes || [])
		.filter((q) => !q.inutile)
		.forEach((q) => {
			const p = positionEquipe(q, tm);
			if (!p) return;
			const px = pr.x(p.pos[0]);
			const py = pr.y(p.pos[1]);
			if (p.T) {
				const a = p.retour ? p.T : p.B;
				const b = p.retour ? p.B : p.T;
				stroke(255, 255, 255, 120);
				strokeWeight(2);
				drawingContext.setLineDash([6, 6]);
				line(pr.x(a[0]), pr.y(a[1]), pr.x(b[0]), pr.y(b[1])); // trajet complet, à vol d'oiseau
				drawingContext.setLineDash([]);
				stroke(DS.blanc);
				strokeWeight(3);
				line(pr.x(a[0]), pr.y(a[1]), px, py); // partie déjà parcourue
				noStroke();
			}
			fill(p.ph === 'retour' ? DS.blanc50 : DS.blanc);
			rect(px - 11, py - 11, 22, 22);
			pictoEquipe(q.cle, px - 8, py - 8, 2, DS.fond);
			if (p.ph === 'place') {
				noFill();
				stroke(DS.blanc);
				strokeWeight(2);
				rect(px - 15, py - 15, 30, 30);
				noStroke();
			}
		});
}

// ——— Panneau des équipes (prompt 108) ———
const PICTOS_EQUIPES = {
	police: ['..####..', '.#....#.', '#..##..#', '#.####.#', '#..##..#', '.#....#.', '..#..#..', '...##...'],
	ambulance: ['...##...', '...##...', '...##...', '########', '########', '...##...', '...##...', '...##...'],
	techniciens: ['##....##', '###..###', '.######.', '..####..', '..####..', '.##..##.', '##....##', '#......#'],
	pompiers: ['...#....', '..##....', '..###...', '.####.#.', '.######.', '########', '########', '.######.'],
};
function pictoEquipe(cle, x, y, s, c) {
	noStroke();
	fill(c);
	(PICTOS_EQUIPES[cle] || []).forEach((ligne, j) => [...ligne].forEach((v, i) => v === '#' && rect(x + i * s, y + j * s, s, s)));
}
function dessinerPanneauEquipes() {
	const P = PANNEAU_EQUIPES;
	CARTE.jetons = [];
	noStroke();
	fill(DS.fond);
	rect(P.x, P.y, P.l, P.h);
	fill(DS.blanc05);
	rect(P.x, P.y, P.l, P.h);
	dsTexte(t('equipes.titre'), P.x + 16, P.y + 14, 20, DS.blanc, 'left');
	const tm = tempsCarte();
	const verrou = !Jeu.elementDebloque('equipes');
	let y = P.y + 56;
	Jeu.TYPES_EQUIPES.forEach((cle) => {
		const q = Jeu.EQUIPES[cle];
		const eff = Jeu.effectifJour ? Jeu.effectifJour(cle) : 1;
		pictoEquipe(cle, P.x + 16, y + 4, 3, DS.blanc);
		dsTexte(couperLargeurCarte(String(q.nom), P.l - 64, 20), P.x + 52, y, 18, DS.blanc, 'left');
		const c = LIEUX.centres && LIEUX.centres[cle];
		if (c) dsTexte(couperLargeurCarte(c.nom, P.l - 32, 20), P.x + 16, y + 30, 14, DS.blanc50, 'left');
		// pastilles : équipes engagées (état, secondes restantes), puis disponibles
		const eng = (Jeu.equipes || []).filter((x) => x.cle === cle && !x.inutile && x.jourIndex === Jeu.jourIndex && Jeu.phaseEquipe(x, tm) !== 'libre');
		const dispo = verrou ? 0 : Math.max(0, eff - eng.length);
		const ps = eng.map((x) => ({ ph: Jeu.phaseEquipe(x, tm), q: x })).concat(Array.from({ length: dispo }, () => ({ ph: 'dispo' })));
		const lp = 64;
		const premierDispo = ps.findIndex((p) => p.ph === 'dispo');
		ps.forEach((p, i) => {
			const px = P.x + 16 + (i % 4) * (lp + 4);
			const py = y + 60 + Math.floor(i / 4) * 52;
			const saisi = i === premierDispo && ((CARTE.jeton && CARTE.jeton.cle === cle) || CARTE.jetonChoisi === cle);
			noStroke();
			fill(p.ph === 'dispo' ? (saisi ? DS.blanc15 : DS.fond) : p.ph === 'retour' ? DS.blanc05 : DS.blanc15);
			rect(px, py, lp, 46);
			stroke(p.ph === 'dispo' ? DS.blanc75 : DS.blanc15);
			strokeWeight(saisi ? 2 : 1);
			if (saisi) drawingContext.setLineDash([5, 5]);
			noFill();
			rect(px, py, lp, 46);
			drawingContext.setLineDash([]);
			noStroke();
			pictoEquipe(cle, px + 6, py + 7, 2.5, p.ph === 'dispo' ? DS.blanc : DS.blanc50);
			if (p.ph !== 'dispo') {
				const fin = p.ph === 'route' ? p.q.arrivee : p.ph === 'place' ? p.q.finIntervention : p.q.libre;
				dsTexte(Math.max(0, Math.ceil((fin - tm) / 1000)) + 's', px + lp - 4, py + 22, 14, DS.blanc75, 'right');
			} else {
				CARTE.jetons.push({ x: px, y: py, l: lp, h: 46, cle, actif: true });
				boutons.push({ x: px, y: py, l: lp, h: 46, action: () => (typeof MOBILE !== 'undefined' && MOBILE.actif && dossierOuvert() ? deposerJeton(cle, Jeu.index) : choisirJeton(cle)) });
			}
		});
		const lignesP = Math.max(1, Math.ceil(ps.length / 4));
		const etat = verrou ? t('histoire.verrou.equipes') : dispo + '/' + eff + ' ' + t('equipes.dispo') + ' · −' + q.cout;
		dsTexte(couperLargeurCarte(etat, P.l - 32, 20), P.x + 16, y + 60 + lignesP * 52, 14, dispo ? DS.blanc75 : DS.alerteClair, 'left');
		y += 60 + lignesP * 52 + 40;
	});
	// Message (envoi, refus) ou consigne, en bas du panneau
	const msg = SELECTION.message && millis() - SELECTION.message.t < 5000;
	const txt = msg ? String(SELECTION.message.texte) : CARTE.jetonChoisi ? t('carte.jetonChoisi', { nom: Jeu.EQUIPES[CARTE.jetonChoisi].nom }) : t('equipes.glisser');
	const coul = msg ? (SELECTION.message.ok ? (SELECTION.message.adaptee === false ? DS.alerte : DS.succesClair) : DS.alerteClair) : DS.blanc50;
	dsTexte(txt, P.x + 16, Math.max(y + 8, P.y + P.h - 132), 16, coul, 'left', P.l - 32);
	// Jeton en cours de glisser
	if (CARTE.jeton) {
		noStroke();
		fill(DS.blanc);
		rect(mouseX - 24, mouseY - 24, 48, 48);
		pictoEquipe(CARTE.jeton.cle, mouseX - 14, mouseY - 14, 3.5, DS.fond);
	}
	if (CARTE.retour && !reduireAnimations) {
		const k = Math.min(1, (millis() - CARTE.retour.t) / 200);
		const r = CARTE.jetons.find((x) => x.cle === CARTE.retour.cle);
		if (r && k < 1) {
			fill(DS.blanc75);
			rect(lerp(CARTE.retour.x, r.x + 32, k) - 24, lerp(CARTE.retour.y, r.y + 23, k) - 24, 48, 48);
		} else CARTE.retour = null;
	}
}

// ——— Gestes ———
function choisirJeton(cle) {
	CARTE.jetonChoisi = CARTE.jetonChoisi === cle ? null : cle;
	if (CARTE.jetonChoisi) annoncer(t('carte.jetonChoisi', { nom: Jeu.EQUIPES[cle].nom }));
}
/** Envoie une équipe sur le dossier d'index donné (le dossier ouvert passe par envoyerEquipeIncident) */
function deposerJeton(cle, index) {
	CARTE.jetonChoisi = null;
	CARTE.jeton = null;
	const avant = (Jeu.equipes || []).length;
	if (index === undefined || (index === Jeu.index && dossierOuvert())) envoyerEquipeIncident(cle);
	else {
		const r = Jeu.envoyerEquipe(index, cle, tempsCarte());
		SELECTION.message = { texte: r.message, ok: r.ok, t: millis() };
		annoncer(String(r.message));
		if (r.refus) Confort.Son.bip('alerte');
		else Confort.Son.clic();
	}
	const q = (Jeu.equipes || []).length > avant ? Jeu.equipes[Jeu.equipes.length - 1] : null;
	if (q && !q.inutile && SELECTION.message) {
		SELECTION.message.adaptee = q.pertinente;
		if (q.pertinente) SELECTION.message.texte = String(SELECTION.message.texte) + ' ' + t('carte.adaptee');
		if (q.pertinente) annoncer(t('carte.adaptee'));
		if (typeof feedback === 'function') feedback('light');
	}
}
function zoneDepotPanneau() {
	return dossierOuvert() && typeof PANNEAU !== 'undefined' && !(typeof DIALOGUE !== 'undefined' && DIALOGUE.reduit) ? PANNEAU : null;
}
function appliCarteActive() {
	return typeof PC !== 'undefined' && PC.etat === 'appli' && ecran === 'jeu' && !fenetre && !enPause && phase !== 'fin';
}
/** Appui : jeton d'équipe saisi, ou envoi par clic sur la fenêtre du dossier (true si l'appui est pris) */
function debutJeton() {
	if (!appliCarteActive() || (typeof MOBILE !== 'undefined' && MOBILE.actif)) return false;
	const p = sourisAppli();
	const r = CARTE.jetons.find((k) => k.actif && dansZone(p, k));
	if (r) return (CARTE.jeton = { cle: r.cle, x0: p.x, y0: p.y }), true;
	if (CARTE.jetonChoisi) {
		const zp = zoneDepotPanneau();
		if (zp && dansZone(p, zp)) return deposerJeton(CARTE.jetonChoisi, Jeu.index), true;
	}
	return false;
}
/** Après les boutons : un appui sur le fond de la carte commence le glisser de la carte */
function debutPanCarte() {
	if (!appliCarteActive() || !CARTE.zone) return false;
	const p = sourisAppli();
	if (!dansZone(p, CARTE.zone)) return false;
	const zp = zoneDepotPanneau();
	if (zp && dansZone(p, zp)) return false;
	if (CARTE.controles.some((c) => dansZone(p, c))) return false;
	CARTE.pan = { x: p.x, y: p.y };
	return true;
}
function relacherJeton() {
	if (CARTE.pan) {
		CARTE.pan = null;
		return true;
	}
	const j = CARTE.jeton;
	if (!j) return false;
	const p = sourisAppli();
	CARTE.jeton = null;
	if (Math.hypot(p.x - j.x0, p.y - j.y0) < 8) return choisirJeton(j.cle), true;
	const zp = zoneDepotPanneau();
	const cible = CARTE.depots.find((r) => dansZone(p, r));
	if (cible) return deposerJeton(j.cle, cible.index), true;
	if (zp && dansZone(p, zp)) return deposerJeton(j.cle, Jeu.index), true;
	CARTE.retour = { cle: j.cle, x: p.x, y: p.y, t: millis() };
	return true;
}
/** Molette sur la carte : zoom centré sur le curseur */
function molletteCarte(delta) {
	if (!appliCarteActive() || !CARTE.zone) return false;
	const p = sourisAppli();
	if (!dansZone(p, CARTE.zone)) return false;
	const zp = zoneDepotPanneau();
	if (zp && dansZone(p, zp)) return false;
	zoomer(delta > 0 ? 1 / 1.15 : 1.15, p.x, p.y);
	return true;
}
/** Clavier : Échap annule un jeton choisi ; + / − zoom ; Origine recentre ; Maj + flèches déplacent */
function toucheCarte() {
	if (CARTE.jetonChoisi && keyCode === ESCAPE) return (CARTE.jetonChoisi = null), true;
	if (!appliCarteActive()) return false;
	if (keyCode === ESCAPE && typeof DIALOGUE !== 'undefined' && !DIALOGUE.reduit && (phase === 'decision' || phase === 'contradiction')) return reduireDialogue(), true; // prompt 107
	if (key === '+' || key === '=') return zoomer(1.4), true;
	if (key === '-' || key === '_') return zoomer(1 / 1.4), true;
	if (keyCode === 36) return recentrer(), true; // Origine
	if (keyIsDown(SHIFT) && [LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW].includes(keyCode)) {
		const pas = 80;
		deplacer(keyCode === LEFT_ARROW ? pas : keyCode === RIGHT_ARROW ? -pas : 0, keyCode === UP_ARROW ? pas : keyCode === DOWN_ARROW ? -pas : 0);
		return true;
	}
	return false;
}
