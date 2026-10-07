import { createMetadataDecorator } from './createMetadataDecorator.js'

/**
 * Attaches a human-readable label to a class or one of its properties.
 *
 * Importing the package also makes it available as the global `label`.
 */
export const label = createMetadataDecorator('label')
globalThis.label = label

declare global {
	var label: typeof import('./label.js').label
}
