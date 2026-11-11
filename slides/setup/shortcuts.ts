// Accessibilité (prompt 82) : Début / Fin en plus des flèches ← → de Slidev
import { defineShortcutsSetup } from '@slidev/types'

export default defineShortcutsSetup((nav, base) => [
	...base,
	{ key: 'home', fn: () => nav.goFirst(), autoRepeat: false },
	{ key: 'end', fn: () => nav.goLast(), autoRepeat: false },
])
