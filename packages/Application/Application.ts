import { property, css, html, state } from '@a11d/lit'
import { RootCssInjectorController } from '@a11d/root-css-injector'
import { NonInertableComponent } from '@a11d/non-inertable-component'
import { HookSet, PageError, RouterController } from './index.js'
import { HttpErrorCode, queryInstanceElement } from './utilities/index.js'
import { ApplicationTopLayer } from './ApplicationTopLayer.js'

/** Appends an instance of the decorated `Application` subclass to the document body, unless one is already there. */
export const application = () => {
	return <T extends Application>(ApplicationConstructor: Constructor<T>) => {
		if (!(ApplicationConstructor as unknown as typeof Application).instance) {
			document?.body.appendChild(new ApplicationConstructor)
		}
	}
}

/**
 * The base class of an application, which renders the page matching the URL and hosts dialogs and notifications in its top layer.
 *
 * It renders into its light DOM and injects its static `styles` into the document. It connects once its `connectingHooks` have run,
 * renders `pageLoadingTemplate` until its `beforeRouteHooks` have run, and then the page matching the URL, dispatching the
 * `Application.connected`, `Application.initialized` and `Application.routed` window events in that order. Pages and dialogs
 * render into page and dialog elements provided by an implementation such as `@a11d/lit-application-native`.
 *
 * @example
 * ```ts
 * import { component, html } from '@a11d/lit'
 * import { application, Application, DialogComponent, PageComponent, route } from '@a11d/lit-application'
 * import '@a11d/lit-application-native'
 *
 * @component('app-dialog-greeting')
 * export class DialogGreeting extends DialogComponent<{ readonly name: string }> {
 * 	protected override get template() {
 * 		return html`<lit-dialog heading='Greeting' primaryButtonText='OK'>Hello, ${this.parameters.name}!</lit-dialog>`
 * 	}
 *
 * 	protected override primaryAction() { }
 * }
 *
 * @component('app-page-home')
 * @route('/')
 * export class PageHome extends PageComponent {
 * 	protected override get template() {
 * 		return html`
 * 			<lit-page heading='Home'>
 * 				<button @click=${() => new DialogGreeting({ name: 'Ada' }).confirm()}>Greet</button>
 * 			</lit-page>
 * 		`
 * 	}
 * }
 *
 * @application()
 * @component('app-application')
 * export class App extends Application { }
 * ```
 */
export abstract class Application extends NonInertableComponent {
	/** Hooks awaited before the application connects, such as to load configuration. */
	static readonly connectingHooks = new HookSet()
	/** Hooks awaited after the application first renders and before its router renders the first page. */
	static readonly beforeRouteHooks = new HookSet()

	/** The most recently connected top layer, or `document.body` without one, where dialogs and notifications are appended. */
	static get topLayer() { return ApplicationTopLayer.instance }

	/** The application element in the document, if any. */
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

	/** The heading of the current page, kept in the document title. */
	@property({ updated(this: Application) { document.title = this.documentTitle } }) pageHeading?: string

	/** The router rendering the page whose route matches the URL, or `PageError` with `NotFound` when none does. */
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

	/** The document title, joining the page heading and the manifest's `short_name`. */
	protected get documentTitle() {
		return [this.pageHeading, manifest?.short_name].filter(Boolean).join(' | ')
	}

	protected override get template() {
		return html`
			${this.bodyTemplate}
		`
	}

	/** The page host followed by the top layer; override it to render navigation or a footer around them. */
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

	/** Rendered in place of the page until the `beforeRouteHooks` have run; nothing by default. */
	protected get pageLoadingTemplate() {
		return html.nothing
	}

	protected get topLayerTemplate() {
		return html`<lit-application-top-layer></lit-application-top-layer>`
	}
}