import { component, css, html, type HTMLTemplateResult } from '@a11d/lit'
import { Task } from '@lit/task'
import { Api } from '@a11d/api'
import { NotificationComponent, PageComponent, route, routerLink } from '@a11d/lit-application'
import { Authorization } from '@a11d/lit-application-authorization'
import { LocalStorage } from '@a11d/local-storage'
import { label } from '@a11d/metadata'
import { Order, OrderStatus } from './api.js'
import { DialogDeletion } from './DialogDeletion.js'
import { DialogOrder } from './DialogOrder.js'
import { PageOrder } from './PageOrder.js'
import { format, loading, styles } from './styles.js'

/** The orders, filtered by the status in the query string, which the chips link to. */
@component('demo-page-orders')
@route('/')
@label('Orders')
export class PageOrders extends PageComponent<{ readonly status?: OrderStatus }> {
	static override get styles() {
		return css`
			${styles}

			.filters {
				margin-block-end: 16px;
			}

			td:last-child {
				text-align: end;
			}
		`
	}

	private readonly orders = new Task(this, {
		task: ([status]) => Api.get<Array<Order>>(`/orders${!status ? '' : `?status=${status}`}`),
		args: () => [this.parameters.status] as const,
	})

	private readonly handleStorageChange = () => this.requestUpdate()

	protected override connected() {
		LocalStorage.changed.subscribe(this.handleStorageChange)
	}

	protected override disconnected() {
		LocalStorage.changed.unsubscribe(this.handleStorageChange)
	}

	protected override get template(): HTMLTemplateResult {
		return html`
			<lit-page>
				<nav class='filters row'>
					<a class='chip' ${routerLink(new PageOrders({}))}>All</a>
					${Object.values(OrderStatus).map(status => html`<a class='chip' ${routerLink(new PageOrders({ status }))}>${status}</a>`)}
				</nav>
				<div class='card'>
					${this.orders.render({ pending: loading, complete: orders => !orders.length ? html`<p class='muted'>No orders.</p>` : this.tableTemplate(orders) })}
				</div>
			</lit-page>
		`
	}

	private tableTemplate(orders: ReadonlyArray<Order>) {
		return html`
			<table>
				<thead>
					<tr>
						${(['id', 'customer', 'total', 'status', 'placedAt'] as const).map(key => html`<th>${label.get(Order, key)}</th>`)}
						<th></th>
					</tr>
				</thead>
				<tbody>
					${orders.map(order => html`
						<tr>
							<td><a ${routerLink(new PageOrder({ id: order.id }))}>#${order.id}</a></td>
							<td>${order.customer}</td>
							<td>${format.total(order.total)}</td>
							<td><span class='status' data-status=${order.status}>${order.status}</span></td>
							<td>${format.date(order.placedAt)}</td>
							<td class='row'>
								<button @click=${() => this.edit(order)}>Edit</button>
								<button ?disabled=${!Authorization.has('orders.delete')} @click=${() => this.delete(order)}>Delete</button>
							</td>
						</tr>
					`)}
				</tbody>
			</table>
		`
	}

	private async edit(order: Order) {
		const saved = await new DialogOrder({ id: order.id }).confirm().catch(() => undefined)
		if (saved) {
			NotificationComponent.notifySuccess(`Order #${saved.id} is saved.`)
			await this.orders.run()
		}
	}

	private async delete(order: Order) {
		if (await DialogDeletion.delete(order)) {
			NotificationComponent.notifySuccess(`Order #${order.id} is deleted.`)
			await this.orders.run()
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'demo-page-orders': PageOrders
	}
}
