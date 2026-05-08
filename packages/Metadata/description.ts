import { createMetadataDecorator } from './createMetadataDecorator.js'

export const description = createMetadataDecorator(Symbol('description'))
globalThis.description = description

declare global {
	var description: typeof import('./description.js').description
}