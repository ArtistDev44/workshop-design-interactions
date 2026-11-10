/* Nantes en régulation — prompt 51 : finir sa journée à l'horloge, sablier, lumière de la pièce, ombres.
 * - À l'heure de fin, l'horloge s'arrête : un clic sur l'horloge murale termine la journée (mail du soir).
 * - Avant l'heure : alerte « journée pas finie » ; partir quand même → dossiers restants réglés par la règle
 *   « non traité » (Q25), et le lendemain un mail du patron mis en avant retire de la réputation (game.js).
 * - Sablier sur le bureau : entre deux dossiers, il fait passer le temps jusqu'au suivant (ou jusqu'à la fin).
 * - Lumière : lampe éteinte et stores baissés assombrissent vraiment la pièce et le bureau, selon l'heure ;
 *   l'écran du PC devient la source de lumière (halo). Ombres portées des objets selon la lumière.
 */
const JOURNEE = { finAnnoncee: false };
const SABLIER = { x: 304, y: 170, l: 11, h: 19, actif: false, debut: 0, retourne: 0 };
const SABLIER_VITESSE = 14; // le temps file 14 fois plus vite que l'attente accélérée (×30) tant que le sable coule

// ——— Horloge : terminer la journée ———
function clicHorloge() {
	interaction();
	if (ecran !== 'jeu' || !Jeu.horloge || !Jeu.jourCourant || !Jeu.jourCourant()) return messagePiece('horloge', t('horloge.libre', { heure: texteHeure() }));
	if (phase === 'mail') return messagePiece('horloge', t('horloge.mail'));
	if (phase === 'soir') return messagePiece('horloge', t('soir.annonce')); // prompt 69
	if (phase === 'fin') return;
	if (Jeu.journeeFinie() && phase === 'attente') return terminerJournee();
	ouvrir('partir');
	annoncer(t('partir.titre') + ' ' + textePartir());
}
function texteHeure() {
	const h = heureAffichee();
	return String(h.h).padStart(2, '0') + ':' + String(h.m).padStart(2, '0');
}
function messagePiece(objet, texte) {
	PIECE.message = { texte, objet, jusqua: millis() + 5000 };
	annoncer(texte);
}
/** Fin normale : objectif du jour, mail du soir (comme avant le prompt 51, mais au clic sur l'horloge) */
function terminerJournee() {
	if (Jeu.finDeJourneeTactique) Jeu.finDeJourneeTactique();
	phase = 'mail';
	enSieste = false;
	SABLIER.actif = false;
	JOURNEE.finAnnoncee = false;
	Confort.Son.bip('mail');
	Sauvegarde.auto(true);
	annoncer(t('horloge.fin'));
}
function textePartir() {
	return t('partir.texte', { n: Jeu.dossiersRestantsDuJour(), fin: Jeu.formaterHeure(Jeu.finJournee()), heure: texteHeure(), malus: Jeu.MALUS_DEPART });
}
function partirQuandMeme() {
	fenetre = null;
	if (vue === 'poste') seLever();
	Jeu.partirAvantLaFin(texteHeure());
	SABLIER.actif = false;
	JOURNEE.finAnnoncee = false;
	Confort.Son.bip('consequence');
	if (Jeu.terminee) return allerFin();
	terminerJournee();
}
function fenetrePartir() {
	const l = 1000;
	const h = 440;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.orange);
	noStroke();
	fill(C.orange);
	rect(x, y, 12, h);
	dsTitre(t('partir.titre'), x + 56, y + 40, 48, C.texte, 'left');
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textSize(24);
	textLeading(34);
	fill(C.texte);
	text(textePartir(), x + 56, y + 124, l - 112, 160);
	bouton(x + 56, y + h - 112, 400, 72, t('partir.rester'), fermer);
	bouton(x + l - 56 - 420, y + h - 112, 420, 72, t('partir.partir'), partirQuandMeme, false, true);
}

// ——— Le lendemain : mail du patron mis en avant ———
function verifierBlame() {
	if (!Jeu.blame || Jeu.blame.lu || fenetre || smsActif || tutoriel || TRANSITION_JOUR || MENU.actif || ecran !== 'jeu') return false;
	ouvrir('blame');
	Confort.Son.bip('alerte');
	annoncer(t('blame.titre') + '. ' + String(Jeu.blame.texte));
	return true;
}
function fenetreBlame() {
	const b = Jeu.blame;
	if (!b) return fermer();
	const l = 1100;
	const h = 560;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	noStroke();
	fill(C.primaire);
	rect(x, y, l, 56);
	textAlign(LEFT, CENTER);
	textFont(POLICE_DONNEES);
	textSize(20);
	fill('#ffffff');
	text(t('blame.bandeau'), x + 32, y + 28);
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(C.gris);
	text(t('blame.entete', { malus: b.malus }), x + 40, y + 80);
	dsTitre(t('blame.titre'), x + 40, y + 116, 44, C.texte, 'left');
	noStroke();
	textFont(POLICE_TEXTE);
	textSize(24);
	textLeading(34);
	fill(C.texte);
	textAlign(LEFT, TOP);
	text(String(b.texte), x + 40, y + 190, l - 80, 220);
	bouton(x + l - 40 - 360, y + h - 104, 360, 68, t('blame.lu'), lireBlame);
}
function lireBlame() {
	if (Jeu.blame) Jeu.blame.lu = true;
	fermer();
	Sauvegarde.auto(false);
}
function toucheJournee() {
	// Prompt 56 : mail du dernier soir, pages du rapport
	if (fenetre === 'mailFin') {
		if (keyCode === ENTER || keyCode === RETURN || keyCode === ESCAPE) fermerMailFin();
		return true;
	}
	if (fenetre === 'rapport' && keyCode === TAB) return changerPageRapport(), true;
	if (fenetre === 'cafe') return true; // prompt 52 : on boit, le clavier attend
	if (fenetre === 'partir') {
		if (keyCode === ESCAPE) fermer();
		else if (keyCode === ENTER || keyCode === RETURN) partirQuandMeme();
		return true;
	}
	if (fenetre === 'blame') {
		if (keyCode === ENTER || keyCode === RETURN || keyCode === ESCAPE) lireBlame();
		return true;
	}
	return false;
}

// ——— Boucle : fin de journée atteinte (l'horloge s'arrête) ———
/** Appelée par avancerTemps quand il n'y a plus de dossier et que l'heure de fin est atteinte */
function finJourneeAtteinte() {
	Jeu.horloge.minutes = Jeu.finJournee(); // l'horloge s'arrête sur l'heure de fin
	SABLIER.actif = false;
	if (!JOURNEE.finAnnoncee) {
		JOURNEE.finAnnoncee = true;
		Confort.Son.bip('mail');
		annoncer(t('horloge.finAtteinte', { fin: Jeu.formaterHeure(Jeu.finJournee()) }));
	}
}

// ——— Sablier : faire passer le temps entre deux dossiers ———
function clicSablier() {
	interaction();
	if (ecran !== 'jeu' || !Jeu.horloge) return messagePiece('sablier', t('sablier.libre'));
	if (phase !== 'attente') return messagePiece('sablier', t('sablier.occupe'));
	if (Jeu.journeeFinie()) return messagePiece('sablier', t('sablier.fini'));
	SABLIER.actif = !SABLIER.actif;
	SABLIER.retourne = millis();
	Confort.Son.clic();
	messagePiece('sablier', t(SABLIER.actif ? 'sablier.on' : 'sablier.off'));
}
/** Multiplicateur de temps appliqué par avancerTemps */
function facteurSablier() {
	if (!SABLIER.actif) return 1;
	if (phase !== 'attente' || enSieste) {
		SABLIER.actif = false; // un dossier arrive : le sable s'arrête
		return 1;
	}
	return SABLIER_VITESSE;
}
function dessinerSablier(g) {
	const s = SABLIER;
	ombreObjet(g, s.x - 1, s.y + s.h, s.l + 3);
	const verre = '#cfe3ee';
	const bois = '#7a4a2a';
	px(g, bois, s.x - 1, s.y, s.l + 2, 2); // socle haut
	px(g, bois, s.x - 1, s.y + s.h - 2, s.l + 2, 2); // socle bas
	px(g, '#5a3420', s.x, s.y + 2, 1, s.h - 4); // montants
	px(g, '#5a3420', s.x + s.l - 1, s.y + 2, 1, s.h - 4);
	const mi = s.y + Math.floor(s.h / 2);
	for (let y = s.y + 2; y < s.y + s.h - 2; y++) {
		const d = Math.abs(y - mi);
		const demi = Math.max(1, Math.round(d * 0.55));
		px(g, verre, s.x + Math.floor(s.l / 2) - demi, y, demi * 2 + 1, 1);
	}
	// Sable : il coule quand le sablier tourne ; sinon il repose en bas
	// Prompt 53 : sous 10 s de compteur, le sablier s'emballe (le sable tombe de plus en plus vite)
	const urg = typeof urgenceCompteur === 'function' ? urgenceCompteur() : 0;
	const coule = (s.actif || urg > 0) && !reduireAnimations;
	const periode = urg > 0 ? 1600 - urg * 1200 : 4000;
	const p = coule ? ((millis() - (urg > 0 ? 0 : s.retourne)) / periode) % 1 : 1;
	const sable = '#e2b25a';
	const haut = Math.round((1 - p) * 5);
	const bas = Math.round(p * 5);
	for (let k = 0; k < haut; k++) px(g, sable, s.x + Math.floor(s.l / 2) - 2 + Math.floor(k / 3), mi - 2 - k, 5 - Math.floor(k / 2), 1);
	for (let k = 0; k < bas; k++) px(g, sable, s.x + 2 + Math.floor(k / 3), s.y + s.h - 3 - k, s.l - 4 - Math.floor(k / 2) * 2, 1);
	if (coule && Math.floor(millis() / (urg > 0 ? 60 : 120)) % 2) px(g, sable, s.x + Math.floor(s.l / 2), mi - 1, 1, 4); // filet de sable
	else if (s.actif) px(g, sable, s.x + Math.floor(s.l / 2), mi, 1, 3);
}

// ——— Lumière de la pièce : jour / nuit, stores, lampe ; l'écran éclaire le bureau dans le noir ———
const ECLAIRAGE = { v: null, t: 0 };
/** Lumière de la pièce entre 0 (noir) et 1 : jour (atténué par les stores) + lampe + un peu de lumière ambiante */
function lumiereCible() {
	const nuit = METEO_VISU.nuit === null ? facteurNuit() : METEO_VISU.nuit;
	const jour = (1 - nuit) * (PIECE.store ? 0.35 : 1);
	const ville = phase === 'soir' ? 0.3 : 0.12; // prompt 69 : le soir, plafonnier éteint, la ville éclaire la pièce (lisible)
	return constrain(ville + jour * 0.8 + (PIECE.lampe ? 0.45 : 0), 0, 1);
}
function lumierePiece() {
	const cible = lumiereCible();
	const m = millis();
	if (ECLAIRAGE.v === null || reduireAnimations) ECLAIRAGE.v = cible;
	else ECLAIRAGE.v += (cible - ECLAIRAGE.v) * (1 - Math.exp(-Math.min(500, m - ECLAIRAGE.t) / 600)); // fondu ≈ 1 s
	ECLAIRAGE.t = m;
	return ECLAIRAGE.v;
}
/** Voile d'obscurité sur toute la pièce (l'écran du PC, dessiné après, n'est pas touché) + halo de l'écran */
function dessinerEclairage(g) {
	const v = lumierePiece();
	const nuit = 1 - v;
	if (nuit > 0.01) {
		g.fill(5, 7, 16, Math.round(nuit * 215)); // voile bleu nuit profond (les murs blancs ne doivent pas paraître brumeux)
		g.rect(0, 0, BW, BH);
	}
	const veille = phase === 'soir' ? 0.35 : 1; // prompt 69 : PC en veille, faible halo
	if (nuit > 0.15) {
		// Halo de l'écran sur le plateau et le clavier : anneaux successifs (pixel art, pas de dégradé lisse)
		const cx = ECRAN_PC.x + ECRAN_PC.l / 2;
		const cy = ECRAN_PC.y + ECRAN_PC.h + 18;
		for (let r = 5; r >= 1; r--) {
			g.fill(150, 190, 255, Math.round((nuit - 0.15) * 26 * veille));
			g.ellipse(cx, cy, ECRAN_PC.l * (0.5 + r * 0.22), 34 + r * 16);
		}
		g.fill(170, 205, 255, Math.round((nuit - 0.15) * 40 * veille));
		g.rect(ECRAN_PC.x - 4, ECRAN_PC.y - 4, ECRAN_PC.l + 8, ECRAN_PC.h + 8); // lueur autour de l'écran
	}
	if (PIECE.lampe && nuit > 0.1) {
		// Sous l'applique allumée, le mur reste éclairé
		const lampe = OBJETS_BUREAU.find((o) => o.nom === 'lampe');
		g.fill(255, 226, 160, Math.round(nuit * 60));
		g.quad(lampe.x - 6, lampe.y + lampe.h, lampe.x + lampe.l + 6, lampe.y + lampe.h, lampe.x + lampe.l + 22, BAIE_BAS, lampe.x - 22, BAIE_BAS);
	}
}
/** Ombre portée commune (livres, plante, dossiers, tasse, sablier) : même trame que le téléphone et la souris.
 * Plus marquée sous la lampe ; plus diffuse (plus large, plus claire) stores baissés. */
function ombreObjet(g, x, y, l) {
	const diffuse = PIECE.store && !PIECE.lampe;
	const alpha = PIECE.lampe ? 115 : diffuse ? 60 : 90;
	ombreTramee(g, x + 1, y, l, diffuse ? 3 : 2, alpha);
}

// ——— Prompt 55 : ralenti tactique (logique dans game.js : une fois par journée, 10 s) ———
let derniereImageCompteur = 0;
function demanderRalentiUI() {
	if (!['decision', 'contradiction', 'conflit'].includes(phase)) return;
	if (Jeu.ralentiActif(millis())) return;
	if (!Jeu.demanderRalenti(millis())) {
		Confort.Son.bip('alerte');
		return annoncer(t('ralenti.deja'));
	}
	Confort.Son.clic();
	annoncer(t('ralenti.on'));
}
/** Appelée à chaque image du dossier : pendant le ralenti, on repousse le début du compteur (il ne descend plus) */
function figerCompteurRalenti() {
	const m = millis();
	if (derniereImageCompteur && Jeu.ralentiActif && Jeu.ralentiActif(m)) {
		const dt = Math.min(250, m - derniereImageCompteur);
		debutCompteur += dt;
		arriveeDossier = Math.min(arriveeDossier, m - 2000); // pas de nouvelle animation d'arrivée
	}
	derniereImageCompteur = m;
}
function dessinerRalenti(x, base) {
	const m = millis();
	textFont(POLICE_DONNEES);
	textAlign(LEFT, TOP);
	if (Jeu.ralentiActif(m)) {
		const reste = Math.ceil((Jeu.ralenti.fin - m) / 1000);
		if (!reduireAnimations) {
			noStroke();
			fill(70, 120, 200, 40 + 25 * Math.sin(m / 400)); // voile bleu discret sur le dossier
			rect(x, base.y, base.l, base.h);
		}
		fill(13, 12, 12, 235);
		rect(x + base.l / 2 - 170, base.y + 4, 340, 34);
		fill('#ffffff');
		textSize(18);
		textAlign(CENTER, CENTER);
		text(t('ralenti.pause', { s: reste }), x + base.l / 2, base.y + 21);
		textAlign(LEFT, TOP);
		return;
	}
	if (Jeu.ralentiDisponible()) bouton(x + base.l - 250, base.y + 40, 170, 32, t('ralenti.bouton'), demanderRalentiUI, false, true); // entre l'en-tête et les secondes
}
