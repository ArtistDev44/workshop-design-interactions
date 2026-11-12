/* Nantes en régulation — menu principal modernisé (prompt 35).
 * Écran titre plein écran affiché AVANT le bureau : Nouvelle partie, Reprendre une partie (prompt 178 : écran des
 * emplacements de sauvegarde, MENU.ecran = 'sauvegardes'), Palmarès, Paramètres ; en haut, le
 * logo à gauche, la langue et l'installation à droite (prompt 171 : plus d'entrée « Aide et tutoriel » ni
 * « Crédits » — l'aide s'ouvre en partie, les crédits par les noms du pied de page). « Nouvelle partie » ouvre le choix de la semaine (l'ancien accueil du PC, sorti de l'écran).
 * Fond : la pièce du bureau floutée et assombrie. Tout est dessiné par le code, textes via t().
 * Dès qu'une partie démarre ou reprend (ecran === 'jeu'), le menu se ferme et l'on arrive au bureau.
 */
const MENU = { actif: true, ecran: 'titre', choix: 0, choixSemaine: 0, debut: 0, choixSauv: 0, confirmeSauv: false, apresSuppr: null };
// Prompt 81 : liens du projet — une seule définition (constantes nommées), jamais recopiés ailleurs
const DEPOT_URL = 'https://github.com/ArtistDev44/workshop-design-interactions';
const LICENCE_URL = DEPOT_URL + '/blob/main/LICENSE';
const URL_JEU = 'https://workshop-design-interactions.pages.dev/'; // URL canonique du jeu (prompt 02)
/** Lien externe dans un nouvel onglet, sans accès à cette page (même motif que donnees.js) */
function ouvrirLien(url) {
	if (typeof EXPO !== 'undefined' && EXPO.actif) return; // prompt 160 : aucune sortie du jeu sur le kiosque
	window.open(url, '_blank', 'noopener');
}
/** Page de présentation du projet (diaporama Slidev, prompt 82), servie à côté du jeu */
function ouvrirPresentation() {
	annoncer(t('mp.presentation.annonce'));
	ouvrirLien('./presentation/');
}
/** Prompt 136 : diapositive « Les livrables » du diaporama (routeAlias livrables), même page /presentation/ ; prompt 138 : ?clicks=5 ouvre la diapositive avec ses 5 apparitions déjà jouées */
function ouvrirLivrables() {
	annoncer(t('mp.livrables.annonce'));
	ouvrirLien('./presentation/#/livrables?clicks=5');
}
/** Prompt 188 : kit de presse (page statique kit-presse/index.html : communiqué, captures, vidéo, logo, liens), nouvel onglet */
function ouvrirKitPresse() {
	annoncer(t('mp.kitpresse.annonce'));
	ouvrirLien('./kit-presse/');
}
const MENU_C = {
	nuit: '#0D0C0C', // Background du Pixel DS (prompt 39)
	encre: '#0D0C0C', // Secondary-Foreground
	// Couleur d'accent (nom de clé historique) : relue dans DS, jamais copiée (prompt 176)
	get bleu() {
		return DS.primaire;
	},
	blanc: '#ffffff',
	doux: 'rgba(255,255,255,0.75)', // White 75
};

function ouvrirMenuPrincipal() {
	MENU.actif = true;
	MENU.ecran = 'titre';
	MENU.choix = 0;
	MENU.debut = millis();
	fenetre = null;
	annoncer(t('mp.annonce'));
}
function fermerMenuPrincipal() {
	MENU.actif = false;
	// Prompt 37 : nouvelle partie avec l'option cochée → guide « Prendre en main »
	if (optionGuide() && Jeu.index === 0 && !(Jeu.historique || []).length) demarrerGuide();
	PC.etat = typeof JOUR_PC !== 'undefined' && JOUR_PC.attendu ? 'eteint' : 'appli'; // on arrive au bureau, le PC déjà allumé sur l'appli (prompt 71 : sauf démarrage du jour en attente)
	PC.fenetre = null;
	vue = 'bureau';
}

/** Entrées du menu principal. Prompt 178 : « Reprendre une partie » ouvre la liste des sauvegardes ; sans
 * sauvegarde, l'entrée reste visible mais grisée, non cliquable et sautée au clavier */
function entreesMenu() {
	const n = Sauvegarde.lister().length;
	const e = [{ cle: 'nouvelle', icone: 'plus', sous: t('mp.accroche.duree'), action: () => allerChoixSemaine() }]; // prompt 190 : public et durée de session
	e.push({ cle: 'reprendre', icone: 'lecture', sous: n ? t('sauv.compte', { n, max: Sauvegarde.MAX }) : t('sauv.vide'), desactive: !n, action: () => allerSauvegardes() });
	e.push({ cle: 'palmares', icone: 'trophee', action: () => ouvrir('palmares') }); // prompt 47
	e.push({ cle: 'parametres', icone: 'reglages', action: () => ouvrir('parametres') });
	// Prompt 171 : plus d'entrée « Aide et tutoriel » (l'aide s'ouvre en partie : H, menu pause) ni « Crédits » (les noms du pied de page y mènent)
	return e;
}
function allerChoixSemaine() {
	MENU.ecran = 'semaines';
	MENU.debut = millis();
	MENU.choixSemaine = 0; // prompt 41 : le mode histoire (recommandé) est présélectionné
	const modes = modesNouvellePartie();
	recalerChoixMode(modes);
	// Prompt 177 : un mode verrouillé ou indisponible n'est jamais focalisé — il est annoncé ici, avec sa raison
	annoncer([t('mp.semaines.titre') + '. ' + t('mp.mode.sous')].concat(modes.filter((m) => m.desactive).map(annonceModeIndisponible)).join(' '));
	Confort.Son.bip('choix');
}
function lancerDepuisMenu() {
	const m = modesNouvellePartie()[MENU.choixSemaine];
	if (!m || m.desactive) return;
	if (m.cle === 'histoire') {
		// Prompt 41 : histoire terminée et relancée → on repart de la semaine 1 (le temps réel reste débloqué)
		const p = progressionHistoire();
		if (p.termine) enregistrerProgression(Object.assign(p, { scores: {} }));
		const lundi = semainesHistoire()[m.chapitre - 1];
		choixAccueil = optionsAccueil().findIndex((o) => o.lundi === lundi);
	} else choixAccueil = optionsAccueil().findIndex((o) => o.type === 'direct');
	if (choixAccueil < 0) return;
	const c = choixAccueil;
	avantDeJouer(() => ((choixAccueil = c), lancerPartie())); // prompt 110 : micro, caméra et son demandés avant la partie ; prompt 178 : plus de fenêtre de rappel, la partie prend un nouvel emplacement
}

// ——— Dessin ———
function fondMenu() {
	if (!dernierRenduBureau || millis() - dernierRenduBureau > 250) {
		dessinerPieceBureau();
		dernierRenduBureau = millis();
	}
	background(MENU_C.nuit);
	drawingContext.imageSmoothingEnabled = false;
	if (!reduireAnimations) drawingContext.filter = 'blur(6px)';
	image(gBureau, -40, -24, L + 80, H + 48);
	drawingContext.filter = 'none';
	drawingContext.imageSmoothingEnabled = true;
	// Voile : plus sombre à gauche (lisibilité du menu), la pièce reste devinable à droite
	const g = drawingContext.createLinearGradient(0, 0, L, 0);
	g.addColorStop(0, 'rgba(13,12,12,0.95)');
	g.addColorStop(0.45, 'rgba(13,12,12,0.85)');
	g.addColorStop(1, 'rgba(13,12,12,0.5)');
	drawingContext.fillStyle = g;
	drawingContext.fillRect(0, 0, L, H);
}

/** Prompt 170 : icônes d'interface Lucide (icones-lucide.js), 48 px centrées dans le carré 56 × 56 ; les logos de
 * marque, absents de Lucide, restent en pixel art (iconeReseau) */
const ICONES_MENU = { plus: 'plus', lecture: 'play', reglages: 'settings', aide: 'circle-question-mark', livre: 'book-open', presentation: 'presentation', retour: 'arrow-left', trophee: 'trophy', carnet: 'notebook-text', presse: 'newspaper', menu: 'menu', partage: 'share-2', lien: 'link' };
function iconeMenu(type, x, y, c) {
	push();
	translate(x, y);
	if (ICONES_MENU[type]) iconeLucide(ICONES_MENU[type], 4, 4, 48, c);
	else iconeReseau(type, c); // prompt 81 : dépôt et réseaux sociaux
	pop();
}
/** Prompt 81 : icônes pixel art (rectangles de 4 px, dans le carré 56 × 56 de iconeMenu), dessinées par le code */
function iconeReseau(type, c) {
	noStroke();
	fill(c);
	const px = (motif) => motif.forEach((ligne, j) => [...ligne].forEach((v, i) => v === '#' && rect(4 + i * 4, 4 + j * 4, 4, 4)));
	const MOTIFS = {
		// Chat-pieuvre stylisé (dépôt de code) — dessin original, pas le logo d'une marque
		github: ['....######....', '..##########..', '.############.', '.##.######.##.', '##..######..##', '##############', '##############', '##############', '.############.', '.############.', '..##..##..##..', '...#..##..#...', '..............'],
		x: ['##........##..', '.##......##...', '..##....##....', '...##..##.....', '....####......', '.....##.......', '....####......', '...##..##.....', '..##....##....', '.##......##...', '##........##..'],
		facebook: ['.....####.....', '....######....', '....##........', '....##........', '..########....', '..########....', '....##........', '....##........', '....##........', '....##........', '....##........'],
		linkedin: ['.##...........', '.##...........', '..............', '.##..#.####...', '.##..########.', '.##..##....##.', '.##..##....##.', '.##..##....##.', '.##..##....##.', '.##..##....##.'],
		mastodon: ['.###########..', '##.........##.', '#..##...##..#.', '#..##...##..#.', '#..##.#.##..#.', '#..##.#.##..#.', '#.....#.....#.', '##.........##.', '.###########..', '.....##.......', '..####........'],
	};
	if (MOTIFS[type]) px(MOTIFS[type]);
}

/** Carte de menu moderne : sélection = carte blanche + liseré bleu ; sinon carte sombre translucide */
function carteMenu(x, y, l, h, titre, sous, action, sel, icone, desactive) {
	if (desactive) return carteMenuGrisee(x, y, l, h, titre, sous, icone);
	const survol = mouseX >= x && mouseX <= x + l && mouseY >= y && mouseY <= y + h;
	const actif = sel || survol;
	noStroke();
	if (actif) {
		fill(MENU_C.blanc);
		rect(x, y, l, h);
		fill(MENU_C.bleu);
		rect(x, y, 8, h); // liseré primaire
	} else {
		fill(255, 255, 255, 22);
		rect(x, y, l, h);
		stroke(255, 255, 255, 60);
		strokeWeight(2);
		noFill();
		rect(x + 1, y + 1, l - 2, h - 2);
		noStroke();
	}
	if (icone) iconeMenu(icone, x + 28, y + h / 2 - 28, actif ? MENU_C.bleu : MENU_C.blanc);
	const tx = x + (icone ? 108 : 32);
	textAlign(LEFT, sous ? BOTTOM : CENTER);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	ajusterTaille(titre, l - (tx - x) - 24, 30);
	fill(actif ? MENU_C.encre : MENU_C.blanc);
	text(titre, tx, sous ? y + h / 2 + 4 : y + h / 2);
	textStyle(NORMAL);
	if (sous) {
		// Prompt 120 : une seule ligne, taille ajustée à la largeur (18 → 14 px) — plus jamais de 2e ligne masquée
		textAlign(LEFT, TOP);
		textFont(POLICE_DONNEES);
		ajusterTaille(sous, l - (tx - x) - 24, 18, 14);
		fill(actif ? 'rgba(13,12,12,0.75)' : MENU_C.doux);
		zoneTexteDeclarer('sousTitreMenu', tx, y + h / 2 + 10, l - (tx - x) - 24, 24);
		text(sous, tx, y + h / 2 + 10);
	}
	boutons.push({ x, y, l, h, action });
	if (sel) {
		// focus clavier : contour bleu extérieur, en plus de la carte blanche
		noFill();
		stroke(DS.primaireTrait);
		strokeWeight(4);
		rect(x - 6, y - 6, l + 12, h + 12);
		noStroke();
	}
}

/** Prompt 178 : carte grisée (entrée indisponible) — ni survol, ni clic, ni focus ; texte blanc 55 % sur le voile nuit (≥ 4,5:1) */
function carteMenuGrisee(x, y, l, h, titre, sous, icone) {
	const gris = 'rgba(255,255,255,0.55)';
	noFill();
	stroke(255, 255, 255, 36);
	strokeWeight(2);
	rect(x + 1, y + 1, l - 2, h - 2);
	noStroke();
	if (icone) iconeMenu(icone, x + 28, y + h / 2 - 28, gris);
	const tx = x + (icone ? 108 : 32);
	textAlign(LEFT, sous ? BOTTOM : CENTER);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	ajusterTaille(titre, l - (tx - x) - 24, 30);
	fill(gris);
	text(titre, tx, sous ? y + h / 2 + 4 : y + h / 2);
	textStyle(NORMAL);
	if (sous) {
		textAlign(LEFT, TOP);
		textFont(POLICE_DONNEES);
		ajusterTaille(sous, l - (tx - x) - 24, 18, 14);
		zoneTexteDeclarer('sousTitreMenu', tx, y + h / 2 + 10, l - (tx - x) - 24, 24);
		text(sous, tx, y + h / 2 + 10);
	}
}

function dessinerMenuPrincipal() {
	fondMenu();
	if (MENU.ecran === 'semaines') return dessinerChoixSemaine();
	if (MENU.ecran === 'sauvegardes') return dessinerSauvegardes(); // prompt 178
	if (MENU.ecran === 'autorisations') return dessinerAutorisations(); // prompt 110
	if (MENU.ecran === 'credits') return dessinerCredits(); // prompt 113
	const k = reduireAnimations ? 1 : easeOut(constrain((millis() - MENU.debut) / 500, 0, 1));
	const x0 = 160 - (1 - k) * 40;
	noStroke();
	// Prompt 171 : ligne du haut — le logo à gauche, la langue et l'installation à droite : même y, même hauteur,
	// même marge au bord (HAUT_MENU) ; plus de mention de code projet « PXE-… ». En portrait mobile, la colonne recadrée
	// commence après le logo (portrait.js) : il n'y est pas dessiné, pour ne pas apparaître coupé.
	if (!(typeof PORTRAIT !== 'undefined' && PORTRAIT.actif)) dessinerLogoPXE(HAUT_MENU.marge, HAUT_MENU.y, HAUT_MENU.h);
	dsTitre(t('accueil.titre'), x0, 160, 88, MENU_C.blanc, 'left'); // titre au style pixel (Bitsy Pixels)
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(28);
	push(); // l'interligne de p5 est un état global (valeur + drapeau « fixé ») : push / pop le rend tel quel aux écrans suivants
	textLeading(40); // prompt 171 : interligne ≈ 1,45 × le corps (échelle du DS), 2 lignes au plus en FR comme en EN
	fill(MENU_C.doux);
	text(t('accueil.sousTitre'), x0, 276, 900, 84);
	pop();
	const e = entreesMenu();
	if (MENU.choix >= e.length + EXTRAS_MENU.length || (e[MENU.choix] && e[MENU.choix].desactive)) MENU.choix = 0;
	// Prompt 120 : pile calculée dans l'espace disponible (sous-titre du jeu → pied de page, 16 px de marge) :
	// cartes normales si elles tiennent, sinon compactes ; l'écart se répartit (6 px au moins, 30 au plus)
	let yc = 370;
	const basPile = H - 74 - 16; // prompt 125 : le pied de page n'a plus qu'une ligne (nos noms, à H − 40) ; 16 px de marge
	const hauteurs = (c) => e.map((it) => (it.sous ? (c ? 92 : 104) : c ? 72 : 84));
	const somme = (hs) => hs.reduce((a, b) => a + b, 0);
	let hs = hauteurs(false);
	if (somme(hs) + 12 * (e.length - 1) > basPile - yc) hs = hauteurs(true);
	const ecart = constrain((basPile - yc - somme(hs)) / Math.max(1, e.length - 1), 6, 30);
	e.forEach((it, i) => {
		carteMenu(x0, yc, 620, hs[i], t('mp.' + it.cle), it.sous, it.action, i === MENU.choix, it.icone, it.desactive);
		yc += hs[i] + ecart;
	});
	// Prompt 171 : FR / EN puis l'icône « télécharger » (installer le jeu, prompt 65), bord droit à la marge
	const avecInstaller = EXTRAS_MENU.some((x) => x.cle === 'installer'); // pas en exposition (prompt 160)
	const xi = L - HAUT_MENU.marge - HAUT_MENU.h;
	selecteurLangue(avecInstaller ? xi : L - HAUT_MENU.marge + 8, HAUT_MENU.y, HAUT_MENU.h); // selecteurLangue laisse 8 px à droite du dernier bouton
	if (avecInstaller) boutonInstaller(xi, HAUT_MENU.y, HAUT_MENU.h, focusExtra(e.length, 'installer'));
	textAlign(LEFT, BOTTOM);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(MENU_C.doux);
	// Prompt 124 : plus de ligne d'aide clavier sous les cartes (elle nuisait à l'immersion)
	// Prompt 125 : plus de ligne « Données réelles… » ni de lien de licence ici — tout est dans l'écran Crédits
	piedCredits(x0, H - 40, e.length);
	blocPartage(e.length);
	if (typeof EXPO !== 'undefined' && EXPO.actif) marqueExpo();
}
/** Prompt 160 : marque discrète « EXPO » en bas à droite de l'écran titre (blanc sur pastille nuit opaque : ≈ 19:1, quel que soit le fond flouté) */
function marqueExpo() {
	textFont(POLICE_DONNEES);
	textStyle(BOLD);
	textSize(18);
	const l = textWidth('EXPO') + 24;
	fill(MENU_C.nuit);
	stroke(MENU_C.doux);
	strokeWeight(2);
	rect(L - 80 - l, H - 40 - 32, l, 36);
	noStroke();
	fill(MENU_C.blanc);
	textAlign(CENTER, CENTER);
	text('EXPO', L - 80 - l / 2, H - 40 - 14);
	textStyle(NORMAL);
	textAlign(LEFT, TOP);
}

// ——— Prompt 81 : crédits, dépôt et partage (écran titre uniquement) ; prompt 125 : la licence est dans les Crédits ———
/** Éléments focalisables après les cartes du menu (↑ ↓ / Tab) : dépôt, partager, présentation (prompt 125 : plus de licence) */
// Prompt 160 : en exposition, ni Livrables, ni Dépôt, ni Partager, ni Présentation (le visiteur suivant doit trouver le jeu)
const EXTRAS_MENU = typeof EXPO !== 'undefined' && EXPO.actif ? [] : [
	{ cle: 'livrables', action: () => ouvrirLivrables() }, // prompt 136 : au-dessus des trois boutons, donc en premier
	{ cle: 'kitpresse', action: () => ouvrirKitPresse() }, // prompt 188 : rangée entre Livrables et les trois boutons
	{ cle: 'depot', action: () => ouvrirLien(DEPOT_URL) },
	{ cle: 'partager', action: () => ouvrirPartage() },
	{ cle: 'presentation', action: () => ouvrirPresentation() }, // page /presentation/ (diaporama Slidev, prompt 82)
	{ cle: 'installer', action: () => installerJeu() }, // prompt 171 : icône « télécharger » en haut à droite, dernière avant de reboucler sur « Nouvelle partie »
];
/** Prompt 171 : ligne du haut de l'écran titre (logo à gauche, langue + installation à droite) */
const HAUT_MENU = { y: 56, h: 60, marge: 80 };
/** Prompt 171 : bouton carré à icône « télécharger » (style contour des boutons de langue) — installe le jeu ;
 * l'icône n'est jamais seule : infobulle au survol et au focus, annonce « Installer le jeu » au clavier */
function boutonInstaller(x, y, c, focus) {
	const survol = mouseX >= x && mouseX <= x + c && mouseY >= y && mouseY <= y + c;
	fill(survol || focus ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)');
	stroke('#FFFFFF');
	strokeWeight(2);
	rect(x + 1, y + 1, c - 2, c - 2);
	if (survol || focus) {
		// même double bordure que bouton() au survol ; rouge au focus clavier, comme les autres éléments du menu
		noFill();
		stroke(focus ? DS.primaireTrait : '#FFFFFF');
		strokeWeight(focus ? 4 : 2);
		rect(x - 6, y - 6, c + 12, c + 12);
	}
	noStroke();
	iconeLucide('download', x + (c - 32) / 2, y + (c - 32) / 2, 32, '#FFFFFF');
	boutons.push({ x, y, l: c, h: c, action: installerJeu });
	if (survol || focus) {
		const bulle = t('mp.installer');
		textFont(POLICE_DONNEES);
		textSize(18);
		infobulle(bulle, x + c - (textWidth(bulle) + 28), y + c + 14); // sous le bouton, alignée sur le bord droit
		textAlign(LEFT, TOP);
	}
}
const focusExtra = (n, cle) => MENU.choix - n === EXTRAS_MENU.findIndex((x) => x.cle === cle);
function piedCredits(x, y, n) {
	const credits = t('mp.credits');
	textFont(POLICE_DONNEES);
	textSize(18);
	textAlign(LEFT, BOTTOM);
	// Prompt 113 : les noms mènent à l'écran « Crédits » (lien souligné)
	const cw = textWidth(credits);
	const survolC = mouseX >= x && mouseX <= x + cw && mouseY >= y - 30 && mouseY <= y + 6;
	fill(MENU_C.blanc);
	text(credits, x, y);
	stroke(MENU_C.blanc);
	strokeWeight(survolC ? 3 : 1);
	line(x, y + 2, x + cw, y + 2);
	noStroke();
	boutons.push({ x: x - 8, y: y - 34, l: cw + 16, h: 46, action: () => ouvrirCredits() });
	if (survolC) infobulle(t('mp.credits.infobulle'), x, y - 76);
}
/** Bouton à icône du bloc bas droite (style des cartes du menu, focus en double bordure) */
function boutonIcone(x, y, l, h, icone, libelle, action, focus) {
	const survol = mouseX >= x && mouseX <= x + l && mouseY >= y && mouseY <= y + h;
	const actif = survol || focus;
	noStroke();
	fill(actif ? MENU_C.blanc : 'rgba(255,255,255,0.09)');
	rect(x, y, l, h);
	if (!actif) {
		stroke(255, 255, 255, 60);
		strokeWeight(2);
		noFill();
		rect(x + 1, y + 1, l - 2, h - 2);
		noStroke();
	}
	push();
	translate(x + 10, y + (h - 56 * 0.8) / 2);
	scale(0.8);
	iconeMenu(icone, 0, 0, actif ? MENU_C.bleu : MENU_C.blanc);
	pop();
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textAlign(LEFT, CENTER);
	ajusterTaille(libelle, l - 74, 24, 14);
	fill(actif ? MENU_C.encre : MENU_C.blanc);
	text(libelle, x + 64, y + h / 2);
	textStyle(NORMAL);
	if (focus) {
		noFill();
		stroke(DS.primaireTrait);
		strokeWeight(4);
		rect(x - 6, y - 6, l + 12, h + 12);
		noStroke();
	}
	boutons.push({ x, y, l, h, action });
	return survol;
}
const BLOC_PARTAGE = { x: L - 80 - 3 * 260 - 2 * 16, y: H - 40 - 68, l: 260, h: 68 }; // demande du 11/11 : + bouton Présentation // 68 px : ≥ 44 px à l'écran en portrait mobile
function blocPartage(n) {
	if (!EXTRAS_MENU.length) return; // prompt 160 : mode exposition
	const b = BLOC_PARTAGE;
	const s1 = boutonIcone(b.x, b.y, b.l, b.h, 'github', t('mp.depot'), () => ouvrirLien(DEPOT_URL), focusExtra(n, 'depot'));
	const s2 = boutonIcone(b.x + b.l + 16, b.y, b.l, b.h, 'partage', t('mp.partager'), ouvrirPartage, focusExtra(n, 'partager'));
	const s3 = boutonIcone(b.x + 2 * (b.l + 16), b.y, b.l, b.h, 'presentation', t('mp.presentation'), ouvrirPresentation, focusExtra(n, 'presentation'));
	// Prompt 136 : « Livrables » sur toute la largeur des trois boutons ; prompt 188 : « Kit de presse » juste au-dessus des
	// trois boutons, Livrables une rangée plus haut (ordre visuel de haut en bas = ordre clavier ↑ ↓ / Tab)
	const s0 = boutonIcone(b.x, b.y - 2 * (b.h + 16), 3 * b.l + 32, b.h, 'carnet', t('mp.livrables'), ouvrirLivrables, focusExtra(n, 'livrables'));
	const sk = boutonIcone(b.x, b.y - b.h - 16, 3 * b.l + 32, b.h, 'presse', t('mp.kitpresse'), ouvrirKitPresse, focusExtra(n, 'kitpresse'));
	const bulle = s0 || focusExtra(n, 'livrables') ? t('mp.livrables.infobulle') : sk || focusExtra(n, 'kitpresse') ? t('mp.kitpresse.infobulle') : s1 || focusExtra(n, 'depot') ? t('mp.depot.infobulle') : s2 || focusExtra(n, 'partager') ? t('mp.partager.infobulle') : s3 || focusExtra(n, 'presentation') ? t('mp.presentation.infobulle') : null;
	if (bulle) {
		textFont(POLICE_DONNEES);
		textSize(18);
		infobulle(bulle, Math.min(b.x, L - 24 - (textWidth(bulle) + 28)), b.y - 2 * (b.h + 16) - 52); // reste dans l'écran, au-dessus des deux rangées
	}
	textAlign(LEFT, TOP);
}

// ——— Panneau « Partager » : modal par-dessus le menu (fenêtre 'partage'), Échap / croix / « Fermer » ———
const PARTAGE = { focus: 0, copie: 0 };
const OPTIONS_PARTAGE = [
	{ cle: 'x', url: (u, txt) => 'https://twitter.com/intent/tweet?url=' + u + '&text=' + txt },
	{ cle: 'facebook', url: (u) => 'https://www.facebook.com/sharer/sharer.php?u=' + u },
	{ cle: 'linkedin', url: (u) => 'https://www.linkedin.com/sharing/share-offsite/?url=' + u },
	{ cle: 'mastodon', url: (u, txt, brut) => 'https://mastodon.social/share?text=' + encodeURIComponent(brut + ' ' + URL_JEU) },
	{ cle: 'lien', copie: true },
];
/** URL de partage construite (texte de partage traduit, tout encodé) — exposée pour la vérification en console */
function urlPartage(cle) {
	const o = OPTIONS_PARTAGE.find((x) => x.cle === cle);
	if (!o || o.copie) return null;
	const brut = t('mp.partager.texte');
	return o.url(encodeURIComponent(URL_JEU), encodeURIComponent(brut), brut);
}
const libellePartage = (o) => t(o.copie ? 'mp.partager.copier' : 'mp.partager.' + o.cle);
function ouvrirPartage() {
	PARTAGE.focus = 0;
	PARTAGE.copie = 0;
	ouvrir('partage');
	annoncer(t('mp.partager.annonce'));
}
function activerPartage(i) {
	const o = OPTIONS_PARTAGE[i];
	if (!o) return fermer();
	PARTAGE.focus = i;
	if (o.copie) return copierLienJeu();
	ouvrirLien(urlPartage(o.cle));
}
/** Copie de l'URL du jeu : API presse-papiers, sinon sélection + execCommand ; « Lien copié » annoncé */
function copierLienJeu() {
	const ok = () => {
		PARTAGE.copie = millis();
		annoncer(t('mp.partager.copie'));
		Confort.Son.bip('choix');
	};
	const repli = () => {
		try {
			const z = document.createElement('textarea');
			z.value = URL_JEU;
			z.setAttribute('readonly', '');
			z.style.position = 'fixed';
			z.style.opacity = '0';
			document.body.appendChild(z);
			z.select();
			const r = document.execCommand('copy');
			document.body.removeChild(z);
			if (r) return ok();
		} catch (e) {}
		annoncer(t('mp.partager.echec', { url: URL_JEU }));
	};
	if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(URL_JEU).then(ok, repli);
	else repli();
}
function fenetrePartage() {
	const portrait = typeof PORTRAIT !== 'undefined' && PORTRAIT.actif; // mobile portrait : cibles ≥ 44 px à l'écran
	const ho = portrait ? 104 : 66;
	const l = DS.fenetre.moyenne; // prompt 173 (était 900)
	const h = portrait ? 960 : 700;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	noStroke();
	textAlign(LEFT, TOP);
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(36);
	text(t('mp.partager'), x + 48, y + 36);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(C.gris);
	text(URL_JEU, x + 48, y + 92);
	// Croix de fermeture
	const tc = portrait ? 96 : 48; // croix ≥ 44 px à l'écran en portrait
	bouton(x + l - 28 - tc, y + 28, tc, tc, '×', fermer, false, true);
	OPTIONS_PARTAGE.forEach((o, i) => {
		const by = y + 140 + i * (ho + 16);
		const lib = o.copie && PARTAGE.copie && millis() - PARTAGE.copie < 3000 ? t('mp.partager.copie') : libellePartage(o);
		boutonIcone(x + 48, by, l - 96, ho, o.cle, lib, () => activerPartage(i), PARTAGE.focus === i);
	});
	bouton(x + l - 48 - 260, y + h - 96, 260, 60, t('mp.partager.fermer'), fermer, false, PARTAGE.focus !== OPTIONS_PARTAGE.length);
	if (PARTAGE.focus === OPTIONS_PARTAGE.length) {
		noFill();
		stroke(DS.primaireTrait);
		strokeWeight(4);
		rect(x + l - 48 - 260 - 6, y + h - 96 - 6, 272, 72);
		noStroke();
	}
	textAlign(LEFT, TOP);
	fill(C.gris);
	textFont(POLICE_DONNEES);
	textSize(16);
	text(t('mp.partager.clavier'), x + 48, y + h - 80, l - 400, 50);
}
/** Clavier du panneau : ↑ ↓ / Tab parcourent (options puis « Fermer »), Entrée active ; Échap ferme (sketch.js) */
function touchePartage() {
	const n = OPTIONS_PARTAGE.length + 1;
	if (keyCode === UP_ARROW || (keyCode === TAB && keyIsDown(SHIFT))) PARTAGE.focus = (PARTAGE.focus + n - 1) % n;
	else if (keyCode === DOWN_ARROW || keyCode === TAB) PARTAGE.focus = (PARTAGE.focus + 1) % n;
	else if (keyCode === ENTER || keyCode === RETURN || key === ' ') return activerPartage(PARTAGE.focus);
	else return;
	annoncer(PARTAGE.focus < OPTIONS_PARTAGE.length ? libellePartage(OPTIONS_PARTAGE[PARTAGE.focus]) : t('mp.partager.fermer'));
}

/* Prompt 41 : « Nouvelle partie » = deux modes. Histoire (recommandé) : semaine facile, normale, difficile,
   imprévus et conflits de lignes en semaine 3. Temps réel : débloqué quand l'histoire est terminée. */
/** Prompt 97 : difficulté de la semaine, lisible avant de jouer (réglages verrouillés de game.js, non modifiés) */
function texteDifficulteChapitre(lundi) {
	const s = Jeu.semainesProposees().find((x) => x.lundi === lundi);
	const niveau = (s && s.niveau) || 'normale';
	const d = (Jeu.REGLAGES && Jeu.REGLAGES.difficultes && Jeu.REGLAGES.difficultes[niveau]) || null;
	if (!d) return '';
	// Prompt 161 : pas de « retards × » (aucun effet sur les archives, sans minutes de retard) ; en défi chrono, les
	// réglages réellement joués (3 signalements, budget 50, compteur de la semaine — game.js / multitache.js)
	if (Confort.Reglages.defiChrono) return t('mp.difficulteChrono', { niveau: t('niveau.' + niveau), budget: 50, actifs: texteActifs(3), s: (s && s.compteur_s) || 30 });
	return t('mp.difficulte', { niveau: t('niveau.' + niveau), budget: d.budget, actifs: texteActifs(d.actifs) });
}
function modesNouvellePartie() {
	const p = progressionHistoire();
	const semaines = semainesHistoire();
	const prochain = p.termine ? 1 : [1, 2, 3].find((n) => p.scores[n] === undefined) || 1;
	const enLigne = Jeu.enLigne !== false;
	return [
		{
			cle: 'histoire',
			titre: t('mp.mode.histoire'),
			detail: t('mp.mode.histoire.sous'),
			info: (elementNouveauChapitre(prochain) ? t('mp.mode.histoire.etatNouveau', { n: prochain, element: t('histoire.element.' + elementNouveauChapitre(prochain)) }) : t('mp.mode.histoire.etat', { n: prochain })) + '\n' + texteDifficulteChapitre(semaines[prochain - 1]), // prompt 161 : « nouveau » seulement s'il l'est // prompt 97 : le canal de flow visible avant de jouer
			chapitre: prochain,
			recommande: true,
			desactive: semaines.length < 3,
		},
		{
			cle: 'direct',
			titre: t('mp.mode.direct'),
			detail: t('mp.mode.direct.sous'),
			info: !tempsReelDebloque() ? t('mp.mode.direct.verrou') : !enLigne ? t('mp.mode.direct.horsLigne') : t('accueil.direct.info', { meilleur: texteMeilleur('direct') }),
			verrou: !tempsReelDebloque(),
			desactive: !tempsReelDebloque() || !enLigne,
		},
	];
}
/** Prompt 177 : un mode verrouillé ou indisponible (`desactive`) ne reçoit jamais le focus. Si la sélection pointe
 * sur lui (mode devenu indisponible, hors ligne…), elle revient au premier mode jouable ; dès qu'il est jouable,
 * Tab et les flèches s'y arrêtent de nouveau. */
function recalerChoixMode(modes) {
	if (MENU.choixSemaine >= modes.length) MENU.choixSemaine = 0;
	if (modes[MENU.choixSemaine].desactive) {
		const i = modes.findIndex((m) => !m.desactive);
		if (i >= 0) MENU.choixSemaine = i;
	}
}
/** Déplace la sélection de `d` (±1) en sautant les modes désactivés ; sans autre mode jouable, elle ne bouge pas */
function pasChoixMode(modes, d) {
	const n = modes.length;
	let i = MENU.choixSemaine;
	for (let k = 0; k < n; k++) {
		i = (i + n + d) % n;
		if (!modes[i].desactive) return (MENU.choixSemaine = i);
	}
	return MENU.choixSemaine;
}
/** Équivalent d'aria-disabled dans la zone d'annonces : « Mode temps réel, indisponible. » + la raison affichée */
const annonceModeIndisponible = (m) => t('mp.mode.indispo', { titre: m.titre, raison: m.info });
function dessinerChoixSemaine() {
	const modes = modesNouvellePartie();
	recalerChoixMode(modes);
	noStroke();
	dsTitre(t('mp.semaines.titre'), 160, 100, 60, MENU_C.blanc, 'left');
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textSize(26);
	push(); // interligne : état global de p5, rendu tel quel par pop()
	textLeading(36); // prompt 171 : même interligne (≈ 1,4 × le corps) que le texte sous le titre du menu ; sans lui, l'interligne hérité (26 px) serrait les deux lignes
	fill(MENU_C.doux);
	text(t('mp.mode.sous'), 160, 186, 1500, 76);
	pop();
	const lc = 780;
	const hc = 400;
	modes.forEach((o, i) => {
		const x = 160 + i * (lc + 40);
		const y = 280;
		const sel = i === MENU.choixSemaine && !o.desactive;
		const survol = mouseX >= x && mouseX <= x + lc && mouseY >= y && mouseY <= y + hc;
		const actif = (sel || survol) && !o.desactive; // prompt 177 : ni survol ni sélection sur une carte indisponible
		noStroke();
		fill(actif ? MENU_C.blanc : 'rgba(255,255,255,0.06)');
		rect(x, y, lc, hc);
		if (!actif) {
			stroke(255, 255, 255, 60);
			strokeWeight(2);
			noFill();
			rect(x + 1, y + 1, lc - 2, hc - 2);
			noStroke();
		}
		if (sel) {
			noFill();
			stroke(DS.primaireTrait);
			strokeWeight(4);
			rect(x - 6, y - 6, lc + 12, hc + 12);
			noStroke();
		}
		const encre = o.desactive ? 'rgba(255,255,255,0.55)' : actif ? MENU_C.encre : MENU_C.blanc;
		if (o.recommande) {
			fill(MENU_C.bleu);
			rect(x, y, 300, 40);
			fill('#ffffff');
			textAlign(LEFT, CENTER);
			textFont(POLICE_DONNEES);
			textSize(18);
			text(t('mp.mode.recommande'), x + 20, y + 20);
		}
		if (o.verrou) {
			// cadenas dessiné par le code
			stroke('rgba(255,255,255,0.7)');
			strokeWeight(6);
			noFill();
			arc(x + lc - 80, y + 70, 44, 50, PI, TWO_PI);
			noStroke();
			fill('rgba(255,255,255,0.7)');
			rect(x + lc - 110, y + 70, 60, 46);
		}
		textAlign(LEFT, TOP);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		ajusterTaille(o.titre, lc - 200, 40);
		fill(encre);
		text(o.titre, x + 40, y + 70);
		textStyle(NORMAL);
		textSize(22);
		textLeading(32);
		fill(o.desactive ? encre : actif ? MENU_C.bleu : MENU_C.doux);
		text(o.detail, x + 40, y + 140, lc - 80, 140);
		textSize(19);
		textLeading(26); // prompt 97 : 3 lignes (étape + difficulté) tiennent dans la case
		fill(o.desactive ? encre : actif ? 'rgba(13,12,12,0.75)' : MENU_C.doux);
		text(o.info, x + 40, y + 278, lc - 80, 116);
		// Prompt 177 : une carte indisponible n'est ni sélectionnable ni activable — le clic redit seulement pourquoi
		boutons.push({ x, y, l: lc, h: hc, action: () => (o.desactive ? annoncer(annonceModeIndisponible(o)) : MENU.choixSemaine === i ? lancerDepuisMenu() : (MENU.choixSemaine = i)) });
	});
	if (typeof dessinerOptionsNouvellePartie === 'function') dessinerOptionsNouvellePartie(160, H - 250); // prompt 37
	const o = modes[MENU.choixSemaine];
	bouton(L - 160 - 420, H - 150, 420, 84, t('mp.lancer'), lancerDepuisMenu, !o || o.desactive);
	bouton(160, H - 140, 260, 68, t('mp.retour'), () => ((MENU.ecran = 'titre'), (MENU.debut = millis())), false, true);
}

// ——— Prompt 178 : écran « Reprendre une partie » — les emplacements de sauvegarde, le plus récent d'abord ———
// Colonne de gauche (x 160 → 1000) : elle tient dans le recadrage portrait du menu. ↑ ↓ choisir, Entrée reprendre,
// Suppr supprimer (confirmation dans l'écran : Entrée confirme, Échap annule), Échap revenir au menu.
const SAUV_ZONE = { x: 160, y: 276, l: 840, h: 112, ecart: 12 };
/** `apres` : action à relancer une fois une place libérée (nouvelle partie arrêtée par la limite d'emplacements) */
function allerSauvegardes(apres) {
	const liste = Sauvegarde.lister();
	MENU.ecran = 'sauvegardes';
	MENU.debut = millis();
	MENU.confirmeSauv = false;
	MENU.apresSuppr = typeof apres === 'function' ? apres : null;
	MENU.choixSauv = MENU.apresSuppr ? Math.max(0, liste.length - 1) : 0; // limite atteinte : la plus ancienne est proposée
	Confort.Son.bip('choix');
	annoncer((MENU.apresSuppr ? t('sauv.limite', { max: Sauvegarde.MAX }) : t('sauv.annonceEcran', { n: liste.length })) + ' ' + (liste.length ? annonceSauvegarde(liste, MENU.choixSauv) : t('sauv.vide')));
}
function quitterSauvegardes() {
	MENU.ecran = MENU.apresSuppr ? 'semaines' : 'titre';
	MENU.apresSuppr = null;
	MENU.confirmeSauv = false;
	MENU.debut = millis();
}
/** Ce qu'on sait d'un emplacement, sans rien inventer : un champ absent (ancienne sauvegarde) → [À COMPLÉTER] */
function infosSauvegarde(o) {
	const inconnu = '[À COMPLÉTER]';
	const c = (o.etat && o.etat.complet) || {};
	const ch = o.semaine === 'direct' || o.semaine === 'fallback' ? 0 : semainesHistoire().indexOf(o.semaine) + 1;
	const mode = o.semaine === 'direct' ? t('mp.mode.direct') : o.semaine === 'fallback' ? t('sauv.mode.reference') : ch ? t('sauv.mode.histoire', { n: ch }) : t('sauv.mode.semaine');
	const semaine = o.semaine === 'direct' || o.semaine === 'fallback' ? '' : t('sauv.semaine', { date: dateLongue(o.semaine) });
	const jour = Number.isInteger(c.jourIndex) && Array.isArray(c.jours) ? t('sauv.jour', { j: c.jourIndex + 1, n: c.jours.length }) : inconnu;
	const d = o.sauvegardeLe ? new Date(o.sauvegardeLe) : null;
	const p = (v) => String(v).padStart(2, '0');
	const date = d && !isNaN(d.getTime()) ? t('sauv.date', { date: p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear(), heure: p(d.getHours()) + ':' + p(d.getMinutes()) }) : t('sauv.dateInconnue', { v: inconnu });
	const j = (o.etat && o.etat.jauges) || {};
	const jauges = ['fluidite', 'reputation', 'budget'].map((k) => ({ cle: k, v: typeof j[k] === 'number' ? Math.round(j[k]) : null }));
	return { mode, semaine, jour, date, jauges, inconnu };
}
/** « Sauvegarde 2 sur 3 : … » (lecteur d'écran) */
function annonceSauvegarde(liste, i) {
	const o = liste[i];
	if (!o) return '';
	const f = infosSauvegarde(o);
	return t('sauv.annonce', { i: i + 1, n: liste.length, detail: [f.mode, f.semaine, f.jour, f.date].filter(Boolean).join(', '), jauges: f.jauges.map((g) => t('jauge.' + g.cle) + ' ' + (g.v === null ? f.inconnu : g.v)).join(', ') });
}
function reprendreSauvegarde(i) {
	const o = Sauvegarde.lister()[i];
	if (!o) return;
	MENU.apresSuppr = null;
	avantDeJouer(() => Sauvegarde.reprendre(o)); // prompt 110 : autorisations avant de jouer
}
function demanderSuppressionSauvegarde() {
	const liste = Sauvegarde.lister();
	if (!liste[MENU.choixSauv]) return;
	MENU.confirmeSauv = true;
	annoncer(t('sauv.confirmer.annonce') + ' ' + annonceSauvegarde(liste, MENU.choixSauv));
}
function supprimerSauvegarde() {
	const o = Sauvegarde.lister()[MENU.choixSauv];
	MENU.confirmeSauv = false;
	if (!o) return;
	Sauvegarde.effacer(o.id); // cet emplacement seulement
	Confort.Son.bip('choix');
	const reste = Sauvegarde.lister();
	MENU.choixSauv = Math.min(MENU.choixSauv, Math.max(0, reste.length - 1));
	const suite = MENU.apresSuppr;
	if (suite && !Sauvegarde.pleine()) {
		// La place est libérée : la nouvelle partie demandée se lance
		MENU.apresSuppr = null;
		MENU.ecran = 'semaines';
		annoncer(t('sauv.supprimee', { n: reste.length }));
		return suite();
	}
	annoncer(t('sauv.supprimee', { n: reste.length }) + ' ' + (reste.length ? annonceSauvegarde(reste, MENU.choixSauv) : t('sauv.vide')));
}
function dessinerSauvegardes() {
	const liste = Sauvegarde.lister();
	const Z = SAUV_ZONE;
	if (MENU.choixSauv >= liste.length) MENU.choixSauv = Math.max(0, liste.length - 1);
	noStroke();
	dsTitre(t('mp.reprendre'), Z.x, 100, 60, MENU_C.blanc, 'left');
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textSize(24);
	push(); // interligne : état global de p5, rendu tel quel par pop()
	textLeading(34);
	fill(MENU_C.doux);
	text(MENU.apresSuppr ? t('sauv.limite', { max: Sauvegarde.MAX }) : liste.length ? t('sauv.sous', { n: liste.length, max: Sauvegarde.MAX }) : t('sauv.vide'), Z.x, 186, Z.l, 72);
	pop();
	// MAX lignes tiennent à l'écran ; au-delà (emplacements en trop, jamais créés par le menu), la liste suit la sélection
	const debut = Math.max(0, Math.min(MENU.choixSauv - 2, liste.length - Sauvegarde.MAX));
	liste.slice(debut, debut + Sauvegarde.MAX).forEach((o, k0) => {
		const i = debut + k0;
		const y = Z.y + k0 * (Z.h + Z.ecart);
		const sel = i === MENU.choixSauv;
		const survol = !MENU.confirmeSauv && mouseX >= Z.x && mouseX <= Z.x + Z.l && mouseY >= y && mouseY <= y + Z.h;
		const actif = sel || survol;
		const f = infosSauvegarde(o);
		noStroke();
		if (actif) {
			fill(MENU_C.blanc);
			rect(Z.x, y, Z.l, Z.h);
			fill(MENU_C.bleu);
			rect(Z.x, y, 8, Z.h);
		} else {
			fill(255, 255, 255, 22);
			rect(Z.x, y, Z.l, Z.h);
			stroke(255, 255, 255, 60);
			strokeWeight(2);
			noFill();
			rect(Z.x + 1, y + 1, Z.l - 2, Z.h - 2);
			noStroke();
		}
		if (sel) {
			noFill();
			stroke(DS.primaireTrait);
			strokeWeight(4);
			rect(Z.x - 6, y - 6, Z.l + 12, Z.h + 12);
			noStroke();
		}
		const encre = actif ? MENU_C.encre : MENU_C.blanc;
		const doux = actif ? 'rgba(13,12,12,0.75)' : MENU_C.doux;
		const lt = Z.l - 32 - 300; // texte à gauche, jauges à droite (268 px + marges)
		textAlign(LEFT, TOP);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		const titre = f.mode + (f.semaine ? ' · ' + f.semaine : '');
		ajusterTaille(titre, lt, 24, 16);
		fill(encre);
		text(titre, Z.x + 32, y + 18);
		textStyle(NORMAL);
		textFont(POLICE_DONNEES);
		ajusterTaille(f.jour, lt, 18, 14);
		fill(doux);
		text(f.jour, Z.x + 32, y + 54);
		ajusterTaille(f.date, lt, 18, 14);
		text(f.date, Z.x + 32, y + 80);
		// État des trois jauges : libellé, barre, valeur (la couleur n'est jamais la seule information)
		const xj = Z.x + Z.l - 284;
		f.jauges.forEach((g, k) => {
			const yj = y + 16 + k * 28;
			textSize(16);
			textAlign(LEFT, CENTER);
			fill(doux);
			text(t('jauge.' + g.cle), xj, yj + 12);
			fill(actif ? 'rgba(13,12,12,0.14)' : 'rgba(255,255,255,0.18)');
			rect(xj + 112, yj + 6, 100, 12);
			if (g.v !== null) {
				fill(couleurJauge(g.v));
				rect(xj + 112, yj + 6, Math.max(2, g.v), 12);
			}
			fill(encre);
			textAlign(RIGHT, CENTER);
			text(g.v === null ? f.inconnu : String(g.v), xj + 268, yj + 12);
		});
		textAlign(LEFT, TOP);
		if (!MENU.confirmeSauv) boutons.push({ x: Z.x, y, l: Z.l, h: Z.h, action: () => (MENU.choixSauv === i ? reprendreSauvegarde(i) : ((MENU.choixSauv = i), annoncer(annonceSauvegarde(Sauvegarde.lister(), i)))) });
	});
	const yb = H - 140;
	if (MENU.confirmeSauv) {
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(24);
		textAlign(LEFT, BOTTOM);
		fill(MENU_C.blanc);
		text(t('sauv.confirmer.texte'), Z.x, yb - 16);
		textStyle(NORMAL);
		textAlign(LEFT, TOP);
		bouton(Z.x, yb, 410, 68, t('sauv.confirmer.oui'), supprimerSauvegarde);
		bouton(Z.x + 430, yb, 410, 68, t('sauv.confirmer.non'), () => ((MENU.confirmeSauv = false), annoncer(t('sauv.confirmer.annulee'))), false, true);
		return;
	}
	bouton(Z.x, yb, 240, 68, t('mp.retour'), quitterSauvegardes, false, true);
	bouton(Z.x + 260, yb, 270, 68, t('sauv.supprimer'), demanderSuppressionSauvegarde, !liste.length, true);
	bouton(Z.x + 550, yb, 290, 68, t('sauv.reprendre'), () => reprendreSauvegarde(MENU.choixSauv), !liste.length);
}
function toucheSauvegardes() {
	const liste = Sauvegarde.lister();
	const n = liste.length;
	if (MENU.confirmeSauv) {
		if (keyCode === ENTER || keyCode === RETURN) supprimerSauvegarde();
		else if (keyCode === ESCAPE || keyCode === BACKSPACE) (MENU.confirmeSauv = false), annoncer(t('sauv.confirmer.annulee'));
		return true;
	}
	if (keyCode === ESCAPE || keyCode === BACKSPACE) return quitterSauvegardes(), true;
	if (!n) return true;
	if (keyCode === UP_ARROW || (keyCode === TAB && keyIsDown(SHIFT))) MENU.choixSauv = (MENU.choixSauv + n - 1) % n;
	else if (keyCode === DOWN_ARROW || keyCode === TAB) MENU.choixSauv = (MENU.choixSauv + 1) % n;
	else if (keyCode === ENTER || keyCode === RETURN) return reprendreSauvegarde(MENU.choixSauv), true;
	else if (keyCode === DELETE) return demanderSuppressionSauvegarde(), true;
	else return true;
	annoncer(annonceSauvegarde(liste, MENU.choixSauv));
	return true;
}

/** Clavier du menu principal ; renvoie true si la touche a été traitée */
function toucheMenu() {
	if (MENU.ecran === 'autorisations') return toucheAutorisations(); // prompt 110
	if (MENU.ecran === 'credits') return toucheCredits(); // prompt 113
	if (MENU.ecran === 'sauvegardes') return toucheSauvegardes(); // prompt 178
	if (MENU.ecran === 'semaines') {
		const modes = modesNouvellePartie();
		recalerChoixMode(modes);
		// Prompt 177 : Tab et les flèches sautent un mode verrouillé ou indisponible
		if (keyCode === LEFT_ARROW || keyCode === UP_ARROW || (keyCode === TAB && keyIsDown(SHIFT))) pasChoixMode(modes, -1);
		else if (keyCode === RIGHT_ARROW || keyCode === DOWN_ARROW || keyCode === TAB) pasChoixMode(modes, 1);
		else if (keyCode === ENTER || keyCode === RETURN) lancerDepuisMenu();
		else if (keyCode === ESCAPE || keyCode === BACKSPACE) (MENU.ecran = 'titre'), (MENU.debut = millis());
		else if (typeof toucheOptionsNouvellePartie === 'function') toucheOptionsNouvellePartie(); // prompt 37
		const o = modes[MENU.choixSemaine];
		if (o && (keyCode === TAB || keyCode === UP_ARROW || keyCode === DOWN_ARROW || keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW)) annoncer(String(o.titre) + ' — ' + String(o.detail));
		return true;
	}
	const e = entreesMenu();
	const n = e.length + EXTRAS_MENU.length; // prompt 81 : puis dépôt, partager, licence
	const choisi = () => (MENU.choix < e.length ? e[MENU.choix] : EXTRAS_MENU[MENU.choix - e.length]);
	// Prompt 178 : une entrée grisée (« Reprendre une partie » sans sauvegarde) n'est jamais focalisée
	const pas = (d) => {
		do MENU.choix = (MENU.choix + n + d) % n;
		while (choisi().desactive);
	};
	if (keyCode === UP_ARROW || (keyCode === TAB && keyIsDown(SHIFT))) pas(-1);
	else if (keyCode === DOWN_ARROW || keyCode === TAB) pas(1);
	else if ((keyCode === ENTER || keyCode === RETURN || key === ' ') && !choisi().desactive) choisi().action();
	// Prompt 171 : plus de raccourci H au menu titre (l'aide s'ouvre en partie)
	if (keyCode === UP_ARROW || keyCode === DOWN_ARROW || keyCode === TAB) annoncer(t('mp.' + choisi().cle));
	return true;
}

/** Appli de régulation sans partie en cours (prompt 35) : l'accueil n'est plus dans le PC */
function dessinerAppliSansPartie() {
	noStroke();
	fill(C.fond);
	rect(0, 0, L, H); // prompt 50 : pas de background() dans la fenêtre de l'appli (il ignore la transformation)
	const l = 900;
	const h = 360;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	noStroke();
	textAlign(CENTER, TOP);
	fill(C.accent);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(44);
	text(t('mp.sansPartie.titre'), L / 2, y + 48);
	textStyle(NORMAL);
	textSize(24);
	fill(C.texte);
	text(t('mp.sansPartie.texte'), x + 60, y + 124, l - 120, 80);
	bouton(L / 2 - 200, y + h - 120, 400, 76, t('menu.menuPrincipal'), ouvrirMenuPrincipal);
}
