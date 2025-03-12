import { component } from '@a11d/lit'
import { PageComponent } from '@a11d/lit-application'
import { Authorization, requiresAuthorization } from './Authorization.js'

describe('Authorization', () => {
	@component('test-page-no-auth')
	class PageNoAuth extends PageComponent { }

	@component('test-page-empty-auth')
	@requiresAuthorization([])
	class PageEmptyAuth extends PageComponent { }

	@component('test-page-with-auth')
	@requiresAuthorization(['test'])
	class PageWithAuth extends PageComponent { }

	it('should authorize page with no required authorization', () => {
		const page = new PageNoAuth()
		expect(Authorization.isAuthorized(page)).toBe(true)
	})

	it('should authorize page with empty required authorization', () => {
		const page = new PageEmptyAuth()
		expect(Authorization.isAuthorized(page)).toBe(true)
	})

	it('should authorize page with required authorization', () => {
		const page = new PageWithAuth()
		expect(Authorization.isAuthorized(page)).toBe(false)
	})

	it('should grant and revoke authorization', () => {
		Authorization.grant('test')
		expect(Authorization.has('test')).toBe(true)

		Authorization.revoke('test')
		expect(Authorization.has('test')).toBe(false)
	})
})