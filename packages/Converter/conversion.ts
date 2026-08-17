import '@a11d/constructor'
import '@a11d/is-writable'
import { definitionsOf } from './ConverterDefinitions.js'

/**
 * Builds an instance from an incoming representation, running each member's `in` converters.
 *
 * A member takes the first DEFINED value among the keys it maps against. Its OWN name leads: a payload
 * already speaking the domain's language needs no translation, and the declared keys are the fallbacks
 * for when it speaks a foreign spelling — listed most preferred first. Naming the own key in the
 * declaration only attaches a converter to it; its position stays first.
 *
 * A member none of whose keys the payload CARRIES is left untouched, so a field initializer stands as
 * the default. That is absence, not emptiness: a key that is there and converts to `undefined` writes
 * `undefined`, because a converter saying "this means nothing" is an answer.
 *
 * Converters receive the object being built as their `data`, so one may read what an earlier member
 * produced — which makes declaration order meaningful, deliberately: a member mapped from another
 * member's constructed value has to be declared after it.
 */
export function construct<T extends object>(Constructor: Constructor<T>, from: object): T {
	const definitions = definitionsOf(Constructor)
	const constructed = { ...from } as Record<string, unknown>
	const mappedKeys = new Set<string>()

	for (const [key, directions] of definitions) {
		const property = String(key)
		const candidates = new Map<string, unknown>([[property, constructed[property]]])
		let carried = property in constructed

		for (const [mappedKey, converter] of directions.in) {
			carried ||= mappedKey in constructed
			// `set` on the own key replaces its value without moving it off the front.
			candidates.set(mappedKey, converter?.construct ? converter.construct(constructed[mappedKey], constructed) : constructed[mappedKey])
			if (mappedKey !== property && !definitions.has(mappedKey)) {
				mappedKeys.add(mappedKey)
			}
		}

		const value = [...candidates.values()].find(candidate => candidate !== undefined)
		if (value !== undefined || carried) {
			constructed[property] = value
		}
	}

	// The keys a member read from are the back end's vocabulary, not the domain's.
	for (const mappedKey of mappedKeys) {
		delete constructed[mappedKey]
	}

	const instance = new Constructor
	for (const [property, value] of Object.entries(constructed)) {
		if (Object.isWritable(instance, property)) {
			(instance as Record<string, unknown>)[property] = value
		}
	}
	return instance
}

/**
 * Reduces an instance to its outgoing representation, running each member's `out` converters.
 *
 * Converters receive the OUTGOING object as their `data`, so one member may write several keys — and a
 * mapping with NO converter copies whatever that object currently holds for the member, which is how a
 * member sends the same value twice, once converted and once not. The instance itself is never touched,
 * and a member with no `out` mapping at all is omitted entirely — that is how a value is read-only.
 */
export function deconstruct<T extends object>(instance: T): Record<string, unknown> {
	const definitions = definitionsOf(instance.constructor)
	const deconstructed = { ...instance } as Record<string, unknown>
	const emitted = new Set<string>()

	for (const [key, directions] of definitions) {
		const property = String(key)
		for (const [mappedKey, converter] of directions.out) {
			deconstructed[mappedKey] = converter?.deconstruct
				? converter.deconstruct((instance as Record<string, unknown>)[property], deconstructed)
				: deconstructed[property]
			emitted.add(mappedKey)
		}
	}

	for (const key of definitions.keys()) {
		const property = String(key)
		if (!emitted.has(property)) {
			delete deconstructed[property]
		}
	}

	return deconstructed
}