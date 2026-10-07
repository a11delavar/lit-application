import { JwtApiAuthenticator } from '@a11d/api-jwt'
import { Application } from '@a11d/lit-application'
import { Authorization } from '@a11d/lit-application-authorization'
import { OrderStatus } from './api.js'
import { PageOrder } from './PageOrder.js'
import { PageOrders } from './PageOrders.js'
import { PageReports } from './PageReports.js'
import { Server } from './server.js'

describe('Demo', () => {
	const url = location.href

	beforeAll(async () => {
		Server.latency.value = 0
		JwtApiAuthenticator.token = 'demo:admin'
		const routed = new Promise(resolve => window.addEventListener('Application.routed', resolve, { once: true }))
		await import('./index.js')
		await routed
	})

	// A navigation starting while the view transition of the last one runs rejects that transition's promises, which nothing handles.
	beforeEach(() => {
		if ('startViewTransition' in document) {
			vi.spyOn(document, 'startViewTransition').mockImplementation(update => {
				(update as () => void)()
				return {} as ViewTransition
			})
		}
	})

	afterAll(() => {
		Application.instance?.remove()
		history.replaceState(null, '', url)
	})

	const rendered = <T extends keyof HTMLElementTagNameMap>(tagName: T, matches: (text: string) => boolean) => vi.waitUntil(() => {
		const element = document.querySelector(tagName)
		return matches(element?.shadowRoot?.textContent ?? '') ? element : undefined
	})

	it('should sign in with the remembered token before routing', () => {
		expect(document.querySelector('demo-application')!.textContent).toContain('admin')
	})

	it('should list the orders the back end sends', async () => {
		await new PageOrders({}).navigate()
		const page = await rendered('demo-page-orders', text => text.includes('Ada Lovelace'))
		expect(page.shadowRoot!.querySelectorAll('tbody tr').length).toBe(7)
	})

	it('should filter the orders by the status in the query string', async () => {
		await new PageOrders({ status: OrderStatus.Shipped }).navigate()
		await rendered('demo-page-orders', text => text.includes('Grace Hopper') && !text.includes('Ada Lovelace'))
		expect(location.search).toBe('?status=shipped')
	})

	it('should construct an order as an instance of its model', async () => {
		await new PageOrder({ id: 3 }).navigate()
		const page = await rendered('demo-page-order', text => text.includes('Alan Turing'))
		expect(location.pathname).toBe('/orders/3')
		expect(page.shadowRoot!.textContent).toContain('an Order, from the @type')
	})

	it('should render an error page for reports without the authorization', async () => {
		Authorization.revoke('reports.read')
		await new PageReports().navigate()
		await vi.waitUntil(() => document.querySelector('lit-page-error'))
	})
})
