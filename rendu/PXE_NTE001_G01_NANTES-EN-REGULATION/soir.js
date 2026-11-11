/* Nantes en régulation — prompt 69 : fin de journée, la nuit tombe, une flèche montre la sortie du bureau.
 * - Le mail du soir se ferme par « Ranger le poste » : phase « soir » (ni incident, ni sieste).
 * - Le joueur se lève, le PC passe en veille, l'horloge simulée file jusqu'à 21 h en ~4 s (crépuscule
 *   accéléré ; nuit directe si les animations sont réduites). Les règles et la boucle (Q1–Q61) ne changent pas.
 * - Nuit installée : flèche « Sortie » au bord gauche de la vue bureau (Tab, Entrée ou S, clic, tactile).
 * - Sortie : la vue pivote vers la gauche (couloir sombre, panneau vert « Sortie » au-dessus d'une ouverture),
 *   fondu au noir, écran de transition (passable), puis le lendemain 8 h (prompt 76) — ou le bilan le dernier jour.
 * Aucune donnée inventée : la météo de la nuit reste celle du jour joué (pluie comprise).
 */
const SOIR = { debut: 0, depart: 0, annonce: false, sortie: 0, finie: false };
const DUREE_CREPUSCULE = 4000;
const DUREE_PAN_SORTIE = 800;
const DUREE_FONDU_SORTIE = 600;
const DUREE_NOIR_SORTIE = 1500;
const MINUTES_NUIT = 21 * 60;
const CLE_SOIR_GUIDE = 'pxe-nte001:jeu:soir-vu';

/** « Ranger le poste » : ferme le mail du soir sans passer au lendemain */
function rangerPoste() {
	if (phase !== 'mail') return;
	phase = 'soir';
	SOIR.debut = millis();
	SOIR.depart = Jeu.horloge ? Jeu.horloge.minutes : MINUTES_NUIT;
	SOIR.annonce = false;
	SOIR.sortie = 0;
	enSieste = false;
	reveil = null;
	if (typeof PC !== 'undefined') PC.fenetre = null;
	if (vue === 'poste') seLever(); // on se lève : vue bureau, PC en veille
	Confort.Son.bip('choix');
	if (Confort.Son.musique && Confort.Son.musique.attenuer) Confort.Son.musique.attenuer(0.55); // musique plus basse le soir
	Sauvegarde.auto(false);
}
/** Reprise d'une sauvegarde faite le soir : la nuit est déjà tombée, la flèche est là */
function reprendreSoir() {
	SOIR.debut = millis() - DUREE_CREPUSCULE;
	SOIR.depart = MINUTES_NUIT;
	SOIR.annonce = false;
	SOIR.sortie = 0;
	if (typeof METEO_VISU !== 'undefined') METEO_VISU.nuit = 1; // pas de crépuscule à rejouer
	if (Confort.Son.musique && Confort.Son.musique.attenuer) Confort.Son.musique.attenuer(0.55);
}
function progressionSoir() {
	if (phase !== 'soir') return 0;
	if (reduireAnimations) return 1;
	return constrain((millis() - SOIR.debut) / DUREE_CREPUSCULE, 0, 1);
}
/** Facteur de nuit imposé le soir (bureau.js : facteurNuit), y compris en mode temps réel */
function nuitSoir() {
	const p = progressionSoir();
	return p * p * (3 - 2 * p);
}
function nuitInstallee() {
	return phase === 'soir' && progressionSoir() >= 1 && (reduireAnimations || METEO_VISU.nuit === null || METEO_VISU.nuit > 0.85);
}
function sortieVisible() {
	return ecran === 'jeu' && nuitInstallee() && !SOIR.sortie && !MENU.actif;
}

/** Une fois par image : crépuscule accéléré, annonce, déroulé de la sortie */
function majSoir() {
	if (phase !== 'soir' || ecran !== 'jeu') return;
	if (Jeu.horloge && Jeu.etat.mode !== 'direct' && !enPause) {
		const cible = Math.max(SOIR.depart, MINUTES_NUIT);
		Jeu.horloge.minutes = SOIR.depart + (cible - SOIR.depart) * progressionSoir();
	}
	if (nuitInstallee() && !SOIR.annonce) {
		SOIR.annonce = true;
		annoncer(t('soir.annonce'));
	}
	if (SOIR.sortie && millis() - SOIR.sortie >= dureePanSortie() + DUREE_FONDU_SORTIE + DUREE_NOIR_SORTIE) finirSoir();
}
const dureePanSortie = () => (reduireAnimations ? 0 : DUREE_PAN_SORTIE);

/** Quitter le bureau (flèche, Entrée, S) */
function quitterBureau() {
	if (!sortieVisible()) return;
	interaction();
	SOIR.sortie = millis();
	focusBureau = -1;
	Confort.Son.bip('choix');
	annoncer(texteNoirSoir().titre + '. ' + (texteNoirSoir().sous || ''));
	try {
		localStorage.setItem(CLE_SOIR_GUIDE, 'oui');
	} catch (e) {}
}
function dernierJour() {
	return Jeu.terminee || !Jeu.jours || !Jeu.jours[Jeu.jourIndex + 1];
}
function texteNoirSoir() {
	if (dernierJour()) return Jeu.etat.mode === 'direct' ? { titre: t('soir.finService') } : { titre: t('soir.finSemaine') };
	const j = Jeu.jourCourant ? Jeu.jourCourant() : null;
	return { titre: t('soir.finJour', { date: j ? dateLongue(j.date) : '' }), sous: t('soir.demain') };
}
/** Fin de l'écran noir : lendemain 8 h (transition « JOUR n ») ou bilan de la semaine */
function finirSoir() {
	if (phase !== 'soir') return;
	SOIR.sortie = 0;
	CAMERA.x = 0;
	CAMERA.y = 0;
	if (Confort.Son.musique && Confort.Son.musique.attenuer) Confort.Son.musique.attenuer(1);
	journeeSuivante(); // inchangé : allerFin() le dernier jour
}

/** Caméra de la sortie (bureau.js : majCamera) : pan vers la gauche, ou null hors sortie */
function cameraSoir() {
	if (!SOIR.sortie || phase !== 'soir') return null;
	const p = dureePanSortie() ? constrain((millis() - SOIR.sortie) / dureePanSortie(), 0, 1) : 1;
	const e = p * p * (3 - 2 * p);
	return reduireAnimations ? 0 : e * L * 0.55;
}

// ——— Dessin : flèche « Sortie » (vue bureau) ———
const OBJET_SORTIE = { x: 41, y: 92, l: 34, h: 56 }; // x ≥ 40 : entièrement dans le cadre malgré le surcadrage (1,05)
/** Pictogramme de sortie de secours (dessin original) : homme qui court vers une porte, blanc sur vert */
function pictoSortie(x, y, u) {
	const v = '#0B7A3E'; // vert sortie de secours (blanc dessus : 5,6:1)
	noStroke();
	fill(v);
	rect(x, y, u * 12, u * 8);
	fill('#ffffff');
	// porte (à droite)
	rect(x + u * 8, y + u, u * 3, u * 6);
	fill(v);
	rect(x + u * 9, y + u * 2, u, u * 5);
	fill('#ffffff');
	// homme qui court vers la porte
	rect(x + u * 4, y + u, u, u); // tête
	rect(x + u * 3, y + u * 2, u * 2, u * 2); // buste
	rect(x + u * 5, y + u * 2, u * 2, u); // bras avant
	rect(x + u * 1, y + u * 3, u * 2, u); // bras arrière
	rect(x + u * 4, y + u * 4, u, u); // hanche
	rect(x + u * 5, y + u * 5, u, u * 2); // jambe avant
	rect(x + u * 2, y + u * 5, u * 2, u); // jambe arrière
	rect(x + u * 1, y + u * 6, u, u);
}
function dessinerFlecheSortie() {
	if (!sortieVisible() || vue !== 'bureau') return;
	const r = versEcranBureau(OBJET_SORTIE.x, OBJET_SORTIE.y, OBJET_SORTIE.l, OBJET_SORTIE.h);
	const pulse = reduireAnimations ? 1 : 0.6 + 0.4 * Math.sin((millis() / 1000) * Math.PI * 2); // 1 pulsation/s
	noStroke();
	// halo doux qui pulse (jamais de flash : variation d'opacité seulement)
	fill(255, 193, 56, Math.round(60 * pulse));
	rect(r.x - 10, r.y - 10, r.l + 20, r.h + 20);
	fill(13, 12, 12, 245);
	rect(r.x, r.y, r.l, r.h);
	stroke('#FFFFFF');
	strokeWeight(3);
	noFill();
	rect(r.x + 1.5, r.y + 1.5, r.l - 3, r.h - 3);
	noStroke();
	const u = Math.floor((r.l - 24) / 12);
	pictoSortie(r.x + (r.l - u * 12) / 2, r.y + 14, u);
	// grande flèche pixel vers la gauche (jaune Warning du DS, contour sombre)
	const fy = r.y + 14 + u * 8 + 22;
	const fh = Math.max(40, r.h * 0.26);
	const fx = r.x + 14;
	const fl = r.l - 28;
	fill('#FFC138');
	triangle(fx, fy + fh / 2, fx + fh * 0.7, fy, fx + fh * 0.7, fy + fh);
	rect(fx + fh * 0.7 - 1, fy + fh * 0.3, fl - fh * 0.7 + 1, fh * 0.4);
	// libellé
	fill('#FFFFFF');
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textAlign(CENTER, TOP);
	ajusterTaille(t('soir.sortie'), r.l - 20, 28);
	text(t('soir.sortie'), r.x + r.l / 2, fy + fh + 14);
	textStyle(NORMAL);
	textAlign(LEFT, TOP);
	cibleGuide('sortie', r.x, r.y, r.l, r.h);
}

// ——— Dessin : couloir révélé par le pan, fondu et écran noir (au-dessus de la pièce) ———
function dessinerCouloirSoir() {
	if (!SOIR.sortie || phase !== 'soir' || vue !== 'bureau') return;
	const o = origineBureau();
	const w = Math.max(0, o.x);
	if (w > 1) {
		noStroke();
		fill('#0e121b');
		rect(0, 0, w, H);
		fill('#080a10');
		rect(0, H * 0.72, w, H * 0.28); // sol
		fill('#141a26');
		for (let x = 0; x < w; x += 96) rect(x, H * 0.72, 4, H * 0.28); // joints du sol
		// ouverture au bout du couloir
		const ol = Math.min(260, w * 0.45);
		const ox = w * 0.5 - ol / 2;
		fill('#000000');
		rect(ox, H * 0.3, ol, H * 0.42);
		fill('#1b2231');
		rect(ox - 12, H * 0.3 - 12, ol + 24, 12);
		rect(ox - 12, H * 0.3, 12, H * 0.42);
		rect(ox + ol, H * 0.3, 12, H * 0.42);
		// panneau vert « Sortie » au-dessus
		const u = 8;
		const px0 = ox + ol / 2 - u * 6;
		const py0 = H * 0.3 - 12 - u * 8 - 24;
		fill(11, 122, 62, 60);
		rect(px0 - 20, py0 - 16, u * 12 + 40, u * 8 + 32); // lueur
		pictoSortie(px0, py0, u);
	}
}
/** Écran noir de transition (au-dessus de tout), passable par Entrée ou clic */
function dessinerNoirSoir() {
	if (!SOIR.sortie || phase !== 'soir') return false;
	const u = millis() - SOIR.sortie;
	const debut = dureePanSortie() + DUREE_FONDU_SORTIE;
	if (u < debut) {
		// fondu au noir (0,6 s) après le pan ; jamais vers le blanc
		const a = u < dureePanSortie() ? 0 : constrain((u - dureePanSortie()) / DUREE_FONDU_SORTIE, 0, 1);
		if (a > 0) {
			noStroke();
			fill(0, 0, 0, Math.round(255 * a));
			rect(0, 0, L, H);
		}
		return false;
	}
	boutons = [{ x: 0, y: 0, l: L, h: H, action: finirSoir }];
	noStroke();
	fill(0);
	rect(0, 0, L, H);
	const tx = texteNoirSoir();
	dsTitre(tx.titre, L / 2, H / 2 - 60, 56, '#ffffff', 'center');
	if (tx.sous) {
		noStroke();
		textAlign(CENTER, TOP);
		textFont(POLICE_TEXTE);
		textSize(26);
		fill('rgba(255,255,255,0.8)');
		text(tx.sous, L / 2, H / 2 + 30);
	}
	return true;
}

/** Bulle d'aide du premier soir (guide « Prendre en main » : étape « Quitter le bureau ») */
function premierSoir() {
	try {
		return localStorage.getItem(CLE_SOIR_GUIDE) !== 'oui';
	} catch (e) {
		return false;
	}
}
function dessinerGuideSoir() {
	if (!sortieVisible() || vue !== 'bureau' || fenetre || !premierSoir()) return;
	const r = versEcranBureau(OBJET_SORTIE.x, OBJET_SORTIE.y, OBJET_SORTIE.l, OBJET_SORTIE.h);
	const px0 = r.x + r.l + 14;
	const py0 = r.y + r.h / 2;
	push();
	translate(px0, py0);
	rotate(HALF_PI); // flèche du guide pointée vers la gauche, sur la sortie
	flecheGuide(0, 0, true);
	pop();
	bulleGuide(t('guide.sortir'), 0, py0, false, px0 + 110, true);
}

/** Clavier pendant le soir (avant le traitement habituel du bureau) */
function toucheSoir() {
	if (phase !== 'soir') return false;
	if (SOIR.sortie) {
		if (millis() - SOIR.sortie >= dureePanSortie() + DUREE_FONDU_SORTIE && (keyCode === ENTER || keyCode === RETURN || key === ' ' || keyCode === ESCAPE)) finirSoir();
		return true; // pendant la sortie, le clavier attend
	}
	if (vue !== 'bureau' || fenetre || MENU.actif) return false;
	const surSortie = focusBureau > 0 && OBJETS_BUREAU[focusBureau] && OBJETS_BUREAU[focusBureau].nom === 'sortie';
	if ((key === 's' || key === 'S') || ((keyCode === ENTER || keyCode === RETURN) && (focusBureau < 0 || surSortie))) {
		if (sortieVisible()) quitterBureau();
		return true;
	}
	return false;
}
