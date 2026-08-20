import { directive, Directive, noChange, PartType, type ElementPart, type PartInfo } from '@a11d/lit'

export class ViewTransitionNameDirective extends Directive {
	static container = new Set<string>()
	constructor(partInfo: PartInfo) {
		super(partInfo)

		if (partInfo.type !== PartType.ELEMENT) {
			throw new Error('viewTransitionName can only be used on an element')
		}
	}

	override update(part: ElementPart, [name]: [string]) {
		const partName = `view-transition-part--${name}`
		part.element.part = partName
		ViewTransitionNameDirective.container.add(partName)
		return super.update(part, [name])
	}

	render(...props: any) {
		props
		return noChange
	}
}


export const viewTransitionName = directive(ViewTransitionNameDirective)