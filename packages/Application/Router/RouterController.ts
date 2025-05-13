import { type ReactiveControllerHost, staticHtml, unsafeStatic } from '@a11d/lit'
import { Router as RouterControllerBase } from '@lit-labs/router'
import { RoutableComponent } from './RoutableComponent.js'

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

	private importDecoratorRoutesIfAvailable() {
		const decoratorRoutes = [...RoutableComponent.container]
			.filter(([, { routerHostConstructor }]) => this.host.constructor === routerHostConstructor || this.host.constructor.prototype instanceof routerHostConstructor)
			.map(([route, { routableConstructor }]) => ({ route, routableConstructor }))

		for (const { routableConstructor, route } of decoratorRoutes) {
			const tagName = customElements.getName(routableConstructor)
			if (!tagName) {
				return
			}
			const tag = unsafeStatic(tagName)
			this.routes.push({
				path: route,
				render: p => {
					const query = Object.fromEntries(RoutableComponent.url.searchParams)
					return staticHtml`<${tag} .parameters=${{ ...p, ...query }}></${tag}>`
				}
			})
		}
	}
}