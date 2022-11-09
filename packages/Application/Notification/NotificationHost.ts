import { Component, state, css, html, component, LitElement } from '@a11d/lit'
import { nonInertable, queryInstanceElement } from '../index.js'
import { NotificationComponent } from './NotificationComponent.js'

export const enum NotificationType {
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

@component('lit-notification-host')
@nonInertable()
export class NotificationHost extends Component {
	static readonly shownNotifications = new Set<Notification>()

	@queryInstanceElement() static readonly instance: NotificationHost | undefined

	static notificationComponent = () => {
		return <T extends NotificationComponent>(Constructor: Constructor<T>) => {
			NotificationHost.NotificationComponentConstructor = Constructor
		}
	}

	private static NotificationComponentConstructor: Constructor<NotificationComponent>

	notifyInfo(...notification: NonTypedNotificationParameters) {
		return this.notify({ type: NotificationType.Info, ...normalizeNonTypedNotificationParameters(...notification) })
	}

	notifySuccess(...notification: NonTypedNotificationParameters) {
		return this.notify({ type: NotificationType.Success, ...normalizeNonTypedNotificationParameters(...notification) })
	}

	notifyWarning(...notification: NonTypedNotificationParameters) {
		return this.notify({ type: NotificationType.Warning, ...normalizeNonTypedNotificationParameters(...notification) })
	}

	notifyError(...notification: NonTypedNotificationParameters) {
		return this.notify({ type: NotificationType.Error, ...normalizeNonTypedNotificationParameters(...notification) })
	}

	notifyAndThrowError<TError extends Error>(error: TError, ...notification: NonTypedNotificationWithErrorParameters) {
		const normalizedNotification = normalizeNonTypedNotificationParameters(...notification as NonTypedNotificationParameters)
		normalizedNotification.message ??= error.message
		this.notifyError(normalizedNotification)
		throw error
	}

	async notify(notification: Notification) {
		const notificationComponent = new NotificationHost.NotificationComponentConstructor
		notificationComponent.notification = notification

		if (notificationComponent instanceof LitElement) {
			this.notifications.add(notificationComponent)
			this.requestUpdate()
		}

		await notificationComponent.show()

		if (notificationComponent instanceof LitElement) {
			this.notifications.delete(notificationComponent)
			this.requestUpdate()
		}

		NotificationHost.shownNotifications.add(notification)
	}

	override createRenderRoot() {
		return this
	}

	static override get styles() {
		return css`
			:host {
				z-index: var(--lit-notification-host-z-index, 8);
				position: fixed;
				inset-block-end: 0;
				inset-inline: 0;
				max-height: max(50vh, 50%);

				display: grid;
				justify-items: center;
				justify-content: center;
				gap: 0.5vh;

				overflow: hidden;
			}
		`
	}

	@state() private readonly notifications = new Set<NotificationComponent>()

	protected override get template() {
		return html`${this.notifications}`
	}
}

Object.defineProperty(globalThis, 'notificationHost', {
	get: () => NotificationHost.instance,
	configurable: false,
})

declare global {
	// eslint-disable-next-line no-var
	const notificationHost: NotificationHost
	interface HTMLElementTagNameMap {
		'lit-notification-host': NotificationHost
	}
}