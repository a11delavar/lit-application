import { Api } from './Api.js'

/**
 * The contract a value constructor fulfills to construct domain values from responses and to deconstruct them for requests.
 *
 * `Api` offers each value to the registered constructors in turn and takes the first one that claims it. Response values are
 * offered innermost first, as `JSON.parse` revives them, request values outermost first.
 */
export type ApiValueConstructor<TConstructed, TDeconstructed> = {
	/** Tells whether this constructor constructs the given response value, which may be any JSON value. */
	shallConstruct(text: unknown): boolean
	construct(text: TDeconstructed): TConstructed

	/** Tells whether this constructor deconstructs the given request value; without it, none is deconstructed. */
	shallDeconstruct?(value: unknown): boolean
	deconstruct?(value: TConstructed): TDeconstructed
}

/** Registers an instance of the decorated class as a value constructor of `Api`. */
export const apiValueConstructor = () => {
	return (Constructor: Constructor<ApiValueConstructor<unknown, unknown>>) => {
		Api.valueConstructors.add(new Constructor)
	}
}