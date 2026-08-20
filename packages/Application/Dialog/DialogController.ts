import { type ReactiveController } from '@a11d/lit'
import { Application } from '../Application.js'
import type { ApplicationTopLayer } from '../ApplicationTopLayer.js'
import { Key } from '../utilities/Key.js'
import { DialogActionKey } from './Dialog.js'
import { DialogCancelledError } from './DialogCancelledError.js'
import { resolveDialogErrorHandler, type DialogErrorHandlerSetting } from './dialogErrorHandler.js'

export type DialogControllerAction<TResult> =
	| TResult
	| Error
	| PromiseLike<TResult | Error>

/**
 * Minimal contract a host must expose for `DialogController` to drive it.
 *
 * The controller READS configuration (`primaryAction`, `manualClose`, ...)
 * and WRITES lifecycle state (`open`, `executingAction`) directly on the
 * host. It owns no duplicated state — the host is the single source of
 * truth. This also means hosts don't need to be `HTMLElement`s, which makes
 * the controller testable with plain objects.
 */
export interface DialogControllerHost {
	addController(controller: ReactiveController): void
	removeController(controller: ReactiveController): void

	open: boolean
	executingAction?: DialogActionKey

	primaryAction?: () => DialogControllerAction<unknown>
	secondaryAction?: () => DialogControllerAction<unknown>
	cancellationAction?: () => DialogControllerAction<unknown>

	errorHandler?: DialogErrorHandlerSetting
	manualClose?: boolean
	primaryOnEnter?: boolean
	preventCancellationOnEscape?: boolean

	/** Dispatched when the dialog closes; detail is the resolved value or thrown `Error`. */
	readonly close: EventDispatcher<unknown>

	/** Compared against `Application.topLayer` to scope keyboard short-cuts. */
	readonly topLayerElement?: ApplicationTopLayer
}

export class DialogController<TResult = unknown> implements ReactiveController {
	private _resolve?: (value: TResult) => void
	private _reject?: (reason: Error) => void

	constructor(private readonly host: DialogControllerHost) {
		host.addController(this)
	}

	hostConnected() {
		window.addEventListener('keydown', this.handleKeyDown)
	}

	hostDisconnected() {
		window.removeEventListener('keydown', this.handleKeyDown)
	}

	confirm<T = TResult>() {
		this.host.open = true
		return new Promise<T>((resolve, reject) => {
			this._resolve = resolve as (value: TResult) => void
			this._reject = reject
		})
	}

	/**
	 * Closes the dialog and settles the pending `confirm()` promise.
	 * - `Error` instances reject; everything else resolves.
	 * - Always dispatches a `close` event with `detail: result`.
	 */
	close(result: TResult | Error) {
		const wasOpen = this.host.open
		this.host.open = false
		const resolve = this._resolve
		const reject = this._reject
		this._resolve = undefined
		this._reject = undefined
		if (result instanceof Error) {
			reject?.(result)
		} else {
			resolve?.(result as TResult)
		}
		if (wasOpen) {
			this.host.close.dispatch(result)
		}
	}

	/** Visually closes the dialog without settling the `confirm()` promise. */
	dismiss() {
		this.host.open = false
	}

	async executeAction(key: DialogActionKey): Promise<void> {
		const action = this.actionFor(key)
		if (!action) {
			throw new Error(`No action for key '${key}'.`)
		}
		try {
			this.host.executingAction = key
			const result = await action()
			if (!this.host.manualClose || key === DialogActionKey.Cancellation) {
				this.close(result as TResult | Error)
			}
		} catch (error) {
			await this.runErrorHandler(error as Error)
			throw error
		} finally {
			this.host.executingAction = undefined
		}
	}

	private actionFor(key: DialogActionKey) {
		switch (key) {
			case DialogActionKey.Primary: return this.host.primaryAction
			case DialogActionKey.Secondary: return this.host.secondaryAction
			case DialogActionKey.Cancellation: return this.host.cancellationAction
		}
	}

	private async runErrorHandler(error: Error) {
		const handler = resolveDialogErrorHandler(this.host.errorHandler, this.host)
		await handler?.(error)
	}

	private readonly handleKeyDown = (e: KeyboardEvent) => {
		if (Application.topLayer !== this.host.topLayerElement) {
			return
		}
		if (this.host.primaryOnEnter && e.key === Key.Enter) {
			void this.executeAction(DialogActionKey.Primary).catch(() => undefined)
		}
		if (!this.host.preventCancellationOnEscape && e.key === Key.Escape) {
			void this.executeAction(DialogActionKey.Cancellation).catch(() => undefined)
		}
	}

	/** @internal — used by `DialogComponent` to differentiate `DialogCancelledError`. */
	static isCancellation(error: unknown): error is DialogCancelledError {
		return error instanceof DialogCancelledError
	}
}