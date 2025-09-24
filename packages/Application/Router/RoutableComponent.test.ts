import { RoutableComponent, type UrlMatchMode } from './RoutableComponent.js'
import { route } from './route.js'
import { component } from '@a11d/lit'

@component('test-without-route')
class WithoutRoute extends RoutableComponent { }

@route('/')
@component('test-homepage')
class HomePage extends RoutableComponent { }

@route('/with-numeric-id/:id')
@component('test-with-numeric-id')
class WithNumericId extends RoutableComponent<{ readonly id: number, readonly view?: 'details' | 'edit' }> { }

@route('/with-sub-route{/:subRoute}?')
@component('test-with-sub-route')
class WithSubRoute extends RoutableComponent<{ readonly subRoute?: string }> { }

@route('/with-non-route-parameter')
@component('test-with-non-route-parameter')
class WithNonRouteParameter extends RoutableComponent<{ readonly keyword: string }> { }

@route('/catch-all/(.*)?')
@component('test-catch-all')
class WithCatchAll extends RoutableComponent { }

@route(WithCatchAll, '/catch-all/sub/route')
@component('test-sub-catch-all')
class SubCatchAll extends RoutableComponent { }

describe('RoutableComponent', () => {
	describe('routes', () => {
		it('should return the routes of the component', () => {
			expect(HomePage.routes).toEqual(['/'])
			expect(WithNumericId.routes).toEqual(['/with-numeric-id/:id'])
			expect(WithSubRoute.routes).toEqual(['/with-sub-route{/:subRoute}?'])
			expect(WithNonRouteParameter.routes).toEqual(['/with-non-route-parameter'])
			expect(WithCatchAll.routes).toEqual(['/catch-all/(.*)?'])
			expect(SubCatchAll.routes).toEqual(['/catch-all/sub/route'])
		})

		it('should return the routes of the component with base path', () => {
			RoutableComponent.basePath = '/base-path'
			expect(HomePage.routes).toEqual(['/base-path/'])
			expect(WithNumericId.routes).toEqual(['/base-path/with-numeric-id/:id'])
			expect(WithSubRoute.routes).toEqual(['/base-path/with-sub-route{/:subRoute}?'])
			expect(WithNonRouteParameter.routes).toEqual(['/base-path/with-non-route-parameter'])
			expect(WithCatchAll.routes).toEqual(['/base-path/catch-all/(.*)?'])
			expect(SubCatchAll.routes).toEqual(['/base-path/catch-all/sub/route'])
			RoutableComponent.basePath = ''
		})
	})

	describe('url', () => {
		it('should return undefined if the given routable does not match any route', () => {
			expect(new WithoutRoute().url).toBeUndefined()
		})

		it('should return the path that matches the given routable - PageWithNumericId', () => {
			expect(new HomePage().url!.path).toBe('/')
			expect(new WithNumericId({ id: 1 }).url!.path).toBe('/with-numeric-id/1')
			expect(new WithSubRoute({ subRoute: 'sub-route' }).url!.path).toBe('/with-sub-route/sub-route')
			expect(new WithSubRoute({}).url!.path).toBe('/with-sub-route')
			expect(new WithCatchAll().url!.path).toBe('/catch-all')
			expect(new SubCatchAll().url!.path).toBe('/catch-all/sub/route')
		})

		it('should put parameters part of the catch-all route in the path', () => {
			expect(new WithCatchAll({ '0': 'sub/route' } as any).url!.path).toBe('/catch-all/sub/route')
		})

		it('should put the parameters not part of the route in the query string', () => {
			expect(new WithNonRouteParameter({ keyword: 'test' }).url!.path).toBe('/with-non-route-parameter?keyword=test')
			expect(new WithNumericId({ id: 1, view: 'details' }).url!.path).toBe('/with-numeric-id/1?view=details')
		})

		it('should encode the parameters in the query string', () => {
			expect(new WithNonRouteParameter({ keyword: 'test test' }).url!.path).toBe('/with-non-route-parameter?keyword=test+test')
			expect(new WithNonRouteParameter({ keyword: 'test+test' }).url!.path).toBe('/with-non-route-parameter?keyword=test%2Btest')
			expect(new WithNonRouteParameter({ keyword: 'tést' }).url!.path).toBe('/with-non-route-parameter?keyword=t%C3%A9st')
		})
	})

	describe('urlMatches', () => {
		const url = (path: string) => new URL(path, globalThis.location.toString())

		describe('mode: all', () => {
			it('should return true when parameters absent', () => {
				expect(new HomePage().urlMatches({ url: url('/') })).toBe(true)
				expect(new WithSubRoute({}).urlMatches({ url: url('/with-sub-route') })).toBe(true)
			})

			it('should return true when parameters match', () => {
				expect(new WithNumericId({ id: 1 }).urlMatches({ url: url('/with-numeric-id/1') })).toBe(true)
				expect(new WithSubRoute({ subRoute: 'sub-route' }).urlMatches({ url: url('/with-sub-route/sub-route') })).toBe(true)
				expect(new WithNonRouteParameter({ keyword: 'test' }).urlMatches({ url: url('/with-non-route-parameter?keyword=test') })).toBe(true)
				expect(new WithNumericId({ id: 1, view: 'details' }).urlMatches({ url: url('/with-numeric-id/1?view=details') })).toBe(true)
			})

			it('should return false if the given routable does not match the route', () => {
				expect(new WithNumericId({ id: 1 }).urlMatches({ url: url('/with-numeric-id/2') })).toBe(false)
				expect(new WithSubRoute({ subRoute: 'sub-route' }).urlMatches({ url: url('/with-sub-route') })).toBe(false)
				expect(new WithSubRoute({}).urlMatches({ url: url('/with-sub-route/sub-route') })).toBe(false)
				expect(new WithNonRouteParameter({ keyword: 'test' }).urlMatches({ url: url('/with-non-route-parameter?keyword=other') })).toBe(false)
				expect(new WithNumericId({ id: 1, view: 'details' }).urlMatches({ url: url('/with-numeric-id/1?view=other') })).toBe(false)
			})
		})

		describe('mode: ignore-parameters', () => {
			const mode: UrlMatchMode = 'ignore-parameters'
			it('should return true if the given routable matches the route', () => {
				expect(new WithNumericId({ id: 1 }).urlMatches({ mode, url: url('/with-numeric-id/1') })).toBe(true)
				expect(new WithNumericId({ id: 1 }).urlMatches({ mode, url: url('/with-numeric-id/2') })).toBe(true)

				expect(new WithSubRoute({ subRoute: 'sub-route' }).urlMatches({ mode, url: url('/with-sub-route/sub-route') })).toBe(true)
				expect(new WithSubRoute({ subRoute: 'sub-route' }).urlMatches({ mode, url: url('/with-sub-route') })).toBe(true)

				expect(new WithSubRoute({}).urlMatches({ mode, url: url('/with-sub-route') })).toBe(true)
				expect(new WithSubRoute({}).urlMatches({ mode, url: url('/with-sub-route/sub-route') })).toBe(true)

				expect(new WithNonRouteParameter({ keyword: 'test' }).urlMatches({ mode, url: url('/with-non-route-parameter?keyword=test') })).toBe(true)
				expect(new WithNonRouteParameter({ keyword: 'test' }).urlMatches({ mode, url: url('/with-non-route-parameter?keyword=other') })).toBe(true)

				expect(new WithNumericId({ id: 1, view: 'details' }).urlMatches({ mode, url: url('/with-numeric-id/1?view=details') })).toBe(true)
				expect(new WithNumericId({ id: 1, view: 'details' }).urlMatches({ mode, url: url('/with-numeric-id/1?view=other') })).toBe(true)
			})

			it('should return false if the given routable does not match the route', () => {
				expect(new WithNumericId({ id: 1 }).urlMatches({ mode, url: url('/xx-with-numeric-id') })).toBe(false)
				expect(new WithSubRoute({ subRoute: 'sub-route' }).urlMatches({ mode, url: url('/xx-with-sub-route/sub-route') })).toBe(false)
				expect(new WithSubRoute({}).urlMatches({ mode, url: url('/xx-with-sub-route') })).toBe(false)
				expect(new WithSubRoute({}).urlMatches({ mode, url: url('/xx-with-sub-route/sub-route') })).toBe(false)
				expect(new WithNonRouteParameter({ keyword: 'test' }).urlMatches({ mode, url: url('/xx-with-non-route-parameter?keyword=test') })).toBe(false)
				expect(new WithNonRouteParameter({ keyword: 'test' }).urlMatches({ mode, url: url('/xx-with-non-route-parameter?keyword=other') })).toBe(false)
				expect(new WithNumericId({ id: 1, view: 'details' }).urlMatches({ mode, url: url('/xx-with-numeric-id/1?view=details') })).toBe(false)
			})
		})
	})
})