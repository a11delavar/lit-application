JSON.tryParse = function (...parameters: Parameters<typeof JSON.parse>) {
	try {
		return [true, JSON.parse(...parameters)]
	} catch {
		return [false, undefined]
	}
}

declare global {
	interface JSON {
		tryParse(...parameters: Parameters<typeof JSON.parse>): [true, ReturnType<typeof JSON.parse>] | [false, undefined]
	}
}