import { Application, DialogComponent, PageComponent } from '@a11d/lit-application'
import type { DialogAuthenticator } from './index.js'

type AuthenticationComponent = Application | PageComponent<any> | DialogComponent<any, any>
type AuthenticatorComponent = DialogAuthenticator<any>

/** Registers the decorated `DialogAuthenticator` as the dialog that authenticates the user, creating its one instance. */
export const authenticator = () => <T extends AuthenticatorComponent>(AuthenticatorConstructor: Constructor<T>) => {
	Authentication.AuthenticatorConstructor = AuthenticatorConstructor
}

/** Requires authentication before the decorated page or dialog connects, or, on an `Application`, before anything is routed. */
export const requiresAuthentication = () => <T extends AuthenticationComponent>(AuthenticationConstructor: Constructor<T>) => {
	Authentication.addAuthenticationComponent(AuthenticationConstructor)
}

/** Exempts the decorated page or dialog from being authenticated when it connects; application-wide authentication still applies. */
export const requiresNoAuthentication = () => <T extends AuthenticationComponent>(AuthenticationConstructor: Constructor<T>) => {
	Authentication.addNoAuthenticationComponent(AuthenticationConstructor)
}

/** Authenticates the user through the registered authenticator wherever `@requiresAuthentication()` asks for it. */
export class Authentication {
	private static readonly authenticationComponents = new Set<Constructor<AuthenticationComponent>>()
	private static readonly noAuthenticationComponents = new Set<Constructor<AuthenticationComponent>>()
	private static globalAuthentication = false

	private static _AuthenticatorConstructor?: Constructor<AuthenticatorComponent>
	/** The registered authenticator class; setting it creates the instance that authenticates. */
	static get AuthenticatorConstructor() { return this._AuthenticatorConstructor }
	static set AuthenticatorConstructor(value) {
		Authentication._AuthenticatorConstructor = value
		this.authenticator = value ? new value() : undefined
	}

	private static authenticator?: AuthenticatorComponent

	static hasAuthenticator() {
		return !!Authentication.AuthenticatorConstructor
	}

	/** Requires authentication for a page or dialog class, or for every route when it is an `Application`. */
	static addAuthenticationComponent(component: Constructor<AuthenticationComponent>) {
		if (component.prototype instanceof Application) {
			Authentication.globalAuthentication = true
		} else {
			this.authenticationComponents.add(component)
		}
	}

	/** Exempts a page or dialog class from being authenticated when it connects. */
	static addNoAuthenticationComponent(component: Constructor<AuthenticationComponent>) {
		this.noAuthenticationComponents.add(component)
	}

	/** Authenticates the user if the whole application requires it; runs once before the application routes. */
	static async authenticateGloballyIfAvailable() {
		if (this.globalAuthentication) {
			await this.authenticate()
		}
	}

	/** Authenticates the user if the class of `component` requires it and the application does not already. */
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

	/** Signs the user out through the authenticator, which then asks for authentication again. */
	static async unauthenticate() {
		await this.authenticator?.unauthenticate()
	}
}

Application.beforeRouteHooks.add(async () => void await Authentication.authenticateGloballyIfAvailable())
PageComponent.connectingHooks.add(async page => void await Authentication.authenticateComponent(page))
DialogComponent.connectingHooks.add(async dialog => void await Authentication.authenticateComponent(dialog))
