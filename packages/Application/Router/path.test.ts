describe('URL', () => {
	describe('path', () => {
		it('should return the path of the URL', () => {
			const url = new URL('https://example.com/path/to/resource?query=param')
			expect(url.path).toBe('/path/to/resource?query=param')
		})

		it('should return the path of the URL without query parameters', () => {
			const url = new URL('https://example.com/path/to/resource')
			expect(url.path).toBe('/path/to/resource')
		})

		it('should return an empty string for a URL with no path', () => {
			const url = new URL('https://example.com')
			expect(url.path).toBe('/')
		})
	})
})