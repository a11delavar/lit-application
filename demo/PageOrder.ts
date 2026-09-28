import { component, css, html } from '@a11d/lit'
import { Task } from '@lit/task'
import { Api } from '@a11d/api'
import { NotificationComponent, PageComponent, route, routerLink } from '@a11d/lit-application'
import { Authorization } from '@a11d/lit-application-authorization'
import { LocalStorage } from '@a11d/local-storage'
import { label } from '@a11d/metadata'
import { Order } from './api.js'
import { DialogDeletion } from './DialogDeletion.js'
import { DialogOrder } from './DialogOrder.js'
import { PageOrders } from './PageOrders.js'
import { format, loading, styles } from './styles.js'

/** One order, at the path its number is part of. */
@component('demo-page-order')
@route('/orders/:id')
export class PageOrder extends PageComponent<{ readonly id: number }> {
	static override get styles() {
		return css`
			${styles}

			dl {
				display: grid;
				grid-template-columns: max-content 1fr;
				gap: 12px 24px;
				margin: 0 0 16px;
			}

			dt {
				color: var(--demo-muted);
			}

			dd {
				margin: 0;
			}
		`
	}

	private readonly order = new Task(this, {
		task: ([id]) => Api.get<Order>(`/orders/${id}`),
		args: () => [this.parameters.id] as const,
	})

	private readonly handleStorageChange = () => this.requestUpdate()

	protected override connected() {
		LocalStorage.changed.subscribe(this.handleStorageChange)
	}

	protected override disconnected() {
		LocalStorage.changed.unsubscribe(this.handleStorageChange)
	}

	protected override get template() {
		return html`
			<lit-page heading=${`Order #${this.parameters.id}`}>
				<p><a ${routerLink(new PageOrders({}))}>← All orders</a></p>
				<div class='card'>
					${this.order.render({
						pending: loading,
						error: error => html`<p class='muted'>${(error as Error).message}</p>`,
						complete: order => this.orderTemplate(order),
					})}
				</div>
			</lit-page>
		`
	}

	private orderTemplate(order: Order) {
		return html`
			<dl>
				<dt>${label.get(Order, 'customer')}</dt>
				<dd>${order.customer}</dd>
				<dt>${label.get(Order, 'total')}</dt>
				<dd>${format.total(order.total)}</dd>
				<dt>${label.get(Order, 'status')}</dt>
				<dd><span class='status' data-status=${order.status}>${order.status}</span></dd>
				<dt>${label.get(Order, 'placedAt')}</dt>
				<dd>${format.date(order.placedAt)}</dd>
				<dt>Constructed as</dt>
				<dd>${order instanceof Order ? html`an <code>Order</code>` : 'a plain object'}, from the <code>@type</code> the back end sends</dd>
			</dl>
			<div class='row'>
				<button class='primary' @click=${() => this.edit(order)}>Edit</button>
				<button ?disabled=${!Authorization.has('orders.delete')} @click=${() => this.delete(order)}>Delete</button>
			</div>
		`
	}

	private async edit(order: Order) {
		if (await new DialogOrder({ id: order.id }).confirm().catch(() => undefined)) {
			NotificationComponent.notifySuccess(`Order #${order.id} is saved.`)
			await this.order.run()
		}
	}

	private async delete(order: Order) {
		if (await DialogDeletion.delete(order)) {
			NotificationComponent.notifySuccess(`Order #${order.id} is deleted.`)
			await new PageOrders({}).navigate()
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'demo-page-order': PageOrder
	}
}