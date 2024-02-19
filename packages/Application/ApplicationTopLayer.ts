import { Component, component, css, html, queryConnectedInstances } from '@a11d/lit'

@component('lit-application-top-layer')
export class ApplicationTopLayer extends Component {
	@queryConnectedInstances() private static readonly instances: Set<ApplicationTopLayer>

	static get instance() {
		const instances = [...ApplicationTopLayer.instances]
		return instances[instances.length - 1] ?? document.body
	}

	override get template() {
		return html`<slot></slot>`
	}

	static override get styles() {
		return css`
			:host {
				position: fixed !important;
				width: 0px !important;
				height: 0px !important;
				margin: 0px !important;
				padding: 0px !important;
				z-index: 9999 !important;
			}
		`
	}

	override disconnectedCallback() {
		const children = this.children
		super.disconnectedCallback()
		for (const element of children) {
			ApplicationTopLayer.instance.appendChild(element)
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lit-application-top-layer': ApplicationTopLayer
	}
}