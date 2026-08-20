import type { ApplicationTopLayer } from '../ApplicationTopLayer.js'
import type { Page } from '../Page/Page.js'
import type { DialogController, DialogControllerAction } from './DialogController.js'
import type { DialogErrorHandlerSetting } from './dialogErrorHandler.js'

export enum DialogActionKey {
	Primary = 'primary',
	Secondary = 'secondary',
	Cancellation = 'cancellation',
}

export interface Dialog extends Page {
	readonly controller: DialogController

	/** Lifecycle state — read and written by `DialogController`. */
	open: boolean
	executingAction?: DialogActionKey

	/** Action lifecycle config — read by `DialogController`. */
	primaryAction?: () => DialogControllerAction<unknown>
	secondaryAction?: () => DialogControllerAction<unknown>
	cancellationAction?: () => DialogControllerAction<unknown>
	errorHandler?: DialogErrorHandlerSetting
	manualClose?: boolean
	primaryOnEnter?: boolean
	preventCancellationOnEscape?: boolean

	/** Dispatched when the dialog closes; detail is the resolved value or thrown `Error`. */
	readonly close: EventDispatcher<unknown>

	readonly topLayerElement: ApplicationTopLayer

	readonly primaryActionElement: HTMLElement | undefined
	readonly secondaryActionElement: HTMLElement | undefined
	readonly cancellationActionElement: HTMLElement | undefined

	confirm<T>(): Promise<T>

	poppable?: boolean
	boundToWindow?: boolean
	readonly requestPopup?: EventDispatcher<void>

	/**
	 * @deprecated Forwards to `controller.executeAction`. Will be removed in a
	 * future release once `mo-dialog` migrates to `DialogController`.
	 */
	handleAction?: (key: DialogActionKey) => void | Promise<void>
}