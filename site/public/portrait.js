/* Nantes en régulation — prompt 60, sous-étape 60b : mise en page portrait dédiée (téléphone tenu droit).
 * Principe : RECOMPOSITION. Le jeu continue de dessiner en 1920×1080 (ordinateur et paysage inchangés) ; en
 * portrait, un second canevas 1080×1920 recompose, à chaque image, des régions de cette image empilées :
 *   appli Signalements : jauges (fixes) / liste des signalements + lignes, dossier avec sources, compteur et actions (défilables,
 *     défilement automatique vers le dossier à son arrivée) / barre des tâches et « Se lever » (fixes) ;
 *   fenêtres : recadrées à leur largeur ; téléphone et tasse en main : recadrés sur l'objet ; menu : sa colonne ;
 *   bureau : la pièce en haut, et tous les objets en grosses cibles tactiles en dessous (≥ 96 px).
 * Les touchers sont reconvertis vers les coordonnées 1920×1080 avant d'appeler les gestionnaires du jeu.
 * Aucune règle touchée ; ne s'active qu'en mode mobile portrait.
 */
const PL = 1080;
const PH = 1920;
const PORTRAIT = { actif: false, canevas: null, ctx: null, regions: [], boutons: [], defil: 0, defilMax: 0, cible: null, dernierDossier: -1, toucher: null };

function activerPortrait(oui) {
	if (oui === PORTRAIT.actif) return;
	PORTRAIT.actif = oui;
	document.body.classList.toggle('portrait', oui);
	if (oui && !PORTRAIT.canevas) {
		const c = document.createElement('canvas');
		c.id = 'portrait';
		c.width = PL;
		c.height = PH;
		c.setAttribute('aria-hidden', 'true'); // les annonces aria-live restent celles du jeu
		document.getElementById('scene').appendChild(c);
		PORTRAIT.canevas = c;
		PORTRAIT.ctx = c.getContext('2d');
	}
}

// ——— Régions : source (image 1920×1080) → destination (portrait), avec ou sans défilement ———
const KP = () => ECRAN_POSTE.l / L;
/** Rectangle de l'appli Régulation (coordonnées de l'appli) → image principale */
function appliVersImage(r) {
	const A = FENETRE_APPLI;
	const k = KP();
	return { x: ECRAN_POSTE.x + (A.x + r.x * A.k) * k, y: ECRAN_POSTE.y + (A.y + r.y * A.k) * k, l: r.l * A.k * k, h: r.h * A.k * k };
}
/** Rectangle de l'écran du PC (coordonnées PC) → image principale */
function pcVersImage(r) {
	const k = KP();
	return { x: ECRAN_POSTE.x + r.x * k, y: ECRAN_POSTE.y + r.y * k, l: r.l * k, h: r.h * k };
}
function region(src, dx, dy, dl, defile) {
	const dh = (src.h * dl) / src.l;
	PORTRAIT.regions.push({ src, dst: { x: dx, y: dy, l: dl, h: dh }, defile: !!defile });
	return dh;
}
const LARGEUR_FENETRE = { partage: 900, palmares: 1440, 'livre-stress': 1400, aide: 1260, accessibilite: 1260, parametres: 1040, menu: 760, inspection: 1140, demission: 940, partir: 1040, blame: 1140, mailFin: 1140, reset: 1000, reprise: 1100, tache: 1260, optionsJeu: 1520, deblocage: 1020 }; // prompt 88

function scenePortrait() {
	if (typeof CINE !== 'undefined' && CINE) return 'plein';
	if (fenetre === 'telephone' || fenetre === 'cafe' || smsActif) return 'main';
	if (fenetre === 'rapport') return 'rapport';
	if (fenetre || tutoriel) return 'fenetre';
	if (MENU.actif) return 'menu';
	if (vue === 'poste' && PC.etat === 'appli' && ecran === 'jeu') return 'appli';
	if (vue === 'poste' && typeof vueIntegree === 'function' && vueIntegree()) return 'vueApp'; // prompt 103 : vue intégrée de l'appli
	if (vue === 'poste' && PC.etat === 'os' && (PC.fenetre === 'community' || PC.fenetre === 'patron') && ecran === 'jeu') return 'community'; // prompts 85 / 86 : une colonne
	if (vue === 'bureau' && ecran === 'jeu' && !TRANSITION_JOUR) return 'bureau';
	return 'plein';
}

function composerPortrait() {
	if (!PORTRAIT.actif) return;
	const ctx = PORTRAIT.ctx;
	const src = document.querySelector('#scene canvas.p5Canvas');
	if (!src) return;
	PORTRAIT.regions = [];
	PORTRAIT.boutons = [];
	const scene = scenePortrait();
	if (scene === 'appli') regionsAppli();
	else if (scene === 'vueApp') {
		// Prompt 103 : bandeau en haut, contenu de la vue au milieu (défilant), menu en barre d'onglets en bas
		const hj = region(appliVersImage(BANDEAU), 20, 12, PL - 40);
		region(appliVersImage(ZONE_VUE), 20, 12 + hj + 8, PL - 40, true);
		region(appliVersImage(MENU_BAS), 0, PH - 150, PL);
	}
	else if (scene === 'community') region(pcVersImage({ x: FENETRE_APP.x, y: FENETRE_APP.y, l: 924, h: FENETRE_APP.h }), 0, 160, PL); // prompt 85 : colonne de 860 px, onglets en bas
	else if (scene === 'main') region({ x: 880, y: 0, l: 780, h: H }, 0, 200, PL);
	else if (scene === 'rapport') region({ x: 420, y: 0, l: 1420, h: H }, 0, (PH - (H * PL) / 1420) / 2, PL);
	else if (scene === 'fenetre') {
		const W = tutoriel ? 1400 : LARGEUR_FENETRE[fenetre] || 1260;
		region({ x: (L - W) / 2, y: 0, l: W, h: H }, 0, (PH - (H * PL) / W) / 2, PL);
	} else if (scene === 'menu') {
		const hm = region({ x: 110, y: 60, l: BLOC_PARTAGE.x - 120, h: 1000 }, 0, 440, PL); // colonne du menu, titre entier (s'arrête avant le bloc de partage)
		region({ x: BLOC_PARTAGE.x - 12, y: BLOC_PARTAGE.y - 12, l: 3 * BLOC_PARTAGE.l + 56, h: BLOC_PARTAGE.h + 24 }, 20, 440 + hm + 24, PL - 40); // prompt 81 : dépôt et partage sous le menu (≥ 44 px)
	}
	else if (scene === 'bureau') {
		region({ x: 0, y: 0, l: L, h: H }, 0, 150, PL);
		boutonsBureau();
	} else region({ x: 0, y: 0, l: L, h: H }, 0, (PH - (H * PL) / L) / 2, PL);
	// Dessin
	ctx.fillStyle = '#0D0C0C';
	ctx.fillRect(0, 0, PL, PH);
	ctx.imageSmoothingEnabled = true;
	const zone = scene === 'appli' ? { haut: PORTRAIT.hautDefil, bas: PORTRAIT.basDefil } : null;
	PORTRAIT.regions.forEach((r) => {
		const d = { ...r.dst, y: r.dst.y - (r.defile ? PORTRAIT.defil : 0) };
		ctx.save();
		if (r.defile && zone) {
			ctx.beginPath();
			ctx.rect(0, zone.haut, PL, zone.bas - zone.haut);
			ctx.clip();
		}
		ctx.drawImage(src, r.src.x, r.src.y, r.src.l, r.src.h, d.x, d.y, d.l, d.h);
		ctx.restore();
	});
	PORTRAIT.boutons.forEach((b) => dessinerBoutonPortrait(b));
	// Sieste : les paupières couvrent aussi tout le portrait (boutons compris), sauf pendant l'alarme de réveil
	if (typeof SOMMEIL !== 'undefined' && SOMMEIL.k > 0.001 && phase !== 'reveil' && !fenetre) {
		paupieres(ctx, SOMMEIL.k, PL, PH);
		if (SOMMEIL.k > 0.5) PORTRAIT.boutons = [];
		return;
	}
	if (scene === 'appli' && PORTRAIT.defilMax > 0) {
		// Ascenseur discret : où l'on est dans la colonne
		const h = ((zone.bas - zone.haut) * (zone.bas - zone.haut)) / (zone.bas - zone.haut + PORTRAIT.defilMax);
		const y = zone.haut + ((zone.bas - zone.haut - h) * PORTRAIT.defil) / PORTRAIT.defilMax;
		ctx.fillStyle = 'rgba(255,255,255,0.35)';
		ctx.fillRect(PL - 10, y, 6, h);
	}
}

/** Appli Signalements : jauges fixes, puis liste des signalements + lignes et dossier (défilables), barre des tâches + « Se lever » fixes */
function regionsAppli() {
	const hj = region(appliVersImage(BANDEAU), 20, 12, PL - 40); // prompt 87 : bandeau fin
	const hs = region(appliVersImage(ZONE_SOMNO), (PL - 600) / 2, 12 + hj + 8, 600); // prompt 78 : somnolence (≥ 44 px)
	const haut = 12 + hj + 8 + hs + 10;
	const bas = PH - 190;
	PORTRAIT.hautDefil = haut;
	PORTRAIT.basDefil = bas;
	let y = haut;
	// Prompt 73 : la liste des signalements en haut (hauteur selon le nombre de signalements), le dossier dessous,
	// puis la colonne lignes / objectif / équipes
	const nSig = Math.max(1, Math.min(typeof fileIncidents === 'function' ? fileIncidents().length : 1, 7));
	const zcP = typeof zoneCarte === 'function' ? zoneCarte() : FILE_SIG; // prompt 102 : la carte à la place de la liste
	y += region(appliVersImage({ x: zcP.x, y: zcP.y, l: zcP.l, h: zcP.h }), 20, y, PL - 40, true) + 16;
	y += region(appliVersImage(MENU_BAS), 0, y, PL) + 16; // prompt 103 : menu en barre d'onglets
	const yDossier = y;
	y += region(appliVersImage(PANNEAU), 20, y, PL - 40, true) + 16;
	PORTRAIT.defilMax = Math.max(0, y - bas);
	// Défilement automatique : vers le dossier à son arrivée, vers la liste des signalements quand on attend
	const enDossier = ['decision', 'contradiction', 'conflit', 'narration'].includes(phase);
	const cle = enDossier ? Jeu.index : -1;
	if (cle !== PORTRAIT.dernierDossier) {
		PORTRAIT.dernierDossier = cle;
		PORTRAIT.cible = enDossier ? Math.min(PORTRAIT.defilMax, yDossier - haut) : 0;
	}
	if (PORTRAIT.cible !== null) {
		PORTRAIT.defil += (PORTRAIT.cible - PORTRAIT.defil) * (reduireAnimations ? 1 : 0.25);
		if (Math.abs(PORTRAIT.cible - PORTRAIT.defil) < 1) (PORTRAIT.defil = PORTRAIT.cible), (PORTRAIT.cible = null);
	}
	PORTRAIT.defil = constrain(PORTRAIT.defil, 0, PORTRAIT.defilMax);
	region(pcVersImage({ x: 0, y: H - BARRE_OS, l: L, h: BARRE_OS }), 20, PH - 182, PL - 40);
	PORTRAIT.boutons.push({ x: 20, y: PH - 110, l: PL - 40, h: 96, texte: t('portrait.seLever'), action: quitterPC, primaire: false });
}
/** Bureau : tous les objets de la pièce en grosses cibles (2 colonnes), plus « S'installer au PC » */
function boutonsBureau() {
	let objets = [{ nom: 'ecran', label: t('portrait.installer'), action: sAsseoir }].concat(
		OBJETS_BUREAU.slice(1)
			.filter((o) => !o.visible || o.visible())
			.map((o) => ({ nom: o.nom, label: String(o.label), action: () => ouvrirObjetBureau(o.nom) })),
	);
	// Prompt 69 : le soir, la sortie devient la grande cible principale (← Sortie)
	if (typeof sortieVisible === 'function' && sortieVisible()) objets = [{ nom: 'sortie', label: '← ' + t('soir.sortie'), action: quitterBureau }].concat(objets.filter((o) => o.nom !== 'sortie'));
	const y0 = 150 + (H * PL) / L + 24;
	const lb = (PL - 60) / 2;
	const hp = objets[0].nom === 'sortie' ? 124 : 96; // prompt 69 : la sortie ≥ 44 px CSS sur un téléphone de 412 px
	objets.forEach((o, i) => {
		const premier = i === 0;
		const col = premier ? 0 : (i - 1) % 2;
		const ligne = premier ? 0 : 1 + Math.floor((i - 1) / 2);
		PORTRAIT.boutons.push({ x: premier ? 20 : 20 + col * (lb + 20), y: premier ? y0 : y0 + hp + 14 + (ligne - 1) * 110, l: premier ? PL - 40 : lb, h: premier ? hp : 96, texte: o.label, action: o.action, primaire: premier });
	});
}
function dessinerBoutonPortrait(b) {
	const ctx = PORTRAIT.ctx;
	ctx.fillStyle = b.primaire ? DS.primaire : '#171616'; // prompt 111
	ctx.fillRect(b.x, b.y, b.l, b.h);
	ctx.strokeStyle = b.primaire ? DS.primaire : 'rgba(255,255,255,0.6)';
	ctx.lineWidth = 3;
	ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.l - 3, b.h - 3);
	ctx.fillStyle = '#FFFFFF';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	let taille = 34;
	ctx.font = '600 ' + taille + 'px "JetBrains Mono", ui-monospace, monospace';
	while (taille > 22 && ctx.measureText(b.texte).width > b.l - 32) {
		taille -= 2;
		ctx.font = '600 ' + taille + 'px "JetBrains Mono", ui-monospace, monospace';
	}
	ctx.fillText(b.texte, b.x + b.l / 2, b.y + b.h / 2 + 2);
}

// ——— Entrées : portrait → image principale ———
function pointPortrait(e) {
	const tch = (e && e.changedTouches && e.changedTouches[0]) || (e && e.touches && e.touches[0]) || e;
	const r = PORTRAIT.canevas.getBoundingClientRect();
	return { x: ((tch.clientX - r.left) * PL) / r.width, y: ((tch.clientY - r.top) * PH) / r.height };
}
/** Place la souris du jeu sur le point correspondant ; renvoie false si le point ne tombe sur aucune région */
function viserDepuisPortrait(p) {
	for (let i = PORTRAIT.regions.length - 1; i >= 0; i--) {
		const r = PORTRAIT.regions[i];
		const dy = r.defile ? PORTRAIT.defil : 0;
		if (r.defile && (p.y < PORTRAIT.hautDefil || p.y > PORTRAIT.basDefil)) continue;
		const d = r.dst;
		if (p.x >= d.x && p.x <= d.x + d.l && p.y >= d.y - dy && p.y <= d.y - dy + d.h) {
			window.mouseX = r.src.x + ((p.x - d.x) * r.src.l) / d.l;
			window.mouseY = r.src.y + ((p.y - (d.y - dy)) * r.src.h) / d.h;
			return true;
		}
	}
	return false;
}
function portraitDebut(e) {
	const p = pointPortrait(e);
	PORTRAIT.toucher = { x: p.x, y: p.y, t: millis(), defil: PORTRAIT.defil };
	sourisDansCanevas = false;
	Confort.Son.demarrer();
	viserDepuisPortrait(p); // survol (infobulles) au point touché
}
function portraitDeplacement(e) {
	const d = PORTRAIT.toucher;
	if (!d) return;
	const p = pointPortrait(e);
	if (scenePortrait() === 'appli' && Math.abs(p.y - d.y) > 12) {
		PORTRAIT.cible = null;
		PORTRAIT.defil = constrain(d.defil - (p.y - d.y), 0, PORTRAIT.defilMax); // le doigt fait défiler la colonne
	}
}
function portraitFin(e) {
	const d = PORTRAIT.toucher;
	PORTRAIT.toucher = null;
	if (typeof mouseReleased === 'function') mouseReleased();
	if (!d) return;
	const p = pointPortrait(e);
	const dx = p.x - d.x;
	const dy = p.y - d.y;
	const dist = Math.hypot(dx, dy);
	const scene = scenePortrait();
	if (dist > 70 && Math.abs(dy) > Math.abs(dx)) {
		if (scene === 'bureau' && dy < 0) sAsseoir(); // swipe vers le haut au bureau : s'installer
		return; // dans l'appli, le swipe a fait défiler
	}
	if (dist > 30) return;
	if (millis() - d.t >= DUREE_APPUI_LONG) return; // appui long : infobulle seulement
	const b = PORTRAIT.boutons.find((x) => p.x >= x.x && p.x <= x.x + x.l && p.y >= x.y && p.y <= x.y + x.h);
	if (b) {
		interaction();
		Confort.Son.clic();
		return b.action();
	}
	if (viserDepuisPortrait(p)) mousePressed();
}

function touchMoved(e) {
	if (horsCanevas(e)) return;
	if (PORTRAIT.actif) return portraitDeplacement(e), false;
	if (MOBILE.actif && typeof mouseDragged === 'function') return mouseDragged(), false; // prompt 92 : glisser dans les sources de l'enquête (paysage)
}
// Recomposition après chaque image dessinée par p5
if (typeof p5 !== 'undefined') p5.prototype.registerMethod('post', composerPortrait);
