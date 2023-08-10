import type { ApiAuthenticator } from './ApiAuthenticator.js'
import type { ApiValueConstructor } from './ApiValueConstructor.js'
import type { HttpError } from './HttpError.js'

if (('structuredClone' in globalThis) === false) {
	import('@ungap/structured-clone').then(structuredClone => globalThis.structuredClone = structuredClone.default as any)
}

type HttpFetchMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'

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
		return this.fetch<T>('GET', route, null, options)
	}

	static post<T = void, TData = unknown>(route: string, data?: TData, options?: HttpFetchOptions) {
		return this.fetch<T>('POST', route, this.processDataForPostOrPut(data), options)
	}

	static put<T = void, TData = unknown>(route: string, data?: TData, options?: HttpFetchOptions) {
		return this.fetch<T>('PUT', route, this.processDataForPostOrPut(data), options)
	}

	static delete<T = void>(route: string, options?: HttpFetchOptions) {
		return this.fetch<T>('DELETE', route, null, options)
	}

	private static processDataForPostOrPut<TData>(data: TData) {
		if (data instanceof FormData) {
			return data
		}

		if (data instanceof File) {
			const form = new FormData
			form.set('file', data, data.name)
			return form
		}

		return JSON.stringify(this.deconstruct(data))
	}

	protected static get headers(): Record<string, string> {
		return {}
	}

	private static async fetch<T = void>(method: HttpFetchMethod, route: string, body: BodyInit | null = null, options?: HttpFetchOptions) {
		const request: RequestInit = {
			method: method,
			credentials: 'omit',
			headers: new Headers({
				Accept: 'application/json',
				...(body instanceof FormData
					? { encType: 'multipart/form-data' }
					: { 'Content-Type': 'application/json' }
				),
				...this.headers,
			}),
			referrer: 'no-referrer',
			body: body
		}

		this.authenticator?.processRequest(request)

		const fetchAction = () => fetch(this.url + route, request)
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

		const responseText = await response.text()
		return JSON.isJson(responseText) === false
			? responseText as unknown as T
			: this.construct<T>(JSON.parse(responseText))
	}

	private static construct<T>(data: any, isChild = false): T {
		data = isChild ? data : { ROOT: data }
		const response = !data || typeof data !== 'object' ? data : Object.assign(
			data,
			Object.fromEntries(
				Object.entries(data).map(([key, value]) => [
					key,
					this.construct([...this.valueConstructors].find(converter => converter.shallConstruct(value))?.construct(value) ?? value, true)
				])
			)
		)
		return isChild ? response as T : response.ROOT
	}

	private static deconstruct<T>(data: T, isChild = false): any {
		data = (isChild ? structuredClone(data) : { ROOT: structuredClone(data) }) as T
		const response = !data || typeof data !== 'object' ? data : Object.assign(
			data,
			Object.fromEntries(
				Object.entries(data).map(([key, value]) => [
					key,
					this.deconstruct([...this.valueConstructors].find(converter => converter.shallDeconstruct?.(value) ?? false)?.deconstruct?.(value) ?? value, true)
				])
			)
		) as any
		return isChild ? response as T : response.ROOT
	}
}