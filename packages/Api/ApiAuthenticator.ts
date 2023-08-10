import { Api, type FetchAction } from './Api.js'

export type ApiAuthenticator = {
	authenticate(data: string): void
	unauthenticate(): void
	isAuthenticated(): boolean
	processRequest(request: RequestInit): RequestInit
	processResponse?(response: Response, fetchAction: FetchAction): Promise<Response>
}

export const apiAuthenticator = () => {
	return (Constructor: Constructor<ApiAuthenticator>) => {
		Api.authenticator = new Constructor
	}
}