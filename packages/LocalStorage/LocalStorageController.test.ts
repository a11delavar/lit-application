import { type ReactiveController, type ReactiveControllerHost } from '@a11d/lit'
import { LocalStorageController } from './LocalStorageController.js'

describe('LocalStorageController', () => {
	afterEach(() => localStorage.clear())

	const createHost = () => {
		const controllers = new Array<ReactiveController>()
		return {
			controllers,
			addController: (controller: ReactiveController) => controllers.push(controller),
			removeController: () => { },
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		} satisfies ReactiveControllerHost & { controllers: Array<ReactiveController> }
	}

	it('should register itself with the host', () => {
		const host = createHost()

		const controller = new LocalStorageController(host, 'test', 'default')

		expect(host.controllers).toContain(controller)
	})

	it('should set and get the value of the storage', () => {
		const controller = new LocalStorageController(createHost(), 'test', 'default')

		expect(controller.value).toBe('default')

		controller.value = 'new value'

		expect(controller.value).toBe('new value')
		expect(controller.storage.value).toBe('new value')
	})

	it('should update the connected host whenever the value is set', () => {
		const host = createHost()
		const controller = new LocalStorageController(host, 'test', 'default')
		controller.hostConnected()

		controller.storage.value = 'new value'

		expect(host.requestUpdate).toHaveBeenCalledTimes(1)
	})

	it('should not update the host after it disconnected', () => {
		const host = createHost()
		const controller = new LocalStorageController(host, 'test', 'default')
		controller.hostConnected()
		controller.hostDisconnected()

		controller.value = 'new value'

		expect(host.requestUpdate).not.toHaveBeenCalled()
	})
})
