import { Application } from '../Application.js'
import type { Manifest } from './Manifest.js'

Application?.connectingHooks.add(async () => {
	// @ts-expect-error - This is declared as a constant property
	globalThis.manifest = undefined
	const manifestLink = globalThis.document.head.querySelector<HTMLLinkElement>('link[rel=manifest]')

	try {
		if (manifestLink) {
			const content = await fetch(manifestLink.href)
			const jsonText = await content.text()
			// @ts-expect-error - This is declared as a constant property
			globalThis.manifest = JSON.parse(jsonText)
		}
	} catch {
		// Ignore
	}
})


declare global {
	// eslint-disable-next-line
	const manifest: Manifest | undefined
}