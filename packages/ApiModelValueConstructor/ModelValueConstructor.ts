import { apiValueConstructor, type ApiValueConstructor } from '@a11d/api'

export const model = (typeName: string) => {
	return (Constructor: Constructor<unknown>) => {
		ModelValueConstructor.modelConstructorsByTypeName.set(typeName, Constructor)
		// @ts-expect-error - @type is a key not known by TypeScript
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
	const safeSource = Object.fromEntries(
		Object.entries(source as any).reduce((accumulator, currentValue) => {
			const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), currentValue[0])
			if (!descriptor || descriptor.set) {
				accumulator.push(currentValue)
			}
			return accumulator
		}, new Array<[string, any]>())
	)
	return Object.assign(target as any, safeSource)
}