/**
 * Creates a metadata decorator with the given key supporting both class and property metadata.
 * It also provides a getter for retrieving metadata by key and key-path (e.g. 'property.subProperty').
 * The key-path getter needs the property to be decorated with `@type(SubPropertyType)`
 * for the generated decorator to be able to resolve the metadata.
 */
export function createMetadataDecorator(key: symbol) {
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
		const parent = keys.reduce((previousType, key) => type.get(previousType, key), constructor)
		if (!parent) {
			throw new Error(`Could not resolve type for key path "${keyPath}". Ensure nested properties are decorated with @type(SubPropertyType)`)
		}
		return metadata.get(parent, key)
	}

	return metadata
}