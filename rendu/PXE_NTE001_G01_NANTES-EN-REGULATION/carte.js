/* Nantes en régulation — prompt 68, refondu au prompt 73 : l'appli « Signalements » est l'écran de jeu unique.
 * - Les incidents arrivent comme des SIGNALEMENTS dans une FILE (liste à gauche de l'écran de jeu) ; le compteur ne
 *   démarre qu'à la prise (clic ou Entrée sur un signalement de la file). En file, chaque incident expire après
 *   2 × le compteur de la semaine : il est alors réglé par la règle « non traité » (Q25, malus du prompt 23).
 * - Prompt 73 : plus de carte géographique (les sources ne donnent aucune géométrie de ligne : la position était
 *   arbitraire). Chaque signalement montre heure, type, ligne(s) (numéro + nom réel, une fois identifiées par la
 *   source « Lignes », prompt 50), gravité calculée et expiration ; les équipes s'affichent en texte (en route /
 *   sur place / retour, temps restant).
 * - Panneau incident : gravité calculée, onglets Enquête (sources, prompt 50) / Historique de la ligne.
 * - Équipes limitées (game.js) ; raccourcis Maj + 1/2/3/4 (police, ambulanciers, techniciens, pompiers).
 * Données réelles uniquement ; absent → « non renseigné ».
 */
const SELECTION = { depuis: 0, paquet: null, arrivees: {}, onglet: 'enquete', message: null, surbrillance: null, legendeRepliee: false, focus: 0 };
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
	}
	const f = [];
	for (let i = Jeu.index; i < Jeu.paquet.length; i++) {
		const d = Jeu.paquet[i];
		if (d.date !== j.date) break;
		if (d.minute > Jeu.horloge.minutes) break;
		if (!SELECTION.arrivees[i]) {
			SELECTION.arrivees[i] = millis(); // première apparition dans la liste
			if (typeof notifierArrivee === 'function') notifierArrivee(d, i); // prompt 77 : notification style bureau
		}
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
	// Prompt 77 : un signalement resté trop longtemps en file expire en arrière-plan (majMultitache, multitache.js)
}

function couleurGravite(g) {
	return g === 'elevee' ? C.rougeFonce : g === 'moyenne' ? C.orange : C.gris; // prompt 133 : « élevée » en rouge franc (C.rouge, rose pâle, était moins visible que l'orange)
}

// ——— Onglets du panneau incident (dessinés par enquete.js au-dessus des sources) ———
const ONGLETS_INCIDENT = ['enquete', 'historique']; // prompt 102 : les équipes sont sur le plateau de la carte (plus d'onglet en double)
function dessinerOngletsIncident(x, y, l) {
	const lb = (l - (ONGLETS_INCIDENT.length - 1) * 10) / ONGLETS_INCIDENT.length;
	ONGLETS_INCIDENT.forEach((o, i) => bouton(x + i * (lb + 10), y, lb, 52, t('carte.onglet.' + o), () => (SELECTION.onglet = o), false, SELECTION.onglet !== o));
	textAlign(LEFT, TOP);
}
/** Historique de la ligne dans la semaine (calcul sur Jeu.evenementsJournee) */
function dessinerHistoriqueLigne(d, x, y, l, h) {
	const e = enqueteDossier();
	const lignes = [];
	if (!(d.lignes && d.lignes.length)) lignes.push(t('carte.histo.sansLigne'));
	else if (!e.revele.lignes) lignes.push(t('carte.histo.consulter'));
	else {
		const passes = (Jeu.evenementsJournee || []).filter((x) => x.resultat && (x.resultat.dossier.lignes || []).some((n) => d.lignes.includes(n)));
		lignes.push(t('carte.histo.nb', { n: passes.length, lignes: d.lignes.join(', ') }));
		const der = passes[passes.length - 1];
		if (der) lignes.push(t('carte.histo.derniere', { date: der.jour.split('-').reverse().join('/'), action: der.action ? String(der.action) : t('journal.aucuneAction'), eval: t('eval.' + Jeu.evaluer(der)) }));
		d.lignes.forEach((n) => {
			if (Jeu.aggravationLignes && Jeu.aggravationLignes[n]) lignes.push(t('carte.histo.aggravation', { nom: n, plus: Jeu.aggravationLignes[n] })); // prompt 79
			const ln = Jeu.lignes && Jeu.lignes.lignes.find((x) => x.nom === n);
			lignes.push(t('carte.histo.ligne', { nom: n, mode: ln && TRADUCTIONS.fr['mode.' + ln.type] !== undefined ? t('mode.' + ln.type) : t('carte.nonRenseigne') }));
		});
	}
	// Prompt 92 : composant de texte partagé — vrai retour à la ligne, « … » en fin de mot si la zone est pleine
	let yy = y + 4;
	lignes.forEach((ln, i) => {
		const reste = y + h - yy;
		if (reste < 31) return;
		yy += dessinerTexte(ln, x, yy, l, { taille: i ? 20 : 22, couleur: C.texte, style: i ? NORMAL : BOLD, maxLignes: Math.max(1, Math.floor(reste / (i ? 28 : 31))), interligne: i ? 28 : 31 }).h + 8;
	});
}
function envoyerEquipeIncident(cle) {
	if (!['decision', 'contradiction', 'conflit', 'narration', 'selection'].includes(phase)) return;
	const index = phase === 'narration' && dernierResultat ? Jeu.paquet.indexOf(dernierResultat.dossier) : Jeu.index; // prompt 77 : d'autres dossiers ont pu être réglés entre-temps
	const r = Jeu.envoyerEquipe(index, cle, (typeof tempsEquipes === 'function' ? tempsEquipes() : millis())); // prompt 95
	SELECTION.message = { texte: r.message, ok: r.ok, t: millis() };
	annoncer(String(r.message));
	if (r.refus) Confort.Son.bip('alerte');
	else Confort.Son.clic();
	if (r.refus && !Jeu.equipesDisponibles(cle, (typeof tempsEquipes === 'function' ? tempsEquipes() : millis()))) Jeu.messagePatron(T('patron.plusEquipe', { nom: Jeu.EQUIPES[cle].nom, s: Jeu.retourEquipe(cle, (typeof tempsEquipes === 'function' ? tempsEquipes() : millis())) }), 'equipes', { cle, dispo: 0 });
}
/** Raccourcis Maj + 1/2/3/4 (keyCode 49–52 : indépendant AZERTY / QWERTY) ; true si la touche est prise */
function toucheEquipes() {
	if (!keyIsDown(SHIFT) || keyCode < 49 || keyCode > 52) return false;
	envoyerEquipeIncident(Jeu.TYPES_EQUIPES[keyCode - 49]);
	return true;
}

// ——— Prompt 73 : plus de carte — la file des signalements, les lignes concernées et l'état des équipes en texte ———
/** Amène le dossier k (arrivé, en file) en tête du paquet pour le traiter : seul l'ordre de traitement change,
 * les index mémorisés (arrivées, équipes) suivent le déplacement ; règles et tirages inchangés. */
function amenerEnTete(k) {
	const i = Jeu.index;
	if (k === i || k < i || k >= Jeu.paquet.length) return;
	const [d] = Jeu.paquet.splice(k, 1);
	Jeu.paquet.splice(i, 0, d);
	const remap = (j) => (j === k ? i : j >= i && j < k ? j + 1 : j);
	const arr = {};
	Object.keys(SELECTION.arrivees).forEach((j) => (arr[remap(Number(j))] = SELECTION.arrivees[j]));
	SELECTION.arrivees = arr;
	(Jeu.equipes || []).forEach((q) => (q.index = remap(q.index)));
}
/** Clavier de la file (phase sélection) : ↑ ↓ choisissent, Entrée prend ; true si la touche est prise */
function toucheFileSignalements() {
	if (phase !== 'selection') return false;
	const n = fileIncidents().length;
	if (!n) return false;
	if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
		SELECTION.focus = (SELECTION.focus + (keyCode === UP_ARROW ? n - 1 : 1)) % n;
		const it = fileIncidents()[SELECTION.focus];
		annoncer(Jeu.formaterHeure(it.d.minute) + ' · ' + t('enq.signalement.' + it.d.type) + ' · ' + t('carte.gravite', { g: t('gravite.' + Jeu.gravite(it.d)) }));
		return true;
	}
	if (keyCode === ENTER || keyCode === RETURN || key === ' ') return prendreSignalement(SELECTION.focus), true;
	return false;
}
/** Équipes en texte : disponibilités et état des équipes engagées (en route / sur place / retour, temps restant) */
