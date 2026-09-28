# `@a11d/non-inertable-component`

A Lit base class for components that cannot be made inert, removing any inert attribute as soon as it is set.

[![npm](https://img.shields.io/npm/v/@a11d/non-inertable-component?style=flat-square&color=0077c8)](https://www.npmjs.com/package/@a11d/non-inertable-component)

## Installation

```sh
npm install @a11d/non-inertable-component
```

## Usage

```ts
import { component, html } from '@a11d/lit'
import { NonInertableComponent } from '@a11d/non-inertable-component'

@component('app-toast')
export class Toast extends NonInertableComponent {
	protected override get template() {
		return html`<slot></slot>`
	}
}
```

## API

| Name | Kind | Description |
| --- | --- | --- |
| `NonInertableComponent` | class | Removes any `inert` attribute set on the component, so it stays interactive while the elements around it are made inert. |

## Links

- [Changelog](https://unpkg.com/@a11d/non-inertable-component/CHANGELOG.md)
- [Source](https://github.com/a11delavar/lit-application/tree/main/packages/NonInertableComponent)

## License

MIT © a11delavar