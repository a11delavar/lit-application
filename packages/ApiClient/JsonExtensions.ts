JSON.isJson = function (text: string) {
	try {
		JSON.parse(text)
		return true
	} catch (e) {
		return false
	}
}

declare global {
	interface JSON {
		isJson(text: string): boolean
	}
}