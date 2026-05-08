import { Component, component, html } from '@a11d/lit'
import { ComponentTestFixture } from '@a11d/lit-testing'
import { querySymbolizedElement } from './querySymbolizedElement.js'

const marker = Symbol('test.querySymbolizedElement.marker')
const otherMarker = Symbol('test.querySymbolizedElement.otherMarker')

@component('test-qse-marked')
class Marked extends Component {
	static readonly [marker] = true
	protected override get template() { return html`` }
}

@component('test-qse-unmarked')
class Unmarked extends Component {
	protected override get template() { return html`` }
}
Unmarked // referenced via tag in templates below; keep the import alive.

@component('test-qse-host-with-marked')
class HostWithMarked extends Component {
	@querySymbolizedElement(marker) readonly target!: Marked
	protected override get template() {
		return html`
			<test-qse-unmarked></test-qse-unmarked>
			<test-qse-marked></test-qse-marked>
			<test-qse-unmarked></test-qse-unmarked>
		`
	}
}

@component('test-qse-host-without-marked')
class HostWithoutMarked extends Component {
	@querySymbolizedElement(marker) readonly target!: Marked
	protected override get template() {
		return html`<test-qse-unmarked></test-qse-unmarked>`
	}
}

@component('test-qse-host-wrong-marker')
class HostWrongMarker extends Component {
	@querySymbolizedElement(otherMarker) readonly target!: Marked
	protected override get template() {
		return html`<test-qse-marked></test-qse-marked>`
	}
}

describe('querySymbolizedElement', () => {
	describe('with a marked element in the render root', () => {
		const fixture = new ComponentTestFixture(() => new HostWithMarked())

		it('returns the element whose constructor carries the symbol', () => {
			expect(fixture.component.target).toBeInstanceOf(Marked)
		})

		it('skips unmarked siblings', () => {
			expect(fixture.component.target.tagName.toLowerCase()).toBe('test-qse-marked')
		})
	})

	describe('without a marked element', () => {
		const fixture = new ComponentTestFixture(() => new HostWithoutMarked())

		it('throws a descriptive error naming the host class and property', () => {
			expect(() => fixture.component.target).toThrowError(/HostWithoutMarked.*target/)
		})
	})

	describe('with an unrelated marker symbol', () => {
		const fixture = new ComponentTestFixture(() => new HostWrongMarker())

		it('does not match elements marked with a different symbol', () => {
			expect(() => fixture.component.target).toThrowError()
		})
	})
})