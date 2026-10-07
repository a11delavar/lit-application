import { component, css, html } from '@a11d/lit'
import { type Notification, NotificationComponent, NotificationType } from '@a11d/lit-application'
import { styles } from './styles.js'

/** Shows notifications as toasts, in place of the system notifications `@a11d/lit-application-native` would show. */
@component('demo-toast')
@NotificationComponent.defaultComponent()
export class Toast extends NotificationComponent {
	private static readonly shown = new Set<Toast>()

	private static readonly iconsByType = new Map([
		[NotificationType.Info, 'ℹ️'],
		[NotificationType.Success, '✅'],
		[NotificationType.Warning, '⚠️'],
		[NotificationType.Error, '⛔'],
	])

	notification!: Notification

	static override get styles() {
		return css`
			${styles}

			:host {
				position: fixed;
				inset-inline-end: 16px;
				bottom: 16px;
				display: flex;
				align-items: center;
				gap: 12px;
				max-width: min(420px, calc(100vw - 32px));
				padding: 12px 16px;
				border-radius: 12px;
				background: var(--demo-surface);
				border: 1px solid var(--demo-border);
				box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
				animation: enter 0.2s ease-out;
			}

			@keyframes enter {
				from {
					translate: 0 16px;
					opacity: 0;
				}
			}
		`
	}

	protected override get template() {
		return html`
			<span>${Toast.iconsByType.get(this.notification.type ?? NotificationType.Info)}</span>
			<span>${this.notification.message}</span>
			${this.notification.actions?.map(action => html`<button @click=${action.handleClick}>${action.title}</button>`)}
		`
	}

	async show() {
		Toast.shown.add(this)
		this.style.bottom = `${16 + (Toast.shown.size - 1) * 64}px`
		await new Promise(resolve => setTimeout(resolve, 4000))
		Toast.shown.delete(this)
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'demo-toast': Toast
	}
}
