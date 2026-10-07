import { Api, type FetchAction } from './Api.js'

/** The contract an authenticator fulfills to add credentials to the requests of `Api` and to react to its responses. */
export type ApiAuthenticator = {
	/** Stores the credentials an authentication produced, typically a token. */
	authenticate(data: string): void
	unauthenticate(): void
	isAuthenticated(): boolean
	/** Adds the credentials to `request` in place before it is sent; its `headers` is a `Headers` instance. */
	processRequest(request: RequestInit): RequestInit
	/** Inspects a response before `Api` handles it, resolving with it or with the response of a retry through `fetchAction`. */
	processResponse?(response: Response, fetchAction: FetchAction): Promise<Response>
}

/**
 * Registers an instance of the decorated class as the authenticator of `Api`.
 *
 * The class is instantiated without arguments, and a later registration replaces an earlier one.
 */
export const apiAuthenticator = () => {
	return (Constructor: Constructor<ApiAuthenticator>) => {
		Api.authenticator = new Constructor()
	}
}
