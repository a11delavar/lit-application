import { apiValueConstructor, type ApiValueConstructor } from '@a11d/api'
import * as converter from '@a11d/converter'

/**
 * Registers the decorated class under a type name, so response objects with that name in `@type` become instances of it.
 *
 * Its instances in request bodies carry the name in `@type` in turn. Members are converted through `@a11d/converter`, so
 * `@converter` declarations apply.
 *
 * @example
 * ```ts
 * import { Api } from '@a11d/api'
 * import { model } from '@a11d/api-model-value-constructor'
 *
 * @model('Customer')
 * export class Customer {
 * 	name = ''
 * }
 *
 * const customer = await Api.get<Customer>('/customers/1')
 * customer instanceof Customer // true, as the response carries '@type': 'Customer'
 * await Api.put('/customers/1', customer)
 * ```
 */
export const model = (typeName: string) => {
	return (Constructor: Constructor<unknown>) => {
		ModelValueConstructor.modelConstructorsByTypeName.set(typeName, Constructor)
		// @ts-expect-error - ModelValueConstructor.typeNameKey is not typed
		Constructor[ModelValueConstructor.typeNameKey] = typeName
	}
}

/** Constructs response objects whose `@type` names a registered model as instances of it, and tags model instances in requests. */
@apiValueConstructor()
export class ModelValueConstructor implements ApiValueConstructor<object, object> {
	/** The model classes by type name, filled by `@model`. */
	static readonly modelConstructorsByTypeName = new Map<string, Constructor<unknown>>()
	static readonly typeNameKey = '@type'

	/** Returns the type name `@model` registered for the class of `value`, if any. */
	static typeNameOf(value: object) {
		const typeName = (value.constructor as Partial<Record<typeof ModelValueConstructor.typeNameKey, unknown>> | undefined)?.[ModelValueConstructor.typeNameKey]
		return typeof typeName === 'string' ? typeName : undefined
	}

	shallConstruct(value: unknown) {
		return !!value && typeof value === 'object' && ModelValueConstructor.typeNameKey in value
	}

	construct(object: object) {
		const typeName = object[ModelValueConstructor.typeNameKey as keyof typeof object] as string
		const Constructor = ModelValueConstructor.modelConstructorsByTypeName.get(typeName)
		// A constructor always yields an object, which the registry's `unknown` does not say.
		return !Constructor ? object : converter.construct(Constructor as Constructor<object>, object)
	}

	shallDeconstruct(value: unknown) {
		return !!value && typeof value === 'object' && ModelValueConstructor.typeNameOf(value) !== undefined
	}

	deconstruct(value: object) {
		return {
			[ModelValueConstructor.typeNameKey]: ModelValueConstructor.typeNameOf(value),
			...converter.deconstruct(value),
		}
	}
}
