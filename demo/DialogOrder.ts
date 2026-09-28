import { component, html } from '@a11d/lit'
import { Task } from '@lit/task'
import { Api } from '@a11d/api'
import { DialogComponent, route } from '@a11d/lit-application'
import { label } from '@a11d/metadata'
import { Order, OrderStatus } from './api.js'
import { loading, styles } from './styles.js'

/**
 * Edits an order and resolves with it once the back end saved it. An error the back end answers with keeps the dialog
 * open and shows as a notification. Its route lets it pop out into a tab or window.
 */
@component('demo-dialog-order')
@route('/orders/:id/edit')
export class DialogOrder extends DialogComponent<{ readonly id: number }, Order> {
	static override get styles() {
		return styles
	}

	private readonly order = new Task(this, {
		task: ([id]) => Api.get<Order>(`/orders/${id}`),
		args: () => [this.parameters.id] as const,
	})

	protected override get template() {
		return html`
			<lit-dialog heading=${`Order #${this.parameters.id}`} primaryOnEnter>
				<button slot='primaryAction' class='primary'>Save</button>
				<button slot='secondaryAction'>Cancel</button>
				${this.order.render({ pending: loading, complete: order => this.formTemplate(order) })}
			</lit-dialog>
		`
	}

	private formTemplate(order: Order) {
		return html`
			<div class='form'>
				<label>
					${label.get(Order, 'customer')}
					<input .value=${order.customer} @input=${(e: InputEvent) => order.customer = (e.target as HTMLInputElement).value}>
				</label>
				<label>
					${label.get(Order, 'total')}
					<input type='number' step='0.01' .value=${String(order.total)} @input=${(e: InputEvent) => order.total = (e.target as HTMLInputElement).valueAsNumber}>
				</label>
				<label>
					${label.get(Order, 'status')}
					<select @change=${(e: Event) => order.status = (e.target as HTMLSelectElement).value as OrderStatus}>
						${Object.values(OrderStatus).map(status => html`<option value=${status} ?selected=${status === order.status}>${status}</option>`)}
					</select>
				</label>
				<p class='muted'>Empty the customer to see the back end refuse, and the dialog stay open.</p>
			</div>
		`
	}

	protected override primaryAction() {
		return Api.put<Order>(`/orders/${this.parameters.id}`, this.order.value)
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'demo-dialog-order': DialogOrder
	}
}