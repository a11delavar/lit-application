import { type ModuleExport, ModuleExports } from './ModuleExports.ts'
import type { Package } from './Package.ts'

/** The address the demo is deployed to, the GitHub Pages site of the repository. */
export function siteUrl(p: Package) {
	const [, owner, repository] = new URL(p.repositoryUrl).pathname.split('/')
	return `https://${owner}.github.io/${repository}/`
}

/**
 * The README of a package, projected from its package.json and the JSDoc of what its entry exports: the first
 * sentence of each export describes it, and the `@example` sections become the usage. Nothing in it is written by hand.
 */
export class PackageReadme {
	static of(p: Package) {
		return new PackageReadme(p).toString()
	}

	/** The repository's README: every package with its version and downloads. */
	static root(packages: ReadonlyArray<Package>) {
		const style = 'for-the-badge'
		const { repositoryUrl } = packages[0]!
		const rows = sorted(packages).map(p => {
			const encoded = encodeURIComponent(p.name)
			const npm = `https://www.npmjs.com/package/${p.name}`
			return [
				`[${p.directoryName}](${p.relativePath})`,
				`[![](https://img.shields.io/badge/${encoded.replace(/-/g, '--')}-8A2BE2?style=${style}&logo=npm&logoColor=red&color=white)](${npm})`,
				`[![](https://img.shields.io/npm/v/${encoded}?style=${style}&label=)](${npm})`,
				`[![](https://img.shields.io/npm/dm/${encoded}?style=${style}&label=&color=blue)](${npm})`,
			]
		})
		return [
			'<div align="center">',
			'<h3>Lit Application</h3>',
			`[![Tests](https://img.shields.io/github/actions/workflow/status/${new URL(repositoryUrl).pathname.slice(1)}/development.yml?logo=github&style=${style}&label=Tests)](${repositoryUrl}/actions/workflows/development.yml)\n`
			+ `[![Demo](https://img.shields.io/badge/-Demo-324fff.svg?logo=lit&style=${style})](${siteUrl(packages[0]!)})`,
			table(['Module', 'Package', 'Version', 'Downloads'], rows),
			'</div>',
		].join('\n\n')
	}

	/**
	 * What a language model reads of the packages, by path on the site: every README as `docs/<Directory>.md`, "llms.txt"
	 * listing them as https://llmstxt.org describes, and "llms-full.txt" holding all of them.
	 */
	static llms(packages: ReadonlyArray<Package>, site: string) {
		const readmes = sorted(packages).map(p => ({ package: p, path: `docs/${p.directoryName}.md`, readme: PackageReadme.of(p) }))
		const shell = packages.find(p => p.name === '@a11d/lit-application')
		const header = [
			'# Lit Application',
			`> ${shell?.packageJson.description ?? ''}`,
			'Every package is published to npm under its own name and documented by its README: what it is for, how to install and use it, and what it exports.',
		]
		const llms = [
			...header,
			`[llms-full.txt](${site}llms-full.txt) holds every README in one file.`,
			'## Packages',
			readmes.map(({ package: p, path }) => `- [${p.name}](${site}${path}): ${p.packageJson.description}`).join('\n'),
		]
		const full = [
			...header,
			// Badges are pictures of numbers, which a language model cannot read:
			...readmes.map(({ readme }) => readme.split('\n').filter(line => !line.startsWith('[![')).join('\n').replace(/\n{3,}/g, '\n\n')),
		]
		return new Map([
			...readmes.map(({ path, readme }) => [path, readme] as const),
			['llms.txt', llms.join('\n\n')],
			['llms-full.txt', full.join('\n\n')],
		])
	}

	private readonly package: Package
	private readonly exports: ReadonlyArray<ModuleExport>

	private constructor(p: Package) {
		this.package = p
		this.exports = !p.entry ? [] : ModuleExports.of(p.entry)
	}

	toString() {
		const { name, description, license, author } = this.package.packageJson
		return [
			`# ${code(name)}`,
			description,
			`[![npm](https://img.shields.io/npm/v/${name}?style=flat-square&color=0077c8)](https://www.npmjs.com/package/${name})`,
			'## Installation',
			fence('sh', `npm install ${name}`),
			...this.usage,
			...this.api,
			'## Links',
			[
				`- [Changelog](https://unpkg.com/${name}/CHANGELOG.md)`,
				`- [Source](${this.package.repositoryUrl}/tree/main/${this.package.relativePath})`,
			].join('\n'),
			...!license ? [] : ['## License', `${license}${!author ? '' : ` © ${typeof author === 'string' ? author : author.name}`}`],
		].filter(Boolean).join('\n\n').replace(/\r\n?/g, '\n')
	}

	/** The `@example` sections of the exports, under the name of each where there are several. */
	private get usage() {
		const examples = this.exports.flatMap(entry => (entry.examples ?? []).map(example => [entry.name, markdown(example)] as const))
		return !examples.length ? [] : [
			'## Usage',
			...examples.flatMap(([name, example]) => examples.length === 1 ? [example] : [`### ${code(name)}`, example]),
		]
	}

	private get api() {
		// Undocumented types are mostly the options of what is listed anyway:
		const exports = this.exports
			.map(entry => ({ ...entry, summary: !entry.description ? '' : summary(entry.description) }))
			.filter(entry => !entry.typeOnly || entry.summary)
		return !exports.length ? [] : [
			'## API',
			table(['Name', 'Kind', 'Description?'], exports.map(entry => [code(entry.name), entry.kind, entry.summary])),
		]
	}
}

function sorted(packages: ReadonlyArray<Package>) {
	return [...packages].sort((a, b) => a.directoryName.localeCompare(b.directoryName, 'en', { sensitivity: 'base' }))
}

/** An `@example` as Markdown, fencing it as TypeScript unless it is fenced already. */
function markdown(example: string) {
	return /^(`{3,}|~{3,})/.test(example) ? example : fence('ts', example)
}

/** Resolves JSDoc's inline `{@link}` tags, which Markdown would print as they are. */
function links(text: string) {
	return text.replace(/\{@link(?:code|plain)?\s+([^\s|}]+)(?:\s*\|\s*|\s+)?([^}]*)\}/g, (_, target: string, label: string) => label.trim() || `\`${target}\``)
}

/** A text for one table cell. */
function inline(text: string) {
	return links(text).replace(/\s+/g, ' ').trim()
}

/** The first sentence of a text's first paragraph, which a text opening with a list does not have. */
function summary(text: string) {
	const paragraph = links(text.replace(/\r\n?/g, '\n')).split(/\n\s*\n|\n(?=\s*(?:[-*+]|\d+\.)\s)/)[0] ?? ''
	const flat = /^\s*(?:[-*+]|\d+\.)\s/.test(paragraph) ? '' : paragraph.replace(/\s+/g, ' ').trim()
	let code = false
	for (let index = 0; index < flat.length; index++) {
		const char = flat[index]!
		if (char === '`') {
			code = !code
		} else if (!code && '.!?'.includes(char) && (index === flat.length - 1 || flat[index + 1] === ' ' && !/[a-z]/.test(flat[index + 2] ?? ''))) {
			return inline(flat.slice(0, index + 1))
		}
	}
	return inline(flat.replace(/:$/, '.'))
}

function code(text: string) {
	const value = text.replace(/\s+/g, ' ').trim()
	const fence = '`'.repeat(Math.max(0, ...[...value.matchAll(/`+/g)].map(match => match[0].length)) + 1)
	return fence.length > 1 ? `${fence} ${value} ${fence}` : `${fence}${value}${fence}`
}

function fence(language: string, content: string) {
	const backticks = '`'.repeat(Math.max(2, ...[...content.matchAll(/`+/g)].map(match => match[0].length)) + 1)
	return `${backticks}${language}\n${content}\n${backticks}`
}

/** A table whose columns marked with a trailing `?` are left out when none of the rows has a value for them. */
function table(columns: ReadonlyArray<string>, rows: ReadonlyArray<ReadonlyArray<string>>) {
	if (!rows.length) {
		return ''
	}
	const kept = columns.map((column, index) => !column.endsWith('?') || rows.some(row => !!row[index])).map((keep, index) => keep ? index : -1).filter(index => index !== -1)
	const line = (cells: ReadonlyArray<string>) => `| ${cells.map(cell => cell.replace(/\|/g, '\\|')).join(' | ')} |`
	return [
		line(kept.map(index => columns[index]!.replace(/\?$/, ''))),
		line(kept.map(() => '---')),
		...rows.map(row => line(kept.map(index => row[index] ?? ''))),
	].join('\n')
}