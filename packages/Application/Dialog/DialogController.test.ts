import { PureEventDispatcher, type ReactiveController } from '@a11d/lit'
import { Application } from '../Application.js'
import { DialogActionKey } from './Dialog.js'
import { DialogCancelledError } from './DialogCancelledError.js'
import {
	DialogController,
	type DialogControllerAction,
	type DialogControllerHost,
} from './DialogController.js'
import { DialogErrorHandler, dialogErrorHandler, type DialogErrorHandlerSetting } from './dialogErrorHandler.js'

/**
 * Pure-object characterization tests for `DialogController`.
 *
 * Goal: this file is the single source of truth for the controller's
 * behavior. The controller's contract is intentionally DOM-free — the host
 * only has to supply `addController`/`removeController`, the lifecycle
 * state fields (`open`, `executingAction`), the action lifecycle config,
 * and a `close` dispatcher — so we drive the controller with a plain
 * object.
 *
 * Keyboard handling reads `Application.topLayer`; we stub the static
 * getter to match the fake host's `topLayerElement` for those specs.
 */

class CapturingHandler extends DialogErrorHandler {
	static lastHost?: DialogControllerHost
	static lastError?: Error
	static reset() {
		CapturingHandler.lastHost = undefined
		CapturingHandler.lastError = undefined
	}
	override handle(error: Error) {
		CapturingHandler.lastHost = this.host
		CapturingHandler.lastError = error
	}
}
dialogErrorHandler('controller-test-capturing')(CapturingHandler)

class FakeHost implements DialogControllerHost {
	private readonly controllers: ReactiveController[] = []

	open = false
	executingAction?: DialogActionKey

	primaryAction?: () => DialogControllerAction<unknown>
	secondaryAction?: () => DialogControllerAction<unknown>
	cancellationAction?: () => DialogControllerAction<unknown>
	errorHandler?: DialogErrorHandlerSetting
	manualClose?: boolean
	primaryOnEnter?: boolean
	preventCancellationOnEscape?: boolean

	readonly topLayerElement = {} as never

	readonly close = new PureEventDispatcher<unknown>()

	addController(controller: ReactiveController) { this.controllers.push(controller) }
	removeController(controller: ReactiveController) {
		const index = this.controllers.indexOf(controller)
		if (index >= 0) {
			this.controllers.splice(index, 1)
		}
	}

	connect() { this.controllers.forEach(c => c.hostConnected?.()) }
	disconnect() { this.controllers.forEach(c => c.hostDisconnected?.()) }
}

describe('DialogController', () => {
	let host: FakeHost
	let controller: DialogController
	let closeSpy: jasmine.Spy

	beforeEach(() => {
		host = new FakeHost()
		controller = new DialogController(host)
		closeSpy = spyOn(host.close, 'dispatch').and.callThrough()
	})

	describe('confirm() / close()', () => {
		it('opens the host and resolves the returned promise when close() receives a value', async () => {
			const promise = controller.confirm<string>()

			expect(host.open).toBe(true)

			controller.close('done')

			expect(host.open).toBe(false)
			await expectAsync(promise).toBeResolvedTo('done')
		})

		it('rejects the returned promise when close() receives an Error instance', async () => {
			const promise = controller.confirm()
			const error = new Error('rejected')

			controller.close(error)

			await expectAsync(promise).toBeRejectedWith(error)
		})

		it('dispatches a close event with the result as detail', () => {
			controller.confirm()
			controller.close('value')

			expect(closeSpy).toHaveBeenCalledOnceWith('value')
		})

		it('does not dispatch close when the dialog was already closed', () => {
			controller.close('noop')
			expect(closeSpy).not.toHaveBeenCalled()
		})
	})

	describe('executeAction()', () => {
		it('resolves confirm() with the value returned by a synchronous action', async () => {
			host.primaryAction = () => 'ok'
			const promise = controller.confirm<string>()

			await controller.executeAction(DialogActionKey.Primary)

			await expectAsync(promise).toBeResolvedTo('ok')
		})

		it('resolves confirm() with the value of an async action', async () => {
			host.primaryAction = () => Promise.resolve('async-ok')
			const promise = controller.confirm<string>()

			await controller.executeAction(DialogActionKey.Primary)

			await expectAsync(promise).toBeResolvedTo('async-ok')
		})

		it('rejects confirm() when a synchronous action returns an Error', async () => {
			const error = new Error('domain rule')
			host.primaryAction = () => error
			const promise = controller.confirm()

			await controller.executeAction(DialogActionKey.Primary)

			await expectAsync(promise).toBeRejectedWith(error)
		})

		it('rejects confirm() when an async action resolves with an Error', async () => {
			const error = new Error('async domain rule')
			host.primaryAction = () => Promise.resolve(error)
			const promise = controller.confirm()

			await controller.executeAction(DialogActionKey.Primary)

			await expectAsync(promise).toBeRejectedWith(error)
		})

		it('toggles host.executingAction during execution and clears it afterwards', async () => {
			let mid: DialogActionKey | undefined
			host.primaryAction = () => {
				mid = host.executingAction
				return 'x'
			}

			await controller.executeAction(DialogActionKey.Primary)

			expect(mid).toBe(DialogActionKey.Primary)
			expect(host.executingAction).toBeUndefined()
		})

		it('clears executingAction even when the action throws', async () => {
			host.primaryAction = () => { throw new Error('boom') }

			await expectAsync(controller.executeAction(DialogActionKey.Primary)).toBeRejected()
			expect(host.executingAction).toBeUndefined()
		})

		it('rejects with a clear error when no action is registered for the key', async () => {
			await expectAsync(controller.executeAction(DialogActionKey.Primary))
				.toBeRejectedWithError(/No action for key 'primary'/)
		})

		it('does not close the dialog when an action throws', async () => {
			host.primaryAction = () => { throw new Error('boom') }
			controller.confirm()

			await expectAsync(controller.executeAction(DialogActionKey.Primary)).toBeRejected()

			expect(host.open).toBe(true)
			expect(closeSpy).not.toHaveBeenCalled()
		})
	})

	describe('error handling', () => {
		beforeEach(() => CapturingHandler.reset())

		it('routes thrown errors through a function-typed errorHandler and re-throws to the caller', async () => {
			const error = new Error('network')
			const handler = jasmine.createSpy('errorHandler')
			host.errorHandler = handler
			host.primaryAction = () => { throw error }

			await expectAsync(controller.executeAction(DialogActionKey.Primary)).toBeRejectedWith(error)

			expect(handler).toHaveBeenCalledOnceWith(error)
		})

		it('resolves and runs a registered string-keyed error handler', async () => {
			const error = new Error('via registry')
			host.errorHandler = 'controller-test-capturing' as never
			host.primaryAction = () => { throw error }

			await expectAsync(controller.executeAction(DialogActionKey.Primary)).toBeRejectedWith(error)

			expect(CapturingHandler.lastError).toBe(error)
			// The handler is constructed with the host, proving the controller is
			// the wiring point for both inline dialogs and `DialogComponent`-driven ones.
			expect(CapturingHandler.lastHost).toBe(host)
		})

		it('throws when a string-typed errorHandler is not registered', async () => {
			host.errorHandler = 'unknown-key' as never
			host.primaryAction = () => { throw new Error('boom') }

			// The registry lookup throws synchronously, replacing the original error.
			await expectAsync(controller.executeAction(DialogActionKey.Primary))
				.toBeRejectedWithError(/No error handler registered for key 'unknown-key'/)
		})

		it('does not invoke the error handler when the thrown error is a DialogCancelledError', async () => {
			const handler = jasmine.createSpy('errorHandler')
			host.errorHandler = handler
			const cancelled = new DialogCancelledError({ tagName: 'FAKE' } as never)
			host.primaryAction = () => { throw cancelled }

			await expectAsync(controller.executeAction(DialogActionKey.Primary)).toBeRejectedWith(cancelled)

			expect(handler).not.toHaveBeenCalled()
		})

		it('also short-circuits cancellation through a registered string-keyed handler', async () => {
			host.errorHandler = 'controller-test-capturing' as never
			const cancelled = new DialogCancelledError({ tagName: 'FAKE' } as never)
			host.primaryAction = () => { throw cancelled }

			await expectAsync(controller.executeAction(DialogActionKey.Primary)).toBeRejectedWith(cancelled)

			expect(CapturingHandler.lastError).toBeUndefined()
		})
	})

	describe('manualClose', () => {
		it('keeps the dialog open after a successful primary action when host.manualClose is true', async () => {
			host.manualClose = true
			host.primaryAction = () => 'ok'
			controller.confirm()

			await controller.executeAction(DialogActionKey.Primary)

			expect(host.open).toBe(true)
			expect(closeSpy).not.toHaveBeenCalled()
		})

		it('always closes on Cancellation regardless of manualClose', async () => {
			host.manualClose = true
			host.cancellationAction = () => new DialogCancelledError({ tagName: 'FAKE' } as never)
			const promise = controller.confirm()

			await controller.executeAction(DialogActionKey.Cancellation)

			expect(host.open).toBe(false)
			await expectAsync(promise).toBeRejectedWithError(DialogCancelledError)
		})
	})

	describe('dismiss()', () => {
		it('closes the host without settling the pending confirm() promise', async () => {
			const promise = controller.confirm()

			controller.dismiss()

			expect(host.open).toBe(false)
			expect(closeSpy).not.toHaveBeenCalled() // dismiss does NOT dispatch close

			// Promise is still pending; settle it explicitly to avoid leaking.
			controller.close('after')
			await expectAsync(promise).toBeResolvedTo('after')
		})
	})

	describe('keyboard short-cuts', () => {
		// Stub `Application.topLayer` to match the fake host's so the controller
		// considers this dialog's keys "in scope".
		beforeEach(() => spyOnProperty(Application, 'topLayer', 'get').and.returnValue(host.topLayerElement))

		it('subscribes to window keydown on hostConnected and unsubscribes on hostDisconnected', () => {
			const addSpy = spyOn(window, 'addEventListener').and.callThrough()
			const removeSpy = spyOn(window, 'removeEventListener').and.callThrough()

			host.connect()
			expect(addSpy).toHaveBeenCalledWith('keydown', jasmine.any(Function))

			host.disconnect()
			expect(removeSpy).toHaveBeenCalledWith('keydown', jasmine.any(Function))
		})

		it('triggers primary on Enter when primaryOnEnter is set', async () => {
			host.connect()
			host.primaryOnEnter = true
			host.primaryAction = () => 'enter'
			const promise = controller.confirm<string>()

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))

			await expectAsync(promise).toBeResolvedTo('enter')
		})

		it('does not trigger primary on Enter when primaryOnEnter is not set', async () => {
			host.connect()
			const primary = jasmine.createSpy('primary').and.returnValue('x')
			host.primaryAction = primary

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
			await Promise.resolve()

			expect(primary).not.toHaveBeenCalled()
		})

		it('triggers cancellation on Escape by default', async () => {
			host.connect()
			host.cancellationAction = () => new DialogCancelledError({ tagName: 'FAKE' } as never)
			const promise = controller.confirm()

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

			await expectAsync(promise).toBeRejectedWithError(DialogCancelledError)
		})

		it('does not cancel on Escape when preventCancellationOnEscape is true', async () => {
			host.connect()
			host.preventCancellationOnEscape = true
			const cancellation = jasmine.createSpy('cancellation').and.callFake(() => new DialogCancelledError({ tagName: 'FAKE' } as never))
			host.cancellationAction = cancellation

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
			await Promise.resolve()

			expect(cancellation).not.toHaveBeenCalled()
		})

		it('ignores keydown when this dialog is not in the active top layer', async () => {
			host.connect()
			host.primaryOnEnter = true
			const primary = jasmine.createSpy('primary').and.returnValue('x')
			host.primaryAction = primary

			// `Application.topLayer` (stubbed in beforeEach) returns *this* host's
			// topLayer, but a different host can claim to have one. Verify that a
			// dialog whose topLayerElement is NOT the active one ignores keys.
			const otherHost = new FakeHost()
			Object.assign(otherHost, { topLayerElement: { not: 'the active one' } })
			const otherController = new DialogController(otherHost)
			const otherPrimary = jasmine.createSpy('otherPrimary').and.returnValue('x')
			otherHost.primaryOnEnter = true
			otherHost.primaryAction = otherPrimary
			otherHost.connect()

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
			await Promise.resolve()

			// Active layer's primary fires; the other one's does not.
			expect(primary).toHaveBeenCalled()
			expect(otherPrimary).not.toHaveBeenCalled()

			otherController // keep reference; the controller subscribed to keydown via otherHost.connect()
		})
	})
})