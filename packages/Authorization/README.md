# `@a11d/lit-application-authorization`

Tools for guarding pages and dialogs by the authorizations granted to the user, built on @a11d/lit-application.

[![npm](https://img.shields.io/npm/v/@a11d/lit-application-authorization?style=flat-square&color=0077c8)](https://www.npmjs.com/package/@a11d/lit-application-authorization)

## Installation

```sh
npm install @a11d/lit-application-authorization
```

## Usage

```ts
import { component, html } from '@a11d/lit'
import { PageComponent, route } from '@a11d/lit-application'
import { Authorization, requiresAuthorization } from '@a11d/lit-application-authorization'

@component('app-page-invoices')
@route('/invoices')
@requiresAuthorization(['invoices.read'])
export class PageInvoices extends PageComponent {
	protected override get template() {
		return html`<lit-page heading='Invoices'></lit-page>`
	}
}

Authorization.grant('invoices.read')
```

## API

| Name | Kind | Description |
| --- | --- | --- |
| `Authorization` | class | Holds the authorizations granted to the user, kept in local storage, and tells whether a page or dialog is authorized. |
| `requiresAuthorization` | const | Requires the user to be granted every given authorization before the decorated page or dialog opens. |

## Links

- [Changelog](https://unpkg.com/@a11d/lit-application-authorization/CHANGELOG.md)
- [Source](https://github.com/a11delavar/lit-application/tree/main/packages/Authorization)

## License

MIT © a11delavar
