import { Router as RouterControllerBase } from '@lit-labs/router'
import { PageComponent } from '../index.js'
import { Router } from './Router.js'

export class RouterController extends RouterControllerBase {
	override hostConnected() {
		this.importDecoratorRoutesIfAvailable()
		super.hostConnected()
	}

	private readonly pagesByRoute = new Map<string, PageComponent>()

	private importDecoratorRoutesIfAvailable() {
		const decoratorRoutes = [...Router.container]
			.filter(([, { routerHostConstructor }]) => this['_host'].constructor === routerHostConstructor || this['_host'].constructor.prototype instanceof routerHostConstructor)
			.map(([route, { pageConstructor }]) => ({ route, pageConstructor }))

		for (const { pageConstructor, route } of decoratorRoutes) {
			this.routes.push({
				path: route,
				render: p => {
					const cached = this.pagesByRoute.get(route)
					if (cached) {
						return cached
					}
					const page = new pageConstructor(p)
					this.pagesByRoute.set(route, page)
					return page
				}
			})
		}
	}
}