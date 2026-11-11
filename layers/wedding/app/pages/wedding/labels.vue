<script setup lang="ts">
import type { HouseholdView } from '../../../shared/utils/wedding-types'

// Mailing labels on Avery 5160 (and its equivalents: 5260, 5960, 8160): 30 per
// letter sheet, 3 across and 10 down, 2.625in by 1in. Print at 100% ("actual
// size"), never "fit to page", or every label drifts. Admin-only data.
definePageMeta({ layout: 'wedding', colorMode: 'light' })

const wedding = useWedding()
useSeo({
  title: `Address labels · ${wedding.title}`,
  titleMode: 'exact',
  description: 'Printable Avery 5160 address labels.',
  noindex: true,
})

const { data, error } = await useFetch<{ households: HouseholdView[] }>(
  '/api/wedding/manage/households',
  { server: false },
)

// Domestic mail doesn't print the country; anything else keeps it.
const DOMESTIC = /^(us|usa|u\.s\.a?\.?|united states( of america)?)$/i
const PER_SHEET = 30

const labels = computed(() =>
  (data.value?.households ?? [])
    .filter((h) => h.mailingAddress)
    .map((h) => ({
      id: h.id,
      lines: [h.label, ...addressLines(h.mailingAddress)].filter(
        (line, i, all) => !(i === all.length - 1 && DOMESTIC.test(line.trim())),
      ),
    })),
)
const sheets = computed(() => {
  const out: (typeof labels.value)[] = []
  for (let i = 0; i < labels.value.length; i += PER_SHEET)
    out.push(labels.value.slice(i, i + PER_SHEET))
  return out
})
const missing = computed(() => (data.value?.households ?? []).filter((h) => !h.mailingAddress))
const print = () => window.print()
</script>

<template>
  <section class="mx-auto max-w-(--ui-container) px-4 py-12 sm:px-6 print:p-0">
    <div class="mb-8 flex flex-col gap-4 print:hidden">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <WeddingLabel text="For the couple" />
          <h1 class="mt-2 text-5xl text-highlighted">Address labels</h1>
        </div>
        <div class="flex gap-2">
          <UButton to="/manage" color="neutral" variant="ghost" icon="i-lucide-arrow-left"
            >Guest list</UButton
          >
          <UButton icon="i-lucide-printer" :disabled="!labels.length" @click="print">Print</UButton>
        </div>
      </div>
      <p class="text-muted">
        Avery 5160 or any 30-per-sheet equivalent (5260, 5960, 8160). In the print dialog choose
        <strong class="text-highlighted">actual size / 100%</strong>, no headers and footers. Try
        one sheet on plain paper first and hold it up to a label sheet against the light.
      </p>
      <UAlert
        v-if="missing.length"
        color="warning"
        variant="subtle"
        :title="`${missing.length} households have no address yet`"
        :description="missing.map((h) => h.label).join(', ')"
      />
    </div>

    <p v-if="!data && !error" class="text-muted">Loading…</p>
    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      title="Unlock the guest list first"
      description="Open /manage, enter the admin token, then come back."
    />
    <p v-else-if="!labels.length" class="text-muted">No mailing addresses collected yet.</p>

    <div
      class="wedding-labels flex flex-col gap-8 overflow-x-auto print:block print:overflow-visible"
    >
      <div
        v-for="(sheet, s) in sheets"
        :key="s"
        class="w-[8.5in] shrink-0 bg-default pb-[0.5in] pl-[0.1875in] pt-[0.5in] shadow-md print:w-auto print:break-after-page print:p-0 print:shadow-none"
      >
        <ul class="grid grid-cols-[repeat(3,2.625in)] auto-rows-[1in] gap-x-[0.125in]">
          <li
            v-for="label in sheet"
            :key="label.id"
            class="flex flex-col justify-center overflow-hidden rounded-sm px-[0.15in] text-xs leading-tight text-highlighted outline outline-1 outline-dashed outline-(--ui-border) print:outline-transparent"
          >
            <span v-for="(line, i) in label.lines" :key="i" class="truncate">{{ line }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
