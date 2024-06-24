import { Component, literal } from '@a11d/lit'
import { querySymbolizedElement, WindowHelper, WindowOpenMode, HookSet, Router, RouteMatchMode, NavigationStrategy, type Routable, type RoutableParameters } from '../index.js'
import { Page } from './index.js'

export type PageParameters = RoutableParameters

const pageElementConstructorSymbol = Symbol('PageComponent.PageElementConstructor')

export abstract class PageComponent<T extends PageParameters = void> extends Component implements Routable {
	static readonly connectingHooks = new HookSet<PageComponent<any>>()

	static defaultPageElementTag = literal`lit-page`

	static pageElement() {
		return (constructor: Constructor<Page>) => {
			(constructor as any)[pageElementConstructorSymbol] = true
		}
	}

	async navigate(strategy = NavigationStrategy.Page, force = false) {
		if (force === false && Router.match(this, RouteMatchMode.All)) {
			return
		}

		if (strategy === NavigationStrategy.Page) {
			Router.setPathBy(this)
		} else {
			const url = window.location.origin + Router.getPathOf(this)
			await WindowHelper.openAndFocus(url, strategy === NavigationStrategy.Window ? WindowOpenMode.Window : WindowOpenMode.Tab)
		}
	}

	@querySymbolizedElement(pageElementConstructorSymbol) readonly pageElement!: Page & HTMLElement

	constructor(readonly parameters: T) {
		super()
	}

	override async connectedCallback() {
		await PageComponent.connectingHooks.execute(this)
		super.connectedCallback()
	}

	protected refresh(parameters = this.parameters) {
		return new (this.constructor as any)(parameters).navigate(NavigationStrategy.Page, true)
	}
}