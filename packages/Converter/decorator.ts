import { type Converter, type ConverterKey, converters } from './Converter.js'
import { define, type ConverterOptions } from './ConverterDefinitions.js'

/**
 * One decorator, told apart by what it decorates — a legacy decorator receives only the target for a
 * class and a key as well for a member:
 *
 * ```ts
 * @converter('bit')                            // class: registers it under the key
 * class BitConverter implements Converter<'0' | '1' | undefined, boolean | undefined> { … }
 *
 * @converter('bit') isDone!: boolean            // member: applies the registered converter
 * @converter({ construct: value => … }) note!: string  // member: applies an inline one
 * @converter({ in: { done: 'bit' }, out: { isdone: 'bit' } }) isDone!: boolean
 * ```
 */
export const converter = (options: ConverterKey | ConverterOptions) => {
	return ((target: object, key?: PropertyKey) => {
		if (key !== undefined) {
			return define(target, key, options as ConverterOptions)
		}

		if (typeof options !== 'string') {
			throw new Error('A converter class is registered under a key.')
		}

		const instance = new (target as Constructor<Converter>)
		if (!instance.construct && !instance.deconstruct) {
			throw new Error(`"${(target as Constructor<Converter>).name}" implements neither "construct" nor "deconstruct".`)
		}
		converters.set(options as ConverterKey, instance)
	}) as ClassDecorator & PropertyDecorator
}