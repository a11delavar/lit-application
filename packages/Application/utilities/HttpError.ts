import { HttpErrorCode } from './HttpErrorCode.js'

export class HttpError extends Error {
	static readonly defaultMessageByErrorCode = new Map<HttpErrorCode, string>([
		[HttpErrorCode.BadRequest, 'Bad Request'],
		[HttpErrorCode.Unauthorized, 'Unauthorized'],
		[HttpErrorCode.PaymentRequired, 'Payment Required'],
		[HttpErrorCode.NotFound, 'Page Not Found'],
		[HttpErrorCode.Forbidden, 'Access Denied'],
		[HttpErrorCode.MethodNotAllowed, 'Method Not Allowed'],
		[HttpErrorCode.NotAcceptable, 'Not Accepted'],
		[HttpErrorCode.ProxyAuthenticationRequired, 'Proxy Authentication Required'],
		[HttpErrorCode.RequestTimeout, 'Request Timeout'],
		[HttpErrorCode.Conflict, 'Conflict'],
		[HttpErrorCode.Gone, 'Gone'],
		[HttpErrorCode.LengthRequired, 'Length Required'],
		[HttpErrorCode.PreconditionFailed, 'Precondition Failed'],
		[HttpErrorCode.RequestEntityTooLarge, 'Request Entity Too Large'],
		[HttpErrorCode.RequestUriTooLong, 'Request Uri Too Long'],
		[HttpErrorCode.UnsupportedMediaType, 'Unsupported Media Type'],
		[HttpErrorCode.RequestedRangeNotSatisfiable, 'Requested Range Not Satisfiable'],
		[HttpErrorCode.ExpectationFailed, 'Expectation Failed'],
		[HttpErrorCode.MisdirectedRequest, 'Misdirected Request'],
		[HttpErrorCode.UnprocessableEntity, 'Unprocessable Entity'],
		[HttpErrorCode.Locked, 'Locked'],
		[HttpErrorCode.FailedDependency, 'Failed Dependency'],
		[HttpErrorCode.UpgradeRequired, 'Upgrade Required'],
		[HttpErrorCode.PreconditionRequired, 'Precondition Required'],
		[HttpErrorCode.TooManyRequests, 'Too Many Requests'],
		[HttpErrorCode.RequestHeaderFieldsTooLarge, 'Request Header Fields TooLarge'],
		[HttpErrorCode.UnavailableForLegalReasons, 'Unavailable For Legal Reasons'],
		[HttpErrorCode.InternalServerError, 'Internal Server Error'],
		[HttpErrorCode.NotImplemented, 'Not Implemented'],
		[HttpErrorCode.BadGateway, 'Bad Gateway'],
		[HttpErrorCode.ServiceUnavailable, 'Service Unavailable'],
		[HttpErrorCode.GatewayTimeout, 'Gateway Timeout'],
		[HttpErrorCode.HttpVersionNotSupported, 'Http Version Not Supported'],
		[HttpErrorCode.VariantAlsoNegotiates, 'Variant Also Negotiates'],
		[HttpErrorCode.InsufficientStorage, 'Insufficient Storage'],
		[HttpErrorCode.LoopDetected, 'Loop Detected'],
		[HttpErrorCode.NotExtended, 'Not Extended'],
		[HttpErrorCode.NetworkAuthenticationRequired, 'Network Authentication Required'],
	])

	constructor(readonly statusCode: HttpErrorCode, message = HttpError.defaultMessageByErrorCode.get(statusCode)) {
		super(message)
	}
}