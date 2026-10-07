# `@a11d/lit-application-native`

Web components for the pages, dialogs and notifications of @a11d/lit-application, using <dialog> and system notifications.

[![npm](https://img.shields.io/npm/v/@a11d/lit-application-native?style=flat-square&color=0077c8)](https://www.npmjs.com/package/@a11d/lit-application-native)

## Installation

```sh
npm install @a11d/lit-application-native
```

## Usage

```ts
import '@a11d/lit-application-native'
import { component, html } from '@a11d/lit'
import { DialogComponent, PageComponent, route } from '@a11d/lit-application'

@component('app-dialog-greeting')
export class DialogGreeting extends DialogComponent {
	protected override get template() {
		return html`<lit-dialog heading='Greeting' primaryButtonText='OK'>Hello</lit-dialog>`
	}

	protected override primaryAction() { }
}

@component('app-page-home')
@route('/')
export class PageHome extends PageComponent {
	protected override get template() {
		return html`
			<lit-page heading='Home'>
				<button @click=${() => new DialogGreeting().confirm()}>Greet</button>
			</lit-page>
		`
	}
}
```

## API

| Name | Kind | Description |
| --- | --- | --- |
| `Page` | class | The `lit-page` element a `PageComponent` renders its content in, reporting its `heading` to the application. |
| `Dialog` | class | The `lit-dialog` element a `DialogComponent` renders its content in, a modal `<dialog>` with a heading and action buttons. |
| `Notification` | class | Shows notifications as system notifications, falling back to `alert` where they are unsupported or not permitted. |

## Links

- [Changelog](https://unpkg.com/@a11d/lit-application-native/CHANGELOG.md)
- [Source](https://github.com/a11delavar/lit-application/tree/main/packages/Native)

## License

MIT © a11delavar
