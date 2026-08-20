import { DialogErrorHandler, dialogErrorHandler } from '../dialogErrorHandler.js'
import { NotificationComponent } from '../../Notification/NotificationComponent.js'

@dialogErrorHandler('notification', true)
export class DialogComponentNotificationErrorHandler extends DialogErrorHandler {
	override handle(error: Error) {
		return NotificationComponent.notifyError(error.message)
	}
}

declare global {
	interface DialogErrorHandlers {
		'notification': DialogComponentNotificationErrorHandler
	}
}