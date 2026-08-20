
class Test<P> {
	declare readonly parameters: P  // ← anchors P to the instance shape

	static open<T extends Test<any>>(this: new () => T, params: T['parameters']) {
		params
	}
}
class SubText extends Test<{ id: number }> {}

SubText.open({ id: 1 })          // ✓
SubText.open({})                 // ✗ Property 'id' is missing
SubText.open({ id: 'x' })        // ✗ Type 'string' is not assignable to 'number'