import { HttpErrorCode } from './HttpErrorCode.js'
import { HttpError } from '@a11d/api'

export type DotnetError = {
	readonly title: string
	readonly status: HttpErrorCode
	readonly errors?: Array<Record<string, Array<string>>>
	readonly traceId: string
	readonly type: string
}

export class DotnetHttpError extends HttpError {
	get status() { return this.error.status }
	get traceId() { return this.error.traceId }
	get type() { return this.error.type }

	private error!: DotnetError

	constructor(protected override readonly response: Response) {
		super(response)
		this.response.json().then(json => {
			this.error = json
			this.message = [this.error.title,
				!this.error.errors ? undefined : Object.values(this.error.errors)
					.map(error => error[0])
					.join('\n')
			].filter(Boolean).join('\n')
		})
	}
}