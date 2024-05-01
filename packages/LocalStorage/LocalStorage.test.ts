import { LocalStorage } from './LocalStorage'

describe('LocalStorage', () => {
	afterEach(() => localStorage.clear())

	it('should set and get the value correctly', () => {
		const storage = new LocalStorage('test', 'default')

		expect(storage.value).toBe('default')

		storage.value = 'new value'

		expect(storage.value).toBe('new value')
	})

	it('should automatically be added to the container', () => {
		const storage = new LocalStorage('test', 'default')

		expect(LocalStorage.container.has(storage)).toBeTrue()
	})

	it('should dispatch the "changed" event when the value is set', () => {
		const storage = new LocalStorage('test', 'default')
		const callback = jasmine.createSpy()

		storage.changed.subscribe(callback)
		storage.value = 'new value'

		expect(callback).toHaveBeenCalledWith('new value')
	})

	it('should dispatch the global "changed" event when the value is set using static method', () => {
		const callback = jasmine.createSpy()
		const storage1 = new LocalStorage('test1', 'default1')
		const storage2 = new LocalStorage('test2', 'default2')

		LocalStorage.changed.subscribe(callback)
		LocalStorage.container.forEach(storage => storage.value = 'new value')

		expect(callback).toHaveBeenCalledWith(storage1)
		expect(callback).toHaveBeenCalledWith(storage2)
	})

	it('should pass the reviver to JSON.parse', () => {
		const storage = new LocalStorage('test', 'default', (_, value) => value + ' modified')

		expect(storage.value).toBe('default')

		storage.value = 'new value'

		expect(storage.value).toBe('new value modified')
	})
})