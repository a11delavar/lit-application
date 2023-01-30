import { Router as RouterControllerBase } from '@lit-labs/router'
import { ReactiveControllerHost } from '@a11d/lit'
import { PageComponent } from '../index.js'
import { Router } from './Router.js'

export class RouterController extends RouterControllerBase {
	protected readonly host: ReactiveControllerHost & HTMLElement

	override hostConnected() {
		this.importDecoratorRoutesIfAvailable()
		super.hostConnected()
	}

	constructor(...args: ConstructorParameters<typeof RouterControllerBase>) {
		super(...args)
		this.host = args[0]
	}

	private currentPage?: PageComponent<any>

	private importDecoratorRoutesIfAvailable() {
		const decoratorRoutes = [...Router.container]
			.filter(([, { routerHostConstructor }]) => this.host.constructor === routerHostConstructor || this.host.constructor.prototype instanceof routerHostConstructor)
			.map(([route, { pageConstructor, getTemplate }]) => ({ route, pageConstructor, getTemplate }))

		for (const { pageConstructor, route, getTemplate } of decoratorRoutes) {
			this.routes.push({
				path: route,
				render: p => {
					// How to distinguish between the same page with different parameters?
					getTemplate
					return this.currentPage?.parameters === p && this.currentPage?.constructor === pageConstructor
						? this.currentPage
						: this.currentPage = new pageConstructor(p)
				}
			})
		}
	}
}