import { type Converter } from './Converter.js'
import { definitionsOf, extractDirections } from './ConverterDefinitions.js'
import { converter } from './decorator.js'

const upper: Converter<string, string> = { construct: value => value.toUpperCase() }

describe('extractDirections', () => {
	it('should map a lone option onto the member\'s own key, both ways', () => {
		const directions = extractDirections(upper, 'name')

		expect([...directions.in]).toEqual([['name', upper]])
		expect([...directions.out]).toEqual([['name', upper]])
	})

	it('should keep the two directions independent', () => {
		const directions = extractDirections({ in: { done: 'bit' }, out: { isdone: 'bit' } }, 'isDone')

		expect([...directions.in.keys()]).toEqual(['done'])
		expect([...directions.out.keys()]).toEqual(['isdone'])
	})

	it('should treat an undefined option as a rename without conversion', () => {
		const directions = extractDirections({ customercode: undefined }, 'code')

		expect([...directions.in]).toEqual([['customercode', undefined]])
	})

	it('should preserve the declared order of mapped keys', () => {
		const directions = extractDirections({ firstname: undefined, firstName: undefined, name: upper }, 'firstName')

		expect([...directions.in.keys()]).toEqual(['firstname', 'firstName', 'name'])
	})

	it('should reject options mixing directions with mapped keys', () => {
		expect(() => extractDirections({ in: 'bit', done: 'bit' } as never, 'isDone')).toThrowError(/mix/)
	})

	it('should reject a mapped key that is not a converter, a key or undefined', () => {
		expect(() => extractDirections({ done: 42 } as never, 'isDone')).toThrowError(/neither a converter/)
	})
})

describe('definitions', () => {
	class Base {
		@converter(upper) name!: string
	}

	class Derived extends Base {
		@converter(upper) note!: string
	}

	it('should collect a class\'s own members', () => {
		expect([...definitionsOf(Base).keys()]).toEqual(['name'])
	})

	it('should inherit without writing into the parent', () => {
		expect([...definitionsOf(Derived).keys()]).toEqual(['name', 'note'])
		expect([...definitionsOf(Base).keys()]).toEqual(['name'])
	})

	it('should be empty for an undecorated class', () => {
		expect(definitionsOf(class { }).size).toBe(0)
	})

	it('should reject two members deconstructing into the same key', () => {
		expect(() => {
			class Conflicting {
				@converter({ out: { name: undefined } }) first!: string
				@converter({ out: { name: undefined } }) second!: string
			}
			return Conflicting
		}).toThrowError(/deconstructs both/)
	})
})