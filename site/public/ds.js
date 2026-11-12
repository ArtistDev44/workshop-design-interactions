/* Nantes en régulation — « Pixel Design System » (fourni par le groupe, PDF) appliqué au PC.
 * Jetons repris du document : fond #0D0C0C, primaire rouge #D4031C, blanc et ses opacités (75/50/15/05/03),
 * fonctionnels succès / alerte / erreur / info, arrondi 0, unité 4 px, espacements 2/4/8/16/20/24 px.
 * Polices : titres « Bitsy Pixels », texte « JetBrains Mono » — chargées en webfont auto-hébergée (fonts.css, dossier fonts/)
 * ou installées localement ; sinon les titres sont rendus en pixels (texte dessiné petit puis agrandi ×4 sans lissage)
 * et le texte passe en monospace système.
 * Composants : boutons (primaire, secondaire, contour, fantôme ; focus en double bordure), badge, panneau/dialogue.
 */
const DS = {
	fond: '#0D0C0C',
	// Couleur d'accent (prompt 176) : valeurs de la palette par défaut, recalculées par Theme.appliquer() (theme.js)
	primaire: '#D4031C', // aplat : bouton principal, sélection, piste active
	surPrimaire: '#FFFFFF', // texte posé sur l'aplat (blanc ou sombre, choisi par accentDerive)
	primaireTrait: '#D4031C', // trait / liseré / focus sur fond sombre (≥ 3:1)
	primaireTexte: '#E04A5C', // texte / lien sur fond sombre (≥ 4,5:1)
	blanc: '#FFFFFF',
	blanc75: 'rgba(255,255,255,0.75)',
	blanc50: 'rgba(255,255,255,0.50)',
	blanc15: 'rgba(255,255,255,0.15)',
	blanc05: 'rgba(255,255,255,0.05)',
	noir50: 'rgba(13,12,12,0.50)',
	succes: '#00B74F', // Success Primary (prompt 39 : valeur exacte du design system)
	succesClair: '#BFFFDB',
	alerte: '#FFC138',
	alerteClair: '#FFECC2',
	erreur: '#D10B00', // Error Primary
	erreurClair: '#FFC5C2',
	info: '#3860FF',
	infoClair: '#C2CEFF',
	u: 4, // unité
	esp: { xxs: 2, xs: 4, sm: 8, md: 16, xl: 20, xxl: 24 },
	// Prompt 173 : un seul voile derrière toutes les fenêtres (opacité 0,8 : le contenu derrière ne concurrence plus
	// la fenêtre), un voile « percé » plus léger pour la mise en avant d'une cible (le reste s'assombrit, plus de
	// contour jaune), et trois largeurs de fenêtre (px du canevas 1920×1080) avec la même marge interne et la même
	// hauteur d'en-tête
	voile: 0.8,
	voilePerce: 0.65,
	dureeVoile: 180, // ms (≤ 200) ; immédiat avec les animations réduites
	fenetre: { etroite: 640, moyenne: 960, large: 1280, marge: 48, entete: 80 },
};
/** Prompt 173 : voile plein écran des fenêtres (k = avancement 0 → 1 d'une animation d'ouverture, 1 par défaut) */
function dsVoile(k) {
	noStroke();
	fill(13, 12, 12, 255 * DS.voile * (k === undefined ? 1 : k));
	rect(0, 0, L, H);
}
/** Prompt 173 : mise en avant par l'obscurité — tout le canevas est assombri SAUF le rectangle `cible` ({ x, y, l, h },
 * agrandi de `marge` px). Le fondu d'apparition (DS.dureeVoile) repart quand le voile n'était pas dessiné à l'image
 * précédente ; il est immédiat avec les animations réduites. Réutilisable par le guide, le tutoriel, les paramètres. */
const VOILE_PERCE = { vue: -9, debut: 0 };
function dsVoilePerce(cible, marge, opacite) {
	const m = marge === undefined ? 10 : marge;
	const x0 = Math.max(0, Math.round(cible.x - m));
	const y0 = Math.max(0, Math.round(cible.y - m));
	const x1 = Math.min(L, Math.round(cible.x + cible.l + m));
	const y1 = Math.min(H, Math.round(cible.y + cible.h + m));
	if (frameCount - VOILE_PERCE.vue > 1) VOILE_PERCE.debut = millis();
	VOILE_PERCE.vue = frameCount;
	const reduit = typeof reduireAnimations !== 'undefined' && reduireAnimations;
	const k = reduit ? 1 : Math.min(1, (millis() - VOILE_PERCE.debut) / DS.dureeVoile);
	noStroke();
	fill(13, 12, 12, 255 * (opacite === undefined ? DS.voilePerce : opacite) * k);
	rect(0, 0, L, y0); // au-dessus
	rect(0, y1, L, H - y1); // au-dessous
	rect(0, y0, x0, y1 - y0); // à gauche
	rect(x1, y0, L - x1, y1 - y0); // à droite
	return { x: x0, y: y0, l: x1 - x0, h: y1 - y0 };
}
function detecterPolicesDS() {
	DS.policeTexte = policeInstallee(['JetBrains Mono', 'IBM Plex Mono', 'Menlo', 'Consolas', 'Courier New'], 'serif');
	DS.policeTitreInstallee = policeInstallee(['Bitsy Pixels', '__aucune__'], 'serif') === 'Bitsy Pixels';
}
detecterPolicesDS();
// Les polices web (fonts.css) peuvent arriver après le premier parse : re-détection une fois chargées
if (document.fonts && document.fonts.ready) document.fonts.ready.then(detecterPolicesDS);

// ——— Titres en pixels ———
const cacheTitres = new Map();
/** Titre au style pixel : `taille` = hauteur visuelle en px ; align 'left' | 'center' | 'right' */
/** Prompt 49 : gros pixels (×4) pour les grands titres ; ×2 sous 40 px, sinon les petits titres (≈ 6 px avant
 * agrandissement) devenaient illisibles */
const facteurPixel = (taille) => (taille < 40 ? 2 : 4);
function dsTitre(txt, x, y, taille, couleur, align) {
	if (DS.policeTitreInstallee) {
		textFont('Bitsy Pixels');
		textSize(taille);
		fill(couleur);
		textAlign(align === 'center' ? CENTER : align === 'right' ? RIGHT : LEFT, TOP);
		return text(txt, x, y);
	}
	const cle = txt + '|' + taille + '|' + couleur;
	let c = cacheTitres.get(cle);
	if (!c) {
		const f = facteurPixel(taille);
		const petit = Math.max(8, Math.round(taille / f));
		c = document.createElement('canvas');
		const ctx = c.getContext('2d');
		ctx.font = 'bold ' + petit + 'px "' + DS.policeTexte + '", monospace';
		c.width = Math.ceil(ctx.measureText(txt).width) + 2;
		c.height = Math.ceil(petit * 1.3);
		ctx.font = 'bold ' + petit + 'px "' + DS.policeTexte + '", monospace';
		ctx.fillStyle = couleur;
		ctx.textBaseline = 'top';
		ctx.fillText(txt, 1, 1);
		// Binarisation : pixels nets (pas d'anticrénelage) pour l'effet « police pixel »
		const im = ctx.getImageData(0, 0, c.width, c.height);
		for (let i = 3; i < im.data.length; i += 4) im.data[i] = im.data[i] > 110 ? 255 : 0;
		ctx.putImageData(im, 0, 0);
		cacheTitres.set(cle, c);
	}
	const f = facteurPixel(taille);
	const l = c.width * f;
	const dx = align === 'center' ? x - l / 2 : align === 'right' ? x - l : x;
	drawingContext.imageSmoothingEnabled = false;
	drawingContext.drawImage(c, dx, y, l, c.height * f);
	drawingContext.imageSmoothingEnabled = true;
	return l;
}

function dsTexte(txt, x, y, taille, couleur, align, largeur) {
	textFont(DS.policeTexte);
	textStyle(NORMAL);
	textSize(taille);
	fill(couleur);
	noStroke();
	textAlign(align === 'center' ? CENTER : align === 'right' ? RIGHT : LEFT, TOP);
	if (largeur) text(txt, x, y, largeur, 400);
	else text(txt, x, y);
}

/** Bouton du design system. variante : 'primaire' | 'secondaire' | 'contour' | 'fantome' ;
 * sansChevron : libellé seul, sans le « › » final (prompt 171 : boutons « Retour ») */
function dsBouton(x, y, l, h, label, action, variante, desactive, sansChevron) {
	variante = variante || 'primaire';
	const survol = !desactive && mouseX >= x && mouseX <= x + l && mouseY >= y && mouseY <= y + h;
	const v = {
		primaire: { fond: DS.primaire, texte: DS.surPrimaire, bord: null },
		secondaire: { fond: DS.blanc, texte: DS.fond, bord: null },
		contour: { fond: null, texte: DS.blanc, bord: DS.blanc },
		fantome: { fond: survol ? DS.blanc15 : null, texte: DS.blanc, bord: null },
	}[variante];
	noStroke();
	if (desactive) {
		fill(DS.blanc05);
		rect(x, y, l, h);
		stroke(DS.blanc15);
		strokeWeight(2);
		noFill();
		rect(x + 1, y + 1, l - 2, h - 2);
	} else {
		if (v.fond) {
			fill(v.fond);
			rect(x, y, l, h);
		}
		if (v.bord) {
			noFill();
			stroke(v.bord);
			strokeWeight(2);
			rect(x + 1, y + 1, l - 2, h - 2);
		}
		if (survol && variante !== 'fantome') {
			// Focus / survol : double bordure (comme dans le document)
			noFill();
			stroke(v.fond || DS.blanc);
			strokeWeight(2);
			rect(x - 5, y - 5, l + 10, h + 10);
			stroke(DS.fond);
			rect(x - 2, y - 2, l + 4, h + 4);
		}
	}
	noStroke();
	textFont(DS.policeTexte);
	let taille = Math.min(24, h * 0.38);
	textSize(taille);
	const libelle = sansChevron ? label : label + '  ›';
	while (taille > 18 && textWidth(libelle) > l - 24) textSize(--taille); // prompt 66 : le libellé reste dans le bouton
	fill(desactive ? DS.blanc50 : v.texte);
	textAlign(CENTER, CENTER);
	zoneTexteDebut('bouton', x, y, l, h); // prompt 93
	text(libelle, x + l / 2, y + h / 2);
	zoneTexteFin();
	if (!desactive) boutons.push({ x, y, l, h, action });
}

/** Badge (compteur / statut) : type 'erreur' | 'succes' | 'alerte' | 'info' */
function dsBadge(x, y, txt, type) {
	textFont(DS.policeTexte);
	textSize(18);
	const l = Math.max(28, textWidth(txt) + 16);
	noStroke();
	fill(DS[type || 'erreur']);
	rect(x - l / 2, y - 14, l, 28);
	const daltonien = typeof Confort !== 'undefined' && Confort.Reglages && ['protan', 'deutan'].includes(Confort.Reglages.daltonisme); // prompt 133 : #FF7A00 + blanc = 2,61:1 → texte sombre 7,48:1 (tritan #E8003D garde le blanc, 4,67:1)
	fill(type === 'alerte' || type === 'succes' || (daltonien && (type || 'erreur') === 'erreur') ? DS.fond : DS.blanc);
	textAlign(CENTER, CENTER);
	zoneTexteDebut('badge', x - l / 2, y - 14, l, 28); // prompt 93
	text(txt, x, y);
	zoneTexteFin();
}

/** Interrupteur (prompt 175) : réglage à deux états, aligné à DROITE sur xDroite, haut de 44 px.
 * L'état se lit sans la couleur : libellé « Activé » / « Désactivé » (ou `libelle`), curseur carré à droite (activé)
 * ou à gauche (désactivé), repère sombre dans le curseur activé, piste pleine ou seulement bordée.
 * La piste active prend la couleur principale (DS.primaire, theme.js). Renvoie la largeur occupée. */
const DS_INTERRUPTEUR = { piste: 64, hPiste: 32, h: 44, ecart: 12 };
/** Largeur d'un interrupteur (libellé + piste), sans le dessiner : pour placer ce qui l'entoure */
function dsLargeurInterrupteur(actif, libelle) {
	textFont(DS.policeTexte);
	textStyle(NORMAL);
	textSize(20);
	return Math.ceil(textWidth(libelle || t(actif ? 'commun.active' : 'commun.desactive'))) + DS_INTERRUPTEUR.ecart + DS_INTERRUPTEUR.piste;
}
function dsInterrupteur(xDroite, y, actif, action, libelle, focus) {
	const I = DS_INTERRUPTEUR;
	const lib = libelle || t(actif ? 'commun.active' : 'commun.desactive');
	noStroke();
	const l = dsLargeurInterrupteur(actif, libelle);
	const lt = l - I.ecart - I.piste;
	const x = xDroite - l;
	const px = xDroite - I.piste;
	const py = y + (I.h - I.hPiste) / 2;
	const survol = !!action && mouseX >= x - 8 && mouseX <= xDroite && mouseY >= y && mouseY <= y + I.h;
	if (actif) {
		fill(DS.primaire);
		rect(px, py, I.piste, I.hPiste);
	} else {
		fill(DS.blanc05);
		rect(px, py, I.piste, I.hPiste);
		noFill();
		stroke(DS.blanc50);
		strokeWeight(2);
		rect(px + 1, py + 1, I.piste - 2, I.hPiste - 2);
		noStroke();
	}
	const c = I.hPiste - 8; // curseur carré
	const cx = actif ? px + I.piste - 4 - c : px + 4;
	fill(actif ? DS.blanc : DS.blanc75);
	rect(cx, py + 4, c, c);
	if (actif) {
		fill(DS.fond);
		rect(cx + c / 2 - 2, py + 10, 4, c - 12); // repère « I » : forme, pas couleur
	}
	if (survol || focus) {
		noFill();
		stroke(DS.blanc);
		strokeWeight(2);
		rect(px - 5, py - 5, I.piste + 10, I.hPiste + 10);
		noStroke();
	}
	fill(actif ? DS.blanc : DS.blanc75);
	textAlign(RIGHT, CENTER);
	zoneTexteDebut('interrupteur', x, y, lt, I.h);
	text(lib, px - I.ecart, y + I.h / 2 - 1);
	zoneTexteFin();
	textAlign(LEFT, TOP);
	if (action) boutons.push({ x: x - 8, y, l: l + 8, h: I.h, action });
	return l;
}

/** Curseur à crans (prompt 175) : dix segments de 10 %, boutons − et +, valeur écrite à droite (« 70 % »).
 * regler(v) reçoit la nouvelle valeur (0 à 100, pas de 10) ; noms : [nom du bouton −, nom du bouton +] (infobulles).
 * Les segments pleins prennent la couleur principale ; les vides ne sont que bordés. Haut de 44 px. */
function dsCurseur(x, y, l, valeur, regler, noms) {
	const h = 44;
	const lb = 44;
	const lv = 84;
	const px = x + lb + 12;
	const lp = l - 2 * lb - 24 - lv;
	const seg = lp / 10;
	const v = Math.max(0, Math.min(100, Math.round(valeur / 10) * 10));
	const petit = (bx, icone, pas, inactif, nom) => {
		const survol = !inactif && mouseX >= bx && mouseX <= bx + lb && mouseY >= y && mouseY <= y + h;
		noStroke();
		fill(survol ? DS.blanc15 : DS.blanc05);
		rect(bx, y, lb, h);
		noFill();
		stroke(inactif ? DS.blanc15 : DS.blanc);
		strokeWeight(2);
		rect(bx + 1, y + 1, lb - 2, h - 2);
		noStroke();
		iconeLucide(icone, bx + 10, y + 10, 24, inactif ? DS.blanc50 : DS.blanc);
		if (!inactif) boutons.push({ x: bx, y, l: lb, h, action: () => regler(v + pas) });
		if (survol && nom && typeof infobulle === 'function') infobulle(nom, bx, y + h + 8);
	};
	petit(x, 'minus', -10, v <= 0, noms && noms[0]);
	for (let i = 0; i < 10; i++) {
		const plein = v >= (i + 1) * 10;
		const sx = px + i * seg;
		noStroke();
		if (plein) {
			fill(DS.primaire);
			rect(sx, y + 8, seg - 4, h - 16);
		} else {
			noFill();
			stroke(DS.blanc50);
			strokeWeight(2);
			rect(sx + 1, y + 9, seg - 6, h - 18);
			noStroke();
		}
	}
	boutons.push({ x: px, y, l: lp, h, action: () => regler(Math.max(0, Math.min(10, Math.ceil((mouseX - px) / seg))) * 10) });
	petit(px + lp + 8, 'plus', 10, v >= 100, noms && noms[1]);
	fill(DS.blanc);
	textFont(DS.policeTexte);
	textStyle(NORMAL);
	textSize(22);
	textAlign(RIGHT, CENTER);
	zoneTexteDebut('curseur', x + l - lv, y, lv, h);
	text(v + ' %', x + l, y + h / 2 - 1);
	zoneTexteFin();
	textAlign(LEFT, TOP);
}

/** Panneau / dialogue du design system : fond noir, bordure blanc 15 %, barre de titre en pixels */
function dsPanneau(x, y, l, h, titre, couleurBarre) {
	noStroke();
	fill(DS.fond);
	rect(x, y, l, h);
	stroke(DS.blanc15);
	strokeWeight(2);
	noFill();
	rect(x + 1, y + 1, l - 2, h - 2);
	noStroke();
	zoneTexteDeclarer('panneauDS', x, y, l, h); // prompt 93
	if (typeof zoneFenetre === 'function') zoneFenetre(x, y, l, h); // prompt 173 : clic sur le fond
	if (titre) {
		fill(couleurBarre || DS.blanc05);
		rect(x + 2, y + 2, l - 4, 56);
		stroke(DS.blanc15);
		line(x + 2, y + 58, x + l - 2, y + 58);
		noStroke();
		dsTitre(titre, x + 24, y + 12, 32, DS.blanc, 'left');
	}
}

// ——— Logo du jeu : la bulle-pin (piste 2 de logo/planche.html) — UNE seule définition des formes ———
// Une bulle de dialogue « &#@! » dont la pointe est un marqueur de carte : quelqu'un se plaint, à un endroit précis.
// Mêmes rectangles que le SVG de l'écran de chargement (index.html, #chargement .logo, viewBox 0 0 24 20) ;
// scripts/test-jeu.mjs vérifie que les deux restent identiques. Le rouge suit la couleur principale (prompt 115).
const LOGO_PXE = [
	// bulle puis pointe du marqueur
	[1, 0, 22, 1, '#d4031c'],
	[0, 1, 24, 11, '#d4031c'],
	[1, 12, 22, 1, '#d4031c'],
	[6, 13, 12, 1, '#d4031c'],
	[7, 14, 10, 1, '#d4031c'],
	[8, 15, 8, 1, '#d4031c'],
	[9, 16, 6, 1, '#d4031c'],
	[10, 17, 4, 1, '#d4031c'],
	[11, 18, 2, 1, '#d4031c'],
	// « &#@! » en lettres pixel 3×5
	[4, 4, 1, 1, '#ffffff'],
	[9, 4, 1, 1, '#ffffff'],
	[11, 4, 1, 1, '#ffffff'],
	[15, 4, 2, 1, '#ffffff'],
	[19, 4, 1, 1, '#ffffff'],
	[3, 5, 1, 1, '#ffffff'],
	[5, 5, 1, 1, '#ffffff'],
	[8, 5, 5, 1, '#ffffff'],
	[14, 5, 1, 1, '#ffffff'],
	[16, 5, 1, 1, '#ffffff'],
	[19, 5, 1, 1, '#ffffff'],
	[4, 6, 1, 1, '#ffffff'],
	[9, 6, 1, 1, '#ffffff'],
	[11, 6, 1, 1, '#ffffff'],
	[14, 6, 3, 1, '#ffffff'],
	[19, 6, 1, 1, '#ffffff'],
	[3, 7, 1, 1, '#ffffff'],
	[5, 7, 1, 1, '#ffffff'],
	[8, 7, 5, 1, '#ffffff'],
	[14, 7, 1, 1, '#ffffff'],
	[4, 8, 1, 1, '#ffffff'],
	[6, 8, 1, 1, '#ffffff'],
	[9, 8, 1, 1, '#ffffff'],
	[11, 8, 1, 1, '#ffffff'],
	[15, 8, 2, 1, '#ffffff'],
	[19, 8, 1, 1, '#ffffff'],
];
// ——— Prompt 152 : icônes pixel 16 × 16 de logo/planche.html, en grilles de lettres ———
// P = couleur principale, W = blanc, G = gris, K = noir, . = transparent (mêmes lettres que la planche).
const ICONE_PIN = [
	'......PPPP......',
	'....PPPPPPPP....',
	'...PPPPWWPPPP...',
	'..PPPPPWWPPPPP..',
	'..PPPPPWWPPPPP..',
	'.PPPPPPWWPPPPPP.',
	'.PPPPPPWWPPPPPP.',
	'.PPPPPPWWPPPPPP.',
	'.PPPPPPPPPPPPPP.',
	'..PPPPPWWPPPPP..',
	'..PPPPPWWPPPPP..',
	'...PPPPPPPPPP...',
	'....PPPPPPPP....',
	'.....PPPPPP.....',
	'......PPPP......',
	'.......PP.......',
];
const ICONE_ECRAN = [
	'GGGGGGGGGGGGGGGG',
	'GPPPPPPPPPPPPPPG',
	'GPPPPPWWWWPPPPPG',
	'GPPPPWWPPWWPPPPG',
	'GPPPPWWPPWWPPPPG',
	'GPPPPPWWWWPPPPPG',
	'GPPPPPPWWPPPPPPG',
	'GPPPPPPPPPPPPPPG',
	'GPPKKKPPPPPKKKPG',
	'GKKPPPKKKKKPPPKG',
	'GPPPPPPPPPPPPPPG',
	'GGGGGGGGGGGGGGGG',
	'................',
	'......GGGG......',
	'......GGGG......',
	'...GGGGGGGGGG...',
];
/** Dessine une icône en grille de lettres : (x, y) coin haut gauche, « taille » = côté en px, « couleurs » = lettre →
 * couleur (une lettre absente n'est pas dessinée). Les bords de chaque case sont arrondis au pixel : pas de lissage,
 * même quand la taille n'est pas un multiple de la grille. */
function dessinerIconePixel(grille, x, y, taille, couleurs) {
	const k = taille / grille.length;
	const bord = (o, n) => Math.round(o + n * k);
	noStroke();
	grille.forEach((ligne, j) => {
		for (let i = 0; i < ligne.length; ) {
			const v = ligne[i];
			let f = i + 1;
			while (f < ligne.length && ligne[f] === v) f++; // une suite de même couleur = un seul rectangle
			if (couleurs[v]) {
				fill(couleurs[v]);
				rect(bord(x, i), bord(y, j), bord(x, f) - bord(x, i), bord(y, j + 1) - bord(y, j));
			}
			i = f;
		}
	});
}

// Prompt 151 : le moniteur d'origine (prompt 75) reste l'icône de l'appli « carte » dans le menu de l'appli de jeu.
const LOGO_MONITEUR = [
	[1, 1, 22, 14, '#ffffff'], // moniteur
	[3, 3, 18, 10, '#d4031c'], // écran rouge
	[4, 9, 16, 1, '#ffffff'], // ligne de bus
	[6, 7, 3, 3, '#00ca64'], // fenêtre (arrêt desservi)
	[15, 7, 3, 3, '#ffffff'], // fenêtre
	[11, 15, 2, 3, '#ffffff'], // pied
	[7, 18, 10, 1, '#ffffff'], // socle
];
/** Dessine un logo en pixel art : (x, y) coin haut gauche, « taille » = hauteur en px (largeur 24/20 × taille) ;
 * l'échelle est arrondie à l'entier pour des pixels nets (crisp). « formes » : LOGO_PXE par défaut. */
function dessinerLogoPXE(x, y, taille, formes) {
	const k = Math.max(1, Math.floor(taille / 20));
	noStroke();
	(formes || LOGO_PXE).forEach(([rx, ry, rl, rh, c]) => {
		fill(c === '#d4031c' ? DS.primaire : c); // prompt 115 : le rouge du logo prend la couleur principale
		rect(Math.round(x) + rx * k, Math.round(y) + ry * k, rl * k, rh * k);
	});
	return { l: 24 * k, h: 20 * k };
}
