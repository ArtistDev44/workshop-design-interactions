/* Nantes en régulation — prompt 72 : pour une ALERTE, des réponses rédigées pour la situation.
 * Un incident est une alerte si : alerte météo ; texte de la source avec accident / malaise / blessé / chute ;
 * événement d'agenda (affluence). Les autres gardent les actions 1 / 2 / 3 / 0 seules.
 * Chaque réponse correspond à EXACTEMENT une action existante (dévier, retenir, renfort, rien) ou à un envoi
 * d'équipe existant (police, ambulance, techniciens, pompiers) : aucune règle, aucun effet nouveau (game.js
 * inchangé). Les réponses sont construites sur les champs réels du dossier et la météo du jour ; une valeur
 * absente ne crée aucun choix. Aucun indice de correction (prompts 50 / 66) : l'ordre est mélangé par la
 * graine de la partie (reproductible), sans consommer les tirages de Jeu.alea (dés inchangés).
 * Logique pure (sans p5) : chargée aussi par scripts/test-jeu.mjs.
 */
const Alertes = (() => {
	const MOTS_SECOURS = /accident|malaise|bless|chute/i;
	// Seuils = ceux du contexte météo des règles (game.js, contexte() : pluie ≥ 5 mm, rafales ≥ 50 km/h)
	const SEUIL_PLUIE_MM = 5;
	const SEUIL_RAFALES_KMH = 50;
	const MAX_REPONSES = 3; // + la rangée des actions de base, toujours disponible (touches 1 / 2 / 3 / 0)
	const TOUCHE_ACTION = { devier: '1', retenir: '2', renfort: '3', rien: '0' };

	const nombre = (v) => (v === null || v === undefined || v === '' || isNaN(Number(v)) ? null : Number(v));
	const fmt = (v) => {
		const s = String(Math.round(v * 10) / 10);
		return typeof Langue !== 'undefined' && Langue.actuelle === 'fr' ? s.replace('.', ',') : s;
	};
	/** Nom réel d'un événement d'agenda : le titre avant « — lieu » (jamais traduit) */
	const nomEvenement = (d) => String(d.texte_source || '').split(' — ')[0].trim() || null;

	/** Catégories d'alerte du dossier (vide = pas une alerte) */
	function categories(d) {
		if (!d) return [];
		const c = [];
		if (d.type === 'alerte météo') c.push('meteo');
		if (MOTS_SECOURS.test(String(d.texte_source || '') + ' ' + String(d.nature || ''))) c.push('secours');
		if (d.type === 'événement' || d.affluence) c.push('affluence');
		return c;
	}
	const estAlerte = (d) => categories(d).length > 0;

	/** Valeurs réelles utilisées par les libellés (null si absentes) */
	function valeurs(d) {
		const m = (typeof Jeu !== 'undefined' && Jeu.meteoDuJour ? Jeu.meteoDuJour(d.date) : null) || {};
		let rafales = nombre(m.rafales_max);
		let pluie = nombre(m.pluie_mm);
		// Alerte météo : la valeur relevée par la source prime (ex. « rafales de vent : 50.4 km/h »)
		const lu = String(d.valeur || '').replace(',', '.').match(/-?\d+(\.\d+)?/);
		const v = lu ? nombre(lu[0]) : null;
		if (d.type === 'alerte météo' && v !== null) {
			if (/rafale|vent/i.test(String(d.nature))) rafales = Math.max(rafales || 0, v);
			if (/pluie|précip/i.test(String(d.nature))) pluie = Math.max(pluie || 0, v);
		}
		return { rafales, pluie, evenement: d.type === 'événement' ? nomEvenement(d) : null, ligne: d.lignes && d.lignes.length ? d.lignes.join(', ') : null };
	}

	/** Réponses candidates, dans l'ordre de pertinence (avant mélange) — chacune : { id, cle, vars, cible } */
	function candidates(d) {
		const cats = categories(d);
		const v = valeurs(d);
		const out = [];
		const ajouter = (id, cible, vars) => {
			if (out.some((r) => (r.cible.action && r.cible.action === cible.action) || (r.cible.equipe && r.cible.equipe === cible.equipe))) return; // une réponse par action / équipe
			out.push({ id, cle: 'alerte.reponse.' + id, vars: vars || {}, cible });
		};
		const equipes = typeof Jeu === 'undefined' || !Jeu.elementDebloque || Jeu.elementDebloque('equipes'); // mode histoire : équipes verrouillées → pas de réponse « équipe »
		if (cats.includes('secours')) {
			if (equipes) ajouter('ambulanciers', { equipe: 'ambulance' });
			if (equipes) ajouter('police', { equipe: 'police' });
			ajouter(v.ligne ? 'devierLigne' : 'devierSecteur', { action: 'devier' }, { ligne: v.ligne });
			ajouter('retenirSecours', { action: 'retenir' });
		}
		if (cats.includes('meteo')) {
			if (equipes && v.rafales !== null && v.rafales >= SEUIL_RAFALES_KMH) ajouter('pompiers', { equipe: 'pompiers' }, { rafales: fmt(v.rafales) });
			if (v.pluie !== null && v.pluie >= SEUIL_PLUIE_MM) ajouter('devierPluie', { action: 'devier' }, { pluie: fmt(v.pluie) });
			ajouter('retenirAlerte', { action: 'retenir' });
			ajouter('prevenir', { action: 'rien' });
		}
		if (cats.includes('affluence')) {
			if (equipes) ajouter(v.evenement ? 'policeEvenement' : 'policeAffluence', { equipe: 'police' }, { evenement: v.evenement });
			ajouter('renfort', { action: 'renfort' });
			ajouter('absorber', { action: 'rien' });
		}
		return out;
	}

	/** Hachage déterministe (FNV-1a) : graine de la partie + n° du dossier → mélange reproductible */
	function hacher(s) {
		let h = 0x811c9dc5;
		for (let i = 0; i < s.length; i++) {
			h ^= s.charCodeAt(i);
			h = Math.imul(h, 0x01000193);
		}
		return h >>> 0;
	}
	function melanger(liste, graine) {
		let a = hacher(String(graine)) || 1;
		const alea = () => ((a = (Math.imul(a ^ (a >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0), a / 4294967296);
		const r = liste.slice();
		for (let i = r.length - 1; i > 0; i--) {
			const j = Math.floor(alea() * (i + 1));
			[r[i], r[j]] = [r[j], r[i]];
		}
		return r;
	}

	/**
	 * Réponses proposées pour le dossier d (index n dans le paquet), 2 à MAX_REPONSES, mélangées par la graine.
	 * Au plus MAX_REPONSES − 1 équipes : au moins une réponse décide du dossier (action).
	 */
	function reponses(d, n, graine) {
		if (!estAlerte(d)) return [];
		const c = candidates(d);
		const equipes = c.filter((r) => r.cible.equipe);
		const actions = c.filter((r) => r.cible.action);
		const nbEq = Math.min(equipes.length, MAX_REPONSES - 1);
		const choix = equipes.slice(0, nbEq).concat(actions.slice(0, MAX_REPONSES - nbEq));
		const g = graine === undefined && typeof Jeu !== 'undefined' ? Jeu.graine : graine;
		return melanger(choix, String(g) + '|alerte|' + n + '|' + (d.date || '') + '|' + (d.texte_source || '')).map((r) => Object.assign(r, { touche: r.cible.action ? TOUCHE_ACTION[r.cible.action] : 'Maj+' + (Jeu.TYPES_EQUIPES.indexOf(r.cible.equipe) + 1) }));
	}
	/** Question posée au joueur (clé i18n) selon la première catégorie */
	const question = (d) => 'alerte.question.' + (categories(d)[0] || 'meteo');

	return { categories, estAlerte, reponses, question, valeurs, nomEvenement, TOUCHE_ACTION, SEUIL_PLUIE_MM, SEUIL_RAFALES_KMH, MAX_REPONSES };
})();
if (typeof window !== 'undefined') window.Alertes = Alertes;
