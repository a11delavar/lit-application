import type { DialogComponent } from './DialogComponent.js'

export class DialogCancelledError extends Error {
	constructor(dialogComponent: DialogComponent<any, any>) {
		super(`Dialog "${dialogComponent.tagName.toLowerCase()}" was cancelled.`)
	}
}