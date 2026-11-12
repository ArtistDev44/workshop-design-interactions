/* Nantes en régulation — prompt 91 : applis reliées et déblocage par semaine.
 * § 2 (option du groupe, désactivée par défaut : Paramètres → Options de jeu) : semaine 1 = Signalements seule ;
 *     Community (et la Corbeille) en semaine 2, Messages en 3, Journal et Indicateurs en 4, Données en 5. Icônes
 *     verrouillées grisées avec cadenas, secousse et infobulle ; carte d'intro d'une phrase au déblocage (une fois).
 * § 3 : pile de navigation — chaque redirection (« Voir le dossier », « Publier sur Community », lien vers le Journal)
 *     empile l'écran d'origine ; Échap dépile et revient à l'écran précédent.
 */
const PLANNING_APPLIS = { signalements: 1, community: 2, corbeille: 2, patron: 3, journal: 4, indicateurs: 4, donnees: 5 };
const APPLIS = { tremble: null, introVues: null, pile: [] };
const CLE_INTRO_APPLIS = 'pxe-nte001-applis-intro';

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

// ——— Carte d'intro au déblocage (une fois par appli, persisté) ———
function introsApplis() {
	if (!APPLIS.introVues) {
		try {
			APPLIS.introVues = JSON.parse(localStorage.getItem(CLE_INTRO_APPLIS) || '{}') || {};
		} catch (e) {
			APPLIS.introVues = {};
		}
	}
	return APPLIS.introVues;
}
/** Au bureau RégulOS : une appli fraîchement débloquée (planning > 1) est présentée en une phrase */
function verifierDeblocages() {
	if (!Confort.Reglages.deblocageApplis || fenetre || ecran !== 'jeu' || vue !== 'poste' || PC.etat !== 'os') return;
	const vues = introsApplis();
	const neuve = Object.keys(PLANNING_APPLIS).find((cle) => PLANNING_APPLIS[cle] > 1 && cle !== 'corbeille' && appliDebloquee(cle) && !vues[cle]);
	if (!neuve) return;
	APPLIS.intro = neuve;
	ouvrir('deblocage');
	annoncer(t('applis.nouvelle', { appli: t('app.' + neuve) }) + ' ' + t('applis.intro.' + neuve));
}
function fermerIntroAppli() {
	const vues = introsApplis();
	vues[APPLIS.intro] = true;
	try {
		localStorage.setItem(CLE_INTRO_APPLIS, JSON.stringify(vues));
	} catch (e) {}
	fermer();
}
function fenetreDeblocage() {
	const l = 1000;
	const h = 420;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	noStroke();
	dsTitre(t('applis.nouvelle', { appli: t('app.' + APPLIS.intro) }).toUpperCase(), x + 48, y + 40, 32, C.texte, 'left');
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textSize(24);
	textLeading(34);
	fill(C.texte);
	text(t('applis.intro.' + APPLIS.intro), x + 48, y + 120, l - 96, 160);
	bouton(x + l - 48 - 300, y + h - 100, 300, 64, t('tache.continuer'), fermerIntroAppli);
}
function toucheDeblocage() {
	if (fenetre !== 'deblocage') return false;
	if (keyCode === ENTER || keyCode === RETURN || keyCode === ESCAPE) fermerIntroAppli();
	return true;
}

// ——— § 3 : pile de navigation des redirections ———
/** Écran courant (ce qu'on empile) */
function ecranCourantPC() {
	return { etat: PC.etat, fenetre: PC.fenetre, journal: typeof JOURNAL !== 'undefined' ? { jour: JOURNAL.jour, enquete: JOURNAL.enquete } : null, commu: typeof COMMU !== 'undefined' ? COMMU.onglet : null };
}
/** Redirection vers une appli avec contexte : l'origine est empilée ; Échap y revient */
function redirigerVers(cle, prep) {
	if (cle !== 'signalements' && !appliDebloquee(cle)) return refuserAppliVerrouillee(cle), false;
	APPLIS.pile.push(ecranCourantPC());
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
	PC.etat = o.etat;
	PC.fenetre = o.fenetre;
	if (o.journal && typeof JOURNAL !== 'undefined') Object.assign(JOURNAL, o.journal);
	if (o.commu && typeof COMMU !== 'undefined') COMMU.onglet = o.commu;
	Confort.Son.clic();
	annoncer(t('applis.retour', { appli: t('app.' + (o.fenetre || (o.etat === 'appli' ? 'signalements' : 'bureau'))) }));
	return true;
}
/** « Voir le dossier » depuis n'importe quelle appli : Signalements, sur le dossier s'il est encore ouvert, sinon le Journal */
function voirDossierDepuis(index) {
	const d = Jeu.paquet && Jeu.paquet[index];
	if (!d) return;
	const e = (Jeu.evenementsJournee || []).find((x) => x.resultat && x.resultat.dossier === d);
	if (!e) {
		// Pas encore décidé : on revient à la liste des signalements (le dossier y est, ou arrivera)
		return redirigerVers('signalements');
	}
	redirigerVers('journal', () => {
		const ji = (Jeu.jours || []).findIndex((j) => j.date === e.jour);
		JOURNAL.jour = ji;
		JOURNAL.enquete = (Jeu.evenementsJournee || []).filter((x) => x.jour === e.jour).indexOf(e);
		JOURNAL.volet = 0;
	});
}
