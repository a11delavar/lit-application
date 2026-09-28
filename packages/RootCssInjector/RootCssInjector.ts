import { type CSSResult, isServer } from '@a11d/lit'

/**
 * Injects styles into the document head, where they apply to the whole document rather than to a single shadow root.
 *
 * @example
 * ```ts
 * import { Component, component, css } from '@a11d/lit'
 * import { RootCssInjector, RootCssInjectorController } from '@a11d/root-css-injector'
 *
 * RootCssInjector.inject(css`
 * 	:root {
 * 		--app-accent-color: teal;
 * 	}
 * `)
 *
 * @component('app-shell')
 * export class Shell extends Component {
 * 	protected readonly rootCss = new RootCssInjectorController(this, css`body { margin: 0; }`)
 * }
 * ```
 */
export class RootCssInjector {
	/** Writes `styles` into `styleElement`, or a new `<style>` element, appends it to the head and returns it; on the server, it does nothing. */
	static inject(styles: CSSResult, styleElement?: HTMLStyleElement) {
		if (isServer) {
			return
		}

		styleElement ??= document.createElement('style')
		styleElement.innerHTML = styles.cssText
		document.head.appendChild(styleElement)
		return styleElement
	}
}