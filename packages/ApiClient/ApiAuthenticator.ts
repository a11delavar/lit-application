import { Api } from './Api.js'

export type ApiAuthenticator = {
	authenticate(data: string): void
	unauthenticate(): void
	isAuthenticated(): boolean
	processRequest(request: RequestInit): RequestInit
}

export const apiAuthenticator = () => {
	return (Constructor: Constructor<ApiAuthenticator>) => {
		Api.authenticator = new Constructor
	}
}