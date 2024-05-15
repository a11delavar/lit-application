import { component, eventListener, HTMLTemplateResult, state, staticHtml } from '@a11d/lit'
import { PageComponent } from '../Page/PageComponent.js'
import { route } from '../Router/route.js'
import { DialogComponent } from './DialogComponent.js'
import { Router } from '../Router/Router.js'

@route(PageDialog.route)
@component('lit-page-dialog')
export class PageDialog extends PageComponent {
	static get route() {
		return `${Router.basePath}/dialog`
	}

	@state() heading = ''

	@eventListener({ target: window, type: 'dialogHeadingChange' })
	protected async handleDialogHeadingChange(e: CustomEvent<string>) {
		if (e.target instanceof DialogComponent) {
			await new Promise(resolve => setTimeout(resolve))
			if (e.target.dialogElement.boundToWindow === true) {
				this.heading = e.detail
			}
		}
	}

	protected override get template() {
		return staticHtml`<${PageComponent.defaultPageElementTag} heading=${this.heading}></${PageComponent.defaultPageElementTag}>` as HTMLTemplateResult
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lit-page-dialog': PageDialog
	}
}