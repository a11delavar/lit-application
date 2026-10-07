import { type Converter, type ConverterKey, converters } from './Converter.js'
import { define, type ConverterOptions } from './ConverterDefinitions.js'

/**
 * Registers the decorated converter class under a key, or applies a converter to the decorated member.
 *
 * On a member, it takes a registered key, an inline `Converter`, a map of the payload keys the member maps against, or
 * separate `in` and `out` definitions of those.
 *
 * @example
 * ```ts
 * import { construct, converter, deconstruct, type Converter } from '@a11d/converter'
 *
 * @converter('bit')
 * class BitConverter implements Converter<'0' | '1', boolean> {
 * 	construct(value: '0' | '1') {
 * 		return value === '1'
 * 	}
 *
 * 	deconstruct(value: boolean) {
 * 		return value ? '1' : '0'
 * 	}
 * }
 *
 * declare global {
 * 	interface ConvertersByKeys {
 * 		'bit': BitConverter
 * 	}
 * }
 *
 * class Task {
 * 	@converter({ done: 'bit' }) isDone = false
 * 	@converter({ construct: (value: string) => value.trim() }) title = ''
 * }
 *
 * const task = construct(Task, { done: '1', title: ' Write the docs ' })
 * deconstruct(task) // { title: 'Write the docs', done: '1' }
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

		const instance = new (target as Constructor<Converter>)()
		if (!instance.construct && !instance.deconstruct) {
			throw new Error(`"${(target as Constructor<Converter>).name}" implements neither "construct" nor "deconstruct".`)
		}
		converters.set(options as ConverterKey, instance)
	}) as ClassDecorator & PropertyDecorator
}
