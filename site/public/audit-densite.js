/* Nantes en régulation — prompt 101 : mesure de la DENSITÉ des vues du PC (outil de développement).
 * Chargé UNIQUEMENT avec ?audit=densite (chargeur en fin d'installation.js, après audit-parcours.js) ; sans ce
 * paramètre, ce fichier n'est jamais téléchargé et le jeu est inchangé.
 *
 * Pendant chaque image, les primitives (text, rect, image) et les composants du design system (dsTexte, dsTitre,
 * dsBouton, dsBadge) sont comptés dans la ZONE de dessin en cours : vue d'appli (dessinerVueApp), Indicateurs (dessinerIndicateurs), Signalements (dessinerJeu).
 * Pour chaque vue : éléments visibles (textes, titres, boutons, badges, blocs colorés, images), boutons primaires
 * (variante pleine rouge), tailles de texte distinctes, surface rouge (#D4031C / #D10B00, % de la zone) et cadres
 * imbriqués (profondeur maximale de rectangles bordés). Les primitives dessinées à l'intérieur d'un composant
 * (le texte d'un bouton, le fond d'un badge) ne comptent que pour le composant ; la surface rouge les inclut.
 *
 * ?audit=densite&parcours=1 enchaîne les vues (1920×1080, FR) en partie vide (jour 1) et en milieu de semaine,
 * puis window.AUDIT_DENSITE.rapport() rend le JSON (jeu/101-densite-avant.json / -apres.json).
 */
(() => {
	if (typeof window === 'undefined' || typeof p5 === 'undefined') return;
	const params = new URLSearchParams(location.search);
	if (params.get('audit') !== 'densite') return;
	const { attendreImages, H: P } = window.AUDIT_PARCOURS; // P : aides du parcours (H reste la hauteur du PC)

	const A = { pile: [], composant: 0, image: {}, vues: {}, etape: null, enregistre: false, erreurs: [] };
	const ROUGES = ['#d4031c', '#d10b00', typeof DS !== 'undefined' ? String(DS.primaire).toLowerCase() : '#d4031c']; // prompt 115 : couleur principale active
	const SOMBRES = ['#0d0c0c', '#171616', '#0c1016', '#050607'];

	// ——— Zones : enveloppe des fonctions de dessin des vues ———
	const nomAppli = () => {
		const f = PC.fenetre;
		if (f === 'community') return 'Community · ' + COMMU.onglet;
		if (f === 'journal') return JOURNAL.enquete !== null && JOURNAL.enquete !== undefined ? 'Journal · fiche enquête' : 'Journal · jour';
		return { patron: 'Patron' }[f] || 'appli ' + f;
	};
	function zone(nomFn, nom, aire) {
		const orig = window[nomFn];
		if (typeof orig !== 'function') return;
		window[nomFn] = function () {
			const n = typeof nom === 'function' ? nom() : nom;
			if (!n) return orig.apply(this, arguments);
			const base = drawingContext.getTransform();
			const z = { nom: n, inv: base.inverse(), aire: aire(), s: { textes: 0, titres: 0, boutons: 0, primaires: 0, badges: 0, blocs: 0, images: 0, tailles: new Set(), rouge: 0, cadres: [] } };
			A.pile.push(z);
			try {
				return orig.apply(this, arguments);
			} finally {
				A.pile.pop();
				finirZone(z);
			}
		};
	}
	zone('dessinerVueApp', nomAppli, () => ZONE_VUE.l * ZONE_VUE.h); // prompt 183 : plus de bureau ni de fenêtre posée dessus — vues de l'appli
	zone('dessinerIndicateurs', () => (PC.flottant && PC.etat !== 'eteint' && PC.etat !== 'demarrage' ? 'Indicateurs' : null), () => INDIC.l * INDIC.h);
	zone('dessinerJeu', () => (PC.etat === 'appli' ? 'Signalements' : null), () => L * H);
	const zc = () => A.pile[A.pile.length - 1];

	// Rectangle logique → coordonnées de la zone (transformation courante relative à l'entrée dans la zone)
	function rel(z, x, y, l, h) {
		const m = z.inv.multiply(drawingContext.getTransform());
		const p = (a, b) => [m.a * a + m.c * b + m.e, m.b * a + m.d * b + m.f];
		const [x1, y1] = p(x, y);
		const [x2, y2] = p(x + l, y + h);
		return { x: Math.min(x1, x2), y: Math.min(y1, y2), l: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
	}
	// Zones défilantes : les applis masquent leur liste par ctx.rect() + clip() ; on suit ce masque (pixels de l'écran)
	// pour ne compter que ce qui est réellement VISIBLE (ce qui défile hors de la zone est dessiné mais masqué)
	const ecran = (x, y, l, h) => {
		const m = drawingContext.getTransform();
		const p = (a, b) => [m.a * a + m.c * b + m.e, m.b * a + m.d * b + m.f];
		const [x1, y1] = p(x, y);
		const [x2, y2] = p(x + l, y + h);
		return { x: Math.min(x1, x2), y: Math.min(y1, y2), l: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
	};
	const inter = (a, b) => {
		const x = Math.max(a.x, b.x);
		const y = Math.max(a.y, b.y);
		return { x, y, l: Math.max(0, Math.min(a.x + a.l, b.x + b.l) - x), h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y) };
	};
	const M = { clips: [null], chemin: null };
	const C2D = typeof CanvasRenderingContext2D !== 'undefined' ? CanvasRenderingContext2D.prototype : {}; // absent hors navigateur (tests)
	const principal = (ctx) => typeof drawingContext !== 'undefined' && ctx === drawingContext;
	[
		['save', function () { M.clips.push(M.clips[M.clips.length - 1]); }],
		['restore', function () { if (M.clips.length > 1) M.clips.pop(); }],
		['beginPath', function () { M.chemin = null; }],
		['rect', function (x, y, l, h) { M.chemin = ecran(x, y, l, h); }],
		['clip', function () { const c = M.clips[M.clips.length - 1]; if (M.chemin) M.clips[M.clips.length - 1] = c ? inter(c, M.chemin) : M.chemin; }],
	].forEach(([nom, suivi]) => {
		const o = C2D[nom];
		if (!o) return;
		C2D[nom] = function () {
			if (principal(this)) suivi.apply(this, arguments);
			return o.apply(this, arguments);
		};
	});
	function visible(x, y, l, h) {
		const c = M.clips[M.clips.length - 1];
		if (!c) return true;
		const b = inter(c, ecran(x, y, l, h));
		return b.l > 1 && b.h > 1;
	}
	// Boîte large (alignement gauche, centre ou droite ignoré) : un texte n'est « masqué » que s'il sort franchement
	function visibleTexte(inst, str, x, y, t) {
		const w = Math.max(8, Math.min(1200, inst.textWidth(String(str))));
		return visible(x - w, y - t, 2 * w, 2 * t);
	}
	const couleur = () => String(drawingContext.fillStyle).toLowerCase();
	function alphaDe(c) {
		const m = /rgba?\(([^)]+)\)/.exec(c);
		return m ? Number((m[1].split(',')[3] || '1').trim()) : 1;
	}

	// ——— Composants du design system (comptés une fois, leurs primitives internes ignorées) ———
	function composant(nomFn, compter) {
		const orig = window[nomFn];
		if (typeof orig !== 'function') return;
		window[nomFn] = function () {
			const z = zc();
			if (z && !A.composant) compter(z.s, arguments);
			A.composant++;
			try {
				return orig.apply(this, arguments);
			} finally {
				A.composant--;
			}
		};
	}
	composant('dsTitre', (s, a) => visible(a[1], a[2], 200, a[3]) && (s.titres++, s.tailles.add(Math.round(a[3]))));
	composant('dsBouton', (s, a) => visible(a[0], a[1], a[2], a[3]) && (s.boutons++, (a[6] || 'primaire') === 'primaire' && !a[7] && s.primaires++));
	composant('dsBadge', (s, a) => visible(a[0] - 14, a[1] - 14, 28, 28) && s.badges++);
	// dsTexte appelle text() : il est compté par l'enveloppe de text() ci-dessous

	// ——— Primitives p5 (avant l'initialisation : le mode global lie p5.prototype) ———
	const oText = p5.prototype.text;
	p5.prototype.text = function (str, x, y) {
		const z = zc();
		const t = this._renderer && this._renderer._textSize;
		if (z && !A.composant && this._renderer === window._renderer && String(str).trim() && visibleTexte(this, str, x, y, t)) z.s.textes++, z.s.tailles.add(Math.round(t));
		return oText.apply(this, arguments);
	};
	const oRect = p5.prototype.rect;
	p5.prototype.rect = function (x, y, l, h) {
		const z = zc();
		const r = this._renderer;
		if (z && r === window._renderer && l && h && visible(x, y, l, h)) {
			const b = rel(z, x, y, l, h);
			if (r._doFill) {
				const c = couleur();
				if (ROUGES.includes(c)) z.s.rouge += b.l * b.h;
				if (!A.composant && b.l * b.h >= 400 && !SOMBRES.includes(c) && alphaDe(c) >= 0.04) z.s.blocs++;
			}
			if (r._doStroke && !A.composant && b.l >= 24 && b.h >= 24) z.s.cadres.push(b);
		}
		return oRect.apply(this, arguments);
	};
	const oImage = p5.prototype.image;
	p5.prototype.image = function (img, x, y, l, h) {
		const z = zc();
		if (z && !A.composant && this._renderer === window._renderer && visible(x, y, l || (img && img.width) || 1, h || (img && img.height) || 1)) z.s.images++;
		return oImage.apply(this, arguments);
	};

	// Profondeur maximale de cadres imbriqués (rectangle bordé entièrement contenu dans un autre)
	function profondeur(cadres) {
		const c = cadres.slice(0, 300).sort((a, b) => b.l * b.h - a.l * a.h);
		const dedans = (p, q) => p.x >= q.x - 1 && p.y >= q.y - 1 && p.x + p.l <= q.x + q.l + 1 && p.y + p.h <= q.y + q.h + 1 && p.l * p.h < q.l * q.h - 4;
		const prof = c.map(() => 1);
		for (let i = 0; i < c.length; i++) for (let j = 0; j < i; j++) if (dedans(c[i], c[j])) prof[i] = Math.max(prof[i], prof[j] + 1);
		return prof.length ? Math.max(...prof) : 0;
	}
	function finirZone(z) {
		const s = z.s;
		A.image[z.nom] = {
			elements: s.textes + s.titres + s.boutons + s.badges + s.blocs + s.images,
			textes: s.textes,
			titres: s.titres,
			boutons: s.boutons,
			primaires: s.primaires,
			badges: s.badges,
			blocs: s.blocs,
			images: s.images,
			taillesTexte: [...s.tailles].filter((t) => t !== 'bouton').length, // niveaux de TEXTE (règle 4) : libellés de boutons exclus
			rougePct: Math.round((1000 * s.rouge) / z.aire) / 10,
			cadresImbriques: profondeur(s.cadres),
		};
	}
	p5.prototype.registerMethod('pre', () => (A.image = {}));
	p5.prototype.registerMethod('post', () => {
		if (!A.enregistre || !A.etape) return;
		Object.entries(A.image).forEach(([vue, m]) => {
			const cle = vue + ' — ' + A.etape.etat;
			if (!A.etape.vues.includes(vue)) return; // seule la vue visée par l'étape compte
			A.vues[cle] = m;
		});
	});

	// ——— Parcours : chaque vue, en partie vide (jour 1) et en milieu de semaine ———
	function milieuSemaine() {
		let tours = 0;
		while (Jeu.jourIndex < 2 && tours++ < 400) {
			const d = Jeu.prochainDuJour();
			if (d) {
				if (Jeu.conflit && Jeu.conflit()) Jeu.choisirPriorite('a');
				Jeu.decider(Jeu.actionsPossibles(d)[0], d.contradiction ? d.contradiction.bonne : undefined);
			} else {
				Jeu.finDeJourneeTactique();
				if (!Jeu.jours[Jeu.jourIndex + 1]) break;
				Jeu.journeeSuivante();
				const i = Jeu.preparerInspection(); // inspection surprise répondue (sinon sa fenêtre couvre les vues)
				if (i) Jeu.repondreInspection(i.bonne);
			}
		}
		for (let k = 0; k < 2; k++) {
			const d = Jeu.prochainDuJour();
			if (d) Jeu.decider(Jeu.actionsPossibles(d)[0], d.contradiction ? d.contradiction.bonne : undefined);
		}
	}
	function etapes() {
		const E = [];
		// lancerNouvellePartie() charge la semaine de façon asynchrone : on avance la partie à l'étape suivante
		[
			['vide', null],
			['milieu de semaine', milieuSemaine],
		].forEach(([etat, avancer]) => {
			const add = (vues, prep, n) => E.push({ etat, vues: [].concat(vues), prep, n: n || 10 });
			const os = (f) => (P.raz(), P.poste(), (PC.etat = 'os'), (PC.fenetre = f || null));
			add([], () => (P.partie(0), (PC.flottant = false)), 40);
			if (avancer) add([], avancer, 10);
			add('Patron', () => os('patron'));
			ONGLETS_COMMU.forEach((o) => add('Community · ' + o, () => (os('community'), (COMMU.onglet = o), (COMMU.ouvert = null))));
			add('Journal · jour', () => (os('journal'), (JOURNAL.enquete = null)));
			add('Journal · fiche enquête', () => {
				os('journal');
				JOURNAL.jour = Jeu.jourIndex;
				const j = (Jeu.jours || [])[Jeu.jourIndex];
				const e = j && (Jeu.evenementsJournee || []).find((x) => x.jour === j.date && x.resultat && x.resultat.dossier);
				if (e) ouvrirEnqueteJournal(e);
			});
			add('Indicateurs', () => (P.raz(), P.poste(), (PC.flottant = true)));
			add('Signalements', () => ((PC.flottant = false), P.raz(), P.poste()));
		});
		return E;
	}
	async function parcours() {
		const E = etapes();
		for (const e of E) {
			A.etape = e;
			A.enregistre = false;
			try {
				e.prep();
			} catch (err) {
				A.erreurs.push({ etape: e.etat + ' · ' + e.vues.join(), erreur: String(err && err.message) });
			}
			await attendreImages(Math.max(1, e.n - 3));
			A.enregistre = true;
			await attendreImages(3);
			A.enregistre = false;
		}
		A.etape = null;
		window.AUDIT_DENSITE.fini = true;
		console.info('[audit-densite] ' + Object.keys(A.vues).length + ' vues mesurées');
		A.etatPartie = { jour: Jeu.jourIndex, decisions: Jeu.index, plaintes: (Jeu.plaintes || []).length, messagesPatron: (Jeu.messagesPatron || []).length };
		console.table(A.vues);
	}
	function rapport() {
		return { date: new Date().toISOString(), taille: window.innerWidth + '×' + window.innerHeight, langue: typeof Langue !== 'undefined' ? Langue.actuelle : 'fr', vues: A.vues, partieFinale: A.etatPartie, erreurs: A.erreurs };
	}
	window.AUDIT_DENSITE = { rapport, parcours, etapes, fini: false, mesureImage: () => A.image };
	if (params.get('parcours') === '1') window.addEventListener('load', () => setTimeout(parcours, 1500));
})();
