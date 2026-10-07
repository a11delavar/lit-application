/** The `beforeinstallprompt` event, dispatched when the browser offers to install the application. */
export interface BeforeInstallPromptEvent extends Event {
	readonly platforms: Array<string>
	readonly userChoice: Promise<{
		readonly outcome: 'accepted' | 'dismissed'
		readonly platform: string
	}>
	prompt(): Promise<void>
}

/** Registers service workers, and prompts to install the application as a progressive web app. */
export class PwaHelper {
	private static pwaPrompt?: BeforeInstallPromptEvent

	static {
		window?.addEventListener('beforeinstallprompt', e => {
			this.pwaPrompt = e as BeforeInstallPromptEvent
			e.preventDefault()
		})
	}

	/** The service worker container, if the browser supports service workers. */
	static get serviceWorkerContainer() {
		return navigator.serviceWorker as ServiceWorkerContainer | undefined
	}

	/** Registers the service worker at the path for the whole origin and prompts to install the application, logging any error. */
	static async registerServiceWorker(absolutePath: string) {
		try {
			await this.serviceWorkerContainer?.register(absolutePath, { scope: '/' })
			await this.requestInstallation()
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error(e)
		}
	}

	static async unregisterServiceWorkers() {
		const serviceWorkers = await this.serviceWorkerContainer?.getRegistrations() || []
		for (const serviceWorker of serviceWorkers) {
			serviceWorker.unregister()
		}
	}

	private static async requestInstallation() {
		const isRequestPossible = this.pwaPrompt !== undefined

		if (isRequestPossible === false) {
			return
		}

		await this.pwaPrompt?.prompt()
		const userChoice = await this.pwaPrompt?.userChoice
		if (userChoice?.outcome !== 'accepted') {
			throw new Error('PWA installation was not accepted')
		}
	}
}
