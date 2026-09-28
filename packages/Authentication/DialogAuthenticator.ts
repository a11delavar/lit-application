import { state } from '@a11d/lit'
import { Application, DialogComponent, DialogConfirmationStrategy, HookSet, NotificationComponent } from '@a11d/lit-application'
import { LocalStorage } from '@a11d/local-storage'

/**
 * The base class of the sign-in dialog, which is skipped while an account is authenticated and can remember the credentials.
 *
 * Subclasses render the fields for `username`, `password` and `shallRememberPassword`, and implement `authenticateAccount`,
 * `unauthenticateAccount` and `getAuthenticatedAccount`.
 *
 * @example
 * ```ts
 * import { bind, component, html } from '@a11d/lit'
 * import { Api } from '@a11d/api'
 * import { application, Application } from '@a11d/lit-application'
 * import { authenticator, DialogAuthenticator, requiresAuthentication } from '@a11d/lit-application-authentication'
 *
 * type Account = {
 * 	readonly name: string
 * }
 *
 * @authenticator()
 * @component('app-dialog-authenticator')
 * export class AppDialogAuthenticator extends DialogAuthenticator<Account> {
 * 	protected override get template() {
 * 		return html`
 * 			<lit-dialog heading='Sign in' primaryButtonText='Sign in' primaryOnEnter preventCancellationOnEscape>
 * 				<input ${bind(this, 'username')}>
 * 				<input type='password' ${bind(this, 'password')}>
 * 			</lit-dialog>
 * 		`
 * 	}
 *
 * 	protected authenticateAccount() {
 * 		return Api.post<Account>('/sign-in', { username: this.username, password: this.password })
 * 	}
 *
 * 	protected unauthenticateAccount() {
 * 		return Api.post('/sign-out')
 * 	}
 *
 * 	protected getAuthenticatedAccount() {
 * 		return Api.get<Account | undefined>('/account')
 * 	}
 * }
 *
 * @application()
 * @requiresAuthentication()
 * @component('app-application')
 * export class App extends Application { }
 * ```
 */
export abstract class DialogAuthenticator<Account extends object> extends DialogComponent<void, Account> {
	/** Hooks run once an account is authenticated, whether just now or already before, for example to grant its authorizations. */
	static readonly afterAuthenticationHooks = new HookSet()

	/** Whether the user chose to be remembered, in which case the username and password are kept in local storage as plain text. */
	static readonly shallRememberStorage = new LocalStorage('DialogAuthenticator.ShallRemember', false)
	private static readonly passwordStorage = new LocalStorage<string | undefined>('DialogAuthenticator.Password', undefined)
	private static readonly usernameStorage = new LocalStorage<string | undefined>('DialogAuthenticator.Username', undefined)

	@state() username = DialogAuthenticator.shallRememberStorage.value ? DialogAuthenticator.usernameStorage.value ?? '' : ''
	@state() password = DialogAuthenticator.shallRememberStorage.value ? DialogAuthenticator.passwordStorage.value ?? '' : ''
	@state() shallRememberPassword = DialogAuthenticator.shallRememberStorage.value

	private preventNextAutomaticAuthentication = false

	/** Signs in with `username` and `password`, resolving with the account. */
	protected abstract authenticateAccount(): Promise<Account>
	/** Signs the authenticated account out. */
	protected abstract unauthenticateAccount(): Promise<void>
	/** Resolves with the authenticated account, or with `undefined` when there is none. */
	protected abstract getAuthenticatedAccount(): Promise<Account | undefined>

	/** Signs in, verifies the account through `getAuthenticatedAccount`, runs `afterAuthenticationHooks` and notifies about the success. */
	async authenticate() {
		try {
			const account = await this.authenticateAccount()
			const authenticated = await this.getAuthenticatedAccount()
			if (!authenticated) {
				throw new Error('Something went wrong.\nTry again.')
			}
			Application.instance?.requestUpdate()
			await DialogAuthenticator.afterAuthenticationHooks.execute()
			NotificationComponent.notifySuccess('Authenticated successfully')
			return account
		} catch (error: any) {
			throw new Error(error.message ?? 'Incorrect Credentials')
		}
	}

	/** Signs out, notifies about it and shows the dialog again. */
	async unauthenticate() {
		try {
			await this.unauthenticateAccount()
		} finally {
			NotificationComponent.notifySuccess('Unauthenticated successfully')
			this.preventNextAutomaticAuthentication = true
			this.confirm()
		}
	}

	/** Resolves with the authenticated account, signing in with remembered credentials or showing the dialog only when needed. */
	override async confirm(strategy = DialogConfirmationStrategy.Dialog) {
		if (this.preventNextAutomaticAuthentication === true) {
			this.preventNextAutomaticAuthentication = false
			return super.confirm(strategy)
		}

		const authenticated = await this.getAuthenticatedAccount()

		if (authenticated) {
			await DialogAuthenticator.afterAuthenticationHooks.execute()
			return authenticated
		}

		const shouldHaveRemembered = DialogAuthenticator.shallRememberStorage.value

		if (!shouldHaveRemembered) {
			return super.confirm(strategy)
		}

		try {
			return this.authenticate()
		} catch {
			return super.confirm(strategy)
		}
	}

	protected override createRenderRoot() {
		return this
	}

	protected override primaryAction() {
		DialogAuthenticator.shallRememberStorage.value = this.shallRememberPassword
		if (DialogAuthenticator.shallRememberStorage.value) {
			DialogAuthenticator.usernameStorage.value = this.username
			DialogAuthenticator.passwordStorage.value = this.password
		}
		return this.authenticate()
	}
}