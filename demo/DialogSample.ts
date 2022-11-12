import { component, html, state } from '@a11d/lit'
import { DialogComponent } from './index.js'

@component('demo-dialog-sample')
export class DialogSample extends DialogComponent<{ readonly message: string }, string> {
	@state() private secondsRemaining = 5
	private intervalId = -1

	protected override initialized() {
		this.intervalId = window.setInterval(() => {
			this.secondsRemaining--
			if (this.secondsRemaining <= 0) {
				clearInterval(this.intervalId)
			}
		}, 1000)
	}

	protected override get template() {
		return html`
			<lit-dialog heading='Sample Dialog'>
				<button slot='primaryAction' ?disabled=${this.secondsRemaining > 0}>OK ${this.secondsRemaining === 0 ? '' : `(${this.secondsRemaining})`}</button>
				${this.parameters.message}
			</lit-dialog>
		`
	}

	protected override primaryAction() {
		return `PROCESSED "${this.parameters.message}"`
	}
}