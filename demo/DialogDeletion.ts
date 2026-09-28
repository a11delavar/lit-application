import { component, html } from '@a11d/lit'
import { Api } from '@a11d/api'
import { DialogCancelledError, DialogComponent } from '@a11d/lit-application'
import { label } from '@a11d/metadata'
import type { Order } from './api.js'
import { format, styles } from './styles.js'

/** Asks before deleting an order, which "Keep" answers by cancelling. */
@component('demo-dialog-deletion')
@label('Delete order')
export class DialogDeletion extends DialogComponent<{ readonly order: Order }> {
	/** Deletes the order once confirmed, and tells whether it was. */
	static async delete(order: Order) {
		try {
			await new DialogDeletion({ order }).confirm()
			return true
		} catch (error) {
			if (error instanceof DialogCancelledError) {
				return false
			}
			throw error
		}
	}

	static override get styles() {
		return styles
	}

	protected override get template() {
		const { order } = this.parameters
		return html`
			<lit-dialog>
				<button slot='primaryAction' class='primary'>Delete</button>
				<button slot='secondaryAction'>Keep</button>
				<p>Order #${order.id} of ${order.customer} over ${format.total(order.total)} is deleted for good.</p>
			</lit-dialog>
		`
	}

	protected override async primaryAction() {
		await Api.delete(`/orders/${this.parameters.order.id}`)
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'demo-dialog-deletion': DialogDeletion
	}
}