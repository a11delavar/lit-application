import { component, html } from '@a11d/lit'
import { NotificationComponent, PageComponent, PageSettings, route, viewTransitionName } from './index.js'
import { DialogSample } from './DialogSample.js'

@component('demo-page-home')
@route('/')
export class PageHome extends PageComponent {
	protected override get template() {
		return html`
			<lit-page heading='Home 4' fullHeight>
				<div ${viewTransitionName('square')} style='width: 100px; height: 100px; background: red; background-image: url("https://camo.githubusercontent.com/c2fd2f94aa55544327fc8ed8901aedb2eec8e3535243452b43646eb8086efe1a/68747470733a2f2f796176757a63656c696b65722e6769746875622e696f2f73616d706c652d696d616765732f696d6167652d34342e6a7067")'></div>
				<div>
					<h1 ${viewTransitionName('heading')}>Home Page</h1>
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