import { type Component } from '@a11d/lit'

export class HookSet<TComponent extends Component | void = void> extends Set<(component: TComponent) => void | PromiseLike<void>> {
	async execute(component: TComponent) {
		await Promise.allSettled([...this].map(hook => hook(component)))
	}
}