/* Nantes en régulation — couche d'immersion (prompt 20).
 * Ajoute, SANS toucher aux décisions Q1–Q61 (jauges, actions, fins) :
 *   § 2 intro SMS · § 3 horloge simulée et temps compressé ×10 · § 4 sieste et « Se réveiller »
 *   § 5 bordures rouges pour les incidents importants · § 6 mail de fin de journée · § 7 livres au bureau
 *   § 1 Échap au bureau = menu.
 * Rien n'est inventé côté données : les textes factuels (mail) viennent des dossiers réellement joués.
 */

// ——— Réglages de l'immersion (tout est ici) ———
const IMMERSION = {
	minutesParSeconde: 1, // rythme normal : 1 minute de journée par seconde réelle
	compression: 100, // § 3 : ×100 quand aucun incident n'est actif (prompt 43 : ×10 → ×30 ; prompt 77 : ×100, valeur verrouillée)
	fenetreReveilMs: { 60: 3000, 30: 2000, 15: 1000 }, // § 4 : selon le compteur de la semaine
	retardImportant: 20, // § 5 : retard ≥ 20 min = bordure rouge
	pulsationsParSeconde: 1.5, // § 5 : jamais plus de 3 flashs/s
};

const SMS = [
	{ de: 'moi', texte: T('sms.0') },
	{ de: T('sms.camille'), texte: T('sms.1') },
	{ de: T('sms.camille'), texte: T('sms.2') },
	{ de: T('sms.camille'), texte: T('sms.3') },
	{ de: T('sms.camille'), texte: T('sms.4') },
	{ de: 'moi', texte: T('sms.5') },
];


let smsActif = false;
let smsIndex = 0;
let introVue = false;
let inactifDepuis = 0; // millis() de la dernière interaction
let enSieste = false;
let debutSieste = 0;
let reveil = null; // { limite } quand une alerte arrive pendant la sieste
let focusBureau = -1; // -1 : aucun ; sinon index dans OBJETS_BUREAU
let derniereImage = 0;

// Objets cliquables du bureau (coordonnées pixel art, voir bureau.js)
const OBJETS_BUREAU = [
	{ nom: 'ecran', label: T('objet.ecran') },
	{ nom: 'aide', label: T('objet.aide'), x: 58, y: 190, l: 50, h: 9, visible: () => typeof objetPresent !== 'function' || objetPresent('aide') }, // prompt 34 : remplace le livre « tuto » ; prompt 104 : au fil des journées
	{ nom: 'stress', label: T('objet.stress'), x: 62, y: 180, l: 44, h: 9, visible: () => typeof objetPresent !== 'function' || objetPresent('stress') },
	// Prompt 29 : objets de la pièce (micro-interactions, sans effet sur les jauges ni pause)
	{ nom: 'lampe', piece: true, label: T('piece.lampe'), infobulle: T('piece.lampe.survol'), x: 410, y: 86, l: 16, h: 14 }, // prompt 31 : applique murale (recalée pour le plein écran)
	{ nom: 'plante', piece: true, label: T('piece.plante'), infobulle: T('piece.plante.survol'), x: 69, y: 153, l: 16, h: 21, visible: () => typeof objetPresent !== 'function' || objetPresent('plante') },
	{ nom: 'tasse', piece: true, label: T('piece.tasse'), infobulle: T('piece.tasse.survol'), x: 118, y: 178, l: 22, h: 28, visible: () => typeof objetPresent !== 'function' || objetPresent('tasse') },
	{ nom: 'rapport', label: T('objet.rapport'), infobulle: T('objet.rapport.survol'), x: 272, y: 178, l: 58, h: 20, visible: () => !!RAPPORT || !!rapportVeille() }, // prompt 41 ; prompt 89 bis : le rapport de la veille reste sur le bureau : posée entre le pied de l'écran et le clavier
	{ nom: 'telephone', label: T('objet.telephone'), infobulle: { toString: () => t('objet.telephone.survol') + (typeof telNonLues === 'function' && telNonLues() ? ' · ' + t('tel.nonLues', { n: telNonLues() }) : '') }, x: 364, y: 192, l: 26, h: 32 }, // prompt 38
	{ nom: 'dossiers', piece: true, label: T('piece.dossiers'), infobulle: T('piece.dossiers.survol'), x: 390, y: 160, l: 44, h: 15, visible: () => typeof objetPresent !== 'function' || objetPresent('dossiers') },
	{ nom: 'fenetre', piece: true, label: T('piece.fenetre'), infobulle: T('piece.fenetre.survol'), x: 334, y: 14, l: 64, h: 96 }, // prompt 31 : la baie s'arrête au pan de mur
	{ nom: 'horloge', label: T('objet.horloge'), infobulle: T('objet.horloge.survol'), x: 404, y: 30, l: 28, h: 29 }, // prompt 51 : finir sa journée
	{ nom: 'webcam', label: T('objet.webcam'), infobulle: T('objet.webcam.survol'), x: 234, y: 39, l: 13, h: 8 }, // prompt 57 : webcam posée sur l'écran
	{ nom: 'micro', label: T('objet.micro'), infobulle: { toString: () => t(Jeu.defiChrono ? 'objet.micro.survolChrono' : 'objet.micro.survol') }, x: 150, y: 170, l: 12, h: 24, visible: () => typeof objetPresent !== 'function' || objetPresent('micro') }, // prompt 54 : micro du poste (appui maintenu) ; prompt 104 ; prompt 161 : infobulle « compteur » seulement en défi chrono
	{ nom: 'sortie', label: T('soir.sortie'), infobulle: T('soir.infobulle'), x: 41, y: 92, l: 34, h: 56, visible: () => typeof sortieVisible === 'function' && sortieVisible() }, // prompt 69 : flèche du soir (soir.js)
];

// ——— Prompt 29 : interactions hors écran, dans la pièce ———
const CLE_LAMPE = 'pxe-nte001:jeu:lampe';
const PIECE = {
	lampe: (() => {
		try {
			return localStorage.getItem(CLE_LAMPE) !== 'eteinte';
		} catch (e) {
			return true;
		}
	})(),
	store: false, // store vénitien de la baie : baissé (true) ou relevé (false)
	message: null, // { texte, objet, jusqua }
};

/** Météo affichée (fenêtre, pluie, ambiances) — prompt 49 : elle suit le mode de jeu.
 * Partie en direct : API Open-Meteo chargée en direct. Semaine passée / hors ligne : données archivées du
 * jour joué, jamais la météo d'aujourd'hui. Hors partie (menu) : météo du moment, sinon l'instantané local. */
function meteoFenetre() {
	const enPartie = ecran === 'jeu' && Jeu.etat && Jeu.etat.mode;
	if (enPartie && Jeu.etat.mode !== 'direct') {
		const j = Jeu.jourCourant ? Jeu.jourCourant() : null;
		return j ? Jeu.meteoDuJour(j.date) : null;
	}
	return Jeu.meteoActuelle || (Jeu.fallback && Jeu.fallback.meteo && Jeu.fallback.meteo[0]) || null;
}
// En direct, la météo de l'API est rafraîchie toutes les 30 minutes (hors draw, jamais pendant une semaine passée)
setInterval(() => {
	if (ecran === 'jeu' && Jeu.etat && Jeu.etat.mode === 'direct' && !Confort.Reglages.horsLigneForce) Jeu.verifierConnexion();
}, 30 * 60 * 1000);
const nombreFr = (v) => (Langue.actuelle === 'fr' ? String(v).replace('.', ',') : String(v));

function interagirPiece(nom) {
	const hS = heureAffichee();
	const heure = String(hS.h).padStart(2, '0') + ':' + String(hS.m).padStart(2, '0');
	let texte;
	if (nom === 'lampe') {
		PIECE.lampe = !PIECE.lampe;
		try {
			localStorage.setItem(CLE_LAMPE, PIECE.lampe ? 'allumee' : 'eteinte');
		} catch (e) {}
		texte = t(PIECE.lampe ? 'piece.lampe.on' : 'piece.lampe.off');
	} else if (nom === 'fenetre') {
		PIECE.store = !PIECE.store;
		if (typeof revelerSource === 'function') revelerSource('meteo', false); // prompt 50 : regarder dehors
		const m = meteoFenetre();
		const maintenant = new Date();
		const reelle = String(maintenant.getHours()).padStart(2, '0') + ':' + String(maintenant.getMinutes()).padStart(2, '0');
		const meteo = m
			? t('piece.fenetre.meteo', { date: m.date ? m.date.split('-').reverse().join('/') : '', min: nombreFr(m.temp_min), max: nombreFr(m.temp_max), pluie: nombreFr(m.pluie_mm), vent: nombreFr(m.rafales_max) })
			: t('piece.fenetre.inconnue');
		// Prompt 49 : la source du climat suit le mode de jeu
		const sourceMeteo = !m ? '' : ecran === 'jeu' && Jeu.etat.mode && Jeu.etat.mode !== 'direct' ? t('meteo.source.archive') : t('meteo.source.direct');
		texte = t(PIECE.store ? 'piece.fenetre.ferme' : 'piece.fenetre.ouvre') + ' ' + (sourceMeteo ? meteo.replace(/\.$/, '') + sourceMeteo + '.' : meteo) + ' ' + t('piece.fenetre.heures', { reelle, jeu: heure });
	} else if (nom === 'plante') {
		const m = meteoFenetre();
		texte = m && m.pluie_mm >= 1 ? t('piece.plante.pluie', { pluie: nombreFr(m.pluie_mm) }) : t('piece.plante.sec', { heure });
	} else if (nom === 'tasse') {
		const j = ecran === 'jeu' && Jeu.jourCourant ? Jeu.jourCourant() : null;
		texte = j ? t('piece.tasse.jour', { heure, n: j.dossiers.length }) : t('piece.tasse.libre', { heure });
	} else if (nom === 'dossiers') {
		const j = ecran === 'jeu' && Jeu.jourCourant ? Jeu.jourCourant() : null;
		texte = j ? t('piece.dossiers.jour', { n: j.dossiers.length, parts: Jeu.compositionDossiers(j.dossiers), date: j.date.split('-').reverse().join('/') }) : t('piece.dossiers.libre');
	}
	PIECE.message = { texte, objet: nom, jusqua: millis() + 5000 };
	dernierRenduBureau = 0; // la pièce est redessinée tout de suite (lampe, store)
	annoncer(texte);
	Confort.Son.bip('choix');
}

function interaction() {
	inactifDepuis = millis();
}

// ——— Journées et horloge simulée (§ 3) ———
function demarrerJournee() {
	ecran = 'jeu';
	enPause = false;
	phase = 'attente';
	enSieste = false;
	reveil = null;
	interaction();
	annoncerJournee(); // prompt 43 : écran noir « JOUR n — SEMAINE n »
	demarrageDuJour(); // prompt 71 : le PC redémarre les 3 premiers jours
	filDebutJournee(); // prompt 74 : bilan de la veille, avant le premier signalement
}

// ——— Prompt 43 : transition entre journées — fond noir, « JOUR n — SEMAINE n » et la date, centrés ———
// Prompt 180 : plus de temps pour lire — le texte est pleinement lisible de 0,3 s à D − 0,5 s (hors fondus) ; clic, Entrée ou Espace passent
const DUREE_TRANSITION_JOUR = 9000; // prompt 95 : 2,8 → 5,2 s ; prompt 180 : 5,2 → 9 s (titre, date et 4 à 5 lignes d'explication)
const DUREE_TRANSITION_INTRO = 4300; // prompt 112 : jour 1 de la toute première partie — titre et date seulement ; prompt 180 : 1,5 → 4,3 s (≈ 3,5 s lisibles)
const dureeTransition = () => (TRANSITION_JOUR && TRANSITION_JOUR.duree) || DUREE_TRANSITION_JOUR;
/** Prompt 95 : « lundi 14 septembre » */
function jourDate(iso) {
	if (!iso) return '';
	return new Date(iso + 'T12:00:00Z').toLocaleDateString(localeActive(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
}
/** Jours de la semaine (lundi → dimanche) sans événement réel, donc non joués */
function joursSansEvenement() {
	const e = Jeu.etat;
	if (!e || e.mode === 'direct' || !e.semaine || !e.semaine.lundi || !Jeu.jours) return [];
	const joues = new Set(Jeu.jours.map((j) => j.date));
	const out = [];
	for (let i = 0; i < 7; i++) {
		const d = new Date(e.semaine.lundi + 'T12:00:00Z');
		d.setUTCDate(d.getUTCDate() + i);
		const iso = d.toISOString().slice(0, 10);
		if (!joues.has(iso)) out.push(iso);
	}
	return out;
}
/** Lignes d'explication de la journée (transition) — toutes tirées de la partie réelle */
function lignesTransitionJour() {
	const T0 = TRANSITION_JOUR;
	const j = Jeu.jours && Jeu.jours[T0.jour - 1];
	const l = [];
	const meteo = j && Jeu.accrocheMeteo ? Jeu.accrocheMeteo(j.date) : null; // prompt 191 : accroche du matin, météo réelle du jour (rien si la donnée manque)
	if (meteo) l.push(String(meteo));
	if (j) l.push(t('transition.prevus', { n: j.dossiers.length, parts: Jeu.compositionDossiers(j.dossiers) })); // prompt 162 : « réel » réservé aux faits de la source
	l.push(t('transition.service', { debut: Jeu.formaterHeure(Jeu.debutJournee ? Jeu.debutJournee() : 480), fin: Jeu.formaterHeure(Jeu.finJournee()) }));
	l.push(t('transition.rythme'));
	l.push(t('transition.finir'));
	const absents = T0.jour === 1 ? joursSansEvenement() : [];
	if (absents.length) l.push(t('transition.courte', { n: Jeu.jours.length, jours: absents.map(jourDate).join(', ') }));
	return l;
}
let TRANSITION_JOUR = null; // { debut, jour, semaine, date }
let derniereJourneeAnnoncee = '';
function annoncerJournee() {
	const j = Jeu.jourCourant ? Jeu.jourCourant() : null;
	if (!j) return;
	const cle = (Jeu.etat.semaine ? Jeu.etat.semaine.lundi : Jeu.etat.mode) + '|' + Jeu.jourIndex;
	if (cle === derniereJourneeAnnoncee) return; // pas deux fois pour la même journée (intro SMS)
	derniereJourneeAnnoncee = cle;
	const intro = !introVue && Jeu.jourIndex === 0; // prompt 112 : la conversation avec Camille suit aussitôt
	TRANSITION_JOUR = { debut: millis(), jour: Jeu.jourIndex + 1, semaine: typeof chapitreCourant === 'function' ? chapitreCourant() : 0, date: j.date, duree: intro ? DUREE_TRANSITION_INTRO : DUREE_TRANSITION_JOUR, court: intro };
	annoncer(texteTransitionJour() + ' — ' + jourDate(j.date) + '. ' + lignesTransitionJour().join(' '));
}
/** Prompt 95 : titre juste — histoire « JOUR n/N — SEMAINE s », archive « JOUR n/N », direct « JOUR n — TEMPS RÉEL » */
function texteTransitionJour() {
	const T0 = TRANSITION_JOUR;
	if (Jeu.etat && Jeu.etat.mode === 'direct') return t('transition.jourDirect', { j: T0.jour });
	const N = Jeu.jours ? Jeu.jours.length : T0.jour;
	return T0.semaine ? t('transition.jour', { j: T0.jour + '/' + N, s: T0.semaine }) : t('transition.jourArchive', { j: T0.jour, n: N });
}
function resteTransitionJour() {
	return TRANSITION_JOUR ? Math.max(0, dureeTransition() - (millis() - TRANSITION_JOUR.debut)) : 0;
}
function passerTransitionJour() {
	TRANSITION_JOUR = null;
}
function dessinerTransitionJour() {
	if (!TRANSITION_JOUR) return false;
	const u = millis() - TRANSITION_JOUR.debut;
	const D = dureeTransition();
	if (u >= D) return (TRANSITION_JOUR = null), false;
	const a = reduireAnimations ? 1 : u < 300 ? u / 300 : u > D - 500 ? (D - u) / 500 : 1;
	boutons = [{ x: 0, y: 0, l: L, h: H, action: passerTransitionJour }];
	noStroke();
	fill(0, 0, 0, 255 * a);
	rect(0, 0, L, H);
	zoneTexteDeclarer('transitionJour', 0, 0, L, H); // prompt 120 : écran plein cadre, conteneur de ses textes (audit)
	if (a > 0.6) {
		dsTitre(texteTransitionJour(), L / 2, H / 2 - 220, 72, '#ffffff', 'center'); // prompt 95 : remonté pour l'explication
		noStroke();
		textAlign(CENTER, TOP);
		textFont(POLICE_TEXTE);
		textSize(26);
		fill('rgba(255,255,255,0.75)');
		text(jourDate(TRANSITION_JOUR.date), L / 2, H / 2 - 120);
		// Prompt 95 : ce que sera la journée (signalements prévus, service, rythme du temps, comment finir)
		// Prompt 112 : transition courte de l'intro → titre et date seuls (l'explication reste annoncée, et le tutoriel la reprend)
		if (TRANSITION_JOUR.court) return true;
		let yl = H / 2 - 40;
		const lt = Math.min(1120, L - 80); // prompt 120 : en portrait (L = 1080), les lignes restent dans l'écran
		lignesTransitionJour().forEach((ln) => {
			yl += dessinerTexte(ln, L / 2 - lt / 2, yl, lt, { taille: 22, couleur: '#FFFFFF', align: 'center', interligne: 32 }).h + 6;
		});
		dessinerTexte(t('transition.passer'), L / 2 - lt / 2, yl + 18, lt, { taille: 18, couleur: 'rgba(255,255,255,0.75)', align: 'center', maxLignes: 1 });
	}
	return true;
}

function heureAffichee() {
	// Partie en cours : heure simulée ; sinon (et en mode « aujourd'hui ») : heure réelle
	if (ecran === 'jeu' && Jeu.horloge && Jeu.etat.mode !== 'direct' && phase !== 'fin') {
		const m = Math.floor(Jeu.horloge.minutes);
		return { h: Math.floor(m / 60) % 24, m: m % 60, simulee: true };
	}
	const d = new Date();
	return { h: d.getHours(), m: d.getMinutes(), simulee: false };
}

/** Le temps de jeu est-il arrêté ? (fin, mail, soir, démarrage du PC, SMS, pause, tutoriel, transition, fenêtres) */
// Prompt 172 : la lecture de l'aide (livre du bureau, H, menu pause) suspend le temps, comme le tutoriel
// Prompt 179 : la toute première lecture du téléphone aussi (telephone.js) ; aux ouvertures suivantes, le temps file
// Prompt 181 : et le guide « Prendre en main » tant qu'une étape attend le joueur (guideSuspendTemps, guide.js)
function tempsSuspendu() {
	return ecran !== 'jeu' || !Jeu.horloge || phase === 'fin' || phase === 'soir' || pcDemarre() || smsActif || enPause || tutoriel || TRANSITION_JOUR || mecaniquesSuspendentTemps() || fenetre === 'aide' || fenetre === 'menu' || (typeof telephonePremiereLecture === 'function' && telephonePremiereLecture()) || lecturePanneau() || (typeof guideSuspendTemps === 'function' && guideSuspendTemps()) || (typeof expoEnPause === 'function' && expoEnPause()); // prompt 160 : voile « Partie en pause » de l'exposition ; prompt 74 : explication du poste ; prompt 87 : lecture d'un signalement
}
function tempsCompresse() {
	return ecran === 'jeu' && (phase === 'attente' || phase === 'reveil') && !tempsSuspendu(); // « ×100 » seulement quand le temps file vraiment
}

// Prompt 95 : horloge des équipes (ms) — avance avec le temps de JEU (×1, ×100 en temps accéléré, 0 quand il est
// suspendu). 1 000 ms = 1 minute de jeu au rythme normal : « 20 s » d'avant deviennent 20 min de jeu, qui ne filent plus
// pendant la lecture d'un signalement. game.js reçoit cette valeur comme « maintenant » (API inchangée).
const TEMPS_EQUIPES = { ms: 0, actif: 0 };
const tempsEquipes = () => TEMPS_EQUIPES.ms;
/** Prompt 131 : ms réelles de jeu actif — une plainte n'expire plus pendant la lecture d'un signalement */
const tempsPlaintes = () => TEMPS_EQUIPES.actif;
/** État de la vitesse du temps : 'pause' | 'normal' | 'accelere' */
function vitesseTemps() {
	if (ecran !== 'jeu' || !Jeu.horloge || tempsSuspendu()) return 'pause';
	return tempsCompresse() ? 'accelere' : 'normal';
}
function avancerTemps() {
	const maintenant = millis();
	const dt = derniereImage ? Math.min(250, maintenant - derniereImage) : 0;
	derniereImage = maintenant;
	if (tempsSuspendu()) return; // prompt 34 / 43 : tutoriel et transition suspendent le temps
	const vitesse = IMMERSION.minutesParSeconde * (tempsCompresse() ? IMMERSION.compression : 1) * (typeof Juice !== 'undefined' ? Juice.echelleTemps(maintenant) : 1); // prompt 78 : sieste ×100 ; prompt 96 : hit-stop (horloge seule, entrées libres)
	TEMPS_EQUIPES.ms += dt * (vitesse / IMMERSION.minutesParSeconde); // prompt 95 (le hit-stop la ralentit aussi)
	TEMPS_EQUIPES.actif += dt; // prompt 131 : temps réel de jeu ACTIF (×1, arrêté quand le temps est suspendu) — délai des plaintes
	const avant = Jeu.horloge.minutes;
	Jeu.horloge.minutes += (dt / 1000) * vitesse;
	// Prompt 78 : l'horloge ne dépasse pas la fin de journée tant que des signalements restent (sieste ×100)
	if (Jeu.etat.mode !== 'direct' && Jeu.horloge.minutes > Jeu.finJournee()) Jeu.horloge.minutes = Math.max(avant, Jeu.finJournee());
	majSomnolence(dt, Jeu.horloge.minutes - avant); // prompt 78 : la somnolence monte avec le temps de jeu et l'inactivité
	if (Jeu.majSuivis && Jeu.majSuivis()) Confort.Son.bip('choix'); // prompt 63 : une réaction arrive sur Community

	// Prompt 87 : sans chrono, rien n'expire pendant la journée ; à l'heure de fin, ce qui reste suit la règle « non traité » (Q25)
	if (!Jeu.defiChrono && (phase === 'attente' || phase === 'selection') && Jeu.etat.mode !== 'direct' && Jeu.horloge.minutes >= Jeu.finJournee() && Jeu.prochainDuJour()) {
		const n = Jeu.expirerFinJournee();
		MULTI.actifs = [];
		phase = 'attente';
		if (n) annoncer(t('horloge.nonTraites', { n }) + ' ' + Jeu.evenementsJournee.slice(-n).map((e) => Traces.calculQ25(e)).join(' ')); // prompt 89 bis : Q25 expliqué
	}
	if (phase === 'attente') {
		// Prompt 78 : plus de sieste après 20 s d'inactivité — elle tombe quand la somnolence est pleine (sieste.js)
		const prochain = Jeu.prochainDuJour();
		if (prochain && Jeu.horloge.minutes >= prochain.minute) arriveeIncident();
		else if (!prochain && Jeu.horloge.minutes >= Jeu.finJournee()) finJourneeAtteinte(); // prompt 51 : l'horloge s'arrête, le joueur clique dessus pour partir (journee.js)
	} else if (phase === 'reveil' && reveil && maintenant > reveil.limite) {
		rateReveil();
	}
}

function arriveeIncident() {
	if (enSieste) {
		// Prompt 78 : pendant la sieste, les signalements s'accumulent dans la liste ; seul un signalement de gravité
		// élevée déclenche le réveil d'urgence — triple bip, puis fenêtre de réaction 3 / 2 / 1 s selon le compteur
		const urgent = signalementUrgentPendantSieste();
		if (!urgent) return;
		const c = (Jeu.etat.semaine && Jeu.etat.semaine.difficulte && Jeu.etat.semaine.difficulte.compteur_s) || 30;
		phase = 'reveil';
		reveil = { limite: millis() + (Jeu.defiChrono ? IMMERSION.fenetreReveilMs[c] || 2000 : 3000), d: urgent }; // prompt 87 : 3 s hors défi chrono
		Confort.Son.bip('alerte');
		setTimeout(() => Confort.Son.bip('alerte'), 180);
		setTimeout(() => Confort.Son.bip('alerte'), 360);
		return;
	}
	entrerSelection(); // prompts 68 / 73 : un signalement dans la liste ; le compteur démarre quand le joueur le prend
}

function seReveiller() {
	if (phase !== 'reveil') return;
	phase = 'attente';
	reveiller(); // prompt 78 : bilan de la sieste, puis la liste des signalements
}

/** Réveil d'urgence raté : le signalement urgent est réglé « non traité » (Q25) + malus de sieste ; on dort encore */
function rateReveil() {
	const d = reveil && reveil.d;
	reveil = null;
	phase = 'attente';
	if (d && Jeu.paquet.indexOf(d) >= Jeu.index) expirerEnFond(d, !actifDe(d)); // malus de sieste appliqué par siesteExpiration
	// Prompt 62 : pas d'interaction() ici — le joueur n'a rien fait
}

/** Après la narration d'une décision : incident suivant de la journée, ou attente de la fin de journée */
function apresDecision() {
	phase = 'attente';
	filApresDecision(); // prompt 74 : texte de liaison (météo, agenda, radio) tiré des données réelles
	if (typeof ouvrirTacheEnFile !== 'function' || !ouvrirTacheEnFile(reprendreActif)) reprendreActif(); // prompt 77 : un autre signalement actif attend — on le reprend (le plus urgent) ; prompt 88 : la tâche courte passe avant (rotation)
	// Prompt 62 : plus d'interaction() ici. Après un compteur à 0, la suite est automatique : elle remettait
	// l'inactivité à zéro et un joueur absent ne s'endormait jamais. Ses vrais gestes (clic, touche) le font.
}

function journeeSuivante() {
	if (Jeu.terminee || !Jeu.jours[Jeu.jourIndex + 1]) return allerFin();
	Jeu.journeeSuivante();
	if (typeof Taches !== 'undefined') Taches.matin(); // prompt 88 : demande du rapport de la veille, accordée ou non
	demarrerJournee();
	Sauvegarde.auto(false); // prompt 33
}

function allerFin() {
	phase = 'fin';
	Sauvegarde.auto(false); // prompt 33 : partie finie → sa sauvegarde est effacée (le meilleur bilan reste)
	const cle = Confort.Bilans.cle(Jeu.etat);
	const g = Jeu.profilPartie(); // prompt 47 : profil de gestion gardé au palmarès
	// Une démission n'entre pas au palmarès (prompt 47)
	if (!Jeu.demission && Jeu.appliquerDefis) Jeu.appliquerDefis(); // prompt 55/56 : semaine finie sans soirée (départ le dernier jour) → bonus quand même, une fois
	const defisTenus = Jeu.defisAppliques ? Jeu.defisAppliques.filter((r) => r.tenu).length + '/' + Jeu.defisAppliques.length : null;
	bilanFin = Jeu.demission ? { meilleur: Confort.Bilans.meilleur(cle), record: false } : Confort.Bilans.enregistrer(cle, Jeu.score(), Jeu.jauges, { profil: g ? g.id : null, defis: defisTenus }); // Q19 ; prompt 56 : défis tenus au palmarès
	Confort.Son.bip('fin');
	finDeSemaine(); // prompt 41 : rapport papier sur la table, ou cinématique après la semaine 3
}

// ——— Incidents importants : bordures rouges (§ 5) ———
function incidentImportant() {
	if (ecran !== 'jeu' || !['decision', 'contradiction', 'conflit', 'reveil'].includes(phase)) return false;
	const d = phase === 'reveil' ? Jeu.prochainDuJour() : Jeu.dossierCourant();
	return !!d && ((d.retard !== null && d.retard !== undefined && d.retard >= IMMERSION.retardImportant) || phase === 'conflit');
}
function incidentActif() {
	return ecran === 'jeu' && ['decision', 'contradiction', 'conflit', 'reveil', 'selection'].includes(phase); // prompt 68 : + signalement en attente
}
/** Opacité de la pulsation (0..1) : 1,5 pulsation/s, fixe si animations réduites */
function pulsationRouge() {
	if (reduireAnimations) return 1;
	return 0.55 + 0.45 * Math.sin((millis() / 1000) * Math.PI * 2 * IMMERSION.pulsationsParSeconde);
}
/** Contour d'alerte DANS l'écran du PC : le trait est entièrement à l'intérieur du rectangle (x, y, l, h) */
function bordureRouge(x, y, l, h, epaisseur) {
	const e = epaisseur / 2;
	noFill();
	stroke(209, 11, 0, 255 * pulsationRouge()); // Error Primary du Pixel DS
	strokeWeight(epaisseur);
	rect(x + e, y + e, l - epaisseur, h - epaisseur);
	noStroke();
}

// ——— Panneau « attente » (aucun incident actif) ———
function dessinerAttente() {
	const z = Object.assign({}, PANNEAU);
	panneau(z.x, z.y, z.l, z.h);
	const hA = heureAffichee();
	textAlign(LEFT, TOP);
	noStroke();
	fill(C.gris);
	textFont(POLICE_DONNEES);
	textSize(18);
	const j = Jeu.jourCourant();
	text(t('surv.titre', { date: j ? dateLongue(j.date).toUpperCase() : '' }), z.x + 32, z.y + 32);
	fill(C.texte);
	textFont(POLICE_DONNEES);
	textStyle(BOLD);
	textSize(110);
	text(String(hA.h).padStart(2, '0') + ':' + String(hA.m).padStart(2, '0'), z.x + 32, z.y + 80);
	textStyle(NORMAL);
	textSize(26);
	fill(C.accent);
	if (tempsCompresse()) text(t('surv.accelere', { x: IMMERSION.compression }), z.x + 36, z.y + 210);
	textFont(POLICE_TEXTE);
	textSize(26);
	fill(C.texte);
	const prochain = Jeu.prochainDuJour();
	text(prochain ? t('surv.calme') : t('surv.fin', { heure: Jeu.formaterHeure(Jeu.finJournee()) }), z.x + 32, z.y + 270, z.l - 64, 90);
	textSize(20);
	fill(C.gris);
	const restants = Jeu.paquet.length - Jeu.index;
	text(t('surv.restants', { n: restants, total: Jeu.paquet.length, j: Jeu.jourIndex + 1, jours: Jeu.jours.length }) + ' · ' + jourDate(Jeu.jourCourant() && Jeu.jourCourant().date), z.x + 32, z.y + 380, z.l - 64, 80); // prompt 95 : le jour et sa date
	if (enSieste) {
		fill(C.orange);
		textSize(22);
		text(t('surv.sieste'), z.x + 32, z.y + 440);
	}
	// Prompt 183 : plus de texte d'objectif dans l'appli (le bandeau le porte) ; le fil de la journée remonte
	dessinerFil(z.x + 32, z.y + 484, z.l - 64, z.h - 504);
}

// ——— Intro SMS (§ 2) ———
function lancerIntroSMS() {
	// Prompt 42 : le joueur saisit son téléphone ; la conversation avec Camille se lit dessus
	lancerConversation({ contact: T('sms.camille'), sous: T('intro.salle'), messages: SMS, auFin: terminerIntro });
}
function terminerIntro() {
	smsActif = false;
	introVue = true;
	demarrerJournee();
	vue = 'bureau'; // on arrive au bureau : l'ouverture est à 8 h (prompt 76)
	if (!tutorielVu() && !GUIDE.actif) lancerTutoriel(); // prompt 34 : à la première partie, juste après les SMS (sauf guide)
}

// =====================================================================
// Prompt 34 — vrai tutoriel guidé (5 étapes), superposé à l'écran ; le temps du jeu est suspendu.
// Relancé depuis le livre « Aide » et l'aide (T). « Tutoriel vu » persiste dans localStorage.
// =====================================================================
const CLE_TUTORIEL = 'pxe-nte001-tutoriel-vu';
const ETAPES_TUTORIEL = 6; // prompt 78 : + « Le jour et la sieste »
let tutoriel = null; // { etape, focus: 'suivant' | 'passer' }
function tutorielVu() {
	try {
		return localStorage.getItem(CLE_TUTORIEL) === 'oui';
	} catch (e) {
		return false;
	}
}
function lancerTutoriel() {
	fenetre = null;
	tutoriel = { etape: 0, focus: 'suivant', tourne: 0, sens: 1 };
	livreOuverture = millis();
	annoncerEtapeTutoriel();
}
function annoncerEtapeTutoriel() {
	const n = tutoriel.etape + 1;
	annoncer(t('tuto.etape', { n, total: ETAPES_TUTORIEL }) + ' — ' + t('tuto.' + n + '.titre') + '. ' + t('tuto.' + n + '.texte'));
}
function fermerTutoriel() {
	tutoriel = null;
	try {
		localStorage.setItem(CLE_TUTORIEL, 'oui');
	} catch (e) {}
	interaction();
}
/** Prompt 112 : clic sur la barre de progression */
function allerEtapeTutoriel(i) {
	if (!tutoriel || i === tutoriel.etape || i < 0 || i >= ETAPES_TUTORIEL) return;
	tutoriel.sens = i > tutoriel.etape ? 1 : -1;
	tutoriel.etape = i;
	tutoriel.tourne = millis();
	Confort.Son.bip('choix');
	annoncerEtapeTutoriel();
}
/** Prompt 112 : petit schéma pixel de chaque étape (page gauche du livre), sans image ni capture */
function illustrationTutoriel(n, x, y, l, h) {
	const encre = '#1c2f52';
	const rouge = DS.primaire;
	const vert = '#0a7d3e';
	const orange = '#b35c00';
	const papier = '#e6dcc4';
	const u = Math.min(l / 27, h / 12); // grille de pixels
	const ox = x;
	const oy = y + (h - 12 * u) / 2;
	const px = (cx, cy, cl, ch, c) => (fill(c), rect(ox + cx * u, oy + cy * u, cl * u, ch * u));
	noStroke();
	px(0, 0, 27, 12, papier);
	if (n === 1) {
		// Trois jauges : verte, orange, rouge
		[[vert, 18], [orange, 11], [rouge, 5]].forEach(([c, v], i) => {
			px(2, 2 + i * 3.4, 23, 2, '#cfc3a6');
			px(2, 2 + i * 3.4, v, 2, c);
		});
	} else if (n === 2) {
		// Carte : fleuve, ligne, deux repères (l'un en pointillés : sans lieu connu, prompt 147)
		px(0, 7, 27, 2, '#9db7c9');
		for (let i = 0; i < 22; i++) px(2 + i, 3 + Math.round(Math.sin(i / 3) * 1.5), 1, 1, encre);
		px(12, 1, 3, 3, rouge);
		px(13, 4, 1, 2, rouge);
		for (let i = 0; i < 4; i++) px(20 + (i % 2) * 2, 9 + Math.floor(i / 2) * 2, 1, 1, encre);
	} else if (n === 3) {
		// Bulle du plaignant puis deux répliques
		px(2, 1, 15, 4, '#ffffff');
		px(4, 5, 2, 1, '#ffffff');
		px(3, 2, 10, 1, encre);
		px(3, 3, 7, 1, encre);
		px(10, 7, 15, 2, encre);
		px(10, 10, 15, 1.4, '#b8ab8e');
		px(8, 7, 1, 2, rouge);
	} else if (n === 4) {
		// Centre (carré), tracé pointillé puis plein, pastille d'équipe, repère
		px(1, 8, 3, 3, encre);
		for (let i = 0; i < 9; i++) px(5 + i, 8 - i * 0.6, 1, 1, encre);
		for (let i = 0; i < 9; i += 2) px(14 + i, 2.6 - i * 0.1, 1, 1, '#8a7c60');
		px(13, 1.6, 2.4, 2.4, '#1f6feb');
		px(23, 0.5, 3, 3, rouge);
	} else if (n === 5) {
		// Menu à gauche avec badges rouges, zone de contenu
		for (let i = 0; i < 4; i++) {
			px(2, 1 + i * 2.7, 4, 2, i === 0 ? encre : '#b8ab8e');
			if (i === 1 || i === 2) px(5.4, 0.6 + i * 2.7, 1.6, 1.4, rouge);
		}
		px(9, 1, 16, 10, '#ffffff');
		px(10, 2, 9, 1, encre);
		px(10, 4, 13, 1, '#b8ab8e');
		px(10, 6, 11, 1, '#b8ab8e');
	} else {
		// Lune, horloge, flèche « Sortie »
		px(3, 1, 4, 4, '#f2c94c');
		px(4.5, 1, 3, 3, papier);
		px(11, 2, 5, 5, '#ffffff');
		px(13, 3, 1, 2, encre);
		px(13, 4, 2, 1, encre);
		px(19, 7, 6, 2, rouge);
		px(19, 6, 1, 4, rouge);
		px(18, 7.5, 1, 1, rouge);
	}
}
function etapeSuivante() {
	if (!tutoriel) return;
	if (tutoriel.etape >= ETAPES_TUTORIEL - 1) return fermerTutoriel();
	tutoriel.etape++;
	tutoriel.tourne = millis(); // la page tourne vers la gauche
	tutoriel.sens = 1;
	tutoriel.focus = 'suivant';
	Confort.Son.bip('choix');
	annoncerEtapeTutoriel();
}
function etapePrecedente() {
	if (!tutoriel || tutoriel.etape === 0) return;
	tutoriel.etape--;
	tutoriel.tourne = millis();
	tutoriel.sens = -1;
	annoncerEtapeTutoriel();
}
function dessinerTutoriel() {
	if (!tutoriel) return;
	boutons = []; // seul le tutoriel est cliquable
	voile();
	const n = tutoriel.etape + 1;
	// Le tutoriel est le livre « Aide » ouvert : couverture marine, page gauche = étape, page droite = texte
	const livre = dessinerLivreOuvert(L / 2 - 680, 120, 1360, 700, '#1c2f52', '#121f38');
	if (livre.pret) {
		const g = livre.gauche;
		const d = livre.droite;
		noStroke();
		textAlign(LEFT, TOP);
		textFont(POLICE_DONNEES);
		textSize(20);
		fill('#6b5d45');
		text(t('tuto.etape', { n, total: ETAPES_TUTORIEL }), g.x, g.y);
		// Prompt 112 : barre de progression cliquable (aller directement à une étape)
		for (let i = 0; i < ETAPES_TUTORIEL; i++) {
			const bx = g.x + i * 44;
			const survol = mouseX >= bx - 6 && mouseX <= bx + 38 && mouseY >= g.y + 26 && mouseY <= g.y + 70;
			fill(i <= tutoriel.etape ? '#1c2f52' : survol ? '#b8ab8e' : '#d9cfb8');
			rect(bx, g.y + 40, 32, 12, 4);
			boutons.push({ x: bx - 6, y: g.y + 26, l: 44, h: 44, action: () => allerEtapeTutoriel(i) });
		}
		fill('#1c2f52');
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(46);
		textLeading(56);
		text(t('tuto.' + n + '.titre'), g.x, g.y + 90, g.l, 200);
		textStyle(NORMAL);
		illustrationTutoriel(n, g.x, g.y + 236, g.l, g.h - 236 - 84); // prompt 112 : schéma de l'étape, dessiné par le code
		textSize(19);
		fill('#6b5d45');
		text(t('tuto.pied'), g.x, g.y + g.h - 60, g.l, 60);
		fill('#1c2733');
		textSize(23);
		textLeading(34);
		text(t('tuto.' + n + '.texte'), d.x, d.y, d.l, d.h - 110);
		// Prompt 112 : les touches de l'étape, à part, en police de données
		noStroke();
		fill('#e6dcc4');
		rect(d.x, d.y + d.h - 96, d.l, 96);
		textFont(POLICE_DONNEES);
		textSize(19);
		textLeading(28);
		fill('#3d3426');
		text(t('tuto.' + n + '.touches'), d.x + 16, d.y + d.h - 84, d.l - 32, 76);
		textFont(POLICE_TEXTE);
		textLeading(30);
		pageQuiTourne(livre, tutoriel.tourne, tutoriel.sens);
	}
	// Boutons sous le livre
	const by = 120 + 700 + 40;
	const lb = 300;
	const derniere = n === ETAPES_TUTORIEL;
	const pos = { passer: L / 2 - 680, precedent: L / 2 - 680 + 320, suivant: L / 2 + 680 - lb };
	bouton(pos.suivant, by, lb, 68, t(derniere ? 'tuto.terminer' : 'tuto.suivant'), etapeSuivante);
	bouton(pos.passer, by, lb, 68, t('tuto.passer'), fermerTutoriel, false, true);
	if (tutoriel.etape > 0) bouton(pos.precedent, by, lb, 68, t('tuto.precedent'), etapePrecedente, false, true);
	noFill();
	stroke('#f2c94c');
	strokeWeight(4);
	rect(pos[tutoriel.focus] - 8, by - 8, lb + 16, 84, 14);
	noStroke();
}

/** Clavier du tutoriel : Entrée = bouton focalisé, → suivant, ← précédent, Tab = focus, Échap = passer */
function toucheTutoriel() {
	if (!tutoriel) return false;
	const ordre = tutoriel.etape > 0 ? ['suivant', 'passer', 'precedent'] : ['suivant', 'passer'];
	if (keyCode === TAB) {
		const i = ordre.indexOf(tutoriel.focus);
		tutoriel.focus = ordre[(i + (keyIsDown(SHIFT) ? ordre.length - 1 : 1)) % ordre.length];
		annoncer(t('tuto.' + tutoriel.focus));
	} else if (keyCode === ESCAPE) fermerTutoriel();
	else if (keyCode === RIGHT_ARROW) etapeSuivante();
	else if (keyCode === LEFT_ARROW) etapePrecedente();
	else if (keyCode === ENTER || keyCode === RETURN || key === ' ') {
		if (tutoriel.focus === 'passer') fermerTutoriel();
		else if (tutoriel.focus === 'precedent') etapePrecedente();
		else etapeSuivante();
	}
	return true;
}

function dessinerSMS() {
	// Prompt 42 : plus d'écran plein : le téléphone tenu en main, devant la pièce
	dessinerTelephoneEnMain(contenuConversation);
}

// ——— Fenêtres du bureau : menu Échap (§ 1) ; les livres ouvrent l'aide (aide.js, prompt 172) ———
// Prompt 35 : menu Échap modernisé (même style que le menu principal)
let choixPause = 0;
// Prompt 124 : « Quitter la journée » et « Recommencer » ne sont plus dans le bandeau — ils sont ici (souris, toucher)
const journeeQuittable = () => ecran === 'jeu' && !!Jeu.horloge && !!(Jeu.jourCourant && Jeu.jourCourant()) && phase !== 'fin';
const TOUTES_ENTREES_PAUSE = [
	{ cle: 'menu.reprendre', icone: 'lecture', action: () => fermer() },
	{ cle: 'accueil.parametres', icone: 'reglages', action: () => (fenetre = 'parametres') },
	{ cle: 'mp.aide', icone: 'aide', action: () => (fenetre = 'aide') }, // prompt 122 : « Aide et tutoriel »
	{ cle: 'quitter.bouton', icone: 'retour', visible: journeeQuittable, action: () => (fermer(), quitterJourneeRapide()) },
	{ cle: 'jeu.recommencer', icone: 'plus', visible: () => ecran === 'jeu', action: () => (fenetre = 'reset') },
	{ cle: 'menu.menuPrincipal', icone: 'menu', action: () => quitterPartie() },
];
const entreesPause = () => TOUTES_ENTREES_PAUSE.filter((e) => !e.visible || e.visible());
function fenetreMenu() {
	const l = DS.fenetre.etroite; // prompt 173 (était 700)
	const ENTREES_PAUSE = entreesPause();
	const h = 160 + ENTREES_PAUSE.length * 112;
	if (choixPause >= ENTREES_PAUSE.length) choixPause = 0;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	noStroke();
	fill(13, 12, 12, 245);
	stroke(255, 255, 255, 38);
	strokeWeight(2);
	rect(x, y, l, h);
	noStroke();
	zoneFenetre(x, y, l, h); // prompt 173 : clic sur le fond
	dsTitre(t('menu.titre'), x + 48, y + 40, 44, '#ffffff', 'left');
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textSize(19);
	fill('rgba(255,255,255,0.78)');
	text(t('menu.temps'), x + 48, y + 104);
	ENTREES_PAUSE.forEach((e, i) => carteMenu(x + 48, y + 160 + i * 112, l - 96, 88, t(e.cle), null, e.action, i === choixPause, e.icone));
}

function quitterPartie() {
	if (ecran === 'jeu') Sauvegarde.auto(false); // prompt 35 : on retrouve la partie avec « Reprendre »
	fenetre = null;
	enSieste = false;
	reveil = null;
	retourAccueil();
}

// ——— Overlay de réveil (§ 4) ———
function dessinerReveil() {
	const reste = Math.max(0, reveil.limite - millis());
	voile();
	const l = DS.fenetre.etroite; // prompt 173 (était 720)
	const h = 300;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.rouge);
	textAlign(CENTER, TOP);
	noStroke();
	fill(C.rouge);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(40);
	text(t('reveil.titre'), L / 2, y + 36);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(22);
	fill(C.texte);
	text(t('reveil.reste', { s: (reste / 1000).toFixed(1).replace('.', Langue.actuelle === 'fr' ? ',' : '.') }), L / 2, y + 98);
	bouton(x + 120, y + 160, l - 240, 90, t('reveil.bouton'), seReveiller);
}

// ——— Personnage qui somnole au bureau (§ 4), en pixel art ———
function dessinerPersonnageSieste(g) {
	// Les paupières ne sont plus dessinées dans la pièce : voir dessinerSommeil (surcouche plein écran)
}

// ——— Sieste : paupières en surcouche plein écran, au-dessus de tout le contenu ———
// Fermeture (1,8 s) : les paupières tombent, le joueur lutte (elles se relèvent un peu), puis se ferment
// entièrement — plus rien du bureau, du PC ni de l'interface n'est visible. Ouverture (1 s) : les yeux
// s'entrouvrent, un clignement, puis s'ouvrent. Animations réduites : fondu au noir (0,4 s), sans mouvement.
const SOMMEIL = { k: 0, de: 0, vers: 0, debut: 0 };
const DUREE_FERMETURE_SIESTE = 1800;
const DUREE_OUVERTURE_SIESTE = 1000;
const DUREE_FONDU_SIESTE = 400;
const lisse = (a, b, u) => a + (b - a) * (u * u * (3 - 2 * u));
/** Profil de fermeture f(u), 0 → 1 : chute, sursaut, fermeture */
function profilFermeture(u) {
	if (u < 0.3) return lisse(0, 0.55, u / 0.3);
	if (u < 0.45) return lisse(0.55, 0.38, (u - 0.3) / 0.15);
	return lisse(0.38, 1, (u - 0.45) / 0.55);
}
/** Profil d'ouverture g(u), 1 → 0 : entrouverture, clignement, ouverture */
function profilOuverture(u) {
	if (u < 0.35) return lisse(1, 0.45, u / 0.35);
	if (u < 0.5) return lisse(0.45, 0.8, (u - 0.35) / 0.15);
	return lisse(0.8, 0, (u - 0.5) / 0.5);
}
function majSommeil() {
	const cible = ecran === 'jeu' && enSieste ? 1 : 0;
	const m = millis();
	if (cible !== SOMMEIL.vers) {
		SOMMEIL.de = SOMMEIL.k; // une animation interrompue repart de l'état courant
		SOMMEIL.vers = cible;
		SOMMEIL.debut = m;
	}
	const duree = reduireAnimations ? DUREE_FONDU_SIESTE : cible ? DUREE_FERMETURE_SIESTE : DUREE_OUVERTURE_SIESTE;
	const u = constrain((m - SOMMEIL.debut) / duree, 0, 1);
	if (reduireAnimations) SOMMEIL.k = SOMMEIL.de + (cible - SOMMEIL.de) * u;
	else if (cible) SOMMEIL.k = SOMMEIL.de + (1 - SOMMEIL.de) * profilFermeture(u);
	else SOMMEIL.k = SOMMEIL.de * profilOuverture(u);
	if (u >= 1) SOMMEIL.k = cible;
	return SOMMEIL.k;
}
/** Hauteur (px) de la paupière en x, pour un niveau k : bord bombé, pas de 8 px ; k = 1 couvre tout */
function hauteurPaupiere(x, k, hauteur, largeur) {
	const d = (x - largeur / 2) / (largeur / 2);
	const coins = 0.32 * hauteur * Math.sin(Math.PI * k) * d * d; // en amande : les coins se ferment avant le centre
	const h = k * (hauteur / 2 + 16) + coins;
	return Math.min(hauteur / 2 + 16, Math.ceil(h / 8) * 8);
}
/** Dessine les paupières sur un contexte 2D (canevas principal ou portrait) */
function paupieres(ctx, k, largeur, hauteur) {
	if (k <= 0.001) return;
	if (reduireAnimations) {
		ctx.fillStyle = 'rgba(10,8,7,' + Math.min(1, k).toFixed(3) + ')';
		ctx.fillRect(0, 0, largeur, hauteur);
		return;
	}
	const pas = 32;
	for (let x = 0; x < largeur; x += pas) {
		const h = hauteurPaupiere(x + pas / 2, k, hauteur, largeur);
		ctx.fillStyle = '#120c0a';
		ctx.fillRect(x, 0, pas, h);
		ctx.fillRect(x, hauteur - h, pas, h);
		if (h < hauteur / 2) {
			ctx.fillStyle = '#3a2a22'; // bord de paupière
			ctx.fillRect(x, h - 8, pas, 8);
			ctx.fillRect(x, hauteur - h, pas, 8);
			ctx.fillStyle = '#0a0605'; // cils
			ctx.fillRect(x + 6, h, 4, 8);
			ctx.fillRect(x + 20, h, 4, 6);
			ctx.fillRect(x + 6, hauteur - h - 6, 4, 6);
		}
	}
}
/** Surcouche de sieste sur le canevas principal (appelée dans draw, au-dessus du contenu) */
function dessinerSommeil() {
	const k = majSommeil();
	if (k <= 0.001) return;
	paupieres(drawingContext, k, L, H);
	if (k > 0.5 && phase !== 'reveil') boutons = []; // yeux fermés : rien de caché n'est cliquable (sauf « Se réveiller »)
	if (k >= 0.999) {
		// Yeux fermés : « Z » qui montent doucement, et une ligne pour comprendre ce qui se passe
		const n = reduireAnimations ? 3 : 1 + (Math.floor(millis() / 600) % 3);
		noStroke();
		for (let i = 0; i < n; i++) dsTitre('Z', L / 2 + 30 + i * 46, H / 2 - 40 - i * 52, 40 + i * 12, '#f7f1e1', 'center');
		textAlign(CENTER, TOP);
		textFont(POLICE_TEXTE);
		textSize(22);
		fill('rgba(255,255,255,0.75)');
		text(t(SOMNO.forcee ? 'sieste.forcee' : 'surv.sieste'), L / 2, H / 2 + 70);
		textAlign(LEFT, TOP);
		// Prompt 78 : se réveiller (Espace, Entrée, Z ou clic) — le temps file ×100 tant qu'on dort
		if (phase !== 'reveil') bouton(L / 2 - 200, H / 2 + 130, 400, 72, t('sieste.reveiller'), reveiller);
	}
}

// ——— Livres posés sur le plateau (§ 7) : placeholder pixel art (dos + titre) ———
function dessinerLivres(g) {
	const t = OBJETS_BUREAU[1];
	const s = OBJETS_BUREAU[2];
	const tps = reduireAnimations ? 0 : millis();
	// Livre survolé ou focalisé : il se soulève de 2 px (ombre dessous) ; animations réduites : 1 px, sans transition
	const leve = (o) => (vue === 'bureau' && objetSurvol === o.nom ? (reduireAnimations ? 1 : 2) : 0);
	const lc = leve(t);
	const ls = leve(s);
	if (typeof objetPresent === 'function' && !objetPresent('aide')) return; // prompt 104 : les livres arrivent au fil des journées
	ombreObjet(g, t.x, t.y + t.h, t.l + lc); // prompt 51 : ombre portée des livres (même trame que le téléphone)
	// Livre « Aide » (dessous, prompt 70 : ex-« Commande ») : couverture marine, liseré doré, marque-page qui se balance
	const yc = t.y - lc;
	boite(g, t.x, yc, t.l, t.h, '#1c2f52', '#34507f', '#121f38');
	px(g, '#d9b45a', t.x + 2, yc + 1, 1, t.h - 2);
	textePixel(g, 'AIDE', t.x + 18, yc + 2, '#fff8e6'); // prompt 70 : titre centré sur la couverture
	const balance = Math.round(Math.sin(tps / 650) * 1);
	px(g, '#b3261e', t.x + t.l - 8 + balance, yc + t.h, 2, 4);
	// Livre « stress » (dessus) — prompt 104 : à partir de la 5e journée
	if (typeof objetPresent === 'function' && !objetPresent('stress')) return;
	if (ls) ombreTramee(g, s.x, s.y + s.h - lc, s.l, 1, 90); // livre du dessus soulevé : ombre sur l'autre livre
	const ys = s.y - ls - lc; // posé sur l'autre : il suit aussi le soulèvement du livre du dessous
	boite(g, s.x, ys, s.l, s.h, '#3f7a43', '#5f9e4f', '#2f5d3a');
	textePixel(g, 'STRESS', s.x + 10, ys + 2, '#f7f1e1');
}

// ——— Livres : soulevés au survol, ouverts en vrai livre (deux pages) quand on les clique ———
let objetSurvol = null; // objet survolé ou focalisé à l'image précédente
let livreOuverture = 0; // millis() de l'ouverture du livre affiché
const DUREE_OUVERTURE_LIVRE = 450;
const DUREE_PAGE = 380;

/** Dessine un livre ouvert (couverture, deux pages, dos, tranches, marque-page) ; s'ouvre depuis le dos.
 *  Renvoie les zones de texte des deux pages et « pret » quand l'ouverture est assez avancée pour écrire. */
function dessinerLivreOuvert(x, y, l, h, couv, couvSombre) {
	const k = reduireAnimations ? 1 : easeOut(constrain((millis() - livreOuverture) / DUREE_OUVERTURE_LIVRE, 0, 1));
	const cx = x + l / 2;
	const demi = (l / 2) * Math.max(0.04, k);
	noStroke();
	fill(0, 0, 0, 70);
	rect(cx - demi + 14, y + 22, demi * 2, h, 14); // ombre portée
	fill(couvSombre);
	rect(cx - demi - 6, y - 6, demi * 2 + 12, h + 16, 12); // couverture
	fill(couv);
	rect(cx - demi, y - 10, demi * 2, h + 12, 10);
	// Tranches (feuilles empilées) puis pages
	for (let i = 3; i >= 1; i--) {
		fill(i % 2 ? '#e8dfc9' : '#f3ecda');
		rect(cx - demi + 12 + i * 2, y + 8 + i * 3, demi * 2 - 24 - i * 4, h - 22, 4);
	}
	fill('#fbf6ea');
	rect(cx - demi + 12, y + 6, demi - 12, h - 20, 6, 0, 0, 6);
	rect(cx, y + 6, demi - 12, h - 20, 0, 6, 6, 0);
	// Creux du dos : ombre douce au centre
	for (let i = 0; i < 6; i++) {
		fill(80, 60, 30, 26 - i * 4);
		rect(cx - 18 + i * 3, y + 6, 36 - i * 6, h - 20);
	}
	// Marque-page (ruban) qui dépasse en bas de la page droite
	fill('#b3261e');
	rect(cx + demi * 0.55, y + h - 20, 14, 46);
	triangle(cx + demi * 0.55, y + h + 26, cx + demi * 0.55 + 14, y + h + 26, cx + demi * 0.55 + 7, y + h + 16);
	const marge = 64;
	return {
		pret: k > 0.85,
		k,
		cx,
		y,
		h,
		demi,
		gauche: { x: cx - demi + 12 + marge, y: y + 60, l: demi - 12 - marge * 2, h: h - 140 },
		droite: { x: cx + marge, y: y + 60, l: demi - 12 - marge * 2, h: h - 140 },
	};
}

/** Une page qui tourne (vers la gauche si sens = 1) : la feuille se replie sur le dos puis retombe de l'autre côté */
function pageQuiTourne(livre, debut, sens) {
	if (reduireAnimations || !debut) return;
	const u = (millis() - debut) / DUREE_PAGE;
	if (u >= 1) return;
	const largeur = (livre.demi - 12) * Math.abs(1 - 2 * u); // 1 → 0 → 1
	const premiereMoitie = u < 0.5;
	const aDroite = sens > 0 ? premiereMoitie : !premiereMoitie;
	noStroke();
	fill(80, 60, 30, 40);
	rect(aDroite ? livre.cx : livre.cx - largeur - 8, livre.y + 6, largeur + 8, livre.h - 20); // ombre de la feuille
	fill('#fbf6ea');
	rect(aDroite ? livre.cx : livre.cx - largeur, livre.y + 6, largeur, livre.h - 20);
}

function ouvrirObjetBureau(nom) {
	interaction();
	if (nom === 'ecran') return sAsseoir();
	if (nom === 'sortie') return quitterBureau(); // prompt 69
	if (nom === 'rapport') return ouvrirRapport(); // prompt 41
	if (nom === 'telephone') return ouvrirTelephone(); // prompt 38 : notifications de l'Agenda Nantes Métropole
	if (nom === 'aide' || nom === 'stress') return ouvrir('aide'); // prompt 172 : les livres ouvrent la fenêtre d'aide illustrée (le tutoriel s'y lance, touche T)
	if (nom === 'horloge') return clicHorloge(); // prompt 51
	if (nom === 'tasse') return boireCafe(); // prompt 52 : le café en main, puis le boost
	if (nom === 'micro') return clicMicro(); // prompt 54 : push-to-talk
	if (nom === 'webcam') return clicWebcam(); // prompt 57 : présence
	if (OBJETS_BUREAU.some((o) => o.nom === nom && o.piece)) return interagirPiece(nom); // prompt 29
}

/** Zones cliquables du bureau (livres) + focus clavier ; appelé par la vue bureau */
function zonesObjetsBureau() {
	objetSurvol = null;
	OBJETS_BUREAU.slice(1).forEach((o, i) => {
		if (o.visible && !o.visible()) return; // prompt 41 : le rapport n'existe qu'en fin de semaine
		const r = versEcranBureau(o.x, o.y, o.l, o.h, COEF_OBJETS[o.nom]); // prompt 25/40 : suit la caméra et le plan de l'objet
		if (o.nom === 'aide') cibleGuide('livreAide', r.x, r.y, r.l, r.h); // prompt 37
		boutons.push({ x: r.x, y: r.y, l: r.l, h: r.h, action: () => ouvrirObjetBureau(o.nom) });
		const survol = mouseX >= r.x && mouseX <= r.x + r.l && mouseY >= r.y && mouseY <= r.y + r.h;
		if (survol || focusBureau === i + 1) objetSurvol = o.nom; // les livres se soulèvent (dessinerLivres)
		const enReaction = PIECE.message && PIECE.message.objet === o.nom && millis() < PIECE.message.jusqua; // prompt 29
		if (survol || focusBureau === i + 1) {
			contourSurvol(r.x - 2 * PIX, r.y - 2 * PIX, r.l + 4 * PIX, r.h + 4 * PIX);
			const ib = o.infobulle ? String(o.infobulle) : t('objet.ouvrir', { label: o.label });
			if (!enReaction) infobulle(ib, Math.max(16, Math.min(r.x, L - textWidth(ib) - 60)), r.y < 120 ? r.y + r.h + 24 : r.y - 70);
		}
	});
	// Prompt 29 : réaction de l'objet (5 s), au-dessus de l'objet, sans pause ni effet sur les jauges
	if (PIECE.message && millis() < PIECE.message.jusqua) {
		const o = OBJETS_BUREAU.find((x) => x.nom === PIECE.message.objet);
		const r = versEcranBureau(o.x, o.y, o.l, o.h, COEF_OBJETS[o.nom]);
		bulleTexte(PIECE.message.texte, r.x + r.l / 2, r.y < 160 ? r.y + r.h + 20 : r.y - 20, r.y < 160);
	}
	if (focusBureau === 0) {
		const e = rectEcranPC();
		contourSurvol(e.x - 7 * PIX, e.y - 7 * PIX, e.l + 14 * PIX, e.h + 15 * PIX);
	}
}

/** Bulle de texte multiligne (max 560 px), centrée sur x ; au-dessus de y, ou en dessous si dessous = true */
function bulleTexte(texte, x, y, dessous) {
	textFont(POLICE_DONNEES);
	textSize(18);
	const l = Math.min(560, textWidth(texte) + 32);
	const lignes = Math.max(1, Math.ceil((textWidth(texte) * 1.08) / (l - 32))); // marge pour le retour à la ligne par mots
	const h = 20 + lignes * 24;
	const bx = constrain(x - l / 2, 16, L - l - 16);
	const by = dessous ? y : y - h;
	noStroke();
	fill(13, 12, 12, 240);
	rect(bx, by, l, h);
	fill('#FFFFFF');
	textAlign(LEFT, TOP);
	textLeading(24);
	text(texte, bx + 16, by + 10, l - 32, h - 10);
}

function infobulle(texte, x, y) {
	textFont(POLICE_DONNEES);
	textSize(18);
	const l = textWidth(texte) + 28;
	noStroke();
	fill(13, 12, 12, 235);
	rect(x, y, l, 40);
	fill('#FFFFFF');
	textAlign(LEFT, CENTER);
	zoneTexteDebut('infobulle', x, y, l, 40); // prompt 93
	text(texte, x + 14, y + 20);
	zoneTexteFin();
}

// =====================================================================
// Prompt 74 — comprendre le poste, et une journée qui « vit » (rythme.js : logique pure, reproductible)
// =====================================================================
const FIL = { messages: [], serieDepuis: 0, rythmeFaits: {}, jourCle: '' };
/** Remise à zéro pour une nouvelle partie (le mélange des arrivées est fait juste après Jeu.nouvellePartie) */
function nouvellePartieRythme() {
	Rythme.clamperDebut(); // prompt 76 : aucun dossier avant 8 h
	Rythme.melangerArrivees();
	if (typeof Taches !== 'undefined') {
		const R = Confort.Reglages;
		Taches.nouvellePartie({ chaines: R.chaines, deblocages: R.deblocages, arbitrage: R.arbitrage }); // prompt 88 : tâches de la partie (thèmes, crise, options du groupe)
		Taches.matin(); // consigne du thème du premier jour
	}
	FIL.messages = [];
	FIL.serieDepuis = 0;
	FIL.rythmeFaits = {};
	FIL.jourCle = '';
}
/** Ajoute une ligne au fil de la journée (texte traduit au dessin) ; annoncée en aria-live */
function ajouterFil(m, sorte) {
	if (!m) return;
	FIL.messages.push({ cle: m.cle, vars: m.vars, sorte: sorte || 'info', heure: Jeu.horloge ? Jeu.formaterHeure(Jeu.horloge.minutes) : '' });
	if (FIL.messages.length > 6) FIL.messages.shift();
	annoncer(t(m.cle, m.vars));
}
/** Début de journée : bilan de la veille (chiffres réels) */
function filDebutJournee() {
	ajouterFil(Rythme.bilanVeille(), 'veille'); // prompt 183 : l'objectif du jour n'est plus répété ici (bandeau)
}
/** Après chaque décision : texte de liaison (après la narration) */
function filApresDecision() {
	if (Jeu.index <= 0) return;
	const prec = FIL.messages.filter((m) => m.sorte === 'liaison').pop();
	const n = dernierResultat ? Jeu.paquet.indexOf(dernierResultat.dossier) : Jeu.index - 1; // prompt 77 : d'autres dossiers ont pu être réglés en arrière-plan
	ajouterFil(Rythme.liaison(n, prec && prec.cle), 'liaison');
}
/** Une fois par image : événements de rythme à heures fixes (une fois par jour, jamais rejoués à la reprise) */
function majRythme() {
	if (ecran !== 'jeu' || !Jeu.horloge || !Jeu.jourCourant || !Jeu.jourCourant() || phase === 'fin') return;
	const cle = (Jeu.etat.semaine ? Jeu.etat.semaine.lundi : Jeu.etat.mode) + '|' + Jeu.jourIndex;
	const h = Math.floor(Jeu.horloge.minutes / 60);
	if (FIL.jourCle !== cle) {
		// Nouvelle journée (ou reprise) : les heures déjà passées ne sont pas rejouées
		FIL.jourCle = cle;
		Object.keys(Rythme.HEURES).forEach((x) => (FIL.rythmeFaits[cle + '|' + x] = Number(x) <= h && Jeu.horloge.minutes > Jeu.debutJournee() + 1));
	}
	Object.keys(Rythme.HEURES).forEach((x) => {
		const k = cle + '|' + x;
		if (FIL.rythmeFaits[k] || h < Number(x)) return;
		FIL.rythmeFaits[k] = true;
		ajouterFil(Rythme.rythme(Number(x)), 'rythme');
		Confort.Son.bip('choix');
	});
}
/** Après chaque décision : série de 2 bonnes ou 2 ratées → mot du patron (présentation seule, aucun effet) */
function verifierSerie() {
	const s = Rythme.serie(Jeu.evenementsJournee, FIL.serieDepuis);
	if (!s) return;
	FIL.serieDepuis = (Jeu.evenementsJournee || []).length; // la série repart à zéro
	if (Jeu.messagePatron) Jeu.messagePatron(T(s.cle), s.sorte === 'courage' ? 'conseil' : 'info');
	ajouterFil({ cle: s.cle, vars: {} }, s.sorte);
}
/** Fil de la journée, dans le panneau d'attente : objectif, bilan, liaisons, rythme, séries (les plus récents en bas) */
function dessinerFil(x, y, l, h) {
	const couleurs = { veille: C.gris, liaison: C.texte, rythme: C.orange, bravo: C.vert, courage: C.orange, info: C.texte };
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(20);
	fill(C.texte);
	text(t('fil.titre'), x, y);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(17);
	textLeading(22);
	let yy = y + 34;
	const liste = FIL.messages.slice(-4);
	if (!liste.length) {
		fill(C.gris);
		text(t('fil.vide'), x, yy, l, 44);
		return;
	}
	liste.forEach((m) => {
		const txt = (m.heure ? m.heure + ' · ' : '') + t(m.cle, m.vars);
		const n = Math.min(3, Math.ceil((textWidth(txt) * 1.08) / l));
		if (yy + n * 22 > y + h) return;
		fill(couleurs[m.sorte] || C.texte);
		text(txt, x, yy, l, n * 22 + 4);
		yy += n * 22 + 10;
	});
}

// Fenêtre « Votre poste » (prompts 74 / 131 / 161) supprimée le 12/11/2026 à la demande du groupe : le guide
// « Prendre en main » (coché à la 1re partie) et l'aide (H) présentent les gestes.
/** Prompt 87 : hors défi chrono, l'horloge du jeu s'arrête pendant la lecture d'un signalement ouvert (panneau de décision
 * affiché) ; elle tourne sur la liste, dans les autres applis et au bureau. */
function lecturePanneau() {
	return !Jeu.defiChrono && typeof PHASES_ACTIVES !== 'undefined' && PHASES_ACTIVES.includes(phase) && vue === 'poste' && PC.etat === 'appli';
}
