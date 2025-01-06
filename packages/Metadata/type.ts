const key = 'design:type'

/**
 * A general-purpose metadata decorator to store the type of a property in runtime.
 */
export function type<Target, TKey extends keyof Target>(type: Constructor<Target[TKey]>) {
	return (target: Target, propertyKey?: TKey) => {
		Reflect.defineMetadata(key, type, target as any, propertyKey as any)
	}
}

type.get = function (constructor: Constructor<any>, propertyKey: string) {
	return Reflect.getMetadata(key, constructor.prototype, propertyKey)
}

globalThis.type = type

declare global {
	// eslint-disable-next-line no-var
	var type: typeof import('./type.js').type & {
		get: typeof import('./type.js').type.get
	}
}