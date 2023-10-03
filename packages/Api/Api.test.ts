import { Api } from './Api.js'
import type { ApiValueConstructor } from './ApiValueConstructor.js'
import './index.js'

class Data {
	constructor(readonly text: string, readonly date: Date) { }
}

const data = [
	new Data('value1', new Date('2020-01-01')),
	new Data('value2', new Date('2022-06-01')),
]

class DateValueConstructor implements ApiValueConstructor<Date, string> {
	shallConstruct = (text: unknown) => typeof text === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(text)
	construct = (text: string) => new Date(text)

	shallDeconstruct = (value: unknown) => value instanceof Date
	deconstruct = (value: Date) => value.toISOString().slice(0, 10)
}

Api.valueConstructors.add(new DateValueConstructor)

class DataClassValueConstructor implements ApiValueConstructor<Data, object> {
	shallConstruct = (data: unknown) => typeof data === 'object' && data !== null && '@type' in data && data['@type'] === 'Data'
	construct = (data: object) => Object.assign(new Data('', new Date), data)
}

Api.valueConstructors.add(new DataClassValueConstructor)

describe('Api', () => {
	describe('deconstruction', () => {
		it('should be done after recursive cloning', () => {
			const deconstructed = Api['handleRequest'](data)

			expect(deconstructed).not.toBe(data)
			expect(deconstructed[0].date).not.toBe(data[0]?.date)
			expect(deconstructed[1].date).not.toBe(data[1]?.date)
			expect(deconstructed).not.toEqual(data)
		})
	})

	describe('construction', () => {
		it('should work', () => {
			const response = `[
				{
					"@type": "Data",
					"text": "value1",
					"date": "2020-01-01"
				},
				{
					"@type": "Data",
					"text": "value2",
					"date": "2022-06-01"
				}
			]`
			const constructed = Api['handleResponse']<Array<Data>>(response)

			expect(constructed[0]).toBeInstanceOf(Data)
			expect(constructed[0]?.date).toBeInstanceOf(Date)
			expect(constructed[0]?.date).toEqual(data[0]?.date)
			expect(constructed[0]?.text).toBe('value1')

			expect(constructed[1]).toBeInstanceOf(Data)
			expect(constructed[1]?.date).toBeInstanceOf(Date)
			expect(constructed[1]?.date).toEqual(data[1]?.date)
			expect(constructed[1]?.text).toBe('value2')
		})
	})
})