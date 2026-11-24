import type { RouterConfig } from '@nuxt/schema'

const WEDDING_PREFIX = /^\/wedding(?=\/|$)/

// One Worker, two route tables. When a wedding resolved, only the pages under
// app/pages/wedding/ exist, mounted at the root of its hostname (/wedding/rsvp
// → /rsvp) or under its path on a shared host (→ /<slug>/rsvp); otherwise those
// pages do not exist at all. `routes` runs inside the router plugin on both
// server and client, so the request is readable here.
export default {
  routes: (scanned) => {
    const wedding = useWeddingOrNull()
    if (!wedding) return scanned.filter((r) => !WEDDING_PREFIX.test(r.path))
    const base = useWeddingBase()
    return scanned
      .filter((r) => WEDDING_PREFIX.test(r.path))
      .map((r) => ({ ...r, path: `${base}${r.path.replace(WEDDING_PREFIX, '')}` || '/' }))
  },
} satisfies RouterConfig
