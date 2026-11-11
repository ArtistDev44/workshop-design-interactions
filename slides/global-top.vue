<!-- Annonce du numéro de diapositive aux lecteurs d'écran (aria-live), visuellement masquée -->
<template>
	<div class="sr-only" aria-live="polite" aria-atomic="true">Diapositive {{ $nav.currentPage }} sur {{ $nav.total }}</div>
</template>
