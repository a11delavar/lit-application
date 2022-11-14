// @ts-check
import { Arguments, Packages, run } from './util/index.mjs'

const packageName = Arguments.tryGet(0, 'No package provided')
const versionBumpType = Arguments.tryGet(1, 'No version bump type provided')

const packageDirectory = Packages.getDirectory(packageName)

// await run('npm run clean')
await run('npm install', Packages.getDirectory('@a11d/lit-application'))
await run('tsc', packageDirectory)
await run(`npm version ${versionBumpType}`, packageDirectory)
await run('npm publish --access public', packageDirectory)
await run('npm run clean')