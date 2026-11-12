/* Nantes en régulation — prompt 115 : couleur principale du design system au choix, parmi des palettes prédéfinies.
 * Seule la couleur PRINCIPALE change (boutons primaires, entrée active du menu, badges, marqueurs ouverts…) ; les
 * couleurs fonctionnelles (erreur #D10B00, succès, alerte, info), le fond et les blancs gardent leur sens.
 * Chaque primaire porte du texte blanc à 4,5:1 au moins (rouge 5,48 · bleu 5,69 · vert 5,21 · violet 6,07 ·
 * orange 5,40 · turquoise 5,36) et reste au-dessus de 3:1 sur le fond #0D0C0C.
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
		if (typeof DS !== 'undefined') DS.primaire = p.hex;
		if (typeof C !== 'undefined' && C) C.primaire = p.hex;
		if (typeof MENU_C !== 'undefined' && MENU_C) MENU_C.bleu = p.hex; // nom de clé historique : la couleur primaire du menu
		if (typeof cacheTitres !== 'undefined' && cacheTitres.clear) cacheTitres.clear(); // titres pixel mis en cache avec leur couleur
		try {
			document.documentElement.style.setProperty('--primaire', p.hex);
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
			stroke('#FFFFFF');
			strokeWeight(3);
			rect(x - 5, y - 5, s + 10, s + 10);
			stroke('#0D0C0C');
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
