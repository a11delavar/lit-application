import { component, html } from '@a11d/lit'
import { PageComponent, route } from './index.js'
import { PageSettings } from './PageSettings.js'

@component('demo-page-settings-two')
@route(PageSettings, '/settings/two', '/settings/2')
export class PageSettingsTwo extends PageComponent {
	protected override get template() {
		return html`
			<lit-page heading='Settings Two'>
				Settings Page > Two
			</lit-page>
		`
	}
}