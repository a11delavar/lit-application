import { component, css, html } from '@a11d/lit'
import { DialogComponent, DialogConfirmationStrategy, NotificationComponent, PageComponent, route } from '@a11d/lit-application'
import { type LocalStorage } from '@a11d/local-storage'
import { label } from '@a11d/metadata'
import { Server } from './server.js'
import { styles } from './styles.js'

/** Preferences kept in local storage: where dialogs with a route open, and how slow the back end answers. */
@component('demo-page-settings')
@route('/settings')
@label('Settings')
export class PageSettings extends PageComponent {
	static override get styles() {
		return css`
			${styles}

			.card {
				display: grid;
				gap: 12px;
				margin-block-end: 16px;
			}
		`
	}

	protected override get template() {
		const strategy = DialogComponent.poppableConfirmationStrategy
		return html`
			<lit-page>
				<section class='card'>
					<h3>Dialogs</h3>
					<p class='muted'>Where a dialog with a route, such as editing an order, opens. Any dialog also pops out with its 🚀 button.</p>
					<div class='row'>
						${[DialogConfirmationStrategy.Dialog, DialogConfirmationStrategy.Tab, DialogConfirmationStrategy.Window].map(value => html`
							<label class='row'>
								<input type='radio' name='strategy' .checked=${strategy.value === value} @change=${() => this.set(strategy, value)}>
								${DialogConfirmationStrategy[value]}
							</label>
						`)}
					</div>
				</section>
				<section class='card'>
					<h3>Back end</h3>
					<label class='row'>
						Latency
						<input type='range' min='0' max='2000' step='100' .value=${String(Server.latency.value)} @input=${(e: InputEvent) => this.set(Server.latency, (e.target as HTMLInputElement).valueAsNumber)}>
						<span class='muted'>${Server.latency.value} ms</span>
					</label>
					<div>
						<button @click=${this.reset}>Reset the orders</button>
					</div>
				</section>
			</lit-page>
		`
	}

	private set<T>(storage: LocalStorage<T>, value: T) {
		storage.value = value
		this.requestUpdate()
	}

	private readonly reset = () => {
		Server.reset()
		NotificationComponent.notifyInfo('The orders are back as they were.')
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'demo-page-settings': PageSettings
	}
}