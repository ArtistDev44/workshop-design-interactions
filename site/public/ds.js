/* Nantes en régulation — « Pixel Design System » (fourni par le groupe, PDF) appliqué au PC.
 * Jetons repris du document : fond #0D0C0C, primaire rouge #D4031C, blanc et ses opacités (75/50/15/05/03),
 * fonctionnels succès / alerte / erreur / info, arrondi 0, unité 4 px, espacements 2/4/8/16/20/24 px.
 * Polices : titres « Bitsy Pixels », texte « JetBrains Mono » — utilisées si installées ; sinon les titres sont
 * rendus en pixels (texte dessiné petit puis agrandi ×4 sans lissage) et le texte passe en monospace système.
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
DS.policeTexte = policeInstallee(['JetBrains Mono', 'IBM Plex Mono', 'Menlo', 'Consolas', 'Courier New'], 'serif');
DS.policeTitreInstallee = policeInstallee(['Bitsy Pixels', '__aucune__'], 'serif') === 'Bitsy Pixels';

// ——— Titres en pixels ———
const cacheTitres = new Map();
/** Titre au style pixel : `taille` = hauteur visuelle en px ; align 'left' | 'center' | 'right' */
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
		const petit = Math.max(6, Math.round(taille / 4));
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
	const l = c.width * 4;
	const dx = align === 'center' ? x - l / 2 : align === 'right' ? x - l : x;
	drawingContext.imageSmoothingEnabled = false;
	drawingContext.drawImage(c, dx, y, l, c.height * 4);
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
	textSize(Math.min(24, h * 0.38));
	fill(desactive ? DS.blanc50 : v.texte);
	textAlign(CENTER, CENTER);
	text(label + '  ›', x + l / 2, y + h / 2);
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
	fill(type === 'alerte' || type === 'succes' ? DS.fond : DS.blanc);
	textAlign(CENTER, CENTER);
	text(txt, x, y);
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
	if (titre) {
		fill(couleurBarre || DS.blanc05);
		rect(x + 2, y + 2, l - 4, 56);
		stroke(DS.blanc15);
		line(x + 2, y + 58, x + l - 2, y + 58);
		noStroke();
		dsTitre(titre, x + 24, y + 12, 32, DS.blanc, 'left');
	}
}
