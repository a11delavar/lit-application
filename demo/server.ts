import { PureEventDispatcher } from '@a11d/lit'
import { LocalStorage } from '@a11d/local-storage'

type OrderRow = {
	readonly id: number
	readonly customer: string
	readonly totalCents: number
	readonly status: string
	readonly placedAt: string
}

/** One request the back end answered. */
export type Exchange = {
	readonly method: string
	readonly path: string
	readonly status: number
	readonly duration: number
}

const day = 24 * 60 * 60 * 1000

const seed: ReadonlyArray<OrderRow> = [
	['Ada Lovelace', 12990, 'open'],
	['Grace Hopper', 4550, 'shipped'],
	['Alan Turing', 23000, 'open'],
	['Katherine Johnson', 8999, 'shipped'],
	['Edsger Dijkstra', 1500, 'cancelled'],
	['Barbara Liskov', 31050, 'open'],
	['Donald Knuth', 6400, 'shipped'],
].map(([customer, totalCents, status], index) => ({
	id: index + 1,
	customer: customer as string,
	totalCents: totalCents as number,
	status: status as string,
	placedAt: new Date(Date.UTC(2026, 8, 1) + index * 3 * day).toISOString(),
}))

/**
 * The demo's back end, answering in the browser the requests `Api` sends to `/api`, as a server would and with its latency.
 * Its orders live in local storage, which a dialog popped out into another tab shares.
 */
export class Server {
	static readonly latency = new LocalStorage('Demo.Latency', 400)
	static readonly exchanged = new PureEventDispatcher<Exchange>()

	private static get orders(): Array<OrderRow> { return JSON.parse(localStorage.getItem('Demo.Orders') ?? 'null') ?? [...seed] }
	private static set orders(value) { localStorage.setItem('Demo.Orders', JSON.stringify(value)) }

	static reset() {
		localStorage.removeItem('Demo.Orders')
	}

	static async handle(request: Request) {
		const started = performance.now()
		const url = new URL(request.url)
		const path = url.pathname.slice('/api'.length)
		await new Promise(resolve => setTimeout(resolve, Server.latency.value))
		const [status, body] = await Server.respond(request, path, url.searchParams)
		Server.exchanged.dispatch({ method: request.method, path: path + url.search, status, duration: Math.round(performance.now() - started) })
		return new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
	}

	private static async respond(request: Request, path: string, query: URLSearchParams): Promise<[status: number, body?: unknown]> {
		const [, resource, id] = path.split('/')
		const account = accountOf(request.headers.get('Authorization')?.replace(/^Bearer demo:/, ''))
		const order = Server.orders.find(order => order.id === Number(id))
		switch (`${request.method} /${resource}${id === undefined ? '' : '/:id'}`) {
			case 'POST /sign-in': {
				const { username, password } = await request.json() as { readonly username: string, readonly password: string }
				return !username.trim() || password !== 'demo'
					? [401, { message: 'Incorrect credentials: any name will do with the password "demo".' }]
					: [200, { token: `demo:${username.trim()}`, account: accountOf(username.trim()) }]
			}
			case 'GET /account':
				return [200, account ?? null]
			case 'GET /orders':
				return [200, Server.orders.filter(order => !query.get('status') || order.status === query.get('status')).map(tagged)]
			case 'GET /orders/:id':
				return !order ? [404, { message: `There is no order #${id}.` }] : [200, tagged(order)]
			case 'PUT /orders/:id': {
				const { customer, totalCents, status, placedAt } = await request.json() as OrderRow
				if (!account) {
					return [401, { message: 'Sign in to change orders.' }]
				}
				if (!order) {
					return [404, { message: `There is no order #${id}.` }]
				}
				if (!customer.trim() || !(totalCents > 0)) {
					return [422, { message: 'An order needs a customer and a total above zero.' }]
				}
				const updated = { id: order.id, customer: customer.trim(), totalCents, status, placedAt }
				Server.orders = Server.orders.map(existing => existing.id === order.id ? updated : existing)
				return [200, tagged(updated)]
			}
			case 'DELETE /orders/:id':
				if (!account?.authorizations.includes('orders.delete')) {
					return [403, { message: 'Only accounts with the "orders.delete" authorization delete orders.' }]
				}
				Server.orders = Server.orders.filter(existing => existing.id !== order?.id)
				return [204]
			case 'GET /reports':
				return [200, ['open', 'shipped', 'cancelled'].map(status => {
					const orders = Server.orders.filter(order => order.status === status)
					return { status, count: orders.length, totalCents: orders.reduce((sum, order) => sum + order.totalCents, 0) }
				})]
			default:
				return [404, { message: `${request.method} ${path} does not exist.` }]
		}
	}
}

function tagged(order: OrderRow) {
	return { '@type': 'Order', ...order }
}

function accountOf(name: string | undefined) {
	return !name ? undefined : { '@type': 'Account', name, authorizations: name === 'admin' ? ['orders.delete', 'reports.read'] : [] }
}

const fetch = globalThis.fetch
globalThis.fetch = (input, init) => {
	const request = new Request(input, init)
	return new URL(request.url).pathname.startsWith('/api/') ? Server.handle(request) : fetch(input, init)
}
