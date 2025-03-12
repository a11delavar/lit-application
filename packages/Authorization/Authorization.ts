import { HttpErrorCode, DialogComponent, PageComponent, PageError, NotificationComponent, type Routable } from '@a11d/lit-application'
import { createMetadataDecorator } from '@a11d/metadata'
import { LocalStorage } from '@a11d/local-storage'

export const requiresAuthorization = createMetadataDecorator(Symbol('requiresAuthorization')) as {
	(value: Array<string>): (target: Constructor<Routable<any>>) => void
	get(constructor: Constructor<Routable<any>>): Array<string> | undefined
}

export class Authorization {
	private static readonly storage = new LocalStorage('LitApplication.Authorizations', new Array<string>())

	private static get values() { return Authorization.storage.value }
	private static set values(value) { Authorization.storage.value = value }

	static grant(...authorizations: Array<string>) {
		this.values = [...authorizations, ...this.values]
	}

	static revoke(...authorizations: Array<string>) {
		this.values = this.values.filter(p => authorizations.includes(p) === false)
	}

	static has(...authorizations: Array<string>) {
		return authorizations.every(p => this.values.includes(p))
	}

	static isAuthorized(routable: Routable) {
		const requiredAuthorizations = requiresAuthorization.get(routable.constructor as Constructor<Routable<any>>) ?? []
		return Authorization.has(...requiredAuthorizations)
	}
}

PageComponent.connectingHooks.add(page => {
	if (!Authorization.isAuthorized(page)) {
		new PageError({ error: HttpErrorCode.Unauthorized }).navigate()
	}
})

DialogComponent.connectingHooks.add(dialog => {
	if (!Authorization.isAuthorized(dialog)) {
		NotificationComponent.notifyAndThrowError(new Error('🔒 Access denied'))
	}
})