import { component, html } from '@a11d/lit'
import { PageComponent, route, RouterController } from './index.js'

@component('page-sub-router')
@route('/sub-router/:subRoute')
export class PageSubRouter extends PageComponent<{ readonly subRoute: string }> {
	private readonly router = new RouterController(this, [
		{ path: '/sub-router/a', render: () => html`Settings Page > A` },
		{ path: '/sub-router/b', render: () => html`Settings Page > B` },
		{ pattern: new URLPattern({ pathname: '/sub-router/c' }), render: () => html`Settings Page > C` },

	])

	protected override get template() {
		return html`
			<h1>ROUTER-HOST</h1>
			<div>${this.router.outlet()}</div>
		`
	}
}