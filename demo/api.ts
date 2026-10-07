import { apiError, HttpError } from '@a11d/api'
import '@a11d/api-jwt'
import { model } from '@a11d/api-model-value-constructor'
import { converter, type Converter } from '@a11d/converter'
import { label } from '@a11d/metadata'

/** The error `Api` throws for an error response of the back end, carrying the message it sends. */
@apiError()
export class DemoHttpError extends HttpError {
	override async throw(): Promise<never> {
		this.message = (await this.response.json() as { readonly message: string }).message
		throw this
	}
}

const cents: Converter<number, number> = {
	construct: value => value / 100,
	deconstruct: value => Math.round(value * 100),
}

const date: Converter<string, Date> = {
	construct: value => new Date(value),
	deconstruct: value => value.toISOString(),
}

export enum OrderStatus {
	Open = 'open',
	Shipped = 'shipped',
	Cancelled = 'cancelled',
}

/** An order as the domain holds it: the back end sends its total in cents as `totalCents` and its date as text. */
@model('Order')
export class Order {
	@label('Number') id = 0
	@label('Customer') customer = ''
	@label('Total') @converter({ totalCents: cents }) total = 0
	@label('Status') status = OrderStatus.Open
	@label('Placed') @converter(date) placedAt = new Date()
}

@model('Account')
export class Account {
	name = ''
	authorizations = new Array<string>()
}
