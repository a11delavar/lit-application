import { Component, property, css, html } from '@a11d/lit'
import { HookSet, PageError, RootCssInjectorController, Router, RouterController } from './index.js'
import { HttpErrorCode, queryInstanceElement } from './utilities/index.js'

export const application = () => {
	return <T extends Application>(ApplicationConstructor: Constructor<T>) => {
		setTimeout(() => {
			const application = new ApplicationConstructor
			window.document.body.appendChild(application)
			application.setAttribute('application', '')
		})
	}
}

export abstract class Application extends Component {
	static readonly connectedHooks = new HookSet()

	@queryInstanceElement() static readonly instance: Application | undefined

	static override get styles() {
		return css`
			:root { color-scheme: light dark; }

			html, body, [application] {
				min-height: 100vh;
				margin: 0;
				padding: 0;
				scrollbar-width: thin;
			}

			::-webkit-scrollbar {
				width: 5px;
				height: 5px;
			}

			::-webkit-scrollbar-thumb {
				background: rgba(128, 128, 128, 0.75);
			}

			lit-page-host {
				display: grid;
				justify-content: start;
				min-height: 100vh;
			}
		`
	}

	@property({ updated(this: Application) { document.title = [this.pageHeading, manifest?.short_name].filter(Boolean).join(' | ') } }) pageHeading?: string

	readonly router = new RouterController(this,
		[...Router.pageByRoute].map(([route, page]) => ({ path: route, render: params => new page(params) })),
		{
			fallback: {
				render: () => new PageError({ error: HttpErrorCode.NotFound })
			}
		}
	)

	protected readonly rootCssInjector = new RootCssInjectorController(this, (this.constructor as any).styles)

	protected override async connected() {
		await Application.connectedHooks.execute()
		window.dispatchEvent(new Event('Application.connected'))
	}

	protected override initialized() {
		window.dispatchEvent(new Event('Application.initialized'))
	}

	protected override createRenderRoot() {
		return this
	}

	protected override get template() {
		return html`
			${this.notificationHostTemplate}
			${this.bodyTemplate}
			${this.dialogHostTemplate}
		`
	}

	protected get notificationHostTemplate() {
		return html`<lit-notification-host></lit-notification-host>`
	}

	protected get bodyTemplate() {
		return html`
			${this.pageHostTemplate}
		`
	}

	protected get pageHostTemplate() {
		return html`
			<lit-page-host @pageHeadingChange=${(e: CustomEvent<string>) => this.pageHeading = e.detail}>
				${this.router.outlet()}
			</lit-page-host>
		`
	}

	protected get dialogHostTemplate() {
		return html`<lit-dialog-host></lit-dialog-host>`
	}
}