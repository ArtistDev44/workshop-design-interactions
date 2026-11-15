/* Nantes en régulation — prompt 88 : interface des tâches (fenêtre « tache »), au clavier seul ou à la souris.
 * Clavier : 1 à 4 = choisir, Tab = groupe ou case suivante, Entrée = valider, Échap = passer.
 * La logique (options, effets, rotation) est dans taches.js ; ici, l'affichage et les annonces (aria-live).
 */
const TACHE = { courante: null, choix: [], groupe: 0, suite: null, file: [], introVues: null, resultat: null, bilan: null }; // prompt 222 : bilan = rapport du soir envoyé (même fenêtre)
const CLE_INTRO_TACHES = 'pxe-nte001-taches-intro';
/** Portrait mobile : la fenêtre est réduite à ~1/3 ; les cibles passent à 136 px de canevas (≥ 44 px à l'écran) */
const enPortrait = () => typeof PORTRAIT !== 'undefined' && PORTRAIT.actif; // prompt 215 : portrait ET paysage mobile (recomposés)
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
	if (TACHE.courante) return ouvrir('tache'), true; // tâche interrompue par une autre fenêtre : on la reprend
	const a = Taches.arbitrage(); // option du groupe (lot F), une fois par semaine
	if (a) return ouvrirTache(a), true;
	const suivante = TACHE.file.shift();
	if (suivante) return ouvrirTache(suivante), true;
	return false;
}
function ouvrirTache(tache, suite) {
	TACHE.courante = tache;
	TACHE.choix = [];
	TACHE.groupe = 0;
	TACHE.resultat = null;
	TACHE.bilan = null;
	TACHE.suite = suite || null;
	TACHE.premiere = !introTacheVue(tache.type);
	// Prompt 222 : un seul fait marquant → choisi d'office, on passe à la demande
	const unique = tache.type === 'rapport' && tache.donnees && tache.donnees.faits.length === 1 ? tache.donnees.faits[0] : null;
	if (unique) {
		TACHE.choix[0] = unique.id;
		TACHE.groupe = 1;
	}
	ouvrir('tache');
	Confort.Son.bip('dossier');
	annoncer(t(tache.type === 'rapport' ? 'tache.titre.recap' : 'tache.titre.' + tache.type) + '. ' + (TACHE.premiere ? t('tache.intro.' + tache.type) + ' ' : '') + (unique ? t('tache.rapport.faitUnique', { fait: unique.texte }) + ' ' : '') + t('tache.consigne.' + tache.type));
}
function fermerTache() {
	const tache = TACHE.courante;
	if (tache) marquerIntroTache(tache.type);
	TACHE.courante = null;
	TACHE.bilan = null;
	fermer();
	const suite = TACHE.suite;
	TACHE.suite = null;
	Sauvegarde.auto(false);
	if (suite) suite();
}

// ——— Fin de journée : rapport du soir avant le soir (appelée par terminerJournee) ; true = en attente ———
function tachesFinJournee() {
	if (fenetre === 'tache') return true;
	const rp = Taches.rapport();
	if (rp) return ouvrirTache({ type: 'rapport', donnees: rp }, terminerJournee), true;
	return false;
}

// ——— Choix ———
function basculerChoix(i) {
	const tache = TACHE.courante;
	if (!tache || TACHE.bilan) return; // prompt 222 : rapport envoyé, les choix sont figés
	if (tache.type === 'evenement' || tache.type === 'arbitrage') {
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
	if (TACHE.resultat) return fermerTache(); // écran de résultat : Entrée / Échap pour continuer
	if (tache.type === 'evenement' || tache.type === 'arbitrage') {
		if (!passer && !TACHE.choix[0]) return annoncer(t('tache.' + tache.type + '.incomplet'));
		const r = Taches.resoudre(tache, passer ? null : TACHE.choix[0]);
		if (passer || !r || r.ok === null) {
			annoncer(t('tache.passee'));
			return fermerTache();
		}
		TACHE.resultat = r;
		const txt = tache.type === 'arbitrage' ? t('tache.arbitrage.ok.' + TACHE.choix[0]) : t('tache.prep.ok', { nom: tache.nom, cout: Taches.R.prep.cout });
		annoncer(txt);
		Confort.Son.bip(r.ok === false ? 'alerte' : 'choix');
		return;
	}
	if (tache.type === 'rapport') {
		if (TACHE.bilan) return fermerTache(); // prompt 222 : bilan affiché → Entrée / Échap pour continuer
		if (!passer && (!TACHE.choix[0] || !TACHE.choix[1])) return annoncer(t('tache.rapport.incomplet'));
		const r = Taches.validerRapport(TACHE.choix[0] || null, passer ? null : TACHE.choix[1]);
		// Prompt 222 : le bilan du soir (§ 4) s'affiche dans la MÊME fenêtre, puis « Continuer » mène à la suite
		const j = Taches.jour(tache.donnees.date);
		marquerIntroTache('rapport');
		TACHE.bilan = { date: tache.donnees.date, rapport: r, recap: j.recap };
		TACHE.debutRecap = millis();
		Confort.Son.bip('choix');
		annoncer(t('tache.rapport.ok') + ' ' + texteDemande(r) + ' ' + texteAnnonceRecap(j.recap));
		return;
	}
	Confort.Son.bip('choix');
	fermerTache();
}
function texteDemande(r) {
	if (!r || !r.demande) return t('tache.rapport.sansDemande');
	return t('tache.rapport.enAttente'); // prompt 227 : la réponse du patron arrive le lendemain à 8 h, pas le soir même
}

// ——— Clavier ———
function toucheTaches() {
	if (fenetre !== 'tache') return false;
	const tache = TACHE.courante;
	if (!tache) return fermer(), true;
	if (['1', '2', '3', '4'].includes(key)) basculerChoix(Number(key) - 1);
	else if (keyCode === TAB) {
		if (tache.type === 'rapport' && !TACHE.bilan) {
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
	const l = DS.fenetre.large; // prompt 173 (était 1240)
	// Prompt 222 : en portrait, la fenêtre de fin de journée ne garde que les faits marquants (la suite est dessous)
	const h = enPortrait() ? (tache.type === 'rapport' ? Math.min(H - 20, 200 + tache.donnees.faits.length * (hb(56) + 8)) : H - 20) : 820;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	noStroke();
	fill(C.accent);
	rect(x, y, 12, h);
	dsTitre(t(tache.type === 'rapport' ? 'tache.titre.recap' : 'tache.titre.' + tache.type).toUpperCase(), x + 56, y + 40, 40, C.texte, 'left'); // prompt 222 : « Fin de journée »
	let yy = y + 104;
	textAlign(LEFT, TOP);
	if (tache.type === 'rapport') return fenetreFinJournee(tache, x, y, l, h);
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
	else if (tache.type === 'evenement') yy = corpsPreparation(tache, x + 56, yy, l - 112);
	else if (tache.type === 'arbitrage') yy = corpsArbitrage(tache, x + 56, yy, l - 112);
	// Pied : consigne clavier + boutons
	textFont(POLICE_DONNEES);
	textSize(18);
	textAlign(LEFT, TOP);
	fill(C.gris);
	const hp = hb(68);
	const yp = y + h - hp - 36;
	if (!enPortrait()) text(t(TACHE.resultat ? 'tache.consigne.resultat' : 'tache.consigne.' + tache.type), x + 56, yp, l - 112 - 560, 70);
	if (TACHE.resultat) return bouton(x + l - 56 - 260, yp, 260, hp, t('tache.continuer'), fermerTache);
	bouton(x + l - 56 - 260, yp, 260, hp, t('tache.valider'), () => validerTache(false));
	bouton(x + l - 56 - 260 - 276, yp, 260, hp, t('tache.passer'), () => validerTache(true), false, true);
}
/** Prompt 222 : « Fin de journée » — rapport du soir (fait marquant, demande) et bilan dans la même fenêtre.
 * Ordinateur : rapport à gauche, bilan à droite (avant l'envoi : l'introduction et ce que le bilan montrera).
 * Mobile : rapport, puis — une fois envoyé — le bilan à sa place (le fait retenu et la demande restent écrits). */
function fenetreFinJournee(tache, x, y, l, h) {
	const portrait = enPortrait();
	const x0 = x + 56;
	const lt = l - 112;
	const lg = portrait ? lt : 600; // colonne du rapport
	const xd = x0 + lg + 48; // colonne du bilan
	const ld = lt - lg - 48;
	let yy = y + 104;
	const sousTitre = (txt, xx, yv) => {
		textAlign(LEFT, TOP);
		textFont(POLICE_DONNEES);
		textStyle(BOLD);
		textSize(18);
		fill(C.accent);
		text(txt.toUpperCase(), xx, yv);
		textStyle(NORMAL);
	};
	sousTitre(t('tache.titre.rapport'), x0, yy);
	if (portrait) return finJourneeSuite(tache, x, y, l, h, sousTitre);
	corpsRapport(tache.donnees, x0, yy + 40, lg);
	{
		// Colonne du bilan : filet de séparation, puis le bilan (après l'envoi) ou ce qu'il contiendra
		noStroke();
		fill(DS.blanc15);
		rect(xd - 24, yy, 1, h - 104 - 180);
		sousTitre(t('tache.bilan'), xd, yy);
		if (TACHE.bilan) corpsRecap(TACHE.bilan, xd, yy + 40, ld, true);
		else {
			textAlign(LEFT, TOP);
			textFont(POLICE_TEXTE);
			textSize(20);
			textLeading(28);
			fill(C.texte);
			text(t('tache.intro.rapport') + '\n\n' + t('tache.exemple.rapport'), xd, yy + 40, ld, 260);
			fill(C.gris);
			text(t('tache.bilan.attente'), xd, yy + 320, ld, 120);
		}
	}
	// Pied : consigne clavier + boutons (après l'envoi : un seul bouton, « Continuer »)
	textFont(POLICE_DONNEES);
	textSize(18);
	textAlign(LEFT, TOP);
	fill(C.gris);
	const hp = hb(68);
	const yp = y + h - hp - 36;
	if (!portrait) text(t(TACHE.bilan ? 'tache.consigne.resultat' : 'tache.consigne.rapport'), x0, yp - 44, lt, 30); // au-dessus des boutons, sur toute la largeur
	if (TACHE.bilan) return bouton(x + l - 56 - 300, yp, 300, hp, t('tache.continuer'), fermerTache);
	bouton(x + l - 56 - 340, yp, 340, hp, t('tache.rapport.envoyer'), () => validerTache(false));
	bouton(x + l - 56 - 340 - 16 - 380, yp, 380, hp, t('tache.rapport.envoyerSans'), () => validerTache(true), false, true);
}
/** Prompt 222, mobile : la fenêtre (640 px) garde les faits marquants ; la suite — demande et boutons, ou le bilan et
 * « Continuer » une fois le rapport envoyé — est un second panneau, empilé dessous et défilable (suiteFenetre, prompt 209) */
function finJourneeSuite(tache, x, y, l, h, sousTitre) {
	corpsRapport(tache.donnees, x + 56, y + 144, l - 112, 0);
	const x2 = x + l + 40;
	const hp = hb(68);
	const h2 = TACHE.bilan ? 860 : 80 + 3 * (hb(56) + 8) + 60 + 2 * hp + 16 + 36;
	const y2 = (H - h2) / 2;
	panneau(x2, y2, l, h2, C.accent);
	suiteFenetre(x2, y2, l, h2);
	noStroke();
	fill(C.accent);
	rect(x2, y2, 12, h2);
	y = y2;
	h = h2;
	if (TACHE.bilan) {
		sousTitre(t('tache.bilan'), x2 + 56, y + 40);
		corpsRecap(TACHE.bilan, x2 + 56, y + 80, l - 112, true);
		return bouton(x2 + 56, y + h - 36 - hp, l - 112, hp, t('tache.continuer'), fermerTache);
	}
	corpsRapport(tache.donnees, x2 + 56, y + 40, l - 112, 1);
	bouton(x2 + 56, y + h - 36 - hp, l - 112, hp, t('tache.rapport.envoyer'), () => validerTache(false));
	bouton(x2 + 56, y + h - 36 - 2 * hp - 16, l - 112, hp, t('tache.rapport.envoyerSans'), () => validerTache(true), false, true);
}
function ligneInfo(txt, x, y, l) {
	textFont(POLICE_TEXTE);
	textSize(20);
	textLeading(26);
	fill(C.texte);
	text(txt, x, y, l, 56);
	return y + (textWidth(txt) > l ? 56 : 30);
}
function corpsRapport(rp, x, y, l, seul) {
	const groupe = (titre, liste, g, libelle) => {
		textAlign(LEFT, TOP); // bouton() laisse l'alignement centré
		textFont(POLICE_DONNEES);
		textStyle(BOLD);
		textSize(18);
		const actif = TACHE.groupe === g && !TACHE.bilan;
		fill(actif ? C.primaireTexte : C.gris);
		text(titre.toUpperCase() + (actif ? '  ◀' : ''), x, y);
		textStyle(NORMAL);
		y += 30;
		const cols = 1; // prompt 222 : une colonne (en portrait, deux colonnes coupaient les libellés)
		const lc = (l - (cols - 1) * 12) / cols;
		liste.forEach((o, i) => {
			const pris = TACHE.choix[g] === o.id;
			const fige = !!TACHE.bilan && !pris; // prompt 222 : rapport envoyé, les choix non retenus s'estompent
			bouton(x + (i % cols) * (lc + 12), y + Math.floor(i / cols) * (hb(56) + 8), lc, hb(56), i + 1 + '  ' + (pris ? '✓ ' : '') + court(libelle(o), Math.min(90, Math.floor(lc / (enPortrait() ? 13 : 11)))), () => ((TACHE.groupe = g), basculerChoix(i)), fige, !pris);
		});
		y += Math.ceil(liste.length / cols) * (hb(56) + 8);
		y += 10;
	};
	if (seul !== 1) groupe(t('tache.rapport.fait'), rp.faits, 0, (o) => o.texte);
	if (seul !== 0) groupe(t('tache.rapport.demande'), rp.demandes, 1, (o) => t('tache.demande.' + o.id, o.vars));
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
	const titre = tache.type === 'arbitrage' ? t('tache.arbitrage.ok.' + TACHE.choix[0]) : t('tache.prep.ok', { nom: tache.nom, cout: Taches.R.prep.cout });
	text(titre, x, y, l, 70);
	textStyle(NORMAL);
	y += 84;
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

// ——— Bilan du soir (§ 4) : expérience, badges, priorités, demande ; sans animation si réduites (prompt 222 : dans la fenêtre du rapport) ———
/** Prompt 222 : annonce du bilan (expérience, grade, badges) — le bilan s'affiche dans la fenêtre du rapport du soir */
function texteAnnonceRecap(recap) {
	const rc = recap || { xp: { total: 0, lignes: [] }, badges: [], grade: Taches.grade() };
	return t('recap.annonce', { xp: rc.xp.total, grade: t('grade.' + rc.grade.i) }) + (rc.badges.length ? ' ' + t('recap.badges', { liste: rc.badges.map((b) => t('badge.' + b)).join(', ') }) : '') + (rc.monte ? ' ' + t('recap.monte', { grade: t('grade.' + rc.grade.i) }) : '');
}
function corpsRecap(d, x, y, l, sansFait) {
	const rc = d.recap || { xp: { total: 0, lignes: [] }, badges: [], grade: Taches.grade() };
	const k = reduireAnimations ? 1 : constrain((millis() - TACHE.debutRecap) / 1200, 0, 1);
	// Prompt 222 : colonne étroite (à côté du rapport) → grade et barre sous l'XP
	const etroit = l < 700;
	const gx = etroit ? x : x + 260;
	const gl = etroit ? l : l - 260;
	const gy = etroit ? y + 56 : y;
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
	const ligneGrade = t('recap.grade', { grade: t('grade.' + g.i), xp: g.xp }) + (g.prochain !== null ? ' · ' + t('recap.prochain', { reste: g.prochain - g.xp, grade: t('grade.' + (g.i + 1)) }) : '');
	const hg = etroit && textWidth(ligneGrade) > gl ? 56 : 30;
	text(ligneGrade, gx, gy + 4, gl, hg);
	if (g.prochain !== null) {
		const bas = Taches.R.grades[g.i];
		fill(C.piste);
		rect(gx, gy + hg + 6, gl, 10);
		fill(C.primaireTrait); // barre de progression : couleur d'accent (prompt 176)
		rect(gx, gy + hg + 6, (gl * (g.xp - bas)) / (g.prochain - bas), 10);
	}
	if (rc.monte) {
		fill(C.accent);
		textStyle(BOLD);
		const opt = Jeu.taches && Jeu.taches.options && Jeu.taches.options.deblocages;
		text(t('recap.monte', { grade: t('grade.' + g.i) }) + (opt ? ' ' + t('deblocage.grade.' + g.i) : ''), gx, gy + hg + 20, gl, 30);
		textStyle(NORMAL);
	}
	y = gy + hg + 20 + (rc.monte ? 40 : 8);
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
		const lp = (p.etat === 'tenue' ? '✓ ' : p.etat === 'manquee' ? '✗ ' : '· ') + t('tache.prio.' + p.id, p.vars) + ' — ' + t('tache.etat.' + p.etat);
		const hp = textWidth(lp) > l ? 56 : 28; // prompt 222 : deux lignes en colonne étroite
		textLeading(26);
		text(lp, x, y, l, hp);
		y += hp + 2;
	});
	fill(C.texte);
	if (d.rapport) {
		if (!sansFait) {
			text(t('recap.fait', { fait: d.rapport.fait }), x, y + 4, l, 56);
			y += textWidth(t('recap.fait', { fait: d.rapport.fait })) > l ? 62 : 34;
		}
		// Prompt 227 : « Demande envoyée : le patron répondra demain à 8 h » passe à la ligne en colonne étroite
		y += dessinerTexte(texteDemande(d.rapport), x, y, l, { taille: 20, interligne: 26, couleur: C.gris, maxLignes: 3 }).h + 14;
	}
	const parRangee = Math.max(1, Math.floor((l + 20) / 280)); // prompt 222 : badges sur plusieurs rangées en colonne étroite
	rc.badges.forEach((b, i) => {
		const bx = x + (i % parRangee) * 280;
		const by = y + Math.floor(i / parRangee) * 56;
		dessinerBadge(b, bx, by, 44, true);
		fill(C.texte);
		textSize(18);
		text(t('badge.' + b), bx + 54, by + 10, 220, 30);
	});
	return y + Math.max(1, Math.ceil(rc.badges.length / parRangee)) * 56;
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

// ——— Lot F : options soumises au groupe (Paramètres → section « Avancé », parametres.js), désactivées par défaut ———
const OPTIONS_JEU = ['chaines', 'deblocages', 'arbitrage', 'deVisible', 'eclairageJauges', 'npd', 'deblocageApplis', 'toutDebloque', 'somnolence', 'somnolenceNecessaire']; // prompt 228 : somnolence et sieste, désactivées par défaut // prompt 89 bis : 4 options (§ 6) ; prompt 90 : Ne pas déranger ; prompt 91 : § 7
let confirmerRemiseCarriere = 0;
function basculerOptionJeu(nom) {
	Confort.Reglages.basculer(nom);
	annoncer(t('optjeu.' + nom) + ' : ' + t(Confort.Reglages[nom] ? 'commun.active' : 'commun.desactive') + (OPTIONS_JEU.indexOf(nom) < 3 ? '. ' + t('optjeu.prochaine') : '.'));
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
