/* Nantes en régulation — prompt 74 : moins de répétition, une journée qui « vit ».
 * Logique pure (sans p5), chargée aussi par scripts/test-jeu.mjs. game.js est inchangé : rien ici ne touche aux
 * règles, aux effets ni aux dés (aucun appel à Jeu.alea). Toute variété est tirée d'un hachage de la graine de la
 * partie (reproductible) et chaque texte est construit sur une donnée réelle (dossier, météo du jour, agenda) ou
 * un calcul sur la partie ; une donnée absente → l'option n'est pas proposée.
 *  - melangerArrivees : les créneaux d'arrivée des dossiers SANS heure réelle (créneaux réguliers de la partie,
 *    pas un fait) sont redistribués entre eux par la graine ; à minute égale, l'ordre est mélangé aussi.
 *    La sauvegarde garde le paquet (minutes comprises) : l'ordre de la journée en cours est figé à la reprise.
 *  - liaison : court texte entre deux dossiers (météo du jour, agenda du jour, radio d'un chauffeur).
 *  - rythme : à 10 h, 12 h et 17 h, un événement de rythme calculé (agenda, météo, heure de pointe) avec son effet
 *    déjà prévu par les règles (contexte × 1,25, Q24).
 *  - contexteNarration : une phrase de contexte réelle après chaque décision.
 *  - serie : 2 bonnes évaluations d'affilée → félicitations ; 2 ratées → encouragement (aucun effet sur les jauges).
 *  - bilanVeille : 1–2 lignes chiffrées sur la journée précédente.
 */
const Rythme = (() => {
	const HEURES = { 10: 'agenda', 12: 'meteo', 17: 'pointe' }; // heures de jeu des événements de rythme
	const VARIANTES = { liaisonRadio: 2, serieBravo: 3, serieCourage: 3 };

	function hacher(s) {
		let h = 0x811c9dc5;
		for (let i = 0; i < s.length; i++) {
			h ^= s.charCodeAt(i);
			h = Math.imul(h, 0x01000193);
		}
		return h >>> 0;
	}
	const choix = (cle, n) => hacher(String(Jeu.graine) + '|' + cle) % n;
	function melanger(liste, cle) {
		let a = hacher(String(Jeu.graine) + '|' + cle) || 1;
		const alea = () => ((a = (Math.imul(a ^ (a >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0), a / 4294967296);
		const r = liste.slice();
		for (let i = r.length - 1; i > 0; i--) {
			const j = Math.floor(alea() * (i + 1));
			[r[i], r[j]] = [r[j], r[i]];
		}
		return r;
	}
	const nombre = (v) => (typeof Langue !== 'undefined' && Langue.actuelle === 'fr' ? String(v).replace('.', ',') : String(v));

	/** À appeler juste après Jeu.nouvellePartie() (index 0) : ordre d'arrivée varié, reproductible par la graine */
	function melangerArrivees() {
		if (!Jeu.jours || Jeu.index !== 0 || Jeu.etat.mode === 'direct') return false;
		Jeu.jours.forEach((j) => {
			const sans = j.dossiers.filter((d) => !d.heure);
			const creneaux = sans.map((d) => d.minute).sort((a, b) => a - b);
			melanger(sans, 'arrivees|' + j.date).forEach((d, i) => (d.minute = creneaux[i]));
			// Tri par minute, et à minute égale ordre tiré par la graine
			const rang = new Map(melanger(j.dossiers, 'egalite|' + j.date).map((d, i) => [d, i]));
			j.dossiers.sort((a, b) => a.minute - b.minute || rang.get(a) - rang.get(b));
		});
		Jeu.paquet = Jeu.jours.flatMap((j) => j.dossiers);
		Jeu.etat.dossiers = Jeu.paquet;
		Jeu.terminee = Jeu.paquet.length === 0;
		return true;
	}

	/** Événements d'agenda réels du jour (noms jamais traduits) */
	const agendaDuJour = (date) => (Jeu.evenementsAffluence ? Jeu.evenementsAffluence(date) : []);
	const nomEvenement = (e) => String(e.texte_source || '').split(' — ')[0].trim();

	/** Texte de liaison après le dossier n (déjà traité) : { cle, vars } ou null ; « eviter » : clé de la liaison
	 * précédente, écartée s'il y a un autre choix (pas deux fois le même texte d'affilée) */
	function liaison(n, eviter) {
		const d = (Jeu.paquet || [])[n];
		if (!d) return null;
		const opts = [];
		const m = Jeu.meteoDuJour ? Jeu.meteoDuJour(d.date) : null;
		if (m && m.temp_max !== null && m.temp_max !== undefined) opts.push({ cle: 'liaison.meteo', vars: { min: nombre(m.temp_min), max: nombre(m.temp_max), pluie: nombre(m.pluie_mm), vent: nombre(m.rafales_max) } });
		const ev = agendaDuJour(d.date);
		if (ev.length) opts.push({ cle: 'liaison.agenda', vars: { nom: nomEvenement(ev[choix('liaison-ev|' + n, ev.length)]), n: ev.length } });
		if (d.lignes && d.lignes.length) {
			const v = choix('liaison-radio|' + n, VARIANTES.liaisonRadio);
			const avecRetard = d.retard !== null && d.retard !== undefined;
			opts.push(avecRetard ? { cle: 'liaison.radioRetard.' + v, vars: { ligne: d.lignes[0], retard: d.retard } } : { cle: 'liaison.radio.' + v, vars: { ligne: d.lignes[0] } });
		}
		const j = Jeu.jours ? Jeu.jours.find((x) => x.date === d.date) : null;
		if (j) {
			const reste = j.dossiers.filter((x) => Jeu.paquet.indexOf(x) > n).length; // calcul sur la partie
			opts.push({ cle: reste ? 'liaison.restants' : 'liaison.dernier', vars: { n: reste } });
		}
		const ok = opts.length > 1 && eviter ? opts.filter((o) => o.cle !== eviter) : opts;
		return ok.length ? ok[choix('liaison|' + n, ok.length)] : null;
	}

	/** Événement de rythme de l'heure h (si c'est une heure de rythme) pour la journée en cours : { cle, vars } */
	function rythme(h) {
		const type = HEURES[h];
		const j = Jeu.jourCourant ? Jeu.jourCourant() : null;
		if (!type || !j) return null;
		const coef = nombre(Jeu.REGLAGES.coefContexte);
		if (type === 'agenda') {
			const ev = agendaDuJour(j.date);
			return ev.length ? { cle: 'rythme.agenda', vars: { n: ev.length, nom: nomEvenement(ev[0]), coef } } : { cle: 'rythme.agendaVide', vars: {} };
		}
		if (type === 'meteo') {
			const m = Jeu.meteoDuJour ? Jeu.meteoDuJour(j.date) : null;
			if (!m) return { cle: 'rythme.meteoInconnue', vars: {} };
			// Mêmes seuils que le contexte météo des règles (game.js : pluie ≥ 5 mm ou rafales ≥ 50 km/h)
			const degradee = (m.pluie_mm || 0) >= 5 || (m.rafales_max || 0) >= 50;
			return { cle: degradee ? 'rythme.meteoDegradee' : 'rythme.meteoCalme', vars: { pluie: nombre(m.pluie_mm), vent: nombre(m.rafales_max), coef } };
		}
		return { cle: 'rythme.pointe', vars: { coef } }; // Q24 : heure de pointe 7 h – 9 h et 17 h – 19 h
	}

	/** Phrase de contexte réelle ajoutée à la narration du résultat r (dossier n) */
	function contexteNarration(r, n) {
		const d = r && r.dossier;
		if (!d) return null;
		const opts = [];
		const m = Jeu.meteoDuJour ? Jeu.meteoDuJour(d.date) : null;
		if (m) opts.push({ cle: 'narrCtx.meteo', vars: { max: nombre(m.temp_max), pluie: nombre(m.pluie_mm), vent: nombre(m.rafales_max) } });
		if (r.minuteSim !== null && r.minuteSim !== undefined) {
			const h = Math.floor(r.minuteSim / 60);
			opts.push({ cle: (h >= 7 && h < 9) || (h >= 17 && h < 19) ? 'narrCtx.pointe' : 'narrCtx.heure', vars: { heure: Jeu.formaterHeure(r.minuteSim) } });
		}
		if (d.lignes && d.lignes.length) {
			const ln = Jeu.lignes && Jeu.lignes.lignes.find((x) => x.nom === d.lignes[0]);
			if (ln && ln.libelle) opts.push({ cle: 'narrCtx.ligne', vars: { ligne: ln.nom, libelle: ln.libelle } });
		}
		const ev = agendaDuJour(d.date);
		if (ev.length) opts.push({ cle: 'narrCtx.agenda', vars: { nom: nomEvenement(ev[choix('ctx-ev|' + n, ev.length)]) } });
		return opts.length ? opts[choix('ctx|' + n, opts.length)] : null;
	}

	/** Série : après une décision, 'bravo' si les 2 dernières évaluations sont bonnes, 'courage' si ratées (sinon null).
	 * La série repart à zéro après chaque message (pas de répétition à chaque dossier). */
	function serie(evenements, deja) {
		const ev = (evenements || []).slice(deja || 0);
		if (ev.length < 2) return null;
		const [a, b] = ev.slice(-2).map((e) => Jeu.evaluer(e));
		if (a === 'bon' && b === 'bon') return { sorte: 'bravo', cle: 'serie.bravo.' + choix('bravo|' + evenements.length, VARIANTES.serieBravo) };
		const rate = (x) => x === 'rate' || x === 'trop_tard';
		if (rate(a) && rate(b)) return { sorte: 'courage', cle: 'serie.courage.' + choix('courage|' + evenements.length, VARIANTES.serieCourage) };
		return null;
	}

	/** Bilan de la veille (journée jourIndex − 1) : { cle, vars } ou null le premier jour */
	function bilanVeille() {
		const j = Jeu.jours && Jeu.jours[Jeu.jourIndex - 1];
		if (!j) return null;
		const ev = (Jeu.evenementsJournee || []).filter((e) => e.jour === j.date);
		const bons = ev.filter((e) => Jeu.evaluer(e) === 'bon').length;
		const obj = (Jeu.objectifsResultats || []).find((o) => o.jourIndex === Jeu.jourIndex - 1);
		return { cle: obj ? (obj.atteint ? 'veille.objAtteint' : 'veille.objRate') : 'veille.sansObj', vars: { n: ev.length, bons, obj: obj ? String(obj.libelle) : '' } };
	}

	return { HEURES, melangerArrivees, liaison, rythme, contexteNarration, serie, bilanVeille, VARIANTES };
})();
if (typeof window !== 'undefined') window.Rythme = Rythme;
