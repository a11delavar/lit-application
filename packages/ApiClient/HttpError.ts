import { Api } from './Api.js'

export class HttpError extends Error {
	constructor(protected readonly response: Response, ...parameters: ConstructorParameters<typeof Error>) {
		super(...parameters)
	}
}

export const apiError = () => {
	return (constructor: Constructor<HttpError>) => {
		Api.httpErrorConstructor = constructor
	}
}