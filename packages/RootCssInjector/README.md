# `@a11d/root-css-injector`

A utility for injecting Lit styles into the document head, once or for as long as a component is connected.

[![npm](https://img.shields.io/npm/v/@a11d/root-css-injector?style=flat-square&color=0077c8)](https://www.npmjs.com/package/@a11d/root-css-injector)

## Installation

```sh
npm install @a11d/root-css-injector
```

## Usage

```ts
import { Component, component, css } from '@a11d/lit'
import { RootCssInjector, RootCssInjectorController } from '@a11d/root-css-injector'

RootCssInjector.inject(css`
	:root {
		--app-accent-color: teal;
	}
`)

@component('app-shell')
export class Shell extends Component {
	protected readonly rootCss = new RootCssInjectorController(this, css`body { margin: 0; }`)
}
```

## API

| Name | Kind | Description |
| --- | --- | --- |
| `RootCssInjector` | class | Injects styles into the document head, where they apply to the whole document rather than to a single shadow root. |
| `RootCssInjectorController` | class | Injects styles into the document head while its host is connected and removes them once it disconnects. |

## Links

- [Changelog](https://unpkg.com/@a11d/root-css-injector/CHANGELOG.md)
- [Source](https://github.com/a11delavar/lit-application/tree/main/packages/RootCssInjector)

## License

MIT © a11delavar
