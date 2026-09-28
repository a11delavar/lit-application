import { LitElement } from '@a11d/lit'
import { Application } from '../Application.js'
import { NonInertableComponent } from '@a11d/non-inertable-component'

/** The kinds of notifications. */
export enum NotificationType {
	Info = 'info',
	Success = 'success',
	Warning = 'warning',
	Error = 'error',
}

/** A notification to show: its message, with an optional type and actions. */
export type Notification = {
	type?: NotificationType
	message: string
	actions?: Array<NotificationAction>
}

/** An action of a notification, with the title of its button and what clicking it does. */
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
	return typeof parameters[0] !== 'string' && Symbol.toPrimitive in parameters[0] === false ? parameters[0] : {
		message: `${parameters[0]}`,
		actions: parameters.slice(1) as Array<NotificationAction>,
	}
}

/**
 * The base class of the element showing notifications, whose static `notify` methods send them.
 *
 * Implement `show` to show the `notification`, and register the implementation with `@NotificationComponent.defaultComponent()`.
 * Each notification gets its own instance, appended to the application's top layer while it is shown.
 */
export abstract class NotificationComponent extends NonInertableComponent {
	static readonly shownNotifications = new Set<Notification>()

	private static DefaultComponentConstructor?: Constructor<NotificationComponent>

	/** Registers the decorated class as the component that notifications sent through `NotificationComponent` are shown with. */
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

	/** Shows an error notification, then throws the given error, or an `Error` with the given message. */
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

	/** Shows the notification with this class, or with the default component if called on `NotificationComponent` itself. */
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

	/** The notification to show, set before `show` is called. */
	abstract notification: Notification
	/** Shows the `notification`, resolving once it is done showing. */
	abstract show(): Promise<void>
}