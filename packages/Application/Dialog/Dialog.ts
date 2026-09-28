import type { ApplicationTopLayer } from '../ApplicationTopLayer.js'
import type { Page } from '../Page/Page.js'

/** The keys of the actions of a dialog. */
export enum DialogActionKey {
	Primary = 'primary',
	Secondary = 'secondary',
	Cancellation = 'cancellation',
}

/** The key of a registered error handler, or a function handling the errors thrown by the actions of a dialog. */
export type DialogErrorHandler =
	| keyof DialogComponentErrorHandlers
	| ((error: Error) => void | Promise<void>)

/** The element a dialog component renders its content into, such as `lit-dialog`, marked with `DialogComponent.dialogElement()`. */
export interface Dialog extends Page {
	/** Whether the dialog is shown, set by the dialog component. */
	open: boolean

	/** The top layer inside the dialog, hosting nested dialogs and notifications while the dialog is open. */
	readonly topLayerElement: ApplicationTopLayer

	readonly primaryActionElement: HTMLElement | undefined
	readonly secondaryActionElement: HTMLElement | undefined
	readonly cancellationActionElement: HTMLElement | undefined
	/** Runs the action of the key, called by the dialog element and assigned by the dialog component. */
	handleAction: (key: DialogActionKey) => void | Promise<void>
	/** The key of the action being run, such as to show its element as pending. */
	executingAction?: DialogActionKey

	preventCancellationOnEscape?: boolean
	/** Runs the primary action when the Enter key is pressed. */
	primaryOnEnter?: boolean

	/** Whether the dialog can pop out into a tab or window, set by the dialog component. */
	poppable?: boolean
	/** Whether the current URL routes to the dialog, as in the window it popped out into, set by the dialog component. */
	boundToWindow?: boolean
	/** Dispatched to pop the dialog out into a new tab. */
	readonly requestPopup?: EventDispatcher<void>

	/** Keeps the dialog open after its primary and secondary actions, leaving it to the dialog component to `close` it. */
	manualClose?: boolean

	/** Handles the errors thrown by the actions, with the default error handler if not set. */
	errorHandler?: DialogErrorHandler
}