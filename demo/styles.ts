import { css, html } from '@a11d/lit'

/** The look the demo's elements share, in their shadow roots and, for the light DOM of the application, in the document. */
export const styles = css`
	:host {
		display: block;
	}

	h2, h3 {
		margin: 0;
		font-weight: 600;
	}

	a {
		color: var(--demo-accent);
		text-decoration: none;
	}

	button {
		font: inherit;
		color: inherit;
		background: var(--demo-surface);
		border: 1px solid var(--demo-border);
		border-radius: 8px;
		padding: 6px 12px;
		cursor: pointer;

		&:hover:not(:disabled) {
			border-color: var(--demo-accent);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		&.primary {
			color: white;
			background: var(--demo-accent);
			border-color: transparent;
		}
	}

	input, select {
		font: inherit;
		color: inherit;
		background: var(--demo-background);
		border: 1px solid var(--demo-border);
		border-radius: 8px;
		padding: 6px 8px;
	}

	lit-dialog::part(dialog) {
		color: inherit;
		background: var(--demo-surface);
		border: 1px solid var(--demo-border);
		border-radius: 16px;
		padding: 24px;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.24);
	}

	code {
		font-family: ui-monospace, monospace;
		font-size: 0.85em;
	}

	.muted {
		color: var(--demo-muted);
	}

	.card {
		background: var(--demo-surface);
		border: 1px solid var(--demo-border);
		border-radius: 12px;
		padding: 16px;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}

	.form {
		display: grid;
		gap: 12px;
		min-width: min(320px, 80vw);

		label {
			display: grid;
			gap: 4px;
			font-size: 0.85em;
			color: var(--demo-muted);
		}
	}

	table {
		width: 100%;
		border-collapse: collapse;

		th, td {
			text-align: start;
			padding: 10px 12px;
			border-bottom: 1px solid var(--demo-border);
		}

		th {
			font-size: 0.85em;
			font-weight: 500;
			color: var(--demo-muted);
		}

		tbody tr:hover {
			background: var(--demo-hover);
		}
	}

	.chip {
		display: inline-block;
		padding: 4px 12px;
		border-radius: 999px;
		border: 1px solid var(--demo-border);
		color: inherit;
		text-transform: capitalize;

		&[data-router-selected] {
			color: white;
			background: var(--demo-accent);
			border-color: transparent;
		}
	}

	.status {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 6px;
		font-size: 0.85em;
		text-transform: capitalize;
		background: var(--demo-hover);

		&[data-status=open] { color: light-dark(#8a5a00, #f0b44c); }
		&[data-status=shipped] { color: light-dark(#1d7a3e, #6fd394); }
		&[data-status=cancelled] { color: var(--demo-muted); }
	}
`

/** What a task renders while it runs. */
export const loading = () => html`<p class='muted'>Loading…</p>`

/** A total as currency, and a date as the reader writes it. */
export const format = {
	total: (value: number) => value.toLocaleString(undefined, { style: 'currency', currency: 'EUR' }),
	date: (value: Date) => value.toLocaleDateString(undefined, { dateStyle: 'medium' }),
}