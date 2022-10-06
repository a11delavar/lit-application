import { Notification } from './NotificationHost.js'

export interface NotificationComponent {
	notification: Notification
	show(): Promise<void>
}