/* Nantes en régulation — prompt 90 : le téléphone devient un fil de notifications vivant.
 * Partie logique (NotifsTel, chargée par les tests) : plan du jour construit sur les données réelles déjà chargées
 * (agenda, météo, changelog, Loire, dossiers) et sur la partie (Camille, chauffeurs, rappels, alertes de jeu),
 * rythme (≤ 1 spontanée / 20 min de jeu, 10 au plus par jour, jamais pendant un panneau de décision ouvert),
 * priorités et regroupement, Ne pas déranger. Variantes tirées par la graine (Jeu.variante, sans les dés).
 * Sources EN DIRECT (parkings, vélos, trafic routier, pollens) : seulement en mode « aujourd'hui » ou dans l'onglet
 * « En direct aujourd'hui » avec l'heure du relevé — jamais datées de la semaine archivée. Appels au clic sur le
 * téléphone uniquement, une fois par source toutes les 10 min au plus, délai 6 s, cache ; échec → source absente.
 */
const NotifsTel = (() => {
	const PRIO = { alerte: 0, partie: 1, info: 2, ambiance: 3 };
	const APPS = { agenda: 'info', meteo: 'info', travaux: 'info', loire: 'info', messages: 'partie', regul: 'partie', quai: 'partie', rappels: 'partie', parkings: 'ambiance', velos: 'ambiance', trafic: 'ambiance', pollens: 'ambiance' };
	const R = { ecartMin: 20, maxJour: 10, minJour: 6 };
	const nombre = (v) => (typeof Langue !== 'undefined' && Langue.actuelle === 'fr' ? String(v).replace('.', ',') : String(v));
	const nomEv = (e) => String((e && e.texte_source) || '').split(' — ')[0].trim();
	const lieuEv = (e) => String((e && e.texte_source) || '').split(' — ')[1] || '';
	const variante = (cle, sel) => (Jeu.variante ? Jeu.variante(cle, 'tel|' + sel) : cle);
	const MESSAGES_TEL = () => (typeof window !== 'undefined' && window.MESSAGES && window.MESSAGES.telephone) || null;
	function tirer(liste, sel) {
		if (!liste.length) return null;
		const h = typeof Taches !== 'undefined' ? Taches.hacher(String(Jeu.graine) + '|tel|' + sel) : 0;
		return liste[h % liste.length];
	}
	const texteModele = (m, vars) => {
		const lang = typeof Langue !== 'undefined' ? Langue.actuelle : 'fr';
		return String(m.texte[lang] || m.texte.fr).replace(/\{(\w+)\}/g, (x, k) => (vars[k] !== undefined ? String(vars[k]) : x));
	};

	/** Notifications prévues pour la journée (données réelles et faits de la partie) ; une donnée absente → rien */
	function planJour(jr) {
		if (!jr) return [];
		const date = jr.date;
		const out = [];
		const ajouter = (o) => out.push(Object.assign({ id: o.app + '|' + date + '|' + (o.sel || o.cle), prio: PRIO[APPS[o.app]], lu: false, ignoree: false }, o));
		// Météo du jour (Open-Meteo, déjà chargée) : seulement si un seuil est franchi
		const m = Jeu.meteoDuJour ? Jeu.meteoDuJour(date) : null;
		if (m) {
			if ((m.rafales_max || 0) >= 40) ajouter({ app: 'meteo', cle: variante('tel.n.vent', 'vent' + date), vars: { vent: nombre(m.rafales_max) }, minute: 8 * 60 + 15, source: 'Open-Meteo', sel: 'vent' });
			if ((m.pluie_mm || 0) >= 1) ajouter({ app: 'meteo', cle: variante('tel.n.pluie', 'pluie' + date), vars: { pluie: nombre(m.pluie_mm) }, minute: 8 * 60 + 35, source: 'Open-Meteo', sel: 'pluie' });
			if (m.temp_min !== null && m.temp_min !== undefined && m.temp_min <= 0) ajouter({ app: 'meteo', cle: variante('tel.n.gel', 'gel' + date), vars: { min: nombre(m.temp_min) }, minute: 8 * 60 + 5, source: 'Open-Meteo', sel: 'gel' });
		}
		// Info travaux (changelog GTFS de la semaine)
		jr.dossiers.filter((d) => d.type === 'perturbation').slice(0, 2).forEach((d, i) => {
			ajouter({ app: 'travaux', cle: variante(d.lignes && d.lignes.length ? 'tel.n.travauxLigne' : 'tel.n.travaux', 'trav' + date + i), vars: { ligne: (d.lignes || []).join(', '), nature: String(d.nature || '').split(',')[0] }, minute: 9 * 60 + 10 + i * 25, source: 'changelog GTFS', sel: 'trav' + i, dossier: Jeu.paquet.indexOf(d) });
		});
		// Agenda (Nantes Métropole) : une heure avant l'affluence, sinon en fin de matinée
		const ev = Jeu.evenementsAffluence ? Jeu.evenementsAffluence(date) : [];
		ev.slice(0, 2).forEach((e, i) => {
			const d = jr.dossiers.find((x) => x.type === 'événement' && nomEv(x) === nomEv(e));
			ajouter({ app: 'agenda', cle: variante('tel.n.agenda', 'ag' + date + i), vars: { nom: nomEv(e), lieu: lieuEv(e) }, minute: d ? Math.max(8 * 60 + 50, d.minute - 60) : 11 * 60 + 20 + i * 30, source: 'Agenda Nantes Métropole', sel: 'ag' + i });
		});
		// Loire (Hub'Eau, data/loire.json) : seulement si la date jouée est dans la période des relevés
		const lo = typeof window !== 'undefined' ? window.PXE_LOIRE || window.LOIRE : null;
		if (lo && lo.periode && date >= String(lo.periode.du).slice(0, 10) && date <= String(lo.periode.au).slice(0, 10) && lo.mediane_m !== undefined) ajouter({ app: 'loire', cle: variante('tel.n.loire', 'loire' + date), vars: { med: nombre(Math.round(lo.mediane_m * 100) / 100), min: nombre(Math.round(lo.min_m * 100) / 100), max: nombre(Math.round(lo.max_m * 100) / 100) }, minute: 10 * 60 + 30, source: "Hub'Eau", sel: 'loire' });
		// Messages : Camille (inspection, crise, agenda) et chauffeurs sans nom (dossier réel avec ligne)
		const mt = MESSAGES_TEL();
		if (mt) {
			const camille = (fait, vars, minute) => {
				const mod = tirer(mt.camille.filter((x) => x.fait === fait), 'cam' + fait + date);
				if (mod) ajouter({ app: 'messages', de: 'camille', texte: texteModele(mod, vars), minute, source: 'partie', sel: 'cam' + fait });
			};
			if (Jeu.jourInspection && Jeu.jourIndex === Jeu.jourInspection() && Jeu.jourIndex > 0) camille('inspection', {}, 8 * 60 + 25);
			const c = typeof Taches !== 'undefined' ? Taches.crise(date) : null;
			if (c) camille('crise', { n: jr.dossiers.length }, 13 * 60 + 30);
			else if (ev.length) camille('agenda', { nom: nomEv(ev[0]) }, 12 * 60 + 10);
			jr.dossiers.filter((d) => (d.type === 'ligne en difficulté' || d.type === 'perturbation') && d.lignes && d.lignes.length && !d.consequence).slice(0, 2).forEach((d, i) => {
				const mod = tirer(mt.chauffeur.filter((x) => x.type === d.type), 'ch' + date + i);
				if (mod) ajouter({ app: 'messages', de: 'chauffeur', texte: texteModele(mod, { ligne: d.lignes[0], retard: d.retard, nature: String(d.nature || '').split(',')[0] }), minute: d.minute + 4, source: 'partie', sel: 'ch' + i, dossier: Jeu.paquet.indexOf(d) });
			});
		}
		// Rappels (partie)
		const fin = Jeu.finJournee ? Jeu.finJournee() : 20 * 60;
		ajouter({ app: 'rappels', cle: variante('tel.n.finService', 'fin' + date), vars: { heure: Jeu.formaterHeure(fin) }, minute: fin - 60, source: 'partie', sel: 'fin' });
		if (typeof Taches !== 'undefined') ajouter({ app: 'rappels', cle: variante('tel.n.rapport', 'rap' + date), vars: {}, minute: fin - 20, source: 'partie', sel: 'rapport' });
		return out.sort((a, b) => a.minute - b.minute);
	}

	/** Événements de partie détectés en continu (alerte de jauge, objectif, équipe arrivée, plainte, badge, mentions) */
	function evenementsPartie(etat) {
		const out = [];
		const jr = Jeu.jourCourant ? Jeu.jourCourant() : null;
		if (!jr || !Jeu.jauges) return out;
		const ajouter = (o) => out.push(Object.assign({ id: o.app + '|' + jr.date + '|' + o.sel, prio: o.alerte ? PRIO.alerte : PRIO.partie, lu: false, ignoree: false, minute: Jeu.horloge ? Math.floor(Jeu.horloge.minutes) : 0, source: 'partie' }, o));
		['fluidite', 'reputation', 'budget'].forEach((k) => {
			if (Jeu.jauges[k] < 30) ajouter({ app: 'regul', alerte: true, cle: variante('tel.n.jauge', 'j' + k + jr.date), vars: { jauge: t('jaugeTitre.' + k), v: Jeu.jauges[k] }, sel: 'jauge' + k });
		});
		const o = (Jeu.objectifsResultats || []).find((x) => x.jourIndex === Jeu.jourIndex);
		if (o && o.atteint) ajouter({ app: 'regul', cle: 'tel.n.objectif', vars: { libelle: String(o.libelle) }, sel: 'objectif' });
		(Jeu.equipes || []).filter((q) => q.jour === jr.date && q.arrivee_sim && !q.inutile).forEach((q, i) => ajouter({ app: 'regul', bureau: true, cle: 'tel.n.equipe', vars: { nom: String(q.nom), heure: q.arrivee_sim }, sel: 'eq' + (Jeu.equipes.indexOf(q)) }));
		const attente = Jeu.plaintesEnAttente ? Jeu.plaintesEnAttente().length : 0;
		if (attente) ajouter({ app: 'quai', bureau: true, cle: 'tel.n.quai', vars: { n: attente }, sel: 'quai' + (Jeu.plaintes || []).length });
		const SP = Jeu.statutPatron;
		if (SP && SP.avertissements) ajouter({ app: 'regul', alerte: true, cle: 'tel.n.avertissement', vars: { n: SP.avertissements }, sel: 'avert' + SP.avertissements });
		const tj = Jeu.taches && Jeu.taches.jours && Jeu.taches.jours[jr.date];
		(tj && tj.recap && tj.recap.badges ? tj.recap.badges : []).forEach((b) => ajouter({ app: 'regul', cle: 'tel.n.badge', vars: { badge: t('badge.' + b) }, sel: 'badge' + b }));
		return out.filter((n) => !etat.vus[n.id]);
	}

	/** Une image : livre les notifications dues ; renvoie la notification spontanée à montrer (ou null) et le nombre d'autres */
	function maj(etat, ctx) {
		const jr = Jeu.jourCourant ? Jeu.jourCourant() : null;
		if (!jr || !Jeu.horloge) return null;
		if (etat.jour !== jr.date) {
			etat.jour = jr.date;
			etat.plan = planJour(jr);
			etat.spontanees = 0;
			etat.dernier = -999;
			etat.attente = [];
		}
		const now = Jeu.horloge.minutes;
		const dues = etat.plan.filter((n) => n.minute <= now && !etat.vus[n.id]).concat(evenementsPartie(etat));
		dues.forEach((n) => {
			etat.vus[n.id] = true;
			etat.recues.push(n);
			if (!n.bureau) etat.attente.push(n); // déjà affichée en notification de bureau (prompt 77) : centre seulement
		});
		if (!etat.attente.length) return null;
		const alertes = etat.attente.filter((n) => n.prio === PRIO.alerte);
		if (ctx.panneauOuvert) return null; // jamais pendant un panneau de décision ouvert (prompt 87)
		if (ctx.npd && !alertes.length) return (etat.attente = []), null; // Ne pas déranger : seules les alertes passent
		if (!alertes.length && (now - etat.dernier < R.ecartMin || etat.spontanees >= R.maxJour)) return null;
		const lot = ctx.npd ? alertes : etat.attente;
		const tri = lot.slice().sort((a, b) => a.prio - b.prio || a.minute - b.minute);
		etat.attente = [];
		etat.dernier = now;
		etat.spontanees++;
		return { n: tri[0], autres: tri.length - 1 };
	}
	function etatVide() {
		return { jour: null, plan: [], recues: [], vus: {}, attente: [], spontanees: 0, dernier: -999 };
	}
	/** Centre de notifications : groupes par appli (la plus récente en haut), sans les ignorées */
	function groupes(etat) {
		const g = {};
		etat.recues.filter((n) => !n.ignoree && n.jourDate !== false).forEach((n) => (g[n.app] = g[n.app] || []).push(n));
		return Object.keys(g)
			.map((app) => ({ app, liste: g[app].slice().reverse() }))
			.sort((a, b) => b.liste[0].minute - a.liste[0].minute);
	}
	// Prompt 162 : une notification rattachée au dossier fictif garde « Fictif · »
	const texte = (n) => String(marquerFictif(n.dossier !== undefined && Jeu.paquet ? Jeu.paquet[n.dossier] : null, n.texte ? n.texte : t(n.cle, n.vars || {})));
	return { PRIO, APPS, R, planJour, evenementsPartie, maj, etatVide, groupes, texte };
})();
if (typeof window !== 'undefined') window.NotifsTel = NotifsTel;

// =====================================================================
// Interface : vibration sur le bureau, écran de verrouillage, centre de notifications, onglet « En direct »
// =====================================================================
const TELN = Object.assign(NotifsTel.etatVide(), { onglet: 'notifs', focus: 0, ouverts: {}, spontanee: null, depuis: 0, direct: {}, directCharge: {} });

function panneauDecisionOuvert() {
	return typeof PHASES_ACTIVES !== 'undefined' && PHASES_ACTIVES.includes(phase) && vue === 'poste' && PC.etat === 'appli';
}
/** Chaque image (draw) : arrivées spontanées. Aucun appel réseau ici. */
function majNotifsTel() {
	if (ecran !== 'jeu' || !Jeu.paquet || !Jeu.horloge || MENU.actif || ['fin', 'mail', 'soir'].includes(phase)) return;
	// Mode « aujourd'hui » : les relevés en direct déjà chargés (au clic) deviennent des notifications d'ambiance datées de leur heure réelle
	if (Jeu.etat.mode === 'direct' && TELN.jour)
		Object.values(TELN.direct).forEach((d) => {
			const id = d.app + '|direct|' + d.heureReelle;
			if (!TELN.vus[id] && !TELN.plan.some((n) => n.id === id)) TELN.plan.push(Object.assign({ id, prio: NotifsTel.PRIO.ambiance, minute: Math.floor(Jeu.horloge.minutes), lu: false, ignoree: false, source: 'Open Data Nantes Métropole' }, d));
		});
	const r = NotifsTel.maj(TELN, { panneauOuvert: panneauDecisionOuvert() || fenetre === 'tache', npd: !!Confort.Reglages.npd });
	if (!r) return;
	TELN.spontanee = r;
	TELN.depuis = millis();
	Confort.Son.bip(r.n.prio === NotifsTel.PRIO.alerte ? 'alerte' : r.n.app === 'messages' ? 'dossier' : 'choix');
	annoncer(t('tel.annonceSpontanee', { app: t('tel.app.' + r.n.app), texte: NotifsTel.texte(r.n) }) + (r.autres ? ' ' + t('tel.autres', { n: r.autres }) : ''));
}
const telNonLues = () => TELN.recues.filter((n) => !n.lu && !n.ignoree).length;
/** État du téléphone posé sur le bureau (bureau.js) : allumé après une arrivée, vibration 2 px, pastille */
function etatTelephoneBureau() {
	const ecoule = millis() - TELN.depuis;
	const recente = TELN.spontanee && ecoule < 6000;
	return { allume: recente || telNonLues() > 0, vibre: recente && ecoule < 1500 && !reduireAnimations && Math.floor(millis() / 60) % 2 ? 2 : 0, pastille: telNonLues() };
}

// ——— Écran du téléphone en main ———
function contenuCentreNotifications(e, pret) {
	const x = e.x;
	const l = e.l;
	const hA = heureAffichee();
	// Fond selon la météo et l'heure du jour joué (pluie, nuit) : aplats pixel, pas d'image
	const m = Jeu.meteoDuJour && TEL.date ? Jeu.meteoDuJour(TEL.date) : null;
	const nuit = hA.h >= 19 || hA.h < 8;
	noStroke();
	fill(nuit ? '#0b1430' : '#1d4f7a');
	rect(x, e.y, l, e.h, 46);
	if (m && (m.pluie_mm || 0) >= 1) {
		fill(255, 255, 255, 40);
		for (let i = 0; i < 40; i++) rect(x + ((i * 53) % (l - 20)) + 10, e.y + ((i * 97) % (e.h - 40)) + 20, 2, 8);
	}
	textAlign(CENTER, TOP);
	fill('#ffffff');
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(64);
	text(String(hA.h).padStart(2, '0') + ':' + String(hA.m).padStart(2, '0'), x + l / 2, e.y + 56);
	textStyle(NORMAL);
	textSize(20);
	text(dateLongue(TEL.date), x + l / 2, e.y + 132);
	// Onglets (Notifications, Agenda, En direct si disponible) + Ne pas déranger
	const onglets = ['notifs', 'agenda'].concat(directDisponible() ? ['direct'] : []);
	if (!onglets.includes(TELN.onglet)) TELN.onglet = 'notifs';
	const lo = (l - 32 - (onglets.length - 1) * 6) / onglets.length;
	onglets.forEach((o, i) => bouton(x + 16 + i * (lo + 6), e.y + 170, lo, 48, t('tel.onglet.' + o), () => ((TELN.onglet = o), (TELN.focus = 0), annoncer(t('tel.onglet.' + o))), false, TELN.onglet !== o));
	const yc = e.y + 232;
	const hc = e.h - 232 - 130 - 28; // prompt 175 : 28 px rendus au nom du réglage « Ne pas déranger », au-dessus de son interrupteur
	if (TELN.onglet === 'agenda') contenuAgendaTel(x, yc, l, hc);
	else if (TELN.onglet === 'direct') contenuDirectTel(x, yc, l, hc);
	else contenuGroupesTel(x, yc, l, hc);
	if (pret) {
		// Prompt 175 : « Ne pas déranger » = interrupteur du DS (« Activé » / « Désactivé »), plus de bouton « oui / non » ;
		// la lune (Lucide, prompt 170) précède le nom du réglage
		// Le nom du réglage (lune + « Ne pas déranger ») est écrit au-dessus de l'interrupteur : la demi-largeur de
		// l'écran ne tient pas le nom et l'état sur une ligne
		const lw = (l - 40) / 2;
		const y0 = e.y + e.h - 112;
		const npd = !!Confort.Reglages.npd;
		dsInterrupteur(x + 16 + dsLargeurInterrupteur(npd), y0 + 6, npd, basculerNpd);
		iconeLucide('moon', x + 16, y0 - 22, 20, '#ffffff');
		noStroke();
		fill('#ffffff');
		textFont(POLICE_TEXTE);
		textStyle(NORMAL);
		textAlign(LEFT, CENTER);
		zoneTexteDebut('npdTel', x + 42, y0 - 24, lw - 26, 24);
		ajusterTaille(t('tel.npd'), lw - 26, 18, 14);
		text(t('tel.npd'), x + 42, y0 - 13);
		zoneTexteFin();
		textAlign(LEFT, TOP);
		bouton(x + 24 + (l - 40) / 2, e.y + e.h - 112, (l - 40) / 2, 56, t('commun.fermer'), fermer);
	}
}
/** Prompt 170 : icônes d'appli Lucide (icones-lucide.js) sur pastille blanche ; toujours accompagnées du nom de l'appli */
const ICONES_TEL = { agenda: 'calendar', meteo: 'cloud-rain', travaux: 'construction', loire: 'waves', messages: 'message-square', regul: 'monitor', quai: 'tram-front', rappels: 'alarm-clock', parkings: 'square-parking', velos: 'bike', trafic: 'traffic-cone', pollens: 'flower-2' };
function iconeTel(app, x, y, s) {
	noStroke();
	fill('#ffffff');
	rect(x - 3, y - 3, 8 * s + 6, 8 * s + 6, 6);
	iconeLucide(ICONES_TEL[app] || ICONES_TEL.regul, x, y, 8 * s, '#0b1b33');
}
function contenuGroupesTel(x, y0, l, h) {
	const gs = NotifsTel.groupes(TELN);
	textAlign(LEFT, TOP);
	if (!gs.length) {
		textFont(POLICE_TEXTE);
		textSize(20);
		fill('#ffffff');
		text(t('tel.aucuneNotif'), x + 32, y0 + 20, l - 64, 80);
		return;
	}
	const items = listeFocusTel();
	let y = y0;
	gs.forEach((g) => {
		if (y + 124 > y0 + h) return;
		const ouvert = !!TELN.ouverts[g.app];
		const visibles = ouvert ? g.liste : g.liste.slice(0, 1);
		visibles.forEach((n, i) => {
			if (y + 124 > y0 + h) return; // pas de débordement sur les boutons du bas
			const nh = 124;
			const focus = items[TELN.focus] === n;
			textAlign(LEFT, TOP); // bouton() laisse l'alignement centré
			noStroke();
			fill(255, 255, 255, n.lu ? 200 : 240);
			rect(x + 16, y, l - 32, nh, 18);
			if (focus) {
				noFill();
				stroke(DS.primaire); // prompt 176 : focus à la couleur d'accent (carte blanche : l'aplat tient 4,5:1)
				strokeWeight(4);
				rect(x + 16, y, l - 32, nh, 18);
				noStroke();
			}
			iconeTel(g.app, x + 30, y + 14, 3);
			textFont(POLICE_DONNEES);
			textSize(15);
			fill('#3d4b5f');
			text(t('tel.app.' + g.app) + ' · ' + (n.heureReelle ? t('tel.releve', { heure: n.heureReelle }) : Jeu.formaterHeure(n.minute)) + (!n.lu ? ' · ●' : ''), x + 70, y + 14, l - 120, 20);
			textFont(POLICE_TEXTE);
			textSize(17);
			fill('#0b1b33');
			text(court(NotifsTel.texte(n), 96), x + 30, y + 44, l - 130, 76); // prompt 114 : 3 lignes au plus (texte complet à l’ouverture)
			boutons.push({ x: x + 16, y, l: l - 132, h: nh, action: () => ouvrirNotifTel(n) });
			// Ignorer : carré sombre, croix Lucide (cible 56 px), libellé lu par l'annonce
			fill('#0b1b33');
			rect(x + l - 84, y + 34, 56, 56, 10);
			iconeLucide('x', x + l - 68, y + 50, 24, '#ffffff'); // prompt 170
			boutons.push({ x: x + l - 84, y: y + 34, l: 56, h: 56, action: () => ignorerNotifTel(n) });
			y += nh + 8;
		});
		if (g.liste.length > 1 && y + 46 <= y0 + h) {
			bouton(x + 16, y, (l - 40) / 2, 46, ouvert ? t('tel.replier') : t('tel.autres', { n: g.liste.length - 1 }), () => (TELN.ouverts[g.app] = !ouvert), false, true);
			bouton(x + 24 + (l - 40) / 2, y, (l - 40) / 2, 46, t('tel.toutEffacer'), () => effacerGroupeTel(g.app), false, true);
			y += 54;
		}
		y += 6;
	});
}
function listeFocusTel() {
	return NotifsTel.groupes(TELN).flatMap((g) => (TELN.ouverts[g.app] ? g.liste : g.liste.slice(0, 1)));
}
function contenuAgendaTel(x, y0, l, h) {
	const c = TEL.cache[TEL.date];
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	fill('#ffffff');
	if (!c) return (textSize(20), text(t('tel.chargement'), x + 32, y0 + 20));
	if (!c.notifs.length) return (textSize(20), text(t('tel.aucune'), x + 32, y0 + 20, l - 64, 80));
	let y = y0;
	c.notifs.slice(0, 4).forEach((n) => {
		fill(255, 255, 255, 235);
		rect(x + 16, y, l - 32, 96, 18);
		iconeTel('agenda', x + 30, y + 14, 3);
		textFont(POLICE_DONNEES);
		textSize(15);
		fill('#3d4b5f');
		text(t('tel.app.agenda') + (n.heure ? ' · ' + n.heure : ''), x + 70, y + 14);
		textFont(POLICE_TEXTE);
		textSize(17);
		fill('#0b1b33');
		text(court(n.titre, 60), x + 30, y + 42, l - 60, 24);
		fill('#3d4b5f');
		text(court([n.type, n.lieu].filter(Boolean).join(' · '), 60), x + 30, y + 66, l - 60, 24);
		y += 104;
	});
	textFont(POLICE_DONNEES);
	textSize(14);
	fill('rgba(255,255,255,0.85)');
	text(t(c.source === 'api' ? 'tel.source.api' : 'tel.source.repli'), x + 24, y + 4, l - 48, 44);
}

// ——— Sources en direct (mode « aujourd'hui », ou onglet titré « En direct aujourd'hui ») ———
const DATASET_TEL = 'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/';
const SOURCES_DIRECT = {
	parkings: { ds: '244400404_parkings-publics-nantes-disponibilites', q: 'limit=1&select=grp_nom,grp_disponible,grp_horodatage&order_by=grp_disponible%20desc', lire: (r) => r[0] && r[0].grp_nom && r[0].grp_disponible !== undefined && { cle: 'tel.n.parking', vars: { nom: r[0].grp_nom, n: r[0].grp_disponible }, heure: r[0].grp_horodatage } },
	velos: { ds: '244400404_disponibilite-temps-reel-velos-libre-service-naolib-nantes-metropole', q: 'limit=1&select=name,available_bikes,last_update', lire: (r) => r[0] && r[0].name && r[0].available_bikes !== undefined && { cle: 'tel.n.velos', vars: { nom: r[0].name, n: r[0].available_bikes }, heure: r[0].last_update } },
	trafic: { ds: '244400404_fluidite-axes-routiers-nantes-metropole', q: 'select=etat_trafic,count(*)%20as%20n&group_by=etat_trafic&limit=10', lire: (r) => r.length && { cle: 'tel.n.trafic', vars: { n: r.filter((x) => /dense|bloqu/i.test(String(x.etat_trafic))).reduce((a, x) => a + x.n, 0), total: r.reduce((a, x) => a + x.n, 0) }, heure: null } },
	pollens: { ds: '323266205_alerte-pollens-nantes', q: 'limit=1&select=name,lib_etat,state&order_by=state%20desc', lire: (r) => r[0] && r[0].name && r[0].lib_etat && { cle: 'tel.n.pollens', vars: { nom: r[0].name, etat: r[0].lib_etat }, heure: null } },
};
const heureReelle = (iso) => {
	const d = iso ? new Date(iso) : new Date();
	return isNaN(d) ? null : String(d.getHours()).padStart(2, '0') + 'h' + String(d.getMinutes()).padStart(2, '0');
};
/** Au clic sur le téléphone seulement : une fois par source toutes les 10 min réelles, 6 s au plus, cache */
function chargerDirectTel() {
	if (Confort.Reglages.horsLigneForce || typeof fetch !== 'function') return;
	Object.entries(SOURCES_DIRECT).forEach(([cle, s]) => {
		const dernier = TELN.directCharge[cle] || 0;
		if (Date.now() - dernier < 10 * 60 * 1000) return;
		TELN.directCharge[cle] = Date.now();
		const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
		const minuterie = setTimeout(() => ctrl && ctrl.abort(), 6000);
		fetch(DATASET_TEL + s.ds + '/records?' + s.q, ctrl ? { signal: ctrl.signal } : {})
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => {
				const v = d && d.results ? s.lire(d.results) : null;
				if (v) TELN.direct[cle] = Object.assign({ app: cle, heureReelle: heureReelle(v.heure) }, v); // relevé daté de son heure réelle
				else delete TELN.direct[cle]; // champ absent : la source n'est pas proposée
			})
			.catch(() => delete TELN.direct[cle])
			.finally(() => clearTimeout(minuterie));
	});
}
const directDisponible = () => Object.keys(TELN.direct).length > 0;
function contenuDirectTel(x, y0, l, h) {
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(15);
	fill('#ffffff');
	const archive = Jeu.etat && Jeu.etat.mode !== 'direct';
	text(t('tel.directTitre') + (archive ? ' — ' + t('tel.pasSemaine') : ''), x + 24, y0, l - 48, 70);
	let y = y0 + 78;
	Object.values(TELN.direct).forEach((n) => {
		fill(255, 255, 255, 235);
		rect(x + 16, y, l - 32, 88, 18);
		iconeTel(n.app, x + 30, y + 14, 3);
		textFont(POLICE_DONNEES);
		textSize(15);
		fill('#3d4b5f');
		text(t('tel.app.' + n.app) + ' · ' + t('tel.releve', { heure: n.heureReelle || '—' }), x + 70, y + 14, l - 100, 20); // l'onglet est titré « En direct aujourd'hui »
		textFont(POLICE_TEXTE);
		textSize(17);
		fill('#0b1b33');
		text(court(t(n.cle, n.vars), 70), x + 30, y + 46, l - 60, 40);
		y += 96;
	});
}

// ——— Actions ———
function basculerNpd() {
	Confort.Reglages.basculer('npd');
	annoncer(t('tel.npd') + ' : ' + t(Confort.Reglages.npd ? 'commun.active' : 'commun.desactive'));
}
function ignorerNotifTel(n) {
	n.ignoree = true;
	n.lu = true;
	Confort.Son.clic();
	annoncer(t('tel.ignoree'));
}
function effacerGroupeTel(app) {
	TELN.recues.filter((n) => n.app === app).forEach((n) => ((n.ignoree = true), (n.lu = true)));
	annoncer(t('tel.effacees', { app: t('tel.app.' + app) }));
}
/** Ouvrir : l'appli du PC concernée ; pendant un dossier, une info lue au bon moment révèle sa source sans coût */
function ouvrirNotifTel(n) {
	n.lu = true;
	const cible = { regul: 'signalements', quai: 'community', messages: n.de === 'camille' ? 'patron' : 'signalements', rappels: 'journal', travaux: 'signalements', meteo: 'signalements', agenda: 'signalements', loire: 'signalements' }[n.app];
	const source = { meteo: 'meteo', travaux: 'trafic', agenda: 'agenda', messages: n.de === 'chauffeur' ? 'lignes' : null }[n.app];
	if (source && typeof revelerSource === 'function' && PHASES_ACTIVES.includes(phase) && (n.dossier === undefined || n.dossier === Jeu.index)) revelerSource(source, false); // bonus déjà prévu (prompt 50 : source gratuite)
	baisserTelephone(() => {
		fermer();
		if (!cible) return;
		if (vue !== 'poste' && typeof sAsseoir === 'function') sAsseoir();
		if (cible === 'signalements') {
			PC.etat = 'appli';
			PC.fenetre = null;
		} else {
			PC.etat = 'os';
			PC.fenetre = cible;
		}
	});
	annoncer(t('tel.ouvre', { app: t('tel.app.' + n.app) }));
}
/** Clavier du téléphone : ↑ ↓ notifications, Entrée ouvrir, Suppr ignorer, Tab onglet, Échap reposer */
function toucheTelephone() {
	if (fenetre !== 'telephone') return false;
	if (keyCode === ESCAPE) return fermer(), true;
	if (keyCode === TAB) {
		const o = ['notifs', 'agenda'].concat(directDisponible() ? ['direct'] : []);
		TELN.onglet = o[(o.indexOf(TELN.onglet) + 1) % o.length];
		TELN.focus = 0;
		annoncer(t('tel.onglet.' + TELN.onglet));
		return true;
	}
	if (TELN.onglet !== 'notifs') return keyCode === ENTER || keyCode === RETURN ? (fermer(), true) : false;
	const items = listeFocusTel();
	if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
		TELN.focus = constrain(TELN.focus + (keyCode === DOWN_ARROW ? 1 : -1), 0, Math.max(0, items.length - 1));
		const n = items[TELN.focus];
		if (n) annoncer(t('tel.app.' + n.app) + ' : ' + NotifsTel.texte(n));
		return true;
	}
	const n = items[TELN.focus];
	if ((keyCode === ENTER || keyCode === RETURN) && n) return ouvrirNotifTel(n), true;
	if ((keyCode === DELETE || keyCode === BACKSPACE) && n) return ignorerNotifTel(n), true;
	if (keyCode === ENTER || keyCode === RETURN) return fermer(), true;
	return false;
}
