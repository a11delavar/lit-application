import { Router as RouterControllerBase } from '@lit-labs/router'
import { type ReactiveControllerHost } from '@a11d/lit'
import { type Routable } from './Routable.js'
import { Router } from './Router.js'
import { equals } from '@a11d/equals'

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

	private currentRoutable?: Routable

	private importDecoratorRoutesIfAvailable() {
		const decoratorRoutes = [...Router.container]
			.filter(([, { routerHostConstructor }]) => this.host.constructor === routerHostConstructor || this.host.constructor.prototype instanceof routerHostConstructor)
			.map(([route, { routableConstructor }]) => ({ route, routableConstructor }))

		for (const { routableConstructor, route } of decoratorRoutes) {
			this.routes.push({
				path: route,
				render: p => {
					const parameters = { ...p, ...Router.queryParameters }
					return this.currentRoutable?.constructor === routableConstructor && Object[equals](this.currentRoutable?.parameters, parameters)
						? this.currentRoutable
						: this.currentRoutable = new routableConstructor(parameters)
				}
			})
		}
	}
}