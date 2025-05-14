import { component, html, state } from '@a11d/lit'
import { PageComponent, route } from './index.js'
import { PageSettings } from './PageSettings.js'

@component('demo-page-settings-one')
@route(PageSettings, '/settings/one', '/settings/1')
export class PageSettingsOne extends PageComponent {
	@state() count = 0

	protected override get template() {
		return html`
			<lit-page heading='Settings One'>
				Settings Page > One ${new Date().toLocaleString()}
				<button @click=${() => { this.count++; this.requestUpdate() }}>Count: ${this.count}</button>
			</lit-page>
		`
	}
}