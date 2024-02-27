import type { Component } from '@a11d/lit'
import type { PageComponent } from '../Page/index.js'

export type Page = PageComponent<any>
type PageConstructor = Constructor<Page>

type RouterHost = Component
type RouterHostConstructor = Constructor<RouterHost>

type RouteMetadata = {
	routerHostConstructor: RouterHostConstructor
	pageConstructor: PageConstructor
}

export class RoutesContainer extends Map<string, RouteMetadata> {
	basePath = ''

	override get(key: string) {
		key = key.split(this.basePath)[1]!
		return super.get(key)
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