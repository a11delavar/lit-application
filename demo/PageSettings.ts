import { component, html, nothing, style } from '@a11d/lit'
import { PageComponent, route, RouterController } from './index.js'

@component('demo-page-settings')
@route('/settings{/:subRoute}?')
export class PageSettings extends PageComponent<void | { readonly subRoute: string }> {
	private readonly router = new RouterController(this, [], {
		fallback: { render: () => nothing }
	})

	protected override get template() {
		return html`
			<lit-page heading='Settings'>
				<h1>Settings Page</h1>

				<div ${style({ display: 'flex' })}>
					<div>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
							velit nec nunc aliquet, nec ultricies nisl aliquet. Nulla facilisi.
							Phasellus euismod, nisl vitae aliquam lacinia, nisl nisl aliquet
							ligula, eget aliquam nisl nisl nec nunc. Nulla facilisi. Nulla
						</p>
					</div>
					${this.router.outlet()}
				</div>
			</lit-page>
		`
	}
}