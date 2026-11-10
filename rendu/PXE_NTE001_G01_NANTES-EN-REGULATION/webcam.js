/* Nantes en régulation — prompt 57 : webcam du poste, détection de présence, sieste.
 * Activation : clic sur la webcam posée sur l'écran, ou option « Webcam » (Paramètres → Accessibilité).
 * getUserMedia({ video }) n'est appelé qu'à ce geste. Les images sont réduites à 48 × 27 dans un canevas
 * hors écran, jamais affichées, enregistrées ni envoyées : on n'en lit que deux valeurs, la luminance de la
 * zone centrale et la différence avec l'image précédente (mouvement). Mouvement faible pendant 8 s (ou caméra
 * masquée / noire) → joueur « parti » → la sieste du prompt 20 se déclenche (même état, mêmes règles).
 * Refus ou absence : repli silencieux (sieste sur inactivité seule), « Webcam indisponible ».
 */
const CAM = {
	active: false, // flux en cours
	video: null,
	flux: null,
	canevas: null,
	ctx: null,
	precedente: null,
	minuterie: null,
	luminance: 0,
	mouvement: 0,
	absentDepuis: 0, // millis() du début de l'absence (0 = présent)
	refus: false,
};
const CAM_L = 48;
const CAM_H = 27;
const CAM_ABSENCE_MS = 8000;
const CAM_SEUIL_PIXEL = 20; // prompt 64 : un pixel « change » s'il varie de plus de 20 niveaux (le bruit du capteur reste en dessous)
const CAM_SEUIL_MOUVEMENT = 0.6; // % de l'image qui change en ~1,2 s : en dessous, scène figée (personne)
const CAM_SEUIL_LUMINANCE = 18; // zone centrale presque noire : caméra masquée
const CAM_SEUIL_GESTE = 25; // % de l'image qui change : geste ample (main levée), bien au-dessus d'une présence calme
const webcamAutorisee = () => Confort.Reglages.webcam === true;

async function activerWebcam() {
	if (CAM.active) return true;
	try {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('getUserMedia absent');
		CAM.flux = await navigator.mediaDevices.getUserMedia({ video: { width: 160, height: 90, facingMode: 'user' }, audio: false });
	} catch (e) {
		CAM.refus = true;
		CAM.flux = null;
		PIECE.message = { texte: t('webcam.indisponible'), objet: 'webcam', jusqua: millis() + 4000 };
		annoncer(t('webcam.indisponible'));
		return false;
	}
	CAM.video = document.createElement('video'); // jamais ajoutée à la page : aucune image affichée
	CAM.video.muted = true;
	CAM.video.playsInline = true;
	CAM.video.srcObject = CAM.flux;
	try {
		await CAM.video.play();
	} catch (e) {}
	CAM.canevas = document.createElement('canvas');
	CAM.canevas.width = CAM_L;
	CAM.canevas.height = CAM_H;
	CAM.ctx = CAM.canevas.getContext('2d', { willReadFrequently: true });
	CAM.precedente = null;
	CAM.historique = [];
	CAM.absentDepuis = 0;
	CAM.active = true;
	CAM.minuterie = setInterval(analyserImage, 400); // hors draw
	annoncer(t('webcam.on'));
	return true;
}
function couperWebcam() {
	const etait = CAM.active;
	clearInterval(CAM.minuterie);
	CAM.minuterie = null;
	if (CAM.flux) CAM.flux.getTracks().forEach((p) => p.stop()); // la caméra s'éteint (voyant du navigateur aussi)
	CAM.flux = null;
	CAM.video = null;
	CAM.active = false;
	CAM.absentDepuis = 0;
	if (etait) annoncer(t('webcam.off'));
}
/** Objet « webcam du poste » : active ou coupe */
async function clicWebcam() {
	interaction();
	if (CAM.active) {
		Confort.Reglages.choisir('webcam', false);
		return couperWebcam();
	}
	Confort.Reglages.choisir('webcam', true);
	if (!(await activerWebcam())) Confort.Reglages.choisir('webcam', false);
}
/** Option des Paramètres (touche 5 de la fenêtre Accessibilité) */
function basculerWebcamReglage() {
	if (webcamAutorisee() || CAM.active) {
		Confort.Reglages.choisir('webcam', false);
		couperWebcam();
		return;
	}
	clicWebcam();
}

// ——— Analyse d'une image (48 × 27, niveaux de gris) ———
function analyserImage() {
	const v = CAM.video;
	if (!v || (v.readyState !== undefined && v.readyState < 2)) return;
	CAM.ctx.drawImage(v, 0, 0, CAM_L, CAM_H);
	const px = CAM.ctx.getImageData(0, 0, CAM_L, CAM_H).data;
	const gris = new Uint8Array(CAM_L * CAM_H);
	for (let i = 0; i < gris.length; i++) gris[i] = (px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114) | 0;
	// Luminance de la zone centrale (là où est le visage) et mouvement (différence moyenne avec l'image précédente)
	let s = 0;
	let n = 0;
	for (let y = 6; y < 21; y++)
		for (let x = 14; x < 34; x++) {
			s += gris[y * CAM_L + x];
			n++;
		}
	CAM.luminance = s / n;
	// Prompt 64 : mouvement = PART des pixels qui changent nettement (> 20 niveaux) par rapport à l'image d'il y a
	// ~1,2 s. Une moyenne de toutes les différences était dépassée par le seul bruit du capteur et les variations
	// d'exposition d'une vraie webcam : une chaise vide paraissait toujours occupée, la sieste ne venait jamais.
	CAM.historique = CAM.historique || [];
	const ref = CAM.historique.length >= 3 ? CAM.historique[0] : null;
	let changes = 0;
	if (ref) for (let i = 0; i < gris.length; i++) if (Math.abs(gris[i] - ref[i]) > CAM_SEUIL_PIXEL) changes++;
	CAM.mouvement = ref ? (changes * 100) / gris.length : 100; // en % de l'image
	CAM.historique.push(gris);
	if (CAM.historique.length > 3) CAM.historique.shift();
	CAM.precedente = gris;
	// Prompt 63 : pendant le réveil, un grand mouvement (lever la main devant la caméra) vaut « Se réveiller »
	if (phase === 'reveil' && CAM.mouvement > CAM_SEUIL_GESTE && typeof seReveiller === 'function') {
		seReveiller();
		annoncer(t('webcam.geste'));
	}
	const absent = CAM.mouvement < CAM_SEUIL_MOUVEMENT || CAM.luminance < CAM_SEUIL_LUMINANCE;
	if (!absent) CAM.absentDepuis = 0;
	else if (!CAM.absentDepuis) CAM.absentDepuis = millis();
}
/** Le joueur est-il parti (absence continue ≥ 8 s) ? Lu par avancerTemps (immersion.js) */
function joueurParti() {
	return CAM.active && CAM.absentDepuis > 0 && millis() - CAM.absentDepuis >= CAM_ABSENCE_MS;
}

// ——— Dessin : webcam sur le haut de l'écran, LED rouge quand elle filme ———
function dessinerWebcamPoste(g) {
	const x = Math.round(ECRAN_PC.x + ECRAN_PC.l / 2 - 6);
	const y = ECRAN_PC.y - 6;
	boite(g, x, y, 12, 5, '#22262b', '#3a3f46', '#15181b');
	px(g, '#0b0d10', x + 5, y + 1, 3, 3); // objectif
	px(g, '#5b8fd6', x + 6, y + 2, 1, 1); // reflet
	px(g, CAM.active ? '#ff3b30' : '#3a2020', x + 10, y + 2, 1, 1); // LED : allumée tant que la webcam est active
}
/** Indicateur « CAM » dans la barre des tâches de RégulOS (après les icônes) */
function indicateurWebcamBarre(x, y) {
	if (!CAM.active) return;
	noStroke();
	fill('#ff3b30');
	circle(x + 8, y + 16, 14);
	dsTexte(t('webcam.barre'), x + 24, y + 4, 20, DS.blanc, 'left');
}
// Réglage « Webcam » mémorisé : la caméra se rallume au premier geste du joueur (jamais au chargement)
['pointerdown', 'keydown'].forEach((ev) =>
	document.addEventListener(
		ev,
		() => {
			if (webcamAutorisee() && !CAM.active && !CAM.refus) activerWebcam();
		},
		{ once: true },
	),
);
