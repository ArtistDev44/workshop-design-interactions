/* Nantes en régulation — prompt 88 : interface des tâches (fenêtre « tache »), au clavier seul ou à la souris.
 * Clavier : 1 à 4 = choisir, Tab = groupe ou case suivante, Entrée = valider, Échap = passer.
 * La logique (options, effets, rotation) est dans taches.js ; ici, l'affichage et les annonces (aria-live).
 */
const TACHE = { courante: null, choix: [], groupe: 0, suite: null, file: [], introVues: null, resultat: null };
const CLE_INTRO_TACHES = 'pxe-nte001-taches-intro';
/** Portrait mobile : la fenêtre est réduite à ~1/3 ; les cibles passent à 136 px de canevas (≥ 44 px à l'écran) */
const enPortrait = () => typeof MOBILE !== 'undefined' && MOBILE.portrait;
const hb = (h) => (enPortrait() ? Math.max(h, 136) : h);

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
	if (MENU.actif || ecran !== 'jeu' || fenetre || smsActif || tutoriel || TRANSITION_JOUR || enPause) return false;
	if (!['attente', 'selection'].includes(phase) || vue !== 'poste' || PC.etat !== 'appli' || (typeof pcDemarre === 'function' && pcDemarre())) return false;
	if (typeof CINE !== 'undefined' && CINE) return false;
	if (typeof FIL !== 'undefined' && !FIL.explicationVue) return false; // l'explication du poste passe d'abord
	if (TACHE.courante) return ouvrir('tache'), true; // tâche interrompue par une autre fenêtre : on la reprend
	const b = Taches.briefing();
	if (b) return ouvrirTache({ type: 'briefing', donnees: b }), true;
	const a = Taches.arbitrage(); // option du groupe (lot F), une fois par semaine
	if (a) return ouvrirTache(a), true;
	const suivante = TACHE.file.shift();
	if (suivante) return ouvrirTache(suivante), true;
	return false;
}
function ouvrirTache(tache, suite) {
	TACHE.courante = tache;
	TACHE.choix = tache.type === 'info' ? tache.blocs.map(() => null) : [];
	TACHE.groupe = 0;
	TACHE.resultat = null;
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
	} else if (tache.type === 'info') {
		const b = tache.blocs[TACHE.groupe];
		if (!b || !b.options[i]) return;
		TACHE.choix[TACHE.groupe] = i;
		annoncer(t('tache.info.bloc.' + b.id) + ' : ' + b.options[i]);
		const vide = TACHE.choix.findIndex((c) => c === null);
		if (vide >= 0) TACHE.groupe = vide; // case suivante à remplir
	} else if (tache.type === 'evenement' || tache.type === 'arbitrage') {
		const o = tache.options[i];
		if (!o) return;
		TACHE.choix = [o];
		annoncer(tache.type === 'arbitrage' ? t('tache.arbitrage.' + o) : t('tache.prep.' + o, { nom: tache.nom, cout: Taches.R.prep.cout }));
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
	if (TACHE.resultat || tache.type === 'recap') return fermerTache(); // écran de résultat ou récapitulatif : Entrée / Échap pour continuer
	if (tache.type === 'info' || tache.type === 'evenement' || tache.type === 'arbitrage') {
		if (!passer && (tache.type === 'info' ? TACHE.choix.some((c) => c === null) : !TACHE.choix[0])) return annoncer(t('tache.' + tache.type + '.incomplet'));
		const r = Taches.resoudre(tache, passer ? null : tache.type === 'info' ? TACHE.choix.slice() : TACHE.choix[0]);
		if (passer || !r || r.ok === null) {
			annoncer(t('tache.passee'));
			return fermerTache();
		}
		TACHE.resultat = r;
		const txt = tache.type === 'info' ? t(r.ok ? 'tache.info.juste' : 'tache.info.faux', { v: Math.abs(r.effets.reputation) }) : tache.type === 'arbitrage' ? t('tache.arbitrage.ok.' + TACHE.choix[0]) : t('tache.prep.ok', { nom: tache.nom, cout: Taches.R.prep.cout });
		annoncer(txt);
		Confort.Son.bip(r.ok === false ? 'alerte' : 'choix');
		return;
	}
	if (tache.type === 'briefing') {
		if (!passer && TACHE.choix.length < 2) return annoncer(t('tache.briefing.deux'));
		const p = Taches.choisirPriorites(passer ? [] : TACHE.choix);
		annoncer(passer || !p.length ? t('tache.briefing.passe') : t('tache.briefing.ok', { liste: p.map((x) => t('tache.prio.' + x.id, x.vars)).join(Langue.actuelle === 'fr' ? ' ; ' : '; ') }));
	} else if (tache.type === 'rapport') {
		if (!passer && (!TACHE.choix[0] || !TACHE.choix[1])) return annoncer(t('tache.rapport.incomplet'));
		const r = Taches.validerRapport(TACHE.choix[0] || null, passer ? null : TACHE.choix[1]);
		annoncer(t('tache.rapport.ok') + ' ' + texteDemande(r));
		// Récapitulatif du soir (§ 4), puis la suite de la fin de journée
		const j = Taches.jour(tache.donnees.date);
		Confort.Son.bip('choix');
		return ouvrirRecap({ date: tache.donnees.date, rapport: r, recap: j.recap });
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
	if (toucheOptionsJeu()) return true;
	if (fenetre !== 'tache') return false;
	const tache = TACHE.courante;
	if (!tache) return fermer(), true;
	if (['1', '2', '3', '4'].includes(key)) basculerChoix(Number(key) - 1);
	else if (keyCode === TAB) {
		if (tache.type === 'info') {
			TACHE.groupe = (TACHE.groupe + (keyIsDown(SHIFT) ? tache.blocs.length - 1 : 1)) % tache.blocs.length;
			annoncer(t('tache.info.bloc.' + tache.blocs[TACHE.groupe].id));
		}
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
	const h = enPortrait() ? H - 20 : 820;
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
	if (TACHE.resultat) yy = corpsResultat(tache, TACHE.resultat, x + 56, yy, l - 112);
	else if (tache.type === 'briefing') yy = corpsBriefing(tache.donnees, x + 56, yy, l - 112);
	else if (tache.type === 'info') yy = corpsInfo(tache, x + 56, yy, l - 112);
	else if (tache.type === 'evenement') yy = corpsPreparation(tache, x + 56, yy, l - 112);
	else if (tache.type === 'recap') yy = corpsRecap(tache.donnees, x + 56, yy, l - 112);
	else if (tache.type === 'arbitrage') yy = corpsArbitrage(tache, x + 56, yy, l - 112);
	else if (tache.type === 'rapport') yy = corpsRapport(tache.donnees, x + 56, yy, l - 112);
	// Pied : consigne clavier + boutons
	textFont(POLICE_DONNEES);
	textSize(18);
	textAlign(LEFT, TOP);
	fill(C.gris);
	const hp = hb(68);
	const yp = y + h - hp - 36;
	if (!enPortrait()) text(t(TACHE.resultat || tache.type === 'recap' ? 'tache.consigne.resultat' : 'tache.consigne.' + tache.type), x + 56, yp, l - 112 - 560, 70);
	if (TACHE.resultat || tache.type === 'recap') return bouton(x + l - 56 - 260, yp, 260, hp, t('tache.continuer'), fermerTache);
	bouton(x + l - 56 - 260, yp, 260, hp, t('tache.valider'), () => validerTache(false));
	bouton(x + l - 56 - 260 - 276, yp, 260, hp, t('tache.passer'), () => validerTache(true), false, true);
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
		const by = y + Math.floor(i / 2) * (hb(76) + 16);
		const pris = TACHE.choix.includes(o.id);
		bouton(bx, by, lb, hb(76), i + 1 + '  ' + (pris ? '✓ ' : '') + t('tache.prio.' + o.id, o.vars), () => basculerChoix(i), false, !pris);
	});
	return y + 2 * (hb(76) + 16);
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
		const cols = enPortrait() ? 2 : 1;
		const lc = (l - (cols - 1) * 12) / cols;
		liste.forEach((o, i) => {
			const pris = TACHE.choix[g] === o.id;
			bouton(x + (i % cols) * (lc + 12), y + Math.floor(i / cols) * (hb(56) + 8), lc, hb(56), i + 1 + '  ' + (pris ? '✓ ' : '') + court(libelle(o), cols > 1 ? 40 : 90), () => ((TACHE.groupe = g), basculerChoix(i)), false, !pris);
		});
		y += Math.ceil(liste.length / cols) * (hb(56) + 8);
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

/** Ouvre la prochaine tâche en file juste après une narration (avant de reprendre un autre signalement) */
function ouvrirTacheEnFile(suite) {
	if (!TACHE.file.length || fenetre || ecran !== 'jeu') return false;
	ouvrirTache(TACHE.file.shift(), suite);
	return true;
}
function corpsInfo(tache, x, y, l) {
	y = ligneInfo(t('tache.info.contexte', { sujet: tache.sujet, action: tache.action }), x, y, l) + 8;
	tache.blocs.forEach((b, k) => {
		const actif = TACHE.groupe === k;
		textAlign(LEFT, TOP);
		textFont(POLICE_DONNEES);
		textStyle(BOLD);
		textSize(17);
		fill(actif ? C.accent : C.gris);
		text(t('tache.info.bloc.' + b.id).toUpperCase() + (actif ? '  ◀' : ''), x, y + 14);
		textStyle(NORMAL);
		const lb = (l - 220 - 2 * 10) / 3;
		b.options.forEach((o, i) => {
			const pris = TACHE.choix[k] === i;
			bouton(x + 220 + i * (lb + 10), y, lb, hb(52), (actif ? i + 1 + '  ' : '') + (pris ? '✓ ' : '') + court(o, 30), () => ((TACHE.groupe = k), basculerChoix(i)), false, !pris);
		});
		y += hb(52) + 12;
	});
	return y;
}
function corpsPreparation(tache, x, y, l) {
	y = ligneInfo(t('tache.prep.contexte', { nom: tache.nom, heure: tache.heure }), x, y, l) + 12;
	tache.options.forEach((o, i) => {
		const pris = TACHE.choix[0] === o;
		bouton(x, y, l, hb(64), i + 1 + '  ' + (pris ? '✓ ' : '') + t('tache.prep.' + o, { nom: tache.nom, cout: Taches.R.prep.cout }), () => basculerChoix(i), false, !pris);
		y += hb(64) + 12;
	});
	return y;
}
function corpsResultat(tache, r, x, y, l) {
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(24);
	fill(r.ok === false ? C.rouge : C.vert);
	const titre = tache.type === 'info' ? t(r.ok ? 'tache.info.juste' : 'tache.info.faux', { v: Math.abs(r.effets.reputation) }) : tache.type === 'arbitrage' ? t('tache.arbitrage.ok.' + TACHE.choix[0]) : t('tache.prep.ok', { nom: tache.nom, cout: Taches.R.prep.cout });
	text(titre, x, y, l, 70);
	textStyle(NORMAL);
	y += 84;
	if (tache.type === 'info') {
		tache.blocs.forEach((b, k) => {
			const ok = !r.faux[k];
			textSize(20);
			fill(ok ? C.texte : C.orange);
			text((ok ? '✓ ' : '✗ ') + t('tache.info.resultat', { bloc: t('tache.info.bloc.' + b.id), choix: court(b.options[TACHE.choix[k]], 60) }) + (ok ? '' : ' → ' + court(b.options[b.bonne], 60)), x, y, l, 30);
			y += 34;
		});
		if (!r.ok) {
			fill(C.gris);
			text(t('tache.info.plainte'), x, y + 6, l, 30);
			y += 40;
		}
	}
	return y;
}

/** Libellé de bouton raccourci (le texte complet reste dans la phrase de contexte et l'annonce) */
function court(s, n) {
	const x = String(s);
	return x.length > n ? x.slice(0, n - 1).trim() + '…' : x;
}

// ——— Prompt 88 § 3 : ambiance (humeur musicale) et visite surprise annoncée la veille ———
/** Chaque image : morceau « régulation » pendant la cellule de crise et la journée tempête, sinon le choix du joueur */
function majAmbianceTaches() {
	const m = Confort.Son.musique;
	if (!m || !m.humeur) return;
	const jr = ecran === 'jeu' && Jeu.jourCourant ? Jeu.jourCourant() : null;
	const tendu = jr && ['attente', 'selection', 'decision', 'contradiction', 'conflit', 'narration'].includes(phase) && (Taches.criseActive() || Taches.theme(jr.date) === 'tempete');
	m.humeur(tendu ? 'regulation' : null);
}
/** Fin du soir : si demain est le jour de l'inspection (prompt 47), Camille prévient par SMS ; true = SMS lancé */
function smsVeilleInspection(suite) {
	const e = Taches.etat();
	const demain = Jeu.jours && Jeu.jours[Jeu.jourIndex + 1];
	if (!demain || e.smsInspection || Jeu.inspection || Jeu.jourIndex + 1 !== Jeu.jourInspection()) return false;
	if (!(Jeu.evenementsJournee || []).some((x) => x.cleAction && x.cleAction !== 'temps')) return false; // pas de décision à inspecter
	e.smsInspection = true;
	lancerConversation({
		contact: T('sms.camille'),
		sous: T('intro.salle'),
		messages: [
			{ de: T('sms.camille'), texte: T('tache.sms.inspection', { theme: t('theme.' + Taches.theme(demain.date)) }) },
			{ de: 'moi', texte: T('tache.sms.reponse') },
		],
		auFin: () => {
			smsActif = false;
			suite();
		},
	});
	return true;
}

// ——— Récapitulatif du soir (§ 4) : expérience, badges, priorités, fait marquant ; sans animation si réduites ———
function ouvrirRecap(donnees) {
	const suite = TACHE.suite;
	marquerIntroTache('rapport');
	TACHE.courante = { type: 'recap', donnees };
	TACHE.premiere = !introTacheVue('recap');
	TACHE.resultat = null;
	TACHE.suite = suite;
	TACHE.debutRecap = millis();
	const rc = donnees.recap || { xp: { total: 0, lignes: [] }, badges: [], grade: Taches.grade() };
	annoncer(t('recap.annonce', { xp: rc.xp.total, grade: t('grade.' + rc.grade.i) }) + (rc.badges.length ? ' ' + t('recap.badges', { liste: rc.badges.map((b) => t('badge.' + b)).join(', ') }) : '') + (rc.monte ? ' ' + t('recap.monte', { grade: t('grade.' + rc.grade.i) }) : ''));
}
function corpsRecap(d, x, y, l) {
	const rc = d.recap || { xp: { total: 0, lignes: [] }, badges: [], grade: Taches.grade() };
	const k = reduireAnimations ? 1 : constrain((millis() - TACHE.debutRecap) / 1200, 0, 1);
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(40);
	fill(C.vert);
	text('+' + Math.round(rc.xp.total * easeOut(k)) + ' XP', x, y);
	textStyle(NORMAL);
	textSize(20);
	fill(C.texte);
	const g = rc.grade;
	text(t('recap.grade', { grade: t('grade.' + g.i), xp: g.xp }) + (g.prochain !== null ? ' · ' + t('recap.prochain', { reste: g.prochain - g.xp, grade: t('grade.' + (g.i + 1)) }) : ''), x + 260, y + 4, l - 260, 30);
	if (g.prochain !== null) {
		const bas = Taches.R.grades[g.i];
		fill(C.piste);
		rect(x + 260, y + 36, l - 260, 10);
		fill(C.accent);
		rect(x + 260, y + 36, ((l - 260) * (g.xp - bas)) / (g.prochain - bas), 10);
	}
	if (rc.monte) {
		fill(C.accent);
		textStyle(BOLD);
		const opt = Jeu.taches && Jeu.taches.options && Jeu.taches.options.deblocages;
		text(t('recap.monte', { grade: t('grade.' + g.i) }) + (opt ? ' ' + t('deblocage.grade.' + g.i) : ''), x + 260, y + 50, l - 260, 30);
		textStyle(NORMAL);
	}
	y += 88;
	textFont(POLICE_DONNEES);
	textSize(18);
	rc.xp.lignes.forEach((ln) => {
		fill(C.gris);
		text(t(ln.cle, { n: ln.n }) + '  +' + ln.v, x, y);
		y += 26;
	});
	y += 8;
	textFont(POLICE_TEXTE);
	textSize(20);
	(d.rapport && d.rapport.priorites ? d.rapport.priorites : []).forEach((p) => {
		fill(p.etat === 'tenue' ? C.vert : p.etat === 'manquee' ? C.orange : C.gris);
		text((p.etat === 'tenue' ? '✓ ' : p.etat === 'manquee' ? '✗ ' : '· ') + t('tache.prio.' + p.id, p.vars) + ' — ' + t('tache.etat.' + p.etat), x, y, l, 28);
		y += 30;
	});
	fill(C.texte);
	if (d.rapport) {
		text(t('recap.fait', { fait: d.rapport.fait }), x, y + 4, l, 56);
		y += textWidth(t('recap.fait', { fait: d.rapport.fait })) > l ? 62 : 34;
		fill(C.gris);
		text(texteDemande(d.rapport), x, y, l, 30);
		y += 40;
	}
	rc.badges.forEach((b, i) => {
		dessinerBadge(b, x + i * 280, y, 44, true);
		fill(C.texte);
		textSize(18);
		text(t('badge.' + b), x + i * 280 + 54, y + 10, 220, 30);
	});
	return y + 56;
}

/** Badges pixel (design system) : motif 8 × 8 dessiné par le code ; gris si pas encore obtenu */
const MOTIFS_BADGES = {
	zero_non_traite: ['..####..', '.#....#.', '#..##..#', '#.#..#.#', '#.#..#.#', '#..##..#', '.#....#.', '..####..'],
	info_parfaite: ['########', '#......#', '#.####.#', '#......#', '#.###..#', '#......#', '####.###', '...##...'],
	semaine_budget: ['...##...', '.######.', '##.##...', '.#####..', '...##.#.', '...####.', '.######.', '...##...'],
	crise_maitrisee: ['...##...', '..####..', '.##..##.', '.#.##.#.', '.#.##.#.', '.##..##.', '..####..', '...##...'],
};
function dessinerBadge(id, x, y, taille, obtenu) {
	const m = MOTIFS_BADGES[id];
	if (!m) return;
	const p = taille / 8;
	noStroke();
	fill(obtenu ? 'rgba(255,193,56,0.18)' : 'rgba(255,255,255,0.06)');
	rect(x - 2, y - 2, taille + 4, taille + 4);
	fill(obtenu ? C.accent : C.bord);
	m.forEach((ligne, r) => [...ligne].forEach((c, k) => c === '#' && rect(x + k * p, y + r * p, Math.ceil(p), Math.ceil(p))));
}
function corpsArbitrage(tache, x, y, l) {
	y = ligneInfo(t('tache.arbitrage.contexte', { budget: tache.budget }), x, y, l) + 12;
	tache.options.forEach((o, i) => {
		const pris = TACHE.choix[0] === o;
		bouton(x, y, l, hb(64), i + 1 + '  ' + (pris ? '✓ ' : '') + t('tache.arbitrage.' + o), () => basculerChoix(i), false, !pris);
		y += hb(64) + 12;
	});
	return y;
}

// ——— Lot F : options soumises au groupe (Paramètres → G), désactivées par défaut ———
const OPTIONS_JEU = ['chaines', 'deblocages', 'arbitrage', 'traceDossier', 'pressionVisible', 'deVisible', 'eclairageJauges', 'npd', 'deblocageApplis', 'toutDebloque', 'somnolenceNecessaire']; // prompt 89 bis : 4 options (§ 6) ; prompt 90 : Ne pas déranger ; prompt 91 : § 7
let confirmerRemiseCarriere = 0;
function ouvrirOptionsJeu() {
	confirmerRemiseCarriere = 0;
	ouvrir('optionsJeu');
	annoncer(t('optjeu.titre') + '. ' + t('optjeu.note'));
}
function basculerOptionJeu(nom) {
	Confort.Reglages.basculer(nom);
	annoncer(t('optjeu.' + nom) + ' : ' + t(Confort.Reglages[nom] ? 'commun.oui' : 'commun.non') + (OPTIONS_JEU.indexOf(nom) < 3 ? '. ' + t('optjeu.prochaine') : '.'));
}
function remettreCarriere() {
	if (!confirmerRemiseCarriere || millis() - confirmerRemiseCarriere > 5000) {
		confirmerRemiseCarriere = millis();
		return annoncer(t('optjeu.confirmer'));
	}
	confirmerRemiseCarriere = 0;
	Taches.reinitialiserCarriere();
	annoncer(t('optjeu.remise'));
	Confort.Son.bip('choix');
}
const OPTJEU = { focus: 0 };
function fenetreOptionsJeu() {
	const l = 1500;
	const h = 1050;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	noStroke();
	dsTitre(t('optjeu.titre').toUpperCase(), x + 48, y + 30, 36, C.texte, 'left');
	const R = Confort.Reglages;
	const items = OPTIONS_JEU.concat(['carriere']);
	const lc = (l - 96 - 24) / 2;
	const hc = 126;
	items.forEach((nom, i) => {
		const cx = x + 48 + (i % 2) * (lc + 24);
		const cy = y + 92 + Math.floor(i / 2) * (hc + 8);
		const focus = OPTJEU.focus === i;
		noStroke();
		fill(focus ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)');
		rect(cx, cy, lc, hc);
		if (focus) {
			noFill();
			stroke(C.accent);
			strokeWeight(3);
			rect(cx, cy, lc, hc);
			noStroke();
		}
		textAlign(LEFT, TOP);
		textFont(POLICE_TEXTE);
		textSize(21);
		fill(C.texte);
		const titre = nom === 'carriere' ? t('optjeu.carriere', { grade: t('grade.' + Taches.grade().i), xp: Taches.grade().xp }) : t('optjeu.' + nom);
		text((i < 9 ? i + 1 + '  ' : '') + titre, cx + 16, cy + 12, lc - 230, 30);
		textFont(POLICE_DONNEES);
		textSize(15);
		textLeading(19); // prompt 123 : interligne fixé ici (il dépendait de la dernière fenêtre dessinée, l'ancienne aide le remettait à zéro)
		fill(C.gris);
		if (nom !== 'carriere') text(t('optjeu.' + nom + '.detail'), cx + 16, cy + 46, lc - 230, 72);
		if (nom === 'carriere') bouton(cx + lc - 16 - 260, cy + 30, 260, 64, t(confirmerRemiseCarriere && millis() - confirmerRemiseCarriere < 5000 ? 'optjeu.confirmerBouton' : 'optjeu.remettre'), remettreCarriere, false, true);
		else bouton(cx + lc - 16 - 180, cy + 30, 180, 64, t(R[nom] ? 'commun.oui' : 'commun.non'), () => ((OPTJEU.focus = i), basculerOptionJeu(nom)), false, !R[nom]);
	});
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(16);
	fill(C.gris);
	text(t('optjeu.note'), x + 48, y + h - 100, l - 400, 70);
	bouton(x + l - 48 - 240, y + h - 96, 240, 64, t('param.retour'), () => ouvrir('parametres'));
}
function toucheOptionsJeu() {
	if (fenetre !== 'optionsJeu') return false;
	const items = OPTIONS_JEU.concat(['carriere']);
	const activer = (i) => (items[i] === 'carriere' ? remettreCarriere() : basculerOptionJeu(items[i]));
	const n = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].indexOf(key);
	if (n >= 0 && n < items.length) return (OPTJEU.focus = n), activer(n), true;
	const pas = { [UP_ARROW]: -2, [DOWN_ARROW]: 2, [LEFT_ARROW]: -1, [RIGHT_ARROW]: 1 }[keyCode];
	if (pas) {
		OPTJEU.focus = constrain(OPTJEU.focus + pas, 0, items.length - 1);
		const nom = items[OPTJEU.focus];
		annoncer(nom === 'carriere' ? t('optjeu.remettre') : t('optjeu.' + nom) + ' : ' + t(Confort.Reglages[nom] ? 'commun.oui' : 'commun.non') + '. ' + t('optjeu.' + nom + '.detail'));
		return true;
	}
	if (keyCode === ENTER || keyCode === RETURN || key === ' ') return activer(OPTJEU.focus), true;
	if (keyCode === ESCAPE) ouvrir('parametres');
	return true;
}
