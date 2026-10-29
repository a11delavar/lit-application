# `@a11d/local-storage`

A utility for keeping a typed value in local storage, with a default, JSON serialization and change events.

[![npm](https://img.shields.io/npm/v/@a11d/local-storage?style=flat-square&color=0077c8)](https://www.npmjs.com/package/@a11d/local-storage)

## Installation

```sh
npm install @a11d/local-storage
```

## Usage

### `LocalStorage`

```ts
import { LocalStorage } from '@a11d/local-storage'

const colorScheme = new LocalStorage<'light' | 'dark'>('App.ColorScheme', 'light')

colorScheme.changed.subscribe(value => document.documentElement.style.colorScheme = value)
colorScheme.value = 'dark'
```

### `LocalStorageController`

```ts
import { LocalStorageController } from '@a11d/local-storage'

class ProductList extends Component {
	readonly view = new LocalStorageController<'grid' | 'list'>(this, 'ProductList.View', 'grid')

	protected override get template() {
		return html`<button @click=${() => this.view.value = 'list'}>${this.view.value}</button>`
	}
}
```

## API

| Name | Kind | Description |
| --- | --- | --- |
| `LocalStorage` | class | Keeps one typed value in local storage under a name, falling back to a default and announcing each change. |
| `LocalStorageController` | class | Keeps one typed value in local storage like `LocalStorage` and updates its host whenever the value is set. |

## Links

- [Changelog](https://unpkg.com/@a11d/local-storage/CHANGELOG.md)
- [Source](https://github.com/a11delavar/lit-application/tree/main/packages/LocalStorage)

## License

MIT © a11delavar
