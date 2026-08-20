import { component, html, css, property, Component, state, query, style, event, type PropertyValues } from '@a11d/lit'
import { type Dialog as IDialog, DialogActionKey, DialogComponent, type ApplicationTopLayer, type DialogErrorHandler, DialogController, type DialogControllerAction } from '@a11d/lit-application'

const queryActionElement = (slotName: string) => {
	return (prototype: Component, propertyKey: string) => {
		Object.defineProperty(prototype, propertyKey, {
			get(this: Component) {
				const slot = this.shadowRoot?.querySelector<HTMLSlotElement>(`slot[name=${slotName}]`)
				return slot?.assignedElements()?.[0] ?? slot?.children[0] ?? undefined
			}
		})
	}
}

/**
 * @slot - The content of the dialog.
 * @slot primaryAction - The primary action element of the dialog.
 * @slot secondaryAction - The secondary action element of the dialog.
 * @slot cancellationAction - The cancellation action element of the dialog.
 *
 * @fires close - Fired when the dialog closes; `event.detail` is the resolved
 *                value (or thrown `Error`).
 */
@component('lit-dialog')
@DialogComponent.dialogElement()
export class Dialog extends Component implements IDialog {
	readonly controller = new DialogController(this)

	@event({ bubbles: true, composed: true, cancelable: true }) readonly pageHeadingChange!: EventDispatcher<string>
	@event() readonly requestPopup!: EventDispatcher
	@event() readonly close!: EventDispatcher<unknown>

	@property({ updated(this: Dialog) { this.pageHeadingChange.dispatch(this.heading) } }) heading = ''
	@property() primaryButtonText?: string
	@property() secondaryButtonText?: string

	@property({ type: Boolean }) open = false
	@state() executingAction?: DialogActionKey

	@property({ type: Boolean }) preventCancellationOnEscape?: boolean
	@property({ type: Boolean }) primaryOnEnter?: boolean
	@property({ type: Boolean }) manualClose?: boolean
	@property() errorHandler?: DialogErrorHandler

	@property({ attribute: false }) primaryAction?: () => DialogControllerAction<unknown>
	@property({ attribute: false }) secondaryAction?: () => DialogControllerAction<unknown>
	@property({ attribute: false }) cancellationAction?: () => DialogControllerAction<unknown>

	@state() poppable?: boolean
	@state() boundToWindow?: boolean

	confirm<T = unknown>() {
		return this.controller.confirm<T>()
	}

	/**
	 * @deprecated Forwards to `controller.executeAction`. Will be removed in a
	 * future release once `mo-dialog` migrates to `DialogController`.
	 */
	handleAction = (key: DialogActionKey) => this.controller.executeAction(key)

	@query('dialog') readonly nativeDialogElement!: HTMLDialogElement
	@query('lit-application-top-layer') readonly topLayerElement!: ApplicationTopLayer

	@queryActionElement('primaryAction') readonly primaryActionElement: HTMLElement | undefined
	@queryActionElement('secondaryAction') readonly secondaryActionElement: HTMLElement | undefined
	@queryActionElement('cancellationAction') readonly cancellationActionElement: HTMLElement | undefined

	private wasOpen = false
	protected override updated(props: PropertyValues) {
		super.updated(props)
		if (this.open !== this.wasOpen) {
			this.wasOpen = this.open
			if (this.open) {
				this.nativeDialogElement?.showModal()
			} else {
				setTimeout(() => this.nativeDialogElement?.close())
			}
		}
	}

	static override get styles() {
		return css`
			h1 { margin: 0; }

			dialog {
				&::backdrop {
					background-color: var(--lit-dialog-backdrop-color, rgba(0, 0, 0, 0.5));
				}

				&[data-bound] {
					&::backdrop {
						background-color: var(--lit-dialog-backdrop-color, light-dark(rgba(234, 234, 234, 1), rgba(16, 16, 16, 1)));
					}
				}
			}
		`
	}

	protected override get template() {
		return html`
			<dialog part='dialog' ?data-bound=${this.boundToWindow} @cancel=${(e: Event) => e.preventDefault()}>
				<div ${style({ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' })}>
					<div ${style({ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' })}>
						<h1>${this.heading}</h1>
						<div ${style({ display: 'flex', alignItems: 'center', gap: '4px' })}>
							${this.popupButtonTemplate}
							${this.cancellationActionElementTemplate}
						</div>
					</div>
					<slot></slot>
					<div ${style({ display: 'horizontal-reversed', gap: '8px' })}>
						${this.primaryActionElementTemplate}
						${this.secondaryActionElementTemplate}
					</div>
				</div>
				<lit-application-top-layer></lit-application-top-layer>
			</dialog>
		`
	}

	private get popupButtonTemplate() {
		return !this.poppable ? html.nothing : html`
			<button @click=${() => this.requestPopup.dispatch()}>🚀</button>
		`
	}

	protected get primaryActionElementTemplate() {
		return html`
			<slot name='primaryAction' @click=${() => this.controller.executeAction(DialogActionKey.Primary).catch(() => undefined)}>
				${!this.primaryButtonText ? html.nothing : html`<button>${this.primaryButtonText}</button>`}
			</slot>
		`
	}

	protected get secondaryActionElementTemplate() {
		return html`
			<slot name='secondaryAction' @click=${() => this.controller.executeAction(DialogActionKey.Secondary).catch(() => undefined)}>
				${!this.secondaryButtonText ? html.nothing : html`<button>${this.secondaryButtonText}</button>`}
			</slot>
		`
	}

	protected get cancellationActionElementTemplate() {
		return html`
			<slot name='cancellationAction' @click=${() => this.controller.executeAction(DialogActionKey.Cancellation).catch(() => undefined)}>
				<button>✖</button>
			</slot>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lit-dialog': Dialog
	}
}