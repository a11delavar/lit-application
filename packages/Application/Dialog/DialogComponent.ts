import { eventListener, type PropertyValues } from '@a11d/lit'
import { LocalStorage } from '@a11d/local-storage'
import { Application, HookSet, querySymbolizedElement, RoutableComponent, WindowHelper, WindowOpenMode, NavigationStrategy } from '../index.js'
import { type Dialog, DialogActionKey, DialogCancelledError } from './index.js'

export type DialogParameters = void | Record<string, any>

export type DialogResult<TResult> = TResult | Error

export type DialogAction<TResult> = DialogResult<TResult> | PromiseLike<DialogResult<TResult>>

export enum DialogConfirmationStrategy {
	Dialog = NavigationStrategy.Page,
	Tab = NavigationStrategy.Tab,
	Window = NavigationStrategy.Window
}

export type PopupConfirmationStrategy = Exclude<DialogConfirmationStrategy, DialogConfirmationStrategy.Dialog>

const dialogElementConstructorSymbol = Symbol('DialogComponent.DialogElementConstructor')

export abstract class DialogComponent<T extends DialogParameters = void, TResult = void> extends RoutableComponent<T> {
	static readonly connectingHooks = new HookSet<DialogComponent<any, any>>()

	static dialogElement() {
		return (constructor: Constructor<Dialog>) => {
			(constructor as any)[dialogElementConstructorSymbol] = true
		}
	}

	static readonly poppableConfirmationStrategy = new LocalStorage<DialogConfirmationStrategy>('DialogComponent.PoppableConfirmationStrategy', DialogConfirmationStrategy.Dialog)

	static getHost() {
		return Promise.resolve(Application.topLayer)
	}

	@querySymbolizedElement(dialogElementConstructorSymbol) readonly dialogElement!: Dialog & HTMLElement

	get primaryActionElement() {
		return this.dialogElement.primaryActionElement
	}

	get secondaryActionElement() {
		return this.dialogElement.secondaryActionElement
	}

	get cancellationActionElement() {
		return this.dialogElement.cancellationActionElement
	}

	get opener(): Window & typeof globalThis {
		return !this.dialogElement.boundToWindow
			? window
			: window.opener ?? window
	}

	@eventListener({ target: window, type: 'beforeunload' })
	protected async handleBeforeUnload() {
		if (this.dialogElement?.boundToWindow) {
			await this.dialogElement.controller.executeAction(DialogActionKey.Cancellation).catch(() => undefined)
		}
	}

	override async connectedCallback() {
		await DialogComponent.connectingHooks.execute(this)
		super.connectedCallback()
	}

	override navigate(strategy?: NavigationStrategy, force?: boolean) {
		force
		return this.confirm(strategy as unknown as DialogConfirmationStrategy)
	}

	confirm(strategy?: DialogConfirmationStrategy) {
		strategy ??= !this.poppable
			? DialogConfirmationStrategy.Dialog
			: DialogComponent.poppableConfirmationStrategy.value
		return strategy === DialogConfirmationStrategy.Dialog
			? this.confirmAsDialog()
			: this.confirmAsPopup(strategy)
	}

	private async confirmAsDialog(): Promise<TResult> {
		const host = await DialogComponent.getHost()
		if (this.isConnected === false) {
			host.appendChild(this)
		}
		// `firstUpdated` wires the dialog element's controller; wait for it.
		await this.updateComplete
		return this.dialogElement.confirm<TResult>().finally(() => this.remove())
	}

	private async confirmAsPopup(strategy: PopupConfirmationStrategy) {
		if (!this.url) {
			throw new Error('No @route decorator found on dialog component.')
		}

		// Open a new window at the dialog's path
		const popup = await WindowHelper.open(this.url, strategy === DialogConfirmationStrategy.Window ? WindowOpenMode.Window : WindowOpenMode.Tab)

		// Wait for the router to navigate to the dialog
		await new Promise(r => popup?.addEventListener('Application.routed', r))

		// Find the dialog in the new window
		const other = popup.document.querySelector<DialogComponent<T, TResult>>(this.localName)

		if (!other) {
			throw new Error('Something went wrong while opening the dialog.')
		}

		this.cloned(other)

		return other.confirmAsDialog()
	}

	protected cloned(other: DialogComponent<T, TResult>) {
		if (this.isConnected) {
			// Copy the dialog's properties to the dialog in the new window
			const propertiesToCopy = [...(this.constructor as unknown as typeof DialogComponent).elementProperties.keys()]
			// @ts-expect-error property is a key of the elementProperties map
			propertiesToCopy.forEach(property => other[property] = this[property])
			other.requestUpdate()
		}
	}

	protected async pop(strategy: Exclude<DialogConfirmationStrategy, DialogConfirmationStrategy.Dialog> = DialogConfirmationStrategy.Tab) {
		this.dialogElement.controller.dismiss()
		try {
			const value = await this.confirmAsPopup(strategy) as TResult
			this.dialogElement.controller.close(value)
		} catch (error) {
			this.dialogElement.controller.close(error as Error)
		}
	}

	protected close(result: TResult | Error) {
		this.dialogElement.controller.close(result)
		if (this.dialogElement.boundToWindow) {
			window.close()
		}
	}

	get poppable() {
		return !!this.route && !this.urlMatches()
	}

	protected override firstUpdated(props: PropertyValues) {
		const dialog = this.dialogElement
		dialog.primaryAction = () => this.primaryAction()
		dialog.secondaryAction = () => this.secondaryAction()
		dialog.cancellationAction = () => this.cancellationAction()
		dialog.requestPopup?.subscribe(() => this.pop())
		dialog.poppable = this.poppable
		dialog.boundToWindow = this.boundToWindow
		dialog.heading ||= label.get(this.constructor as Constructor<this>)?.toString()
		super.firstUpdated(props)
	}

	protected primaryAction(): DialogAction<TResult> {
		throw new Error('Not implemented.')
	}

	protected secondaryAction(): DialogAction<TResult> {
		return this.cancellationAction()
	}

	protected cancellationAction(): DialogAction<TResult> {
		return new DialogCancelledError(this)
	}
}