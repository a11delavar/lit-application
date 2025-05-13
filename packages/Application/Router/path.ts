Object.defineProperty(URL.prototype, 'path', {
	get() {
		return this.pathname + this.search
	},
	enumerable: false,
	configurable: true
})

declare global {
	interface URL {
		/**
		 * Returns the path of the URL.
		 */
		readonly path: string
	}
}