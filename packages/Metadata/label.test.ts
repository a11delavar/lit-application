import { label, type } from './index.js'

describe('label', () => {
	describe('short', () => {
		class Price {
			@label.short('PP')
			@label('Purchase price') purchasePrice = 0

			@label('Retail price') retailPrice = 0
		}

		class Product {
			@type(Price) price = new Price()
		}

		it('should attach a short label next to the label', () => {
			expect(label.short.get(Price, 'purchasePrice')).toBe('PP')
			expect(label.get(Price, 'purchasePrice')).toBe('Purchase price')
		})

		it('should return undefined for a property without a short label', () => {
			expect(label.short.get(Price, 'retailPrice')).toBeUndefined()
		})

		it('should return the short label by key path', () => {
			expect(label.short.getByKeyPath(Product, 'price.purchasePrice')).toBe('PP')
		})

		it('should attach a short label onto a class', () => {
			@label('Purchase order') @label.short('PO') class PurchaseOrder { }
			expect(label.short.get(PurchaseOrder)).toBe('PO')
		})
	})
})
