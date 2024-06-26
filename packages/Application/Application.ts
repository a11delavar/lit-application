import { property, css, html, state } from '@a11d/lit'
import { RootCssInjectorController } from '@a11d/root-css-injector'
import { NonInertableComponent } from '@a11d/non-inertable-component'
import { HookSet, PageError, RouterController } from './index.js'
import { HttpErrorCode, queryInstanceElement } from './utilities/index.js'
import { ApplicationTopLayer } from './ApplicationTopLayer.js'

export const application = () => {
	return <T extends Application>(ApplicationConstructor: Constructor<T>) => {
		if (!(ApplicationConstructor as unknown as typeof Application).instance) {
			document?.body.appendChild(new ApplicationConstructor)
		}
	}
}

export abstract class Application extends NonInertableComponent {
	static readonly connectingHooks = new HookSet()
	static readonly beforeRouteHooks = new HookSet()

	static get topLayer() { return ApplicationTopLayer.instance }

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
				flex: 1;
				margin: auto;
				width: 100%;
				max-width: var(--lit-application-page-host-max-width, 2560px);
			}

			lit-page-host > * {
				padding: max(min(1rem, 1vw), min(1rem, 1vh));
			}
		`
	}

	@property({ updated(this: Application) { document.title = this.documentTitle } }) pageHeading?: string

	readonly router = new RouterController(this, [],
		{
			fallback: {
				render: () => new PageError({ error: HttpErrorCode.NotFound })
			}
		}
	)

	protected readonly rootCssInjector = new RootCssInjectorController(this, (this.constructor as any).styles)

	@state() private shallRenderRouter = false

	protected override createRenderRoot() {
		return this
	}

	override async connectedCallback() {
		this.setAttribute('application', '')
		await Application.connectingHooks.execute()
		super.connectedCallback()
		window?.dispatchEvent(new Event('Application.connected'))
	}

	protected override async initialized() {
		window?.dispatchEvent(new Event('Application.initialized'))
		await Application.beforeRouteHooks.execute()
		this.shallRenderRouter = true
		await this.updateComplete
		window?.dispatchEvent(new Event('Application.routed'))
	}

	protected get documentTitle() {
		return [this.pageHeading, manifest?.short_name].filter(Boolean).join(' | ')
	}

	protected override get template() {
		return html`
			${this.bodyTemplate}
		`
	}

	protected get bodyTemplate() {
		return html`
			${this.pageHostTemplate}
			${this.topLayerTemplate}
		`
	}

	protected get pageHostTemplate() {
		return html`
			<lit-page-host @pageHeadingChange=${(e: CustomEvent<string>) => this.pageHeading = e.detail}>
				${!this.shallRenderRouter ? this.pageLoadingTemplate : this.router.outlet()}
			</lit-page-host>
		`
	}

	protected get pageLoadingTemplate() {
		return html.nothing
	}

	protected get topLayerTemplate() {
		return html`<lit-application-top-layer></lit-application-top-layer>`
	}
}