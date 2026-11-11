<!-- Prompt 94 : pied de page — numéro de diapositive, titre court, lien vers le jeu ; masqué sur les pages de titre -->
<template>
	<footer v-if="!['cover', 'section', 'end', 'intro'].includes($nav.currentLayout)" class="pied-deck">
		<span class="pied-titre">Nantes en régulation · PXE-NTE001</span>
		<a class="pied-lien" href="https://workshop-design-interactions.pages.dev/">workshop-design-interactions.pages.dev</a>
		<span class="pied-num"><SlideCurrentNo /> / <SlidesTotal /></span>
	</footer>
</template>
