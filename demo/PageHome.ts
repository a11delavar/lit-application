import { component, html } from '@a11d/lit'
import { PageComponent, route } from './index.js'
import { DialogSample } from './DialogSample.js'
import { PageSubRouter } from './PageSubRouter.js'

@component('lit-page-home')
@route('/')
export class PageHome extends PageComponent {
	protected override get template() {
		return html`
			<lit-page heading='Home' fullHeight>
				<div>
					<h1>Home Page</h1>
					<button @click=${this.confirmDialog}>Open sample dialog</button>
					<button @click=${this.openPage}>Open sample page of sub router</button>
				</div>
			</lit-page>
		`
	}

	private async confirmDialog() {
		const result1 = await new DialogSample({ message: 'Message 1' }).confirm()
		notificationHost.notifySuccess(`The result was "${result1}"`)
	}

	private async openPage() {
		await new PageSubRouter({ subRoute: 'a' }).navigate()
	}
}