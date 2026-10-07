import { Component, component, css, eventListener, html, PureEventDispatcher } from '@a11d/lit'
import { Application, DialogComponent, NotificationComponent, PageComponent, RoutableComponent } from '@a11d/lit-application'
import { Authorization } from '@a11d/lit-application-authorization'
import { LocalStorage } from '@a11d/local-storage'
import { DialogSignIn } from './DialogSignIn.js'
import { Server } from './server.js'
import { styles } from './styles.js'

type Kind = 'lifecycle' | 'route' | 'hook' | 'dialog' | 'notification' | 'request'

type Entry = {
	readonly time: number
	readonly kind: Kind
	readonly text: string
	readonly detail?: string
}

/** Shows what the application shell and the back end do as it happens: the route, the session, local storage and a log. */
@component('demo-inspector')
export class Inspector extends Component {
	private static readonly entries = new Array<Entry>()
	private static readonly logged = new PureEventDispatcher<void>()

	static log(kind: Kind, text: string, detail?: unknown) {
		Inspector.entries.unshift({ time: performance.now(), kind, text, detail: detail === undefined ? undefined : typeof detail === 'string' ? detail : JSON.stringify(detail) })
		Inspector.entries.splice(200)
		Inspector.logged.dispatch()
	}

	static override get styles() {
		return css`
			${styles}

			:host {
				display: flex;
				flex-direction: column;
				gap: 16px;
				padding: 16px;
				font-size: 0.9em;
				overflow: auto;
			}

			section {
				display: grid;
				gap: 8px;
			}

			h3 {
				font-size: 0.8em;
				text-transform: uppercase;
				letter-spacing: 0.08em;
				color: var(--demo-muted);
			}

			dl {
				display: grid;
				grid-template-columns: max-content 1fr;
				gap: 4px 12px;
				margin: 0;

				dd {
					margin: 0;
					overflow-wrap: anywhere;
				}
			}

			ol {
				list-style: none;
				margin: 0;
				padding: 0;
				display: grid;
				gap: 6px;
			}

			li {
				display: grid;
				grid-template-columns: 56px 1fr;
				gap: 2px 8px;
				padding-inline-start: 8px;
				border-inline-start: 3px solid var(--kind);

				time {
					color: var(--demo-muted);
					font-variant-numeric: tabular-nums;
				}

				code {
					grid-column: 2;
					color: var(--demo-muted);
					overflow-wrap: anywhere;
				}

				&[data-kind=lifecycle] { --kind: #8b5cf6; }
				&[data-kind=route] { --kind: #0ea5e9; }
				&[data-kind=hook] { --kind: #14b8a6; }
				&[data-kind=dialog] { --kind: #f59e0b; }
				&[data-kind=notification] { --kind: #ec4899; }
				&[data-kind=request] { --kind: #64748b; }
			}
		`
	}

	private readonly handleChange = () => this.requestUpdate()

	private readonly clear = () => {
		Inspector.entries.length = 0
		this.requestUpdate()
	}

	protected override connected() {
		Inspector.logged.subscribe(this.handleChange)
		LocalStorage.changed.subscribe(this.handleChange)
	}

	protected override disconnected() {
		Inspector.logged.unsubscribe(this.handleChange)
		LocalStorage.changed.unsubscribe(this.handleChange)
	}

	@eventListener({ target: window, type: 'Application.routed' })
	protected handleRouted() {
		this.requestUpdate()
	}

	/** Once a page announces its heading it is connected, and the route knows its component. */
	@eventListener({ target: window, type: 'pageHeadingChange' })
	protected handlePageHeadingChange() {
		this.requestUpdate()
	}

	protected override get template() {
		const bound = RoutableComponent.boundComponent
		return html`
			<section>
				<h3>Route</h3>
				<dl>
					<dt>URL</dt>
					<dd><code>${RoutableComponent.url.path}</code></dd>
					<dt>Component</dt>
					<dd><code>${!bound ? '–' : `<${bound.localName}>`}</code></dd>
					<dt>Parameters</dt>
					<dd><code>${JSON.stringify(bound?.parameters ?? {})}</code></dd>
				</dl>
			</section>
			<section>
				<h3>Session</h3>
				<div>${!DialogSignIn.account ? 'Signed out' : html`Signed in as <strong>${DialogSignIn.account.name}</strong>`}</div>
				<div class='row'>
					${['orders.delete', 'reports.read'].map(authorization => html`
						<label class='row'>
							<input type='checkbox' .checked=${Authorization.has(authorization)} @change=${(e: Event) => (e.target as HTMLInputElement).checked ? Authorization.grant(authorization) : Authorization.revoke(authorization)}>
							<code>${authorization}</code>
						</label>
					`)}
				</div>
			</section>
			<section>
				<h3>Local storage</h3>
				<dl>
					${Object.entries(localStorage).filter(([key]) => key !== 'Demo.Orders').map(([key, value]) => html`<dt><code>${key}</code></dt>
						<dd><code>${value}</code></dd>`)}
				</dl>
			</section>
			<section>
				<div class='row'>
					<h3>Log</h3>
					<button @click=${this.clear}>Clear</button>
				</div>
				<ol>
					${Inspector.entries.map(entry => html`
						<li data-kind=${entry.kind}>
							<time>${(entry.time / 1000).toFixed(2)}s</time>
							<span>${entry.text}</span>
							${!entry.detail ? html.nothing : html`<code>${entry.detail}</code>`}
						</li>
					`)}
				</ol>
			</section>
		`
	}
}

for (const type of ['Application.connected', 'Application.initialized', 'Application.routed']) {
	window.addEventListener(type, () => Inspector.log('lifecycle', type))
}

window.addEventListener('popstate', () => Inspector.log('route', RoutableComponent.url.path))

Application.beforeRouteHooks.add(() => Inspector.log('hook', 'Application.beforeRouteHooks', 'signing in, as the application requires authentication'))
PageComponent.connectingHooks.add(page => Inspector.log('hook', `<${page.localName}> connecting`, page.parameters ?? {}))
DialogComponent.connectingHooks.add(dialog => Inspector.log('dialog', `<${dialog.localName}> opening`, dialog.parameters ?? {}))

Server.exchanged.subscribe(({ method, path, status, duration }) => Inspector.log('request', `${method} /api${path}`, `${status} after ${duration} ms`))

const { confirm } = DialogComponent.prototype
DialogComponent.prototype.confirm = function (this: DialogComponent<any, any>, ...parameters) {
	const confirmation = confirm.apply(this, parameters)
	confirmation.then(
		result => Inspector.log('dialog', `<${this.localName}> resolved`, result),
		(error: Error) => Inspector.log('dialog', `<${this.localName}> rejected`, `${error.constructor.name}: ${error.message}`),
	)
	return confirmation
}

const { notify } = NotificationComponent
NotificationComponent.notify = function (notification) {
	Inspector.log('notification', notification.message, notification.type)
	return notify.call(this, notification)
}

declare global {
	interface HTMLElementTagNameMap {
		'demo-inspector': Inspector
	}
}
