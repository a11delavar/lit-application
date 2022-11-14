import { Component, property, css, html, nothing, state } from '@a11d/lit'
import { HookSet, PageError, RootCssInjectorController, RouterController } from './index.js'
import { HttpErrorCode, queryInstanceElement } from './utilities/index.js'

export const application = () => {
	return <T extends Application>(ApplicationConstructor: Constructor<T>) => {
		const application = new ApplicationConstructor
		window.document.body.appendChild(application)
	}
}

export abstract class Application extends Component {
	static readonly connectingHooks = new HookSet()

	@queryInstanceElement() static readonly instance?: Application

	static override get styles() {
		return css`
			:root { color-scheme: light dark; }

			html, body, [application] {
				margin: 0;
				padding: 0;
				scrollbar-width: thin;
				display: block;
				min-height: 100vh;
				min-height: 100dvh;
			}

			[application] {
				display: flex;
				flex-direction: column;
			}

			::-webkit-scrollbar {
				width: 5px;
				height: 5px;
			}

			::-webkit-scrollbar-thumb {
				background: rgba(128, 128, 128, 0.75);
			}

			lit-page-host {
				display: flex;
				flex: 1;
				margin: auto;
				width: 100%;
				max-width: var(--lit-application-page-host-max-width, 2560px);
			}
		`
	}

	@property({ updated(this: Application) { document.title = [this.pageHeading, manifest?.short_name].filter(Boolean).join(' | ') } }) pageHeading?: string

	readonly router = new RouterController(this, [],
		{
			fallback: {
				render: () => new PageError({ error: HttpErrorCode.NotFound })
			}
		}
	)

	protected readonly rootCssInjector = new RootCssInjectorController(this, (this.constructor as any).styles)

	override async connectedCallback() {
		await (this.constructor as typeof Application).connectingHooks.execute()
		super.connectedCallback()
		this.setAttribute('application', '')
		window.dispatchEvent(new Event('Application.connected'))
	}

	@state() protected renderRouter = false

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
		return html`${this.pageHostTemplate}`
	}

	protected get pageHostTemplate() {
		return html`
			<lit-page-host @pageHeadingChange=${(e: CustomEvent<string>) => this.pageHeading = e.detail}>
				${!this.renderRouter ? nothing : this.router.outlet()}
			</lit-page-host>
		`
	}

	protected get dialogHostTemplate() {
		return html`<lit-dialog-host></lit-dialog-host>`
	}
}