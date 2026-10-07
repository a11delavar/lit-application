import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { resolve } from 'path'
import { aliases } from './scripts/util/aliases.ts'

export default defineConfig({
	resolve: { alias: aliases(resolve(import.meta.dirname, 'packages')) },
	test: {
		globals: true,
		include: ['packages/**/*.test.ts', 'demo/**/*.test.ts'],
		// A later beforeEach may rely on an earlier one having built its fixture, so hooks of the same kind run in the order they were registered rather than together.
		sequence: { hooks: 'list' },
		// Every spec gets its spies back the way it found them.
		restoreMocks: true,
		browser: {
			enabled: true,
			headless: true,
			// Vitest defaults to a 414px phone viewport, which puts every layout-dependent expectation on the wrong side of it.
			viewport: { width: 1280, height: 800 },
			provider: playwright(),
			// Named explicitly, as they would otherwise be "chromium (chromium)", and `npm run dev` selects "chromium".
			instances: [
				{ browser: 'chromium', name: 'chromium' },
				{ browser: 'firefox', name: 'firefox' },
			],
		},
	},
})
