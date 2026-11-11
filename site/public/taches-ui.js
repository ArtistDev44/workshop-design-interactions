/* Nantes en régulation — prompt 88 : interface des tâches (fenêtre « tache »), au clavier seul ou à la souris.
 * Clavier : 1 à 4 = choisir, Tab = groupe ou case suivante, Entrée = valider, Échap = passer.
 * La logique (options, effets, rotation) est dans taches.js ; ici, l'affichage et les annonces (aria-live).
 */
const TACHE = { courante: null, choix: [], groupe: 0, suite: null, file: [], introVues: null };
const CLE_INTRO_TACHES = 'pxe-nte001-taches-intro';

function introTacheVue(type) {
	if (!TACHE.introVues) {
		try {
			TACHE.introVues = JSON.parse(localStorage.getItem(CLE_INTRO_TACHES) || '{}') || {};
		} catch (e) {
			TACHE.introVues = {};
		}
	}
	return !!TACHE.introVues[type];
}
function marquerIntroTache(type) {
	introTacheVue(type);
	TACHE.introVues[type] = true;
	try {
		localStorage.setItem(CLE_INTRO_TACHES, JSON.stringify(TACHE.introVues));
	} catch (e) {}
}

/** Chaque image (draw) : ouvre la tâche attendue quand le joueur est disponible (pas pendant un signalement) */
function verifierTaches() {
	if (MENU.actif || ecran !== 'jeu' || fenetre || smsActif || tutoriel || TRANSITION_JOUR || enPause || (typeof CARNET !== 'undefined' && CARNET.ouvert)) return false;
	if (!['attente', 'selection'].includes(phase) || vue !== 'poste' || PC.etat !== 'appli' || (typeof pcDemarre === 'function' && pcDemarre())) return false;
	if (typeof CINE !== 'undefined' && CINE) return false;
	const b = Taches.briefing();
	if (b) return ouvrirTache({ type: 'briefing', donnees: b }), true;
	const suivante = TACHE.file.shift();
	if (suivante) return ouvrirTache(suivante), true;
	return false;
}
function ouvrirTache(tache, suite) {
	TACHE.courante = tache;
	TACHE.choix = [];
	TACHE.groupe = 0;
	TACHE.suite = suite || null;
	TACHE.premiere = !introTacheVue(tache.type);
	ouvrir('tache');
	Confort.Son.bip('dossier');
	annoncer(t('tache.titre.' + tache.type) + '. ' + (TACHE.premiere ? t('tache.intro.' + tache.type) + ' ' : '') + t('tache.consigne.' + tache.type));
}
function fermerTache() {
	const tache = TACHE.courante;
	if (tache) marquerIntroTache(tache.type);
	TACHE.courante = null;
	fermer();
	const suite = TACHE.suite;
	TACHE.suite = null;
	Sauvegarde.auto(false);
	if (suite) suite();
}

// ——— Fin de journée : rapport du soir avant le mail (appelée par terminerJournee) ; true = en attente ———
function tachesFinJournee() {
	if (fenetre === 'tache') return true;
	const rp = Taches.rapport();
	if (rp) return ouvrirTache({ type: 'rapport', donnees: rp }, terminerJournee), true;
	return false;
}

// ——— Choix ———
function basculerChoix(i) {
	const tache = TACHE.courante;
	if (!tache) return;
	if (tache.type === 'briefing') {
		const o = tache.donnees.options[i];
		if (!o) return;
		const k = TACHE.choix.indexOf(o.id);
		if (k >= 0) TACHE.choix.splice(k, 1);
		else if (TACHE.choix.length < 2) TACHE.choix.push(o.id);
		else annoncer(t('tache.briefing.max'));
		annoncer(t('tache.prio.' + o.id, o.vars) + ' : ' + t(TACHE.choix.includes(o.id) ? 'tache.choisi' : 'tache.retire'));
	} else if (tache.type === 'rapport') {
		const liste = TACHE.groupe === 0 ? tache.donnees.faits : tache.donnees.demandes;
		const o = liste[i];
		if (!o) return;
		TACHE.choix[TACHE.groupe] = o.id;
		annoncer(TACHE.groupe === 0 ? o.texte : t('tache.demande.' + o.id, o.vars));
		if (TACHE.groupe === 0) TACHE.groupe = 1; // passe à la demande
	}
	Confort.Son.clic();
}
function validerTache(passer) {
	const tache = TACHE.courante;
	if (!tache) return;
	if (tache.type === 'briefing') {
		if (!passer && TACHE.choix.length < 2) return annoncer(t('tache.briefing.deux'));
		const p = Taches.choisirPriorites(passer ? [] : TACHE.choix);
		annoncer(passer || !p.length ? t('tache.briefing.passe') : t('tache.briefing.ok', { liste: p.map((x) => t('tache.prio.' + x.id, x.vars)).join(Langue.actuelle === 'fr' ? ' ; ' : '; ') }));
	} else if (tache.type === 'rapport') {
		if (!passer && (!TACHE.choix[0] || !TACHE.choix[1])) return annoncer(t('tache.rapport.incomplet'));
		const r = Taches.validerRapport(TACHE.choix[0] || null, passer ? null : TACHE.choix[1]);
		annoncer(t('tache.rapport.ok') + ' ' + texteDemande(r));
	}
	Confort.Son.bip('choix');
	fermerTache();
}
function texteDemande(r) {
	if (!r || !r.demande) return t('tache.rapport.sansDemande');
	return t(r.accordee ? 'tache.rapport.accordee' : 'tache.rapport.refusee', { seuil: Taches.R.seuilAccord });
}

// ——— Clavier ———
function toucheTaches() {
	if (!fenetre && vue === 'poste' && PC.etat === 'appli' && PC.fenetre === 'journal' && (key === 'k' || key === 'K')) return basculerCarnetSemaine(), true;
	if (fenetre !== 'tache') return false;
	const tache = TACHE.courante;
	if (!tache) return fermer(), true;
	if (['1', '2', '3', '4'].includes(key)) basculerChoix(Number(key) - 1);
	else if (keyCode === TAB) {
		if (tache.type === 'rapport') {
			TACHE.groupe = 1 - TACHE.groupe;
			annoncer(t(TACHE.groupe ? 'tache.rapport.groupeDemande' : 'tache.rapport.groupeFait'));
		}
	} else if (keyCode === ENTER || keyCode === RETURN) validerTache(false);
	else if (keyCode === ESCAPE) validerTache(true);
	return true;
}

// ——— Affichage ———
function fenetreTache() {
	const tache = TACHE.courante;
	if (!tache) return fermer();
	const l = 1240;
	const h = 820;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	noStroke();
	fill(C.accent);
	rect(x, y, 12, h);
	dsTitre(t('tache.titre.' + tache.type).toUpperCase(), x + 56, y + 40, 40, C.texte, 'left');
	let yy = y + 104;
	textAlign(LEFT, TOP);
	if (TACHE.premiere) {
		// Carte d'introduction : une phrase + un exemple, la première fois seulement (rappel dans l'aide H)
		fill('rgba(255,255,255,0.06)');
		rect(x + 56, yy, l - 112, 110);
		fill(C.accent);
		rect(x + 56, yy, 6, 110);
		textFont(POLICE_TEXTE);
		textSize(20);
		textLeading(26);
		fill(C.texte);
		text(t('tache.intro.' + tache.type), x + 76, yy + 10, l - 152, 30);
		fill(C.gris);
		text(t('tache.exemple.' + tache.type), x + 76, yy + 44, l - 152, 60);
		yy += 130;
	}
	if (tache.type === 'briefing') yy = corpsBriefing(tache.donnees, x + 56, yy, l - 112);
	else if (tache.type === 'rapport') yy = corpsRapport(tache.donnees, x + 56, yy, l - 112);
	// Pied : consigne clavier + boutons
	textFont(POLICE_DONNEES);
	textSize(18);
	textAlign(LEFT, TOP);
	fill(C.gris);
	text(t('tache.consigne.' + tache.type), x + 56, y + h - 104, l - 112 - 560, 70);
	bouton(x + l - 56 - 260, y + h - 104, 260, 68, t('tache.valider'), () => validerTache(false));
	bouton(x + l - 56 - 260 - 276, y + h - 104, 260, 68, t('tache.passer'), () => validerTache(true), false, true);
}
function ligneInfo(txt, x, y, l) {
	textFont(POLICE_TEXTE);
	textSize(20);
	textLeading(26);
	fill(C.texte);
	text(txt, x, y, l, 56);
	return y + (textWidth(txt) > l ? 56 : 30);
}
function corpsBriefing(b, x, y, l) {
	const m = b.meteo;
	y = ligneInfo(m ? t('tache.briefing.meteo', { min: nombreFr(m.temp_min), max: nombreFr(m.temp_max), pluie: nombreFr(m.pluie_mm), vent: nombreFr(m.rafales_max) }) : t('enq.meteo.inconnue'), x, y, l);
	y = ligneInfo(b.agenda.length ? t('tache.briefing.agenda', { n: b.agenda.length, nom: b.agenda[0] }) : t('rythme.agendaVide'), x, y, l);
	y = ligneInfo(t('tache.briefing.travaux', { n: b.travaux }), x, y, l);
	y += 14;
	const lb = (l - 16) / 2;
	b.options.forEach((o, i) => {
		const bx = x + (i % 2) * (lb + 16);
		const by = y + Math.floor(i / 2) * 92;
		const pris = TACHE.choix.includes(o.id);
		bouton(bx, by, lb, 76, i + 1 + '  ' + (pris ? '✓ ' : '') + t('tache.prio.' + o.id, o.vars), () => basculerChoix(i), false, !pris);
	});
	return y + 2 * 92;
}
function corpsRapport(rp, x, y, l) {
	const groupe = (titre, liste, g, libelle) => {
		textAlign(LEFT, TOP); // bouton() laisse l'alignement centré
		textFont(POLICE_DONNEES);
		textStyle(BOLD);
		textSize(18);
		fill(TACHE.groupe === g ? C.accent : C.gris);
		text(titre.toUpperCase() + (TACHE.groupe === g ? '  ◀' : ''), x, y);
		textStyle(NORMAL);
		y += 30;
		liste.forEach((o, i) => {
			const pris = TACHE.choix[g] === o.id;
			bouton(x, y, l, 56, i + 1 + '  ' + (pris ? '✓ ' : '') + libelle(o), () => ((TACHE.groupe = g), basculerChoix(i)), false, !pris);
			y += 64;
		});
		y += 10;
	};
	groupe(t('tache.rapport.fait'), rp.faits, 0, (o) => o.texte);
	groupe(t('tache.rapport.demande'), rp.demandes, 1, (o) => t('tache.demande.' + o.id, o.vars));
	return y;
}

/** Après une décision du joueur (sketch.js decider) : journal de rotation ; une tâche courte éventuelle est mise en file */
function tachesApresDecision(r) {
	const tache = Taches.apresDecision(r, Jeu.index - 1);
	if (tache) TACHE.file.push(tache);
}

// ——— Carnet de la semaine (appli Journal, prompt 63) : une ligne par journée, fondée sur le rapport du soir ———
function basculerCarnetSemaine() {
	JOURNAL.carnet = !JOURNAL.carnet;
	JOURNAL.enquete = null;
	Confort.Son.clic();
	annoncer(t(JOURNAL.carnet ? 'carnet.titre' : 'carnet.retour'));
}
function carnetSemaine(z) {
	let y = z.y;
	dsTitre(t('carnet.titre'), z.x, y, 24, DS.blanc, 'left');
	dsBouton(z.x + z.l - 240, y - 4, 240, 40, t('carnet.retour') + ' (K)', basculerCarnetSemaine, 'contour');
	y += 56;
	const carnet = (Jeu.taches && Jeu.taches.carnet) || [];
	if (!carnet.length) return dsTexte(t('carnet.vide'), z.x, y, 20, DS.blanc50, 'left', z.l);
	carnet.forEach((c) => {
		noStroke();
		fill(c.crise ? DS.primaire : DS.info);
		rect(z.x, y + 4, 6, 70);
		const tete = t('carnet.ligne', { date: c.date.split('-').reverse().join('/'), fait: c.fait }) + (c.theme ? ' · ' + t('theme.' + c.theme) : '');
		dsTexte(tete, z.x + 18, y, 19, DS.blanc, 'left', z.l - 30);
		const prio = c.priorites && c.priorites.length ? t('carnet.prio', { liste: c.priorites.map((p) => t('tache.prio.' + p.id, p.vars) + ' (' + t('carnet.etat.' + p.etat) + ')').join(Langue.actuelle === 'fr' ? ' ; ' : '; ') }) : t('carnet.prioAucune');
		const dem = c.demande ? ' · ' + t('carnet.demande', { demande: t('tache.demande.' + c.demande, Taches.R.demande), etat: t(c.accordee ? 'carnet.accordee' : 'carnet.refusee') }) : '';
		dsTexte(prio + dem, z.x + 18, y + 30, 17, DS.blanc75, 'left', z.l - 30);
		y += 92;
	});
}
