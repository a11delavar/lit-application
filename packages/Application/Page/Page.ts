import { LitElement } from '@a11d/lit'

export interface Page extends LitElement {
	readonly pageHeadingChange: EventDispatcher<string>
}