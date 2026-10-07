# `@a11d/lit-application-authentication`

Tools for requiring sign-in on an application, its pages or dialogs through a sign-in dialog, built on @a11d/lit-application.

[![npm](https://img.shields.io/npm/v/@a11d/lit-application-authentication?style=flat-square&color=0077c8)](https://www.npmjs.com/package/@a11d/lit-application-authentication)

## Installation

```sh
npm install @a11d/lit-application-authentication
```

## Usage

```ts
import { bind, component, html } from '@a11d/lit'
import { Api } from '@a11d/api'
import { application, Application } from '@a11d/lit-application'
import { authenticator, DialogAuthenticator, requiresAuthentication } from '@a11d/lit-application-authentication'

type Account = {
	readonly name: string
}

@authenticator()
@component('app-dialog-authenticator')
export class AppDialogAuthenticator extends DialogAuthenticator<Account> {
	protected override get template() {
		return html`
			<lit-dialog heading='Sign in' primaryButtonText='Sign in' primaryOnEnter preventCancellationOnEscape>
				<input ${bind(this, 'username')}>
				<input type='password' ${bind(this, 'password')}>
			</lit-dialog>
		`
	}

	protected authenticateAccount() {
		return Api.post<Account>('/sign-in', { username: this.username, password: this.password })
	}

	protected unauthenticateAccount() {
		return Api.post('/sign-out')
	}

	protected getAuthenticatedAccount() {
		return Api.get<Account | undefined>('/account')
	}
}

@application()
@requiresAuthentication()
@component('app-application')
export class App extends Application { }
```

## API

| Name | Kind | Description |
| --- | --- | --- |
| `Authentication` | class | Authenticates the user through the registered authenticator wherever `@requiresAuthentication()` asks for it. |
| `DialogAuthenticator` | class | The base class of the sign-in dialog, which is skipped while an account is authenticated and can remember the credentials. |
| `authenticator` | const | Registers the decorated `DialogAuthenticator` as the dialog that authenticates the user, creating its one instance. |
| `requiresAuthentication` | const | Requires authentication before the decorated page or dialog connects, or, on an `Application`, before anything is routed. |
| `requiresNoAuthentication` | const | Exempts the decorated page or dialog from being authenticated when it connects; application-wide authentication still applies. |

## Links

- [Changelog](https://unpkg.com/@a11d/lit-application-authentication/CHANGELOG.md)
- [Source](https://github.com/a11delavar/lit-application/tree/main/packages/Authentication)

## License

MIT © a11delavar
