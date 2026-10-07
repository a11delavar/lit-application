const key = 'design:type'

/**
 * Records the runtime type of a property, which lets `getByKeyPath` of a metadata decorator walk through it.
 *
 * Importing the package also makes it available as the global `type`.
 */
export function type<Target, TKey extends keyof Target>(type: Constructor<Target[TKey]>) {
	return (target: Target, propertyKey?: TKey) => {
		Reflect.defineMetadata(key, type, target as any, propertyKey as any)
	}
}

/** Returns the type recorded for a property of a class. */
type.get = function (constructor: Constructor<any>, propertyKey: string) {
	return !constructor ? undefined : Reflect.getMetadata(key, constructor.prototype, propertyKey)
}

globalThis.type = type

declare global {
	var type: typeof import('./type.js').type & {
		get: typeof import('./type.js').type.get
	}
}
