import { directive, Directive, ElementPart, PartInfo, PartType } from '@a11d/lit'
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

export const routerLink = directive(class extends Directive {
	readonly element: Element
	readonly parameters!: Parameters

	constructor(partInfo: PartInfo) {
		super(partInfo)

		if (partInfo.type !== PartType.ELEMENT) {
			throw new Error('routerLink can only be used on an element')
		}

		const part = partInfo as ElementPart
		this.element = part.element

		window.addEventListener('popstate', this)
		this.element.addEventListener('click', this)
		this.element.addEventListener('auxclick', this)
	}

	render(...parameters: ShorthandParametersOrParameters) {
		const firstRender = !this.parameters
		// @ts-expect-error - parameters is readonly
		this.parameters = getParameters(...parameters)
		if (firstRender) {
			this.executeSelectionChange()
		}
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
		}
	}

	invoke(pointerEvent: PointerEvent) {
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

		if (this.parameters.component instanceof PageComponent) {
			this.parameters.component.navigate(getPageNavigationStrategy(), pointerEvent.type === 'auxclick')
		} else {
			this.parameters.component.confirm(getDialogConfirmationStrategy())
		}

		this.parameters.invocationHandler?.()
	}

	executeSelectionChange() {
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
})