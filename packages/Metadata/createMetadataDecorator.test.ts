import { createMetadataDecorator } from './createMetadataDecorator.js'
import { type } from './type.js'

const meta = createMetadataDecorator('meta')

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

	describe('resolve', () => {
		it('should fall back to the metadata statically decorated onto the class', () => {
			expect(meta.resolve(new TestClassOne)).toBe('Test #1')
		})

		it('should fall back to the metadata inherited from a parent class', () => {
			expect(meta.resolve(new TestClassTwo)).toBe('Test #1')
		})

		it('should return undefined when neither the instance nor its class provides the metadata', () => {
			expect(meta.resolve(new TestClassZero)).toBeUndefined()
		})

		it('should prefer the value of the override member over the statically decorated one', () => {
			@meta('Static') class Overriding {
				get [meta.override]() { return 'Instance' }
			}
			expect(meta.resolve(new Overriding)).toBe('Instance')
		})

		it('should resolve the override member against the state of the very instance', () => {
			class Parameterized {
				constructor(readonly count: number) { }
				get [meta.override]() { return `Count: ${this.count}` }
			}
			expect(meta.resolve(new Parameterized(1))).toBe('Count: 1')
			expect(meta.resolve(new Parameterized(2))).toBe('Count: 2')
		})

		it('should support the override member being a plain field instead of a getter', () => {
			@meta('Static') class Field {
				[meta.override] = 'Instance'
			}
			expect(meta.resolve(new Field)).toBe('Instance')
		})

		it('should fall back to the statically decorated value when the override member yields undefined', () => {
			@meta('Static') class Conditional {
				constructor(readonly special: boolean) { }
				get [meta.override]() { return !this.special ? undefined : 'Instance' }
			}
			expect(meta.resolve(new Conditional(false))).toBe('Static')
			expect(meta.resolve(new Conditional(true))).toBe('Instance')
		})

		it('should fall back to the statically decorated value when the override member yields null', () => {
			@meta('Static') class Nulled {
				get [meta.override]() { return null }
			}
			expect(meta.resolve(new Nulled)).toBe('Static')
		})

		it('should replace the statically decorated value instead of merging with it', () => {
			@meta(['a', 'b']) class Replacing {
				get [meta.override]() { return ['c'] }
			}
			expect(meta.resolve(new Replacing)).toEqual(['c'])
		})

		it('should return a function-valued override as the metadata value instead of invoking it', () => {
			const value = () => 'Invoked'
			class FunctionValued {
				get [meta.override]() { return value }
			}
			expect(meta.resolve(new FunctionValued)).toBe(value)
		})

		it('should let a subclass refine the override member of its parent', () => {
			class Parent {
				get [meta.override]() { return 'Parent' }
			}
			class Child extends Parent {
				// The `override` modifier is not applicable to dynamically named members (TS4127),
				// which `noImplicitOverride` in turn exempts.
				get [meta.override]() { return `${super[meta.override]} & Child` }
			}
			expect(meta.resolve(new Child)).toBe('Parent & Child')
		})

		it('should let a subclass introduce an override member for statically decorated inherited metadata', () => {
			class Refining extends TestClassOne {
				get [meta.override]() { return `${meta.get(TestClassOne)} refined` }
			}
			expect(meta.resolve(new TestClassOne)).toBe('Test #1')
			expect(meta.resolve(new Refining)).toBe('Test #1 refined')
		})

		it('should not let two decorators sharing a description collide', () => {
			// The description feeds `Symbol(description)`, which stays unique per call,
			// so it must never act as the identity of the decorator.
			const first = createMetadataDecorator('same')
			const second = createMetadataDecorator('same')
			@first('First') @second('Second') class Same { }
			expect(first.get(Same)).toBe('First')
			expect(second.get(Same)).toBe('Second')
			expect(first.override).not.toBe(second.override)
		})

		it('should not let the override member of one decorator leak into another', () => {
			const other = createMetadataDecorator('other')
			@meta('Meta static') @other('Other static') class Isolated {
				get [meta.override]() { return 'Meta instance' }
			}
			expect(meta.resolve(new Isolated)).toBe('Meta instance')
			expect(other.resolve(new Isolated)).toBe('Other static')
		})

		it('should keep the metadata of a class readable once its instances carry an override member', () => {
			// `override` is the metadata key itself, so an override member puts that very symbol onto
			// the prototype. Reads must stay unaffected, as the values live in a side table keyed by
			// their target rather than as properties on it.
			@meta('Static') class Coexisting {
				@meta('Some property') declare property: string
				get [meta.override]() { return 'Instance' }
			}
			expect(meta.get(Coexisting)).toBe('Static')
			expect(meta.get(Coexisting, 'property')).toBe('Some property')
			expect(meta.resolve(new Coexisting)).toBe('Instance')
		})

		it('should return undefined instead of throwing for an object without a constructor', () => {
			const prototypeless = Object.create(null) as object
			expect(() => meta.resolve(prototypeless)).not.toThrow()
			expect(meta.resolve(prototypeless)).toBeUndefined()
		})

		it('should read the override member of an object without a constructor', () => {
			const prototypeless = Object.assign(Object.create(null), { [meta.override]: 'Instance' }) as object
			expect(meta.resolve(prototypeless)).toBe('Instance')
		})
	})

	describe('across object boundaries', () => {
		// Member (slot) metadata and the metadata of a value's own class are separate dimensions:
		// the former is keyed by the containing class's prototype and property, the latter by the
		// value's constructor. Neither lookup ever consults the other.
		@meta('Customer entity') class Customer {
			@meta('Name slot') declare name: string
			get [meta.override]() { return 'The customer' }
		}

		class Order {
			@type(Customer)
			@meta('Customer slot') customer = new Customer
		}

		it('should keep the metadata of a member apart from the metadata of its value\'s class', () => {
			expect(meta.get(Order, 'customer')).toBe('Customer slot')
			expect(meta.get(Customer)).toBe('Customer entity')
		})

		it('should not let the override member of the value\'s class affect the member metadata of the containing class', () => {
			expect(meta.get(Order, 'customer')).toBe('Customer slot')
			expect(meta.resolve(new Order)).toBeUndefined()
		})

		it('should resolve a member\'s value through its own class when handed the value itself', () => {
			expect(meta.resolve(new Order().customer)).toBe('The customer')
		})

		it('should keep key-path lookups static and therefore unaffected by override members', () => {
			expect(meta.getByKeyPath(Order, 'customer')).toBe('Customer slot')
			expect(meta.getByKeyPath(Order, 'customer.name')).toBe('Name slot')
		})

		it('should treat a member holding a constructor as a slot like any other', () => {
			@meta('Entity') class Entity { }
			class Registry {
				@meta('Active entity type') entityType = Entity
			}
			expect(meta.get(Registry, 'entityType')).toBe('Active entity type')
			expect(meta.get(new Registry().entityType)).toBe('Entity')
		})

		it('should read a static override member when handed the class object itself', () => {
			@meta('Static') class WithStaticOverride {
				static get [meta.override]() { return 'From the class object' }
			}
			expect(meta.resolve(WithStaticOverride)).toBe('From the class object')
		})

		it('should not let a static override member affect the resolution of instances', () => {
			// Static members live on the constructor, not the prototype, so instances never see them.
			@meta('Static') class WithStaticOverride {
				static get [meta.override]() { return 'From the class object' }
			}
			expect(meta.resolve(new WithStaticOverride)).toBe('Static')
		})

		it('CURRENTLY cannot fall back to class metadata when handed a bare constructor (generalization target)', () => {
			// `resolve` falls back to `get(instance.constructor)`, which for a constructor is
			// `get(Function)` - so the class's own metadata is unreachable through `resolve`.
			@meta('Static') class Bare { }
			expect(meta.resolve(Bare)).toBeUndefined()
		})
	})
})