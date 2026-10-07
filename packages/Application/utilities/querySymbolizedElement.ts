import { type LitElement } from '@a11d/lit'

/**
 * Decorates a property to return the element in the render root whose class is marked with the symbol.
 *
 * The property throws when no such element is rendered.
 */
export function querySymbolizedElement(symbol: symbol) {
	return (prototype: LitElement, propertyKey: string) => {
		Object.defineProperty(prototype, propertyKey, {
			get(this: LitElement) {
				const element = [...this.renderRoot?.querySelectorAll('*') ?? []]
					.find(element => symbol in element.constructor && (element.constructor as any)[symbol] === true)
				if (!element) {
					throw new Error(`${this.constructor.name}'s ${propertyKey} cannot be found.`)
				}
				return element
			},
		})
	}
}
