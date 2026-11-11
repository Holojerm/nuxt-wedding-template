<script setup lang="ts">
import type { WeddingConfig } from '../../../shared/utils/wedding-types'

// Day-of mode: on the wedding weekend the home page opens with today's events,
// the next one called out with where to go. Renders nothing on other days.
const props = defineProps<{ wedding: WeddingConfig; now: Date }>()

const state = computed(() => dayOf(props.wedding, props.now))
const time = (iso: string) => formatEventTime(iso, props.wedding.timeZone)
const mapsLink = (address: string) => `https://maps.google.com/?q=${encodeURIComponent(address)}`
</script>

<template>
  <section
    v-if="state?.today.length"
    aria-labelledby="today"
    class="border-b border-muted bg-muted"
  >
    <div class="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <WeddingLabel :text="formatEventDay(now.toISOString(), wedding.timeZone)" />
      <h2 id="today" class="mt-2 text-5xl text-highlighted">Today</h2>

      <div v-if="state.next" class="mt-6 border-l-2 border-primary bg-default px-6 py-5">
        <p class="text-sm uppercase tracking-widest text-primary">Next</p>
        <p class="wedding-display mt-1 text-4xl text-highlighted">{{ state.next.name }}</p>
        <p class="mt-1 text-lg">{{ time(state.next.startsAt) }} · {{ state.next.venue }}</p>
        <p v-if="state.next.dress" class="text-muted">Dress: {{ state.next.dress }}</p>
        <div class="mt-4">
          <UButton
            :to="mapsLink(`${state.next.venue}, ${state.next.address}`)"
            target="_blank"
            size="xl"
            icon="i-lucide-map-pin"
          >
            Directions
          </UButton>
        </div>
      </div>
      <p v-else class="mt-6 text-lg">
        That’s everything for today. Thank you for celebrating with us.
      </p>

      <ul v-if="state.today.length" class="mt-6 flex flex-col">
        <li
          v-for="e in state.today"
          :key="e.id"
          class="flex justify-between gap-4 border-b border-muted py-3"
          :class="e.id === state.next?.id ? 'text-highlighted' : 'text-muted'"
        >
          <span>{{ e.name }}</span>
          <span class="tabular-nums">{{ time(e.startsAt) }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>
