import { createMetadataDecorator } from './createMetadataDecorator.js'

/**
 * Attaches a human-readable label to a class or one of its properties; `label.short` attaches a shorter form of it.
 *
 * Importing the package also makes it available as the global `label`.
 */
export const label = Object.assign(createMetadataDecorator('label'), {
	/**
	 * Attaches a shorter form of the label for where space is tight, such as a column heading.
	 * It is held apart from the label, so either can be set or overridden on its own.
	 */
	short: createMetadataDecorator('short label'),
})
globalThis.label = label

declare global {
	var label: typeof import('./label.js').label
}
