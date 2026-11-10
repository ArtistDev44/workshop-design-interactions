/* Nantes en régulation — logique du jeu (Q41 : game.js = logique, sketch.js = boucle p5).
 * Prompt 15 : chargement des données uniquement. Boucle, effets et jauges : prompts 17 à 19.
 *
 * Trois sources, toujours réelles :
 *   - « semaine »     : semaines d'archives publiques (data/semaines.js, préparé par scripts/preparer-semaines.mjs)
 *   - « direct »      : GTFS-RT Naolib du moment (gtfsrt.js), retards réels ≥ 10 min
 *   - « hors ligne »  : 6 dossiers réels d'une semaine d'archive (data/fallback.js), seed fixe (Q26, Q35)
 * Les données hors ligne sont chargées par <script> (window.PXE_*) : le jeu s'ouvre aussi par double clic.
 */
(function (global) {
	'use strict';

	const SEUIL_RETARD_MIN = 10; // Q1 / 00-concept : retard ≥ 10 min = dossier « ligne en difficulté »
	const DELAI_DIRECT_MS = 8000;

	const Jeu = {
		lignes: global.PXE_LIGNES || null,
		semaines: global.PXE_SEMAINES || null,
		fallback: global.PXE_FALLBACK || null,
		etat: { mode: null, semaine: null, dossiers: [], horsLigne: false, message: '' },
	};

	/** Nom court d'une ligne (« C7 ») à partir de son route_id GTFS. */
	Jeu.nomLigne = function (routeId) {
		const l = Jeu.lignes && Jeu.lignes.lignes.find((x) => x.id === routeId);
		return l ? l.nom : String(routeId || '').replace(/^.*:Line:/, '');
	};

	/** Liste des semaines proposées à l'accueil (Q14) : une par difficulté. */
	Jeu.semainesProposees = function () {
		return Jeu.semaines ? Jeu.semaines.index : [];
	};

	/** Mode « semaine rejouée » (archives). */
	Jeu.chargerSemaine = function (lundi) {
		const s = Jeu.semaines && Jeu.semaines.semaines[lundi];
		if (!s) return Jeu.chargerHorsLigne(T('charge.introuvable'));
		Jeu.etat = { mode: 'semaine', semaine: s, dossiers: s.dossiers.slice(), horsLigne: false, message: '' };
		return Promise.resolve(Jeu.etat);
	};

	/** Mode hors ligne : semaine de référence (6 dossiers réels, seed fixe). */
	Jeu.chargerHorsLigne = function (message) {
		const fb = Jeu.fallback;
		Jeu.etat = {
			mode: 'hors ligne',
			semaine: fb ? fb.semaine : null,
			dossiers: fb ? fb.dossiers.slice() : [],
			seed: fb ? fb.seed : 1001,
			horsLigne: true,
			message: message || T('charge.horsLigne'),
		};
		return Promise.resolve(Jeu.etat);
	};

	/** Mode « aujourd'hui en direct » : un seul appel GTFS-RT au lancement, repli hors ligne si échec. */
	Jeu.chargerDirect = function () {
		Jeu.verifierConnexion(); // prompt 49 : en direct, la météo est rechargée depuis l'API au lancement de la partie
		if (!global.PXE_GTFSRT) return Jeu.chargerHorsLigne(T('charge.decodeur'));
		return global.PXE_GTFSRT.charger(global.PXE_GTFSRT.FLUX.tripUpdates, DELAI_DIRECT_MS)
			.then(function (flux) {
				const retards = global.PXE_GTFSRT.retardsParLigne(flux, SEUIL_RETARD_MIN);
				if (!retards.length) return Jeu.chargerHorsLigne(T('charge.aucunRetard'));
				const quand = new Date((flux.horodatage || Date.now() / 1000) * 1000);
				Jeu.etat = {
					mode: 'direct',
					semaine: null,
					horodatage: quand.toISOString(),
					dossiers: retards.map(function (r) {
						return {
							date: quand.toISOString().slice(0, 10),
							type: 'ligne en difficulté',
							nature: 'retard',
							lignes: [Jeu.nomLigne(r.ligne)],
							retard: r.retardMin, // retard réel lu dans le flux (minutes)
							source: T('direct.source'),
							texte_source: T('direct.texte', { retard: r.retardMin, ligne: Jeu.nomLigne(r.ligne) }),
						};
					}),
					horsLigne: false,
					message: '',
				};
				if (typeof console !== 'undefined') console.info('[direct] ' + retards.length + ' ligne(s) avec un retard ≥ ' + SEUIL_RETARD_MIN + ' min');
				return Jeu.etat;
			})
			.catch(function () {
				return Jeu.chargerHorsLigne(T('charge.injoignable'));
			});
	};

	/**
	 * Météo du jour d'un dossier (semaines d'archives / hors ligne) : { temp_min, temp_max, pluie_mm, rafales_max }.
	 * En mode direct, la météo vient d'Open-Meteo forecast (Jeu.meteoActuelle).
	 */
	Jeu.meteoDuJour = function (date) {
		if (Jeu.etat.mode === 'direct') return Jeu.meteoActuelle;
		const src = (Jeu.etat.mode === 'hors ligne' ? Jeu.fallback && Jeu.fallback.meteo : Jeu.etat.semaine && Jeu.etat.semaine.meteo) || [];
		return src.find((m) => m.date === date) || src[0] || null;
	};

	/**
	 * Test de connexion léger au lancement (Q34) + météo réelle du moment pour le décor :
	 * Open-Meteo forecast (JSON, sans clé). Échec → indicateur « mode hors ligne ».
	 */
	Jeu.meteoActuelle = null;
	Jeu.enLigne = null;
	Jeu.verifierConnexion = function () {
		const ctrl = new AbortController();
		const t = setTimeout(() => ctrl.abort(), 4000);
		const url =
			'https://api.open-meteo.com/v1/forecast?latitude=47.2184&longitude=-1.5536&timezone=Europe%2FParis' +
			'&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,wind_gusts_10m_max&forecast_days=1';
		return fetch(url, { signal: ctrl.signal })
			.then((r) => {
				if (!r.ok) throw new Error(String(r.status));
				return r.json();
			})
			.then((d) => {
				Jeu.meteoActuelle = {
					date: d.daily.time[0],
					temp_min: d.daily.temperature_2m_min[0],
					temp_max: d.daily.temperature_2m_max[0],
					pluie_mm: d.daily.precipitation_sum[0],
					rafales_max: d.daily.wind_gusts_10m_max[0],
				};
				Jeu.enLigne = true;
				return true;
			})
			.catch(() => {
				Jeu.enLigne = false;
				return false;
			})
			.finally(() => clearTimeout(t));
	};

	// =====================================================================
	// Prompt 17 — boucle de jeu, table des effets, jauges, narration
	// =====================================================================

	/* RÉGLAGES (interprétations à valider par le groupe — tout est ici, rien n'est caché ailleurs) */
	const REGLAGES = {
		dossiersParPartie: 15, // Q15 / 01-boucle : ~15 décisions
		// Table des effets (Q57–Q60), prompt 22 : ordre fluidité, réputation, BUDGET (la satisfaction devient le budget).
		// Seules les valeurs sont réajustées pour le nouveau trio ; les décisions Q57–Q61 sont inchangées.
		effets: {
			// Équilibrage du 10/11/2026 (3 tests de difficulté, jeu/36-tests-difficulte.md) : la bonne fin redevient atteignable
			devier: { nom: T('action.devier'), base: [-3, 8, -1], communique: true }, // détour : un peu de fluidité perdue, usagers informés, petit coût
			retenir: { nom: T('action.retenir'), base: [-4, null, 5] }, // réputation : +8 si retard > 20 min sinon +4 (Q58) ; économise du budget
			renfort: { nom: T('action.renfort'), base: [13, 5, -8] }, // efficace mais cher : le budget n'est plus gratuit
			rien: { nom: T('action.rien') }, // −2 à −8 sur une jauge tirée au hasard (Q60)
		},
		// « base + 1d6 » (Q61) : le dé augmente l'AMPLITUDE de l'effet (même signe), d6 − 1 ∈ [0, 5] ;
		// un effet de base nul reste nul. Résultat borné à ±15 (04-jauges : « ±5 à ±15 »).
		bornesEffet: 15,
		// Modificateurs contextuels (Q24) : amplitude × 1,25 sur la jauge concernée
		coefContexte: 1.25,
		// Conséquences « naturelles » d'un dossier non traité (compteur à 0, Q25), sans malus supplémentaire
		naturel: {
			'ligne en difficulté': (d) => [-Math.min(15, Math.max(4, Math.round(d.retard / 5))), 0, 0],
			perturbation: () => [-5, 0, 0],
			'alerte météo': () => [-4, 0, 0],
			événement: () => [0, -4, 0], // affluence non gérée : la réputation en pâtit
		},
		// Contradiction de sources (Q9, Q31) : mauvaise source = malus réputation + conséquence réelle
		malusMauvaiseSource: -6,
		seuilCritique: 20, // Q46
	};
	Jeu.REGLAGES = REGLAGES;
	const NOMS_JAUGES = ['fluidite', 'reputation', 'budget'];
	const LIBELLES_JAUGES = { fluidite: T('jauge.fluidite'), reputation: T('jauge.reputation'), budget: T('jauge.budget') };
	Jeu.NOMS_JAUGES = NOMS_JAUGES;
	Jeu.LIBELLES_JAUGES = LIBELLES_JAUGES;

	/* Générateur pseudo-aléatoire à graine fixe (Q35) : même semaine = mêmes dés. */
	function mulberry32(a) {
		return function () {
			a |= 0;
			a = (a + 0x6d2b79f5) | 0;
			let t = Math.imul(a ^ (a >>> 15), 1 | a);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}
	const graineDe = (texte) => Array.from(String(texte)).reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 1001);
	Jeu.de6 = () => 1 + Math.floor(Jeu.alea() * 6);

	/* Événements de l'agenda : ceux qui attirent du monde d'abord (même règle que scripts/preparer-semaines.mjs). */
	function scoreAffluence(e) {
		const types = String(e.nature || '').split(', ');
		if (types.length > 4) return -1;
		if (types.some((t) => /sportif|Festival|Défilé|Marché|Concert|Salon/i.test(t))) return 2;
		if (types.some((t) => /Théâtre|Danse|Cirque|Projection/i.test(t))) return 1;
		return 0;
	}

	/* Contradiction réelle : la date de publication de l'archive ≠ la date annoncée dans son texte (ex. publié le 12/10, « Manifestation 13/10 »). */
	function detecterContradiction(d) {
		if (d.type !== 'perturbation') return null;
		const m = String(d.texte_source).match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
		if (!m) return null;
		const an = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : Number(d.date.slice(0, 4));
		const annoncee = an + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[1]).padStart(2, '0');
		if (annoncee === d.date) return null;
		return {
			question: T('contra.question'),
			a: { libelle: T('contra.a', { date: d.date }), date: d.date },
			b: { libelle: T('contra.b', { date: annoncee }), date: annoncee },
			bonne: 'b', // la perturbation a lieu à la date annoncée ; la publication la précède
		};
	}

	/* Paquet de la partie : dossiers réels de la source, complétés par les événements réels de l'agenda (affluence, Q23), triés dans le temps. */
	function construirePaquet(etat) {
		const base = etat.dossiers.slice();
		let paquet = base;
		if (etat.mode === 'semaine' && base.length < REGLAGES.dossiersParPartie && etat.semaine) {
			const evts = (etat.semaine.evenements || [])
				.map((e, i) => ({ e, i, s: scoreAffluence(e) }))
				.filter((x) => x.s >= 0)
				.sort((a, b) => b.s - a.s || a.i - b.i)
				.slice(0, REGLAGES.dossiersParPartie - base.length)
				.map((x) => Object.assign({}, x.e, { type: 'événement', affluence: true }));
			paquet = base.concat(evts);
		}
		paquet = paquet.slice(0, REGLAGES.dossiersParPartie);
		paquet.sort((a, b) => (a.date + (a.heure || '')).localeCompare(b.date + (b.heure || '')));
		return paquet.map((d) => Object.assign({}, d, { contradiction: detecterContradiction(d) }));
	}

	/* Démarre une partie sur l'état chargé (semaine, direct ou hors ligne). */
	Jeu.nouvellePartie = function () {
		const e = Jeu.etat;
		Jeu.initialiserAlea(e.seed || graineDe(e.semaine ? e.semaine.lundi : e.horodatage || 'direct'), 0);
		Jeu.jauges = { fluidite: 50, reputation: 50, budget: 50 }; // Q40 (prompt 22 : trio fluidité / réputation / budget)
		Jeu.paquet = construirePaquet(e);
		e.dossiers = Jeu.paquet; // l'affichage (carte, liste) lit le paquet de la partie
		Jeu.index = 0;
		Jeu.historique = [];
		Jeu.evenementsJournee = []; // prompt 21 § 3.1 : journal des dossiers traités
		Jeu.messagesPatron = []; // prompt 22 : app « Messages du patron »
		Jeu.commentaires = []; // prompt 22 : app « Community manager »
		Jeu.plaintes = []; // prompt 28 : plaintes des Nantais (data/messages.json)
		Jeu.equipes = []; // prompt 22 : équipes envoyées depuis la carte
		Jeu.nonLus = { patron: 0, community: 0 };
		Jeu.alertesJauges = {};
		Jeu.malus = {};
		Jeu.objectifsResultats = [];
		Jeu.modificateur = null;
		Jeu.paliersBudget = {};
		Jeu.carnet = ''; // prompt 47 : journal de bord (notes libres du joueur)
		Jeu.inspection = null; // prompt 47 : inspection surprise de la semaine
		Jeu.agendaPrevenus = {}; // prompt 47 : jours où le patron a déjà prévenu d'un afflux
		Jeu.demission = false; // prompt 47 : fin « démission »
		Jeu.depart = null; // prompt 51 : départ avant la fin de la journée
		Jeu.blame = null; // prompt 51 : mail du patron le lendemain
		Jeu.defis = null; // prompt 55 : tirés dans preparerJournees (après le paquet)
		Jeu.defisAppliques = null;
		Jeu.ralenti = { jour: -1, debut: 0, fin: 0, utilises: 0 }; // prompt 55
		Jeu.terminee = Jeu.paquet.length === 0;
		Jeu.preparerJournees();
		return Jeu.paquet;
	};

	/** Prompt 33 : générateur à graine + nombre de tirages déjà faits (pour reprendre une partie à l'identique) */
	Jeu.initialiserAlea = function (graine, tirages) {
		const brut = mulberry32(graine);
		for (let i = 0; i < (tirages || 0); i++) brut();
		Jeu.graine = graine;
		Jeu.tirages = tirages || 0;
		Jeu.alea = () => (Jeu.tirages++, brut());
	};

	// =====================================================================
	// Prompt 33 — instantané de la partie (lecture seule) et restauration.
	// Les textes différés (Texte, Liste) sont encodés par sauvegarde.js ; ici, seulement la structure.
	// Les horodatages en millis() (modificateur, équipes) sont stockés en durées restantes.
	// =====================================================================
	Jeu.instantane = function (maintenant) {
		if (!Jeu.paquet) return null;
		const idx = (d) => Jeu.paquet.indexOf(d);
		const m = Jeu.modificateur;
		return {
			mode: Jeu.etat.mode,
			semaine: Jeu.etat.mode === 'semaine' && Jeu.etat.semaine ? Jeu.etat.semaine.lundi : Jeu.etat.mode === 'direct' ? 'direct' : 'fallback',
			horodatage: Jeu.etat.horodatage || null,
			graine: Jeu.graine,
			tirages: Jeu.tirages,
			jauges: Object.assign({}, Jeu.jauges),
			index: Jeu.index,
			paquet: Jeu.paquet,
			jours: (Jeu.jours || []).map((j) => ({ date: j.date, debut: j.debut, fin: j.fin, dossiers: j.dossiers.map(idx) })),
			jourIndex: Jeu.jourIndex,
			horloge: Object.assign({}, Jeu.horloge),
			historique: Jeu.historique,
			evenementsJournee: Jeu.evenementsJournee,
			messagesPatron: Jeu.messagesPatron,
			commentaires: Jeu.commentaires,
			plaintes: (Jeu.plaintes || []).map((p) => Object.assign({}, p, { def: undefined })),
			equipes: (Jeu.equipes || []).map((q) => Object.assign({}, q, { depart: q.depart - maintenant, arrivee: q.arrivee - maintenant })),
			nonLus: Object.assign({}, Jeu.nonLus),
			alertesJauges: Object.assign({}, Jeu.alertesJauges),
			malus: Object.assign({}, Jeu.malus),
			objectifsResultats: Jeu.objectifsResultats,
			modificateur: m ? Object.assign({}, m, { debut: m.debut === null ? null : m.debut - maintenant, fin: m.fin === null ? null : m.fin - maintenant }) : null,
			paliersBudget: Object.assign({}, Jeu.paliersBudget),
			carnet: Jeu.carnet || '',
			inspection: Jeu.inspection,
			agendaPrevenus: Object.assign({}, Jeu.agendaPrevenus),
			depart: Jeu.depart,
			blame: Jeu.blame,
			defis: Jeu.defis,
			defisAppliques: Jeu.defisAppliques,
			ralenti: Jeu.ralenti ? { jour: Jeu.ralenti.jour, utilises: Jeu.ralenti.utilises, debut: 0, fin: 0 } : null,
			terminee: Jeu.terminee,
		};
	};

	/** Restaure un instantané (déjà décodé) sur l'état chargé de la même semaine ; renvoie true si tout est cohérent */
	Jeu.restaurerInstantane = function (s, maintenant) {
		Jeu.nouvellePartie(); // remet tout à zéro, puis on écrase avec l'instantané
		Jeu.paquet = s.paquet;
		Jeu.etat.dossiers = Jeu.paquet;
		if (s.horodatage) Jeu.etat.horodatage = s.horodatage;
		Jeu.jours = s.jours.map((j) => ({ date: j.date, debut: j.debut, fin: j.fin, dossiers: j.dossiers.map((i) => Jeu.paquet[i]).filter(Boolean) }));
		Jeu.jourIndex = s.jourIndex;
		Jeu.horloge = { minutes: s.horloge.minutes };
		Jeu.index = s.index;
		Jeu.jauges = { fluidite: s.jauges.fluidite, reputation: s.jauges.reputation, budget: s.jauges.budget };
		Jeu.initialiserAlea(s.graine, s.tirages);
		['historique', 'evenementsJournee', 'messagesPatron', 'commentaires', 'objectifsResultats'].forEach((k) => (Jeu[k] = s[k] || []));
		['nonLus', 'alertesJauges', 'malus', 'paliersBudget', 'agendaPrevenus'].forEach((k) => (Jeu[k] = s[k] || {}));
		Jeu.carnet = typeof s.carnet === 'string' ? s.carnet.slice(0, Jeu.CARNET_MAX) : ''; // prompt 47
		Jeu.inspection = s.inspection || null;
		Jeu.depart = s.depart || null; // prompt 51
		Jeu.blame = s.blame || null;
		Jeu.defis = s.defis || Jeu.tirerDefis(); // prompt 55 (ancienne sauvegarde : tirés à la reprise, même graine)
		Jeu.defisAppliques = s.defisAppliques || null;
		Jeu.ralenti = s.ralenti || { jour: -1, debut: 0, fin: 0, utilises: 0 };
		Jeu.plaintes = (s.plaintes || [])
			.map((p) => Object.assign({}, p, { def: Jeu.MESSAGES.plaintes.find((x) => x.id === p.id) }))
			.filter((p) => p.def); // une plainte retirée de messages.json depuis la sauvegarde est ignorée
		Jeu.equipes = (s.equipes || []).map((q) => Object.assign({}, q, { depart: q.depart + maintenant, arrivee: q.arrivee + maintenant }));
		const m = s.modificateur && s.modificateur.id !== 'erreur_systeme' ? s.modificateur : null; // ancienne sauvegarde : l'erreur système n'existe plus
		Jeu.modificateur = m ? Object.assign({}, m, { debut: m.debut === null ? null : m.debut + maintenant, fin: m.fin === null ? null : m.fin + maintenant }) : null;
		Jeu.terminee = !!s.terminee;
		return Jeu.index >= 0 && Jeu.index <= Jeu.paquet.length && !!Jeu.jours.length;
	};

	Jeu.dossierCourant = () => (Jeu.paquet || [])[Jeu.index] || null;
	Jeu.score = () => NOMS_JAUGES.reduce((s, k) => s + Jeu.jauges[k], 0); // 0–300, poids égaux (Q44)

	/* Conflit de deux lignes (Q27) : le dossier suivant a la même date et concerne d'autres lignes. */
	/** Prompt 41 : éléments de jeu débloqués par chapitre du mode histoire (redéfini par histoire.js) */
	Jeu.elementDebloque = () => true;

	Jeu.conflit = function () {
		if (!Jeu.elementDebloque('crise')) return null; // prompt 41 : conflits de lignes à partir de la semaine 3
		const d = Jeu.dossierCourant();
		const s = (Jeu.paquet || [])[Jeu.index + 1];
		if (!d || !s || d.date !== s.date) return null;
		const ld = d.lignes || [];
		const ls = s.lignes || [];
		if (!ld.length || !ls.length || ld.some((x) => ls.includes(x))) return null;
		// Vrai dilemme seulement si les deux situations sont comparables (retards à 5 min près, ou tous deux sans durée)
		const comparables = d.retard === null || s.retard === null ? d.retard === s.retard : Math.abs(d.retard - s.retard) <= 5;
		if (!comparables || d.conflitTranche || s.conflitTranche) return null;
		return { a: d, b: s };
	};
	/* Le joueur choisit la ligne à traiter en priorité : on échange l'ordre si besoin. */
	Jeu.choisirPriorite = function (choix) {
		const p = Jeu.paquet;
		p[Jeu.index].conflitTranche = p[Jeu.index + 1].conflitTranche = true; // on ne repose pas la question pour la même paire
		if (choix === 'b') [p[Jeu.index], p[Jeu.index + 1]] = [p[Jeu.index + 1], p[Jeu.index]];
		Jeu.historique.push({ type: 'priorité', texte: T('histo.priorite', { lignes: Jeu.dossierCourant().lignes.join(', ') }) });
	};

	/* Contexte du dossier (Q24) : météo défavorable, heure de pointe, affluence. */
	function contexte(d) {
		const m = Jeu.meteoDuJour(d.date) || {};
		const h = d.heure ? Number(d.heure.slice(0, 2)) : null;
		return {
			meteo: d.type === 'alerte météo' || (m.pluie_mm || 0) >= 5 || (m.rafales_max || 0) >= 50,
			pointe: h !== null && ((h >= 7 && h < 9) || (h >= 17 && h < 19)),
			affluence: !!d.affluence,
		};
	}

	function borner(v) {
		return Math.max(-REGLAGES.bornesEffet, Math.min(REGLAGES.bornesEffet, v));
	}

	/**
	 * Applique une décision. action ∈ 'devier' | 'retenir' | 'renfort' | 'rien' | 'temps'
	 * (« temps » = compteur à 0 → conséquences naturelles seules, Q25).
	 * sourceChoisie ∈ 'a' | 'b' si le dossier contient une contradiction (Q9, Q31).
	 * Retourne { deltas, des, contexte, narration, ... } et passe au dossier suivant.
	 */
	Jeu.decider = function (action, sourceChoisie) {
		const d = Jeu.dossierCourant();
		if (!d || Jeu.terminee) return null;
		const ctx = contexte(d);
		let deltas = [0, 0, 0];
		const des = [null, null, null];

		if (action === 'temps') {
			deltas = (REGLAGES.naturel[d.type] || (() => [-4, 0, 0]))(d);
		} else if (action === 'rien') {
			const j = Math.floor(Jeu.alea() * 3);
			deltas[j] = -(2 + Math.floor(Jeu.alea() * 7)); // −2 à −8 (Q60)
		} else {
			const eff = REGLAGES.effets[action];
			const base = eff.base.slice();
			if (action === 'retenir') base[1] = d.retard !== null && d.retard > 20 ? 8 : 4; // Q58 (réputation)
			deltas = base.map((b, i) => {
				if (!b) return 0;
				des[i] = Jeu.de6();
				let v = Math.sign(b) * (Math.abs(b) + des[i] - 1); // base + 1d6 en amplitude (Q61)
				if ((i === 0 && ctx.meteo) || (i === 1 && (ctx.pointe || ctx.affluence))) v *= REGLAGES.coefContexte; // météo → fluidité ; pointe, affluence → réputation
				return borner(Math.round(v));
			});
		}

		// Contradiction : se fier à la mauvaise source = malus réputation + conséquence réelle du dossier (Q31)
		let mauvaiseSource = false;
		if (d.contradiction && sourceChoisie && sourceChoisie !== d.contradiction.bonne) {
			mauvaiseSource = true;
			const reel = (REGLAGES.naturel[d.type] || (() => [-4, 0, 0]))(d);
			deltas = deltas.map((v, i) => borner(v + reel[i]));
			deltas[1] = borner(deltas[1] + REGLAGES.malusMauvaiseSource); // malus de réputation (Q31)
		}

		if (Jeu.modificateurActif && Jeu.modificateurActif() === 'meteo_aggravee') deltas = deltas.map((v) => borner(Math.round(v * 1.5))); // prompt 23 § 2.3
		if (action === 'temps') Jeu.compterMalus('non_traite');
		NOMS_JAUGES.forEach((k, i) => (Jeu.jauges[k] = Math.max(0, Math.min(100, Jeu.jauges[k] + deltas[i]))));
		const resultat = {
			dossier: d,
			action,
			nomAction: action === 'temps' ? T('action.temps') : REGLAGES.effets[action].nom,
			deltas,
			des,
			contexte: ctx,
			mauvaiseSource,
			communique: action !== 'temps' && !!(REGLAGES.effets[action] || {}).communique,
		};
		resultat.minuteSim = Jeu.horloge ? Math.floor(Jeu.horloge.minutes) : null; // heure de la partie (prompt 20)
		resultat.jour = d.date;
		resultat.jaugesApres = Object.assign({}, Jeu.jauges); // prompt 48 : courbes du rapport
		Jeu.journaliser(resultat, ctx);
		resultat.narration = Jeu.narrer(resultat);
		Jeu.historique.push(resultat);
		Jeu.index++;
		Jeu.terminee = Jeu.index >= Jeu.paquet.length;
		return resultat;
	};

	/* Ton adaptatif selon les jauges (Q17) : neutre / tendu / critique. */
	Jeu.ton = function () {
		const min = Math.min(Jeu.jauges.fluidite, Jeu.jauges.reputation, Jeu.jauges.budget);
		return min < REGLAGES.seuilCritique ? 'critique' : min < 40 ? 'tendu' : 'neutre';
	};

	/* Narration ancrée dans le dossier réel (06-narration) : date, ligne ou nature, retard, météo — rien d'inventé. */
	Jeu.narrer = function (r) {
		const d = r.dossier;
		const quand = d.date.split('-').reverse().join('/') + (d.heure ? ' ' + d.heure : '');
		const objet = d.lignes && d.lignes.length ? T('narr.objetLigne', { lignes: d.lignes.join(', ') }) : d.type === 'événement' ? T('narr.objetAffluence') : d.nature;
		const fait = d.retard !== null && d.retard !== undefined ? ' (+' + d.retard + ' min)' : '';
		const items = r.deltas.map((v, i) => (v ? T('delta', { jauge: LIBELLES_JAUGES[NOMS_JAUGES[i]], v: (v > 0 ? '+' : '') + v }) : null)).filter(Boolean);
		const ton = Jeu.ton();
		return {
			titre: T('narr.titre', { quand, objet, fait }),
			texte: T('narr.texte', {
				action: r.nomAction,
				communique: r.communique ? T('narr.communique') : '',
				source: r.mauvaiseSource ? T('narr.mauvaiseSource') : '',
				bilan: items.length ? T('narr.bilan', { liste: Liste(items, ', ', true) }) : T('narr.aucunEffet'),
				reaction: T('ton.' + ton),
			}),
			ton,
		};
	};

	// =====================================================================
	// Prompt 19 — fins (Q43, Q47–Q55) et bilan détaillé
	// =====================================================================
	const FINS = {
		bonne: {
			titre: T('fin.bonne.titre'),
			texte: T('fin.bonne.texte'),
		},
		moyenne: {
			titre: T('fin.moyenne.titre'),
			texte: T('fin.moyenne.texte'),
		},
		mauvaise: {
			titre: T('fin.mauvaise.titre'),
			texte: T('fin.mauvaise.texte'),
		},
	};

	/** Fin déterminée par le score combiné (Q43, Q48) : bonne ≥ 240, moyenne ≥ 150, mauvaise < 150. */
	Jeu.typeFin = function (score) {
		const s = score === undefined ? Jeu.score() : score;
		return s >= 240 ? 'bonne' : s >= 150 ? 'moyenne' : 'mauvaise';
	};

	/**
	 * Bilan détaillé (Q54) : texte générique de la fin + bilan chiffré avec les faits réels (Q52),
	 * dossiers traités (Q18) et décisions clés (Q37).
	 */
	Jeu.bilan = function () {
		const type = Jeu.typeFin();
		const decisions = (Jeu.historique || []).filter((h) => h.action);
		const total = (r) => r.deltas.reduce((s, v) => s + v, 0);
		const tries = decisions.slice().sort((a, b) => total(b) - total(a));
		const cles = [];
		if (tries.length) cles.push(Object.assign({ qualite: 'meilleure' }, tries[0]));
		if (tries.length > 1) cles.push(Object.assign({ qualite: 'pire' }, tries[tries.length - 1]));
		decisions
			.filter((d) => d.mauvaiseSource && !cles.includes(d))
			.slice(0, 1)
			.forEach((d) => cles.push(Object.assign({ qualite: 'mauvaise source' }, d)));
		const retards = Jeu.paquet.filter((d) => d.retard !== null && d.retard !== undefined);
		const pire = retards.sort((a, b) => b.retard - a.retard)[0] || null;
		const parType = {};
		Jeu.paquet.forEach((d) => (parType[d.type] = (parType[d.type] || 0) + 1));
		return {
			type,
			defis: Jeu.defis ? Jeu.resultatsDefis() : [], // prompt 55
			ralentis: (Jeu.ralenti && Jeu.ralenti.utilises) || 0,
			demission: !!Jeu.demission, // prompt 47
			titre: FINS[type].titre,
			texte: FINS[type].texte,
			score: Jeu.score(),
			jauges: Object.assign({}, Jeu.jauges),
			traites: decisions.filter((d) => d.action !== 'temps').length,
			sansDecision: decisions.filter((d) => d.action === 'temps').length,
			total: Jeu.paquet.length,
			mauvaisesSources: decisions.filter((d) => d.mauvaiseSource).length,
			decisionsCles: cles.map((d) => ({
				qualite: d.qualite,
				titre: d.narration.titre,
				action: d.nomAction,
				deltas: d.deltas,
			})),
			faits: {
				periode: Jeu.etat.semaine ? Jeu.etat.semaine.lundi + ' → ' + Jeu.etat.semaine.dimanche : Jeu.etat.horodatage || '',
				pireRetard: pire ? { ligne: (pire.lignes || []).join(', '), minutes: pire.retard } : null,
				parType,
			},
		};
	};

	// =====================================================================
	// Prompt 20 — journées de travail, horloge simulée, sieste, mail de fin de journée
	// =====================================================================
	const DEBUT_JOURNEE = 6 * 60; // 6h00
	const FIN_JOURNEE = 20 * 60; // 20h00
	const NOMS_JAUGES_LONGS = { fluidite: T('jaugeLong.fluidite'), reputation: T('jaugeLong.reputation'), budget: T('jaugeLong.budget') };

	/**
	 * Découpe le paquet en journées (une par date réelle) et fixe l'heure d'arrivée de chaque dossier
	 * dans la journée de travail : l'heure réelle si la source la donne (alertes météo), sinon des
	 * créneaux réguliers entre 7h et 19h. Cette heure est l'heure DE LA PARTIE, pas un fait inventé.
	 */
	Jeu.preparerJournees = function () {
		const parJour = new Map();
		Jeu.paquet.forEach((d) => {
			if (!parJour.has(d.date)) parJour.set(d.date, []);
			parJour.get(d.date).push(d);
		});
		const jours = [];
		Array.from(parJour.keys())
			.sort()
			.forEach((date) => {
				const ds = parJour.get(date);
				const sans = ds.filter((d) => !d.heure);
				sans.forEach((d, i) => (d.minute = 7 * 60 + Math.round(((i + 1) * 12 * 60) / (sans.length + 1))));
				ds.filter((d) => d.heure).forEach((d) => (d.minute = Number(d.heure.slice(0, 2)) * 60 + Number(d.heure.slice(3, 5))));
				ds.sort((a, b) => a.minute - b.minute);
				jours.push({ date, dossiers: ds });
			});
		// Mode « aujourd'hui » : la journée part de l'heure réelle et les incidents arrivent toutes les 20 min
		if (Jeu.etat.mode === 'direct' && jours.length) {
			const maintenant = new Date();
			const m0 = maintenant.getHours() * 60 + maintenant.getMinutes();
			jours[0].debut = m0;
			jours[0].dossiers.forEach((d, i) => (d.minute = m0 + 10 + i * 20));
			jours[0].fin = m0 + 20 + jours[0].dossiers.length * 20;
		}
		Jeu.paquet = jours.flatMap((j) => j.dossiers);
		Jeu.etat.dossiers = Jeu.paquet;
		Jeu.jours = jours;
		Jeu.jourIndex = 0;
		Jeu.horloge = { minutes: jours[0] ? jours[0].debut || DEBUT_JOURNEE : DEBUT_JOURNEE };
		Jeu.defis = Jeu.tirerDefis(); // prompt 55 : trois défis tirés par la graine
		if (jours[0] && Jeu.messagesPatron) {
			Jeu.debutJourneeTactique();
			Jeu.messagePatron(consigneDuJour());
			Jeu.messagePatron(T('patron.defis', { liste: Jeu.defis.map((id) => T('defi.' + id)).join(' · ') })); // prompt 55 : annoncés le premier matin
			Jeu.prevenirAgenda(); // prompt 47
		}
	};

	Jeu.jourCourant = () => (Jeu.jours || [])[Jeu.jourIndex] || null;
	Jeu.debutJournee = () => (Jeu.jourCourant() && Jeu.jourCourant().debut) || DEBUT_JOURNEE;
	Jeu.finJournee = () => (Jeu.jourCourant() && Jeu.jourCourant().fin) || FIN_JOURNEE;
	/** Reste-t-il un dossier à traiter aujourd'hui ? (sinon : fin de journée, puis mail) */
	Jeu.prochainDuJour = function () {
		const d = Jeu.dossierCourant();
		const j = Jeu.jourCourant();
		return d && j && d.date === j.date ? d : null;
	};
	Jeu.journeeSuivante = function () {
		Jeu.jourIndex++;
		Jeu.alertesJauges = {};
		if (Jeu.jourCourant()) {
			Jeu.debutJourneeTactique();
			Jeu.messagePatron(consigneDuJour());
			Jeu.prevenirAgenda(); // prompt 47
			Jeu.appliquerBlame(); // prompt 51 : départ anticipé la veille
		}
		Jeu.horloge.minutes = Jeu.debutJournee();
		return Jeu.jourCourant();
	};
	Jeu.formaterHeure = function (minutes) {
		const m = Math.floor(minutes) % (24 * 60);
		return Math.floor(m / 60) + 'h' + String(m % 60).padStart(2, '0');
	};

	/** Jauge touchée par un dossier (pour le malus de sieste) */
	Jeu.jaugeConcernee = (d) => (d.type === 'événement' ? 'reputation' : 'fluidite');

	/** Sieste ratée (prompt 20 § 4) : −5 sur la jauge concernée, en plus des conséquences naturelles. */
	Jeu.malusSieste = function (resultat) {
		const k = Jeu.jaugeConcernee(resultat.dossier);
		Jeu.jauges[k] = Math.max(0, Jeu.jauges[k] - 5);
		const i = NOMS_JAUGES.indexOf(k);
		resultat.deltas[i] -= 5;
		resultat.sieste = true;
		if (Jeu.compterMalus) Jeu.compterMalus("sieste");
		resultat.narration = Jeu.narrer(resultat);
		resultat.narration.texte = T('narr.sieste', { texte: resultat.narration.texte });
	};

	// ——— Prompt 21 § 3 : journal de la journée et évaluation calculée des décisions ———
	const ACTIONS_EVALUEES = ['devier', 'retenir', 'renfort', 'rien'];

	/** Effet ATTENDU d'une action sur un dossier (table Q57–Q60, dé moyen, modificateurs Q24) — sert à comparer, pas à jouer */
	function effetAttendu(action, d, ctx) {
		if (action === 'rien') return [-5 / 3, -5 / 3, -5 / 3]; // −2 à −8 sur une jauge au hasard : −5 en moyenne
		const eff = REGLAGES.effets[action];
		const base = eff.base.slice();
		if (action === 'retenir') base[1] = d.retard !== null && d.retard !== undefined && d.retard > 20 ? 8 : 4;
		return base.map((b, i) => {
			if (!b) return 0;
			let v = Math.sign(b) * (Math.abs(b) + 2.5); // dé moyen : d6 − 1 = 2,5
			if ((i === 0 && ctx.meteo) || (i === 1 && (ctx.pointe || ctx.affluence))) v *= REGLAGES.coefContexte; // météo → fluidité ; pointe, affluence → réputation
			return borner(v);
		});
	}
	const somme = (t) => t.reduce((a, b) => a + b, 0);

	/** Événement externe réel du dossier (nature, météo, affluence) — jamais inventé */
	function externe(d, ctx) {
		let e = d.type === 'événement' ? T('ext.affluence', { nature: String(d.nature).split(',')[0] }) : d.type === 'ligne en difficulté' ? T('ext.retard') : d.nature;
		if (ctx.meteo && d.type !== 'alerte météo') e = T('ext.meteo', { e });
		return e;
	}

	Jeu.journaliser = function (r, ctx) {
		const d = r.dossier;
		const attendus = {};
		ACTIONS_EVALUEES.forEach((a) => (attendus[a] = somme(effetAttendu(a, d, ctx))));
		const meilleure = ACTIONS_EVALUEES.slice().sort((a, b) => attendus[b] - attendus[a])[0];
		const deltas = {};
		NOMS_JAUGES.forEach((k, i) => (deltas[k] = r.deltas[i]));
		const entree = {
			jour: d.date,
			heure: r.minuteSim === null ? '' : String(Math.floor(r.minuteSim / 60) % 24).padStart(2, '0') + ':' + String(Math.floor(r.minuteSim) % 60).padStart(2, '0'),
			ligne: d.lignes && d.lignes.length ? d.lignes.join(', ') : null,
			externe: externe(d, ctx),
			externeCourt: d.type === 'événement' ? String(d.nature).split(',')[0] : d.type === 'ligne en difficulté' ? T('ext.retard') : d.nature,
			retard: d.retard === undefined ? null : d.retard,
			action: r.action === 'temps' ? null : r.nomAction,
			cleAction: r.action,
			deltas, // deltas réels (référence vers le résultat : la sieste ratée les met à jour)
			meilleureAction: REGLAGES.effets[meilleure].nom,
			cleMeilleure: meilleure,
			attendus,
			resultat: r,
		};
		Jeu.evenementsJournee.push(entree);
		Jeu.reagirApps(entree);
		return entree;
	};

	/** Évaluation calculée (§ 3.2) : « bon choix ! », « raté », « aucun détour » ou « trop tard » */
	Jeu.evaluer = function (e) {
		// Codes (traduits à l'affichage par t('eval.' + code)) : 'bon', 'rate', 'aucun_detour', 'trop_tard'
		if (e.cleAction === 'temps') return 'trop_tard';
		const actions = ['devier', 'retenir', 'renfort'];
		if (e.cleMeilleure === 'rien' || actions.every((a) => e.attendus[a] < 0)) return e.cleAction === 'rien' ? 'bon' : 'aucun_detour';
		return e.attendus[e.cleAction] >= e.attendus[e.cleMeilleure] - 0.01 ? 'bon' : 'rate';
	};

	Jeu.ligneMail = function (e) {
		const sujet = e.ligne ? T('sujet.ligne', { ligne: e.ligne }) : T('sujet.reseau');
		const retard = e.retard !== null ? T('mail.retard', { retard: e.retard }) : '';
		const ev = Jeu.evaluer(e);
		const suite =
			e.cleAction === 'temps'
				? T(e.resultat.sieste ? 'mail.tropTardSieste' : 'mail.tropTard')
				: T(ev === 'rate' ? 'mail.suiteRate' : 'mail.suite', { action: e.action, ev: T('eval.' + ev), meilleure: e.meilleureAction });
		const impacts = NOMS_JAUGES.filter((k) => e.deltas[k] < 0).map((k) => T('delta', { jauge: LIBELLES_JAUGES[k], v: e.deltas[k] }));
		const ligne = T('mail.ligne', {
			heure: e.heure,
			sujet,
			externe: e.externe,
			retard,
			suite,
			source: e.resultat.mauvaiseSource ? T('mail.mauvaiseDate') : '',
			impacts: ev !== 'bon' && impacts.length ? T('mail.impacts', { liste: Liste(impacts, ', ') }) : '',
		});
		ligne.fait = true; // ligne de fait (couleur dans le mail)
		ligne.ok = ev === 'bon';
		return ligne;
	};

	/**
	 * Mail de fin de journée (prompt 20 § 6, enrichi au prompt 21 § 3) : une ligne par dossier traité,
	 * heure – ligne : événement externe + retard → action (évaluation), puis l'état réel des jauges.
	 */
	Jeu.mailDuJour = function () {
		const j = Jeu.jourCourant();
		const duJour = (Jeu.evenementsJournee || []).filter((e) => e.jour === (j && j.date)).sort((a, b) => a.heure.localeCompare(b.heure));
		const date = j ? j.date.split('-').reverse().join('/') : '';
		const parfaite = duJour.length > 0 && duJour.every((e) => Jeu.evaluer(e) === 'bon' && !e.resultat.mauvaiseSource);
		const lignes = [];
		if (parfaite) lignes.push(T('mail.parfait'));
		else {
			lignes.push(T('mail.journal', { date }));
			duJour.forEach((e) => lignes.push(Jeu.ligneMail(e)));
		}
		const obj = (Jeu.objectifsResultats || []).find((o) => o.jourIndex === Jeu.jourIndex);
		if (obj) lignes.push(T('mail.objectif', { libelle: obj.libelle, resultat: T(obj.atteint ? 'mail.atteint' : 'mail.rate', { effet: obj.effet }) }));
		lignes.push(T('mail.jauges', { f: Jeu.jauges.fluidite, r: Jeu.jauges.reputation, b: Jeu.jauges.budget }));
		// Prompt 55 : défis rappelés chaque soir ; le dernier soir, leur bilan avec les vrais chiffres
		if (Jeu.defis && Jeu.defis.length) {
			if (Jeu.jourIndex >= (Jeu.jours || []).length - 1) {
				lignes.push(T('mail.defisBilan'));
				Jeu.resultatsDefis().forEach((r) => lignes.push(T(r.tenu ? 'defi.tenu' : 'defi.rate', { defi: T('defi.' + r.id), valeur: r.valeur, bonus: T('delta', { jauge: LIBELLES_JAUGES[r.jauge], v: '+' + r.bonus }) })));
			} else lignes.push(T('mail.defis', { liste: Jeu.defis.map((id) => T('defi.' + id)).join(' · ') }));
		}
		const style = Jeu.profilGestion(duJour.map((e) => e.cleAction)); // prompt 47 : épilogue personnalisé
		if (style) lignes.push(T('mail.style', { profil: T('profil.' + style.id), n: style.n, total: style.total, action: T('profilAction.' + style.id) }));
		return {
			de: T('mail.de'),
			objet: T(parfaite ? 'mail.objetMerci' : 'mail.objetRevoir', { date }),
			positif: parfaite,
			lignes,
			dernier: Jeu.jourIndex >= (Jeu.jours || []).length - 1,
		};
	};

	// =====================================================================
	// Prompt 22 — applications du PC : patron, community manager, journal, équipes
	// Aucun fait inventé : tout texte reprend les données réelles des dossiers joués et des jauges.
	// =====================================================================
	const hhmm = (min) => String(Math.floor(min / 60) % 24).padStart(2, '0') + ':' + String(Math.floor(min) % 60).padStart(2, '0');
	const maintenantSim = () => hhmm(Jeu.horloge ? Jeu.horloge.minutes : 0);

	/** Applique des deltas aux jauges avec la même règle de bornes 0–100 que Jeu.decider */
	Jeu.appliquerDeltas = function (d) {
		Object.keys(d).forEach((k) => (Jeu.jauges[k] = Math.max(0, Math.min(100, Jeu.jauges[k] + d[k]))));
		Jeu.verifierAlertesPatron();
		if (Jeu.verifierPaliersBudget) Jeu.verifierPaliersBudget();
		if (Jeu.verifierConseilsPatron) Jeu.verifierConseilsPatron();
	};

	function consigneDuJour() {
		const j = Jeu.jourCourant();
		const n = j ? j.dossiers.length : 0;
		const o = Jeu.objectifDuJour();
		const mo = Jeu.modificateur;
		const m = mo ? (mo.actionBloquee ? T('patron.modBloque', { libelle: mo.libelle, action: REGLAGES.effets[mo.actionBloquee].nom }) : T('patron.mod', { libelle: mo.libelle })) : '';
		return T('patron.consigne', { n, date: j ? j.date.split('-').reverse().join('/') : '', objectif: o.libelle, budget: Jeu.jauges.budget, mod: m });
	}

	Jeu.messagePatron = function (texte) {
		Jeu.messagesPatron.push({ heure: maintenantSim(), texte });
		if (typeof annoncer === 'function') annoncer(texte); // aria-live, langue active
		Jeu.nonLus.patron++;
	};

	/** Alerte du patron quand une jauge passe sous 20 (Q46) — une fois par jauge et par jour */
	Jeu.verifierAlertesPatron = function () {
		if (!Jeu.messagesPatron) return;
		NOMS_JAUGES.forEach((k) => {
			if (Jeu.jauges[k] < REGLAGES.seuilCritique && !Jeu.alertesJauges[k]) {
				Jeu.alertesJauges[k] = true;
				Jeu.messagePatron(T('patron.alerte', { jauge: LIBELLES_JAUGES[k], v: Jeu.jauges[k] }));
			}
		});
	};

	// Commentaires nantais : modèles courts remplis avec les données réelles du dossier (pseudonymes fictifs)
	const PSEUDOS = ['@usager_44', '@nantaise_du_tram', '@velo_et_bus', '@ile_de_nantes', '@quai_de_la_fosse', '@chantenay_matin'];
	const COMMENTAIRES = { bon: 3, mauvais: 3, equipe: 1 }; // nombre de modèles par sorte (textes : i18n.js, clés com.<sorte>.<n>)
	const DELTA_REPUTATION = { bon: 2, mauvais: -3, equipe: 1 };

	Jeu.commenter = function (sorte, sujet, retard, equipe) {
		const n = Jeu.commentaires.length;
		const texte = T('com.' + sorte + '.' + (n % COMMENTAIRES[sorte]), {
			sujet,
			retard: retard !== null && retard !== undefined ? ' (+' + retard + ' min)' : '',
			heure: maintenantSim(),
			equipe: equipe || '',
		});
		const delta = DELTA_REPUTATION[sorte];
		Jeu.commentaires.push({ heure: maintenantSim(), auteur: PSEUDOS[n % PSEUDOS.length], texte, delta });
		Jeu.nonLus.community++;
		Jeu.appliquerDeltas({ reputation: delta }); // chaque commentaire fait évoluer la réputation
	};

	/** Après chaque dossier traité : un commentaire nantais et, si c'est raté, une réaction du patron */
	Jeu.reagirApps = function (e) {
		const sujet = e.ligne ? T('sujet.ligne', { ligne: e.ligne }) : e.externeCourt || e.externe;
		const ev = Jeu.evaluer(e);
		Jeu.commenter(ev === 'bon' ? 'bon' : 'mauvais', sujet, e.retard);
		if (ev === 'rate') Jeu.messagePatron(T('patron.rate', { sujet, action: e.action, meilleure: e.meilleureAction }));
		if (ev === 'trop_tard') Jeu.messagePatron(T('patron.tropTard', { sujet }));
		Jeu.verifierAlertesPatron();
	};

	// =====================================================================
	// Prompt 28 — plaintes des Nantais : contenu 100 % dans data/messages.json (rien de figé ici).
	// Une plainte n'est proposée que si sa condition correspond au dossier réel joué, et ses variables
	// ({ligne}, {retard}, {nature}) sont remplies avec les données de ce dossier — jamais inventées.
	// =====================================================================
	Jeu.MESSAGES = { plaintes: [] };
	/** Valide et retient les plaintes (entrée invalide ignorée, avec un avertissement en console) */
	Jeu.chargerMessages = function (donnees) {
		const ok = [];
		((donnees && donnees.plaintes) || []).forEach((p, i) => {
			const valide =
				p &&
				typeof p.id === 'string' &&
				p.texte &&
				typeof p.texte.fr === 'string' &&
				Array.isArray(p.reponses) &&
				p.reponses.length >= 2 &&
				p.reponses.every((r) => r && r.texte && typeof r.texte.fr === 'string') &&
				p.reponses.some((r) => r.bonne === true);
			if (valide) ok.push(p);
			else if (global.console) console.warn('messages.json : plainte n° ' + i + ' ignorée (id, texte.fr, 2 réponses dont une « bonne » requis)');
		});
		Jeu.MESSAGES = { plaintes: ok };
		return ok.length;
	};
	Jeu.chargerMessages(global.MESSAGES); // data/messages.js (double clic, hors ligne)
	// Servi par un serveur : on relit le JSON brut, pour qu'une modification à la main soit prise sans rien régénérer
	if (typeof fetch === 'function' && global.location && global.location.protocol !== 'file:')
		fetch('./data/messages.json', { cache: 'no-store' })
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => d && Jeu.chargerMessages(d))
			.catch(() => {});

	function variablesDossier(d) {
		const v = {};
		if (d.lignes && d.lignes.length) v.ligne = d.lignes.join(', ');
		if (d.retard !== null && d.retard !== undefined) v.retard = d.retard;
		if (d.nature) v.nature = String(d.nature).split(',')[0].trim();
		return v;
	}
	function variablesUtilisees(p) {
		const textes = [p.texte.fr, p.texte.en || ''].concat(p.reponses.map((r) => r.texte.fr + ' ' + (r.texte.en || '')));
		return (textes.join(' ').match(/\{(\w+)\}/g) || []).map((m) => m.slice(1, -1));
	}
	function plainteCorrespond(p, d, vars) {
		const c = p.condition || {};
		if (c.type && c.type !== '*' && c.type !== d.type) return false;
		if (c.retard_min !== undefined && !(typeof d.retard === 'number' && d.retard >= c.retard_min)) return false;
		if (c.ligne !== undefined && !(d.lignes || []).includes(String(c.ligne))) return false;
		if (c.nature_contient && !String(d.nature || '').toLowerCase().includes(String(c.nature_contient).toLowerCase())) return false;
		if (c.pointe && !contexte(d).pointe) return false;
		if (c.meteo === 'pluie' && !(((Jeu.meteoDuJour(d.date) || {}).pluie_mm || 0) >= 1)) return false;
		return variablesUtilisees(p).every((k) => vars[k] !== undefined);
	}
	const specificite = (p) => Object.keys(p.condition || {}).filter((k) => !(k === 'type' && p.condition.type === '*')).length;

	/** Texte d'une plainte ou d'une réponse dans la langue active (repli : français), variables remplies */
	Jeu.texteMessage = function (champ, vars) {
		const langue = typeof Langue !== 'undefined' ? Langue.actuelle : 'fr'; // const de i18n.js (pas une propriété de window)
		const s = (champ && (champ[langue] || champ.fr)) || '[À COMPLÉTER]';
		return s.replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? String(vars[k]) : m));
	};

	/** À la présentation d'un dossier : au plus une plainte, la plus spécifique parmi celles qui correspondent */
	Jeu.declencherPlainte = function (index) {
		const d = (Jeu.paquet || [])[index];
		if (!d || !Jeu.plaintes || Jeu.plaintes.some((p) => p.index === index)) return null;
		if (Jeu.plaintesEnAttente().length >= Jeu.MAX_PLAINTES_EN_ATTENTE) return null; // pas trop difficile : file courte
		const vars = variablesDossier(d);
		const candidates = Jeu.MESSAGES.plaintes.filter((p) => plainteCorrespond(p, d, vars));
		if (!candidates.length) return null;
		const dejaVues = new Set(Jeu.plaintes.map((p) => p.id));
		const neuves = candidates.filter((p) => !dejaVues.has(p.id));
		const pool = neuves.length ? neuves : candidates;
		const max = Math.max(...pool.map(specificite));
		const meilleures = pool.filter((p) => specificite(p) === max);
		const def = meilleures[index % meilleures.length]; // déterministe : ne touche pas au tirage des dés
		const plainte = { id: def.id, def, vars, index, heure: maintenantSim(), auteur: def.auteur || '@usager_44', reponse: null };
		Jeu.plaintes.push(plainte);
		Jeu.nonLus.community++;
		return plainte;
	};

	Jeu.MAX_PLAINTES_EN_ATTENTE = 3;
	Jeu.plaintesEnAttente = () => (Jeu.plaintes || []).filter((p) => p.reponse === null);

	/** Le joueur répond : effets du JSON (bornés à ±bornesEffet) appliqués aux jauges, bornées 0–100 */
	Jeu.repondrePlainte = function (plainte, i) {
		const r = plainte && plainte.reponse === null ? plainte.def.reponses[i] : null;
		if (!r) return null;
		const effets = {};
		NOMS_JAUGES.forEach((k) => {
			const v = Number((r.effets || {})[k]) || 0;
			if (v) effets[k] = borner(v);
		});
		plainte.reponse = i;
		plainte.bonne = r.bonne === true;
		Jeu.appliquerDeltas(effets);
		Jeu.commentaires.push({
			heure: maintenantSim(),
			auteur: T('plainte.reponseDe'),
			texte: { toString: () => Jeu.texteMessage(r.texte, plainte.vars) },
			delta: effets.reputation || 0,
		});
		Jeu.programmerSuivis(plainte); // prompt 63 : 0 à 3 réactions, à des heures variées
		return { effets, bonne: plainte.bonne };
	};

	// Prompt 63 — réactions en chaîne : tirées par hachage (graine + plainte), sans toucher aux dés de la partie
	Jeu.NB_MODELES_SUIVI = 4; // textes : i18n.js, suivi.<bonne|mauvaise>.<n>
	Jeu.programmerSuivis = function (plainte) {
		const h = (k) => hacher(String(Jeu.graine) + '|suivi|' + plainte.id + '|' + plainte.index + '|' + k);
		const n = h('n') % 4; // 0 à 3 réactions
		const base = Jeu.horloge ? Math.floor(Jeu.horloge.minutes) : 0;
		plainte.suivis = [];
		for (let i = 0; i < n; i++) {
			const delai = [4, 12, 35, 90, 240, 600][h('d' + i) % 6] + (h('j' + i) % 20); // certains répondent vite, d'autres tard (parfois le lendemain)
			plainte.suivis.push({
				jour: Jeu.jourIndex,
				minute: base + delai + i * 7,
				modele: h('m' + i) % Jeu.NB_MODELES_SUIVI,
				auteur: i === 0 ? plainte.auteur : PSEUDOS[h('a' + i) % PSEUDOS.length],
				delta: plainte.bonne ? 1 : -1,
				livre: false,
			});
		}
		return plainte.suivis;
	};
	/** Livre les réactions arrivées à échéance (heure de jeu dépassée, ou journée suivante) ; renvoie le nombre livré */
	Jeu.majSuivis = function () {
		if (!Jeu.plaintes || !Jeu.horloge) return 0;
		let n = 0;
		Jeu.plaintes.forEach((p) =>
			(p.suivis || []).forEach((sv) => {
				if (sv.livre) return;
				const fin = Jeu.finJournee();
				const echu = Jeu.jourIndex > sv.jour ? Jeu.horloge.minutes >= Jeu.debutJournee() + Math.max(0, sv.minute - fin) : Jeu.horloge.minutes >= sv.minute;
				if (!echu) return;
				sv.livre = true; // le modèle 0 cite la nature du dossier : il n'est pris que si elle existe
				n++;
				Jeu.commentaires.push({
					heure: maintenantSim(),
					auteur: sv.auteur,
					texte: T('suivi.' + (p.bonne ? 'bonne' : 'mauvaise') + '.' + (!p.vars.nature && sv.modele === 0 ? 1 : sv.modele), { ligne: p.vars.ligne || '', nature: p.vars.nature || '', auteur: p.auteur }),
					delta: sv.delta,
					suivi: true,
				});
				Jeu.nonLus.community++;
				Jeu.appliquerDeltas({ reputation: sv.delta });
			}),
		);
		return n;
	};
	Jeu.bilanPlaintes = () => ({ traitees: (Jeu.plaintes || []).filter((p) => p.reponse !== null).length, total: (Jeu.plaintes || []).length, bonnes: (Jeu.plaintes || []).filter((p) => p.bonne).length });

	// Équipes envoyées depuis la carte (façon centre d'appels) : coût en budget, effets à l'arrivée
	const EQUIPES = {
		ambulance: { nom: T('equipe.ambulance'), cout: 15, effets: { reputation: 8 } },
		police: { nom: T('equipe.police'), cout: 10, effets: { reputation: 5, fluidite: 3 } },
		techniciens: { nom: T('equipe.techniciens'), cout: 12, effets: { fluidite: 10 } },
		pompiers: { nom: T('equipe.pompiers'), cout: 15, palier: 70, effets: { reputation: 6, fluidite: 6 } }, // option coûteuse : débloquée si budget ≥ 70 (prompt 23 § 5.1)
	};
	Jeu.EQUIPES = EQUIPES;
	Jeu.DELAI_EQUIPE_MS = 20000; // arrivée 20 s (réelles) après l'envoi

	Jeu.equipePour = (index) => Jeu.equipes.find((q) => q.index === index) || null;

	/** Envoi d'une équipe sur le dossier d'index donné ; renvoie { ok, message } */
	Jeu.envoyerEquipe = function (index, cle, maintenant) {
		if (!Jeu.elementDebloque('equipes')) return { ok: false, message: T('histoire.verrou.equipes') }; // prompt 41 : semaine 2
		const q = EQUIPES[cle];
		const d = Jeu.paquet[index];
		if (!q || !d) return { ok: false, message: T('equipe.introuvable') };
		if (Jeu.equipePour(index)) return { ok: false, message: T('equipe.deja') };
		if (Jeu.jauges.budget < q.cout) return { ok: false, message: T('equipe.budget', { budget: Jeu.jauges.budget, cout: q.cout, nom: q.nom }) };
		if (q.palier && Jeu.jauges.budget < q.palier) return { ok: false, message: T('equipe.palier', { nom: q.nom, palier: q.palier, budget: Jeu.jauges.budget }) };
		Jeu.appliquerDeltas({ budget: -q.cout });
		if (index < Jeu.index) {
			// Équipe inutile (prompt 23 § 4) : l'incident est déjà résolu — coût perdu, réputation −3
			Jeu.compterMalus('equipe_inutile');
			Jeu.appliquerDeltas({ reputation: -3 });
			Jeu.equipes.push({ index, cle, nom: q.nom, cout: q.cout, depart: maintenant, arrivee: maintenant, heure: maintenantSim(), arrivee_sim: maintenantSim(), inutile: true, jour: d.date, sujet: d.lignes && d.lignes.length ? T('sujet.ligne', { ligne: d.lignes.join(', ') }) : d.nature });
			return { ok: false, message: T('equipe.inutile', { cout: q.cout }) };
		}
		Jeu.equipes.push({ index, cle, nom: q.nom, cout: q.cout, depart: maintenant, arrivee: maintenant + Jeu.DELAI_EQUIPE_MS, heure: maintenantSim(), arrivee_sim: null, jour: d.date, sujet: d.lignes && d.lignes.length ? T('sujet.ligne', { ligne: d.lignes.join(', ') }) : d.nature });
		return { ok: true, message: T('equipe.enRoute', { nom: q.nom, cout: q.cout }) };
	};

	/** À appeler à chaque image : applique les effets des équipes arrivées */
	Jeu.majEquipes = function (maintenant) {
		(Jeu.equipes || []).forEach((q) => {
			if (q.arrivee_sim === null && !q.inutile && maintenant >= q.arrivee) {
				q.arrivee_sim = maintenantSim();
				Jeu.appliquerDeltas(EQUIPES[q.cle].effets);
				Jeu.commenter('equipe', q.sujet, null, q.nom);
			}
		});
	};

	// =====================================================================
	// Prompt 23 — profondeur tactique : conseils, modificateurs, objectifs, malus, budget, profil
	// Tout s'appuie sur les incidents, jauges et budget réels de la partie en cours.
	// =====================================================================

	/** § 1 — Conseil contextuel : une phrase, jamais une action recommandée */
	// Prompt 59 : plus affiché depuis le prompt 50 (le joueur enquête lui-même) ; conservé pour la doc jeu/17
	Jeu.conseil = function (d) {
		if (!d) return '';
		const recents = (Jeu.evenementsJournee || []).slice(-3);
		const repBaisse = recents.some((e) => e.deltas.reputation < 0) || (Jeu.commentaires || []).slice(-3).some((c) => c.delta < 0);
		if (d.retard !== null && d.retard !== undefined && d.retard >= 18 && d.lignes && d.lignes.length && repBaisse)
			return T('conseil.retard', { lignes: d.lignes.join(', '), retard: d.retard });
		const basse = NOMS_JAUGES.filter((k) => Jeu.jauges[k] < 30).sort((a, b) => Jeu.jauges[a] - Jeu.jauges[b])[0];
		if (basse) return T('conseil.basse', { jauge: LIBELLES_JAUGES[basse], v: Jeu.jauges[basse] });
		if (d.contradiction || (Jeu.conflit && Jeu.conflit())) return T('conseil.conflit');
		const ctx = contexte(d);
		const m = Jeu.meteoDuJour(d.date) || {};
		if (ctx.meteo) return T('conseil.meteo', { rafales: Math.round(m.rafales_max || 0), pluie: m.pluie_mm || 0 });
		if (ctx.affluence) return T('conseil.affluence', { nature: String(d.nature).split(',')[0] });
		if (ctx.pointe) return T('conseil.pointe');
		return T('conseil.budget', { b: Jeu.jauges.budget });
	};

	/** § 2 — Modificateurs (un par journée, tirés avec le générateur à graine fixe : partie rejouable) */
	const MODIFICATEURS = [
		{ id: 'meteo_aggravee', duree_s: 60, libelle: T('mod.meteo_aggravee') },
		{ id: 'heure_pointe', duree_s: 45, libelle: T('mod.heure_pointe') },
		{ id: 'panne_messagerie', duree_s: 60, libelle: T('mod.panne_messagerie') },
	];
	Jeu.MODIFICATEURS = MODIFICATEURS;
	Jeu.forcerModificateur = null; // test : forcer un id

	/** Armé en début de journée, démarre à l'arrivée du premier incident, dure duree_s secondes réelles */
	Jeu.tirerModificateur = function () {
		if (!Jeu.elementDebloque('crise')) return void (Jeu.modificateur = null); // prompt 41 : imprévus à partir de la semaine 3
		const m = Jeu.forcerModificateur ? MODIFICATEURS.find((x) => x.id === Jeu.forcerModificateur) : MODIFICATEURS[Math.floor(Jeu.alea() * MODIFICATEURS.length)];
		Jeu.modificateur = Object.assign({}, m, { debut: null, fin: null, actionBloquee: null }); // plus d'« erreur système » (retirée sur demande)
	};
	Jeu.demarrerModificateur = function (maintenant) {
		if (Jeu.modificateur && Jeu.modificateur.debut === null) {
			Jeu.modificateur.debut = maintenant;
			Jeu.modificateur.fin = maintenant + Jeu.modificateur.duree_s * 1000;
		}
	};
	Jeu.modificateurActif = function (maintenant) {
		const m = Jeu.modificateur;
		if (!m || m.debut === null) return null;
		const t = maintenant !== undefined ? maintenant : typeof millis === 'function' ? millis() : Date.now();
		return t < m.fin ? m.id : null;
	};
	Jeu.actionBloquee = () => null; // les fausses erreurs système du PC ont été retirées : aucune action n'est jamais bloquée

	/** § 3 — Objectifs de journée qui se resserrent */
	const OBJECTIFS = [
		{ jour: 1, jauge: 'fluidite', seuil: 40, libelle: T('obj.garder', { jauge: LIBELLES_JAUGES.fluidite, seuil: 40 }) },
		{ jour: 2, jauge: 'fluidite', seuil: 45, libelle: T('obj.garder', { jauge: LIBELLES_JAUGES.fluidite, seuil: 45 }) },
		{ jour: 3, jauge: 'reputation', seuil: 45, libelle: T('obj.garder', { jauge: LIBELLES_JAUGES.reputation, seuil: 45 }) },
		{ jour: 4, jauge: 'reputation', seuil: 50, libelle: T('obj.garder', { jauge: LIBELLES_JAUGES.reputation, seuil: 50 }) },
		{ jour: 5, jauge: 'budget', seuil: 30, libelle: T('obj.budget', { seuil: 30 }) },
	];
	Jeu.OBJECTIFS = OBJECTIFS;
	Jeu.objectifDuJour = () => OBJECTIFS[Math.min(Jeu.jourIndex || 0, OBJECTIFS.length - 1)];

	Jeu.debutJourneeTactique = function () {
		Jeu.tirerModificateur();
		Jeu.paliersBudget = {};
	};

	/** Fin de journée : objectif (bonus ou malus) et malus « budget épuisé » — une seule fois par jour */
	Jeu.finDeJourneeTactique = function () {
		if ((Jeu.objectifsResultats || []).some((o) => o.jourIndex === Jeu.jourIndex)) return;
		const o = Jeu.objectifDuJour();
		const atteint = Jeu.jauges[o.jauge] >= o.seuil;
		let effet;
		if (atteint) {
			const f = Jeu.facteurBonusObjectif ? Jeu.facteurBonusObjectif() : 1; // semaine 1 du mode histoire : bonus ×1,5 (histoire.js)
			const bonus = o.jauge === 'budget' ? { reputation: Math.round(5 * f) } : { budget: Math.round(10 * f) };
			Jeu.appliquerDeltas(bonus);
			effet = T('obj.bonus', { liste: Liste(Object.keys(bonus).map((k) => T('delta', { jauge: LIBELLES_JAUGES[k], v: '+' + bonus[k] })), ', ') });
		} else {
			Jeu.compterMalus('objectif_rate');
			Jeu.appliquerDeltas({ [o.jauge]: -5 });
			effet = T('obj.malus', { jauge: LIBELLES_JAUGES[o.jauge] });
		}
		Jeu.objectifsResultats.push({ jourIndex: Jeu.jourIndex, libelle: o.libelle, atteint, valeur: Jeu.jauges[o.jauge], effet });
		if (Jeu.jourIndex >= (Jeu.jours || []).length - 1) Jeu.appliquerDefis(); // prompt 55 : fin de semaine
		if (Jeu.jauges.budget <= 0) {
			// « Budget négatif » : le budget est borné à 0, le malus s'applique donc quand il est épuisé
			Jeu.compterMalus('budget_epuise');
			Jeu.appliquerDeltas({ reputation: -8 });
		}
	};

	/** § 4 — Table unique des malus (affichée dans l'aide H) */
	Jeu.MALUS = [
		{ id: 'non_traite', libelle: T('malus.non_traite.l'), condition: T('malus.non_traite.c'), consequence: T('malus.non_traite.q') },
		{ id: 'sieste', libelle: T('malus.sieste.l'), condition: T('malus.sieste.c'), consequence: T('malus.sieste.q') },
		{ id: 'objectif_rate', libelle: T('malus.objectif_rate.l'), condition: T('malus.objectif_rate.c'), consequence: T('malus.objectif_rate.q') },
		{ id: 'equipe_inutile', libelle: T('malus.equipe_inutile.l'), condition: T('malus.equipe_inutile.c'), consequence: T('malus.equipe_inutile.q') },
		{ id: 'budget_epuise', libelle: T('malus.budget_epuise.l'), condition: T('malus.budget_epuise.c'), consequence: T('malus.budget_epuise.q') },
	];
	Jeu.compterMalus = function (id) {
		Jeu.malus = Jeu.malus || {};
		Jeu.malus[id] = (Jeu.malus[id] || 0) + 1;
	};

	/** § 5 — Paliers de budget : messages du patron, une fois par journée et par palier */
	Jeu.verifierPaliersBudget = function () {
		if (!Jeu.messagesPatron || !Jeu.paliersBudget) return;
		const b = Jeu.jauges.budget;
		const palier = b < 20 ? 'bas' : b >= 70 ? 'haut' : 'moyen';
		if (Jeu.paliersBudget[palier]) return;
		Jeu.paliersBudget[palier] = true;
		if (palier === 'bas') Jeu.messagePatron(T('patron.budgetBas', { b }));
		else if (palier === 'haut') Jeu.messagePatron(T('patron.budgetHaut', { b }));
		else if (Jeu.paliersBudget.bas || Jeu.paliersBudget.haut) Jeu.messagePatron(T('patron.budgetMoyen', { b }));
	};

	/** Conseil repris par le patron quand une jauge passe sous 30 (une fois par jauge et par jour) */
	Jeu.verifierConseilsPatron = function () {
		if (!Jeu.messagesPatron) return;
		NOMS_JAUGES.forEach((k) => {
			const cle = 'conseil_' + k;
			if (Jeu.jauges[k] < 30 && !Jeu.alertesJauges[cle]) {
				Jeu.alertesJauges[cle] = true;
				Jeu.messagePatron(T('conseil.basse', { jauge: LIBELLES_JAUGES[k], v: Jeu.jauges[k] }));
			}
		});
	};

	/** § 6 — Profil de la semaine (fin personnalisée), à partir des seules données réelles */
	Jeu.profilSemaine = function () {
		const tri = NOMS_JAUGES.slice().sort((a, b) => Jeu.jauges[b] - Jeu.jauges[a]);
		const parJour = {};
		(Jeu.evenementsJournee || []).forEach((e) => {
			const pos = NOMS_JAUGES.reduce((s2, k) => s2 + Math.max(0, e.deltas[k]), 0);
			parJour[e.jour] = (parJour[e.jour] || 0) + pos;
		});
		const meilleurJour = Object.keys(parJour).sort((a, b) => parJour[b] - parJour[a])[0] || null;
		const malusFrequent = Object.keys(Jeu.malus || {}).sort((a, b) => Jeu.malus[b] - Jeu.malus[a])[0] || null;
		const m = malusFrequent ? Jeu.MALUS.find((x) => x.id === malusFrequent) : null;
		const atteints = (Jeu.objectifsResultats || []).filter((o) => o.atteint).length;
		const haut = tri[0];
		const bas = tri[tri.length - 1];
		const phrase =
			T('profil.phrase', {
				qualite: T(Jeu.jauges[haut] >= 60 ? 'profil.solide' : 'profil.fragile'),
				jauge: LIBELLES_JAUGES[haut],
				v: Jeu.jauges[haut],
				malus: m ? T('profil.malus', { n: Jeu.malus[malusFrequent], libelle: m.libelle }) : '',
			});
		return {
			phrase,
			haut: { jauge: LIBELLES_JAUGES[haut], valeur: Jeu.jauges[haut] },
			bas: { jauge: LIBELLES_JAUGES[bas], valeur: Jeu.jauges[bas] },
			meilleurJour: meilleurJour ? meilleurJour.split('-').reverse().join('/') : '—',
			malusFrequent: m ? T('profil.malusFrequent', { libelle: m.libelle, n: Jeu.malus[malusFrequent] }) : T('profil.aucun'),
			budget: Jeu.jauges.budget,
			equipes: (Jeu.equipes || []).length,
			objectifs: atteints + '/' + (Jeu.objectifsResultats || []).length,
		};
	};

	// =====================================================================
	// Prompt 47 — profils de gestion, inspection surprise, agenda anticipé, démission
	// Uniquement à partir des décisions réelles de la partie et des données réelles de la semaine.
	// =====================================================================
	Jeu.CARNET_MAX = 2000; // caractères du journal de bord

	/** Profil de gestion d'après les actions jouées (clés : renfort, devier, retenir, rien, temps) ; null si aucune */
	const PROFILS = { renfort: 'pompier', devier: 'stratege', retenir: 'discret', rien: 'spectateur', temps: 'spectateur' };
	Jeu.profilGestion = function (actions) {
		const n = {};
		(actions || []).forEach((a) => {
			const p = PROFILS[a];
			if (p) n[p] = (n[p] || 0) + 1;
		});
		const total = Object.values(n).reduce((s, v) => s + v, 0);
		if (!total) return null;
		const ordre = ['pompier', 'stratege', 'discret', 'spectateur']; // égalité : l'ordre des actions à l'écran
		const id = ordre.slice().sort((a, b) => (n[b] || 0) - (n[a] || 0) || ordre.indexOf(a) - ordre.indexOf(b))[0];
		return { id, n: n[id], total };
	};
	Jeu.profilPartie = () => Jeu.profilGestion((Jeu.historique || []).filter((h) => h.action).map((h) => h.action));

	/** Jauge que la décision a le plus servie (deltas réels) ; null si aucun effet positif */
	function jaugeServie(e) {
		const [k, k2] = NOMS_JAUGES.slice().sort((a, b) => e.deltas[b] - e.deltas[a]);
		return e.deltas[k] > 0 && e.deltas[k] > e.deltas[k2] ? k : null; // réponse unique : pas d'égalité en tête
	}
	/** Hachage stable (ne consomme pas le générateur de la partie : la suite des dés reste identique) */
	function hacher(texte) {
		let h = 2166136261;
		for (let i = 0; i < texte.length; i++) h = Math.imul(h ^ texte.charCodeAt(i), 16777619);
		return h >>> 0;
	}
	/** Jour de l'inspection : le 3e jour joué (ou le dernier si la semaine est plus courte), une fois par semaine */
	Jeu.jourInspection = () => Math.min(2, Math.max(0, (Jeu.jours || []).length - 1));
	/** Prépare l'inspection si c'est le jour : une décision réelle passée, avec au moins un effet positif */
	Jeu.preparerInspection = function () {
		if (Jeu.inspection || !Jeu.jours || Jeu.jourIndex !== Jeu.jourInspection() || Jeu.jourIndex === 0) return null;
		const candidates = (Jeu.evenementsJournee || []).filter((e) => e.cleAction && e.cleAction !== 'temps' && e.cleAction !== 'rien' && jaugeServie(e));
		if (!candidates.length) return null;
		const e = candidates[hacher(String(Jeu.graine) + '|' + Jeu.jourIndex) % candidates.length];
		// Textes gardés en données brutes (ligne, nature réelle, clé d'action) : la sauvegarde reste lisible dans les deux langues
		Jeu.inspection = { jour: e.jour, heure: e.heure, ligne: e.ligne, nature: e.ligne ? null : String(e.externeCourt), cle: e.cleAction, bonne: jaugeServie(e), reponse: null };
		return Jeu.inspection;
	};
	/** Réponse du joueur (fluidite, reputation ou budget) : réputation +3 si juste, −2 sinon */
	Jeu.repondreInspection = function (jauge) {
		const i = Jeu.inspection;
		if (!i || i.reponse) return null;
		i.reponse = jauge;
		i.juste = jauge === i.bonne;
		i.effet = i.juste ? 3 : -2;
		Jeu.appliquerDeltas({ reputation: i.effet });
		return i;
	};

	/** Agenda anticipé : événements réels du jour qui attirent du public (concert, sport, spectacle…) */
	const MOTIF_AFFLUENCE = /concert|musique|sport|match|spectacle|th[ée][âa]tre|cirque|danse|festival|humour/i;
	Jeu.evenementsAffluence = function (date) {
		const sources = [];
		const e = Jeu.etat || {};
		if (e.semaine && e.semaine.evenements) sources.push(...e.semaine.evenements);
		(Jeu.paquet || []).filter((d) => d.type === 'événement').forEach((d) => sources.push(d));
		const vus = new Set();
		return sources
			.map((x) => {
				// Types de l'agenda : on ignore les fiches « fourre-tout » (plus de 3 types cochés, ex. tous)
				const types = String(x.nature || '').split(',').map((s) => s.trim());
				const type = types.length <= 3 ? types.find((s) => MOTIF_AFFLUENCE.test(s)) : null;
				return type ? Object.assign({}, x, { typeAffluence: type }) : null;
			})
			.filter((x) => {
				if (!x || x.date !== date || vus.has(x.texte_source || x.nature)) return false;
				vus.add(x.texte_source || x.nature);
				return true;
			});
	};
	Jeu.prevenirAgenda = function () {
		const j = Jeu.jourCourant();
		if (!j || !Jeu.messagesPatron || (Jeu.agendaPrevenus || {})[j.date]) return null;
		const ev = Jeu.evenementsAffluence(j.date)[0];
		if (!ev) return null;
		Jeu.agendaPrevenus[j.date] = true;
		const [titre, lieu] = String(ev.texte_source || ev.nature).split(' — ');
		Jeu.messagePatron(T('patron.agenda', { titre, lieu: lieu ? ', ' + lieu : '', type: ev.typeAffluence }));
		return ev;
	};

	/** Démission possible quand les trois jauges sont sous le seuil critique (Q46) */
	Jeu.peutDemissionner = () => !Jeu.terminee && !!Jeu.jauges && NOMS_JAUGES.every((k) => Jeu.jauges[k] < REGLAGES.seuilCritique);

	// =====================================================================
	// Prompt 51 — finir sa journée à l'horloge ; départ anticipé et blâme du patron le lendemain
	// =====================================================================
	Jeu.MALUS_DEPART = -8; // réputation : le patron retire sa confiance
	Jeu.dossiersRestantsDuJour = function () {
		const j = Jeu.jourCourant();
		return j ? j.dossiers.filter((d) => Jeu.paquet.indexOf(d) >= Jeu.index).length : 0;
	};
	/** La journée est-elle finie (plus de dossier du jour et heure de fin atteinte) ? */
	Jeu.journeeFinie = () => !Jeu.prochainDuJour() && !!Jeu.horloge && Jeu.horloge.minutes >= Jeu.finJournee();
	/**
	 * Départ avant la fin : les dossiers restants du jour suivent la règle « non traité » (Q25, conséquences
	 * naturelles) ; le blâme sera appliqué une seule fois, à l'ouverture de la journée suivante.
	 */
	Jeu.partirAvantLaFin = function (heure) {
		const laisses = Jeu.dossiersRestantsDuJour();
		let garde = 0;
		while (Jeu.prochainDuJour() && garde++ < 200) Jeu.decider('temps');
		Jeu.depart = { jour: (Jeu.jourCourant() || {}).date || null, heure, fin: hhmm(Jeu.finJournee()), laisses, applique: false };
		return Jeu.depart;
	};
	Jeu.appliquerBlame = function () {
		const d = Jeu.depart;
		if (!d || d.applique) return null;
		d.applique = true;
		Jeu.appliquerDeltas({ reputation: Jeu.MALUS_DEPART });
		const texte = T('patron.blame', { date: d.jour ? d.jour.split('-').reverse().join('/') : '', heure: d.heure, fin: d.fin, n: d.laisses, malus: Jeu.MALUS_DEPART });
		Jeu.messagePatron(texte);
		Jeu.blame = { texte, lu: false, malus: Jeu.MALUS_DEPART };
		return Jeu.blame;
	};

	// =====================================================================
	// Prompt 55 — défis de semaine (calculés sur la partie réelle) et ralenti tactique
	// =====================================================================
	const DEFIS = {
		zero_expire: { jauge: 'reputation', valeur: () => (Jeu.historique || []).filter((h) => h.action === 'temps').length, tenu: (v) => v === 0 },
		budget60: { jauge: 'budget', valeur: () => Jeu.jauges.budget, tenu: (v) => v >= 60 },
		fluidite60: { jauge: 'fluidite', valeur: () => Jeu.jauges.fluidite, tenu: (v) => v >= 60 },
		plaintes: { jauge: 'reputation', valeur: () => { const b = Jeu.bilanPlaintes(); return b.traitees + '/' + b.total; }, tenu: () => { const b = Jeu.bilanPlaintes(); return b.traitees === b.total; }, element: 'plaintes' },
		equipes: { jauge: 'reputation', valeur: () => (Jeu.malus || {}).equipe_inutile || 0, tenu: (v) => v === 0, element: 'equipes' },
	};
	Jeu.DEFIS = Object.keys(DEFIS);
	Jeu.BONUS_DEFI = 5;
	/** Trois défis distincts, choisis par hachage de la graine (le générateur de dés n'est pas consommé) */
	Jeu.tirerDefis = function () {
		const possibles = Object.keys(DEFIS).filter((id) => !DEFIS[id].element || Jeu.elementDebloque(DEFIS[id].element));
		const h = (id) => hacher(String(Jeu.graine) + '|defi|' + id);
		return possibles.sort((a, b) => h(a) - h(b)).slice(0, 3);
	};
	Jeu.resultatsDefis = function () {
		return (Jeu.defis || []).map((id) => {
			const d = DEFIS[id];
			const valeur = d.valeur();
			return { id, jauge: d.jauge, valeur, tenu: !!d.tenu(valeur), bonus: Jeu.BONUS_DEFI };
		});
	};
	/** Bonus des défis tenus : +5 sur la jauge concernée, une seule fois, en fin de semaine (pas après une démission) */
	Jeu.appliquerDefis = function () {
		if (Jeu.defisAppliques || !Jeu.defis || Jeu.demission) return null;
		const res = Jeu.resultatsDefis();
		Jeu.defisAppliques = res;
		res.filter((r) => r.tenu).forEach((r) => Jeu.appliquerDeltas({ [r.jauge]: r.bonus }));
		return res;
	};

	/** Ralenti tactique : compteur suspendu 10 s, une fois par journée de jeu ; aucun effet sur les jauges */
	Jeu.DUREE_RALENTI_MS = 10000;
	Jeu.demanderRalenti = function (maintenant) {
		const r = Jeu.ralenti;
		if (r.jour === Jeu.jourIndex) return false; // déjà utilisé aujourd'hui
		r.jour = Jeu.jourIndex;
		r.debut = maintenant;
		r.fin = maintenant + Jeu.DUREE_RALENTI_MS;
		r.utilises++;
		return true;
	};
	Jeu.ralentiActif = (maintenant) => !!Jeu.ralenti && Jeu.ralenti.jour === Jeu.jourIndex && maintenant >= Jeu.ralenti.debut && maintenant < Jeu.ralenti.fin;
	Jeu.ralentiDisponible = () => !!Jeu.ralenti && Jeu.ralenti.jour !== Jeu.jourIndex;

	// =====================================================================
	// Prompt 56 — chiffres réels de la semaine et mail du patron du dernier soir
	// =====================================================================
	Jeu.statsSemaine = function () {
		const dec = (Jeu.historique || []).filter((h) => h.action);
		const parAction = { devier: 0, retenir: 0, renfort: 0, rien: 0, temps: 0 };
		dec.forEach((h) => (parAction[h.action] = (parAction[h.action] || 0) + 1));
		const durees = dec.filter((h) => typeof h.dureeMs === 'number');
		return {
			recus: (Jeu.paquet || []).length,
			traites: dec.filter((h) => h.action !== 'temps').length,
			expires: parAction.temps,
			parAction,
			tempsMoyen: durees.length ? Math.round(durees.reduce((s, h) => s + h.dureeMs, 0) / durees.length / 100) / 10 : null, // secondes, 1 décimale
			sources: dec.reduce((s, h) => s + (h.sources || 0), 0),
			ralentis: (Jeu.ralenti && Jeu.ralenti.utilises) || 0,
			objectifs: (Jeu.objectifsResultats || []).filter((o) => o.atteint).length + '/' + (Jeu.objectifsResultats || []).length,
			jauges: Object.assign({}, Jeu.jauges),
			score: Jeu.score(),
		};
	};
	/** Mail du patron du dernier soir : félicitations, avertissement ou rappel, avec 2 à 3 vrais chiffres */
	Jeu.mailFinSemaine = function () {
		const s = Jeu.statsSemaine();
		const res = Jeu.defis ? Jeu.resultatsDefis() : [];
		const rates = res.filter((r) => !r.tenu);
		const [ok, total] = s.objectifs.split('/').map(Number);
		const basse = NOMS_JAUGES.slice().sort((a, b) => s.jauges[a] - s.jauges[b])[0];
		const lignes = [T('finSemaine.intro', { score: s.score, traites: s.traites, recus: s.recus })];
		if (total && ok === total) lignes.push(T('finSemaine.bravo', { objectifs: s.objectifs }));
		else lignes.push(T('finSemaine.objectifs', { objectifs: s.objectifs }));
		if (s.jauges[basse] < 40) lignes.push(T('finSemaine.alerte', { jauge: LIBELLES_JAUGES[basse], v: s.jauges[basse] }));
		if (rates.length) lignes.push(T('finSemaine.defisRates', { liste: rates.map((r) => T('defi.' + r.id)).join(', ') }));
		else if (res.length) lignes.push(T('finSemaine.defisTenus'));
		if (s.expires) lignes.push(T('finSemaine.expires', { n: s.expires }));
		return { objet: T(total && ok === total && !rates.length ? 'finSemaine.objetBravo' : 'finSemaine.objet'), lignes };
	};

	global.Jeu = Jeu;
})(typeof window !== 'undefined' ? window : globalThis);
