import { component } from '@a11d/lit'
import { type Notification as NotificationObject, NotificationComponent, NotificationType } from '@a11d/lit-application'

@component('lit-notification')
@NotificationComponent.defaultComponent()
export class Notification extends NotificationComponent {
	private static readonly typeEmojisByType = new Map([
		[NotificationType.Info, 'ℹ️'],
		[NotificationType.Success, '✅'],
		[NotificationType.Warning, '⚠️'],
		[NotificationType.Error, '❌'],
	])

	notification!: NotificationObject

	async show() {
		if (!('Notification' in window)) {
			return this.fallbackToAlert()
		}

		if (globalThis.Notification.permission !== 'granted' && await globalThis.Notification.requestPermission() !== 'granted') {
			return this.fallbackToAlert()
		}

		const title = [
			!this.notification.type ? undefined : Notification.typeEmojisByType.get(this.notification.type) ?? undefined,
			this.notification.message,
		].filter(Boolean).join(' ')

		new globalThis.Notification(title, {
			actions: this.notification.actions?.map(action => ({
				title: action.title,
				action: action.title
			})),
		} as any)
	}

	private fallbackToAlert() {
		alert(this.notification.message)
		return Promise.resolve()
	}
}