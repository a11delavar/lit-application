import type { ApplicationTopLayer } from '../ApplicationTopLayer.js'
import type { Page } from '../Page/Page.js'

export enum DialogActionKey {
	Primary = 'primary',
	Secondary = 'secondary',
	Cancellation = 'cancellation',
}

export type DialogErrorHandler =
	| keyof DialogComponentErrorHandlers
	| ((error: Error) => void | Promise<void>)

export interface Dialog extends Page {
	heading: string

	open: boolean

	readonly topLayerElement: ApplicationTopLayer

	readonly primaryActionElement: HTMLElement | undefined
	readonly secondaryActionElement: HTMLElement | undefined
	readonly cancellationActionElement: HTMLElement | undefined
	handleAction: (key: DialogActionKey) => void | Promise<void>
	executingAction?: DialogActionKey

	preventCancellationOnEscape?: boolean
	primaryOnEnter?: boolean

	poppable?: boolean
	boundToWindow?: boolean
	readonly requestPopup?: EventDispatcher<void>

	manualClose?: boolean

	errorHandler?: DialogErrorHandler
}