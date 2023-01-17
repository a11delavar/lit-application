import { AsyncDirective, directive, ElementPart, noChange, PartInfo, PartType } from '@a11d/lit'
import { RouteMatchMode, Router } from './index.js'
import { PageComponent, PageNavigationStrategy } from '../Page/index.js'
import { DialogComponent, DialogConfirmationStrategy } from '../Dialog/index.js'

type Parameters = {
	component: PageComponent<any> | DialogComponent<any, any>
	matchMode?: RouteMatchMode
	selectionChangeHandler?: (this: Element, selected: boolean) => void
	invocationHandler?: () => void
}

type ShorthandParametersOrParameters =
	| [component: PageComponent<any> | DialogComponent<any, any>]
	| [parameters: Parameters]

function getParameters(...parameters: ShorthandParametersOrParameters): Parameters {
	return !(parameters[0] instanceof PageComponent || parameters[0] instanceof DialogComponent) ? parameters[0] : {
		component: parameters[0],
		matchMode: RouteMatchMode.All,
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
		const getPageNavigationStrategy = () => {
			switch (true) {
				case pointerEvent.ctrlKey || pointerEvent.metaKey || pointerEvent.type === 'auxclick':
					return PageNavigationStrategy.Tab
				case pointerEvent.shiftKey:
					return PageNavigationStrategy.Window
				default:
					return PageNavigationStrategy.Page
			}
		}

		const getDialogConfirmationStrategy = () => {
			switch (true) {
				case pointerEvent.ctrlKey || pointerEvent.metaKey || pointerEvent.type === 'auxclick':
					return DialogConfirmationStrategy.Tab
				case pointerEvent.shiftKey:
					return DialogConfirmationStrategy.Window
				default:
					return DialogConfirmationStrategy.Dialog
			}
		}

		const ComponentConstructor = this.parameters.component.constructor as Constructor<PageComponent<any>> | Constructor<DialogComponent<any>>
		const component = new ComponentConstructor(this.parameters.component.parameters)

		if (component instanceof PageComponent) {
			component.navigate(getPageNavigationStrategy(), pointerEvent.type === 'auxclick')
		} else {
			component.confirm(getDialogConfirmationStrategy())
		}

		this.parameters.invocationHandler?.()
	}

	private executeSelectionChange() {
		const selected = this.parameters.component instanceof DialogComponent
			? false
			: Router.match(this.parameters.component, this.parameters.matchMode)

		if (selected) {
			this.element.setAttribute('data-router-selected', '')
		} else {
			this.element.removeAttribute('data-router-selected')
		}

		if (this.parameters.selectionChangeHandler) {
			this.parameters.selectionChangeHandler.call(this.element, selected)
		}
	}
}

export const routerLink = directive(RouterLinkDirective)