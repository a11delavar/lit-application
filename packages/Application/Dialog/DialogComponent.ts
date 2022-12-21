import { Component, eventListener, literal, PropertyValues } from '@a11d/lit'
import { Application, HookSet, LocalStorageEntry, querySymbolizedElement, WindowHelper, WindowOpenMode, Key } from '../index.js'
import { PageDialog, Dialog, DialogActionKey, DialogCancelledError, DialogHost } from './index.js'

export type DialogParameters = void | Record<string, any>

export type DialogResult<TResult> = TResult | Error

export type DialogAction<TResult> = DialogResult<TResult> | PromiseLike<DialogResult<TResult>>

export const enum DialogConfirmationStrategy { Dialog, Tab, Window }

export type PopupConfirmationStrategy = Exclude<DialogConfirmationStrategy, DialogConfirmationStrategy.Dialog>

export abstract class DialogComponent<T extends DialogParameters = void, TResult = void> extends Component {
	static readonly connectingHooks = new HookSet<DialogComponent<any, any>>()

	private static readonly dialogElementConstructorSymbol = Symbol('DialogComponent.DialogElementConstructor')

	static defaultDialogElementTag = literal`lit-dialog`

	static dialogElement() {
		return (constructor: Constructor<Dialog>) => {
			(constructor as any)[DialogComponent.dialogElementConstructorSymbol] = true
		}
	}

	static readonly poppableConfirmationStrategy = new LocalStorageEntry<DialogConfirmationStrategy>('DialogComponent.PoppableConfirmationStrategy', DialogConfirmationStrategy.Dialog)

	static getHost() {
		return Promise.resolve(DialogHost.instance ?? Application.instance ?? document.body)
	}

	@querySymbolizedElement(DialogComponent.dialogElementConstructorSymbol) readonly dialogElement!: Dialog & HTMLElement

	get primaryActionElement() { return this.dialogElement.primaryActionElement }

	get secondaryActionElement() { return this.dialogElement.secondaryActionElement }

	get cancellationActionElement() { return this.dialogElement.cancellationActionElement }

	constructor(readonly parameters: T) {
		super()
	}

	@eventListener({ target: window, type: 'beforeunload' })
	protected async handleBeforeUnload() {
		if (this.dialogElement.boundToWindow) {
			await this.handleAction(DialogActionKey.Cancellation)
		}
	}

	@eventListener({ target: window, type: 'keydown' })
	protected async handleKeyDown(e: KeyboardEvent) {
		const host = await DialogComponent.getHost()

		if ([...host.children].filter(e => e instanceof DialogComponent).reverse()[0] !== this) {
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

	confirm(strategy = DialogConfirmationStrategy.Dialog) {
		return strategy === DialogConfirmationStrategy.Dialog
			? this.confirmAsDialog()
			: this.confirmAsPopup(strategy)
	}

	private _confirmationPromiseExecutor?: [
		resolve: (value: TResult) => void,
		reject: (reason: Error) => void,
	]

	protected async confirmAsDialog() {
		const host = await DialogComponent.getHost()
		host.appendChild(this)
		return new Promise<TResult>((resolve, reject) => {
			this._confirmationPromiseExecutor = [resolve, reject]
		})
	}

	private _popupWindow?: Window
	protected async confirmAsPopup(strategy: PopupConfirmationStrategy) {
		this._popupWindow = await WindowHelper.open(PageDialog.route, strategy === DialogConfirmationStrategy.Window ? WindowOpenMode.Window : WindowOpenMode.Tab)

		const DialogConstructor = this._popupWindow.customElements.get(this.tagName.toLowerCase()) as CustomElementConstructor
		const dialogComponent = new DialogConstructor(this.parameters) as DialogComponent<T, TResult>

		const Constructor = this.constructor as unknown as typeof DialogComponent
		const propertiesToCopy = [...Constructor.elementProperties.keys()]
		// @ts-expect-error property is a key of the elementProperties map
		propertiesToCopy.forEach(property => dialogComponent[property] = this[property])

		const app = this._popupWindow.document.querySelector('[application]') as Application
		await app.updateComplete
		const page = this._popupWindow.document.querySelector('lit-page-dialog') as PageDialog
		const confirmPromise = dialogComponent.confirm() as Promise<TResult>
		await dialogComponent.updateComplete
		dialogComponent.dialogElement.dialogHeadingChange.subscribe(heading => page.heading = heading)
		dialogComponent.dialogElement.boundToWindow = true
		page.heading = dialogComponent.dialogElement.heading
		return confirmPromise
	}

	protected async pop(strategy: Exclude<DialogConfirmationStrategy, DialogConfirmationStrategy.Dialog> = DialogConfirmationStrategy.Tab) {
		this.open = false
		try {
			const value = await this.confirm(strategy)
			this._confirmationPromiseExecutor?.[0](value)
		} catch (error) {
			this._confirmationPromiseExecutor?.[1](error as Error)
		} finally {
			this._popupWindow?.close()
			this.remove()
		}
	}

	protected close(result: TResult | Error) {
		this.open = false

		if (result instanceof Error) {
			this._confirmationPromiseExecutor?.[1](result)
		} else {
			this._confirmationPromiseExecutor?.[0](result)
		}

		this.remove()
	}

	private get open() { return this.dialogElement.open ?? false }
	private set open(value) {
		if (this.dialogElement) {
			this.dialogElement.open = value
		}
	}

	protected override firstUpdated(props: PropertyValues) {
		this.dialogElement.handleAction = this.handleAction
		this.dialogElement.requestPopup?.subscribe(() => this.pop())

		if (this.dialogElement.poppable &&
			window.location.pathname !== PageDialog.route &&
			DialogComponent.poppableConfirmationStrategy.value !== DialogConfirmationStrategy.Dialog
		) {
			this.pop(DialogComponent.poppableConfirmationStrategy.value)
			return
		}

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

	private readonly handleAction = async (actionKey: DialogActionKey) => {
		const actionByKey = new Map([
			[DialogActionKey.Primary, this.primaryAction],
			[DialogActionKey.Secondary, this.secondaryAction],
			[DialogActionKey.Cancellation, this.cancellationAction],
		])

		// eslint-disable-next-line no-restricted-syntax
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
			notificationHost.notifyError(e.message)
			throw e
		} finally {
			this.dialogElement.executingAction = undefined
		}
	}
}