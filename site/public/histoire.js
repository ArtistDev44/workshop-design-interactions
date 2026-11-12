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
	const l = DS.fenetre.large; // prompt 173 (était 1100)
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
/** Prompt 163 : trois pages — 1 bilan, 2 chiffres, 3 sources et faits ; Tab avance, Maj + Tab recule */
const PAGES_RAPPORT = 3;
function changerPageRapport(sens) {
	if (!RAPPORT) return;
	RAPPORT.page = ((RAPPORT.page || 0) + (sens === -1 ? -1 : 1) + PAGES_RAPPORT) % PAGES_RAPPORT;
	annoncer(t('rapport.page' + (RAPPORT.page + 1)) + (RAPPORT.page === 2 ? ' ' + lignesSourcesRapport().map((l) => String(l.texte)).join(' ') : ''));
}

function fenetreRapport() {
	if (!RAPPORT) return fermer();
	if (RAPPORT.page === 1) return fenetreRapportChiffres();
	if (RAPPORT.page === 2) return fenetreRapportSources();
	const b = RAPPORT.bilan;
	const l = 1040; // feuille de papier (hors gabarit des fenêtres du DS, prompt 173)
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
	text(t('rapport.periode', { p: b.faits.periodeTexte || b.faits.periode }), x + 56, y + 130); // prompt 163 : jj/mm et jours joués
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
	// Prompt 163 : le type de fin nommé sous le tampon, avec son seuil
	if (!b.demission) {
		textAlign(CENTER, TOP);
		textFont(POLICE_DONNEES);
		textSize(16);
		fill(couleurs[b.type]);
		text(t('rapport.typeFin.' + b.type, { s: Jeu.SEUILS_FIN[b.type === 'mauvaise' ? 'moyenne' : b.type] }), x + l - 380, y + 186, 340, 24);
		textAlign(LEFT, TOP);
		textFont(POLICE_TEXTE);
	}
	// Score et texte de la fin
	let ly = y + 218;
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(28);
	fill(encre);
	textLeading(34); // titre sur deux lignes sans chevauchement
	text(t('rapport.score', { s: b.score }) + ' — ' + (b.demission ? t('demission.rapportTitre') : b.titre), x + 56, ly, l - 112, 72);
	textStyle(NORMAL);
	ly += 78;
	textSize(19);
	textLeading(27);
	fill(encre);
	text(b.demission ? t('demission.rapportTexte') : b.texte, x + 56, ly, l - 112, 84);
	ly += 92;
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
	ly += 66;
	// Faits et décisions clés (prompt 163 : plaintes citées seulement s'il y en a eu)
	textSize(18);
	fill(encre);
	const bp = Jeu.bilanPlaintes ? Jeu.bilanPlaintes() : { traitees: 0, total: 0, bonnes: 0 };
	text(t(bp.total ? 'rapport.faits' : 'rapport.faitsSansPlaintes', { n: b.traites, total: b.total, sans: b.sansDecision, pt: bp.traitees, pT: bp.total, pb: bp.bonnes }), x + 56, ly, l - 112, 52);
	ly += 58;
	if (b.decisionsCles.length) {
		textStyle(BOLD);
		text(t('fin.decisions'), x + 56, ly);
		textStyle(NORMAL);
		ly += 34;
	}
	// Prompt 163 : pleine largeur (les courbes sont en page 2), action entière, évaluation et écarts de jauges
	const colEtiq = 190;
	b.decisionsCles.slice(0, 3).forEach((d) => {
		textFont(POLICE_DONNEES);
		textSize(14);
		textAlign(LEFT, TOP);
		fill(gris);
		text(String(t('qualite.' + d.qualite)).toUpperCase(), x + 56, ly + 2, colEtiq - 12, 20);
		const r = dessinerTexte(texteDecisionCle(d), x + 56 + colEtiq, ly, l - 112 - colEtiq, { taille: 16, couleur: encre, maxLignes: 2, interligne: 21 });
		const r2 = dessinerTexte(ecartsDecisionCle(d), x + 56 + colEtiq, ly + r.h + 2, l - 112 - colEtiq, { taille: 15, couleur: gris, police: POLICE_DONNEES, maxLignes: 1, interligne: 20 });
		ly += r.h + r2.h + 14;
	});
	// Prompt 163 : un seul profil (gestion + semaine) ; défis et courbes en page 2 (prompt 142 : extrait du journal retiré)
	const pr = texteProfilRapport();
	if (pr) dessinerTexte(pr, x + 56, Math.max(ly + 6, y + h - 104), l - 112, { taille: 16, couleur: gris, maxLignes: 3, interligne: 22 });
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
	bouton(xDroite + 24, y + 8, 300, 50, t(['rapport.versPage2', 'rapport.versPage3', 'rapport.versPage1'][RAPPORT.page || 0]), changerPageRapport, false, true); // à droite de la feuille, sur le fond sombre (contraste) ; prompt 163 : trois pages
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
	// Prompt 163 : réponses comptées par famille (les mots des répliques jouées), équipes sur trois lignes (débordement)
	const pf = s.parFamille || {};
	const lignes = [
		[t('stats.recus'), s.recus],
		[t('stats.traites'), s.traites],
		...Jeu.FAMILLES.map((f) => [t('famille.' + f), pf[f] || 0, true]),
		[t('stats.expires'), s.expires],
		[t('stats.tempsMoyen'), s.tempsMoyen === null ? '—' : String(s.tempsMoyen).replace('.', Langue.actuelle === 'fr' ? ',' : '.') + ' s'],
		[t('stats.sources'), s.sources],
		[t('stats.ralentis'), s.ralentis],
		[t('stats.objectifs'), s.objectifs],
		[t('stats.equipes'), s.equipes ? s.equipes.total : '—'], // prompt 68
		...(s.equipes ? [[t('stats.equipesPert'), s.equipes.pertinentes, true], [t('stats.equipesRefus'), s.equipes.refus, true]] : []),
	];
	textFont(POLICE_DONNEES);
	textSize(19);
	lignes.forEach(([lib, v, retrait], i) => {
		const ly = y + 150 + i * 32;
		fill(i % 2 ? '#efe8d6' : '#f6f1e3');
		rect(x + 48, ly - 4, 460, 30);
		fill(retrait ? gris : encre);
		textAlign(LEFT, TOP);
		text((retrait ? '   ' : '') + lib, x + 60, ly);
		textAlign(RIGHT, TOP);
		fill(encre);
		text(String(v), x + 496, ly);
	});
	textAlign(LEFT, TOP);
	// Colonne de droite : courbes (jauges finales et score : page 1 seulement, prompt 163)
	dessinerCourbesJauges(x + 580, y + 180, l - 640, 200, encre, gris);
	// Bas : défis (bonus appliqués ; « sans objet » sans plainte) — seul endroit du rapport où ils figurent
	let ly = y + 150 + lignes.length * 32 + 24;
	textFont(POLICE_TEXTE);
	fill(encre);
	textSize(20);
	textStyle(BOLD);
	text(t('stats.defis'), x + 56, ly);
	textStyle(NORMAL);
	ly += 34;
	(b.defis || []).forEach((r) => {
		const coul = r.sansObjet ? gris : r.tenu ? '#1e5f30' : '#8a1f18';
		const suite = r.sansObjet ? t('stats.sansObjet') : r.tenu ? t('stats.bonus', { jauge: t('jaugeTitre.' + r.jauge), v: r.bonus }) : '';
		const txt = (r.sansObjet ? '– ' : r.tenu ? '✓ ' : '✗ ') + t('defi.' + r.id) + ' — ' + t('stats.valeur', { v: r.valeur }) + (suite ? ' · ' + suite : '');
		ly += dessinerTexte(txt, x + 56, ly, l - 112, { taille: 17, police: POLICE_DONNEES, couleur: coul, maxLignes: 2, interligne: 23 }).h + 6;
	});
	boutonPageRapport(x + l, y);
	const by = y + h + 20;
	bouton(L / 2 - 220, by + 10, 440, 64, t(RAPPORT.cine ? 'finSemaine.cine' : RAPPORT.chapitre && !b.demission ? 'rapport.suivante' : 'fin.rejouer'), actionRapport);
}

// ——— Prompt 163 : décisions clés, profil unique et page « Sources et faits de la semaine » ———
/** « titre — action (évaluation) » : l'action entière (plus de « Ne rien » coupé) */
function texteDecisionCle(d) {
	const ev = d.evaluation && d.evaluation !== 'inconnu' ? ' (' + t('eval.' + d.evaluation) + ')' : '';
	return String(d.titre) + ' — ' + String(d.action || t('action.temps')) + ev;
}
/** « fluidité +6 · réputation 0 · budget −7 » */
function ecartsDecisionCle(d) {
	return ['fluidite', 'reputation', 'budget'].map((k, i) => t('jauge.' + k) + ' ' + (d.deltas[i] > 0 ? '+' : d.deltas[i] < 0 ? '−' : '') + Math.abs(d.deltas[i])).join(' · ');
}
/** Un seul profil : la famille la plus jouée, puis la phrase de la semaine (jauge forte, malus répété) */
function texteProfilRapport() {
	const g = Jeu.profilPartie();
	const phrase = Jeu.profilSemaine ? String(Jeu.profilSemaine().phrase) : '';
	if (!g) return phrase ? String(t('fin.profil', { phrase })) : '';
	return String(t('rapport.profil', { profil: t('profil.' + g.id), n: g.n, total: g.total, action: t('profilAction.' + g.id), phrase }));
}
/** Lignes de la page 3, reprises de l'ancien écran dessinerFin (inatteignable) : faits de la source puis bilans de la partie */
function lignesSourcesRapport() {
	if (!RAPPORT) return [];
	const b = RAPPORT.bilan;
	const f = b.faits;
	const L3 = [{ section: true, texte: t('rapport.sectionDonnees') }];
	L3.push({ texte: RAPPORT.mode === 'direct' ? t('fin.releve', { periode: f.periode }) : t('rapport.periode', { p: f.periodeTexte || f.periode }) });
	if (f.composition && String(f.composition)) L3.push({ texte: t('rapport.composition', { liste: f.composition }) });
	L3.push({ texte: f.pireRetard ? t('fin.pireRetard', { min: f.pireRetard.minutes, ligne: f.pireRetard.ligne }) : t('fin.pireRetardInconnu') });
	L3.push({ texte: t('fin.sources'), discret: true });
	L3.push({ section: true, texte: t('rapport.sectionPartie') });
	const bf = typeof bilanFin !== 'undefined' ? bilanFin : null;
	if (bf && bf.record) L3.push({ texte: t('fin.record'), vert: true });
	else if (bf && bf.meilleur) L3.push({ texte: t('fin.meilleur', { score: bf.meilleur.score, le: bf.meilleur.le }) });
	const extra = [Jeu.defiChrono ? t('fin.defiChrono') : '', typeof Taches !== 'undefined' && Taches.grade ? t('fin.grade', { grade: t('grade.' + Taches.grade().i), xp: (Jeu.taches && Jeu.taches.xpPartie) || 0 }) : ''].filter((x) => String(x));
	if (extra.length) L3.push({ texte: extra.map(String).join(' · ') });
	L3.push({ texte: t('fin.mauvaisesSources', { n: b.mauvaisesSources || 0 }) });
	if (Jeu.profilSemaine) L3.push({ texte: t('rapport.malus', { malus: Jeu.profilSemaine().malusFrequent }) });
	return L3;
}
function fenetreRapportSources() {
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
	text(t('rapport.entete') + ' · ' + t('rapport.page3court'), x + 56, y + 44);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(36);
	fill(encre);
	text(t('rapport.sourcesTitre'), x + 56, y + 76);
	textStyle(NORMAL);
	let ly = y + 150;
	lignesSourcesRapport().forEach((li, i) => {
		if (li.section) {
			if (i) ly += 18;
			ly += dessinerTexte(String(li.texte), x + 56, ly, l - 112, { taille: 22, style: BOLD, couleur: encre, maxLignes: 1, interligne: 30 }).h + 8;
			return;
		}
		const o = li.discret ? { taille: 17, couleur: gris, interligne: 24 } : { taille: 19, couleur: li.vert ? '#1e5f30' : encre, interligne: 27 };
		ly += dessinerTexte(String(li.texte), x + 56, ly, l - 112, Object.assign({ maxLignes: 4 }, o)).h + 10;
	});
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
	const l = DS.fenetre.large; // prompt 173 (était 1100)
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
