import { Api } from './Api.js'

/** The base class of the error `Api` throws for a response with an error status, once a subclass is registered through `@apiError()`. */
export abstract class HttpError extends Error {
	constructor(protected readonly response: Response, ...parameters: ConstructorParameters<typeof Error>) {
		super(...parameters)
	}

	/** Throws this error; `Api` awaits the call, so an override may read `response` before throwing. */
	throw(): never | PromiseLike<never> {
		throw this
	}
}

/** Registers the decorated `HttpError` subclass as the error `Api` throws for a response with an error status. */
export const apiError = () => {
	return (constructor: Constructor<HttpError>) => {
		Api.httpErrorConstructor = constructor
	}
}