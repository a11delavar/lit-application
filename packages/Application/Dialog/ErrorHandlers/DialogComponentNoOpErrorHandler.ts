import { DialogErrorHandler, dialogErrorHandler } from '../dialogErrorHandler.js'

@dialogErrorHandler('no-op')
export class DialogComponentNoOpErrorHandler extends DialogErrorHandler {
	override handle() { }
}

declare global {
	interface DialogErrorHandlers {
		'no-op': DialogComponentNoOpErrorHandler
	}
}