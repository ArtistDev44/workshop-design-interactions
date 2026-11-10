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

	global.Jeu = Jeu;
})(typeof window !== 'undefined' ? window : globalThis);
