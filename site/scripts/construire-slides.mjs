// Prompt 82 : la page /presentation/ est le build statique Slidev du deck slides/slides.md (dossier slides/ à la racine).
// Si Slidev est installé (cd slides && npm install), le deck est reconstruit dans site/public/presentation/ ;
// sinon (CI, hors ligne), le build déjà présent dans le dépôt est conservé. Les fichiers propres à Netlify
// (_redirects, 404.html) sont retirés : routeur en mode hash, une seule page servie.
import { existsSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const slides = fileURLToPath(new URL('../../slides/', import.meta.url));
const sortie = fileURLToPath(new URL('../public/presentation/', import.meta.url));
if (existsSync(slides + 'node_modules/.bin/slidev')) {
	rmSync(sortie, { recursive: true, force: true }); // Slidev ne vide pas un dossier de sortie hors de son projet
	execSync('npm run build', { cwd: slides, stdio: 'inherit' });
} else if (!existsSync(sortie + 'index.html')) {
	throw new Error('presentation : ni Slidev installé (slides/), ni build présent dans public/presentation/');
} else console.log('presentation : Slidev non installé, build du dépôt conservé');
for (const f of ['_redirects', '404.html']) rmSync(sortie + f, { force: true });
