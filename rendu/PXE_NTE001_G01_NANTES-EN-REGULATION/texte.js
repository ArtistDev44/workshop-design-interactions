/* Nantes en régulation — prompt 92 : un composant de texte fiable, partagé (enquête, Historique, Équipes, Journal).
 * - couperLignes : vrai retour à la ligne mot par mot, mesuré (textWidth), mots trop longs coupés proprement
 *   (après « / », « - », « . » d'une URL ou de « C1/C2 », sinon avec un trait d'union), retours à la ligne de la
 *   source respectés ; résultat en cache par (texte, largeur, police, taille, langue).
 * - dessinerTexte : dessine les lignes, maxLignes avec ellipse « … » EN FIN DE MOT, mise en relief de segments ;
 *   renvoie { h, tronque, lignes }.
 * - nettoyerTexteSource : nettoyage typographique à l'affichage seulement (entités, balises, espaces, ponctuation
 *   doublée ; espaces insécables FR, apostrophe, nombres et unités ; EN : “ ”). Les MOTS restent identiques,
 *   dans le même ordre : aucune autre correction (testé par test-jeu.mjs).
 * La logique est pure (TexteUI, chargée par les tests avec un mesureur factice) ; le dessin utilise p5.
 */
const TexteUI = (() => {
	const FINE = ' '; // espace fine insécable (; : ! ? « »)
	const INSEC = ' '; // espace insécable (unités, milliers)
	const cache = new Map();
	const MAX_CACHE = 800;
	let mesureur = null; // tests : (chaine, police, taille) => largeur
	const langueActive = () => (typeof Langue !== 'undefined' && Langue.actuelle) || 'fr';
	function mesurer(s, police, taille) {
		if (mesureur) return mesureur(s, police, taille);
		textFont(police);
		textSize(taille);
		return textWidth(s);
	}
	/** Coupe un mot plus long que la largeur : d'abord après / - . _ ? & = (URL, « C1/C2 »), sinon caractère par caractère avec « - » */
	function couperMot(mot, largeur, police, taille) {
		const morceaux = [];
		let reste = mot;
		while (reste && mesurer(reste, police, taille) > largeur) {
			let n = reste.length - 1;
			while (n > 1 && mesurer(reste.slice(0, n), police, taille) > largeur) n--;
			// Coupure naturelle la plus à droite dans ce qui tient
			const naturel = Math.max(...['/', '-', '.', '_', '?', '&', '='].map((c) => reste.lastIndexOf(c, n - 1)));
			if (naturel >= Math.floor(n / 3)) {
				morceaux.push(reste.slice(0, naturel + 1));
				reste = reste.slice(naturel + 1);
				continue;
			}
			// Trait d'union : la coupure + « - » doit tenir
			let k = Math.max(1, n - 1);
			while (k > 1 && mesurer(reste.slice(0, k) + '-', police, taille) > largeur) k--;
			morceaux.push(reste.slice(0, k) + '-');
			reste = reste.slice(k);
		}
		if (reste) morceaux.push(reste);
		return morceaux;
	}
	/** Lignes réelles d'un texte dans une largeur donnée (cache) */
	function couperLignes(texte, largeur, police, taille) {
		const s = String(texte === null || texte === undefined ? '' : texte);
		largeur = Math.max(8, Math.floor(largeur));
		const cle = [s, largeur, police, taille, langueActive(), mesureur ? 'm' : 'p'].join('\u0001');
		if (cache.has(cle)) return cache.get(cle);
		const lignes = [];
		s.split(/\r?\n/).forEach((para) => {
			const mots = para.split(/ +/).filter((m) => m !== '');
			if (!mots.length) return lignes.push('');
			let cour = '';
			mots.forEach((mot) => {
				const essai = cour ? cour + ' ' + mot : mot;
				if (mesurer(essai, police, taille) <= largeur) return (cour = essai);
				if (cour) lignes.push(cour);
				cour = '';
				if (mesurer(mot, police, taille) <= largeur) return (cour = mot);
				const m = couperMot(mot, largeur, police, taille);
				m.slice(0, -1).forEach((x) => lignes.push(x));
				cour = m[m.length - 1] || '';
			});
			lignes.push(cour);
		});
		if (cache.size > MAX_CACHE) cache.clear();
		cache.set(cle, lignes);
		return lignes;
	}
	/** Garde maxLignes lignes ; la dernière se termine par « … » après un mot entier (jamais au milieu d'un mot) */
	function tronquer(lignes, maxLignes, largeur, police, taille) {
		if (!maxLignes || lignes.length <= maxLignes) return { lignes, tronque: false };
		const garde = lignes.slice(0, maxLignes);
		let der = garde[maxLignes - 1];
		while (der && mesurer(der + ' …', police, taille) > largeur) {
			const i = der.lastIndexOf(' ');
			if (i <= 0) {
				// un seul mot trop long pour l'ellipse : on retire des caractères (cas limite, largeur minuscule)
				der = der.slice(0, -1);
				continue;
			}
			der = der.slice(0, i);
		}
		der = der.replace(/[\s,;:.\-–—]+$/, '');
		garde[maxLignes - 1] = der ? der + ' …' : '…';
		return { lignes: garde, tronque: true };
	}
	const interligne = (taille, o) => Math.round(o && o.interligne ? (o.interligne < 4 ? taille * o.interligne : o.interligne) : taille * 1.4);
	/** Hauteur exacte d'un bloc (mêmes options que dessinerTexte) */
	function hauteurTexte(texte, largeur, o) {
		o = o || {};
		const taille = o.taille || 22;
		const police = o.police || (typeof POLICE_TEXTE !== 'undefined' ? POLICE_TEXTE : 'monospace');
		const r = tronquer(couperLignes(texte, largeur, police, taille), o.maxLignes, largeur, police, taille);
		return { h: r.lignes.length * interligne(taille, o), tronque: r.tronque, lignes: r.lignes, n: r.lignes.length };
	}

	// ——— § 2 : nettoyage typographique ———
	const ENTITES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: INSEC, laquo: '«', raquo: '»', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', hellip: '…', ndash: '–', mdash: '—', eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç' };
	function decoderEntites(s) {
		return s
			.replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
			.replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)))
			.replace(/&([a-z]+);/gi, (m, n) => (ENTITES[n.toLowerCase()] !== undefined ? ENTITES[n.toLowerCase()] : m));
	}
	function nettoyerTexteSource(texte, langue) {
		let s = String(texte === null || texte === undefined ? '' : texte);
		s = decoderEntites(s);
		s = s.replace(/<[^>]*>/g, ' ');
		s = s.replace(/[ \t  ]+/g, ' ');
		s = s
			.split('\n')
			.map((l) => l.trim())
			.join('\n')
			.trim();
		s = s.replace(/\.{3,}/g, '…');
		s = s.replace(/([,;:!?])(\s*\1)+/g, '$1').replace(/(^|[^.])\.\.(?!\.)/g, '$1.');
		if ((langue || langueActive()) === 'en') {
			s = s.replace(/ +([;:!?,.])(?=\s|$)/g, '$1');
			s = s.replace(/«\s*/g, '“').replace(/\s*»/g, '”');
			return s;
		}
		// Français
		s = s.replace(/([\p{L}])'(?=[\p{L}])/gu, '$1’');
		s = s.replace(/(\d)\.(\d+)(?![.\d])/g, (m, a, b, i, tout) => (/\d\.\d*$/.test(tout.slice(0, i)) ? m : a + ',' + b)); // 50.4 → 50,4 (pas 1.2.3)
		s = s.replace(/(^|[^\d.,/:-])(\d{5,})(?![\d.,])/g, (m, avant, n) => avant + n.replace(/\B(?=(\d{3})+(?!\d))/g, INSEC)); // 12345 → 12 345 (années intactes)
		s = s.replace(/(\d) ?(min|mm|km\/h|km|°C|%)(?![\p{L}\d])/gu, '$1' + INSEC + '$2');
		s = s.replace(/ ?([;!?])(?=\s|$)/g, FINE + '$1');
		s = s.replace(/([\p{L}\d)]) ?:(?=\s|$)/gu, '$1' + FINE + ':');
		s = s.replace(/«\s*/g, '«' + FINE).replace(/\s*»/g, FINE + '»');
		return s;
	}
	/** Mots d'un texte (lettres et chiffres), pour vérifier que le nettoyage ne change ni les mots ni leur ordre */
	const mots = (s) => String(s).match(/[\p{L}\p{N}]+/gu) || [];
	/** Agenda : « Titre — Lieu, Ville » → { titre, lieu } ; format différent → texte entier en titre */
	function decouperAgenda(s) {
		const x = String(s || '');
		const i = x.lastIndexOf(' — ');
		if (i <= 0 || i >= x.length - 3) return { titre: x, lieu: null };
		return { titre: x.slice(0, i).trim(), lieu: x.slice(i + 3).trim() };
	}
	/** Segments à mettre en relief (nombres, numéros de ligne, dates) : [{ txt, relief }] — le texte est inchangé */
	function segments(ligne, motif) {
		if (!motif) return [{ txt: ligne, relief: false }];
		const re = new RegExp(motif.source, motif.flags.includes('g') ? motif.flags : motif.flags + 'g');
		const out = [];
		let dernier = 0;
		let m;
		while ((m = re.exec(ligne))) {
			if (!m[0]) {
				re.lastIndex++;
				continue;
			}
			if (m.index > dernier) out.push({ txt: ligne.slice(dernier, m.index), relief: false });
			out.push({ txt: m[0], relief: true });
			dernier = m.index + m[0].length;
		}
		if (dernier < ligne.length) out.push({ txt: ligne.slice(dernier), relief: false });
		return out;
	}
	return {
		couperLignes,
		tronquer,
		hauteurTexte,
		interligne,
		nettoyerTexteSource,
		decouperAgenda,
		segments,
		mots,
		mesurer,
		viderCache: () => cache.clear(),
		tailleCache: () => cache.size,
		set mesureur(f) {
			mesureur = f;
			cache.clear();
		},
	};
})();
if (typeof window !== 'undefined') window.TexteUI = TexteUI;

// ——— Fonctions globales (p5) ———
function couperLignes(texte, largeur, police, taille) {
	return TexteUI.couperLignes(texte, largeur, police, taille);
}
function hauteurTexte(texte, largeur, o) {
	return TexteUI.hauteurTexte(texte, largeur, o).h;
}
function nettoyerTexteSource(texte, langue) {
	return TexteUI.nettoyerTexteSource(texte, langue);
}
/**
 * Dessine un bloc de texte. o : { police, taille, interligne (facteur ou px), couleur, maxLignes, align ('left' |
 * 'center' | 'right'), style (NORMAL | ITALIC | BOLD), relief (RegExp), couleurRelief }.
 * Renvoie { h, tronque, lignes }.
 */
function dessinerTexte(texte, x, y, largeur, o) {
	o = o || {};
	const taille = o.taille || 22;
	const police = o.police || POLICE_TEXTE;
	const r = TexteUI.hauteurTexte(texte, largeur, o);
	const pas = TexteUI.interligne(taille, o);
	noStroke();
	textFont(police);
	textSize(taille);
	textStyle(o.style || NORMAL);
	textAlign(o.align === 'center' ? CENTER : o.align === 'right' ? RIGHT : LEFT, TOP);
	const ax = o.align === 'center' ? x + largeur / 2 : o.align === 'right' ? x + largeur : x;
	const decal = Math.round((pas - taille) / 2);
	r.lignes.forEach((ligne, i) => {
		const yy = y + i * pas + decal;
		if (!o.relief || o.align === 'center' || o.align === 'right') {
			fill(o.couleur || C.texte);
			return text(ligne, ax, yy);
		}
		let xx = x;
		TexteUI.segments(ligne, o.relief).forEach((sg) => {
			textStyle(sg.relief ? BOLD : o.style || NORMAL);
			fill(sg.relief ? o.couleurRelief || o.couleur || C.texte : o.couleur || C.texte);
			text(sg.txt, xx, yy);
			xx += textWidth(sg.txt);
		});
	});
	textStyle(NORMAL);
	textAlign(LEFT, TOP);
	return { h: r.h, tronque: r.tronque, lignes: r.lignes };
}
