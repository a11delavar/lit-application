import { component, html, css, property, Component, state, query, nothing, style, event } from '@a11d/lit'
import { Dialog as IDialog, DialogActionKey, DialogComponent } from '@a11d/lit-application'

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
 */
@component('lit-dialog')
@DialogComponent.dialogElement()
export class Dialog extends Component implements IDialog {
	@event({ bubbles: true, composed: true, cancelable: true }) readonly dialogHeadingChange!: EventDispatcher<string>
	@event() readonly requestPopup!: EventDispatcher

	@property({ updated(this: Dialog) { this.dialogHeadingChange.dispatch(this.heading) } }) heading = ''
	@property() primaryButtonText?: string
	@property() secondaryButtonText?: string
	@property({ type: Boolean }) poppable?: boolean
	@property({ type: Boolean, reflect: true }) boundToWindow?: boolean

	@property({ type: Boolean }) preventCancellationOnEscape?: boolean
	@property({ type: Boolean }) primaryOnEnter?: boolean

	@state({ updated(this: Dialog, value: boolean) {
		if (value) {
			this.dialogElement.showModal()
		} else {
			setTimeout(() => this.dialogElement.close())
		}
	} }) open = false

	@query('dialog') readonly dialogElement!: HTMLDialogElement

	@queryActionElement('primaryAction') readonly primaryActionElement: HTMLElement | undefined
	@queryActionElement('secondaryAction') readonly secondaryActionElement: HTMLElement | undefined
	@queryActionElement('cancellationAction') readonly cancellationActionElement: HTMLElement | undefined

	handleAction!: (key: DialogActionKey) => void | Promise<void>

	static override get styles() {
		return css`
			h1 { margin: 0; }

			dialog::backdrop {
				background-color: var(--lit-dialog-backdrop-color, rgba(0, 0, 0, 0.5));
			}

			:host([boundToWindow]) dialog::backdrop {
				background-color: var(--lit-dialog-backdrop-color, rgba(234, 234, 234, 1));
			}

			@media (prefers-color-scheme: dark) {
				:host([boundToWindow]) dialog::backdrop {
					background-color: var(--lit-dialog-backdrop-color, rgba(16, 16, 16, 1));
				}
			}
		`
	}

	protected override get template() {
		return html`
			<dialog part='dialog' @cancel=${(e: Event) => e.preventDefault()}>
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
			</dialog>
		`
	}

	private get popupButtonTemplate() {
		return !this.poppable ? nothing : html`
			<button @click=${() => this.requestPopup.dispatch()}>🚀</button>
		`
	}

	protected get primaryActionElementTemplate() {
		return html`
			<slot name='primaryAction' @click=${() => this.handleAction(DialogActionKey.Primary)}>
				${!this.primaryButtonText ? nothing : html`<button>${this.primaryButtonText}</button>`}
			</slot>
		`
	}

	protected get secondaryActionElementTemplate() {
		return html`
			<slot name='secondaryAction' @click=${() => this.handleAction(DialogActionKey.Secondary)}>
				${!this.secondaryButtonText ? nothing : html`<button>${this.secondaryButtonText}</button>`}
			</slot>
		`
	}

	protected get cancellationActionElementTemplate() {
		return html`
			<slot name='cancellationAction' @click=${() => this.handleAction(DialogActionKey.Cancellation)}>
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