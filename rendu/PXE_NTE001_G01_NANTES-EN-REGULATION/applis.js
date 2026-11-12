/* Nantes en régulation — prompt 91 : applis reliées et déblocage par semaine.
 * § 2 (option du groupe, désactivée par défaut : Paramètres → Options de jeu) : semaine 1 = Signalements seule ;
 *     Community (et la Corbeille) en semaine 2, Messages en 3, Journal et Indicateurs en 4, Données en 5. Icônes
 *     verrouillées grisées avec cadenas, secousse et infobulle (prompt 183 : plus de fenêtre d'intro au déblocage).
 * § 3 : pile de navigation — chaque redirection (« Voir le dossier », « Publier sur Community », lien vers le Journal)
 *     empile l'écran d'origine ; Échap dépile et revient à l'écran précédent.
 */
const PLANNING_APPLIS = { signalements: 1, community: 2, corbeille: 2, patron: 3, journal: 4, indicateurs: 4, donnees: 5 };
const APPLIS = { tremble: null, pile: [] };

/** Numéro de semaine du déblocage : chapitre du mode histoire (1 à 3) ; temps réel / hors ligne → 4, ou tout si l'option l'autorise */
function semaineApplis() {
	const ch = typeof chapitreCourant === 'function' ? chapitreCourant() : 0;
	if (ch) return ch;
	return Confort.Reglages.toutDebloque ? 99 : 4;
}
function appliDebloquee(cle) {
	if (!Confort.Reglages.deblocageApplis) return true; // § 7 non tranché : désactivé par défaut
	if (Confort.Reglages.toutDebloque && (Jeu.defiChrono || (Jeu.etat && Jeu.etat.mode === 'direct'))) return true;
	return semaineApplis() >= (PLANNING_APPLIS[cle] || 1);
}
/** Refus d'ouvrir une appli verrouillée : secousse (sauf animations réduites) + infobulle + annonce */
function refuserAppliVerrouillee(cle) {
	APPLIS.tremble = { cle, t: millis() };
	Confort.Son.bip('alerte');
	annoncer(t('applis.verrou', { appli: t('app.' + cle), n: PLANNING_APPLIS[cle] || 1 }));
}
const decalTremble = (cle) => (APPLIS.tremble && APPLIS.tremble.cle === cle && millis() - APPLIS.tremble.t < 350 && !reduireAnimations ? Math.round(Math.sin((millis() - APPLIS.tremble.t) / 25) * 6) : 0);
/** Voile gris + cadenas pixel sur une icône verrouillée ; infobulle pendant la secousse */
function voileVerrou(cle, x, y, l, h) {
	if (appliDebloquee(cle)) return;
	noStroke();
	fill(13, 12, 12, 170);
	rect(x, y, l, h);
	const s = Math.max(2, Math.round(Math.min(l, h) / 22));
	const cx = x + l / 2 - 3.5 * s;
	const cy = y + h / 2 - 4 * s;
	fill(DS.blanc);
	['..###..', '.#...#.', '.#...#.', '#######', '###.###', '###.###', '#######'].forEach((ligne, r) => [...ligne].forEach((c, k) => c === '#' && rect(cx + k * s, cy + r * s, s, s)));
	if (APPLIS.tremble && APPLIS.tremble.cle === cle && millis() - APPLIS.tremble.t < 2500) APPLIS.bulle = { txt: t('applis.disponible', { n: PLANNING_APPLIS[cle] || 1 }), x, y: y - 48 };
}
/** Infobulle du verrou, dessinée après toutes les icônes (sinon les tuiles suivantes la recouvrent) */
function dessinerBulleVerrou() {
	const b = APPLIS.bulle;
	APPLIS.bulle = null;
	if (b) infobulle(b.txt, b.x, b.y);
}

// ——— § 3 : pile de navigation des redirections ———
/** Écran courant (ce qu'on empile) */
function ecranCourantPC() {
	const mail = PC.fenetre === 'patron' && typeof PATRON !== 'undefined' ? { sel: (Jeu.messagesPatron || []).indexOf(PATRON.sel), filtre: PATRON.filtre, lecture: PATRON.lecture } : null; // prompt 185 : le retour rouvre le mail d'origine
	return { etat: PC.etat, fenetre: PC.fenetre, journal: typeof JOURNAL !== 'undefined' ? { jour: JOURNAL.jour, enquete: JOURNAL.enquete } : null, commu: typeof COMMU !== 'undefined' ? COMMU.onglet : null, mail };
}
/** Redirection vers une appli avec contexte : l'origine est empilée ; Échap y revient */
function redirigerVers(cle, prep) {
	if (cle !== 'signalements' && !appliDebloquee(cle)) return refuserAppliVerrouillee(cle), false;
	APPLIS.pile.push(Object.assign(ecranCourantPC(), { cible: cle })); // prompt 185 : la cible dit quel écran ramène ici
	if (APPLIS.pile.length > 12) APPLIS.pile.shift();
	if (cle === 'signalements') {
		PC.fenetre = null;
		PC.etat = 'appli';
	} else {
		PC.etat = 'os';
		PC.fenetre = cle;
	}
	if (prep) prep();
	Confort.Son.clic();
	annoncer(t('applis.redirection', { appli: t('app.' + cle) }));
	return true;
}
/** Échap : revient à l'écran d'origine s'il y en a un ; true si la touche est prise */
function depilerNavigation() {
	const o = APPLIS.pile.pop();
	if (!o) return false;
	PC.etat = o.fenetre ? 'os' : 'appli'; // prompt 183 : jamais de bureau d'icônes
	PC.fenetre = o.fenetre;
	if (o.journal && typeof JOURNAL !== 'undefined') Object.assign(JOURNAL, o.journal);
	if (o.commu && typeof COMMU !== 'undefined') COMMU.onglet = o.commu;
	if (o.mail && typeof PATRON !== 'undefined') Object.assign(PATRON, { filtre: o.mail.filtre || 'tout', sel: (Jeu.messagesPatron || [])[o.mail.sel] || null, lecture: !!o.mail.lecture, ouvert: true, voirSel: true, defilLecture: 0 });
	Confort.Son.clic();
	annoncer(t('applis.retour', { appli: t('app.' + (o.fenetre || 'signalements')) }));
	return true;
}
/** Prompt 185 : « Retour » / Échap sur l'écran ouvert par une redirection vers `cle` → écran d'origine ; true si pris */
function retourRedirection(cle) {
	const o = APPLIS.pile[APPLIS.pile.length - 1];
	return !!(o && o.cible === cle && depilerNavigation());
}
/** « Voir le dossier » depuis n'importe quelle appli : Signalements, sur le dossier s'il est encore ouvert, sinon sa
 * fiche dans le Journal. Prompt 185 : la trace est retrouvée par le RANG du dossier (e.index), pas par l'identité de
 * l'objet — après une sauvegarde rechargée, resultat.dossier est une copie et l'ancienne comparaison (===) échouait :
 * le lien ramenait à la carte au lieu de la fiche. */
function voirDossierDepuis(index) {
	if (index === undefined || index === null) return;
	const d = Jeu.paquet && Jeu.paquet[index];
	const e = (Jeu.evenementsJournee || []).find((x) => x.index === index) || (d && (Jeu.evenementsJournee || []).find((x) => x.resultat && x.resultat.dossier === d));
	if (!e) {
		if (!d) return;
		// Pas encore décidé : Signalements, sur ce dossier s'il est dans la file (sinon la liste : il arrivera)
		return redirigerVers('signalements', () => typeof ouvrirSignalements === 'function' && ouvrirSignalements(d));
	}
	redirigerVers('journal', () => {
		const ji = (Jeu.jours || []).findIndex((j) => j.date === e.jour);
		JOURNAL.jour = ji;
		JOURNAL.enquete = (Jeu.evenementsJournee || []).filter((x) => x.jour === e.jour).indexOf(e);
		JOURNAL.volet = 0;
	});
}
