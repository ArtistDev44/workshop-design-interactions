/* Nantes en régulation — le téléphone du bureau (prompt 38).
 * Un clic sur le téléphone ouvre la « vue téléphone » : les événements réels du jour, tirés de l'API
 * Agenda des événements de Nantes Métropole (Explore v2.1), s'affichent en notifications.
 * Appel au clic seulement (jamais dans draw), délai max 6 s, cache par date. Repli : événements réels
 * de la semaine jouée (data/semaines.js) ou de l'instantané hors ligne. Aucun texte inventé.
 */
const TEL = {
	url: 'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/244400404_agenda-evenements-nantes-metropole_v2/records',
	cache: {}, // date → { notifs, source: 'api' | 'repli' }
	date: null,
	charge: false,
	ouverture: 0,
};

/** Date affichée : jour simulé de la partie (date réelle d'archive), sinon aujourd'hui */
function dateTelephone() {
	const j = ecran === 'jeu' && Jeu.jourCourant ? Jeu.jourCourant() : null;
	if (j && Jeu.etat.mode !== 'direct') return j.date;
	const d = new Date();
	return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/** Repli local : événements réels de la semaine jouée (texte_source « Titre — Lieu, Ville »), à la date demandée si possible */
function notifsRepli(date) {
	const s = Jeu.etat && Jeu.etat.semaine;
	const sources = [];
	if (s && s.evenements) sources.push(...s.evenements);
	if (Jeu.fallback && Jeu.fallback.dossiers) sources.push(...Jeu.fallback.dossiers.filter((d) => d.type === 'événement'));
	const duJour = sources.filter((e) => e.date === date);
	return (duJour.length ? duJour : sources).slice(0, 4).map((e) => {
		const [titre, lieu] = String(e.texte_source || e.nature).split(' — ');
		return { titre, lieu: lieu || '', date: e.date, heure: e.heure || '', type: String(e.nature || '').split(',')[0] };
	});
}

function chargerNotifications(date) {
	if (TEL.cache[date]) return;
	TEL.charge = true;
	const fin = (notifs, source) => {
		TEL.cache[date] = { notifs, source };
		TEL.charge = false;
		if (fenetre === 'telephone') annoncer(t('tel.annonce', { n: notifs.length }));
	};
	if (Confort.Reglages.horsLigneForce || typeof fetch !== 'function') return fin(notifsRepli(date), 'repli');
	const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
	const minuterie = setTimeout(() => ctrl && ctrl.abort(), 6000);
	const q = '?limit=4&select=nom,lieu,ville,date,heure_debut,types_libelles,annule&order_by=heure_debut&where=' + encodeURIComponent("date=date'" + date + "' AND annule='non'");
	fetch(TEL.url + q, ctrl ? { signal: ctrl.signal } : {})
		.then((r) => (r.ok ? r.json() : null))
		.then((d) => {
			const res = (d && d.results) || [];
			if (!res.length) return fin(notifsRepli(date), 'repli');
			fin(
				res.map((e) => ({
					titre: e.nom,
					lieu: [e.lieu, e.ville].filter(Boolean).join(', '),
					date: e.date,
					heure: e.heure_debut && e.heure_debut !== '00:00' ? e.heure_debut : '',
					type: (e.types_libelles || [])[0] || '',
				})),
				'api',
			);
		})
		.catch(() => fin(notifsRepli(date), 'repli'))
		.finally(() => clearTimeout(minuterie));
}

function ouvrirTelephone() {
	TEL.date = dateTelephone();
	TEL.ouverture = millis();
	chargerNotifications(TEL.date);
	ouvrir('telephone');
	if (TEL.cache[TEL.date]) annoncer(t('tel.annonce', { n: TEL.cache[TEL.date].notifs.length }));
}

/** Vue téléphone (fenêtre) : smartphone agrandi, heure du jeu, pile de notifications réelles */
function fenetreTelephone() {
	const l = 560;
	const h = 980;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	noStroke();
	fill(0, 0, 0, 90);
	rect(x + 12, y + 16, l, h, 64);
	fill('#0a0b0c');
	rect(x, y, l, h, 64); // coque
	const e = { x: x + 16, y: y + 16, l: l - 32, h: h - 32 };
	const g = drawingContext.createLinearGradient(0, e.y, 0, e.y + e.h);
	g.addColorStop(0, '#1d5f6e');
	g.addColorStop(1, '#0b1b33');
	drawingContext.fillStyle = g;
	drawingContext.beginPath();
	drawingContext.roundRect(e.x, e.y, e.l, e.h, 50);
	drawingContext.fill();
	fill('#0a0b0c');
	circle(x + l / 2, e.y + 26, 18); // point caméra
	// Heure (du jeu) et date
	const hA = heureAffichee();
	textAlign(CENTER, TOP);
	fill('#ffffff');
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(84);
	text(String(hA.h).padStart(2, '0') + ':' + String(hA.m).padStart(2, '0'), x + l / 2, e.y + 70);
	textStyle(NORMAL);
	textSize(22);
	fill('rgba(255,255,255,0.85)');
	text(dateLongue(TEL.date), x + l / 2, e.y + 168);
	// Notifications
	const c = TEL.cache[TEL.date];
	let ny = e.y + 230;
	if (!c) {
		textSize(20);
		text(t('tel.chargement'), x + l / 2, ny + 20);
	} else if (!c.notifs.length) {
		textSize(20);
		text(t('tel.aucune'), x + 40, ny + 20, l - 80, 80);
	} else
		c.notifs.forEach((n, i) => {
			const k = reduireAnimations ? 1 : easeOut(constrain((millis() - TEL.ouverture - i * 160) / 350, 0, 1));
			if (k <= 0) return;
			const nx = e.x + 16 + (1 - k) * 80;
			const nh = 112;
			noStroke();
			fill(255, 255, 255, 235 * k);
			rect(nx, ny, e.l - 32, nh, 20);
			fill('#b3261e');
			rect(nx + 16, ny + 16, 32, 32, 8); // icône de l'appli « Agenda »
			fill('#ffffff');
			rect(nx + 22, ny + 22, 20, 4);
			textAlign(LEFT, TOP);
			textFont(POLICE_DONNEES);
			textSize(15);
			fill('#3d4b5f');
			text(t('tel.appli') + (n.heure ? ' · ' + n.heure : ''), nx + 60, ny + 22);
			textFont(POLICE_TEXTE);
			textStyle(BOLD);
			textSize(19);
			fill('#0b1b33');
			text(n.titre, nx + 16, ny + 54, e.l - 64, 26);
			textStyle(NORMAL);
			textSize(16);
			fill('#3d4b5f');
			text([n.type, n.lieu].filter(Boolean).join(' · '), nx + 16, ny + 82, e.l - 64, 22);
			ny += nh + 12;
		});
	// Source + fermer
	textAlign(CENTER, TOP);
	textFont(POLICE_DONNEES);
	textSize(14);
	fill('rgba(255,255,255,0.8)');
	if (c) text(t(c.source === 'api' ? 'tel.source.api' : 'tel.source.repli'), e.x + 24, e.y + e.h - 150, e.l - 48, 44);
	bouton(x + l / 2 - 150, e.y + e.h - 96, 300, 64, t('commun.fermer'), fermer);
	fill('rgba(255,255,255,0.6)');
	rect(x + l / 2 - 70, e.y + e.h - 18, 140, 6, 3); // barre gestuelle
}
