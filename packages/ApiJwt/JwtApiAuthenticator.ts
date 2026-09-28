import { apiAuthenticator, type ApiAuthenticator, type FetchAction } from '@a11d/api'

type JwtApiAuthenticatorOptions = {
	/** Exchanges the refresh token for a new access token, after which a request that failed with `401` is sent again. */
	readonly refresh?: (refreshToken: string) => Promise<string>
}

/**
 * Authenticates the requests of `Api` with a JWT bearer token kept in local storage, refreshing it on a `401` when configured to.
 *
 * Importing the package registers an instance without options; to refresh tokens, register a subclass that passes `refresh`.
 *
 * @example
 * ```ts
 * import { Api, apiAuthenticator } from '@a11d/api'
 * import { JwtApiAuthenticator } from '@a11d/api-jwt'
 *
 * @apiAuthenticator()
 * export class Authenticator extends JwtApiAuthenticator {
 * 	constructor() {
 * 		super({ refresh: refreshToken => Api.post<string>('/token/refresh', { refreshToken }) })
 * 	}
 * }
 *
 * type Tokens = {
 * 	readonly token: string
 * 	readonly refreshToken: string
 * }
 *
 * const tokens = await Api.post<Tokens>('/token', { username: 'user', password: 'secret' })
 * JwtApiAuthenticator.token = tokens.token
 * JwtApiAuthenticator.refreshToken = tokens.refreshToken
 * ```
 */
@apiAuthenticator()
export class JwtApiAuthenticator implements ApiAuthenticator {
	private static readonly tokenStorageKey = 'JwtApiAuthenticator.Token'
	private static readonly refreshTokenStorageKey = 'JwtApiAuthenticator.RefreshToken'

	/** The access token, kept in local storage. */
	static get token() { return localStorage.getItem(JwtApiAuthenticator.tokenStorageKey) ?? undefined }
	static set token(value) {
		if (value) {
			localStorage.setItem(JwtApiAuthenticator.tokenStorageKey, value)
		} else {
			localStorage.removeItem(JwtApiAuthenticator.tokenStorageKey)
		}
	}

	/** The refresh token, kept in local storage. */
	static get refreshToken() { return localStorage.getItem(JwtApiAuthenticator.refreshTokenStorageKey) ?? undefined }
	static set refreshToken(value) {
		if (value) {
			localStorage.setItem(JwtApiAuthenticator.refreshTokenStorageKey, value)
		} else {
			localStorage.removeItem(JwtApiAuthenticator.refreshTokenStorageKey)
		}
	}

	constructor(readonly options?: JwtApiAuthenticatorOptions) { }

	/** Stores the access token and, when given, the refresh token. */
	authenticate(token: string, refreshToken?: string) {
		JwtApiAuthenticator.token = token
		JwtApiAuthenticator.refreshToken = refreshToken
	}

	unauthenticate() {
		JwtApiAuthenticator.token = undefined
		JwtApiAuthenticator.refreshToken = undefined
	}

	/** Tells whether a token is stored, and a refresh token as well when `refresh` is configured. */
	isAuthenticated() {
		return !!JwtApiAuthenticator.token
			&& (!this.options?.refresh || !!JwtApiAuthenticator.refreshToken)
	}

	processRequest(request: RequestInit): RequestInit {
		const token = JwtApiAuthenticator.token
		if (token) {
			const headers = request.headers as Headers
			headers.set('Authorization', `Bearer ${token}`)
		}
		return request
	}

	/** Refreshes the token and sends the request again when it failed with `401` and `refresh` is configured. */
	// TODO: Maximum tries: 3
	async processResponse(response: Response, fetchAction: FetchAction) {
		if (this.options?.refresh && response.status === 401 && JwtApiAuthenticator.refreshToken) {
			const refreshedToken = await this.options.refresh(JwtApiAuthenticator.refreshToken)
			if (refreshedToken) {
				JwtApiAuthenticator.token = refreshedToken
				return fetchAction()
			}
		}
		return response
	}
}