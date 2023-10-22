import { apiValueConstructor, type ApiValueConstructor } from '@a11d/api'
import '@a11d/is-writable'

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

	shallConstruct = (value: unknown) =>
		!!value && typeof value === 'object' && ModelValueConstructor.typeNameKey in value

	construct(object: object) {
		const typeName = object[ModelValueConstructor.typeNameKey as keyof typeof object] as string
		const Constructor = ModelValueConstructor.modelConstructorsByTypeName.get(typeName)
		return !Constructor ? object : safeAssign(new Constructor, object)
	}
}

function safeAssign<T, U>(target: T, source: U): T & U {
	for (const [key, value] of Object.entries(source as any)) {
		if (Object.isWritable(target, key)) {
			target[key as keyof T] = value as any
		}
	}
	return target as T & U
}