import { Component, component, html } from '@a11d/lit'
import { HookSet } from './HookSet.js'

@component('test-hookset-host')
class FakeHost extends Component {
	token = 0
	protected override get template() { return html`` }
}

describe('HookSet', () => {
	describe('execute()', () => {
		it('resolves immediately when no hooks are registered', async () => {
			const hooks = new HookSet<void>()
			await expect(hooks.execute()).resolves.toBeUndefined()
		})

		it('passes the host argument to each registered hook', async () => {
			const hooks = new HookSet<FakeHost>()
			const a = vi.fn()
			const b = vi.fn()
			hooks.add(a).add(b)
			const host = new FakeHost()
			host.token = 42

			await hooks.execute(host)

			expect(a).toHaveBeenCalledExactlyOnceWith(host)
			expect(b).toHaveBeenCalledExactlyOnceWith(host)
		})

		it('runs all hooks even when one rejects (allSettled semantics)', async () => {
			const hooks = new HookSet<void>()
			const after = vi.fn()
			hooks.add(() => Promise.reject(new Error('first failed')))
			hooks.add(after)

			await expect(hooks.execute()).resolves.toBeUndefined()
			expect(after).toHaveBeenCalledTimes(1)
		})

		it('awaits asynchronous hooks before resolving', async () => {
			const hooks = new HookSet<void>()
			let finished = false
			hooks.add(async () => {
				await new Promise(resolve => setTimeout(resolve, 5))
				finished = true
			})

			await hooks.execute()

			expect(finished).toBe(true)
		})

		it('supports synchronous (non-promise) hooks', async () => {
			const hooks = new HookSet<void>()
			const sync = vi.fn()
			hooks.add(sync)

			await hooks.execute()

			expect(sync).toHaveBeenCalledTimes(1)
		})
	})
})
