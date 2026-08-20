import type { DialogControllerHost } from './DialogController.js'
import { DialogCancelledError } from './DialogCancelledError.js'

/**
 * Error handler base class for dialogs.
 *
 * Hosts (e.g. `<lit-dialog>`, `<mo-dialog>`, plain inline dialog elements)
 * receive themselves in the constructor. Handlers can reach the
 * `DialogController`'s host contract for any contextual access they need.
 */
export abstract class DialogErrorHandler {
	constructor(protected readonly host: DialogControllerHost) { }
	abstract handle(error: Error): void | Promise<void>
}

export type DialogErrorHandlerFunction = (error: Error) => void | Promise<void>

export type DialogErrorHandlerSetting =
	| keyof DialogErrorHandlers
	| DialogErrorHandlerFunction

const errorHandlers = new Map<string, Constructor<DialogErrorHandler>>()
let defaultErrorHandler: Constructor<DialogErrorHandler> | undefined

/**
 * Registers a `DialogErrorHandler` subclass under a string key. The key can
 * then be assigned to a dialog's `errorHandler` property (e.g.
 * `<mo-dialog errorHandler='no-op'>`) and `DialogController` resolves it
 * at error-time.
 *
 * Pass `isDefault: true` to also use this handler when a dialog has no
 * `errorHandler` configured (and the thrown error is not a
 * `DialogCancelledError`).
 */
export function dialogErrorHandler(key: string, isDefault = false) {
	return (constructor: Constructor<DialogErrorHandler>) => {
		errorHandlers.set(key, constructor)
		if (isDefault) {
			defaultErrorHandler = constructor
		}
	}
}

/**
 * Resolves a host's `errorHandler` setting (or the registered default) into
 * a callable handler bound to the host. Returns `undefined` when the setting
 * is missing AND no default is registered.
 *
 * Cancellation errors short-circuit so they never reach a handler.
 */
export function resolveDialogErrorHandler(
	setting: DialogErrorHandlerSetting | undefined,
	host: DialogControllerHost,
): DialogErrorHandlerFunction | undefined {
	if (typeof setting === 'function') {
		return error => error instanceof DialogCancelledError ? undefined : setting(error)
	}

	const constructor = setting === undefined
		? defaultErrorHandler
		: errorHandlers.get(setting) ?? throwUnknown(setting)

	if (!constructor) {
		return undefined
	}

	return error => error instanceof DialogCancelledError
		? undefined
		: new constructor(host).handle(error)
}

function throwUnknown(key: string): never {
	throw new Error(`No error handler registered for key '${key}'.`)
}