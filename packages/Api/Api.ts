import type { ApiAuthenticator } from './ApiAuthenticator.js'
import type { ApiValueConstructor } from './ApiValueConstructor.js'
import type { HttpError } from './HttpError.js'

export type HttpFetchMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'

type HttpFetchOptions = {
	readonly noHttpErrorOnErrorStatusCode?: boolean
}

export type FetchAction = () => Promise<Response>

export class Api {
	static url = '/api'
	static readonly valueConstructors = new Set<ApiValueConstructor<unknown, unknown>>()
	static authenticator?: ApiAuthenticator
	static httpErrorConstructor?: Constructor<HttpError>

	static get<T = void>(route: string, options?: HttpFetchOptions) {
		return this.fetch<T>('GET', route, undefined, options)
	}

	static post<T = void, TData = unknown>(route: string, data?: TData, options?: HttpFetchOptions) {
		return this.fetch<T>('POST', route, this.processBody(data), options)
	}

	static put<T = void, TData = unknown>(route: string, data?: TData, options?: HttpFetchOptions) {
		return this.fetch<T>('PUT', route, this.processBody(data), options)
	}

	static patch<T = void, TData = unknown>(route: string, data?: TData, options?: HttpFetchOptions) {
		return this.fetch<T>('PATCH', route, this.processBody(data), options)
	}

	static delete<T = void>(route: string, options?: HttpFetchOptions) {
		return this.fetch<T>('DELETE', route, undefined, options)
	}

	private static processBody<TData>(data: TData) {
		if (data instanceof FormData) {
			return data
		}

		if (data instanceof File) {
			const form = new FormData
			form.set('file', data, data.name)
			return form
		}

		return JSON.stringify(this.handleRequest(data))
	}

	private static handleRequest<T>(data: T, handled = new Map<object, any>()): any {
		const deconstructed = [...this.valueConstructors].find(converter => converter.shallDeconstruct?.(data) ?? false)?.deconstruct?.(data) ?? data
		if (deconstructed === null || typeof deconstructed !== 'object') {
			return deconstructed
		}
		if (handled.has(deconstructed)) {
			return handled.get(deconstructed)
		}
		const clone = structuredClone(deconstructed)
		handled.set(deconstructed, clone)
		return Object.assign(
			clone,
			Object.fromEntries(
				Object.entries(deconstructed).map(([key, value]) => [key, this.handleRequest(value, handled)])
			)
		)
	}

	protected static getHeaders(method: HttpFetchMethod, route: string, body?: BodyInit): Record<string, string> {
		method
		route
		body
		return {}
	}

	private static async fetch<T = void>(method: HttpFetchMethod, route: string, body?: BodyInit, options?: HttpFetchOptions) {
		const fetchAction = () => {
			const request: RequestInit = {
				method,
				credentials: 'omit',
				headers: new Headers({
					Accept: 'application/json',
					...(body instanceof FormData
						? { encType: 'multipart/form-data' }
						: { 'Content-Type': 'application/json' }
					),
					...this.getHeaders(method, route, body),
				}),
				referrer: 'no-referrer',
				body,
			}

			this.authenticator?.processRequest(request)

			return fetch(this.url + route, request)
		}

		let response = await fetchAction()
		if (this.authenticator?.processResponse) {
			response = await this.authenticator.processResponse(response, fetchAction)
		}

		if (response.status >= 400 && options?.noHttpErrorOnErrorStatusCode !== true) {
			if (this.httpErrorConstructor) {
				await new (this.httpErrorConstructor)(response).throw()
			} else {
				throw new Error(await response.json())
			}
		}

		return this.handleResponse<T>(await response.text())
	}

	private static handleResponse<T>(responseText: string): T {
		const [isJson, json] = JSON.tryParse(responseText,
			(_, value) => [...this.valueConstructors].find(converter => converter.shallConstruct(value))?.construct(value) ?? value
		)
		return isJson ? json : responseText as T
	}
}