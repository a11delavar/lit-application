import { apiValueConstructor, type ApiValueConstructor } from '@a11d/api'
import * as converter from '@a11d/converter'

export const model = (typeName: string) => {
	return (Constructor: Constructor<unknown>) => {
		ModelValueConstructor.modelConstructorsByTypeName.set(typeName, Constructor)
		// @ts-expect-error - ModelValueConstructor.typeNameKey is not typed
		Constructor[ModelValueConstructor.typeNameKey] = typeName
	}
}

@apiValueConstructor()
export class ModelValueConstructor implements ApiValueConstructor<object, object> {
	static readonly modelConstructorsByTypeName = new Map<string, Constructor<unknown>>()
	static readonly typeNameKey = '@type'

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