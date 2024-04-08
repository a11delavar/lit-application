import { DialogComponent, DialogComponentErrorHandler } from '../DialogComponent.js'
import { NotificationComponent } from '../../Notification/NotificationComponent.js'

@DialogComponent.errorHandler('notification', true)
export class DialogComponentNotificationErrorHandler extends DialogComponentErrorHandler {
	override handle(error: Error) {
		return NotificationComponent.notifyError(error.message)
	}
}

declare global {
	interface DialogComponentErrorHandlers {
		'notification': DialogComponentNotificationErrorHandler
	}
}