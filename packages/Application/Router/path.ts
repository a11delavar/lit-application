Object.defineProperty(URL.prototype, 'path', {
	get() {
		return this.pathname + this.search
	},
	enumerable: false,
	configurable: true
})

declare global {
	interface URL {
		/** The `pathname` followed by the `search` of the URL. */
		readonly path: string
	}
}