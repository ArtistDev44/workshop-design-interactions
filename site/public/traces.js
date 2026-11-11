/* Nantes en régulation — prompt 89 bis : le geste, la pression et l'interface comme narration.
 * Logique pure (Traces, chargée par les tests) + rendu de la partie « traités » de la file (carte.js).
 * Tout vient du journal réel de la partie (Jeu.evenementsJournee) et des dossiers réels ; aucune valeur d'effet
 * n'est modifiée : on MONTRE l'état du monde (traces, retard qui grimpe, temps écoulé, calcul Q25, dé), jamais
 * l'effet prévu d'une réponse.
 * Options du groupe (§ 6, non cochées → désactivées par défaut, Paramètres → Options de jeu) :
 *   traceDossier (trace dans le dossier), pressionVisible (couleur + temps écoulé), deVisible (dé dans le retour),
 *   eclairageJauges (lumière de la pièce liée aux jauges).
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
	/** Lignes « traitées » de la journée (la file devient le journal visuel) : la plus récente en tête */
	function lignesFile(date) {
		const fin = Jeu.horloge && Jeu.finJournee ? Jeu.horloge.minutes >= Jeu.finJournee() : false;
		return (Jeu.evenementsJournee || [])
			.filter((e) => e.jour === date)
			.map((e) => {
				const d = e.resultat.dossier;
				const sujet = e.ligne ? t('dossier.ligne', { lignes: e.ligne }) : String(e.externeCourt || '');
				if (e.cleAction === 'temps') return { e, etat: 'nonTraite', titre: t(fin ? 'trace.nonTraiteFin' : 'trace.nonTraite', { heure: heure(e), sujet }), detail: calculQ25(e), d };
				return { e, etat: 'traite', titre: t('trace.traite', { heure: heure(e), reponse: String(e.action), sujet }), detail: e.retardEffectif !== null && e.retardEffectif !== undefined ? t('trace.retardRetenu', { retard: e.retardEffectif }) : null, d };
			})
			.reverse();
	}
	/** Mémoire du dossier : décisions déjà prises aujourd'hui sur la (les) même(s) ligne(s) */
	function memoire(d) {
		if (!d || !(d.lignes && d.lignes.length)) return [];
		return (Jeu.evenementsJournee || [])
			.filter((e) => e.jour === d.date && e.ligne && String(e.ligne).split(', ').some((l) => d.lignes.includes(l)) && e.resultat.dossier !== d)
			.map((e) => (e.cleAction === 'temps' ? t('trace.memoireNon', { heure: heure(e), ligne: e.ligne }) : t('trace.memoire', { heure: heure(e), ligne: e.ligne, reponse: String(e.action) })));
	}
	/** Pression lisible (option) : retard effectif, réel, gravité doublée d'un texte, temps écoulé depuis l'arrivée */
	function pression(d) {
		if (!d || !Jeu.horloge) return null;
		const re = Jeu.retardEffectif(d);
		const ecoule = Math.max(0, Math.floor(Jeu.horloge.minutes - d.minute));
		return { retard: re, reel: d.retard === undefined ? null : d.retard, gravite: Jeu.gravite(d), ecoule, ecouleTexte: ecoule >= 60 ? t('trace.ecouleH', { h: Math.floor(ecoule / 60), m: String(ecoule % 60).padStart(2, '0') }) : t('trace.ecouleMin', { m: ecoule }) };
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
	return { option, calculQ25, lignesFile, memoire, pression, texteDes, trace, baisseLumiere, minutesDe };
})();
if (typeof window !== 'undefined') window.Traces = Traces;

// ——— Rendu : la file comme journal visuel (sous les signalements en attente) ———
const TRACE = { derniere: 0 };
function dessinerTracesFile(z, y0) {
	const j = Jeu.jourCourant && Jeu.jourCourant();
	if (!j) return;
	const lignes = Traces.lignesFile(j.date);
	if (!lignes.length) return;
	const bas = z.y + z.h - 80;
	if (y0 + 60 > bas) return;
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(15);
	fill(C.gris);
	text(t('trace.titre').toUpperCase(), z.x + 20, y0);
	let y = y0 + 26;
	lignes.forEach((l, i) => {
		const h = l.detail ? 62 : 40;
		if (y + h > bas) return;
		const recent = i === 0 && millis() - TRACE.derniere < 3000; // la ligne concernée reste en évidence le temps de la décision
		noStroke();
		fill(l.etat === 'nonTraite' ? 'rgba(255,193,56,0.10)' : 'rgba(255,255,255,0.04)');
		rect(z.x + 16, y, z.l - 32, h);
		fill(l.etat === 'nonTraite' ? C.orange : C.gris);
		rect(z.x + 16, y, 4, h);
		if (recent) {
			noFill();
			stroke(C.texte);
			strokeWeight(2);
			rect(z.x + 16, y, z.l - 32, h);
			noStroke();
		}
		textFont(POLICE_TEXTE);
		textSize(17);
		fill(l.etat === 'nonTraite' ? C.texte : C.gris);
		text((l.etat === 'nonTraite' ? '✗ ' : '✓ ') + l.titre, z.x + 30, y + 9, z.l - 60, 24);
		if (l.detail) {
			textFont(POLICE_DONNEES);
			textSize(14);
			fill(C.gris);
			text(l.detail, z.x + 30, y + 36, z.l - 60, 22);
		}
		y += h + 6;
	});
}
/** Après une décision : la trace arrive dans la file (aria-live), la ligne est mise en évidence */
function tracerDecision(r) {
	TRACE.derniere = millis();
	const tr = Traces.trace(r);
	if (tr) annoncer(tr);
}
