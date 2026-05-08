import { Component, component, event, html, property } from '@a11d/lit'
import { ComponentTestFixture } from '@a11d/lit-testing'
import { label } from '@a11d/metadata'
import { PageComponent } from './PageComponent.js'
import { type Page } from './Page.js'

@component('test-page-fake')
@PageComponent.pageElement()
class FakePage extends Component implements Page {
	@event() readonly pageHeadingChange!: EventDispatcher<string>
	@property() heading = ''
	protected override get template() { return html`<slot></slot>` }
}
FakePage

describe('PageComponent', () => {
	describe('heading seeding', () => {
		describe('with @label and no template heading', () => {
			@label('Labelled Page Title')
			@component('test-page-with-label')
			class LabelledPage extends PageComponent {
				protected override get template() {
					return html`<test-page-fake></test-page-fake>`
				}
			}

			const fixture = new ComponentTestFixture(() => new LabelledPage())

			it('seeds the host page element heading from the @label metadata', () => {
				expect(fixture.component.pageElement.heading).toBe('Labelled Page Title')
			})
		})

		describe('with @label and a heading already set in the template', () => {
			@label('Should Not Win')
			@component('test-page-with-label-and-heading')
			class LabelledPageWithExplicitHeading extends PageComponent {
				protected override get template() {
					return html`<test-page-fake heading='Template Heading'></test-page-fake>`
				}
			}

			const fixture = new ComponentTestFixture(() => new LabelledPageWithExplicitHeading())

			it('does not overwrite a non-empty heading already set by the template', () => {
				expect(fixture.component.pageElement.heading).toBe('Template Heading')
			})
		})

		describe('without @label', () => {
			@component('test-page-without-label')
			class UnlabelledPage extends PageComponent {
				protected override get template() {
					return html`<test-page-fake></test-page-fake>`
				}
			}

			const fixture = new ComponentTestFixture(() => new UnlabelledPage())

			it('CURRENTLY blanks the heading to undefined when there is no @label (regression target)', () => {
				expect(fixture.component.pageElement.heading).toBeUndefined()
			})
		})
	})
})