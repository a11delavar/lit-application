import { component, html } from '@a11d/lit'
import { Application, NotificationComponent } from '@a11d/lit-application'
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
	protected getAuthenticatedAccount = () => Promise.resolve({ name: 'Ada' })

	protected override get template() {
		return html.nothing
	}
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
})
