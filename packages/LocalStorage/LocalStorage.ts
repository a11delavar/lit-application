import { PureEventDispatcher, isServer } from '@a11d/lit'

/**
 * Keeps one typed value in local storage under a name, falling back to a default and announcing each change.
 *
 * @example
 * ```ts
 * import { LocalStorage } from '@a11d/local-storage'
 *
 * const colorScheme = new LocalStorage<'light' | 'dark'>('App.ColorScheme', 'light')
 *
 * colorScheme.changed.subscribe(value => document.documentElement.style.colorScheme = value)
 * colorScheme.value = 'dark'
 * ```
 */
export class LocalStorage<T> {
	/** Dispatches every `LocalStorage` whose value is set. */
	static readonly changed = new PureEventDispatcher<unknown>()
	/** Every `LocalStorage` created so far. */
	static readonly container = new Set<LocalStorage<any>>()

	/** Dispatches the new value whenever it is set. */
	readonly changed = new PureEventDispatcher<T>()

	constructor(
		protected readonly name: string,
		protected readonly defaultValue: T,
		protected readonly reviver?: (key: string, value: any) => any,
	) { LocalStorage.container.add(this) }

	/** The stored value, parsed from JSON where possible, or the default when nothing is stored or on the server; `undefined` removes it. */
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
