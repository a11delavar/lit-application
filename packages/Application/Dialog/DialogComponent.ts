import { eventListener, type PropertyValues } from '@a11d/lit'
import { LocalStorage } from '@a11d/local-storage'
import { Application, HookSet, querySymbolizedElement, RoutableComponent, WindowHelper, WindowOpenMode, Key, NavigationStrategy } from '../index.js'
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

export abstract class DialogComponentErrorHandler {
	constructor(protected readonly dialogComponent: DialogComponent<any, any>) { }
	abstract handle(error: Error): void | Promise<void>
}

const dialogElementConstructorSymbol = Symbol('DialogComponent.DialogElementConstructor')

export abstract class DialogComponent<T extends DialogParameters = void, TResult = void> extends RoutableComponent<T> {
	static readonly connectingHooks = new HookSet<DialogComponent<any, any>>()

	private static readonly errorHandlers = new Map<string, Constructor<DialogComponentErrorHandler>>()
	private static defaultErrorHandler: Constructor<DialogComponentErrorHandler>

	static dialogElement() {
		return (constructor: Constructor<Dialog>) => {
			(constructor as any)[dialogElementConstructorSymbol] = true
		}
	}

	static errorHandler(key: string, isDefault = false) {
		return (ErrorHandlerConstructor: Constructor<DialogComponentErrorHandler>) => {
			DialogComponent.errorHandlers.set(key, ErrorHandlerConstructor)
			if (isDefault) {
				DialogComponent.defaultErrorHandler = ErrorHandlerConstructor
			}
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
		if (this.dialogElement.boundToWindow) {
			await this.handleAction(DialogActionKey.Cancellation)
		}
	}

	@eventListener({ target: window, type: 'keydown' })
	protected async handleKeyDown(e: KeyboardEvent) {
		if (Application.topLayer !== this.dialogElement.topLayerElement) {
			return
		}

		if (this.dialogElement.primaryOnEnter === true && e.key === Key.Enter) {
			await this.handleAction(DialogActionKey.Primary)
		}

		if (!this.dialogElement.preventCancellationOnEscape && e.key === Key.Escape) {
			await this.handleAction(DialogActionKey.Cancellation)
		}
	}

	override async connectedCallback() {
		await DialogComponent.connectingHooks.execute(this)
		super.connectedCallback()
	}

	override navigate(strategy = NavigationStrategy.Page, force = false) {
		force
		return this.confirm(strategy as unknown as DialogConfirmationStrategy)
	}

	confirm(strategy = DialogConfirmationStrategy.Dialog) {
		return strategy === DialogConfirmationStrategy.Dialog
			? this.confirmAsDialog()
			: this.confirmAsPopup(strategy)
	}

	private _confirmationPromiseExecutor?: [
		resolve: (value: TResult) => void,
		reject: (reason: Error) => void,
	]

	private async confirmAsDialog() {
		const host = await DialogComponent.getHost()
		if (this.isConnected === false) {
			host.appendChild(this)
		}
		return new Promise<TResult>((resolve, reject) => {
			this._confirmationPromiseExecutor = [resolve, reject]
		})
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

		// Copy the dialog's properties to the dialog in the new window
		const propertiesToCopy = [...(this.constructor as unknown as typeof DialogComponent).elementProperties.keys()]
		// @ts-expect-error property is a key of the elementProperties map
		propertiesToCopy.forEach(property => other[property] = this[property])

		other.requestUpdate()

		return other.confirmAsDialog()
	}

	protected cloned(other: DialogComponent<T, TResult>) { other }

	protected async pop(strategy: Exclude<DialogConfirmationStrategy, DialogConfirmationStrategy.Dialog> = DialogConfirmationStrategy.Tab) {
		this.open = false
		const [resolve, reject] = this._confirmationPromiseExecutor ?? []
		try {
			const value = await this.confirmAsPopup(strategy) as TResult
			resolve?.(value)
		} catch (error) {
			reject?.(error as Error)
		}
	}

	protected close(result: TResult | Error) {
		this.open = false

		const [resolve, reject] = this._confirmationPromiseExecutor ?? []
		if (result instanceof Error) {
			reject?.(result)
		} else {
			resolve?.(result)
		}

		this.remove()

		if (this.dialogElement.boundToWindow) {
			window.close()
		}
	}

	private get open() { return this.dialogElement.open ?? false }
	private set open(value) {
		if (this.dialogElement) {
			this.dialogElement.open = value
		}
	}

	protected override firstUpdated(props: PropertyValues<this>) {
		this.dialogElement.handleAction = this.handleAction
		this.dialogElement.requestPopup?.subscribe(() => this.pop())
		this.dialogElement.boundToWindow = this.boundToWindow

		if (this.dialogElement.poppable &&
			this.urlMatches() === false &&
			DialogComponent.poppableConfirmationStrategy.value !== DialogConfirmationStrategy.Dialog
		) {
			this.pop(DialogComponent.poppableConfirmationStrategy.value)
			return
		}

		this.dialogElement.heading ||= label.get(this.constructor as Constructor<this>)?.toString()

		this.open = true
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

	protected readonly handleAction = async (actionKey: DialogActionKey) => {
		const actionByKey = new Map([
			[DialogActionKey.Primary, this.primaryAction],
			[DialogActionKey.Secondary, this.secondaryAction],
			[DialogActionKey.Cancellation, this.cancellationAction],
		])

		const action = actionByKey.get(actionKey)?.bind(this)

		if (!action) {
			throw new Error(`No action for key ${actionKey}`)
		}

		try {
			this.dialogElement.executingAction = actionKey
			const result = await action()
			if (!this.dialogElement.manualClose || actionKey === DialogActionKey.Cancellation) {
				this.close(result)
			}
		} catch (e: any) {
			this.handleError(e)
			throw e
		} finally {
			this.dialogElement.executingAction = undefined
		}
	}

	protected handleError(error: Error) {
		if (error instanceof DialogCancelledError) {
			return
		}

		if (!this.dialogElement.errorHandler) {
			return new DialogComponent.defaultErrorHandler(this).handle(error)
		}

		if (typeof this.dialogElement.errorHandler === 'string') {
			const ErrorHandlerConstructor = DialogComponent.errorHandlers.get(this.dialogElement.errorHandler)

			if (!ErrorHandlerConstructor) {
				throw new Error(`No error handler for key ${this.dialogElement.errorHandler}`)
			}

			return new ErrorHandlerConstructor(this).handle(error)
		}

		this.dialogElement.errorHandler(error)
	}
}