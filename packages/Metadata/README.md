# `@a11d/metadata`

Tools for attaching metadata to classes and members with decorators, readable by key path, built on reflect-metadata.

[![npm](https://img.shields.io/npm/v/@a11d/metadata?style=flat-square&color=0077c8)](https://www.npmjs.com/package/@a11d/metadata)

## Installation

```sh
npm install @a11d/metadata
```

## Usage

```ts
import { createMetadataDecorator, type } from '@a11d/metadata'

const unit = createMetadataDecorator('unit')

class Dimensions {
	@unit('cm') width = 0
}

class Product {
	@unit('kg') weight = 0
	@type(Dimensions) dimensions = new Dimensions
}

unit.get(Product, 'weight') // 'kg'
unit.getByKeyPath(Product, 'dimensions.width') // 'cm'
```

## API

| Name | Kind | Description |
| --- | --- | --- |
| `createMetadataDecorator` | function | Creates a metadata decorator supporting both class and property metadata. |
| `type` | function | Records the runtime type of a property, which lets `getByKeyPath` of a metadata decorator walk through it. |
| `label` | const | Attaches a human-readable label to a class or one of its properties. |
| `description` | const | Attaches a human-readable description to a class or one of its properties. |

## Links

- [Changelog](https://unpkg.com/@a11d/metadata/CHANGELOG.md)
- [Source](https://github.com/a11delavar/lit-application/tree/main/packages/Metadata)

## License

MIT © a11delavar
