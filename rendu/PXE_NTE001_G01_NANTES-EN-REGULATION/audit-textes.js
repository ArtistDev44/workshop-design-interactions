/* Nantes en régulation — prompt 93 : détecteur de textes hors de leur cadre (outil de DÉVELOPPEMENT).
 * Chargé UNIQUEMENT avec ?audit=textes (chargeur en fin d'installation.js) ; sans ce paramètre, ce fichier n'est
 * jamais demandé et zoneTexteDebut / zoneTexteFin / zoneTexteDeclarer restent des fonctions vides (sketch.js).
 *
 * Principe :
 * - les conteneurs déclarent leur cadre : bouton(), dsBouton(), dsBadge() encadrent leur libellé
 *   (zoneTexteDebut / zoneTexteFin) ; panneau(), dsPanneau() et les cartes le déclarent pour l'image en cours
 *   (zoneTexteDeclarer) ; une zone « clip » (défilement) n'est jamais signalée : ce qui en sort est masqué exprès ;
 * - text() est enveloppé (p5.prototype, comme i18n.js) : boîte réelle (textWidth, textAscent / textDescent,
 *   interligne, textAlign horizontal et vertical, coupure des textes en boîte recalculée comme p5), convertie en
 *   pixels de l'écran par la transformation en cours (drawingContext.getTransform) ;
 * - zone de référence : la zone encadrante active, sinon la zone déclarée LA PLUS RÉCENTE contenant le point
 *   d'ancrage du texte (la plus au premier plan), sinon le canevas (l'écran du PC pendant le dessin du PC) ;
 * - défaut si la boîte sort de la zone de plus de 1 px, ou si un texte en boîte est coupé par p5 (hauteur
 *   nécessaire > h) ; catégories A (bouton, pastille), B (multi-ligne coupé), C (carte, panneau), D (écran / canevas),
 *   E (deux textes qui se chevauchent dans une même zone), T (prompt 205 : mobile portrait, texte rendu sous 12 px CSS).
 * Restitution : contours rouges (texte) et orange (zone), fixes ; panneau de rapport repliable ;
 * window.AUDIT_TEXTES.rapport() ; ?audit=textes&parcours=1 enchaîne tous les écrans (FR / EN, contraste renforcé
 * ou non) puis propose le rapport agrégé en téléchargement (audit-textes-AAAA-MM-JJ.json) et le résume en console.
 * La taille d'écran est celle de la fenêtre : relancer le parcours à 1920×1080, 1366×768 et en mobile portrait.
 */
(() => {
	if (typeof window === 'undefined' || typeof p5 === 'undefined') return;
	const params = new URLSearchParams(location.search);
	if (params.get('audit') !== 'textes') return;

	const A = {
		defauts: new Map(), // empreinte → défaut (dédupliqué par écran)
		image: [], // défauts de l'image en cours (contours)
		boites: [], // boîtes de l'image en cours (chevauchements)
		zonesImage: [], // zones déclarées pendant l'image
		pile: [], // zones encadrantes (bouton, badge…)
		ecran: '',
		etape: null,
		erreurs: [],
		nonMesurables: 0,
		nonMesParAppelant: {},
		petits: new Map(), // prompt 98 : textes < 14 px à l'écran (validations.md « small-font-size »)
		cibles: new Map(), // prompt 98 : cibles cliquables < 44 px (« small-touch-target »)
		boutonsParEcran: {}, // prompt 98 : nombre de boutons cliquables par écran (« moins de boutons »)
	};
	const TOL = 1;

	// ——— Coordonnées : rectangle logique → rectangle en pixels du canevas (transformation en cours) ———
	function versEcran(x, y, l, h, inst) {
		const ctx = inst ? inst.drawingContext : drawingContext;
		const m = ctx.getTransform();
		const d = inst && inst.pixelDensity ? inst.pixelDensity() : typeof pixelDensity === 'function' ? pixelDensity() : 1;
		const pts = [
			[x, y],
			[x + l, y],
			[x, y + h],
			[x + l, y + h],
		].map(([a, b]) => [(m.a * a + m.c * b + m.e) / d, (m.b * a + m.d * b + m.f) / d]);
		const xs = pts.map((p) => p[0]);
		const ys = pts.map((p) => p[1]);
		return { x: Math.min(...xs), y: Math.min(...ys), l: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys), rot: Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6 };
	}
	// Espace de dessin : le contenu du PC (1920×1080, composé ensuite dans le moniteur) et la pièce partagent le canevas,
	// mais leurs zones ne se mélangent pas
	const espace = () => (typeof espaceDessin !== 'undefined' ? espaceDessin : 'ecran');
	const matrice = () => {
		const m = drawingContext.getTransform();
		return [m.a, m.b, m.c, m.d, m.e, m.f];
	};
	const memeMatrice = (a, b) => a && b && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
	const zone = (nom, x, y, l, h, opts) => Object.assign({ nom, espace: espace(), m: matrice(), local: { x, y, l, h } }, versEcran(x, y, l, h), opts || {});
	window.zoneTexteDebut = (nom, x, y, l, h, opts) => A.pile.push(zone(nom, x, y, l, h, opts));
	window.zoneTexteFin = () => A.pile.pop();
	window.zoneTexteDeclarer = (nom, x, y, l, h, opts) => A.zonesImage.push(Object.assign(zone(nom, x, y, l, h, opts), { ordre: A.boites.length })); // prompt 114 : ordre de dessin (catégorie F)

	function nomEcran() {
		try {
			if (typeof CINE !== 'undefined' && CINE) return 'cinematique:' + CINE.type;
			if (typeof GAMEOVER !== 'undefined' && GAMEOVER) return 'licenciement:' + GAMEOVER.vue;
			const f = typeof fenetre !== 'undefined' && fenetre ? ' fenetre:' + fenetre : '';
			if (typeof MENU !== 'undefined' && MENU.actif) return 'menu:' + MENU.ecran + f;
			const p = [ecran, phase, vue];
			if (typeof PC !== 'undefined') p.push(PC.etat === 'appli' ? 'appli' + (PLUS && PLUS.ouvert ? ':plus:' + SELECTION.onglet : '') : 'vue:' + (PC.fenetre || PC.etat) + (PC.fenetre === 'journal' && typeof JOURNAL !== 'undefined' ? ':jour' + (JOURNAL.enquete !== null ? ':enquete' + JOURNAL.volet : '') : ''));
			if (typeof smsActif !== 'undefined' && smsActif) p.push('sms');
			return p.join(' ') + f;
		} catch (e) {
			return 'inconnu';
		}
	}
	function appelant() {
		const pile = String(new Error().stack || '').split('\n').slice(2);
		const l = pile.find((x) => !/audit-textes\.js|p5\.min\.js|i18n\.js:33\d\d|texte\.js/.test(x));
		const m = l && /at (?:(\S+) )?\(?.*\/([^/]+\.js):(\d+)/.exec(l);
		return m ? (m[1] ? m[1] + ' ' : '') + m[2] + ':' + m[3] : '?';
	}
	function zoneReference(ax, ay, inst) {
		if (inst) return { nom: 'tampon', x: 0, y: 0, l: inst.width, h: inst.height, espace: 'tampon' }; // p5.Graphics : son propre cadre
		const es = espace();
		const haut = A.pile.length ? A.pile[A.pile.length - 1] : null;
		if (haut && haut.espace === es && !haut.clip) return haut;
		for (let i = A.zonesImage.length - 1; i >= 0; i--) {
			const z = A.zonesImage[i];
			if (z.espace !== es) continue;
			if (ax >= z.x - TOL && ax <= z.x + z.l + TOL && ay >= z.y - TOL && ay <= z.y + z.h + TOL) return z;
		}
		return { nom: typeof espaceDessin !== 'undefined' && espaceDessin === 'pc' ? 'ecranPC' : 'canevas', x: 0, y: 0, l: width, h: height };
	}
	/** Lignes comme p5 les coupe dans une boîte : mot par mot, un mot plus large que la boîte reste entier */
	function lignesBoite(s, l, textWidth) {
		const out = [];
		String(s)
			.split('\n')
			.forEach((para) => {
				const mots = para.split(' ');
				let cour = '';
				mots.forEach((m, i) => {
					const essai = i ? cour + ' ' + m : m;
					if (i && textWidth(essai) > l) {
						out.push(cour);
						cour = m;
					} else cour = essai;
				});
				out.push(cour);
			});
		return out;
	}
	function mesurer(moi, str, x, y, l, h) {
		if (str === null || str === undefined) return;
		const s = String(str);
		if (!s.trim()) return;
		const r = moi._renderer;
		const tampon = r !== window._renderer ? moi : null; // texte dessiné dans un p5.Graphics (téléphone, captures…)
		if (moi.drawingContext.globalAlpha === 0) return;
		const textWidth = (t) => moi.textWidth(t);
		const asc = moi.textAscent();
		const desc = moi.textDescent();
		const lead = r._textLeading || moi.textSize() * 1.25;
		const ha = r._textAlign;
		const va = r._textBaseline;
		let bx;
		let by;
		let bl;
		let bh;
		let coupe = false;
		const enBoite = typeof l === 'number' && l > 0;
		if (enBoite) {
			const lignes = lignesBoite(s, l, textWidth);
			const larg = Math.max(...lignes.map((ln) => textWidth(ln)));
			const besoin = (lignes.length - 1) * lead + asc + desc;
			if (typeof h === 'number' && h > 0 && besoin > h + TOL) coupe = !/…\s*$/.test(s);
			const hv = typeof h === 'number' && h > 0 ? Math.min(besoin, h) : besoin;
			bl = larg;
			bx = ha === CENTER ? x + (l - larg) / 2 : ha === RIGHT ? x + l - larg : x;
			const hb = typeof h === 'number' && h > 0 ? h : besoin;
			by = va === CENTER ? y + (hb - hv) / 2 : va === BOTTOM ? y + hb - hv : y;
			bh = hv;
			if (larg > l + TOL) bl = larg; // mot plus large que la boîte : déborde
		} else {
			const lignes = s.split('\n');
			bl = Math.max(...lignes.map((ln) => textWidth(ln)));
			bh = (lignes.length - 1) * lead + asc + desc;
			bx = ha === CENTER ? x - bl / 2 : ha === RIGHT ? x - bl : x;
			by = va === CENTER ? y - bh / 2 : va === BOTTOM ? y - bh : va === BASELINE ? y - asc : y;
		}
		// Prompt 98 : taille réellement affichée (canevas 1920×1080 ; au poste, l'écran du PC est réduit à 90 %)
		const m0 = moi.drawingContext.getTransform();
		const dpx = moi.pixelDensity ? moi.pixelDensity() : 1;
		const echelleCSS = (typeof width !== 'undefined' && moi.canvas ? moi.canvas.getBoundingClientRect().height / height : 1) || 1;
		const tAff = (moi.textSize() * Math.hypot(m0.c, m0.d)) / dpx * (typeof espaceDessin !== 'undefined' && espaceDessin === 'pc' && typeof vue !== 'undefined' && vue === 'poste' ? 0.9 : 1);
		if (A.enParcours && A.enregistre && tAff < 14) {
			const k = A.ecran + '|' + s.slice(0, 50);
			if (!A.petits.has(k)) A.petits.set(k, { ecran: A.ecran, texte: s.slice(0, 80), taille: Math.round(tAff * 10) / 10, tailleEcranCSS: Math.round(tAff * echelleCSS * 10) / 10, appelant: appelant() });
		}
		const b = versEcran(bx, by, bl, bh, tampon);
		// Prompt 205 : mobile portrait — taille RENDUE à l'écran après recomposition (région de l'image principale
		// agrandie ou réduite sur le canevas portrait, lui-même mis à la largeur du téléphone) : défaut « T » sous 12 px CSS,
		// compté une fois par texte et par langue (le premier écran où il apparaît)
		if (A.enParcours && A.enregistre && !tampon && typeof PORTRAIT !== 'undefined' && PORTRAIT.actif && PORTRAIT.canevas && PORTRAIT.regions.length) {
			const cx = b.x + b.l / 2;
			const cy = b.y + b.h / 2;
			const r = [...PORTRAIT.regions].reverse().find((g) => cx >= g.src.x && cx <= g.src.x + g.src.l && cy >= g.src.y && cy <= g.src.y + g.src.h);
			if (r) {
				const css = tAff * (r.dst.l / r.src.l) * (PORTRAIT.canevas.getBoundingClientRect().width / PL);
				const cle = 'T|' + (typeof Langue !== 'undefined' ? Langue.actuelle : '') + '|' + s.slice(0, 50);
				if (css < 12 && !A.defauts.has(cle)) A.defauts.set(cle, { ecran: A.ecran, cat: 'T', texte: s.slice(0, 140), tailleCSS: Math.round(css * 10) / 10, depassePx: 0, zone: 'portrait', zoneRect: [r.src.x, r.src.y, r.src.l, r.src.h].map(Math.round), boite: [b.x, b.y, b.l, b.h].map(Math.round), langue: typeof Langue !== 'undefined' ? Langue.actuelle : '?', taille: window.innerWidth + '×' + window.innerHeight, etape: A.etape });
			}
		}
		const anc = versEcran(enBoite ? x : bx + (ha === RIGHT ? bl : ha === CENTER ? bl / 2 : 0), enBoite ? y : by + Math.min(bh, asc), 0, 0, tampon);
		const z = zoneReference(anc.x, anc.y, tampon);
		const clipE = [...A.pile].reverse().find((x) => x.clip && x.espace === espace());
		if (clipE && (b.x < clipE.x - TOL || b.y < clipE.y - TOL || b.x + b.l > clipE.x + clipE.l + TOL || b.y + b.h > clipE.y + clipE.h + TOL)) return; // masqué par la zone défilante
		// Chevauchements : boîte des glyphes visibles — sans la descente si le texte n'a aucun jambage (chiffres, capitales)
		const sansJambage = !enBoite && !s.includes('\n') && !/[gjpqyçQ,;()\[\]{}|_@$µ]/.test(s);
		A.boites.push({ s, b: sansJambage ? versEcran(bx, by, bl, Math.max(1, bh - desc), tampon) : b, z });
		// Zone défilante (clip) : un texte qui en sort est masqué exprès ; entièrement visible, il est vérifié contre sa carte
		const clip = [...A.pile].reverse().find((x) => x.clip && x.espace === espace());
		if (clip && (b.x < clip.x - TOL || b.y < clip.y - TOL || b.x + b.l > clip.x + clip.l + TOL || b.y + b.h > clip.y + clip.h + TOL)) return;
		if (z.clip) return;
		// Repère tourné (tampons) : comparaison dans le repère local quand la zone a été déclarée dans le même repère
		if (b.rot && !tampon && A.pile.length && memeMatrice(A.pile[A.pile.length - 1].m, matrice())) {
			const zl = A.pile[A.pile.length - 1];
			const L0 = zl.local;
			const depL = Math.max(L0.x - bx, bx + bl - (L0.x + L0.l), L0.y - by, by + bh - (L0.y + L0.h), 0);
			if (depL > TOL || coupe) signaler({ cat: 'A', s, b, z: zl, dep: Math.round(depL), coupe });
			return;
		}
		if (b.rot) return A.nonMesurables++, (A.nonMesParAppelant[appelant()] = (A.nonMesParAppelant[appelant()] || 0) + 1), undefined; // texte tourné (tampon) : boîte non mesurable finement
		const dep = Math.max(z.x - b.x, b.x + b.l - (z.x + z.l), z.y - b.y, b.y + b.h - (z.y + z.h), 0);
		if (dep <= TOL && !coupe) return;
		const cat = coupe ? 'B' : /bouton|badge|pastille|onglet/.test(z.nom) ? 'A' : z.nom === 'canevas' || z.nom === 'ecranPC' ? 'D' : 'C';
		signaler({ cat, s, b, z, dep: Math.round(dep), coupe });
	}
	function signaler(d) {
		if (A.enParcours && !A.enregistre) return; // parcours : seul l'état stable (fin d'étape) compte, pas les animations
		const cle = [A.ecran, d.cat, d.s.slice(0, 80), d.z.nom, Math.round(d.z.x / 8), Math.round(d.z.y / 8)].join('|');
		A.image.push(d);
		if (A.defauts.has(cle)) return;
		A.defauts.set(cle, {
			ecran: A.ecran,
			cat: d.cat,
			texte: d.s.length > 140 ? d.s.slice(0, 139) + '…' : d.s,
			depassePx: d.dep,
			coupe: !!d.coupe,
			zone: d.z.nom,
			zoneRect: [d.z.x, d.z.y, d.z.l, d.z.h].map(Math.round),
			boite: [d.b.x, d.b.y, d.b.l, d.b.h].map(Math.round),
			appelant: appelant(),
			langue: typeof Langue !== 'undefined' ? Langue.actuelle : '?',
			taille: window.innerWidth + '×' + window.innerHeight,
			contraste: typeof Confort !== 'undefined' && !!Confort.Reglages.contrasteRenforce,
			etape: A.etape,
		});
	}
	// Chevauchements (E) : deux textes différents dont les boîtes se recouvrent nettement dans une même zone
	function chevauchements() {
		const bx = A.boites;
		for (let i = 0; i < bx.length && i < 400; i++) {
			for (let j = i + 1; j < bx.length && j < 400; j++) {
				const a = bx[i];
				const c = bx[j];
				if (a.z !== c.z || a.s === c.s || a.z.clip) continue;
				const ix = Math.min(a.b.x + a.b.l, c.b.x + c.b.l) - Math.max(a.b.x, c.b.x);
				const iy = Math.min(a.b.y + a.b.h, c.b.y + c.b.h) - Math.max(a.b.y, c.b.y);
				if (ix > 4 && iy > 4 && ix * iy > 0.2 * Math.min(a.b.l * a.b.h, c.b.l * c.b.h)) signaler({ cat: 'E', s: a.s + ' ⟂ ' + c.s, b: a.b, z: a.z, dep: Math.round(Math.min(ix, iy)) });
			}
		}
	}

	// Prompt 114 — catégorie F : texte dessiné AVANT un panneau opaque qui le recouvre en partie (texte caché)
	const OPAQUES = ['panneau', 'panneauDS'];
	function caches() {
		// les fenêtres modales (aide, mail, menu, pause…) recouvrent le fond exprès : seuls les panneaux non modaux comptent
		if ((typeof fenetre !== 'undefined' && fenetre) || (typeof MENU !== 'undefined' && MENU.actif) || (typeof phase !== 'undefined' && phase === 'fin') || (typeof enPause !== 'undefined' && enPause) || (typeof GAMEOVER !== 'undefined' && GAMEOVER) || (typeof CINE !== 'undefined' && CINE) || (typeof smsActif !== 'undefined' && smsActif)) return;
		A.zonesImage
			.filter((z) => OPAQUES.includes(z.nom) && z.ordre > 0)
			.forEach((z) => {
				for (let i = 0; i < z.ordre && i < 600; i++) {
					const a = A.boites[i];
					if (!a || (a.z && a.z.espace !== z.espace)) continue;
					const ix = Math.min(a.b.x + a.b.l, z.x + z.l) - Math.max(a.b.x, z.x);
					const iy = Math.min(a.b.y + a.b.h, z.y + z.h) - Math.max(a.b.y, z.y);
					if (ix > 4 && iy > 4 && ix * iy > 0.15 * a.b.l * a.b.h) signaler({ cat: 'F', s: a.s + ' ▼ ' + z.nom, b: a.b, z, dep: Math.round(Math.min(ix, iy)) });
				}
			});
	}

	// ——— Enveloppe de text() (avant l'initialisation de p5 : le mode global lie p5.prototype.text) ———
	const origine = p5.prototype.text;
	p5.prototype.text = function (str, x, y, l, h) {
		const ret = origine.apply(this, arguments);
		if (!A.mesure) {
			A.mesure = true;
			try {
				mesurer(this, str, x, y, l, h);
			} catch (e) {
				A.nonMesurables++;
			}
			A.mesure = false;
		}
		return ret;
	};
	p5.prototype.registerMethod('pre', function () {
		A.image = [];
		A.boites = [];
		A.zonesImage = [];
		A.pile = [];
		A.ecran = nomEcran();
	});
	p5.prototype.registerMethod('post', function () {
		try {
			chevauchements();
			caches();
		} catch (e) {}
		// Prompt 98 : boutons cliquables de l'image (nombre, et cibles trop petites)
		if (A.enParcours && A.enregistre && typeof boutons !== 'undefined') {
			A.boutonsParEcran[A.ecran] = Math.max(A.boutonsParEcran[A.ecran] || 0, boutons.length);
			const ech = 1; // boutons déjà en coordonnées d'écran (composerVue)
			boutons.forEach((b) => {
				if (b.l >= L - 1 && b.h >= H - 1) return; // zone plein écran (« clic pour continuer »)
				const mn = Math.min(b.l, b.h) * ech;
				if (mn < 44) {
					const k = A.ecran + '|' + Math.round(b.x) + ',' + Math.round(b.y);
					if (!A.cibles.has(k)) A.cibles.set(k, { ecran: A.ecran, rect: [b.x, b.y, b.l, b.h].map(Math.round), minPx: Math.round(mn) });
				}
			});
		}
		// Contours fixes (aucun clignotement) : rouge = texte fautif, orange = sa zone
		const ctx = drawingContext;
		ctx.save();
		const d = typeof pixelDensity === 'function' ? pixelDensity() : 1;
		ctx.setTransform(d, 0, 0, d, 0, 0);
		ctx.lineWidth = 2;
		A.image.forEach((x) => {
			ctx.strokeStyle = '#ff8c00';
			ctx.strokeRect(x.z.x, x.z.y, x.z.l, x.z.h);
			ctx.strokeStyle = '#ff2d2d';
			ctx.strokeRect(x.b.x - 1, x.b.y - 1, x.b.l + 2, x.b.h + 2);
		});
		ctx.restore();
		if (frameCount % 30 === 0) majPanneau();
	});

	// ——— Rapport ———
	function rapport() {
		const liste = [...A.defauts.values()];
		const par = (k) => liste.reduce((o, d) => ((o[d[k]] = (o[d[k]] || 0) + 1), o), {});
		return {
			date: new Date().toISOString(),
			url: location.pathname + location.search,
			taille: window.innerWidth + '×' + window.innerHeight,
			total: liste.length,
			parCategorie: par('cat'),
			parEcran: par('ecran'),
			parLangue: par('langue'),
			nonMesurables: A.nonMesurables,
			nonMesurablesParAppelant: A.nonMesParAppelant,
			erreursParcours: A.erreurs,
			pires: liste
				.filter((d) => d.cat !== 'E')
				.sort((a, b) => b.depassePx - a.depassePx)
				.slice(0, 10),
			defauts: liste,
			petitsTextes: [...A.petits.values()],
			petitesCibles: [...A.cibles.values()],
			boutonsParEcran: A.boutonsParEcran,
		};
	}
	function telecharger() {
		const blob = new Blob([JSON.stringify(rapport(), null, 2)], { type: 'application/json' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = 'audit-textes-' + new Date().toISOString().slice(0, 10) + '.json';
		document.body.appendChild(a);
		a.click();
		a.remove();
	}
	let panneauHTML = null;
	function majPanneau() {
		if (!document.body) return;
		if (!panneauHTML) {
			panneauHTML = document.createElement('details');
			panneauHTML.id = 'audit-textes';
			panneauHTML.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;max-width:46vw;max-height:40vh;overflow:auto;background:#0d0c0c;color:#fff;border:2px solid #ff8c00;font:13px/1.4 monospace;padding:6px 10px';
			document.body.appendChild(panneauHTML);
		}
		const r = rapport();
		const ouvert = panneauHTML.open;
		const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
		panneauHTML.innerHTML =
			`<summary>Audit textes : ${r.total} défaut(s) · ${Object.entries(r.parCategorie).map(([k, v]) => k + ' ' + v).join(' · ') || '—'} <button type="button" id="audit-dl">JSON</button></summary>` +
			'<ol>' +
			r.defauts
				.slice(-60)
				.map((d) => `<li>[${d.cat}] ${esc(d.ecran)} — « ${esc(d.texte.slice(0, 70))} » +${d.depassePx}px (${esc(d.zone)}, ${esc(d.appelant)})</li>`)
				.join('') +
			'</ol>';
		panneauHTML.open = ouvert;
		const dl = panneauHTML.querySelector('#audit-dl');
		if (dl) dl.onclick = (e) => (e.preventDefault(), telecharger());
	}

	// ——— § 2 : parcours automatique de tous les écrans ———
	// Prompt 101 : aides du parcours (attendreImages, H) partagées avec ?audit=densite, dans audit-parcours.js
	const { attendreImages, H } = window.AUDIT_PARCOURS;
	function etapes() {
		const E = [];
		const add = (nom, prep, n) => E.push({ nom, prep, n: n || 8 });
		// Menu principal
		add('menu titre', () => (H.raz(), (MENU.actif = true), (MENU.ecran = 'titre')));
		add('menu autorisations', () => (H.raz(), (MENU.actif = true), (MENU.ecran = 'autorisations'), (AUTOR.etat = { son: 'nonDemande', micro: 'refuse', camera: 'absent' }))); // prompt 110
		add('menu crédits', () => (H.raz(), (MENU.actif = true), ouvrirCredits()), 12); // prompt 113
		add('menu autorisations · tout autorisé', () => (AUTOR.etat = { son: 'autorise', micro: 'autorise', camera: 'autorise' }));
		[0, 1, 2].forEach((c) => add('menu semaines ' + c, () => (H.raz(), (MENU.actif = true), (MENU.ecran = 'semaines'), (MENU.choixSemaine = c))));
		// Prompt 171 : l'aide ne s'ouvre plus depuis le menu titre (elle est auditée en partie, plus bas) ; + explication d'installation
		['parametres', 'palmares', 'fins', 'partage', 'installation'].forEach((f) => add('menu fenêtre ' + f, () => (H.raz(), (MENU.actif = true), (MENU.ecran = 'titre'), ouvrir(f))));
		add('menu titre · focus installer', () => (H.raz(), (MENU.actif = true), (MENU.ecran = 'titre'), (MENU.choix = entreesMenu().length + EXTRAS_MENU.length - 1)));
		add('menu titre · retour au premier choix', () => (MENU.choix = 0), 2);
		// Prompt 123 : les onglets de l'aide (la fenêtre s'ouvre sur le premier), page 2 des règles comprise ; prompt 171 : ouverte en partie, au poste
		add('aide · bien démarrer', () => (H.partie(0), H.poste(), ouvrir('aide')), 16);
		add('aide · règles 1', () => changerOngletAide(1), 16);
		add('aide · règles 2', () => pageAide(1), 16);
		add('aide · raccourcis', () => changerOngletAide(2), 16);
		add('aide · malus', () => changerOngletAide(3), 16);
		// Prompt 175 : les quatre sections de la fenêtre des paramètres (page 2 de « Avancé » comprise), focus clavier compris
		add('paramètres · écran', () => (H.raz(), H.poste(), ouvrirParametres(0)), 12);
		add('paramètres · son', () => (ouvrirParametres(1), (PARAM.focus = 1)), 12);
		add('paramètres · accessibilité', () => (ouvrirParametres(2), (PARAM.focus = 5)), 12);
		add('paramètres · avancé', () => ouvrirParametres(3), 12);
		add('paramètres · avancé 2', () => pageParam(1), 12);
		add('paramètres · fermés', () => fermer(), 2);
		// Partie : bureau, poste, applis
		add('partie semaine 1 · bureau', () => (H.partie(0), (vue = 'bureau')), 20);
		// Prompt 183 : plus de bureau d'icônes — les applis sont des vues de l'appli principale ; Indicateurs = panneau flottant (I)
		['patron', 'community', 'journal', 'donnees'].forEach((a) => add('appli ' + a, () => (H.poste(), (PC.etat = 'os'), (PC.fenetre = a))));
		add('appli indicateurs', () => (H.poste(), (PC.flottant = true), (INDIC.deplie = true)));
		add('appli indicateurs · fermée', () => ((PC.flottant = false), (INDIC.deplie = false)), 2);
		add('Signalements · file', () => H.poste());
		add('Signalements · équipes engagées (prompt 114)', () => (H.poste(), ['police', 'techniciens', 'ambulance'].forEach((c) => Jeu.envoyerEquipe(Jeu.index, c, typeof tempsCarte === 'function' ? tempsCarte() : millis()))));
		// Un signalement de chaque type, sources révélées, onglets
		[
			[0, 'événement'],
			[0, 'alerte météo'],
			[2, 'perturbation'],
			[0, 'incident fictif'], // prompt 119
		].forEach(([s, ty]) => {
			add('dossier ' + ty, () => {
				H.partie(s);
				H.poste();
				if (H.dossierDeType(ty)) setTimeout(H.prendre, 0);
			}, 20);
			add('dossier ' + ty + ' · contradiction / décision', () => {
				if (phase === 'contradiction') choisirSource('a');
			});
			add('dossier ' + ty + ' · sources', () => {
				PLUS.ouvert = true;
				SELECTION.onglet = 'enquete';
				['lignes', 'trafic', 'meteo', 'agenda'].forEach((c) => revelerSource(c, false));
			}, 12);
			add('dossier ' + ty + ' · historique', () => (SELECTION.onglet = 'historique'));
			add('dossier ' + ty + ' · narration', () => {
				PLUS.ouvert = false;
				SELECTION.onglet = 'enquete';
				const d = Jeu.dossierCourant();
				if (d && phase === 'decision') decider(Jeu.actionsPossibles(d)[0]);
			}, 12);
		});
		// Fenêtres en partie
		['aide', 'parametres', 'reset', 'menu', 'demission', 'cafe', 'partir'].forEach((f) => add('fenêtre ' + f, () => (H.raz(), H.poste(), ouvrir(f))));
		add('pause', () => (H.raz(), H.poste(), (enPause = true)));
		add('téléphone', () => {
			H.raz();
			vue = 'bureau';
			TEL.date = dateTelephone();
			chargerNotifications(TEL.date);
			ouvrir('telephone');
			leverTelephone();
		}, 70);
		add('SMS', () => (H.raz(), (smsActif = true)), 20);
		// Cas extrêmes : jauges, budget, retards, lignes multiples
		add('jauges extrêmes', () => {
			H.raz();
			H.poste();
			Object.assign(Jeu.jauges, { fluidite: 0, reputation: 100, budget: 0 });
		});
		add('dossier extrême (retard 3 chiffres, lignes multiples, plus long texte réel)', () => {
			const d = Jeu.dossierCourant() || Jeu.prochainDuJour();
			if (!d) return;
			const tous = Jeu.paquet.map((x) => String(x.texte_source || '')).sort((a, b) => b.length - a.length);
			Object.assign(d, { retard: 125, lignes: ['C1', 'C2', 'C3', '4', '5'], texte_source: tous[0] || d.texte_source });
			if (phase !== 'decision' && phase !== 'contradiction') {
				Jeu.horloge.minutes = d.minute;
				setTimeout(H.prendre, 0);
			}
		}, 20);
		add('dossier extrême · sources', () => {
			PLUS.ouvert = true;
			SELECTION.onglet = 'enquete';
			['lignes', 'trafic', 'meteo', 'agenda'].forEach((c) => revelerSource(c, false));
		}, 12);
		// Fin de journée, soir, semaine, fins
		add('mail du soir · Mails', () => (H.raz(), (PLUS.ouvert = false), H.poste(), Jeu.deposerMailDuSoir(), (PC.etat = 'os'), (PC.fenetre = 'patron'), (PATRON.ouvert = false), (PATRON.filtre = 'soirs')), 12); // prompt 194 : le mail du soir est dans l'appli Mails
		add('soir · sortie', () => (H.raz(), (phase = 'soir'), (SOIR.debut = millis()), (vue = 'bureau')), 20);
		add('rapport de la veille', () => (H.raz(), (phase = 'attente'), (vue = 'bureau'), ouvrir('rapportVeille')));
		add('fin de semaine · rapport', () => (H.raz(), allerFin()), 30);
		add('fin de semaine · rapport ouvert', () => (fenetre === 'mailFin' && (fenetre = null), ouvrirRapport()), 20);
		add('fin de semaine · rapport page 2', () => RAPPORT && fenetre === 'rapport' && changerPageRapport(1), 12); // prompt 163
		add('fin de semaine · rapport page 3 (sources)', () => RAPPORT && fenetre === 'rapport' && changerPageRapport(1), 12); // prompt 163
		['bonne', 'moyenne', 'mauvaise'].forEach((ty) => add('cinématique ' + ty, () => (H.raz(), lancerCinematique(ty, Object.assign({}, (RAPPORT && RAPPORT.bilan) || {}, { type: ty }))), 40));
		add('licenciement · lettre', () => (H.raz(), (GAMEOVER = { debut: millis() - 5000, lettre: Jeu.lettreLicenciement(), vue: 'lettre', focus: 0 })), 20);
		// Prompt 121 : signalement répondu avec une équipe en route — badge de statut, puis marqueur creux sur la carte
		add('retour · dossier', () => {
			H.partie(2);
			H.poste();
			if (H.dossierDeType('perturbation')) setTimeout(H.prendre, 0);
		}, 20);
		add('retour · conséquences, en attente', () => {
			if (phase === 'contradiction') choisirSource('a');
			Jeu.envoyerEquipe(Jeu.index, 'techniciens', typeof tempsCarte === 'function' ? tempsCarte() : millis());
			const d = Jeu.dossierCourant();
			if (d && phase === 'decision') decider(Jeu.actionsPossibles(d)[0]);
		}, 12);
		add('retour · marqueur en attente', () => continuer(), 12);
		add('licenciement · journal', () => GAMEOVER && (GAMEOVER.vue = 'journal'), 20);
		// Prompt 178 : écran « Reprendre une partie » (les parties jouées par l'audit ont laissé leurs emplacements), confirmation de suppression, limite atteinte
		add('menu sauvegardes', () => (H.raz(), (MENU.actif = true), allerSauvegardes()));
		add('menu sauvegardes · confirmation', () => demanderSuppressionSauvegarde());
		add('menu sauvegardes · limite', () => allerSauvegardes(() => {}));
		add('retour menu', () => (H.raz(), (MENU.actif = true), (MENU.ecran = 'titre')));
		return E;
	}
	async function parcours() {
		const langues = ['fr', 'en'];
		const contrastes = [false, true];
		const ancien = { langue: Langue.actuelle, contraste: !!Confort.Reglages.contrasteRenforce };
		const E = etapes();
		A.enParcours = true;
		console.info(`[audit-textes] parcours : ${E.length} étapes × ${langues.length} langues × ${contrastes.length} contrastes`);
		for (const lg of langues) {
			for (const ct of contrastes) {
				try {
					Langue.changer ? Langue.changer(lg) : (Langue.actuelle = lg);
				} catch (e) {
					Langue.actuelle = lg;
				}
				Confort.Reglages.contrasteRenforce = ct;
				if (typeof appliquerReglages === 'function') appliquerReglages();
				for (const e of E) {
					A.etape = `${e.nom} [${lg}${ct ? ', contraste' : ''}]`;
					A.enregistre = false;
					try {
						e.prep();
					} catch (err) {
						A.erreurs.push({ etape: A.etape, erreur: String(err && err.message) });
					}
					await attendreImages(Math.max(1, e.n - 3));
					A.enregistre = true;
					await attendreImages(3);
					A.enregistre = false;
				}
			}
		}
		A.etape = null;
		A.enParcours = false;
		try {
			Langue.changer ? Langue.changer(ancien.langue) : (Langue.actuelle = ancien.langue);
		} catch (e) {}
		Confort.Reglages.contrasteRenforce = ancien.contraste;
		const r = rapport();
		window.AUDIT_TEXTES.fini = true;
		console.info(`[audit-textes] ${r.total} défaut(s) — par catégorie ${JSON.stringify(r.parCategorie)} ; non mesurables ${r.nonMesurables} ; étapes en erreur ${A.erreurs.length}`);
		console.table(r.pires.map((d) => ({ cat: d.cat, ecran: d.ecran, texte: d.texte.slice(0, 50), px: d.depassePx, appelant: d.appelant })));
		majPanneau();
		if (panneauHTML) panneauHTML.open = true;
	}
	window.AUDIT_TEXTES = { rapport, telecharger, parcours, vider: () => A.defauts.clear(), fini: false, etapes: () => etapes().map((e) => e.nom) };
	if (params.get('parcours') === '1') window.addEventListener('load', () => setTimeout(parcours, 1500));
})();
