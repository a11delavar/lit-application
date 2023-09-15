import { apiError, HttpError } from '@a11d/api'

export type DotnetError = {
	readonly title: string
	readonly status: number
	readonly errors?: Array<Record<string, Array<string>>>
	readonly traceId: string
	readonly type: string
}

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
				.join('\n')
		].filter(Boolean).join('\n')
		throw this
	}
}