/* Nantes en régulation — prompt 78 : la somnolence devient la mécanique du temps, la sieste devient centrale.
 * - Jauge de SOMNOLENCE (0 → 100) dans le bandeau d'état : elle monte avec le temps de jeu et l'inactivité.
 *   Valeurs verrouillées dans Jeu.REGLAGES.somnolence (ajoutées ici : game.js n'est pas modifié). C'est un
 *   affichage et un déclencheur, pas une règle de score.
 * - Se reposer (clic sur la jauge, ou Z) : sieste VOLONTAIRE — les paupières se ferment (prompt 65), le temps de
 *   jeu file ×100 (comme l'attente, prompt 77) et la somnolence redescend. À 100 : sieste FORCÉE.
 * - Pendant la sieste, les signalements continuent d'arriver et leurs compteurs tournent ; ceux qui expirent
 *   sont réglés « non traité » (Q25, malus du prompt 23) PLUS le malus fixe de sieste existant (Jeu.malusSieste,
 *   −5) : on a répondu trop tard. Un signalement de gravité élevée déclenche le réveil d'urgence existant.
 * - Réveil : « Se réveiller » (Espace, Entrée, Z, clic) ou la main à la webcam (prompt 67) ; bilan de la sieste
 *   (temps de jeu passé, signalements arrivés, expirés, variation des jauges).
 * - L'ancien déclenchement après 20 s d'inactivité est supprimé : la sieste tombe quand la jauge est pleine.
 */
Jeu.REGLAGES.somnolence = {
	parHeureJeu: 4.5, // +4,5 par heure de jeu (journée 8 h → 20 h : +54)
	parSecondeInactif: 0.5, // +0,5 par seconde réelle sans geste, au-delà du délai
	delaiInactifMs: 8000,
	recuperationParSeconde: 12, // −12 par seconde réelle de sieste (environ 8 s pour revenir de 100 à 0)
	cafe: 30, // la tasse (prompt 52) retire 30
	forcee: 100, // sieste forcée
};
const SOMNO = { v: 0, jourCle: '', forcee: false, bilan: null, alarmes: new Set() };

const cleJourSomno = () => (Jeu.etat && Jeu.etat.semaine ? Jeu.etat.semaine.lundi : Jeu.etat ? Jeu.etat.mode : '') + '|' + Jeu.jourIndex;
/** Peut-on s'endormir maintenant ? (journée de travail, pas de fenêtre ni de narration) */
function peutDormir() {
	return ecran === 'jeu' && !!Jeu.horloge && !MENU.actif && !fenetre && !smsActif && !tutoriel && !TRANSITION_JOUR && !['fin', 'mail', 'soir', 'reveil', 'narration'].includes(phase);
}
/** Appelée par avancerTemps (temps non suspendu) : dt réel (ms), minutes de jeu écoulées */
function majSomnolence(dt, dMinutes) {
	const R = Jeu.REGLAGES.somnolence;
	const cle = cleJourSomno();
	if (SOMNO.jourCle !== cle) {
		SOMNO.jourCle = cle; // chaque matin, on arrive reposé
		if (!enSieste) SOMNO.v = 0;
	}
	if (enSieste) SOMNO.v = Math.max(0, SOMNO.v - (dt / 1000) * R.recuperationParSeconde);
	else {
		const inactif = millis() - inactifDepuis > R.delaiInactifMs ? (dt / 1000) * R.parSecondeInactif : 0;
		const k = Confort.Reglages && Confort.Reglages.somnolenceNecessaire ? 2 : 1; // prompt 91 § 5 (option) : la fatigue monte deux fois plus vite — dormir chaque jour devient inévitable
		SOMNO.v = Math.min(R.forcee, SOMNO.v + (dMinutes / 60) * R.parHeureJeu * k + inactif);
		if (SOMNO.v >= R.forcee && peutDormir()) dormir(false);
	}
}
/** S'endormir : volontaire (jauge, Z, main à la webcam) ou forcée (jauge à 100) */
function dormir(volontaire) {
	if (enSieste || !peutDormir()) {
		if (volontaire) annoncer(t('sieste.impossible'));
		return false;
	}
	if (typeof sauverActif === 'function') sauverActif(); // les signalements actifs continuent en arrière-plan
	if (phase === 'selection' || PHASES_ACTIVES.includes(phase)) phase = 'attente'; // le temps file ×100
	enSieste = true;
	debutSieste = millis();
	SOMNO.forcee = !volontaire;
	SOMNO.alarmes = new Set();
	SOMNO.bilan = { arrives: 0, expires: 0, minutes: Jeu.horloge.minutes, jauges: Object.assign({}, Jeu.jauges) };
	if (vue === 'poste') seLever(); // on se cale dans le fauteuil : retour à la vue bureau
	Confort.Son.bip('choix');
	annoncer(t(volontaire ? 'sieste.volontaire' : 'sieste.forcee'));
	return true;
}
/** Se réveiller : bilan de la sieste, puis reprise (signalement actif le plus urgent, ou la liste) */
function reveiller() {
	if (!enSieste) return;
	enSieste = false;
	reveil = null;
	SOMNO.forcee = false;
	interaction();
	const b = SOMNO.bilan;
	SOMNO.bilan = null;
	if (b) {
		const delta = Jeu.NOMS_JAUGES.map((k) => Jeu.jauges[k] - b.jauges[k]);
		const m = { cle: 'sieste.bilan', vars: { duree: dureeJeu(Jeu.horloge.minutes - b.minutes), arrives: b.arrives, expires: b.expires, delta: delta.map((v, i) => t('jaugeTitre.' + Jeu.NOMS_JAUGES[i]) + ' ' + (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v)).join(', ') } };
		if (typeof ajouterFil === 'function') ajouterFil(m, b.expires ? 'courage' : 'rythme');
		if (typeof notifier === 'function') notifier({ titre: t('sieste.bilanTitre'), extrait: t(m.cle, m.vars), icone: 'signalements', action: () => ouvrirSignalements() });
	}
	// Prompt 91 § 5 : la sieste n'est pas du temps perdu — les équipes en route sont arrivées, et le prochain signalement est annoncé
	const maintenant = millis();
	(Jeu.equipes || []).forEach((q) => {
		if (!q.inutile && q.arrivee > maintenant) {
			const decal = q.arrivee - maintenant;
			q.arrivee -= decal;
			q.finIntervention -= decal;
			q.libre -= decal;
		}
	});
	const prochain = Jeu.prochainDuJour ? Jeu.prochainDuJour() : null;
	if (prochain && prochain.minute > Jeu.horloge.minutes) {
		const txt = t('sieste.prevision', { type: t('enq.signalement.' + prochain.type), heure: Jeu.formaterHeure(prochain.minute) });
		if (typeof ajouterFil === 'function') ajouterFil({ cle: 'sieste.prevision', vars: { type: t('enq.signalement.' + prochain.type), heure: Jeu.formaterHeure(prochain.minute) } }, 'rythme');
		annoncer(txt);
	}
	if (phase === 'attente' && !(typeof reprendreActif === 'function' && reprendreActif()) && fileIncidents().length) entrerSelection();
}
/** Prompt 91 § 5 (option) : au-delà du seuil 70, la fatigue se paie — aggravation des retards ×1,5, équipes plus lentes */
function majSeuilSomnolence() {
	Jeu.somnolenceElevee = !!(Confort.Reglages && Confort.Reglages.somnolenceNecessaire) && SOMNO.v >= 70;
}
const dureeJeu = (min) => {
	const m = Math.max(0, Math.round(min));
	return Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0');
};
function basculerSieste() {
	if (enSieste) return phase === 'reveil' ? seReveiller() : reveiller();
	dormir(true);
}
/** Un signalement arrive pendant la sieste : seul un signalement de gravité élevée déclenche le réveil d'urgence */
function signalementUrgentPendantSieste() {
	const it = fileIncidents().find((x) => !SOMNO.alarmes.has(x.d) && Jeu.gravite(x.d) === 'elevee' && !(typeof actifDe === 'function' && actifDe(x.d)));
	if (it) SOMNO.alarmes.add(it.d);
	return it ? it.d : null;
}
/** Comptes du bilan (appelés par multitache.js) */
function siesteArrivee() {
	if (enSieste && SOMNO.bilan) SOMNO.bilan.arrives++;
}
function siesteExpiration(r) {
	if (!enSieste || !r) return;
	Jeu.malusSieste(r); // malus fixe existant (−5 sur la jauge concernée) : réponse trop tard
	if (SOMNO.bilan) SOMNO.bilan.expires++;
}

// ——— Jauge dans le bandeau d'état (texte + barre, cliquable, infobulle) ———
const ZONE_SOMNO = { x: 1556, y: H - 40, l: 340, h: 36 };
function dessinerSomnolence() {
	if (ecran !== 'jeu' || phase === 'fin') return;
	const z = ZONE_SOMNO;
	const v = Math.round(SOMNO.v);
	const survol = mouseX >= z.x && mouseX <= z.x + z.l && mouseY >= z.y && mouseY <= z.y + z.h;
	noStroke();
	fill(survol ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)');
	rect(z.x, z.y, z.l, z.h);
	fill(C.piste);
	rect(z.x + 8, z.y + z.h - 10, z.l - 16, 5);
	fill(v >= 80 ? C.rougeFonce : v >= 50 ? C.orange : '#3860FF');
	rect(z.x + 8, z.y + z.h - 10, ((z.l - 16) * v) / 100, 5);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(16);
	textAlign(LEFT, TOP);
	fill('#FFFFFF');
	text(t(Confort.Reglages.somnolenceNecessaire ? 'sieste.jaugeSeuil' : 'sieste.jauge', { v }) + (Confort.Reglages.somnolenceNecessaire && v >= 70 ? ' ⚠' : ''), z.x + 10, z.y + 4); // prompt 80 : un seul libellé ; prompt 91 : seuil 70 en texte
	textStyle(NORMAL);
	textAlign(LEFT, TOP);
	boutons.push({ x: z.x, y: z.y, l: z.l, h: z.h, action: basculerSieste });
	cibleGuide('somnolence', z.x, z.y, z.l, z.h);
	if (survol) {
		// Ligne d'aide : à quoi sert la jauge (clic ou Z : se reposer), et le compromis de la sieste
		const l = 620;
		textFont(POLICE_DONNEES);
		textSize(17);
		textLeading(23);
		const n = Math.ceil((textWidth(t('sieste.aide')) * 1.08) / (l - 28));
		const h = n * 23 + 22;
		fill(13, 12, 12, 240);
		rect(z.x + z.l - l, z.y - h - 8, l, h);
		fill('#FFFFFF');
		text(t('sieste.aide'), z.x + z.l - l + 14, z.y - h + 3, l - 28, h - 6);
	}
}
