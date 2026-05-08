# Router / Parameters Redesign

Status: **Draft — needs more thought.** Independent of the dialog redesign (see `dialog-redesign.md`).

## Problem

`RoutableComponent` parameters come through the constructor and trigger URL writes on every mutation. This creates several issues:

1. **Inline parameterized routables are impossible** — the element is browser-constructed with no args; parameters can only arrive after construction.
2. **Every `parameters` change writes the URL** — no way to have display-only state in the bag without polluting the URL.
3. **No per-key reactivity** — changing one key replaces the whole bag; fine-grained reactions require manual diffing.
4. **No typed static shorthand** — `new DialogCustomer({...}).confirm()` is verbose; a typed `DialogCustomer.confirm({...})` would be cleaner.

## Constraints (things we cannot break)

- **The bag is canonical.** `routerLink`, navigation, cloning, and `urlMatches` all read from `this.parameters` as one object. This stays.
- **Constructor signature stays** `constructor(parameters: T)`. All call sites unchanged.
- **`this.parameters.x` access stays.** All subclass templates work without migration.
- **`T` generic preserved** on `RoutableComponent<T>` and `DialogComponent<T, R>`.
- **`routerLink` "template-object" pattern stays** — a constructed-but-unmounted instance carries its constructor ref + parameters bag + URL identity.
- **`urlMatches` semantics unchanged** (`'all'` / `'ignore-parameters'`).

## Design

### 1. `parameters` becomes `@property({ type: Object, hasChanged })`

```ts
@property({ type: Object, hasChanged }) parameters: T
```

- Enables inline use: `<eb-dialog-customer .parameters=${{ customerId: 42 }}>`.
- `hasChanged` (deep equality) prevents spurious rerenders — proven pattern from `FetchableDataGrid`.
- Constructor still assigns to `this.parameters`.

### 2. `parametersProperty` decorator (promoted from ebusiness)

Tunnels a class property to/from the bag. Already exists in `ebusiness/_shared/parametersProperty.ts`:

```ts
class DialogCustomer extends DialogComponent<{ customerId: number, view?: View }, Customer> {
    @parametersProperty('parameters') view?: View
    // this.view ↔ this.parameters.view — always in sync
}
```

Opt-in. Zero change required for subclasses that don't use it.

### 3. `routerParametersProperty` decorator (new)

`parametersProperty` + registers the key as URL-relevant:

```ts
class DialogCustomer extends DialogComponent<{ customerId: number, view?: View }, Customer> {
    @routerParametersProperty('parameters', { type: Number }) customerId!: number
    @parametersProperty('parameters') view?: View
}
```

- Changing `this.customerId` → URL updates.
- Changing `this.view` → no URL write.
- Metadata: `Constructor.urlPropertyKeys: Set<string>`.

### 4. Scoped URL writes in `RoutableComponent`

```ts
@property({
    type: Object,
    hasChanged,
    updated(this: RoutableComponent<T>, _new, oldParams) {
        if (!this.boundToWindow) return
        const urlKeys = (this.constructor as RoutableComponentConstructor).urlPropertyKeys
        if (urlKeys?.size) {
            const changed = [...urlKeys].some(k => this.parameters?.[k] !== oldParams?.[k])
            if (changed) this.updateUrl()
        } else {
            this.updateUrl()  // backward compat: no decorator → write on every change
        }
    }
}) parameters: T
```

### 5. Static instance-method mirrors

Typed via phantom anchor + `this`-typed static:

```ts
abstract class RoutableComponent<T> extends Component {
    declare readonly parameters: T  // phantom anchor for T['parameters'] access

    static navigate<C extends RoutableComponent<any>>(
        this: new (parameters: C['parameters']) => C,
        parameters: C['parameters'],
        strategy?: NavigationStrategy,
        force?: boolean
    ): Promise<unknown> {
        return new this(parameters).navigate(strategy, force)
    }
}

abstract class DialogComponent<T, R> extends RoutableComponent<T> {
    declare readonly __result: R  // phantom anchor for return type

    static confirm<C extends DialogComponent<any, any>>(
        this: new (parameters: C['parameters']) => C,
        parameters: C['parameters']
    ): Promise<C['__result']> {
        return new this(parameters).confirm()
    }
}

// Usage:
await DialogCustomer.confirm({ customerId: 42 })
PageOrders.navigate({})
```

Same verbs as instance methods. Fully typed (verified — the `this: new () => T` trick + phantom anchor works in TS 5.x).

## What is NOT changing

- `new X({...}).confirm()` / `new X({...}).navigate()` call sites
- `this.parameters.x` in subclass code
- Navigation.ts definitions (`new EB.PageX({...})`)
- `routerLink` directive logic
- `urlMatches` algorithm
- `StandardDialogParameters<T>` and friends

## Open questions

| Question | Notes |
|---|---|
| Decorator naming | `routerParametersProperty` is long. Candidates: `@urlProperty`, `@routeParam`, `@urlBound`. |
| Default bag key | `parametersProperty('parameters')` repeats the obvious. Default to `'parameters'`? |
| `T = void` handling | `Class.navigate()` with no args when `T = void` — verify ergonomics. |
| Reactive URL → instance | Should popstate update properties on an existing connected instance? Needed for inline dialogs staying open across URL changes. |
| Fine-grained match modes | `{ only: [...] }`, `{ exclude: [...] }` — deferred, separate feature, but metadata enables it. |
| `routerLink` + metadata | Eventually `routerLink` could use `urlPropertyKeys` for partial matching. Deferred. |
| **Rich-typed parameters (e.g. `DateTimeRange`)** | Today `RoutableParameters` only allows `string \| number \| undefined`. `DialogAccount.dateRange` couldn't be a parameter for this reason. The decorator should accept a `converter: { toAttribute, fromAttribute }` (same shape as Lit's `@property` converter) so rich types serialize at the URL boundary. Default converters for `Date` / `DateTime` / `DateTimeRange` / enums / arrays would cover most cases. The bag stores rich values; the URL stores strings; `urlMatches` keeps comparing strings as today. |
