import { component, html } from '@a11d/lit'
import { Application, DialogComponent, NotificationComponent } from '@a11d/lit-application'
import { DialogAuthenticator } from './DialogAuthenticator.js'

type Account = { readonly name: string }

@component('test-authentication-application')
class TestApplication extends Application {
	protected override get template() {
		return html.nothing
	}
}

@component('test-dialog-authenticator')
class TestDialogAuthenticator extends DialogAuthenticator<Account> {
	protected authenticateAccount = () => Promise.resolve({ name: 'Ada' })
	protected unauthenticateAccount = () => Promise.resolve()
	protected getAuthenticatedAccount = (): Promise<Account | undefined> => Promise.resolve({ name: 'Ada' })

	protected override get template() {
		return html.nothing
	}
}

@component('test-translated-dialog-authenticator')
class TestTranslatedDialogAuthenticator extends TestDialogAuthenticator {
	protected override get authenticatedMessage() { return 'Signed in' }
	protected override get unauthenticatedMessage() { return 'Signed out' }
}

@component('test-rejected-dialog-authenticator')
class TestRejectedDialogAuthenticator extends TestDialogAuthenticator {
	protected override authenticateAccount = () => Promise.reject(new Error('Expired password'))
	protected override getAuthenticatedAccount = () => Promise.resolve(undefined)
}

describe('DialogAuthenticator', () => {
	it('should render the application only once the hooks after authentication have run', async () => {
		// The success notification needs a registered notification component, which this test has none of.
		vi.spyOn(NotificationComponent, 'notifySuccess').mockResolvedValue()
		const application = document.body.appendChild(new TestApplication())
		await application.updateComplete
		const events = new Array<string>()
		// Lit's own property updates pass the changed property; a re-render as a whole passes nothing.
		vi.spyOn(application, 'requestUpdate').mockImplementation((...args: Array<unknown>) => void (!args.length && events.push('render')))
		const hook = async () => {
			await Promise.resolve()
			events.push('hook')
		}
		DialogAuthenticator.afterAuthenticationHooks.add(hook)

		try {
			await new TestDialogAuthenticator().authenticate()
		} finally {
			DialogAuthenticator.afterAuthenticationHooks.delete(hook)
			application.remove()
		}

		expect(events).toEqual(['hook', 'render'])
	})

	describe('Messages', () => {
		it('should notify with the messages a subclass overrides', async () => {
			const notifySuccess = vi.spyOn(NotificationComponent, 'notifySuccess').mockResolvedValue()
			vi.spyOn(DialogComponent.prototype, 'confirm').mockResolvedValue({ name: 'Ada' })
			const authenticator = new TestTranslatedDialogAuthenticator()

			await authenticator.authenticate()
			await authenticator.unauthenticate()

			expect(notifySuccess.mock.calls.map(([message]) => message)).toEqual(['Signed in', 'Signed out'])
		})
	})

	describe('Remembered credentials', () => {
		it('should show the dialog when signing in with them fails', async () => {
			const shallRemember = DialogAuthenticator.shallRememberStorage.value
			DialogAuthenticator.shallRememberStorage.value = true
			const showDialog = vi.spyOn(DialogComponent.prototype, 'confirm').mockResolvedValue({ name: 'Ada' })

			try {
				await expect(new TestRejectedDialogAuthenticator().confirm()).resolves.toEqual({ name: 'Ada' })
			} finally {
				DialogAuthenticator.shallRememberStorage.value = shallRemember
			}

			expect(showDialog).toHaveBeenCalledOnce()
		})
	})
})
