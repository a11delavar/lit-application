import { type Component } from '@a11d/lit'
import { RoutableComponent, type RoutableComponentConstructor } from './RoutableComponent.js'

type RouteParameters =
	| [...routes: Array<string>]
	| [host: Constructor<Component>, ...routes: Array<string>]

export const route = (...parameters: RouteParameters) => {
	return (RoutableComponentConstructor: RoutableComponentConstructor) => {
		if (typeof parameters[0] === 'string') {
			RoutableComponentConstructor.routes = parameters as Array<string>
		} else {
			const [host, ...routes] = parameters
			RoutableComponentConstructor.host = host
			RoutableComponentConstructor.routes = routes as Array<string>
		}
		RoutableComponent.container.add(RoutableComponentConstructor)
	}
}