// Prompt 187 — capture d'une vraie partie de « Nantes en régulation » (base du trailer).
// Usage : servir site/public (python3 -m http.server 8787 --bind 127.0.0.1, ou npm run preview), puis
//   node trailer/scripts/capture.mjs [url] [durée max en s]
// - playwright-core du cache npx (pas de dépendance ajoutée au dépôt), Chromium headless 1920×1080 ;
// - partie HORS RÉSEAU : toute requête qui ne vise pas le serveur local est coupée → données de repli réelles ;
// - prefers-reduced-motion désactivé ; curseur dessiné par-dessus la page (le curseur système n'apparaît pas en
//   headless), il suit les vrais événements souris envoyés au jeu ;
// - images de la page via le screencast CDP (JPEG q90, ~30 i/s) envoyées à FFmpeg, horodatées à l'horloge murale,
//   ré-échantillonnées à 30 i/s en H.264 → trailer/assets/clips/partie-complete.mp4 ;
// - journal horodaté des gestes → trailer/assets/clips/partie-complete.log.json (sert au dérushage).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const PW = process.env.PLAYWRIGHT_CORE || '/home/guillaume/.npm/_npx/411d535eabdf86de/node_modules/playwright-core';
const CHROME = process.env.CHROME || process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome';
const { chromium } = require(PW);

const ICI = dirname(fileURLToPath(import.meta.url));
const CLIPS = resolve(ICI, '../assets/clips');
mkdirSync(CLIPS, { recursive: true });
const URL_JEU = process.argv[2] || 'http://127.0.0.1:8787/index.html';
const MAX_S = Number(process.argv[3] || 540);
// MODE=semaine : sans l'ouverture scénarisée, la semaine jouée au clavier jusqu'au rapport (→ partie-semaine.mp4)
const SEMAINE = process.env.MODE === 'semaine';
const ORIGINE = new URL(URL_JEU).origin;

const browser = await chromium.launch({ executablePath: CHROME, args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'no-preference', serviceWorkers: 'block', locale: 'fr-FR' });
await ctx.route('**/*', (r) => (r.request().url().startsWith(ORIGINE) ? r.continue() : r.abort()));
// Curseur visible : flèche de 60 px (≈ 5,5 % de la hauteur), pointe exacte sur la position de la souris
await ctx.addInitScript(() => {
	const poser = () => {
		if (document.getElementById('curseur-capture')) return;
		const c = document.createElement('div');
		c.id = 'curseur-capture';
		c.style.cssText = 'position:fixed;left:0;top:0;width:44px;height:60px;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);';
		c.innerHTML = '<svg width="44" height="60" viewBox="0 0 22 30"><path d="M1 1 L1 24 L7 18.5 L11 28 L15 26.3 L11 17 L19 17 Z" fill="#fff" stroke="#0D0C0C" stroke-width="1.6" stroke-linejoin="round"/></svg>';
		document.body.appendChild(c);
		addEventListener('mousemove', (e) => (c.style.transform = `translate(${e.clientX - 2}px,${e.clientY - 2}px)`), true);
		addEventListener('mousedown', () => (c.firstChild.style.transform = 'scale(.88)'), true);
		addEventListener('mouseup', () => (c.firstChild.style.transform = ''), true);
	};
	document.readyState === 'loading' ? addEventListener('DOMContentLoaded', poser) : poser();
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('ERREUR PAGE', e.message));

// ——— Enregistrement : screencast → FFmpeg ———
const sortie = resolve(CLIPS, SEMAINE ? 'partie-semaine.mp4' : 'partie-complete.mp4');
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-use_wallclock_as_timestamps', '1', '-c:v', 'mjpeg', '-i', '-', '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-movflags', '+faststart', sortie], { stdio: ['pipe', 'inherit', 'inherit'] });
let t0 = 0;
const journal = [];
const note = (quoi) => {
	const t = t0 ? (Date.now() - t0) / 1000 : 0;
	journal.push({ t: Math.round(t * 10) / 10, quoi });
	console.log(t.toFixed(1).padStart(6), quoi);
};
const cdp = await ctx.newCDPSession(page);
cdp.on('Page.screencastFrame', async (e) => {
	if (!t0) t0 = Date.now();
	ff.stdin.write(Buffer.from(e.data, 'base64'));
	cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => {});
});

const pause = (ms) => page.waitForTimeout(ms);
let souris = { x: 1500, y: 980 };
async function aller(x, y, ms = 600) {
	const n = Math.max(8, Math.round(ms / 16));
	const a = { ...souris };
	for (let i = 1; i <= n; i++) {
		const k = i / n;
		const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; // ease-in-out : geste humain
		await page.mouse.move(a.x + (x - a.x) * e, a.y + (y - a.y) * e);
		await pause(16);
	}
	souris = { x, y };
}
async function clic(x, y, quoi, ms = 600) {
	await aller(x, y, ms);
	await pause(180);
	note(quoi);
	await page.mouse.down();
	await pause(90);
	await page.mouse.up();
}
async function touche(k, quoi) {
	if (quoi) note(quoi);
	await page.keyboard.press(k);
}
const etat = () =>
	page.evaluate(() => ({
		ecran,
		phase,
		vue,
		pc: PC.etat,
		sms: smsActif,
		fen: fenetre,
		min: Jeu.horloge ? Math.round(Jeu.horloge.minutes) : 0,
		file: typeof fileIncidents === 'function' ? fileIncidents().length : 0,
		tdj: !!TRANSITION_JOUR,
		tuto: !!tutoriel,
		cine: typeof CINE !== 'undefined' && CINE ? CINE.type : null,
		go: typeof GAMEOVER !== 'undefined' && !!GAMEOVER,
		sieste: !!enSieste,
		jour: Jeu.jourIndex,
		menu: MENU.actif,
		rapport: typeof RAPPORT !== 'undefined' && !!RAPPORT,
	}));

// ——— La partie ———
await page.goto(URL_JEU);
await page.waitForFunction(() => typeof MENU !== 'undefined' && typeof frameCount !== 'undefined' && frameCount > 30);
await page.mouse.move(souris.x, souris.y);
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
await pause(300);
note('menu principal');
await pause(2500);
await clic(470, 410, 'clic « Nouvelle partie »', 900);
await pause(1800);
await clic(196, 860, 'décoche « Prendre en main (guidé) »', 800);
await pause(900);
await clic(1550, 970, 'clic « Lancer la partie »', 900);
await pause(1600);
await clic(1370, 830, 'autorisations : clic « Jouer »', 700);
note('carton du jour (JOUR 1/6 — SEMAINE 1)');
await pause(4200);
note('téléphone : messages de Camille, cheffe de salle');
for (let i = 0; i < 6; i++) {
	const s = await etat();
	if (!s.sms) break;
	await pause(1300);
	await touche('Enter', 'message suivant');
}
await pause(1500);
if ((await etat()).tuto) {
	await aller(430, 892, 700);
	await pause(800);
	await touche('Escape', 'tutoriel passé (Échap)');
}
await pause(500);
note('vue du bureau : salle de contrôle, PC, horloge, téléphone');
if (!SEMAINE) {
	await aller(1300, 600, 1400);
	await pause(800);
	await aller(965, 420, 1200);
	await pause(1600);
}
await clic(965, 390, 'clic sur l’écran du PC → appli Carte');
await pause(2600);
if (!SEMAINE) {
// Premier dossier : affluence (lieu non localisé, regroupé en bas à gauche de la carte)
if ((await etat()).file) {
	await clic(303, 928, 'clic sur le signalement (carte)', 1000);
	await pause(3200);
	note('dossier ouvert : réponses possibles');
	await touche('Escape', 'dossier refermé pour envoyer une équipe');
	await pause(600);
	await aller(1543, 245, 900);
	await pause(300);
	note('glisser l’équipe Police vers le signalement');
	await page.mouse.down();
	await aller(900, 620, 700);
	await aller(303, 928, 700);
	await pause(250);
	await page.mouse.up();
	note('équipe Police en route');
	await pause(1800);
	await clic(303, 928, 'rouvre le dossier', 800);
	await pause(1600);
	await aller(1120, 612, 700);
	await pause(700);
	await touche('1', 'choix de la réponse 1 → jauges');
	await pause(3200);
	await clic(1116, 848, 'clic « Dossier suivant »', 700);
	await pause(1200);
}
// Les applis du poste
await clic(189, 265, 'appli Mails', 900);
await pause(3000);
await clic(189, 370, 'appli Community', 700);
await pause(3000);
await clic(189, 470, 'appli Journal', 700);
await pause(2800);
await clic(189, 570, 'appli Données', 700);
await pause(2800);
await clic(189, 170, 'retour à la Carte', 700);
await pause(1500);
}

// ——— Le reste de la semaine : gestes au clavier, curseur sur les répliques ———
let dernier = '';
let choix = 0;
const fin = Date.now() + MAX_S * 1000;
while (Date.now() < fin) {
	const s = await etat();
	const cle = [s.ecran, s.phase, s.vue, s.pc, s.sms, s.fen, s.tdj, s.tuto, s.cine, s.go, s.sieste, s.jour, s.menu, s.rapport].join('|');
	if (cle !== dernier) note(`état ${cle} · ${Math.floor(s.min / 60)}h${String(s.min % 60).padStart(2, '0')} · file ${s.file}`);
	dernier = cle;
	if (s.go || s.cine || s.menu) break;
	if (s.phase === 'fin') {
		if (s.fen === 'rapport') {
			note('rapport de fin de semaine ouvert');
			await pause(5000);
			for (let p = 0; p < 2; p++) {
				await page.evaluate(() => typeof changerPageRapport === 'function' && changerPageRapport(1));
				note('rapport : page suivante');
				await pause(4000);
			}
			break;
		}
		if (s.fen === 'mailFin') {
			await pause(3500);
			await touche('Escape', 'mail de fin lu');
		} else {
			await pause(2500);
			await page.evaluate(() => ouvrirRapport());
			note('ouvre le rapport posé sur la table');
		}
		await pause(1500);
		continue;
	}
	if (s.tdj) {
		await pause(800);
		continue;
	}
	if (s.sieste && (s.min >= 1200 || s.file)) {
		await touche('Enter', 'réveil');
	} else if (s.sms) {
		await pause(1000);
		await touche('Enter', 'message suivant');
	} else if (s.tuto) {
		await touche('Escape');
	} else if (s.fen) {
		await pause(2200);
		await touche(s.fen === 'tache' ? 'Escape' : 'Escape', `fenêtre ${s.fen} fermée`);
	} else if (s.phase === 'selection' && s.vue === 'bureau') {
		await clic(965, 390, 'clic sur l’écran du PC', 700);
	} else if (s.phase === 'selection') {
		await touche('Enter', 'prend le signalement suivant');
	} else if (s.phase === 'decision') {
		await pause(1400);
		const n = 1 + (choix++ % 2);
		await aller(1120, 612 + (n - 1) * 42, 500);
		await pause(300);
		await touche(String(n), `réponse ${n}`);
		await pause(2000);
	} else if (s.phase === 'contradiction' || s.phase === 'conflit') {
		await pause(1500);
		await touche('a', `${s.phase} : choix A`);
	} else if (s.phase === 'narration') {
		await pause(1500);
		await touche('Enter', 'dossier suivant');
	} else if (s.phase === 'mail' || s.phase === 'soir') {
		await pause(2500);
		await touche('q', `${s.phase} : quitter la journée (Q)`);
	} else if (s.phase === 'reveil') {
		await touche('Enter', 'réveil');
	} else if (s.phase === 'attente') {
		if (s.min >= 1200 && !s.sieste) await touche('q', 'fin de service : quitter la journée (Q)');
		else if (!s.sieste && s.pc === 'appli' && !s.file) await touche('z', 'rien à traiter : sieste (Z), le temps file ×100');
		else if (s.pc !== 'appli' && s.vue === 'bureau') await pause(500);
	}
	await pause(700);
}
await pause(1000);
await cdp.send('Page.stopScreencast');
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
writeFileSync(resolve(CLIPS, SEMAINE ? 'partie-semaine.log.json' : 'partie-complete.log.json'), JSON.stringify(journal, null, 1));
await browser.close();
console.log('→', sortie);
