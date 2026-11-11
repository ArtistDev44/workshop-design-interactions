/* Nantes en régulation — prompt 50 : découvrir la situation (enquête par les sources).
 * Un dossier arrive comme un SIGNALEMENT vague. Le joueur révèle les faits réels en consultant quatre
 * sources : carte (lignes), info trafic (retard, nature, citation), météo (jour joué), agenda (événements
 * grand public du jour). Chaque consultation dans l'appli coûte 4 s de compteur ; les gestes dans la pièce
 * révèlent aussi : téléphone → agenda, fenêtre → météo, appli Carte de RégulOS → carte.
 * Rien n'est inventé : seule la mise en scène change ; game.js (effets, dés) est inchangé.
 */
const ENQ = { dossier: -1, revele: {}, depuis: {} };
const ENQ_COUT_MS = 4000;
const SOURCES_ENQ = [
	{ cle: 'carte', touche: '5' },
	{ cle: 'trafic', touche: '6' },
	{ cle: 'meteo', touche: '7' },
	{ cle: 'agenda', touche: '8' },
];

function enqueteDossier() {
	if (ENQ.dossier !== Jeu.index) {
		ENQ.dossier = Jeu.index;
		ENQ.revele = {};
		ENQ.depuis = {};
	}
	return ENQ;
}
/** Un dossier est-il connu (carte, liste des lignes) ? Les dossiers déjà traités le sont ; le courant si la carte est consultée */
function dossierConnu(i) {
	if (i < Jeu.index) return true;
	return i === Jeu.index && !!enqueteDossier().revele.carte;
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
	if (payant) debutCompteur -= typeof coutSourceCafe === 'function' ? coutSourceCafe(ENQ_COUT_MS) : ENQ_COUT_MS; // prompt 52 : gratuit pendant le boost du café
	Confort.Son.clic();
	annoncer(t('enq.source.' + cle) + ' : ' + texteSource(cle, Jeu.dossierCourant()).join(' '));
	return true;
}

/** Faits réels d'une source pour le dossier d (une ou deux lignes de texte) */
function texteSource(cle, d) {
	if (cle === 'carte') return [d.lignes && d.lignes.length ? t('enq.carte.lignes', { lignes: d.lignes.join(', ') }) : t('enq.carte.inconnue')];
	if (cle === 'trafic')
		return [
			(d.retard !== null && d.retard !== undefined ? t('dossier.retard', { retard: d.retard }) : t('dossier.retardInconnu')) + ' · ' + String(d.nature),
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

/** Corps du panneau dossier (sous l'en-tête) : titre du signalement et les quatre sources */
function dessinerEnquete(d, x, base) {
	const e = enqueteDossier();
	const l = base.l - 64;
	noStroke();
	textAlign(LEFT, TOP);
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	const titre = e.revele.carte && d.lignes && d.lignes.length ? t('dossier.ligne', { lignes: d.lignes.join(', ') }) : t('enq.signalement.' + d.type);
	ajusterTaille(titre, l - 200, 38, 22); // place laissée au tampon « SIGNALEMENT » (prompt 53)
	text(titre, x + 32, base.y + 78);
	if (!e.revele.carte || !(d.lignes && d.lignes.length)) dessinerTamponSignalement(x + base.l - 116, base.y + 104);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(17);
	textLeading(24);
	// Prompt 72 : une alerte pose sa question (réponses rédigées en bas du panneau)
	const alerte = phase === 'decision' && typeof reponsesAlerte === 'function' && reponsesAlerte().length > 0;
	fill(alerte ? C.orange : C.gris);
	if (alerte) textStyle(BOLD);
	text(alerte ? t(Alertes.question(d)) + ' ' + t('alerte.consigne') : t('enq.consigne'), x + 32, base.y + 126, alerte ? l - 150 : l, 54); // l'alerte laisse la place au tampon
	textStyle(NORMAL);
	// Prompt 68 : onglets Enquête / Historique de la ligne / Équipes
	dessinerOngletsIncident(x + 32, base.y + 182, l);
	const y0 = base.y + 238;
	const bas = phase === 'contradiction' ? 270 : alerte ? hauteurReponsesAlerte() + 40 : 214; // les actions (ou la question de la contradiction, ou les réponses d'alerte et leur message) restent en bas
	if (SELECTION.onglet === 'historique') return dessinerHistoriqueLigne(d, x + 32, y0, l, base.h - bas - (y0 - base.y));
	if (SELECTION.onglet === 'equipes') return dessinerEquipesIncident(d, x + 32, y0, l);
	const hRang = (base.h - bas - (y0 - base.y)) / SOURCES_ENQ.length;
	SOURCES_ENQ.forEach((s, i) => {
		const ry = y0 + i * hRang;
		const rh = hRang - 10;
		if (!e.revele[s.cle]) {
			bouton(x + 32, ry, l, Math.min(rh, 64), s.touche + '  ' + t('enq.source.' + s.cle) + ' — ' + t('enq.consulter'), () => revelerSource(s.cle, true), !enquetePossible(), true);
			return;
		}
		const a = reduireAnimations ? 1 : constrain((millis() - e.depuis[s.cle]) / 300, 0, 1);
		fill(255, 255, 255, 13);
		rect(x + 32, ry, l, rh);
		fill(C.accent);
		rect(x + 32, ry, 4, rh);
		textFont(POLICE_DONNEES);
		textSize(15);
		fill(C.gris);
		text(t('enq.source.' + s.cle).toUpperCase(), x + 48, ry + 6);
		// Faits sur deux ou trois lignes : la première en blanc, la suite (citation, source) en gris
		const lignes = texteSource(s.cle, d);
		textFont(POLICE_TEXTE);
		textSize(19);
		textLeading(24);
		fill(255, 255, 255, 255 * a);
		const n1 = Math.min(2, Math.ceil((textWidth(lignes[0]) * 1.05) / (l - 32)));
		text(lignes[0], x + 48, ry + 26, l - 32, n1 * 24 + 4);
		if (lignes[1] && rh - 30 - n1 * 24 >= 24) {
			fill(255, 255, 255, 190 * a);
			text(lignes[1], x + 48, ry + 26 + n1 * 24, l - 32, rh - 30 - n1 * 24);
		}
	});
	cibleGuide('sources', x + 32, y0, l, hRang * SOURCES_ENQ.length); // prompt 37 / 50
}

/** Clavier (phase décision ou contradiction) : 5 à 8 consultent une source */
function toucheEnquete() {
	const s = SOURCES_ENQ.find((x) => x.touche === key);
	if (!s || !enquetePossible() || vue !== 'poste') return false;
	revelerSource(s.cle, true);
	return true;
}
