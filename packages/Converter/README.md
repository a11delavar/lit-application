# `@a11d/converter`

Tools for converting between back-end payloads and domain classes, declared per member with a @converter decorator.

[![npm](https://img.shields.io/npm/v/@a11d/converter?style=flat-square&color=0077c8)](https://www.npmjs.com/package/@a11d/converter)

## Installation

```sh
npm install @a11d/converter
```

## Usage

```ts
import { construct, converter, deconstruct, type Converter } from '@a11d/converter'

@converter('bit')
class BitConverter implements Converter<'0' | '1', boolean> {
	construct(value: '0' | '1') {
		return value === '1'
	}

	deconstruct(value: boolean) {
		return value ? '1' : '0'
	}
}

declare global {
	interface ConvertersByKeys {
		'bit': BitConverter
	}
}

class Task {
	@converter({ done: 'bit' }) isDone = false
	@converter({ construct: (value: string) => value.trim() }) title = ''
}

const task = construct(Task, { done: '1', title: ' Write the docs ' })
deconstruct(task) // { title: 'Write the docs', done: '1' }
```

## API

| Name | Kind | Description |
| --- | --- | --- |
| `CompositeConverter` | class | Tries each converter in turn and takes the first value that is neither null nor undefined. |
| `definitionsOf` | function | Every definition a class carries, its own and its ancestors'. |
| `extractDirections` | function | Resolves the converter options of a member into the keys and converters it reads from and writes to. |
| `define` | function | Records the converter options of a member on its class, rejecting a second member that deconstructs into the same key. |
| `construct` | function | Builds an instance from an incoming representation, running each member's `in` converters. |
| `deconstruct` | function | Reduces an instance to its outgoing representation, running each member's `out` converters. |
| `converters` | const | The converters registered by key, filled by `@converter` on a class and looked up for the keys a member names. |
| `converter` | const | Registers the decorated converter class under a key, or applies a converter to the decorated member. |
| `Converter` | interface | A bidirectional conversion between how a value arrives and how the domain holds it. |
| `ConverterKey` | type | The keys consumers register through `ConvertersByKeys`. |
| `ConverterKeys` | type | A registered key, or a fallback chain of them — the first converter yielding a value wins. |
| `ConverterOption` | type | A converter itself, a registered key, or nothing — the last one maps a key across without converting. |
| `ConverterDefinition` | type | One direction: a single option for the member's own key, or a map of the keys it maps against. |
| `ConverterOptions` | type | What `@converter` takes on a member: one definition for both directions, or separate `in` and `out` definitions. |
| `ConverterDirections` | type | Which keys a member reads from and writes to, in declaration order. |

## Links

- [Changelog](https://unpkg.com/@a11d/converter/CHANGELOG.md)
- [Source](https://github.com/a11delavar/lit-application/tree/main/packages/Converter)

## License

MIT © a11delavar