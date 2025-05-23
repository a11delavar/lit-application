// @ts-check
import * as FileSystem from 'fs'
import Path from 'path'
import { run } from './run.mjs'

export class Packages {
	/** @readonly */
	static directory = './packages'

	static getPackageJsonPaths() {
		return Packages.getPackageJsonPathsByDirectory(Packages.directory)
	}

	static getPackageJsonPathsByDirectory(directory) {
		const files = FileSystem.readdirSync(directory)
		return files.flatMap(file => {
			const fullPath = Path.resolve(directory, file)
			if (FileSystem.statSync(fullPath)?.isDirectory()) {
				return Packages.getPackageJsonPathsByDirectory(fullPath)
			}

			if (fullPath.endsWith('package.json') && !fullPath.includes('node_modules')) {
				return fullPath
			}
		}).filter(Boolean)
	}

	static getPath(packageName) {
		const p = Packages.getPackageJsonPaths().find(path => JSON.parse(FileSystem.readFileSync(path, 'utf8')).name === packageName)
		if (!p) {
			throw new Error(`Could not find package ${packageName}`)
		}
		return p
	}

	static getAllDirectories() {
		return Packages.getPackageJsonPaths().map(path => Path.dirname(path))
	}

	static getAllPackages() {
		return Packages.getPackageJsonPaths().map(p => {
			const content = JSON.parse(FileSystem.readFileSync(p, 'utf8'))
			return content.name
		})
	}

	static getDirectory(packageName) {
		const path = Packages.getPath(packageName)
		return Path.dirname(path)
	}

	static getContent(packageName) {
		const path = Packages.getPath(packageName)
		return JSON.parse(FileSystem.readFileSync(path, 'utf8'))
	}

	static async release(packageName, versionBumpType) {
		await run('npm run clean')
		const packageDirectory = Packages.getDirectory(packageName)
		await run('npm install', packageDirectory)
		await run('tsc', packageDirectory)
		if (versionBumpType.includes('--preid')) {
			throw new Error('Do not include the --preid flag in the version bump type. Use "prerelease" instead.')
		}
		const isPreRelease = versionBumpType.startsWith('pre')
		// eslint-disable-next-line no-console, no-undef
		console.log(await run(`npm version --loglevel=error ${versionBumpType.replace('prepatch', 'prerelease')} ${!isPreRelease ? '' : '--preid=preview'}`, packageDirectory))
		// eslint-disable-next-line no-console, no-undef
		console.log(await run(`npm publish --loglevel=error --access public ${!isPreRelease ? '' : '--tag preview'}`, packageDirectory))
		await run('npm run clean')
	}

	static async releaseAll() {
		const versionBumpType = 'patch'
		const packages = Packages.getAllPackages()
		for (const packageName of packages) {
			try {
				await Packages.release(packageName, versionBumpType)
			} catch (error) {
				// eslint-disable-next-line no-console, no-undef
				console.error(error)
			}
		}
	}
}