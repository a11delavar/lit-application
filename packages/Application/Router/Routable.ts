export type RoutableParameters = void | Record<string, string | number | undefined>

export enum NavigationStrategy { Page, Tab, Window }

export interface Routable<T extends RoutableParameters = any> extends HTMLElement {
	readonly parameters: T
	readonly heading: string
	navigate(strategy?: NavigationStrategy, force?: boolean): unknown
}

export type RoutableConstructor = Constructor<Routable>