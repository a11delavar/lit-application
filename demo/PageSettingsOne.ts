import { component, html } from '@a11d/lit'
import { PageComponent, route } from '@a11d/lit-application'
import { PageSettings } from './PageSettings.js'

@component('demo-page-settings-one')
@route(PageSettings, '/settings/one', '/settings/1')
export class PageSettingsOne extends PageComponent {
	protected override get template() {
		return html`
			<lit-page heading='Settings One'>
				Settings Page > One
			</lit-page>
		`
	}
}