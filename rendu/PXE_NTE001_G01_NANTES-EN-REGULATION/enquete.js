/* Nantes en régulation — prompt 50 : découvrir la situation (enquête par les sources).
 * Un dossier arrive comme un SIGNALEMENT vague. Le joueur révèle les faits réels en consultant quatre
 * sources : lignes (numéro + nom réel ; « carte » jusqu'au prompt 73), info trafic (retard, nature, citation),
 * météo (jour joué), agenda (événements grand public du jour). Chaque consultation dans l'appli coûte 4 s de
 * compteur ; les gestes dans la pièce révèlent aussi : téléphone → agenda, fenêtre → météo.
 * Rien n'est inventé : seule la mise en scène change ; game.js (effets, dés) est inchangé.
 */
// Prompt 77 : une enquête PAR DOSSIER (plusieurs signalements actifs en parallèle) — les sources révélées d'un
// dossier restent révélées quand on passe à un autre puis qu'on y revient. Remis à zéro avec le paquet.
const ENQ = { paquet: null, parDossier: new Map() };
// Prompt 92 : état de la zone « Sources » (défilement, focus clavier, cartes dépliées par dossier)
const ENQ_UI = { defil: 0, vise: 0, defilMax: 0, zone: null, dossier: null, cible: null, focus: -1, items: [], glisse: null };
function enqueteDe(d) {
	if (ENQ.paquet !== Jeu.paquet) {
		ENQ.paquet = Jeu.paquet;
		ENQ.parDossier = new Map();
	}
	if (!d) return { revele: {}, depuis: {} };
	if (!ENQ.parDossier.has(d)) ENQ.parDossier.set(d, { revele: {}, depuis: {}, heure: {}, ouvert: {} });
	return ENQ.parDossier.get(d);
}
const ENQ_COUT_MS = 4000;
const SOURCES_ENQ = [
	{ cle: 'lignes', touche: '5' },
	{ cle: 'trafic', touche: '6' },
	{ cle: 'meteo', touche: '7' },
	{ cle: 'agenda', touche: '8' },
];

function enqueteDossier() {
	return enqueteDe(Jeu.dossierCourant());
}
/** Un dossier est-il connu (lignes affichées) ? Les dossiers déjà traités le sont ; le courant si la source « Lignes » est consultée */
function dossierConnu(i) {
	if (i < Jeu.index) return true;
	const d = (Jeu.paquet || [])[i];
	return !!d && ENQ.parDossier.has(d) && !!ENQ.parDossier.get(d).revele.lignes; // prompt 77 : dossier actif dont la source « Lignes » est consultée
}
const enquetePossible = () => ecran === 'jeu' && (phase === 'decision' || phase === 'contradiction') && !!Jeu.dossierCourant();

/** Révèle une source. payant : consultée depuis l'appli (−4 s de compteur) ; sinon geste dans la pièce */
function revelerSource(cle, payant) {
	if (!enquetePossible()) return false;
	if (payant && Jeu.ralentiActif && Jeu.ralentiActif(millis())) return annoncer(t('ralenti.sourcesSuspendues')), false; // prompt 55
	const e = enqueteDossier();
	if (e.revele[cle]) return false;
	e.revele[cle] = true;
	e.depuis[cle] = millis();
	e.heure = e.heure || {};
	e.heure[cle] = Jeu.horloge ? Jeu.formaterHeure(Jeu.horloge.minutes) : null; // prompt 92 : « consultée à … » (heure de jeu)
	ENQ_UI.cible = cle; // prompt 92 : la vue défile jusqu'à la carte révélée
	if (payant && Jeu.defiChrono) debutCompteur -= typeof coutSourceCafe === 'function' ? coutSourceCafe(ENQ_COUT_MS) : ENQ_COUT_MS; // prompt 52 : gratuit pendant le boost du café
	Confort.Son.clic();
	annoncer(typeof modeleSource === 'function' && typeof TexteUI !== 'undefined' ? annonceSource(modeleSource(cle, Jeu.dossierCourant())) : t('enq.source.' + cle) + ' : ' + texteSource(cle, Jeu.dossierCourant()).join(' ')); // prompt 92 : fait principal + citation complète
	return true;
}

/** Prompt 73 : ligne(s) du dossier avec leur nom réel (data/lignes.js), ex. « 1 (François Mitterrand / Jamet - …) » */
function texteLignesSource(d) {
	return d.lignes
		.map((n) => {
			const ln = Jeu.lignes && Jeu.lignes.lignes.find((x) => x.nom === n);
			return ln && ln.libelle ? n + ' (' + ln.libelle + ')' : n;
		})
		.join(', ');
}
/** Faits réels d'une source pour le dossier d (une ou deux lignes de texte) */
function texteSource(cle, d) {
	if (cle === 'lignes') return [d.lignes && d.lignes.length ? t('enq.lignes.lignes', { lignes: texteLignesSource(d) }) : t('enq.lignes.inconnue')];
	if (cle === 'trafic')
		return [
			(d.retard !== null && d.retard !== undefined ? (Jeu.retardEffectif(d) !== d.retard ? t('dossier.retardEffectif', { reel: d.retard, effectif: Jeu.retardEffectif(d) }) : t('dossier.retard', { retard: d.retard })) : t('dossier.retardInconnu')) + ' · ' + String(d.nature), // prompt 79 : réel → actuellement
			t('dossier.citation', { texte: d.texte_source }) + ' — ' + String(d.source) + (d.heure ? ' · ' + d.heure : ''),
		];
	if (cle === 'meteo') {
		const m = Jeu.meteoDuJour(d.date);
		if (!m) return [t('enq.meteo.inconnue')];
		const n = (v) => (typeof nombreFr === 'function' ? nombreFr(v) : v);
		return [t('enq.meteo', { min: n(m.temp_min), max: n(m.temp_max), pluie: n(m.pluie_mm), vent: n(m.rafales_max) }), t(Jeu.etat.mode === 'direct' ? 'enq.meteo.direct' : 'enq.meteo.archive', { date: dateLongue(m.date || d.date) })];
	}
	if (cle === 'agenda') {
		if (d.type === 'événement') return [t('enq.agenda.evenement', { texte: d.texte_source })];
		const ev = Jeu.evenementsAffluence ? Jeu.evenementsAffluence(d.date) : [];
		if (!ev.length) return [t('enq.agenda.rien', { date: dateLongue(d.date) })];
		return [t('enq.agenda.affluence', { n: ev.length }), ev.slice(0, 2).map((x) => '« ' + String(x.texte_source) + ' »').join(' · ')];
	}
	return [];
}


// =====================================================================
// Prompt 92 : des textes d'enquête lisibles — une CARTE par source révélée (en-tête, fait principal, paires
// clé / valeur, pastilles de ligne, bloc citation avec « Lire tout », provenance), zone défilante, clavier.
// Les textes des sources sont cités tels quels après un simple nettoyage typographique (texte.js).
// =====================================================================
const TAILLES_ENQ = { corps: 22, citation: 21, meta: 18, entete: 16 };
const SEUILS_METEO_ENQ = { pluie: 1, vent: 40 }; // seuils de « mauvais temps » du jeu (Jeu.meteoAggravante)
const PICTOS_ENQ = {
	lignes: ['.#####.', '#.....#', '#######', '#.#.#.#', '#######', '.#...#.', '#.....#'],
	trafic: ['...#...', '..#.#..', '..#.#..', '.#.#.#.', '.#...#.', '#...#.#', '#######'],
	meteo: ['..###..', '.#...#.', '#.....#', '#######', '.#.#.#.', '#.#.#..', '.......'],
	agenda: ['#.#.#.#', '#######', '#.....#', '#.#.#.#', '#.....#', '#.#.#.#', '#######'],
};
const nbEnq = (v) => (typeof nombreFr === 'function' ? nombreFr(v) : String(v));
const minEnq = (v) => nbEnq(v) + '\u00A0min';
const echEnq = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const citeEnq = (s) => nettoyerTexteSource(s, Langue.actuelle);
/** Archive ou direct, avec la date du jour joué (« Archive du 14/09 », « En direct ») */
function tempsSourceEnq(d) {
	return Jeu.etat && Jeu.etat.mode === 'direct' ? t('enq.enDirect') : t('enq.archiveDu', { date: String(d.date || '').split('-').reverse().slice(0, 2).join('/') });
}
/** Modèle d'une source révélée : rien n'est inventé, tout vient du dossier et des données réelles du jour */
function modeleSource(cle, d) {
	const m = { cle, fait: '', faitAlerte: false, paires: [], pastilles: [], citation: null, relief: null, liste: null, puces: null, provenance: '' };
	const pastilles = () =>
		(d.lignes || []).map((n) => {
			const ln = Jeu.lignes && Jeu.lignes.lignes && Jeu.lignes.lignes.find((x) => x.nom === n);
			return { nom: String(n), couleur: ln && ln.couleur ? ln.couleur : null, libelle: ln && ln.libelle ? String(ln.libelle) : null };
		});
	if (cle === 'lignes') {
		const n = (d.lignes || []).length;
		m.fait = n ? t('enq.fait.lignes', { n }) : t('enq.lignes.inconnue');
		m.faitAlerte = !n;
		m.pastilles = pastilles();
		m.provenance = Jeu.lignes && Jeu.lignes.source ? String(Jeu.lignes.source) : t('enq.prov.lignes');
	} else if (cle === 'trafic') {
		const connu = d.retard !== null && d.retard !== undefined;
		const re = connu ? Jeu.retardEffectif(d) : null;
		m.fait = connu ? (re !== d.retard ? t('enq.fait.retardAggrave', { actuel: minEnq(re), initial: minEnq(d.retard) }) : t('enq.fait.retard', { retard: minEnq(d.retard) })) : t('enq.fait.sansRetard', { nature: String(d.nature) });
		m.paires.push([t('enq.cle.nature'), String(d.nature)]);
		if (d.heure) m.paires.push([t('enq.cle.heure'), String(d.heure)]);
		if (connu) m.paires.push([t('enq.retardInitial'), minEnq(d.retard)]);
		if (connu && re !== d.retard) m.paires.push([t('enq.retardActuel'), minEnq(re)]);
		m.pastilles = pastilles();
		m.citation = d.texte_source ? String(d.texte_source) : null;
		// Deux dates différentes dans la citation (prompt 17) : elles sont repérées
		const dates = [...new Set(String(m.citation || '').match(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g) || [])];
		if (dates.length >= 2) m.paires.push([t('enq.cle.dates'), dates.join(' · ')]);
		const motifs = (d.lignes || []).map(echEnq).concat(['[A-Z]{1,2}\\d+', '\\d+(?:[.,/:]\\d+)*']);
		m.relief = new RegExp('(?<![\\p{L}\\d])(?:' + motifs.join('|') + ')(?![\\p{L}\\d])', 'gu');
		m.provenance = String(d.source || t('enq.prov.trafic')) + ' · ' + tempsSourceEnq(d) + (d.heure ? ' · ' + d.heure : '');
	} else if (cle === 'meteo') {
		const w = Jeu.meteoDuJour(d.date);
		if (!w) {
			m.fait = t('enq.meteo.inconnue');
			m.provenance = t('enq.prov.meteo');
		} else {
			m.fait = t('enq.fait.meteo', { pluie: nbEnq(w.pluie_mm), vent: nbEnq(w.rafales_max) });
			m.puces = [
				{ picto: '☀', txt: t('journal.puce.temp', { min: nbEnq(w.temp_min), max: nbEnq(w.temp_max) }), alerte: false },
				{ picto: '☂', txt: t('journal.puce.pluie', { pluie: nbEnq(w.pluie_mm) }), alerte: w.pluie_mm >= SEUILS_METEO_ENQ.pluie },
				{ picto: '≋', txt: t('journal.puce.vent', { vent: nbEnq(w.rafales_max) }), alerte: w.rafales_max >= SEUILS_METEO_ENQ.vent },
			];
			m.provenance = t(Jeu.etat && Jeu.etat.mode === 'direct' ? 'enq.meteo.direct' : 'enq.meteo.archive', { date: dateLongue(w.date || d.date) });
		}
	} else if (cle === 'agenda') {
		if (d.type === 'événement') {
			m.fait = t('enq.fait.evenement');
			m.liste = [TexteUI.decouperAgenda(d.texte_source)];
			m.provenance = String(d.source || t('enq.prov.agenda'));
		} else {
			const ev = Jeu.evenementsAffluence ? Jeu.evenementsAffluence(d.date) : [];
			m.fait = ev.length ? t('enq.agenda.affluence', { n: ev.length }) : t('enq.agenda.rien', { date: dateLongue(d.date) });
			m.liste = ev.length ? ev.map((x) => TexteUI.decouperAgenda(x.texte_source)) : null;
			m.provenance = String((ev[0] && ev[0].source) || t('enq.prov.agenda'));
		}
	}
	return m;
}
/** Texte lu par aria-live : fait principal, détails, citation COMPLÈTE (jamais tronquée), liste, provenance */
function annonceSource(m) {
	const p = [t('enq.source.' + m.cle), m.fait];
	m.paires.forEach(([k, v]) => p.push(k + ' : ' + v));
	m.pastilles.forEach((x) => p.push(t('dossier.ligne', { lignes: x.nom }) + (x.libelle ? ' (' + x.libelle + ')' : '')));
	if (m.citation) p.push(citeEnq(t('dossier.citation', { texte: m.citation })) + (Langue.actuelle !== 'fr' ? ' ' + t('enq.original') : ''));
	(m.puces || []).forEach((x) => p.push((x.alerte ? '⚠ ' : '') + x.txt));
	(m.liste || []).forEach((x) => p.push(citeEnq(x.titre) + (x.lieu ? ', ' + citeEnq(x.lieu) : '')));
	p.push(m.provenance);
	return p.filter(Boolean).join('. ');
}
function pictoEnquete(cle, x, y, s, couleur) {
	noStroke();
	fill(couleur);
	(PICTOS_ENQ[cle] || []).forEach((ligne, r) => [...ligne].forEach((c, k) => c === '#' && rect(x + k * s, y + r * s, s, s)));
}
/** Texte mesuré ou dessiné (même calcul dans les deux passes : la hauteur annoncée est la hauteur dessinée) */
function blocTexteEnq(txt, x, y, l, o, dessiner) {
	return dessiner ? dessinerTexte(txt, x, y, l, o) : TexteUI.hauteurTexte(txt, l, o);
}
/** Couleur du numéro sur la pastille : blanc sur les couleurs sombres, fond du DS sur les claires (contraste) */
function texteSurCouleur(hex) {
	const c = color(hex);
	const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
	const lum = 0.2126 * lin(red(c)) + 0.7152 * lin(green(c)) + 0.0722 * lin(blue(c));
	return lum > 0.18 ? DS.fond : DS.blanc;
}
/** Une carte de source : renvoie { h, deplier } ; dessine si dessiner est vrai */
function carteSource(m, x, y, l, etat, dessiner) {
	const pad = 20;
	const xi = x + pad + 4;
	const li = l - 2 * pad - 4;
	const lc = Math.min(li, 70 * TexteUI.mesurer('0', POLICE_TEXTE, TAILLES_ENQ.corps)); // ~70 caractères par ligne
	const renf = !!Confort.Reglages.contrasteRenforce;
	const meta = { taille: TAILLES_ENQ.meta, couleur: C.gris };
	const visible = (yy, hh) => etat.zoneY === undefined || (yy >= etat.zoneY && yy + hh <= etat.zoneY + etat.zoneH);
	let yy = y + 14;
	let deplier = false;
	// 1. En-tête : pictogramme, nom en capitales, « consultée à HH:MM »
	if (dessiner) {
		pictoEnquete(m.cle, xi, yy + 1, 2, C.texte);
		const hr = etat.heure ? t('enq.consultee', { heure: etat.heure }) : '';
		dessinerTexte(hr, xi + li - 260, yy, 260, { taille: TAILLES_ENQ.entete, couleur: C.gris, align: 'right', maxLignes: 1 });
		textStyle(BOLD);
		dessinerTexte(t('enq.source.' + m.cle).toUpperCase(), xi + 24, yy, li - 24 - 270, { taille: TAILLES_ENQ.entete, couleur: renf ? DS.blanc : DS.blanc75, maxLignes: 1, style: BOLD });
	}
	yy += 34;
	// 2. Fait principal, en blanc plein (orange + symbole s'il signale un manque)
	yy += blocTexteEnq((m.faitAlerte ? '⚠ ' : '') + m.fait, xi, yy, lc, { taille: TAILLES_ENQ.corps, couleur: m.faitAlerte ? C.orange : C.texte, style: BOLD }, dessiner).h + 10;
	// 3. Paires clé / valeur sur deux colonnes
	const kc = Math.min(220, Math.round(li * 0.3));
	m.paires.forEach(([k, v]) => {
		const hk = blocTexteEnq(k, xi, yy + 2, kc - 12, Object.assign({ maxLignes: 2 }, meta), dessiner).h;
		const hv = blocTexteEnq(citeEnq(v), xi + kc, yy, li - kc, { taille: TAILLES_ENQ.corps, couleur: C.texte }, dessiner).h;
		yy += Math.max(hk, hv) + 4;
	});
	// Pastilles de ligne : numéro réel (couleur réelle) et nom réel à côté
	m.pastilles.forEach((p) => {
		textFont(POLICE_TEXTE);
		textSize(TAILLES_ENQ.meta);
		textStyle(BOLD);
		const lp = Math.max(44, Math.ceil(textWidth(p.nom)) + 20);
		textStyle(NORMAL);
		let hl = 32;
		if (p.libelle) hl = Math.max(32, blocTexteEnq(p.libelle, xi + lp + 12, yy + 4, li - lp - 12, Object.assign({ maxLignes: 0 }, meta, { couleur: renf ? DS.blanc : DS.blanc75 }), dessiner).h + 6);
		if (dessiner) {
			noStroke();
			fill(p.couleur || DS.blanc15);
			rect(xi, yy, lp, 32);
			if (!p.couleur || renf) {
				noFill();
				stroke(renf ? DS.blanc50 : DS.blanc15);
				strokeWeight(2);
				rect(xi + 1, yy + 1, lp - 2, 30);
				noStroke();
			}
			dessinerTexte(p.nom, xi, yy + 2, lp, { taille: TAILLES_ENQ.meta, couleur: p.couleur ? texteSurCouleur(p.couleur) : DS.blanc, align: 'center', style: BOLD, interligne: 28, maxLignes: 1 });
		}
		yy += hl + 6;
	});
	// 4. Citation de la source : bloc citation, 4 lignes (6 sur mobile) puis « Lire tout »
	if (m.citation) {
		yy += 6;
		const max = etat.ouvert ? 0 : MOBILE.actif ? 6 : 4;
		const txt = citeEnq(t('dossier.citation', { texte: m.citation }));
		const o = { taille: TAILLES_ENQ.citation, couleur: C.texte, style: ITALIC, maxLignes: max, relief: m.relief, couleurRelief: C.texte };
		const r = blocTexteEnq(txt, xi + 18, yy, lc - 18, o, dessiner);
		if (dessiner) {
			noStroke();
			fill(renf ? DS.blanc50 : DS.blanc15);
			rect(xi, yy, 4, r.h);
		}
		yy += r.h + 6;
		if (Langue.actuelle !== 'fr') yy += blocTexteEnq(t('enq.original'), xi + 18, yy, lc - 18, meta, dessiner).h + 4;
		if (r.tronque || etat.ouvert) {
			deplier = true;
			if (dessiner) {
				const lab = t(etat.ouvert ? 'enq.reduire' : 'enq.lireTout') + (etat.focus ? '  ⏎' : '');
				if (visible(yy, 44)) bouton(xi + 18, yy, 260, 44, lab, () => basculerLireTout(m.cle), false, true);
			}
			yy += 52;
		}
	}
	// Agenda : un item par événement (titre en blanc, « Lieu, Ville » dessous), 3 au plus puis « +n autres »
	if (m.liste) {
		const n = etat.ouvert ? m.liste.length : Math.min(3, m.liste.length);
		let coupe = false;
		m.liste.slice(0, n).forEach((ev) => {
			if (dessiner) dessinerTexte('•', xi, yy, 20, { taille: TAILLES_ENQ.corps, couleur: C.gris });
			const r1 = blocTexteEnq(citeEnq(ev.titre), xi + 24, yy, lc - 24, { taille: TAILLES_ENQ.corps, couleur: C.texte, maxLignes: etat.ouvert ? 0 : 2 }, dessiner);
			coupe = coupe || r1.tronque;
			yy += r1.h;
			if (ev.lieu) {
				const r2 = blocTexteEnq(citeEnq(ev.lieu), xi + 24, yy, lc - 24, { taille: TAILLES_ENQ.meta, couleur: renf ? DS.blanc : DS.blanc75, maxLignes: etat.ouvert ? 0 : 1 }, dessiner);
				coupe = coupe || r2.tronque;
				yy += r2.h;
			}
			yy += 8;
		});
		const reste = m.liste.length - n;
		if (reste > 0 || coupe || etat.ouvert) {
			deplier = true;
			if (dessiner && visible(yy, 44)) bouton(xi, yy, 260, 44, etat.ouvert ? t('enq.reduire') : reste > 0 ? t('enq.autres', { n: reste }) : t('enq.lireTout'), () => basculerLireTout(m.cle), false, true);
			yy += 52;
		}
	}
	// Météo : 3 puces pictogramme + valeur ; dépassement de seuil = symbole ⚠ + gras + orange (pas que la couleur)
	(m.puces || []).forEach((p) => {
		yy += blocTexteEnq((p.alerte ? '⚠ ' : p.picto + ' ') + p.txt, xi, yy, lc, { taille: TAILLES_ENQ.corps, couleur: p.alerte ? C.orange : C.texte, style: p.alerte ? BOLD : NORMAL }, dessiner).h + 4;
	});
	// 5. Provenance, en petit
	yy += 6;
	yy += blocTexteEnq(m.provenance, xi, yy, li, meta, dessiner).h;
	yy += 16;
	const h = yy - y;
	if (dessiner) {
		// Fond blanc 5 %, bordure blanc 15 % (50 % en contraste renforcé), liseré à gauche ; focus en double bordure
		noFill();
		stroke(renf ? DS.blanc50 : DS.blanc15);
		strokeWeight(2);
		rect(x + 1, y + 1, l - 2, h - 2);
		noStroke();
		fill(C.accent);
		rect(x, y, 4, h);
		if (etat.focus) {
			noFill();
			stroke(C.texte);
			strokeWeight(3);
			rect(x - 4, y - 4, l + 8, h + 8);
			noStroke();
		}
	}
	return { h, deplier };
}
function fondCarteEnq(x, y, l, h) {
	noStroke();
	fill(DS.blanc05);
	rect(x, y, l, h);
}
/** Bouton d'une source non consultée : touche, nom, et ce qu'elle va révéler */
function boutonSourceEnq(s, x, y, l, h, actif, focus) {
	if (actif) bouton(x, y, l, h, '', () => revelerSource(s.cle, true), !enquetePossible(), true);
	else {
		noFill();
		stroke(DS.blanc);
		strokeWeight(2);
		rect(x + 1, y + 1, l - 2, h - 2);
		noStroke();
	}
	textStyle(BOLD);
	dessinerTexte(s.touche + '  ' + t('enq.source.' + s.cle), x + 20, y + 8, l - 40, { taille: 20, couleur: C.texte, maxLignes: 1, style: BOLD, interligne: 28 });
	dessinerTexte(t('enq.revele.' + s.cle) + (Jeu.defiChrono ? ' · ' + t('enq.cout') : ''), x + 20, y + 40, l - 40, { taille: TAILLES_ENQ.meta, couleur: C.gris, maxLignes: 1, interligne: 26 });
	if (focus) {
		noFill();
		stroke(C.texte);
		strokeWeight(3);
		rect(x - 4, y - 4, l + 8, h + 8);
		noStroke();
	}
}
function basculerLireTout(cle) {
	const e = enqueteDossier();
	e.ouvert = e.ouvert || {};
	e.ouvert[cle] = !e.ouvert[cle];
	Confort.Son.clic();
	const d = Jeu.dossierCourant();
	if (e.ouvert[cle] && d) annoncer(t('enq.annonceOuvert', { source: t('enq.source.' + cle) }) + ' ' + annonceSource(modeleSource(cle, d)));
	else annoncer(t('enq.annonceReduit', { source: t('enq.source.' + cle) }));
}

/** Prompt 87 : volet « En savoir plus » du panneau — onglets Sources / Historique de la ligne / Équipes et leur contenu,
 * dans la zone (x, y0, l, h). Hors défi chrono, consulter une source ne coûte plus de temps.
 * Prompt 92 : cartes à la hauteur de leur contenu, révélées d'abord (ordre de consultation), zone défilante. */
function corpsEnquete(d, x, y0, l, h) {
	const e = enqueteDossier();
	dessinerOngletsIncident(x, y0, l);
	y0 += 56;
	h -= 56;
	ENQ_UI.vu = frameCount;
	if (SELECTION.onglet === 'historique') return (ENQ_UI.zone = null), dessinerHistoriqueLigne(d, x, y0, l, h);
	if (SELECTION.onglet === 'equipes') return (ENQ_UI.zone = null), dessinerEquipesIncident(d, x, y0, l, h);
	if (ENQ_UI.dossier !== d) Object.assign(ENQ_UI, { dossier: d, defil: 0, vise: 0, focus: -1 });
	const lc = l - 20; // place de la barre de défilement
	const items = [];
	let yy = 0;
	SOURCES_ENQ.filter((s) => e.revele[s.cle])
		.sort((a, b) => e.depuis[a.cle] - e.depuis[b.cle])
		.forEach((s) => {
			const m = modeleSource(s.cle, d);
			const r = carteSource(m, 0, 0, lc, { ouvert: !!(e.ouvert && e.ouvert[s.cle]) }, false);
			items.push({ s, cle: s.cle, revele: true, m, y: yy, h: r.h, deplier: r.deplier });
			yy += r.h + 12;
		});
	const hb = MOBILE.actif ? 80 : 72;
	SOURCES_ENQ.filter((s) => !e.revele[s.cle]).forEach((s) => {
		items.push({ s, cle: s.cle, revele: false, y: yy, h: hb });
		yy += hb + 10;
	});
	ENQ_UI.items = items;
	ENQ_UI.zone = { x, y: y0, l, h };
	ENQ_UI.defilMax = Math.max(0, yy - 10 - h);
	if (ENQ_UI.cible) {
		const it = items.find((i) => i.cle === ENQ_UI.cible);
		if (it) ENQ_UI.vise = it.y;
		ENQ_UI.cible = null;
	}
	ENQ_UI.vise = constrain(ENQ_UI.vise, 0, ENQ_UI.defilMax);
	ENQ_UI.defil = reduireAnimations || Math.abs(ENQ_UI.vise - ENQ_UI.defil) < 1 ? ENQ_UI.vise : ENQ_UI.defil + (ENQ_UI.vise - ENQ_UI.defil) * 0.25;
	const ctx = drawingContext;
	ctx.save();
	ctx.beginPath();
	ctx.rect(x - 8, y0, l + 16, h);
	ctx.clip();
	items.forEach((it, i) => {
		const yc = Math.round(y0 + it.y - ENQ_UI.defil);
		if (yc > y0 + h || yc + it.h < y0) return;
		const entier = yc >= y0 - 1 && yc + it.h <= y0 + h + 1;
		if (!it.revele) return boutonSourceEnq(it.s, x, yc, lc, it.h, entier, i === ENQ_UI.focus);
		const a = reduireAnimations ? 1 : constrain((millis() - e.depuis[it.cle]) / 300, 0, 1); // fondu 300 ms + glissé 6 px
		ctx.globalAlpha = a;
		const yg = yc + Math.round((1 - a) * 6);
		fondCarteEnq(x, yg, lc, it.h);
		carteSource(it.m, x, yg, lc, { ouvert: !!(e.ouvert && e.ouvert[it.cle]), heure: e.heure && e.heure[it.cle], focus: i === ENQ_UI.focus, zoneY: y0, zoneH: h }, true);
		ctx.globalAlpha = 1;
	});
	ctx.restore();
	// Barre de défilement DS
	if (ENQ_UI.defilMax > 0) {
		noStroke();
		fill(DS.blanc15);
		rect(x + l - 8, y0, 8, h);
		const hp = Math.max(40, (h * h) / (h + ENQ_UI.defilMax));
		fill(Confort.Reglages.contrasteRenforce ? DS.blanc : DS.blanc50);
		rect(x + l - 8, y0 + (h - hp) * (ENQ_UI.defil / ENQ_UI.defilMax), 8, hp);
	}
	textAlign(LEFT, TOP);
	textStyle(NORMAL);
	cibleGuide('sources', x, y0, l, h); // prompt 37 / 50
}

/** Zone « Sources » affichée à l'écran (cette image ou la précédente) */
function zoneSourcesActive() {
	return !!ENQ_UI.zone && frameCount - (ENQ_UI.vu || 0) <= 2 && PLUS.ouvert && SELECTION.onglet === 'enquete' && enquetePossible() && vue === 'poste';
}
const dansZoneSources = (mx, my) => zoneSourcesActive() && mx >= ENQ_UI.zone.x && mx <= ENQ_UI.zone.x + ENQ_UI.zone.l && my >= ENQ_UI.zone.y && my <= ENQ_UI.zone.y + ENQ_UI.zone.h;
/** Molette sur la zone des sources : défilement */
function molletteEnquete(delta) {
	if (!dansZoneSources(mouseX, mouseY) || ENQ_UI.defilMax <= 0) return false;
	ENQ_UI.vise = constrain(ENQ_UI.vise + delta, 0, ENQ_UI.defilMax);
	return true;
}
/** Glisser (souris ou doigt) dans la zone : le contenu suit le geste */
function glisserEnquete(dy) {
	if (ENQ_UI.defilMax <= 0) return false;
	ENQ_UI.vise = ENQ_UI.defil = constrain(ENQ_UI.vise - dy, 0, ENQ_UI.defilMax);
	return true;
}
function mouseDragged() {
	if (dansZoneSources(pmouseX, pmouseY)) glisserEnquete(mouseY - pmouseY);
}
/** Clavier, « En savoir plus » ouvert sur Sources : Tab parcourt les cartes, Entrée ouvre / ferme « Lire tout »
 * (ou révèle une source non consultée), ↑ ↓ font défiler. true si la touche est prise. */
function toucheSourcesEnquete() {
	if (!zoneSourcesActive() || !ENQ_UI.items.length) return false;
	if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
		ENQ_UI.vise = constrain(ENQ_UI.vise + (keyCode === UP_ARROW ? -90 : 90), 0, ENQ_UI.defilMax);
		return true;
	}
	if (keyCode === TAB) {
		const f = ENQ_UI.focus + (keyIsDown(SHIFT) ? -1 : 1);
		if (f < 0 || f >= ENQ_UI.items.length) return (ENQ_UI.focus = -1), false; // au-delà : Tab reprend son rôle habituel
		ENQ_UI.focus = f;
		const it = ENQ_UI.items[f];
		if (it.y < ENQ_UI.vise) ENQ_UI.vise = it.y;
		else if (it.y + it.h > ENQ_UI.vise + ENQ_UI.zone.h) ENQ_UI.vise = Math.min(it.y, it.y + it.h - ENQ_UI.zone.h);
		ENQ_UI.vise = constrain(ENQ_UI.vise, 0, ENQ_UI.defilMax);
		annoncer(it.revele ? annonceSource(it.m) + (it.deplier ? ' ' + t('enq.annonceDeplier') : '') : it.s.touche + ' ' + t('enq.source.' + it.cle) + ' — ' + t('enq.revele.' + it.cle));
		return true;
	}
	if ((keyCode === ENTER || keyCode === RETURN) && ENQ_UI.focus >= 0) {
		const it = ENQ_UI.items[ENQ_UI.focus];
		if (!it) return false;
		if (!it.revele) revelerSource(it.cle, true);
		else if (it.deplier) basculerLireTout(it.cle);
		return true;
	}
	return false;
}

/** Clavier (phase décision ou contradiction) : 5 à 8 consultent une source */
function toucheEnquete() {
	const s = SOURCES_ENQ.find((x) => x.touche === key);
	if (!s || !enquetePossible() || vue !== 'poste') return false;
	revelerSource(s.cle, true);
	return true;
}
