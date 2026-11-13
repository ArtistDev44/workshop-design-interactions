/* Nantes en régulation — webcam du poste (prompt 57, revu aux prompts 64 et 67).
 * Activation : clic sur la webcam posée sur l'écran, ou option « Webcam » (Paramètres → Accessibilité) ;
 * getUserMedia({ video }) n'est appelé qu'à ce geste. Les images sont réduites à 48 × 27 dans un canevas hors
 * écran, jamais affichées, enregistrées ni envoyées. On en lit : le mouvement (part des pixels qui changent
 * nettement en ~1,2 s) et la part de pixels couleur peau.
 * Prompt 67 : une MAIN montrée devant la caméra lance la sieste, la montrer de nouveau l'interrompt. L'absence
 * devant la caméra ne déclenche plus rien. Refus ou absence de caméra : repli silencieux.
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
const CAM_SEUIL_PIXEL = 20; // prompt 64 : un pixel « change » s'il varie de plus de 20 niveaux (le bruit du capteur reste en dessous)
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
	detecterMain(px); // prompt 67 : une main devant la caméra lance ou interrompt la sieste
}

// ——— Dessin : webcam sur le haut de l'écran, LED rouge quand elle filme ———
function dessinerWebcamPoste(g) {
	const x = Math.round(ECRAN_PC.x + ECRAN_PC.l / 2 - 6);
	const y = ECRAN_PC.y - 6;
	boite(g, x, y, 12, 5, '#22262b', '#3a3f46', '#15181b');
	px(g, '#0b0d10', x + 5, y + 1, 3, 3); // objectif
	px(g, '#5b8fd6', x + 6, y + 2, 1, 1); // reflet
	const mainVue = CAM.active && millis() - MAIN.vue < 1000; // prompt 67 : témoin vert quand une main est reconnue
	px(g, mainVue ? '#00e070' : CAM.active ? '#ff3b30' : '#3a2020', x + 10, y + 2, 1, 1); // LED : allumée tant que la webcam est active
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

// ——— Prompt 67 : reconnaître une main (couleur peau, localement) pour lancer ou interrompre la sieste ———
// Pixels « peau » repérés en YCbCr (Cb 77–127, Cr 133–173, seuils classiques). Le visage, à distance normale,
// occupe une part stable de l'image (niveau de base, suivi lentement) ; une main levée près de la caméra fait
// bondir cette part et bouge : main reconnue. Anti-rebond : 2 s, et il faut retirer la main avant de recommencer.
const MAIN = { base: null, armee: true, derniere: 0, vue: 0, peau: 0 };
const MAIN_SAUT = 15; // points de % de peau au-dessus du niveau de base
const MAIN_MIN = 25; // % de l'image au minimum
const MAIN_MOUVEMENT = 8; // % de l'image qui bouge (la main arrive)
function partPeau(px) {
	let n = 0;
	const total = px.length / 4;
	for (let i = 0; i < px.length; i += 4) {
		const r = px[i];
		const g = px[i + 1];
		const b = px[i + 2];
		const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
		const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
		if (cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173) n++;
	}
	return (n * 100) / total;
}
function detecterMain(px) {
	const f = partPeau(px);
	MAIN.peau = f;
	if (MAIN.base === null) MAIN.base = f;
	const main = f >= MAIN_MIN && f - MAIN.base >= MAIN_SAUT;
	if (!main) {
		MAIN.base += (f - MAIN.base) * 0.08; // le niveau de base suit lentement la scène (visage, lumière)
		if (f - MAIN.base < MAIN_SAUT / 2) MAIN.armee = true; // main retirée : prêt pour le geste suivant
		return;
	}
	if (!MAIN.armee || CAM.mouvement < MAIN_MOUVEMENT || millis() - MAIN.derniere < 2000) return;
	MAIN.armee = false;
	MAIN.derniere = millis();
	MAIN.vue = millis();
	basculerSiesteMain();
}
/** Main reconnue : endormi → réveil ; éveillé → sieste */
function basculerSiesteMain() {
	if (ecran !== 'jeu' || !Jeu.horloge || MENU.actif || fenetre || smsActif || phase === 'fin' || phase === 'soir') return; // prompt 69 : pas de sieste le soir
	// Prompt 78 : même sieste que la jauge de somnolence (temps ×100, bilan au réveil)
	if (enSieste) {
		basculerSieste();
		annoncer(t('webcam.main.reveil'));
	} else if (dormir(true)) annoncer(t('webcam.main.sieste'));
}
