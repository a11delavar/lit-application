import { type LitElement } from '@a11d/lit'

/** Decorates a static property to return the first element in the document that is an instance of the class. */
export function queryInstanceElement() {
	return (prototype: AbstractConstructor<LitElement>, propertyKey: string) => {
		Object.defineProperty(prototype, propertyKey, {
			get(this: AbstractConstructor<LitElement>) {
				return [...document?.querySelectorAll('*') ?? []].find(element => element instanceof this)
			}
		})
	}
}