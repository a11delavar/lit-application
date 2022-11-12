import { compile, match } from 'path-to-regexp'
import type { Component } from '@a11d/lit'
import type { PageComponent } from '../Page/index.js'

type Page = PageComponent<any>
type PageConstructor = Constructor<Page>

type RouterHost = Component
type RouterHostConstructor = Constructor<RouterHost>

export const enum RouteMatchMode {
	All = 'all',
	IgnoreParameters = 'ignore-parameters',
}

export class Router {
	static readonly container = new Map<string, { routerHostConstructor: RouterHostConstructor, pageConstructor: PageConstructor }>()

	static get path() { return window.location.pathname + window.location.search }
	static set path(value) {
		if (Router.path !== value) {
			window.location.pathname = value
		}
	}

	static getPathOf(page: Page) {
		const route = this.getRouteOf(page)
		return route === undefined ? undefined : compile(route)(page.parameters)
	}

	static setPathByPage(page: Page) {
		const path = Router.getPathOf(page)
		if (path) {
			Router.path = path
		}
	}

	static match(page: Page, mode = RouteMatchMode.All) {
		const route = Router.getRouteOf(page)
		const m = route === undefined ? false : match(route)(Router.path)
		if (m === false) {
			return false
		}
		if (mode === RouteMatchMode.IgnoreParameters) {
			return true
		}
		const parameters = m.params as Record<string, string>
		return Object.keys(parameters).every(key => key in (page.parameters ?? {}) && parameters[key] === page.parameters[key])
	}

	private static getRouteOf(page: Page) {
		return [...Router.container]
			.find(([, { pageConstructor }]) => pageConstructor.name === page.constructor.name)
			?.[0]
	}
}