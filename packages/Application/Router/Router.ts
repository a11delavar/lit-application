import { compile, match, parse } from 'path-to-regexp'
import { RoutesContainer } from './RoutesContainer.js'
import { type Routable } from './Routable.js'

export enum RouteMatchMode {
	All = 'all',
	IgnoreParameters = 'ignore-parameters',
}

export class Router {
	static readonly container = new RoutesContainer

	static get basePath() { return Router.container.basePath }
	static set basePath(value) { Router.container.basePath = value }

	/** Returns the path that matches the given routable. */
	static getPathOf(routable: Routable) {
		const route = this.container.getByRoutable(routable)

		if (route === undefined) {
			return undefined
		}

		const path = compile(route)(routable.parameters)

		const routeKeys = !route ? [] : parse(route)
			.map(x => typeof x === 'object' ? x.name : undefined)
			.filter(name => typeof name === 'string')
			.filter(Boolean)
		const parametersKeys = Object.keys(routable.parameters ?? {})

		const query = new URLSearchParams()
		for (const queryString of parametersKeys.filter(key => !routeKeys.includes(key))) {
			query.set(queryString, encodeURIComponent(routable.parameters[queryString] as string))
		}

		return [path, query.toString()]
			.filter(Boolean)
			.join('?')
	}

	/** Sets the path to the one that matches the given routable. */
	static setPathBy(routable: Routable) {
		const path = Router.getPathOf(routable)
		if (path) {
			Router.path = path
		}
	}

	/**
	 * Determines if the given routable matches the current path.
	 * @param routable The routable to match.
	 * @param mode The matching mode. 'all' matches the path and parameters, 'ignore-parameters' matches only the path. Defaults to 'all'.
	 */
	static match(routable: Routable, mode = RouteMatchMode.All) {
		const route = this.container.getByRoutable(routable)
		const m = route === undefined ? false : match(route)(Router.path)
		if (m === false) {
			return false
		}
		if (mode === RouteMatchMode.IgnoreParameters) {
			return true
		}
		const parameters = m.params as Record<string, string>
		return Object.keys(parameters).every(key => key in (routable.parameters ?? {}) && parameters[key] === routable.parameters[key])
	}

	static get path() { return window.location.pathname + window.location.search }
	static set path(value) {
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

	static get queryParameters() {
		return Object.fromEntries(
			[...new URLSearchParams(window.location.search).entries()]
				.map(([key, value]) => [key, decodeURIComponent(value)])
		)
	}
}