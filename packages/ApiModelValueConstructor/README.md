# `@a11d/api-model-value-constructor`

An extension of @a11d/api for reviving @type-tagged objects as model classes and back, built on @a11d/converter.

[![npm](https://img.shields.io/npm/v/@a11d/api-model-value-constructor?style=flat-square&color=0077c8)](https://www.npmjs.com/package/@a11d/api-model-value-constructor)

## Installation

```sh
npm install @a11d/api-model-value-constructor
```

## Usage

```ts
import { Api } from '@a11d/api'
import { model } from '@a11d/api-model-value-constructor'

@model('Customer')
export class Customer {
	name = ''
}

const customer = await Api.get<Customer>('/customers/1')
customer instanceof Customer // true, as the response carries '@type': 'Customer'
await Api.put('/customers/1', customer)
```

## API

| Name | Kind | Description |
| --- | --- | --- |
| `ModelValueConstructor` | class | Constructs response objects whose `@type` names a registered model as instances of it, and tags model instances in requests. |
| `model` | const | Registers the decorated class under a type name, so response objects with that name in `@type` become instances of it. |

## Links

- [Changelog](https://unpkg.com/@a11d/api-model-value-constructor/CHANGELOG.md)
- [Source](https://github.com/a11delavar/lit-application/tree/main/packages/ApiModelValueConstructor)

## License

MIT © a11delavar