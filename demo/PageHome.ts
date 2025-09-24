import { component, html } from '@a11d/lit'
import { NotificationComponent, PageComponent, PageSettings, route } from './index.js'
import { DialogSample } from './DialogSample.js'

@component('demo-page-home')
@route('/')
export class PageHome extends PageComponent {
	protected override get template() {
		return html`
			<lit-page heading='Home 4' fullHeight>
				<div>
					<h1>Home Page</h1>
					<button @click=${this.confirmDialog}>Open sample dialog</button>
					<button @click=${this.openPage}>Open sample page of sub router</button>
					<button @click=${this.sendNotification}>Send sample notification</button>
				</div>
			</lit-page>
		`
	}

	private async confirmDialog() {
		const result1 = await new DialogSample({ message: 'Message 1' }).navigate()
		NotificationComponent.notifySuccess(`The result was "${result1}"`)
	}

	private async openPage() {
		await new PageSettings({ subRoute: 'one' }).navigate()
	}

	private sendNotification() {
		NotificationComponent.notifySuccess('This is a sample notification')
	}
}