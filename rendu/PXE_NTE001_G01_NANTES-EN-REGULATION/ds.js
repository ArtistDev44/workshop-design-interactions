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
	primaire: '#D4031C',
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
};
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

/** Bouton du design system. variante : 'primaire' | 'secondaire' | 'contour' | 'fantome' */
function dsBouton(x, y, l, h, label, action, variante, desactive) {
	variante = variante || 'primaire';
	const survol = !desactive && mouseX >= x && mouseX <= x + l && mouseY >= y && mouseY <= y + h;
	const v = {
		primaire: { fond: DS.primaire, texte: DS.blanc, bord: null },
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
	while (taille > 18 && textWidth(label + '  ›') > l - 24) textSize(--taille); // prompt 66 : le libellé reste dans le bouton
	fill(desactive ? DS.blanc50 : v.texte);
	textAlign(CENTER, CENTER);
	zoneTexteDebut('bouton', x, y, l, h); // prompt 93
	text(label + '  ›', x + l / 2, y + h / 2);
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
	const daltonien = typeof Confort !== 'undefined' && Confort.Reglages && ['protan', 'deutan'].includes(Confort.Reglages.daltonisme); // prompt 118 : #FF7A00 + blanc = 2,61:1 → texte sombre 7,48:1 (tritan #E8003D garde le blanc, 4,67:1)
	fill(type === 'alerte' || type === 'succes' || (daltonien && (type || 'erreur') === 'erreur') ? DS.fond : DS.blanc);
	textAlign(CENTER, CENTER);
	zoneTexteDebut('badge', x - l / 2, y - 14, l, 28); // prompt 93
	text(txt, x, y);
	zoneTexteFin();
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
	if (titre) {
		fill(couleurBarre || DS.blanc05);
		rect(x + 2, y + 2, l - 4, 56);
		stroke(DS.blanc15);
		line(x + 2, y + 58, x + l - 2, y + 58);
		noStroke();
		dsTitre(titre, x + 24, y + 12, 32, DS.blanc, 'left');
	}
}

// ——— Prompt 75 : logo du jeu (moniteur à écran rouge et ligne de bus) — UNE seule définition des formes ———
// Mêmes rectangles que le SVG de l'écran de chargement (index.html, #chargement .logo, viewBox 0 0 24 20) ;
// scripts/test-jeu.mjs vérifie que les deux restent identiques.
const LOGO_PXE = [
	[1, 1, 22, 14, '#ffffff'], // moniteur
	[3, 3, 18, 10, '#d4031c'], // écran rouge
	[4, 9, 16, 1, '#ffffff'], // ligne de bus
	[6, 7, 3, 3, '#00ca64'], // fenêtre (arrêt desservi)
	[15, 7, 3, 3, '#ffffff'], // fenêtre
	[11, 15, 2, 3, '#ffffff'], // pied
	[7, 18, 10, 1, '#ffffff'], // socle
];
/** Dessine le logo en pixel art : (x, y) coin haut gauche, « taille » = hauteur en px (largeur 24/20 × taille) ;
 * l'échelle est arrondie à l'entier pour des pixels nets (crisp). */
function dessinerLogoPXE(x, y, taille) {
	const k = Math.max(1, Math.floor(taille / 20));
	noStroke();
	LOGO_PXE.forEach(([rx, ry, rl, rh, c]) => {
		fill(c);
		rect(Math.round(x) + rx * k, Math.round(y) + ry * k, rl * k, rh * k);
	});
	return { l: 24 * k, h: 20 * k };
}
