import { Component, LitElement, literal } from '@a11d/lit'
import { querySymbolizedElement, WindowHelper, WindowOpenMode, HookSet, Application, Router } from '../index.js'
import { Page, PageHost } from './index.js'

export type PageParameters = void | Record<string, string | number | undefined>

export const enum PageNavigationStrategy { Page, Tab, Window }

export abstract class PageComponent<T extends PageParameters = void> extends Component {
	static readonly beforeNavigationHooks = new HookSet<PageComponent<any>>()

	private static readonly pageElementConstructorSymbol = Symbol('PageComponent.PageElementConstructor')

	static defaultPageElementTag = literal`lit-page`

	static pageElement() {
		return (constructor: Constructor<Page>) => {
			(constructor as any)[PageComponent.pageElementConstructorSymbol] = true
		}
	}

	static getHost() {
		return Promise.resolve(PageHost.instance ?? Application.instance ?? document.body)
	}

	static async getCurrentPage() {
		const host = await this.getHost()
		return [...host.querySelectorAll('*') ?? []]
			.find((page): page is PageComponent<any> => page instanceof PageComponent)
	}

	async navigate(strategy = PageNavigationStrategy.Page, force = false) {
		const currentPage = await PageComponent.getCurrentPage()
		if (currentPage && Router.pathsMatch(currentPage, this) && force === false) {
			return
		}

		await PageComponent.beforeNavigationHooks.execute(this)

		if (strategy === PageNavigationStrategy.Page) {
			Router.setPathByPage(this)
		} else {
			const url = window.location.origin + Router.getPathOf(this)
			await WindowHelper.openAndFocus(url, strategy === PageNavigationStrategy.Window ? WindowOpenMode.Window : WindowOpenMode.Tab)
		}
	}

	@querySymbolizedElement(PageComponent.pageElementConstructorSymbol) readonly pageElement!: LitElement

	constructor(readonly parameters: T) {
		super()
	}

	protected refresh(parameters = this.parameters) {
		return new (this.constructor as any)(parameters).navigate(PageNavigationStrategy.Page, true)
	}
}