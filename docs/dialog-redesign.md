# Dialog API Redesign

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

## Migration steps

1. **Add `DialogController`** in `@a11d/lit-application`. No existing code affected.
2. **Update `<lit-dialog>`** — install controller, add `primaryAction`/`secondaryAction`/`cancellationAction` properties + `confirm()` + `close` event. Keep deprecated `handleAction` for one release.
3. **Update `DialogComponent`** — delegate to controller via `dialogElement.confirm()`. Remove internal action dispatch, keyboard handlers, property-poking.
4. **Update `<mo-dialog>`** (in 3mo) — install controller, remove `handleAction` callback property.
5. **Remove `handleAction` from `Dialog` interface.** Internal breaking change only — affects `lit-dialog` and `mo-dialog` implementations (both owned). No user code changes.
