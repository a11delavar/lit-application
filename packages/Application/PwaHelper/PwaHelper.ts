export interface BeforeInstallPromptEvent extends Event {
	readonly platforms: Array<string>
	readonly userChoice: Promise<{
		readonly outcome: 'accepted' | 'dismissed'
		readonly platform: string
	}>
	prompt(): Promise<void>
}

export class PwaHelper {
	private static pwaPrompt?: BeforeInstallPromptEvent

	static {
		window.addEventListener('beforeinstallprompt', e => {
			this.pwaPrompt = e as BeforeInstallPromptEvent
			e.preventDefault()
		})
	}

	static get serviceWorkerContainer() {
		return navigator.serviceWorker as ServiceWorkerContainer | undefined
	}

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