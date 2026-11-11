import { fileURLToPath } from 'node:url'

// Wedding websites, one per couple, each on its own hostname. Self-contained:
// it imports nothing from other layers, so README.md › Vendoring can copy it
// into another repo whole. Design: DESIGN.md here. Product: SPEC.md here.
export default defineNuxtConfig({
  $meta: { name: 'wedding' },
  css: [fileURLToPath(new URL('./app/assets/css/wedding.css', import.meta.url))],
  runtimeConfig: {
    // Empty falls back to the host app's `resend` settings; with neither, the
    // engine sends no email and says so on /manage. README.md › Email.
    wedding: { emailApiKey: '', emailFrom: '' },
  },
})
