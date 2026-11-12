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
	NOTIFS.vus = null;
	NOTIFS.nonVues = { signalements: 0, patron: 0, community: 0 }; // prompt 111 : compteurs des badges remis à zéro
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
// Prompt 111 : plus de cartes de notification à l'écran (elles coupaient la lecture d'un dossier). notifier() reste la
// source unique : il garde l'historique (NOTIFS.liste), annonce aux lecteurs d'écran (aria-live poli) et incrémente le
// compteur de l'appli, affiché en badge rouge chiffré dans le menu à gauche (menu-app.js) et, vu du bureau, sur l'écran du PC.
const NOTIFS = { liste: [], vus: null, nonVues: { signalements: 0, patron: 0, community: 0 } };
/** L'appli de la notification est déjà sous les yeux du joueur : rien à compter */
const appliSousLesYeux = (cle) => typeof vue !== 'undefined' && vue === 'poste' && typeof entreeActive === 'function' && entreeActive() === cle && (PC.etat === 'appli' || PC.etat === 'os');
function notifier(n) {
	NOTIFS.liste.push(Object.assign({ t: millis() }, n));
	if (NOTIFS.liste.length > 8) NOTIFS.liste.shift();
	if (n.icone && NOTIFS.nonVues[n.icone] !== undefined && !appliSousLesYeux(n.icone)) NOTIFS.nonVues[n.icone]++;
	annoncer(n.titre + ' : ' + n.extrait);
}
/** Nombre affiché dans le badge d'une appli (0 = pas de badge) */
function nombreBadge(cle) {
	if (typeof appliDebloquee === 'function' && cle !== 'signalements' && !appliDebloquee(cle)) return 0; // prompt 91 : rien sur une appli verrouillée
	const nl = Jeu.nonLus || {};
	if (cle === 'signalements') return NOTIFS.nonVues.signalements;
	if (cle === 'patron') return typeof mailsNonLus === 'function' ? mailsNonLus() : nl.patron || 0; // prompt 185 : total des mails non lus (lus à l'ouverture dans le volet de lecture)
	if (cle === 'community') {
		const attente = (Jeu.plaintes || []).filter((p) => p.reponse === null && !p.expiree && !p.transmise).length;
		return Math.max(nl.community || 0, attente); // une plainte nouvelle compte déjà dans nonLus : le max évite le double compte
	}
	return 0;
}
const texteBadge = (n) => (n > 9 ? '9+' : n ? String(n) : '');
/** Total des badges (écran du PC vu du bureau) */
const totalBadges = () => ['signalements', 'patron', 'community'].reduce((s, k) => s + nombreBadge(k), 0);
/** Remise à zéro quand l'appli devient visible */
function marquerVue(cle) {
	if (NOTIFS.nonVues[cle] !== undefined) NOTIFS.nonVues[cle] = 0;
	if (Jeu.nonLus && Jeu.nonLus[cle] !== undefined) Jeu.nonLus[cle] = 0;
}
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
		notifier({ titre: t(c && c.retour ? 'notif.retour' : 'notif.community'), extrait: extrait(c && (c.texte !== undefined ? (c.auteur ? c.auteur + ' : ' : '') + c.texte : c), 70), icone: 'community', action: () => ouvrirAppliNotif('community') });
		if (c && c.retour) annoncer(t('annonce.retour', { auteur: String(c.auteur), texte: String(c.texte) })); // prompt 121 : le signalement est terminé
	}
	if (nb.plaintes > V.plaintes) {
		const p = Jeu.plaintes[nb.plaintes - 1];
		notifier({ titre: t('notif.plainte'), extrait: extrait(p && p.def ? Jeu.textePlainte(p) : '', 70), icone: 'community', action: () => ouvrirAppliNotif('community') });
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
// Prompt 111 : dessinerNotificationBarre (prompt 80) et dessinerNotifications (prompt 77) supprimées — les badges
// rouges du menu à gauche les remplacent.
/** Prompt 111 : vue bureau (PC « fermé ») — un seul badge rouge, le total, au coin haut droit de l'écran du PC.
 * Apparition simple, sans clignotement (même rendu si les animations sont réduites). */
function badgeEcranBureau() {
	if (ecran !== 'jeu' || !Jeu.paquet || typeof rectEcranCourant !== 'function') return;
	const n = totalBadges();
	if (!n) return;
	const r = rectEcranCourant();
	dsBadge(r.x + r.l - 26, r.y + 26, texteBadge(n), 'erreur');
}
