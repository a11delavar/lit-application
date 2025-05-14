import { literal, type PropertyValues } from '@a11d/lit'
import { label } from '@a11d/metadata'
import { querySymbolizedElement, RoutableComponent, HookSet, type RoutableParameters } from '../index.js'
import { type Page } from './index.js'

export type PageParameters = RoutableParameters

const pageElementConstructorSymbol = Symbol('PageComponent.PageElementConstructor')

export abstract class PageComponent<T extends PageParameters = void> extends RoutableComponent<T> {
	static readonly connectingHooks = new HookSet<PageComponent<any>>()

	static defaultPageElementTag = literal`lit-page`

	static pageElement() {
		return (constructor: Constructor<Page>) => {
			(constructor as any)[pageElementConstructorSymbol] = true
		}
	}

	override async navigate(...args: Parameters<RoutableComponent['navigate']>) {
		await super.navigate(...args)
	}

	@querySymbolizedElement(pageElementConstructorSymbol) readonly pageElement!: Page & HTMLElement

	override async connectedCallback() {
		await PageComponent.connectingHooks.execute(this)
		super.connectedCallback()
	}

	protected override firstUpdated(props: PropertyValues<this>) {
		this.pageElement.heading ||= label.get(this.constructor as Constructor<this>)?.toString()
		super.firstUpdated(props)
	}
}