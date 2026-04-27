import { createMetadataDecorator } from './createMetadataDecorator.js'
import { type } from './type.js'

const meta = createMetadataDecorator(Symbol('meta'))

describe('createMetadata', () => {
	class TestClassZero { }
	@meta('Test #1') class TestClassOne { }
	class TestClassTwo extends TestClassOne { }
	@meta('Test #3') class TestClassThree extends TestClassTwo { }

	describe('on class', () => {
		it('should return undefined for a class without the metadata', () => {
			expect(meta.get(TestClassZero)).toBe(undefined)
		})

		it('should attach the metadata onto a class', () => {
			expect(meta.get(TestClassOne)).toBe('Test #1')
		})

		it('should inherit the metadata from a parent class', () => {
			expect(meta.get(TestClassTwo)).toBe('Test #1')
		})

		it('should override the metadata from a parent class', () => {
			expect(meta.get(TestClassThree)).toBe('Test #3')
		})
	})

	describe('on properties', () => {
		class TestPropertyOne {
			@meta('Some property') prop?: string
		}

		class TestPropertyTwo extends TestPropertyOne {
			override prop = ''
		}

		class TestPropertyThree extends TestPropertyTwo {
			@meta('Overridden property') override prop = ''
			nested = new TestPropertyOne()
		}

		it('should attach the metadata onto a property', () => {
			expect(meta.get(TestPropertyOne, 'prop')).toBe('Some property')
		})

		it('should inherit the metadata from a parent property', () => {
			expect(meta.get(TestPropertyTwo, 'prop')).toBe('Some property')
		})

		it('should override the metadata from a parent property', () => {
			expect(meta.get(TestPropertyThree, 'prop')).toBe('Overridden property')
		})
	})

	describe('by key path', () => {
		class TestKeyPathOne {
			@meta('Some property') property?: string
		}

		class TestKeyPathTwo {
			@type(TestKeyPathOne)
			@meta('Property One') one?: TestKeyPathOne

			// Intentionally not decorated with @type to simulate a plain object / interface property.
			plain?: { childProperty: string }
		}

		it('should return the metadata by key path', () => {
			expect(meta.getByKeyPath(TestKeyPathTwo, 'one.property')).toBe('Some property')
		})

		it('should return undefined when an intermediate property has no @type decoration', () => {
			expect(meta.getByKeyPath(TestKeyPathTwo, 'plain.childProperty')).toBeUndefined()
		})

		it('should return undefined when an undecorated intermediate property is followed by further nested segments', () => {
			// Regression: an earlier implementation crashed with
			// "Cannot read properties of undefined (reading 'prototype')" because the reduce kept
			// recursing into `type.get(undefined, ...)` instead of short-circuiting.
			expect(() => meta.getByKeyPath(TestKeyPathTwo, 'plain.deeply.nested.path' as KeyPath.Of<TestKeyPathTwo>)).not.toThrow()
			expect(meta.getByKeyPath(TestKeyPathTwo, 'plain.deeply.nested.path' as KeyPath.Of<TestKeyPathTwo>)).toBeUndefined()
		})

		it('should return undefined when the leaf property carries no metadata', () => {
			expect(meta.getByKeyPath(TestKeyPathTwo, 'one.unknown' as KeyPath.Of<TestKeyPathTwo>)).toBeUndefined()
		})
	})
})