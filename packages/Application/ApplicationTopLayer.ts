import { Component, component, css, html } from '@a11d/lit'
import { queryConnectedInstances } from '@3mo/query-connected-instances'

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
				position: fixed;
				width: 0px;
				height: 0px;
				margin: 0px;
				padding: 0px;
			}
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lit-application-top-layer': ApplicationTopLayer
	}
}