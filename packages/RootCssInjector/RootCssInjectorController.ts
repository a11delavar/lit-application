import { CSSResult, ReactiveController, ReactiveControllerHost } from '@a11d/lit'
import { RootCssInjector } from './RootCssInjector.js'

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