import { PureEventDispatcher, isServer } from '@a11d/lit'

export class LocalStorage<T> {
	static readonly changed = new PureEventDispatcher<unknown>()
	static readonly container = new Set<LocalStorage<any>>()

	readonly changed = new PureEventDispatcher<T>()

	constructor(
		protected readonly name: string,
		protected readonly defaultValue: T,
		protected readonly reviver?: (key: string, value: any) => any
	) { LocalStorage.container.add(this) }

	get value(): T {
		if (isServer) {
			return this.defaultValue
		}

		const value = window.localStorage.getItem(this.name) ?? undefined

		if (value === undefined) {
			return this.defaultValue
		}

		try {
			return JSON.parse(value, this.reviver)
		} catch {
			return value as unknown as T
		}
	}

	set value(obj: T) {
		if (obj === undefined) {
			window.localStorage.removeItem(this.name)
		} else {
			window.localStorage.setItem(this.name, JSON.stringify(obj))
		}
		this.changed.dispatch(obj)
		LocalStorage.changed.dispatch(this)
	}
}