import { ComponentTestFixture } from '@a11d/lit-testing'
import { Notification, NotificationComponent, NotificationType } from './NotificationComponent.js'
import { component } from '@a11d/lit'

describe('NotificationComponent', () => {
	@NotificationComponent.defaultComponent()
	@component('test-notification')
	class TestNotificationComponent extends NotificationComponent {
		override notification!: Notification

		override show() {
			return Promise.resolve()
		}
	}

	const fixture = new ComponentTestFixture(() => new TestNotificationComponent())
	fixture

	const all = [
		{ method: 'notifyInfo', type: NotificationType.Info },
		{ method: 'notifySuccess', type: NotificationType.Success },
		{ method: 'notifyWarning', type: NotificationType.Warning },
		{ method: 'notifyError', type: NotificationType.Error },
	] as const

	const action = { title: 'Test', handleClick: () => { } }

	for (const { method, type } of all) {

		it(`should proxy "${method}" with shortened parameters to "notify" with correct parameters`, async () => {
			spyOn(TestNotificationComponent, 'notify').and.callThrough()

			await TestNotificationComponent[method]('Test', action)

			expect(TestNotificationComponent.notify).toHaveBeenCalledWith({
				type,
				message: 'Test',
				actions: [action],
			})
		})

		it(`should proxy "${method}" with full parameters to "notify" with correct parameters`, async () => {
			spyOn(TestNotificationComponent, 'notify').and.callThrough()

			await TestNotificationComponent[method]({
				message: 'Test',
				actions: [action],
			})

			expect(TestNotificationComponent.notify).toHaveBeenCalledWith({
				type,
				message: 'Test',
				actions: [action],
			})
		})
	}

	describe('notifyAndThrowError', () => {
		it('should throw and proxy on shorthand parameters with error', () => {
			spyOn(TestNotificationComponent, 'notify').and.callThrough()
			const error = new Error('Test')

			expect(() => TestNotificationComponent.notifyAndThrowError(error, action)).toThrow(error)
			expect(TestNotificationComponent.notify).toHaveBeenCalledWith({
				type: NotificationType.Error,
				message: 'Test',
				actions: [action],
			})
		})

		it('should throw and proxy on shorthand parameters with error-message', () => {
			spyOn(TestNotificationComponent, 'notify').and.callThrough()
			const errorMessage = 'Test'

			expect(() => TestNotificationComponent.notifyAndThrowError(errorMessage, action)).toThrow(new Error(errorMessage))
			expect(TestNotificationComponent.notify).toHaveBeenCalledWith({
				type: NotificationType.Error,
				message: errorMessage,
				actions: [action],
			})
		})

		it('should throw and proxy on shorthand parameters with notification parameters', () => {
			spyOn(TestNotificationComponent, 'notify').and.callThrough()

			expect(() => TestNotificationComponent.notifyAndThrowError({
				message: 'Test',
				actions: [action],
			})).toThrow(new Error('Test'))
			expect(TestNotificationComponent.notify).toHaveBeenCalledWith({
				type: NotificationType.Error,
				message: 'Test',
				actions: [action],
			})
		})
	})
})