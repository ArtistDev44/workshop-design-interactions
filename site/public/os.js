/* Nantes en régulation — le PC du bureau : démarrage d'un système FICTIF (« RégulOS »), puis l'appli principale.
 * Prompt 183 : plus de bureau d'icônes ni de barre des tâches — s'installer au PC (et la fin du démarrage du jour)
 * mène directement à l'appli principale (carte) ; les autres applis sont des vues de son menu (menu-app.js).
 * Fond d'écran ORIGINAL qui évoque l'esthétique bleue et lumineuse des bureaux d'ordinateur de la fin
 * des années 2000 (dégradé, traînées de lumière, bulles floues), pixelisé ; aucun logo ni visuel de
 * marque existant n'est reproduit. Tout est dessiné par le code (contenu 1920×1080 de l'écran du PC).
 */
const PC = { etat: 'eteint', debut: 0, selection: 0, fenetre: null, message: '', flottant: false };
// etat : 'eteint' | 'demarrage' | 'appli' (appli principale : carte et signalements) | 'os' (une autre appli est
// ouverte en vue intégrée : fenetre = 'patron' | 'community' | 'journal' | 'donnees' — jamais 'os' sans fenêtre)
const DUREE_DEMARRAGE = 3400;
let gFondOS = null;

function demarrerPC() {
	PC.etat = 'demarrage';
	PC.debut = millis();
	Confort.Son.bip('dossier');
}
// ——— Prompt 71 : le PC redémarre au début de chacune des 3 premières journées de la partie ———
// La journée commence PC éteint ; à la fin de l'écran « JOUR n — SEMAINE n », le démarrage (BIOS, logo,
// barre de chargement, bip) se joue en entier, visible sur le moniteur ; à partir du jour 4, rien ne change.
// Une seule fois par journée (clé gardée dans la sauvegarde) ; temps de jeu suspendu pendant le démarrage.
const JOURS_DEMARRAGE = 3;
const JOUR_PC = { attendu: false, fait: '' };
function cleJourPC() {
	return (Jeu.etat && Jeu.etat.semaine ? Jeu.etat.semaine.lundi : (Jeu.etat && Jeu.etat.mode) || '') + '|' + Jeu.jourIndex;
}
/** Appelée au début de chaque journée (demarrerJournee) et à la reprise d'une sauvegarde */
function demarrageDuJour() {
	if (ecran !== 'jeu' || !Jeu.jourCourant || !Jeu.jourCourant()) return;
	const cle = cleJourPC();
	if (JOUR_PC.fait === cle) return; // déjà démarré aujourd'hui : pas de replay
	JOUR_PC.fait = cle;
	if (Jeu.jourIndex >= JOURS_DEMARRAGE || (typeof EXPO !== 'undefined' && EXPO.actif)) return; // prompt 132 : pas de redémarrage en exposition
	JOUR_PC.attendu = true;
	PC.fenetre = null;
	PC.etat = 'eteint';
}
/** Une fois par image : lance le démarrage dès que l'écran de transition du jour est passé */
function majDemarrageJour() {
	if (!JOUR_PC.attendu || ecran !== 'jeu' || TRANSITION_JOUR || smsActif || MENU.actif) return;
	JOUR_PC.attendu = false;
	if (PC.etat !== 'eteint') return; // le joueur l'a déjà allumé en s'installant
	demarrerPC();
	if (reduireAnimations) PC.debut = millis() - (DUREE_DEMARRAGE - 500); // animations réduites : écran d'accueil statique, 0,5 s
}
const pcDemarre = () => PC.etat === 'demarrage';

/** Prompt 183 : l'appli principale (carte et signalements) — l'écran d'accueil du PC, toute autre vue refermée */
function versAppliPrincipale() {
	PC.fenetre = null;
	PC.etat = 'appli';
}

/** Fond d'écran pixelisé (calculé une fois, 240×135 agrandi ×8) */
function fondOS() {
	if (gFondOS) return gFondOS;
	const g = createGraphics(240, 135);
	g.pixelDensity(1);
	g.noSmooth();
	g.noStroke();
	for (let y = 0; y < 135; y++)
		for (let x = 0; x < 240; x += 2) {
			const dx = (x - 150) / 240;
			const dy = (y - 50) / 135;
			const r = Math.sqrt(dx * dx * 1.4 + dy * dy);
			const t = Math.min(1, r * 1.6);
			g.fill(lerp(70, 8, t), lerp(170, 48, t), lerp(235, 118, t));
			g.rect(x, y, 2, 1);
		}
	// Traînées de lumière (courbes) et bulles floues
	for (let k = 0; k < 4; k++) {
		for (let x = 0; x < 240; x++) {
			const y = 78 + k * 7 - Math.sin((x / 240) * Math.PI) * (36 - k * 6) + Math.sin(x / 19 + k) * 2;
			g.fill(200, 240, 255, 70 - k * 12);
			g.rect(x, Math.round(y), 1, 2 + (k === 0 ? 1 : 0));
		}
	}
	[[60, 30, 10], [190, 24, 7], [120, 100, 12], [210, 90, 8], [30, 110, 6], [160, 60, 5]].forEach(([cx, cy, r]) => {
		for (let rr = r; rr > 0; rr -= 2) {
			g.fill(220, 245, 255, 18);
			for (let dy = -rr; dy <= rr; dy++) {
				const w = Math.floor(Math.sqrt(rr * rr - dy * dy));
				g.rect(cx - w, cy + dy, 2 * w + 1, 1);
			}
		}
	});
	gFondOS = g;
	return g;
}

/** Contenu de l'écran tant que l'appli n'est pas affichée : PC éteint ou séquence de démarrage */
function dessinerOS() {
	if (PC.etat === 'demarrage') return dessinerDemarrage();
	background('#050607');
	if (PC.etat !== 'eteint') versAppliPrincipale(); // prompt 183 : aucun bureau d'icônes — état inattendu → appli principale
}

/** Fond d'écran seul (derrière l'appli, prompt 50) */
function dessinerFondOS() {
	drawingContext.imageSmoothingEnabled = false;
	image(fondOS(), 0, 0, L, H);
	drawingContext.imageSmoothingEnabled = true;
}

// ——— Prompt 50 : l'appli Régulation n'est plus en plein écran — fenêtre au-dessus de la barre des tâches ———
// Elle garde ses coordonnées 1920×1080 : on la dessine réduite (même proportion) et centrée, souris, boutons et
// cibles du guide étant convertis.
// Prompt 105 : l'appli occupe tout l'écran du PC (échelle 1, plus de barre des tâches dessous)
const FENETRE_APPLI = { k: 1, x: 0, y: 0 };
let transformAppli = null;
let sourisAvantAppli = null;
function entrerFenetreAppli() {
	const A = FENETRE_APPLI;
	noStroke();
	fill(0, 0, 0, 120);
	rect(A.x + 8, A.y + 10, L * A.k, H * A.k); // ombre de la fenêtre
	sourisAvantAppli = { x: mouseX, y: mouseY };
	window.mouseX = (mouseX - A.x) / A.k;
	window.mouseY = (mouseY - A.y) / A.k;
	push();
	translate(A.x, A.y);
	scale(A.k);
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(0, 0, L, H);
	drawingContext.clip();
	transformAppli = A;
	return boutons.length;
}
function sortirFenetreAppli(n0) {
	const A = FENETRE_APPLI;
	drawingContext.restore();
	pop();
	transformAppli = null;
	window.mouseX = sourisAvantAppli.x;
	window.mouseY = sourisAvantAppli.y;
	for (let i = n0; i < boutons.length; i++) {
		const b = boutons[i];
		boutons[i] = Object.assign({}, b, { x: A.x + b.x * A.k, y: A.y + b.y * A.k, l: b.l * A.k, h: b.h * A.k });
	}
	noFill();
	stroke(DS.blanc15);
	strokeWeight(2);
	rect(A.x - 1, A.y - 1, L * A.k + 2, H * A.k + 2);
	noStroke();
}
function dessinerDemarrage() {
	const tB = millis() - PC.debut;
	background(DS.fond);
	if (tB < 1200) {
		const lignes = [0, 1, 2, 3, 4].map((n) => t('os.bios.' + n));
		lignes.slice(0, 1 + Math.floor(tB / 220)).forEach((l, i) => dsTexte(l, 80, 80 + i * 44, 26, i === 0 ? DS.primaireTexte : DS.blanc75, 'left'));
	} else if (tB < DUREE_DEMARRAGE - 500) {
		// Logo du système fictif + titre pixel + barre de progression
		// Prompt 152 : l'écran de régulation de logo/planche.html (pin sur l'écran, Loire en escalier), 16 × 16 à l'échelle 8
		const cx = L / 2;
		const cy = H / 2 - 80;
		dessinerIconePixel(ICONE_ECRAN, cx - 64, cy - 64, 128, { P: DS.primaire, W: DS.blanc, G: '#8c8c8c', K: DS.fond });
		dsTitre('RegulOS', cx, cy + 96, 56, DS.blanc, 'center');
		const p = constrain((tB - 1200) / (DUREE_DEMARRAGE - 1700), 0, 1);
		stroke(DS.blanc15);
		strokeWeight(2);
		noFill();
		rect(cx - 200, cy + 190, 400, 20);
		noStroke();
		fill(DS.primaire);
		const blocs = Math.floor(p * 24);
		for (let k = 0; k < blocs; k++) rect(cx - 196 + k * 16.4, cy + 194, 12, 12); // progression par blocs (pixel)
	} else {
		drawingContext.imageSmoothingEnabled = false;
		image(fondOS(), 0, 0, L, H);
		drawingContext.imageSmoothingEnabled = true;
		fill(DS.noir50);
		rect(L / 2 - 260, H / 2 - 60, 520, 120);
		dsTitre(t('os.bienvenue'), L / 2, H / 2 - 30, 56, DS.blanc, 'center');
	}
	if (tB >= DUREE_DEMARRAGE) versAppliPrincipale(); // prompt 183 : le démarrage mène directement à l'appli principale
}

// =====================================================================
// Prompt 22 — applications du poste de travail (fenêtres RégulOS, Pixel Design System)
// Le temps ne s'arrête pas pendant la lecture d'une app (comme les livres du prompt 20).
// =====================================================================
// Prompt 183 : ces icônes ne sont plus posées sur un bureau — ce sont celles du menu de l'appli (menu-app.js)
const ICONES_OS = [
	{ cle: 'signalements', nom: T('app.signalements'), dessin: (x, y, s) => iconePixel(x, y, s, 'signalements') }, // prompts 68 / 73 : l'écran de jeu (ex-« Carte », plus de carte)
	{ cle: 'patron', nom: T('app.patron'), dessin: (x, y, s) => iconePixel(x, y, s, 'enveloppe') },
	{ cle: 'community', nom: T('app.community'), dessin: (x, y, s) => iconePixel(x, y, s, 'bulle') },
	{ cle: 'journal', nom: T('app.journal'), dessin: (x, y, s) => iconePixel(x, y, s, 'livre') },
	// Prompt 103 : Indicateurs (jauges déjà dans le bandeau) et Corbeille (décorative) retirés du PC
];

/** Ouvre une appli par son rang dans ICONES_OS (menu de l'appli, Tab + Entrée, notifications) */
function ouvrirIconeOS(i) {
	PC.selection = i;
	const cle = ICONES_OS[i].cle;
	if (!appliDebloquee(cle)) return refuserAppliVerrouillee(cle); // prompt 91 § 2
	if (cle === 'signalements') return versAppliPrincipale(), Confort.Son.bip('choix');
	if (cle === 'donnees') return ouvrirDonnees(); // prompt 61
	PC.etat = 'os';
	PC.fenetre = cle; // vue intégrée (prompt 103)
	PC.message = '';
	if (Jeu.nonLus && Jeu.nonLus[cle] !== undefined) Jeu.nonLus[cle] = 0;
	Confort.Son.bip('choix');
}
/** Fermer une appli (Échap) : retour à l'appli principale */
function fermerFenetreApp() {
	versAppliPrincipale();
}
function badgeIcone(cle) {
	if (cle === 'signalements') return typeof incidentActif === 'function' && incidentActif() ? '!' : ''; // prompt 68
	// Prompt 101 (règle 6) : un badge seulement pour ce qui est À FAIRE — les plaintes qui attendent une réponse ;
	// les nouveaux messages du patron (information) restent annoncés par les notifications et « Nouveaux messages »
	if (cle === 'community') {
		const n = (Jeu.plaintes || []).filter((p) => p.reponse === null && !p.expiree && !p.transmise).length;
		return n ? String(n) : '';
	}
	return '';
}

/** Icônes 80×80 en pixels (rectangles, angles droits), dessinées par le code */
function iconePixel(x, y, s, type) {
	s = s || 1;
	push();
	translate(x, y);
	scale(s);
	noStroke();
	fill(DS.fond);
	rect(0, 0, 80, 80);
	stroke(DS.blanc15);
	strokeWeight(2);
	noFill();
	rect(1, 1, 78, 78);
	noStroke();
	if (type === 'enveloppe') {
		fill(DS.blanc);
		rect(12, 22, 56, 38);
		fill(DS.primaire);
		for (let k = 0; k < 7; k++) rect(16 + k * 4, 26 + k * 3, 4, 4), rect(60 - k * 4, 26 + k * 3, 4, 4);
	} else if (type === 'signalements') {
		// Prompt 73 : une liste de signalements (pastille de gravité + deux traits), plus de carte
		[DS.primaire, '#FFC138', DS.blanc50].forEach((c, k) => {
			fill(c);
			rect(12, 14 + k * 19, 8, 13);
			fill(DS.blanc);
			rect(26, 15 + k * 19, 42 - k * 6, 4);
			fill(DS.blanc50);
			rect(26, 22 + k * 19, 30 - k * 4, 3);
		});
		fill(DS.primaire);
		rect(12, 66, 56, 4);
	} else if (type === 'bulle') {
		fill(DS.blanc);
		rect(10, 14, 60, 38);
		rect(20, 52, 10, 10);
		fill(DS.fond);
		for (let k = 0; k < 3; k++) rect(20, 22 + k * 9, 40 - k * 10, 4);
	} else if (type === 'livre') {
		fill(DS.primaire);
		rect(12, 14, 26, 52);
		rect(42, 14, 26, 52);
		fill(DS.blanc);
		rect(16, 18, 18, 44);
		rect(46, 18, 18, 44);
		fill(DS.fond);
		for (let k = 0; k < 4; k++) rect(18, 24 + k * 9, 14, 2), rect(48, 24 + k * 9, 14, 2);
	}
	pop();
}

function derniers(liste, n) {
	return liste.slice(Math.max(0, liste.length - n));
}


// ——— Prompt 28 : plaintes des Nantais (contenu : data/messages.json) ———
let focusReponse = -1; // réponse sélectionnée au clavier (Tab / Entrée, ou 1 / 2 / 3) ; prompt 204 : −1 = aucune, pour qu'Entrée n'envoie jamais une réponse (le clash peut être en tête) sans choix explicite
let retourPlainte = null; // { texte, bonne, jusqua } : résultat affiché quelques secondes après une réponse

function repondrePlainte(i, cible) {
	const p = cible || cibleCommunity(); // prompt 85 : la plainte visée (mention ou conversation privée)
	if (!p) return;
	const r = Jeu.repondrePlainte(p, i, millis()); // prompt 79 : réponse rapide ou tardive
	if (!r) return;
	focusReponse = -1;
	if (r.clash && !r.froid && typeof feedback === 'function') feedback('large'); // prompt 202 : pas de secousse pour un clash froid // prompt 197 : le clash est récompensé à l'instant (choc « large »), conséquences inchangées (réputation −8, réponse « mauvaise »)
	const fx = Object.keys(r.effets)
		.map((k) => t('jauge.' + k) + ' ' + (r.effets[k] > 0 ? '+' : '') + r.effets[k])
		.join(' · ');
	const texte = t(r.bonne ? 'plainte.bonne' : 'plainte.mauvaise', { effets: fx || '0' }) + (r.tardive ? ' ' + t('plainte.tardive') : '') + (r.clash && r.reaction ? ' ' + t('commu.reactionClash', { auteur: p.auteur, reaction: r.reaction }) : ''); // prompt 197 : réaction de connard du plaignant
	if (r.signale) retourPlainte = { texte: r.notice, bonne: true, jusqua: millis() + 7000 }; // prompt 202 : notice de modération
	else retourPlainte = { texte, bonne: r.bonne, jusqua: millis() + 5000 };
	const lu = retourPlainte.texte;
	annoncer(typeof lireMasques === 'function' ? lireMasques(lu) : lu); // aria-live ; prompt 197 : masques hors alphabet lus « mot masqué »
	Confort.Son.bip(r.bonne ? 'action' : 'alerte');
}


function appCommunity(z) {
	dessinerCompteSocial(z); // prompt 85 : le compte social de la régulation (community.js)
}

// Prompt 63 : journal par journée, avec une enquête après coup sur chaque incident (données réelles uniquement)
// Prompt 89 : l'appli Journal (appJournal, enquête, JOURNAL, VOLETS_ENQUETE) est dans journal.js / journal-donnees.js
const signe = (v) => (v > 0 ? '+' + v : v < 0 ? '−' + Math.abs(v) : '0');

// =====================================================================
// Prompt 36 — app flottante « Indicateurs » (la Corbeille, inaccessible depuis le prompt 103, a été retirée au prompt 200)
// =====================================================================
// Fenêtre flottante, toujours au premier plan, déplaçable par sa barre de titre ; position mémorisée
const CLE_INDICATEURS = 'pxe-nte001:jeu:indicateurs';
const INDIC = (() => {
	let pos = { x: 1440, y: 120 };
	try {
		const o = JSON.parse(localStorage.getItem(CLE_INDICATEURS) || 'null');
		if (o && Number.isFinite(o.x) && Number.isFinite(o.y)) pos = o;
	} catch (e) {}
	return { l: 460, h: 572, pos, prise: null, deplie: false }; // prompt 84 : + statut auprès du patron ; prompt 88 : + grade et badges ; prompt 101 (D2) : replié par défaut
})();
// Prompt 101, décision D2 (groupe, 12/11/2026) : panneau replié par défaut sur les trois jauges ; l'objectif, les
// seuils, le statut, le grade et les badges s'affichent au survol, ou restent dépliés (bouton « Détails » ou touche V)
const INDIC_H = { replie: 324, deplie: 616 }; // déplié : le contenu d'avant (572) décalé de 44 px sous « Détails »
function basculerDetailsIndicateurs() {
	INDIC.deplie = !INDIC.deplie;
	Confort.Son.clic();
	annoncer(t(INDIC.deplie ? 'journal.details' : 'journal.detailsMasquer'));
}
function basculerIndicateurs() {
	PC.flottant = !PC.flottant;
	if (PC.flottant) annoncer(t('indic.annonce', { f: Jeu.jauges ? Jeu.jauges.fluidite : 50, r: Jeu.jauges ? Jeu.jauges.reputation : 50, b: Jeu.jauges ? Jeu.jauges.budget : 50 }));
	Confort.Son.bip('choix');
}
/** Souris dans les coordonnées de l'écran du PC (utile dans une action de clic, appelée hors de draw) */
function sourisEcranPC() {
	return pointeurEcranPC(mouseX, mouseY); // prompt 182 (bureau.js)
}
function couleurJauge(v) {
	return v < 20 ? DS.erreur : v < 40 ? DS.alerte : DS.succes;
}
/** Dessinée par-dessus l'appli (coordonnées de l'écran du PC) */
function dessinerIndicateurs() {
	if (!PC.flottant || PC.etat === 'eteint' || PC.etat === 'demarrage') return;
	// Prompt 204 : retiré pendant un dossier (les jauges restent dans le bandeau) — posé sur la fiche ou sur la partie
	// libre de la carte, il cachait la conclusion ou le marqueur ; il revient seul au dossier suivant
	if (typeof dossierOuvert === 'function' && dossierOuvert() && PC.etat === 'appli' && !INDIC.prise) return;
	const I = INDIC;
	const survol = mouseX >= I.pos.x && mouseX <= I.pos.x + I.l && mouseY >= I.pos.y && mouseY <= I.pos.y + I.h;
	const deplie = I.deplie || !!I.prise || survol;
	I.h = deplie ? Math.max(INDIC_H.deplie, I.hDeplie || 0) : INDIC_H.replie; // prompt 204 : hauteur dépliée mesurée
	if (I.prise) {
		if (mouseIsPressed) {
			I.pos.x = constrain(mouseX - I.prise.dx, 0, L - I.l);
			I.pos.y = constrain(mouseY - I.prise.dy, 0, H - I.h);
		} else {
			I.prise = null;
			try {
				localStorage.setItem(CLE_INDICATEURS, JSON.stringify(I.pos));
			} catch (e) {}
		}
	}
	const { x, y } = I.pos;
	noStroke();
	fill(0, 0, 0, 110);
	rect(x + 8, y + 10, I.l, I.h); // ombre : la fenêtre flotte
	fill(DS.fond);
	rect(x, y, I.l, I.h);
	stroke(DS.blanc15);
	strokeWeight(2);
	noFill();
	rect(x + 1, y + 1, I.l - 2, I.h - 2);
	noStroke();
	// Barre de titre (poignée de déplacement)
	fill(I.prise ? DS.primaire : '#1d1b1b');
	rect(x, y, I.l, 44);
	dsTitre(t('indic.titre'), x + 14, y + 8, 22, DS.blanc, 'left');
	dsTexte('⠿', x + I.l - 84, y + 10, 20, DS.blanc50, 'left');
	boutons.push({
		x,
		y,
		l: I.l - 48,
		h: 44,
		action: () => {
			const m = sourisEcranPC();
			I.prise = { dx: m.x - I.pos.x, dy: m.y - I.pos.y };
		},
	});
	const cx = x + I.l - 42;
	fill(DS.fond);
	rect(cx, y + 6, 32, 32);
	stroke(DS.blanc);
	strokeWeight(3);
	line(cx + 9, y + 15, cx + 23, y + 29);
	line(cx + 23, y + 15, cx + 9, y + 29);
	noStroke();
	boutons.push({ x: cx, y: y + 6, l: 32, h: 32, action: basculerIndicateurs });
	if (!Jeu.jauges || ecran !== 'jeu') {
		dsTexte(t('indic.aucunePartie'), x + 18, y + 66, 18, DS.blanc75, 'left', I.l - 36);
		return;
	}
	// Variation due à la dernière décision (deltas réels du journal)
	const dernier = (Jeu.evenementsJournee || [])[Jeu.evenementsJournee.length - 1];
	const aff = jaugesAffichees(); // prompt 184 : mêmes valeurs animées et mêmes segments vert / rouge que le bandeau
	['fluidite', 'reputation', 'budget'].forEach((k, i) => {
		const v = aff[k];
		const ly = y + 62 + i * 74;
		dsTexte(t('jaugeTitre.' + k), x + 18, ly, 20, DS.blanc, 'left');
		fill(DS.blanc15);
		rect(x + 18, ly + 32, I.l - 36, 14);
		fill(couleurJauge(v));
		rect(x + 18, ly + 32, ((I.l - 36) * v) / 100, 14);
		dessinerDeltasJauge(k, x + 18, ly + 32, I.l - 36, 14);
		// Prompt 143 : plus de « v / 100 » ; barre blanche de seuil sur la seule jauge objectif du jour, libellée dessous
		if (dessinerSeuilObjectif(k, x + 18, ly + 32, I.l - 36, 14)) dsTexte('| ' + texteSeuilObjectif(k), x + I.l - 120, ly + 3, 15, DS.blanc, 'right'); // libellé sur la ligne du titre, avant le delta
		const d = dernier && dernier.deltas ? dernier.deltas[k] : null;
		if (d) dsTexte((d > 0 ? '▲ +' : '▼ ') + d, x + I.l - 18, ly, 16, d > 0 ? DS.succes : DS.alerte, 'right');
	});
	// Replié : « Détails » (clic / toucher, V) ; déplié par le bouton : « Masquer les détails » en bas
	// Bouton à la même place dans les deux états (le survol déplie sans le déplacer sous la souris)
	dsBouton(x + 18, y + 268, 300, 44, t(I.deplie ? 'journal.detailsMasquer' : 'journal.details') + ' (V)', basculerDetailsIndicateurs, 'fantome');
	if (!deplie) return;
	// Prompt 204 : blocs empilés selon leur hauteur réelle (texte relevé à 20 px, coupé sur plusieurs lignes) — les
	// positions fixes d'avant faisaient chevaucher objectif, budget et statut
	let yy = y + 328;
	const bloc = (txt, coul) => {
		const n = couperLignes(txt, I.l - 36, DS.policeTexte, 16).length;
		dsTexte(txt, x + 18, yy, 16, coul, 'left', I.l - 36);
		yy += Math.max(1, n) * textLeading() + 14;
	};
	const o = Jeu.objectifDuJour ? Jeu.objectifDuJour() : null;
	if (o) bloc(t('indic.objectif', { libelle: o.libelle, ok: Jeu.jauges[o.jauge] >= o.seuil ? '✓' : '✗' }), DS.blanc75);
	const b = Jeu.jauges.budget;
	bloc(t(b < 20 ? 'indic.budgetBas' : b >= 70 ? 'indic.budgetHaut' : 'indic.budgetMoyen'), DS.blanc50);
	// Prompt 84 : statut auprès du patron (niveau et avertissements)
	const S = Jeu.statutPatron || { niveau: 0, avertissements: 0 };
	bloc(t('indic.statut', { statut: t(['statut.normal', 'statut.surveillance', 'statut.dernier'][S.niveau] || 'statut.normal'), n: S.avertissements }), S.niveau === 2 ? DS.erreurClair : S.niveau === 1 ? DS.alerte : DS.blanc75);
	// Prompt 88 : grade (carrière, entre les parties) et vitrine des badges — faits de la partie uniquement
	if (typeof Taches !== 'undefined') {
		const g = Taches.grade();
		bloc(t('indic.grade', { grade: t('grade.' + g.i), xp: g.xp }), DS.blanc);
		const c = Taches.carriere();
		Taches.R.badges.forEach((b, i) => {
			const obtenu = !!(c.badges[b] && c.badges[b].n);
			dessinerBadge(b, x + 18 + i * 108, yy, 40, obtenu);
			if (obtenu && c.badges[b].n > 1) dsTexte('×' + c.badges[b].n, x + 64 + i * 108, yy + 20, 14, DS.blanc75, 'left');
		});
		yy += 64;
	}
	I.hDeplie = yy + 16 - y;
}
