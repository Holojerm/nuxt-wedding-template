<script setup lang="ts">
import type { WeddingEvent } from '../../../shared/utils/wedding-types'

// An event as a gallery wall label: title, place, time, dress, note — the
// title/maker/date/medium/credit order of a museum placard. DESIGN.md › Motifs.
const props = defineProps<{ event: WeddingEvent; timeZone: string; number?: number }>()

const day = computed(() => formatEventDay(props.event.startsAt, props.timeZone))
const time = computed(
  () =>
    `${formatEventTime(props.event.startsAt, props.timeZone)} – ${formatEventTime(props.event.endsAt, props.timeZone)}`,
)
</script>

<template>
  <article class="border-l-2 border-primary bg-elevated px-6 py-5">
    <WeddingLabel :number="number" :text="day" />
    <h3 class="mt-2 text-3xl text-highlighted">{{ event.name }}</h3>
    <dl class="mt-3 grid gap-1 text-default">
      <div>
        <dt class="sr-only">Time</dt>
        <dd>{{ time }}</dd>
      </div>
      <div>
        <dt class="sr-only">Place</dt>
        <dd>
          {{ event.venue }}<span class="text-muted">, {{ event.address }}</span>
        </dd>
      </div>
      <div v-if="event.dress">
        <dt class="inline text-muted">Dress:</dt>
        <dd class="ml-1 inline">{{ event.dress }}</dd>
      </div>
    </dl>
    <p v-if="event.description" class="mt-3 italic text-toned">{{ event.description }}</p>
  </article>
</template>
