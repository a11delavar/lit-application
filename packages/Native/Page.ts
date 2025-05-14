import { component, html, css, property, Component, event } from '@a11d/lit'
import { type Page as IPage, PageComponent } from '@a11d/lit-application'

/** @fires pageHeadingChange */
@component('lit-page')
@PageComponent.pageElement()
export class Page extends Component implements IPage {
	@event({ composed: true, bubbles: true, cancelable: true }) readonly pageHeadingChange!: EventDispatcher<string>

	@property({ updated(this: Page) { this.pageHeadingChange.dispatch(this.heading) } }) heading = ''
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