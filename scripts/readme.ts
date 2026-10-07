import { promises as FileSystem } from 'fs'
import { Package } from './util/index.ts'
import { PackageReadme } from './util/PackageReadme.ts'

// No arguments: every package's README. Package names: only those packages'. The root README always follows.
const names = process.argv.slice(2)
const packages = names.map(name => Package.all.find(p => p.name === name || p.directoryName === name) ?? unknown(name))

await Promise.all([
	...(names.length ? packages : Package.all).map(p => FileSystem.writeFile(`${p.path}/README.md`, `${PackageReadme.of(p)}\n`)),
	FileSystem.writeFile('README.md', `${PackageReadme.root(Package.all)}\n`),
])

function unknown(name: string): never {
	throw new Error(`There is no package "${name}"`)
}
