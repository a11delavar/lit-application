import { LitElement } from "@a11d/lit"
import { Application } from "../Application.js"
import { NonInertableComponent } from "@a11d/non-inertable-component"

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
	| [notification: Partial<NonTypedNotification>]
	| [message?: string, ...actions: Array<NotificationAction>]

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

	static notifyInfo(...notification: NonTypedNotificationParameters) {
		return this.notify({ type: NotificationType.Info, ...normalizeNonTypedNotificationParameters(...notification) })
	}

	static notifySuccess(...notification: NonTypedNotificationParameters) {
		return this.notify({ type: NotificationType.Success, ...normalizeNonTypedNotificationParameters(...notification) })
	}

	static notifyWarning(...notification: NonTypedNotificationParameters) {
		return this.notify({ type: NotificationType.Warning, ...normalizeNonTypedNotificationParameters(...notification) })
	}

	static notifyError(...notification: NonTypedNotificationParameters) {
		return this.notify({ type: NotificationType.Error, ...normalizeNonTypedNotificationParameters(...notification) })
	}

	static notifyAndThrowError<TError extends Error>(error: TError, ...notification: NonTypedNotificationWithErrorParameters) {
		const normalizedNotification = notification.length === 0
			? {} as NonTypedNotification
			: normalizeNonTypedNotificationParameters(...notification as NonTypedNotificationParameters)
		normalizedNotification.message ??= error.message
		this.notifyError(normalizedNotification)
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