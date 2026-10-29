import { Controller, type ReactiveControllerHost } from '@a11d/lit'
import { LocalStorage } from './LocalStorage.js'

/**
 * Keeps one typed value in local storage like {@link LocalStorage} and updates its host whenever the value is set.
 *
 * @example
 * ```ts
 * import { LocalStorageController } from '@a11d/local-storage'
 *
 * class ProductList extends Component {
 * 	readonly view = new LocalStorageController<'grid' | 'list'>(this, 'ProductList.View', 'grid')
 *
 * 	protected override get template() {
 * 		return html`<button @click=${() => this.view.value = 'list'}>${this.view.value}</button>`
 * 	}
 * }
 * ```
 */
export class LocalStorageController<T> extends Controller {
	/** The underlying storage, e.g. to subscribe to its `changed` event. */
	readonly storage: LocalStorage<T>

	constructor(host: ReactiveControllerHost, ...parameters: ConstructorParameters<typeof LocalStorage<T>>) {
		super(host)
		this.storage = new LocalStorage(...parameters)
	}

	/** The stored value, see {@link LocalStorage.value}. */
	get value() { return this.storage.value }
	set value(value) { this.storage.value = value }

	override hostConnected() {
		this.storage.changed.subscribe(this.requestHostUpdate)
	}

	override hostDisconnected() {
		this.storage.changed.unsubscribe(this.requestHostUpdate)
	}

	private readonly requestHostUpdate = () => this.host.requestUpdate()
}
