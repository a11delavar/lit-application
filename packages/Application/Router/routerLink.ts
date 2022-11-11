import { directive, Directive, ElementPart, PartInfo, PartType } from '@a11d/lit'
import { Router } from './index.js'
import { PageComponent, PageNavigationStrategy } from '../Page/index.js'

type SelectionChangeHandler = (this: Element, selected: boolean) => void

export const routerLink = directive(class extends Directive {
	readonly element: Element
	page!: PageComponent<any>
	selectionChange?: SelectionChangeHandler

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
			this.page.navigate()
		})

		this.element.addEventListener('auxclick', event => {
			event.preventDefault()
			this.page.navigate(PageNavigationStrategy.Tab)
		})
	}

	render(page: PageComponent<any>, selectionChange?: SelectionChangeHandler) {
		const firstRender = !this.page
		this.page = page
		this.selectionChange = selectionChange
		if (firstRender) {
			this.executeSelectionChange()
		}
	}

	executeSelectionChange() {
		const selection = Router.getPathOf(this.page) === Router.path
		if (selection) {
			this.element.setAttribute('data-router-selected', '')
		} else {
			this.element.removeAttribute('data-router-selected')
		}
		if (this.selectionChange) {
			this.selectionChange.call(this.element, selection)
		}
	}
})