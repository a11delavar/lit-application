# AGENTS.md

A guide for coding agents working in this repository: how it is organized, how to write and verify code here, and the traps that have already cost time. Read it before starting; the rules below are true of the code as it is.

## The repository

- An application shell for Lit and the packages it is made of, each published to npm under `@a11d/<name>`.
- `@a11d/lit-application` (`packages/Application`) is the shell: the `Application` element, pages, dialogs, notifications, routing and PWA helpers. `Native`, `Authentication` and `Authorization` plug into it.
- `Api`, `ApiDotnet`, `ApiJwt` and `ApiModelValueConstructor` build API clients; `Converter` and `Metadata` describe domain models; `LocalStorage`, `NonInertableComponent` and `RootCssInjector` are small utilities the shell uses.

| Stack | Notes |
| --- | --- |
| Lit through `@a11d/lit` | Import `Component`, `component`, `html`, `css`, `property`, `state`, `event`, `query`, `eventListener`, `Controller`, `bind` from `@a11d/lit`, never from `lit` directly. |
| TypeScript 6 and 7 side by side | `typescript` is 6.x, which typescript-eslint needs; the native compiler is the `typescript7` alias, run as `node ./node_modules/typescript7/bin/tsc`. Do not collapse the two. `experimentalDecorators` and `useDefineForClassFields: false` are required. |
| Vitest 5 browser mode on Playwright | Specs run in real Chromium and Firefox. |

## Repository map

| Path | What it is |
| --- | --- |
| `packages/<Name>/` | One npm package each, in a PascalCase directory. Source and `*.test.ts` specs sit side by side. |
| `packages/tsconfig.json` | Type-checks the specs (never emitted). |
| `demo/` | The demo: an order desk built on the shell, next to an inspector showing what the shell does, against a back end that answers in the browser (`server.ts`). Vite serves and builds it (`demo/vite.config.ts`), and `Demo.test.ts` walks it in CI. |
| `scripts/` | `bump.ts`, `release.ts`, `changelog.ts`, `readme.ts`, `peers.ts`, `clean.ts`, helpers in `util/`, among them `aliases.ts`, which both Vite configs resolve the packages with. Run by Node's type stripping and type-checked by `scripts/tsconfig.json`. |
| `vitest.config.ts` | The `chromium` and `firefox` instances over `packages/**/*.test.ts` and `demo/**/*.test.ts`; every `@a11d/*` package of the workspace resolves to its `index.ts`. |
| `.github/workflows/` | `qa.yml` runs `npm run typescript`, `npm run lint`, `npm run peers` and `npm test`; `pull-request.yml` runs it on every pull request; `development.yml` runs it on every push to `main`, then `npm run release`, and deploys the demo to GitHub Pages. |

Generated files, never edited by hand:

- `packages/*/README.md` and the root `README.md`: `npm run readme`. Committed, but projected from `package.json` and JSDoc; change those instead.
- `llms.txt`, `llms-full.txt` and `docs/<Directory>.md`, every README as a page: written into the demo's build, and rendered on request by its dev server. Never committed.
- `packages/*/CHANGELOG.md` and the root `CHANGELOG.md`: `npm run changelog`, from git history. Gitignored.
- `dist/` and `*.tsbuildinfo`: compiler output and incremental cache.

## Commands

| Command | Use |
| --- | --- |
| `npx vitest run --project chromium packages/<Name>/<File>.test.ts` | The spec you are writing. A path filter narrows to files; `-t '<name>'` to tests. |
| `npx vitest run --project chromium packages/<Name>` then `--project firefox` | A package, and the packages depending on it when the change reaches them. |
| `npm run dev` | Vitest watch mode, Chromium only. |
| `npm test` | Every spec in both browsers. Before handing over a branch. |
| `npm run typescript` | Three checks: `tsc --build --noEmit` over the packages and scripts, `tsc -p packages/tsconfig.json` over the specs, and `tsc -p demo/tsconfig.json` over the demo. |
| `npx eslint <files>` | Lint what you touched; `npm run lint` lints everything. |
| `npm run readme -- <@a11d/name or Directory>` | Regenerates those packages' READMEs, then the root README; no argument regenerates every README. |
| `npm run changelog` | Regenerates the changelogs. |
| `npm run bump -- <@a11d/name or Directory>... <patch\|minor\|major\|prerelease>` | Bumps the versions and regenerates those READMEs. `premajor`, `preminor` and `prepatch` work too; prereleases are `-preview.<n>`. |
| `npm run peers` | Fails when a package lists a package defining components under `dependencies` instead of `peerDependencies`; `-- --fix` moves them. Runs in CI. |
| `npm run release -- --dry-run` | Lists the versions a release would publish, in publish order, and the packages with changes their published version lacks. Reads npm and git only. |
| `npm start` | Serves the demo, reloading after every edit, with `/llms.txt` and `/docs/<Directory>.md`. |
| `npm run demo:build -- --base /<path>/` | Builds the demo into `demo/dist` for a site below that path. |

- Do not run `npm run release` without `--dry-run`; publishing belongs to CI.
- Phantom "has no exported member" errors, or errors naming shapes that no longer exist, mean a stale `dist`: TypeScript resolves a workspace package to its `dist/index.d.ts` whenever one exists, and to its `index.ts` otherwise. Run `npm run clean`, or `npm run build` to bring `dist` up to date.
- A fresh git worktree has no `node_modules`, so `@a11d/*` resolve to the main checkout's packages. Run `npm install` in the worktree before trusting any test or type-check. When linking by hand on Windows, use junctions, and never `Remove-Item -Recurse` a junction: it deletes through into the target.

## Packages

A package directory holds:

- `package.json`: `name` (`@a11d/<kebab-name>`), `version`, `description`, `repository` (`url` + `directory: packages/<Name>`), `bugs`, `keywords`, `author`, `license: "MIT"`, `homepage` (the package's directory on GitHub), `type: module`, `main: dist/index.js`, `types: dist/index.d.ts`, `files: ["dist", "CHANGELOG.md"]`, and no `scripts`.
- Dependencies: a package that defines components (`@a11d/lit`, `@a11d/lit-application`, `@a11d/lit-application-native`, `@a11d/non-inertable-component`) goes in `peerDependencies`, as an application must load one copy of each; npm installs peers next to the application. Every other library goes in `dependencies`, `tslib` included wherever the compiler emits helpers (decorators do). Ranges are `"x"` unless a floor is needed (`">=0.5.0"`). `@a11d/lit-testing` is a dev dependency of the packages whose specs use it.
- `description`: one sentence, at most 130 characters and without backticks, which npm prints as they are: "A utility for …", "Tools for …", "An extension of @a11d/api for …", then what sets it apart. It is the README's lead and npm's search snippet.
- `tsconfig.json`: extends `../../tsconfig.base.json`, `outDir: ./dist`, excludes `./dist` and `**/*.test.ts`.
- `index.ts`: `export * from './X.js'` per module (relative imports carry `.js`), plus bare imports of what must run for the package to work (`import 'reflect-metadata'`, `import '@a11d/equals'`).

A new package also needs a reference in the root `tsconfig.json`, `npm install` to link the workspace, `npm run readme -- <Directory>`, and its first publish by hand (see releases).

## Writing code

- JSDoc feeds the README: the first sentence of each export's JSDoc is its row in the API table, and the package's one `@example`, a fenced `ts` block, is its Usage. Document every exported value and the types a consumer writes against; one line per public member whose name does not say it. No narration, no history, no TODOs.
- The compiler starts a JSDoc tag at every `@` that opens a line or follows a space, fences or not, so some editors cut an example short at its first decorator or `@click`. `scripts/util/ModuleExports.ts` reads the comment's raw text instead; write examples as a consumer would, decorators included.
- Documentation never names specific human languages as examples.
- Guard browser-only work with `isServer` from `@a11d/lit`; do not touch `document`, `window` or `localStorage` at module scope or in constructors.
- The modules of `packages/Application` import each other in cycles (`PageError` extends `PageComponent`), which only initialize in order when entered through its `index.ts`. Import through the index, and keep new modules out of the cycle where you can.
- Prefer deleting machinery to adding it, and fix root causes in the base class over mitigations in subclasses.

### Code style

- Tabs, LF, a final newline in every file (`.editorconfig`, and `eol-last` in lint). Single quotes, no semicolons, `1tbs` braces, no `public` keyword, `import { type X }` for types, no `console`. Attribute values in templates use single quotes.
- Relative imports carry the `.js` extension.
- Scripts that rewrite files on Windows must keep LF and end every file with a newline.

## The demo

- It shows each feature once, the way an application uses it: parameters in the path and the query string, dialogs that resolve with a result or reject when cancelled, a dialog that pops out, notifications, sign-in before routing, an authorization guarding a page and one guarding an action, models constructed from the `@type` the back end sends, converters and labels.
- The inspector watches the shell from outside, through its hooks, its window events and wrappers around `DialogComponent.prototype.confirm` and `NotificationComponent.notify`; the application's own code logs nothing.
- `server.ts` answers `fetch` for `/api/`, keeps its orders in local storage so a popped-out dialog sees the same ones, and signs in any name with the password `demo`; `admin` holds every authorization.
- `RoutableComponent.basePath` follows Vite's base, so the demo works below a path of its site, and the build copies `index.html` to `404.html` so deep links load on GitHub Pages.
- A change to a feature the demo shows comes with the demo showing it.

## Specs

- Specs are `*.test.ts` next to the source, using Vitest globals (`describe`, `it`, `expect`, `vi`).
- Every spec file runs in isolation, so it imports everything it relies on. Where a package has side effects or cycles in its entry (`Application`, `Metadata`), import the module under test through the package's `index.js`, not its own file.
- One test file per class; top-level `describe` is the class name, then feature, then scenario, with behaviour-first `it('should …')` leaves.
- `new ComponentTestFixture<X>('tag')` from `@a11d/lit-testing`, scoped inside the `describe` it serves, so scenarios never share state. `await fixture.update()` or `fixture.updateComplete`.
- Hooks run in registration order (`sequence.hooks: 'list'`), mocks restore after each spec, the viewport is 1280×800.
- Vitest traps: a function returned from a hook is a teardown (`beforeEach(() => x = fn)` hands one back); `vi.spyOn` calls through, so add `.mockReturnValue(…)` to stub; `vi.fn(impl)` survives restores, `mockImplementation` does not; unhandled rejections fail the run.
- Headless Firefox raises no focus events for programmatic `focus()` while the document is unfocused: dispatch the `focusin` yourself.
- No vacuous assertions: `expect(templateResult).toBeDefined()` cannot fail; render the template and assert its content.

## Commits, changelogs and releases

- Conventional commits: `feat(Application): Add the dialog confirmation strategy`. The scope is the package's directory name, exactly; the subject is capitalized, code in backticks, `!` marks a breaking change. Types: `feat`, `fix`, `chore`, `refactor`, `perf`, `test`, `docs`, `infra`.
- A change to several packages is one commit whose subject has no scope and whose body has one line per package, each a conventional commit of its own (`fix(Native): …`), separated by blank lines.
- `scripts/changelog.ts` reads the first-parent history of `main` for commits that changed `packages/<Name>/package.json` and keeps their changes whose scope equals `<Name>`. A wrong scope, or a change that does not touch the package's `package.json`, means no changelog entry until the next bump, which collects every earlier commit since the last one. The changelog is generated, never committed; put release notes in the commit body.
- A version is bumped in the commit that makes the change, with `npm run bump`. A change a dependent needs bumps the dependent in the same push and raises its floor. `npm run bump` raises every workspace dependent of a prerelease to `">=<version>"`, as a prerelease satisfies no other range. Do not bump versions or raise floors unless asked.
- `npm run release` publishes what `main` holds: every package whose version npm does not have yet. It refuses anything but a clean checkout of `main` at `origin/main`, orders the packages by their dependencies and peer dependencies, builds them, writes their changelogs so the tarballs ship them, and publishes, prereleases under the `preview` tag. It commits, tags and creates nothing on GitHub, and a rerun skips what is already published. It warns about packages whose shipped files changed since their published version without a bump.
- Every push to `main` publishes through the `Release` job of `development.yml` with npm trusted publishing: npm trusts that workflow file in the GitHub environment `npm`, so there is no token. Each package has its own trust rule, which `npm trust` only accepts for a package already on npm. A new package is therefore published once by hand (`npm run release` from a clean `main`), then trusted with `npm trust github <@a11d/name> --file development.yml --repo <owner>/lit-application --env npm --allow-publish`. Renaming the workflow or the environment breaks every rule.

## Verification before calling work done

| Change | Checks |
| --- | --- |
| Package source | Its specs in Chromium, then Firefox; the specs of packages depending on it if the change reaches them; `npm run typescript`; eslint on the changed files. |
| Specs only | The affected spec files; `npm run typescript`. |
| JSDoc or `package.json` | `npm run readme -- <package>` and a look at the README. |
| Dependencies | `npm run peers`, and `npm install` so the lockfile follows. |
| Demo | `npx vitest run demo`, `npm run typescript`, and a look at it in `npm start`. |
| Before opening a pull request | `npm test` once. |

- Before diagnosing, establish which code is actually running: which files are live and what imports what. Reproduce the exact symptom, prove the fix, and revert speculative changes made while chasing the wrong cause.
- Keep diffs minimal and focused. Before removing a public member, search the repository for its consumers, and report every breaking removal: applications built on the shell reach far into it.