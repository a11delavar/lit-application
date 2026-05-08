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
			await expectAsync(hooks.execute()).toBeResolved()
		})

		it('passes the host argument to each registered hook', async () => {
			const hooks = new HookSet<FakeHost>()
			const a = jasmine.createSpy('a')
			const b = jasmine.createSpy('b')
			hooks.add(a).add(b)
			const host = new FakeHost()
			host.token = 42

			await hooks.execute(host)

			expect(a).toHaveBeenCalledOnceWith(host)
			expect(b).toHaveBeenCalledOnceWith(host)
		})

		it('runs all hooks even when one rejects (allSettled semantics)', async () => {
			const hooks = new HookSet<void>()
			const after = jasmine.createSpy('after')
			hooks.add(() => Promise.reject(new Error('first failed')))
			hooks.add(after)

			await expectAsync(hooks.execute()).toBeResolved()
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
			const sync = jasmine.createSpy('sync')
			hooks.add(sync)

			await hooks.execute()

			expect(sync).toHaveBeenCalledTimes(1)
		})
	})
})