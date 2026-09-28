import { component, html, css, property, Component, event } from '@a11d/lit'
import { type Page as IPage, PageComponent } from '@a11d/lit-application'

/**
 * The `lit-page` element a `PageComponent` renders its content in, reporting its `heading` to the application.
 *
 * @fires pageHeadingChange
 *
 * @example
 * ```ts
 * import '@a11d/lit-application-native'
 * import { component, html } from '@a11d/lit'
 * import { DialogComponent, PageComponent, route } from '@a11d/lit-application'
 *
 * @component('app-dialog-greeting')
 * export class DialogGreeting extends DialogComponent {
 * 	protected override get template() {
 * 		return html`<lit-dialog heading='Greeting' primaryButtonText='OK'>Hello</lit-dialog>`
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
 * 				<button @click=${() => new DialogGreeting().confirm()}>Greet</button>
 * 			</lit-page>
 * 		`
 * 	}
 * }
 * ```
 */
@component('lit-page')
@PageComponent.pageElement()
export class Page extends Component implements IPage {
	@event({ composed: true, bubbles: true, cancelable: true }) readonly pageHeadingChange!: EventDispatcher<string>

	@property({ updated(this: Page) { this.pageHeadingChange.dispatch(this.heading) } }) heading = ''
	/** Stretches the page and its first child to the full available height. */
	@property({ type: Boolean, reflect: true }) fullHeight = false

	static override get styles() {
		return css`
			:host {
				display: inherit;
			}

			:host([fullHeight]) {
				box-sizing: border-box;
				height: 100%;
			}

			:host([fullHeight]) ::slotted(:first-child) {
				height: 100%;
				width: 100%;
			}
		`
	}

	protected override get template() {
		return html`<slot></slot>`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lit-page': Page
	}
}