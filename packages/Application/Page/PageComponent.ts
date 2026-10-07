import { literal, type PropertyValues } from '@a11d/lit'
import { label } from '@a11d/metadata'
import { querySymbolizedElement, RoutableComponent, HookSet, type RoutableParameters } from '../index.js'
import { type Page } from './index.js'

/** The parameters of a page, mapped to the path and query string of its URL. */
export type PageParameters = RoutableParameters

const pageElementConstructorSymbol = Symbol('PageComponent.PageElementConstructor')

/**
 * The base class of a page, rendered by the application when its route matches.
 *
 * Its template renders a page element, such as `lit-page`, whose heading defaults to the component's `label` metadata.
 * Navigate to a page with `new PageUser({ id: 1 }).navigate()`, or link to it with `routerLink`.
 */
export abstract class PageComponent<T extends PageParameters = void> extends RoutableComponent<T> {
	/** Hooks awaited with each page before it connects, such as to check permissions. */
	static readonly connectingHooks = new HookSet<PageComponent<any>>()

	/** The tag of the page element that built-in pages such as `PageError` render, `lit-page` by default. */
	static defaultPageElementTag = literal`lit-page`

	/** Marks the decorated element class as a page element, which `pageElement` finds in a page component's render root. */
	static pageElement() {
		return (constructor: Constructor<Page>) => {
			(constructor as any)[pageElementConstructorSymbol] = true
		}
	}

	override async navigate(...args: Parameters<RoutableComponent['navigate']>) {
		await super.navigate(...args)
	}

	/** The page element in the render root; accessing it throws when there is none. */
	@querySymbolizedElement(pageElementConstructorSymbol) readonly pageElement!: Page & HTMLElement

	override async connectedCallback() {
		await PageComponent.connectingHooks.execute(this)
		super.connectedCallback()
	}

	protected override firstUpdated(props: PropertyValues) {
		this.pageElement.heading ||= label.resolve(this)?.toString()
		super.firstUpdated(props)
	}
}
