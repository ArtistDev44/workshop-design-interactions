/* Nantes en régulation — prompt 88 : des tâches de nature différente, des journées qui ne se ressemblent pas.
 * Logique pure (sans p5), chargée aussi par scripts/test-jeu.mjs et scripts/mesure-repetition.mjs.
 * Règles :
 *  - chaque tâche s'appuie sur un fait réel déjà chargé (dossiers de la semaine, météo, agenda, lignes) ; sans
 *    donnée, la tâche n'est pas proposée ;
 *  - tout choix « au hasard » vient d'un hachage de la graine (comme rythme.js) : aucun appel à Jeu.alea, les dés
 *    ne bougent pas ; deux parties de même graine proposent les mêmes tâches ;
 *  - les effets sur les jauges passent par Jeu.appliquerDeltas et sont listés comme exceptions (jeu/82).
 * L'état vit dans Jeu.taches (sauvegardé avec la partie, prompt 33).
 */
const Taches = (() => {
	const R = {
		bonusPriorite: 2, // réputation par priorité du matin tenue
		seuilAccord: 50, // réputation minimale pour que le patron accorde la demande du rapport du soir
		demande: { budget: 5, equipe: 1, calme: 5 }, // budget du lendemain, +1 équipe (police), objectif allégé de 5
		info: { juste: 2, faux: -2 }, // info trafic exacte et complète / avec un bloc faux (+ plainte Community)
		prep: { cout: 3, bonus: 3, rembourse: 1 }, // préparer un événement : budget engagé tôt, réputation si utile
		suiteMax: 3, // rotation : jamais plus de 3 fois de suite le même type de tâche
		crise: { bonus: 3, debut: 16 * 60 + 30, fin: 17 * 60 + 45, minDossiers: 3 }, // cellule de crise : arrivées regroupées 16 h 30 – 17 h 45
		// Progression (§ 4) : expérience sans effet sur les jauges ; la série du prompt 74 multiplie l'expérience des décisions
		xp: { bon: 10, autre: 4, info: 8, prep: 8, priorite: 10, objectif: 15, crise: 25, defi: 20 },
		serie: { pas: 0.25, max: 1.5 },
		grades: [0, 150, 450, 900], // Stagiaire → Régulateur·rice → Régulateur·rice confirmé·e → Chef·fe de salle
		badges: ['zero_non_traite', 'info_parfaite', 'semaine_budget', 'crise_maitrisee'],
		infosPourBadge: 5,
		// Lot F — options soumises au groupe (§ 7), désactivées par défaut
		chaine: { delai: 120, marge: 30 }, // conséquence 2 h de jeu après la décision ratée, au plus tard 30 min avant la fin
		deblocages: { police: 1, prevision: 2, ambulance: 3 }, // grade requis : +1 police/jour, prévision à 1 h, +1 ambulance/jour
		previsionMin: 60,
	};

	function hacher(s) {
		let h = 0x811c9dc5;
		for (let i = 0; i < s.length; i++) {
			h ^= s.charCodeAt(i);
			h = Math.imul(h, 0x01000193);
		}
		return h >>> 0;
	}
	const choix = (cle, n) => hacher(String(Jeu.graine) + '|taches|' + cle) % n;
	function melanger(liste, cle) {
		return liste
			.map((x, i) => [x, hacher(String(Jeu.graine) + '|taches|' + cle + '|' + i)])
			.sort((a, b) => a[1] - b[1])
			.map((x) => x[0]);
	}
	const nombre = (v) => (typeof Langue !== 'undefined' && Langue.actuelle === 'fr' ? String(v).replace('.', ',') : String(v));
	const nomEvenement = (e) => String((e && e.texte_source) || '').split(' — ')[0].trim();
	const agenda = (date) => (Jeu.evenementsAffluence ? Jeu.evenementsAffluence(date) : []);

	// ——— Thème du jour (§ 2), calculé sur les faits réels de la semaine ———
	/** tempete : le jour le plus pluvieux ou venteux, s'il atteint les seuils du contexte météo (5 mm / 50 km/h) ;
	 * animee : le jour qui compte le plus d'événements d'agenda ; chantier : jours de travaux annoncés (perturbations) ;
	 * ordinaire sinon. */
	function calculerThemes() {
		const jours = Jeu.jours || [];
		const themes = {};
		const met = jours.map((j) => (Jeu.meteoDuJour && Jeu.meteoDuJour(j.date)) || {});
		const score = (m) => (m.pluie_mm || 0) / 5 + (m.rafales_max || 0) / 50;
		let iT = -1;
		met.forEach((m, i) => {
			if (((m.pluie_mm || 0) >= 5 || (m.rafales_max || 0) >= 50) && (iT < 0 || score(m) > score(met[iT]))) iT = i;
		});
		if (iT >= 0) themes[jours[iT].date] = 'tempete';
		let iA = -1;
		jours.forEach((j, i) => {
			const n = agenda(j.date).length;
			if (n && !themes[j.date] && (iA < 0 || n > agenda(jours[iA].date).length)) iA = i;
		});
		if (iA >= 0) themes[jours[iA].date] = 'animee';
		jours.forEach((j) => {
			if (!themes[j.date]) themes[j.date] = j.dossiers.some((d) => d.type === 'perturbation') ? 'chantier' : 'ordinaire';
		});
		return themes;
	}
	const SIGNATURE = { tempete: 'info', animee: 'evenement', chantier: 'info', ordinaire: null };
	const theme = (date) => (etat().themes || {})[date] || 'ordinaire';

	// ——— Cellule de crise (§ 3) : au plus une par semaine, le jour réel le plus difficile ———
	/** Difficulté d'un jour réel : nombre de signalements + météo + agenda ; il faut au moins 3 signalements.
	 * Le premier jour (prise en main) n'est pas choisi s'il y a un autre candidat. */
	function choisirJourCrise() {
		const jours = Jeu.jours || [];
		const diff = (j) => {
			const m = (Jeu.meteoDuJour && Jeu.meteoDuJour(j.date)) || {};
			return j.dossiers.length + (m.pluie_mm || 0) / 5 + (m.rafales_max || 0) / 50 + agenda(j.date).length / 2;
		};
		const cands = jours.filter((j) => j.dossiers.length >= R.crise.minDossiers);
		const pool = cands.length > 1 ? cands.filter((j) => j !== jours[0]) : cands;
		if (!pool.length) return null;
		return pool.reduce((a, b) => (diff(b) > diff(a) ? b : a)).date;
	}
	/** « Plusieurs signalements arrivent en peu de temps » : les créneaux de jeu des dossiers SANS heure réelle sont
	 * regroupés dans la fenêtre de crise (l'heure réelle, quand elle existe, n'est jamais modifiée). Partie neuve seulement. */
	function regrouperCrise(date) {
		const j = (Jeu.jours || []).find((x) => x.date === date);
		if (!j || Jeu.index !== 0 || (Jeu.etat && Jeu.etat.mode === 'direct')) return 0;
		const sans = j.dossiers.filter((d) => !d.heure);
		const pas = sans.length > 1 ? (R.crise.fin - R.crise.debut) / (sans.length - 1) : 0;
		sans.forEach((d, i) => (d.minute = Math.round(R.crise.debut + i * pas)));
		j.dossiers.sort((a, b) => a.minute - b.minute);
		Jeu.paquet = Jeu.jours.flatMap((x) => x.dossiers);
		Jeu.etat.dossiers = Jeu.paquet;
		return sans.length;
	}
	/** Crise du jour (ou null) : { date, objectif atteint ? } ; active entre le début de la fenêtre et la fin de la journée */
	function crise(date) {
		const e = etat();
		const d = date || (Jeu.jourCourant() || {}).date;
		return e.crise && e.crise.date === d ? e.crise : null;
	}
	const criseActive = () => {
		const c = crise();
		return !!(c && !c.resultat && Jeu.horloge && Jeu.horloge.minutes >= R.crise.debut);
	};

	// ——— Carrière (§ 4) : expérience, grade et badges, gardés entre les parties (localStorage), réinitialisables ———
	const CLE_CARRIERE = 'pxe-nte001-carriere';
	let carriereMemoire = null; // repli sans localStorage (tests, navigation privée)
	const carriereVide = () => ({ xp: 0, badges: {}, infosParfaites: 0, jours: [] });
	function carriere() {
		if (carriereMemoire) return carriereMemoire;
		let c = null;
		try {
			c = JSON.parse(localStorage.getItem(CLE_CARRIERE) || 'null');
		} catch (e) {}
		carriereMemoire = Object.assign(carriereVide(), c || {});
		return carriereMemoire;
	}
	function sauverCarriere() {
		try {
			localStorage.setItem(CLE_CARRIERE, JSON.stringify(carriere()));
		} catch (e) {}
	}
	function reinitialiserCarriere() {
		carriereMemoire = carriereVide();
		sauverCarriere();
		return carriereMemoire;
	}
	const gradeDe = (xp) => R.grades.reduce((g, seuil, i) => (xp >= seuil ? i : g), 0);
	function grade() {
		const c = carriere();
		const i = gradeDe(c.xp);
		return { i, xp: c.xp, prochain: R.grades[i + 1] === undefined ? null : R.grades[i + 1] };
	}
	/** Expérience d'une journée, calculée sur ses faits (décisions évaluées, tâches réussies, priorités, objectif, crise) */
	function xpJour(date, j, extra) {
		const ev = (Jeu.evenementsJournee || []).filter((e) => e.jour === date);
		const lignes = [];
		let serie = 0;
		let dec = 0;
		ev.forEach((e) => {
			const v = Jeu.evaluer(e);
			if (e.cleAction === 'temps') return (serie = 0);
			serie = v === 'bon' ? serie + 1 : 0;
			const mult = Math.min(R.serie.max, 1 + R.serie.pas * Math.max(0, serie - 1));
			dec += Math.round((v === 'bon' ? R.xp.bon : R.xp.autre) * mult);
		});
		if (dec) lignes.push({ cle: 'xp.decisions', v: dec, n: ev.length });
		if (j.infoJustes) lignes.push({ cle: 'xp.info', v: j.infoJustes * R.xp.info, n: j.infoJustes });
		if (j.prep && j.prep.resultat === 'utile') lignes.push({ cle: 'xp.prep', v: R.xp.prep });
		const tenues = (extra.priorites || []).filter((p) => p.etat === 'tenue').length;
		if (tenues) lignes.push({ cle: 'xp.priorites', v: tenues * R.xp.priorite, n: tenues });
		const obj = (Jeu.objectifsResultats || []).find((o) => o.jourIndex === Jeu.jourIndex);
		if (obj && obj.atteint) lignes.push({ cle: 'xp.objectif', v: R.xp.objectif });
		if (extra.crise === 'maitrisee') lignes.push({ cle: 'xp.crise', v: R.xp.crise });
		const defis = Jeu.defisAppliques && Jeu.jourIndex >= (Jeu.jours || []).length - 1 ? Jeu.defisAppliques.filter((d) => d.tenu).length : 0;
		if (defis) lignes.push({ cle: 'xp.defis', v: defis * R.xp.defi, n: defis });
		return { total: lignes.reduce((a, l) => a + l.v, 0), lignes };
	}
	/** Badges gagnés ce jour (faits de la partie) ; un badge compte ses obtentions */
	function badgesJour(date, j, extra) {
		const c = carriere();
		const gagnes = [];
		const ev = (Jeu.evenementsJournee || []).filter((e) => e.jour === date);
		if (ev.length && !ev.some((e) => e.cleAction === 'temps')) gagnes.push('zero_non_traite');
		if (j.infoJustes) {
			const avant = c.infosParfaites;
			c.infosParfaites += j.infoJustes;
			if (avant < R.infosPourBadge && c.infosParfaites >= R.infosPourBadge) gagnes.push('info_parfaite');
		}
		if (extra.crise === 'maitrisee') gagnes.push('crise_maitrisee');
		const dernier = Jeu.jourIndex >= (Jeu.jours || []).length - 1;
		if (dernier && !(Jeu.malus && Jeu.malus.budget_epuise) && Jeu.jauges.budget >= 30) gagnes.push('semaine_budget');
		gagnes.forEach((b) => {
			const x = c.badges[b] || { n: 0, le: null };
			c.badges[b] = { n: x.n + 1, le: date };
		});
		return gagnes;
	}
	/** Verse l'expérience et les badges du jour dans la carrière, une seule fois par journée de partie */
	function verserJour(date, j, extra) {
		const c = carriere();
		const cle = String(Jeu.graine) + '|' + date;
		const x = xpJour(date, j, extra);
		const avant = grade().i;
		let badges = [];
		if (!c.jours.includes(cle)) {
			c.jours = c.jours.concat([cle]).slice(-60);
			c.xp += x.total;
			badges = badgesJour(date, j, extra);
			sauverCarriere();
		}
		etat().xpPartie = (etat().xpPartie || 0) + (j.xp ? 0 : x.total);
		j.xp = x;
		j.badges = badges;
		return { xp: x, badges, grade: grade(), monte: grade().i > avant };
	}

	// ——— État ———
	function nouvellePartie(options) {
		const o = options || {};
		Jeu.taches = { jours: {}, demande: null, xpPartie: 0, themes: {}, crise: null, options: { chaines: !!o.chaines, deblocages: !!o.deblocages, arbitrage: !!o.arbitrage }, arbitrage: null };
		Jeu.taches.themes = calculerThemes();
		const dc = Jeu.jours && Jeu.jours.length > 1 ? choisirJourCrise() : null;
		if (dc) {
			Jeu.taches.crise = { date: dc, regroupes: regrouperCrise(dc), resultat: null };
		}
		if (Jeu.taches.options.arbitrage && Jeu.jours && Jeu.jours.length > 2) {
			// Arbitrage hebdomadaire : un jour tiré par la graine, ni le premier ni le jour de crise
			const pool = Jeu.jours.slice(1).filter((j) => j.date !== dc);
			if (pool.length) Jeu.taches.arbitrage = { date: pool[choix('arbitrage', pool.length)].date, choix: null };
		}
		return Jeu.taches;
	}
	function etat() {
		return Jeu.taches || nouvellePartie();
	}
	function jour(date) {
		const j = Jeu.jourCourant ? Jeu.jourCourant() : null;
		const d = date || (j && j.date);
		if (!d) return null;
		const e = etat();
		if (!e.jours[d]) e.jours[d] = { journal: [], options: null, priorites: null, briefing: null, rapport: null, repDebut: null, offertes: {} };
		return e.jours[d];
	}
	/** Journal des tâches jouées dans la journée (rotation, mesure) */
	function noter(type, date) {
		const j = jour(date);
		if (j) j.journal.push(type);
	}
	/** Nombre de fois que le dernier type se répète à la fin du journal */
	function suiteFinale(journal) {
		let n = 0;
		const der = journal[journal.length - 1];
		for (let i = journal.length - 1; i >= 0 && journal[i] === der; i--) n++;
		return { type: der, n };
	}

	// ——— Briefing du matin (§ 1) ———
	/** Priorités proposées : d'abord celles fondées sur un fait réel du jour (météo, agenda, travaux annoncés), puis des
	 * priorités de gestion toujours possibles ; 4 au plus, ordre tiré par la graine. */
	function optionsBriefing(jr) {
		const reel = [];
		const m = (Jeu.meteoDuJour && Jeu.meteoDuJour(jr.date)) || null;
		if (m && ((m.pluie_mm || 0) >= 5 || (m.rafales_max || 0) >= 50)) reel.push({ id: 'meteo', vars: { pluie: nombre(m.pluie_mm), vent: nombre(m.rafales_max) } });
		const ev = agenda(jr.date);
		if (ev.length) reel.push({ id: 'evenement', vars: { nom: nomEvenement(ev[0]) } });
		const lignes = [...new Set(jr.dossiers.filter((d) => d.type === 'perturbation').flatMap((d) => d.lignes || []))];
		if (lignes.length) reel.push({ id: 'ligne', vars: { ligne: lignes[choix('briefing-ligne|' + jr.date, lignes.length)] } });
		const gestion = melanger([{ id: 'zero' }, { id: 'budget', vars: { seuil: 40 } }, { id: 'reputation' }], 'briefing|' + jr.date);
		return melanger(reel, 'briefing-reel|' + jr.date).concat(gestion).slice(0, 4);
	}
	/** Prompt 91 § 4 : les priorités sont IMPOSÉES par le patron (2 par journée, 3 au bout de 4 jours joués), calculées
	 * sur les faits réels du jour (météo, agenda, travaux annoncés d'abord). Plus de fenêtre de choix. */
	const nbPriorites = () => ((etat().joursJoues || 0) >= 4 ? 3 : 2);
	function imposerPriorites() {
		const jr = Jeu.jourCourant ? Jeu.jourCourant() : null;
		if (!jr || Jeu.terminee) return null;
		const j = jour(jr.date);
		if (j.briefing) return j.priorites;
		j.options = optionsBriefing(jr);
		j.priorites = j.options.slice(0, nbPriorites());
		j.briefing = 'impose';
		j.repDebut = Jeu.jauges ? Jeu.jauges.reputation : null;
		noter('briefing', jr.date);
		const txt = t('tache.prio.imposees', { liste: j.priorites.map((p) => t('tache.prio.' + p.id, p.vars)).join(typeof Langue !== 'undefined' && Langue.actuelle === 'fr' ? ' ; ' : '; ') });
		const consigne = (Jeu.messagesPatron || []).slice().reverse().find((x) => x.type === 'consigne' && x.jour === jr.date);
		if (consigne) {
			consigne.texte = String(consigne.texte) + ' ' + txt;
			consigne.meta = Object.assign({}, consigne.meta, { priorites: j.priorites.map((p) => p.id) });
		} else if (Jeu.messagePatron) Jeu.messagePatron(txt, 'consigne', { priorites: j.priorites.map((p) => p.id) });
		return j.priorites;
	}
	const prioritesDuJour = (date) => {
		const j = jour(date);
		return (j && j.priorites) || [];
	};
	/** Le briefing du jour, s'il n'a pas encore été fait : { date, options } (null sinon) — prompt 91 : plus de choix */
	function briefing() {
		return null;
	}
	function briefingAncien() {
		const jr = Jeu.jourCourant ? Jeu.jourCourant() : null;
		if (!jr || Jeu.terminee) return null;
		const j = jour(jr.date);
		if (j.briefing) return null;
		if (!j.options) j.options = optionsBriefing(jr);
		return { date: jr.date, options: j.options, meteo: Jeu.meteoDuJour ? Jeu.meteoDuJour(jr.date) : null, agenda: agenda(jr.date).map(nomEvenement), travaux: jr.dossiers.filter((d) => d.type === 'perturbation').length };
	}
	/** Retient 2 priorités (ou moins si le joueur passe) ; le patron en prend acte */
	function choisirPriorites(ids) {
		const b = briefingAncien(); // prompt 91 : plus utilisé en jeu (priorités imposées) ; gardé pour les tests et les anciennes sauvegardes
		if (!b) return null;
		const j = jour(b.date);
		j.priorites = b.options.filter((o) => (ids || []).includes(o.id)).slice(0, 2);
		j.briefing = j.priorites.length ? 'fait' : 'passe';
		j.repDebut = Jeu.jauges ? Jeu.jauges.reputation : null;
		noter('briefing', b.date);
		if (j.priorites.length) {
			const txt = t('tache.briefing.patron', { liste: j.priorites.map((p) => t('tache.prio.' + p.id, p.vars)).join(Langue.actuelle === 'fr' ? ' ; ' : '; ') });
			// Le patron prend acte dans la consigne du jour (le ton de ses messages suit les priorités) — pas un message de plus
			const consigne = (Jeu.messagesPatron || []).slice().reverse().find((x) => x.type === 'consigne' && x.jour === b.date);
			if (consigne) {
				consigne.texte = String(consigne.texte) + ' ' + txt;
				consigne.meta = Object.assign({}, consigne.meta, { priorites: j.priorites.map((p) => p.id) });
			} else if (Jeu.messagePatron) Jeu.messagePatron(txt, 'consigne', { priorites: j.priorites.map((p) => p.id) });
		}
		return j.priorites;
	}
	/** Une priorité est-elle tenue ? Calcul sur le journal réel de la journée : 'tenue' | 'manquee' | 'sansObjet' */
	function evaluerPriorite(p, date) {
		const ev = (Jeu.evenementsJournee || []).filter((e) => e.jour === date);
		const rate = (e) => e.cleAction === 'temps' || Jeu.evaluer(e) === 'rate';
		const sur = (liste) => (liste.length ? (liste.some(rate) ? 'manquee' : 'tenue') : 'sansObjet');
		if (p.id === 'meteo') return sur(ev.filter((e) => e.resultat && e.resultat.contexte && e.resultat.contexte.meteo));
		if (p.id === 'evenement') return sur(ev.filter((e) => e.resultat && e.resultat.dossier && e.resultat.dossier.type === 'événement'));
		if (p.id === 'ligne') return sur(ev.filter((e) => e.ligne && String(e.ligne).split(', ').includes(p.vars.ligne)));
		if (p.id === 'zero') return ev.length ? (ev.some((e) => e.cleAction === 'temps') ? 'manquee' : 'tenue') : 'sansObjet';
		if (p.id === 'budget') return Jeu.jauges.budget >= p.vars.seuil ? 'tenue' : 'manquee';
		if (p.id === 'reputation') {
			const j = jour(date);
			return j.repDebut === null || Jeu.jauges.reputation >= j.repDebut ? 'tenue' : 'manquee';
		}
		return 'sansObjet';
	}

	// ——— Rapport du soir (§ 1) ———
	/** Faits marquants proposés : tirés du journal réel de la journée (meilleure et pire décision, événement, non traité) */
	function faitsDuJour(date) {
		const ev = (Jeu.evenementsJournee || []).filter((e) => e.jour === date);
		const sujet = (e) => marquerFictif(e, e.ligne ? t('dossier.ligne', { lignes: e.ligne }) : String(e.externeCourt || '')); // prompt 162 : le fait marquant garde « Fictif »
		const faits = [];
		const bon = ev.find((e) => e.cleAction !== 'temps' && Jeu.evaluer(e) === 'bon');
		if (bon) faits.push({ id: 'bon', texte: t('tache.fait.bon', { heure: bon.heure || '—', sujet: sujet(bon), action: String(bon.action) }) });
		const rate = ev.find((e) => e.cleAction !== 'temps' && Jeu.evaluer(e) === 'rate');
		if (rate) faits.push({ id: 'rate', texte: t('tache.fait.rate', { heure: rate.heure || '—', sujet: sujet(rate), meilleure: String(rate.meilleureAction) }) });
		const temps = ev.filter((e) => e.cleAction === 'temps');
		if (temps.length) faits.push({ id: 'nonTraite', texte: t('tache.fait.nonTraite', { n: temps.length }) });
		const ag = agenda(date);
		if (ag.length) faits.push({ id: 'agenda', texte: t('tache.fait.agenda', { nom: nomEvenement(ag[0]) }) });
		if (!faits.length) faits.push({ id: 'calme', texte: t('tache.fait.calme', { n: ev.length }) });
		return faits.slice(0, 4);
	}
	const DEMANDES = ['budget', 'equipe', 'calme'];
	function rapport() {
		const jr = Jeu.jourCourant ? Jeu.jourCourant() : null;
		if (!jr) return null;
		const j = jour(jr.date);
		if (j.rapport) return null;
		return { date: jr.date, faits: faitsDuJour(jr.date), demandes: DEMANDES.map((id) => ({ id, vars: R.demande })) };
	}
	/** Valide le rapport : fait marquant + demande au patron (accordée selon la réputation, appliquée le lendemain) ;
	 * évalue les priorités du matin (bonus de réputation par priorité tenue). Prompt 142 : plus de carnet. */
	function validerRapport(idFait, idDemande) {
		const rp = rapport();
		if (!rp) return null;
		const j = jour(rp.date);
		const fait = rp.faits.find((f) => f.id === idFait) || rp.faits[0];
		const accordee = DEMANDES.includes(idDemande) && Jeu.jauges.reputation >= R.seuilAccord;
		const prio = (j.priorites || []).map((p) => ({ id: p.id, vars: p.vars, etat: evaluerPriorite(p, rp.date) }));
		const tenues = prio.filter((p) => p.etat === 'tenue').length;
		const c = crise(rp.date);
		if (c && !c.resultat) {
			// Objectif de la cellule de crise : aucun signalement du jour laissé « non traité »
			const ev = (Jeu.evenementsJournee || []).filter((e) => e.jour === rp.date);
			c.resultat = ev.length && !ev.some((e) => e.cleAction === 'temps') ? 'maitrisee' : 'debordee';
			if (c.resultat === 'maitrisee') Jeu.appliquerDeltas({ reputation: R.crise.bonus });
		}
		if (j.prep && !j.prep.resultat) {
			j.prep.resultat = 'sansSuite'; // l'affluence n'a pas été traitée : une partie du budget revient
			Jeu.appliquerDeltas({ budget: R.prep.rembourse });
		}
		if (tenues) Jeu.appliquerDeltas({ reputation: tenues * R.bonusPriorite });
		j.rapport = { fait: fait.texte, demande: DEMANDES.includes(idDemande) ? idDemande : null, accordee, priorites: prio, bonus: tenues * R.bonusPriorite };
		etat().demande = j.rapport.demande ? { id: j.rapport.demande, accordee, pour: (Jeu.jourIndex || 0) + 1 } : null;
		noter('rapport', rp.date);
		etat().joursJoues = (etat().joursJoues || 0) + 1; // prompt 91 § 4 : 3 priorités au bout de 4 jours joués
		j.recap = verserJour(rp.date, j, { priorites: prio, crise: c ? c.resultat : null });
		return j.rapport;
	}
	/** Matin : applique la demande de la veille (si accordée) et la rappelle dans les messages du patron */
	function matin() {
		const e = etat();
		const d = e.demande;
		Jeu.bonusEffectifs = {};
		Jeu.allegementObjectif = 0;
		const ajouter = (k, v) => (Jeu.bonusEffectifs[k] = (Jeu.bonusEffectifs[k] || 0) + v);
		if (e.options && e.options.deblocages) {
			const g = grade().i;
			if (g >= R.deblocages.police) ajouter('police', 1);
			if (g >= R.deblocages.ambulance) ajouter('ambulance', 1);
		}
		if (e.arbitrage && e.arbitrage.choix === 'equipes' && e.arbitrage.jourChoix < (Jeu.jourIndex || 0)) ajouter('police', 1);
		const jr = Jeu.jourCourant ? Jeu.jourCourant() : null;
		const j = jr ? jour(jr.date) : null;
		if (j && !j.themeAnnonce && Jeu.messagePatron) {
			// Le thème du jour donne le ton de la consigne (fait réel cité) ; la crise est annoncée le matin même
			j.themeAnnonce = true;
			j.theme = theme(jr.date);
			const m = (Jeu.meteoDuJour && Jeu.meteoDuJour(jr.date)) || {};
			const ag = agenda(jr.date);
			if (!(crise(jr.date) && j.theme === 'ordinaire')) {
				const txt = t('theme.patron.' + j.theme, { pluie: nombre(m.pluie_mm), vent: nombre(m.rafales_max), n: ag.length, nom: ag.length ? nomEvenement(ag[0]) : '', travaux: jr.dossiers.filter((x) => x.type === 'perturbation').length });
				// Le thème complète la consigne du jour (même message) : pas un message de plus à lire
				const consigne = (Jeu.messagesPatron || []).slice().reverse().find((x) => x.type === 'consigne' && x.jour === jr.date && !(x.meta && x.meta.theme));
				if (consigne) {
					consigne.texte = String(consigne.texte) + ' ' + txt;
					consigne.meta = Object.assign({}, consigne.meta, { theme: j.theme });
				} else Jeu.messagePatron(txt, 'consigne', { theme: j.theme });
			}
			if (crise(jr.date)) {
				j.crise = true;
				Jeu.messagePatron(t('crise.annonce', { n: jr.dossiers.length }), 'alerte', { crise: true });
			}
		}
		imposerPriorites(); // prompt 91 § 4 : le patron impose les priorités du jour
		if (!d || d.pour !== Jeu.jourIndex) return null;
		e.demande = null;
		if (d.accordee) {
			if (d.id === 'budget') Jeu.appliquerDeltas({ budget: R.demande.budget });
			if (d.id === 'equipe') ajouter('police', R.demande.equipe);
			if (d.id === 'calme') Jeu.allegementObjectif = R.demande.calme;
		}
		const txt = t('tache.demande.' + (d.accordee ? 'accordee' : 'refusee') + '.' + d.id, Object.assign({ seuil: R.seuilAccord }, R.demande));
		// La réponse à la demande d'hier complète la consigne du jour (un message de moins à lire)
		const consigne = jr && (Jeu.messagesPatron || []).slice().reverse().find((x) => x.type === 'consigne' && x.jour === jr.date);
		if (consigne) {
			consigne.texte = String(consigne.texte) + ' ' + txt;
			consigne.meta = Object.assign({}, consigne.meta, { demande: d.id, accordee: d.accordee });
		} else if (Jeu.messagePatron) Jeu.messagePatron(txt, d.accordee ? 'info' : 'reproche', { demande: d.id, accordee: d.accordee });
		return d;
	}

	// ——— Rédiger l'info trafic (§ 1) : 4 blocs, chacun 3 propositions dont 1 exacte, tirées des dossiers réels ———
	const FAMILLES_ALT = ['devier', 'retenir', 'renfort', 'rien'];
	function causeDe(d) {
		if (d.type === 'ligne en difficulté') return t(Jeu.retardEffectif(d) !== null && Jeu.retardEffectif(d) !== undefined ? 'tache.cause.retard' : 'tache.cause.retardSignale'); // prompt 162 : « mesuré » seulement si un retard est connu
		if (d.type === 'événement') return t('tache.cause.affluence', { nom: nomEvenement(d) });
		if (d.type === 'alerte météo') return t('tache.cause.meteo', { nature: d.nature });
		return String(d.nature || '').split(',')[0].trim() || t('carte.nonRenseigne');
	}
	const ligneDe = (d) => (d.lignes && d.lignes.length ? t('tache.info.ligne', { ligne: d.lignes[0] }) : t('tache.info.ligneInconnue'));
	function dureeDe(d, r) {
		const re = r && r.retardEffectif !== undefined ? r.retardEffectif : Jeu.retardEffectif(d);
		return re !== null && re !== undefined ? t('tache.info.duree', { min: re }) : t('tache.info.dureeInconnue');
	}
	/** 3 propositions : l'exacte + 2 autres prises dans les autres dossiers réels de la semaine (ordre tiré par la graine) */
	function bloc(id, exacte, autres, cle) {
		const pool = [...new Set(autres.filter((x) => x && x !== exacte))];
		const leurres = melanger(pool, cle + '|leurres').slice(0, 2);
		const options = melanger([exacte].concat(leurres), cle);
		return { id, options, bonne: options.indexOf(exacte) };
	}
	function tacheInfo(r, n) {
		const d = r.dossier;
		const autres = (Jeu.paquet || []).filter((x) => x !== d);
		const fam = Jeu.familleDe ? Jeu.familleDe(r.action) : r.action;
		const famille = FAMILLES_ALT.includes(fam) ? fam : 'rien';
		const blocs = [
			// Leurres : lignes des autres dossiers de la semaine, sinon lignes réelles du réseau (data/lignes.json)
			bloc('ligne', ligneDe(d), autres.map(ligneDe).concat([t('tache.info.ligneInconnue')], ((Jeu.lignes && Jeu.lignes.lignes) || []).slice(0, 12).map((x) => t('tache.info.ligne', { ligne: x.nom }))), 'info-ligne|' + n),
			bloc('cause', causeDe(d), autres.map(causeDe), 'info-cause|' + n),
			bloc('duree', dureeDe(d, r), [10, 20, 30, 45].map((m) => t('tache.info.duree', { min: m })).concat([t('tache.info.dureeInconnue')]), 'info-duree|' + n),
			bloc('alternative', t('tache.alt.' + famille), FAMILLES_ALT.map((f) => t('tache.alt.' + f)), 'info-alt|' + n),
		];
		return { type: 'info', index: n, date: d.date, sujet: String(marquerFictif(d, d.lignes && d.lignes.length ? t('dossier.ligne', { lignes: d.lignes.join(', ') }) : causeDe(d))), action: String(r.nomAction || ''), blocs };
	}

	// ——— Préparer un événement (§ 1) : l'agenda annonce un événement et son affluence n'est pas encore arrivée ———
	function tachePreparation(date, apres) {
		const j = jour(date);
		if (j.offertes.evenement) return null;
		const d = (Jeu.paquet || []).find((x, i) => i > apres && x.date === date && x.type === 'événement');
		if (!d) return null; // pas d'affluence à venir aujourd'hui : la tâche n'est pas proposée
		return { type: 'evenement', date, index: Jeu.paquet.indexOf(d), nom: nomEvenement(d), heure: Jeu.formaterHeure ? Jeu.formaterHeure(d.minute) : '', options: ['police', 'vehicule', 'rien'] };
	}
	/** La réponse choisie sur le dossier préparé correspond-elle à la préparation ? */
	function preparationUtile(prep, r) {
		const rep = Jeu.reponse ? Jeu.reponse(r.dossier, r.action) : null;
		const fam = Jeu.familleDe ? Jeu.familleDe(r.action) : r.action;
		if (prep.choix === 'police') return !!(rep && rep.equipe === 'police');
		if (prep.choix === 'vehicule') return fam === 'renfort';
		return false;
	}

	/** Après une décision du joueur : journal (rotation), effet d'une préparation, et tâche courte éventuelle.
	 * Rotation : après 3 signalements d'affilée, une tâche d'une autre nature est proposée d'office ; sinon une
	 * décision sur deux environ (tirage par la graine) — « certaines décisions, pas toutes ». */
	function apresDecision(r, n) {
		if (!r || !r.dossier) return null;
		const date = r.dossier.date;
		const j = jour(date);
		if (r.dossier.contradiction) noter('verifier', date);
		noter('signalement', date);
		const prep = j.prep;
		if (prep && prep.index === Jeu.paquet.indexOf(r.dossier) && !prep.resultat) {
			prep.resultat = preparationUtile(prep, r) ? 'utile' : 'inutile';
			if (prep.resultat === 'utile') Jeu.appliquerDeltas({ reputation: R.prep.bonus });
			else Jeu.appliquerDeltas({ budget: R.prep.rembourse }); // budget perdu en partie seulement
		}
		const e0 = etat();
		const arb = e0.arbitrage && e0.arbitrage.choix;
		if (arb === 'vehicules' && Jeu.familleDe && Jeu.familleDe(r.action) === 'renfort') Jeu.appliquerDeltas({ budget: 1 }); // véhicules réservés : renfort moins cher
		if (arb === 'communication' && (r.communique || ((Jeu.reponse && Jeu.reponse(r.dossier, r.action)) || {}).communique)) Jeu.appliquerDeltas({ reputation: 1 });
		if (e0.options && e0.options.chaines) creerChaine(r, j);
		const suite = suiteFinale(j.journal);
		const doit = suite.type === 'signalement' && suite.n >= R.suiteMax - 1; // la tâche s'intercale avant d'atteindre le plafond
		const p = tachePreparation(date, Jeu.paquet.indexOf(r.dossier));
		const sig = SIGNATURE[theme(date)];
		const premiere = !j.journal.some((x) => x === 'info' || x === 'evenement');
		if (p && (doit || sig === 'evenement' || choix('prep|' + n, 2) === 0)) {
			j.offertes.evenement = true;
			return p;
		}
		const calme = (Jeu.jours || []).some((x) => x.date === date && x.dossiers.length <= 2); // journée calme : la tâche courte est toujours proposée
		// Prompt 91 : la tâche « rédiger l'info trafic » est remplacée par la publication Community depuis le dossier (§ 3)
		void doit, calme, premiere;
		return null;
	}
	// ——— Lot F : événements chaînés (option) — une conséquence de jeu, ÉTIQUETÉE comme telle, jamais un fait réel ———
	/** Une décision « ratée » sur une ligne peut saturer cette ligne plus tard dans la journée (au plus 1 chaîne par jour).
	 * Le dossier créé reprend la ligne et le retard effectif réels (prompt 79) ; sa source dit « conséquence de votre
	 * décision de HH:MM ». Il est ajouté après les dossiers restants du jour (les index déjà présentés ne bougent pas). */
	function creerChaine(r, j) {
		const d = r.dossier;
		if (j.chaine || d.consequence || !(d.lignes && d.lignes.length)) return null;
		const e = (Jeu.evenementsJournee || []).find((x) => x.resultat === r);
		if (!e || Jeu.evaluer(e) !== 'rate') return null;
		const jr = (Jeu.jours || []).find((x) => x.date === d.date);
		if (!jr) return null;
		const fin = (jr.fin || (Jeu.finJournee ? Jeu.finJournee() : 1200)) - R.chaine.marge;
		const quand = r.minuteSim !== null && r.minuteSim !== undefined ? r.minuteSim : Jeu.horloge ? Jeu.horloge.minutes : d.minute;
		const restants = jr.dossiers.filter((x) => Jeu.paquet.indexOf(x) >= Jeu.index);
		const minute = Math.max(quand + R.chaine.delai, ...restants.map((x) => x.minute));
		if (minute > fin) return null; // trop tard dans la journée : pas de chaîne
		const heure = Jeu.formaterHeure(quand);
		const retard = Math.max(10, Jeu.retardEffectif(d) || 0);
		const c = {
			id: 'chaine-' + d.date + '-' + d.lignes[0],
			type: 'ligne en difficulté',
			date: d.date,
			heure: null,
			minute,
			lignes: [d.lignes[0]],
			retard,
			nature: t('chaine.nature'),
			texte_source: t('chaine.texte', { heure, ligne: d.lignes[0], retard }),
			source: t('chaine.source', { heure }),
			consequence: { heure, ligne: d.lignes[0], origine: Jeu.paquet.indexOf(d) },
			contradiction: null,
		};
		const apres = restants.length ? Jeu.paquet.indexOf(restants[restants.length - 1]) + 1 : Jeu.index;
		Jeu.paquet.splice(apres, 0, c);
		jr.dossiers.push(c);
		Jeu.etat.dossiers = Jeu.paquet;
		j.chaine = { heure, ligne: d.lignes[0], minute };
		return c;
	}
	// ——— Lot F : prévision à 1 h (déblocage, option) et arbitrage hebdomadaire du budget (option) ———
	function prevision() {
		const e = etat();
		if (!(e.options && e.options.deblocages) || grade().i < R.deblocages.prevision || !Jeu.horloge) return null;
		const d = Jeu.prochainDuJour ? Jeu.prochainDuJour() : null;
		if (!d || d.minute <= Jeu.horloge.minutes || d.minute - Jeu.horloge.minutes > R.previsionMin) return null;
		return { type: d.type, minute: d.minute, gravite: Jeu.gravite ? Jeu.gravite(d) : null };
	}
	/** Tâche d'arbitrage du jour (si l'option est active et que c'est le jour tiré) */
	function arbitrage() {
		const e = etat();
		const jr = Jeu.jourCourant ? Jeu.jourCourant() : null;
		if (!e.arbitrage || e.arbitrage.choix || !jr || e.arbitrage.date !== jr.date) return null;
		return { type: 'arbitrage', date: jr.date, budget: Jeu.jauges.budget, options: ['vehicules', 'equipes', 'communication'] };
	}

	/** Bonne réponse d'une tâche (simulation, tests) */
	function bonneReponse(tache) {
		if (tache.type === 'info') return tache.blocs.map((b) => b.bonne);
		if (tache.type === 'evenement') return 'police';
		return null;
	}
	/** Résout une tâche courte ; reponse = null → passée (aucun effet). Renvoie { ok, effets, textes } */
	function resoudre(tache, reponse) {
		const j = jour(tache.date);
		noter(tache.type, tache.date);
		if (tache.type === 'info') {
			const textes = [t('tache.info.contexte', { sujet: tache.sujet, action: tache.action })]; // phrase montrée (les blocs sont des boutons)
			if (!reponse) return { ok: null, textes };
			const juste = tache.blocs.every((b, i) => reponse[i] === b.bonne);
			const e = etat();
			e.infos = e.infos || { publiees: 0, parfaites: 0 };
			e.infos.publiees++;
			if (juste) {
				e.infos.parfaites++;
				j.infoJustes = (j.infoJustes || 0) + 1;
				Jeu.appliquerDeltas({ reputation: R.info.juste });
			} else {
				Jeu.appliquerDeltas({ reputation: R.info.faux });
				plainteInfo(tache);
			}
			j.info = (j.info || 0) + 1;
			return { ok: juste, effets: { reputation: juste ? R.info.juste : R.info.faux }, textes, faux: tache.blocs.map((b, i) => reponse[i] !== b.bonne) };
		}
		if (tache.type === 'arbitrage') {
			const textes = [t('tache.arbitrage.contexte', { budget: tache.budget })];
			etat().arbitrage.choix = reponse || 'aucun';
			etat().arbitrage.jourChoix = Jeu.jourIndex || 0;
			return { ok: reponse ? true : null, textes };
		}
		if (tache.type === 'evenement') {
			const textes = [t('tache.prep.contexte', { nom: tache.nom, heure: tache.heure })];
			if (!reponse || reponse === 'rien') return { ok: null, textes };
			Jeu.appliquerDeltas({ budget: -R.prep.cout });
			j.prep = { choix: reponse, index: tache.index, nom: tache.nom, resultat: null };
			return { ok: true, effets: { budget: -R.prep.cout }, textes };
		}
		return null;
	}
	/** Info trafic avec un bloc faux : un usager (pseudonyme fictif) le signale sur Community */
	function plainteInfo(tache) {
		const def = Jeu.MESSAGES && Jeu.MESSAGES.plaintes.find((p) => p.id === 'info_erronee');
		if (!def || !Jeu.plaintes) return null;
		const plainte = { id: def.id, def, vars: { sujet: tache.sujet }, index: tache.index, heure: Jeu.horloge ? Jeu.formaterHeure(Jeu.horloge.minutes) : '', auteur: def.auteur, reponse: null };
		Jeu.plaintes.push(plainte);
		if (Jeu.nonLus) Jeu.nonLus.community++;
		return plainte;
	}

	return { R, briefingAncien, imposerPriorites, prioritesDuJour, nbPriorites, causeDe, ligneDe, dureeDe, prevision, arbitrage, creerChaine, carriere, reinitialiserCarriere, grade, gradeDe, xpJour, theme, crise, criseActive, calculerThemes, choisirJourCrise, SIGNATURE, hacher, choix, nouvellePartie, etat, jour, noter, suiteFinale, briefing, choisirPriorites, evaluerPriorite, rapport, validerRapport, matin, apresDecision, faitsDuJour, bonneReponse, resoudre, tacheInfo, tachePreparation };
})();
if (typeof window !== 'undefined') window.Taches = Taches;
