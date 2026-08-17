import '@a11d/constructor'

declare global {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface ConvertersByKeys { }
}

/**
 * The keys consumers register through `ConvertersByKeys`. Until something is registered there is
 * nothing to constrain, so any string is accepted — the moment a consumer declares one key, only the
 * declared ones are.
 */
export type ConverterKey = [keyof ConvertersByKeys] extends [never] ? string : keyof ConvertersByKeys

/** A registered key, or a fallback chain of them — the first converter yielding a value wins. */
export type ConverterKeys = ConverterKey | `${ConverterKey} ?? ${ConverterKey}`

/**
 * A bidirectional conversion between how a value arrives and how the domain holds it.
 *
 * Both directions are optional: an omitted one passes the value through unchanged, so a read-only
 * mapping is a literal with a single `construct`. `data` is the surrounding object — the incoming
 * payload while constructing, the outgoing one while deconstructing.
 */
export interface Converter<Deconstructed = any, Constructed = any> {
	construct?(value: Deconstructed, data: object): Constructed
	deconstruct?(value: Constructed, data: object): Deconstructed
}

/** Tries each converter in turn and takes the first value that is neither null nor undefined. */
export class CompositeConverter<Deconstructed = any, Constructed = any> implements Converter<Deconstructed, Constructed> {
	private readonly converters: ReadonlyArray<Converter<Deconstructed, Constructed>>

	constructor(...converters: Array<Converter<Deconstructed, Constructed>>) {
		this.converters = converters
	}

	construct(value: Deconstructed, data: object) {
		return this.first('construct', value, data) as Constructed
	}

	deconstruct(value: Constructed, data: object) {
		return this.first('deconstruct', value, data) as Deconstructed
	}

	// A direction no member implements is not a failed conversion but an absent one, so the value
	// passes through rather than collapsing to undefined.
	private first(direction: 'construct' | 'deconstruct', value: unknown, data: object) {
		let implemented = false
		for (const converter of this.converters) {
			const convert = converter[direction] as ((value: unknown, data: object) => unknown) | undefined
			if (!convert) {
				continue
			}
			implemented = true
			const converted = convert.call(converter, value, data)
			if (converted !== undefined && converted !== null) {
				return converted
			}
		}
		return implemented ? undefined : value
	}
}

export const converters = new class extends Map<ConverterKey, Converter> {
	getOrThrow(key: ConverterKey) {
		const converter = this.get(key)
		if (!converter) {
			throw new Error(`No converter is registered as "${String(key)}".`)
		}
		return converter
	}

	/** Resolves a key, or a `'a ?? b'` chain, into a single converter. */
	resolve(key: ConverterKeys): Converter {
		if (!key.includes('??')) {
			return this.getOrThrow(key as ConverterKey)
		}
		return new CompositeConverter(...key.split('??').map(part => this.resolve(part.trim() as ConverterKeys)))
	}
}