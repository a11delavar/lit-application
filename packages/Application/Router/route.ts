import { type Component } from '@a11d/lit'
import { RoutableComponent, type RoutableComponentConstructor } from './RoutableComponent.js'

type RouteParameters =
	| [...routes: Array<string>]
	| [host: Constructor<Component>, ...routes: Array<string>]

/**
 * Decorates a page or dialog with its routes, rendered by the application's router or, given a `host`, by the router of that component.
 *
 * Routes use the syntax of `path-to-regexp`, such as `/users/:id`, and the first one makes up the component's `url`.
 */
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