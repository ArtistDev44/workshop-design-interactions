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
const SELECTION = { depuis: 0, paquet: null, arrivees: {}, onglet: 'enquete', message: null, surbrillance: null, legendeRepliee: false }; // prompt 73 : plus de carte ni de repères positionnés
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
	// Prompt 73 : plus de pictogrammes qui se déplacent sur une carte — l'état des équipes engagées
	// sur ce signalement s'affiche en texte, avec le temps restant (en route / sur place / retour)
	const idx = Jeu.index;
	const engagees = (Jeu.equipes || []).filter((q) => q.index === idx && !q.inutile && q.jourIndex === Jeu.jourIndex);
	engagees.forEach((q, i) => {
		const ph = Jeu.phaseEquipe(q, m);
		const reste = Math.max(0, Math.ceil((ph === 'route' ? q.arrivee : ph === 'place' ? q.finIntervention : q.libre) - m) / 1000);
		textFont(POLICE_DONNEES);
		textSize(16);
		fill(C.gris);
		text(String(q.nom) + ' · ' + t('equipe.etat.' + ph, { s: reste }), x, y + 4 * 70 + 10 + i * 24, l, 22);
	});
	if (SELECTION.message && m - SELECTION.message.t < 5000) {
		textFont(POLICE_DONNEES);
		textSize(17);
		fill(SELECTION.message.ok ? C.vert : C.orange);
		text(String(SELECTION.message.texte), x, y + 4 * 70 + 10 + engagees.length * 24, l, 44);
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

// ——— Prompt 73 : l'écran de jeu devient une LISTE DE SIGNALEMENTS (plus de carte géographique) ———
/** Panneau de gauche : la file des incidents (actif + en attente) — type, lignes réelles, gravité, heure, expiration */
function dessinerFileSignalements(zone, dActuel) {
	const f = fileIncidents();
	noStroke();
	fill(C.fond);
	rect(zone.x, zone.y, zone.l, zone.h, 8);
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(26);
	fill(C.texte);
	text(t('signalements.titre'), zone.x + 20, zone.y + 18);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(17);
	fill(C.gris);
	text(t('signalements.sousTitre', { n: f.length }), zone.x + 20, zone.y + 54);
	if (!f.length) {
		textFont(POLICE_TEXTE);
		textSize(20);
		fill(C.gris);
		const prochain = Jeu.prochainDuJour ? Jeu.prochainDuJour() : null;
		text(prochain ? t('signalements.prochain', { heure: Jeu.formaterHeure(prochain.minute) }) : t('signalements.aucun'), zone.x + 20, zone.y + 110, zone.l - 40, 120);
		return;
	}
	const y0 = zone.y + 96;
	const hh = 96;
	f.slice(0, 8).forEach((it, i) => {
		const y = y0 + i * (hh + 10);
		const courant = i === 0;
		const enSurbrillance = SELECTION.surbrillance && (it.d.lignes || []).includes(SELECTION.surbrillance);
		fill(courant ? 'rgba(212,3,28,0.18)' : enSurbrillance ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)');
		rect(zone.x + 12, y, zone.l - 24, hh);
		fill(couleurGravite(Jeu.gravite(it.d)));
		rect(zone.x + 12, y, 6, hh);
		textFont(POLICE_TEXTE);
		textSize(19);
		fill(C.texte);
		const lignes = (it.d.lignes || []).join(', ');
		text(t('enq.signalement.' + it.d.type) + (lignes ? ' · ' + lignes : ''), zone.x + 30, y + 8, zone.l - 60, 26);
		textFont(POLICE_DONNEES);
		textSize(16);
		fill(C.gris);
		const detail = t('gravite.' + Jeu.gravite(it.d)) + ' · ' + Jeu.formaterHeure(it.d.minute) + (it.d.retard !== null && it.d.retard !== undefined ? ' · +' + it.d.retard + ' min' : '');
		text(detail, zone.x + 30, y + 38, zone.l - 60, 22);
		fill(courant ? C.rouge : C.orange);
		text(t(courant ? 'carte.expireDans' : 'carte.attendDepuis', { s: Math.ceil((courant ? resteAvantExpiration(it) : millis() - it.depuis) / 1000) }), zone.x + 30, y + 62, zone.l - 60, 22);
		boutons.push({
			x: zone.x + 12,
			y,
			l: zone.l - 24,
			h: hh,
			action: () => {
				if (courant && phase === 'selection') return selectionnerIncident();
				annoncer(t('enq.signalement.' + it.d.type) + (lignes ? ' · ' + lignes : '') + ' · ' + detail);
			},
		});
	});
}
/** Bandeau des équipes (en bas de la file) : « Police 1/2 · … », orange à 0 */
function dessinerBandeauEquipes() {
	if (ecran !== 'jeu' || !Jeu.elementDebloque('equipes')) return;
	const m = millis();
	let x = CARTE.x + 12;
	const y = CARTE.y + CARTE.h - 42; // en bas de la file des signalements (prompt 73 : plus de carte)
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

// =====================================================================
// Prompt 72 — alertes (météo, accident/malaise, affluence) : 2 à 4 choix de
// réponses rédigées pour la situation réelle, chacune mappée vers une action
// existante (1/2/3/0) ou un envoi d'équipe existant (prompt 68). Aucun indice
// de correction (prompts 50/66) ; game.js et Q1–Q61 inchangés.
// =====================================================================
const MOTS_ALERTE_SECOURS = /accident|malaise|bless|chute/i;
/** Un incident est une « alerte » si : type alerte météo, secours dans la source, ou événement/affluence */
function estAlerte(d) {
	if (!d) return false;
	if (d.type === 'alerte météo') return true;
	if (MOTS_ALERTE_SECOURS.test(String(d.texte_source || '') + ' ' + String(d.nature || ''))) return true;
	if (d.type === 'événement' || d.affluence) return true;
	return false;
}
/** Hachage stable local (ne consomme pas le générateur de la partie) */
function hacherAlerte(texte) {
	let h = 2166136261;
	for (let i = 0; i < texte.length; i++) h = Math.imul(h ^ texte.charCodeAt(i), 16777619);
	return h >>> 0;
}
/**
 *Réponses proposées pour un incident-alerte, construites UNIQUEMENT depuis les champs réels
 * du dossier et la météo du jour : 2 à 4 réponses, ordre mélangé par la graine (reproductible).
 * Chaque réponse : { cle (i18n), vars, vers: { type: 'action' | 'equipe', cle } }.
 */
function reponsesAlerte(d) {
	if (!estAlerte(d)) return [];
	const m = (typeof Jeu !== 'undefined' && Jeu.meteoDuJour && Jeu.meteoDuJour(d.date)) || {};
	const pluie = Math.round((m.pluie_mm || 0) * 10) / 10;
	const rafales = Math.round(m.rafales_max || 0);
	const secours = MOTS_ALERTE_SECOURS.test(String(d.texte_source || '') + ' ' + String(d.nature || ''));
	const evenement = d.type === 'événement' || d.affluence ? String(d.texte_source || d.nature || '').split(' — ')[0].trim() : '';
	const ligne = (d.lignes && d.lignes.join(', ')) || '';
	const liste = [];
	if (d.type === 'alerte météo') {
		if (rafales >= 50) {
			liste.push({ cle: 'alerte.reponse.pompiers', vars: { rafales }, vers: { type: 'equipe', cle: 'pompiers' } });
			liste.push({ cle: 'alerte.reponse.techniciens', vars: { rafales }, vers: { type: 'equipe', cle: 'techniciens' } });
		}
		if (pluie >= 10) liste.push({ cle: 'alerte.reponse.devierPluie', vars: { pluie, ligne }, vers: { type: 'action', cle: 'devier' } });
		liste.push({ cle: 'alerte.reponse.retenir', vars: {}, vers: { type: 'action', cle: 'retenir' } });
		liste.push({ cle: 'alerte.reponse.prevenir', vars: {}, vers: { type: 'action', cle: 'rien' } });
	}
	if (secours) {
		liste.push({ cle: 'alerte.reponse.ambulance', vars: {}, vers: { type: 'equipe', cle: 'ambulance' } });
		liste.push({ cle: 'alerte.reponse.policeSecours', vars: {}, vers: { type: 'equipe', cle: 'police' } });
	}
	if (d.type === 'événement' || d.affluence) {
		if (evenement) liste.push({ cle: 'alerte.reponse.policeAffluence', vars: { evenement }, vers: { type: 'equipe', cle: 'police' } });
		liste.push({ cle: 'alerte.reponse.renfortAffluence', vars: { ligne }, vers: { type: 'action', cle: 'renfort' } });
	}
	// 2 à 4 réponses : on complète avec des actions génériques valides si besoin
	while (liste.length < 2) {
		liste.push(liste.length === 0
			? { cle: 'alerte.reponse.retenir', vars: {}, vers: { type: 'action', cle: 'retenir' } }
			: { cle: 'alerte.reponse.prevenir', vars: {}, vers: { type: 'action', cle: 'rien' } });
	}
	const trop = liste.slice(0, 4);
	// Mélange reproductible (graine de la partie + n° de dossier)
	const idx = Jeu.paquet ? Jeu.paquet.indexOf(d) : 0;
	const graine = Jeu.graine || 0;
	return trop
		.map((r, i) => ({ r, h: hacherAlerte(graine + '|' + idx + '|' + i + '|' + r.cle) }))
		.sort((a, b) => a.h - b.h)
		.map((x) => x.r);
}
/** Active une réponse proposée : action → décision normale ; équipe → envoi (le dossier reste ouvert) */
function activerReponseAlerte(r) {
	if (!r) return;
	if (r.vers.type === 'equipe') return envoyerEquipeIncident(r.vers.cle);
	decider(r.vers.cle);
}

// =====================================================================
// Prompt 74 — casser la répétition (contenus et rythme, pas les règles) :
// textes de liaison variés entre deux dossiers et feedback de série, tirés
// de la graine de la partie (reproductibles) et des données réelles uniquement.
// game.js et Q1–Q61 inchangés.
// =====================================================================
/** Court texte de liaison entre deux dossiers, varié par hachage (graine + n° de dossier) :
 * annonce météo réelle du jour, rappel d'un événement d'agenda réel en cours, ou message radio (chauffeur). */
function texteLiaison(d) {
	if (!d || !Jeu.graine) return '';
	const idx = Jeu.paquet ? Jeu.paquet.indexOf(d) : 0;
	const h = hacherAlerte(String(Jeu.graine) + '|liaison|' + idx);
	const m = (Jeu.meteoDuJour && Jeu.meteoDuJour(d.date)) || {};
	const ev = Jeu.evenementsAffluence ? Jeu.evenementsAffluence(d.date)[0] : null;
	const choix = h % 3;
	if (choix === 0 && (m.pluie_mm >= 1 || m.rafales_max >= 40 || m.temp_max >= 28)) {
		return t('liaison.meteo', { pluie: m.pluie_mm || 0, rafales: Math.round(m.rafales_max || 0), max: m.temp_max });
	}
	if (choix === 1 && ev) {
		const titre = String(ev.texte_source || ev.nature).split(' — ')[0];
		return t('liaison.agenda', { evenement: titre });
	}
	if (d.lignes && d.lignes.length) return t('liaison.radio', { ligne: d.lignes[0] });
	if (choix === 0) return t('liaison.meteoClaire', { max: m.temp_max });
	return t('liaison.rien', {});
}
/** Série en cours : nombre de « bon » ou de « raté » d'affilée (évaluations réelles du journal) */
function serieDecisions() {
	const evs = (Jeu.evenementsJournee || []).filter((e) => e.cleAction && e.cleAction !== 'temps');
	let serie = 0;
	let type = null;
	for (let i = evs.length - 1; i >= 0; i--) {
		const ev = Jeu.evaluer(evs[i]) === 'bon' ? 'bon' : Jeu.evaluer(evs[i]) === 'rate' || Jeu.evaluer(evs[i]) === 'aucun_detour' || Jeu.evaluer(evs[i]) === 'trop_tard' ? 'rate' : null;
		if (!ev) continue;
		if (type === null) {
			type = ev;
			serie = 1;
		} else if (ev === type) serie++;
		else break;
	}
	return { type, n: serie };
}
