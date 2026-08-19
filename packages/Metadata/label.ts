import { createMetadataDecorator } from './createMetadataDecorator.js'

export const label = createMetadataDecorator('label')
globalThis.label = label

declare global {
	var label: typeof import('./label.js').label
}