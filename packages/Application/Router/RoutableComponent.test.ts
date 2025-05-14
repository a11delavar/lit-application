import { RoutableComponent, UrlMatchMode } from './RoutableComponent.js'
import { route } from './route.js'
import { component } from '@a11d/lit'

@route('/routable-with-numeric-id/:id')
@component('test-routable-with-numeric-id')
class WithNumericId extends RoutableComponent<{ readonly id: number | string, readonly view?: 'details' | 'edit' }> { }

@route('/routable-with-sub-route{/:subRoute}?')
@component('test-routable-with-sub-route')
class WithSubRoute extends RoutableComponent<{ readonly subRoute?: string }> { }

@route('/routable-with-non-route-parameter')
@component('test-routable-with-non-route-parameter')
class WithNonRouteParameter extends RoutableComponent<{ readonly keyword: string }> { }

@component('test-routable-without-route')
class WithoutRoute extends RoutableComponent { }

describe('RoutableComponent', () => {
	describe('routes', () => {
		it('should return the routes of the component', () => {
			expect(WithNumericId.routes).toEqual(['/routable-with-numeric-id/:id'])
			expect(WithSubRoute.routes).toEqual(['/routable-with-sub-route{/:subRoute}?'])
			expect(WithNonRouteParameter.routes).toEqual(['/routable-with-non-route-parameter'])
		})

		it('should return the routes of the component with base path', () => {
			RoutableComponent.basePath = '/base-path'
			expect(WithNumericId.routes).toEqual(['/base-path/routable-with-numeric-id/:id'])
			expect(WithSubRoute.routes).toEqual(['/base-path/routable-with-sub-route{/:subRoute}?'])
			expect(WithNonRouteParameter.routes).toEqual(['/base-path/routable-with-non-route-parameter'])
			RoutableComponent.basePath = ''
		})
	})

	describe('url', () => {
		it('should return undefined if the given routable does not match any route', () => {
			expect(new WithoutRoute().url).toBeUndefined()
		})

		it('should return the path that matches the given routable - PageWithNumericId', () => {
			expect(new WithNumericId({ id: '1' }).url!.path).toBe('/routable-with-numeric-id/1')
			expect(new WithSubRoute({ subRoute: 'sub-route' }).url!.path).toBe('/routable-with-sub-route/sub-route')
			expect(new WithSubRoute({}).url!.path).toBe('/routable-with-sub-route')
		})

		it('should put the parameters not part of the route in the query string', () => {
			expect(new WithNonRouteParameter({ keyword: 'test' }).url!.path).toBe('/routable-with-non-route-parameter?keyword=test')
			expect(new WithNumericId({ id: 1, view: 'details' }).url!.path).toBe('/routable-with-numeric-id/1?view=details')
		})
	})

	describe('urlMatches', () => {
		const url = (path: string) => new URL(path, globalThis.location.toString())

		describe('mode: all', () => {
			it('should return true when parameters absent', () => {
				expect(new WithSubRoute({}).urlMatches({ url: url('/routable-with-sub-route') })).toBe(true)
			})

			it('should return true when parameters match', () => {
				expect(new WithNumericId({ id: '1' }).urlMatches({ url: url('/routable-with-numeric-id/1') })).toBe(true)
				expect(new WithSubRoute({ subRoute: 'sub-route' }).urlMatches({ url: url('/routable-with-sub-route/sub-route') })).toBe(true)
				expect(new WithNonRouteParameter({ keyword: 'test' }).urlMatches({ url: url('/routable-with-non-route-parameter?keyword=test') })).toBe(true)
				expect(new WithNumericId({ id: '1', view: 'details' }).urlMatches({ url: url('/routable-with-numeric-id/1?view=details') })).toBe(true)
			})

			it('should return false if the given routable does not match the route', () => {
				expect(new WithNumericId({ id: 1 }).urlMatches({ url: url('/routable-with-numeric-id/2') })).toBe(false)
				expect(new WithSubRoute({ subRoute: 'sub-route' }).urlMatches({ url: url('/routable-with-sub-route') })).toBe(false)
				expect(new WithSubRoute({}).urlMatches({ url: url('/routable-with-sub-route/sub-route') })).toBe(false)
				expect(new WithNonRouteParameter({ keyword: 'test' }).urlMatches({ url: url('/routable-with-non-route-parameter?keyword=other') })).toBe(false)
				expect(new WithNumericId({ id: 1, view: 'details' }).urlMatches({ url: url('/routable-with-numeric-id/1?view=other') })).toBe(false)
			})
		})

		describe('mode: ignore-parameters', () => {
			const mode = UrlMatchMode.IgnoreParameters
			it('should return true if the given routable matches the route', () => {
				expect(new WithNumericId({ id: 1 }).urlMatches({ mode, url: url('/routable-with-numeric-id/1') })).toBe(true)
				expect(new WithNumericId({ id: 1 }).urlMatches({ mode, url: url('/routable-with-numeric-id/2') })).toBe(true)

				expect(new WithSubRoute({ subRoute: 'sub-route' }).urlMatches({ mode, url: url('/routable-with-sub-route/sub-route') })).toBe(true)
				expect(new WithSubRoute({ subRoute: 'sub-route' }).urlMatches({ mode, url: url('/routable-with-sub-route') })).toBe(true)

				expect(new WithSubRoute({}).urlMatches({ mode, url: url('/routable-with-sub-route') })).toBe(true)
				expect(new WithSubRoute({}).urlMatches({ mode, url: url('/routable-with-sub-route/sub-route') })).toBe(true)

				expect(new WithNonRouteParameter({ keyword: 'test' }).urlMatches({ mode, url: url('/routable-with-non-route-parameter?keyword=test') })).toBe(true)
				expect(new WithNonRouteParameter({ keyword: 'test' }).urlMatches({ mode, url: url('/routable-with-non-route-parameter?keyword=other') })).toBe(true)

				expect(new WithNumericId({ id: 1, view: 'details' }).urlMatches({ mode, url: url('/routable-with-numeric-id/1?view=details') })).toBe(true)
				expect(new WithNumericId({ id: 1, view: 'details' }).urlMatches({ mode, url: url('/routable-with-numeric-id/1?view=other') })).toBe(true)
			})

			it('should return false if the given routable does not match the route', () => {
				expect(new WithNumericId({ id: 1 }).urlMatches({ mode, url: url('/xx-routable-with-numeric-id') })).toBe(false)
				expect(new WithSubRoute({ subRoute: 'sub-route' }).urlMatches({ mode, url: url('/xx-routable-with-sub-route/sub-route') })).toBe(false)
				expect(new WithSubRoute({}).urlMatches({ mode, url: url('/xx-routable-with-sub-route') })).toBe(false)
				expect(new WithSubRoute({}).urlMatches({ mode, url: url('/xx-routable-with-sub-route/sub-route') })).toBe(false)
				expect(new WithNonRouteParameter({ keyword: 'test' }).urlMatches({ mode, url: url('/xx-routable-with-non-route-parameter?keyword=test') })).toBe(false)
				expect(new WithNonRouteParameter({ keyword: 'test' }).urlMatches({ mode, url: url('/xx-routable-with-non-route-parameter?keyword=other') })).toBe(false)
				expect(new WithNumericId({ id: 1, view: 'details' }).urlMatches({ mode, url: url('/xx-routable-with-numeric-id/1?view=details') })).toBe(false)
			})
		})
	})
})