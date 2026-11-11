// Guests never sign in, so the whole /api/wedding/ surface skips the app's
// session gate. Each handler does its own check instead: requireWedding() for
// guest routes, requireWeddingAdmin() for /api/wedding/manage/.
export default defineNitroPlugin((nitro) => {
  registerPublicApiRoutes([{ path: '/api/wedding/', match: 'prefix' }])

  // Wedding sites are shared by link, not by search.
  nitro.hooks.hook('request', (event) => {
    if (resolveWedding(event)) setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  })
})
