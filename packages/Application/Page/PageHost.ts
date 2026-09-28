import { Component, component, css, html } from '@a11d/lit'

/** The element hosting the current page, rendered by the application. */
@component('lit-page-host')
export class PageHost extends Component {
	static override get styles() {
		return css`
			:host {
				display: grid;
				grid-template-rows: 1fr;
				width: 100%;
			}
		`
	}

	protected override get template() {
		return html`<slot></slot>`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lit-page-host': PageHost
	}
}