import { component, html } from '@a11d/lit'
import { PageComponent, route } from '@a11d/lit-application'
import { PageSettings } from './PageSettings.js'

@component('demo-page-settings-two')
@route(PageSettings, '/settings/two', '/settings/2')
export class PageSettingsTwo extends PageComponent {
	protected override get template() {
		return html`
			Settings Page > Two
		`
	}
}