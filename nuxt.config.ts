// All product code is layers/wedding; this file only wires it to Cloudflare.
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxthub/core', '@nuxt/image'],
  css: ['~/assets/css/main.css'],

  hub: {
    db: 'sqlite',
    kv: true,
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
    },
  },

  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com; frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
      },
    },
  },

  // Photos ship as committed. On a custom domain with Image Transformations on
  // for its zone, switch the provider to 'cloudflare' and the edge will resize
  // and re-encode them per device (workers.dev can't).
  image: { provider: 'none' },

  nitro: { preset: 'cloudflare_module' },
  devtools: { enabled: false },
  compatibilityDate: '2025-09-01',
})
