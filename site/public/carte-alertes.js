/* Nantes en régulation — prompt 102 : l'appli principale devient une CARTE des alertes réelles.
 * - Fond réel : eau (occupation du sol 2022) et tracés des lignes (GTFS Naolib) de data/lignes.json.
 * - Une alerte n'est placée que si une donnée réelle donne son lieu :
 *     · ligne(s) identifiée(s) par l'enquête (dossierConnu) et présente(s) dans lignes.json → la ligne est
 *       surlignée, le marqueur se pose au milieu de son tracé (« sur la ligne », pas un point précis) ;
 *     · alerte météo (Open-Meteo, Nantes) → centre de l'emprise, « Toute la métropole » ;
 *     · sinon (ligne pas encore identifiée, événement de l'agenda sans coordonnées) → case « Lieu à préciser ».
 * - Clic (ou Entrée) sur un marqueur = prendre le signalement (prendreSignalement, prompt 77).
 * - Équipes : plateau de 4 jetons en bas de la carte, glisser-déposer sur le marqueur ou le panneau du dossier
 *   ouvert → envoyerEquipeIncident (règles de game.js inchangées). Clic sur un jeton puis sur le dossier = même
 *   chose ; Maj + 1/2/3/4 restent. L'adéquation n'est dite qu'APRÈS le dépôt (Jeu.equipesPertinentes).
 */
Jeu.plateauEquipesVisible = true; // prompt 103 : le plateau des équipes dit les effectifs (game.js ne les répète plus au patron)
const CARTE = { zone: null, vue: null, marqueurs: [], arrivees: {}, jeton: null, jetonChoisi: null, retour: null, jetons: [], depots: [], ouverte: false };
const MENU_APP = { x: 40, y: 132, l: 128, h: 900 }; // prompt 103 : colonne du menu (réservée dès le prompt 102)
const ZONE_CARTE_PLEINE = { x: 184, y: 132, l: 1696, h: 900 };
const ZONE_CARTE_DOSSIER = { x: 184, y: 132, l: 556, h: 900 };
const H_PLATEAU = 104;
const PHASES_DOSSIER_CARTE = ['decision', 'contradiction', 'conflit', 'narration'];

/** Souris (hors image) dans les coordonnées de l'appli principale (1920×1080 avant réduction en fenêtre) */
function sourisAppli() {
	const p = typeof sourisPC === 'function' ? sourisPC() : { x: mouseX, y: mouseY };
	const A = typeof FENETRE_APPLI !== 'undefined' ? FENETRE_APPLI : null;
	if (!A || typeof PC === 'undefined' || !(PC.etat === 'appli' || (typeof vueIntegree === 'function' && vueIntegree()))) return p;
	return { x: (p.x - A.x) / A.k, y: (p.y - A.y) / A.k };
}

const dossierOuvert = () => typeof phase !== 'undefined' && PHASES_DOSSIER_CARTE.includes(phase);
function zoneCarte() {
	return dossierOuvert() ? ZONE_CARTE_DOSSIER : ZONE_CARTE_PLEINE;
}

// ——— Lieu d'une alerte (jamais inventé) ———
const centreEmprise = () => {
	const e = Jeu.lignes.emprise;
	return [(e.est + e.ouest) / 2, (e.nord + e.sud) / 2];
};
/** Point au milieu du tracé le plus long d'une ligne (en sommets) */
function milieuLigne(ln) {
	let best = null;
	(ln.traces || []).forEach((tr) => {
		if (!best || tr.length > best.length) best = tr;
	});
	return best && best.length ? best[Math.floor(best.length / 2)] : null;
}
function lieuAlerte(it) {
	const d = it.d;
	if (!Jeu.lignes) return { sorte: 'aPreciser' };
	if (d.type === 'alerte météo') return { sorte: 'metropole', pt: centreEmprise() };
	if (d.lignes && d.lignes.length && dossierConnu(it.index)) {
		const lignes = d.lignes.map((n) => Jeu.lignes.lignes.find((x) => x.nom === String(n))).filter(Boolean);
		const pt = lignes.length ? milieuLigne(lignes[0]) : null;
		if (pt) return { sorte: 'ligne', pt, lignes };
	}
	return { sorte: 'aPreciser' };
}
function texteLieu(lieu, d) {
	if (lieu.sorte === 'ligne') return lieu.lignes.map((l) => t('sujet.ligne', { ligne: l.nom })).join(', ');
	if (lieu.sorte === 'metropole') return t('carte.metropole');
	if (d.type === 'événement' && d.texte_source) {
		const parts = String(d.texte_source).split(' — ');
		return t('carte.lieuAPreciser') + (parts.length > 1 ? ' · ' + parts[parts.length - 1] : '');
	}
	return t('carte.lieuAPreciser');
}

// ——— Vue (centre, échelle) : la carte se resserre et se centre sur le dossier ouvert ———
function cibleVue(zc) {
	const e = Jeu.lignes.emprise;
	const kx = Math.cos((((e.nord + e.sud) / 2) * Math.PI) / 180);
	const fitL = zc.l / ((e.est - e.ouest) * kx);
	const fitH = zc.h / (e.nord - e.sud);
	let centre = centreEmprise();
	let ech = Math.min(fitL, fitH) * 1.08;
	if (dossierOuvert()) {
		ech = Math.max(fitL, fitH) * 1.15;
		const m = CARTE.marqueurs.find((k) => k.courant && k.lieu.pt);
		if (m) centre = m.lieu.pt;
	}
	return { lon: centre[0], lat: centre[1], ech, kx };
}
function majVue(zc) {
	const c = cibleVue(zc);
	if (!CARTE.vue || reduireAnimations) CARTE.vue = Object.assign({}, c);
	else {
		const k = Math.min(1, (deltaTime || 16) / 120); // ~300 ms pour l'essentiel du glissement
		['lon', 'lat', 'ech'].forEach((p) => (CARTE.vue[p] += (c[p] - CARTE.vue[p]) * k));
		CARTE.vue.kx = c.kx;
	}
	const v = CARTE.vue;
	return { x: (lon) => zc.x + zc.l / 2 + (lon - v.lon) * v.kx * v.ech, y: (lat) => zc.y + zc.h / 2 - (lat - v.lat) * v.ech };
}

// ——— Dessin ———
function dessinerCarteAlertes() {
	const z = zoneCarte();
	CARTE.zone = z;
	CARTE.ouverte = true;
	CARTE.depots = []; // zones de dépôt de cette image (marqueur du dossier ouvert)
	const zc = { x: z.x, y: z.y, l: z.l, h: z.h - H_PLATEAU - 8 }; // zone de la carte, au-dessus du plateau
	noStroke();
	fill(DS.fond);
	rect(z.x, z.y, z.l, z.h);
	const f = fileIncidents();
	const enCours = ['decision', 'contradiction', 'conflit'].includes(phase);
	// Marqueurs (lieu réel ou « à préciser »)
	CARTE.marqueurs = f.map((it, r) => ({ it, r, lieu: lieuAlerte(it), courant: enCours && it.index === Jeu.index, actif: typeof actifDe === 'function' && !!actifDe(it.d) }));
	if (!Jeu.lignes) return dessinerPlateauEquipes(z);
	const pr = majVue(zc);
	push();
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(zc.x, zc.y, zc.l, zc.h);
	drawingContext.clip();
	// Eau
	noStroke();
	fill('#132233');
	(Jeu.lignes.eau || []).forEach((anneau) => {
		beginShape();
		anneau.forEach((p) => vertex(pr.x(p[0]), pr.y(p[1])));
		endShape(CLOSE);
	});
	// Lignes en filigrane
	noFill();
	Jeu.lignes.lignes.forEach((ln) => {
		stroke(255, 255, 255, ln.type === 0 ? 46 : 22);
		strokeWeight(ln.type === 0 ? 2.5 : 1.2);
		ln.traces.forEach((tr) => {
			beginShape();
			tr.forEach((p) => vertex(pr.x(p[0]), pr.y(p[1])));
			endShape();
		});
	});
	// Lignes concernées par une alerte : surlignées à leur couleur GTFS
	CARTE.marqueurs.forEach((m) => {
		if (m.lieu.sorte !== 'ligne') return;
		m.lieu.lignes.forEach((ln) => {
			stroke(ln.couleur || DS.blanc);
			strokeWeight(m.courant ? 6 : 4);
			ln.traces.forEach((tr) => {
				beginShape();
				tr.forEach((p) => vertex(pr.x(p[0]), pr.y(p[1])));
				endShape();
			});
		});
	});
	noStroke();
	// Alerte météo ouverte : léger voile sur toute la métropole
	if (CARTE.marqueurs.some((m) => m.lieu.sorte === 'metropole')) {
		fill(56, 96, 255, 16);
		rect(zc.x, zc.y, zc.l, zc.h);
	}
	// Position écran de chaque marqueur placé (décalé si plusieurs au même point)
	const pris = [];
	CARTE.marqueurs.forEach((m) => {
		if (!m.lieu.pt) return;
		let x = pr.x(m.lieu.pt[0]);
		let y = pr.y(m.lieu.pt[1]);
		while (pris.some((p) => Math.abs(p.x - x) < 30 && Math.abs(p.y - y) < 30)) x += 34;
		pris.push({ x, y });
		Object.assign(m, { x: x - 14, y: y - 14 });
	});
	CARTE.marqueurs.filter((m) => m.lieu.pt).forEach(dessinerMarqueur);
	drawingContext.restore();
	pop();
	// Case « Lieu à préciser » (en bas à gauche, au-dessus du plateau)
	const sans = CARTE.marqueurs.filter((m) => !m.lieu.pt);
	if (sans.length) {
		const lc = Math.min(zc.l - 32, 32 + sans.length * 44 + 200);
		const yc = zc.y + zc.h - 76;
		fill(13, 12, 12, 230);
		rect(zc.x + 16, yc, lc, 60);
		stroke(DS.blanc15);
		strokeWeight(1);
		noFill();
		rect(zc.x + 16, yc, lc, 60);
		noStroke();
		dsTexte(t('carte.lieuAPreciser'), zc.x + 32, yc + 20, 16, DS.blanc75, 'left');
		sans.forEach((m, i) => {
			Object.assign(m, { x: zc.x + 32 + 190 + i * 44, y: yc + 16 });
			dessinerMarqueur(m);
		});
	}
	// Ligne d'état (une seule) : nombre de signalements, ou le prochain / la prévision
	let etat;
	if (f.length) etat = t('sig.titre', { n: f.length }) + (MULTI.actifs.length ? ' · ' + t('multi.actifs', { n: MULTI.actifs.length, max: MULTI.MAX }) : '');
	else {
		const pv = typeof Taches !== 'undefined' ? Taches.prevision() : null; // prompt 88 (option)
		etat = pv ? t('deblocage.prevision', { heure: Jeu.formaterHeure(pv.minute), type: t('enq.signalement.' + pv.type), g: t('gravite.' + pv.gravite) }) : texteResteJournee() || t('sig.vide');
	}
	fill(13, 12, 12, 200);
	textFont(DS.policeTexte);
	textSize(18);
	const le = Math.min(zc.l - 32, textWidth(etat) + 24);
	rect(zc.x + 16, zc.y + 16, le, 36);
	dsTexte(couperLargeurCarte(etat, le - 24, 18), zc.x + 28, zc.y + 24, 18, DS.blanc75, 'left');
	// Infobulle du marqueur survolé ou focalisé (heure · type · lieu)
	const sv = CARTE.marqueurs.find((m) => m.survol) || (phase === 'selection' ? CARTE.marqueurs[SELECTION.focus] : null);
	if (sv && sv.x !== undefined) {
		const txt = Jeu.formaterHeure(sv.it.d.minute) + ' · ' + t('enq.signalement.' + sv.it.d.type) + ' · ' + texteLieu(sv.lieu, sv.it.d);
		textSize(16);
		const lt = Math.min(zc.l - 24, textWidth(txt) + 20);
		const xt = constrain(sv.x + 14 - lt / 2, zc.x + 8, zc.x + zc.l - lt - 8);
		const yt = sv.y - 40 < zc.y + 60 ? sv.y + 36 : sv.y - 40;
		fill(DS.blanc);
		rect(xt, yt, lt, 30);
		dsTexte(couperLargeurCarte(txt, lt - 20, 16), xt + 10, yt + 6, 16, DS.fond, 'left');
	}
	if (f.length) cibleGuide('fileSignalements', CARTE.marqueurs[0].x - 8, CARTE.marqueurs[0].y - 8, 44, 44);
	dessinerPlateauEquipes(z);
}
function couperLargeurCarte(txt, l, taille) {
	textFont(DS.policeTexte);
	textSize(taille);
	if (textWidth(txt) <= l) return txt;
	let c = txt;
	while (c.length > 4 && textWidth(c + '…') > l) c = c.slice(0, -1);
	return c.trimEnd() + '…';
}
function dessinerMarqueur(m) {
	const d = m.it.d;
	const x = m.x;
	const y = m.y;
	if (CARTE.arrivees[m.it.index] === undefined) CARTE.arrivees[m.it.index] = millis();
	const age = millis() - CARTE.arrivees[m.it.index];
	if (!reduireAnimations && age < 600) {
		// une seule onde à l'arrivée (pas de clignotement)
		const k = age / 600;
		noFill();
		stroke(255, 255, 255, 200 * (1 - k));
		strokeWeight(2);
		rect(x - 18 * k, y - 18 * k, 28 + 36 * k, 28 + 36 * k);
		noStroke();
	}
	m.survol = mouseX >= x - 6 && mouseX <= x + 34 && mouseY >= y - 6 && mouseY <= y + 34;
	const cible = CARTE.jeton && m.courant;
	noStroke();
	fill(couleurGravite(Jeu.gravite(d)));
	rect(x, y, 28, 28);
	fill(DS.fond);
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
	if (cible) {
		// zone de dépôt des équipes : pointillés blancs
		noFill();
		stroke(DS.blanc);
		strokeWeight(2);
		drawingContext.setLineDash([6, 6]);
		rect(x - 16, y - 16, 60, 60);
		drawingContext.setLineDash([]);
		noStroke();
		CARTE.depots.push({ x: x - 16, y: y - 16, l: 60, h: 60 });
	}
	dessinerEquipesSurMarqueur(m);
	const enCours = ['decision', 'contradiction', 'conflit'].includes(phase);
	if ((phase === 'selection' || enCours) && !m.courant) boutons.push({ x: x - 6, y: y - 6, l: 40, h: 40, action: () => prendreSignalement(m.r) });
	else if (m.courant && CARTE.jetonChoisi) boutons.push({ x: x - 6, y: y - 6, l: 40, h: 40, action: () => deposerJeton(CARTE.jetonChoisi) });
}
/** Équipes engagées sur ce dossier : petits jetons à côté du marqueur, anneau d'état (aucun trajet inventé) */
function dessinerEquipesSurMarqueur(m) {
	const tm = typeof tempsEquipes === 'function' ? tempsEquipes() : millis();
	const qs = (Jeu.equipes || []).filter((q) => q.index === m.it.index && !q.inutile && Jeu.phaseEquipe(q, tm) !== 'libre');
	qs.forEach((q, i) => {
		const ph = Jeu.phaseEquipe(q, tm);
		const x = m.x + 34 + i * 22;
		const y = m.y + 4;
		noStroke();
		fill(ph === 'retour' ? DS.blanc15 : DS.blanc);
		rect(x, y, 18, 18);
		pictoEquipe(q.cle, x + 1, y + 1, 2, ph === 'retour' ? DS.blanc50 : DS.fond);
		noFill();
		stroke(DS.blanc);
		strokeWeight(2);
		if (ph === 'route') drawingContext.setLineDash([3, 3]);
		if (ph !== 'retour') rect(x - 3, y - 3, 24, 24);
		drawingContext.setLineDash([]);
		noStroke();
	});
}

// ——— Plateau des équipes ———
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
function dessinerPlateauEquipes(z) {
	CARTE.jetons = [];
	const y0 = z.y + z.h - H_PLATEAU;
	noStroke();
	fill(DS.blanc05);
	rect(z.x, y0, z.l, H_PLATEAU);
	const ouvert = dossierOuvert();
	const verrou = !Jeu.elementDebloque('equipes');
	const msg = SELECTION.message && millis() - SELECTION.message.t < 5000;
	const titre = msg ? String(SELECTION.message.texte) : verrou ? t('histoire.verrou.equipes') : CARTE.jetonChoisi ? t('carte.jetonChoisi', { nom: Jeu.EQUIPES[CARTE.jetonChoisi].nom }) : t(ouvert ? 'carte.plateau' : 'carte.plateauSans');
	const coul = msg ? (SELECTION.message.ok ? (SELECTION.message.adaptee === false ? DS.alerte : DS.succesClair) : DS.alerteClair) : DS.blanc50;
	dsTexte(couperLargeurCarte(titre, z.l - 32, 16), z.x + 16, y0 + 8, 16, coul, 'left');
	const n = Jeu.TYPES_EQUIPES.length;
	const cols = z.l < 900 ? 2 : n; // carte resserrée (dossier ouvert) : 2 × 2 jetons, noms entiers
	const lj = Math.min(260, (z.l - 32 - (cols - 1) * 12) / cols);
	const hj = cols === n ? 56 : 30;
	const tm = typeof tempsEquipes === 'function' ? tempsEquipes() : millis();
	Jeu.TYPES_EQUIPES.forEach((cle, i) => {
		const q = Jeu.EQUIPES[cle];
		const x = z.x + 16 + (i % cols) * (lj + 12);
		const y = y0 + (cols === n ? 36 : 32 + Math.floor(i / cols) * (hj + 6));
		const dispo = verrou ? 0 : Jeu.equipesDisponibles(cle, tm);
		const eff = Jeu.REGLAGES.equipes[cle].effectif + ((Jeu.bonusEffectifs || {})[cle] || 0);
		const saisi = (CARTE.jeton && CARTE.jeton.cle === cle) || CARTE.jetonChoisi === cle;
		const actif = ouvert && dispo > 0 && !verrou;
		const r = { x, y, l: lj, h: hj, cle, actif };
		CARTE.jetons.push(r);
		const survol = mouseX >= x && mouseX <= x + lj && mouseY >= y && mouseY <= y + hj;
		fill(saisi ? DS.blanc15 : survol && actif ? DS.blanc15 : DS.fond);
		rect(x, y, lj, hj);
		stroke(actif ? DS.blanc50 : DS.blanc15);
		strokeWeight(saisi ? 2 : 1);
		if (saisi) drawingContext.setLineDash([5, 5]);
		noFill();
		rect(x, y, lj, hj);
		drawingContext.setLineDash([]);
		noStroke();
		const etat = verrou ? '—' : dispo ? dispo + '/' + eff : t('carte.retourCourt', { s: Jeu.retourEquipe(cle, tm) });
		if (hj === 56) {
			pictoEquipe(cle, x + 12, y + 14, 3.5, actif ? DS.blanc : DS.blanc50);
			dsTexte(couperLargeurCarte(String(q.nom), lj - 60, 16), x + 52, y + 8, 16, actif ? DS.blanc : DS.blanc50, 'left');
			dsTexte(couperLargeurCarte(etat, lj - 60, 14), x + 52, y + 32, 14, dispo ? DS.blanc75 : DS.alerteClair, 'left');
		} else {
			// une ligne : picto · nom … état (à droite)
			pictoEquipe(cle, x + 8, y + 5, 2.5, actif ? DS.blanc : DS.blanc50);
			textFont(DS.policeTexte);
			textSize(14);
			const le = textWidth(etat) + 8;
			dsTexte(couperLargeurCarte(String(q.nom), lj - 44 - le, 16), x + 36, y + 6, 16, actif ? DS.blanc : DS.blanc50, 'left');
			dsTexte(etat, x + lj - 8, y + 8, 14, dispo ? DS.blanc75 : DS.alerteClair, 'right');
		}
		if (!(typeof MOBILE !== 'undefined' && MOBILE.actif) && actif) boutons.push({ x, y, l: lj, h: hj, action: () => choisirJeton(cle) });
		else if (typeof MOBILE !== 'undefined' && MOBILE.actif && actif) boutons.push({ x, y, l: lj, h: hj, action: () => deposerJeton(cle) }); // tap = envoi au dossier ouvert
	});
	// Jeton en cours de glisser : suit la souris (coordonnées de l'appli pendant l'image)
	if (CARTE.jeton) {
		const j = CARTE.jeton;
		fill(DS.blanc);
		rect(mouseX - 24, mouseY - 24, 48, 48);
		pictoEquipe(j.cle, mouseX - 14, mouseY - 14, 3.5, DS.fond);
	}
	// Retour en ressort (200 ms) d'un jeton lâché ailleurs
	if (CARTE.retour && !reduireAnimations) {
		const k = Math.min(1, (millis() - CARTE.retour.t) / 200);
		const r = CARTE.jetons.find((x) => x.cle === CARTE.retour.cle);
		if (r && k < 1) {
			const x = lerp(CARTE.retour.x, r.x + 12, k);
			const y = lerp(CARTE.retour.y, r.y + 4, k);
			fill(DS.blanc75);
			rect(x - 24, y - 24, 48, 48);
		} else CARTE.retour = null;
	}
}
/** Zone du panneau du dossier ouvert : on peut y déposer un jeton */
function zoneDepotPanneau() {
	return dossierOuvert() && typeof PANNEAU !== 'undefined' ? PANNEAU : null;
}

// ——— Gestes ———
function choisirJeton(cle) {
	CARTE.jetonChoisi = CARTE.jetonChoisi === cle ? null : cle;
	if (CARTE.jetonChoisi) annoncer(t('carte.jetonChoisi', { nom: Jeu.EQUIPES[cle].nom }));
}
function deposerJeton(cle) {
	CARTE.jetonChoisi = null;
	CARTE.jeton = null;
	const avant = (Jeu.equipes || []).length;
	envoyerEquipeIncident(cle);
	const q = (Jeu.equipes || []).length > avant ? Jeu.equipes[Jeu.equipes.length - 1] : null;
	if (q && !q.inutile && SELECTION.message) {
		// le message de game.js dit déjà « hors sujet : effet divisé par deux » ; on n'ajoute que le cas adapté
		SELECTION.message.adaptee = q.pertinente;
		if (q.pertinente) SELECTION.message.texte = String(SELECTION.message.texte) + ' ' + t('carte.adaptee');
		if (q.pertinente) annoncer(t('carte.adaptee'));
		if (typeof feedback === 'function') feedback('light');
	}
}
/** Appui : un jeton d'équipe est saisi (true si l'appui est pris) */
function debutJeton() {
	if (typeof PC === 'undefined' || PC.etat !== 'appli' || ecran !== 'jeu' || fenetre || enPause) return false;
	if (typeof MOBILE !== 'undefined' && MOBILE.actif) return false;
	const p = sourisAppli();
	const r = CARTE.jetons.find((k) => k.actif && p.x >= k.x && p.x <= k.x + k.l && p.y >= k.y && p.y <= k.y + k.h);
	if (r) {
		CARTE.jeton = { cle: r.cle, x0: p.x, y0: p.y };
		return true;
	}
	// Jeton choisi au clic, puis clic sur le panneau du dossier ouvert = envoi
	if (CARTE.jetonChoisi) {
		const zp = zoneDepotPanneau();
		if (zp && p.x >= zp.x && p.x <= zp.x + zp.l && p.y >= zp.y && p.y <= zp.y + zp.h) return deposerJeton(CARTE.jetonChoisi), true;
	}
	return false;
}
/** Relâchement : dépôt sur le marqueur ou le panneau du dossier ouvert, clic simple (= choisir), ou retour */
function relacherJeton() {
	const j = CARTE.jeton;
	if (!j) return false;
	const p = sourisAppli();
	CARTE.jeton = null;
	if (Math.hypot(p.x - j.x0, p.y - j.y0) < 8) return choisirJeton(j.cle), true;
	const zp = zoneDepotPanneau();
	const dans = (r) => r && p.x >= r.x && p.x <= r.x + r.l && p.y >= r.y && p.y <= r.y + r.h;
	if (CARTE.depots.some(dans) || dans(zp)) return deposerJeton(j.cle), true;
	CARTE.retour = { cle: j.cle, x: p.x, y: p.y, t: millis() };
	return true;
}
/** Échap annule un jeton choisi au clic */
function toucheCarte() {
	if (CARTE.jetonChoisi && keyCode === ESCAPE) return (CARTE.jetonChoisi = null), true;
	return false;
}
