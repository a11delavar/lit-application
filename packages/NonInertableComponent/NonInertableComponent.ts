import { Component } from '@a11d/lit'

/**
 * Removes any `inert` attribute set on the component, so it stays interactive while the elements around it are made inert.
 *
 * @example
 * ```ts
 * import { component, html } from '@a11d/lit'
 * import { NonInertableComponent } from '@a11d/non-inertable-component'
 *
 * @component('app-toast')
 * export class Toast extends NonInertableComponent {
 * 	protected override get template() {
 * 		return html`<slot></slot>`
 * 	}
 * }
 * ```
 */
export abstract class NonInertableComponent extends Component {
	static override get observedAttributes() {
		return [...super.observedAttributes, 'inert']
	}

	override attributeChangedCallback(name: string, old: string | null, value: string | null) {
		if (name === 'inert' && value !== null) {
			this.removeAttribute('inert')
		}
		super.attributeChangedCallback(name, old, value)
	}
}