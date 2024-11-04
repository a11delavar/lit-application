import { Router } from './Router.js'
import { PageComponent } from '../Page/PageComponent.js'
import { route } from './route.js'
import { component } from '@a11d/lit'

@route('/page-with-numeric-id/:id')
@component('test-page-with-numeric-id')
class PageWithNumericId extends PageComponent<{ readonly id: number, readonly view?: 'details' | 'edit' }> { }

@route('/page-with-sub-route{/:subRoute}?')
@component('test-page-with-sub-route')
class PageWithSubRoute extends PageComponent<{ readonly subRoute?: string }> { }

@route('/page-with-non-route-parameter')
@component('test-page-with-non-route-parameter')
class PageWithNonRouteParameter extends PageComponent<{ readonly keyword: string }> { }

@component('test-page-without-route')
class PageWithoutRoute extends PageComponent { }

describe('Router', () => {
	describe('getPathOf', () => {
		it('should return the path that matches the given routable - PageWithNumericId', () => {
			const path = Router.getPathOf(new PageWithNumericId({ id: 1 }))
			expect(path).toBe('/page-with-numeric-id/1')
		})

		it('should return the path that matches the given routable - PageWithSubRoute', () => {
			const path = Router.getPathOf(new PageWithSubRoute({ subRoute: 'sub-route' }))
			expect(path).toBe('/page-with-sub-route/sub-route')

			const pathWithoutSubRoute = Router.getPathOf(new PageWithSubRoute({}))
			expect(pathWithoutSubRoute).toBe('/page-with-sub-route')
		})

		it('should put the parameters not part of the route in the query string', () => {
			expect(Router.getPathOf(new PageWithNonRouteParameter({ keyword: 'test' })))
				.toBe('/page-with-non-route-parameter?keyword=test')

			expect(Router.getPathOf(new PageWithNumericId({ id: 1, view: 'details' })))
				.toBe('/page-with-numeric-id/1?view=details')
		})

		it('should return undefined if the given routable does not match any route', () => {
			const path = Router.getPathOf(new PageWithoutRoute)
			expect(path).toBeUndefined()
		})
	})
})