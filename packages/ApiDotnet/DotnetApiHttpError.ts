import { apiError, HttpError } from '@a11d/api'

/** The problem details a .NET back end sends in the body of an error response. */
export type DotnetError = {
	readonly title: string
	readonly status: number
	readonly errors?: Array<Record<string, Array<string>>>
	readonly traceId: string
	readonly type: string
}

/**
 * The error `Api` throws for an error response of a .NET back end, carrying its problem details.
 *
 * Importing the package registers it through `@apiError()`, together with `ModelValueConstructor`. Its `message` is the
 * problem's `title` followed by the first validation message of each invalid field, one per line.
 *
 * @example
 * ```ts
 * import { Api } from '@a11d/api'
 * import { DotnetHttpError, model } from '@a11d/api-dotnet'
 *
 * @model('Customer')
 * export class Customer {
 * 	name = ''
 * }
 *
 * try {
 * 	await Api.post('/customers', new Customer)
 * } catch (error) {
 * 	if (error instanceof DotnetHttpError && error.status === 400) {
 * 		alert(error.message)
 * 	}
 * }
 * ```
 */
@apiError()
export class DotnetHttpError extends HttpError {
	get status() { return this.error.status }
	get traceId() { return this.error.traceId }
	get type() { return this.error.type }

	private error!: DotnetError

	override async throw(): Promise<never> {
		const json = await this.response.json()
		this.error = json
		this.message = [
			this.error.title,
			!this.error.errors ? undefined : Object.values(this.error.errors)
				.map(error => error[0])
				.join('\n'),
		].filter(Boolean).join('\n')
		throw this
	}
}
