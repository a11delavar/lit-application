import { Component, component, html, style } from '@a11d/lit'
import { queryInstanceElement } from '../utilities/index.js'

@component('lit-page-host')
export class PageHost extends Component {
	@queryInstanceElement() static readonly instance: PageHost | undefined

	protected override get template() {
		return html`
			<div part='pageHolder' ${style({
				display: 'grid',
				maxWidth: 'var(--lit-page-host-max-width, 2560px)',
				margin: 'auto',
				justifyContent: 'stretch',
				height: '100%',
			})}>
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