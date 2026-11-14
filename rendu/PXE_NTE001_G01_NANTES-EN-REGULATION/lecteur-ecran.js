/* Nantes en régulation — prompt 210 (audit 206, constat 2) : le jeu pour les lecteurs d'écran.
 * Le jeu est un canevas : sans ce fichier, un lecteur d'écran n'y trouvait ni commande, ni texte, et chaque annonce
 * effaçait la précédente. Trois choses ici :
 * 1. Commandes : <nav id="commandes-jeu"> reprend, en vrais boutons HTML, les zones cliquables de l'écran courant
 *    (tableau `boutons` de sketch.js). Libellé = textes dessinés dans la zone (relevés sur l'image), ou `titre`.
 *    Activer un bouton HTML appelle la même action qu'un clic. La liste est visuellement masquée ; elle apparaît
 *    en surimpression dès qu'un de ses boutons a le focus (Tab depuis le haut de la page, ou navigation du lecteur).
 *    Tant qu'un bouton de la liste a le focus, le jeu ne lit pas le clavier (sketch.js, saisieOuRaccourciNavigateur).
 * 2. Texte de l'écran : <section id="texte-ecran"> reprend les textes dessinés (dédoublonnés, dans l'ordre de
 *    lecture : de haut en bas, de gauche à droite), lisibles au curseur virtuel.
 * 3. Annonces : chaque annonce s'ajoute à la file (role="log") au lieu d'effacer la précédente ; 4 au plus.
 * Relevé échantillonné (une image toutes les 700 ms) et DOM réécrit seulement quand le contenu change : coût
 * négligeable, et le focus n'est jamais perdu pendant la lecture. Limite connue : les textes dessinés dans des
 * tampons hors écran (createGraphics) ne sont pas relevés. À valider avec NVDA et VoiceOver (non fait).
 */
const LECTEUR = { capture: false, dernier: 0, textes: [], avantComposition: null, cleCommandes: '', cleTexte: '', nav: null, section: null };

(function () {
	if (typeof p5 === 'undefined' || typeof document === 'undefined') return;
	const origine = p5.prototype.text;
	p5.prototype.text = function (s, x, y) {
		if (LECTEUR.capture && !(p5.Graphics && this instanceof p5.Graphics) && s !== undefined && s !== null) {
			const chaine = String(s).replace(/\s+/g, ' ').trim();
			if (chaine && typeof x === 'number' && typeof y === 'number') {
				try {
					const m = this.drawingContext.getTransform();
					const d = typeof this.pixelDensity === 'function' ? this.pixelDensity() : 1;
					LECTEUR.textes.push({ s: chaine, x: (m.a * x + m.c * y + m.e) / d, y: (m.b * x + m.d * y + m.f) / d });
				} catch (e) {}
			}
		}
		return origine.apply(this, arguments);
	};
	p5.prototype.registerMethod('pre', function () {
		if (p5.Graphics && this instanceof p5.Graphics) return;
		const maintenant = typeof millis === 'function' ? millis() : Date.now();
		LECTEUR.capture = maintenant - LECTEUR.dernier > 700;
		if (LECTEUR.capture) {
			LECTEUR.dernier = maintenant;
			LECTEUR.textes = [];
			LECTEUR.avantComposition = null;
		}
	});
	p5.prototype.registerMethod('post', function () {
		if (p5.Graphics && this instanceof p5.Graphics) return;
		if (!LECTEUR.capture) return;
		LECTEUR.capture = false;
		try {
			majLecteurEcran();
		} catch (e) {}
	});
})();

/** Libellé d'une zone : textes dont le point d'ancrage tombe dans la zone (marge 6 px), ou son titre */
function libelleZone(b, textes) {
	if (b.titre) return String(b.titre);
	if (b.texte) return String(b.texte) + (b.sous ? ' — ' + b.sous : '');
	const m = 6;
	const dedans = textes.filter((t) => t.x >= b.x - m && t.x <= b.x + b.l + m && t.y >= b.y - m && t.y <= b.y + b.h + m);
	const vus = new Set();
	return dedans
		.sort((a, b2) => a.y - b2.y || a.x - b2.x)
		.map((t) => t.s)
		.filter((s) => (vus.has(s) ? false : vus.add(s)))
		.join(' — ')
		.slice(0, 160);
}

/** Appelée par composerVue (bureau.js) AVANT que les zones soient ramenées en coordonnées de l'écran du PC :
 * les textes ont été relevés dans le même repère que les zones à ce moment-là */
function lecteurAvantComposition() {
	if (!LECTEUR.capture || typeof boutons === 'undefined') return;
	LECTEUR.avantComposition = boutons.map((b) => libelleZone(b, LECTEUR.textes));
}

function majLecteurEcran() {
	if (!LECTEUR.nav) {
		LECTEUR.nav = document.getElementById('commandes-jeu');
		LECTEUR.section = document.getElementById('texte-ecran');
		if (!LECTEUR.nav) return;
	}
	const zones = typeof boutons !== 'undefined' && Array.isArray(boutons) ? boutons : [];
	const libelles = LECTEUR.avantComposition && LECTEUR.avantComposition.length === zones.length ? LECTEUR.avantComposition : zones.map((b) => libelleZone(b, LECTEUR.textes));
	const commandes = zones.map((b, i) => ({ b, i, libelle: libelles[i] || '' })).filter((c) => typeof c.b.action === 'function');
	const t2 = typeof t === 'function' ? t : (k) => k;
	const cle = (typeof Langue !== 'undefined' ? Langue.actuelle : '') + '|' + commandes.map((c) => c.libelle).join('¦');
	if (cle !== LECTEUR.cleCommandes) {
		LECTEUR.cleCommandes = cle;
		const focusAvant = LECTEUR.nav.contains(document.activeElement) ? Number(document.activeElement.dataset.rang) : -1;
		LECTEUR.nav.setAttribute('aria-label', t2('lecteur.commandes'));
		const liste = document.createElement('ul');
		commandes.forEach((c, rang) => {
			const li = document.createElement('li');
			const bouton = document.createElement('button');
			bouton.type = 'button';
			bouton.dataset.rang = String(rang);
			bouton.textContent = c.libelle || t2('lecteur.sansNom', { n: rang + 1 });
			bouton.addEventListener('click', () => activerCommande(c.libelle, rang));
			li.appendChild(bouton);
			liste.appendChild(li);
		});
		LECTEUR.nav.replaceChildren(liste);
		if (focusAvant >= 0) {
			const b = LECTEUR.nav.querySelectorAll('button')[Math.min(focusAvant, commandes.length - 1)];
			if (b) b.focus();
		}
	}
	if (LECTEUR.section) {
		const vus = new Set();
		const lignes = LECTEUR.textes
			.slice()
			.sort((a, b) => Math.round(a.y / 12) - Math.round(b.y / 12) || a.x - b.x)
			.map((x) => x.s)
			.filter((s) => s.length > 1 && (vus.has(s) ? false : vus.add(s)))
			.slice(0, 80);
		const cleT = lignes.join('¦');
		if (cleT !== LECTEUR.cleTexte) {
			LECTEUR.cleTexte = cleT;
			LECTEUR.section.setAttribute('aria-label', t2('lecteur.texte'));
			const ul = document.createElement('ul');
			lignes.forEach((s) => {
				const li = document.createElement('li');
				li.textContent = s;
				ul.appendChild(li);
			});
			LECTEUR.section.replaceChildren(ul);
		}
	}
}

/** Activation d'un bouton HTML : retrouve la zone au même libellé dans l'image courante (sinon au même rang) */
function activerCommande(libelle, rang) {
	if (typeof Confort !== 'undefined') Confort.Son.demarrer();
	if (typeof interaction === 'function') interaction();
	const zones = (typeof boutons !== 'undefined' ? boutons : []).filter((b) => typeof b.action === 'function');
	const libs = LECTEUR.avantComposition && LECTEUR.avantComposition.length === boutons.length ? LECTEUR.avantComposition : null;
	let z = null;
	if (libelle) {
		const i = (typeof boutons !== 'undefined' ? boutons : []).findIndex((b, k) => typeof b.action === 'function' && (libs ? libs[k] : libelleZone(b, LECTEUR.textes)) === libelle);
		if (i >= 0) z = boutons[i];
	}
	if (!z) z = zones[rang];
	if (z) z.action();
	LECTEUR.dernier = 0; // relevé à la prochaine image : la liste suit l'écran qui vient de changer
}

/** File d'annonces (remplace l'écrasement de #annonces) : appelée par annoncer() (i18n.js) */
function annoncerDansFile(texte) {
	const el = document.getElementById('annonces');
	if (!el) return false;
	const p = document.createElement('p');
	p.textContent = String(texte);
	el.appendChild(p);
	while (el.children.length > 4) el.removeChild(el.firstChild);
	return true;
}
