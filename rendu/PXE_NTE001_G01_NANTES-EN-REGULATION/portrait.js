/* Nantes en régulation — prompt 60, sous-étape 60b : mise en page portrait dédiée (téléphone tenu droit).
 * Principe : RECOMPOSITION. Le jeu continue de dessiner en 1920×1080 (ordinateur et paysage inchangés) ; en
 * portrait, un second canevas 1080×1920 recompose, à chaque image, des régions de cette image empilées :
 *   appli Signalements : jauges (fixes) / liste des signalements + lignes, dossier avec sources, compteur et actions (défilables,
 *     défilement automatique vers le dossier à son arrivée) / « Se lever » (fixe) ;
 *   fenêtres : recadrées à leur largeur ; téléphone et tasse en main : recadrés sur l'objet ; menu : sa colonne ;
 *   bureau : la pièce en haut, et tous les objets en grosses cibles tactiles en dessous (≥ 96 px).
 * Les touchers sont reconvertis vers les coordonnées 1920×1080 avant d'appeler les gestionnaires du jeu.
 * Aucune règle touchée ; ne s'active qu'en mode mobile portrait.
 */
const PL = 1080;
let PH = 1920; // prompt 205 : suit la proportion de l'écran (9:16 à 9:21), pour que la barre d'onglets soit en bas
const PORTRAIT = { actif: false, canevas: null, ctx: null, regions: [], boutons: [], defil: 0, defilMax: 0, cible: null, dernierDossier: -1, toucher: null, cleContenu: null, feuille: -9999 };

// ——— Prompt 205 : géométrie portrait de l'appli ———
// Le jeu dessine toujours dans l'image 1920×1080, mais en portrait la carte, les vues (Mails, Community, Journal,
// Données) et la fiche du dossier y sont dessinées en COLONNES de 620 px : recomposées sur toute la largeur du
// téléphone (1040 px portrait ≈ 397 px CSS sur un écran de 412 px), le texte de 20 px de l'appli y fait ≈ 13 px à
// l'écran, contre 5 à 8 px avec la mise en page 16:9 réduite. La carte et les vues partagent la même colonne (une
// seule est dessinée à la fois) ; la fiche a la sienne, à droite, pour ne jamais se superposer à la carte.
const GEO_PORTRAIT = { carte: { x: 184, y: 92, l: 620, h: 980 }, vue: { x: 184, y: 92, l: 620, h: 980 }, panneau: { x: 820, y: 92, l: 620, h: 980 }, suite: { x: 820, y: 92, l: 620, h: 980 } }; // h 980 : jusqu'au bas de l'image (y 1072), la colonne remplit l'écran d'un téléphone 9:20 // suite : seconde colonne d'une vue (Données)
let geoOrigine = null;
function appliquerGeometriePortrait(oui) {
	if (typeof ZONE_CARTE === 'undefined' || typeof ZONE_VUE === 'undefined') return;
	if (!geoOrigine) geoOrigine = { carte: Object.assign({}, ZONE_CARTE), vue: Object.assign({}, ZONE_VUE) };
	Object.assign(ZONE_CARTE, oui ? GEO_PORTRAIT.carte : geoOrigine.carte);
	Object.assign(ZONE_VUE, oui ? GEO_PORTRAIT.vue : geoOrigine.vue);
	if (typeof CARTE !== 'undefined') CARTE.centreSur = null; // recadrer sur le dossier ouvert dans la nouvelle colonne
}
function majHauteurPortrait() {
	const r = window.innerHeight / Math.max(1, window.innerWidth);
	PH = Math.round(PL * Math.min(21 / 9, Math.max(16 / 9, r)));
	if (PORTRAIT.canevas && PORTRAIT.canevas.height !== PH) PORTRAIT.canevas.height = PH;
}

function activerPortrait(oui) {
	if (oui) majHauteurPortrait();
	if (oui === PORTRAIT.actif) return;
	PORTRAIT.actif = oui;
	document.body.classList.toggle('portrait', oui);
	appliquerGeometriePortrait(oui);
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
function region(src, dx, dy, dl, defile) {
	const dh = (src.h * dl) / src.l;
	PORTRAIT.regions.push({ src, dst: { x: dx, y: dy, l: dl, h: dh }, defile: !!defile });
	return dh;
}
// Prompt 173 : les fenêtres n'ont plus que trois largeurs (DS.fenetre) ; le cadrage portrait = largeur + 40 px
const CADRE_FENETRE = { etroite: DS.fenetre.etroite + 40, moyenne: DS.fenetre.moyenne + 40, large: DS.fenetre.large + 40 };
const LARGEUR_FENETRE = { menu: CADRE_FENETRE.etroite, partage: CADRE_FENETRE.moyenne, installation: CADRE_FENETRE.moyenne, demission: CADRE_FENETRE.moyenne, partir: CADRE_FENETRE.moyenne, reset: CADRE_FENETRE.moyenne }; // prompt 88 ; les autres : large

function scenePortrait() {
	if (typeof CINE !== 'undefined' && CINE) return 'plein';
	if (fenetre === 'telephone' || fenetre === 'cafe' || smsActif) return 'main';
	if (fenetre === 'rapport') return 'rapport';
	if (fenetre || tutoriel) return 'fenetre';
	if (MENU.actif) return 'menu';
	if (vue === 'poste' && PC.etat === 'appli' && ecran === 'jeu') return 'appli';
	if (vue === 'poste' && typeof vueIntegree === 'function' && vueIntegree()) return 'vueApp'; // prompt 103 : vue intégrée de l'appli
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
	if (scene === 'appli' || scene === 'vueApp') regionsPoste(scene); // prompt 205
	else if (scene === 'main') region({ x: 880, y: 0, l: 780, h: H }, 0, 200, PL);
	else if (scene === 'rapport') region({ x: 420, y: 0, l: 1420, h: H }, 0, (PH - (H * PL) / 1420) / 2, PL);
	else if (scene === 'fenetre') {
		const W = tutoriel ? 1400 : LARGEUR_FENETRE[fenetre] || CADRE_FENETRE.large;
		region({ x: (L - W) / 2, y: 0, l: W, h: H }, 0, (PH - (H * PL) / W) / 2, PL);
	} else if (scene === 'menu') {
		// Prompt 199 : en haut à droite, la pile FR / EN · plein écran · télécharger ; puis la colonne du menu (titre, cartes)
		// jusqu'à Paramètres ; puis la rangée Livrables · Kit de presse · Présentation · Dépôt · Partager et le pied de page. Pile et rangée agrandies ×2 :
		// boutons de 60 et 68 px → ≥ 44 px à l'écran sur un téléphone de 412 px de large
		const lp = LARGEUR_PILE() + 24, hp = 3 * HAUT_MENU.h + 2 * 16 + 24;
		region({ x: L - HAUT_MENU.marge - lp + 12, y: HAUT_MENU.y - 12, l: lp, h: hp }, PL - 20 - 2 * lp, 30, 2 * lp);
		const b = BLOC_PARTAGE, yr = b.yDessin || b.y, lc = 908;
		let y = 30 + 2 * hp + 24;
		y += region({ x: 110, y: 60, l: lc, h: yr - 12 - 60 }, 0, y, PL) + 8;
		const lr = RANGEE_MENU.length * b.l + (RANGEE_MENU.length - 1) * 16 + 24;
		y += region({ x: b.x - 12, y: yr - 12, l: lr, h: b.h + 24 }, 20, y, Math.min(2 * lr, PL - 40)) + 16;
		region({ x: 110, y: H - 80, l: lc, h: 56 }, 0, y, PL); // pied de page (nos noms → Crédits)
	}
	else if (scene === 'bureau') {
		region({ x: 0, y: 0, l: L, h: H }, 0, 150, PL);
		boutonsBureau();
	} else region({ x: 0, y: 0, l: L, h: H }, 0, (PH - (H * PL) / L) / 2, PL);
	// Dessin
	ctx.fillStyle = '#0D0C0C';
	ctx.fillRect(0, 0, PL, PH);
	ctx.imageSmoothingEnabled = true;
	const poste = scene === 'appli' || scene === 'vueApp';
	const zone = poste ? { haut: PORTRAIT.hautDefil, bas: PORTRAIT.basDefil } : null;
	// Prompt 205 : la fiche du dossier monte du bas à son arrivée (0,3 s ; immédiate si les animations sont réduites)
	const kF = reduireAnimations ? 1 : Math.min(1, (millis() - PORTRAIT.feuille) / 300);
	const montee = poste && kF < 1 ? (1 - (1 - Math.pow(1 - kF, 3))) * (PH - (zone ? zone.haut : 0)) : 0;
	PORTRAIT.regions.forEach((r) => {
		const d = { ...r.dst, y: r.dst.y - (r.defile ? PORTRAIT.defil : 0) + (r.feuille ? montee : 0) };
		ctx.save();
		if (r.defile && zone) {
			ctx.beginPath();
			ctx.rect(0, zone.haut, PL, zone.bas - zone.haut);
			ctx.clip();
		}
		ctx.drawImage(src, r.src.x, r.src.y, r.src.l, r.src.h, d.x, d.y, d.l, d.h);
		ctx.restore();
	});
	if (poste) dessinerBarresPortrait();
	PORTRAIT.boutons.forEach((b) => dessinerBoutonPortrait(b));
	// Sieste : les paupières couvrent aussi tout le portrait (boutons compris), sauf pendant l'alarme de réveil
	if (typeof SOMMEIL !== 'undefined' && SOMMEIL.k > 0.001 && phase !== 'reveil' && !fenetre) {
		paupieres(ctx, SOMMEIL.k, PL, PH);
		if (SOMMEIL.k > 0.5) PORTRAIT.boutons = [];
		return;
	}
	if (poste && PORTRAIT.defilMax > 0) {
		// Ascenseur discret : où l'on est dans la colonne
		const h = ((zone.bas - zone.haut) * (zone.bas - zone.haut)) / (zone.bas - zone.haut + PORTRAIT.defilMax);
		const y = zone.haut + ((zone.bas - zone.haut - h) * PORTRAIT.defil) / PORTRAIT.defilMax;
		ctx.fillStyle = 'rgba(255,255,255,0.35)';
		ctx.fillRect(PL - 10, y, 6, h);
	}
}

// ——— Prompt 205 : poste en portrait — barre des jauges (haut), un seul contenu plein écran (défilant), équipes
// pendant un dossier, somnolence et « Se lever », barre d'onglets (bas). Barres et boutons sont dessinés directement
// sur le canevas portrait (texte ≥ 32 px portrait ≈ 12 px CSS), le contenu vient de l'image du jeu (colonnes de 620 px).
const BARRE_HAUT = 150;
const BARRE_ONGLETS = 150;
const RANGEE_ACTIONS = 136;
const BANDE_EQUIPES = 190;
const POLICE_PORTRAIT = '"JetBrains Mono", ui-monospace, monospace';
const PHASES_FEUILLE = ['decision', 'contradiction', 'conflit', 'narration'];
/** Le dossier (fiche) est-il le contenu affiché ? */
function feuilleOuverte() {
	if (typeof PANNEAU === 'undefined' || typeof phase === 'undefined') return false;
	if (typeof enSieste !== 'undefined' && enSieste && !PHASES_FEUILLE.includes(phase)) return true; // panneau « vous dormez »
	return PHASES_FEUILLE.includes(phase) && !(typeof DIALOGUE !== 'undefined' && DIALOGUE.reduit);
}
/** Bande « Envoyer une équipe » : pendant un choix, équipes débloquées */
function bandeEquipesVisible() {
	return feuilleOuverte() && ['decision', 'contradiction', 'conflit'].includes(phase) && typeof Jeu !== 'undefined' && Jeu.TYPES_EQUIPES && Jeu.elementDebloque && Jeu.elementDebloque('equipes');
}
function regionsPoste(scene) {
	const bande = scene === 'appli' && bandeEquipesVisible();
	const haut = BARRE_HAUT + 12;
	const bas = PH - BARRE_ONGLETS - RANGEE_ACTIONS - (bande ? BANDE_EQUIPES : 0) - 8;
	PORTRAIT.hautDefil = haut;
	PORTRAIT.basDefil = bas;
	const feuille = scene === 'appli' && feuilleOuverte();
	const src = scene === 'vueApp' ? ZONE_VUE : feuille ? PANNEAU : typeof zoneCarte === 'function' ? zoneCarte() : ZONE_CARTE;
	let dh = region(appliVersImage({ x: src.x, y: src.y, l: src.l, h: src.h }), 20, haut, PL - 40, true);
	if (feuille) PORTRAIT.regions[PORTRAIT.regions.length - 1].feuille = true;
	if (scene === 'vueApp' && PC.fenetre === 'donnees') dh += 16 + region(appliVersImage(GEO_PORTRAIT.suite), 20, haut + dh + 16, PL - 40, true); // seconde colonne, empilée
	PORTRAIT.defilMax = Math.max(0, haut + dh + 16 - bas);
	// Nouveau contenu (autre vue, autre dossier) : retour en haut ; un dossier qui arrive monte du bas
	const cle = scene === 'vueApp' ? 'vue:' + PC.fenetre : feuille ? 'dossier:' + Jeu.index + ':' + phase : 'carte';
	if (cle !== PORTRAIT.cleContenu) {
		const nouveauDossier = feuille && !(String(PORTRAIT.cleContenu || '').startsWith('dossier:' + Jeu.index + ':'));
		PORTRAIT.cleContenu = cle;
		PORTRAIT.defil = 0;
		PORTRAIT.cible = null;
		if (nouveauDossier) PORTRAIT.feuille = millis();
	}
	PORTRAIT.defil = constrain(PORTRAIT.defil, 0, PORTRAIT.defilMax);
	// Bande des équipes : un toucher envoie l'équipe sur le dossier ouvert (comme glisser sa pastille sur la fiche)
	if (bande) {
		const y = PH - BARRE_ONGLETS - RANGEE_ACTIONS - BANDE_EQUIPES + 58;
		const n = Jeu.TYPES_EQUIPES.length;
		const lb = (PL - 40 - (n - 1) * 12) / n;
		const tm = typeof tempsCarte === 'function' ? tempsCarte() : millis();
		Jeu.TYPES_EQUIPES.forEach((c, i) => {
			const q = Jeu.EQUIPES[c];
			const eff = Jeu.effectifJour ? Jeu.effectifJour(c) : 1;
			const eng = (Jeu.equipes || []).filter((x) => x.cle === c && !x.inutile && x.jourIndex === Jeu.jourIndex && Jeu.phaseEquipe(x, tm) !== 'libre').length;
			const dispo = Math.max(0, eff - eng);
			PORTRAIT.boutons.push({ x: 20 + i * (lb + 12), y, l: lb, h: 120, texte: String(q.nom), sous: t('portrait.libres', { n: dispo, cout: q.cout }), action: () => deposerJeton(c, Jeu.index), desactive: !dispo });
		});
	}
	// Rangée d'actions : somnolence (se reposer / se réveiller) et « Se lever »
	const ya = PH - BARRE_ONGLETS - RANGEE_ACTIONS + 10;
	const la = (PL - 52) / 2;
	const v = typeof SOMNO !== 'undefined' ? Math.round(SOMNO.v) : 0;
	PORTRAIT.boutons.push({ x: 20, y: ya, l: la, h: 116, texte: t(typeof enSieste !== 'undefined' && enSieste ? 'portrait.reveiller' : 'portrait.reposer'), sous: t('portrait.somnolence', { v }), jauge: v, action: () => typeof basculerSieste === 'function' && basculerSieste() });
	PORTRAIT.boutons.push({ x: 32 + la, y: ya, l: la, h: 116, texte: t('portrait.seLeverCourt'), action: quitterPC, primaire: false, desactive: !!raisonRetenuAuPC() }); // prompt 182 : estompé tant qu'un choix attend
	// Barre d'onglets : les entrées du menu de l'appli (badges, verrous), l'entrée affichée soulignée de rouge
	const ent = typeof ENTREES_MENU !== 'undefined' ? ENTREES_MENU : [];
	const lo = PL / Math.max(1, ent.length);
	ent.forEach((c, i) => {
		const verrou = c !== 'signalements' && typeof appliDebloquee === 'function' && !appliDebloquee(c);
		PORTRAIT.boutons.push({ onglet: true, x: i * lo, y: PH - BARRE_ONGLETS, l: lo, h: BARRE_ONGLETS, texte: c === 'signalements' ? t('menuApp.carte') : t('menuApp.' + c), actif: entreeActive() === c, badge: typeof nombreBadge === 'function' && entreeActive() !== c ? nombreBadge(c) : 0, verrou, action: () => ouvrirEntreeMenu(c) });
	});
}
/** Couleur (texte clair, contraste ≥ 4,5:1 sur le fond sombre) d'une jauge selon ses seuils 40 / 20 */
const couleurJaugePortrait = (v) => (v < 20 ? DS.erreurClair : v < 40 ? DS.alerteClair : DS.succesClair);
const couleurBarrePortrait = (v) => (v < 20 ? DS.erreur : v < 40 ? DS.alerte : DS.succes);
function texteP(ctx, s, x, y, taille, couleur, align, gras) {
	ctx.font = (gras ? '700 ' : '400 ') + taille + 'px ' + POLICE_PORTRAIT;
	ctx.fillStyle = couleur;
	ctx.textAlign = align || 'left';
	ctx.textBaseline = 'top';
	ctx.fillText(s, x, y);
}
/** Barre du haut (jauges chiffrées, heure) et titre de la bande des équipes */
function dessinerBarresPortrait() {
	const ctx = PORTRAIT.ctx;
	ctx.save();
	ctx.fillStyle = '#171616';
	ctx.fillRect(0, 0, PL, BARRE_HAUT);
	ctx.fillRect(0, PH - BARRE_ONGLETS - RANGEE_ACTIONS - (bandeEquipesVisible() && scenePortrait() === 'appli' ? BANDE_EQUIPES : 0), PL, PH);
	const aff = typeof jaugesAffichees === 'function' ? jaugesAffichees() : Jeu.jauges || {};
	const lh = 236;
	['fluidite', 'reputation', 'budget'].forEach((k, i) => {
		const x = 20 + i * (lh + 16);
		const va = Math.round(aff[k] || 0);
		texteP(ctx, t('jaugeTitre.' + k), x, 18, 32, '#FFFFFF');
		texteP(ctx, String(va), x, 58, 48, couleurJaugePortrait(va), 'left', true);
		ctx.fillStyle = 'rgba(255,255,255,0.15)';
		ctx.fillRect(x, 120, lh, 12);
		ctx.fillStyle = couleurBarrePortrait(va);
		ctx.fillRect(x, 120, (lh * Math.max(0, Math.min(100, va))) / 100, 12);
	});
	const h = heureAffichee();
	const xr = PL - 20;
	texteP(ctx, t('temps.' + vitesseTemps()), xr, 18, 32, 'rgba(255,255,255,0.75)', 'right');
	texteP(ctx, String(h.h).padStart(2, '0') + ':' + String(h.m).padStart(2, '0'), xr, 58, 48, '#FFFFFF', 'right', true);
	if (bandeEquipesVisible() && scenePortrait() === 'appli') {
		const y = PH - BARRE_ONGLETS - RANGEE_ACTIONS - BANDE_EQUIPES + 10;
		const msg = typeof SELECTION !== 'undefined' && SELECTION.message && millis() - SELECTION.message.t < 5000 ? SELECTION.message : null;
		texteP(ctx, msg ? String(msg.texte).slice(0, 52) : t('portrait.envoyerEquipe'), 20, y, 32, msg ? (msg.ok ? DS.succesClair : DS.erreurClair) : 'rgba(255,255,255,0.75)');
	}
	ctx.restore();
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
	ctx.save();
	if (b.desactive || b.verrou) ctx.globalAlpha = b.verrou ? 0.4 : 0.5; // prompt 182
	if (b.onglet) {
		// Prompt 205 : onglet de la barre du bas — fond plus clair et filet rouge en haut pour l'entrée affichée
		ctx.fillStyle = b.actif ? '#2A2828' : '#171616';
		ctx.fillRect(b.x, b.y, b.l, b.h);
		ctx.fillStyle = 'rgba(255,255,255,0.15)';
		ctx.fillRect(b.x, b.y, b.l, 2);
		if (b.actif) {
			ctx.fillStyle = DS.primaire;
			ctx.fillRect(b.x + 8, b.y, b.l - 16, 6);
		}
	} else {
		ctx.fillStyle = b.primaire ? DS.primaire : '#171616'; // prompt 115
		ctx.fillRect(b.x, b.y, b.l, b.h);
		ctx.strokeStyle = b.primaire ? DS.primaire : 'rgba(255,255,255,0.6)';
		ctx.lineWidth = 3;
		ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.l - 3, b.h - 3);
	}
	ctx.fillStyle = '#FFFFFF';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	// Prompt 205 : 34 px, réduit au besoin jusqu'à 32 px (≈ 12 px CSS à 412 px de large), jamais en dessous ; au-delà,
	// fillText resserre les lettres (largeur maximale) plutôt que de déborder
	let taille = 34;
	const police = (tl) => (b.onglet && !b.actif ? '400 ' : '600 ') + tl + 'px ' + POLICE_PORTRAIT;
	ctx.font = police(taille);
	while (taille > 32 && ctx.measureText(b.texte).width > b.l - 24) {
		taille -= 2;
		ctx.font = police(taille);
	}
	const yt = b.sous ? b.y + b.h / 2 - 20 : b.y + b.h / 2 + 2;
	ctx.fillText(b.texte, b.x + b.l / 2, yt, b.l - 16);
	if (b.sous) {
		ctx.font = '400 32px ' + POLICE_PORTRAIT;
		ctx.fillStyle = 'rgba(255,255,255,0.8)';
		ctx.fillText(b.sous, b.x + b.l / 2, b.y + b.h / 2 + 22, b.l - 16);
	}
	if (b.jauge !== undefined) {
		ctx.fillStyle = 'rgba(255,255,255,0.15)';
		ctx.fillRect(b.x + 12, b.y + b.h - 14, b.l - 24, 6);
		ctx.fillStyle = b.jauge >= 80 ? DS.erreur : b.jauge >= 50 ? DS.alerte : '#3860FF';
		ctx.fillRect(b.x + 12, b.y + b.h - 14, ((b.l - 24) * Math.min(100, b.jauge)) / 100, 6);
	}
	if (b.badge) {
		const r = 24;
		const cx = b.x + b.l / 2 + Math.min(b.l / 2 - r - 6, ctx.measureText(b.texte).width / 2 + 10);
		const cy = b.y + 34;
		ctx.globalAlpha = 1;
		ctx.fillStyle = DS.primaire;
		ctx.beginPath();
		ctx.arc(cx, cy, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#FFFFFF';
		ctx.font = '700 28px ' + POLICE_PORTRAIT;
		ctx.fillText(b.badge > 9 ? '9+' : String(b.badge), cx, cy + 1);
	}
	ctx.restore();
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
	const sc = scenePortrait();
	if ((sc === 'appli' || sc === 'vueApp') && Math.abs(p.y - d.y) > 12) {
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
