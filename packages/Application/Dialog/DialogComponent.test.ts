import { Component, component, event, html, query, state } from '@a11d/lit'
import {
	DialogActionKey,
	DialogCancelledError,
	DialogComponent,
	DialogComponentErrorHandler,
	type Dialog as IDialog,
} from './index.js'
import type { ApplicationTopLayer } from '../ApplicationTopLayer.js'

/**
 * Characterization tests for `DialogComponent`.
 *
 * Focus: the action lifecycle (`primary`/`secondary`/`cancellation` actions ->
 * resolve/reject of `confirm()`, error handling, executingAction toggling,
 * keyboard short-circuits, manualClose). These are intentionally locked-in
 * behaviors that any future refactor (e.g. extracting a `DialogController`)
 * MUST preserve. The tests deliberately use a minimal in-test `FakeDialog`
 * element instead of `@a11d/lit-application-native`'s `<lit-dialog>` so the
 * tests describe the contract between `DialogComponent` and *any* host
 * dialog element, not a specific implementation.
 */

@component('test-dialog-fake')
@DialogComponent.dialogElement()
class FakeDialog extends Component implements IDialog {
	@event() readonly pageHeadingChange!: EventDispatcher<string>
	@event() readonly requestPopup!: EventDispatcher

	@state() heading = ''
	@state() open = false
	@state() poppable?: boolean
	@state() boundToWindow?: boolean
	@state() executingAction?: DialogActionKey

	preventCancellationOnEscape?: boolean
	primaryOnEnter?: boolean
	manualClose?: boolean
	errorHandler?: IDialog['errorHandler']

	primaryActionElement: HTMLElement | undefined
	secondaryActionElement: HTMLElement | undefined
	cancellationActionElement: HTMLElement | undefined

	@query('lit-application-top-layer') readonly topLayerElement!: ApplicationTopLayer

	handleAction!: (key: DialogActionKey) => void | Promise<void>

	protected override get template() {
		return html`<lit-application-top-layer></lit-application-top-layer>`
	}
}
FakeDialog

@DialogComponent.errorHandler('test-default', true)
class CapturingDefaultHandler extends DialogComponentErrorHandler {
	static lastError?: Error
	static reset() { CapturingDefaultHandler.lastError = undefined }
	override handle(error: Error) { CapturingDefaultHandler.lastError = error }
}

let counter = 0
type ActionOverrides = {
	primary?: () => any
	secondary?: () => any
	cancellation?: () => any
}

function defineDialog<TResult = unknown>(overrides: ActionOverrides = {}) {
	const tag = `test-dialog-component-${++counter}`
	@component(tag)
	class TestDialog extends DialogComponent<void, TResult> {
		protected override get template() {
			return html`<test-dialog-fake></test-dialog-fake>`
		}
		override primaryAction() {
			return overrides.primary ? overrides.primary() : super.primaryAction()
		}
		override secondaryAction() {
			return overrides.secondary ? overrides.secondary() : super.secondaryAction()
		}
		override cancellationAction() {
			return overrides.cancellation ? overrides.cancellation() : super.cancellationAction()
		}
	}
	return TestDialog
}

const liveInstances = new Set<DialogComponent<any, any>>()

async function open<TResult>(Ctor: new () => DialogComponent<void, TResult>) {
	const instance = new Ctor()
	liveInstances.add(instance)
	const promise = instance.confirm()
	// Swallow rejection in case the test never observes it (e.g. tests asserting
	// the dialog stays open). This prevents Karma from flagging unhandled rejections.
	promise.catch(() => undefined)
	// Yield microtasks for: confirmAsDialog -> getHost -> appendChild ->
	// connectedCallback (awaits empty connectingHooks) -> super.connectedCallback ->
	// firstUpdated.
	await Promise.resolve()
	await Promise.resolve()
	await instance.updateComplete
	const dialog = instance.dialogElement
	return { instance, promise, dialog }
}

function settled<T>(promise: Promise<T>): Promise<{ status: 'resolved', value: T } | { status: 'rejected', reason: any } | { status: 'pending' }> {
	return Promise.race([
		promise.then(value => ({ status: 'resolved' as const, value }), reason => ({ status: 'rejected' as const, reason })),
		new Promise<{ status: 'pending' }>(resolve => setTimeout(() => resolve({ status: 'pending' }), 0)),
	])
}

describe('DialogComponent', () => {
	beforeEach(() => CapturingDefaultHandler.reset())
	afterEach(() => {
		for (const instance of liveInstances) {
			instance.remove()
		}
		liveInstances.clear()
	})

	describe('action lifecycle: confirm() resolution', () => {
		it('resolves with the value returned by primaryAction', async () => {
			const Dialog = defineDialog<string>({ primary: () => 'ok' })
			const { dialog, promise } = await open(Dialog)

			await dialog.handleAction(DialogActionKey.Primary)

			await expectAsync(promise).toBeResolvedTo('ok')
		})

		it('rejects with the Error returned by primaryAction (return, not throw)', async () => {
			const error = new Error('domain rule violated')
			const Dialog = defineDialog({ primary: () => error })
			const { dialog, promise } = await open(Dialog)

			await dialog.handleAction(DialogActionKey.Primary)

			await expectAsync(promise).toBeRejectedWith(error)
		})

		it('rejects with a DialogCancelledError when the default cancellationAction runs', async () => {
			const Dialog = defineDialog()
			const { dialog, promise } = await open(Dialog)

			await dialog.handleAction(DialogActionKey.Cancellation)

			await expectAsync(promise).toBeRejectedWithError(DialogCancelledError)
		})

		it('secondaryAction defaults to cancellationAction (so Secondary cancels)', async () => {
			const Dialog = defineDialog()
			const { dialog, promise } = await open(Dialog)

			await dialog.handleAction(DialogActionKey.Secondary)

			await expectAsync(promise).toBeRejectedWithError(DialogCancelledError)
		})
	})

	describe('action lifecycle: errors thrown from actions', () => {
		it('does not close the dialog when an action throws and the default error handler receives the error', async () => {
			const error = new Error('network down')
			const Dialog = defineDialog({ primary: () => { throw error } })
			const { instance, dialog, promise } = await open(Dialog)

			// handleAction re-throws after handling the error; absorb so the test continues.
			await Promise.resolve(dialog.handleAction(DialogActionKey.Primary)).catch(() => undefined)

			expect(CapturingDefaultHandler.lastError).toBe(error)
			expect(dialog.open).toBe(true)
			expect(instance.isConnected).toBe(true)
			await expectAsync(settled(promise)).toBeResolvedTo(jasmine.objectContaining({ status: 'pending' }))
		})

		it('does not invoke the error handler when the thrown error is a DialogCancelledError', async () => {
			const Dialog = defineDialog()
			const cancelled = new DialogCancelledError(new Dialog())
			const ThrowingDialog = defineDialog({ primary: () => { throw cancelled } })
			const { dialog } = await open(ThrowingDialog)

			await Promise.resolve(dialog.handleAction(DialogActionKey.Primary)).catch(() => undefined)

			expect(CapturingDefaultHandler.lastError).toBeUndefined()
		})

		it('routes errors to a function-typed errorHandler set on the dialog element', async () => {
			const error = new Error('handled inline')
			const handler = jasmine.createSpy('errorHandler')
			const Dialog = defineDialog({ primary: () => { throw error } })
			const { dialog } = await open(Dialog)
			dialog.errorHandler = handler

			await Promise.resolve(dialog.handleAction(DialogActionKey.Primary)).catch(() => undefined)

			expect(handler).toHaveBeenCalledOnceWith(error)
			expect(CapturingDefaultHandler.lastError).toBeUndefined()
		})
	})

	describe('manualClose', () => {
		it('keeps the dialog open after a successful primary action when manualClose is set', async () => {
			const Dialog = defineDialog({ primary: () => 'ok' })
			const { instance, dialog, promise } = await open(Dialog)
			dialog.manualClose = true

			await dialog.handleAction(DialogActionKey.Primary)

			expect(dialog.open).toBe(true)
			expect(instance.isConnected).toBe(true)
			await expectAsync(settled(promise)).toBeResolvedTo(jasmine.objectContaining({ status: 'pending' }))
		})

		it('still closes on Cancellation even when manualClose is set', async () => {
			const Dialog = defineDialog()
			const { dialog, promise } = await open(Dialog)
			dialog.manualClose = true

			await dialog.handleAction(DialogActionKey.Cancellation)

			await expectAsync(promise).toBeRejectedWithError(DialogCancelledError)
		})
	})

	describe('executingAction', () => {
		it('reflects the currently running action key and resets to undefined after settlement', async () => {
			let observed: DialogActionKey | undefined
			const Dialog = defineDialog<string>({
				primary: () => {
					// Snapshot the property mid-flight; the executing action MUST already be set.
					observed = dialogRef.executingAction
					return 'ok'
				},
			})
			const { dialog } = await open(Dialog)
			const dialogRef = dialog

			expect(dialog.executingAction).toBeUndefined()
			await dialog.handleAction(DialogActionKey.Primary)

			expect(observed).toBe(DialogActionKey.Primary)
			expect(dialog.executingAction).toBeUndefined()
		})

		it('clears executingAction even when the action throws', async () => {
			const Dialog = defineDialog({ primary: () => { throw new Error('boom') } })
			const { dialog } = await open(Dialog)

			await Promise.resolve(dialog.handleAction(DialogActionKey.Primary)).catch(() => undefined)

			expect(dialog.executingAction).toBeUndefined()
		})
	})

	describe('keyboard short-cuts', () => {
		it('triggers primary on Enter when primaryOnEnter is true', async () => {
			const Dialog = defineDialog<string>({ primary: () => 'enter' })
			const { dialog, promise } = await open(Dialog)
			dialog.primaryOnEnter = true

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))

			await expectAsync(promise).toBeResolvedTo('enter')
		})

		it('does not trigger primary on Enter when primaryOnEnter is not set', async () => {
			const primary = jasmine.createSpy('primary').and.returnValue('x')
			const Dialog = defineDialog({ primary })
			await open(Dialog)

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
			await Promise.resolve()

			expect(primary).not.toHaveBeenCalled()
		})

		it('triggers cancellation on Escape by default', async () => {
			const Dialog = defineDialog()
			const { promise } = await open(Dialog)

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

			await expectAsync(promise).toBeRejectedWithError(DialogCancelledError)
		})

		it('does not cancel on Escape when preventCancellationOnEscape is true', async () => {
			const cancellation = jasmine.createSpy('cancellation').and.callFake(() => new DialogCancelledError({} as any))
			const Dialog = defineDialog({ cancellation })
			const { dialog } = await open(Dialog)
			dialog.preventCancellationOnEscape = true

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
			await Promise.resolve()

			expect(cancellation).not.toHaveBeenCalled()
		})
	})
})