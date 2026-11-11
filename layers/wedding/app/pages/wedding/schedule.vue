<script setup lang="ts">
definePageMeta({ layout: 'wedding', colorMode: 'light' })

const wedding = useWedding()

useSeo({
  title: `Schedule · ${wedding.title}`,
  titleMode: 'exact',
  description: `The weekend's events for ${wedding.title}.`,
  noindex: true,
})

// Private events (a rehearsal dinner, a brunch) are absent here on purpose:
// this page is public. Invited guests see them on their RSVP.
const events = computed(() => wedding.events.filter((e) => e.isPublic))
</script>

<template>
  <section class="mx-auto max-w-2xl px-4 py-16 sm:px-6">
    <WeddingLabel text="The weekend" />
    <h1 class="mt-3 text-6xl text-highlighted">Schedule</h1>
    <p class="mt-4 text-lg text-toned">
      All times are local to {{ wedding.city }}. Invited to something not listed here? It will be on
      your RSVP.
    </p>
    <div class="mt-10 flex flex-col gap-6">
      <WeddingEventCard
        v-for="(event, i) in events"
        :key="event.id"
        :event="event"
        :number="i + 1"
        :time-zone="wedding.timeZone"
      />
    </div>
    <div class="mt-10 flex flex-wrap gap-3">
      <UButton to="/rsvp" size="lg">RSVP</UButton>
      <UButton
        to="/wedding.ics"
        external
        size="lg"
        color="neutral"
        variant="outline"
        icon="i-lucide-calendar-plus"
      >
        Add to calendar
      </UButton>
    </div>
  </section>
</template>
