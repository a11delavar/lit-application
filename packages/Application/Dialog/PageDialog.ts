import { component, HTMLTemplateResult, state, staticHtml } from '@a11d/lit'
import { PageComponent } from '../Page/PageComponent.js'
import { route } from '../Router/route.js'

@route(PageDialog.route)
@component('lit-page-dialog')
export class PageDialog extends PageComponent {
	static readonly route = '/dialog'

	@state() heading = ''

	protected override get template() {
		return staticHtml`<${PageComponent.defaultPageElementTag} heading=${this.heading}></${PageComponent.defaultPageElementTag}>` as HTMLTemplateResult
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lit-page-dialog': PageDialog
	}
}