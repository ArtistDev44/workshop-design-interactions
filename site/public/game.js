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
		resultat.minuteSim = Jeu.horloge ? Math.floor(Jeu.horloge.minutes) : null; // heure de la partie (prompt 20)
		resultat.jour = d.date;
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
				'en fluidité, en satisfaction ou en réputation : le bilan est nuancé.',
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
	const NOMS_JAUGES_LONGS = { fluidite: 'la fluidité du réseau', satisfaction: 'la satisfaction usagers', reputation: 'la réputation de la salle' };

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
		Jeu.horloge.minutes = Jeu.debutJournee();
		return Jeu.jourCourant();
	};
	Jeu.formaterHeure = function (minutes) {
		const m = Math.floor(minutes) % (24 * 60);
		return Math.floor(m / 60) + 'h' + String(m % 60).padStart(2, '0');
	};

	/** Jauge touchée par un dossier (pour le malus de sieste) */
	Jeu.jaugeConcernee = (d) => (d.type === 'événement' ? 'satisfaction' : 'fluidite');

	/** Sieste ratée (prompt 20 § 4) : −5 sur la jauge concernée, en plus des conséquences naturelles. */
	Jeu.malusSieste = function (resultat) {
		const k = Jeu.jaugeConcernee(resultat.dossier);
		Jeu.jauges[k] = Math.max(0, Jeu.jauges[k] - 5);
		const i = NOMS_JAUGES.indexOf(k);
		resultat.deltas[i] -= 5;
		resultat.sieste = true;
		resultat.narration = Jeu.narrer(resultat);
		resultat.narration.texte = 'Vous dormiez : l’alerte est restée sans réponse. ' + resultat.narration.texte;
	};

	/** Un dossier a-t-il été mal géré ? (pas de réaction, sieste, mauvaise source, ou bilan nettement négatif) */
	function malGere(r) {
		const total = r.deltas.reduce((a, b) => a + b, 0);
		return r.action === 'temps' || r.sieste || r.mauvaiseSource || total <= -6;
	}
	function quoi(d) {
		if (d.lignes && d.lignes.length) return 'ligne ' + d.lignes.join(', ') + (d.retard !== null && d.retard !== undefined ? ', retard ' + d.retard + ' min' : '');
		return d.nature + (d.texte_source ? ' (« ' + String(d.texte_source).slice(0, 60) + (String(d.texte_source).length > 60 ? '…' : '') + ' »)' : '');
	}
	function constat(r) {
		if (r.sieste) return 'l’alerte a sonné pendant une sieste, personne n’a réagi.';
		if (r.action === 'temps') return 'personne n’a réagi.';
		if (r.mauvaiseSource) return 'la mauvaise date a été retenue (« ' + r.nomAction + ' »).';
		const pires = r.deltas
			.map((v, i) => [v, NOMS_JAUGES[i]])
			.filter(([v]) => v < 0)
			.map(([v, k]) => LIBELLES_JAUGES[k] + ' ' + v)
			.join(', ');
		return 'décision « ' + r.nomAction + ' », ' + pires + '.';
	}

	/**
	 * Mail de fin de journée (prompt 20 § 6) : ne parle que de ce qui ne va pas, heure par heure,
	 * à partir des dossiers RÉELLEMENT joués aujourd'hui ; les dossiers bien gérés tiennent en une ligne.
	 */
	Jeu.mailDuJour = function () {
		const j = Jeu.jourCourant();
		const duJour = (Jeu.historique || []).filter((h) => h.action && h.jour === (j && j.date));
		const mal = duJour.filter(malGere).sort((a, b) => (a.minuteSim || 0) - (b.minuteSim || 0));
		const bien = duJour.length - mal.length;
		const date = j ? j.date.split('-').reverse().join('/') : '';
		const lignes = [];
		if (!mal.length) {
			lignes.push('Bonne journée au poste : les ' + duJour.length + ' incident(s) du ' + date + ' ont tous reçu une réponse adaptée.');
			if (duJour[0]) lignes.push('Exemple : ' + Jeu.formaterHeure(duJour[0].minuteSim) + ' — ' + quoi(duJour[0].dossier) + ' : « ' + duJour[0].nomAction + ' ».');
		} else {
			lignes.push('Voici ce qui n’a pas fonctionné aujourd’hui (' + date + ') :');
			mal.forEach((r) => lignes.push(Jeu.formaterHeure(r.minuteSim) + ' — ' + quoi(r.dossier) + ' : ' + constat(r)));
			lignes.push(bien ? bien + ' autre(s) incident(s) ont été traités correctement.' : 'Aucun incident n’a été traité correctement.');
		}
		// État des jauges : valeurs réelles, en citant le nombre d'incidents qui les ont fait baisser
		const basses = NOMS_JAUGES.filter((k) => Jeu.jauges[k] < 40);
		basses.forEach((k) => {
			const i = NOMS_JAUGES.indexOf(k);
			const n = duJour.filter((r) => r.deltas[i] < 0).length;
			lignes.push(
				NOMS_JAUGES_LONGS[k].charAt(0).toUpperCase() + NOMS_JAUGES_LONGS[k].slice(1) + ' est à ' + Jeu.jauges[k] + '/100' +
					(Jeu.jauges[k] < 20 ? ', au point mort' : '') + (n ? ', après ' + n + ' incident(s) qui l’ont fait baisser.' : '.'),
			);
		});
		if (!basses.length) lignes.push('Jauges : fluidité ' + Jeu.jauges.fluidite + ', satisfaction ' + Jeu.jauges.satisfaction + ', réputation ' + Jeu.jauges.reputation + '.');
		return {
			de: 'Direction de la régulation',
			objet: (mal.length ? 'Points à revoir — ' : 'Merci pour cette journée — ') + date,
			positif: !mal.length,
			lignes,
			dernier: Jeu.jourIndex >= (Jeu.jours || []).length - 1,
		};
	};

	global.Jeu = Jeu;
})(typeof window !== 'undefined' ? window : globalThis);
