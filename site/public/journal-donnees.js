/* Nantes en régulation — prompt 89 : données de l'appli Journal (logique pure, sans p5, chargée par les tests).
 * Tout est recalculé à partir de l'état de la partie (Jeu.evenementsJournee, dossiers réels, Jeu.equipes,
 * Jeu.plaintes, jauges, carnet, Jeu.taches) : rien n'est stocké en double, rien n'est inventé ; absent → null
 * (l'affichage dit « non renseigné »). Pas de cache (prompt 59, 12/11 : cache déclaré mais jamais appelé, retiré).
 */
const JournalDonnees = (() => {
	const JAUGES = ['fluidite', 'reputation', 'budget'];
	const jours = () => Jeu.jours || [];
	const evDuJour = (date) => (Jeu.evenementsJournee || []).filter((e) => e.jour === date);
	const indexDossier = (e) => (e.resultat && e.resultat.dossier ? Jeu.paquet.indexOf(e.resultat.dossier) : -1);
	const dateDossier = (i) => (Jeu.paquet && Jeu.paquet[i] ? Jeu.paquet[i].date : null);
	const minutes = (hhmm) => {
		const m = /^(\d{1,2})[:h](\d{2})/.exec(String(hhmm || ''));
		return m ? Number(m[1]) * 60 + Number(m[2]) : null;
	};

	/** Jauges au début de la journée : relevé du matin (prompt 89), sinon déduit du premier événement réel */
	function debutJour(date) {
		const r = (Jeu.jaugesDebutJour || {})[date];
		if (r) return Object.assign({}, r);
		const e = evDuJour(date)[0];
		if (e && e.resultat && e.resultat.jaugesApres) {
			const o = {};
			JAUGES.forEach((k) => (o[k] = e.resultat.jaugesApres[k] - (e.deltas[k] || 0)));
			return o;
		}
		return null;
	}
	/** Jauges en fin de journée : début du lendemain (effets du soir compris), sinon jauges actuelles (jour en cours) */
	function finJour(i) {
		const suiv = jours()[i + 1];
		const r = suiv && (Jeu.jaugesDebutJour || {})[suiv.date];
		if (r && i < Jeu.jourIndex) return Object.assign({}, r);
		if (i === Jeu.jourIndex) return Object.assign({}, Jeu.jauges);
		const ev = evDuJour(jours()[i].date);
		const der = ev[ev.length - 1];
		return der && der.resultat && der.resultat.jaugesApres ? Object.assign({}, der.resultat.jaugesApres) : null;
	}
	/** Mini-courbes : un point au début, puis un point par événement réel (valeurs après l'événement) — sans interpolation */
	function courbes(date) {
		const pts = [];
		const d0 = debutJour(date);
		if (d0) pts.push(d0);
		evDuJour(date).forEach((e) => e.resultat && e.resultat.jaugesApres && pts.push(Object.assign({}, e.resultat.jaugesApres)));
		return pts;
	}

	// ——— Tuiles (§ 2) ———
	function tuiles(i) {
		const j = jours()[i];
		if (!j) return null;
		const ev = evDuJour(j.date);
		const recus = i < Jeu.jourIndex ? j.dossiers.length : j.dossiers.filter((d) => Jeu.paquet.indexOf(d) < Jeu.index || (Jeu.horloge && d.minute <= Jeu.horloge.minutes)).length;
		const nonTraites = ev.filter((e) => e.cleAction === 'temps').length;
		const bons = ev.filter((e) => Jeu.evaluer(e) === 'bon').length;
		const pts = courbes(j.date);
		const fin = pts.length ? pts[pts.length - 1] : null;
		const ecart = {};
		if (pts.length) JAUGES.forEach((k) => (ecart[k] = fin[k] - pts[0][k]));
		const obj = (Jeu.objectifsResultats || []).find((o) => o.jourIndex === i);
		const objCourant = i === Jeu.jourIndex && Jeu.objectifDuJour ? Jeu.objectifDuJour() : null;
		const eq = (Jeu.equipes || []).filter((q) => q.jour === j.date);
		const parType = {};
		eq.forEach((q) => (parType[q.cle] = (parType[q.cle] || 0) + 1));
		const tj = Jeu.taches && Jeu.taches.jours && Jeu.taches.jours[j.date];
		const S = Jeu.statutPatron || { dates: [] };
		return {
			date: j.date,
			signalements: { traites: ev.length - nonTraites, recus: Math.max(recus, ev.length), nonTraites },
			bonnes: { n: bons, total: ev.length },
			jauges: { points: pts, fin, ecart },
			objectif: obj ? { libelle: String(obj.libelle), atteint: obj.atteint, effet: obj.effet ? String(obj.effet) : null, enCours: false } : objCourant ? { libelle: String(objCourant.libelle), atteint: null, effet: null, enCours: true } : null,
			equipes: { total: eq.length, parType, inutiles: eq.filter((q) => q.inutile).length },
			theme: typeof Taches !== 'undefined' && Jeu.taches ? Taches.theme(j.date) : null,
			fait: tj && tj.rapport ? String(tj.rapport.fait) : null,
			xp: tj && tj.recap && tj.recap.xp ? tj.recap.xp.total : null,
			avertissements: (S.dates || []).filter((d) => String(d).split('|')[1] === j.date).length,
		};
	}
	/** État de la pastille d'un jour : 'succes' (objectif tenu), 'erreur' (raté), 'courant', 'futur' */
	function etatJour(i) {
		if (i > Jeu.jourIndex) return 'futur';
		const o = (Jeu.objectifsResultats || []).find((x) => x.jourIndex === i);
		if (o) return o.atteint ? 'succes' : 'erreur';
		return 'courant';
	}

	// ——— Frise (§ 3) : cartes classées par heure, regroupées par dossier ———
	function cartes(i) {
		const j = jours()[i];
		if (!j) return [];
		const ev = evDuJour(j.date);
		const out = [];
		const vus = { equipes: new Set(), plaintes: new Set() };
		const eqDe = (idx) => (Jeu.equipes || []).filter((q) => q.index === idx);
		const plDe = (idx) => (Jeu.plaintes || []).filter((p) => p.index === idx);
		ev.forEach((e) => {
			const idx = indexDossier(e);
			const groupe = [];
			eqDe(idx).forEach((q) => (vus.equipes.add(q), groupe.push({ sorte: 'equipe', q })));
			plDe(idx).forEach((p) => (vus.plaintes.add(p), groupe.push({ sorte: 'plainte', p })));
			out.push({ sorte: 'signalement', e, idx, heure: e.heure, minute: minutes(e.heure), eval: Jeu.evaluer(e), groupe });
		});
		(Jeu.equipes || []).filter((q) => q.jour === j.date && !vus.equipes.has(q)).forEach((q) => out.push({ sorte: 'equipe', q, heure: q.heure, minute: minutes(q.heure), groupe: [] }));
		(Jeu.plaintes || []).filter((p) => !vus.plaintes.has(p) && dateDossier(p.index) === j.date).forEach((p) => out.push({ sorte: 'plainte', p, heure: p.heure, minute: minutes(p.heure), groupe: [] }));
		(Jeu.messagesPatron || []).filter((m) => m.jour === j.date && m.type === 'alerte' && m.meta && (m.meta.niveau !== undefined || m.meta.score !== undefined)).forEach((m) => out.push({ sorte: 'patron', m, heure: m.heure, minute: minutes(m.heure), groupe: [] }));
		const c = typeof Taches !== 'undefined' && Jeu.taches ? Taches.crise(j.date) : null;
		if (c) out.push({ sorte: 'crise', c, heure: '16:30', minute: Taches.R.crise.debut, groupe: [] });
		out.sort((a, b) => (a.minute === null ? 9999 : a.minute) - (b.minute === null ? 9999 : b.minute));
		// La note du carnet de bord (prompt 47 : une note pour la semaine) ferme la frise
		out.push({ sorte: 'note', texte: String(Jeu.carnet || '').trim(), heure: null, minute: null, groupe: [] });
		return out;
	}
	const FILTRES = ['tout', 'rates', 'equipes', 'plaintes', 'notes'];
	const garde = (filtre) => (c) => {
		if (filtre === 'tout') return true;
		if (filtre === 'rates') return c.sorte === 'signalement' && (c.eval === 'rate' || c.eval === 'trop_tard');
		if (filtre === 'equipes') return c.sorte === 'equipe' || (c.sorte === 'signalement' && c.groupe.some((g) => g.sorte === 'equipe'));
		if (filtre === 'plaintes') return c.sorte === 'plainte' || (c.sorte === 'signalement' && c.groupe.some((g) => g.sorte === 'plainte'));
		if (filtre === 'notes') return c.sorte === 'note';
		return true;
	};
	function filtrer(liste, filtre) {
		return liste.filter(garde(filtre));
	}
	function compteurs(i) {
		const l = cartes(i);
		const o = {};
		FILTRES.forEach((f) => {
			if (f === 'equipes') o[f] = l.reduce((a, c) => a + (c.sorte === 'equipe' ? 1 : c.groupe.filter((g) => g.sorte === 'equipe').length), 0);
			else if (f === 'plaintes') o[f] = l.reduce((a, c) => a + (c.sorte === 'plainte' ? 1 : c.groupe.filter((g) => g.sorte === 'plainte').length), 0);
			else if (f === 'notes') o[f] = l.filter((c) => c.sorte === 'note' && c.texte).length;
			else o[f] = filtrer(l, f).filter((c) => c.sorte !== 'note' || c.texte).length;
		});
		return o;
	}

	// ——— Vue semaine (§ 4) ———
	function semaine() {
		const cols = jours()
			.map((j, i) => ({ i, j }))
			.filter((x) => x.i <= Jeu.jourIndex)
			.map(({ i, j }) => {
				const tu = tuiles(i);
				return { i, date: j.date, theme: tu.theme, signalements: tu.signalements.recus, bons: tu.bonnes.n, total: tu.bonnes.total, objectif: tu.objectif, fin: finJour(i) };
			});
		const pts = cols.filter((c) => c.fin).map((c) => ({ date: c.date, f: c.fin.fluidite, r: c.fin.reputation, b: c.fin.budget, score: c.fin.fluidite + c.fin.reputation + c.fin.budget }));
		const b = Jeu.bilan ? Jeu.bilan() : { decisionsCles: [] };
		return { colonnes: cols, courbe: pts, seuils: [150, 240], decisionsCles: (b.decisionsCles || []).map((d) => ({ qualite: d.qualite, titre: String(d.titre), action: String(d.action), deltas: d.deltas })), carnet: (Jeu.taches && Jeu.taches.carnet) || [] };
	}

	// ——— Enquête (§ 5) ———
	function enquete(e) {
		const r = e.resultat;
		const d = r.dossier;
		const idx = Jeu.paquet.indexOf(d);
		const m = Jeu.meteoDuJour ? Jeu.meteoDuJour(d.date) : null;
		const ctx = r.contexte || {};
		const ag = Jeu.evenementsAffluence ? Jeu.evenementsAffluence(d.date) : [];
		const barres = Object.keys(e.attendus || {}).map((k) => ({ cle: k, lib: String(Jeu.libelleAction(k)), v: Math.round(e.attendus[k] * 10) / 10, choix: k === e.cleAction, meilleure: k === e.cleMeilleure }));
		const max = Math.max(1, ...barres.map((x) => Math.abs(x.v)));
		const p = (Jeu.plaintes || []).filter((x) => x.index === idx);
		return {
			idx,
			eval: Jeu.evaluer(e),
			faits: { type: d.type, nature: d.nature || null, lignes: d.lignes && d.lignes.length ? d.lignes.join(', ') : null, retard: d.retard === null || d.retard === undefined ? null : d.retard, citation: d.texte_source || null, source: d.source || null, date: d.date, heure: d.heure || null, consequence: d.consequence || null },
			contexte: { meteo: m ? { min: m.temp_min, max: m.temp_max, pluie: m.pluie_mm, vent: m.rafales_max } : null, pointe: !!ctx.pointe, meteoAggravante: !!ctx.meteo, agenda: ag.map((x) => String(x.texte_source).split(' — ')[0]), modificateur: r.modificateur || null },
			decision: { action: e.action ? String(e.action) : null, deltas: Object.assign({}, e.deltas), des: (r.des || []).filter((x) => x), barres, echelle: Math.ceil(max), meilleure: String(e.meilleureAction) },
			suites: { plaintes: p.map((x) => ({ auteur: x.auteur, texte: Jeu.texteMessage(x.def.texte, x.vars), reponse: x.reponse === null ? null : Jeu.texteMessage(x.def.reponses[x.reponse].texte, x.vars), bonne: !!x.bonne, suivis: (x.suivis || []).length, recus: (x.suivis || []).filter((s) => s.livre).length })), equipes: (Jeu.equipes || []).filter((q) => q.index === idx).map((q) => ({ nom: String(q.nom), inutile: !!q.inutile, pertinente: q.pertinente !== false, duree: q.finIntervention ? Math.round((q.finIntervention - q.arrivee) / 1000) : null })) },
		};
	}

	// ——— Résumé texte du jour (§ 6, « Copier le résumé du jour ») ———
	function resume(i) {
		const tu = tuiles(i);
		if (!tu) return '';
		const date = tu.date.split('-').reverse().join('/');
		const l = [t('journal.resume.titre', { date })];
		l.push(t('journal.resume.signalements', { traites: tu.signalements.traites, recus: tu.signalements.recus, non: tu.signalements.nonTraites }));
		l.push(t('journal.resume.bonnes', { n: tu.bonnes.n, total: tu.bonnes.total }));
		if (tu.jauges.fin) l.push(t('journal.resume.jauges', { f: tu.jauges.fin.fluidite, r: tu.jauges.fin.reputation, b: tu.jauges.fin.budget }));
		if (tu.objectif) l.push(t('journal.resume.objectif', { libelle: tu.objectif.libelle, etat: t(tu.objectif.enCours ? 'journal.enCours' : tu.objectif.atteint ? 'journal.atteint' : 'journal.rate') }));
		evDuJour(tu.date).forEach((e) => l.push('- ' + String(Jeu.ligneMail(e))));
		return l.join('\n');
	}

	return { JAUGES, FILTRES, debutJour, finJour, courbes, tuiles, etatJour, cartes, filtrer, compteurs, semaine, enquete, resume, minutes };
})();
if (typeof window !== 'undefined') window.JournalDonnees = JournalDonnees;
