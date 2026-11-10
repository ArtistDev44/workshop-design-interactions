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
		if (!s) return Jeu.chargerHorsLigne('Semaine introuvable : semaine de référence hors ligne.');
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
			message: message || 'Mode hors ligne : semaine de référence enregistrée.',
		};
		return Promise.resolve(Jeu.etat);
	};

	/** Mode « aujourd'hui en direct » : un seul appel GTFS-RT au lancement, repli hors ligne si échec. */
	Jeu.chargerDirect = function () {
		if (!global.PXE_GTFSRT) return Jeu.chargerHorsLigne('Décodeur absent : mode hors ligne.');
		return global.PXE_GTFSRT.charger(global.PXE_GTFSRT.FLUX.tripUpdates, DELAI_DIRECT_MS)
			.then(function (flux) {
				const retards = global.PXE_GTFSRT.retardsParLigne(flux, SEUIL_RETARD_MIN);
				if (!retards.length) return Jeu.chargerHorsLigne('Aucun retard ≥ 10 min en ce moment : semaine de référence.');
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
							source: 'Flux GTFS-RT trip-updates Naolib (temps réel)',
							texte_source: 'Retard de ' + r.retardMin + ' min mesuré sur la ligne ' + Jeu.nomLigne(r.ligne),
						};
					}),
					horsLigne: false,
					message: '',
				};
				if (typeof console !== 'undefined') console.info('[direct] ' + retards.length + ' ligne(s) avec un retard ≥ ' + SEUIL_RETARD_MIN + ' min');
				return Jeu.etat;
			})
			.catch(function () {
				return Jeu.chargerHorsLigne('Flux temps réel injoignable : mode hors ligne.');
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
			devier: { nom: 'Dévier la ligne', base: [-6, 6, -3], communique: true }, // détour : un peu de fluidité perdue, usagers informés, petit coût
			retenir: { nom: 'Retenir en terminus', base: [-7, null, 2] }, // réputation : +8 si retard > 20 min sinon +4 (Q58) ; économise du budget
			renfort: { nom: 'Bus de renfort', base: [12, 4, -12] }, // efficace mais cher : le budget n'est plus gratuit
			rien: { nom: 'Ne rien faire' }, // −2 à −8 sur une jauge tirée au hasard (Q60)
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
	const LIBELLES_JAUGES = { fluidite: 'fluidité', reputation: 'réputation', budget: 'budget' };
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
			question: 'Deux dates pour le même dossier : laquelle croire ?',
			a: { libelle: 'Date de publication du changelog : ' + d.date, date: d.date },
			b: { libelle: 'Date annoncée dans le texte : ' + annoncee, date: annoncee },
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
		Jeu.alea = mulberry32(e.seed || graineDe(e.semaine ? e.semaine.lundi : e.horodatage || 'direct'));
		Jeu.jauges = { fluidite: 50, reputation: 50, budget: 50 }; // Q40 (prompt 22 : trio fluidité / réputation / budget)
		Jeu.paquet = construirePaquet(e);
		e.dossiers = Jeu.paquet; // l'affichage (carte, liste) lit le paquet de la partie
		Jeu.index = 0;
		Jeu.historique = [];
		Jeu.evenementsJournee = []; // prompt 21 § 3.1 : journal des dossiers traités
		Jeu.messagesPatron = []; // prompt 22 : app « Messages du patron »
		Jeu.commentaires = []; // prompt 22 : app « Community manager »
		Jeu.equipes = []; // prompt 22 : équipes envoyées depuis la carte
		Jeu.nonLus = { patron: 0, community: 0 };
		Jeu.alertesJauges = {};
		Jeu.malus = {};
		Jeu.objectifsResultats = [];
		Jeu.modificateur = null;
		Jeu.paliersBudget = {};
		Jeu.terminee = Jeu.paquet.length === 0;
		Jeu.preparerJournees();
		return Jeu.paquet;
	};

	Jeu.dossierCourant = () => (Jeu.paquet || [])[Jeu.index] || null;
	Jeu.score = () => NOMS_JAUGES.reduce((s, k) => s + Jeu.jauges[k], 0); // 0–300, poids égaux (Q44)

	/* Conflit de deux lignes (Q27) : le dossier suivant a la même date et concerne d'autres lignes. */
	Jeu.conflit = function () {
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
		Jeu.historique.push({ type: 'priorité', texte: 'Priorité donnée à la ligne ' + Jeu.dossierCourant().lignes.join(', ') });
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
			nomAction: action === 'temps' ? 'Temps écoulé : aucune décision' : REGLAGES.effets[action].nom,
			deltas,
			des,
			contexte: ctx,
			mauvaiseSource,
			communique: action !== 'temps' && !!(REGLAGES.effets[action] || {}).communique,
		};
		resultat.minuteSim = Jeu.horloge ? Math.floor(Jeu.horloge.minutes) : null; // heure de la partie (prompt 20)
		resultat.jour = d.date;
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
		const objet = d.lignes && d.lignes.length ? 'ligne ' + d.lignes.join(', ') : d.type === 'événement' ? 'affluence' : d.nature;
		const fait = d.retard !== null && d.retard !== undefined ? ' (+' + d.retard + ' min)' : '';
		const bilan = r.deltas
			.map((v, i) => (v ? LIBELLES_JAUGES[NOMS_JAUGES[i]] + ' ' + (v > 0 ? '+' : '') + v : null))
			.filter(Boolean)
			.join(', ');
		const ton = Jeu.ton();
		const reaction = {
			neutre: 'La salle de contrôle garde la main.',
			tendu: 'Les téléphones sonnent : la direction suit la semaine de près.',
			critique: 'La direction exige des explications : la confiance s’effrite.',
		}[ton];
		return {
			titre: quand + ' — ' + objet + fait,
			texte:
				r.nomAction +
				'.' +
				(r.communique ? ' Les usagers sont informés de la déviation.' : '') +
				(r.mauvaiseSource ? ' La mauvaise date a été retenue : la perturbation a surpris le réseau.' : '') +
				(bilan ? ' ' + bilan.charAt(0).toUpperCase() + bilan.slice(1) + '.' : ' Aucun effet sur les jauges.') +
				' ' +
				reaction,
			ton,
		};
	};

	// =====================================================================
	// Prompt 19 — fins (Q43, Q47–Q55) et bilan détaillé
	// =====================================================================
	const FINS = {
		bonne: {
			titre: 'La direction félicite la salle de contrôle',
			texte:
				'La semaine a été tenue. Face aux perturbations, les décisions ont préservé la fluidité du réseau, ' +
				'les usagers ont été pris en compte et la salle de contrôle sort renforcée de ces sept jours.',
		},
		moyenne: {
			titre: 'Semaine correcte, avec des zones d’ombre',
			texte:
				'Le réseau a fonctionné, mais pas sans à-coups. Plusieurs décisions ont tenu, d’autres ont coûté ' +
				'en fluidité, en réputation ou en budget : le bilan est nuancé.',
		},
		mauvaise: {
			titre: 'La direction réprimande la salle de contrôle',
			texte:
				'La semaine a échappé à la salle de contrôle. Des incidents ont été mal gérés et les jauges en portent la ' +
				'trace : la direction demande des comptes sur les décisions listées dans le bilan.',
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
	const NOMS_JAUGES_LONGS = { fluidite: 'la fluidité du réseau', reputation: 'la réputation de la salle', budget: 'le budget' };

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
		if (jours[0] && Jeu.messagesPatron) {
			Jeu.debutJourneeTactique();
			Jeu.messagePatron(consigneDuJour());
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
		resultat.narration.texte = 'Vous dormiez : l’alerte est restée sans réponse. ' + resultat.narration.texte;
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
		let e = d.type === 'événement' ? 'affluence (' + String(d.nature).split(',')[0] + ')' : d.type === 'ligne en difficulté' ? 'retard mesuré' : d.nature;
		if (ctx.meteo && d.type !== 'alerte météo') e += ' + météo défavorable';
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
			retard: d.retard === undefined ? null : d.retard,
			action: r.action === 'temps' ? null : r.nomAction,
			cleAction: r.action,
			deltas, // deltas réels (référence vers le résultat : la sieste ratée les met à jour)
			meilleureAction: meilleure === 'rien' ? 'Ne rien faire' : REGLAGES.effets[meilleure].nom,
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
		if (e.cleAction === 'temps') return 'trop tard';
		const actions = ['devier', 'retenir', 'renfort'];
		if (e.cleMeilleure === 'rien' || actions.every((a) => e.attendus[a] < 0)) return e.cleAction === 'rien' ? 'bon choix !' : 'aucun détour';
		return e.attendus[e.cleAction] >= e.attendus[e.cleMeilleure] - 0.01 ? 'bon choix !' : 'raté';
	};

	Jeu.ligneMail = function (e) {
		const sujet = e.ligne ? 'Ligne ' + e.ligne : 'Réseau';
		const retard = e.retard !== null ? ' + retard ' + e.retard + ' min' : '';
		const ev = Jeu.evaluer(e);
		const suite =
			e.cleAction === 'temps'
				? 'aucune décision (trop tard' + (e.resultat.sieste ? ', sieste' : '') + ')'
				: e.action + ' (' + ev + (ev === 'raté' ? ', il fallait : ' + e.meilleureAction : '') + ')';
		const impacts = NOMS_JAUGES.filter((k) => e.deltas[k] < 0).map((k) => LIBELLES_JAUGES[k] + ' ' + e.deltas[k]);
		return (
			e.heure + ' – ' + sujet + ' : ' + e.externe + retard + ' → ' + suite +
			(e.resultat.mauvaiseSource ? ' — mauvaise date retenue' : '') +
			(ev !== 'bon choix !' && impacts.length ? ' → ' + impacts.join(', ') : '')
		);
	};

	/**
	 * Mail de fin de journée (prompt 20 § 6, enrichi au prompt 21 § 3) : une ligne par dossier traité,
	 * heure – ligne : événement externe + retard → action (évaluation), puis l'état réel des jauges.
	 */
	Jeu.mailDuJour = function () {
		const j = Jeu.jourCourant();
		const duJour = (Jeu.evenementsJournee || []).filter((e) => e.jour === (j && j.date)).sort((a, b) => a.heure.localeCompare(b.heure));
		const date = j ? j.date.split('-').reverse().join('/') : '';
		const parfaite = duJour.length > 0 && duJour.every((e) => Jeu.evaluer(e) === 'bon choix !' && !e.resultat.mauvaiseSource);
		const lignes = [];
		if (parfaite) lignes.push('Tout a été géré dans les temps, belle journée.');
		else {
			lignes.push('Journal de la journée du ' + date + ' :');
			duJour.forEach((e) => lignes.push(Jeu.ligneMail(e)));
		}
		const obj = (Jeu.objectifsResultats || []).find((o) => o.jourIndex === Jeu.jourIndex);
		if (obj) lignes.push('Objectif du jour — ' + obj.libelle + ' : ' + (obj.atteint ? 'atteint (' + obj.effet + ').' : 'raté (' + obj.effet + ').'));
		lignes.push('Jauges en fin de journée : fluidité ' + Jeu.jauges.fluidite + ', réputation ' + Jeu.jauges.reputation + ', budget ' + Jeu.jauges.budget + '.');
		return {
			de: 'Direction de la régulation',
			objet: (parfaite ? 'Merci pour cette journée — ' : 'Points à revoir — ') + date,
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
		const m = Jeu.modificateur ? ' Attention : ' + Jeu.modificateur.libelle + (Jeu.modificateur.actionBloquee ? ' (« ' + REGLAGES.effets[Jeu.modificateur.actionBloquee].nom + ' » indisponible pendant la panne)' : '') + '.' : '';
		return 'Bonjour. ' + n + ' dossier(s) attendus aujourd’hui (' + (j ? j.date.split('-').reverse().join('/') : '') + '). Objectif : ' + o.libelle + '. Budget : ' + Jeu.jauges.budget + '.' + m;
	}

	Jeu.messagePatron = function (texte) {
		Jeu.messagesPatron.push({ heure: maintenantSim(), texte });
		Jeu.nonLus.patron++;
	};

	/** Alerte du patron quand une jauge passe sous 20 (Q46) — une fois par jauge et par jour */
	Jeu.verifierAlertesPatron = function () {
		if (!Jeu.messagesPatron) return;
		NOMS_JAUGES.forEach((k) => {
			if (Jeu.jauges[k] < REGLAGES.seuilCritique && !Jeu.alertesJauges[k]) {
				Jeu.alertesJauges[k] = true;
				Jeu.messagePatron('Alerte : ' + LIBELLES_JAUGES[k] + ' à ' + Jeu.jauges[k] + '/100. Redresse ça tout de suite.');
			}
		});
	};

	// Commentaires nantais : modèles courts remplis avec les données réelles du dossier (pseudonymes fictifs)
	const PSEUDOS = ['@usager_44', '@nantaise_du_tram', '@velo_et_bus', '@ile_de_nantes', '@quai_de_la_fosse', '@chantenay_matin'];
	const COMMENTAIRES = {
		bon: ['{sujet} : c’était réglé en {heure}, merci la régul 👍', 'Bien vu pour {sujet}, on a à peine senti le problème.', '{sujet} : info claire et solution rapide. Bravo.'],
		mauvais: ['{sujet}{retard} et personne pour gérer ? Sérieux…', 'Encore {sujet}{retard}. Vous dormez à la régul ?', '{sujet} : zéro info, zéro solution. Bof.'],
		equipe: ['{equipe} sur place pour {sujet}, ça fait plaisir de voir réagir.'],
	};
	const DELTA_REPUTATION = { bon: 2, mauvais: -3, equipe: 1 };

	Jeu.commenter = function (sorte, sujet, retard, equipe) {
		const modeles = COMMENTAIRES[sorte];
		const n = Jeu.commentaires.length;
		const texte = modeles[n % modeles.length]
			.replace('{sujet}', sujet)
			.replace('{retard}', retard !== null && retard !== undefined ? ' (+' + retard + ' min)' : '')
			.replace('{heure}', maintenantSim())
			.replace('{equipe}', equipe || '');
		const delta = DELTA_REPUTATION[sorte];
		Jeu.commentaires.push({ heure: maintenantSim(), auteur: PSEUDOS[n % PSEUDOS.length], texte, delta });
		Jeu.nonLus.community++;
		Jeu.appliquerDeltas({ reputation: delta }); // chaque commentaire fait évoluer la réputation
	};

	/** Après chaque dossier traité : un commentaire nantais et, si c'est raté, une réaction du patron */
	Jeu.reagirApps = function (e) {
		const sujet = e.ligne ? 'Ligne ' + e.ligne : String(e.externe).split(' (')[0];
		const ev = Jeu.evaluer(e);
		Jeu.commenter(ev === 'bon choix !' ? 'bon' : 'mauvais', sujet, e.retard);
		if (ev === 'raté') Jeu.messagePatron(sujet + ' : « ' + e.action + ' », vraiment ? Il fallait « ' + e.meilleureAction + ' ».');
		if (ev === 'trop tard') Jeu.messagePatron(sujet + ' : personne n’a réagi. Ça ne doit pas se reproduire.');
		Jeu.verifierAlertesPatron();
	};

	// Équipes envoyées depuis la carte (façon centre d'appels) : coût en budget, effets à l'arrivée
	const EQUIPES = {
		ambulance: { nom: 'Ambulance', cout: 15, effets: { reputation: 8 } },
		police: { nom: 'Police', cout: 10, effets: { reputation: 5, fluidite: 3 } },
		techniciens: { nom: 'Techniciens', cout: 12, effets: { fluidite: 10 } },
		pompiers: { nom: 'Pompiers', cout: 15, palier: 70, effets: { reputation: 6, fluidite: 6 } }, // option coûteuse : débloquée si budget ≥ 70 (prompt 23 § 5.1)
	};
	Jeu.EQUIPES = EQUIPES;
	Jeu.DELAI_EQUIPE_MS = 20000; // arrivée 20 s (réelles) après l'envoi

	Jeu.equipePour = (index) => Jeu.equipes.find((q) => q.index === index) || null;

	/** Envoi d'une équipe sur le dossier d'index donné ; renvoie { ok, message } */
	Jeu.envoyerEquipe = function (index, cle, maintenant) {
		const q = EQUIPES[cle];
		const d = Jeu.paquet[index];
		if (!q || !d) return { ok: false, message: 'Incident introuvable.' };
		if (Jeu.equipePour(index)) return { ok: false, message: 'Équipe déjà envoyée sur cet incident.' };
		if (Jeu.jauges.budget < q.cout) return { ok: false, message: 'Budget insuffisant (' + Jeu.jauges.budget + '/' + q.cout + ') : ' + q.nom + ' indisponible.' };
		if (q.palier && Jeu.jauges.budget < q.palier) return { ok: false, message: q.nom + ' : réservé quand le budget est ≥ ' + q.palier + ' (actuel ' + Jeu.jauges.budget + ').' };
		Jeu.appliquerDeltas({ budget: -q.cout });
		if (index < Jeu.index) {
			// Équipe inutile (prompt 23 § 4) : l'incident est déjà résolu — coût perdu, réputation −3
			Jeu.compterMalus('equipe_inutile');
			Jeu.appliquerDeltas({ reputation: -3 });
			Jeu.equipes.push({ index, cle, nom: q.nom, cout: q.cout, depart: maintenant, arrivee: maintenant, heure: maintenantSim(), arrivee_sim: maintenantSim(), inutile: true, jour: d.date, sujet: d.lignes && d.lignes.length ? 'Ligne ' + d.lignes.join(', ') : d.nature });
			return { ok: false, message: 'Équipe inutile : incident déjà résolu (−' + q.cout + ' budget, réputation −3).' };
		}
		Jeu.equipes.push({ index, cle, nom: q.nom, cout: q.cout, depart: maintenant, arrivee: maintenant + Jeu.DELAI_EQUIPE_MS, heure: maintenantSim(), arrivee_sim: null, jour: d.date, sujet: d.lignes && d.lignes.length ? 'Ligne ' + d.lignes.join(', ') : d.nature });
		return { ok: true, message: q.nom + ' en route (−' + q.cout + ' budget).' };
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
	Jeu.conseil = function (d) {
		if (!d) return '';
		const recents = (Jeu.evenementsJournee || []).slice(-3);
		const repBaisse = recents.some((e) => e.deltas.reputation < 0) || (Jeu.commentaires || []).slice(-3).some((c) => c.delta < 0);
		if (d.retard !== null && d.retard !== undefined && d.retard >= 18 && d.lignes && d.lignes.length && repBaisse)
			return 'Ligne ' + d.lignes.join(', ') + ' à +' + d.retard + ' min, la réputation baisse déjà sur les réseaux.';
		const basse = NOMS_JAUGES.filter((k) => Jeu.jauges[k] < 30).sort((a, b) => Jeu.jauges[a] - Jeu.jauges[b])[0];
		if (basse) return 'Attention : ' + LIBELLES_JAUGES[basse] + ' est à ' + Jeu.jauges[basse] + ', une mauvaise décision peut la faire passer sous 20.';
		if (d.contradiction || (Jeu.conflit && Jeu.conflit())) return 'Deux informations sont en conflit : priorisez avant d’agir.';
		const ctx = contexte(d);
		const m = Jeu.meteoDuJour(d.date) || {};
		if (ctx.meteo) return 'Météo du moment (' + Math.round(m.rafales_max || 0) + ' km/h, ' + (m.pluie_mm || 0) + ' mm) : l’effet des actions sur la fluidité est modifié.';
		if (ctx.affluence) return 'Affluence (' + String(d.nature).split(',')[0] + ') : l’effet des actions sur la réputation est modifié.';
		if (ctx.pointe) return 'Heure de pointe : l’effet des actions sur la réputation est modifié.';
		return 'Budget à ' + Jeu.jauges.budget + ' : chaque action a un coût ou un gain, lisez le dossier avant de choisir.';
	};

	/** § 2 — Modificateurs (un par journée, tirés avec le générateur à graine fixe : partie rejouable) */
	const MODIFICATEURS = [
		{ id: 'erreur_systeme', duree_s: 30, libelle: 'Erreur système sur l’ordinateur' },
		{ id: 'meteo_aggravee', duree_s: 60, libelle: 'Météo aggravée : effets ×1,5' },
		{ id: 'heure_pointe', duree_s: 45, libelle: 'Heure de pointe : décisions 20 % plus courtes' },
		{ id: 'panne_messagerie', duree_s: 60, libelle: 'Panne de la messagerie du patron' },
	];
	Jeu.MODIFICATEURS = MODIFICATEURS;
	Jeu.forcerModificateur = null; // test : forcer un id

	/** Armé en début de journée, démarre à l'arrivée du premier incident, dure duree_s secondes réelles */
	Jeu.tirerModificateur = function () {
		const m = Jeu.forcerModificateur ? MODIFICATEURS.find((x) => x.id === Jeu.forcerModificateur) : MODIFICATEURS[Math.floor(Jeu.alea() * MODIFICATEURS.length)];
		const actions = ['devier', 'retenir', 'renfort', 'rien'];
		Jeu.modificateur = Object.assign({}, m, { debut: null, fin: null, actionBloquee: m.id === 'erreur_systeme' ? actions[Math.floor(Jeu.alea() * 4)] : null });
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
	Jeu.actionBloquee = () => (Jeu.modificateurActif() === 'erreur_systeme' ? Jeu.modificateur.actionBloquee : null);

	/** § 3 — Objectifs de journée qui se resserrent */
	const OBJECTIFS = [
		{ jour: 1, jauge: 'fluidite', seuil: 40, libelle: 'Garder la fluidité ≥ 40' },
		{ jour: 2, jauge: 'fluidite', seuil: 45, libelle: 'Garder la fluidité ≥ 45' },
		{ jour: 3, jauge: 'reputation', seuil: 45, libelle: 'Garder la réputation ≥ 45' },
		{ jour: 4, jauge: 'reputation', seuil: 50, libelle: 'Garder la réputation ≥ 50' },
		{ jour: 5, jauge: 'budget', seuil: 30, libelle: 'Terminer avec un budget ≥ 30' },
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
			const bonus = o.jauge === 'budget' ? { reputation: 5 } : { budget: 10 };
			Jeu.appliquerDeltas(bonus);
			effet = 'bonus ' + Object.keys(bonus).map((k) => LIBELLES_JAUGES[k] + ' +' + bonus[k]).join(', ');
		} else {
			Jeu.compterMalus('objectif_rate');
			Jeu.appliquerDeltas({ [o.jauge]: -5 });
			effet = 'malus ' + LIBELLES_JAUGES[o.jauge] + ' −5';
		}
		Jeu.objectifsResultats.push({ jourIndex: Jeu.jourIndex, libelle: o.libelle, atteint, valeur: Jeu.jauges[o.jauge], effet });
		if (Jeu.jauges.budget <= 0) {
			// « Budget négatif » : le budget est borné à 0, le malus s'applique donc quand il est épuisé
			Jeu.compterMalus('budget_epuise');
			Jeu.appliquerDeltas({ reputation: -8 });
		}
	};

	/** § 4 — Table unique des malus (affichée dans l'aide H) */
	Jeu.MALUS = [
		{ id: 'non_traite', libelle: 'Incident non traité', condition: 'dossier expiré sans décision', consequence: 'conséquences naturelles du dossier (Q25)' },
		{ id: 'sieste', libelle: 'Sieste non interrompue', condition: '« Se réveiller » raté', consequence: '−5 sur la jauge de l’incident' },
		{ id: 'objectif_rate', libelle: 'Objectif de journée raté', condition: 'jauge sous le seuil en fin de journée', consequence: '−5 sur la jauge de l’objectif' },
		{ id: 'equipe_inutile', libelle: 'Équipe inutile', condition: 'équipe envoyée sur un incident déjà résolu', consequence: 'coût perdu, réputation −3' },
		{ id: 'budget_epuise', libelle: 'Budget épuisé', condition: 'budget à 0 en fin de journée', consequence: 'réputation −8 (dettes)' },
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
		if (palier === 'bas') Jeu.messagePatron('Budget à ' + b + ' : on ne peut plus envoyer d’équipes. Trouvez des solutions sans dépenser.');
		else if (palier === 'haut') Jeu.messagePatron('Budget à ' + b + ' : on a de la marge, envoyez des équipes si besoin (les pompiers sont disponibles).');
		else if (Jeu.paliersBudget.bas || Jeu.paliersBudget.haut) Jeu.messagePatron('Budget à ' + b + ' : situation suivie, restez raisonnable.');
	};

	/** Conseil repris par le patron quand une jauge passe sous 30 (une fois par jauge et par jour) */
	Jeu.verifierConseilsPatron = function () {
		if (!Jeu.messagesPatron) return;
		NOMS_JAUGES.forEach((k) => {
			const cle = 'conseil_' + k;
			if (Jeu.jauges[k] < 30 && !Jeu.alertesJauges[cle]) {
				Jeu.alertesJauges[cle] = true;
				Jeu.messagePatron('Attention : ' + LIBELLES_JAUGES[k] + ' est à ' + Jeu.jauges[k] + ', une mauvaise décision peut la faire passer sous 20.');
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
			'Semaine ' + (Jeu.jauges[haut] >= 60 ? 'solide' : 'fragile') + ' sur ' + LIBELLES_JAUGES[haut] + ' (' + Jeu.jauges[haut] + ')' +
			(m ? ', mais ' + Jeu.malus[malusFrequent] + ' × « ' + m.libelle.toLowerCase() + ' »' : '') + '.';
		return {
			phrase,
			haut: { jauge: LIBELLES_JAUGES[haut], valeur: Jeu.jauges[haut] },
			bas: { jauge: LIBELLES_JAUGES[bas], valeur: Jeu.jauges[bas] },
			meilleurJour: meilleurJour ? meilleurJour.split('-').reverse().join('/') : '—',
			malusFrequent: m ? m.libelle + ' (' + Jeu.malus[malusFrequent] + ')' : 'aucun',
			budget: Jeu.jauges.budget,
			equipes: (Jeu.equipes || []).length,
			objectifs: atteints + '/' + (Jeu.objectifsResultats || []).length,
		};
	};

	global.Jeu = Jeu;
})(typeof window !== 'undefined' ? window : globalThis);
