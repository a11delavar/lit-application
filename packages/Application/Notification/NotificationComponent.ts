import { LitElement } from '@a11d/lit'
import { Application } from '../Application.js'
import { NonInertableComponent } from '@a11d/non-inertable-component'

export enum NotificationType {
	Info = 'info',
	Success = 'success',
	Warning = 'warning',
	Error = 'error',
}

export type Notification = {
	type?: NotificationType
	message: string
	actions?: Array<NotificationAction>
}

type NotificationAction = {
	title: string
	handleClick: () => void | PromiseLike<void>
}

type NonTypedNotification = Omit<Notification, 'type'>

type NonTypedNotificationParameters =
	| [notification: NonTypedNotification]
	| [message: string, ...actions: Array<NotificationAction>]

type NonTypedNotificationWithErrorParameters =
	| [notification: NonTypedNotification]
	| [errorMessage: string, ...actions: Array<NotificationAction>]
	| [error: Error, ...actions: Array<NotificationAction>]

function normalizeNonTypedNotificationParameters(...parameters: NonTypedNotificationParameters) {
	return typeof parameters[0] !== 'string' ? parameters[0] : {
		message: parameters[0],
		actions: parameters.slice(1) as Array<NotificationAction>,
	}
}

export abstract class NotificationComponent extends NonInertableComponent {
	static readonly shownNotifications = new Set<Notification>()

	private static DefaultComponentConstructor?: Constructor<NotificationComponent>

	static defaultComponent = () => {
		return <T extends NotificationComponent>(Constructor: Constructor<T>) => {
			NotificationComponent.DefaultComponentConstructor = Constructor
		}
	}

	static notifyInfo(...parameters: NonTypedNotificationParameters) {
		return this.notify({ type: NotificationType.Info, ...normalizeNonTypedNotificationParameters(...parameters) })
	}

	static notifySuccess(...parameters: NonTypedNotificationParameters) {
		return this.notify({ type: NotificationType.Success, ...normalizeNonTypedNotificationParameters(...parameters) })
	}

	static notifyWarning(...parameters: NonTypedNotificationParameters) {
		return this.notify({ type: NotificationType.Warning, ...normalizeNonTypedNotificationParameters(...parameters) })
	}

	static notifyError(...parameters: NonTypedNotificationParameters) {
		return this.notify({ type: NotificationType.Error, ...normalizeNonTypedNotificationParameters(...parameters) })
	}

	static notifyAndThrowError(...parameters: NonTypedNotificationWithErrorParameters) {
		let error: Error
		if (parameters[0] instanceof Error) {
			error = parameters[0]
			this.notifyError({ message: error.message, actions: parameters.slice(1) as Array<NotificationAction> })
		} else if (typeof parameters[0] === 'string') {
			error = new Error(parameters[0])
			this.notifyError({ message: error.message, actions: parameters.slice(1) as Array<NotificationAction> })
		} else {
			const notification = parameters[0]
			error = new Error(notification.message)
			this.notifyError(notification)
		}
		throw error
	}

	static async notify(notification: Notification) {
		const notificationComponent = this !== NotificationComponent
			? new (this as unknown as Constructor<NotificationComponent>)()
			: NotificationComponent.DefaultComponentConstructor
				? new NotificationComponent.DefaultComponentConstructor()
				: undefined

		if (!notificationComponent) {
			throw new Error('No notification component registered')
		}

		notificationComponent.notification = notification

		if (notificationComponent instanceof LitElement) {
			Application.topLayer.appendChild(notificationComponent)
		}

		await notificationComponent.show()

		if (notificationComponent instanceof LitElement) {
			notificationComponent.remove()
		}

		NotificationComponent.shownNotifications.add(notification)
	}

	abstract notification: Notification
	abstract show(): Promise<void>
}