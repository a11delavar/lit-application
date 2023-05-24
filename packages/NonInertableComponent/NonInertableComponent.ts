import { Component } from '@a11d/lit'

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