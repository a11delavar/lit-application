import { component, css, html, style } from '@a11d/lit'
import { application, Application, routerLink, PageHome, PageSettings } from './index.js'
import { RouteMatchMode } from '@a11d/lit-application'

@application()
@component('demo-application')
export class Demo extends Application {
	static override get styles() {
		return css`
			${super.styles}

			a[data-router-selected] {
				font-weight: bold;
				background-color: #eee;
			}
		`
	}

	protected override get bodyTemplate() {
		return html`
			${this.navbarTemplate}
			${super.bodyTemplate}
			${this.footerTemplate}
		`
	}

	private get navbarTemplate() {
		return html`
			<header>
				<nav ${style({ padding: '1em', background: 'rgba(128, 128, 128, 0.15)' })}>
					<a href='' ${routerLink({ page: new PageHome })}>Home</a>
					<a href='' ${routerLink({ page: new PageSettings, matchMode: RouteMatchMode.IgnoreParameters })}>Settings</a>
				</nav>
			</header>
		`
	}

	private get footerTemplate() {
		return html`
			<footer ${style({ padding: '1em', color: 'white', background: 'rgba(128, 128, 128, 0.15)' })}>
				<p>Footer</p>
			</footer>
		`
	}
}