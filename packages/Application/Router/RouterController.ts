import { type ReactiveControllerHost } from '@a11d/lit'
import { Router as RouterControllerBase } from '@lit-labs/router'
import { RoutableComponent } from './RoutableComponent.js'

export class RouterController extends RouterControllerBase {
	protected readonly host: ReactiveControllerHost & HTMLElement

	override hostConnected() {
		this.importRoutableComponents()
		super.hostConnected()
	}

	constructor(...args: ConstructorParameters<typeof RouterControllerBase>) {
		super(...args)
		this.host = args[0]
	}

	private importRoutableComponents() {
		this.routes.push(
			...[...RoutableComponent.container]
				.filter(Constructor => this.host.constructor === Constructor.host || this.host.constructor.prototype instanceof Constructor.host)
				.flatMap(Constructor => Constructor.routes.map(route => ({
					path: route,
					render: (p: Record<string, string | undefined>) => Constructor.render(p),
				})))
		)
	}
}