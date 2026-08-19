/**
 * Creates a metadata decorator supporting both class and property metadata.
 * It also provides a getter for retrieving metadata by key and key-path (e.g. 'property.subProperty').
 * The key-path getter needs the property to be decorated with `@type(SubPropertyType)`
 * for the generated decorator to be able to resolve the metadata.
 *
 * The description is passed through to the underlying `Symbol(description)` and is therefore,
 * exactly as there, optional and purely diagnostic - it is what tells the decorators' symbols
 * apart in devtools, error messages and test output.
 */
export function createMetadataDecorator(description?: string) {
	// Widened explicitly, as the inferred `unique symbol` type would be function-local
	// and therefore unnameable in the inferred types of exported decorators (TS2527).
	const key: symbol = Symbol(description)

	function metadata(value: unknown) {
		return (target: any, propertyKey?: string) => {
			Reflect.defineMetadata(key, value, target, propertyKey!)
		}
	}

	metadata.get = function (constructor: Constructor<any>, propertyKey?: string) {
		return propertyKey === undefined
			? Reflect.getMetadata(key, constructor)
			: Reflect.getMetadata(key, constructor.prototype, propertyKey)
	}

	metadata.getByKeyPath = function <T>(constructor: Constructor<T>, keyPath: KeyPath.Of<T>) {
		const keys = keyPath.split('.')
		const key = keys.pop() as string
		const parent = keys.reduce((previousType, key) => type.get(previousType!, key), constructor)
		if (!parent) {
			return undefined
		}
		return metadata.get(parent, key)
	}

	/**
	 * Symbol key of an instance member which overrides the statically decorated metadata of its class.
	 * Declare it as a getter to derive the value from the instance's own state:
	 * ```ts
	 * @label('Prices') class DialogPrices extends DialogComponent<{ readonly count: number }> {
	 * 	get [label.override]() { return `Prices (${this.parameters.count})` }
	 * }
	 * ```
	 *
	 * Prefer splitting the class up instead whenever the variance is finite and enumerable,
	 * as separate classes each carrying their own static metadata keep it statically analyzable.
	 * This escape hatch exists for values which depend on instance data and therefore cannot
	 * be expressed by any fixed set of classes, such as an entity's name within a heading.
	 *
	 * The member may also be a plain field, but it is never invoked, so a function is
	 * returned as the metadata value itself. Returning `undefined` defers to the static value,
	 * which makes conditional overrides possible. Otherwise it replaces the statically
	 * decorated value entirely rather than being merged with it. Read it through `resolve`.
	 *
	 * This is the metadata key itself, which cannot clash with it, as the values are held in a
	 * side table keyed by their target rather than as properties on it.
	 */
	metadata.override = key

	/**
	 * Retrieves the metadata of an instance, preferring the value of its `override`
	 * member over the value statically decorated onto its class.
	 *
	 * Consumers holding an instance should always prefer this over `get`, as `get` cannot
	 * see instance-level overrides. Unlike `get`, this is class-level only by design, since
	 * a single symbol cannot distinguish between the properties it would be overriding.
	 */
	metadata.resolve = function (instance: object) {
		const overriddenValue = (instance as any)[key]
		if (overriddenValue !== undefined && overriddenValue !== null) {
			return overriddenValue
		}
		return !instance.constructor ? undefined : metadata.get(instance.constructor as Constructor<any>)
	}

	return metadata
}