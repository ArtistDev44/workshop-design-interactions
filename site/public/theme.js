/* Nantes en régulation — prompt 115 : couleur principale du design system au choix, parmi des palettes prédéfinies.
 * Seule la couleur PRINCIPALE change (boutons primaires, entrée active du menu, badges, marqueurs ouverts…) ; les
 * couleurs fonctionnelles (erreur #D10B00, succès, alerte, info), le fond et les blancs gardent leur sens.
 * Prompt 176 : UNE source pour tout ce qui signifie « sélectionné / actif / focus / lien / bouton principal » —
 * DS.primaire (aplat), DS.surPrimaire (texte posé sur l'aplat), DS.primaireTrait (trait, liseré, focus sur fond sombre),
 * DS.primaireTexte (texte / lien sur fond sombre) et primaireRGBA(a) (surbrillance translucide). C.* et MENU_C.bleu
 * relisent DS. Les dérivées sont CALCULÉES par accentDerive() : texte blanc ou sombre selon le meilleur contraste
 * (≥ 4,5:1), accent éclairci tant qu'il n'atteint pas 3:1 (trait) ou 4,5:1 (texte) sur le fond le plus clair des
 * surfaces sombres (panneau #171616). Vérifié pour chaque palette dans scripts/test-jeu.mjs.
 * Choix mémorisé en local (pxe-nte001-couleur) ; ?couleur=bleu pour tester sans rien écrire.
 */
const PALETTES_COULEUR = [
	{ id: 'rouge', hex: '#D4031C' }, // Pixel Design System (défaut)
	{ id: 'bleu', hex: '#2F5BE0' },
	{ id: 'vert', hex: '#0A7D45' },
	{ id: 'violet', hex: '#7A3FD1' },
	{ id: 'orange', hex: '#B54800' },
	{ id: 'turquoise', hex: '#00777A' },
];
const CLE_COULEUR = 'pxe-nte001-couleur';
const ACCENT_CLAIR = '#FFFFFF';
const ACCENT_SOMBRE = '#0D0C0C'; // fond du DS : texte sombre sur un accent clair
const ACCENT_SURFACE = '#171616'; // panneau (fond + blanc 5 %) : la surface sombre la plus claire où l'accent sert de trait
/** Luminance relative WCAG d'une couleur #RRGGBB */
function luminanceHex(hex) {
	const h = String(hex).replace('#', '');
	const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
	return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
/** Rapport de contraste WCAG entre deux couleurs #RRGGBB (1 à 21) */
function rapportContraste(a, b) {
	const la = luminanceHex(a);
	const lb = luminanceHex(b);
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
/** Éclaircit `hex` vers le blanc, par pas de 4 %, jusqu'à atteindre `seuil` sur `fond` (inchangé s'il y est déjà) */
function eclaircirJusqua(hex, fond, seuil) {
	const h = String(hex).replace('#', '');
	const rvb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
	for (let k = 0; k <= 25; k++) {
		const c = '#' + rvb.map((v) => Math.round(v + ((255 - v) * k) / 25).toString(16).padStart(2, '0')).join('').toUpperCase();
		if (rapportContraste(c, fond) >= seuil) return c;
	}
	return ACCENT_CLAIR;
}
/** Prompt 176 — fonction unique des usages d'un accent : { fond, texte, trait, texteSurFond }.
 * texte : blanc ou sombre, le plus contrasté sur l'aplat ; trait : accent à 3:1 au moins sur le fond sombre ;
 * texteSurFond : accent à 4,5:1 au moins sur le fond sombre (liens, libellés actifs). */
function accentDerive(hex, surface) {
	const s = surface || ACCENT_SURFACE;
	return {
		fond: hex,
		texte: rapportContraste(ACCENT_CLAIR, hex) >= rapportContraste(ACCENT_SOMBRE, hex) ? ACCENT_CLAIR : ACCENT_SOMBRE,
		trait: eclaircirJusqua(hex, s, 3),
		texteSurFond: eclaircirJusqua(hex, s, 4.5),
	};
}
const Theme = {
	id: 'rouge',
	test: false,
	palette() {
		return PALETTES_COULEUR.find((p) => p.id === this.id) || PALETTES_COULEUR[0];
	},
	/** Applique une palette partout où la couleur principale est lue (DS, C du jeu, menu, CSS) */
	appliquer(id, sansMemoire) {
		const p = PALETTES_COULEUR.find((x) => x.id === id) || PALETTES_COULEUR[0];
		this.id = p.id;
		const d = accentDerive(p.hex);
		// Prompt 176 : DS est la seule source ; C.primaire* (sketch.js) et MENU_C.bleu (menu.js) sont des accesseurs qui la relisent
		if (typeof DS !== 'undefined') ((DS.primaire = d.fond), (DS.surPrimaire = d.texte), (DS.primaireTrait = d.trait), (DS.primaireTexte = d.texteSurFond));
		if (typeof cacheTitres !== 'undefined' && cacheTitres.clear) cacheTitres.clear(); // titres pixel mis en cache avec leur couleur
		try {
			document.documentElement.style.setProperty('--primaire', p.hex);
			document.documentElement.style.setProperty('--sur-primaire', d.texte);
		} catch (e) {}
		if (!sansMemoire && !this.test) {
			try {
				localStorage.setItem(CLE_COULEUR, p.id);
			} catch (e) {}
		}
		return p;
	},
	/** Palette suivante (ou précédente) — annoncée */
	suivante(sens) {
		const i = PALETTES_COULEUR.findIndex((x) => x.id === this.id);
		const p = this.appliquer(PALETTES_COULEUR[(i + (sens || 1) + PALETTES_COULEUR.length) % PALETTES_COULEUR.length].id);
		if (typeof annoncer === 'function') annoncer(t('couleur.annonce', { couleur: t('couleur.' + p.id) }));
		return p;
	},
	init() {
		let id = null;
		try {
			const q = new URLSearchParams(location.search).get('couleur');
			if (q && PALETTES_COULEUR.some((p) => p.id === q)) (id = q), (this.test = true);
		} catch (e) {}
		if (!id) {
			try {
				id = localStorage.getItem(CLE_COULEUR);
			} catch (e) {}
		}
		this.appliquer(id || 'rouge', true);
	},
};
/** Couleur principale translucide (fonds, surbrillances) : rgba de la palette active */
function primaireRGBA(a) {
	const h = Theme.palette().hex.replace('#', '');
	return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16) + ',' + a + ')';
}
/** Rangée de pastilles (paramètres) : une par palette, la choisie avec la double bordure de focus */
function selecteurCouleur(xDroite, y, taille) {
	const s = taille || 52;
	PALETTES_COULEUR.forEach((p, i) => {
		const x = xDroite - (PALETTES_COULEUR.length - i) * (s + 10);
		const actif = p.id === Theme.id;
		noStroke();
		fill(p.hex);
		rect(x, y, s, s);
		if (actif) {
			noFill();
			stroke(DS.blanc);
			strokeWeight(3);
			rect(x - 5, y - 5, s + 10, s + 10);
			stroke(DS.fond);
			strokeWeight(2);
			rect(x - 1, y - 1, s + 2, s + 2);
			noStroke();
		}
		boutons.push({
			x,
			y,
			l: s,
			h: s,
			action: () => {
				Theme.appliquer(p.id);
				annoncer(t('couleur.annonce', { couleur: t('couleur.' + p.id) }));
			},
		});
	});
}
