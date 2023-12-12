import { CSSResult, isServer } from '@a11d/lit'

export class RootCssInjector {
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