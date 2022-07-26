import { PureEventDispatcher } from '@a11d/lit'

export class LocalStorageEntry<T> {
	static readonly changed = new PureEventDispatcher<unknown>()
	static readonly container = new Set<LocalStorageEntry<any>>()

	readonly changed = new PureEventDispatcher<T>()

	constructor(
		protected readonly name: string,
		protected readonly defaultValue: T,
		protected readonly reviver?: (key: string, value: any) => any
	) { LocalStorageEntry.container.add(this) }

	get value(): T {
		const value = window.localStorage.getItem(this.name) ?? undefined

		if (value === undefined) {
			return this.defaultValue
		}

		try {
			return JSON.parse(value, this.reviver)
		} catch (e) {
			return value as unknown as T
		}
	}

	set value(obj: T) {
		window.localStorage.setItem(this.name, JSON.stringify(obj))
		this.changed.dispatch(obj)
		LocalStorageEntry.changed.dispatch(this)
	}
}