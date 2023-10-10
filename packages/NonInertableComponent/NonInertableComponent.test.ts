import { ComponentTestFixture } from '@a11d/lit-testing'
import { NonInertableComponent } from './NonInertableComponent.js'

customElements.define('test-non-inertable-test', class NonInertableTestComponent extends NonInertableComponent { })

describe('NonInertableComponent', () => {
	const fixture = new ComponentTestFixture('test-non-inertable-test')

	it('should reject inert attempt via attribute', async () => {
		fixture.component.setAttribute('inert', '')

		await fixture.updateComplete

		expect(fixture.component.hasAttribute('inert')).toBe(false)
		expect(fixture.component.inert).toBe(false)
	})

	it('should reject inert attempt via property', async () => {
		fixture.component.inert = true

		await fixture.updateComplete

		expect(fixture.component.hasAttribute('inert')).toBe(false)
		expect(fixture.component.inert).toBe(false)
	})
})