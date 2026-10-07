import { AsyncDirective, directive, type ElementPart, noChange, type PartInfo, PartType } from '@a11d/lit'
import { type UrlMatchMode, NavigationStrategy, type RoutableComponent, type RoutableComponentConstructor } from './index.js'

/** The options of `routerLink`. */
type Parameters = {
	/** The component to navigate to, whose URL becomes the element's `href`. */
	component: RoutableComponent<any>
	/** Where to navigate, overriding the strategy implied by the modifier keys of the click. */
	navigationStrategy?: NavigationStrategy
	/** How the URL must match the component's for the element to be selected, `all` by default. */
	matchMode?: UrlMatchMode
	/** Called on the element with whether it is selected, initially and whenever the URL changes. */
	selectionChangeHandler?(this: Element, selected: boolean): void
	/** Called whenever the element is clicked, once the navigation started. */
	invocationHandler?(): void
}

type ShorthandParametersOrParameters =
	| [component: RoutableComponent<any>]
	| [parameters: Parameters]

function getParameters(...parameters: ShorthandParametersOrParameters): Parameters {
	return !(parameters[0] instanceof HTMLElement) ? parameters[0] : {
		component: parameters[0],
		matchMode: 'all',
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
					// It's important not to default to `NavigationStrategy.Page` here
					// so the default logic for complex scenarios (e.g. poppable dialogs) can be applied
					return undefined
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

/**
 * Navigates to a routable component when the element is clicked, and marks the element `data-router-selected` while its URL matches.
 *
 * Ctrl-, Cmd- and middle-clicks open the component in a new tab and Shift-clicks in a new window, unless a `navigationStrategy`
 * is given.
 */
export const routerLink = directive(RouterLinkDirective)
