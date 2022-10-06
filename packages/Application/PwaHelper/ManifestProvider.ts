import { Application, type Manifest } from '../index.js'

Application.connectedHooks.add(async () => {
	let manifest = undefined
	const manifestLink = globalThis.document.head.querySelector<HTMLLinkElement>('link[rel=manifest]')

	try {
		if (manifestLink) {
			const content = await fetch(manifestLink.href)
			const jsonText = await content.text()
			manifest = JSON.parse(jsonText)
		}
	} catch {
		// @ts-expect-error - This is declared as a constant property
		globalThis.manifest = manifest
	}
})


declare global {
	// eslint-disable-next-line
	const manifest: Manifest | undefined
}