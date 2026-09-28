# `@a11d/api-dotnet`

An extension of @a11d/api for .NET back ends, throwing their problem-details responses as typed errors and reviving models.

[![npm](https://img.shields.io/npm/v/@a11d/api-dotnet?style=flat-square&color=0077c8)](https://www.npmjs.com/package/@a11d/api-dotnet)

## Installation

```sh
npm install @a11d/api-dotnet
```

## Usage

```ts
import { Api } from '@a11d/api'
import { DotnetHttpError, model } from '@a11d/api-dotnet'

@model('Customer')
export class Customer {
	name = ''
}

try {
	await Api.post('/customers', new Customer)
} catch (error) {
	if (error instanceof DotnetHttpError && error.status === 400) {
		alert(error.message)
	}
}
```

## API

| Name | Kind | Description |
| --- | --- | --- |
| `DotnetHttpError` | class | The error `Api` throws for an error response of a .NET back end, carrying its problem details. |
| `DotnetError` | type | The problem details a .NET back end sends in the body of an error response. |

## Links

- [Changelog](https://unpkg.com/@a11d/api-dotnet/CHANGELOG.md)
- [Source](https://github.com/a11delavar/lit-application/tree/main/packages/ApiDotnet)

## License

MIT © a11delavar