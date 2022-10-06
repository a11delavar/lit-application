import { LitElement } from '@a11d/lit'

export function queryInstanceElement() {
	return (prototype: AbstractConstructor<LitElement>, propertyKey: string) => {
		Object.defineProperty(prototype, propertyKey, {
			get(this: AbstractConstructor<LitElement>) {
				return [...window.document.querySelectorAll('*')].find(element => element instanceof this)
			}
		})
	}
}