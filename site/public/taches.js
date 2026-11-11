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
	const nomEvenement = (e) => String((e && e.texte_source) || '').split(' — ')[0].trim();
	const agenda = (date) => (Jeu.evenementsAffluence ? Jeu.evenementsAffluence(date) : []);

	// ——— État ———
	function nouvellePartie() {
		Jeu.taches = { jours: {}, carnet: [], demande: null, xpPartie: 0 };
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
		if (m && ((m.pluie_mm || 0) >= 5 || (m.rafales_max || 0) >= 50)) reel.push({ id: 'meteo', vars: { pluie: m.pluie_mm, vent: m.rafales_max } });
		const ev = agenda(jr.date);
		if (ev.length) reel.push({ id: 'evenement', vars: { nom: nomEvenement(ev[0]) } });
		const lignes = [...new Set(jr.dossiers.filter((d) => d.type === 'perturbation').flatMap((d) => d.lignes || []))];
		if (lignes.length) reel.push({ id: 'ligne', vars: { ligne: lignes[choix('briefing-ligne|' + jr.date, lignes.length)] } });
		const gestion = melanger([{ id: 'zero' }, { id: 'budget', vars: { seuil: 40 } }, { id: 'reputation' }], 'briefing|' + jr.date);
		return melanger(reel, 'briefing-reel|' + jr.date).concat(gestion).slice(0, 4);
	}
	/** Le briefing du jour, s'il n'a pas encore été fait : { date, options } (null sinon) */
	function briefing() {
		const jr = Jeu.jourCourant ? Jeu.jourCourant() : null;
		if (!jr || Jeu.terminee) return null;
		const j = jour(jr.date);
		if (j.briefing) return null;
		if (!j.options) j.options = optionsBriefing(jr);
		return { date: jr.date, options: j.options, meteo: Jeu.meteoDuJour ? Jeu.meteoDuJour(jr.date) : null, agenda: agenda(jr.date).map(nomEvenement), travaux: jr.dossiers.filter((d) => d.type === 'perturbation').length };
	}
	/** Retient 2 priorités (ou moins si le joueur passe) ; le patron en prend acte */
	function choisirPriorites(ids) {
		const b = briefing();
		if (!b) return null;
		const j = jour(b.date);
		j.priorites = b.options.filter((o) => (ids || []).includes(o.id)).slice(0, 2);
		j.briefing = j.priorites.length ? 'fait' : 'passe';
		j.repDebut = Jeu.jauges ? Jeu.jauges.reputation : null;
		noter('briefing', b.date);
		if (j.priorites.length && Jeu.messagePatron) Jeu.messagePatron(t('tache.briefing.patron', { liste: j.priorites.map((p) => t('tache.prio.' + p.id, p.vars)).join(Langue.actuelle === 'fr' ? ' ; ' : '; ') }), 'consigne', { priorites: j.priorites.map((p) => p.id) });
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

	// ——— Rapport du soir (§ 1) et carnet de la semaine (§ 5) ———
	/** Faits marquants proposés : tirés du journal réel de la journée (meilleure et pire décision, événement, non traité) */
	function faitsDuJour(date) {
		const ev = (Jeu.evenementsJournee || []).filter((e) => e.jour === date);
		const sujet = (e) => (e.ligne ? t('dossier.ligne', { lignes: e.ligne }) : String(e.externeCourt || ''));
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
	 * évalue les priorités du matin (bonus de réputation par priorité tenue) et écrit la ligne du carnet. */
	function validerRapport(idFait, idDemande) {
		const rp = rapport();
		if (!rp) return null;
		const j = jour(rp.date);
		const fait = rp.faits.find((f) => f.id === idFait) || rp.faits[0];
		const accordee = DEMANDES.includes(idDemande) && Jeu.jauges.reputation >= R.seuilAccord;
		const prio = (j.priorites || []).map((p) => ({ id: p.id, vars: p.vars, etat: evaluerPriorite(p, rp.date) }));
		const tenues = prio.filter((p) => p.etat === 'tenue').length;
		if (tenues) Jeu.appliquerDeltas({ reputation: tenues * R.bonusPriorite });
		j.rapport = { fait: fait.texte, demande: DEMANDES.includes(idDemande) ? idDemande : null, accordee, priorites: prio, bonus: tenues * R.bonusPriorite };
		etat().demande = j.rapport.demande ? { id: j.rapport.demande, accordee, pour: (Jeu.jourIndex || 0) + 1 } : null;
		noter('rapport', rp.date);
		etat().carnet = etat().carnet.filter((c) => c.date !== rp.date);
		etat().carnet.push({ date: rp.date, theme: j.theme || null, fait: fait.texte, priorites: prio, demande: j.rapport.demande, accordee, crise: j.crise || null });
		return j.rapport;
	}
	/** Matin : applique la demande de la veille (si accordée) et la rappelle dans les messages du patron */
	function matin() {
		const e = etat();
		const d = e.demande;
		Jeu.bonusEffectifs = {};
		Jeu.allegementObjectif = 0;
		if (!d || d.pour !== Jeu.jourIndex) return null;
		e.demande = null;
		if (d.accordee) {
			if (d.id === 'budget') Jeu.appliquerDeltas({ budget: R.demande.budget });
			if (d.id === 'equipe') Jeu.bonusEffectifs = { police: R.demande.equipe };
			if (d.id === 'calme') Jeu.allegementObjectif = R.demande.calme;
		}
		if (Jeu.messagePatron) Jeu.messagePatron(t('tache.demande.' + (d.accordee ? 'accordee' : 'refusee') + '.' + d.id, Object.assign({ seuil: R.seuilAccord }, R.demande)), d.accordee ? 'info' : 'reproche', { demande: d.id, accordee: d.accordee });
		return d;
	}

	/** Après une décision du joueur : la note au journal (rotation) */
	function apresDecision(r) {
		if (!r || !r.dossier) return null;
		if (r.dossier.contradiction) noter('verifier', r.dossier.date);
		noter('signalement', r.dossier.date);
		return null;
	}

	return { R, hacher, choix, nouvellePartie, etat, jour, noter, suiteFinale, briefing, choisirPriorites, evaluerPriorite, rapport, validerRapport, matin, apresDecision, faitsDuJour };
})();
if (typeof window !== 'undefined') window.Taches = Taches;
