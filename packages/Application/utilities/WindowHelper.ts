export const enum WindowOpenMode { Tab, Window }

export class WindowHelper {
	private static readonly windowSizeReductionMultiplier = 0.9

	static open(path = window.location.pathname, mode = WindowOpenMode.Tab) {
		return new Promise<Window>((resolve, reject) => {
			if (window.matchMedia('(display-mode: standalone)').matches && mode === WindowOpenMode.Tab && !manifest?.display_override?.includes('tabbed')) {
				mode = WindowOpenMode.Window
			}

			const newWindow = window.open(path, undefined, mode === WindowOpenMode.Tab ? '' : 'popup')
			if (!newWindow) {
				return reject(new Error('Failed to open a window, probably because the permission is denied.'))
			}

			newWindow.resizeTo(
				window.outerWidth * WindowHelper.windowSizeReductionMultiplier,
				window.outerHeight * WindowHelper.windowSizeReductionMultiplier
			)

			newWindow.moveTo(
				window.screenX + (window.outerWidth - newWindow.outerWidth) / 2,
				window.screenY + (window.outerHeight - newWindow.outerHeight) / 2
			)

			newWindow.addEventListener('Application.initialized', () => resolve(newWindow), { once: true })
		})
	}

	static async openAndFocus(...args: Parameters<typeof WindowHelper.open>) {
		const window = await WindowHelper.open(...args)
		window.focus()
	}
}