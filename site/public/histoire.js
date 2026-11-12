/* Nantes en régulation — mode histoire, rapport papier et cinématiques de fin (prompt 41).
 * Mode histoire : semaine réelle « facile » → « normale » → « difficile » ; la semaine 3 ajoute imprévus et conflits
 * de lignes (les équipes sont là dès la semaine 1, prompt 108) ; mode temps réel débloqué quand l'histoire est terminée. Le bilan de chaque semaine est une feuille
 * imprimée posée sur la table ; le dernier est remplacé par une cinématique (bonne / moyenne / mauvaise fin).
 * Tous les chiffres affichés sont ceux de la partie jouée. Tout est dessiné par le code ; textes via t().
 */
const CLE_HISTOIRE = 'pxe-nte001-histoire';
const ELEMENTS_CHAPITRE = { 1: 'plaintes', 2: 'equipes', 3: 'crise' };
/** Prompt 161 : élément réellement nouveau au chapitre n — seul « crise » reste verrouillé avant la semaine 3
 * (Jeu.elementDebloque) ; les équipes sont actives dès la semaine 1 depuis le prompt 108. */
const elementNouveauChapitre = (n) => (n > 1 && ELEMENTS_CHAPITRE[n] === 'crise' ? 'crise' : null);
/** Prompt 161 : « un signalement à la fois » / « jusqu'à n signalements en même temps » (texte différé) */
const texteActifs = (n) => (n === 1 ? T('mp.actifs.un') : T('mp.actifs.plusieurs', { n }));
/** Niveau de difficulté de la semaine n du mode histoire (index des semaines) */
function niveauChapitre(n) {
	const lundi = semainesHistoire()[n - 1];
	const s = Jeu.semainesProposees().find((x) => x.lundi === lundi);
	return (s && s.niveau) || 'normale';
}

function progressionHistoire() {
	try {
		const o = JSON.parse(localStorage.getItem(CLE_HISTOIRE) || 'null');
		if (o && typeof o === 'object') return Object.assign({ termine: false, scores: {} }, o);
	} catch (e) {}
	return { termine: false, scores: {} };
}
function enregistrerProgression(p) {
	try {
		localStorage.setItem(CLE_HISTOIRE, JSON.stringify(p));
	} catch (e) {}
}
const tempsReelDebloque = () => progressionHistoire().termine;

/** Les trois semaines réelles dans l'ordre de l'histoire : facile, normale, difficile */
function semainesHistoire() {
	const ordre = { facile: 1, normale: 2, difficile: 3 };
	return Jeu.semainesProposees()
		.slice()
		.sort((a, b) => (ordre[a.niveau] || 9) - (ordre[b.niveau] || 9))
		.map((s) => s.lundi);
}
/** Chapitre (1 à 3) de la partie en cours, d'après sa semaine ; 0 en temps réel / hors ligne */
function chapitreCourant() {
	const e = Jeu.etat;
	if (!e || e.mode !== 'semaine' || !e.semaine) return 0;
	return semainesHistoire().indexOf(e.semaine.lundi) + 1;
}
// Éléments de jeu débloqués selon le chapitre (en temps réel, tout est actif)
Jeu.elementDebloque = function (nom) {
	const ch = chapitreCourant();
	if (!ch) return true;
	if (nom === 'equipes') return true; // prompt 108 : les équipes sont le geste principal de l'appli, dès la semaine 1 (avant : chapitre 2)
	if (nom === 'crise') return ch >= 3;
	return true;
};

/** Semaine 1 assouplie (prise de poste) : les bonus d'objectif du jour valent ×1,5 */
Jeu.facteurBonusObjectif = () => (chapitreCourant() === 1 ? 1.5 : 1);

/** Lance le chapitre n (1, 2 ou 3) : nouvelle partie sur la semaine correspondante */
function lancerChapitre(n) {
	const lundi = semainesHistoire()[n - 1];
	const i = optionsAccueil().findIndex((o) => o.lundi === lundi);
	if (i < 0) return;
	choixAccueil = i;
	lancerNouvellePartie();
}
/** Ouverture d'une semaine : le patron présente, au téléphone, le nouvel élément de jeu */
function conversationChapitre(n) {
	// Prompt 161 : le patron annonce la règle réellement jouée (signalements simultanés de multitache.js, budget de
	// départ de game.js, compteur seulement en défi chrono) — plus de durée par dossier annoncée sans chrono
	const sem = Jeu.etat && Jeu.etat.semaine;
	const v = { actifs: texteActifs(Jeu.defiChrono ? 3 : Jeu.difficulte().actifs), budget: Math.round(Jeu.jauges.budget), s: (sem && sem.difficulte && sem.difficulte.compteur_s) || 30 };
	const cle = (k) => 'histoire.c' + n + '.' + k + (k === 0 && n > 1 && Jeu.defiChrono ? 'Chrono' : '');
	const messages = [0, 1, 2].map((k) => ({ de: k === 2 ? 'moi' : 'patron', texte: T(cle(k), v) }));
	lancerConversation({ contact: T('histoire.patron'), sous: T('histoire.semaine', { n, total: 3 }), messages, auFin: () => interaction() });
}

// ——— Fin d'une semaine ———
let RAPPORT = null; // { debut, bilan, chapitre, mode }
function finDeSemaine() {
	const ch = chapitreCourant();
	const b = Jeu.bilan();
	Confort.Son.signatureFin(b.type); // prompt 44 § 7 : signature sonore propre à la fin
	if (ch && !b.demission) {
		// prompt 47 : une démission ne valide pas le chapitre
		const p = progressionHistoire();
		p.scores[ch] = b.score;
		if (ch === 3) p.termine = true;
		enregistrerProgression(p);
	}
	// Prompt 56 : le rapport (deux pages) vient avant la cinématique de la semaine 3 ; le mail du patron est mis en avant
	RAPPORT = { debut: millis(), bilan: b, chapitre: ch, mode: Jeu.etat.mode, page: 0, stats: Jeu.statsSemaine(), cine: ch === 3 && !b.demission, mail: b.demission ? null : Jeu.mailFinSemaine() };
	annoncer(t('rapport.imprime'));
	if (RAPPORT.mail) {
		fenetre = 'mailFin';
		annoncer(String(RAPPORT.mail.objet) + '. ' + RAPPORT.mail.lignes.map(String).join(' '));
	}
	setTimeout(() => {
		if (vue === 'poste' && RAPPORT) seLever(); // on se lève : la feuille glisse sur la table
	}, 1600);
}

/** Écran du PC pendant que le rapport est imprimé */
function dessinerEcranRapportImprime() {
	noStroke();
	fill(C.fond);
	rect(0, 0, L, H); // prompt 50 : pas de background() dans la fenêtre de l'appli (il ignore la transformation)
	noStroke();
	dsTitre(t('rapport.imprimeTitre'), L / 2, H / 2 - 120, 56, '#ffffff', 'center');
	noStroke();
	textAlign(CENTER, TOP);
	textFont(POLICE_TEXTE);
	textSize(26);
	fill(C.gris);
	text(t('rapport.imprime'), L / 2 - 500, H / 2, 1000, 120);
}

/** Feuille sur la table (plan « proches ») : elle sort de dessous l'écran et glisse vers le joueur */
function dessinerFeuilleRapport(g) {
	if (!RAPPORT && !rapportVeille()) return;
	const o = OBJETS_BUREAU.find((x) => x.nom === 'rapport');
	const k = !RAPPORT || reduireAnimations ? 1 : easeOut(constrain((millis() - RAPPORT.debut - 1800) / 900, 0, 1)); // rapport de la veille : posé, immobile
	const y = Math.round(lerp(o.y - 26, o.y, k));
	ombreTramee(g, o.x + 2, y + o.h, o.l, 2, 100);
	for (let r = 0; r < o.h; r++) {
		const dx = Math.round((o.h - r) * 0.15); // légère perspective
		px(g, r === 0 || r === o.h - 1 ? '#9aa1a8' : '#fbf8f0', o.x + dx, y + r, o.l - dx * 2, 1);
	}
	for (let r = 5; r < o.h - 4; r += 3) px(g, '#c9c3b5', o.x + 8, y + r, o.l - 22 - (r % 6), 1); // lignes de texte
	px(g, '#b3261e', o.x + o.l - 16, y + o.h - 10, 9, 6); // tampon
	if (RAPPORT && !reduireAnimations && Math.floor(millis() / 700) % 2) px(g, '#f2c94c', o.x - 2, y - 2, 3, 3); // repère discret
}
function ouvrirRapport() {
	if (!RAPPORT) return rapportVeille() ? (ouvrir('rapportVeille'), annoncer(texteRapportVeille())) : undefined;
	livreOuverture = millis();
	ouvrir('rapport');
	annoncer(t('rapport.titre', { n: RAPPORT.chapitre || '' }) + ' — ' + t('rapport.score', { s: RAPPORT.bilan.score }));
}
function actionRapport() {
	if (!RAPPORT) return;
	const ch = RAPPORT.chapitre;
	const demission = RAPPORT.bilan.demission;
	const cine = RAPPORT.cine;
	const b = RAPPORT.bilan;
	RAPPORT = null;
	fenetre = null;
	if (cine) return lancerCinematique(b.type, b); // prompt 56 : après le rapport de la semaine 3
	if (ch) lancerChapitre(demission ? ch : ch + 1); // prompt 47 : après une démission, on reprend la même semaine
	else rejouer();
}
function quitterRapport() {
	RAPPORT = null;
	fenetre = null;
	retourAccueil();
}

/** La feuille ouverte : papier, texte machine, tampon de la fin — chiffres réels de la semaine */
/** Prompt 56 : mail du patron du dernier soir, mis en avant à l'ouverture de l'écran de fin */
function fenetreMailFin() {
	if (!RAPPORT || !RAPPORT.mail) return fermer();
	const m = RAPPORT.mail;
	const l = 1100;
	const h = 640;
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
	text(t('finSemaine.bandeau'), x + 32, y + 28);
	dsTitre(String(m.objet), x + 40, y + 84, 40, C.texte, 'left');
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textSize(22);
	textLeading(31);
	fill(C.texte);
	text(m.lignes.map(String).join('\n\n'), x + 40, y + 150, l - 80, h - 260);
	bouton(x + l - 40 - 420, y + h - 96, 420, 64, t('finSemaine.lire'), fermerMailFin);
}
function fermerMailFin() {
	fenetre = null;
	setTimeout(() => RAPPORT && !fenetre && ouvrirRapport(), reduireAnimations ? 0 : 1900); // la feuille sort de l'imprimante puis s'ouvre
}
function changerPageRapport() {
	if (!RAPPORT) return;
	RAPPORT.page = RAPPORT.page ? 0 : 1;
	annoncer(t(RAPPORT.page ? 'rapport.page2' : 'rapport.page1'));
}

function fenetreRapport() {
	if (!RAPPORT) return fermer();
	if (RAPPORT.page === 1) return fenetreRapportChiffres();
	const b = RAPPORT.bilan;
	const l = 1040;
	const h = 900;
	const x = (L - l) / 2;
	const y0 = 40;
	const k = reduireAnimations ? 1 : easeOut(constrain((millis() - livreOuverture) / 400, 0, 1));
	const y = y0 + (1 - k) * 60;
	noStroke();
	fill(0, 0, 0, 90);
	rect(x + 14, y + 18, l, h);
	fill('#f6f1e3');
	rect(x, y, l, h);
	fill('#e9e1cd');
	for (let i = 0; i < 6; i++) rect(x + 40, y + 6 + i, l - 80, 1); // trace d'impression
	const encre = '#1d1a16';
	const gris = '#5a5348';
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(gris);
	text(t('rapport.entete'), x + 56, y + 44);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(38);
	fill(encre);
	text(RAPPORT.chapitre ? t('rapport.titre', { n: RAPPORT.chapitre }) : t('rapport.titreDirect'), x + 56, y + 76);
	textStyle(NORMAL);
	textSize(19);
	fill(gris);
	text(t('rapport.periode', { p: b.faits.periode }), x + 56, y + 130);
	// Tampon de la fin (incliné)
	const couleurs = { bonne: '#1e7a3c', moyenne: '#a15c07', mauvaise: '#b3261e', demission: '#b3261e' };
	const tampon = b.demission ? 'demission' : b.type; // prompt 47
	push();
	translate(x + l - 210, y + 120);
	rotate(-0.12);
	noFill();
	stroke(couleurs[tampon]);
	strokeWeight(5);
	rect(-130, -42, 260, 84);
	noStroke();
	fill(couleurs[tampon]);
	textAlign(CENTER, CENTER);
	textStyle(BOLD);
	textSize(30);
	zoneTexteDebut('tampon', -130, -42, 260, 84); // prompt 93 : cadre du tampon (repère tourné)
	text(t('rapport.tampon.' + tampon), 0, 0);
	zoneTexteFin();
	textStyle(NORMAL);
	pop();
	// Score et texte de la fin
	let ly = y + 190;
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(28);
	fill(encre);
	textLeading(34); // titre sur deux lignes sans chevauchement
	text(t('rapport.score', { s: b.score }) + ' — ' + (b.demission ? t('demission.rapportTitre') : b.titre), x + 56, ly, l - 112, 80);
	textStyle(NORMAL);
	ly += 84;
	textSize(19);
	textLeading(27);
	fill(encre);
	text(b.demission ? t('demission.rapportTexte') : b.texte, x + 56, ly, l - 112, 90);
	ly += 100;
	// Jauges
	[['fluidite', b.jauges.fluidite], ['reputation', b.jauges.reputation], ['budget', b.jauges.budget]].forEach(([cle, v], i) => {
		const jx = x + 56 + i * ((l - 112) / 3);
		const jl = (l - 112) / 3 - 24;
		textSize(18);
		fill(encre);
		text(t('jaugeTitre.' + cle) + ' ' + v + '/100', jx, ly);
		fill('#ddd5c2');
		rect(jx, ly + 30, jl, 12);
		fill(couleurPapier(v)); // prompt 48 : palette daltonisme
		rect(jx, ly + 30, (jl * v) / 100, 12);
	});
	ly += 70;
	// Faits et décisions clés
	textSize(18);
	fill(encre);
	const bp = Jeu.bilanPlaintes ? Jeu.bilanPlaintes() : { traitees: 0, total: 0, bonnes: 0 };
	text(t('rapport.faits', { n: b.traites, total: b.total, sans: b.sansDecision, pt: bp.traitees, pT: bp.total, pb: bp.bonnes }), x + 56, ly, l - 112, 60);
	ly += 64;
	textStyle(BOLD);
	text(t('fin.decisions'), x + 56, ly);
	textStyle(NORMAL);
	ly += 32;
	// Prompt 66 : qualité en tête de ligne, texte sur deux lignes (il était coupé : « Bus de… »)
	b.decisionsCles.slice(0, 3).forEach((d) => {
		textSize(15);
		textLeading(19);
		const etiquette = String(t('qualite.' + d.qualite)).toUpperCase() + ' · ';
		fill(gris);
		text(etiquette, x + 56, ly);
		const decal = textWidth(etiquette);
		fill(encre);
		text(String(d.titre) + ' — ' + String(d.action || t('action.temps')), x + 56 + decal, ly, l / 2 - 80 - decal, 40);
		ly += 45;
	});
	dessinerCourbesJauges(x + l / 2 + 40, y + 552, l / 2 - 96, 96, encre, gris); // prompt 48 : courbes des jauges
	// Prompt 55 : défis de la semaine (vrais chiffres) et ralentis utilisés
	if (b.defis && b.defis.length) {
		textFont(POLICE_DONNEES);
		textSize(15);
		textLeading(20);
		fill(encre);
		const ld = b.defis.map((r) => (r.tenu ? '✓ ' : '✗ ') + t('defi.' + r.id) + ' (' + r.valeur + ')').join(' · ');
		text(t('rapport.defis', { liste: ld, n: b.ralentis }), x + 56, y + 676, l - 112, 44);
		textFont(POLICE_TEXTE);
	}
	// Prompt 47 : profil de gestion (prompt 142 : extrait du journal de bord retiré)
	const m = lignesRapportMecaniques();
	textSize(16);
	textLeading(22);
	fill(gris);
	if (Jeu.profilSemaine) text(t('fin.profil', { phrase: Jeu.profilSemaine().phrase }), x + 56, y + h - 120, l - 112, 48);
	if (m.gestion) text(m.gestion, x + 56, y + h - 66, l - 112, 44);
	// Prochaine étape (sous la feuille)
	const by = y + h + 20;
	if (RAPPORT.chapitre && b.demission) {
		bouton(L / 2 - 460, by + 10, 440, 64, t('demission.reprendre'), actionRapport); // prompt 47 : même semaine
		bouton(L / 2 + 20, by + 10, 440, 64, t('menu.menuPrincipal'), quitterRapport, false, true);
	} else if (RAPPORT.cine) {
		bouton(L / 2 - 220, by + 10, 440, 64, t('finSemaine.cine'), actionRapport); // prompt 56 : semaine 3 → cinématique
	} else if (RAPPORT.chapitre) {
		textAlign(CENTER, TOP);
		fill('#ffffff');
		textSize(18);
		const n = RAPPORT.chapitre + 1;
		const nouveau = elementNouveauChapitre(n); // prompt 161 : « nouvel élément » seulement s'il l'est vraiment
		text(nouveau ? t('histoire.prochain', { n, element: t('histoire.element.' + nouveau) }) : t('histoire.prochainSans', { n, niveau: t('niveau.' + niveauChapitre(n)) }), L / 2 - 500, by - 2, 1000, 30);
		bouton(L / 2 - 220, by + 30, 440, 64, t('rapport.suivante'), actionRapport);
	} else {
		bouton(L / 2 - 690, by + 10, 440, 64, t('fin.rejouer'), actionRapport);
		bouton(L / 2 - 220, by + 10, 440, 64, t('finSemaine.autre'), autreSemaine, false, true); // prompt 56 : une semaine archivée
		bouton(L / 2 + 250, by + 10, 440, 64, t('menu.menuPrincipal'), quitterRapport, false, true);
	}
	boutonPageRapport(x + l, y);
}

// =====================================================================
// Cinématiques de fin (après la semaine 3) : trois plans par fin, ~6 s chacun, passables
// =====================================================================
let CINE = null; // { type, bilan, plan, debut }
const DUREE_PLAN = 6500;
function lancerCinematique(type, bilan) {
	CINE = { type, bilan, plan: 0, debut: millis() };
	fenetre = null;
	annoncer(t('cine.' + type + '.0'));
}
function planSuivant() {
	if (!CINE) return;
	CINE.plan++;
	CINE.debut = millis();
	if (CINE.plan > 2) return finCinematique();
	annoncer(t('cine.' + CINE.type + '.' + CINE.plan));
}
function finCinematique() {
	CINE = null;
	ecran = 'accueil';
	bilanCalcule = null;
	ouvrirMenuPrincipal();
	annoncer(t('histoire.debloque'));
}
function toucheCinematique() {
	if (keyCode === ESCAPE) return finCinematique();
	if (keyCode === ENTER || keyCode === RETURN || key === ' ' || keyCode === RIGHT_ARROW) planSuivant();
}

function dessinerCinematique() {
	const c = CINE;
	const u = (millis() - c.debut) / DUREE_PLAN;
	if (u >= 1) planSuivant();
	if (!CINE) return;
	background(0);
	if (c.plan === 0) planVille(c.type, u);
	else if (c.plan === 1) planLettre(c.type, u);
	else planPiece(c.type, u);
	// Fondu d'entrée / sortie (aucun avec animations réduites)
	if (!reduireAnimations) {
		const f = u < 0.08 ? 1 - u / 0.08 : u > 0.92 ? (u - 0.92) / 0.08 : 0;
		noStroke();
		fill(0, 0, 0, 255 * f);
		rect(0, 0, L, H);
	}
	// Bandes noires et sous-titre
	noStroke();
	fill(0);
	rect(0, 0, L, 110);
	rect(0, H - 150, L, 150);
	textAlign(CENTER, CENTER);
	textFont(POLICE_TEXTE);
	textSize(30);
	fill('#ffffff');
	const p = progressionHistoire().scores;
	const sous = c.plan === 2 ? t('cine.bilan', { s1: p[1] === undefined ? '—' : p[1], s2: p[2] === undefined ? '—' : p[2], s3: c.bilan.score }) : t('cine.' + c.type + '.' + c.plan);
	text(sous, 160, H - 150, L - 320, 150);
	textAlign(LEFT, CENTER);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill('rgba(255,255,255,0.6)');
	text(t('cine.titre.' + c.type), 60, 55);
	bouton(L - 360, 30, 300, 56, t('cine.passer'), finCinematique, false, true);
	boutons.push({ x: 0, y: 110, l: L, h: H - 260, action: planSuivant });
}

/** Plan 1 : la ville et ses trams sur le pont (vitesse et couleurs selon la fin) */
function planVille(type, u) {
	const ciel = { bonne: ['#f2b16b', '#7fb5e0'], moyenne: ['#9aa4ad', '#c8cfd5'], mauvaise: ['#0b1220', '#1b2a44'] }[type];
	const g = drawingContext.createLinearGradient(0, 0, 0, H);
	g.addColorStop(0, ciel[1]);
	g.addColorStop(1, ciel[0]);
	drawingContext.fillStyle = g;
	drawingContext.fillRect(0, 0, L, H);
	const nuit = type === 'mauvaise';
	noStroke();
	[90, 140, 70, 180, 120, 200, 100, 160, 130, 210, 90, 150, 110, 170, 80, 190].forEach((h, i) => {
		fill(nuit ? '#0f1626' : '#5b6572');
		rect(i * 124, 640 - h, 124, h + 10);
		if (nuit) for (let k = 0; k < 4; k++) (fill('#e8c46a'), rect(i * 124 + 20 + k * 22, 660 - h + k * 18, 8, 8));
	});
	fill(nuit ? '#1b2a44' : '#4f7f9f');
	rect(0, 650, L, 300); // la Loire
	fill(nuit ? '#2e4264' : '#9cc3da');
	for (let x = 0; x < L; x += 90) rect(x + ((millis() / 40) % 90) * (reduireAnimations ? 0 : 1), 720 + (x % 3) * 40, 40, 4);
	fill('#3a3f46');
	rect(0, 600, L, 26); // pont
	const vitesse = { bonne: 0.35, moyenne: 0.18, mauvaise: 0 }[type];
	const n = { bonne: 5, moyenne: 4, mauvaise: 3 }[type];
	for (let i = 0; i < n; i++) {
		const x = ((i * L) / n + (reduireAnimations ? 0 : millis() * vitesse)) % (L + 200) - 100;
		fill('#e9ecef');
		rect(x, 560, 150, 40);
		fill(nuit ? '#e8c46a' : '#3c4450');
		for (let w = 0; w < 4; w++) rect(x + 12 + w * 34, 568, 22, 14);
		const feu = type === 'mauvaise' ? (Math.floor(millis() / 1000) % 2 ? '#d10b00' : '#7d1a15') : '#00b74f'; // 1 Hz au plus
		fill(feu);
		rect(x + 140, 586, 8, 8);
	}
	if (type === 'mauvaise' && !reduireAnimations) {
		fill(200, 215, 230, 120);
		for (let i = 0; i < 160; i++) rect((i * 97 + millis() * 0.2) % L, (i * 53 + millis() * 0.9) % H, 2, 14);
	}
	void u;
}

/** Plan 2 : la lettre de la direction sur le bureau */
function planLettre(type, u) {
	background('#cbb79a');
	noStroke();
	fill('#b49f80');
	for (let y = 0; y < H; y += 46) rect(0, y, L, 2); // veinage du plateau
	const k = reduireAnimations ? 1 : easeOut(constrain(u / 0.25, 0, 1));
	const l = 820;
	const h = 740;
	const x = (L - l) / 2;
	const y = 160 + (1 - k) * 80;
	fill(0, 0, 0, 70);
	rect(x + 16, y + 20, l, h);
	fill('#fbf8f0');
	rect(x, y, l, h);
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill('#5a5348');
	text(t('cine.lettre.entete'), x + 60, y + 50);
	textFont(POLICE_TEXTE);
	textSize(24);
	textLeading(36);
	fill('#1d1a16');
	text(t('cine.lettre.' + type), x + 60, y + 120, l - 120, h - 260);
	const couleurs = { bonne: '#1e7a3c', moyenne: '#a15c07', mauvaise: '#b3261e' };
	push();
	translate(x + l - 190, y + h - 110);
	rotate(-0.15);
	noFill();
	stroke(couleurs[type]);
	strokeWeight(5);
	rect(-140, -40, 280, 80);
	noStroke();
	fill(couleurs[type]);
	textAlign(CENTER, CENTER);
	textStyle(BOLD);
	textSize(28);
	text(t('rapport.tampon.' + type), 0, 0);
	textStyle(NORMAL);
	pop();
}

/** Plan 3 : la pièce (zoom lent), atmosphère selon la fin */
function planPiece(type, u) {
	if (!dernierRenduBureau || millis() - dernierRenduBureau > 250) {
		dessinerPieceBureau();
		dernierRenduBureau = millis();
	}
	const z = reduireAnimations ? 1.05 : 1.05 + u * 0.06;
	drawingContext.imageSmoothingEnabled = false;
	image(gBureau, (L - L * z) / 2, (H - H * z) / 2, L * z, H * z);
	drawingContext.imageSmoothingEnabled = true;
	noStroke();
	if (type === 'bonne') fill(255, 214, 150, 40);
	else if (type === 'moyenne') fill(120, 130, 140, 50);
	else fill(10, 14, 30, 150);
	rect(0, 0, L, H);
}

// ——— Prompt 56 : page 2 du rapport — chiffres réels de la semaine ———
function boutonPageRapport(xDroite, y) {
	bouton(xDroite + 24, y + 8, 300, 50, t(RAPPORT.page ? 'rapport.versPage1' : 'rapport.versPage2'), changerPageRapport, false, true); // à droite de la feuille, sur le fond sombre (contraste)
}
function autreSemaine() {
	quitterRapport();
	if (typeof allerChoixSemaine === 'function') allerChoixSemaine();
}
function fenetreRapportChiffres() {
	const s = RAPPORT.stats;
	const b = RAPPORT.bilan;
	const l = 1040;
	const h = 900;
	const x = (L - l) / 2;
	const y = 40;
	const encre = '#1d1a16';
	const gris = '#5a5348';
	noStroke();
	fill(0, 0, 0, 90);
	rect(x + 14, y + 18, l, h);
	fill('#f6f1e3');
	rect(x, y, l, h);
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(gris);
	text(t('rapport.entete') + ' · ' + t('rapport.page2court'), x + 56, y + 44);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(36);
	fill(encre);
	text(t('rapport.chiffresTitre'), x + 56, y + 76);
	textStyle(NORMAL);
	// Colonne de gauche : tableau des chiffres réels
	const lignes = [
		[t('stats.recus'), s.recus],
		[t('stats.traites'), s.traites],
		[t('stats.expires'), s.expires],
		[t('action.devier'), s.parAction.devier],
		[t('action.retenir'), s.parAction.retenir],
		[t('action.renfort'), s.parAction.renfort],
		[t('action.rien'), s.parAction.rien],
		[t('stats.tempsMoyen'), s.tempsMoyen === null ? '—' : String(s.tempsMoyen).replace('.', Langue.actuelle === 'fr' ? ',' : '.') + ' s'],
		[t('stats.sources'), s.sources],
		[t('stats.ralentis'), s.ralentis],
		[t('stats.objectifs'), s.objectifs],
		[t('stats.equipes'), s.equipes ? s.equipes.total + ' · ' + t('stats.pertinentes', { n: s.equipes.pertinentes }) + ' · ' + t('stats.refus', { n: s.equipes.refus }) : '—'], // prompt 68
	];
	textFont(POLICE_DONNEES);
	textSize(19);
	lignes.forEach(([lib, v], i) => {
		const ly = y + 150 + i * 34;
		fill(i % 2 ? '#efe8d6' : '#f6f1e3');
		rect(x + 48, ly - 5, 440, 32);
		fill(i >= 3 && i <= 6 ? gris : encre);
		textAlign(LEFT, TOP);
		text((i >= 3 && i <= 6 ? '   ' : '') + lib, x + 60, ly);
		textAlign(RIGHT, TOP);
		fill(encre);
		text(String(v), x + 476, ly);
	});
	textAlign(LEFT, TOP);
	// Colonne de droite : courbes, jauges finales, score
	dessinerCourbesJauges(x + 580, y + 180, l - 640, 200, encre, gris);
	textFont(POLICE_TEXTE);
	textSize(20);
	fill(encre);
	text(t('stats.final', { f: s.jauges.fluidite, r: s.jauges.reputation, b: s.jauges.budget }), x + 560, y + 420, l - 600, 60);
	textStyle(BOLD);
	textSize(28);
	text(t('rapport.score', { s: s.score }), x + 560, y + 480);
	textStyle(NORMAL);
	// Bas : défis (bonus appliqués) et profil de gestion
	let ly = y + 590;
	textSize(20);
	textStyle(BOLD);
	text(t('stats.defis'), x + 56, ly);
	textStyle(NORMAL);
	ly += 36;
	textFont(POLICE_DONNEES);
	textSize(17);
	(b.defis || []).forEach((r) => {
		fill(r.tenu ? '#1e5f30' : '#8a1f18');
		text((r.tenu ? '✓ ' : '✗ ') + t('defi.' + r.id) + ' — ' + t('stats.valeur', { v: r.valeur }) + (r.tenu ? ' · ' + t('stats.bonus', { jauge: t('jaugeTitre.' + r.jauge), v: r.bonus }) : ''), x + 56, ly, l - 112, 26);
		ly += 30;
	});
	const g = Jeu.profilPartie();
	fill(gris);
	textFont(POLICE_TEXTE);
	textSize(18);
	if (g) text(t('rapport.gestion', { profil: t('profil.' + g.id), n: g.n, total: g.total, action: t('profilAction.' + g.id) }), x + 56, y + h - 80, l - 112, 50);
	boutonPageRapport(x + l, y);
	const by = y + h + 20;
	bouton(L / 2 - 220, by + 10, 440, 64, t(RAPPORT.cine ? 'finSemaine.cine' : RAPPORT.chapitre && !b.demission ? 'rapport.suivante' : 'fin.rejouer'), actionRapport);
}

// ——— Prompt 89 bis : le rapport du soir de la veille (prompt 88) reste posé sur le bureau jusqu'à la fin de la semaine ———
function rapportVeille() {
	// Prompt 142 : plus de carnet de la semaine ; le dernier rapport validé est relu dans Jeu.taches.jours
	if (typeof Jeu === 'undefined' || !Jeu.taches || !Jeu.taches.jours || ecran !== 'jeu' || phase === 'fin') return null;
	const j = Jeu.jourCourant && Jeu.jourCourant();
	const dates = Object.keys(Jeu.taches.jours).filter((d) => Jeu.taches.jours[d].rapport && (!j || d < j.date)).sort();
	if (!dates.length) return null;
	const d = dates[dates.length - 1];
	return Object.assign({ date: d }, Jeu.taches.jours[d].rapport);
}
function texteRapportVeille() {
	const c = rapportVeille();
	if (!c) return '';
	const prio = (c.priorites || []).map((p) => t('tache.prio.' + p.id, p.vars) + ' (' + t('tache.etat.' + p.etat) + ')').join(' ; ');
	return [t('veilleRapport.titre', { date: c.date.split('-').reverse().join('/') }), t('recap.fait', { fait: c.fait }), prio ? t('veilleRapport.prio', { liste: prio }) : '', c.demande ? t('veilleRapport.demande', { demande: t('tache.demande.' + c.demande, Taches.R.demande), etat: t(c.accordee ? 'veilleRapport.accordee' : 'veilleRapport.refusee') }) : ''].filter(Boolean).join('\n');
}
function fenetreRapportVeille() {
	const l = 1100;
	const h = 560;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textSize(22);
	textLeading(32);
	fill(C.texte);
	text(texteRapportVeille(), x + 56, y + 56, l - 112, h - 180);
	bouton(x + l - 56 - 300, y + h - 100, 300, 64, t('commun.fermer'), fermer);
}
