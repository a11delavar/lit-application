import { directive, Directive, ElementPart, PartInfo, PartType } from '@a11d/lit'
import { RouteMatchMode, Router } from './index.js'
import { PageComponent, PageNavigationStrategy } from '../Page/index.js'

type Parameters = {
	page: PageComponent<any>
	matchMode?: RouteMatchMode
	selectionChangeHandler?: (this: Element, selected: boolean) => void
}

type ShorthandParametersOrParameters =
	| [page: PageComponent<any>]
	| [parameters: Parameters]

function getParameters(...parameters: ShorthandParametersOrParameters): Parameters {
	return !(parameters[0] instanceof PageComponent) ? parameters[0] : {
		page: parameters[0],
		matchMode: RouteMatchMode.All,
		selectionChangeHandler: undefined,
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
			this.parameters.page.navigate()
		})

		this.element.addEventListener('auxclick', event => {
			event.preventDefault()
			this.parameters.page.navigate(PageNavigationStrategy.Tab)
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
		const selected = Router.match(this.parameters.page, this.parameters.matchMode)
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