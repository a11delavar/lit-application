import { DialogComponent, DialogComponentErrorHandler } from '../DialogComponent.js'

@DialogComponent.errorHandler('no-op')
export class DialogComponentNoOpErrorHandler extends DialogComponentErrorHandler {
	override handle() { }
}

declare global {
	interface DialogComponentErrorHandlers {
		'no-op': DialogComponentNoOpErrorHandler
	}
}