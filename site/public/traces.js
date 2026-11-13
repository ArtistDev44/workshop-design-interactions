/* Nantes en régulation — prompt 89 bis : le geste, la pression et l'interface comme narration.
 * Logique pure (Traces, chargée par les tests) ; le rendu de la file « traités » a été retiré avec la file (prompt 199).
 * Tout vient du journal réel de la partie (Jeu.evenementsJournee) et des dossiers réels ; aucune valeur d'effet
 * n'est modifiée : on MONTRE l'état du monde (traces, retard qui grimpe, temps écoulé, calcul Q25, dé), jamais
 * l'effet prévu d'une réponse.
 * Options du groupe (§ 6, non cochées → désactivées par défaut, Paramètres → Options de jeu) :
 *   deVisible (dé dans le retour), eclairageJauges (lumière de la pièce liée aux jauges). Les options traceDossier et
 *   pressionVisible, que plus aucun code ne lisait, ont été retirées au prompt 199.
 */
const Traces = (() => {
	const NOMS = ['fluidite', 'reputation', 'budget'];
	const option = (nom) => typeof Confort !== 'undefined' && !!(Confort.Reglages && Confort.Reglages[nom]);
	const minutesDe = (hhmm) => {
		const m = /^(\d{1,2})[:h](\d{2})/.exec(String(hhmm || ''));
		return m ? Number(m[1]) * 60 + Number(m[2]) : null;
	};
	const heure = (e) => {
		const m = minutesDe(e.heure);
		return m === null ? '—' : Jeu.formaterHeure(m);
	};
	const jaugeTitre = (k) => t('jaugeTitre.' + k);
	const signe = (v) => (v > 0 ? '+' + v : v < 0 ? '−' + Math.abs(v) : '0');

	/** Q25 expliqué : conséquences naturelles d'un dossier non traité, calculées sur ses données réelles */
	function calculQ25(e) {
		const d = e.resultat && e.resultat.dossier;
		if (!d) return null;
		const effets = NOMS.map((k) => [k, e.deltas[k] || 0]).filter(([, v]) => v);
		const liste = effets.map(([k, v]) => jaugeTitre(k) + ' ' + signe(v)).join(', ') || t('narr.aucunEffet');
		if (d.type === 'ligne en difficulté') return t('q25.retard', { retard: e.retardEffectif !== null && e.retardEffectif !== undefined ? e.retardEffectif : d.retard, effets: liste });
		return t('q25.' + ({ perturbation: 'perturbation', 'alerte météo': 'meteo', événement: 'evenement' }[d.type] || 'autre'), { effets: liste });
	}
	/** Dé visible (option) : le 1d6 réellement tiré, jauge par jauge, et l'effet final appliqué */
	function texteDes(r) {
		if (!r || !r.des || !r.des.some((x) => x)) return null;
		const parts = NOMS.map((k, i) => (r.des[i] ? t('trace.de', { jauge: jaugeTitre(k), de: r.des[i], effet: signe(r.deltas[i]) }) : null)).filter(Boolean);
		return parts.length ? t('trace.des', { liste: parts.join(' · ') }) : null;
	}
	/** Trace de la décision (retour expliqué) : heure, réponse, retard retenu au moment du choix */
	function trace(r) {
		const e = (Jeu.evenementsJournee || []).find((x) => x.resultat === r);
		if (!e) return null;
		if (e.cleAction === 'temps') return t('trace.nonTraite', { heure: heure(e), sujet: e.ligne ? t('dossier.ligne', { lignes: e.ligne }) : String(e.externeCourt || '') }) + ' ' + calculQ25(e);
		return t('trace.retour', { heure: heure(e), reponse: String(e.action) }) + (e.retardEffectif !== null && e.retardEffectif !== undefined ? ' ' + t('trace.retardFige', { retard: e.retardEffectif }) : '');
	}
	/** Éclairage lié aux jauges (option) : −0,06 de lumière par jauge sous 40 (seuil d'alerte orange), sans flash */
	const baisseLumiere = () => (option('eclairageJauges') && Jeu.jauges ? 0.06 * NOMS.filter((k) => Jeu.jauges[k] < 40).length : 0);
	return { option, calculQ25, texteDes, trace, baisseLumiere, minutesDe };
})();
if (typeof window !== 'undefined') window.Traces = Traces;

/** Après une décision : la trace est annoncée (aria-live) */
function tracerDecision(r) {
	const tr = Traces.trace(r);
	if (tr) annoncer(tr);
}
