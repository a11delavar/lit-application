import { copyFileSync } from 'fs'
import Path from 'path'
import { defineConfig, type Plugin } from 'vite'
import { aliases } from '../scripts/util/aliases.ts'
import { Package } from '../scripts/util/Package.ts'
import { PackageReadme, siteUrl } from '../scripts/util/PackageReadme.ts'

/** What a language model reads of the packages: written into the build, and rendered on request by the dev server. */
function llms(): Plugin {
	return {
		name: 'llms',
		configureServer(server) {
			server.middlewares.use((request, response, next) => {
				const path = request.url?.split('?')[0]?.slice(server.config.base.length) ?? ''
				const content = !/^(llms(-full)?\.txt|docs\/\w+\.md)$/.test(path) ? undefined
					: PackageReadme.llms(Package.all, `http://${request.headers.host}${server.config.base}`).get(path)
				if (content === undefined) {
					return next()
				}
				response.setHeader('Content-Type', `${path.endsWith('.md') ? 'text/markdown' : 'text/plain'}; charset=utf-8`)
				response.end(content)
			})
		},
		generateBundle() {
			for (const [fileName, source] of PackageReadme.llms(Package.all, siteUrl(Package.all[0]!))) {
				this.emitFile({ type: 'asset', fileName, source })
			}
		},
		writeBundle({ dir }) {
			// GitHub Pages answers a path it has no file for with "404.html", which lets the router render it.
			copyFileSync(Path.join(dir!, 'index.html'), Path.join(dir!, '404.html'))
		},
	}
}

/** Reloads the page after every edit, as a custom element cannot be defined twice, so a module defining one cannot be hot-replaced. */
function fullReload(): Plugin {
	return {
		name: 'full-reload',
		handleHotUpdate({ server }) {
			server.ws.send({ type: 'full-reload' })
			return []
		},
	}
}

export default defineConfig({
	resolve: { alias: aliases(Path.resolve(import.meta.dirname, '../packages')) },
	build: { target: 'es2022' },
	plugins: [llms(), fullReload()],
})