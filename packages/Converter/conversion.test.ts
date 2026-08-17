import { type Converter } from './Converter.js'
import { construct, deconstruct } from './conversion.js'
import { converter } from './decorator.js'

const bit: Converter<'0' | '1' | undefined, boolean | undefined> = {
	construct: value => value === undefined ? undefined : value === '1',
	deconstruct: value => value === undefined ? undefined : value ? '1' : '0',
}

class Data {
	@converter({ in: { done: bit }, out: { isdone: bit } }) isDone?: boolean

	// Several spellings of one value: the first one the back end actually sent wins.
	@converter({ firstname: undefined, firstName: undefined }) firstName = ''

	// Reads a sibling rather than its own key, which is why converters see the whole payload.
	@converter({ in: { fullName: { construct: (value: string) => value?.split(' ')[1] ?? '' } }, out: {} }) lastName = ''

	@converter({ construct: (value: string) => value?.trim() }) note = ''

	untouched = ''

	get derived() { return `${this.firstName} ${this.lastName}` }
}

describe('construct', () => {
	it('should convert, rename and leave undeclared members alone', () => {
		const data = construct(Data, { done: '1', firstname: 'Ada', fullName: 'Ada Lovelace', note: '  hi  ', untouched: 'kept' })

		expect(data).toBeInstanceOf(Data)
		expect(data.isDone).toBe(true)
		expect(data.firstName).toBe('Ada')
		expect(data.lastName).toBe('Lovelace')
		expect(data.note).toBe('hi')
		expect(data.untouched).toBe('kept')
	})

	it('should take the first spelling that is present, the member\'s own name leading', () => {
		expect(construct(Data, { firstname: 'Ada' }).firstName).toBe('Ada')
		// The own name wins over a declared alias — a payload speaking the domain's language is not a
		// foreign spelling to translate. Declaring it merely attaches a converter to it.
		expect(construct(Data, { firstname: 'alias', firstName: 'own' }).firstName).toBe('own')
		// …and it leads even when the declaration never mentions it.
		expect(construct(Data, { fullName: 'Ada Lovelace', lastName: 'own' }).lastName).toBe('own')
	})

	it('should leave a member alone when the payload carries none of its keys', () => {
		expect(construct(Data, {}).firstName).toBe('')
		expect(construct(Data, {}).isDone).toBe(undefined)
	})

	it('should write undefined when a key IS carried but means nothing', () => {
		// Absence leaves the default standing; a converter answering "this means nothing" does not.
		expect(construct(Data, { done: undefined }).isDone).toBe(undefined)
		expect('note' in construct(Data, { note: undefined })).toBe(true)
		expect(construct(Data, { note: undefined }).note).toBe(undefined)
	})

	it('should let a member read what an earlier one produced', () => {
		// The reason declaration order is meaningful: `initials` maps off `firstName`, which is only a
		// domain value once the member above it has been constructed.
		class Chained {
			@converter({ firstname: undefined }) firstName = ''
			@converter({ in: { firstName: { construct: (value: string) => value?.[0]?.toUpperCase() } }, out: {} }) initial = ''
		}

		expect(construct(Chained, { firstname: 'ada' }).initial).toBe('A')
	})

	it('should drop the keys it read from', () => {
		expect('done' in construct(Data, { done: '1' })).toBe(false)
		expect('fullName' in construct(Data, { fullName: 'Ada Lovelace' })).toBe(false)
	})

	it('should not write read-only members', () => {
		expect(construct(Data, { derived: 'ignored' }).derived).toBe(' ')
	})

	it('should not touch what it was given', () => {
		const incoming = { done: '1', firstname: 'Ada' }

		construct(Data, incoming)

		expect(incoming).toEqual({ done: '1', firstname: 'Ada' })
	})
})

describe('deconstruct', () => {
	const data = construct(Data, { done: '1', firstname: 'Ada', fullName: 'Ada Lovelace', note: 'hi', untouched: 'kept' })

	it('should convert and rename back', () => {
		expect(deconstruct(data)).toEqual({ isdone: '1', firstname: 'Ada', firstName: 'Ada', note: 'hi', untouched: 'kept' })
	})

	it('should omit a member with no outgoing mapping', () => {
		expect('lastName' in deconstruct(data)).toBe(false)
	})

	it('should omit the member\'s own key once it is renamed away', () => {
		expect('isDone' in deconstruct(data)).toBe(false)
	})

	it('should let an unconverted mapping copy what the converted one already wrote', () => {
		// Sending a value twice — once formatted under its own name, once copied elsewhere — is one
		// mapping onto two keys. The copy reads the object being built, so it takes the FORMATTED value:
		// declaration order decides, exactly as it does on the way in.
		class Twice {
			@converter({ out: { amount: { deconstruct: (value: number) => `${value},00` }, amountCopy: undefined } }) amount = 5
		}

		expect(deconstruct(new Twice)).toEqual({ amount: '5,00', amountCopy: '5,00' })
	})

	it('should not touch the instance', () => {
		deconstruct(data)

		expect(data.isDone).toBe(true)
		expect(data.lastName).toBe('Lovelace')
	})
})