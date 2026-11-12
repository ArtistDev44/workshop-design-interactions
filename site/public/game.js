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
			'ligne en difficulté': (d) => [-Math.min(15, Math.max(4, Math.round(Jeu.retardEffectif(d) / 5))), 0, 0], // prompt 79 : retard effectif
			perturbation: () => [-5, 0, 0],
			'alerte météo': () => [-4, 0, 0],
			événement: () => [0, -4, 0], // affluence non gérée : la réputation en pâtit
		},
		// Contradiction de sources (Q9, Q31) : mauvaise source = malus réputation + conséquence réelle
		malusMauvaiseSource: -6,
		malusClash: -8, // prompt 117 : clasher le plaignant (réputation, en plus de l'effet de « attendre »)
		seuilCritique: 20, // Q46
		// Prompt 79 — les retards s'aggravent avec le temps (calcul documenté, jamais une donnée inventée) :
		// retard effectif = retard réel de la source + 1 min toutes les 2 minutes de jeu depuis l'arrivée du dossier
		// (plafond +30), figé à la décision ; après une décision « raté » ou « trop tard » sur un dossier avec retard,
		// +5 min durables sur sa (ses) ligne(s) jusqu'au soir (plafond +15). Q58, gravité, conséquences naturelles et
		// conflit A / B lisent le retard effectif ; seuils et effets de base inchangés.
		aggravation: { minutesJeuParMinute: 2, plafond: 30, durable: 5, plafondDurable: 15 },
		// Prompt 79 — Community : délai de réponse aux plaintes (temps réel) ; malus = celui d'un mauvais commentaire (prompt 22)
		community: { delaiMs: 45000, rapideMs: 15000 },
		// Prompt 84 — sanction progressive (exception à Q47 : fin anticipée « licenciement », jeu/04-jauges-et-fins.md).
		// Mesure sur les 3 jauges réelles : vigilance (score < 120 ou deux jauges < 25), danger (score < 90 ou deux
		// jauges < 20), effondrement (score < 45 ou une jauge à 0). Hystérésis : on ne sort de la vigilance qu'à
		// score ≥ 140, du danger qu'à score ≥ 110.
		licenciement: { vigilance: { score: 120, deux: 25 }, danger: { score: 90, deux: 20 }, effondrement: 45, sortieVigilance: 140, sortieDanger: 110 },
		// Prompt 87 — sans chrono (par défaut), la difficulté règle la CHARGE : signalements actifs à la fois, vitesse
		// d'aggravation des retards et budget de départ (exceptions Q6, Q16, Q40, Q55, documentées dans jeu/09). En mode
		// « Défi chrono », comportement d'avant (compteur selon la semaine, budget 50, aggravation ×1).
		difficultes: { facile: { actifs: 3, aggravation: 0.5, budget: 60 }, normale: { actifs: 2, aggravation: 1, budget: 50 }, difficile: { actifs: 1, aggravation: 1.5, budget: 40 } },
		bonusSituation: 1.25, // effets positifs d'une réponse dans une situation où elle est la plus adaptée (Q24 généralisé)
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
		const fictif = Jeu.incidentsFictifs ? incidentFictif(etat, paquet) : null; // prompt 119 : au plus un par semaine, marqué fictif
		if (fictif) paquet = paquet.concat([fictif]);
		paquet.sort((a, b) => (a.date + (a.heure || '')).localeCompare(b.date + (b.heure || '')));
		return paquet.map((d) => Object.assign({}, d, { contradiction: detecterContradiction(d) }));
	}

	/* Prompt 119 — exception assumée à « aucune donnée inventée » (décision du groupe) : un incident INVENTÉ, rare
	 * (au plus un par semaine), pour pimenter le rythme. Toujours marqué fictif (fictif: true, source « Scénario du
	 * jeu (fictif) ») ; jour, heure (9 h–19 h) et ligne réelle (GTFS) tirés par hachage de la graine — aucun dé. Activé
	 * seulement par l'affichage (Jeu.incidentsFictifs, désactivable avec ?fictifs=0) : les tests de règles n'en ont pas. */
	function incidentFictif(etat, paquet) {
		const graine = String((etat.semaine && etat.semaine.lundi) || etat.seed || 'partie');
		let h = 0;
		for (const c of graine) h = (h * 31 + c.charCodeAt(0)) % 1000003;
		const dates = [...new Set(paquet.map((d) => d.date))].sort();
		const lignes = Jeu.lignes && Jeu.lignes.lignes ? Jeu.lignes.lignes.filter((l) => l.traces && l.traces.length && (l.type === 0 || l.type === 3)) : [];
		if (!dates.length || !lignes.length) return null;
		const sorte = h % 2 ? 'agression' : 'vol';
		const ligne = lignes[(h >> 3) % lignes.length].nom;
		const heure = String(9 + ((h >> 5) % 10)).padStart(2, '0') + ':' + String(((h >> 7) % 4) * 15).padStart(2, '0');
		const nature = sorte === 'agression' ? T('fictif.nature.agression') : T('fictif.nature.vol');
		return {
			date: dates[(h >> 2) % dates.length],
			heure,
			type: 'incident fictif',
			nature: sorte === 'agression' ? 'agression en cours' : 'vol à main armée',
			natureAffichee: nature,
			lignes: [String(ligne)],
			retard: null,
			source: 'Scénario du jeu (fictif)',
			texte_source: (sorte === 'agression' ? 'Agression en cours signalée à bord' : 'Vol à main armée signalé à un arrêt') + ', ligne ' + ligne + ' — incident fictif',
			fictif: true,
		};
	}

	/* Démarre une partie sur l'état chargé (semaine, direct ou hors ligne). */
	Jeu.nouvellePartie = function () {
		const e = Jeu.etat;
		Jeu.initialiserAlea(e.seed || graineDe(e.semaine ? e.semaine.lundi : e.horodatage || 'direct'), 0);
		Jeu.jauges = { fluidite: 50, reputation: 50, budget: Jeu.defiChrono ? 50 : Jeu.difficulte().budget }; // Q40 (prompt 22 : trio fluidité / réputation / budget) ; prompt 87 : budget de départ selon la difficulté hors défi chrono
		Jeu.paquet = construirePaquet(e);
		e.dossiers = Jeu.paquet; // l'affichage (carte, liste) lit le paquet de la partie
		Jeu.index = 0;
		Jeu.historique = [];
		Jeu.evenementsJournee = []; // prompt 21 § 3.1 : journal des dossiers traités
		Jeu.messagesPatron = []; // prompt 22 : app « Messages du patron »
		Jeu.variantesDuJour = {}; // prompt 88
		Jeu.taches = null; // prompt 88 : tâches de la partie (taches.js)
		Jeu.jaugesDebutJour = {}; // prompt 89 : jauges au début de chaque journée (courbes du Journal)
		Jeu.bonusEffectifs = {};
		Jeu.allegementObjectif = 0;
		Jeu.patronEnAttente = []; // prompt 86
		Jeu.commentaires = []; // prompt 22 : app « Community manager »
		Jeu.plaintes = []; // prompt 28 : plaintes des Nantais (data/messages.json)
		Jeu.equipes = []; // prompt 22 : équipes envoyées depuis la carte
		Jeu.aggravationLignes = {}; // prompt 79
		Jeu.statutPatron = nouveauStatut(); // prompt 84
		Jeu.postsJoueur = []; // prompt 85
		Jeu.refusEquipes = 0; // prompt 68 : envois refusés faute d'effectif
		Jeu.nonLus = { patron: 0, community: 0 };
		Jeu.alertesJauges = {};
		Jeu.malus = {};
		Jeu.objectifsResultats = [];
		Jeu.modificateur = null;
		Jeu.paliersBudget = {};
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
			plaintes: (Jeu.plaintes || []).map((p) => Object.assign({}, p, { def: undefined, depuis: p.depuis === undefined ? undefined : p.depuis - maintenant })), // prompt 79 : délai relatif
			equipes: (Jeu.equipes || []).map((q) => Object.assign({}, q, { depart: q.depart - maintenant, arrivee: q.arrivee - maintenant, finIntervention: (q.finIntervention || q.arrivee) - maintenant, libre: (q.libre || q.arrivee) - maintenant })), // prompt 68 : cycle complet
			nonLus: Object.assign({}, Jeu.nonLus),
			alertesJauges: Object.assign({}, Jeu.alertesJauges),
			malus: Object.assign({}, Jeu.malus),
			objectifsResultats: Jeu.objectifsResultats,
			modificateur: m ? Object.assign({}, m, { debut: m.debut === null ? null : m.debut - maintenant, fin: m.fin === null ? null : m.fin - maintenant }) : null,
			paliersBudget: Object.assign({}, Jeu.paliersBudget),
			refusEquipes: Jeu.refusEquipes || 0,
			aggravationLignes: Object.assign({}, Jeu.aggravationLignes), // prompt 79
			statutPatron: JSON.parse(JSON.stringify(Jeu.statutPatron)), // prompt 84 : niveau, avertissements, dates, file
			defiChrono: !!Jeu.defiChrono, // prompt 87
			variantesDuJour: Object.assign({}, Jeu.variantesDuJour), // prompt 88
			taches: Jeu.taches ? JSON.parse(JSON.stringify(Jeu.taches)) : null,
			jaugesDebutJour: JSON.parse(JSON.stringify(Jeu.jaugesDebutJour || {})), // prompt 89
			bonusEffectifs: Object.assign({}, Jeu.bonusEffectifs || {}),
			allegementObjectif: Jeu.allegementObjectif || 0,
			postsJoueur: Jeu.postsJoueur || [], // prompt 85
			patronEnAttente: Jeu.patronEnAttente || [], // prompt 86 : messages émis pendant la panne
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
		Jeu.inspection = s.inspection || null;
		Jeu.depart = s.depart || null; // prompt 51
		Jeu.blame = s.blame || null;
		Jeu.defis = s.defis || Jeu.tirerDefis(); // prompt 55 (ancienne sauvegarde : tirés à la reprise, même graine)
		Jeu.defisAppliques = s.defisAppliques || null;
		Jeu.ralenti = s.ralenti || { jour: -1, debut: 0, fin: 0, utilises: 0 };
		Jeu.plaintes = (s.plaintes || [])
			.map((p) => Object.assign({}, p, { def: Jeu.MESSAGES.plaintes.find((x) => x.id === p.id), depuis: p.depuis === undefined || p.depuis === null ? undefined : p.depuis + maintenant }))
			.filter((p) => p.def); // une plainte retirée de messages.json depuis la sauvegarde est ignorée
		Jeu.equipes = (s.equipes || []).map((q) => Object.assign({}, q, { depart: q.depart + maintenant, arrivee: q.arrivee + maintenant, finIntervention: (q.finIntervention === undefined ? q.arrivee : q.finIntervention) + maintenant, libre: (q.libre === undefined ? q.arrivee : q.libre) + maintenant, remercie: q.remercie === undefined ? q.arrivee_sim !== null : q.remercie })); // prompt 121 : ancienne sauvegarde → pas de remerciement en double
		Jeu.refusEquipes = s.refusEquipes || 0;
		Jeu.aggravationLignes = Object.assign({}, s.aggravationLignes || {}); // prompt 79
		Jeu.statutPatron = Object.assign(nouveauStatut(), s.statutPatron || {}); // prompt 84 (ancienne sauvegarde : statut neuf)
		Jeu.variantesDuJour = Object.assign({}, s.variantesDuJour || {}); // prompt 88
		Jeu.taches = s.taches ? JSON.parse(JSON.stringify(s.taches)) : null;
		if (Jeu.taches) delete Jeu.taches.carnet; // prompt 142 : une sauvegarde d'avant ne restaure plus de carnet
		Jeu.jaugesDebutJour = JSON.parse(JSON.stringify(s.jaugesDebutJour || {})); // ancienne sauvegarde : déduit des événements // ancienne sauvegarde : tâches recréées au besoin
		Jeu.bonusEffectifs = Object.assign({}, s.bonusEffectifs || {});
		Jeu.allegementObjectif = s.allegementObjectif || 0;
		Jeu.defiChrono = s.defiChrono === undefined ? true : !!s.defiChrono; // prompt 87 : ancienne sauvegarde = jouée avec chrono
		Jeu.postsJoueur = s.postsJoueur || []; // prompt 85
		Jeu.patronEnAttente = s.patronEnAttente || []; // prompt 86
		(Jeu.messagesPatron || []).forEach((m) => (m.type = Jeu.TYPES_MESSAGES.includes(m.type) ? m.type : 'info')); // ancienne sauvegarde : « info »
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
		const rd = Jeu.retardEffectif(d); // prompt 79 : retards effectifs
		const rs = Jeu.retardEffectif(s);
		const comparables = rd === null || rs === null ? rd === rs : Math.abs(rd - rs) <= 5;
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

	// =====================================================================
	// Prompt 87 — réponses propres à chaque catégorie de problème (data/reponses.json), sans chrono par défaut
	// =====================================================================
	Jeu.defiChrono = false; // fixé par l'affichage (Paramètres → « Défi chrono ») avant chaque partie
	Jeu.difficulte = () => REGLAGES.difficultes[(Jeu.etat && Jeu.etat.semaine && Jeu.etat.semaine.difficulte && Jeu.etat.semaine.difficulte.niveau) || 'normale'] || REGLAGES.difficultes.normale;
	Jeu.REPONSES = {};
	/** Chargement et validation : 3 ou 4 réponses par catégorie, dont une « attendre », libellés et explications FR + EN */
	Jeu.chargerReponses = function (donnees) {
		const ok = {};
		Object.entries((donnees && donnees.categories) || {}).forEach(([cat, liste]) => {
			const valides = (liste || []).filter((r) => r && typeof r.id === 'string' && r.libelle && r.libelle.fr && r.libelle.en && r.explication && r.explication.fr && r.explication.en && Array.isArray(r.base) && r.base.length === 3 && Array.isArray(r.situations) && typeof r.famille === 'string');
			if (valides.length >= 3 && valides.length <= 4 && valides.some((r) => r.famille === 'rien')) {
				ok[cat] = valides;
				valides.forEach((r) => {
					// Libellés et explications dans le dictionnaire (traduits, sauvegardés comme les autres textes)
					const TR = typeof TRADUCTIONS !== 'undefined' ? TRADUCTIONS : null; // constante globale d'i18n.js
					if (TR) {
						TR.fr['rep.' + cat + '.' + r.id] = r.libelle.fr;
						TR.en['rep.' + cat + '.' + r.id] = r.libelle.en;
						TR.fr['repx.' + cat + '.' + r.id] = r.explication.fr;
						TR.en['repx.' + cat + '.' + r.id] = r.explication.en;
					}
				});
			} else if (global.console) console.warn('reponses.json : catégorie « ' + cat + ' » ignorée (3 ou 4 réponses valides dont une « attendre »)');
		});
		Jeu.REPONSES = ok;
		return Object.keys(ok).length;
	};
	Jeu.chargerReponses(global.PXE_REPONSES);
	const MOTS_ACCIDENT = /accident|malaise|bless|chute|collision/i;
	/** Catégorie calculée sur les champs réels (sans tirage) : la plus grave l'emporte */
	Jeu.categorie = function (d) {
		if (!d) return null;
		if (d.fictif || d.type === 'incident fictif') return 'securite'; // prompt 119
		const m = Jeu.meteoDuJour(d.date) || {};
		if (MOTS_ACCIDENT.test(String(d.texte_source || '') + ' ' + String(d.nature || ''))) return 'accident';
		if (d.type === 'alerte météo' || (m.pluie_mm || 0) >= 10 || (m.rafales_max || 0) >= 60) return 'meteo';
		if (d.type === 'ligne en difficulté') return 'retard';
		if (d.type === 'perturbation') return 'travaux';
		if (d.type === 'événement') return 'affluence';
		return null;
	};
	/** Situation réelle du dossier : « calme », ou les facteurs présents (meteo, pointe, long, forte) joints par « + » */
	Jeu.situation = function (d) {
		const cat = Jeu.categorie(d);
		const ctx = contexte(d);
		const m = Jeu.meteoDuJour(d.date) || {};
		const re = Jeu.retardEffectif(d);
		const f = [];
		if (cat === 'meteo') {
			// « forte » : alerte vent / pluie / orage, ou météo défavorable du jour (mêmes seuils que le contexte Q24 : 5 mm, 50 km/h)
			if ((d.type === 'alerte météo' && /vent|pluie|orage|neige|verglas/i.test(String(d.nature))) || (m.pluie_mm || 0) >= 5 || (m.rafales_max || 0) >= 50) f.push('forte');
		} else if (ctx.meteo) f.push('meteo');
		if (ctx.pointe) f.push('pointe');
		if (cat === 'retard' && re !== null && re > 20) f.push('long');
		return f.join('+') || 'calme';
	};
	Jeu.reponsesDe = (d) => Jeu.REPONSES[Jeu.categorie(d)] || null;
	Jeu.reponse = function (d, cle) {
		if (!d || typeof cle !== 'string' || !cle.includes('.')) return null;
		const [cat, id] = cle.split('.');
		if (cat !== Jeu.categorie(d)) return null;
		return (Jeu.REPONSES[cat] || []).find((r) => r.id === id) || null;
	};
	/** Clés des actions possibles pour ce dossier : réponses de sa catégorie (« cat.id »), sinon la table Q57–Q60 */
	Jeu.actionsPossibles = (d) => {
		const rs = Jeu.reponsesDe(d);
		return rs ? rs.map((r) => Jeu.categorie(d) + '.' + r.id) : ACTIONS_EVALUEES.slice();
	};
	/** Libellé traduit d'une action (réponse de catégorie ou action historique) */
	Jeu.libelleAction = (cle) => (String(cle).includes('.') ? T('rep.' + cle) : cle === 'temps' ? T('action.temps') : REGLAGES.effets[cle] ? REGLAGES.effets[cle].nom : T('action.' + cle));
	/** Famille historique d'une action (profils, Community, inspection) */
	Jeu.familleDe = (cle) => {
		if (!String(cle).includes('.')) return cle;
		const [cat, id] = String(cle).split('.');
		const r = (Jeu.REPONSES[cat] || []).find((x) => x.id === id);
		return r ? r.famille : 'rien';
	};
	/** Effets attendus d'une action sur ce dossier (pour la tendance affichée : signe et ordre de grandeur honnêtes) */
	Jeu.effetsAttendus = (cle, d) => effetAttendu(cle, d, contexte(d));

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

	/** Prompt 79 : aggravation durable par ligne (journée en cours) */
	Jeu.aggravationLignes = {};
	const aggravationDurable = (d) => (d.lignes || []).reduce((mx, l) => Math.max(mx, (Jeu.aggravationLignes || {})[l] || 0), 0);
	/** Retard effectif d'un dossier (minutes) : réel + aggravation dans le temps + aggravation durable de la ligne ;
	 * null si la source ne donne pas de retard ; figé à la décision (d.retardFige). */
	Jeu.retardEffectif = function (d, minutes) {
		if (!d || d.retard === null || d.retard === undefined) return null;
		if (d.retardFige !== undefined) return d.retardFige;
		const A = REGLAGES.aggravation;
		const m = minutes !== undefined ? minutes : Jeu.horloge ? Jeu.horloge.minutes : d.minute;
		const vitesse = (Jeu.defiChrono ? 1 : Jeu.difficulte().aggravation) * (Jeu.somnolenceElevee ? 1.5 : 1); // prompt 87 : vitesse selon la difficulté ; prompt 91 (option) : ×1,5 au-delà de 70 de somnolence
		const temps = d.minute === undefined ? 0 : Math.min(A.plafond, Math.floor((Math.max(0, m - d.minute) * vitesse) / A.minutesJeuParMinute)); // sans heure d'arrivée (hors partie) : pas d'aggravation
		return d.retard + temps + aggravationDurable(d);
	};

	/**
	 * Applique une décision. action ∈ 'devier' | 'retenir' | 'renfort' | 'rien' | 'temps'
	 * (« temps » = compteur à 0 → conséquences naturelles seules, Q25).
	 * sourceChoisie ∈ 'a' | 'b' si le dossier contient une contradiction (Q9, Q31).
	 * Retourne { deltas, des, contexte, narration, ... } et passe au dossier suivant.
	 */
	Jeu.decider = function (action, sourceChoisie) {
		const d = Jeu.dossierCourant();
		if (!d || Jeu.terminee) return null;
		const clash = !!Jeu.clashSuivant; // prompt 117 : la réplique choisie était le clash (posé par l'affichage juste avant)
		Jeu.clashSuivant = false;
		if (d.retard !== null && d.retard !== undefined) d.retardFige = Jeu.retardEffectif(d); // prompt 79 : figé à la décision
		const re = Jeu.retardEffectif(d);
		const ctx = contexte(d);
		let deltas = [0, 0, 0];
		const des = [null, null, null];

		const reponse = Jeu.reponse(d, action); // prompt 87 : réponse propre à la catégorie du problème
		if (reponse) {
			const sit = Jeu.situation(d);
			const base = reponse.base.slice();
			if (reponse.long !== undefined && re !== null && re > 20) base[1] = reponse.long; // comme Q58 : un long retard
			deltas = base.map((b, i) => {
				if (!b) return 0;
				des[i] = Jeu.de6();
				let v = Math.sign(b) * (Math.abs(b) + des[i] - 1); // base + 1d6 en amplitude (Q61)
				if (v > 0 && reponse.situations.includes(sit)) v *= REGLAGES.bonusSituation; // réponse adaptée à la situation
				return borner(Math.round(v));
			});
		} else if (action === 'temps') {
			deltas = (REGLAGES.naturel[d.type] || (() => [-4, 0, 0]))(d);
		} else if (action === 'rien') {
			const j = Math.floor(Jeu.alea() * 3);
			deltas[j] = -(2 + Math.floor(Jeu.alea() * 7)); // −2 à −8 (Q60)
		} else {
			const eff = REGLAGES.effets[action];
			const base = eff.base.slice();
			if (action === 'retenir') base[1] = re !== null && re > 20 ? 8 : 4; // Q58 (réputation) — prompt 79 : retard effectif
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

		if (clash) deltas[1] = borner(deltas[1] + REGLAGES.malusClash); // prompt 117
		if (Jeu.modificateurActif && Jeu.modificateurActif() === 'meteo_aggravee') deltas = deltas.map((v) => borner(Math.round(v * 1.5))); // prompt 23 § 2.3
		if (action === 'temps') Jeu.compterMalus('non_traite');
		const jaugesAvant = Object.assign({}, Jeu.jauges); // prompt 130 : l'évaluation pondère selon les jauges d'avant la décision
		NOMS_JAUGES.forEach((k, i) => (Jeu.jauges[k] = Math.max(0, Math.min(100, Jeu.jauges[k] + deltas[i]))));
		const resultat = {
			dossier: d,
			action,
			nomAction: clash ? T('rep.clash') : reponse ? T('rep.' + action) : action === 'temps' ? T('action.temps') : REGLAGES.effets[action].nom,
			categorie: reponse ? Jeu.categorie(d) : null,
			famille: reponse ? reponse.famille : action,
			deltas,
			des,
			contexte: ctx,
			mauvaiseSource,
			clash,
			communique: reponse ? !!reponse.communique : action !== 'temps' && !!(REGLAGES.effets[action] || {}).communique,
		};
		resultat.minuteSim = Jeu.horloge ? Math.floor(Jeu.horloge.minutes) : null; // heure de la partie (prompt 20)
		resultat.jour = d.date;
		resultat.jaugesApres = Object.assign({}, Jeu.jauges); // prompt 48 : courbes du rapport
		resultat.jaugesAvant = jaugesAvant; // prompt 130
		const entree = Jeu.journaliser(resultat, ctx);
		Jeu.majStatutPatron(); // prompt 84 : la décision a changé les jauges
		// Prompt 79 : mauvaise réaction sur un retard → la ligne reste aggravée jusqu'au soir (malus : ceux qui existent déjà)
		const ev = Jeu.evaluer(entree);
		resultat.evaluation = ev; // prompt 163 : rang des décisions clés du rapport (bon / moyen / mauvais)
		if (re !== null && (ev === 'rate' || ev === 'trop_tard') && d.lignes && d.lignes.length) {
			const A = REGLAGES.aggravation;
			d.lignes.forEach((l) => (Jeu.aggravationLignes[l] = Math.min(A.plafondDurable, (Jeu.aggravationLignes[l] || 0) + A.durable)));
			resultat.aggravation = { lignes: d.lignes.slice(), plus: A.durable };
		}
		resultat.narration = Jeu.narrer(resultat);
		if (clash) resultat.narration.texte = T('narr.avecClash', { texte: resultat.narration.texte, malus: REGLAGES.malusClash });
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

	/**
	 * Prompt 88 : variantes de textes. Pour une clé « x », les variantes « x.v1 », « x.v2 » (si elles existent dans la
	 * langue courante) sont tirées par hachage de la graine — aucun appel aux dés — et une variante déjà montrée dans la
	 * journée n'est pas reprise tant qu'il en reste une autre. Renvoie la clé à traduire.
	 */
	Jeu.variantesDuJour = {};
	Jeu.variante = function (cle, sel) {
		const dict = typeof TRADUCTIONS !== 'undefined' && typeof Langue !== 'undefined' ? TRADUCTIONS[Langue.actuelle] || TRADUCTIONS.fr : null;
		const cles = [cle, cle + '.v1', cle + '.v2'].filter((k, i) => i === 0 || (dict && dict[k] !== undefined));
		if (cles.length === 1) return cle;
		const deja = Jeu.variantesDuJour || (Jeu.variantesDuJour = {});
		const libres = cles.filter((k) => !deja[k]);
		const pool = libres.length ? libres : cles;
		const k = pool[hacher(String(Jeu.graine) + '|var|' + cle + '|' + sel) % pool.length];
		deja[k] = true;
		return k;
	};

	/* Narration ancrée dans le dossier réel (06-narration) : date, ligne ou nature, retard, météo — rien d'inventé. */
	Jeu.narrer = function (r) {
		const d = r.dossier;
		const quand = d.date.split('-').reverse().join('/') + (d.heure ? ' ' + d.heure : '');
		const objet = d.lignes && d.lignes.length ? T('narr.objetLigne', { lignes: d.lignes.join(', ') }) : d.type === 'événement' ? (d.texte_source ? T('narr.objetAffluenceNom', { nom: String(d.texte_source).split(' — ')[0].trim() }) : T('narr.objetAffluence')) : d.nature; // prompt 88 : le nom réel de l'événement
		const re = Jeu.retardEffectif(d);
		const fait = d.retard !== null && d.retard !== undefined ? (re !== d.retard ? T('narr.retardAggrave', { reel: d.retard, effectif: re }) : ' (+' + d.retard + ' min)') : ''; // prompt 79
		const items = r.deltas.map((v, i) => (v ? T('delta', { jauge: LIBELLES_JAUGES[NOMS_JAUGES[i]], v: (v > 0 ? '+' : '') + v }) : null)).filter(Boolean);
		const ton = Jeu.ton();
		return {
			titre: T('narr.titre', { quand, objet, fait }),
			texte: T('narr.texte', {
				action: r.nomAction,
				communique: r.communique ? T('narr.communique') : '',
				source: r.mauvaiseSource ? T('narr.mauvaiseSource') : '',
				bilan: items.length ? T('narr.bilan', { liste: Liste(items, ', ', true) }) : T('narr.aucunEffet'),
				reaction: T(Jeu.variante('ton.' + ton, 'ton|' + Jeu.paquet.indexOf(d))), // prompt 88 : 3 variantes
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

	/** Prompt 163 : évaluation d'une décision du bilan — gardée sur le résultat depuis le prompt 163, sinon relue dans le
	 * journal (même objet), sinon « trop tard » pour le temps écoulé ; rang 0 bon, 1 moyen, 2 mauvais. */
	const RANG_EVALUATION = { bon: 0, aucun_detour: 1, inconnu: 1, rate: 2, trop_tard: 2 };
	function evaluationDe(r) {
		if (r.evaluation && RANG_EVALUATION[r.evaluation] !== undefined) return r.evaluation;
		const e = (Jeu.evenementsJournee || []).find((x) => x.resultat === r);
		if (e) return Jeu.evaluer(e);
		return r.action === 'temps' ? 'trop_tard' : 'inconnu';
	}
	Jeu.RANG_EVALUATION = RANG_EVALUATION;
	/** Prompt 163 : seuils des fins, cités sur le rapport à côté du tampon */
	Jeu.SEUILS_FIN = { bonne: 240, moyenne: 150 };
	/** Prompt 163 : période en jj/mm (« du 14/09 au 20/09/2026 · 6 jours joués ») ; temps réel : l'horodatage tel quel */
	Jeu.periodeTexte = function () {
		const s = Jeu.etat && Jeu.etat.semaine;
		if (!s) return (Jeu.etat && Jeu.etat.horodatage) || '';
		const jm = (iso) => iso.split('-').reverse().slice(0, 2).join('/');
		const joues = Math.min((Jeu.jours || []).length, (Jeu.jourIndex || 0) + 1);
		return T('rapport.periodeSemaine', { debut: jm(s.lundi), fin: s.dimanche.split('-').reverse().join('/'), n: joues });
	};

	/** Fin déterminée par le score combiné (Q43, Q48) : bonne ≥ 240, moyenne ≥ 150, mauvaise < 150. */
	Jeu.typeFin = function (score) {
		const s = score === undefined ? Jeu.score() : score;
		return s >= Jeu.SEUILS_FIN.bonne ? 'bonne' : s >= Jeu.SEUILS_FIN.moyenne ? 'moyenne' : 'mauvaise';
	};

	/**
	 * Bilan détaillé (Q54) : texte générique de la fin + bilan chiffré avec les faits réels (Q52),
	 * dossiers traités (Q18) et décisions clés (Q37).
	 */
	Jeu.bilan = function () {
		const type = Jeu.typeFin();
		const decisions = (Jeu.historique || []).filter((h) => h.action);
		const total = (r) => r.deltas.reduce((s, v) => s + v, 0);
		// Prompt 163 : rang d'abord selon l'évaluation (bon < moyen < mauvais), puis l'écart total des jauges —
		// une décision jugée « bon choix » n'est plus montrée comme la pire parce qu'elle a coûté du budget
		const rang = (r) => RANG_EVALUATION[evaluationDe(r)];
		const tries = decisions.slice().sort((a, b) => rang(a) - rang(b) || total(b) - total(a));
		const cles = [];
		if (tries.length) cles.push(Object.assign({ qualite: 'meilleure' }, tries[0]));
		if (tries.length > 1) {
			const der = tries[tries.length - 1];
			cles.push(Object.assign({ qualite: rang(der) === 0 ? 'moins bonne' : 'pire' }, der)); // toutes bonnes : « moins bonne », pas « pire »
		}
		decisions
			.filter((d) => d.mauvaiseSource && !cles.some((c) => c.dossier === d.dossier && c.jour === d.jour && c.minuteSim === d.minuteSim))
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
				titre: marquerFictif(d, d.narration.titre), // prompt 162
				action: d.nomAction,
				evaluation: evaluationDe(d), // prompt 163
				deltas: d.deltas,
			})),
			faits: {
				periode: Jeu.etat.semaine ? Jeu.etat.semaine.lundi + ' → ' + Jeu.etat.semaine.dimanche : Jeu.etat.horodatage || '',
				periodeTexte: Jeu.periodeTexte(), // prompt 163 : jj/mm et jours joués
				pireRetard: pire ? { ligne: (pire.lignes || []).join(', '), minutes: pire.retard } : null,
				parType,
				composition: Jeu.compositionDossiers(Jeu.paquet), // prompt 163 : composition honnête (prompt 162) sur le rapport
			},
		};
	};

	// =====================================================================
	// Prompt 20 — journées de travail, horloge simulée, sieste, mail de fin de journée
	// =====================================================================
	const DEBUT_JOURNEE = 8 * 60; // 8h00 — valeur verrouillée (prompt 76 : un centre de régulation n'ouvre pas à 6 h)
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
			Jeu.messagePatron(consigneDuJour(), 'consigne', metaConsigne());
			Jeu.messagePatron(T('patron.defis', { liste: Jeu.defis.map((id) => T('defi.' + id)).join(' · ') })); // prompt 55 : annoncés le premier matin
			Jeu.annoncerEffectifs(); // prompt 68
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
		// Prompt 121 : les interventions déjà sur place la veille au soir reçoivent leur retour avant le matin
		Jeu.signalementsEnAttente().forEach((s) => s.equipes.every((q) => q.arrivee_sim !== null) && Jeu.retourPlaignant(s.index));
		Jeu.jourIndex++;
		Jeu.variantesDuJour = {}; // prompt 88 : les variantes repartent chaque matin
		Jeu.alertesJauges = {};
		Jeu.aggravationLignes = {}; // prompt 79 : l'aggravation durable vaut pour la journée
		if (Jeu.jourCourant()) {
			Jeu.debutJourneeTactique();
			Jeu.messagePatron(consigneDuJour(), 'consigne', metaConsigne());
			Jeu.annoncerEffectifs(); // prompt 68 : équipes du jour (rentrées de la veille)
			Jeu.prevenirAgenda(); // prompt 47
			Jeu.appliquerBlame(); // prompt 51 : départ anticipé la veille
		}
		Jeu.horloge.minutes = Jeu.debutJournee();
		if (Jeu.jourCourant() && Jeu.jaugesDebutJour) Jeu.jaugesDebutJour[Jeu.jourCourant().date] = Object.assign({}, Jeu.jauges); // prompt 89
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
		const reponse = Jeu.reponse(d, action);
		if (reponse) {
			// Prompt 87 : même calcul que Jeu.decider, dé moyen (d6 − 1 = 2,5)
			const sit = Jeu.situation(d);
			const re = Jeu.retardEffectif(d);
			const base = reponse.base.slice();
			if (reponse.long !== undefined && re !== null && re > 20) base[1] = reponse.long;
			return base.map((b) => {
				if (!b) return 0;
				let v = Math.sign(b) * (Math.abs(b) + 2.5);
				if (v > 0 && reponse.situations.includes(sit)) v *= REGLAGES.bonusSituation;
				return borner(v);
			});
		}
		if (action === 'rien') return [-5 / 3, -5 / 3, -5 / 3]; // −2 à −8 sur une jauge au hasard : −5 en moyenne
		const eff = REGLAGES.effets[action];
		const base = eff.base.slice();
		const re = Jeu.retardEffectif(d); // prompt 79
		if (action === 'retenir') base[1] = re !== null && re > 20 ? 8 : 4;
		return base.map((b, i) => {
			if (!b) return 0;
			let v = Math.sign(b) * (Math.abs(b) + 2.5); // dé moyen : d6 − 1 = 2,5
			if ((i === 0 && ctx.meteo) || (i === 1 && (ctx.pointe || ctx.affluence))) v *= REGLAGES.coefContexte; // météo → fluidité ; pointe, affluence → réputation
			return borner(v);
		});
	}
	const somme = (t) => t.reduce((a, b) => a + b, 0);
	/** Prompt 130 : poids d'une jauge = ce qui lui manque, (100 − v) / 50, borné à [0,25 ; 2] — une jauge basse compte double */
	Jeu.poidsBesoin = (j) => NOMS_JAUGES.map((k) => Math.max(0.25, Math.min(2, (100 - (j && j[k] !== undefined ? j[k] : 50)) / 50)));
	const ponderer = (effets, poids) => effets.reduce((a, v, i) => a + v * poids[i], 0);
	/** Prompt 130 : tolérance (points pondérés) sous laquelle une réponse vaut la meilleure */
	const TOLERANCE_BON = 1;
	/** Prompt 130 : réponses que l'évaluation jugerait bonnes MAINTENANT (aide à la décision, en option) */
	Jeu.reponsesConseillees = function (d) {
		if (!d) return [];
		const poids = Jeu.poidsBesoin(Jeu.jauges);
		const ctx = contexte(d);
		const v = {};
		const as = Jeu.actionsPossibles(d);
		as.forEach((a) => (v[a] = ponderer(effetAttendu(a, d, ctx), poids)));
		const max = Math.max(...as.map((a) => v[a]));
		return as.filter((a) => v[a] >= max - TOLERANCE_BON);
	};

	/** Événement externe réel du dossier (nature, météo, affluence) — jamais inventé */
	/** Prompt 162 : nom d'un événement de l'agenda (« Nom — Lieu »), sinon sa nature (catégorie brute) */
	const nomEvenementDossier = (d) => String(d.texte_source || '').split(' — ')[0].trim() || String(d.nature || '').split(',')[0].trim();
	function externe(d, ctx) {
		let e = d.type === 'événement' ? T('ext.affluence', { nature: nomEvenementDossier(d) }) : d.type === 'ligne en difficulté' ? T('ext.retard') : d.natureAffichee || d.nature; // prompt 162 : nature du fictif traduite
		if (ctx.meteo && d.type !== 'alerte météo') e = T('ext.meteo', { e });
		return e;
	}

	Jeu.journaliser = function (r, ctx) {
		const d = r.dossier;
		const attendus = {};
		const evaluees = Jeu.actionsPossibles(d); // prompt 87 : réponses de la catégorie, ou la table Q57–Q60 en repli
		evaluees.forEach((a) => (attendus[a] = somme(effetAttendu(a, d, ctx))));
		// Prompt 130 : la meilleure réponse est jugée sur l'effet PONDÉRÉ par le besoin de chaque jauge (avant la décision),
		// pas sur la somme brute — sinon « attendre » (budget +, fluidité −) gagnait partout où c'est calme et menait au licenciement
		const poids = Jeu.poidsBesoin(r.jaugesAvant || Jeu.jauges);
		const attendusPonderes = {};
		evaluees.forEach((a) => (attendusPonderes[a] = ponderer(effetAttendu(a, d, ctx), poids)));
		const meilleure = evaluees.slice().sort((a, b) => attendusPonderes[b] - attendusPonderes[a])[0];
		const deltas = {};
		NOMS_JAUGES.forEach((k, i) => (deltas[k] = r.deltas[i]));
		const entree = {
			jour: d.date,
			heure: r.minuteSim === null ? '' : String(Math.floor(r.minuteSim / 60) % 24).padStart(2, '0') + ':' + String(Math.floor(r.minuteSim) % 60).padStart(2, '0'),
			ligne: d.lignes && d.lignes.length ? d.lignes.join(', ') : null,
			externe: externe(d, ctx),
			externeCourt: d.type === 'événement' ? nomEvenementDossier(d) : d.type === 'ligne en difficulté' ? T('ext.retard') : d.natureAffichee || d.nature,
			retard: d.retard === undefined ? null : d.retard,
			retardEffectif: Jeu.retardEffectif(d), // prompt 79
			action: r.action === 'temps' ? null : r.nomAction,
			cleAction: r.action,
			deltas, // deltas réels (référence vers le résultat : la sieste ratée les met à jour)
			meilleureAction: Jeu.libelleAction(meilleure),
			categorie: r.categorie || null,
			famille: r.famille || r.action,
			cleMeilleure: meilleure,
			attendus,
			attendusPonderes, // prompt 130
			poids, // prompt 130 : [fluidité, réputation, budget] au moment du choix
			jaugeBasse: NOMS_JAUGES[poids.indexOf(Math.max(...poids))], // prompt 130 : la jauge la plus en manque (raison du conseil)
			valeurBasse: Math.round((r.jaugesAvant || Jeu.jauges)[NOMS_JAUGES[poids.indexOf(Math.max(...poids))]]),
			resultat: r,
			index: Jeu.index, // prompt 85 : rang du dossier dans le paquet (post du compte social)
			fictif: estFictif(d), // prompt 162 : la trace garde l'étiquette « Fictif »
		};
		Jeu.evenementsJournee.push(entree);
		Jeu.reagirApps(entree);
		return entree;
	};

	/** Évaluation calculée (§ 3.2) : « bon choix ! », « raté », « aucun détour » ou « trop tard » */
	Jeu.evaluer = function (e) {
		// Codes (traduits à l'affichage par t('eval.' + code)) : 'bon', 'rate', 'aucun_detour', 'trop_tard'
		if (e.cleAction === 'temps') return 'trop_tard';
		if (e.resultat && e.resultat.clash) return 'rate'; // prompt 117 : clasher le plaignant n'est jamais la bonne réponse
		if ((e.categorie || String(e.cleAction).includes('.')) && e.attendusPonderes && e.attendusPonderes[e.cleAction] !== undefined) return e.attendusPonderes[e.cleAction] >= e.attendusPonderes[e.cleMeilleure] - TOLERANCE_BON ? 'bon' : 'rate'; // prompt 130 : pondéré par le besoin des jauges
		if (e.categorie || String(e.cleAction).includes('.')) return e.attendus[e.cleAction] >= e.attendus[e.cleMeilleure] - 0.01 ? 'bon' : 'rate'; // prompt 87 : meilleure réponse de la même catégorie (anciennes sauvegardes)
		const actions = ['devier', 'retenir', 'renfort'];
		if (e.cleMeilleure === 'rien' || actions.every((a) => e.attendus[a] < 0)) return e.cleAction === 'rien' ? 'bon' : 'aucun_detour';
		return e.attendus[e.cleAction] >= e.attendus[e.cleMeilleure] - 0.01 ? 'bon' : 'rate';
	};

	Jeu.ligneMail = function (e) {
		const sujet = marquerFictif(e, e.ligne ? T('sujet.ligne', { ligne: e.ligne }) : T('sujet.reseau')); // prompt 162
		const retard = e.retard !== null ? T('mail.retard', { retard: e.retardEffectif !== undefined && e.retardEffectif !== null ? e.retardEffectif : e.retard }) : ''; // prompt 79 : retard qui a compté
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
		// Prompt 84 : un dernier avertissement donné aujourd'hui ouvre le mail, en rouge
		const SP = Jeu.statutPatron;
		if (SP && SP.avertissements >= 2 && SP.dernierJour === Jeu.jourIndex) {
			const l = T('mail.dernier', { score: Jeu.score(), seuil: REGLAGES.licenciement.danger.score });
			l.fait = true;
			l.ok = false;
			lignes.push(l);
		} else if (SP && SP.avertissements >= 2 && Jeu.jourIndex >= (Jeu.jours || []).length - 1) lignes.push(T('mail.avertissementEnCours'));
		// Prompt 89 bis : la narration du soir reprend le fait marquant choisi au rapport du soir (prompt 88)
		const rapportJour = j && Jeu.taches && Jeu.taches.jours && Jeu.taches.jours[j.date] && Jeu.taches.jours[j.date].rapport;
		if (rapportJour && rapportJour.fait) lignes.push(T('mail.faitMarquant', { fait: rapportJour.fait }));
		if (parfaite) lignes.push(T('mail.parfait'));
		else {
			lignes.push(T('mail.journal', { date }));
			duJour.forEach((e) => lignes.push(Jeu.ligneMail(e)));
		}
		// Prompt 79 : Community (réponses à temps / tardives / plaintes expirées) et lignes aggravées durablement
		const bc = Jeu.bilanCommunity(Jeu.jourIndex);
		if (bc.temps + bc.tard + bc.expire) lignes.push(T('mail.community', bc));
		const aggr = Object.keys(Jeu.aggravationLignes || {});
		if (aggr.length) lignes.push(T('mail.aggravation', { lignes: aggr.map((l) => l + ' (+' + Jeu.aggravationLignes[l] + ' min)').join(', ') }));
		const obj = (Jeu.objectifsResultats || []).find((o) => o.jourIndex === Jeu.jourIndex);
		if (obj) lignes.push(T('mail.objectif', { libelle: obj.libelle, resultat: T(obj.atteint ? 'mail.atteint' : 'mail.rate', { effet: obj.effet }) }));
		lignes.push(T('mail.jauges', { f: Jeu.jauges.fluidite, r: Jeu.jauges.reputation, b: Jeu.jauges.budget }));
		// Prompt 55 : défis rappelés chaque soir ; le dernier soir, leur bilan avec les vrais chiffres
		if (Jeu.defis && Jeu.defis.length) {
			if (Jeu.jourIndex >= (Jeu.jours || []).length - 1) {
				lignes.push(T('mail.defisBilan'));
				Jeu.resultatsDefis().forEach((r) => lignes.push(T(r.sansObjet ? 'defi.sansObjet' : r.tenu ? 'defi.tenu' : 'defi.rate', { defi: T('defi.' + r.id), valeur: r.valeur, bonus: T('delta', { jauge: LIBELLES_JAUGES[r.jauge], v: '+' + r.bonus }) })));
			} else lignes.push(T('mail.defis', { liste: Jeu.defis.map((id) => T('defi.' + id)).join(' · ') }));
		}
		const style = Jeu.profilGestion(duJour.map((e) => e.famille || e.cleAction)); // prompt 47 : épilogue personnalisé ; prompt 87 : famille de la réponse
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
		Jeu.majStatutPatron(); // prompt 84
		if (Jeu.verifierPaliersBudget) Jeu.verifierPaliersBudget();
		if (Jeu.verifierConseilsPatron) Jeu.verifierConseilsPatron();
	};

	/** Prompt 86 : valeurs réelles de la consigne au moment de l'envoi (puces de la carte « consigne ») */
	function metaConsigne() {
		const j = Jeu.jourCourant();
		const o = Jeu.objectifDuJour();
		const mo = Jeu.modificateur;
		return { n: j ? j.dossiers.length : 0, jauge: o.jauge, seuil: o.seuil, budget: Jeu.jauges.budget, mod: mo ? mo.id : null, bloque: mo && mo.actionBloquee ? mo.actionBloquee : null };
	}
	function consigneDuJour() {
		const j = Jeu.jourCourant();
		const n = j ? j.dossiers.length : 0;
		const o = Jeu.objectifDuJour();
		const mo = Jeu.modificateur;
		const m = mo ? (mo.actionBloquee ? T('patron.modBloque', { libelle: mo.libelle, action: REGLAGES.effets[mo.actionBloquee].nom }) : T('patron.mod', { libelle: mo.libelle })) : '';
		return T('patron.consigne', { n, parts: Jeu.compositionDossiers(j ? j.dossiers : []), date: j ? j.date.split('-').reverse().join('/') : '', objectif: o.libelle, budget: Jeu.jauges.budget, mod: m });
	}
	/** Prompt 162 : composition d'une liste de dossiers dite honnêtement — « réel » réservé aux faits de la source
	 * (perturbations, retards, alertes météo) ; l'agenda (affluence supposée), l'incident fictif et les conséquences de
	 * jeu comptés à part ; seules les parts non nulles. Texte différé (suit la langue). */
	Jeu.compositionDossiers = function (dossiers) {
		const n = { reelles: 0, meteo: 0, agenda: 0, fictif: 0, chaine: 0 };
		(dossiers || []).forEach((d) => {
			if (estFictif(d)) n.fictif++;
			else if (d.consequence) n.chaine++;
			else if (d.type === 'événement') n.agenda++;
			else if (d.type === 'alerte météo') n.meteo++;
			else n.reelles++;
		});
		return Liste(Object.keys(n).filter((k) => n[k]).map((k) => T('compo.' + k, { n: n[k] })), ', ');
	};

	/** Prompt 86 : message typé (consigne, alerte, conseil, budget, reproche, equipes, info) avec ses valeurs réelles
	 * au moment de l'envoi (meta). Pendant la panne de messagerie (prompt 23), il attend et arrive « en retard ». */
	Jeu.TYPES_MESSAGES = ['consigne', 'alerte', 'conseil', 'budget', 'reproche', 'equipes', 'info'];
	Jeu.patronEnAttente = [];
	Jeu.messagePatron = function (texte, type, meta) {
		const m = { heure: maintenantSim(), jour: ((Jeu.jourCourant && Jeu.jourCourant()) || {}).date || null, texte, type: Jeu.TYPES_MESSAGES.includes(type) ? type : 'info', meta: meta || {}, important: !!(meta && meta.important), lu: false };
		if (Jeu.modificateurActif && Jeu.modificateurActif() === 'panne_messagerie') return Jeu.patronEnAttente.push(Object.assign(m, { enRetard: true }));
		Jeu.messagesPatron.push(m);
		if (typeof annoncer === 'function') annoncer(T('patron.annonce', { type: T('patron.type.' + m.type), texte })); // aria-live avec le type
		Jeu.nonLus.patron++;
	};

	/** Alerte du patron quand une jauge passe sous 20 (Q46) — une fois par jauge et par jour */
	// =====================================================================
	// Prompt 84 — rappel à l'ordre, dernier avertissement, licenciement (game over)
	// =====================================================================
	const nouveauStatut = () => ({ niveau: 0, avertissements: 0, dates: [], rappelJour: null, dernierJour: null, dernierRecuJour: null, sortiDuDanger: false, enAttente: [], licencie: null });
	Jeu.statutPatron = nouveauStatut();
	/** Niveau mesuré sur les jauges réelles, sans hystérésis : 0 normal, 1 vigilance, 2 danger, 3 effondrement */
	Jeu.niveauBrut = function (j) {
		const R = REGLAGES.licenciement;
		const v = NOMS_JAUGES.map((k) => j[k]);
		const score = v.reduce((a, b) => a + b, 0);
		const sous = (s) => v.filter((x) => x < s).length;
		if (score < R.effondrement || v.some((x) => x <= 0)) return 3;
		if (score < R.danger.score || sous(R.danger.deux) >= 2) return 2;
		if (score < R.vigilance.score || sous(R.vigilance.deux) >= 2) return 1;
		return 0;
	};
	const listeJauges = () => Liste(NOMS_JAUGES.map((k) => T('statut.jauge', { jauge: LIBELLES_JAUGES[k], v: Jeu.jauges[k] })), ', ');
	const panneMessagerie = () => !!(Jeu.modificateurActif && Jeu.modificateurActif() === 'panne_messagerie');
	/** Message de sanction : délivré tout de suite, ou mis en file pendant la panne de messagerie (prompt 23) */
	function envoyerSanction(texte, sorte) {
		const S = Jeu.statutPatron;
		if (panneMessagerie()) return S.enAttente.push({ texte, sorte, jour: Jeu.jourIndex, heure: maintenantSim() });
		Jeu.messagePatron(texte, sorte === 'leve' ? 'info' : 'alerte', sorte === 'leve' ? {} : { important: true, score: Jeu.score(), niveau: S.niveau, sorte });
		if (sorte === 'dernier') S.dernierRecuJour = Jeu.jourIndex;
	}
	/** Fin de la panne : les messages en file arrivent (le dernier avertissement compte du jour de sa réception) */
	Jeu.livrerSanctions = function () {
		const S = Jeu.statutPatron;
		if (panneMessagerie()) return 0;
		// Prompt 86 : messages ordinaires émis pendant la panne — gardent leur heure d'origine, « reçus en retard »
		const attente = (Jeu.patronEnAttente || []).splice(0);
		attente.forEach((m) => {
			Jeu.messagesPatron.push(m);
			Jeu.nonLus.patron++;
			if (typeof annoncer === 'function') annoncer(T('patron.annonce', { type: T('patron.type.' + m.type), texte: m.texte }));
		});
		if (!S.enAttente.length) return attente.length;
		const n = S.enAttente.length;
		S.enAttente.splice(0).forEach((m) => {
			const avant = Jeu.messagesPatron.length;
			Jeu.messagePatron(m.texte, m.sorte === 'leve' ? 'info' : 'alerte', m.sorte === 'leve' ? {} : { important: true, score: Jeu.score(), niveau: S.niveau, sorte: m.sorte });
			const recu = Jeu.messagesPatron[avant];
			if (recu) Object.assign(recu, { heure: m.heure || recu.heure, enRetard: true });
			if (m.sorte === 'dernier') S.dernierRecuJour = Jeu.jourIndex;
		});
		return n + attente.length;
	};
	function dernierAvertissement() {
		const S = Jeu.statutPatron;
		S.avertissements = 2;
		S.dernierJour = Jeu.jourIndex;
		S.dates.push(hhmm(Jeu.horloge ? Jeu.horloge.minutes : 0) + '|' + ((Jeu.jourCourant && Jeu.jourCourant()) || {}).date);
		envoyerSanction(T('patron.dernier', { liste: listeJauges(), score: Jeu.score(), seuil: REGLAGES.licenciement.danger.score }), 'dernier');
	}
	/** Recalcul du statut à chaque changement de jauge (hystérésis, rappel, dernier avertissement, licenciement) */
	Jeu.majStatutPatron = function () {
		const S = Jeu.statutPatron;
		if (!Jeu.jauges || !Jeu.messagesPatron || S.licencie || Jeu.terminee) return;
		const R = REGLAGES.licenciement;
		const brut = Jeu.niveauBrut(Jeu.jauges);
		const score = Jeu.score();
		if (brut === 3) {
			S.licencie = { cause: 'effondrement', score, heure: maintenantSim(), date: ((Jeu.jourCourant && Jeu.jourCourant()) || {}).date };
			return;
		}
		const avant = S.niveau;
		let niv = avant;
		if (brut > avant) niv = brut;
		else if (avant === 2 && brut < 2 && score >= R.sortieDanger) niv = brut === 0 && score >= R.sortieVigilance ? 0 : 1;
		else if (avant === 1 && brut === 0 && score >= R.sortieVigilance) niv = 0;
		S.niveau = niv;
		if (niv === avant) return;
		if (niv === 2) {
			// (c) danger atteint à nouveau après un dernier avertissement dont le joueur était sorti
			if (S.avertissements >= 2 && S.sortiDuDanger) {
				S.licencie = { cause: 'rechute', score, heure: maintenantSim(), date: ((Jeu.jourCourant && Jeu.jourCourant()) || {}).date };
				return;
			}
			if (S.avertissements === 0) S.rappelJour = Jeu.jourIndex;
			dernierAvertissement();
			return;
		}
		if (avant === 2) S.sortiDuDanger = true;
		if (niv === 1 && avant === 0 && S.avertissements === 0) {
			// Rappel à l'ordre : vraies valeurs, jauge la plus basse, dernière décision ratée
			S.avertissements = 1;
			S.rappelJour = Jeu.jourIndex;
			S.dates.push(hhmm(Jeu.horloge ? Jeu.horloge.minutes : 0) + '|' + ((Jeu.jourCourant && Jeu.jourCourant()) || {}).date);
			const basse = NOMS_JAUGES.slice().sort((a, b) => Jeu.jauges[a] - Jeu.jauges[b])[0];
			const rate = (Jeu.evenementsJournee || []).filter((e) => Jeu.evaluer(e) === 'rate' || Jeu.evaluer(e) === 'trop_tard').pop();
			const detail = T('patron.rappelBasse', { jauge: LIBELLES_JAUGES[basse], v: Jeu.jauges[basse] });
			const decision = rate ? T('patron.rappelDecision', { heure: rate.heure, sujet: rate.ligne ? T('sujet.ligne', { ligne: rate.ligne }) : rate.externeCourt, action: rate.action || T('action.temps') }) : '';
			envoyerSanction(T('patron.rappel', { liste: listeJauges(), score, detail, decision }), 'rappel');
		}
		if (niv === 0 && avant >= 1) {
			// Rattrapage : un avertissement effacé, surveillance levée
			S.avertissements = Math.max(0, S.avertissements - 1);
			envoyerSanction(T('patron.leve', { score }), 'leve');
		}
	};
	/** Fin de journée (avant le mail) : dernier avertissement si la vigilance dure, licenciement (a) le lendemain soir */
	Jeu.finJourneeStatut = function () {
		const S = Jeu.statutPatron;
		if (!Jeu.jauges || S.licencie) return S.licencie;
		const dernierJour = !(Jeu.jours || [])[Jeu.jourIndex + 1];
		if (S.avertissements >= 2 && S.dernierRecuJour !== null && S.dernierRecuJour < Jeu.jourIndex && Jeu.score() < REGLAGES.licenciement.danger.score) {
			S.licencie = { cause: 'delai', score: Jeu.score(), heure: maintenantSim(), date: ((Jeu.jourCourant && Jeu.jourCourant()) || {}).date };
			return S.licencie;
		}
		if (!dernierJour && S.niveau >= 1 && S.avertissements === 1 && S.rappelJour !== null && S.rappelJour < Jeu.jourIndex) dernierAvertissement();
		return null;
	};
	/** Lettre de licenciement : uniquement des faits réels de la partie */
	Jeu.lettreLicenciement = function () {
		const S = Jeu.statutPatron;
		const L0 = S.licencie || { cause: 'delai', score: Jeu.score(), heure: maintenantSim(), date: '' };
		const pires = (Jeu.evenementsJournee || [])
			.slice()
			.sort((a, b) => somme(NOMS_JAUGES.map((k) => a.deltas[k])) - somme(NOMS_JAUGES.map((k) => b.deltas[k])))
			.slice(0, 3)
			.filter((e) => somme(NOMS_JAUGES.map((k) => e.deltas[k])) < 0)
			.map((e) => T('gameover.decision', { jour: e.jour.split('-').reverse().join('/'), heure: e.heure, sujet: e.ligne ? T('sujet.ligne', { ligne: e.ligne }) : e.externeCourt, action: e.action || T('action.temps'), effet: Liste(NOMS_JAUGES.filter((k) => e.deltas[k]).map((k) => T('delta', { jauge: LIBELLES_JAUGES[k], v: (e.deltas[k] > 0 ? '+' : '') + e.deltas[k] })), ', ') }));
		const malusFrequent = Object.keys(Jeu.malus || {}).sort((a, b) => Jeu.malus[b] - Jeu.malus[a])[0];
		const m = malusFrequent ? Jeu.MALUS.find((x) => x.id === malusFrequent) : null;
		const basse = NOMS_JAUGES.slice().sort((a, b) => Jeu.jauges[a] - Jeu.jauges[b])[0];
		return {
			cause: L0.cause,
			quand: T('gameover.quand', { date: String(L0.date || '').split('-').reverse().join('/'), heure: L0.heure }),
			jauges: listeJauges(),
			score: Jeu.score(),
			avertissements: T('gameover.avertissements', { n: S.avertissements, dates: S.dates.map((d) => d.split('|')[1].split('-').reverse().join('/') + ' ' + d.split('|')[0]).join(', ') || '—' }),
			pires,
			malus: m ? T('gameover.malus', { libelle: m.libelle, n: Jeu.malus[malusFrequent] }) : null,
			conseil: T('gameover.conseil.' + basse, { v: Jeu.jauges[basse] }),
		};
	};
	/** Combien de points de score pour sortir de la surveillance (conseil contextuel) */
	Jeu.pointsPourSortir = () => {
		const S = Jeu.statutPatron;
		if (!S.niveau) return 0;
		return Math.max(0, (S.niveau === 2 ? REGLAGES.licenciement.sortieDanger : REGLAGES.licenciement.sortieVigilance) - Jeu.score());
	};

	Jeu.verifierAlertesPatron = function () {
		if (!Jeu.messagesPatron) return;
		NOMS_JAUGES.forEach((k) => {
			if (Jeu.jauges[k] < REGLAGES.seuilCritique && !Jeu.alertesJauges[k]) {
				Jeu.alertesJauges[k] = true;
				Jeu.messagePatron(T('patron.alerte', { jauge: LIBELLES_JAUGES[k], v: Jeu.jauges[k] }), 'alerte', { jauge: k, v: Jeu.jauges[k], seuil: REGLAGES.seuilCritique });
			}
		});
	};

	// Commentaires nantais : modèles courts remplis avec les données réelles du dossier (pseudonymes fictifs)
	const PSEUDOS = ['@usager_44', '@nantaise_du_tram', '@velo_et_bus', '@ile_de_nantes', '@quai_de_la_fosse', '@chantenay_matin'];
	const COMMENTAIRES = { bon: 3, mauvais: 3 }; // nombre de modèles par sorte (textes : i18n.js, clés com.<sorte>.<n>)
	const DELTA_REPUTATION = { bon: 2, mauvais: -3, equipe: 1 };

	Jeu.commenter = function (sorte, sujet, retard, equipe, index) {
		const n = Jeu.commentaires.length;
		const texte = marquerFictif(index !== undefined && Jeu.paquet ? Jeu.paquet[index] : null, T('com.' + sorte + '.' + (n % COMMENTAIRES[sorte]), {
			sujet,
			retard: retard !== null && retard !== undefined ? ' (+' + retard + ' min)' : '',
			heure: maintenantSim(),
			equipe: equipe || '',
		})); // prompt 162 : commentaire sur un dossier fictif marqué
		const delta = DELTA_REPUTATION[sorte];
		Jeu.commentaires.push({ heure: maintenantSim(), auteur: PSEUDOS[n % PSEUDOS.length], texte, delta, index, jour: Jeu.jourIndex }); // prompt 85 : rattaché au post du dossier
		Jeu.nonLus.community++;
		Jeu.appliquerDeltas({ reputation: delta }); // chaque commentaire fait évoluer la réputation
	};

	/** Après chaque dossier traité : un commentaire nantais et, si c'est raté, une réaction du patron */
	Jeu.reagirApps = function (e) {
		const sujet = e.ligne ? T('sujet.ligne', { ligne: e.ligne }) : e.externeCourt || e.externe;
		const ev = Jeu.evaluer(e);
		Jeu.commenter(ev === 'bon' ? 'bon' : 'mauvais', sujet, e.retard, undefined, e.index);
		if (ev === 'rate') Jeu.messagePatron(marquerFictif(e, T(Jeu.variante('patron.rate', 'rate|' + e.index), { sujet, action: e.action, meilleure: e.meilleureAction })), 'reproche', { index: e.index, jour: e.jour, ligne: e.ligne, action: e.cleAction, meilleure: e.cleMeilleure });
		if (ev === 'trop_tard') Jeu.messagePatron(marquerFictif(e, T('patron.tropTard', { sujet })), 'reproche', { index: e.index, jour: e.jour, ligne: e.ligne, action: 'temps', meilleure: e.cleMeilleure });
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
		// Prompt 85 : modèles d'info trafic (FR + EN, « coherent »), validés comme les plaintes
		const modeles = ((donnees && donnees.modeles) || []).filter((m) => m && typeof m.id === 'string' && m.texte && typeof m.texte.fr === 'string' && typeof m.texte.en === 'string' && Array.isArray(m.coherent));
		Jeu.MESSAGES = { plaintes: ok, modeles };
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
		if (d.type === 'événement') v.nom = nomEvenementDossier(d); // prompt 162 : le nom de l'événement, pas sa catégorie d'agenda
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

	/** Prompt 118 : environ 1 dossier sur 3 a un plaignant au ton agressif (si une plainte agressive correspond) ;
	 * choix déterministe par numéro de dossier, sans dé */
	function choisirSelonTon(meilleures, index) {
		const agressif = (index * 7 + 3) % 3 === 0;
		const pool = meilleures.filter((p) => (p.ton === 'agressif') === agressif);
		const liste = pool.length ? pool : meilleures.filter((p) => p.ton !== 'agressif').length ? meilleures.filter((p) => p.ton !== 'agressif') : meilleures;
		return liste[index % liste.length];
	}
	/** Texte d'une plainte ou d'une réponse dans la langue active (repli : français), variables remplies */
	Jeu.texteMessage = function (champ, vars) {
		const langue = typeof Langue !== 'undefined' ? Langue.actuelle : 'fr'; // const de i18n.js (pas une propriété de window)
		const s = (champ && (champ[langue] || champ.fr)) || '[À COMPLÉTER]';
		return s.replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? String(vars[k]) : m));
	};

	/** Prompt 162 : texte d'une plainte reçue, marqué « Fictif · » si elle porte sur le dossier fictif */
	Jeu.textePlainte = (p) => String(marquerFictif(p && Jeu.paquet ? Jeu.paquet[p.index] : null, Jeu.texteMessage(p.def.texte, p.vars)));
	/** Prompt 117 : meilleure réponse attendue pour ce dossier (même calcul que le Journal), lecture seule */
	Jeu.meilleureReponse = function (d) {
		// Prompt 130 : la meilleure réponse au sens de l'évaluation — effets pondérés par le besoin des jauges actuelles
		const ctx = contexte(d);
		const ev = Jeu.actionsPossibles(d);
		const poids = Jeu.poidsBesoin(Jeu.jauges);
		const att = {};
		ev.forEach((a) => (att[a] = ponderer(effetAttendu(a, d, ctx), poids)));
		return ev.slice().sort((a, b) => att[b] - att[a])[0];
	};
	/** Prompt 116 : variables d'une réplique au plaignant (lecture seule) — faits réels du dossier + pseudo du plaignant */
	Jeu.variablesReplique = function (index) {
		const d = (Jeu.paquet || [])[index];
		if (!d) return {};
		const v = variablesDossier(d);
		const pl = Jeu.plaignantPour ? Jeu.plaignantPour(index) : null;
		if (pl && pl.auteur) v.auteur = pl.auteur;
		return v;
	};
	/** Prompt 102 : le plaignant d'un dossier, SANS effet de bord (lecture seule) — la plainte Community déjà
	 * déclenchée pour ce dossier, sinon la plus spécifique qui correspond à ses faits réels (choix déterministe,
	 * comme declencherPlainte), sinon null (c'est alors la source réelle qui « parle » dans le dialogue). */
	Jeu.plaignantPour = function (index) {
		const d = (Jeu.paquet || [])[index];
		if (!d || !Jeu.MESSAGES) return null;
		const deja = (Jeu.plaintes || []).find((p) => p.index === index);
		if (deja) return { id: deja.id, auteur: deja.auteur, texte: Jeu.texteMessage(deja.def.texte, deja.vars), ton: deja.def.ton || 'normal' };
		const vars = variablesDossier(d);
		const candidates = (Jeu.MESSAGES.plaintes || []).filter((p) => plainteCorrespond(p, d, vars));
		if (!candidates.length) return null;
		const max = Math.max(...candidates.map(specificite));
		const def = choisirSelonTon(candidates.filter((p) => specificite(p) === max), index);
		return { id: def.id, auteur: def.auteur || '@usager_44', texte: Jeu.texteMessage(def.texte, vars), ton: def.ton || 'normal' };
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
		const def = choisirSelonTon(pool.filter((p) => specificite(p) === max), index); // déterministe : ne touche pas au tirage des dés
		const plainte = { id: def.id, def, vars, index, heure: maintenantSim(), auteur: def.auteur || '@usager_44', reponse: null };
		Jeu.plaintes.push(plainte);
		Jeu.nonLus.community++;
		return plainte;
	};

	Jeu.MAX_PLAINTES_EN_ATTENTE = 3;
	Jeu.plaintesEnAttente = () => (Jeu.plaintes || []).filter((p) => p.reponse === null && !p.expiree && !p.transmise); // prompt 79 : une plainte expirée n'attend plus ; prompt 85 : ni une plainte transmise au patron

	// Prompt 79 — délai de réponse Community (REGLAGES.community) : répondre vite évite la dégradation
	/** Millisecondes restantes avant que la plainte s'envenime (le délai démarre à sa première vue par majPlaintes) */
	Jeu.resteReponse = (p, maintenant) => (p.depuis === undefined || p.depuis > maintenant ? REGLAGES.community.delaiMs : Math.max(0, REGLAGES.community.delaiMs - (maintenant - p.depuis)));
	/** À chaque image : les plaintes sans réponse à l'expiration s'enveniment (malus d'un mauvais commentaire, prompt 22) */
	Jeu.majPlaintes = function (maintenant) {
		const expirees = [];
		Jeu.plaintesEnAttente().forEach((p) => {
			if (p.depuis === undefined || p.depuis > maintenant) p.depuis = maintenant; // prompt 131 : horloge remise à zéro (rechargement) → le délai repart
			if (maintenant - p.depuis < REGLAGES.community.delaiMs) return;
			p.expiree = true;
			p.statut = 'expire';
			p.jourStatut = Jeu.jourIndex;
			const delta = DELTA_REPUTATION.mauvais;
			Jeu.appliquerDeltas({ reputation: delta });
			Jeu.commentaires.push({ heure: maintenantSim(), auteur: p.auteur, texte: T('community.envenime', { auteur: p.auteur }), delta });
			Jeu.nonLus.community++;
			expirees.push(p);
		});
		return expirees;
	};
	/** Bilan Community d'une journée : réponses à temps, tardives, plaintes expirées */
	Jeu.bilanCommunity = function (jourIndex) {
		const du = (Jeu.plaintes || []).filter((p) => p.jourStatut === jourIndex);
		return { temps: du.filter((p) => p.statut === 'temps').length, tard: du.filter((p) => p.statut === 'tard').length, expire: du.filter((p) => p.statut === 'expire').length };
	};

	/** Le joueur répond : effets du JSON (bornés à ±bornesEffet) appliqués aux jauges, bornées 0–100 */
	Jeu.repondrePlainte = function (plainte, i, maintenant) {
		const r = plainte && plainte.reponse === null && !plainte.expiree ? plainte.def.reponses[i] : null;
		if (!r) return null;
		const effets = {};
		NOMS_JAUGES.forEach((k) => {
			const v = Number((r.effets || {})[k]) || 0;
			if (v) effets[k] = borner(v);
		});
		// Prompt 79 : réponse rapide = effets existants ; réponse tardive = malus d'un mauvais commentaire en plus
		const tardive = maintenant !== undefined && plainte.depuis !== undefined && maintenant - plainte.depuis > REGLAGES.community.rapideMs;
		if (tardive) effets.reputation = borner((effets.reputation || 0) + DELTA_REPUTATION.mauvais);
		plainte.statut = tardive ? 'tard' : 'temps';
		plainte.jourStatut = Jeu.jourIndex;
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
		return { effets, bonne: plainte.bonne, tardive };
	};

	// Prompt 63 — réactions en chaîne : tirées par hachage (graine + plainte), sans toucher aux dés de la partie
	Jeu.NB_MODELES_SUIVI = 4; // textes : i18n.js, suivi.<bonne|mauvaise>.<n>
	Jeu.programmerSuivis = function (plainte) {
		const h = (k) => hacher(String(Jeu.graine) + '|suivi|' + plainte.id + '|' + plainte.index + '|' + k);
		const n = plainte.def && plainte.def.prive ? h('n') % 2 : h('n') % 4; // 0 à 3 réactions ; message privé (prompt 85) : au plus 1 relance
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
				if (p.def && p.def.prive) {
					// Prompt 85 : relance privée, dans la conversation (pas de réaction publique en chaîne)
					p.relances = (p.relances || []).concat({ heure: maintenantSim(), texte: T('suivi.prive.' + (p.bonne ? 'bonne' : 'mauvaise')), delta: sv.delta });
					Jeu.nonLus.community++;
					Jeu.appliquerDeltas({ reputation: sv.delta });
					return;
				}
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
	Jeu.bilanPlaintes = () => ({ traitees: (Jeu.plaintes || []).filter((p) => p.reponse !== null || p.transmise).length, total: (Jeu.plaintes || []).length, bonnes: (Jeu.plaintes || []).filter((p) => p.bonne).length });

	// =====================================================================
	// Prompt 85 — le compte social de la régulation (réseau fictif « Quai ») : posts calculés sur les faits réels
	// de la partie, posts d'archive tirés de la semaine archivée précédente, info trafic publiée par le joueur,
	// messages privés. Compteurs (abonnés, « j'aime ») = valeurs de jeu dérivées de la réputation, jamais réelles.
	// =====================================================================
	Jeu.postsJoueur = [];
	const LIKES_EVAL = { bon: 42, aucun_detour: 24, rate: 9, trop_tard: 4 }; // valeur de jeu selon l'évaluation
	const sujetDe = (d) => (d.lignes && d.lignes.length ? T('sujet.ligne', { ligne: d.lignes.join(', ') }) : String(d.nature || '').split(',')[0]);
	/** Sujet de la photo pixel selon le fait réel (type de ligne de data/lignes.js, travaux, agenda, météo) */
	Jeu.sujetPhoto = function (d) {
		if (!d) return { sujet: 'meteo' };
		if (d.type === 'alerte météo') return { sujet: 'meteo' };
		if (d.type === 'événement') return { sujet: 'foule' };
		if (d.type === 'perturbation' && /travaux|chantier|déviation/i.test(String(d.nature) + ' ' + String(d.texte_source))) return { sujet: 'travaux' };
		const ln = d.lignes && d.lignes.length && Jeu.lignes ? Jeu.lignes.lignes.find((x) => x.nom === d.lignes[0]) : null;
		if (ln) return { sujet: ln.type === 0 ? 'tram' : ln.type === 4 ? 'navibus' : 'bus', couleur: ln.couleur || null };
		return { sujet: d.type === 'perturbation' ? 'bus' : 'meteo' };
	};
	/** Posts de la partie : un par dossier traité, fidèle à l'action et aux valeurs réelles */
	Jeu.postsPartie = function () {
		return (Jeu.evenementsJournee || []).map((e) => {
			const d = e.resultat.dossier;
			const ev = Jeu.evaluer(e);
			return {
				sorte: 'partie',
				index: e.index !== undefined ? e.index : Jeu.paquet.indexOf(d),
				jour: e.jour,
				heure: e.heure,
				texte: marquerFictif(d, T(e.cleAction === 'temps' ? 'post.tropTard' : 'post.action', { sujet: sujetDe(d), retard: e.retard !== null ? T('post.retard', { retard: e.retard }) : '', action: e.action || '' })), // prompt 162
				likes: Math.round((LIKES_EVAL[ev] || 10) * (Jeu.jauges.reputation / 50)),
				photo: Jeu.sujetPhoto(d),
				date: d.date,
				minute: e.resultat.minuteSim,
			};
		});
	};
	/** Posts d'archive : faits réels de la semaine archivée précédente (changelog, alertes météo, agenda, météo) ;
	 * aucun fait → aucun post (rien n'est inventé pour remplir). */
	Jeu.postsArchive = function () {
		const e = Jeu.etat || {};
		const S = global.PXE_SEMAINES;
		if (e.mode !== 'semaine' || !e.semaine || !S) return [];
		const lundis = Object.keys(S.semaines).sort();
		const prec = lundis.filter((l) => l < e.semaine.lundi).pop();
		if (!prec) return [];
		const w = S.semaines[prec];
		const posts = [];
		(w.dossiers || []).forEach((d) => {
			if (d.type === 'perturbation') posts.push({ date: d.date, texte: T('post.archive.perturbation', { texte: d.texte_source }), photo: Jeu.sujetPhoto(d) });
			else if (d.type === 'alerte météo') posts.push({ date: d.date, texte: T('post.archive.meteo', { nature: d.nature, valeur: d.valeur }), photo: { sujet: 'meteo' } });
		});
		(w.evenements || [])
			.map((ev) => ({ ev, s: scoreAffluence(ev) }))
			.filter((x) => x.s >= 1)
			.slice(0, 3)
			.forEach((x) => posts.push({ date: x.ev.date, texte: T('post.archive.agenda', { nom: String(x.ev.texte_source).split(' — ')[0] }), photo: { sujet: 'foule' } }));
		(w.meteo || []).filter((m) => (m.pluie_mm || 0) >= 5 || (m.rafales_max || 0) >= 50).forEach((m) => posts.push({ date: m.date, texte: T('post.archive.pluie', { pluie: m.pluie_mm, vent: m.rafales_max }), photo: { sujet: 'meteo', pluie: (m.pluie_mm || 0) >= 1 } }));
		return posts
			.sort((a, b) => b.date.localeCompare(a.date))
			.slice(0, 9)
			.map((p, i) => Object.assign(p, { sorte: 'archive', heure: '', likes: Math.round((18 + ((i * 7) % 15)) * (Jeu.jauges.reputation / 50)) }));
	};
	Jeu.modelesInfo = () => (Jeu.MESSAGES && Jeu.MESSAGES.modeles) || [];
	/** Le joueur publie une info trafic sur un dossier traité : +1 si cohérente avec sa décision, −2 sinon ; une par dossier */
	Jeu.publierInfo = function (index, idModele) {
		if ((Jeu.postsJoueur || []).some((p) => p.index === index)) return null;
		const e = (Jeu.evenementsJournee || []).find((x) => x.index === index);
		const m = Jeu.modelesInfo().find((x) => x.id === idModele);
		if (!e || !m) return null;
		const d = e.resultat.dossier;
		const coherent = (m.coherent || []).includes(e.famille || e.cleAction) || ((m.coherent || []).includes('meteo') && contexte(d).meteo);
		const delta = coherent ? 1 : -2;
		Jeu.appliquerDeltas({ reputation: delta });
		const post = { index, modele: idModele, coherent, delta, heure: maintenantSim(), jour: d.date, vars: { sujet: String(sujetDe(d)), action: e.action || T('action.temps') } };
		Jeu.postsJoueur.push(post);
		return post;
	};
	/** Prompt 91 § 3 : publication du brouillon d'info trafic (faits du dossier) — sans effet de jauge ; une par dossier */
	Jeu.publierBrouillon = function (index) {
		const d = (Jeu.paquet || [])[index];
		if (!d || (Jeu.postsJoueur || []).some((p) => p.index === index)) return null;
		const post = { index, brouillon: true, modele: null, coherent: true, delta: 0, heure: maintenantSim(), jour: d.date, vars: {} };
		Jeu.postsJoueur.push(post);
		return post;
	};
	/** Message privé hors du rôle du joueur : transmis au patron, sans effet de réputation */
	Jeu.transmettrePatron = function (plainte) {
		if (!plainte || plainte.reponse !== null || plainte.expiree || plainte.transmise) return false;
		plainte.transmise = true;
		plainte.statut = 'transmise';
		plainte.jourStatut = Jeu.jourIndex;
		Jeu.messagePatron(T('patron.transfert', { auteur: plainte.auteur, texte: { toString: () => Jeu.textePlainte(plainte) } }));
		return true;
	};

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

	// Prompt 68 — équipes d'intervention LIMITÉES. Effectif par jour, cycle disponible → en route (20 s) → sur place
	// (durée d'intervention) → retour (10 s) → disponible. Effectifs remis à zéro chaque matin. Valeurs verrouillées.
	REGLAGES.equipes = {
		police: { effectif: 2, duree: 40000 },
		ambulance: { effectif: 1, duree: 50000 },
		techniciens: { effectif: 2, duree: 60000 },
		pompiers: { effectif: 1, duree: 60000 },
	};
	Jeu.RETOUR_EQUIPE_MS = 10000;
	Jeu.TYPES_EQUIPES = ['police', 'ambulance', 'techniciens', 'pompiers']; // ordre des raccourcis Maj + 1/2/3/4
	// Prompt 108 : effectif du jour adapté au volume — base + ⌊signalements du jour ÷ 3⌋, plafonné (durées et coûts inchangés)
	const PLAFONDS_EQUIPES = { police: 4, ambulance: 3, techniciens: 4, pompiers: 3 };
	Jeu.effectifJour = function (cle) {
		const j = Jeu.jourCourant ? Jeu.jourCourant() : null;
		const n = j && j.dossiers ? j.dossiers.length : 0;
		return Math.min(PLAFONDS_EQUIPES[cle] || 4, REGLAGES.equipes[cle].effectif + Math.floor(n / 3)) + ((Jeu.bonusEffectifs || {})[cle] || 0);
	};
	const engagees = (cle, maintenant) => (Jeu.equipes || []).filter((q) => q.cle === cle && !q.inutile && q.jourIndex === Jeu.jourIndex && maintenant < q.libre);
	Jeu.equipesDisponibles = (cle, maintenant) => Math.max(0, Jeu.effectifJour(cle) - engagees(cle, maintenant).length); // prompt 88 : demande « une équipe de plus » accordée
	/** Secondes avant le retour de la première équipe engagée de ce type (0 si une est libre) */
	Jeu.retourEquipe = (cle, maintenant) => {
		const e = engagees(cle, maintenant);
		return e.length < Jeu.effectifJour(cle) ? 0 : Math.ceil((Math.min(...e.map((q) => q.libre)) - maintenant) / 1000);
	};
	/** Phase d'une équipe engagée : 'route' | 'place' | 'retour' | 'libre' */
	Jeu.phaseEquipe = (q, maintenant) => (q.inutile || maintenant >= q.libre ? 'libre' : maintenant < q.arrivee ? 'route' : maintenant < q.finIntervention ? 'place' : 'retour');

	/** Pertinence calculée sur les champs réels du dossier, sans tirage (table du prompt 68 § 4.3) */
	const MOTS_SECOURS = /accident|malaise|bless|chute/i;
	Jeu.equipesPertinentes = function (d) {
		const p = new Set();
		if (!d) return [];
		if (d.type === 'ligne en difficulté') p.add('techniciens');
		if (d.type === 'perturbation') ['techniciens', 'police'].forEach((x) => p.add(x));
		if (d.type === 'événement') p.add('police');
		if (d.type === 'alerte météo') ['pompiers', 'techniciens'].forEach((x) => p.add(x));
		if (d.type === 'incident fictif') ['police'].concat(/agression/.test(String(d.nature)) ? ['ambulance'] : []).forEach((x) => p.add(x)); // prompt 119
		if (MOTS_SECOURS.test(String(d.texte_source || '') + ' ' + String(d.nature || ''))) ['ambulance', 'police'].forEach((x) => p.add(x));
		return Jeu.TYPES_EQUIPES.filter((x) => p.has(x));
	};
	/** Gravité calculée (affichée avec sa règle dans l'aide) : élevée, moyenne ou faible */
	Jeu.gravite = function (d) {
		if (!d) return 'faible';
		const re = Jeu.retardEffectif(d); // prompt 79 : la gravité suit le retard effectif
		if ((re !== null && re >= 20) || d.type === 'alerte météo' || d.type === 'incident fictif') return 'elevee'; // prompt 119 : incident fictif = gravité élevée
		if ((re !== null && re >= 10) || d.type === 'événement' || d.affluence) return 'moyenne';
		return 'faible';
	};

	/** Envoi d'une équipe sur le dossier d'index donné ; renvoie { ok, message, refus } */
	Jeu.envoyerEquipe = function (index, cle, maintenant) {
		if (!Jeu.elementDebloque('equipes')) return { ok: false, message: T('histoire.verrou.equipes') }; // prompt 41 : semaine 2
		const q = EQUIPES[cle];
		const d = Jeu.paquet[index];
		if (!q || !d) return { ok: false, message: T('equipe.introuvable') };
		if ((Jeu.equipes || []).some((x) => x.index === index && x.cle === cle)) return { ok: false, message: T('equipe.deja') }; // une par type et par incident
		if (index >= Jeu.index && !Jeu.equipesDisponibles(cle, maintenant)) {
			Jeu.refusEquipes = (Jeu.refusEquipes || 0) + 1;
			return { ok: false, refus: true, message: T('equipe.aucune', { nom: q.nom, s: Jeu.retourEquipe(cle, maintenant) }) };
		}
		if (Jeu.jauges.budget < q.cout) return { ok: false, message: T('equipe.budget', { budget: Jeu.jauges.budget, cout: q.cout, nom: q.nom }) };
		if (q.palier && Jeu.jauges.budget < q.palier) return { ok: false, message: T('equipe.palier', { nom: q.nom, palier: q.palier, budget: Jeu.jauges.budget }) };
		Jeu.appliquerDeltas({ budget: -q.cout });
		const sujet = d.lignes && d.lignes.length ? T('sujet.ligne', { ligne: d.lignes.join(', ') }) : d.nature;
		if (index < Jeu.index) {
			// Équipe inutile (prompt 23 § 4) : l'incident est déjà résolu — coût perdu, réputation −3
			Jeu.compterMalus('equipe_inutile');
			Jeu.appliquerDeltas({ reputation: -3 });
			Jeu.equipes.push({ index, cle, nom: q.nom, cout: q.cout, depart: maintenant, arrivee: maintenant, finIntervention: maintenant, libre: maintenant, heure: maintenantSim(), arrivee_sim: maintenantSim(), inutile: true, jour: d.date, jourIndex: Jeu.jourIndex, sujet });
			return { ok: false, message: T('equipe.inutile', { cout: q.cout }) };
		}
		const pertinente = Jeu.equipesPertinentes(d).includes(cle);
		const arrivee = maintenant + Jeu.DELAI_EQUIPE_MS * (Jeu.somnolenceElevee ? 1.5 : 1); // prompt 91 (option) : fatigué, on coordonne moins vite
		const finIntervention = arrivee + REGLAGES.equipes[cle].duree;
		Jeu.equipes.push({ index, cle, nom: q.nom, cout: q.cout, depart: maintenant, arrivee, finIntervention, libre: finIntervention + Jeu.RETOUR_EQUIPE_MS, heure: maintenantSim(), arrivee_sim: null, jour: d.date, jourIndex: Jeu.jourIndex, pertinente, sujet, remercie: false });
		return { ok: true, message: T(pertinente ? 'equipe.enRoute' : 'equipe.enRouteHorsSujet', { nom: q.nom, cout: q.cout }) };
	};

	/** À appeler à chaque image : applique les effets des équipes arrivées (moitié si l'équipe n'est pas pertinente) */
	Jeu.majEquipes = function (maintenant) {
		(Jeu.equipes || []).forEach((q) => {
			if (q.arrivee_sim === null && !q.inutile && maintenant >= q.arrivee) {
				q.arrivee_sim = maintenantSim();
				const effets = {};
				Object.entries(EQUIPES[q.cle].effets).forEach(([k, v]) => (effets[k] = q.pertinente === false ? Math.round(v / 2) : v));
				Jeu.appliquerDeltas(effets);
			}
		});
		Jeu.majRetours(maintenant); // prompt 121 : le plaignant remercie quand l'intervention est finie
	};

	// ——— Prompt 121 : statut d'un signalement après la réponse du joueur ———
	// clos (aucune équipe utile) · attente (équipe envoyée, intervention pas finie) · termine (retour du plaignant reçu)
	const RETOURS_MERCI = 3; // variantes retour.merci.<n> (i18n.js)
	const equipesUtiles = (index) => (Jeu.equipes || []).filter((q) => q.index === index && !q.inutile);
	/** Lecture seule : 'ouvert' tant que le joueur n'a pas répondu, puis 'clos', 'attente' ou 'termine' */
	Jeu.statutSignalement = function (index) {
		if (index >= Jeu.index) return 'ouvert';
		const eq = equipesUtiles(index);
		if (!eq.length) return 'clos';
		return eq.every((q) => q.remercie) ? 'termine' : 'attente';
	};
	/** Signalements répondus dont on attend encore le retour du plaignant : [{ index, d, equipes }] */
	Jeu.signalementsEnAttente = function () {
		const vus = new Set();
		const out = [];
		(Jeu.equipes || []).forEach((q) => {
			if (q.inutile || q.remercie || q.index >= Jeu.index || vus.has(q.index)) return;
			vus.add(q.index);
			out.push({ index: q.index, d: Jeu.paquet[q.index], equipes: equipesUtiles(q.index) });
		});
		return out;
	};
	/** Le plaignant du dossier remercie pour l'intervention : un seul retour par signalement, +1 de réputation par équipe */
	Jeu.retourPlaignant = function (index) {
		const eq = equipesUtiles(index).filter((q) => !q.remercie);
		if (!eq.length) return null;
		eq.forEach((q) => (q.remercie = true));
		const pl = Jeu.plaignantPour ? Jeu.plaignantPour(index) : null;
		const n = Jeu.commentaires.length;
		const auteur = pl && pl.auteur ? pl.auteur : PSEUDOS[n % PSEUDOS.length];
		const texte = T('retour.merci.' + (index % RETOURS_MERCI), { equipe: eq.map((q) => String(q.nom)).join(', '), sujet: eq[0].sujet });
		const delta = DELTA_REPUTATION.equipe * eq.length;
		const c = { heure: maintenantSim(), auteur, texte, delta, index, jour: Jeu.jourIndex, retour: true };
		Jeu.commentaires.push(c);
		Jeu.nonLus.community++;
		Jeu.appliquerDeltas({ reputation: delta });
		return c;
	};
	/** À chaque image (et à la fin de la journée) : retour dès que le joueur a répondu et que toutes les équipes ont fini */
	Jeu.majRetours = function (maintenant) {
		Jeu.signalementsEnAttente().forEach((s) => {
			if (s.equipes.every((q) => q.arrivee_sim !== null && maintenant >= q.finIntervention)) Jeu.retourPlaignant(s.index);
		});
	};
	/** Message du patron au début de chaque journée : effectifs réels (remis à zéro chaque matin) */
	Jeu.annoncerEffectifs = function () {
		if (!Jeu.elementDebloque('equipes') || !Jeu.messagesPatron) return;
		if (Jeu.plateauEquipesVisible) return; // prompt 103 : les effectifs sont sur le plateau de la carte (pas de doublon dans la messagerie)
		const effectifs = {};
		Jeu.TYPES_EQUIPES.forEach((k) => (effectifs[k] = Jeu.effectifJour(k)));
		Jeu.messagePatron(T('patron.effectifs', { liste: Jeu.TYPES_EQUIPES.map((k) => EQUIPES[k].nom + ' ' + REGLAGES.equipes[k].effectif).join(', ') }), 'equipes', { effectifs });
	};
	/** Bilan des équipes de la semaine : envois par type, part pertinente, refus faute d'effectif */
	Jeu.bilanEquipes = function () {
		const utiles = (Jeu.equipes || []).filter((q) => !q.inutile);
		const parType = {};
		Jeu.TYPES_EQUIPES.forEach((k) => (parType[k] = utiles.filter((q) => q.cle === k).length));
		return { parType, total: utiles.length, pertinentes: utiles.filter((q) => q.pertinente !== false).length, refus: Jeu.refusEquipes || 0, inutiles: (Jeu.equipes || []).filter((q) => q.inutile).length };
	};

	// =====================================================================
	// Prompt 23 — profondeur tactique : conseils, modificateurs, objectifs, malus, budget, profil
	// Tout s'appuie sur les incidents, jauges et budget réels de la partie en cours.
	// =====================================================================

	/** § 1 — Conseil contextuel : une phrase, jamais une action recommandée */
	// Prompt 59 : plus affiché depuis le prompt 50 (le joueur enquête lui-même) ; conservé pour la doc jeu/17
	Jeu.conseil = function (d) {
		if (!d) return '';
		if (Jeu.statutPatron && Jeu.statutPatron.niveau) return T('conseil.surveillance', { n: Jeu.pointsPourSortir() }); // prompt 84
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
		Jeu.finJourneeStatut(); // prompt 84 : dernier avertissement ou licenciement, avant le mail du soir
		const o = Jeu.objectifDuJour();
		const atteint = Jeu.jauges[o.jauge] >= o.seuil - (Jeu.allegementObjectif || 0); // prompt 88 : demande « un jour plus calme » accordée
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
		if (palier === 'bas') Jeu.messagePatron(T('patron.budgetBas', { b }), 'budget', { b, palier });
		else if (palier === 'haut') Jeu.messagePatron(T('patron.budgetHaut', { b }), 'budget', { b, palier });
		else if (Jeu.paliersBudget.bas || Jeu.paliersBudget.haut) Jeu.messagePatron(T('patron.budgetMoyen', { b }), 'budget', { b, palier: 'moyen' });
	};

	/** Conseil repris par le patron quand une jauge passe sous 30 (une fois par jauge et par jour) */
	Jeu.verifierConseilsPatron = function () {
		if (!Jeu.messagesPatron) return;
		NOMS_JAUGES.forEach((k) => {
			const cle = 'conseil_' + k;
			if (Jeu.jauges[k] < 30 && !Jeu.alertesJauges[cle]) {
				Jeu.alertesJauges[cle] = true;
				Jeu.messagePatron(T('conseil.basse', { jauge: LIBELLES_JAUGES[k], v: Jeu.jauges[k] }), 'conseil', { jauge: k, v: Jeu.jauges[k], seuil: 30 });
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
	Jeu.profilPartie = () => Jeu.profilGestion((Jeu.historique || []).filter((h) => h.action).map((h) => h.famille || h.action));

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
		const candidates = (Jeu.evenementsJournee || []).filter((e) => e.cleAction && e.cleAction !== 'temps' && (e.famille || e.cleAction) !== 'rien' && jaugeServie(e));
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
	/** Prompt 87 (sans chrono) : à l'heure de fin, les signalements restants du jour passent « non traité » (Q25), sans blâme */
	Jeu.expirerFinJournee = function () {
		let n = 0;
		while (Jeu.prochainDuJour() && n < 200) {
			Jeu.decider('temps');
			n++;
		}
		return n;
	};
	Jeu.appliquerBlame = function () {
		const d = Jeu.depart;
		if (!d || d.applique) return null;
		d.applique = true;
		Jeu.appliquerDeltas({ reputation: Jeu.MALUS_DEPART });
		const texte = T('patron.blame', { date: d.jour ? d.jour.split('-').reverse().join('/') : '', heure: d.heure, fin: d.fin, n: d.laisses, malus: Jeu.MALUS_DEPART });
		Jeu.messagePatron(texte, 'reproche', { blame: true, malus: Jeu.MALUS_DEPART });
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
		plaintes: { jauge: 'reputation', valeur: () => { const b = Jeu.bilanPlaintes(); return b.traitees + '/' + b.total; }, tenu: () => { const b = Jeu.bilanPlaintes(); return b.traitees === b.total; }, sansObjet: () => !Jeu.bilanPlaintes().total, element: 'plaintes' }, // prompt 163 : 0/0 = sans objet, pas de bonus
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
			const sansObjet = !!(d.sansObjet && d.sansObjet()); // prompt 163 : ni tenu ni manqué, aucun bonus
			return { id, jauge: d.jauge, valeur, tenu: !sansObjet && !!d.tenu(valeur), sansObjet, bonus: sansObjet ? 0 : Jeu.BONUS_DEFI };
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
	const FAMILLES = ['renfort', 'devier', 'retenir', 'rien']; // ordre des profils (pompier, stratège, discret, spectateur)
	Jeu.FAMILLES = FAMILLES;
	Jeu.statsSemaine = function () {
		const dec = (Jeu.historique || []).filter((h) => h.action);
		// Prompt 163 : réponses comptées par famille (celle de profilPartie), plus par les clés de l'ancien modèle à
		// 4 actions — les réponses jouées sont « cat.id » depuis le prompt 87, l'ancien compte valait 0 partout
		const parFamille = { renfort: 0, devier: 0, retenir: 0, rien: 0 };
		let expires = 0;
		dec.forEach((h) => {
			if (h.action === 'temps') return expires++;
			const f = h.famille || Jeu.familleDe(h.action);
			parFamille[FAMILLES.includes(f) ? f : 'rien']++;
		});
		const durees = dec.filter((h) => typeof h.dureeMs === 'number');
		return {
			recus: (Jeu.paquet || []).length,
			traites: dec.length - expires,
			expires,
			parFamille,
			tempsMoyen: durees.length ? Math.round(durees.reduce((s, h) => s + h.dureeMs, 0) / durees.length / 100) / 10 : null, // secondes, 1 décimale
			sources: dec.reduce((s, h) => s + (h.sources || 0), 0),
			ralentis: (Jeu.ralenti && Jeu.ralenti.utilises) || 0,
			equipes: Jeu.bilanEquipes(), // prompt 68
			objectifs: (Jeu.objectifsResultats || []).filter((o) => o.atteint).length + '/' + (Jeu.objectifsResultats || []).length,
			jauges: Object.assign({}, Jeu.jauges),
			score: Jeu.score(),
		};
	};
	/** Prompt 163 : un fait de la source pour le mail de fin de semaine — pire retard réel (temps réel), sinon la
	 * première alerte météo, sinon le premier événement de l'agenda ; null si la semaine n'en a aucun. */
	Jeu.faitSourceSemaine = function () {
		const p = (Jeu.paquet || []).filter((d) => !estFictif(d) && !d.consequence);
		const jm = (iso) => String(iso || '').split('-').reverse().join('/');
		const r = p.filter((d) => typeof d.retard === 'number').sort((a, b) => b.retard - a.retard)[0];
		if (r) return T('finSemaine.faitRetard', { min: r.retard, ligne: (r.lignes || []).join(', ') || '—' });
		const m = p.find((d) => d.type === 'alerte météo');
		if (m) return T('finSemaine.faitMeteo', { date: jm(m.date).slice(0, 5), heure: m.heure || '—', nature: String(m.natureAffichee || m.nature || '').split(',')[0].trim() || T('type.alerte météo'), valeur: m.valeur || '' });
		const e = p.find((d) => d.type === 'événement' && nomEvenementDossier(d));
		if (e) return T('finSemaine.faitAgenda', { date: jm(e.date).slice(0, 5), nom: nomEvenementDossier(e) });
		return null;
	};
	/** Mail du patron du dernier soir : félicitations, avertissement ou rappel, avec 2 à 3 vrais chiffres */
	Jeu.mailFinSemaine = function () {
		const s = Jeu.statsSemaine();
		const res = Jeu.defis ? Jeu.resultatsDefis() : [];
		const rates = res.filter((r) => !r.tenu && !r.sansObjet);
		const [ok, total] = s.objectifs.split('/').map(Number);
		const basse = NOMS_JAUGES.slice().sort((a, b) => s.jauges[a] - s.jauges[b])[0];
		const lignes = [T('finSemaine.intro', { score: s.score, traites: s.traites, recus: s.recus })];
		if (total && ok === total) lignes.push(T('finSemaine.bravo', { objectifs: s.objectifs }));
		else lignes.push(T('finSemaine.objectifs', { objectifs: s.objectifs }));
		if (s.jauges[basse] < 40) lignes.push(T('finSemaine.alerte', { jauge: LIBELLES_JAUGES[basse], v: s.jauges[basse] }));
		if (rates.length) lignes.push(T('finSemaine.defisRates', { liste: rates.map((r) => T('defi.' + r.id)).join(', ') }));
		else if (res.length) lignes.push(T('finSemaine.defisTenus'));
		if (s.expires) lignes.push(T('finSemaine.expires', { n: s.expires }));
		const fait = Jeu.faitSourceSemaine();
		if (fait) lignes.push(fait); // prompt 163 : une donnée de la source dans le mail
		return { objet: T(total && ok === total && !rates.length ? 'finSemaine.objetBravo' : 'finSemaine.objet'), lignes };
	};

	global.Jeu = Jeu;
})(typeof window !== 'undefined' ? window : globalThis);
