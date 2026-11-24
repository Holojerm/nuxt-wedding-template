<script setup lang="ts">
import type { HouseholdView } from '../../../shared/utils/wedding-types'

// A print-ready sheet of every household's personal link as a QR code, to cut
// out and tuck into envelopes. `?link=rsvp` (default) or `?link=address`.
// `?link=letters` prints one card nine times instead: the same link for every
// guest, where they can write the couple a letter that opens later.
// Admin-only: the data comes from the same guarded endpoint as /manage.
definePageMeta({ layout: 'wedding', colorMode: 'light' })

const wedding = useWedding()
const url = useWeddingUrl()
useSeo({
  title: `QR sheet · ${wedding.title}`,
  titleMode: 'exact',
  description: 'Printable QR codes for each household.',
  noindex: true,
})

const route = useRoute()
const kind = computed(() =>
  route.query.link === 'address' ? 'address' : route.query.link === 'letters' ? 'letters' : 'rsvp',
)
const TITLE = { address: 'Address', rsvp: 'RSVP', letters: 'Letters' } as const
const CARDS_PER_SHEET = 9
const opens = computed(() =>
  wedding.letters?.opensOn
    ? new Date(`${wedding.letters.opensOn}T12:00:00Z`).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null,
)
const { data, error } = await useFetch<{ households: HouseholdView[] }>(
  url('/api/wedding/manage/households'),
  { server: false },
)
const origin = useRequestURL().origin
const link = (h: HouseholdView) => `${origin}${url(`/${kind.value}`)}?code=${h.inviteCode}`
const print = () => window.print()
</script>

<template>
  <section class="mx-auto max-w-(--ui-container) px-4 py-12 sm:px-6 print:p-0">
    <div class="mb-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div>
        <WeddingLabel text="For the couple" />
        <h1 class="mt-2 text-5xl text-highlighted">{{ TITLE[kind] }} QR sheet</h1>
      </div>
      <div class="flex gap-2">
        <UButton :to="url('/manage')" color="neutral" variant="ghost" icon="i-lucide-arrow-left"
          >Guest list</UButton
        >
        <UButton icon="i-lucide-printer" @click="print">Print</UButton>
      </div>
    </div>

    <p v-if="!data && !error" class="text-muted">Loading…</p>
    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      title="Unlock the guest list first"
      description="Open /manage, enter the admin token, then come back."
    />
    <UAlert
      v-else-if="kind === 'letters' && !wedding.letters"
      color="neutral"
      variant="subtle"
      title="No letters link is set"
      description="Add `letters.url` to this wedding's file to print these cards."
    />
    <ul
      v-else-if="kind === 'letters' && wedding.letters"
      class="grid grid-cols-2 gap-6 sm:grid-cols-3 print:grid-cols-3 print:gap-4"
    >
      <li
        v-for="card in CARDS_PER_SHEET"
        :key="card"
        class="flex break-inside-avoid flex-col items-center gap-2 border border-dashed border-default p-4 text-center"
      >
        <p class="wedding-display text-xl text-highlighted">{{ wedding.title }}</p>
        <p class="text-xs uppercase tracking-widest text-muted">Write us a letter</p>
        <div class="w-32">
          <WeddingQrCode :value="wedding.letters.url" label="Write us a letter" />
        </div>
        <p class="text-sm text-highlighted">
          {{ opens ? `We will open them on ${opens}.` : 'We will open them later.' }}
        </p>
      </li>
    </ul>
    <ul
      v-else-if="data"
      class="grid grid-cols-2 gap-6 sm:grid-cols-3 print:grid-cols-3 print:gap-4"
    >
      <li
        v-for="h in data.households"
        :key="h.id"
        class="flex break-inside-avoid flex-col items-center gap-2 border border-dashed border-default p-4 text-center"
      >
        <p class="wedding-display text-xl text-highlighted">{{ wedding.title }}</p>
        <p class="text-xs uppercase tracking-widest text-muted">
          {{ kind === 'address' ? 'Send us your address' : 'Kindly reply' }}
        </p>
        <div class="w-32">
          <WeddingQrCode :value="link(h)" :label="h.label" />
        </div>
        <p class="text-sm text-highlighted">{{ h.label }}</p>
        <p class="font-mono text-xs text-muted">{{ h.inviteCode }}</p>
      </li>
    </ul>
  </section>
</template>
