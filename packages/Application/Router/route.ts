import { type Component } from '@a11d/lit'
import { Application } from '../Application.js'
import { RoutableComponent, type RoutableComponentConstructor } from './RoutableComponent.js'

type RouteParameters =
	| [...routes: Array<string>]
	| [RouterHost: Constructor<Component>, ...routes: Array<string>]

function getParameters(...parameters: RouteParameters) {
	return typeof parameters[0] === 'string'
		? {
			routerHostConstructor: Application as unknown as Constructor<Component>,
			routes: parameters as Array<string>,
		} : {
			routerHostConstructor: parameters[0] as unknown as Constructor<Component>,
			routes: parameters.slice(1) as Array<string>,
		}
}

export const route = (...parameters: RouteParameters) => {
	return (routableConstructor: RoutableComponentConstructor) => {
		const { routerHostConstructor, routes } = getParameters(...parameters)
		for (const route of routes) {
			RoutableComponent.container.set(route, { routerHostConstructor, routableConstructor })
		}
	}
}