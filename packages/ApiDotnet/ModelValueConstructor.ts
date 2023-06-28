import { apiValueConstructor, ApiValueConstructor } from '@a11d/api'

export const model = (dotnetTypeName: string) => {
	return (Constructor: Constructor<unknown>) => {
		ModelValueConstructor.modelConstructorsByDotnetTypeName.set(dotnetTypeName, Constructor)
	}
}

@apiValueConstructor()
export class ModelValueConstructor implements ApiValueConstructor<object, object> {
	static readonly modelConstructorsByDotnetTypeName = new Map<string, Constructor<unknown>>()
	private static readonly dotnetTypeNameKeyName = '__typeName__'

	shallConstruct = (value: unknown) => !!value && typeof value === 'object' && ModelValueConstructor.dotnetTypeNameKeyName in value

	construct(object: object) {
		const dotnetTypeName = object[ModelValueConstructor.dotnetTypeNameKeyName as keyof typeof object] as string
		const Constructor = ModelValueConstructor.modelConstructorsByDotnetTypeName.get(dotnetTypeName)
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