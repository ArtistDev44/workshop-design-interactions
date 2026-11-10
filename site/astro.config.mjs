// @ts-check
import { defineConfig } from 'astro/config';

// Site 100 % statique déployé à la racine du domaine (Cloudflare Pages, prompt 02).
// URL finale : https://workshop-design-interactions.pages.dev/
// Le déploiement sert dist/ à la racine du domaine : aucun préfixe de base.
// Le site est le jeu lui-même : public/index.html est servi à la racine (/).
// https://astro.build/config
export default defineConfig({
	output: 'static',
	site: 'https://workshop-design-interactions.pages.dev',
	base: '/',
	trailingSlash: 'ignore',
	// `npm run dev` / `npm run preview` ouvrent directement la racine du site (le jeu).
	server: { open: '/' },
	build: {
		// Toujours inliner les styles : garantit le rendu sur tout hôte.
		inlineStylesheets: 'always',
	},
});
