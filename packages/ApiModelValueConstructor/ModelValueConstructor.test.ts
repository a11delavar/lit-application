import { ModelValueConstructor, model } from './ModelValueConstructor.js'

@model('Data')
class Data {
	'@type' = 'Data'
	constructor(readonly text: string) { }

	get gettable() { return this.text }

	_settable = ''
	set settable(value: string) { this._settable = value }
}

const rawData = [
	{ '@type': 'Data', text: 'value1', gettable: 'value1-get', settable: 'value1-set' },
	{ text: 'value2' },
]

describe('ModelValueConstructor', () => {
	const valueConstructor = new ModelValueConstructor

	it('should signal constructable for matching types', () => {
		expect(valueConstructor.shallConstruct(rawData)).toBe(false)
		expect(valueConstructor.shallConstruct(rawData[0])).toBe(true)
		expect(valueConstructor.shallConstruct(rawData[1])).toBe(false)
	})

	it('should not construct not-matching types', () => {
		expect(valueConstructor.construct(rawData)).toBe(rawData)
		expect(valueConstructor.construct(rawData[1]!)).toBe(rawData[1]!)
	})

	const expected = new Data('value1')
	expected.settable = 'value1-set'

	it('should construct matching type', () => {
		expect(valueConstructor.construct(rawData[0]!)).not.toBe(rawData[0]!)
		expect(valueConstructor.construct(rawData[0]!)).toEqual(expected)
	})

	it('Does not set readonly properties', () => {
		expect((valueConstructor.construct(rawData[0]!) as any).gettable).toBe('value1')
	})
})