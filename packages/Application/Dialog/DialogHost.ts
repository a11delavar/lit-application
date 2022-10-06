import { Component, component } from '@a11d/lit'
import { queryInstanceElement } from '../index.js'

@component('lit-dialog-host')
export class DialogHost extends Component {
	@queryInstanceElement() static readonly instance: DialogHost | undefined

	protected override createRenderRoot() { return this }
}

declare global {
	interface HTMLElementTagNameMap {
		'lit-dialog-host': DialogHost
	}
}