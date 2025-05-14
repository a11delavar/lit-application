import { Component, queryConnectedInstances, state } from '@a11d/lit'
import { equals } from '@a11d/equals'
import { compile, match, parse } from 'path-to-regexp'
import { WindowHelper, WindowOpenMode } from '../utilities/WindowHelper.js'
import { Application } from '../Application.js'

export type RoutableParameters = void | Record<string, string | number | undefined>

export type UrlMatchMode = 'all' | 'ignore-parameters'

export enum NavigationStrategy { Page, Tab, Window }

export abstract class RoutableComponent<T extends RoutableParameters = void> extends Component {
	static basePath = ''
	static readonly container = new Set<RoutableComponentConstructor>()

	static host: AbstractConstructor<HTMLElement> | Constructor<HTMLElement> = Application

	private static _routes = new Array<string>()
	static get routes() { return this._routes.map(route => RoutableComponent.basePath + route) }
	static set routes(value) { this._routes = value }

	@queryConnectedInstances() private static readonly connectedInstances: Set<RoutableComponent<any>>

	private static get boundComponent() {
		return [...RoutableComponent.connectedInstances].at(0)
	}

	static get url() { return new URL(globalThis.location.toString()) }

	private static setUrl(value: URL, force = false) {
		if (value === undefined) {
			return
		}

		if (!force && value.toString() === this.url.toString()) {
			return
		}

		const navigate = () => {
			window.history.pushState(null, '', value)
			window.dispatchEvent(new PopStateEvent('popstate'))
		}
		if ('startViewTransition' in document) {
			document.startViewTransition(() => navigate())
		} else {
			navigate()
		}
	}

	@state({
		updated(this: RoutableComponent<T>) {
			if (this.boundToWindow) {
				this.updateUrl()
			}
		}
	}) parameters: T

	constructor(parameters: T) {
		super()
		this.parameters = parameters
	}

	get route() {
		return (this.constructor as RoutableComponentConstructor).routes?.at(0)
	}

	get boundToWindow(): boolean {
		return RoutableComponent.boundComponent === this
	}

	async navigate(strategy?: NavigationStrategy, force?: boolean): Promise<unknown> {
		if (!force && this.urlMatches()) {
			return
		}

		strategy ??= NavigationStrategy.Page

		if (strategy !== NavigationStrategy.Page) {
			await WindowHelper.openAndFocus(this.url, strategy === NavigationStrategy.Window ? WindowOpenMode.Window : WindowOpenMode.Tab)
			return
		}

		this.updateUrl(force)

		return
	}

	get url() {
		const route = this.route

		if (route === undefined) {
			return undefined
		}

		const url = new URL(compile(route)(this.parameters ?? undefined), RoutableComponent.url)

		const routeKeys = !route ? [] : parse(route)
			.map(x => typeof x === 'object' ? x.name : undefined)
			.filter(name => typeof name === 'string')
			.filter(Boolean)
		const parametersKeys = Object.keys(this.parameters ?? {})

		for (const queryString of parametersKeys.filter(key => !routeKeys.includes(key))) {
			url.searchParams.set(queryString, encodeURIComponent((this.parameters as any)[queryString]))
		}

		return url
	}

	/**
	 * Determines if the current URL matches the route of this component.
	 * @param mode The matching mode. 'all' matches the path and parameters, 'ignore-parameters' matches only the path. Defaults to 'all'.
	 */
	urlMatches(options?: { mode?: UrlMatchMode, url?: URL }) {
		options ??= {}
		options.url ??= RoutableComponent.url

		const route = this.route
		const m = route === undefined ? false : match(route)(options.url.pathname)

		if (m === false) {
			return false
		}

		if (options.mode === 'ignore-parameters') {
			return true
		}

		const parameters = {
			...m.params as Record<string, string>,
			...Object.fromEntries(options.url.searchParams)
		}

		return Object[equals](this.parameters ?? {}, parameters)
	}

	protected updateUrl(force = false) {
		if (this.url) {
			RoutableComponent.setUrl(this.url, force)
		}
	}

	protected refresh(parameters = { ...this.parameters }) {
		return new (this.constructor as RoutableComponentConstructor)(parameters).navigate(NavigationStrategy.Page, true)
	}
}

export type RoutableComponentConstructor = Constructor<RoutableComponent<any>> & {
	host: AbstractConstructor<HTMLElement> | Constructor<HTMLElement>
	routes: Array<string>
}