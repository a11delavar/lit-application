# `@a11d/lit-application`

An application shell for Lit, with routed pages, dialogs that resolve with their result, notifications and PWA helpers.

[![npm](https://img.shields.io/npm/v/@a11d/lit-application?style=flat-square&color=0077c8)](https://www.npmjs.com/package/@a11d/lit-application)

## Installation

```sh
npm install @a11d/lit-application
```

## Usage

```ts
import { component, html } from '@a11d/lit'
import { application, Application, DialogComponent, PageComponent, route } from '@a11d/lit-application'
import '@a11d/lit-application-native'

@component('app-dialog-greeting')
export class DialogGreeting extends DialogComponent<{ readonly name: string }> {
	protected override get template() {
		return html`<lit-dialog heading='Greeting' primaryButtonText='OK'>Hello, ${this.parameters.name}!</lit-dialog>`
	}

	protected override primaryAction() { }
}

@component('app-page-home')
@route('/')
export class PageHome extends PageComponent {
	protected override get template() {
		return html`
			<lit-page heading='Home'>
				<button @click=${() => new DialogGreeting({ name: 'Ada' }).confirm()}>Greet</button>
			</lit-page>
		`
	}
}

@application()
@component('app-application')
export class App extends Application { }
```

## API

| Name | Kind | Description |
| --- | --- | --- |
| `HookSet` | class | A set of hooks of a lifecycle stage, which `execute` runs together and awaits, even when some of them fail. |
| `WindowHelper` | class | Opens locations of the application in new tabs or popup windows. |
| `HttpError` | class | An error of an HTTP status code, with the code's default message unless given another. |
| `RoutableComponent` | class |  |
| `RouterController` | class | The router rendering the component whose route matches the URL, extending the `Router` of `@lit-labs/router`. |
| `Application` | class | The base class of an application, which renders the page matching the URL and hosts dialogs and notifications in its top layer. |
| `ApplicationTopLayer` | class | The layer above the pages that hosts dialogs and notifications, rendered by the application and inside each dialog element. |
| `PageError` | class | The page showing an HTTP error, routed at `/error/:error` and rendered by the application when no route matches. |
| `PageHost` | class | The element hosting the current page, rendered by the application. |
| `PageComponent` | class | The base class of a page, rendered by the application when its route matches. |
| `DialogCancelledError` | class | The error the confirmation of a dialog rejects with when the dialog is cancelled. |
| `DialogComponentErrorHandler` | class | The base class of a handler for the errors thrown by dialog actions, registered with `DialogComponent.errorHandler()`. |
| `DialogComponent` | class | The base class of a dialog, opened by `confirm`, which resolves with the dialog's result once it closes. |
| `DialogComponentNoOpErrorHandler` | class | The `no-op` dialog error handler, which ignores errors. |
| `DialogComponentNotificationErrorHandler` | class | The default `notification` dialog error handler, which shows errors as error notifications. |
| `NotificationComponent` | class | The base class of the element showing notifications, whose static `notify` methods send them. |
| `PwaHelper` | class | Registers service workers, and prompts to install the application as a progressive web app. |
| `querySymbolizedElement` | function | Decorates a property to return the element in the render root whose class is marked with the symbol. |
| `queryInstanceElement` | function | Decorates a static property to return the first element in the document that is an instance of the class. |
| `WindowOpenMode` | enum | Whether `WindowHelper` opens a location in a new tab or in a popup window. |
| `HttpErrorCode` | enum | The HTTP status codes of client and server errors. |
| `Key` | enum | The values of `KeyboardEvent.key` for non-printable keys, such as `Enter`, `Escape` and `ArrowDown`. |
| `NavigationStrategy` | enum |  |
| `DialogConfirmationStrategy` | enum | Where a dialog opens: in place, or popped out into a new tab or window. |
| `DialogActionKey` | enum | The keys of the actions of a dialog. |
| `NotificationType` | enum | The kinds of notifications. |
| `routerLink` | const | Navigates to a routable component when the element is clicked, and marks the element `data-router-selected` while its URL matches. |
| `route` | const | Decorates a page or dialog with its routes, rendered by the application's router or, given a `host`, by the router of that component. |
| `application` | const | Appends an instance of the decorated `Application` subclass to the document body, unless one is already there. |
| `Page` | interface | The element a page component renders its content into, such as `lit-page`, marked with `PageComponent.pageElement()`. |
| `Dialog` | interface | The element a dialog component renders its content into, such as `lit-dialog`, marked with `DialogComponent.dialogElement()`. |
| `BeforeInstallPromptEvent` | interface | The `beforeinstallprompt` event, dispatched when the browser offers to install the application. |
| `PageParameters` | type | The parameters of a page, mapped to the path and query string of its URL. |
| `DialogParameters` | type | The parameters of a dialog, passed to its constructor and mapped to its URL if it has a route. |
| `DialogResult` | type | The outcome of a dialog action: the result resolving the confirmation, or an `Error` rejecting it. |
| `DialogAction` | type | What a dialog action returns: a `DialogResult`, or a promise of one. |
| `PopupConfirmationStrategy` | type | The confirmation strategies that pop a dialog out into a new tab or window. |
| `DialogErrorHandler` | type | The key of a registered error handler, or a function handling the errors thrown by the actions of a dialog. |
| `Notification` | type | A notification to show: its message, with an optional type and actions. |
| `Manifest` | type | The web app manifest of the application, as linked in the document's head. |
| `ManifestIcon` | type | An icon of the web app manifest. |

## Links

- [Changelog](https://unpkg.com/@a11d/lit-application/CHANGELOG.md)
- [Source](https://github.com/a11delavar/lit-application/tree/main/packages/Application)

## License

MIT © a11delavar