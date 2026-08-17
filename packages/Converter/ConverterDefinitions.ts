import { type Converter, type ConverterKeys, converters } from './Converter.js'

/** A converter itself, a registered key, or nothing — the last one maps a key across without converting. */
export type ConverterOption = ConverterKeys | Converter | undefined

/** One direction: a single option for the member's own key, or a map of the keys it maps against. */
export type ConverterDefinition = ConverterOption | Record<string, ConverterOption>

export type ConverterOptions = ConverterDefinition | {
	in?: ConverterDefinition
	out?: ConverterDefinition
}

/** Which keys a member reads from and writes to, in declaration order. */
export type ConverterDirections = {
	in: Map<string, Converter | undefined>
	out: Map<string, Converter | undefined>
}

const definitionsKey = Symbol('converterDefinitions')

type Definitions = Map<PropertyKey, ConverterDirections>

/** Every definition a class carries, its own and its ancestors'. */
export function definitionsOf(constructor: unknown): Definitions {
	return (constructor as Record<symbol, Definitions> | undefined)?.[definitionsKey] ?? new Map()
}

// A subclass starts from a COPY of what it inherits, so declaring a member on it never writes into
// the parent's definitions.
function ownDefinitionsOf(constructor: object): Definitions {
	if (!Object.getOwnPropertyDescriptor(constructor, definitionsKey)) {
		Object.defineProperty(constructor, definitionsKey, { value: new Map(definitionsOf(constructor)) })
	}
	return (constructor as Record<symbol, Definitions>)[definitionsKey]!
}

function isConverter(value: unknown): value is Converter {
	return !!value && typeof value === 'object'
		&& (typeof (value as Converter).construct === 'function' || typeof (value as Converter).deconstruct === 'function')
}

function isOption(value: unknown): value is ConverterOption {
	return value === undefined || typeof value === 'string' || isConverter(value)
}

function resolve(option: ConverterOption) {
	return typeof option === 'string' ? converters.resolve(option) : option
}

function directionOf(definition: ConverterDefinition, key: PropertyKey): Map<string, Converter | undefined> {
	if (isOption(definition)) {
		return new Map([[String(key), resolve(definition)]])
	}
	return new Map(Object.entries(definition).map(([mappedKey, option]) => {
		if (!isOption(option)) {
			throw new Error(`"${mappedKey}" is neither a converter, a registered key nor undefined.`)
		}
		return [mappedKey, resolve(option)]
	}))
}

export function extractDirections(options: ConverterOptions, key: PropertyKey): ConverterDirections {
	if (isOption(options)) {
		const direction = directionOf(options, key)
		return { in: direction, out: new Map(direction) }
	}

	if (typeof options !== 'object' || Array.isArray(options)) {
		throw new Error(`Invalid converter options for "${String(key)}".`)
	}

	if ('in' in options || 'out' in options) {
		const keys = Object.keys(options)
		if (keys.some(option => option !== 'in' && option !== 'out')) {
			throw new Error(`Converter options for "${String(key)}" mix "in"/"out" with mapped keys.`)
		}
		return {
			in: options.in === undefined ? new Map() : directionOf(options.in, key),
			out: options.out === undefined ? new Map() : directionOf(options.out, key),
		}
	}

	const direction = directionOf(options, key)
	return { in: direction, out: new Map(direction) }
}

export function define(prototype: object, key: PropertyKey, options: ConverterOptions) {
	const definitions = ownDefinitionsOf(prototype.constructor)
	const directions = extractDirections(options, key)

	// Two members writing the same outgoing key would silently overwrite each other.
	for (const [other, otherDirections] of definitions) {
		if (other === key) {
			continue
		}
		const conflict = [...directions.out.keys()].find(outKey => otherDirections.out.has(outKey))
		if (conflict) {
			throw new Error(`"${prototype.constructor.name}" deconstructs both "${String(other)}" and "${String(key)}" into "${conflict}".`)
		}
	}

	definitions.set(key, directions)
}