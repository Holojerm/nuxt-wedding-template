<script setup lang="ts">
// The shell for every wedding page: the couple's theme on <html>, a quiet
// header with RSVP always one tap away, and a draft ribbon while the config
// still holds placeholder copy.
const wedding = useWedding()

useHead({
  htmlAttrs: { 'data-wedding-theme': wedding.theme, lang: 'en' },
})

// The link preview a guest sees when the site is texted to them. Pages call
// the host app's useSeo(), which brands og:* with the app; these win over it.
// Cropped to 1200x630 at the edge (needs Image Transformations on the zone).
const origin = useRequestURL().origin
const shareSrc = wedding.shareImage ?? wedding.photos[0]?.src
const shareImage = shareSrc
  ? `${origin}/cdn-cgi/image/width=1200,height=630,fit=cover,format=jpeg,quality=85${shareSrc}`
  : undefined
useSeoMeta(
  {
    ogSiteName: wedding.title,
    ogUrl: `${origin}${useRoute().path}`,
    ogImage: shareImage,
    ogImageWidth: shareImage ? 1200 : undefined,
    ogImageHeight: shareImage ? 630 : undefined,
    ogImageAlt: shareImage ? `${wedding.title} at the ${wedding.venue.name}` : undefined,
    twitterImage: shareImage,
  },
  { tagPriority: 'high' },
)

const links = [
  { label: 'Schedule', to: '/schedule' },
  { label: 'Travel', to: '/travel' },
  ...(wedding.guide ? [{ label: 'Nearby', to: '/guide' }] : []),
  { label: 'Registry', to: '/registry' },
  { label: 'FAQ', to: '/faq' },
]

const menuOpen = ref(false)
const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

const dateLine = computed(() => (wedding.date ? formatPlainDate(wedding.date) : 'Date to come'))
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-default text-default">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-elevated focus:px-4 focus:py-2 focus:text-highlighted focus:ring-2 focus:ring-primary"
    >
      Skip to content
    </a>

    <p
      v-if="wedding.placeholders.length"
      class="bg-inverted px-4 py-2 text-center text-xs uppercase tracking-widest text-inverted print:hidden"
    >
      Draft · some details below are placeholders
    </p>

    <header class="border-b border-muted print:hidden">
      <div
        class="mx-auto flex max-w-(--ui-container) items-center justify-between gap-4 px-4 py-4 sm:px-6"
      >
        <NuxtLink
          to="/"
          class="wedding-display rounded-sm text-2xl text-highlighted focus-visible:ring-2 focus-visible:ring-primary"
        >
          {{ wedding.title }}
        </NuxtLink>

        <nav aria-label="Wedding" class="hidden items-center gap-6 md:flex">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="rounded-sm text-sm uppercase tracking-widest text-muted hover:text-highlighted focus-visible:ring-2 focus-visible:ring-primary"
            active-class="text-highlighted"
          >
            {{ link.label }}
          </NuxtLink>
          <UButton to="/rsvp" size="md">RSVP</UButton>
        </nav>

        <div class="flex items-center gap-2 md:hidden">
          <UButton to="/rsvp" size="md">RSVP</UButton>
          <USlideover v-model:open="menuOpen" title="Menu" side="right">
            <UButton
              icon="i-lucide-menu"
              color="neutral"
              variant="ghost"
              size="lg"
              class="min-touch"
              aria-label="Open menu"
            />
            <template #body>
              <nav aria-label="Wedding" class="flex flex-col gap-2">
                <NuxtLink
                  v-for="link in [
                    { label: 'Home', to: '/' },
                    ...links,
                    { label: 'RSVP', to: '/rsvp' },
                  ]"
                  :key="link.to"
                  :to="link.to"
                  class="wedding-display rounded-sm py-2 text-3xl text-highlighted focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {{ link.label }}
                </NuxtLink>
              </nav>
            </template>
          </USlideover>
        </div>
      </div>
    </header>

    <main id="main" class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-muted print:hidden">
      <div
        class="mx-auto flex max-w-(--ui-container) flex-col items-center gap-2 px-4 py-12 text-center sm:px-6"
      >
        <p class="wedding-display text-3xl text-highlighted">{{ wedding.title }}</p>
        <p class="text-sm uppercase tracking-widest text-muted">
          {{ dateLine }} · {{ wedding.venue.name }}
        </p>
        <p class="text-sm text-muted">
          Questions?
          <a
            :href="`mailto:${wedding.rsvp.contactEmail}`"
            class="rounded-sm underline underline-offset-4 hover:text-highlighted focus-visible:ring-2 focus-visible:ring-primary"
            >{{ wedding.rsvp.contactEmail }}</a
          >
        </p>
      </div>
    </footer>
  </div>
</template>
