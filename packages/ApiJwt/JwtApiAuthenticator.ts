import { apiAuthenticator, ApiAuthenticator, FetchAction } from '@a11d/api'

type JwtApiAuthenticatorOptions = {
	readonly refresh?: (refreshToken: string) => Promise<string>
}

@apiAuthenticator()
export class JwtApiAuthenticator implements ApiAuthenticator {
	private static readonly tokenStorageKey = 'JwtApiAuthenticator.Token'
	private static readonly refreshTokenStorageKey = 'JwtApiAuthenticator.RefreshToken'

	static get token() { return localStorage.getItem(JwtApiAuthenticator.tokenStorageKey) ?? undefined }
	static set token(value) {
		if (value) {
			localStorage.setItem(JwtApiAuthenticator.tokenStorageKey, value)
		} else {
			localStorage.removeItem(JwtApiAuthenticator.tokenStorageKey)
		}
	}

	static get refreshToken() { return localStorage.getItem(JwtApiAuthenticator.refreshTokenStorageKey) ?? undefined }
	static set refreshToken(value) {
		if (value) {
			localStorage.setItem(JwtApiAuthenticator.refreshTokenStorageKey, value)
		} else {
			localStorage.removeItem(JwtApiAuthenticator.refreshTokenStorageKey)
		}
	}

	constructor(readonly options?: JwtApiAuthenticatorOptions) { }

	authenticate(token: string, refreshToken?: string) {
		JwtApiAuthenticator.token = token
		JwtApiAuthenticator.refreshToken = refreshToken
	}

	unauthenticate() {
		JwtApiAuthenticator.token = undefined
		JwtApiAuthenticator.refreshToken = undefined
	}

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