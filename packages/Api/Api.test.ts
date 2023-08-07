import { Api } from './Api.js'

class Data {
	constructor(readonly text: string, readonly date: Date) { }
}

const data = [
	new Data('value1', new Date),
	new Data('value2', new Date),
]

describe('Api', () => {
	describe('deconstruction', () => {
		it('should be done after recursive cloning', () => {
			const deconstructed = Api['deconstruct'](data)

			expect(deconstructed).not.toBe(data)
			expect(deconstructed[0].date).not.toBe(data[0]?.date)
			expect(deconstructed[1].date).not.toBe(data[1]?.date)
			expect(deconstructed).not.toEqual(data)
		})
	})
})