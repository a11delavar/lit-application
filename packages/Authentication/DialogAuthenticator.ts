import { state } from '@a11d/lit'
import { Application, PageComponent, DialogComponent, LocalStorageEntry } from '@a11d/lit-application'

export abstract class DialogAuthenticator<User extends object> extends DialogComponent {
	static readonly shallRememberStorage = new LocalStorageEntry('DialogAuthenticator.ShallRemember', false)
	static readonly authenticatedUserStorage = new LocalStorageEntry<object | undefined>('DialogAuthenticator.User', undefined)
	private static readonly passwordStorage = new LocalStorageEntry<string | undefined>('DialogAuthenticator.Password', undefined)
	private static readonly usernameStorage = new LocalStorageEntry<string | undefined>('DialogAuthenticator.Username', undefined)

	@state() username = DialogAuthenticator.shallRememberStorage.value ? DialogAuthenticator.usernameStorage.value ?? '' : ''
	@state() password = DialogAuthenticator.shallRememberStorage.value ? DialogAuthenticator.passwordStorage.value ?? '' : ''
	@state() shallRememberPassword = DialogAuthenticator.shallRememberStorage.value

	private preventNextAutomaticAuthentication = false

	protected abstract requestAuthentication(): Promise<User>
	protected abstract requestUnauthentication(): Promise<void>
	protected abstract isAuthenticatedServerSide(): Promise<boolean>
	protected abstract requestPasswordReset(): Promise<void>

	async isAuthenticated() {
		const isAuthenticatedServerSide = await this.isAuthenticatedServerSide()
		const isAuthenticatedClientSide = DialogAuthenticator.authenticatedUserStorage.value !== undefined
		return isAuthenticatedServerSide && isAuthenticatedClientSide
	}

	async authenticate() {
		try {
			const user = await this.requestAuthentication()
			DialogAuthenticator.authenticatedUserStorage.value = user
			if (await this.isAuthenticated() === false) {
				throw new Error('Something went wrong.\nTry again.')
			}
			notificationHost.notifySuccess('Authenticated successfully')
		} catch (error: any) {
			throw new Error(error.message ?? 'Incorrect Credentials')
		}
	}

	async unauthenticate() {
		try {
			await this.requestUnauthentication()
		} finally {
			notificationHost.notifySuccess('Unauthenticated successfully')
			DialogAuthenticator.authenticatedUserStorage.value = undefined
			this.preventNextAutomaticAuthentication = true
			this.confirm()
		}
	}

	async resetPassword() {
		try {
			await this.requestPasswordReset()
			notificationHost.notifyInfo('Password reset instructions have been sent to your email address')
		} catch (error: any) {
			notificationHost.notifyError(error.message ?? 'Password could not be reset')
			throw error
		}
	}

	override async confirm(...args: Parameters<DialogComponent['confirm']>) {
		const defaultToSuper = async () => {
			await super.confirm(...args)
			this.requestApplicationUpdate()
		}

		if (this.preventNextAutomaticAuthentication === true) {
			this.preventNextAutomaticAuthentication = false
			return defaultToSuper()
		}

		const isAuthenticated = await this.isAuthenticated()

		if (isAuthenticated) {
			return
		}

		const shouldHaveRemembered = DialogAuthenticator.shallRememberStorage.value

		if (!shouldHaveRemembered) {
			return defaultToSuper()
		}

		try {
			await this.authenticate()
			return this.requestApplicationUpdate()
		} catch (error) {
			return defaultToSuper()
		}
	}

	private requestApplicationUpdate() {
		Application.instance?.requestUpdate()
		PageComponent.getCurrentPage().then(p => p?.requestUpdate())
	}

	protected override createRenderRoot() {
		return this
	}

	protected override async primaryAction() {
		DialogAuthenticator.shallRememberStorage.value = this.shallRememberPassword
		if (DialogAuthenticator.shallRememberStorage.value) {
			DialogAuthenticator.usernameStorage.value = this.username
			DialogAuthenticator.passwordStorage.value = this.password
		}
		await this.authenticate()
	}
}