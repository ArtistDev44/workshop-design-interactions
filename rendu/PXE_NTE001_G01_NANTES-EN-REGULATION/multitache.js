/* Nantes en régulation — prompt 77 : plusieurs tâches en même temps, et des notifications sur le bureau.
 * - Jusqu'à 3 signalements ACTIFS en parallèle (pris dans la liste) ; chacun a son propre compteur (même durée que
 *   le compteur de la semaine), son enquête, sa source retenue et sa phase (conflit, contradiction, décision).
 *   Le signalement sélectionné est en tête du paquet (Jeu.dossierCourant) : game.js décide toujours « le dossier
 *   courant », avec les mêmes règles, effets et dés ; seul l'ordre de traitement change.
 * - Les autres compteurs continuent de tourner ; à 0, la règle « non traité » (Q25, malus du prompt 23)
 *   s'applique à CE signalement seul, en arrière-plan ; les autres continuent. En file, un signalement non pris
 *   expire toujours après 2 × le compteur (prompt 68), quelle que soit la phase.
 * - Notifications style bureau (haut droite de l'écran du PC, ou de la vue bureau) : arrivée d'un signalement,
 *   mail du patron, commentaire Community, fin d'intervention d'équipe. Titre + extrait réels + icône de l'appli ;
 *   clic → ouvre l'appli ou sélectionne le signalement ; 6 s, 3 visibles au plus, aria-live, sans animation si
 *   les animations sont réduites.
 * Sauvegarde : seul le signalement sélectionné garde son compteur ; à la reprise, les autres actifs reviennent
 * dans la file (leur expiration repart de la reprise).
 */
const MULTI = { actifs: [], MAX: 3, paquet: null };
const PHASES_ACTIVES = ['decision', 'contradiction', 'conflit'];

function multiReset() {
	if (MULTI.paquet === Jeu.paquet) return;
	MULTI.paquet = Jeu.paquet;
	MULTI.actifs = [];
	MULTI.MAX = Jeu.defiChrono ? 3 : Jeu.difficulte().actifs; // prompt 87 : 3 / 2 / 1 selon la difficulté, sans chrono
	NOTIFS.vus = null; // les notifications déjà affichées s'effacent seules (6 s)
}
const actifDe = (d) => MULTI.actifs.find((a) => a.d === d) || null;
/** Signalement actif affiché (en tête du paquet pendant une phase de dossier), sinon null */
function actifSelectionne() {
	multiReset();
	return ecran === 'jeu' && PHASES_ACTIVES.includes(phase) ? actifDe(Jeu.dossierCourant()) : null;
}
/** Copie l'état affiché (variables globales de sketch.js) dans la fiche du signalement sélectionné */
function sauverActif() {
	const a = actifSelectionne();
	if (a) Object.assign(a, { phase, debut: debutCompteur, arrivee: arriveeDossier, source: sourceChoisie, alerte: alerteTempsJouee, facteur: facteurDuree });
}
/** Met le signalement a en tête et restaure son état d'affichage */
function restaurerActif(a) {
	amenerEnTete(Jeu.paquet.indexOf(a.d));
	phase = a.phase;
	debutCompteur = a.debut;
	arriveeDossier = a.arrivee;
	sourceChoisie = a.source;
	alerteTempsJouee = a.alerte;
	facteurDuree = a.facteur;
}
const dureeActif = (a) => compteurSemaine() * a.facteur * facteurLecture();
/** Millisecondes restantes au compteur du signalement actif a */
function resteActif(a) {
	const sel = actifSelectionne() === a;
	return (sel ? compteurSemaine() * facteurDuree * facteurLecture() : dureeActif(a)) - (millis() - (sel ? debutCompteur : a.debut));
}
function retirerActif(d) {
	MULTI.actifs = MULTI.actifs.filter((a) => a.d !== d);
}

/** Prendre le signalement de rang r dans la file : nouvel actif (3 au plus), ou bascule vers un actif existant */
function prendreSignalement(r) {
	multiReset();
	const it = fileIncidents()[r];
	if (!it || !(phase === 'selection' || PHASES_ACTIVES.includes(phase))) return;
	const deja = actifDe(it.d);
	if (deja) return selectionnerActif(deja);
	if (MULTI.actifs.length >= MULTI.MAX) {
		SELECTION.message = { texte: t('multi.max', { n: MULTI.MAX }), ok: false, t: millis() };
		annoncer(t('multi.max', { n: MULTI.MAX }));
		Confort.Son.bip('alerte');
		return;
	}
	sauverActif();
	amenerEnTete(it.index);
	SELECTION.focus = 0;
	interaction();
	nouveauDossier(); // le compteur de CE signalement démarre (conflit, contradiction ou décision)
	MULTI.actifs.push({ d: Jeu.dossierCourant(), phase, debut: debutCompteur, arrivee: arriveeDossier, source: sourceChoisie, alerte: alerteTempsJouee, facteur: facteurDuree });
}
function selectionnerActif(a) {
	if (!a || actifSelectionne() === a) return;
	sauverActif();
	restaurerActif(a);
	Confort.Son.clic();
	annoncer(Jeu.defiChrono ? t('multi.selection', { quoi: t('enq.signalement.' + a.d.type), s: Math.max(0, Math.ceil(resteActif(a) / 1000)) }) : t('multi.selectionSans', { quoi: t('enq.signalement.' + a.d.type) })); // prompt 87
}
/** Tab (2 actifs ou plus) : passe au signalement actif suivant ; true si la touche est prise */
function toucheMultitache() {
	if (keyCode !== TAB || MULTI.actifs.length < 2 || !actifSelectionne()) return false;
	const i = MULTI.actifs.indexOf(actifSelectionne());
	const n = MULTI.actifs.length;
	selectionnerActif(MULTI.actifs[(i + (keyIsDown(SHIFT) ? n - 1 : 1)) % n]);
	return true;
}
/** Conflit A / B (Q27) tranché : la tête du paquet a pu changer — la fiche suit le dossier désormais en tête */
function apresChoixPriorite(ancien) {
	const tete = Jeu.dossierCourant();
	if (tete === ancien) return;
	const rA = actifDe(ancien);
	const rB = actifDe(tete);
	const i = Jeu.index;
	const a = SELECTION.arrivees[i];
	SELECTION.arrivees[i] = SELECTION.arrivees[i + 1]; // les heures d'arrivée suivent les dossiers échangés
	SELECTION.arrivees[i + 1] = a;
	if (rB) restaurerActif(rB); // l'autre était déjà actif : on reprend son propre compteur
	else if (rA) rA.d = tete; // sinon le compteur qui vient de démarrer passe au dossier choisi ; l'autre retourne en file
}
/** Après la narration : on reprend le signalement actif le plus urgent ; true si un actif a été repris */
function reprendreActif() {
	multiReset();
	if (!MULTI.actifs.length) return false;
	const a = MULTI.actifs.slice().sort((x, y) => resteActif(x) - resteActif(y))[0];
	restaurerActif(a);
	return true;
}

/** Règle « non traité » (Q25) appliquée à un signalement en arrière-plan (actif non sélectionné, ou en file) */
function expirerEnFond(d, enFile) {
	const sel = actifSelectionne();
	sauverActif();
	amenerEnTete(Jeu.paquet.indexOf(d));
	if (enFile && Jeu.declencherPlainte) Jeu.declencherPlainte(Jeu.index); // comme une prise suivie d'un compteur à 0
	const r = Jeu.decider('temps');
	retirerActif(d);
	if (sel && sel.d !== d) restaurerActif(sel);
	if (!r) return;
	if (typeof siesteExpiration === 'function') siesteExpiration(r); // prompt 78 : pendant la sieste, malus fixe de sieste en plus (réponse trop tard)
	r.sources = 0;
	Confort.Son.bip('consequence');
	annoncer(t(enFile ? 'carte.expire' : 'multi.expire', { quoi: t('enq.signalement.' + d.type) }));
	notifier({ titre: t('notif.expire'), extrait: t('enq.signalement.' + d.type) + (d.lignes && d.lignes.length ? ' · ' + d.lignes.join(', ') : ''), icone: 'signalements', action: ouvrirSignalements });
	if (typeof verifierSerie === 'function') verifierSerie();
	if (phase === 'selection' && !fileIncidents().length) phase = 'attente';
	Sauvegarde.auto(false);
}

/** Une fois par image : arrivées (notifications), compteurs en arrière-plan, expirations en file */
function majMultitache() {
	if (ecran !== 'jeu' || !Jeu.paquet || ['fin', 'mail', 'soir', 'reveil'].includes(phase) || enPause) return;
	multiReset();
	fileIncidents(); // détecte les arrivées (notification à la première apparition)
	if (!Jeu.defiChrono) return; // prompt 87 : sans chrono, aucune expiration en cours de journée (fin de journée : immersion.js)
	// Le signalement sélectionné : compteur à 0 même si l'appli n'est pas affichée
	const s = actifSelectionne();
	if (s && (phase === 'decision' || phase === 'contradiction') && resteActif(s) <= 0) {
		phase = 'decision';
		decider('temps');
		Confort.Son.bip('consequence');
		return;
	}
	const fond = MULTI.actifs.find((a) => a !== s && resteActif(a) <= 0);
	if (fond) return expirerEnFond(fond.d, false);
	const enFile = fileIncidents().find((it) => !actifDe(it.d) && resteAvantExpiration(it) <= 0);
	if (enFile) expirerEnFond(enFile.d, true);
}

// =====================================================================
// Notifications style bureau
// =====================================================================
const NOTIFS = { liste: [], vus: null, DUREE: 6000, MAX: 3 };
function notifier(n) {
	NOTIFS.liste.push(Object.assign({ t: millis() }, n));
	if (NOTIFS.liste.length > 8) NOTIFS.liste.shift();
	annoncer(n.titre + ' : ' + n.extrait);
}
const notifsVisibles = () => NOTIFS.liste.filter((n) => millis() - n.t < NOTIFS.DUREE && (!n.icone || typeof appliDebloquee !== 'function' || appliDebloquee(n.icone))).slice(-NOTIFS.MAX); // prompt 91 § 2 : applis débloquées seulement
/** Appelé par fileIncidents à la première apparition d'un signalement dans la liste */
function notifierArrivee(d, i) {
	if (ecran !== 'jeu') return;
	if (typeof siesteArrivee === 'function') siesteArrivee(); // prompt 78 : bilan de la sieste
	notifier({ titre: t('notif.signalement'), extrait: t('enq.signalement.' + d.type) + ' · ' + t('gravite.' + Jeu.gravite(d)) + (dossierConnu(i) && d.lignes && d.lignes.length ? ' · ' + d.lignes.join(', ') : ''), icone: 'signalements', action: () => ouvrirSignalements(d) });
}
const extrait = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1).trim() + '…' : String(s));
/** Nouveaux mails du patron, commentaires Community, fins d'intervention : détectés sur l'état réel de la partie */
function majNotifications() {
	if (ecran !== 'jeu' || !Jeu.paquet) return;
	multiReset();
	const nb = { patron: (Jeu.messagesPatron || []).length, commentaires: (Jeu.commentaires || []).length, plaintes: (Jeu.plaintes || []).length };
	if (!NOTIFS.vus) NOTIFS.vus = { patron: nb.patron, commentaires: nb.commentaires, plaintes: nb.plaintes, equipes: new Map() };
	const V = NOTIFS.vus;
	if (nb.patron > V.patron) {
		const m = Jeu.messagesPatron[nb.patron - 1];
		notifier({ titre: t('notif.patron'), extrait: extrait(m && (m.texte !== undefined ? m.texte : m), 70), icone: 'patron', action: () => ouvrirAppliNotif('patron') });
	}
	if (nb.commentaires > V.commentaires) {
		const c = Jeu.commentaires[nb.commentaires - 1];
		notifier({ titre: t('notif.community'), extrait: extrait(c && (c.texte !== undefined ? (c.auteur ? c.auteur + ' : ' : '') + c.texte : c), 70), icone: 'community', action: () => ouvrirAppliNotif('community') });
	}
	if (nb.plaintes > V.plaintes) {
		const p = Jeu.plaintes[nb.plaintes - 1];
		notifier({ titre: t('notif.plainte'), extrait: extrait(p && p.def ? Jeu.texteMessage(p.def.texte, p.vars) : '', 70), icone: 'community', action: () => ouvrirAppliNotif('community') });
	}
	Object.assign(V, nb);
	// Fin d'intervention : passage « sur place » → « retour » observé pendant la partie
	const m = (typeof tempsEquipes === 'function' ? tempsEquipes() : millis()); // prompt 95
	(Jeu.equipes || []).forEach((q) => {
		if (q.inutile) return;
		const ph = Jeu.phaseEquipe(q, m);
		const avant = V.equipes.get(q);
		V.equipes.set(q, ph);
		if (avant === 'place' && ph === 'retour') notifier({ titre: t('notif.equipe', { nom: String(q.nom) }), extrait: String(q.sujet || ''), icone: 'signalements', action: () => ouvrirSignalements() });
	});
}
/** Clic sur une notification de signalement : au poste, appli ouverte, signalement sélectionné (ou focalisé en file) */
function ouvrirSignalements(d) {
	if (vue === 'bureau') sAsseoir();
	if (PC.etat === 'os' || PC.etat === 'appli') {
		PC.fenetre = null;
		PC.etat = 'appli';
	}
	if (!d) return;
	const a = actifDe(d);
	if (a) return selectionnerActif(a);
	const r = fileIncidents().findIndex((it) => it.d === d);
	if (r >= 0) SELECTION.focus = r;
}
function ouvrirAppliNotif(cle) {
	if (vue === 'bureau') sAsseoir();
	const i = ICONES_OS.findIndex((x) => x.cle === cle);
	if (i < 0 || (PC.etat !== 'os' && PC.etat !== 'appli')) return;
	if (PC.fenetre !== cle) ouvrirIconeOS(i);
}
/** Prompt 80 : la dernière notification en une ligne, dans la barre des tâches (entre les icônes et les jauges) */
function dessinerNotificationBarre() {
	const liste = notifsVisibles();
	if (!liste.length) return;
	const n = liste[liste.length - 1];
	const x = 760;
	const l = 500; // s'arrête avant les jauges de la barre des tâches
	const y = H - BARRE_OS + 10;
	const h = BARRE_OS - 20;
	noStroke();
	fill(DS.blanc15);
	rect(x, y, l, h);
	fill(n.icone === 'patron' ? DS.primaire : n.icone === 'community' ? DS.info : DS.alerte);
	rect(x, y, 6, h);
	const ic = ICONES_OS.find((c) => c.cle === n.icone);
	if (ic) ic.dessin(x + 14, y + 6, 0.65);
	const txt = n.titre + ' · ' + n.extrait;
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(18);
	textAlign(LEFT, CENTER);
	fill(DS.blanc);
	const place = l - 86 - (liste.length > 1 ? 48 : 0);
	let court = txt;
	while (court.length > 8 && textWidth(court) > place) court = court.slice(0, -2);
	text(court === txt ? txt : court.trim() + '…', x + 78, y + h / 2);
	textStyle(NORMAL);
	if (liste.length > 1) {
		textAlign(RIGHT, CENTER);
		fill(DS.alerte);
		text(t('notif.autres', { n: liste.length - 1 }), x + l - 10, y + h / 2);
	}
	textAlign(LEFT, TOP);
	boutons.push({ x, y, l, h, action: () => ((n.t = -Infinity), n.action && n.action()) });
}
/** Pile de notifications en haut à droite de la zone (x0 = bord droit), dans l'espace de dessin courant */
function dessinerNotifications(xDroite, y0, echelle) {
	const liste = notifsVisibles();
	if (!liste.length) return;
	const k = echelle || 1;
	const l = 460 * k;
	const h = 96 * k;
	liste
		.slice()
		.reverse()
		.forEach((n, i) => {
			const age = millis() - n.t;
			const glisse = reduireAnimations ? 0 : Math.max(0, 1 - age / 250) * 40 * k; // entrée douce, absente si animations réduites
			const x = xDroite - l - 16 * k + glisse;
			const y = y0 + i * (h + 10 * k);
			noStroke();
			fill(0, 0, 0, 120);
			rect(x + 6 * k, y + 8 * k, l, h);
			fill(DS.fond);
			stroke(DS.blanc15);
			strokeWeight(2);
			rect(x, y, l, h);
			noStroke();
			zoneTexteDeclarer('notification', x, y, l, h); // prompt 93
			fill(n.icone === 'patron' ? DS.primaire : n.icone === 'community' ? DS.info : DS.alerte);
			rect(x, y, 6 * k, h);
			const ic = ICONES_OS.find((c) => c.cle === n.icone);
			if (ic) ic.dessin(x + 18 * k, y + 16 * k, 0.8 * k);
			textAlign(LEFT, TOP);
			textFont(POLICE_TEXTE);
			textStyle(BOLD);
			textSize(20 * k);
			fill(DS.blanc);
			text(extrait(n.titre, 30), x + 100 * k, y + 14 * k, l - 116 * k, 26 * k);
			textStyle(NORMAL);
			textSize(17 * k);
			textLeading(21 * k);
			fill(DS.blanc75);
			text(n.extrait, x + 100 * k, y + 44 * k, l - 116 * k, 44 * k);
			boutons.push({ x, y, l, h, action: () => ((n.t = -Infinity), n.action && n.action()) });
		});
}
