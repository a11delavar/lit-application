import { component, css, html } from '@a11d/lit'
import { application, Application, RoutableComponent, routerLink } from '@a11d/lit-application'
import { Authentication, requiresAuthentication } from '@a11d/lit-application-authentication'
import { LocalStorage } from '@a11d/local-storage'
import { DialogSignIn } from './DialogSignIn.js'
import { PageOrders } from './PageOrders.js'
import { PageReports } from './PageReports.js'
import { PageSettings } from './PageSettings.js'
import { styles } from './styles.js'

// Deployed below a path of its site, the application's routes are too:
RoutableComponent.basePath = import.meta.env.BASE_URL.replace(/\/$/, '')

/** An order desk: a small application built on the shell, next to an inspector showing what the shell does. */
@application()
@requiresAuthentication()
@component('demo-application')
export class Demo extends Application {
	static readonly inspectorOpen = new LocalStorage('Demo.InspectorOpen', true)

	static override get styles() {
		return css`
			${super.styles}
			${styles}

			:root {
				--demo-accent: #4f5dff;
				--demo-background: light-dark(#f6f7fb, #111217);
				--demo-surface: light-dark(#ffffff, #1b1c23);
				--demo-border: light-dark(#e2e4ec, #2c2e39);
				--demo-hover: light-dark(#f0f1f7, #23252f);
				--demo-muted: light-dark(#646a7e, #9da2b6);
				font-family: system-ui, sans-serif;
				line-height: 1.4;
				color: light-dark(#1a1b22, #e7e8ee);
				background: var(--demo-background);
			}

			[application] > header {
				display: flex;
				flex-wrap: wrap;
				align-items: center;
				gap: 8px 24px;
				padding: 12px 24px;
				background: var(--demo-surface);
				border-bottom: 1px solid var(--demo-border);

				nav a {
					color: inherit;
					padding: 6px 12px;
					border-radius: 8px;

					&[data-router-selected] {
						color: var(--demo-accent);
						background: var(--demo-hover);
					}
				}

				.account {
					margin-inline-start: auto;
				}
			}

			.workspace {
				flex: 1;
				display: grid;
				grid-template-columns: 1fr 380px;

				&:not(:has(demo-inspector)) {
					grid-template-columns: 1fr;
				}

				main {
					min-width: 0;
					padding: 24px 24px 0;
				}

				lit-page-host > * {
					padding: 16px 0;
				}
			}

			demo-inspector {
				position: sticky;
				top: 0;
				max-height: 100dvh;
				box-sizing: border-box;
				background: var(--demo-surface);
				border-inline-start: 1px solid var(--demo-border);
			}

			@media (width < 900px) {
				.workspace {
					grid-template-columns: 1fr;
				}

				demo-inspector {
					position: static;
					max-height: none;
					border-inline-start: none;
					border-top: 1px solid var(--demo-border);
				}
			}
		`
	}

	protected override get bodyTemplate() {
		const inspectorOpen = Demo.inspectorOpen.value
		return html`
			<header>
				<strong>Lit Application</strong>
				<nav class='row'>
					<a ${routerLink({ component: new PageOrders({}), matchMode: 'ignore-parameters' })}>Orders</a>
					<a ${routerLink(new PageReports())}>Reports</a>
					<a ${routerLink(new PageSettings())}>Settings</a>
				</nav>
				<div class='account row'>
					${!DialogSignIn.account ? html.nothing : html`
						<span class='muted'>${DialogSignIn.account.name}</span>
						<button @click=${() => Authentication.unauthenticate()}>Sign out</button>
					`}
					<button @click=${this.toggleInspector}>${inspectorOpen ? 'Hide' : 'Show'} inspector</button>
				</div>
			</header>
			<div class='workspace'>
				<main>
					<h2>${this.pageHeading}</h2>
					${this.pageHostTemplate}
				</main>
				${!inspectorOpen ? html.nothing : html`<demo-inspector></demo-inspector>`}
			</div>
			${this.topLayerTemplate}
		`
	}

	private readonly toggleInspector = () => {
		Demo.inspectorOpen.value = !Demo.inspectorOpen.value
		this.requestUpdate()
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'demo-application': Demo
	}
}
