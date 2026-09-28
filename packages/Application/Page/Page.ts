import { type LitElement } from '@a11d/lit'

/** The element a page component renders its content into, such as `lit-page`, marked with `PageComponent.pageElement()`. */
export interface Page extends LitElement {
	/** Dispatches the heading whenever it changes, as a `composed`, bubbling and `cancelable` event. */
	readonly pageHeadingChange: EventDispatcher<string>
	/** The heading of the page, which the application shows in the document title. */
	heading: string
}