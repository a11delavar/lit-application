import { Component, component, html, style } from '@a11d/lit'
import { queryInstanceElement } from '../utilities/index.js'

@component('lit-page-host')
export class PageHost extends Component {
	@queryInstanceElement() static readonly instance?: PageHost

	protected override get template() {
		return html`
			<div part='pageHolder' ${style({ display: 'grid', gridTemplateRows: '1fr', width: '100%' })}>
				<slot></slot>
			</div>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lit-page-host': PageHost
	}
}