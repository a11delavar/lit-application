# Dialog (and Page) API Redesign

Status: **Phase 1 implemented on `routable-component-refactoring`.** Independent of the router/parameters redesign (see `router-redesign.md`).

## Problem

Today `DialogComponent` puppeteers the dialog element via:
- `handleAction` callback poked in `firstUpdated`
- `executingAction` state pushed externally
- `poppable` / `boundToWindow` pushed externally
- `requestPopup` event subscription wired in `firstUpdated`
- Slot-fishing for action elements via symbol-query
- Keyboard handling (`Enter`/`Escape`) duplicated in every `DialogComponent`
- Error-handler registry (`@DialogComponent.errorHandler('key')`) is owned by `DialogComponent`, so inline dialog elements can't use the same `errorHandler` API

This makes the dialog element (`<lit-dialog>`, `<mo-dialog>`) a dumb shell, duplicates action-dispatch logic if you ever add a new implementation, and forces the error-handler decorator to be `DialogComponent`-specific even though the policy is element-level.

`PageComponent` has a much smaller version of the same problem: `firstUpdated` reaches into the page element to set `heading` from the `@label` decorator, and `pageElement` is found via symbol-query. No action logic, no controller needed — just apply the same "element is self-sufficient, framework wires only what it must" principle where it pays off.

## Design

### `DialogController` — shared reactive controller

Shipped from `@a11d/lit-application`. One implementation of action lifecycle logic, used by every dialog element.

The controller owns **no** duplicated state. Every config and state field lives on the host; the controller reads/writes them directly. The only thing the controller keeps internal is the pending `confirm()` promise's resolve/reject pair.

```ts
export interface DialogControllerHost {
    addController(controller: ReactiveController): void
    removeController(controller: ReactiveController): void

    // Lifecycle state — written by the controller
    open: boolean
    executingAction?: DialogActionKey

    // Configuration — read by the controller
    primaryAction?: () => DialogControllerAction<unknown>
    secondaryAction?: () => DialogControllerAction<unknown>
    cancellationAction?: () => DialogControllerAction<unknown>
    errorHandler?: DialogErrorHandlerSetting
    manualClose?: boolean
    primaryOnEnter?: boolean
    preventCancellationOnEscape?: boolean

    // Dispatched when the dialog closes (resolved value or thrown Error in detail).
    readonly close: EventDispatcher<unknown>

    // Compared against `Application.topLayer` to scope keyboard short-cuts.
    readonly topLayerElement?: ApplicationTopLayer
}

export class DialogController<TResult = unknown> implements ReactiveController {
    constructor(host: DialogControllerHost) { /* host.addController(this) */ }

    confirm<T>(): Promise<T>          // sets host.open=true, returns promise
    close(result: TResult | Error)    // settles promise, dispatches host.close
    dismiss()                         // closes without settling
    executeAction(key: DialogActionKey): Promise<void>  // the action lifecycle
}
```

**Key design decisions:**

- **Host is the single source of truth.** No `controller.open` getter forwarding to internal state — the controller writes `host.open` directly. This keeps element templates straightforward (`?open=${this.open}`) and removes duplicated state.
- **No `HTMLElement` constraint.** Hosts only need to satisfy the structural contract above. This makes the controller testable with plain objects and frees future hosts (e.g. headless UI, server-side prerender shims) from inheriting from `LitElement`.
- **`close` is an `EventDispatcher`, not `HTMLElement.dispatchEvent`.** The host exposes a strongly-typed dispatcher; the controller calls `host.close.dispatch(result)` instead of constructing a `CustomEvent` and calling `dispatchEvent`. Lit elements that declare `@event() readonly close!: EventDispatcher<unknown>` get this for free.
- **Keyboard handling lives in the controller.** Enter → primary, Escape → cancellation. Scoped to the active `Application.topLayer`, so dialogs in lower layers don't fire on keydown when a child dialog is open.

**`executeAction` logic:**
1. Look up action function by key on the host.
2. Set `host.executingAction = key`.
3. `await action()`.
4. If resolved with value → `close(value)` (unless `host.manualClose && key !== 'cancellation'`).
5. If resolved with `Error` → `close(error)` (reject the promise).
6. If thrown → stay open, run error handler resolver, re-throw.
7. Clear `host.executingAction`.

### Dialog elements install the controller

`<lit-dialog>` (and `<mo-dialog>` in the future) instantiate `DialogController` once and declare matching `@property` / `@state` / `@event` fields. No wrapper getters/setters needed — the controller writes the fields, Lit reactivity handles re-renders.

```ts
@component('lit-dialog')
export class Dialog extends Component implements IDialog {
    readonly controller = new DialogController(this)

    @event() readonly close!: EventDispatcher<unknown>
    @event() readonly pageHeadingChange!: EventDispatcher<string>

    @property({ type: Boolean }) open = false
    @state() executingAction?: DialogActionKey

    @property() heading = ''
    @property({ type: Boolean }) manualClose?: boolean
    @property({ type: Boolean }) primaryOnEnter?: boolean
    @property({ type: Boolean }) preventCancellationOnEscape?: boolean
    @property() errorHandler?: DialogErrorHandlerSetting
    @property({ attribute: false }) primaryAction?: () => DialogControllerAction<unknown>
    @property({ attribute: false }) secondaryAction?: () => DialogControllerAction<unknown>
    @property({ attribute: false }) cancellationAction?: () => DialogControllerAction<unknown>

    confirm<T>() { return this.controller.confirm<T>() }

    // Slot clicks delegate to controller
    // html`<slot name='primaryAction' @click=${() => this.controller.executeAction('primary')}>`
}
```

### Updated `Dialog` interface

```ts
export interface Dialog extends Page {
    readonly controller: DialogController

    open: boolean
    executingAction?: DialogActionKey

    primaryAction?: () => DialogControllerAction<unknown>
    secondaryAction?: () => DialogControllerAction<unknown>
    cancellationAction?: () => DialogControllerAction<unknown>
    errorHandler?: DialogErrorHandlerSetting
    manualClose?: boolean
    primaryOnEnter?: boolean
    preventCancellationOnEscape?: boolean

    readonly close: EventDispatcher<unknown>
    readonly topLayerElement: ApplicationTopLayer

    readonly primaryActionElement: HTMLElement | undefined
    readonly secondaryActionElement: HTMLElement | undefined
    readonly cancellationActionElement: HTMLElement | undefined

    confirm<T>(): Promise<T>

    // Kept until `<mo-dialog>` migrates; see Phase 2/3.
    poppable?: boolean
    boundToWindow?: boolean
    readonly requestPopup?: EventDispatcher<void>
    /** @deprecated Forwards to `controller.executeAction`. */
    handleAction?: (key: DialogActionKey) => void | Promise<void>
}
```

### `dialogErrorHandler` — controller-owned error policy

The error-handler registry was moved from `DialogComponent` to its own module so any host (inline `<lit-dialog>`, `<mo-dialog>`, future custom elements) can use the same registry without depending on `DialogComponent`.

```ts
@dialogErrorHandler('notification', true)
export class NotificationErrorHandler extends DialogErrorHandler {
    override handle(error: Error) {
        return NotificationComponent.notifyError(error.message)
    }
}
```

The `DialogController` calls `resolveDialogErrorHandler(host.errorHandler, host)` at error-time. The resolver:
1. Returns `undefined` if no setting and no default registered.
2. Returns the function as-is if `host.errorHandler` is a function.
3. Looks up the constructor in the registry if a string — throws if the key is unknown.
4. Falls back to the registered default if `host.errorHandler` is `undefined` and a default was registered with `dialogErrorHandler('key', true)`.
5. Always short-circuits `DialogCancelledError` so cancellation paths never reach handlers.

**Breaking changes (intentional, low-impact):**
- `DialogComponentErrorHandler` class → `DialogErrorHandler`. Constructor takes `DialogControllerHost` instead of `DialogComponent`. (Only the no-op handler in this repo and the notification handler depend on this base; both already migrated.)
- `@DialogComponent.errorHandler('key')` → `@dialogErrorHandler('key')`.
- Global registry interface renamed `DialogComponentErrorHandlers` → `DialogErrorHandlers`.
- Unknown string keys now throw at error-time instead of being silently ignored.

### `DialogComponent` simplification

Subclass author API: **unchanged.** Override `primaryAction()`/`secondaryAction()`/`cancellationAction()`, write a template starting with `<lit-dialog>` / `<mo-dialog>`.

Internal implementation shrinks dramatically. **Deleted from `DialogComponent`:**
- `static errorHandler()`, `static errorHandlers`, `static defaultErrorHandler` — moved to `dialogErrorHandler` module.
- `DialogComponentErrorHandler` class — replaced by `DialogErrorHandler`.
- `handleError()` instance method, `_userErrorHandler` field — error policy now lives in the resolver.
- The `dialog.errorHandler = error => this.handleError(error)` wrapper line in `firstUpdated`.
- All keyboard `@eventListener`s and the `firstUpdated` keyboard wiring.

`firstUpdated` now just wires action functions plus the popup-related fields:

```ts
protected override firstUpdated(props: PropertyValues) {
    const dialog = this.dialogElement
    dialog.primaryAction = () => this.primaryAction()
    dialog.secondaryAction = () => this.secondaryAction()
    dialog.cancellationAction = () => this.cancellationAction()
    dialog.requestPopup?.subscribe(() => this.pop())
    dialog.poppable = this.poppable
    dialog.boundToWindow = this.boundToWindow
    dialog.heading ||= label.get(this.constructor as Constructor<this>)?.toString()
    super.firstUpdated(props)
}
```

`pop` / `close` / `confirmAsPopup` / `confirmAsDialog` / window-binding stay in `DialogComponent` — they depend on `RoutableComponent` concerns (`this.url`, `this.localName`, navigation strategies) that inline declarative dialogs don't have.

### Inline usage (new capability)

Both patterns use the same `DialogController` internally. The difference is whether the consumer calls `confirm()` to get a promise.

**Imperative — await a result:**
```ts
@query('lit-dialog') deleteDialog!: Dialog

protected get template() {
    return html`
        <button @click=${this.handleDelete}>Delete</button>
        <lit-dialog heading='Confirm deletion?'
            .primaryAction=${() => this.order.delete()}
        >
            Are you sure?
            <button slot='primaryAction'>Delete</button>
            <button slot='secondaryAction'>Cancel</button>
        </lit-dialog>
    `
}

private async handleDelete() {
    await this.deleteDialog.confirm()
    this.navigateAway()
}
```

**Declarative — controlled open/close:**
```ts
html`
    <lit-dialog ?open=${this.showHelp} heading='Help'
        @close=${() => this.showHelp = false}
        .primaryAction=${() => {}}
    >
        Help content
        <button slot='primaryAction'>Got it</button>
    </lit-dialog>
`
```

The `close` event always fires when the dialog closes. `confirm()` is opt-in on top.

**No actions set at all:** controller is inert, slot clicks dispatch no-action. User controls everything via `?open` and their own handlers. Plain web component behavior.

**Note on `pop()`:** popup/window-binding is intentionally NOT supported for inline dialogs. It depends on the dialog being a `RoutableComponent` (route, URL, separate window mounting) which inline templated dialogs don't have. This is a fundamental limitation of the popup feature, not a controller limitation.

### Action semantics (preserved exactly)

| Action returns… | Behavior |
|---|---|
| Value `T` | Dialog closes, `confirm()` resolves with value |
| `Error` instance | Dialog closes, `confirm()` rejects with error |
| Throws | Dialog stays open, error handler runs, throw re-propagates |
| `DialogCancelledError` thrown | Dialog stays open, error handler is **skipped**, throw re-propagates |

This is the intentional API powering "order locked" scenarios and validation errors.

## Page — same principle, much smaller scope

Pages don't need a controller. There's no action dispatch, executing state, promise plumbing, or keyboard handling. Just `heading` and the `pageHeadingChange` event.

What changes for pages:

- **`<lit-page>` / `<mo-page>` stay self-sufficient.** Today's interface (`heading`, `pageHeadingChange`) is fine.
- **`PageComponent.firstUpdated` heading-poke** (`this.pageElement.heading ||= label.get(this.constructor)?.toString()`) — decide between:
  - **Option A (minimal):** keep the one-line poke. Not worth a controller for one line.
  - **Option B (consistent):** expose `defaultHeading` (sourced from the `@label` decorator) and have the page element read it. Cleaner architecturally but adds a mechanism for one fallback.

  Decide during implementation. Not worth blocking on now. Note: the current `||=` has a known edge case where setting `heading=''` mid-load gets clobbered, characterized in `PageComponent.test.ts`.
- **Symbol-query for `pageElement`** stays unless we replace it for dialogs. If we do, apply the same to `pageElement` for consistency.
- **`connectingHooks`** (auth gates, etc.) unchanged.

Inline pages are not a goal — pages don't usually live inside another component's template.

## Testing strategy

The redesign comes with two complementary test files:

- **`DialogController.test.ts`** — pure-object tests against a `FakeHost` plain object. Covers the entire controller contract: `confirm`/`close`, sync & async action results, manualClose, dismiss, error handling (function, string-key registry, default handler skip on cancellation), and DOM-coupled keyboard handling (with `Application.topLayer` stubbed via `spyOnProperty`). 27 specs. **This is the source of truth for controller behavior** going forward.
- **`DialogComponent.test.ts`** — integration tests against a real `<test-dialog-fake>` element exercising the `DialogComponent` ↔ host element contract (action wiring in `firstUpdated`, default `cancellationAction`, `secondaryAction` falling back to `cancellationAction`). Some specs still overlap with `DialogController.test.ts`; they can be pruned in a follow-up commit once the migration is settled.

## Plan (phased)

### Phase 1 — `DialogController` foundation (this repo) ✅ DONE on `routable-component-refactoring`

1. ✅ Add `DialogController` in `@a11d/lit-application`.
2. ✅ Add `dialogErrorHandler` module (registry, decorator, resolver, base class).
3. ✅ Update `<lit-dialog>`: install controller; add `primaryAction`/`secondaryAction`/`cancellationAction` properties + `confirm()` + `close` event. Keep deprecated `handleAction` callback during deprecation window.
4. ✅ Update `DialogComponent`: delegate to `dialogElement.confirm()`. Remove internal action dispatch, keyboard handlers, error-handler registry, `firstUpdated` property-poking (kept only popup-related lines).
5. ✅ Pure-object `DialogController.test.ts` (27 specs).
6. ✅ Migrate `DialogComponentNoOpErrorHandler` and `DialogComponentNotificationErrorHandler` to the new base class + decorator.

### Phase 2 — `<mo-dialog>` migration (3mo repo)

7. Install `DialogController` in `<mo-dialog>`. Remove externally-set `handleAction` callback property. Adapt `executingActionAdaptersByComponent` to react to controller's `executingAction` via Lit's reactive `updated()` cycle instead of externally-poked state.
8. Verify downstream (`StandardDialogs`, `GenericDialog`, ebusiness dialogs).

### Phase 3 — `Dialog` interface cleanup

9. Remove `handleAction`, `requestPopup`, `poppable`, `boundToWindow` from `Dialog` interface. Internal breaking change only — affects `lit-dialog` and `mo-dialog` implementations (both owned).
10. Prune the overlapping specs in `DialogComponent.test.ts` once `DialogController.test.ts` is the proven single source of truth.

### Phase 4 — Page cleanup (small)

11. Resolve the `firstUpdated` heading-poke (Option A or B above).
12. If symbol-query was replaced for `dialogElement`, apply the same to `pageElement`.

## Migration impact

- **No user-code changes** in 3mo / ebusiness for the dialog refactor.
- `<lit-dialog>` and `<mo-dialog>` consumers using only the documented API (`primaryAction`/`secondaryAction`/`cancellationAction` overrides on `DialogComponent`) are unaffected.
- Custom `IDialog` implementations (rare — only `lit-dialog` and `mo-dialog` exist today) need to install `DialogController`.
- Custom error-handler subclasses (only the no-op and notification handlers in this repo) need to extend `DialogErrorHandler` instead of `DialogComponentErrorHandler` and use `@dialogErrorHandler` instead of `@DialogComponent.errorHandler`. Constructor signature change: receives the host element instead of the `DialogComponent`.
- Pages need essentially no consumer migration.
