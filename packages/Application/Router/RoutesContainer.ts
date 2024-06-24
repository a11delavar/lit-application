import type { Component } from '@a11d/lit'
import type { Routable, RoutableConstructor } from './Routable.js'

type RouterHost = Component
type RouterHostConstructor = Constructor<RouterHost>

type RouteMetadata = {
	routerHostConstructor: RouterHostConstructor
	routableConstructor: RoutableConstructor
}

/**
 * A container to persist routes and their metadata.
 * A route is a string that represents the URL template of a path e.g. '/users/:id'.
 * The metadata consists of the routable that the router matches
 * as well as the constructor of the router host that the route is associated with.
 */
export class RoutesContainer extends Map<string, RouteMetadata> {
	basePath = ''

	override get(key: string) {
		key = key.split(this.basePath)[1]!
		return super.get(key)
	}

	getByRoutable(routable: Routable) {
		const [route] = [...this].find(([, { routableConstructor }]) => routableConstructor === routable.constructor) ?? []
		return route
	}

	override entries(): IterableIterator<[string, RouteMetadata]> {
		const entries = super.entries()
		const basePath = this.basePath
		return {
			*[Symbol.iterator]() {
				for (const [key, value] of entries) {
					yield [basePath + key, value]
				}
			},

			next() {
				return this[Symbol.iterator]().next()
			}
		}
	}

	[Symbol.iterator]() {
		return this.entries()
	}
}