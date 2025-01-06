import { createMetadataDecorator } from './createMetadataDecorator.js'

export const description = createMetadataDecorator(Symbol('description'))
globalThis.description = description

declare global {
	// eslint-disable-next-line no-var
	var description: typeof import('./description.js').description
}