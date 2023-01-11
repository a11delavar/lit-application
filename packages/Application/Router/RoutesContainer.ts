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

export class RoutesContainer extends Map<string, { routerHostConstructor: RouterHostConstructor, pageConstructor: PageConstructor }> {
	basePath = ''

	override set(key: string, value: RouteMetadata) {
		return super.set(this.basePath + key, value)
	}
}