export type Manifest = {
	readonly name: string
	readonly short_name: string
	readonly description: string
	readonly start_url: string
	readonly display: string
	readonly display_override?: Array<string>
	readonly background_color: string
	readonly theme_color: string
	readonly icons: Array<ManifestIcon>
}

export type ManifestIcon = {
	readonly src: string
	readonly sizes: string
	readonly type: string
}