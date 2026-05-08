# Dialog (and Page) API Redesign

Status: **Agreed.** Independent of the router/parameters redesign (see `router-redesign.md`).

## Problem

Today `DialogComponent` puppeteers the dialog element via:
- `handleAction` callback poked in `firstUpdated`
- `executingAction` state pushed externally
- `poppable` / `boundToWindow` pushed externally
- `requestPopup` event subscription wired in `firstUpdated`
- Slot-fishing for action elements via symbol-query
- Keyboard handling (`Enter`/`Escape`) duplicated in every `DialogComponent`

This makes the dialog element (`<lit-dialog>`, `<mo-dialog>`) a dumb shell, and duplicates action-dispatch logic if you ever add a new implementation.

`PageComponent` has a much smaller version of the same problem: `firstUpdated` reaches into the page element to set `heading` from the `@label` decorator, and `pageElement` is found via symbol-query. No action logic, no controller needed — just apply the same "element is self-sufficient, framework wires only what it must" principle where it pays off.

## Design

### `DialogController` — shared reactive controller

Shipped from `@a11d/lit-application`. One implementation of action lifecycle logic, used by every dialog element.

```ts
export class DialogController implements ReactiveController {
    // State
    open = false
    executingAction?: DialogActionKey

    // Configuration (set by element properties or by DialogComponent)
    primaryAction?: () => DialogAction<unknown>
    secondaryAction?: () => DialogAction<unknown>
    cancellationAction?: () => DialogAction<unknown>
    errorHandler?: DialogErrorHandler
    manualClose?: boolean
    primaryOnEnter?: boolean
    preventCancellationOnEscape?: boolean

    constructor(host: ReactiveControllerHost & HTMLElement) { ... }

    // Core API
    confirm<T>(): Promise<T>     // sets open=true, returns promise
    close(result: unknown): void // sets open=false, resolves/rejects promise, dispatches 'close' event
    executeAction(key: DialogActionKey): Promise<void>  // the action lifecycle
}
```

**`executeAction` logic** (the 30 lines currently in `DialogComponent.handleAction`):
1. Look up action function by key.
2. Set `executingAction = key`.
3. `await action()`.
4. If resolved with value → `close(value)` (unless `manualClose && key !== 'cancellation'`).
5. If resolved with `Error` → `close(error)` (reject the promise).
6. If thrown → stay open, run `errorHandler`, re-throw.
7. Unset `executingAction`.

Keyboard handling (Enter → primary, Escape → cancellation) is scoped to the dialog's top-layer and lives in the controller.

### Dialog elements install the controller

`<lit-dialog>` and `<mo-dialog>` each instantiate `DialogController` once and expose its API as element-level properties:

```ts
@component('lit-dialog')
export class Dialog extends Component implements IDialog {
    readonly controller = new DialogController(this)

    // Element-specific (template/styling)
    @property() heading = ''

    // Forwarded to controller
    @property({ attribute: false }) set primaryAction(v) { this.controller.primaryAction = v }
    @property({ attribute: false }) set secondaryAction(v) { this.controller.secondaryAction = v }
    @property({ attribute: false }) set cancellationAction(v) { this.controller.cancellationAction = v }
    @property({ attribute: false }) set errorHandler(v) { this.controller.errorHandler = v }
    @property({ type: Boolean }) set primaryOnEnter(v) { this.controller.primaryOnEnter = v }
    @property({ type: Boolean }) set preventCancellationOnEscape(v) { this.controller.preventCancellationOnEscape = v }
    @property({ type: Boolean }) set manualClose(v) { this.controller.manualClose = v }

    get open() { return this.controller.open }
    set open(v) { this.controller.open = v }
    get executingAction() { return this.controller.executingAction }

    confirm<T>(): Promise<T> { return this.controller.confirm<T>() }

    // Slot clicks delegate to controller
    // html`<slot name='primaryAction' @click=${() => this.controller.executeAction('primary')}>`
}
```

`mo-dialog` does the same, adding its own template/styling/material concerns. The shared `DialogController` means neither implementation re-implements action logic.

### Updated `Dialog` interface

```ts
export interface Dialog extends Page {
    readonly controller: DialogController
    open: boolean
    heading: string
    primaryOnEnter?: boolean
    preventCancellationOnEscape?: boolean
    manualClose?: boolean
    errorHandler?: DialogErrorHandler
    primaryAction?: () => DialogAction<unknown>
    secondaryAction?: () => DialogAction<unknown>
    cancellationAction?: () => DialogAction<unknown>
    readonly executingAction?: DialogActionKey
    readonly primaryActionElement?: HTMLElement
    readonly secondaryActionElement?: HTMLElement
    readonly cancellationActionElement?: HTMLElement
    readonly topLayerElement: ApplicationTopLayer
    confirm<T>(): Promise<T>
}
```

**Removed:** `handleAction`, `requestPopup`, `poppable`, `boundToWindow`.

### `DialogComponent` simplification

Subclass author API: **unchanged.** Override `primaryAction()`/`secondaryAction()`/`cancellationAction()`, write a template starting with `<mo-dialog>`.

Internal implementation shrinks to:

```ts
export abstract class DialogComponent<T, TResult> extends RoutableComponent<T> {
    // Existing:
    @querySymbolizedElement(sym) readonly dialogElement!: Dialog & HTMLElement
    protected primaryAction(): DialogAction<TResult> { throw new Error('Not implemented') }
    protected secondaryAction(): DialogAction<TResult> { return this.cancellationAction() }
    protected cancellationAction(): DialogAction<TResult> { return new DialogCancelledError(this) }

    // New confirm — delegates to dialog element
    async confirm() {
        if (!this.isConnected) {
            (await DialogComponent.getHost()).appendChild(this)
        }
        this.dialogElement.primaryAction = () => this.primaryAction()
        this.dialogElement.secondaryAction = () => this.secondaryAction()
        this.dialogElement.cancellationAction = () => this.cancellationAction()
        return this.dialogElement.confirm<TResult>().finally(() => this.remove())
    }

    // Popup/pop/clone — unchanged
    // @route integration — unchanged
}
```

**Deleted:** `handleAction`, `handleError`, `_confirmationPromiseExecutor`, keyboard `@eventListener`s, `firstUpdated` property-poking block.

### Inline usage (new capability)

Both patterns use the same `DialogController` internally. The difference is whether the consumer calls `confirm()` to get a promise.

**Imperative — await a result:**
```ts
@query('mo-dialog') deleteDialog!: Dialog

protected get template() {
    return html`
        <mo-button @click=${this.handleDelete}>Delete</mo-button>
        <mo-dialog heading='Confirm deletion?'
            .primaryAction=${() => this.order.delete()}
        >
            Are you sure?
            <mo-loading-button slot='primaryAction'>Delete</mo-loading-button>
            <mo-loading-button slot='secondaryAction'>Cancel</mo-loading-button>
        </mo-dialog>
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
    <mo-dialog ?open=${this.showHelp} heading='Help'
        @close=${() => this.showHelp = false}
        .primaryAction=${() => {}}
    >
        Help content
        <button slot='primaryAction'>Got it</button>
    </mo-dialog>
`
```

The `close` event always fires when the dialog closes. `confirm()` is opt-in on top.

**No actions set at all:** controller is inert, slot clicks just dispatch `close`. User controls everything via `?open` and their own handlers. Plain web component behavior.

### Action semantics (preserved exactly)

| Action returns… | Behavior |
|---|---|
| Value `T` | Dialog closes, `confirm()` resolves with value |
| `Error` instance | Dialog closes, `confirm()` rejects with error |
| Throws | Dialog stays open, error handler runs |

This is the intentional API powering "order locked" scenarios and validation errors.

## Page — same principle, much smaller scope

Pages don't need a controller. There's no action dispatch, executing state, promise plumbing, or keyboard handling. Just `heading` and the `pageHeadingChange` event.

What changes for pages:

- **`<lit-page>` / `<mo-page>` stay self-sufficient.** Today's interface (`heading`, `pageHeadingChange`) is fine.
- **`PageComponent.firstUpdated` heading-poke** (`this.pageElement.heading ||= label.get(this.constructor)?.toString()`) — decide between:
  - **Option A (minimal):** keep the one-line poke. Not worth a controller for one line.
  - **Option B (consistent):** expose `defaultHeading` (sourced from the `@label` decorator) and have the page element read it. Cleaner architecturally but adds a mechanism for one fallback.

  Decide during implementation. Not worth blocking on now.
- **Symbol-query for `pageElement`** stays unless we replace it for dialogs. If we do, apply the same to `pageElement` for consistency.
- **`connectingHooks`** (auth gates, etc.) unchanged.

Inline pages are not a goal — pages don't usually live inside another component's template.

## Plan (phased)

### Phase 1 — `DialogController` foundation (this repo)

1. Add `DialogController` in `@a11d/lit-application`. No existing code affected.
2. Update `<lit-dialog>`: install controller; add `primaryAction`/`secondaryAction`/`cancellationAction` properties + `confirm()` + `close` event. Keep deprecated `handleAction` callback during deprecation window.
3. Update `DialogComponent`: delegate to `dialogElement.confirm()`. Remove internal action dispatch, keyboard handlers, `firstUpdated` property-poking.
4. Update tests to cover the new behavior (existing tests should continue to pass).

### Phase 2 — `<mo-dialog>` migration (3mo repo)

5. Install `DialogController` in `<mo-dialog>`. Remove externally-set `handleAction` callback property. Adapt `executingActionAdaptersByComponent` to react to controller's `executingAction` via Lit's reactive `updated()` cycle instead of externally-poked state.
6. Verify downstream (`StandardDialogs`, `GenericDialog`, ebusiness dialogs).

### Phase 3 — `Dialog` interface cleanup

7. Remove `handleAction`, `requestPopup`, `poppable`, `boundToWindow` from `Dialog` interface. Internal breaking change only — affects `lit-dialog` and `mo-dialog` implementations (both owned).

### Phase 4 — Page cleanup (small)

8. Resolve the `firstUpdated` heading-poke (Option A or B above).
9. If symbol-query was replaced for `dialogElement`, apply the same to `pageElement`.

## Migration impact

- **No user-code changes** in 3mo / ebusiness for the dialog refactor.
- `<lit-dialog>` and `<mo-dialog>` consumers using only the documented API (`primaryAction`/`secondaryAction`/`cancellationAction` overrides on `DialogComponent`) are unaffected.
- Custom `IDialog` implementations (rare — only `lit-dialog` and `mo-dialog` exist today) need to install `DialogController`.
- Pages need essentially no consumer migration.
