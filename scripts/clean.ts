import { Package } from './util/index.ts'
import { promises as FileSystem } from 'fs'
import Path from 'path'

await Promise.all(Package.all.map(p => FileSystem.rm(Path.join(p.path, 'dist'), { recursive: true, force: true })))