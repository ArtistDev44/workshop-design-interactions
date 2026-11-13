/* Nantes en régulation — posture du joueur et dix fins de semaine (prompt 207).
 * Exception à Q47–Q55 (jeu/04-jauges-et-fins.md) : la fin ne dépend plus du seul score mais aussi des gestes du joueur
 * (clashs, réponses Community, cafés, siestes, départs anticipés, objectifs du jour, qualité des décisions).
 * Table évaluée dans l'ordre, la première condition vraie gagne ; démission (prompt 47) et licenciement (prompt 84)
 * inchangés, hors table. Le palier de score (Jeu.typeFin : bonne / moyenne / mauvaise) garde le décor, le son et la
 * cinématique (Q53). Aucun chiffre inventé : tout ce qui est cité vient de Jeu.signauxPosture() (état réel de la partie).
 * Chargé après game.js et personnages.js (Jeu.messagePatron avec le ton), avant soir.js (SMS de Camille).
 */
(function () {
	if (typeof Jeu === 'undefined' || !Jeu.bilan) return;

	/** Seuils réglés par la simulation de test-jeu.mjs (bloc « Prompt 207 ») — valeurs finales : jeu/207-dix-fins-posture.md */
	const SEUILS = {
		decisionsMin: 4, // en dessous, pas de lecture de la qualité des décisions (imposteur, bouc émissaire)
		virale: { clashs: 4 }, // le clash est tentant (prompt 196) : 3 restaient à portée d'un joueur au hasard
		burnout: { joursMin: 3, cafesParJour: 1, partRenforts: 0.4 }, // un café par jour au plus (cafe.js) : un café chaque jour joué
		imposteur: { score: 180, partBons: 0.4 },
		fauteuil: { score: 240 }, // = Jeu.SEUILS_FIN.bonne
		diplomate: { reponses: 5, partBonnes: 0.8, score: 150 },
		insoumis: { objectifsRates: 2, score: 160 }, // objectifs du jour bas (fluidité ≥ 40…) : en rater deux suffit à marquer
		usagers: { budget: 25, fluiditeReputation: 130 },
		boucEmissaire: { score: 180, partBonsDecides: 0.7 }, // « vos décisions étaient les bonnes » : celles que vous avez prises
		correcte: { score: 150 }, // = Jeu.SEUILS_FIN.moyenne
		// Annonces en cours de partie (aucun delta)
		annonce: { clashs: 2, budget: 30, joursCafe: 2, objectifsRates: 1, scoreInsoumis: 160, partBonsDecides: 0.7, scoreBouc: 180 },
	};
	Jeu.SEUILS_POSTURE = SEUILS;

	/** Les dix fins, dans l'ordre d'évaluation ; `ton` = couleur du tampon et de l'étiquette du rapport */
	const FINS = [
		{ cle: 'virale', ton: 'mauvaise' },
		{ cle: 'burnout', ton: 'moyenne' },
		{ cle: 'imposteur', ton: 'moyenne' },
		{ cle: 'fauteuil', ton: 'bonne' },
		{ cle: 'diplomate', ton: 'bonne' },
		{ cle: 'insoumis', ton: 'moyenne' },
		{ cle: 'usagers', ton: 'moyenne' },
		{ cle: 'boucEmissaire', ton: 'mauvaise' },
		{ cle: 'correcte', ton: 'moyenne' },
		{ cle: 'reprimande', ton: 'mauvaise' },
	];
	Jeu.FINS_SEMAINE = FINS;
	const finDe = (cle) => FINS.find((f) => f.cle === cle) || FINS[FINS.length - 1];

	// ——— Compteurs absents du jeu jusqu'ici (cafés, siestes volontaires, départs anticipés) et annonces faites ———
	const neuve = () => ({ cafes: 0, joursCafe: [], siestes: 0, departs: 0, annonces: {} });
	Jeu.posture = neuve();
	/** Appelé par cafe.js (café bu), sieste.js (sieste volontaire), game.js (départ avant la fin) */
	Jeu.noterPosture = function (k) {
		const p = Jeu.posture || (Jeu.posture = neuve());
		if (k === 'cafes') {
			p.cafes++;
			if (!p.joursCafe.includes(Jeu.jourIndex || 0)) p.joursCafe.push(Jeu.jourIndex || 0);
		} else if (k === 'siestes' || k === 'departs') p[k]++;
	};

	const part = (n, total) => (total ? n / total : 0);
	/** Réponse Community réellement donnée (index dans def.reponses), ou null */
	const reponseDe = (p) => (p && p.def && p.reponse !== null && p.reponse !== undefined ? p.def.reponses[p.reponse] || null : null);

	/** Signaux de la partie en cours — pure, recalculée depuis l'état (donc depuis une sauvegarde) */
	Jeu.signauxPosture = function () {
		const h = (Jeu.historique || []).filter((x) => x && x.action);
		const evals = h.map((x) => x.evaluation || (x.action === 'temps' ? 'trop_tard' : 'inconnu'));
		const bons = evals.filter((e) => e === 'bon').length;
		const repondues = (Jeu.plaintes || []).filter((p) => reponseDe(p));
		const clashsQuai = repondues.filter((p) => reponseDe(p).clash === true).length;
		const clashsDecisions = h.filter((x) => x.clash).length;
		const objectifs = Jeu.objectifsResultats || [];
		const p = Object.assign(neuve(), Jeu.posture || {});
		const jours = Jeu.jours || [];
		const joursJoues = Math.max(objectifs.length, new Set(h.map((x) => x.jour).filter(Boolean)).size); // jours où le joueur a vraiment joué
		// Météo réelle des jours joués (archives Open-Meteo de la semaine) : citée par le bouc émissaire
		let meteo = null;
		if (Jeu.etat && Jeu.etat.mode !== 'direct' && Jeu.meteoDuJour) {
			const vus = jours.slice(0, Math.max(1, Math.min(jours.length, joursJoues))).map((j) => Jeu.meteoDuJour(j.date)).filter((m, i) => m && m.date === jours[i].date);
			if (vus.length) {
				const pluie = vus.reduce((s, m) => s + (typeof m.pluie_mm === 'number' ? m.pluie_mm : 0), 0);
				const rafales = Math.max(...vus.map((m) => (typeof m.rafales_max === 'number' ? m.rafales_max : 0)));
				meteo = { pluie: Math.round(pluie * 10) / 10, rafales: Math.round(rafales) };
			}
		}
		const quaiBonnes = repondues.filter((x) => x.bonne || x.signalee).length; // « Signaler » compte comme une bonne réponse
		return {
			decisions: h.length,
			bons,
			partBons: part(bons, h.length),
			partBonsDecides: part(bons, h.filter((x) => x.action !== 'temps').length), // qualité des décisions vraiment prises (sans les non traités)
			rates: evals.filter((e) => e === 'rate' || e === 'trop_tard').length,
			nonTraites: h.filter((x) => x.action === 'temps').length,
			renforts: h.filter((x) => (x.famille || x.action) === 'renfort').length,
			partRenforts: part(h.filter((x) => (x.famille || x.action) === 'renfort').length, h.length),
			mauvaisesSources: h.filter((x) => x.mauvaiseSource).length,
			clashs: clashsDecisions + clashsQuai,
			clashsDecisions,
			clashsQuai,
			quai: { reponses: repondues.length, bonnes: quaiBonnes, signalees: repondues.filter((x) => x.signalee).length },
			partBonnesQuai: part(quaiBonnes, repondues.length),
			objectifs: objectifs.length,
			objectifsRates: objectifs.filter((o) => !o.atteint).length,
			joursJoues,
			cafes: p.cafes,
			joursCafe: p.joursCafe.length,
			siestes: p.siestes,
			departs: p.departs,
			score: Jeu.score(),
			jauges: Object.assign({}, Jeu.jauges),
			meteo,
		};
	};

	/** Cumul de plusieurs semaines (mode histoire) : comptes additionnés, parts recalculées, score moyen, dernières jauges */
	Jeu.cumulerSignaux = function (liste) {
		const l = (liste || []).filter(Boolean);
		if (!l.length) return null;
		const somme = (k) => l.reduce((s, x) => s + (Number(x[k]) || 0), 0);
		const c = {};
		['decisions', 'bons', 'rates', 'nonTraites', 'renforts', 'mauvaisesSources', 'clashs', 'clashsDecisions', 'clashsQuai', 'objectifs', 'objectifsRates', 'joursJoues', 'cafes', 'joursCafe', 'siestes', 'departs'].forEach((k) => (c[k] = somme(k)));
		c.quai = { reponses: l.reduce((s, x) => s + ((x.quai && x.quai.reponses) || 0), 0), bonnes: l.reduce((s, x) => s + ((x.quai && x.quai.bonnes) || 0), 0), signalees: l.reduce((s, x) => s + ((x.quai && x.quai.signalees) || 0), 0) };
		c.partBons = part(c.bons, c.decisions);
		c.partBonsDecides = part(c.bons, c.decisions - c.nonTraites);
		c.partRenforts = part(c.renforts, c.decisions);
		c.partBonnesQuai = part(c.quai.bonnes, c.quai.reponses);
		c.score = Math.round(somme('score') / l.length);
		c.jauges = Object.assign({}, l[l.length - 1].jauges);
		const met = l.map((x) => x.meteo).filter(Boolean);
		c.meteo = met.length ? { pluie: Math.round(met.reduce((s, m) => s + m.pluie, 0) * 10) / 10, rafales: Math.max(...met.map((m) => m.rafales)) } : null;
		c.semaines = l.length;
		return c;
	};

	/** Table des fins (ordre de priorité) → clé de la fin */
	Jeu.finDeSemaine = function (signaux) {
		const s = signaux || Jeu.signauxPosture();
		const S = SEUILS;
		const lisible = s.decisions >= S.decisionsMin;
		const j = s.jauges || {};
		if (s.clashs >= S.virale.clashs) return 'virale';
		if (s.joursJoues >= S.burnout.joursMin && s.joursCafe >= s.joursJoues * S.burnout.cafesParJour && s.siestes === 0 && s.departs === 0 && s.partRenforts >= S.burnout.partRenforts) return 'burnout';
		if (lisible && s.score >= S.imposteur.score && s.partBons <= S.imposteur.partBons) return 'imposteur';
		if (s.score >= S.fauteuil.score) return 'fauteuil';
		if (s.clashs === 0 && s.quai.reponses >= S.diplomate.reponses && s.partBonnesQuai >= S.diplomate.partBonnes && s.score >= S.diplomate.score) return 'diplomate';
		if (s.objectifsRates >= S.insoumis.objectifsRates && s.score >= S.insoumis.score) return 'insoumis';
		if (j.budget <= S.usagers.budget && j.fluidite + j.reputation >= S.usagers.fluiditeReputation) return 'usagers';
		if (lisible && s.score < S.boucEmissaire.score && s.partBonsDecides >= S.boucEmissaire.partBonsDecides) return 'boucEmissaire';
		if (s.score >= S.correcte.score) return 'correcte';
		return 'reprimande';
	};

	const pct = (x) => Math.round(x * 100);
	/** « Ce qui a pesé » : 2 ou 3 faits réels propres à la fin (textes différés) */
	Jeu.pesePosture = function (cle, s) {
		const f = [];
		const add = (k, v) => f.push(T('pese.' + k, v || {}));
		const j = s.jauges || {};
		const decisions = () => add('bons', { n: s.bons, total: s.decisions });
		switch (cle) {
			case 'virale':
				add('clashs', { n: s.clashs });
				if (s.clashsQuai && s.clashsDecisions) add('clashsDetail', { d: s.clashsDecisions, q: s.clashsQuai });
				add('score', { s: s.score });
				break;
			case 'burnout':
				add('cafes', { n: s.joursCafe, jours: s.joursJoues });
				add('renforts', { n: s.renforts, total: s.decisions });
				add('sansRepos');
				break;
			case 'imposteur':
				decisions();
				add('score', { s: s.score });
				break;
			case 'fauteuil':
				add('score', { s: s.score });
				add('budget', { b: j.budget });
				decisions();
				break;
			case 'diplomate':
				add('quai', { n: s.quai.bonnes, total: s.quai.reponses });
				add('zeroClash');
				add('score', { s: s.score });
				break;
			case 'insoumis':
				add('objectifs', { n: s.objectifsRates, total: s.objectifs });
				add('score', { s: s.score });
				break;
			case 'usagers':
				add('budget', { b: j.budget });
				add('fluiditeReputation', { f: j.fluidite, r: j.reputation });
				break;
			case 'boucEmissaire':
				decisions();
				add('score', { s: s.score });
				if (s.meteo && (s.meteo.pluie || s.meteo.rafales)) add('meteo', { pluie: s.meteo.pluie, vent: s.meteo.rafales });
				break;
			default:
				add('score', { s: s.score });
				decisions();
		}
		return f.slice(0, 3);
	};

	// ——— Bilan : la fin de la table remplace le titre et le texte ; b.type reste le palier de score (décor, son) ———
	const bilan = Jeu.bilan;
	Jeu.bilan = function () {
		const b = bilan.apply(this, arguments);
		const s = Jeu.signauxPosture();
		const cle = Jeu.finDeSemaine(s);
		const f = finDe(cle);
		b.signaux = s;
		b.fin = cle;
		b.ton = f.ton;
		b.numeroFin = FINS.indexOf(f) + 1;
		b.titre = T('fin.' + cle + '.titre');
		b.texte = T('fin.' + cle + '.texte');
		b.pese = Jeu.pesePosture(cle, s);
		return b;
	};

	// ——— Partie : remise à zéro, sauvegarde, reprise ———
	const nouvelle = Jeu.nouvellePartie;
	Jeu.nouvellePartie = function () {
		Jeu.posture = neuve();
		return nouvelle.apply(this, arguments);
	};
	const instantane = Jeu.instantane;
	Jeu.instantane = function () {
		const o = instantane.apply(this, arguments);
		if (o) o.posture = JSON.parse(JSON.stringify(Jeu.posture || neuve()));
		return o;
	};
	const restaurer = Jeu.restaurerInstantane;
	Jeu.restaurerInstantane = function (s) {
		const ok = restaurer.apply(this, arguments);
		const p = (s && s.posture) || {};
		Jeu.posture = Object.assign(neuve(), p, { joursCafe: Array.isArray(p.joursCafe) ? p.joursCafe.slice() : [], annonces: Object.assign({}, p.annonces || {}) }); // ancienne sauvegarde : compteurs à 0
		return ok;
	};
	const partir = Jeu.partirAvantLaFin;
	if (partir)
		Jeu.partirAvantLaFin = function () {
			Jeu.noterPosture('departs');
			return partir.apply(this, arguments);
		};

	// ——— Annonces en cours de partie : une fois par semaine et par fin visée, aucun effet de jauge ———
	const annoncee = (k) => {
		const p = Jeu.posture || (Jeu.posture = neuve());
		if (p.annonces[k] !== undefined) return true; // valeur = jour de l'annonce (0 le lundi)
		p.annonces[k] = Jeu.jourIndex || 0;
		return false;
	};
	/** Mails du patron : 2ᵉ clash (vers « capture virale ») ; 2ᵉ objectif raté avec un bon score (vers « insoumis ») */
	Jeu.annoncesPatronPosture = function () {
		if (!Jeu.messagePatron || Jeu.terminee) return null;
		const s = Jeu.signauxPosture();
		const A = SEUILS.annonce;
		if (s.clashs >= A.clashs && s.clashs < SEUILS.virale.clashs && !annoncee('virale')) {
			Jeu.messagePatron(T(Jeu.variante('posture.patron.virale', 'virale')), 'reproche', { posture: 'virale', severe: true });
			return 'virale';
		}
		if (s.objectifsRates >= A.objectifsRates && s.score >= A.scoreInsoumis && !annoncee('insoumis')) {
			Jeu.messagePatron(T(Jeu.variante('posture.patron.insoumis', 'insoumis')), 'reproche', { posture: 'insoumis' });
			return 'insoumis';
		}
		return null;
	};
	const decider = Jeu.decider;
	Jeu.decider = function () {
		const r = decider.apply(this, arguments);
		if (r && r.clash) Jeu.annoncesPatronPosture();
		return r;
	};
	const repondre = Jeu.repondrePlainte;
	Jeu.repondrePlainte = function () {
		const r = repondre.apply(this, arguments);
		if (r && r.clash) Jeu.annoncesPatronPosture();
		return r;
	};
	const finJour = Jeu.finDeJourneeTactique;
	Jeu.finDeJourneeTactique = function () {
		const r = finJour.apply(this, arguments);
		Jeu.annoncesPatronPosture();
		return r;
	};

	/** SMS de Camille entre deux journées (avant celui de la météo) : burn-out, usagers d'abord, bouc émissaire */
	Jeu.smsPostureCamille = function () {
		if (!Jeu.jours || !Jeu.jours[Jeu.jourIndex + 1] || Jeu.terminee) return null; // entre deux journées seulement
		const s = Jeu.signauxPosture();
		const A = SEUILS.annonce;
		const choix = [
			['burnout', s.joursCafe >= A.joursCafe && s.siestes === 0 && s.departs === 0],
			['usagers', s.jauges.budget <= A.budget && s.jauges.fluidite + s.jauges.reputation >= SEUILS.usagers.fluiditeReputation],
			['boucEmissaire', s.decisions >= SEUILS.decisionsMin && s.partBonsDecides >= A.partBonsDecides && s.score < A.scoreBouc],
		].find(([k, ok]) => ok && (Jeu.posture.annonces || {})[k] === undefined);
		if (!choix) return null;
		annoncee(choix[0]);
		return { fin: choix[0], texte: T(Jeu.variante('posture.camille.' + choix[0], choix[0])), reponse: T('posture.camille.' + choix[0] + '.reponse') };
	};

	// ——— Galerie des fins découvertes (localStorage, survit au licenciement et aux nouvelles parties) ———
	const CLE_GALERIE = 'pxe-nte001:jeu:fins-decouvertes';
	const Galerie = {
		lire() {
			try {
				const o = JSON.parse(localStorage.getItem(CLE_GALERIE) || 'null');
				return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
			} catch (e) {
				return {};
			}
		},
		/** Note une fin obtenue (première date et meilleur score) ; renvoie true si elle est nouvelle */
		noter(cle, score) {
			if (!FINS.some((f) => f.cle === cle)) return false;
			const g = Galerie.lire();
			const nouvelle = !g[cle];
			const le = new Date().toISOString().slice(0, 10);
			g[cle] = { le: nouvelle ? le : g[cle].le, score: Math.max(Number(score) || 0, (g[cle] && g[cle].score) || 0), n: ((g[cle] && g[cle].n) || 0) + 1 };
			try {
				localStorage.setItem(CLE_GALERIE, JSON.stringify(g));
			} catch (e) {}
			return nouvelle;
		},
		decouvertes() {
			const g = Galerie.lire();
			return FINS.filter((f) => g[f.cle]).length;
		},
	};
	Jeu.Galerie = Galerie;
})();

/** Fin du soir (soir.js) : SMS de Camille sur la posture du joueur ; true = conversation lancée, `suite` à la fin */
function smsPostureCamille(suite) {
	if (typeof lancerConversation !== 'function' || (typeof ecran !== 'undefined' && ecran !== 'jeu') || !Jeu.smsPostureCamille) return false;
	const s = Jeu.smsPostureCamille();
	if (!s) return false;
	lancerConversation({
		contact: T('sms.camille'),
		sous: T('intro.salle'),
		messages: [
			{ de: T('sms.camille'), texte: s.texte },
			{ de: 'moi', texte: s.reponse },
		],
		auFin: () => {
			smsActif = false;
			suite();
		},
	});
	return true;
}
