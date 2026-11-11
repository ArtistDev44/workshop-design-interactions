/* Nantes en régulation — prompt 68, refondu au prompt 73 : l'appli « Signalements » est l'écran de jeu unique.
 * - Les incidents arrivent comme des SIGNALEMENTS dans une FILE (liste à gauche de l'écran de jeu) ; le compteur ne
 *   démarre qu'à la prise (clic ou Entrée sur un signalement de la file). En file, chaque incident expire après
 *   2 × le compteur de la semaine : il est alors réglé par la règle « non traité » (Q25, malus du prompt 23).
 * - Prompt 73 : plus de carte géographique (les sources ne donnent aucune géométrie de ligne : la position était
 *   arbitraire). Chaque signalement montre heure, type, ligne(s) (numéro + nom réel, une fois identifiées par la
 *   source « Lignes », prompt 50), gravité calculée et expiration ; les équipes s'affichent en texte (en route /
 *   sur place / retour, temps restant).
 * - Panneau incident : gravité calculée, onglets Enquête (sources, prompt 50) / Historique de la ligne / Équipes.
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
/** Prompt 87 : état d'un signalement en file — « expire dans » en défi chrono, sinon « s'aggrave ↑ » ou « en attente » */
function etatFile(it) {
	if (Jeu.defiChrono) return t('carte.expireDans', { s: Math.ceil(resteAvantExpiration(it) / 1000) });
	const re = Jeu.retardEffectif(it.d);
	return re !== null && it.d.retard !== null && it.d.retard !== undefined && re > it.d.retard ? t('carte.aggrave', { effectif: re }) : t('carte.enAttente');
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
/** Prendre le signalement focalisé de la file (Entrée, guide) — prompt 77 : prendreSignalement (multitache.js) */

// ——— Panneau de droite pendant la sélection : le signalement choisi dans la file (liste à gauche, prompt 73) ———
function dessinerSelection() {
	const base = Object.assign({}, PANNEAU);
	panneau(base.x, base.y, base.l, base.h, C.orange);
	const f = fileIncidents();
	const it = f[SELECTION.focus] || f[0];
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(C.orange);
	text(t('carte.nouveau', { n: f.length }), base.x + 32, base.y + 26);
	if (!it) return;
	const d = it.d;
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
	text(etatFile(it), base.x + 32, base.y + 150);
	textFont(POLICE_TEXTE);
	textSize(19);
	fill(C.texte);
	text(texteLignes(d, it.index), base.x + 32, base.y + 184, base.l - 64, 56);
	bouton(base.x + 32, base.y + 250, base.l - 64, 76, t('carte.prendre'), () => prendreSignalement(f.indexOf(it)));
	textAlign(LEFT, TOP);
	cibleGuide('actions', base.x + 32, base.y + 250, base.l - 64, 76);
	textFont(POLICE_TEXTE);
	textSize(19);
	textLeading(27);
	fill(C.gris);
	text(t(f.length > 1 ? 'sig.choisir' : 'sig.seul'), base.x + 32, base.y + 356, base.l - 64, 120);
}
function couleurGravite(g) {
	return g === 'elevee' ? C.rouge : g === 'moyenne' ? C.orange : C.gris;
}

// ——— Onglets du panneau incident (dessinés par enquete.js au-dessus des sources) ———
const ONGLETS_INCIDENT = ['enquete', 'historique', 'equipes'];
function dessinerOngletsIncident(x, y, l) {
	const lb = (l - 2 * 10) / 3;
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
/** Équipes : disponibilité, pertinence (indication, pas une recommandation d'action de régulation), envoi */
function dessinerEquipesIncident(d, x, y, l, h) {
	if (!Jeu.elementDebloque('equipes')) {
		textFont(POLICE_TEXTE);
		textSize(20);
		fill(C.gris);
		text(t('histoire.verrou.equipes'), x, y, l, 80);
		return;
	}
	const pert = Jeu.equipesPertinentes(d);
	const m = (typeof tempsEquipes === 'function' ? tempsEquipes() : millis()); // prompt 95 : temps de jeu
	// Prompt 92 : hauteur des rangées tirée de la zone (rien ne déborde sur le conseil) ; une ligne si la place manque
	const msg = SELECTION.message && millis() - SELECTION.message.t < 5000; // message affiché 5 s réelles
	const rang = Math.min(78, Math.floor(((h || 330) - (msg ? 52 : 0)) / Jeu.TYPES_EQUIPES.length));
	const compact = rang < 70;
	Jeu.TYPES_EQUIPES.forEach((cle, i) => {
		const q = Jeu.EQUIPES[cle];
		const yy = y + i * rang;
		const dispo = Jeu.equipesDisponibles(cle, m);
		const eff = Jeu.REGLAGES.equipes[cle].effectif;
		fill(255, 255, 255, 13);
		rect(x, yy, l, rang - 8);
		// Prompt 92 : textes du composant partagé (une ligne, « … » en fin de mot si trop long)
		dessinerTexte(String(q.nom) + (pert.includes(cle) ? ' · ' + t('carte.pertinente') : ''), x + 12, compact ? yy + (rang - 8 - 31) / 2 : yy + 4, compact ? 380 : l - 256, { taille: 22, couleur: C.texte, maxLignes: 1, interligne: 31 });
		dessinerTexte(t('carte.dispo', { n: dispo, eff, cout: q.cout }) + (dispo ? '' : ' · ' + t('carte.retour', { s: Jeu.retourEquipe(cle, m) })), compact ? x + 404 : x + 12, compact ? yy + (rang - 8 - 26) / 2 : yy + 38, compact ? l - 256 - 404 : l - 256, { taille: 18, couleur: dispo ? C.gris : C.orange, maxLignes: 1, interligne: 26 });
		bouton(x + l - 228, yy + (rang - 8 - 44) / 2, 228, 44, t('carte.envoyer', { n: i + 1 }), () => envoyerEquipeIncident(cle), !dispo, !pert.includes(cle));
		textAlign(LEFT, TOP);
	});
	if (msg) {
		textFont(POLICE_DONNEES);
		textSize(17);
		fill(SELECTION.message.ok ? C.vert : C.orange);
		dessinerTexte(String(SELECTION.message.texte), x, y + Jeu.TYPES_EQUIPES.length * rang + 4, l, { taille: 18, couleur: SELECTION.message.ok ? C.vert : C.orange, maxLignes: 2, interligne: 24 });
	}
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
/** Ligne(s) d'un dossier en texte : numéro + nom réel (data/lignes.js) si connue(s) du joueur, sinon « à identifier » */
function texteLignes(d, i) {
	if (!(d.lignes && d.lignes.length)) return t('sig.lignes.aucune');
	if (!dossierConnu(i)) return t('sig.lignes.inconnue');
	return d.lignes
		.map((n) => {
			const ln = Jeu.lignes && Jeu.lignes.lignes.find((x) => x.nom === n);
			return t('sig.ligne', { nom: n, libelle: ln && ln.libelle ? ln.libelle : t('carte.nonRenseigne') });
		})
		.join(' · ');
}
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
/** Liste des signalements (partie gauche de l'écran de jeu) */
function dessinerFileSignalements(z) {
	noStroke();
	fill(C.fond);
	rect(z.x, z.y, z.l, z.h);
	const f = fileIncidents();
	const enCours = ['decision', 'contradiction', 'conflit'].includes(phase);
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(24);
	fill(C.texte);
	text(t('sig.titre', { n: f.length }) + (MULTI.actifs.length ? ' · ' + t('multi.actifs', { n: MULTI.actifs.length, max: MULTI.MAX }) : ''), z.x + 20, z.y + 16); // prompt 77
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(16);
	textLeading(21);
	fill(C.gris);
	text(t(phase === 'selection' ? 'sig.consigne' : enCours ? (MULTI.actifs.length > 1 ? 'multi.consigne' : Jeu.defiChrono ? 'sig.consigneEnCours' : 'sig.consigneEnCoursSans') : 'sig.consigneAttente'), z.x + 20, z.y + 52, z.l - 40, 56);
	if (!f.length) {
		const prochain = Jeu.prochainDuJour ? Jeu.prochainDuJour() : null;
		textFont(POLICE_TEXTE);
		textSize(22);
		textLeading(30);
		fill(C.texte);
		text(t('sig.vide'), z.x + 20, z.y + 120, z.l - 40, 40);
		fill(C.gris);
		textSize(19);
		const pv = typeof Taches !== 'undefined' ? Taches.prevision() : null; // prompt 88 (option) : prévision à 1 h débloquée par le grade
		text(pv ? t('deblocage.prevision', { heure: Jeu.formaterHeure(pv.minute), type: t('enq.signalement.' + pv.type), g: t('gravite.' + pv.gravite) }) : prochain ? t('sig.prochain', { heure: Jeu.formaterHeure(prochain.minute) }) : t('sig.finJour'), z.x + 20, z.y + 160, z.l - 40, 60);
		if (typeof dessinerTracesFile === 'function') dessinerTracesFile(z, z.y + 236); // prompt 89 bis : la file devient le journal de la journée
		return;
	}
	if (SELECTION.focus >= f.length) SELECTION.focus = 0;
	const hc = 112;
	const max = Math.floor((z.h - 120) / (hc + 10));
	f.slice(0, max).forEach((it, r) => {
		const y = z.y + 110 + r * (hc + 10);
		const d = it.d;
		const actif = actifDe(d); // prompt 77 : signalement pris, son compteur tourne
		const courant = enCours && it.index === Jeu.index;
		const resteA = actif ? Math.max(0, resteActif(actif)) : 0;
		const surligne = SELECTION.surbrillance && dossierConnu(it.index) && (d.lignes || []).includes(SELECTION.surbrillance);
		fill(courant ? 'rgba(212,3,28,0.22)' : actif ? 'rgba(212,3,28,0.10)' : r === SELECTION.focus && phase === 'selection' ? 'rgba(255,193,56,0.14)' : 'rgba(255,255,255,0.05)');
		rect(z.x + 16, y, z.l - 32, hc);
		zoneTexteDeclarer('carteFile', z.x + 16, y, z.l - 32, hc); // prompt 93
		fill(couleurGravite(Jeu.gravite(d)));
		rect(z.x + 16, y, 8, hc);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(22);
		fill(C.texte);
		text(Jeu.formaterHeure(d.minute) + ' · ' + t('enq.signalement.' + d.type), z.x + 40, y + 10, z.l - 200, 30);
		textStyle(NORMAL);
		textSize(18);
		fill(C.texte);
		dessinerTexte(texteLignes(d, it.index), z.x + 40, y + 41, z.l - 80, { taille: 18, couleur: C.texte, maxLignes: 1, interligne: 28 }); // prompt 93 : plus de 2e ligne masquée
		textFont(POLICE_DONNEES);
		textSize(17);
		fill(Jeu.defiChrono && actif && resteA < 10000 ? C.rouge : C.gris); // compteur d'un actif en rouge sous 10 s (défi chrono)
		const etat = actif ? (Jeu.defiChrono ? t(courant ? 'multi.enCours' : 'multi.actif', { s: Math.ceil(resteA / 1000) }) : t(courant ? 'multi.enCoursSans' : 'multi.actifSans')) : etatFile(it); // prompt 87
		text(t('carte.gravite', { g: t('gravite.' + Jeu.gravite(d)) }) + ' · ' + etat, z.x + 40, y + 78, z.l - 80, 26);
		if (courant || actif || surligne || (r === SELECTION.focus && phase === 'selection')) {
			noFill();
			stroke(courant ? C.primaire : surligne ? '#FFFFFF' : actif ? C.rougeFonce : C.orange);
			strokeWeight(3);
			rect(z.x + 16, y, z.l - 32, hc);
			noStroke();
		}
		if ((phase === 'selection' || enCours) && !courant) {
			// Prompt 77 : pendant un dossier aussi — prendre un autre signalement (3 actifs au plus) ou basculer vers un actif
			textAlign(RIGHT, TOP);
			textFont(POLICE_DONNEES);
			textSize(16);
			fill(C.orange);
			text(t(actif ? 'multi.basculer' : 'sig.prendre'), z.x + z.l - 32, y + 14);
			textAlign(LEFT, TOP);
			boutons.push({ x: z.x + 16, y, l: z.l - 32, h: hc, action: () => prendreSignalement(r) });
		}
		if (r === 0) cibleGuide('fileSignalements', z.x + 16, y, z.l - 32, hc);
	});
	if (typeof dessinerTracesFile === 'function') dessinerTracesFile(z, z.y + 110 + Math.min(f.length, max) * (hc + 10) + 8); // prompt 89 bis
	// Prompt 77 : message récent (refus d'un 4e signalement actif, envoi d'équipe) sous la liste
	if (SELECTION.message && millis() - SELECTION.message.t < 5000) {
		textFont(POLICE_DONNEES);
		textSize(17);
		textLeading(22);
		fill(SELECTION.message.ok ? C.vert : C.orange);
		text(String(SELECTION.message.texte), z.x + 20, z.y + z.h - 74, z.l - 40, 46);
	}
	if (f.length > max) {
		textFont(POLICE_DONNEES);
		textSize(17);
		fill(C.gris);
		text(t('sig.autres', { n: f.length - max }), z.x + 20, z.y + z.h - 30);
	}
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
