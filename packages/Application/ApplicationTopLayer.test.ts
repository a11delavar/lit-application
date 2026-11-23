import { ApplicationTopLayer } from './index.js'

describe('ApplicationTopLayer', () => {
	const layers = new Array<HTMLElement>()
	const create = (parent: Node) => {
		const layer = document.createElement('lit-application-top-layer')
		layers.push(layer)
		parent.appendChild(layer)
		return layer
	}

	afterEach(() => {
		layers.forEach(layer => layer.remove())
		layers.length = 0
	})

	describe('Instance', () => {
		it('should be the most recently connected top layer', () => {
			create(document.body)
			const last = create(document.body)

			expect(ApplicationTopLayer.instance).toBe(last)
		})

		it('should be the document body when no top layer is connected', () => {
			expect(ApplicationTopLayer.instance).toBe(document.body)
		})
	})

	describe('Disconnecting', () => {
		it('should move its children to the most recently connected top layer that remains', () => {
			const remaining = create(document.body)
			const disconnecting = create(document.body)
			const child = disconnecting.appendChild(document.createElement('div'))

			disconnecting.remove()

			expect(child.parentElement).toBe(remaining)
		})

		describe('when a child holds a top layer of its own', () => {
			it('should move the child out instead of into its own top layer', () => {
				const remaining = create(document.body)
				const disconnecting = create(document.body)
				const child = disconnecting.appendChild(document.createElement('div'))
				create(child.attachShadow({ mode: 'open' }))

				disconnecting.remove()

				expect(child.parentElement).toBe(remaining)
			})
		})
	})
})
