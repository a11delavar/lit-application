import { bind, component, html } from '@a11d/lit'
import { Api } from '@a11d/api'
import { JwtApiAuthenticator } from '@a11d/api-jwt'
import { Application } from '@a11d/lit-application'
import { authenticator, DialogAuthenticator } from '@a11d/lit-application-authentication'
import { Authorization } from '@a11d/lit-application-authorization'
import { label } from '@a11d/metadata'
import type { Account } from './api.js'

/** Signs in before the application routes, as it requires authentication, and grants the account's authorizations. */
@authenticator()
@component('demo-dialog-sign-in')
@label('Sign in')
export class DialogSignIn extends DialogAuthenticator<Account> {
	static account?: Account

	private static signedIn<T extends Account | undefined>(account: T) {
		DialogSignIn.account = account
		Authorization.revokeAll()
		Authorization.grant(...account?.authorizations ?? [])
		Application.instance?.requestUpdate()
		return account
	}

	protected override get template() {
		return html`
			<lit-dialog primaryOnEnter preventCancellationOnEscape>
				<span slot='cancellationAction'></span>
				<button slot='primaryAction' class='primary'>Sign in</button>
				<div class='form'>
					<p class='muted'>Any name will do with the password <code>demo</code>. Sign in as <code>admin</code> to also delete orders and read reports.</p>
					<label>
						Name
						<input autocomplete='username' ${bind(this, 'username', { event: 'input' })}>
					</label>
					<label>
						Password
						<input type='password' autocomplete='current-password' ${bind(this, 'password', { event: 'input' })}>
					</label>
				</div>
			</lit-dialog>
		`
	}

	protected async authenticateAccount() {
		const { token, account } = await Api.post<{ readonly token: string, readonly account: Account }>('/sign-in', { username: this.username, password: this.password })
		JwtApiAuthenticator.token = token
		return DialogSignIn.signedIn(account)
	}

	protected unauthenticateAccount() {
		JwtApiAuthenticator.token = undefined
		DialogSignIn.signedIn(undefined)
		return Promise.resolve()
	}

	protected async getAuthenticatedAccount() {
		return !JwtApiAuthenticator.token ? undefined : DialogSignIn.signedIn(await Api.get<Account | null>('/account') ?? undefined)
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'demo-dialog-sign-in': DialogSignIn
	}
}