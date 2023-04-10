import { state } from '@a11d/lit'
import { Application, DialogComponent, DialogConfirmationStrategy, HookSet } from '@a11d/lit-application'
import { LocalStorage } from '@a11d/local-storage'

export abstract class DialogAuthenticator<Account extends object> extends DialogComponent<void, Account> {
	static readonly afterAuthenticationHooks = new HookSet()

	static readonly shallRememberStorage = new LocalStorage('DialogAuthenticator.ShallRemember', false)
	private static readonly passwordStorage = new LocalStorage<string | undefined>('DialogAuthenticator.Password', undefined)
	private static readonly usernameStorage = new LocalStorage<string | undefined>('DialogAuthenticator.Username', undefined)

	@state() username = DialogAuthenticator.shallRememberStorage.value ? DialogAuthenticator.usernameStorage.value ?? '' : ''
	@state() password = DialogAuthenticator.shallRememberStorage.value ? DialogAuthenticator.passwordStorage.value ?? '' : ''
	@state() shallRememberPassword = DialogAuthenticator.shallRememberStorage.value

	private preventNextAutomaticAuthentication = false

	protected abstract authenticateAccount(): Promise<Account>
	protected abstract unauthenticateAccount(): Promise<void>
	protected abstract getAuthenticatedAccount(): Promise<Account | undefined>

	async authenticate() {
		try {
			const account = await this.authenticateAccount()
			const authenticated = await this.getAuthenticatedAccount()
			if (!authenticated) {
				throw new Error('Something went wrong.\nTry again.')
			}
			Application.instance?.requestUpdate()
			await DialogAuthenticator.afterAuthenticationHooks.execute()
			notificationHost.notifySuccess('Authenticated successfully')
			return account
		} catch (error: any) {
			throw new Error(error.message ?? 'Incorrect Credentials')
		}
	}

	async unauthenticate() {
		try {
			await this.unauthenticateAccount()
		} finally {
			notificationHost.notifySuccess('Unauthenticated successfully')
			this.preventNextAutomaticAuthentication = true
			this.confirm()
		}
	}

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
		} catch (error) {
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