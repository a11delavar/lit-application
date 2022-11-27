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

		window.addEventListener('popstate', () => this.executeSelectionChange())

		this.element.addEventListener('click', event => {
			event.preventDefault()
			if (this.parameters.component instanceof PageComponent) {
				this.parameters.component.navigate()
			} else {
				this.parameters.component.confirm()
			}
			this.parameters.invocationHandler?.()
		})

		this.element.addEventListener('auxclick', event => {
			event.preventDefault()
			if (this.parameters.component instanceof PageComponent) {
				this.parameters.component.navigate(PageNavigationStrategy.Tab)
			} else {
				this.parameters.component.confirm(DialogConfirmationStrategy.Tab)
			}
			this.parameters.invocationHandler?.()
		})
	}

	render(...parameters: ShorthandParametersOrParameters) {
		const firstRender = !this.parameters
		// @ts-expect-error - parameters is readonly
		this.parameters = getParameters(...parameters)
		if (firstRender) {
			this.executeSelectionChange()
		}
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