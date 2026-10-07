import { type Component } from '@a11d/lit'

/** A set of hooks of a lifecycle stage, which `execute` runs together and awaits, even when some of them fail. */
export class HookSet<TComponent extends Component | void = void> extends Set<(component: TComponent) => void | PromiseLike<void>> {
	/** Runs every hook with the component, resolving once all of them have settled. */
	async execute(component: TComponent) {
		await Promise.allSettled([...this].map(hook => Promise.resolve(hook(component))))
	}
}
