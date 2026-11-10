/* Nantes en régulation — prompt 68 : la Carte devient l'écran de jeu unique (proposé par un membre du groupe).
 * - L'appli « Régulation » disparaît de RégulOS ; l'icône Carte ouvre l'écran de jeu (carte + panneau incident).
 * - Les incidents arrivent comme des SIGNALEMENTS sur la carte et dans une FILE D'ATTENTE ; le compteur ne démarre
 *   qu'à la sélection (Entrée ou clic). En file, chaque incident expire après 2 × le compteur de la semaine :
 *   il est alors réglé par la règle « non traité » (Q25, malus du prompt 23).
 * - Repère à l'emplacement réel de la ligne (une fois la carte consultée, prompt 50), sinon « Réseau » au centre ;
 *   après la décision, le repère passe au vert (bon choix) ou à l'orange (raté) puis s'efface.
 * - Panneau incident : gravité calculée, onglets Enquête (sources, prompt 50) / Historique de la ligne / Équipes.
 * - Équipes limitées (game.js) : pictogrammes qui partent du centre de régulation vers l'incident puis reviennent ;
 *   raccourcis Maj + 1/2/3/4 (police, ambulanciers, techniciens, pompiers).
 * Données réelles uniquement ; absent → « non renseigné ».
 */
const SELECTION = { depuis: 0, paquet: null, arrivees: {}, traces: [], onglet: 'enquete', message: null, surbrillance: null, legendeRepliee: false };
const compteurSemaine = () => ((Jeu.etat.semaine && Jeu.etat.semaine.difficulte && Jeu.etat.semaine.difficulte.compteur_s) || 30) * 1000;

/** Dossiers arrivés (heure de jeu atteinte) et pas encore traités, dans l'ordre : la tête est le prochain à traiter */
function fileIncidents() {
	if (ecran !== 'jeu' || !Jeu.paquet || !Jeu.horloge) return [];
	const j = Jeu.jourCourant();
	if (!j) return [];
	// Prompt 66 (correctif) : les arrivées sont indexées par n° de dossier ; une nouvelle partie, semaine ou reprise
	// (nouveau paquet) les remet à zéro — sinon les signalements expiraient dès leur arrivée la semaine suivante
	if (SELECTION.paquet !== Jeu.paquet) {
		SELECTION.paquet = Jeu.paquet;
		SELECTION.arrivees = {};
		SELECTION.traces = [];
	}
	const f = [];
	for (let i = Jeu.index; i < Jeu.paquet.length; i++) {
		const d = Jeu.paquet[i];
		if (d.date !== j.date) break;
		if (d.minute > Jeu.horloge.minutes) break;
		if (!SELECTION.arrivees[i]) SELECTION.arrivees[i] = millis(); // première apparition sur la carte
		f.push({ index: i, d, depuis: SELECTION.arrivees[i] });
	}
	return f;
}
const resteAvantExpiration = (it) => Math.max(0, 2 * compteurSemaine() * facteurLecture() - (millis() - it.depuis));

/** Un signalement arrive (appelé à la place de nouveauDossier quand le joueur n'est pas endormi) */
function entrerSelection() {
	phase = 'selection';
	SELECTION.depuis = millis();
	SELECTION.onglet = 'enquete';
	const d = Jeu.dossierCourant();
	if (!d) return apresDecision();
	Confort.Son.alerteDossier(d.type, fileIncidents().length);
	annoncer(t('carte.signalement', { quoi: t('enq.signalement.' + d.type), gravite: t('gravite.' + Jeu.gravite(d)) }));
	fileIncidents(); // met à jour les arrivées (et les remet à zéro si le paquet a changé)
	if (SELECTION.arrivees[Jeu.index] && millis() - SELECTION.arrivees[Jeu.index] > 2 * compteurSemaine() * facteurLecture()) expirerSelection();
}
function selectionnerIncident() {
	if (phase !== 'selection') return;
	interaction();
	nouveauDossier(); // le compteur démarre maintenant (conflit, contradiction ou décision)
}
/** File d'attente dépassée : le dossier est réglé sans le joueur (conséquences naturelles, malus « non traité ») */
function expirerSelection() {
	nouveauDossier();
	phase = 'decision';
	decider('temps');
	Confort.Son.bip('consequence');
	annoncer(t('carte.expire'));
}
/** Vérification à chaque image (draw) */
function majSelection() {
	if (phase !== 'selection' || ecran !== 'jeu' || enPause) return;
	const tete = fileIncidents()[0];
	if (tete && resteAvantExpiration(tete) <= 0) expirerSelection();
}

// ——— Panneau de droite pendant la sélection : le signalement et la file d'attente ———
function dessinerSelection() {
	const base = { x: DROITE.x, y: DROITE.y + 130, l: DROITE.l, h: DROITE.h - 130 };
	panneau(base.x, base.y, base.l, base.h, C.orange);
	const f = fileIncidents();
	const tete = f[0];
	const d = Jeu.dossierCourant();
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(C.orange);
	text(t('carte.nouveau', { n: f.length }), base.x + 32, base.y + 26);
	if (!d) return;
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	ajusterTaille(t('enq.signalement.' + d.type), base.l - 64, 36, 22);
	fill(C.texte);
	text(t('enq.signalement.' + d.type), base.x + 32, base.y + 62);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(20);
	fill(couleurGravite(Jeu.gravite(d)));
	text(t('carte.gravite', { g: t('gravite.' + Jeu.gravite(d)) }) + ' · ' + Jeu.formaterHeure(d.minute), base.x + 32, base.y + 116);
	fill(C.gris);
	textSize(18);
	if (tete) text(t('carte.expireDans', { s: Math.ceil(resteAvantExpiration(tete) / 1000) }), base.x + 32, base.y + 150);
	bouton(base.x + 32, base.y + 190, base.l - 64, 76, t('carte.prendre'), selectionnerIncident);
	textAlign(LEFT, TOP);
	cibleGuide('actions', base.x + 32, base.y + 190, base.l - 64, 76);
	// File d'attente
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(C.gris);
	text(t('carte.file', { n: f.length }), base.x + 32, base.y + 300);
	f.slice(0, 6).forEach((it, i) => {
		const y = base.y + 336 + i * 70;
		fill(i === 0 ? 'rgba(255,193,56,0.16)' : 'rgba(255,255,255,0.05)');
		rect(base.x + 32, y, base.l - 64, 60);
		fill(couleurGravite(Jeu.gravite(it.d)));
		rect(base.x + 32, y, 6, 60);
		textFont(POLICE_TEXTE);
		textSize(19);
		fill(C.texte);
		text(Jeu.formaterHeure(it.d.minute) + ' · ' + t('enq.signalement.' + it.d.type), base.x + 50, y + 8, base.l - 100, 26);
		textFont(POLICE_DONNEES);
		textSize(16);
		fill(C.gris);
		text(t('gravite.' + Jeu.gravite(it.d)) + ' · ' + t(i === 0 ? 'carte.expireDans' : 'carte.attendDepuis', { s: Math.ceil((i === 0 ? resteAvantExpiration(it) : millis() - it.depuis) / 1000) }), base.x + 50, y + 36);
	});
}
function couleurGravite(g) {
	return g === 'elevee' ? C.rouge : g === 'moyenne' ? C.orange : C.gris;
}

// ——— Onglets du panneau incident (dessinés par enquete.js au-dessus des sources) ———
const ONGLETS_INCIDENT = ['enquete', 'historique', 'equipes'];
function dessinerOngletsIncident(x, y, l) {
	const lb = (l - 2 * 10) / 3;
	ONGLETS_INCIDENT.forEach((o, i) => bouton(x + i * (lb + 10), y, lb, 44, t('carte.onglet.' + o), () => (SELECTION.onglet = o), false, SELECTION.onglet !== o));
	textAlign(LEFT, TOP);
}
/** Historique de la ligne dans la semaine (calcul sur Jeu.evenementsJournee) */
function dessinerHistoriqueLigne(d, x, y, l, h) {
	const e = enqueteDossier();
	const lignes = [];
	if (!(d.lignes && d.lignes.length)) lignes.push(t('carte.histo.sansLigne'));
	else if (!e.revele.carte) lignes.push(t('carte.histo.consulter'));
	else {
		const passes = (Jeu.evenementsJournee || []).filter((x) => x.resultat && (x.resultat.dossier.lignes || []).some((n) => d.lignes.includes(n)));
		lignes.push(t('carte.histo.nb', { n: passes.length, lignes: d.lignes.join(', ') }));
		const der = passes[passes.length - 1];
		if (der) lignes.push(t('carte.histo.derniere', { date: der.jour.split('-').reverse().join('/'), action: der.action ? String(der.action) : t('journal.aucuneAction'), eval: t('eval.' + Jeu.evaluer(der)) }));
		d.lignes.forEach((n) => {
			const ln = Jeu.lignes && Jeu.lignes.lignes.find((x) => x.nom === n);
			lignes.push(t('carte.histo.ligne', { nom: n, mode: ln && TRADUCTIONS.fr['mode.' + ln.type] !== undefined ? t('mode.' + ln.type) : t('carte.nonRenseigne') }));
		});
	}
	textFont(POLICE_TEXTE);
	textSize(20);
	textLeading(28);
	fill(C.texte);
	textAlign(LEFT, TOP);
	text(lignes.join('\n'), x, y, l, h);
}
/** Équipes : disponibilité, pertinence (indication, pas une recommandation d'action de régulation), envoi */
function dessinerEquipesIncident(d, x, y, l) {
	if (!Jeu.elementDebloque('equipes')) {
		textFont(POLICE_TEXTE);
		textSize(20);
		fill(C.gris);
		text(t('histoire.verrou.equipes'), x, y, l, 80);
		return;
	}
	const pert = Jeu.equipesPertinentes(d);
	const m = millis();
	Jeu.TYPES_EQUIPES.forEach((cle, i) => {
		const q = Jeu.EQUIPES[cle];
		const yy = y + i * 70;
		const dispo = Jeu.equipesDisponibles(cle, m);
		const eff = Jeu.REGLAGES.equipes[cle].effectif;
		fill(255, 255, 255, 13);
		rect(x, yy, l, 60);
		textFont(POLICE_TEXTE);
		textSize(19);
		fill(C.texte);
		textAlign(LEFT, TOP);
		text(String(q.nom) + (pert.includes(cle) ? ' · ' + t('carte.pertinente') : ''), x + 12, yy + 6, l - 250, 26);
		textFont(POLICE_DONNEES);
		textSize(16);
		fill(dispo ? C.gris : C.orange);
		text(t('carte.dispo', { n: dispo, eff, cout: q.cout }) + (dispo ? '' : ' · ' + t('carte.retour', { s: Jeu.retourEquipe(cle, m) })), x + 12, yy + 34, l - 250, 22);
		bouton(x + l - 228, yy + 8, 228, 44, t('carte.envoyer', { n: i + 1 }), () => envoyerEquipeIncident(cle), !dispo, !pert.includes(cle));
		textAlign(LEFT, TOP);
	});
	if (SELECTION.message && m - SELECTION.message.t < 5000) {
		textFont(POLICE_DONNEES);
		textSize(17);
		fill(SELECTION.message.ok ? C.vert : C.orange);
		text(String(SELECTION.message.texte), x, y + 4 * 70 + 4, l, 44);
	}
}
function envoyerEquipeIncident(cle) {
	if (!['decision', 'contradiction', 'conflit', 'narration', 'selection'].includes(phase)) return;
	const index = phase === 'narration' ? Jeu.index - 1 : Jeu.index;
	const r = Jeu.envoyerEquipe(index, cle, millis());
	SELECTION.message = { texte: r.message, ok: r.ok, t: millis() };
	annoncer(String(r.message));
	if (r.refus) Confort.Son.bip('alerte');
	else Confort.Son.clic();
	if (r.refus && !Jeu.equipesDisponibles(cle, millis())) Jeu.messagePatron(T('patron.plusEquipe', { nom: Jeu.EQUIPES[cle].nom, s: Jeu.retourEquipe(cle, millis()) }));
}
/** Raccourcis Maj + 1/2/3/4 (keyCode 49–52 : indépendant AZERTY / QWERTY) ; true si la touche est prise */
function toucheEquipes() {
	if (!keyIsDown(SHIFT) || keyCode < 49 || keyCode > 52) return false;
	envoyerEquipeIncident(Jeu.TYPES_EQUIPES[keyCode - 49]);
	return true;
}

// ——— Carte : repères, file, équipes en mouvement, surbrillance (appelé avec la projection de la carte) ———
function positionDossier(d, rang) {
	const idx = Jeu.paquet.indexOf(d);
	// Lieu réel seulement s'il est connu du joueur : dossier traité, ou dossier courant après consultation de la carte
	const connu = d.lignes && d.lignes.length && (idx < Jeu.index || (idx === Jeu.index && enqueteDossier().revele.carte));
	const c = connu ? centreLigne(d.lignes[0]) : null;
	if (c) return { x: projection.x(c[0]), y: projection.y(c[1]), reseau: false };
	const r = rang || 0; // signalements en file, lieu inconnu : rangés autour du centre « Réseau »
	return { x: CARTE.x + CARTE.l / 2 + (r ? Math.cos(r * 1.3) * 46 : 0), y: CARTE.y + CARTE.h / 2 + (r ? Math.sin(r * 1.3) * 46 : 0), reseau: true };
}
function dessinerReperesCarte() {
	if (ecran !== 'jeu' || !projection || !Jeu.paquet) return;
	const m = millis();
	const p = pulsationDouce(1.2);
	// Équipes engagées : du centre de régulation vers le repère, puis retour
	const base = { x: CARTE.x + CARTE.l / 2, y: CARTE.y + CARTE.h / 2 };
	(Jeu.equipes || []).forEach((q) => {
		const ph = Jeu.phaseEquipe(q, m);
		if (ph === 'libre' || q.jourIndex !== Jeu.jourIndex) return;
		const cible = positionDossier(Jeu.paquet[q.index]);
		let k = ph === 'place' ? 1 : ph === 'route' ? constrain((m - q.depart) / (q.arrivee - q.depart), 0, 1) : 1 - constrain((m - q.finIntervention) / (q.libre - q.finIntervention), 0, 1);
		if (reduireAnimations) k = ph === 'retour' ? 0 : 1;
		const x = lerp(base.x, cible.x, k);
		const y = lerp(base.y, cible.y, k);
		noStroke();
		fill(q.cle === 'police' ? '#3d8bff' : q.cle === 'ambulance' ? '#ffffff' : q.cle === 'pompiers' ? '#ff3b30' : '#ffc138');
		rect(x - 7 + 14, y - 7, 14, 14);
		fill(13, 12, 12);
		rect(x - 3 + 14, y - 3, 6, 6);
	});
	// File d'attente (repères orange) puis incident courant (rouge, pulse)
	const f = fileIncidents();
	f.forEach((it, i) => {
		if (i === 0 && phase !== 'selection' && !['decision', 'contradiction', 'conflit'].includes(phase)) return;
		const pos = positionDossier(it.d, i);
		const courant = i === 0;
		const r = courant ? 12 + 6 * p : 9;
		noFill();
		stroke(courant ? C.rouge : C.orange);
		strokeWeight(courant ? 4 : 3);
		rect(pos.x - r, pos.y - r, r * 2, r * 2);
		noStroke();
		fill(courant ? C.rougeFonce : C.orange);
		rect(pos.x - 5, pos.y - 5, 10, 10);
		if (pos.reseau && courant) {
			textFont(POLICE_DONNEES);
			textSize(16);
			fill(C.texte);
			textAlign(CENTER, TOP);
			text(t('carte.reseau'), pos.x, pos.y + r + 6);
			textAlign(LEFT, TOP);
		}
	});
	// Décisions récentes : vert (bon choix) ou orange (raté), puis fondu en 4 s
	SELECTION.traces = SELECTION.traces.filter((tr) => m - tr.t < 4000);
	SELECTION.traces.forEach((tr) => {
		const a = reduireAnimations ? 1 : 1 - (m - tr.t) / 4000;
		const c = color(tr.bon ? C.vert : C.orange);
		c.setAlpha(255 * a);
		noStroke();
		fill(c);
		rect(tr.x - 9, tr.y - 9, 18, 18);
	});
}
/** Après une décision (appelée par sketch.js) : laisser une trace colorée à l'emplacement de l'incident */
function traceDecision(resultat) {
	if (!projection || !resultat) return;
	const pos = positionDossier(resultat.dossier);
	const e = (Jeu.evenementsJournee || [])[Jeu.evenementsJournee.length - 1];
	SELECTION.traces.push({ x: pos.x, y: pos.y, bon: e ? Jeu.evaluer(e) === 'bon' : false, t: millis() });
}
/** Bandeau des équipes (en haut de la carte) : « Police 1/2 · … », orange à 0 */
function dessinerBandeauEquipes() {
	if (ecran !== 'jeu' || !Jeu.elementDebloque('equipes')) return;
	const m = millis();
	let x = CARTE.x + 12;
	const y = CARTE.y + CARTE.h - 42; // en bas de la carte : le zoom occupe le coin haut droit
	textFont(POLICE_DONNEES);
	textSize(15);
	textAlign(LEFT, TOP);
	Jeu.TYPES_EQUIPES.forEach((cle) => {
		const dispo = Jeu.equipesDisponibles(cle, m);
		const txt = String(Jeu.EQUIPES[cle].nom) + ' ' + dispo + '/' + Jeu.REGLAGES.equipes[cle].effectif;
		const w = textWidth(txt) + 16;
		noStroke();
		fill(13, 12, 12, 220);
		rect(x, y, w, 30);
		fill(dispo ? C.texte : C.orange);
		text(txt, x + 8, y + 6);
		x += w + 6;
	});
}
