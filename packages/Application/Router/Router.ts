import RouteParser from 'route-parser'
import type { PageComponent } from '../Page/index.js'

type Page = PageComponent<any>
type PageConstructor = Constructor<Page>

export const route = (...routes: Array<string>) => {
	return (pageConstructor: PageConstructor) => {
		routes.forEach(route => Router.pageByRoute.set(route, pageConstructor))
	}
}

export const enum RouteMatchMode {
	All = 'all',
	IgnoreParameters = 'ignore-parameters',
}

export class Router {
	static readonly pageByRoute = new Map<string, PageConstructor>()

	static get path() { return window.location.pathname + window.location.search }
	static set path(value) {
		if (Router.path !== value) {
			window.location.pathname = value
		}
	}

	static getPathOf(page: Page) {
		return [...Router.pageByRoute]
			.filter(([, pageConstructor]) => pageConstructor.name === page.constructor.name)
			.map(([route]) => new RouteParser(route).reverse(page.parameters || {}) || undefined)
			.find((route): route is string => route !== undefined)
	}

	static setPathByPage(page: Page) {
		const path = Router.getPathOf(page)
		if (path) {
			Router.path = path
		}
	}

	static pathsMatch(page1: Page, page2: Page, mode = RouteMatchMode.All) {
		return page1.tagName === page2.tagName
			&& (Router.getPathOf(page1) === Router.getPathOf(page2) || mode === RouteMatchMode.IgnoreParameters)
	}
}