import { eventListener, type PropertyValues } from '@a11d/lit'
import { LocalStorage } from '@a11d/local-storage'
import { Application, HookSet, querySymbolizedElement, RoutableComponent, WindowHelper, WindowOpenMode, Key, NavigationStrategy } from '../index.js'
import { type Dialog, DialogActionKey, DialogCancelledError } from './index.js'

/** The parameters of a dialog, passed to its constructor and mapped to its URL if it has a route. */
export type DialogParameters = void | Record<string, any>

/** The outcome of a dialog action: the result resolving the confirmation, or an `Error` rejecting it. */
export type DialogResult<TResult> = TResult | Error

/** What a dialog action returns: a `DialogResult`, or a promise of one. */
export type DialogAction<TResult> = DialogResult<TResult> | PromiseLike<DialogResult<TResult>>

/** Where a dialog opens: in place, or popped out into a new tab or window. */
export enum DialogConfirmationStrategy {
	Dialog = NavigationStrategy.Page,
	Tab = NavigationStrategy.Tab,
	Window = NavigationStrategy.Window,
}

/** The confirmation strategies that pop a dialog out into a new tab or window. */
export type PopupConfirmationStrategy = Exclude<DialogConfirmationStrategy, DialogConfirmationStrategy.Dialog>

/**
 * The base class of a handler for the errors thrown by dialog actions, registered with `DialogComponent.errorHandler()`.
 *
 * Declare its key in the global `DialogComponentErrorHandlers` interface for dialog elements to refer to it by `errorHandler`.
 */
export abstract class DialogComponentErrorHandler {
	constructor(protected readonly dialogComponent: DialogComponent<any, any>) { }
	abstract handle(error: Error): void | Promise<void>
}

const dialogElementConstructorSymbol = Symbol('DialogComponent.DialogElementConstructor')

/**
 * The base class of a dialog, opened by `confirm`, which resolves with the dialog's result once it closes.
 *
 * Its template renders a dialog element, such as `lit-dialog`, whose heading defaults to the component's `label` metadata.
 * An action resolves `confirm` with the value it returns or rejects it with the `Error` it returns, and cancelling rejects it
 * with a `DialogCancelledError`. An error thrown by an action keeps the dialog open and goes to the dialog element's `errorHandler`.
 * A dialog with a `@route` can also pop out into a tab or window.
 */
export abstract class DialogComponent<T extends DialogParameters = void, TResult = void> extends RoutableComponent<T> {
	/** Hooks awaited with each dialog before it connects. */
	static readonly connectingHooks = new HookSet<DialogComponent<any, any>>()

	private static readonly errorHandlers = new Map<string, Constructor<DialogComponentErrorHandler>>()
	private static defaultErrorHandler: Constructor<DialogComponentErrorHandler>

	/** Marks the decorated element class as a dialog element, which `dialogElement` finds in a dialog component's render root. */
	static dialogElement() {
		return (constructor: Constructor<Dialog>) => {
			(constructor as any)[dialogElementConstructorSymbol] = true
		}
	}

	/** Registers the decorated class as the error handler of the key, and as the default one if `isDefault` is set. */
	static errorHandler(key: string, isDefault = false) {
		return (ErrorHandlerConstructor: Constructor<DialogComponentErrorHandler>) => {
			DialogComponent.errorHandlers.set(key, ErrorHandlerConstructor)
			if (isDefault) {
				DialogComponent.defaultErrorHandler = ErrorHandlerConstructor
			}
		}
	}

	/** The strategy poppable dialogs open with unless `confirm` is given one, persisted in local storage. */
	static readonly poppableConfirmationStrategy = new LocalStorage<DialogConfirmationStrategy>('DialogComponent.PoppableConfirmationStrategy', DialogConfirmationStrategy.Dialog)

	/** Resolves the element dialogs are appended to, the application's top layer by default. */
	static getHost() {
		return Promise.resolve(Application.topLayer)
	}

	/** The dialog element in the render root; accessing it throws when there is none. */
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

	/** The window that opened the window the dialog popped out into, or the current window otherwise. */
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

	/** Opens the dialog like `confirm`, taking the navigation strategy as the confirmation strategy. */
	override navigate(strategy?: NavigationStrategy, force?: boolean) {
		force
		return this.confirm(strategy as unknown as DialogConfirmationStrategy)
	}

	/** Opens the dialog and resolves with its result once it closes; poppable dialogs open with `poppableConfirmationStrategy` by default. */
	confirm(strategy?: DialogConfirmationStrategy) {
		strategy ??= !this.poppable
			? DialogConfirmationStrategy.Dialog
			: DialogComponent.poppableConfirmationStrategy.value
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

		return other.confirmAsDialog()
	}

	/** Copies the reactive properties of this dialog to its counterpart in the window it pops out into; override it to copy more. */
	protected cloned(other: DialogComponent<T, TResult>) {
		if (this.isConnected) {
			// Copy the dialog's properties to the dialog in the new window
			const propertiesToCopy = [...(this.constructor as unknown as typeof DialogComponent).elementProperties.keys()]
			// @ts-expect-error property is a key of the elementProperties map
			propertiesToCopy.forEach(property => other[property] = this[property])
			other.requestUpdate()
		}
	}

	/** Closes the dialog and reopens it in a new tab or window, whose result then settles the original confirmation. */
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

	/** Closes the dialog, resolving its confirmation with the result, or rejecting it if the result is an `Error`. */
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

	/** Whether the dialog can pop out into a tab or window, which requires a route that the current URL does not match. */
	get poppable() {
		return !!this.route && !this.urlMatches()
	}

	protected override firstUpdated(props: PropertyValues) {
		this.dialogElement.handleAction = this.handleAction
		this.dialogElement.requestPopup?.subscribe(() => this.pop())
		this.dialogElement.poppable = this.poppable
		this.dialogElement.boundToWindow = this.boundToWindow
		this.dialogElement.heading ||= label.resolve(this)?.toString()

		this.open = true
		super.firstUpdated(props)
	}

	/** Returns the result to close the dialog with when its primary action is invoked; throws unless overridden. */
	protected primaryAction(): DialogAction<TResult> {
		throw new Error('Not implemented.')
	}

	/** Returns the result to close the dialog with when its secondary action is invoked; cancels the dialog by default. */
	protected secondaryAction(): DialogAction<TResult> {
		return this.cancellationAction()
	}

	/** Returns the result to close the dialog with when it is cancelled, a `DialogCancelledError` by default. */
	protected cancellationAction(): DialogAction<TResult> {
		return new DialogCancelledError(this)
	}

	/** Runs the action of the key and closes the dialog with its result, unless `manualClose` keeps it open. */
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

	/** Passes an error thrown by an action to the dialog element's `errorHandler`, or to the default error handler without one. */
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
