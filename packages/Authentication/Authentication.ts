import { Application, DialogComponent, PageComponent } from '@a11d/lit-application'
import type { DialogAuthenticator } from './index.js'

type AuthenticationComponent = Application | PageComponent<any> | DialogComponent<any, any>
type AuthenticatorComponent = DialogAuthenticator<any>

export const authenticator = () => <T extends AuthenticatorComponent>(AuthenticatorConstructor: Constructor<T>) => {
	Authentication.AuthenticatorConstructor = AuthenticatorConstructor
}

export const requiresAuthentication = () => <T extends AuthenticationComponent>(AuthenticationConstructor: Constructor<T>) => {
	Authentication.addAuthenticationComponent(AuthenticationConstructor)
}

export const requiresNoAuthentication = () => <T extends AuthenticationComponent>(AuthenticationConstructor: Constructor<T>) => {
	Authentication.addNoAuthenticationComponent(AuthenticationConstructor)
}

export class Authentication {
	private static readonly authenticationComponents = new Set<Constructor<AuthenticationComponent>>()
	private static readonly noAuthenticationComponents = new Set<Constructor<AuthenticationComponent>>()
	private static globalAuthentication = false

	private static _AuthenticatorConstructor?: Constructor<AuthenticatorComponent>
	static get AuthenticatorConstructor() { return this._AuthenticatorConstructor }
	static set AuthenticatorConstructor(value) {
		Authentication._AuthenticatorConstructor = value
		this.authenticator = value ? new value() : undefined
	}

	private static authenticator?: AuthenticatorComponent

	static hasAuthenticator() {
		return !!Authentication.AuthenticatorConstructor
	}

	static addAuthenticationComponent(component: Constructor<AuthenticationComponent>) {
		if (component.prototype instanceof Application) {
			Authentication.globalAuthentication = true
		} else {
			this.authenticationComponents.add(component)
		}
	}

	static addNoAuthenticationComponent(component: Constructor<AuthenticationComponent>) {
		this.noAuthenticationComponents.add(component)
	}

	static async authenticateGloballyIfAvailable() {
		if (this.globalAuthentication) {
			await this.authenticate()
		}
	}

	static async authenticateComponent(component: AuthenticationComponent) {
		const AuthenticationConstructor = component.constructor as Constructor<AuthenticationComponent>

		const shallAuthenticate = this.globalAuthentication === false
			&& this.noAuthenticationComponents.has(AuthenticationConstructor) === false
			&& this.authenticationComponents.has(AuthenticationConstructor)

		if (shallAuthenticate) {
			await this.authenticate()
		}
	}

	private static async authenticate() {
		await this.authenticator?.confirm()
	}

	static async unauthenticate() {
		await this.authenticator?.unauthenticate()
	}
}

Application.routerConnectingHooks.add(async () => void await Authentication.authenticateGloballyIfAvailable())
PageComponent.beforeNavigationHooks.add(async page => void await Authentication.authenticateComponent(page))
DialogComponent.beforeConfirmationHooks.add(async dialog => void await Authentication.authenticateComponent(dialog))