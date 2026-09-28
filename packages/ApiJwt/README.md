# `@a11d/api-jwt`

An extension of @a11d/api for JWT bearer authentication, keeping the tokens in local storage and refreshing them on a 401.

[![npm](https://img.shields.io/npm/v/@a11d/api-jwt?style=flat-square&color=0077c8)](https://www.npmjs.com/package/@a11d/api-jwt)

## Installation

```sh
npm install @a11d/api-jwt
```

## Usage

```ts
import { Api, apiAuthenticator } from '@a11d/api'
import { JwtApiAuthenticator } from '@a11d/api-jwt'

@apiAuthenticator()
export class Authenticator extends JwtApiAuthenticator {
	constructor() {
		super({ refresh: refreshToken => Api.post<string>('/token/refresh', { refreshToken }) })
	}
}

type Tokens = {
	readonly token: string
	readonly refreshToken: string
}

const tokens = await Api.post<Tokens>('/token', { username: 'user', password: 'secret' })
JwtApiAuthenticator.token = tokens.token
JwtApiAuthenticator.refreshToken = tokens.refreshToken
```

## API

| Name | Kind | Description |
| --- | --- | --- |
| `JwtApiAuthenticator` | class | Authenticates the requests of `Api` with a JWT bearer token kept in local storage, refreshing it on a `401` when configured to. |

## Links

- [Changelog](https://unpkg.com/@a11d/api-jwt/CHANGELOG.md)
- [Source](https://github.com/a11delavar/lit-application/tree/main/packages/ApiJwt)

## License

MIT © a11delavar