import { HttpErrorCode, DialogComponent, PageComponent, PageError, NotificationComponent, type RoutableComponentConstructor, type RoutableComponent } from '@a11d/lit-application'
import { createMetadataDecorator } from '@a11d/metadata'
import { LocalStorage } from '@a11d/local-storage'

/**
 * Requires the user to be granted every given authorization before the decorated page or dialog opens.
 *
 * A page the user is not authorized for navigates to an error page instead, and such a dialog notifies about the denial and
 * throws. An instance can require other authorizations through its `requiresAuthorization.override` member.
 *
 * @example
 * ```ts
 * import { component, html } from '@a11d/lit'
 * import { PageComponent, route } from '@a11d/lit-application'
 * import { Authorization, requiresAuthorization } from '@a11d/lit-application-authorization'
 *
 * @component('app-page-invoices')
 * @route('/invoices')
 * @requiresAuthorization(['invoices.read'])
 * export class PageInvoices extends PageComponent {
 * 	protected override get template() {
 * 		return html`<lit-page heading='Invoices'></lit-page>`
 * 	}
 * }
 *
 * Authorization.grant('invoices.read')
 * ```
 */
export const requiresAuthorization = createMetadataDecorator('requiresAuthorization') as {
	(value: Array<string>): (target: RoutableComponentConstructor) => void
	get(constructor: RoutableComponentConstructor): Array<string> | undefined
	readonly override: symbol
	resolve(routable: RoutableComponent): Array<string> | undefined
}

/** Holds the authorizations granted to the user, kept in local storage, and tells whether a page or dialog is authorized. */
export class Authorization {
	private static readonly storage = new LocalStorage('LitApplication.Authorizations', new Array<string>())

	private static get values() { return Authorization.storage.value }
	private static set values(value) { Authorization.storage.value = value }

	static grant(...authorizations: Array<string>) {
		this.values = [...new Set([...authorizations, ...this.values])]
	}

	static revoke(...authorizations: Array<string>) {
		this.values = this.values.filter(p => authorizations.includes(p) === false)
	}

	static revokeAll() {
		this.values = []
	}

	/** Tells whether every given authorization is granted. */
	static has(...authorizations: Array<string>) {
		return authorizations.every(p => this.values.includes(p))
	}

	/** Tells whether every authorization the given page or dialog requires is granted. */
	static isAuthorized(routable: RoutableComponent) {
		const requiredAuthorizations = requiresAuthorization.resolve(routable) ?? []
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