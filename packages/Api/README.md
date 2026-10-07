# `@a11d/api`

Tools for building API SDKs on fetch, with pluggable authentication, error types and two-way value conversion.

[![npm](https://img.shields.io/npm/v/@a11d/api?style=flat-square&color=0077c8)](https://www.npmjs.com/package/@a11d/api)

## Installation

```sh
npm install @a11d/api
```

## Usage

```ts
import { Api, apiValueConstructor, type ApiValueConstructor } from '@a11d/api'

@apiValueConstructor()
export class DateValueConstructor implements ApiValueConstructor<Date, string> {
	shallConstruct(value: unknown) {
		return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)
	}

	construct(value: string) {
		return new Date(value)
	}

	shallDeconstruct(value: unknown) {
		return value instanceof Date
	}

	deconstruct(value: Date) {
		return value.toISOString()
	}
}

Api.url = 'https://example.com/api'

type Order = {
	readonly id: number
	readonly placedAt: Date
}

const order = await Api.get<Order>('/orders/1')
await Api.put(`/orders/${order.id}`, { ...order, placedAt: new Date })
```

## API

| Name | Kind | Description |
| --- | --- | --- |
| `HttpError` | class | The base class of the error `Api` throws for a response with an error status, once a subclass is registered through `@apiError()`. |
| `Api` | class | Sends JSON requests to the configured API and constructs typed values from the responses. |
| `apiError` | const | Registers the decorated `HttpError` subclass as the error `Api` throws for a response with an error status. |
| `apiAuthenticator` | const | Registers an instance of the decorated class as the authenticator of `Api`. |
| `apiValueConstructor` | const | Registers an instance of the decorated class as a value constructor of `Api`. |
| `ApiAuthenticator` | type | The contract an authenticator fulfills to add credentials to the requests of `Api` and to react to its responses. |
| `ApiValueConstructor` | type | The contract a value constructor fulfills to construct domain values from responses and to deconstruct them for requests. |
| `HttpFetchMethod` | type | An HTTP method `Api` sends a request with. |
| `FetchAction` | type | Sends the current request once more, handed to `ApiAuthenticator.processResponse` for retrying it. |

## Links

- [Changelog](https://unpkg.com/@a11d/api/CHANGELOG.md)
- [Source](https://github.com/a11delavar/lit-application/tree/main/packages/Api)

## License

MIT © a11delavar
