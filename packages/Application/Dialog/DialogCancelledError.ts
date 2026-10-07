import type { DialogComponent } from './DialogComponent.js'

/** The error the confirmation of a dialog rejects with when the dialog is cancelled. */
export class DialogCancelledError extends Error {
	constructor(dialogComponent: DialogComponent<any, any>) {
		super(`Dialog "${dialogComponent.tagName.toLowerCase()}" was cancelled.`)
	}
}
