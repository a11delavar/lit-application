import { HttpErrorCode, DialogComponent, PageComponent, PageError, NotificationComponent } from '@a11d/lit-application'
import { LocalStorage } from '@a11d/local-storage'

type AuthorizableComponent = DialogComponent<any, any> | PageComponent<any>

export const requiresAuthorization = <TConstructor extends Constructor<AuthorizableComponent>>(...authorizations: Array<string>) => {
	return (Constructor: TConstructor) => {
		Authorization.addAuthorizationsByComponent(Constructor, authorizations)
	}
}

export class Authorization {
	private static readonly storage = new LocalStorage('LitApplication.Authorizations', new Array<string>())
	private static readonly authorizationsByComponent = new Map<Constructor<AuthorizableComponent>, Array<string>>()

	static addAuthorizationsByComponent(component: Constructor<AuthorizableComponent>, authorizations: Array<string>) {
		this.authorizationsByComponent.set(component, authorizations)
	}

	static authorizeComponent(component: AuthorizableComponent) {
		const ComponentConstructor = component.constructor as Constructor<AuthorizableComponent>
		const isAuthorized = Authorization.authorized(...Authorization.authorizationsByComponent.get(ComponentConstructor) ?? [])
		if (isAuthorized === false) {
			if (component instanceof PageComponent) {
				component = new PageError({ error: HttpErrorCode.Unauthorized })
			} else {
				NotificationComponent.notifyAndThrowError(new Error('🔒 Access denied'))
			}
		}
	}

	static authorized(...authorizations: Array<string>) {
		return authorizations.every(p => Authorization.storage.value.includes(p))
	}

	static authorize(...authorizations: Array<string>) {
		Authorization.storage.value = [
			...authorizations,
			...Authorization.storage.value,
		]
	}

	static unauthorize(...authorizations: Array<string>) {
		Authorization.storage.value =
			Authorization.storage.value.filter(p => authorizations.includes(p) === false)
	}
}

PageComponent.connectingHooks.add(page => Authorization.authorizeComponent(page))
DialogComponent.connectingHooks.add(dialog => Authorization.authorizeComponent(dialog))