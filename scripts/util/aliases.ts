import { existsSync, readdirSync, readFileSync } from 'fs'
import Path from 'path'

/** Every package of the workspace by name, resolved to its source rather than to the build its `main` points at, which is absent until one runs. */
export function aliases(packagesPath: string) {
	return Object.fromEntries(readdirSync(packagesPath).flatMap(directory => {
		const manifest = Path.resolve(packagesPath, directory, 'package.json')
		const entry = Path.resolve(packagesPath, directory, 'index.ts')
		return !existsSync(manifest) || !existsSync(entry) ? [] : [[JSON.parse(readFileSync(manifest, 'utf8')).name as string, entry]]
	}))
}