import { Api } from './Api.js'

export abstract class HttpError extends Error {
	constructor(protected readonly response: Response, ...parameters: ConstructorParameters<typeof Error>) {
		super(...parameters)
	}

	throw(): never | PromiseLike<never> {
		throw this
	}
}

export const apiError = () => {
	return (constructor: Constructor<HttpError>) => {
		Api.httpErrorConstructor = constructor
	}
}