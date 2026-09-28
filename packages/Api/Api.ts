import type { ApiAuthenticator } from './ApiAuthenticator.js'
import type { ApiValueConstructor } from './ApiValueConstructor.js'
import type { HttpError } from './HttpError.js'

/** An HTTP method `Api` sends a request with. */
export type HttpFetchMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'

type HttpFetchOptions = {
	/** Resolves with the response body instead of throwing when the response has an error status. */
	readonly noHttpErrorOnErrorStatusCode?: boolean
}

/** Sends the current request once more, handed to `ApiAuthenticator.processResponse` for retrying it. */
export type FetchAction = () => Promise<Response>

/**
 * Sends JSON requests to the configured API and constructs typed values from the responses.
 *
 * @example
 * ```ts
 * import { Api, apiValueConstructor, type ApiValueConstructor } from '@a11d/api'
 *
 * @apiValueConstructor()
 * export class DateValueConstructor implements ApiValueConstructor<Date, string> {
 * 	shallConstruct(value: unknown) {
 * 		return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)
 * 	}
 *
 * 	construct(value: string) {
 * 		return new Date(value)
 * 	}
 *
 * 	shallDeconstruct(value: unknown) {
 * 		return value instanceof Date
 * 	}
 *
 * 	deconstruct(value: Date) {
 * 		return value.toISOString()
 * 	}
 * }
 *
 * Api.url = 'https://example.com/api'
 *
 * type Order = {
 * 	readonly id: number
 * 	readonly placedAt: Date
 * }
 *
 * const order = await Api.get<Order>('/orders/1')
 * await Api.put(`/orders/${order.id}`, { ...order, placedAt: new Date })
 * ```
 */
export class Api {
	/** The base URL every route is appended to, `/api` by default. */
	static url = '/api'
	/** The value constructors that deconstruct request bodies and construct response values, filled by `@apiValueConstructor()`. */
	static readonly valueConstructors = new Set<ApiValueConstructor<unknown, unknown>>()
	/** The authenticator that processes every request and response, set by `@apiAuthenticator()`. */
	static authenticator?: ApiAuthenticator
	/** The error thrown for a response with an error status, set by `@apiError()`; without one, a plain `Error` is thrown. */
	static httpErrorConstructor?: Constructor<HttpError>

	/** Sends a `GET` request; like every method, it resolves with the response body parsed as JSON where possible and its values constructed. */
	static get<T = void>(route: string, options?: HttpFetchOptions) {
		return this.fetch<T>('GET', route, undefined, options)
	}

	/** Sends a `POST` request with `data` as JSON with its values deconstructed, or as form data when it is a `FormData` or a `File`. */
	static post<T = void, TData = unknown>(route: string, data?: TData, options?: HttpFetchOptions) {
		return this.fetch<T>('POST', route, this.processBody(data), options)
	}

	/** Sends a `PUT` request with `data` encoded as `post` encodes it. */
	static put<T = void, TData = unknown>(route: string, data?: TData, options?: HttpFetchOptions) {
		return this.fetch<T>('PUT', route, this.processBody(data), options)
	}

	/** Sends a `PATCH` request with `data` encoded as `post` encodes it. */
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

	/** Returns extra headers for a request, for a subclass to override. */
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