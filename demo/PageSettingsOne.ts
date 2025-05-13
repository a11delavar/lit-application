import { component, html } from '@a11d/lit'
import { PageComponent, route } from './index.js'
import { PageSettings } from './PageSettings.js'

@component('demo-page-settings-one')
@route(PageSettings, '/settings/one', '/settings/1')
export class PageSettingsOne extends PageComponent {
	protected override get template() {
		return html`
			<lit-page heading='Settings One'>
				Settings Page > One ${new Date().toLocaleString()}
			</lit-page>
		`
	}
}