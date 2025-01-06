import { createMetadataDecorator } from './createMetadataDecorator.js'

export const label = createMetadataDecorator(Symbol('label'))
globalThis.label = label

declare global {
	// eslint-disable-next-line no-var
	var label: typeof import('./label.js').label
}