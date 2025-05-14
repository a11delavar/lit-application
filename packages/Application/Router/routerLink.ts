import { AsyncDirective, directive, type ElementPart, noChange, type PartInfo, PartType } from '@a11d/lit'
import { UrlMatchMode, NavigationStrategy, type RoutableComponent, type RoutableComponentConstructor } from './index.js'

type Parameters = {
	component: RoutableComponent<any>
	navigationStrategy?: NavigationStrategy
	matchMode?: UrlMatchMode
	selectionChangeHandler?(this: Element, selected: boolean): void
	invocationHandler?(): void
}

type ShorthandParametersOrParameters =
	| [component: RoutableComponent<any>]
	| [parameters: Parameters]

function getParameters(...parameters: ShorthandParametersOrParameters): Parameters {
	return !(parameters[0] instanceof HTMLElement) ? parameters[0] : {
		component: parameters[0],
		matchMode: UrlMatchMode.All,
		navigationStrategy: undefined,
		selectionChangeHandler: undefined,
		invocationHandler: undefined,
	}
}

class RouterLinkDirective extends AsyncDirective {
	readonly element!: Element
	readonly parameters!: Parameters

	constructor(partInfo: PartInfo) {
		super(partInfo)

		if (partInfo.type !== PartType.ELEMENT) {
			throw new Error('routerLink can only be used on an element')
		}
	}

	override update(part: ElementPart, parameters: ShorthandParametersOrParameters) {
		const firstRender = !this.parameters

		// @ts-expect-error - Readonly
		this.element = part.element
		// @ts-expect-error - Readonly
		this.parameters = getParameters(...parameters)

		if (this.isConnected) {
			this.addEventListeners()
		}

		if (firstRender) {
			this.executeSelectionChange()
		}

		this.element.setAttribute('href', this.parameters.component.url?.path ?? '#')

		return super.update(part, parameters)
	}

	render(...parameters: ShorthandParametersOrParameters) {
		parameters
		return noChange
	}

	protected override disconnected() {
		this.removeEventListeners()
	}

	handleEvent(event: Event) {
		switch (event.type) {
			case 'click':
			case 'auxclick':
				event.preventDefault()
				this.invoke(event as PointerEvent)
				break
			case 'popstate':
				this.executeSelectionChange()
				break
		}
	}

	private addEventListeners() {
		window.addEventListener('popstate', this)
		this.element.addEventListener('click', this)
		this.element.addEventListener('auxclick', this)
	}

	private removeEventListeners() {
		window.removeEventListener('popstate', this)
		this.element.removeEventListener('click', this)
		this.element.removeEventListener('auxclick', this)
	}

	private invoke(pointerEvent: PointerEvent) {
		const getStrategy = () => {
			switch (true) {
				case this.parameters.navigationStrategy !== undefined:
					return this.parameters.navigationStrategy
				case pointerEvent.ctrlKey || pointerEvent.metaKey || pointerEvent.type === 'auxclick':
					return NavigationStrategy.Tab
				case pointerEvent.shiftKey:
					return NavigationStrategy.Window
				default:
					return NavigationStrategy.Page
			}
		}
		const strategy = getStrategy()

		const component = new (this.parameters.component.constructor as RoutableComponentConstructor)(this.parameters.component.parameters)
		component.navigate(strategy, strategy !== NavigationStrategy.Page)

		this.parameters.invocationHandler?.()
	}

	private executeSelectionChange() {
		const selected = this.parameters.component.urlMatches({ mode: this.parameters.matchMode })
		this.element.toggleAttribute('data-router-selected', selected)

		if (this.parameters.selectionChangeHandler) {
			this.parameters.selectionChangeHandler.call(this.element, selected)
		}
	}
}

export const routerLink = directive(RouterLinkDirective)