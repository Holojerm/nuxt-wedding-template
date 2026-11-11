<script setup lang="ts">
definePageMeta({ layout: 'wedding', colorMode: 'light' })

const wedding = useWedding()

useSeo({
  title: `Travel · ${wedding.title}`,
  titleMode: 'exact',
  description: `Getting to the ${wedding.venue.name}, and where to stay.`,
  noindex: true,
})
</script>

<template>
  <section class="mx-auto max-w-2xl px-4 py-16 sm:px-6">
    <WeddingLabel :text="wedding.city" />
    <h1 class="mt-3 text-6xl text-highlighted">Travel</h1>
    <p class="mt-4 text-lg text-toned">{{ wedding.travel.intro }}</p>

    <div class="mt-8 border-l-2 border-primary bg-elevated px-6 py-5">
      <WeddingLabel text="The venue" />
      <h2 class="mt-2 text-3xl text-highlighted">{{ wedding.venue.name }}</h2>
      <p class="mt-2">{{ wedding.venue.address }}</p>
      <div class="mt-4 flex flex-wrap gap-3">
        <UButton :to="wedding.venue.mapsUrl" target="_blank" icon="i-lucide-map-pin">
          Open in Maps
        </UButton>
        <UButton
          v-if="wedding.venue.url"
          :to="wedding.venue.url"
          target="_blank"
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-external-link"
        >
          About the venue
        </UButton>
      </div>
    </div>

    <h2 class="mt-16 text-4xl text-highlighted">Getting there</h2>
    <ul class="mt-4 flex flex-col gap-3 text-lg">
      <li
        v-for="(line, i) in wedding.travel.gettingThere"
        :key="i"
        class="border-b border-muted pb-3"
      >
        {{ line }}
      </li>
    </ul>

    <h2 class="mt-16 text-4xl text-highlighted">Where to stay</h2>
    <ul class="mt-6 flex flex-col gap-6">
      <li v-for="hotel in wedding.travel.hotels" :key="hotel.name">
        <h3 class="text-2xl text-highlighted">{{ hotel.name }}</h3>
        <p class="text-muted">{{ hotel.address }}</p>
        <p v-if="hotel.note" class="mt-1">{{ hotel.note }}</p>
        <UButton
          v-if="hotel.url"
          :to="hotel.url"
          target="_blank"
          variant="link"
          trailing-icon="i-lucide-external-link"
          class="px-0"
        >
          Book a room
        </UButton>
      </li>
    </ul>
  </section>
</template>
