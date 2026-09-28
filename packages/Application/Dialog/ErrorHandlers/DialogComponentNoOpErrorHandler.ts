import { DialogComponent, DialogComponentErrorHandler } from '../DialogComponent.js'

/** The `no-op` dialog error handler, which ignores errors. */
@DialogComponent.errorHandler('no-op')
export class DialogComponentNoOpErrorHandler extends DialogComponentErrorHandler {
	override handle() { }
}

declare global {
	interface DialogComponentErrorHandlers {
		'no-op': DialogComponentNoOpErrorHandler
	}
}