import { type LitElement } from '@a11d/lit'

export function queryInstanceElement() {
	return (prototype: AbstractConstructor<LitElement>, propertyKey: string) => {
		Object.defineProperty(prototype, propertyKey, {
			get(this: AbstractConstructor<LitElement>) {
				return [...document?.querySelectorAll('*') ?? []].find(element => element instanceof this)
			}
		})
	}
}