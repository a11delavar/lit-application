import { createMetadataDecorator } from './createMetadataDecorator.js'

/**
 * Attaches a human-readable description to a class or one of its properties.
 *
 * Importing the package also makes it available as the global `description`.
 */
export const description = createMetadataDecorator('description')
globalThis.description = description

declare global {
	var description: typeof import('./description.js').description
}