import { Api, type ApiValueConstructor } from '@a11d/api'
import { converter, type Converter } from '@a11d/converter'
import { ModelValueConstructor, model } from './ModelValueConstructor.js'

@model('Data')
class Data {
	'@type' = 'Data'
	constructor(readonly text: string) { }

	get gettable() { return this.text }

	_settable = ''
	set settable(value: string) { this._settable = value }
}

@model('Account')
class Account {
	constructor(readonly username: string, readonly token: string) { }
}

class NotAModel {
	constructor(readonly text: string) { }
}

class Priority {
	static readonly Low = new Priority('low')
	static readonly High = new Priority('high')
	static readonly all = [Priority.Low, Priority.High]
	static parse(value: string) { return Priority.all.find(priority => priority.value === value) }
	private constructor(readonly value: string) { }
}

class PriorityValueConstructor implements ApiValueConstructor<Priority, string> {
	shallConstruct = (value: unknown) => typeof value === 'string' && value.startsWith('priority:')
	construct = (value: string) => Priority.parse(value.slice('priority:'.length))!

	shallDeconstruct = (value: unknown) => value instanceof Priority
	deconstruct = (value: Priority) => `priority:${value.value}`
}

Api.valueConstructors.add(new PriorityValueConstructor)

@model('Task')
class Task {
	private _priority = Priority.Low
	get priority() { return this._priority }
	set priority(value: Priority) { this._priority = value }
}

const priority: Converter<string, Priority> = {
	construct: value => Priority.parse(value)!,
	deconstruct: value => value.value,
}

// The same accessor pair as `Task`, except the wire spells the member without its backing underscore
// — the case a spread cannot serve, and what member definitions exist for.
@model('Ticket')
class Ticket {
	@converter({ priority }) private _priority = Priority.Low
	get priority() { return this._priority }
	set priority(value: Priority) { this._priority = value }
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

	describe('deconstruction', () => {
		it('should signal deconstructable for model instances only', () => {
			expect(valueConstructor.shallDeconstruct(new Data('value1'))).toBe(true)
			expect(valueConstructor.shallDeconstruct(new Account('someone', 'secret'))).toBe(true)
			expect(valueConstructor.shallDeconstruct(new NotAModel('value1'))).toBe(false)
			expect(valueConstructor.shallDeconstruct(new Date)).toBe(false)
			expect(valueConstructor.shallDeconstruct(undefined)).toBe(false)
			expect(valueConstructor.shallDeconstruct(null)).toBe(false)
			expect(valueConstructor.shallDeconstruct('Data')).toBe(false)
		})

		it('should not signal deconstructable for deconstructed models', () => {
			expect(valueConstructor.shallDeconstruct(rawData[0])).toBe(false)
			expect(valueConstructor.shallDeconstruct(valueConstructor.deconstruct(new Data('value1')))).toBe(false)
		})

		it('should deconstruct matching type', () => {
			expect(valueConstructor.deconstruct(new Data('value1'))).toEqual({
				'@type': 'Data',
				text: 'value1',
				_settable: '',
			})
		})

		it('Does not deconstruct readonly properties', () => {
			expect('gettable' in valueConstructor.deconstruct(new Data('value1'))).toBe(false)
		})

		it('should round-trip through construct', () => {
			const constructed = valueConstructor.construct(valueConstructor.deconstruct(new Account('someone', 'secret')))

			expect(constructed).toBeInstanceOf(Account)
			expect((constructed as Account).username).toBe('someone')
			expect((constructed as Account).token).toBe('secret')
		})
	})

	describe('through Api', () => {
		it('should round-trip a model through a request and a response', () => {
			const body = JSON.stringify(Api['handleRequest']({ account: new Account('someone', 'secret') }))
			expect(JSON.parse(body)).toEqual({ account: { '@type': 'Account', username: 'someone', token: 'secret' } })

			const revived = Api['handleResponse']<{ account: Account }>(body)
			expect(revived.account).toBeInstanceOf(Account)
			expect(revived.account.token).toBe('secret')
		})

		it('should deconstruct models in a collection', () => {
			expect(Api['handleRequest']([new Account('someone', 'secret')])).toEqual([{ '@type': 'Account', username: 'someone', token: 'secret' }])
		})

		it('should round-trip a field holding a value object through its own value constructor', () => {
			const task = new Task
			task.priority = Priority.High

			const body = JSON.stringify(Api['handleRequest'](task))
			expect(JSON.parse(body)).toEqual({ '@type': 'Task', _priority: 'priority:high' })

			const revived = Api['handleResponse']<Task>(body)
			expect(revived).toBeInstanceOf(Task)
			expect(revived.priority).toBe(Priority.High)
		})

		it('should round-trip a member through the key its definition maps it to', () => {
			const ticket = new Ticket
			ticket.priority = Priority.High

			const body = JSON.stringify(Api['handleRequest'](ticket))
			expect(JSON.parse(body)).toEqual({ '@type': 'Ticket', priority: 'high' })

			const revived = Api['handleResponse']<Ticket>(body)
			expect(revived).toBeInstanceOf(Ticket)
			expect(revived.priority).toBe(Priority.High)
		})
	})
})