// import { context } from 'esbuild'
import { createServer } from 'esbuild-server'
// import { TscWatchClient } from 'tsc-watch'
import { mkdirSync, rmSync, writeFileSync } from 'fs'
import open from 'open'

const directory = './out_serve'

// new TscWatchClient().start('--noEmit')

// (await context({
// 	bundle: true,
// 	outdir: './out_test',
// 	entryPoints: ['./test/index.ts'],
// })).watch()

rmSync(directory, { recursive: true, force: true })

mkdirSync(directory, { recursive: true })

writeFileSync(`${directory}/index.html`, `
	<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="X-UA-Compatible" content="IE=edge">
			<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
			<title>Demo</title>
			<script type="module" src="/index.js"></script>
		</head>

		<body>
			<demo-application></demo-application>
		</body>
	</html>
`)

const { url, start } = createServer({
	bundle: true,
	entryPoints: ['./demo/index.ts'],
	format: 'esm',
	outdir: directory,
	sourcemap: 'inline',
}, {
	static: directory,
	historyApiFallback: true,
	injectLiveReload: true,
})

await start()
open(url)