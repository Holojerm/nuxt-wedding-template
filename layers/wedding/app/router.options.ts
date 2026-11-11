import type { RouterConfig } from '@nuxt/schema'

const WEDDING_PREFIX = /^\/wedding(?=\/|$)/

// One Worker, two route tables. On a wedding's hostname only the pages under
// app/pages/wedding/ exist, mounted at the root (/wedding/rsvp → /rsvp); on
// every other host those pages do not exist at all. `routes` runs inside the
// router plugin on both server and client, so the hostname is readable here.
export default {
  routes: (scanned) => {
    const wedding = useWeddingOrNull()
    if (!wedding) return scanned.filter((r) => !WEDDING_PREFIX.test(r.path))
    return scanned
      .filter((r) => WEDDING_PREFIX.test(r.path))
      .map((r) => ({ ...r, path: r.path.replace(WEDDING_PREFIX, '') || '/' }))
  },
} satisfies RouterConfig
