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
		// Table des effets (Q57–Q60), dans l'ordre fluidité, satisfaction, réputation
		effets: {
			devier: { nom: 'Dévier la ligne', base: [-10, 5, 0], communique: true },
			retenir: { nom: 'Retenir en terminus', base: [-7, -12, null] }, // réputation : +8 si retard > 20 min sinon +4 (Q58)
			renfort: { nom: 'Bus de renfort', base: [12, 8, -3] },
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
			événement: () => [0, -4, 0],
		},
		// Contradiction de sources (Q9, Q31) : mauvaise source = malus réputation + conséquence réelle
		malusMauvaiseSource: -6,
		seuilCritique: 20, // Q46
	};
	Jeu.REGLAGES = REGLAGES;
	const NOMS_JAUGES = ['fluidite', 'satisfaction', 'reputation'];
	const LIBELLES_JAUGES = { fluidite: 'fluidité', satisfaction: 'satisfaction', reputation: 'réputation' };

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
		Jeu.jauges = { fluidite: 50, satisfaction: 50, reputation: 50 }; // Q40
		Jeu.paquet = construirePaquet(e);
		e.dossiers = Jeu.paquet; // l'affichage (carte, liste) lit le paquet de la partie
		Jeu.index = 0;
		Jeu.historique = [];
		Jeu.terminee = Jeu.paquet.length === 0;
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
			if (action === 'retenir') base[2] = d.retard !== null && d.retard > 20 ? 8 : 4; // Q58
			deltas = base.map((b, i) => {
				if (!b) return 0;
				des[i] = Jeu.de6();
				let v = Math.sign(b) * (Math.abs(b) + des[i] - 1); // base + 1d6 en amplitude (Q61)
				if ((i === 0 && ctx.meteo) || (i === 1 && ctx.pointe) || (i === 2 && ctx.affluence)) v *= REGLAGES.coefContexte;
				return borner(Math.round(v));
			});
		}

		// Contradiction : se fier à la mauvaise source = malus réputation + conséquence réelle du dossier (Q31)
		let mauvaiseSource = false;
		if (d.contradiction && sourceChoisie && sourceChoisie !== d.contradiction.bonne) {
			mauvaiseSource = true;
			const reel = (REGLAGES.naturel[d.type] || (() => [-4, 0, 0]))(d);
			deltas = deltas.map((v, i) => borner(v + reel[i]));
			deltas[2] = borner(deltas[2] + REGLAGES.malusMauvaiseSource);
		}

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
		resultat.narration = Jeu.narrer(resultat);
		Jeu.historique.push(resultat);
		Jeu.index++;
		Jeu.terminee = Jeu.index >= Jeu.paquet.length;
		return resultat;
	};

	/* Ton adaptatif selon les jauges (Q17) : neutre / tendu / critique. */
	Jeu.ton = function () {
		const min = Math.min(Jeu.jauges.fluidite, Jeu.jauges.satisfaction, Jeu.jauges.reputation);
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

	global.Jeu = Jeu;
})(typeof window !== 'undefined' ? window : globalThis);
