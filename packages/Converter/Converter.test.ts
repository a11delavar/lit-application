import { CompositeConverter, type Converter, converters } from './Converter.js'
import { converter } from './decorator.js'

@converter('bit')
class BitConverter implements Converter<'0' | '1' | undefined, boolean | undefined> {
	construct(value: '0' | '1' | undefined) {
		return value === undefined ? undefined : value === '1'
	}

	deconstruct(value: boolean | undefined) {
		return value === undefined ? undefined : value ? '1' : '0'
	}
}

@converter('trimmed')
class TrimmedConverter implements Converter<string, string> {
	construct(value: string) {
		return value?.trim()
	}
}

declare global {
	interface ConvertersByKeys {
		'bit': BitConverter
		'trimmed': TrimmedConverter
	}
}

describe('converters', () => {
	it('should register a decorated class under its key', () => {
		expect(converters.get('bit')).toBeInstanceOf(BitConverter)
		expect(converters.resolve('bit').construct?.('1', {})).toBe(true)
	})

	it('should throw for an unregistered key', () => {
		expect(() => converters.resolve('unregistered' as 'bit')).toThrowError(/No converter is registered/)
	})

	it('should throw when a registered class implements neither direction', () => {
		expect(() => converter('bit')(class Empty { } as never)).toThrowError(/implements neither/)
	})

	it('should resolve a fallback chain into a composite', () => {
		expect(converters.resolve('trimmed ?? bit')).toBeInstanceOf(CompositeConverter)
	})
})

describe('CompositeConverter', () => {
	const nothing: Converter = { construct: () => undefined, deconstruct: () => undefined }
	const something: Converter = { construct: () => 'constructed', deconstruct: () => 'deconstructed' }

	it('should take the first value that is neither null nor undefined', () => {
		expect(new CompositeConverter(nothing, something).construct('', {})).toBe('constructed')
		expect(new CompositeConverter(something, nothing).construct('', {})).toBe('constructed')
		expect(new CompositeConverter(nothing, { construct: () => null }).construct('', {})).toBe(undefined)
	})

	it('should apply each direction independently', () => {
		const composite = new CompositeConverter(nothing, something)

		expect(composite.deconstruct('', {})).toBe('deconstructed')
	})

	it('should pass the value through when no member implements the direction', () => {
		const composite = new CompositeConverter({ construct: () => 'constructed' })

		expect(composite.deconstruct('untouched', {})).toBe('untouched')
	})
})