import { type CSSResult, type ReactiveController, type ReactiveControllerHost } from '@a11d/lit'
import { RootCssInjector } from './RootCssInjector.js'

/** Injects styles into the document head while its host is connected and removes them once it disconnects. */
export class RootCssInjectorController implements ReactiveController {
	private readonly styleElement = document.createElement('style')

	constructor(root: ReactiveControllerHost, protected readonly rootStyle: CSSResult) {
		root.addController(this)
	}

	hostConnected() {
		RootCssInjector.inject(this.rootStyle, this.styleElement)
	}

	hostDisconnected() {
		this.styleElement?.remove()
	}
}