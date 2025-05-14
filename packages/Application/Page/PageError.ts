import { component, css, html, type HTMLTemplateResult, staticHtml, style } from '@a11d/lit'
import { HttpError, HttpErrorCode } from '../index.js'
import { route } from '../Router/route.js'
import { PageComponent } from './PageComponent.js'

@component('lit-page-error')
@route('/error/:error')
export class PageError extends PageComponent<{ readonly error: HttpErrorCode, readonly message?: string }> {
	private static readonly emojisByErrorCodes = new Map<HttpErrorCode, string>([
		[HttpErrorCode.BadRequest, '😟'],
		[HttpErrorCode.Unauthorized, '⛔'],
		[HttpErrorCode.PaymentRequired, '🤑'],
		[HttpErrorCode.NotFound, '🧐'],
		[HttpErrorCode.Forbidden, '🔒'],
		[HttpErrorCode.MethodNotAllowed, '🚫'],
		[HttpErrorCode.NotAcceptable, '😵'],
		[HttpErrorCode.ProxyAuthenticationRequired, '🤐'],
		[HttpErrorCode.RequestTimeout, '⏲'],
		[HttpErrorCode.Conflict, '😵'],
		[HttpErrorCode.InternalServerError, '😥'],
		[HttpErrorCode.NotImplemented, '😳'],
		[HttpErrorCode.BadGateway, '🥴'],
		[HttpErrorCode.ServiceUnavailable, '😴'],
		[HttpErrorCode.GatewayTimeout, '⌚'],
		[HttpErrorCode.HttpVersionNotSupported, '🙄'],
		[HttpErrorCode.VariantAlsoNegotiates, '🤪'],
		[HttpErrorCode.InsufficientStorage, '💾'],
		[HttpErrorCode.LoopDetected, '➰'],
	])

	static override get styles() {
		return css`
			.code {
				font-size: 60px;
				font-weight: 400;
				text-align: center;
			}

			h1, h2 {
				text-align: center;
				margin: 0;
			}
		`
	}

	protected override get template() {
		return staticHtml`
			<${PageComponent.defaultPageElementTag} heading=${`Error ${this.parameters.error}`} fullHeight>
				<div ${style({ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' })}>
					<div class='code'>${this.errorTemplate}</div>
					<div ${style({ display: 'flex', gap: '4px', flexDirection: 'column' })}>
						<h1>${this.parameters.message ?? HttpError.defaultMessageByErrorCode.get(this.parameters.error) ?? 'Unknown Error'}</h1>
					</div>
				</div>
			</${PageComponent.defaultPageElementTag}>
		` as HTMLTemplateResult
	}

	private get errorTemplate() {
		const errorCode = String(this.parameters.error)
		const emoji = PageError.emojisByErrorCodes.get(this.parameters.error)
		return !emoji ? html`
			<span>${errorCode}</span>
		` : html`
			<span>${errorCode.charAt(0)}</span>${emoji}<span>${errorCode.charAt(2)}</span>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lit-page-error': PageError
	}
}