import { type } from './type.js'

describe('type', () => {
	class Child { }

	class Parent {
		@type(Child) child?: Child
	}

	it('should return the registered type for a decorated property', () => {
		expect(type.get(Parent, 'child')).toBe(Child)
	})

	it('should return undefined for an undecorated property', () => {
		expect(type.get(Parent, 'unknown')).toBeUndefined()
	})

	it('should return undefined when the constructor is undefined instead of throwing', () => {
		// `Reflect.getMetadata` throws a `TypeError` when the target is not an object, so callers
		// that chain `type.get` results (e.g. `metadata.getByKeyPath`) used to crash with
		// "Cannot read properties of undefined (reading 'prototype')" once any intermediate call
		// returned `undefined` and was then fed back in. `type.get` therefore short-circuits
		// `undefined` constructors itself.
		expect(() => type.get(undefined!, 'anything')).not.toThrow()
		expect(type.get(undefined!, 'anything')).toBeUndefined()
	})
})