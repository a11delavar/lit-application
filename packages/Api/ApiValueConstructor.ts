import { Api } from './Api.js'

export type ApiValueConstructor<TConstructed, TDeconstructed> = {
	shallConstruct(text: unknown): boolean
	construct(text: TDeconstructed): TConstructed

	shallDeconstruct?(value: unknown): boolean
	deconstruct?(value: TConstructed): TDeconstructed
}

export const apiValueConstructor = () => {
	return (Constructor: Constructor<ApiValueConstructor<unknown, unknown>>) => {
		Api.valueConstructors.add(new Constructor)
	}
}