import { component, css, html, style } from '@a11d/lit'
import { Task } from '@lit/task'
import { Api } from '@a11d/api'
import { PageComponent, route } from '@a11d/lit-application'
import { requiresAuthorization } from '@a11d/lit-application-authorization'
import { label } from '@a11d/metadata'
import { format, loading, styles } from './styles.js'

type Report = ReadonlyArray<{ readonly status: string, readonly count: number, readonly totalCents: number }>

/** Revenue by status, open only to accounts granted "reports.read"; without it, the page is an error. */
@component('demo-page-reports')
@route('/reports')
@label('Reports')
@requiresAuthorization(['reports.read'])
export class PageReports extends PageComponent {
	static override get styles() {
		return css`
			${styles}

			.bars {
				display: grid;
				grid-template-columns: max-content 1fr max-content;
				align-items: center;
				gap: 12px 16px;
			}

			.bar {
				height: 12px;
				border-radius: 6px;
				background: var(--demo-accent);
			}
		`
	}

	private readonly report = new Task(this, {
		task: () => Api.get<Report>('/reports'),
		args: () => [],
	})

	protected override get template() {
		return html`
			<lit-page>
				<div class='card'>
					${this.report.render({ pending: loading, complete: report => this.barsTemplate(report) })}
				</div>
			</lit-page>
		`
	}

	private barsTemplate(report: Report) {
		const highest = Math.max(1, ...report.map(line => line.totalCents))
		return html`
			<div class='bars'>
				${report.map(line => html`
					<span class='status' data-status=${line.status}>${line.status} · ${line.count}</span>
					<div class='bar' ${style({ width: `${line.totalCents / highest * 100}%` })}></div>
					<span>${format.total(line.totalCents / 100)}</span>
				`)}
			</div>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'demo-page-reports': PageReports
	}
}
